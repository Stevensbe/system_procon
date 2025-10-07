from .models import Atendimento
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta
import requests
import json


class AtendimentoService:
    """Serviço para gerenciar atendimentos"""
    
    @staticmethod
    def criar_atendimento(dados, usuario):
        """Cria um novo atendimento"""
        try:
            atendimento = Atendimento.objects.create(
                atendente=usuario,
                consumidor_nome=dados['consumidor_nome'],
                consumidor_cpf=dados['consumidor_cpf'],
                consumidor_telefone=dados.get('consumidor_telefone', ''),
                consumidor_email=dados.get('consumidor_email', ''),
                tipo_atendimento=dados['tipo_atendimento'],
                observacoes=dados.get('observacoes', ''),
            )
            return {'sucesso': True, 'atendimento': atendimento}
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}
    
    @staticmethod
    def registrar_presencial(dados, usuario, reclamacao):
        """Cria atendimento presencial vinculado a uma reclamacao"""
        try:
            atendimento = Atendimento.objects.create(
                atendente=usuario,
                consumidor_nome=dados['consumidor_nome'],
                consumidor_cpf=dados['consumidor_cpf'],
                consumidor_telefone=dados.get('consumidor_telefone', ''),
                consumidor_email=dados.get('consumidor_email', ''),
                tipo_atendimento=dados.get('tipo_atendimento', 'RECLAMACAO'),
                canal_atendimento=dados.get('canal_atendimento', 'BALCAO'),
                observacoes=dados.get('observacoes', ''),
                reclamacao=reclamacao,
            )
            return {'sucesso': True, 'atendimento': atendimento}
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}

    @staticmethod
    def finalizar_atendimento(atendimento_id, resolucao, satisfacao=None):
        """Finaliza um atendimento"""
        try:
            atendimento = Atendimento.objects.get(id=atendimento_id)
            atendimento.status = 'FINALIZADO'
            atendimento.resolucao = resolucao
            if satisfacao:
                atendimento.satisfacao_consumidor = satisfacao
            atendimento.save()
            return {'sucesso': True}
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}


class ValidacaoService:
    """Serviço para validações"""
    
    @staticmethod
    def validar_cpf(cpf):
        """Valida CPF"""
        cpf = cpf.replace('.', '').replace('-', '')
        
        if len(cpf) != 11:
            return False
        
        # Verificar se todos os dígitos são iguais
        if cpf == cpf[0] * 11:
            return False
        
        # Calcular primeiro dígito verificador
        soma = 0
        for i in range(9):
            soma += int(cpf[i]) * (10 - i)
        resto = soma % 11
        if resto < 2:
            dv1 = 0
        else:
            dv1 = 11 - resto
        
        if int(cpf[9]) != dv1:
            return False
        
        # Calcular segundo dígito verificador
        soma = 0
        for i in range(10):
            soma += int(cpf[i]) * (11 - i)
        resto = soma % 11
        if resto < 2:
            dv2 = 0
        else:
            dv2 = 11 - resto
        
        if int(cpf[10]) != dv2:
            return False
        
        return True
    
    @staticmethod
    def validar_cnpj(cnpj):
        """Valida CNPJ"""
        cnpj = cnpj.replace('.', '').replace('/', '').replace('-', '')
        
        if len(cnpj) != 14:
            return False
        
        # Verificar se todos os dígitos são iguais
        if cnpj == cnpj[0] * 14:
            return False
        
        # Calcular primeiro dígito verificador
        soma = 0
        peso = 5
        for i in range(12):
            soma += int(cnpj[i]) * peso
            peso = peso - 1 if peso > 2 else 9
        
        resto = soma % 11
        if resto < 2:
            dv1 = 0
        else:
            dv1 = 11 - resto
        
        if int(cnpj[12]) != dv1:
            return False
        
        # Calcular segundo dígito verificador
        soma = 0
        peso = 6
        for i in range(13):
            soma += int(cnpj[i]) * peso
            peso = peso - 1 if peso > 2 else 9
        
        resto = soma % 11
        if resto < 2:
            dv2 = 0
        else:
            dv2 = 11 - resto
        
        if int(cnpj[13]) != dv2:
            return False
        
        return True


