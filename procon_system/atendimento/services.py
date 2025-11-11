import json
import logging
from decimal import Decimal
from datetime import timedelta

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from fiscalizacao.models import AutoInfracao
from notificacoes.services import notificacao_service
from portal_empresa.services import gestao_empresa_service
from .models import Atendimento, SenhaAtendimento, FilaAtendimento, RegraDistribuicaoAtendimento

logger = logging.getLogger(__name__)


class AtendimentoService:
    """Serviço para gerenciar atendimentos"""
    
    @staticmethod
    def criar_atendimento(dados, usuario):
        """Cria um novo atendimento"""
        try:
            consentimento_flag = bool(dados.get('consentimento_lgpd', False))
            consentimento_origem = dados.get('consentimento_origem', 'GUICHE')
            consentimento_em = timezone.now() if consentimento_flag else None

            observacoes = dados.get('observacoes', '')
            descricao_fatos = dados.get('descricao_fatos', '')
            texto_classificacao = f"{observacoes} {descricao_fatos}".strip()
            valor_envolvido = dados.get('valor_envolvido')

            classificacao = dados.get('classificacao_automatica') or {}
            gravidade = dados.get('gravidade')
            assunto_classificado = classificacao.get('assunto_classificado') or ClassificacaoService.classificar_assunto(texto_classificacao)

            if texto_classificacao and not classificacao:
                gravidade_calculada, correspondencias = ClassificacaoService.classificar_gravidade(texto_classificacao)
                tipo_classificacao = ClassificacaoService.determinar_tipo_classificacao(texto_classificacao, valor_envolvido)
                classificacao = {
                    'gravidade': gravidade_calculada,
                    'correspondencias': correspondencias,
                    'tipo_classificacao': tipo_classificacao,
                }
                if not gravidade:
                    gravidade = gravidade_calculada

            if not gravidade:
                gravidade = Atendimento.Gravidade.MEDIA

            classificacao['assunto_classificado'] = assunto_classificado

            responsavel_distribuicao = DistribuicaoAutomaticaService.obter_responsavel(
                gravidade=gravidade,
                assunto=assunto_classificado,
                tipo_classificacao=classificacao.get('tipo_classificacao'),
            )

            atendimento = Atendimento.objects.create(
                atendente=usuario,
                consumidor_nome=dados['consumidor_nome'],
                consumidor_cpf=dados['consumidor_cpf'],
                consumidor_telefone=dados.get('consumidor_telefone', ''),
                consumidor_email=dados.get('consumidor_email', ''),
                tipo_atendimento=dados['tipo_atendimento'],
                canal_atendimento=dados.get('canal_atendimento', 'BALCAO'),
                observacoes=observacoes,
                consentimento_lgpd=consentimento_flag,
                consentimento_origem=consentimento_origem,
                consentimento_registrado_em=consentimento_em,
                gravidade=gravidade,
                classificacao_automatica=classificacao,
                distribuidor_responsavel=responsavel_distribuicao,
            )
            try:
                reclamacao = dados.get('reclamacao') or getattr(atendimento, 'reclamacao', None)
                if reclamacao:
                    gestao_empresa_service.notificar_reclamacao_portal(reclamacao)
            except Exception:
                # Notificar falha, mas n�o impedir a cria��o do atendimento
                pass
            return {'sucesso': True, 'atendimento': atendimento}
        except Exception as e:
            return {'sucesso': False, 'erro': str(e)}
    
    @staticmethod
    def registrar_presencial(dados, usuario, reclamacao):
        """Cria atendimento presencial vinculado a uma reclamacao"""
        try:
            consentimento_origem = dados.get('consentimento_origem', 'GUICHE')
            classificacao = dados.get('classificacao_automatica') or {}
            gravidade = dados.get('gravidade', Atendimento.Gravidade.MEDIA)
            consentimento_em = dados.get('consentimento_registrado_em', timezone.now())
            descricao_fatos = dados.get('descricao_fatos', '')
            texto_classificacao = f"{dados.get('observacoes', '')} {descricao_fatos}".strip()

            if not classificacao:
                gravidade_calculada, correspondencias = ClassificacaoService.classificar_gravidade(texto_classificacao)
                tipo_classificacao = ClassificacaoService.determinar_tipo_classificacao(texto_classificacao, dados.get('valor_envolvido'))
                classificacao = {
                    'gravidade': gravidade_calculada,
                    'correspondencias': correspondencias,
                    'tipo_classificacao': tipo_classificacao,
                }
                gravidade = gravidade or gravidade_calculada

            assunto_classificado = ClassificacaoService.classificar_assunto(texto_classificacao)
            classificacao['assunto_classificado'] = assunto_classificado

            responsavel_distribuicao = DistribuicaoAutomaticaService.obter_responsavel(
                gravidade=gravidade,
                assunto=assunto_classificado,
                tipo_classificacao=classificacao.get('tipo_classificacao'),
            )

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
                consentimento_lgpd=True,
                consentimento_origem=consentimento_origem,
                consentimento_registrado_em=consentimento_em,
                gravidade=gravidade,
                classificacao_automatica=classificacao,
                distribuidor_responsavel=responsavel_distribuicao,
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

    @staticmethod
    def solicitar_remocao(atendimento_id, observacoes=""):
        """Solicita remo��o de dados pessoais de um atendimento."""
        try:
            atendimento = Atendimento.objects.get(id=atendimento_id)
            atendimento.solicitar_remocao_dados(observacoes=observacoes)
            return {'sucesso': True}
        except Atendimento.DoesNotExist:
            return {'sucesso': False, 'erro': 'Atendimento n�o encontrado'}
        except Exception as exc:
            return {'sucesso': False, 'erro': str(exc)}

    @staticmethod
    def confirmar_remocao(atendimento_id):
        """Confirma a remo��o de dados pessoais, executando anonimiza��o."""
        try:
            atendimento = Atendimento.objects.get(id=atendimento_id)
            atendimento.confirmar_remocao_dados()
            return {'sucesso': True}
        except Atendimento.DoesNotExist:
            return {'sucesso': False, 'erro': 'Atendimento n�o encontrado'}
        except Exception as exc:
            return {'sucesso': False, 'erro': str(exc)}


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

    GRAVIDADE_PALAVRAS = {
        'ALTA': [
            'ameaça', 'violência', 'fraude', 'lesão grave', 'acidente',
            'risco de morte', 'intoxicação', 'envenenamento', 'golpe'
        ],
        'MEDIA': [
            'reincidência', 'descumprimento', 'dano', 'prazo excedido',
            'produto defeituoso', 'serviço suspenso', 'cobrança indevida'
        ],
        'BAIXA': [
            'atraso', 'informação', 'orientação', 'duvida', 'reclamação'
        ],
    }
    
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


    @classmethod
    def classificar_gravidade(cls, descricao):
        """Determina gravidade automática a partir da descrição"""
        texto = (descricao or '').lower()
        correspondencias = []
        gravidade = 'BAIXA'

        for nivel, palavras in getattr(cls, 'GRAVIDADE_PALAVRAS', {}).items():
            for palavra in palavras:
                if palavra in texto:
                    correspondencias.append({'nivel': nivel, 'palavra': palavra})

        if any(item['nivel'] == 'ALTA' for item in correspondencias):
            gravidade = 'ALTA'
        elif any(item['nivel'] == 'MEDIA' for item in correspondencias):
            gravidade = 'MEDIA'

        return gravidade, correspondencias


