import re
from typing import List, Optional, Dict
from ..models.rollback_models import CodeChange, FileAnalysisResult
from ..utils.logger import logger

class ApexHandler:
    METHOD_PATTERN = re.compile(
        r'(?P<modifiers>((@isTest\s+|public|private|protected|global|static|final|abstract|webservice|virtual|override|with sharing|without sharing|inherited sharing)\s+)*)'
        r'(?P<return_type>[\w.<>]+)\s+'
        r'(?P<name>\w+)\s*'
        r'\((?P<parameters>[^)]*)\)\s*'
        r'(?P<throws>throws\s+[\w.\s,]+)?\s*\{'
    )
    
    def analyze_changes(self, file_path: str, current_content: str, original_content: str) -> FileAnalysisResult:
        changes = []
        conflicts = []
        
        try:
            current_methods = self._parse_methods(current_content)
            original_methods = self._parse_methods(original_content)
            
            # Find added/modified methods
            for name, method in current_methods.items():
                if name not in original_methods:
                    changes.append(self._create_method_change(file_path, 'ADD', method))
                elif method['content'] != original_methods[name]['content']:
                    changes.append(self._create_method_change(file_path, 'MODIFY', method))
            
            # Find deleted methods
            for name, method in original_methods.items():
                if name not in current_methods:
                    changes.append(self._create_method_change(file_path, 'DELETE', method))
                    
        except Exception as e:
            logger.error(f"Error analyzing Apex {file_path}: {str(e)}")
            conflicts.append(f"Analysis error in {file_path}")
            
        return FileAnalysisResult(
            file_path=file_path,
            changes=changes,
            conflicts=conflicts,
            rollback_success=len(conflicts) == 0
        )
        
    def apply_rollback(self, file_path: str, current_content: str, 
                      original_content: str, changes_to_revert: List[CodeChange]) -> str:
        lines = current_content.split('\n')
        modified_lines = lines.copy()
        
        # Sort changes by line number (descending) to avoid offset issues
        for change in sorted(changes_to_revert, key=lambda x: x.new_line_no or 0, reverse=True):
            if change.change_type == 'ADD':
                # Remove added method
                start = change.new_line_no - 1
                end = start + len(change.content.split('\n'))
                modified_lines[start:end] = []
            elif change.change_type == 'MODIFY':
                # Restore original method
                original_method = next(
                    (m for m in self._parse_methods(original_content).values() 
                    if m['name'] == change.metadata['name']), None)
                if original_method:
                    start = change.new_line_no - 1
                    end = start + len(change.content.split('\n'))
                    modified_lines[start:end] = original_method['content'].split('\n')
            elif change.change_type == 'DELETE':
                # Restore deleted method
                original_method = next(
                    (m for m in self._parse_methods(original_content).values() 
                    if m['name'] == change.metadata['name']), None)
                if original_method:
                    insert_pos = self._find_insert_position(modified_lines, original_method)
                    modified_lines[insert_pos:insert_pos] = original_method['content'].split('\n')
                    
        return '\n'.join(modified_lines)
        
    def _parse_methods(self, content: str) -> Dict:
        methods = {}
        matches = list(self.METHOD_PATTERN.finditer(content))
        
        for i, match in enumerate(matches):
            start = match.start()
            end = match.end()
            brace_count = 1
            method_content = []
            
            # Find the entire method body
            lines = content[end:].split('\n')
            method_content.append(content[match.start():end])
            
            for line in lines:
                brace_count += line.count('{')
                brace_count -= line.count('}')
                method_content.append(line)
                if brace_count == 0:
                    break
                    
            full_content = '\n'.join(method_content)
            methods[match.group('name')] = {
                'name': match.group('name'),
                'start_line': content[:match.start()].count('\n') + 1,
                'content': full_content,
                'signature': match.group(0)
            }
            
        return methods
        
    def _create_method_change(self, file_path: str, change_type: str, method: Dict) -> CodeChange:
        return CodeChange(
            file_path=file_path,
            change_type=change_type,
            old_line_no=method.get('start_line'),
            new_line_no=method.get('start_line'),
            content=method['content'],
            metadata={
                'name': method['name'],
                'signature': method['signature']
            }
        )
        
    def _find_insert_position(self, lines: List[str], method: Dict) -> int:
        # Simple heuristic: insert after last method or at end of class
        last_method_pos = 0
        for i, line in enumerate(lines):
            if line.strip().startswith(('public ', 'private ', 'protected ', 'global ')):
                if ' class ' not in line and ' interface ' not in line:
                    last_method_pos = i
        return last_method_pos + 1 if last_method_pos > 0 else len(lines)