class ReceitaFederalService:
    """Serviço para consulta à Receita Federal"""

    @staticmethod
    def consultar_cnpj(cnpj):
        """Consulta CNPJ na Receita Federal"""
        cnpj = cnpj.replace('.', '').replace('/', '').replace('-', '')

        if not ValidacaoService.validar_cnpj(cnpj):
            return {'erro': 'CNPJ inválido'}

        base_url = getattr(settings, 'RECEITA_FEDERAL_CNPJ_URL', 'https://receitaws.com.br/v1/cnpj/{cnpj}')
        timeout = getattr(settings, 'RECEITA_FEDERAL_TIMEOUT', 10)
        api_key = getattr(settings, 'RECEITA_FEDERAL_API_KEY', None)

        try:
            url = base_url.format(cnpj=cnpj)
        except (KeyError, IndexError, ValueError):
            url = f"{base_url.rstrip('/')}/{cnpj}"

        headers = {}
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'

        try:
            response = requests.get(url, timeout=timeout, headers=headers or None)

            if response.status_code == 200:
                dados = response.json()

                if dados.get('status') == 'ERROR':
                    return {'erro': dados.get('message', 'Erro na consulta')}

                return {
                    'sucesso': True,
                    'razao_social': dados.get('nome', ''),
                    'nome_fantasia': dados.get('fantasia', ''),
                    'situacao': dados.get('situacao', ''),
                    'endereco': dados.get('logradouro', ''),
                    'numero': dados.get('numero', ''),
                    'bairro': dados.get('bairro', ''),
                    'cidade': dados.get('municipio', ''),
                    'uf': dados.get('uf', ''),
                    'cep': dados.get('cep', ''),
                    'telefone': dados.get('telefone', ''),
                    'email': dados.get('email', ''),
                    'dados_brutos': dados,
                }

            if response.status_code == 429:
                return {'erro': 'Limite de consultas à Receita Federal atingido. Tente novamente mais tarde.'}

            if response.status_code >= 500:
                return {'erro': 'Serviço da Receita Federal indisponível no momento.'}

            return {'erro': f'Erro na consulta à Receita Federal (status {response.status_code})'}

        except requests.exceptions.Timeout:
            return {'erro': 'Timeout na consulta à Receita Federal'}
        except requests.exceptions.RequestException as e:
            return {'erro': f'Erro na consulta: {str(e)}'}
        except Exception as e:
            return {'erro': f'Erro interno: {str(e)}'}

class ClassificacaoService:
    """Serviço para classificação automática"""
    
    @staticmethod
    def classificar_assunto(descricao):
        """Classifica o assunto baseado na descrição"""
        
        # Palavras-chave para classificação
        palavras_chave = {
            'PRODUTO': ['produto', 'mercadoria', 'compra', 'venda', 'loja', 'comércio'],
            'SERVICO': ['serviço', 'prestação', 'contrato', 'obra', 'reparo', 'manutenção'],
            'TELECOMUNICACOES': ['telefone', 'internet', 'celular', 'plano', 'operadora', 'telecom'],
            'FINANCEIRO': ['banco', 'cartão', 'crédito', 'financiamento', 'empréstimo'],
            'SAUDE': ['médico', 'hospital', 'clínica', 'plano de saúde', 'saúde'],
            'EDUCACAO': ['escola', 'curso', 'educação', 'faculdade', 'universidade'],
            'TRANSPORTE': ['ônibus', 'táxi', 'uber', 'transporte', 'viagem'],
            'ALIMENTACAO': ['restaurante', 'comida', 'alimentação', 'delivery'],
        }
        
        descricao_lower = descricao.lower()
        
        for categoria, palavras in palavras_chave.items():
            for palavra in palavras:
                if palavra in descricao_lower:
                    return categoria
        
        return 'OUTROS'
    
    @staticmethod
    def determinar_tipo_classificacao(descricao, valor_envolvido):
        """Determina o tipo de classificação"""
        
        # Critérios para Atendimento Simples
        if valor_envolvido and valor_envolvido < 100:
            return 'ATENDIMENTO_SIMPLES'
        
        # Critérios para CIP
        if 'orientação' in descricao.lower() or 'informação' in descricao.lower():
            return 'CIP'
        
        # Critérios para Processo Administrativo
        if valor_envolvido and valor_envolvido >= 1000:
            return 'PROCESSO_ADMINISTRATIVO'
        
        return 'ATENDIMENTO_SIMPLES'