class DistribuicaoAutomaticaService:
    """Determina responsáveis com base nas regras de distribuição."""

    @staticmethod
    def obter_responsavel(gravidade=None, assunto=None, tipo_classificacao=None):
        regras = RegraDistribuicaoAtendimento.objects.filter(ativo=True).order_by('prioridade', 'id')
        gravidade_norm = (gravidade or '').upper()
        assunto_norm = (assunto or '').upper()
        tipo_norm = (tipo_classificacao or '').upper()

        for regra in regras:
            if regra.combina(gravidade=gravidade_norm, assunto=assunto_norm, tipo_classificacao=tipo_norm):
                return regra.responsavel
        return None


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

            telefone = getattr(reclamacao, 'consumidor_telefone', '')
            if telefone:
                sms_mensagem = (
                    f"PROCON: Reclamacao {reclamacao.numero_protocolo} "
                    "registrada com sucesso. Acompanhe pelo portal."
                )
                notificacao_service.enviar_sms_direto(telefone, sms_mensagem)
            
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



class FilaAtendimentoService:
    """Serviços auxiliares para gerenciamento de filas e senhas."""

    @staticmethod
    def _fila(balcao):
        return FilaAtendimento.obter_fila_ativa(balcao)

    @classmethod
    def emitir_senha(cls, balcao, prioridade=SenhaAtendimento.Prioridade.NORMAL, observacoes=""):
        senha = SenhaAtendimento(balcao=balcao, prioridade=prioridade, observacoes=observacoes)
        senha.save()

        fila = cls._fila(balcao)
        fila.quantidade_emitidas += 1
        fila.ultima_senha_emitida = senha.identificador
        fila.save(update_fields=['quantidade_emitidas', 'ultima_senha_emitida', 'atualizado_em'])

        return senha, fila

    @classmethod
    def chamar_proxima(cls, balcao, atendente=None):
        fila = cls._fila(balcao)
        filtro = SenhaAtendimento.objects.filter(balcao=balcao, status=SenhaAtendimento.Status.EM_ESPERA)
        senha = filtro.order_by('-prioridade', 'emitido_em').first()
        if not senha:
            raise ValidationError({'detail': 'Não há senhas em espera.'})

        senha.marcar_chamada(atendente=atendente)
        balcao.ultima_chamada_em = timezone.now()
        balcao.save(update_fields=['ultima_chamada_em'])

        fila.quantidade_chamadas += 1
        fila.ultima_senha_chamada = senha.identificador
        fila.save(update_fields=['quantidade_chamadas', 'ultima_senha_chamada', 'atualizado_em'])

        return senha, fila

    @classmethod
    def iniciar_senha(cls, senha, atendente=None):
        senha.iniciar_atendimento(atendente=atendente)
        return senha, cls._fila(senha.balcao)

    @classmethod
    def finalizar_senha(cls, senha, atendente=None):
        senha.finalizar(atendente=atendente)
        fila = cls._fila(senha.balcao)
        fila.quantidade_finalizadas += 1
        fila.save(update_fields=['quantidade_finalizadas', 'atualizado_em'])
        return senha, fila

    @staticmethod
    def cancelar_senha(senha, motivo=""):
        senha.cancelar(motivo)
        return senha

    @staticmethod
    def pular_senha(senha, justificativa="Senha pulada"):
        senha.status = SenhaAtendimento.Status.EM_ESPERA
        senha.chamado_em = None
        senha.atendente_responsavel = None
        if justificativa:
            senha.observacoes = f"{senha.observacoes}\n{justificativa}" if senha.observacoes else justificativa
        senha.emitido_em = timezone.now()
        senha.save(update_fields=['status', 'chamado_em', 'atendente_responsavel', 'observacoes', 'emitido_em'])
        return senha


