#!/usr/bin/env python
"""
Serviços avançados para o módulo de protocolo
Inclui: OCR, indexação de documentos, digitalização avançada
"""

import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import cv2
import numpy as np
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from .models import DocumentoProtocolo, Protocolo
import logging
import json
from typing import Dict, List, Optional, Tuple
import hashlib
import re

logger = logging.getLogger(__name__)


class OCRService:
    """Serviço para OCR (Reconhecimento Óptico de Caracteres)"""
    
    def __init__(self):
        self.supported_formats = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp']
        self.tesseract_config = '--oem 3 --psm 6 -l por+eng'
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrai texto de arquivo PDF usando PyMuPDF"""
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF {pdf_path}: {e}")
            return ""
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extrai texto de imagem usando Tesseract OCR"""
        try:
            # Carrega a imagem
            image = cv2.imread(image_path)
            
            # Pré-processamento para melhorar OCR
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Aplicar filtros para melhorar qualidade
            # Redução de ruído
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Binarização adaptativa
            binary = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Salvar imagem processada temporariamente
            temp_path = image_path.replace('.', '_processed.')
            cv2.imwrite(temp_path, binary)
            
            # Extrair texto com Tesseract
            text = pytesseract.image_to_string(
                Image.open(temp_path), 
                config=self.tesseract_config
            )
            
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return text.strip()
        except Exception as e:
            logger.error(f"Erro ao extrair texto da imagem {image_path}: {e}")
            return ""
    
    def extract_text_from_document(self, document: DocumentoProtocolo) -> str:
        """Extrai texto de qualquer tipo de documento suportado"""
        try:
            file_path = document.arquivo.path
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                return self.extract_text_from_pdf(file_path)
            elif file_extension in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
                return self.extract_text_from_image(file_path)
            else:
                logger.warning(f"Formato não suportado: {file_extension}")
                return ""
        except Exception as e:
            logger.error(f"Erro ao extrair texto do documento {document.id}: {e}")
            return ""