class NotificacaoService:
    """Serviço para envio de notificações"""
    
    @staticmethod
    def enviar_notificacao_consumidor(reclamacao):
        """Envia notificação para o consumidor"""
        try:
            assunto = f"Reclamação {reclamacao.numero_protocolo} - PROCON"
            mensagem = f"""
            Olá {reclamacao.consumidor_nome},
            
            Sua reclamação foi registrada com sucesso!
            
            Número do Protocolo: {reclamacao.numero_protocolo}
            Status: {reclamacao.get_status_display()}
            
            Você pode acompanhar o andamento através do nosso portal.
            
            Atenciosamente,
            Equipe PROCON
            """
            
            send_mail(
                assunto,
                mensagem,
                settings.DEFAULT_FROM_EMAIL,
                [reclamacao.consumidor_email],
                fail_silently=False,
            )
            
            return {'sucesso': True}
            
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}
    
    @staticmethod
    def enviar_notificacao_empresa(reclamacao):
        """Envia notificação para a empresa"""
        try:
            assunto = f"Notificação de Reclamação {reclamacao.numero_protocolo} - PROCON"
            mensagem = f"""
            Prezados,
            
            Foi registrada uma reclamação contra sua empresa.
            
            Número do Protocolo: {reclamacao.numero_protocolo}
            Consumidor: {reclamacao.consumidor_nome}
            Prazo para Resposta: {reclamacao.prazo_resposta.strftime('%d/%m/%Y')}
            
            Por favor, entre em contato conosco para mais informações.
            
            Atenciosamente,
            Equipe PROCON
            """
            
            if reclamacao.empresa_email:
                send_mail(
                    assunto,
                    mensagem,
                    settings.DEFAULT_FROM_EMAIL,
                    [reclamacao.empresa_email],
                    fail_silently=False,
                )
            
            return {'sucesso': True}
            
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}
    
    @staticmethod
    def enviar_notificacao_conciliacao(reclamacao):
        """Envia notificação sobre conciliação"""
        try:
            assunto = f"Audiência de Conciliação {reclamacao.numero_protocolo} - PROCON"
            mensagem = f"""
            Prezados,
            
            Foi marcada uma audiência de conciliação para sua reclamação.
            
            Número do Protocolo: {reclamacao.numero_protocolo}
            Data: {reclamacao.data_conciliacao.strftime('%d/%m/%Y às %H:%M')}
            
            Por favor, compareça no horário marcado.
            
            Atenciosamente,
            Equipe PROCON
            """
            
            # Notificar consumidor
            send_mail(
                assunto,
                mensagem,
                settings.DEFAULT_FROM_EMAIL,
                [reclamacao.consumidor_email],
                fail_silently=False,
            )
            
            # Notificar empresa
            if reclamacao.empresa_email:
                send_mail(
                    assunto,
                    mensagem,
                    settings.DEFAULT_FROM_EMAIL,
                    [reclamacao.empresa_email],
                    fail_silently=False,
                )
            
            return {'sucesso': True}
            
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}


class WorkflowService:
    """Serviço para gerenciar workflow"""
    
    @staticmethod
    def processar_nova_reclamacao(reclamacao):
        """Processa uma nova reclamação"""
        try:
            # 1. Validar dados
            if not ValidacaoService.validar_cpf(reclamacao.consumidor_cpf):
                return {'sucesso': False, 'erro': 'CPF inválido'}
            
            if not ValidacaoService.validar_cnpj(reclamacao.empresa_cnpj):
                return {'sucesso': False, 'erro': 'CNPJ inválido'}
            
            # 2. Consultar Receita Federal
            dados_empresa = ReceitaFederalService.consultar_cnpj(reclamacao.empresa_cnpj)
            if dados_empresa.get('sucesso'):
                reclamacao.empresa_razao_social = dados_empresa.get('razao_social', reclamacao.empresa_razao_social)
                reclamacao.empresa_endereco = dados_empresa.get('endereco', reclamacao.empresa_endereco)
            
            # 3. Classificar automaticamente
            reclamacao.assunto_classificado = ClassificacaoService.classificar_assunto(reclamacao.descricao_fatos)
            reclamacao.tipo_classificacao = ClassificacaoService.determinar_tipo_classificacao(
                reclamacao.descricao_fatos, 
                reclamacao.valor_envolvido
            )
            
            # 4. Salvar
            reclamacao.save()
            
            # 5. Enviar notificações
            NotificacaoService.enviar_notificacao_consumidor(reclamacao)
            
            return {'sucesso': True}
            
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}
    
    @staticmethod
    def avancar_status(reclamacao, novo_status, usuario, observacoes=''):
        """Avança o status de uma reclamação"""
        try:
            status_anterior = reclamacao.status
            reclamacao.status = novo_status
            reclamacao.save()
            
            # Criar histórico
            HistoricoReclamacao.objects.create(
                reclamacao=reclamacao,
                acao=f'STATUS_ALTERADO',
                descricao=f'Status alterado de {status_anterior} para {novo_status}',
                usuario=usuario,
                observacoes=observacoes,
            )
            
            return {'sucesso': True}
            
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}

