"""
Serviço de indexação de documentos para o módulo de protocolo
"""

import os
import logging
from typing import List, Dict, Any
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


class IndexingService:
    """
    Serviço para indexação de documentos
    """
    
    def __init__(self):
        self.supported_formats = ['.pdf', '.doc', '.docx', '.txt']
    
    def index_document(self, document_path: str) -> Dict[str, Any]:
        """
        Indexa um documento e extrai metadados
        """
        try:
            if not os.path.exists(document_path):
                return {'error': 'Documento não encontrado'}
            
            file_extension = os.path.splitext(document_path)[1].lower()
            
            if file_extension not in self.supported_formats:
                return {'error': 'Formato não suportado'}
            
            # Extrai metadados básicos
            metadata = self._extract_basic_metadata(document_path)
            
            # Tenta extrair texto (OCR se necessário)
            text_content = self._extract_text_content(document_path, file_extension)
            
            return {
                'success': True,
                'metadata': metadata,
                'text_content': text_content,
                'indexed': True
            }
            
        except Exception as e:
            logger.error(f"Erro ao indexar documento {document_path}: {str(e)}")
            return {'error': str(e)}
    
    def _extract_basic_metadata(self, document_path: str) -> Dict[str, Any]:
        """
        Extrai metadados básicos do documento
        """
        try:
            stat = os.stat(document_path)
            file_size = stat.st_size
            file_name = os.path.basename(document_path)
            
            return {
                'file_name': file_name,
                'file_size': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'file_extension': os.path.splitext(document_path)[1].lower(),
                'created_date': stat.st_ctime,
                'modified_date': stat.st_mtime,
            }
        except Exception as e:
            logger.error(f"Erro ao extrair metadados: {str(e)}")
            return {}
    
    def _extract_text_content(self, document_path: str, file_extension: str) -> str:
        """
        Extrai conteúdo de texto do documento
        """
        try:
            if file_extension == '.txt':
                with open(document_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            elif file_extension == '.pdf':
                return self._extract_pdf_text(document_path)
            
            elif file_extension in ['.doc', '.docx']:
                return self._extract_word_text(document_path)
            
            else:
                return ""
                
        except Exception as e:
            logger.error(f"Erro ao extrair texto: {str(e)}")
            return ""
    
    def _extract_pdf_text(self, pdf_path: str) -> str:
        """
        Extrai texto de arquivo PDF
        """
        try:
            import PyPDF2
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                return text
                
        except ImportError:
            logger.warning("PyPDF2 não instalado. Instalando...")
            return self._extract_pdf_text_fallback(pdf_path)
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF: {str(e)}")
            return ""
    
    def _extract_pdf_text_fallback(self, pdf_path: str) -> str:
        """
        Fallback para extração de texto PDF usando OCR
        """
        try:
            import pytesseract
            from PIL import Image
            import pdf2image
            
            # Converte PDF para imagens
            images = pdf2image.convert_from_path(pdf_path)
            text = ""
            
            for image in images:
                # Extrai texto usando OCR
                page_text = pytesseract.image_to_string(image, lang='por')
                text += page_text + "\n"
            
            return text
            
        except ImportError:
            logger.warning("Dependências OCR não instaladas")
            return ""
        except Exception as e:
            logger.error(f"Erro no fallback OCR: {str(e)}")
            return ""
    
    def _extract_word_text(self, word_path: str) -> str:
        """
        Extrai texto de arquivo Word
        """
        try:
            import docx
            
            doc = docx.Document(word_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text
            
        except ImportError:
            logger.warning("python-docx não instalado")
            return ""
        except Exception as e:
            logger.error(f"Erro ao extrair texto do Word: {str(e)}")
            return ""
    
    def search_documents(self, query: str, documents: List[str]) -> List[Dict[str, Any]]:
        """
        Busca em documentos indexados
        """
        results = []
        
        for doc_path in documents:
            try:
                # Indexa o documento se necessário
                indexed_data = self.index_document(doc_path)
                
                if indexed_data.get('success') and 'text_content' in indexed_data:
                    text_content = indexed_data['text_content'].lower()
                    query_lower = query.lower()
                    
                    # Busca simples por palavras-chave
                    if query_lower in text_content:
                        results.append({
                            'document_path': doc_path,
                            'metadata': indexed_data.get('metadata', {}),
                            'relevance_score': self._calculate_relevance(query_lower, text_content),
                            'matched_content': self._extract_matched_content(text_content, query_lower)
                        })
            
            except Exception as e:
                logger.error(f"Erro ao buscar no documento {doc_path}: {str(e)}")
                continue
        
        # Ordena por relevância
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results
    
    def _calculate_relevance(self, query: str, text: str) -> float:
        """
        Calcula score de relevância
        """
        query_words = query.split()
        text_words = text.split()
        
        if not text_words:
            return 0.0
        
        matches = 0
        for word in query_words:
            if word in text_words:
                matches += 1
        
        return matches / len(query_words) if query_words else 0.0
    
    def _extract_matched_content(self, text: str, query: str, context_chars: int = 100) -> str:
        """
        Extrai contexto ao redor da correspondência
        """
        try:
            index = text.find(query)
            if index == -1:
                return ""
            
            start = max(0, index - context_chars)
            end = min(len(text), index + len(query) + context_chars)
            
            return text[start:end].strip()
            
        except Exception:
            return ""


# Instância global do serviço
indexing_service = IndexingService()
