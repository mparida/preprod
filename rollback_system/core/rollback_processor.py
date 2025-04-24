from typing import List, Dict, Optional
from pathlib import Path
from rollback_system.core.models.rollback_models import RollbackResult, FileAnalysisResult
from rollback_system.services.git_service import GitService
from rollback_system.services.conflict_service import ConflictService
from rollback_system.services.validation_service import ValidationService
from rollback_system.core.file_handlers import get_handler_for_file
from rollback_system.utils.logger import logger


class RollbackProcessor:
    def __init__(self, repo_path: str = None):
        self.git_service = GitService(repo_path)
        self.conflict_service = ConflictService()
        self.validation_service = ValidationService()
        self.repo = self.git_service.repo  # Add this line to expose the repo
        self.git_service.verify_repository()
        
    def rollback_features(self, release_branch: str, features: List[str], dry_run: bool = False):
        result = RollbackResult(  # Initialize result first
            success=False,
            rolled_back_files=[],
            conflicts=[],
            warnings=[],
            dry_run=dry_run
        )
        
        try:
            # Validate inputs
            if not self._validate_inputs(release_branch, features, result):
                return result
                
            # Create backup branch
            if not dry_run and not self._create_backup(release_branch, result):
                return result
                
            # Get all changes from features
            feature_changes = self._get_all_feature_changes(release_branch, features)
            
            # Process each file
            for file_path, changes in feature_changes.items():
                file_result = self._process_file_rollback(file_path, changes, release_branch, features)
                result.rolled_back_files.append(file_result)
                
                if file_result.conflicts:
                    result.conflicts.extend(file_result.conflicts)
                    
            # Determine overall success
            result.success = len(result.conflicts) == 0
            
            # Post-rollback validation
            if not dry_run and result.success:
                self._post_rollback_validation(result)

            result.success = True
            return result
            
        except Exception as e:
            logger.error(f"Critical rollback error: {str(e)}")
            result.conflicts.append(f"Critical error: {str(e)}")
            result.success = False
            return result
            
    def _validate_inputs(self, release_branch: str, features: List[str], result: RollbackResult):
        try:
            available_branches = self.git_service.get_all_branches()
            if release_branch not in available_branches:
                result.conflicts.append(
                    f"Branch '{release_branch}' not found.\n"
                    f"Available branches: {sorted(set(available_branches))}"
                )
                return False
            return True
        except Exception as e:
            result.conflicts.append(f"Branch validation failed: {str(e)}")
            return False
        
    def _create_backup(self, release_branch: str, result: RollbackResult) -> bool:
        backup_name = f"{release_branch}_backup_pre_rollback"
        if not self.git_service.create_backup_branch(release_branch, backup_name):
            result.conflicts.append("Failed to create backup branch")
            return False
        result.warnings.append(f"Created backup branch: {backup_name}")
        return True
        
    def _get_all_feature_changes(self, release_branch: str, features: List[str]) -> Dict:
        all_changes = {}
        
        for feature in features:
            merge_base = self.git_service.get_merge_base(feature, release_branch)
            if not merge_base:
                continue
                
            changes = self.git_service.get_changes_between_commits(merge_base, feature)
            for file_path, diffs in changes.items():
                if file_path not in all_changes:
                    all_changes[file_path] = []
                all_changes[file_path].extend(diffs)
                
        return all_changes
        
    def _process_file_rollback(self, file_path: str, diffs: List, 
                             release_branch: str, features: List[str]) -> FileAnalysisResult:
        try:
            # Get file contents
            current_content = Path(file_path).read_text()
            original_content = self._get_original_content(file_path, release_branch, features)
            
            # Get appropriate handler
            handler = get_handler_for_file(file_path)
            analysis = handler.analyze_changes(file_path, current_content, original_content)
            
            # Detect conflicts
            conflicts = self.conflict_service.detect_conflicts(
                file_path, current_content, original_content, analysis.changes)
            analysis.conflicts.extend(conflicts)
            
            # Apply rollback if no conflicts
            if not analysis.conflicts and not self.dry_run:
                new_content = handler.apply_rollback(
                    file_path, current_content, original_content, analysis.changes)
                Path(file_path).write_text(new_content)
                analysis.rollback_success = True
                
            return analysis
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            return FileAnalysisResult(
                file_path=file_path,
                changes=[],
                conflicts=[f"Processing error: {str(e)}"],
                rollback_success=False
            )
            
    def _get_original_content(self, file_path: str, release_branch: str, 
                            features: List[str]) -> str:
        # Find last commit that touched this file before features were merged
        file_log = self.git_service.git.log(
            '--follow', '--pretty=format:%H', release_branch, '--', file_path)
        commits = file_log.split('\n')
        
        for commit in commits:
            commit_msg = self.git_service.git.show('-s', '--format=%s', commit)
            if not any(f"Merge branch '{feature}'" in commit_msg for feature in features):
                content = self.git_service.get_file_at_commit(commit, file_path)
                if content:
                    return content
                    
        return ""
        
    def _post_rollback_validation(self, result: RollbackResult):
        # Validate Salesforce metadata
        validation_results = self.validation_service.validate_rollback(result.rolled_back_files)
        
        # Update results with validation findings
        for file_result in result.rolled_back_files:
            file_result.verification_passed = validation_results.get(file_result.file_path, False)
            
        if not all(file_result.verification_passed for file_result in result.rolled_back_files):
            result.warnings.append("Some files failed post-rollback validation")
    
    def get_available_branches(self):
        """Return formatted string of available branches"""
        local = [str(ref.name).replace('refs/heads/', '') 
                for ref in self.repo.references 
                if 'heads/' in str(ref.name)]
        remote = [str(ref.name).replace('refs/remotes/', '') 
                for ref in self.repo.references 
                if 'remotes/' in str(ref.name)]
        return f"\nLocal: {local}\nRemote: {remote}"
