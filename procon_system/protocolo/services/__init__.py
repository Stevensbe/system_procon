"""
Serviços do módulo de protocolo
"""

from .numbering_service import numbering_service
from .ocr_service import ocr_service
from .indexing_service import indexing_service
from .digitization_service import digitization_service
from .quality_service import quality_service

__all__ = [
    'numbering_service',
    'ocr_service', 
    'indexing_service',
    'digitization_service',
    'quality_service'
]