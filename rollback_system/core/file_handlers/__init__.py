# rollback_system/core/file_handlers/__init__.py
from .xml_handler import XmlHandler
from .apex_handler import ApexHandler

def get_handler_for_file(file_path: str):
    """Factory method to get appropriate handler based on file extension"""
    if file_path.endswith('.xml'):
        return XmlHandler()
    elif file_path.endswith('.cls') or file_path.endswith('.trigger'):
        return ApexHandler()
    # Add other handlers as needed
    raise ValueError(f"No handler for file type: {file_path}")
