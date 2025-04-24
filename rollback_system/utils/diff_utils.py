# rollback_system/utils/xml_utils.py
from lxml import etree
from typing import Dict, Any
import json

def xml_to_dict(xml_content: str, namespaces: Dict) -> Dict[str, Any]:
    """Converts XML to a nested dictionary"""
    root = etree.fromstring(xml_content.encode())
    return _element_to_dict(root, namespaces)

def _element_to_dict(element, namespaces):
    """Recursively converts XML element to dictionary"""
    result = {}
    
    for child in element:
        key = etree.QName(child.tag).localname
        if len(child):
            result[key] = _element_to_dict(child, namespaces)
        else:
            result[key] = child.text
            
    return result

def dict_to_xml(data: Dict) -> str:
    """Converts dictionary back to XML string"""
    root = etree.Element('root')
    _dict_to_element(root, data)
    return etree.tostring(root, pretty_print=True).decode()
