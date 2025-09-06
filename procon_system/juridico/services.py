#!/usr/bin/env python
"""
Serviços avançados para o módulo jurídico
Inclui: assinatura digital completa, integrações avançadas
"""

import hashlib
import hmac
import base64
import json
import logging
import requests
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography import x509
from cryptography.x509.oid import NameOID
from .models import (
    ProcessoJuridico, AnalistaJuridico, RecursoAdministrativo, 
    ParecerJuridico, DocumentoJuridico
)
import uuid
import os
from django.db import transaction

logger = logging.getLogger(__name__)


class AssinaturaDigitalService:
    """Serviço para assinatura digital completa"""
    
    def __init__(self):
        self.algorithm = hashes.SHA256()
        self.key_size = 2048
        self.certificate_validity_days = 365
    
    def gerar_chave_privada(self) -> rsa.RSAPrivateKey:
        """Gera uma nova chave privada RSA"""
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=self.key_size
            )
            return private_key
        except Exception as e:
            logger.error(f"Erro ao gerar chave privada: {e}")
            raise
    
    def gerar_certificado_digital(self, nome: str, email: str, oab: str = None) -> Tuple[bytes, bytes]:
        """Gera certificado digital para analista jurídico"""
        try:
            # Gerar chave privada
            private_key = self.gerar_chave_privada()
            
            # Criar certificado
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "BR"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Amazonas"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "Manaus"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "PROCON-AM"),
                x509.NameAttribute(NameOID.COMMON_NAME, nome),
                x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
            ])
            
            if oab:
                subject = issuer = x509.Name([
                    x509.NameAttribute(NameOID.COUNTRY_NAME, "BR"),
                    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Amazonas"),
                    x509.NameAttribute(NameOID.LOCALITY_NAME, "Manaus"),
                    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "PROCON-AM"),
                    x509.NameAttribute(NameOID.COMMON_NAME, nome),
                    x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
                    x509.NameAttribute(NameOID.SERIAL_NUMBER, oab),
                ])
            
            cert = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                timezone.now()
            ).not_valid_after(
                timezone.now() + timedelta(days=self.certificate_validity_days)
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("procon.am.gov.br"),
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256())
            
            # Serializar chave privada e certificado
            private_key_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            certificate_pem = cert.public_bytes(serialization.Encoding.PEM)
            
            return private_key_pem, certificate_pem
            
        except Exception as e:
            logger.error(f"Erro ao gerar certificado digital: {e}")
            raise
    
    def assinar_documento(self, conteudo: str, chave_privada_pem: bytes) -> Dict[str, Any]:
        """Assina um documento digitalmente"""
        try:
            # Carregar chave privada
            private_key = load_pem_private_key(chave_privada_pem, password=None)
            
            # Calcular hash do conteúdo
            content_hash = hashlib.sha256(conteudo.encode('utf-8')).digest()
            
            # Assinar o hash
            signature = private_key.sign(
                content_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            # Codificar assinatura em base64
            signature_b64 = base64.b64encode(signature).decode('utf-8')
            
            # Criar metadados da assinatura
            assinatura_data = {
                'algoritmo': 'RSA-SHA256',
                'assinatura': signature_b64,
                'hash_conteudo': base64.b64encode(content_hash).decode('utf-8'),
                'timestamp': timezone.now().isoformat(),
                'versao': '1.0'
            }
            
            return assinatura_data
            
        except Exception as e:
            logger.error(f"Erro ao assinar documento: {e}")
            raise
    
    def verificar_assinatura(self, conteudo: str, assinatura_data: Dict[str, Any], certificado_pem: bytes) -> bool:
        """Verifica a assinatura digital de um documento"""
        try:
            # Carregar certificado
            cert = x509.load_pem_x509_certificate(certificado_pem)
            public_key = cert.public_key()
            
            # Decodificar assinatura
            signature = base64.b64decode(assinatura_data['assinatura'])
            
            # Calcular hash do conteúdo
            content_hash = hashlib.sha256(conteudo.encode('utf-8')).digest()
            
            # Verificar assinatura
            public_key.verify(
                signature,
                content_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao verificar assinatura: {e}")
            return False
    
    def assinar_parecer_juridico(self, parecer: ParecerJuridico, analista: AnalistaJuridico) -> Dict[str, Any]:
        """Assina um parecer jurídico digitalmente"""
        try:
            # Verificar se analista tem certificado
            if not hasattr(analista, 'certificado_digital') or not analista.certificado_digital:
                raise ValueError("Analista não possui certificado digital")
            
            # Preparar conteúdo para assinatura
            conteudo = f"""
            PARECER JURÍDICO
            Número: {parecer.numero}
            Processo: {parecer.processo.numero}
            Analista: {analista.user.get_full_name()}
            OAB: {analista.oab}
            Data: {parecer.data_emissao}
            
            Conclusão: {parecer.conclusao}
            
            Fundamentação:
            {parecer.fundamentacao}
            """
            
            # Assinar documento
            assinatura = self.assinar_documento(
                conteudo, 
                analista.chave_privada_digital
            )
            
            # Salvar assinatura no parecer
            parecer.assinatura_digital = assinatura
            parecer.assinado_por = analista
            parecer.data_assinatura = timezone.now()
            parecer.save()
            
            return {
                'sucesso': True,
                'assinatura': assinatura,
                'hash_documento': assinatura['hash_conteudo']
            }
            
        except Exception as e:
            logger.error(f"Erro ao assinar parecer: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def verificar_parecer_assinalado(self, parecer: ParecerJuridico) -> Dict[str, Any]:
        """Verifica se um parecer está corretamente assinado"""
        try:
            if not parecer.assinatura_digital:
                return {
                    'valido': False,
                    'erro': 'Parecer não possui assinatura digital'
                }
            
            if not parecer.assinado_por or not parecer.assinado_por.certificado_digital:
                return {
                    'valido': False,
                    'erro': 'Assinante não possui certificado digital'
                }
            
            # Preparar conteúdo para verificação
            conteudo = f"""
            PARECER JURÍDICO
            Número: {parecer.numero}
            Processo: {parecer.processo.numero}
            Analista: {parecer.assinado_por.user.get_full_name()}
            OAB: {parecer.assinado_por.oab}
            Data: {parecer.data_emissao}
            
            Conclusão: {parecer.conclusao}
            
            Fundamentação:
            {parecer.fundamentacao}
            """
            
            # Verificar assinatura
            valido = self.verificar_assinatura(
                conteudo,
                parecer.assinatura_digital,
                parecer.assinado_por.certificado_digital
            )
            
            return {
                'valido': valido,
                'assinante': parecer.assinado_por.user.get_full_name(),
                'data_assinatura': parecer.data_assinatura,
                'oab': parecer.assinado_por.oab
            }
            
        except Exception as e:
            logger.error(f"Erro ao verificar parecer: {e}")
            return {
                'valido': False,
                'erro': str(e)
            }


class IntegracaoJuridicaAvancadaService:
    """Serviço para integrações jurídicas avançadas"""
    
    def __init__(self):
        self.api_timeout = 30
        self.max_retries = 3
    
    def consultar_processo_tj(self, numero_processo: str) -> Dict[str, Any]:
        """Consulta processo no Tribunal de Justiça (simulado)"""
        try:
            # Simulação de consulta ao TJ
            # Em produção, seria integração real com API do TJ
            
            if 'TJ' in numero_processo:
                return {
                    'sucesso': True,
                    'dados': {
                        'numero': numero_processo,
                        'classe': 'Ação Civil Pública',
                        'assunto': 'Direito do Consumidor',
                        'status': 'Em Andamento',
                        'vara': 'Vara Cível',
                        'comarca': 'Manaus',
                        'partes': {
                            'autor': 'PROCON-AM',
                            'reu': 'Empresa Reclamada Ltda'
                        },
                        'movimentacoes': [
                            {
                                'data': '2024-01-15',
                                'tipo': 'Distribuição',
                                'descricao': 'Processo distribuído'
                            }
                        ]
                    }
                }
            else:
                return {
                    'sucesso': False,
                    'erro': 'Processo não encontrado'
                }
                
        except Exception as e:
            logger.error(f"Erro na consulta ao TJ: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def consultar_legislacao(self, termo: str) -> Dict[str, Any]:
        """Consulta legislação aplicável (simulado)"""
        try:
            # Simulação de consulta à legislação
            # Em produção, seria integração com base de dados legislativa
            
            legislacoes = {
                'consumidor': [
                    {
                        'lei': 'Lei 8.078/1990',
                        'artigo': 'Art. 6º',
                        'titulo': 'Direitos Básicos do Consumidor',
                        'conteudo': 'São direitos básicos do consumidor...'
                    },
                    {
                        'lei': 'Lei 8.078/1990',
                        'artigo': 'Art. 39',
                        'titulo': 'Práticas Abusivas',
                        'conteudo': 'É vedado ao fornecedor de produtos ou serviços...'
                    }
                ],
                'multa': [
                    {
                        'lei': 'Lei 8.078/1990',
                        'artigo': 'Art. 56',
                        'titulo': 'Penalidades',
                        'conteudo': 'As infrações às normas de defesa do consumidor...'
                    }
                ]
            }
            
            resultados = []
            for categoria, leis in legislacoes.items():
                if termo.lower() in categoria:
                    resultados.extend(leis)
            
            return {
                'sucesso': True,
                'termo_busca': termo,
                'resultados': resultados,
                'total': len(resultados)
            }
            
        except Exception as e:
            logger.error(f"Erro na consulta à legislação: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def consultar_jurisprudencia(self, termo: str) -> Dict[str, Any]:
        """Consulta jurisprudência (simulado)"""
        try:
            # Simulação de consulta à jurisprudência
            # Em produção, seria integração com base de dados jurisprudencial
            
            jurisprudencias = {
                'consumidor': [
                    {
                        'tribunal': 'STJ',
                        'processo': 'REsp 123456/2023',
                        'relator': 'Min. Ricardo Villas Bôas Cueva',
                        'data': '2023-12-15',
                        'ementa': 'DIREITO DO CONSUMIDOR. PRÁTICA ABUSIVA...',
                        'decisao': 'NEGARAM PROVIMENTO'
                    }
                ],
                'multa': [
                    {
                        'tribunal': 'STJ',
                        'processo': 'REsp 789012/2023',
                        'relator': 'Min. Ricardo Villas Bôas Cueva',
                        'data': '2023-11-20',
                        'ementa': 'DIREITO DO CONSUMIDOR. MULTA ADMINISTRATIVA...',
                        'decisao': 'DERAM PROVIMENTO'
                    }
                ]
            }
            
            resultados = []
            for categoria, juris in jurisprudencias.items():
                if termo.lower() in categoria:
                    resultados.extend(juris)
            
            return {
                'sucesso': True,
                'termo_busca': termo,
                'resultados': resultados,
                'total': len(resultados)
            }
            
        except Exception as e:
            logger.error(f"Erro na consulta à jurisprudência: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def gerar_relatorio_juridico(self, processo: ProcessoJuridico) -> Dict[str, Any]:
        """Gera relatório jurídico completo do processo"""
        try:
            # Consultar dados do processo
            pareceres = ParecerJuridico.objects.filter(processo=processo).order_by('-data_emissao')
            recursos = RecursoAdministrativo.objects.filter(processo=processo).order_by('-data_protocolo')
            documentos = DocumentoJuridico.objects.filter(processo=processo).order_by('-data_upload')
            
            # Consultar legislação aplicável
            legislacao = self.consultar_legislacao('consumidor')
            
            # Consultar jurisprudência
            jurisprudencia = self.consultar_jurisprudencia('consumidor')
            
            # Montar relatório
            relatorio = {
                'processo': {
                    'numero': processo.numero,
                    'parte': processo.parte,
                    'assunto': processo.assunto,
                    'status': processo.status,
                    'valor_causa': float(processo.valor_causa) if processo.valor_causa else None,
                    'data_abertura': processo.data_abertura.isoformat(),
                    'analista': processo.analista.user.get_full_name() if processo.analista else None
                },
                'pareceres': [
                    {
                        'numero': p.numero,
                        'conclusao': p.conclusao,
                        'data_emissao': p.data_emissao.isoformat(),
                        'assinado': bool(p.assinatura_digital)
                    } for p in pareceres
                ],
                'recursos': [
                    {
                        'numero': r.numero_protocolo,
                        'tipo': r.tipo_recurso.nome,
                        'status': r.status,
                        'data_protocolo': r.data_protocolo.isoformat()
                    } for r in recursos
                ],
                'documentos': [
                    {
                        'nome': d.nome,
                        'tipo': d.tipo,
                        'data_upload': d.data_upload.isoformat()
                    } for d in documentos
                ],
                'legislacao_aplicavel': legislacao.get('resultados', []),
                'jurisprudencia': jurisprudencia.get('resultados', []),
                'estatisticas': {
                    'total_pareceres': pareceres.count(),
                    'total_recursos': recursos.count(),
                    'total_documentos': documentos.count(),
                    'dias_processo': (timezone.now() - processo.data_abertura).days
                }
            }
            
            return {
                'sucesso': True,
                'relatorio': relatorio,
                'gerado_em': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório jurídico: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }


class WorkflowJuridicoService:
    """Serviço para gerenciar workflow jurídico completo"""
    
    def __init__(self):
        self.assinatura_service = AssinaturaDigitalService()
        self.integracao_service = IntegracaoJuridicaAvancadaService()
    
    def processar_novo_processo(self, dados: Dict[str, Any], analista: AnalistaJuridico) -> Dict[str, Any]:
        """Processa um novo processo jurídico completo"""
        try:
            with transaction.atomic():
                # 1. Criar processo
                processo = ProcessoJuridico.objects.create(
                    parte=dados['parte'],
                    empresa_cnpj=dados.get('empresa_cnpj', ''),
                    assunto=dados['assunto'],
                    descricao=dados['descricao'],
                    valor_causa=dados.get('valor_causa'),
                    analista=analista,
                    criado_por=analista.user
                )
                
                # 2. Consultar dados externos
                dados_enriquecidos = self._enriquecer_dados_processo(processo, dados)
                
                # 3. Gerar parecer inicial se necessário
                if dados.get('gerar_parecer_inicial', False):
                    parecer = self._gerar_parecer_inicial(processo, analista, dados_enriquecidos)
                
                # 4. Configurar prazos
                self._configurar_prazos(processo)
                
                return {
                    'sucesso': True,
                    'processo_id': processo.id,
                    'numero_processo': processo.numero,
                    'dados_enriquecidos': dados_enriquecidos
                }
                
        except Exception as e:
            logger.error(f"Erro no processamento do processo: {e}")
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def _enriquecer_dados_processo(self, processo: ProcessoJuridico, dados: Dict[str, Any]) -> Dict[str, Any]:
        """Enriquece dados do processo com consultas externas"""
        dados_enriquecidos = {}
        
        # Consultar processo no TJ se número fornecido
        if 'numero_processo_tj' in dados:
            resultado_tj = self.integracao_service.consultar_processo_tj(dados['numero_processo_tj'])
            if resultado_tj['sucesso']:
                dados_enriquecidos['dados_tj'] = resultado_tj['dados']
        
        # Consultar legislação aplicável
        legislacao = self.integracao_service.consultar_legislacao('consumidor')
        if legislacao['sucesso']:
            dados_enriquecidos['legislacao'] = legislacao['resultados']
        
        # Consultar jurisprudência
        jurisprudencia = self.integracao_service.consultar_jurisprudencia('consumidor')
        if jurisprudencia['sucesso']:
            dados_enriquecidos['jurisprudencia'] = jurisprudencia['resultados']
        
        return dados_enriquecidos
    
    def _gerar_parecer_inicial(self, processo: ProcessoJuridico, analista: AnalistaJuridico, dados_enriquecidos: Dict[str, Any]) -> ParecerJuridico:
        """Gera parecer inicial do processo"""
        parecer = ParecerJuridico.objects.create(
            processo=processo,
            numero=f"PAR-{processo.numero}",
            tipo='INICIAL',
            conclusao='Processo em análise inicial',
            fundamentacao='Análise inicial do processo jurídico.',
            analista=analista,
            data_emissao=timezone.now()
        )
        
        # Assinar parecer digitalmente
        self.assinatura_service.assinar_parecer_juridico(parecer, analista)
        
        return parecer
    
    def _configurar_prazos(self, processo: ProcessoJuridico) -> None:
        """Configura prazos do processo"""
        # Definir prazo padrão de 30 dias
        processo.data_limite = timezone.now() + timedelta(days=30)
        processo.save()


# Instâncias globais dos serviços
assinatura_service = AssinaturaDigitalService()
integracao_service = IntegracaoJuridicaAvancadaService()
workflow_service = WorkflowJuridicoService()
