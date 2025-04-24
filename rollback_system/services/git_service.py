import git
import os
from git import Repo, Diff
from typing import List, Dict, Optional
from pathlib import Path
from rollback_system.core.models.rollback_models import CodeChange, ChangeType
from rollback_system.utils.logger import logger

class GitService:
    def __init__(self, repo_path: str = None):
        # Navigate up from rollback_system to the actual repo root
        self.repo_path = repo_path or os.getcwd()
        
        # If we're in rollback_system/, go up one level
        if os.path.basename(self.repo_path) == 'rollback_system':
            self.repo_path = str(Path(self.repo_path).parent)
            
        try:
            self.repo = Repo(self.repo_path)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Git repo at {self.repo_path}: {str(e)}")
        
    def checkout_branch(self, branch_name: str) -> bool:
        try:
            self.git.checkout(branch_name)
            return True
        except git.exc.GitCommandError as e:
            logger.error(f"Failed to checkout branch {branch_name}: {str(e)}")
            return False
            
    def get_merge_base(self, branch1: str, branch2: str) -> Optional[str]:
        try:
            return self.repo.merge_base(branch1, branch2)[0].hexsha
        except Exception as e:
            logger.error(f"Failed to find merge base: {str(e)}")
            return None
            
    def get_file_at_commit(self, commit_sha: str, file_path: str) -> Optional[str]:
        try:
            return self.git.show(f"{commit_sha}:{file_path}")
        except git.exc.GitCommandError:
            return None
            
    def get_changes_between_commits(self, from_commit: str, to_commit: str) -> Dict[str, List[Diff]]:
        changes = {}
        try:
            diffs = self.repo.commit(from_commit).diff(to_commit)
            for diff in diffs:
                path = diff.a_path if diff.a_path else diff.b_path
                if path not in changes:
                    changes[path] = []
                changes[path].append(diff)
        except Exception as e:
            logger.error(f"Error getting changes: {str(e)}")
        return changes
        
    def commit_changes(self, message: str) -> bool:
        try:
            self.git.commit('-m', message)
            return True
        except git.exc.GitCommandError as e:
            logger.error(f"Commit failed: {str(e)}")
            return False
            
    def create_backup_branch(self, base_branch: str, backup_name: str) -> bool:
        try:
            self.git.checkout(base_branch)
            self.git.checkout('-b', backup_name)
            return True
        except git.exc.GitCommandError as e:
            logger.error(f"Backup branch creation failed: {str(e)}")
            return False
