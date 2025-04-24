#!/usr/bin/env python3
import argparse
from rollback_system.core.rollback_processor import RollbackProcessor  # Updated import

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo-path', default=None)  # Add this argument
    parser.add_argument('--release-branch', required=True)
    parser.add_argument('--features', required=True)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    processor = RollbackProcessor(repo_path=args.repo_path)
    result = processor.rollback_features(
        args.release_branch,
        args.features.split(','),
        args.dry_run
    )
    
    with open('rollback_report.json', 'w') as f:
        f.write(result.to_json())

if __name__ == "__main__":
    main()
