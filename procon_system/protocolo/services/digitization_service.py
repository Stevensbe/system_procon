"""
Serviço de digitalização integrado
Combina OCR, indexação e controle de qualidade
"""
from typing import Dict, List, Optional, Any
import logging
from django.conf import settings
from django.utils import timezone

from .ocr_service import ocr_service
from .indexing_service import indexing_service
from .quality_service import quality_service

logger = logging.getLogger(__name__)


class DigitizationService:
    """
    Serviço integrado de digitalização de documentos
    Combina OCR, indexação e controle de qualidade
    """
    
    def __init__(self):
        self.ocr_service = ocr_service
        self.indexing_service = indexing_service
        self.quality_service = quality_service
    
    def process_document_upload(self, documento) -> Dict:
        """
        Processa completamente um documento upload
        
        Args:
            documento: Instância do DocumentoProtocolo
            
        Returns:
            dict: Resultado completo do processamento
        """
        result = {
            'success': False,
            'document_id': documento.id,
            'processing_steps': [],
            'ocr_text': '',
            'keywords': [],
            'categories': [],
            'quality_assessment': {},
            'metadata': {},
            'errors': [],
            'warnings': []
        }
        
        try:
            # Etapa 1: Análise de Qualidade
            result['processing_steps'].append('quality_analysis')
            quality_result = self._analyze_quality(documento)
            result['quality_assessment'] = quality_result
            
            if not quality_result.get('success'):
                result['warnings'].append("Falha na análise de qualidade")
            
            # Etapa 2: Extração de Texto (OCR)
            result['processing_steps'].append('text_extraction')
            ocr_result = self._extract_text(documento)
            
            if ocr_result.get('success'):
                result['ocr_text'] = ocr_result.get('text', '')
                documento.texto_extraido = result['ocr_text']
                documento.save()
            else:
                result['errors'].extend(ocr_result.get('errors', []))
                # Continuar mesmo com falha no OCR se houver texto
                if documento.texto_extraido:
                    result['ocr_text'] = documento.texto_extraido
                    result['warnings'].append("Usando texto previamente extraído")
            
            # Etapa 3: Indexação e Categorização
            if result['ocr_text']:
                result['processing_steps'].append('indexing')
                index_result = self._index_document(documento)
                
                if index_result.get('success'):
                    result['keywords'] = index_result.get('keywords', [])
                    result['categories'] = index_result.get('categories', [])
                    result['metadata'].update(index_result.get('metadata', {}))
                else:
                    result['errors'].extend(index_result.get('errors', []))
            
            # Etapa 4: Finalização
            result['processing_steps'].append('finalization')
            self._finalize_processing(documento, result)
            
            # Determinar sucesso geral
            result['success'] = len(result['errors']) == 0 or bool(result['ocr_text'])
            
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento do documento {documento.id}: {str(e)}")
            result['errors'].append(f"Erro geral: {str(e)}")
            return result
    
    def _analyze_quality(self, documento) -> Dict:
        """Analisa qualidade do documento"""
        try:
            # Usar caminho temporário para análise
            if hasattr(documento.arquivo, 'path'):
                file_path = documento.arquivo.path
            else:
                # Para arquivos em storage remoto, criar arquivo temporário
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=documento.extensao) as temp_file:
                    for chunk in documento.arquivo.chunks():
                        temp_file.write(chunk)
                    temp_file.flush()
                    file_path = temp_file.name
                
                try:
                    quality_result = self.quality_service.assess_document_quality(file_path)
                finally:
                    os.unlink(file_path)
                
                return quality_result
            
            return self.quality_service.assess_document_quality(file_path)
            
        except Exception as e:
            logger.error(f"Erro na análise de qualidade: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _extract_text(self, documento) -> Dict:
        """Extrai texto usando OCR"""
        try:
            return self.ocr_service.extract_text_from_document(documento)
        except Exception as e:
            logger.error(f"Erro na extração de texto: {str(e)}")
            return {'success': False, 'errors': [str(e)]}
    
    def _index_document(self, documento) -> Dict:
        """Indexa documento para busca"""
        try:
            return self.indexing_service.index_document(documento)
        except Exception as e:
            logger.error(f"Erro na indexação: {str(e)}")
            return {'success': False, 'errors': [str(e)]}
    
    def _finalize_processing(self, documento, result: Dict):
        """Finaliza o processamento do documento"""
        try:
            # Atualizar metadados do documento
            if result.get('quality_assessment', {}).get('success'):
                quality = result['quality_assessment']
                # Salvar informações de qualidade como JSON no documento se houver campo
                # Por enquanto, apenas loggar
                logger.info(f"Documento {documento.id} - Qualidade: {quality.get('quality_level', 'unknown')}")
            
            # Marcar como processado
            documento.indexado = bool(result['ocr_text'])
            documento.save()
            
        except Exception as e:
            logger.error(f"Erro na finalização: {str(e)}")
            result['warnings'].append(f"Erro na finalização: {str(e)}")

    def search_documents(self, query: str, protocolo=None) -> List:
        """
        Busca documentos usando o serviço de indexação
        
        Args:
            query: Texto de busca
            protocolo: Protocolo específico (opcional)
            
        Returns:
            list: Documentos encontrados
        """
        try:
            filters = {}
            if protocolo:
                filters['protocolo_id'] = protocolo.id
            
            return self.indexing_service.search_documents(query, filters)
            
        except Exception as e:
            logger.error(f"Erro na busca: {str(e)}")
            return []
    
    def get_document_statistics(self, protocolo=None) -> Dict:
        """
        Obtém estatísticas dos documentos processados
        
        Args:
            protocolo: Protocolo específico (opcional)
            
        Returns:
            dict: Estatísticas detalhadas
        """
        from ..models import DocumentoProtocolo
        
        try:
            # Filtrar por protocolo se especificado
            base_query = DocumentoProtocolo.objects.all()
            if protocolo:
                base_query = base_query.filter(protocolo=protocolo)
            
            total_docs = base_query.count()
            indexed_docs = base_query.filter(indexado=True).count()
            
            stats = {
                'total_documents': total_docs,
                'indexed_documents': indexed_docs,
                'pending_documents': total_docs - indexed_docs,
                'indexing_rate': (indexed_docs / total_docs * 100) if total_docs > 0 else 0,
                'by_type': {},
                'by_extension': {},
                'text_statistics': {
                    'total_text_length': 0,
                    'average_text_length': 0,
                    'documents_with_text': 0
                },
                'processing_capabilities': {
                    'ocr_enabled': True,
                    'quality_analysis_enabled': True,
                    'indexing_enabled': True,
                    'batch_processing_enabled': True
                }
            }
            
            # Estatísticas por tipo
            from django.db.models import Count
            by_type = base_query.values('tipo').annotate(count=Count('id'))
            for item in by_type:
                stats['by_type'][item['tipo']] = item['count']
            
            # Estatísticas por extensão
            by_ext = base_query.values('extensao').annotate(count=Count('id'))
            for item in by_ext:
                stats['by_extension'][item['extensao']] = item['count']
            
            # Estatísticas de texto
            docs_with_text = base_query.filter(
                indexado=True,
                texto_extraido__isnull=False
            ).exclude(texto_extraido='')
            
            if docs_with_text.exists():
                total_text_length = sum(len(doc.texto_extraido) for doc in docs_with_text)
                stats['text_statistics']['total_text_length'] = total_text_length
                stats['text_statistics']['documents_with_text'] = docs_with_text.count()
                stats['text_statistics']['average_text_length'] = total_text_length / docs_with_text.count()
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {str(e)}")
            return {'error': str(e)}
    
    def batch_process_documents(self, documentos: List) -> Dict:
        """
        Processa múltiplos documentos em lote
        
        Args:
            documentos: Lista de instâncias do DocumentoProtocolo
            
        Returns:
            dict: Resultado do processamento em lote
        """
        result = {
            'total_documents': len(documentos),
            'processed': 0,
            'failed': 0,
            'results': [],
            'summary': {
                'success_rate': 0,
                'avg_processing_time': 0,
                'total_text_extracted': 0,
                'quality_distribution': {}
            }
        }
        
        import time
        start_time = time.time()
        
        for documento in documentos:
            try:
                doc_start = time.time()
                doc_result = self.process_document_upload(documento)
                doc_end = time.time()
                
                doc_result['processing_time'] = doc_end - doc_start
                result['results'].append(doc_result)
                
                if doc_result['success']:
                    result['processed'] += 1
                else:
                    result['failed'] += 1
                
                # Atualizar estatísticas
                if doc_result.get('quality_assessment', {}).get('success'):
                    quality_level = doc_result['quality_assessment'].get('quality_level', 'unknown')
                    result['summary']['quality_distribution'][quality_level] = \
                        result['summary']['quality_distribution'].get(quality_level, 0) + 1
                
                if doc_result.get('ocr_text'):
                    result['summary']['total_text_extracted'] += len(doc_result['ocr_text'])
                
            except Exception as e:
                logger.error(f"Erro no processamento em lote do documento {documento.id}: {str(e)}")
                result['failed'] += 1
                result['results'].append({
                    'success': False,
                    'document_id': documento.id,
                    'errors': [str(e)]
                })
        
        # Calcular estatísticas finais
        total_time = time.time() - start_time
        result['summary']['success_rate'] = (result['processed'] / result['total_documents'] * 100) if result['total_documents'] > 0 else 0
        result['summary']['avg_processing_time'] = total_time / result['total_documents'] if result['total_documents'] > 0 else 0
        result['total_processing_time'] = total_time
        
        return result
    
    def _process_digitization(self, file_path: str, output_format: str) -> Dict[str, Any]:
        """
        Processa a digitalização do documento
        """
        try:
            # Simula processamento de digitalização
            output_path = self._generate_output_path(file_path, output_format)
            
            # Copia o arquivo original como se fosse digitalizado
            import shutil
            shutil.copy2(file_path, output_path)
            
            # Extrai metadados
            metadata = self._extract_document_metadata(file_path)
            
            # Calcula score de qualidade
            quality_score = self._calculate_quality_score(file_path)
            
            return {
                'output_path': output_path,
                'metadata': metadata,
                'quality_score': quality_score
            }
            
        except Exception as e:
            logger.error(f"Erro no processamento de digitalização: {str(e)}")
            return {}
    
    def _generate_output_path(self, original_path: str, output_format: str) -> str:
        """
        Gera caminho para arquivo de saída
        """
        base_name = os.path.splitext(os.path.basename(original_path))[0]
        output_dir = os.path.join(settings.MEDIA_ROOT, 'digitized_documents')
        
        # Cria diretório se não existir
        os.makedirs(output_dir, exist_ok=True)
        
        return os.path.join(output_dir, f"{base_name}_digitized.{output_format}")
    
    def _extract_document_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extrai metadados do documento
        """
        try:
            stat = os.stat(file_path)
            
            return {
                'file_name': os.path.basename(file_path),
                'file_size': stat.st_size,
                'file_size_mb': round(stat.st_size / (1024 * 1024), 2),
                'file_extension': os.path.splitext(file_path)[1].lower(),
                'created_date': stat.st_ctime,
                'modified_date': stat.st_mtime,
                'digitization_date': stat.st_mtime,
            }
            
        except Exception as e:
            logger.error(f"Erro ao extrair metadados: {str(e)}")
            return {}
    
    def _calculate_quality_score(self, file_path: str) -> float:
        """
        Calcula score de qualidade da digitalização
        """
        try:
            # Simula cálculo de qualidade baseado no tamanho do arquivo
            file_size = os.path.getsize(file_path)
            
            # Score baseado no tamanho (arquivos maiores tendem a ter melhor qualidade)
            if file_size > 5 * 1024 * 1024:  # > 5MB
                return 0.95
            elif file_size > 1 * 1024 * 1024:  # > 1MB
                return 0.85
            elif file_size > 500 * 1024:  # > 500KB
                return 0.75
            else:
                return 0.60
                
        except Exception as e:
            logger.error(f"Erro ao calcular qualidade: {str(e)}")
            return 0.50
    
    def batch_digitize(self, file_paths: list, output_format: str = 'pdf') -> Dict[str, Any]:
        """
        Digitaliza múltiplos documentos em lote
        """
        results = {
            'success': [],
            'errors': [],
            'total_files': len(file_paths),
            'processed_files': 0
        }
        
        for file_path in file_paths:
            try:
                result = self.digitize_document(file_path, output_format)
                
                if result.get('success'):
                    results['success'].append(result)
                else:
                    results['errors'].append({
                        'file': file_path,
                        'error': result.get('error', 'Erro desconhecido')
                    })
                
                results['processed_files'] += 1
                
            except Exception as e:
                results['errors'].append({
                    'file': file_path,
                    'error': str(e)
                })
                results['processed_files'] += 1
        
        return results
    
    def optimize_document(self, file_path: str, optimization_level: str = 'medium') -> Dict[str, Any]:
        """
        Otimiza documento digitalizado
        """
        try:
            if not os.path.exists(file_path):
                return {'error': 'Arquivo não encontrado'}
            
            # Simula otimização
            optimized_path = self._generate_optimized_path(file_path, optimization_level)
            
            # Copia arquivo como se fosse otimizado
            import shutil
            shutil.copy2(file_path, optimized_path)
            
            # Calcula redução de tamanho
            original_size = os.path.getsize(file_path)
            optimized_size = os.path.getsize(optimized_path)
            reduction_percentage = ((original_size - optimized_size) / original_size) * 100
            
            return {
                'success': True,
                'original_file': file_path,
                'optimized_file': optimized_path,
                'original_size': original_size,
                'optimized_size': optimized_size,
                'reduction_percentage': round(reduction_percentage, 2),
                'optimization_level': optimization_level
            }
            
        except Exception as e:
            logger.error(f"Erro ao otimizar documento {file_path}: {str(e)}")
            return {'error': str(e)}
    
    def _generate_optimized_path(self, original_path: str, optimization_level: str) -> str:
        """
        Gera caminho para arquivo otimizado
        """
        base_name = os.path.splitext(os.path.basename(original_path))[0]
        output_dir = os.path.join(settings.MEDIA_ROOT, 'optimized_documents')
        
        # Cria diretório se não existir
        os.makedirs(output_dir, exist_ok=True)
        
        return os.path.join(output_dir, f"{base_name}_optimized_{optimization_level}.pdf")


# Instância global do serviço
digitization_service = DigitizationService()
