#!/usr/bin/env python
"""
Serviços avançados para o módulo de peticionamento
Inclui: validações avançadas, integrações externas, workflow completo
"""

import re
import requests
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import PeticaoEletronica, TipoPeticao, AnexoPeticao, InteracaoPeticao, RespostaPeticao
from datetime import datetime, timedelta
import hashlib
import uuid

logger = logging.getLogger(__name__)


class ValidacaoAvancadaService:
    """Serviço para validações avançadas de petições"""
    
    def __init__(self):
        self.cpf_pattern = r'^\d{3}\.\d{3}\.\d{3}-\d{2}$'
        self.cnpj_pattern = r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'
        self.email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        self.phone_pattern = r'^\(?\d{2,3}\)?\s?\d{4,5}-?\d{4}$'
        self.cep_pattern = r'^\d{5}-?\d{3}$'
    
    def validar_cpf(self, cpf: str) -> Dict[str, Any]:
        """Valida CPF com algoritmo oficial"""
        try:
            # Remove caracteres não numéricos
            cpf_limpo = re.sub(r'[^\d]', '', cpf)
            
            if len(cpf_limpo) != 11:
                return {'valido': False, 'erro': 'CPF deve ter 11 dígitos'}
            
            # Verifica se todos os dígitos são iguais
            if cpf_limpo == cpf_limpo[0] * 11:
                return {'valido': False, 'erro': 'CPF inválido (dígitos iguais)'}
            
            # Calcula primeiro dígito verificador
            soma = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
            resto = soma % 11
            digito1 = 0 if resto < 2 else 11 - resto
            
            # Calcula segundo dígito verificador
            soma = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
            resto = soma % 11
            digito2 = 0 if resto < 2 else 11 - resto
            
            # Verifica se os dígitos calculados são iguais aos fornecidos
            if int(cpf_limpo[9]) == digito1 and int(cpf_limpo[10]) == digito2:
                return {'valido': True, 'cpf_limpo': cpf_limpo}
            else:
                return {'valido': False, 'erro': 'CPF inválido'}
                
        except Exception as e:
            logger.error(f"Erro na validação de CPF: {e}")
            return {'valido': False, 'erro': 'Erro interno na validação'}
    
    def validar_cnpj(self, cnpj: str) -> Dict[str, Any]:
        """Valida CNPJ com algoritmo oficial"""
        try:
            # Remove caracteres não numéricos
            cnpj_limpo = re.sub(r'[^\d]', '', cnpj)
            
            if len(cnpj_limpo) != 14:
                return {'valido': False, 'erro': 'CNPJ deve ter 14 dígitos'}
            
            # Verifica se todos os dígitos são iguais
            if cnpj_limpo == cnpj_limpo[0] * 14:
                return {'valido': False, 'erro': 'CNPJ inválido (dígitos iguais)'}
            
            # Pesos para cálculo dos dígitos verificadores
            pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            
            # Calcula primeiro dígito verificador
            soma = sum(int(cnpj_limpo[i]) * pesos1[i] for i in range(12))
            resto = soma % 11
            digito1 = 0 if resto < 2 else 11 - resto
            
            # Calcula segundo dígito verificador
            soma = sum(int(cnpj_limpo[i]) * pesos2[i] for i in range(13))
            resto = soma % 11
            digito2 = 0 if resto < 2 else 11 - resto
            
            # Verifica se os dígitos calculados são iguais aos fornecidos
            if int(cnpj_limpo[12]) == digito1 and int(cnpj_limpo[13]) == digito2:
                return {'valido': True, 'cnpj_limpo': cnpj_limpo}
            else:
                return {'valido': False, 'erro': 'CNPJ inválido'}
                
        except Exception as e:
            logger.error(f"Erro na validação de CNPJ: {e}")
            return {'valido': False, 'erro': 'Erro interno na validação'}
    
    def validar_email(self, email: str) -> Dict[str, Any]:
        """Valida formato de email"""
        if not email:
            return {'valido': True, 'email': ''}
        
        if re.match(self.email_pattern, email):
            return {'valido': True, 'email': email.lower()}
        else:
            return {'valido': False, 'erro': 'Formato de email inválido'}
    
    def validar_telefone(self, telefone: str) -> Dict[str, Any]:
        """Valida formato de telefone brasileiro"""
        if not telefone:
            return {'valido': True, 'telefone': ''}
        
        # Remove caracteres não numéricos
        telefone_limpo = re.sub(r'[^\d]', '', telefone)
        
        # Verifica se tem 10 ou 11 dígitos (com DDD)
        if len(telefone_limpo) in [10, 11]:
            return {'valido': True, 'telefone': telefone_limpo}
        else:
            return {'valido': False, 'erro': 'Telefone deve ter 10 ou 11 dígitos'}
    
    def validar_cep(self, cep: str) -> Dict[str, Any]:
        """Valida formato de CEP"""
        if not cep:
            return {'valido': True, 'cep': ''}
        
        cep_limpo = re.sub(r'[^\d]', '', cep)
        
        if len(cep_limpo) == 8:
            return {'valido': True, 'cep': cep_limpo}
        else:
            return {'valido': False, 'erro': 'CEP deve ter 8 dígitos'}
    
    def validar_peticao_completa(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        """Valida todos os campos de uma petição"""
        erros = []
        avisos = []
        dados_validados = {}
        
        # Validar CPF/CNPJ do peticionário
        documento = dados.get('peticionario_documento', '')
        if documento:
            if len(re.sub(r'[^\d]', '', documento)) == 11:
                resultado = self.validar_cpf(documento)
                if not resultado['valido']:
                    erros.append(f"CPF do peticionário: {resultado['erro']}")
                else:
                    dados_validados['peticionario_documento'] = resultado['cpf_limpo']
            elif len(re.sub(r'[^\d]', '', documento)) == 14:
                resultado = self.validar_cnpj(documento)
                if not resultado['valido']:
                    erros.append(f"CNPJ do peticionário: {resultado['erro']}")
                else:
                    dados_validados['peticionario_documento'] = resultado['cnpj_limpo']
            else:
                erros.append("Documento do peticionário deve ser CPF ou CNPJ válido")
        
        # Validar email
        email = dados.get('peticionario_email', '')
        if email:
            resultado = self.validar_email(email)
            if not resultado['valido']:
                erros.append(f"Email: {resultado['erro']}")
            else:
                dados_validados['peticionario_email'] = resultado['email']
        
        # Validar telefone
        telefone = dados.get('peticionario_telefone', '')
        if telefone:
            resultado = self.validar_telefone(telefone)
            if not resultado['valido']:
                erros.append(f"Telefone: {resultado['erro']}")
            else:
                dados_validados['peticionario_telefone'] = resultado['telefone']
        
        # Validar CEP
        cep = dados.get('peticionario_cep', '')
        if cep:
            resultado = self.validar_cep(cep)
            if not resultado['valido']:
                erros.append(f"CEP: {resultado['erro']}")
            else:
                dados_validados['peticionario_cep'] = resultado['cep']
        
        # Validar CNPJ da empresa (se fornecido)
        empresa_cnpj = dados.get('empresa_cnpj', '')
        if empresa_cnpj:
            resultado = self.validar_cnpj(empresa_cnpj)
            if not resultado['valido']:
                erros.append(f"CNPJ da empresa: {resultado['erro']}")
            else:
                dados_validados['empresa_cnpj'] = resultado['cnpj_limpo']
        
        # Validar campos obrigatórios
        campos_obrigatorios = ['peticionario_nome', 'assunto', 'descricao']
        for campo in campos_obrigatorios:
            valor = dados.get(campo, '').strip()
            if not valor:
                erros.append(f"Campo obrigatório: {campo}")
            else:
                dados_validados[campo] = valor
        
        # Validar valor da causa (se fornecido)
        valor_causa = dados.get('valor_causa')
        if valor_causa is not None:
            try:
                valor = float(valor_causa)
                if valor < 0:
                    erros.append("Valor da causa não pode ser negativo")
                elif valor > 999999999.99:
                    erros.append("Valor da causa muito alto")
                else:
                    dados_validados['valor_causa'] = valor
            except (ValueError, TypeError):
                erros.append("Valor da causa deve ser um número válido")
        
        # Verificar duplicatas
        if documento:
            peticoes_existentes = PeticaoEletronica.objects.filter(
                peticionario_documento=dados_validados.get('peticionario_documento', documento),
                assunto__iexact=dados.get('assunto', ''),
                criado_em__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            if peticoes_existentes > 0:
                avisos.append(f"Encontradas {peticoes_existentes} petições similares nos últimos 30 dias")
        
        return {
            'valido': len(erros) == 0,
            'erros': erros,
            'avisos': avisos,
            'dados_validados': dados_validados
        }


class IntegracaoExternaService:
    """Serviço para integrações com sistemas externos"""
    
    def __init__(self):
        self.api_timeout = 30
        self.max_retries = 3
    
    def consultar_receita_federal(self, cnpj: str) -> Dict[str, Any]:
        """Consulta dados da Receita Federal (simulado)"""
        try:
            # Simulação de consulta à Receita Federal
            # Em produção, seria uma chamada real à API da RF
            
            cnpj_limpo = re.sub(r'[^\d]', '', cnpj)
            
            # Simular resposta baseada no CNPJ
            if cnpj_limpo.startswith('00'):
                return {
                    'sucesso': True,
                    'dados': {
                        'razao_social': 'Empresa Teste Ltda',
                        'nome_fantasia': 'Empresa Teste',
                        'cnpj': cnpj_limpo,
                        'situacao': 'ATIVA',
                        'data_abertura': '2020-01-01',
                        'porte': 'ME',
                        'natureza_juridica': '213-5 - Empresário Individual',
                        'endereco': {
                            'logradouro': 'Rua Teste, 123',
                            'bairro': 'Centro',
                            'municipio': 'São Paulo',
                            'uf': 'SP',
                            'cep': '01234-567'
                        }
                    }
                }
            else:
                return {
                    'sucesso': False,
                    'erro': 'CNPJ não encontrado ou inativo'
                }
                
        except Exception as e:
            logger.error(f"Erro na consulta à Receita Federal: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def consultar_serasa(self, documento: str) -> Dict[str, Any]:
        """Consulta dados do Serasa (simulado)"""
        try:
            # Simulação de consulta ao Serasa
            documento_limpo = re.sub(r'[^\d]', '', documento)
            
            # Simular resposta baseada no documento
            if len(documento_limpo) == 11:  # CPF
                return {
                    'sucesso': True,
                    'dados': {
                        'nome': 'João da Silva',
                        'cpf': documento_limpo,
                        'situacao': 'REGULAR',
                        'score': 850,
                        'restricoes': []
                    }
                }
            elif len(documento_limpo) == 14:  # CNPJ
                return {
                    'sucesso': True,
                    'dados': {
                        'razao_social': 'Empresa Teste Ltda',
                        'cnpj': documento_limpo,
                        'situacao': 'REGULAR',
                        'score': 750,
                        'restricoes': []
                    }
                }
            else:
                return {
                    'sucesso': False,
                    'erro': 'Documento inválido'
                }
                
        except Exception as e:
            logger.error(f"Erro na consulta ao Serasa: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def consultar_cep(self, cep: str) -> Dict[str, Any]:
        """Consulta endereço pelo CEP usando API externa"""
        try:
            cep_limpo = re.sub(r'[^\d]', '', cep)
            
            # Usar API ViaCEP (gratuita)
            url = f"https://viacep.com.br/ws/{cep_limpo}/json/"
            
            response = requests.get(url, timeout=self.api_timeout)
            
            if response.status_code == 200:
                dados = response.json()
                
                if 'erro' not in dados:
                    return {
                        'sucesso': True,
                        'dados': {
                            'cep': dados.get('cep'),
                            'logradouro': dados.get('logradouro'),
                            'bairro': dados.get('bairro'),
                            'municipio': dados.get('localidade'),
                            'uf': dados.get('uf'),
                            'complemento': dados.get('complemento')
                        }
                    }
                else:
                    return {
                        'sucesso': False,
                        'erro': 'CEP não encontrado'
                    }
            else:
                return {
                    'sucesso': False,
                    'erro': f'Erro na API: {response.status_code}'
                }
                
        except requests.exceptions.Timeout:
            return {
                'sucesso': False,
                'erro': 'Timeout na consulta do CEP'
            }
        except Exception as e:
            logger.error(f"Erro na consulta do CEP: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno na consulta'
            }
    
    def enviar_notificacao_sms(self, telefone: str, mensagem: str) -> Dict[str, Any]:
        """Envia notificação SMS (simulado)"""
        try:
            # Simulação de envio de SMS
            # Em produção, seria integração com provedor de SMS
            
            telefone_limpo = re.sub(r'[^\d]', '', telefone)
            
            if len(telefone_limpo) in [10, 11]:
                return {
                    'sucesso': True,
                    'id_mensagem': str(uuid.uuid4()),
                    'telefone': telefone_limpo,
                    'status': 'ENVIADO'
                }
            else:
                return {
                    'sucesso': False,
                    'erro': 'Telefone inválido'
                }
                
        except Exception as e:
            logger.error(f"Erro no envio de SMS: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno no envio'
            }
    
    def enviar_notificacao_email(self, email: str, assunto: str, mensagem: str) -> Dict[str, Any]:
        """Envia notificação por email (simulado)"""
        try:
            # Simulação de envio de email
            # Em produção, seria integração com provedor de email
            
            if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                return {
                    'sucesso': True,
                    'id_mensagem': str(uuid.uuid4()),
                    'email': email,
                    'status': 'ENVIADO'
                }
            else:
                return {
                    'sucesso': False,
                    'erro': 'Email inválido'
                }
                
        except Exception as e:
            logger.error(f"Erro no envio de email: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno no envio'
            }


class WorkflowPeticionamentoService:
    """Serviço para gerenciar workflow completo de peticionamento"""
    
    def __init__(self):
        self.validacao_service = ValidacaoAvancadaService()
        self.integracao_service = IntegracaoExternaService()
    
    def processar_nova_peticao(self, dados: Dict[str, Any], usuario=None) -> Dict[str, Any]:
        """Processa uma nova petição completa"""
        try:
            with transaction.atomic():
                # 1. Validar dados
                validacao = self.validacao_service.validar_peticao_completa(dados)
                
                if not validacao['valido']:
                    return {
                        'sucesso': False,
                        'erros': validacao['erros'],
                        'avisos': validacao['avisos']
                    }
                
                # 2. Enriquecer dados com consultas externas
                dados_enriquecidos = self._enriquecer_dados(dados, validacao['dados_validados'])
                
                # 3. Criar petição
                peticao = self._criar_peticao(dados_enriquecidos, usuario)
                
                # 4. Processar anexos (se houver)
                if 'anexos' in dados:
                    self._processar_anexos(peticao, dados['anexos'])
                
                # 5. Enviar notificações
                self._enviar_notificacoes(peticao)
                
                # 6. Criar interação inicial
                InteracaoPeticao.objects.create(
                    peticao=peticao,
                    tipo='CRIACAO',
                    descricao='Petição criada e validada automaticamente',
                    usuario=usuario
                )
                
                return {
                    'sucesso': True,
                    'peticao_id': peticao.id,
                    'numero_peticao': peticao.numero_peticao,
                    'avisos': validacao['avisos'],
                    'dados_enriquecidos': dados_enriquecidos
                }
                
        except Exception as e:
            logger.error(f"Erro no processamento da petição: {e}")
            return {
                'sucesso': False,
                'erro': 'Erro interno no processamento'
            }
    
    def _enriquecer_dados(self, dados_originais: Dict, dados_validados: Dict) -> Dict[str, Any]:
        """Enriquece dados com consultas externas"""
        dados_enriquecidos = dados_validados.copy()
        
        # Consultar CEP se fornecido
        cep = dados_validados.get('peticionario_cep')
        if cep:
            resultado_cep = self.integracao_service.consultar_cep(cep)
            if resultado_cep['sucesso']:
                dados_enriquecidos['endereco_completo'] = resultado_cep['dados']
        
        # Consultar dados da empresa se CNPJ fornecido
        empresa_cnpj = dados_validados.get('empresa_cnpj')
        if empresa_cnpj:
            resultado_rf = self.integracao_service.consultar_receita_federal(empresa_cnpj)
            if resultado_rf['sucesso']:
                dados_enriquecidos['dados_empresa'] = resultado_rf['dados']
        
        # Consultar Serasa para peticionário
        documento = dados_validados.get('peticionario_documento')
        if documento:
            resultado_serasa = self.integracao_service.consultar_serasa(documento)
            if resultado_serasa['sucesso']:
                dados_enriquecidos['dados_serasa'] = resultado_serasa['dados']
        
        return dados_enriquecidos
    
    def _criar_peticao(self, dados: Dict[str, Any], usuario) -> PeticaoEletronica:
        """Cria a petição no banco de dados"""
        # Mapear dados para o modelo
        peticao_data = {
            'tipo_peticao_id': dados.get('tipo_peticao_id'),
            'assunto': dados['assunto'],
            'descricao': dados['descricao'],
            'peticionario_nome': dados['peticionario_nome'],
            'peticionario_documento': dados['peticionario_documento'],
            'peticionario_email': dados.get('peticionario_email', ''),
            'peticionario_telefone': dados.get('peticionario_telefone', ''),
            'peticionario_endereco': dados.get('peticionario_endereco', ''),
            'peticionario_cep': dados.get('peticionario_cep', ''),
            'peticionario_cidade': dados.get('peticionario_cidade', ''),
            'peticionario_uf': dados.get('peticionario_uf', ''),
            'empresa_nome': dados.get('empresa_nome', ''),
            'empresa_cnpj': dados.get('empresa_cnpj', ''),
            'empresa_endereco': dados.get('empresa_endereco', ''),
            'empresa_telefone': dados.get('empresa_telefone', ''),
            'empresa_email': dados.get('empresa_email', ''),
            'valor_causa': dados.get('valor_causa'),
            'data_fato': dados.get('data_fato'),
            'observacoes': dados.get('observacoes', ''),
            'usuario_criacao': usuario,
            'status': 'ENVIADA',
            'data_envio': timezone.now(),
            'data_recebimento': timezone.now(),
        }
        
        # Adicionar dados enriquecidos como dados específicos
        dados_especificos = {}
        if 'endereco_completo' in dados:
            dados_especificos['endereco_completo'] = dados['endereco_completo']
        if 'dados_empresa' in dados:
            dados_especificos['dados_empresa'] = dados['dados_empresa']
        if 'dados_serasa' in dados:
            dados_especificos['dados_serasa'] = dados['dados_serasa']
        
        peticao_data['dados_especificos'] = dados_especificos
        
        return PeticaoEletronica.objects.create(**peticao_data)
    
    def _processar_anexos(self, peticao: PeticaoEletronica, anexos: List[Dict]) -> None:
        """Processa anexos da petição"""
        for anexo_data in anexos:
            AnexoPeticao.objects.create(
                peticao=peticao,
                nome_arquivo=anexo_data.get('nome'),
                arquivo=anexo_data.get('arquivo'),
                descricao=anexo_data.get('descricao', ''),
                tipo=anexo_data.get('tipo', 'OUTROS')
            )
    
    def _enviar_notificacoes(self, peticao: PeticaoEletronica) -> None:
        """Envia notificações sobre a petição"""
        # Notificar peticionário por email
        if peticao.peticionario_email and peticao.notificar_peticionario:
            self.integracao_service.enviar_notificacao_email(
                peticao.peticionario_email,
                f"Petição {peticao.numero_peticao} recebida",
                f"Sua petição foi recebida e está sendo processada. Número: {peticao.numero_peticao}"
            )
        
        # Notificar por SMS se configurado
        if peticao.peticionario_telefone and peticao.tipo_peticao.notificar_sms:
            self.integracao_service.enviar_notificacao_sms(
                peticao.peticionario_telefone,
                f"Petição {peticao.numero_peticao} recebida. Acompanhe pelo portal."
            )


# Instâncias globais dos serviços
validacao_service = ValidacaoAvancadaService()
integracao_service = IntegracaoExternaService()
workflow_service = WorkflowPeticionamentoService()
