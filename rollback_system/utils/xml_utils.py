from lxml import etree
from typing import Dict, Any
import json

def xml_to_dict(xml_content: str, namespaces: Dict = None) -> Dict[str, Any]:
    """Convert XML string to nested dictionary"""
    root = etree.fromstring(xml_content.encode())
    return _element_to_dict(root, namespaces or {})

def _element_to_dict(element, namespaces: Dict) -> Dict:
    """Recursive helper function"""
    result = {}
    for child in element:
        key = etree.QName(child.tag).localname
        if len(child):
            result[key] = _element_to_dict(child, namespaces)
        else:
            result[key] = child.text
    return result

def dict_to_xml(data: Dict) -> str:
    """Convert dictionary back to XML string"""
    root = etree.Element('root')
    _dict_to_element(root, data)
    return etree.tostring(root, pretty_print=True).decode()

def _dict_to_element(parent, data: Dict):
    """Recursive helper function"""
    for key, value in data.items():
        element = etree.SubElement(parent, key)
        if isinstance(value, dict):
            _dict_to_element(element, value)
        else:
            element.text = str(value)

__all__ = ['xml_to_dict', 'dict_to_xml']