def encaminhar_para_fiscalizacao(reclamacao, usuario=None):
    """
    Cria automaticamente um Auto de Infração em Fiscalização quando a decisão
    administrativa gera penalidade. Retorna (auto, criado_nesse_fluxo).
    """
    if not reclamacao or getattr(reclamacao, 'auto_infracao_relacionado', None):
        auto_existente = getattr(reclamacao, 'auto_infracao_relacionado', None)
        return auto_existente, False

    try:
        agora = timezone.now()

        def _sanitize_cpf(cpf):
            numeros = ''.join(filter(str.isdigit, cpf or ''))
            return numeros if len(numeros) == 11 else '00000000000'

        valor_base = reclamacao.valor_multa or reclamacao.valor_envolvido
        try:
            valor_multa = Decimal(str(valor_base)) if valor_base else Decimal('500.00')
        except Exception:
            valor_multa = Decimal('500.00')
        if valor_multa <= 0:
            valor_multa = Decimal('500.00')

        auto = AutoInfracao.objects.create(
            data_fiscalizacao=agora.date(),
            hora_fiscalizacao=agora.time().replace(microsecond=0),
            municipio=reclamacao.consumidor_cidade if getattr(reclamacao, 'consumidor_cidade', None) else 'MANAUS',
            estado='AM',
            razao_social=reclamacao.empresa_razao_social or 'Fornecedor não informado',
            nome_fantasia=reclamacao.empresa_razao_social or '',
            atividade=reclamacao.assunto_classificado or 'Não informado',
            endereco=reclamacao.empresa_endereco or 'Endereço não informado',
            cnpj=reclamacao.empresa_cnpj or '00.000.000/0000-00',
            telefone=reclamacao.empresa_telefone or '',
            relatorio=f"Auto gerado automaticamente a partir da reclamação {reclamacao.numero_protocolo}.",
            base_legal_cdc="Art. 55 e Art. 56 do Código de Defesa do Consumidor",
            infracao_falta_informacao=True,
            outras_infracoes=reclamacao.fundamentacao_decisao or '',
            valor_multa=valor_multa,
            responsavel_nome=reclamacao.consumidor_nome or 'Responsável não informado',
            responsavel_cpf=_sanitize_cpf(reclamacao.consumidor_cpf),
            responsavel_funcao='Consumidor',
            fiscal_nome=(usuario.get_full_name() or usuario.get_username()) if usuario else 'Sistema PROCON',
            observacoes="Auto criado automaticamente após decisão administrativa.",
            data_notificacao=agora.date(),
            data_vencimento=agora.date() + timedelta(days=10),
        )

        reclamacao.auto_infracao_relacionado = auto
        reclamacao.save(update_fields=['auto_infracao_relacionado'])

        logger.info(
            "Auto de infração %s criado automaticamente para reclamação %s",
            auto.numero,
            reclamacao.id,
        )

        return auto, True

    except Exception as exc:
        logger.error(
            "Falha ao encaminhar reclamação %s para fiscalização: %s",
            getattr(reclamacao, 'id', '?'),
            exc,
            exc_info=True,
        )
        return None, False
