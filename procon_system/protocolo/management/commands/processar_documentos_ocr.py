#!/usr/bin/env python
"""
Comando para processar documentos com OCR e indexação
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from protocolo.models import DocumentoProtocolo, Protocolo
from protocolo.services import digitization_service, quality_service
from django.db import transaction
import time


class Command(BaseCommand):
    help = 'Processa documentos com OCR e indexação'

    def add_arguments(self, parser):
        parser.add_argument(
            '--protocolo',
            type=str,
            help='Número do protocolo específico para processar'
        )
        parser.add_argument(
            '--tipo',
            type=str,
            choices=['PETICAO', 'DOCUMENTO', 'COMPROVANTE', 'RESPOSTA', 'OUTROS'],
            help='Tipo de documento para processar'
        )
        parser.add_argument(
            '--nao-indexados',
            action='store_true',
            help='Processar apenas documentos não indexados'
        )
        parser.add_argument(
            '--forcar',
            action='store_true',
            help='Forçar reprocessamento de documentos já indexados'
        )
        parser.add_argument(
            '--limite',
            type=int,
            default=100,
            help='Limite de documentos para processar (padrão: 100)'
        )
        parser.add_argument(
            '--analisar-qualidade',
            action='store_true',
            help='Analisar qualidade dos documentos processados'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando processamento de documentos com OCR...')
        )

        # Construir queryset base
        queryset = DocumentoProtocolo.objects.all()

        # Filtrar por protocolo se especificado
        if options['protocolo']:
            try:
                protocolo = Protocolo.objects.get(numero=options['protocolo'])
                queryset = queryset.filter(protocolo=protocolo)
                self.stdout.write(f"📋 Processando documentos do protocolo: {options['protocolo']}")
            except Protocolo.DoesNotExist:
                raise CommandError(f'Protocolo {options["protocolo"]} não encontrado')

        # Filtrar por tipo se especificado
        if options['tipo']:
            queryset = queryset.filter(tipo=options['tipo'])
            self.stdout.write(f"📄 Processando documentos do tipo: {options['tipo']}")

        # Filtrar por status de indexação
        if options['nao_indexados']:
            queryset = queryset.filter(indexado=False)
            self.stdout.write("🔍 Processando apenas documentos não indexados")
        elif not options['forcar']:
            queryset = queryset.filter(indexado=False)
            self.stdout.write("🔍 Processando apenas documentos não indexados (use --forcar para reprocessar)")

        # Aplicar limite
        total_docs = queryset.count()
        if total_docs > options['limite']:
            queryset = queryset[:options['limite']]
            self.stdout.write(f"📊 Limitando processamento a {options['limite']} documentos")

        if total_docs == 0:
            self.stdout.write(
                self.style.WARNING('⚠️ Nenhum documento encontrado para processamento')
            )
            return

        self.stdout.write(f"📊 Total de documentos para processar: {total_docs}")

        # Processar documentos
        start_time = time.time()
        results = digitization_service.batch_process_documents(list(queryset))
        
        # Exibir resultados
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📈 RESULTADOS DO PROCESSAMENTO")
        self.stdout.write("="*60)
        self.stdout.write(f"Total processado: {results['total']}")
        self.stdout.write(f"Sucessos: {results['successful']}")
        self.stdout.write(f"Falhas: {results['failed']}")
        
        if results['failed'] > 0:
            self.stdout.write("\n❌ DOCUMENTOS COM FALHA:")
            for result in results['results']:
                if not result['result']['success']:
                    doc = DocumentoProtocolo.objects.get(id=result['document_id'])
                    self.stdout.write(f"  - {doc.titulo} (ID: {doc.id})")
                    for error in result['result']['errors']:
                        self.stdout.write(f"    Erro: {error}")

        # Estatísticas
        processing_time = time.time() - start_time
        self.stdout.write(f"\n⏱️ Tempo de processamento: {processing_time:.2f} segundos")
        
        if results['successful'] > 0:
            avg_time = processing_time / results['successful']
            self.stdout.write(f"⏱️ Tempo médio por documento: {avg_time:.2f} segundos")

        # Analisar qualidade se solicitado
        if options['analisar_qualidade'] and results['successful'] > 0:
            self.stdout.write("\n" + "="*60)
            self.stdout.write("🔍 ANÁLISE DE QUALIDADE")
            self.stdout.write("="*60)
            
            documentos_processados = DocumentoProtocolo.objects.filter(
                id__in=[r['document_id'] for r in results['results'] if r['result']['success']]
            )
            
            quality_scores = []
            for doc in documentos_processados:
                quality = quality_service.analyze_document_quality(doc)
                quality_scores.append(quality['quality_score'])
                
                self.stdout.write(f"\n📄 {doc.titulo} (ID: {doc.id})")
                self.stdout.write(f"  Pontuação: {quality['quality_score']}/100")
                self.stdout.write(f"  Tamanho do texto: {quality['text_length']} caracteres")
                
                if quality['issues']:
                    self.stdout.write("  ⚠️ Problemas detectados:")
                    for issue in quality['issues']:
                        self.stdout.write(f"    - {issue}")
                
                if quality['recommendations']:
                    self.stdout.write("  💡 Recomendações:")
                    for rec in quality['recommendations']:
                        self.stdout.write(f"    - {rec}")

            if quality_scores:
                avg_quality = sum(quality_scores) / len(quality_scores)
                self.stdout.write(f"\n📊 Qualidade média: {avg_quality:.1f}/100")

        # Estatísticas gerais
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📊 ESTATÍSTICAS GERAIS")
        self.stdout.write("="*60)
        
        try:
            stats = digitization_service.get_document_statistics()
            self.stdout.write(f"Total de documentos indexados: {stats['total_documents']}")
            self.stdout.write(f"Documentos com texto extraído: {stats['documents_with_text']}")
            self.stdout.write(f"Taxa de extração: {stats['extraction_rate']:.1f}%")
            self.stdout.write(f"Tamanho médio do texto: {stats['average_text_length']:.0f} caracteres")
        except Exception as e:
            self.stdout.write(f"Erro ao calcular estatísticas: {e}")
            self.stdout.write("Estatísticas não disponíveis")

        self.stdout.write(
            self.style.SUCCESS('\n✅ Processamento concluído com sucesso!')
        )