class DocumentIndexingService:
    """Serviço para indexação de documentos"""
    
    def __init__(self):
        self.stop_words = {
            'a', 'o', 'e', 'é', 'de', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma',
            'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ele', 'das',
            'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
            'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois',
            'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'minha', 'têm', 'naquele', 'nela', 'porque',
            'ela', 'como', 'já', 'ou', 'também', 'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas',
            'qual', 'nós', 'lhes', 'deles', 'estas', 'estes', 'das', 'seu', 'suas', 'seu', 'suas',
            'ou', 'onde', 'muito', 'pouco', 'tão', 'assim', 'aqui', 'ali', 'lá', 'aqui', 'ali',
            'cada', 'qualquer', 'todos', 'todas', 'nenhum', 'nenhuma', 'alguns', 'algumas'
        }
    
    def preprocess_text(self, text: str) -> str:
        """Pré-processa o texto para indexação"""
        # Converter para minúsculas
        text = text.lower()
        
        # Remover caracteres especiais
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remover espaços extras
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_keywords(self, text: str, max_keywords: int = 20) -> List[str]:
        """Extrai palavras-chave do texto"""
        processed_text = self.preprocess_text(text)
        words = processed_text.split()
        
        # Filtrar stop words e palavras muito curtas
        keywords = [
            word for word in words 
            if word not in self.stop_words and len(word) > 2
        ]
        
        # Contar frequência
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Ordenar por frequência e retornar top keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:max_keywords]]
    
    def generate_document_hash(self, text: str) -> str:
        """Gera hash único do documento baseado no conteúdo"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def extract_metadata(self, text: str) -> Dict:
        """Extrai metadados do documento"""
        metadata = {
            'palavras_chave': self.extract_keywords(text),
            'hash_conteudo': self.generate_document_hash(text),
            'tamanho_texto': len(text),
            'data_processamento': timezone.now().isoformat(),
        }
        
        # Extrair CPF/CNPJ
        cpf_pattern = r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b'
        cnpj_pattern = r'\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b'
        
        cpfs = re.findall(cpf_pattern, text)
        cnpjs = re.findall(cnpj_pattern, text)
        
        if cpfs:
            metadata['cpfs_encontrados'] = cpfs
        if cnpjs:
            metadata['cnpjs_encontrados'] = cnpjs
        
        # Extrair emails
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            metadata['emails_encontrados'] = emails
        
        # Extrair telefones
        phone_pattern = r'\b\(?\d{2,3}\)?\s?\d{4,5}-?\d{4}\b'
        phones = re.findall(phone_pattern, text)
        if phones:
            metadata['telefones_encontrados'] = phones
        
        return metadata
    
    def index_document(self, document: DocumentoProtocolo) -> bool:
        """Indexa um documento completo"""
        try:
            # Extrair texto usando OCR
            ocr_service = OCRService()
            texto_extraido = ocr_service.extract_text_from_document(document)
            
            if not texto_extraido:
                logger.warning(f"Nenhum texto extraído do documento {document.id}")
                return False
            
            # Extrair metadados
            metadata = self.extract_metadata(texto_extraido)
            
            # Atualizar documento
            document.texto_extraido = texto_extraido
            document.indexado = True
            
            # Salvar metadados como JSON no campo tags (se existir) ou criar campo adicional
            if hasattr(document, 'metadados'):
                document.metadados = metadata
            else:
                # Usar campo tags se disponível
                document.tags = metadata
            
            document.save()
            
            logger.info(f"Documento {document.id} indexado com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao indexar documento {document.id}: {e}")
            return False


class AdvancedDigitizationService:
    """Serviço para digitalização avançada de documentos"""
    
    def __init__(self):
        self.ocr_service = OCRService()
        self.indexing_service = DocumentIndexingService()
    
    def process_document_upload(self, document: DocumentoProtocolo) -> Dict:
        """Processa upload completo de documento com OCR e indexação"""
        try:
            result = {
                'success': False,
                'ocr_text': '',
                'keywords': [],
                'metadata': {},
                'errors': []
            }
            
            # Verificar se arquivo existe
            if not document.arquivo or not os.path.exists(document.arquivo.path):
                result['errors'].append("Arquivo não encontrado")
                return result
            
            # Extrair texto com OCR
            ocr_text = self.ocr_service.extract_text_from_document(document)
            result['ocr_text'] = ocr_text
            
            if not ocr_text:
                result['errors'].append("Nenhum texto extraído do documento")
                return result
            
            # Extrair metadados
            metadata = self.indexing_service.extract_metadata(ocr_text)
            result['metadata'] = metadata
            result['keywords'] = metadata.get('palavras_chave', [])
            
            # Indexar documento
            if self.indexing_service.index_document(document):
                result['success'] = True
            else:
                result['errors'].append("Falha na indexação")
            
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento de upload: {e}")
            result['errors'].append(str(e))
            return result
    
    def batch_process_documents(self, documents: List[DocumentoProtocolo]) -> Dict:
        """Processa múltiplos documentos em lote"""
        results = {
            'total': len(documents),
            'successful': 0,
            'failed': 0,
            'results': []
        }
        
        for document in documents:
            result = self.process_document_upload(document)
            results['results'].append({
                'document_id': document.id,
                'result': result
            })
            
            if result['success']:
                results['successful'] += 1
            else:
                results['failed'] += 1
        
        return results
    
    def search_documents(self, query: str, protocolo: Optional[Protocolo] = None) -> List[DocumentoProtocolo]:
        """Busca documentos por texto extraído"""
        try:
            # Buscar por texto extraído
            documents = DocumentoProtocolo.objects.filter(
                texto_extraido__icontains=query,
                indexado=True
            )
            
            if protocolo:
                documents = documents.filter(protocolo=protocolo)
            
            return documents.order_by('-data_upload')
            
        except Exception as e:
            logger.error(f"Erro na busca de documentos: {e}")
            return []
    
    def get_document_statistics(self, protocolo: Optional[Protocolo] = None) -> Dict:
        """Retorna estatísticas dos documentos processados"""
        try:
            queryset = DocumentoProtocolo.objects.filter(indexado=True)
            
            if protocolo:
                queryset = queryset.filter(protocolo=protocolo)
            
            total_documents = queryset.count()
            total_text_extracted = queryset.filter(texto_extraido__isnull=False).exclude(texto_extraido='').count()
            
            # Calcular tamanho médio dos textos
            avg_text_length = queryset.aggregate(
                avg_length=models.Avg(models.functions.Length('texto_extraido'))
            )['avg_length'] or 0
            
            # Contar por tipo de documento
            by_type = queryset.values('tipo').annotate(
                count=models.Count('id')
            )
            
            return {
                'total_documents': total_documents,
                'documents_with_text': total_text_extracted,
                'extraction_rate': (total_text_extracted / total_documents * 100) if total_documents > 0 else 0,
                'average_text_length': avg_text_length,
                'by_type': list(by_type)
            }
            
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {e}")
            return {}


class DocumentQualityService:
    """Serviço para análise de qualidade de documentos"""
    
    def analyze_document_quality(self, document: DocumentoProtocolo) -> Dict:
        """Analisa a qualidade do documento digitalizado"""
        try:
            quality_score = 0
            issues = []
            recommendations = []
            
            # Verificar se tem texto extraído
            if not document.texto_extraido:
                quality_score -= 30
                issues.append("Nenhum texto extraído")
                recommendations.append("Verificar se o documento é legível")
            else:
                quality_score += 20
                
                # Analisar qualidade do texto
                text_length = len(document.texto_extraido)
                if text_length < 50:
                    quality_score -= 10
                    issues.append("Texto muito curto")
                    recommendations.append("Verificar se o documento foi digitalizado corretamente")
                elif text_length > 1000:
                    quality_score += 10
                
                # Verificar caracteres especiais (indicam problemas de OCR)
                special_chars = len(re.findall(r'[^a-zA-Z0-9\s]', document.texto_extraido))
                if special_chars > text_length * 0.1:  # Mais de 10% de caracteres especiais
                    quality_score -= 15
                    issues.append("Muitos caracteres especiais detectados")
                    recommendations.append("Melhorar qualidade da digitalização")
            
            # Verificar se está indexado
            if document.indexado:
                quality_score += 10
            else:
                quality_score -= 10
                issues.append("Documento não indexado")
                recommendations.append("Executar processo de indexação")
            
            # Normalizar score para 0-100
            quality_score = max(0, min(100, quality_score + 50))
            
            return {
                'quality_score': quality_score,
                'issues': issues,
                'recommendations': recommendations,
                'text_length': len(document.texto_extraido) if document.texto_extraido else 0,
                'is_indexed': document.indexado
            }
            
        except Exception as e:
            logger.error(f"Erro ao analisar qualidade do documento {document.id}: {e}")
            return {
                'quality_score': 0,
                'issues': [f"Erro na análise: {str(e)}"],
                'recommendations': ["Verificar configurações do sistema"]
            }


# Instâncias globais dos serviços
ocr_service = OCRService()
indexing_service = DocumentIndexingService()
digitization_service = AdvancedDigitizationService()
quality_service = DocumentQualityService()
