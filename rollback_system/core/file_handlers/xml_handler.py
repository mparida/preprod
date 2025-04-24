# rollback_system/core/file_handlers/xml_handler.py
from lxml import etree
from typing import List, Dict, Optional
from pathlib import Path
from rollback_system.core.models.rollback_models import CodeChange, FileAnalysisResult
from rollback_system.utils.logger import logger
from rollback_system.utils.xml_utils import xml_to_dict, dict_to_xml

class XmlHandler:
    """Handles rollback operations for Salesforce XML metadata files"""
    
    def __init__(self):
        self.namespaces = {
            'sf': 'http://soap.sforce.com/2006/04/metadata'
        }
        
    def analyze_changes(self, file_path: str, current_content: str, 
                      original_content: str) -> FileAnalysisResult:
        """
        Analyzes changes between two versions of an XML file
        Returns FileAnalysisResult with detected changes and conflicts
        """
        changes = []
        conflicts = []
        
        try:
            # Parse XMLs into dictionaries for comparison
            current_dict = xml_to_dict(current_content, self.namespaces)
            original_dict = xml_to_dict(original_content, self.namespaces)
            
            # Find all differences
            diff = self._find_xml_differences(original_dict, current_dict)
            
            # Convert to CodeChange objects
            for change in diff:
                changes.append(CodeChange(
                    file_path=file_path,
                    change_type=change['type'],
                    old_line_no=None,  # XML changes are node-based, not line-based
                    new_line_no=None,
                    content=str(change['path']),
                    metadata={
                        'xpath': change['path'],
                        'old_value': change.get('old_value'),
                        'new_value': change.get('new_value')
                    }
                ))
                
        except etree.XMLSyntaxError as e:
            error_msg = f"Invalid XML in {file_path}: {str(e)}"
            logger.error(error_msg)
            conflicts.append(error_msg)
        except Exception as e:
            error_msg = f"XML analysis failed for {file_path}: {str(e)}"
            logger.error(error_msg)
            conflicts.append(error_msg)
            
        return FileAnalysisResult(
            file_path=file_path,
            changes=changes,
            conflicts=conflicts,
            rollback_success=len(conflicts) == 0
        )
        
    def apply_rollback(self, file_path: str, current_content: str, 
                      original_content: str, changes_to_revert: List[CodeChange]) -> str:
        """
        Reverts specified changes in an XML file while preserving other modifications
        """
        try:
            current_dict = xml_to_dict(current_content, self.namespaces)
            original_dict = xml_to_dict(original_content, self.namespaces)
            
            # Apply each change in reverse order (deepest nodes first)
            for change in sorted(
                changes_to_revert, 
                key=lambda x: x.metadata['xpath'].count('/'), 
                reverse=True
            ):
                self._revert_xml_change(
                    current_dict, 
                    change.metadata['xpath'], 
                    original_dict
                )
                
            return dict_to_xml(current_dict)
        except Exception as e:
            logger.error(f"XML rollback failed for {file_path}: {str(e)}")
            raise
            
    def _find_xml_differences(self, original: Dict, current: Dict, path: str = '') -> List[Dict]:
        """Recursively finds differences between two XML dictionaries"""
        differences = []
        
        # Check for added/modified nodes
        for key in current:
            if key not in original:
                differences.append({
                    'type': 'ADD',
                    'path': f"{path}/{key}",
                    'new_value': current[key]
                })
            elif current[key] != original[key]:
                if isinstance(current[key], dict) and isinstance(original[key], dict):
                    differences.extend(
                        self._find_xml_differences(
                            original[key], 
                            current[key], 
                            f"{path}/{key}"
                        )
                    )
                else:
                    differences.append({
                        'type': 'MODIFY',
                        'path': f"{path}/{key}",
                        'old_value': original[key],
                        'new_value': current[key]
                    })
                    
        # Check for deleted nodes
        for key in original:
            if key not in current:
                differences.append({
                    'type': 'DELETE',
                    'path': f"{path}/{key}",
                    'old_value': original[key]
                })
                
        return differences
        
    def _revert_xml_change(self, current_dict: Dict, xpath: str, original_dict: Dict):
        """Reverts a specific XML change using xpath-like notation"""
        path_parts = [p for p in xpath.split('/') if p]
        current = current_dict
        original = original_dict
        
        try:
            # Navigate to the parent node
            for part in path_parts[:-1]:
                current = current[part]
                original = original.get(part, {})
                
            last_part = path_parts[-1]
            
            # Revert the change
            if last_part in original:
                current[last_part] = original[last_part]
            else:
                current.pop(last_part, None)
                
        except KeyError as e:
            logger.warning(f"Node not found during XML revert: {xpath}")
