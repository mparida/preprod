# rollback_system/core/models/rollback_models.py
from dataclasses import dataclass
from typing import List, Dict, Set, Optional
from enum import Enum, auto
import json

class ChangeType(Enum):
    """Type of code changes we can encounter"""
    ADD = auto()
    MODIFY = auto()
    DELETE = auto()
    RENAME = auto()

@dataclass
class CodeChange:
    """Represents a single atomic code change"""
    file_path: str
    change_type: ChangeType
    old_line_no: Optional[int]
    new_line_no: Optional[int]
    content: str
    context: Optional[str] = None
    metadata: Optional[Dict] = None

    def to_dict(self):
        return {
            'file_path': self.file_path,
            'change_type': self.change_type.name,
            'old_line_no': self.old_line_no,
            'new_line_no': self.new_line_no,
            'content': self.content[:100] + '...' if len(self.content) > 100 else self.content,
            'metadata_keys': list(self.metadata.keys()) if self.metadata else None
        }

@dataclass
class FileAnalysisResult:
    """Results of analyzing a single file"""
    file_path: str
    changes: List[CodeChange]
    conflicts: List[str]
    rollback_success: bool
    verification_passed: bool = False

    def to_dict(self):
        return {
            'file_path': self.file_path,
            'change_count': len(self.changes),
            'conflicts': self.conflicts,
            'success': self.rollback_success,
            'verified': self.verification_passed
        }

@dataclass
class RollbackResult:
    """Final outcome of the rollback operation"""
    success: bool
    rolled_back_files: List[FileAnalysisResult]
    conflicts: List[str]
    warnings: List[str]
    dry_run: bool = False

    def to_json(self):
        return json.dumps({
            'success': self.success,
            'files_processed': [f.to_dict() for f in self.rolled_back_files],
            'total_conflicts': len(self.conflicts),
            'conflicts': self.conflicts,
            'warnings': self.warnings,
            'dry_run': self.dry_run
        }, indent=2)
