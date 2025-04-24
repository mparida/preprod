from .xml_handler import XmlHandler
from .apex_handler import ApexHandler

def get_handler_for_file(file_path: str):
    if file_path.endswith('.xml'):
        return XmlHandler()
    elif file_path.endswith('.cls') or file_path.endswith('.trigger'):
        return ApexHandler()
    raise ValueError(f"No handler for file type: {file_path}")

__all__ = ['get_handler_for_file', 'XmlHandler', 'ApexHandler']