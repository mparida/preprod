from typing import List, Dict, Set
from rollback_system.core.models.rollback_models import CodeChange, FileAnalysisResult
from rollback_system.utils.logger import logger
from difflib import SequenceMatcher

class ConflictService:
    def __init__(self):
        self.conflict_threshold = 0.7  # Similarity threshold for conflicts
        
    def detect_conflicts(self, file_path: str, current_content: str, 
                        original_content: str, changes_to_revert: List[CodeChange]) -> List[str]:
        conflicts = []
        
        # Check for overlapping changes
        change_regions = self._get_change_regions(changes_to_revert)
        if self._has_overlapping_regions(change_regions):
            conflicts.append(f"Overlapping changes in {file_path}")
            
        # Check for semantic conflicts
        if self._has_semantic_conflicts(current_content, original_content, changes_to_revert):
            conflicts.append(f"Semantic conflicts detected in {file_path}")
            
        return conflicts
        
    def _get_change_regions(self, changes: List[CodeChange]) -> List[tuple]:
        regions = []
        for change in changes:
            if change.new_line_no:
                start = change.new_line_no
                end = start + len(change.content.split('\n'))
                regions.append((start, end))
        return regions
        
    def _has_overlapping_regions(self, regions: List[tuple]) -> bool:
        sorted_regions = sorted(regions, key=lambda x: x[0])
        for i in range(1, len(sorted_regions)):
            if sorted_regions[i][0] < sorted_regions[i-1][1]:
                return True
        return False
        
    def _has_semantic_conflicts(self, current: str, original: str, 
                               changes: List[CodeChange]) -> bool:
        # Create versions with and without changes
        original_lines = original.split('\n')
        current_lines = current.split('\n')
        
        # Apply changes to original to get expected result
        expected_lines = original_lines.copy()
        for change in sorted(changes, key=lambda x: x.new_line_no or 0, reverse=True):
            if change.change_type == 'ADD':
                start = change.new_line_no - 1
                expected_lines[start:start] = change.content.split('\n')
            elif change.change_type == 'MODIFY':
                start = change.new_line_no - 1
                end = start + len(change.content.split('\n'))
                expected_lines[start:end] = change.content.split('\n')
            elif change.change_type == 'DELETE':
                start = change.new_line_no - 1
                end = start + len(change.content.split('\n'))
                expected_lines[start:end] = []
                
        # Compare with current
        matcher = SequenceMatcher(None, '\n'.join(expected_lines), current)
        similarity = matcher.ratio()
        
        return similarity < self.conflict_threshold
