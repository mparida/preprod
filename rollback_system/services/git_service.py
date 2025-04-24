import git
import os
from git import Repo, Diff
from typing import List, Dict, Optional
from pathlib import Path
from rollback_system.core.models.rollback_models import CodeChange, ChangeType
from rollback_system.utils.logger import logger
import subprocess
from typing import List

class GitService:
    def get_all_branches(self) -> List[str]:
        """Get all branches using the most reliable method available"""
        try:
            # Try GitPython first
            if hasattr(self, 'repo'):
                return [
                    *[ref.name.split('/')[-1] for ref in self.repo.references if 'heads' in str(ref)],
                    *[ref.name.split('/')[-1] for ref in self.repo.references if 'remotes' in str(ref)]
                ]
            
            # Fallback to git CLI
            result = subprocess.run(
                ['git', 'branch', '-a'],
                capture_output=True,
                text=True,
                check=True
            )
            return [
                line.strip().replace('* ', '').replace('remotes/', '')
                for line in result.stdout.split('\n')
                if line.strip()
            ]
        except Exception as e:
            raise RuntimeError(f"Could not list branches: {str(e)}")

        
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

    def branch_exists(self, branch_name: str) -> bool:
        """Robust branch checking with fallbacks"""
        try:
            # Check both local and remote branches
            branches = [
                *[ref.name.split('/')[-1] for ref in self.repo.references if 'heads' in str(ref)],
                *[ref.name.split('/')[-1] for ref in self.repo.references if 'remotes' in str(ref)]
            ]
            return branch_name in branches
        
        except Exception as e:
            # Fallback to git CLI if python-git fails
            try:
                output = subprocess.check_output(
                    ['git', 'show-ref', '--verify', f'refs/heads/{branch_name}'],
                    stderr=subprocess.PIPE
                )
                return True
            except subprocess.CalledProcessError:
                return False

    def _try_get_branches(self):
        """Fallback branch detection when repo init fails"""
        try:
            local = subprocess.check_output(['git', 'branch', '--list']).decode().split()
            remote = subprocess.check_output(['git', 'branch', '-r']).decode().split()
            return f"\nLocal: {local}\nRemote: {remote}"
        except:
            return "Could not retrieve branches"
    
    def verify_repository(self):
        """Debug method to check repository state"""
        print("\n=== Repository Verification ===")
        print(f"Repo path: {self.repo_path}")
        print(f"Active branch: {self.repo.active_branch}")
        print("Branches:", [ref.name for ref in self.repo.references])
        print("Git directory:", self.repo.git_dir)
        print("=============================\n")