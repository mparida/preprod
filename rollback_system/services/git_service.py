import os
from pathlib import Path
from git import Repo
import subprocess
from typing import List

class GitService:
    def __init__(self, repo_path: str = None):
        self.repo_path = repo_path or os.getcwd()
        
        # Navigate up from rollback_system/ if needed
        if os.path.basename(self.repo_path) == 'rollback_system':
            self.repo_path = str(Path(self.repo_path).parent)
            
        self.repo = Repo(self.repo_path, search_parent_directories=True)
        self.git = self.repo.git
        self.repo.git.fetch('--all')  # Ensure all branches are available

    def get_all_branches(self) -> List[str]:
        """Get all local and remote branches"""
        try:
            # Get local branches
            local = [ref.name.split('/')[-1] 
                    for ref in self.repo.references 
                    if 'heads' in str(ref)]
            
            # Get remote branches
            remote = [ref.name.split('/')[-1] 
                     for ref in self.repo.references 
                     if 'remotes' in str(ref)]
            
            return list(set(local + remote))  # Remove duplicates
            
        except Exception as e:
            # Fallback to git CLI
            try:
                result = subprocess.run(
                    ['git', 'branch', '-a'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                branches = [
                    line.strip().replace('* ', '').split('/')[-1]
                    for line in result.stdout.split('\n')
                    if line.strip()
                ]
                return list(set(branches))
            except subprocess.CalledProcessError as e:
                raise RuntimeError(f"Failed to get branches: {str(e)}")

    def branch_exists(self, branch_name: str) -> bool:
        """Check if branch exists (case-sensitive)"""
        return branch_name in self.get_all_branches()

    def verify_repository(self):
        """Debug repository state"""
        print("\n=== Git Repository State ===")
        print(f"Repo path: {self.repo_path}")
        print(f"Active branch: {self.repo.active_branch}")
        print(f"Available branches: {self.get_all_branches()}")
        print("==========================\n")