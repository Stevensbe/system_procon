"""
Integrações do PPA com Auto de Constatação e Auto de Infração
"""
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from .models import ProcedimentoPreAdministrativo, MovimentacaoPPA, AnexoPPA
from fiscalizacao.models import AutoConstatacaoBase, AutoInfracao


class PPAIntegrationService:
    """Serviço de integração do PPA com outros módulos"""

    @staticmethod
    @transaction.atomic
    def criar_ppa_de_ac(ac_id, analista, dados_adicionais=None):
        """
        Cria um PPA a partir de um Auto de Constatação
        
        Args:
            ac_id: ID do Auto de Constatação
            analista: Usuário analista responsável
            dados_adicionais: Dados adicionais do PPA (opcional)
            
        Returns:
            ProcedimentoPreAdministrativo criado
        """
        try:
            # Buscar AC
            ac = AutoConstatacaoBase.objects.get(id=ac_id)
            
            # Dados padrão do PPA baseados no AC
            dados_ppa = {
                'auto_constatacao_origem': ac,
                'analista_responsavel': analista,
                'interessado': ac.empresa_autuada or ac.razao_social or 'Não informado',
                'cnpj_interessado': ac.cnpj or '',
                'endereco_interessado': ac.endereco or '',
                'sigla': PPAIntegrationService._definir_sigla_por_tipo_fiscalizacao(ac),
                'assunto': PPAIntegrationService._gerar_assunto_de_ac(ac),
                'status': 'criado',
            }
            
            # Mesclar com dados adicionais se fornecidos
            if dados_adicionais:
                dados_ppa.update(dados_adicionais)
            
            # Criar PPA
            ppa = ProcedimentoPreAdministrativo.objects.create(**dados_ppa)
            
            # Registrar movimentação inicial
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='anexo_ac',
                descricao=f'PPA criado a partir do Auto de Constatação {ac.numero}',
                usuario=analista,
                content_type=ContentType.objects.get_for_model(ac),
                object_id=ac.id
            )
            
            return ppa
            
        except AutoConstatacaoBase.DoesNotExist:
            raise ValueError(f'Auto de Constatação {ac_id} não encontrado')
        except Exception as e:
            raise Exception(f'Erro ao criar PPA de AC: {str(e)}')

    @staticmethod
    @transaction.atomic
    def vincular_ac_ao_ppa(ac_id, ppa_id, usuario):
        """
        Vincula um AC existente a um PPA existente
        
        Args:
            ac_id: ID do Auto de Constatação
            ppa_id: ID do PPA
            usuario: Usuário que está fazendo a vinculação
            
        Returns:
            MovimentacaoPPA criada
        """
        try:
            ac = AutoConstatacaoBase.objects.get(id=ac_id)
            ppa = ProcedimentoPreAdministrativo.objects.get(id=ppa_id)
            
            # Atualizar vinculação no PPA
            if not ppa.auto_constatacao_origem:
                ppa.auto_constatacao_origem = ac
                ppa.save()
            
            # Registrar movimentação
            movimentacao = MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='anexo_ac',
                descricao=f'Auto de Constatação {ac.numero} vinculado ao PPA',
                usuario=usuario,
                content_type=ContentType.objects.get_for_model(ac),
                object_id=ac.id
            )
            
            return movimentacao
            
        except AutoConstatacaoBase.DoesNotExist:
            raise ValueError(f'Auto de Constatação {ac_id} não encontrado')
        except ProcedimentoPreAdministrativo.DoesNotExist:
            raise ValueError(f'PPA {ppa_id} não encontrado')
        except Exception as e:
            raise Exception(f'Erro ao vincular AC ao PPA: {str(e)}')

    @staticmethod
    @transaction.atomic
    def criar_ai_de_ppa(ppa_id, usuario, dados_ai):
        """
        Cria um Auto de Infração a partir do PPA
        
        Args:
            ppa_id: ID do PPA
            usuario: Usuário que está criando o AI
            dados_ai: Dados para criar o Auto de Infração
            
        Returns:
            AutoInfracao criado
        """
        try:
            ppa = ProcedimentoPreAdministrativo.objects.get(id=ppa_id)
            
            # Dados padrão do AI baseados no PPA
            dados_auto_infracao = {
                'empresa_autuada': ppa.interessado,
                'cnpj': ppa.cnpj_interessado,
                'endereco': ppa.endereco_interessado,
                'fiscal_responsavel': usuario,
                'fundamentacao_legal': dados_ai.get('fundamentacao_legal', ''),
                'descricao_infracao': dados_ai.get('descricao_infracao', ppa.assunto),
                'valor_multa': dados_ai.get('valor_multa', 0),
            }
            
            # Mesclar com dados fornecidos
            dados_auto_infracao.update(dados_ai)
            
            # Criar Auto de Infração
            ai = AutoInfracao.objects.create(**dados_auto_infracao)
            
            # Atualizar decisão do PPA
            ppa.decisao_final = 'auto_criado'
            ppa.status = 'concluido'
            ppa.save()
            
            # Registrar movimentação
            MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='anexo_ai',
                descricao=f'Auto de Infração {ai.numero} criado a partir do PPA',
                usuario=usuario,
                content_type=ContentType.objects.get_for_model(ai),
                object_id=ai.id
            )
            
            return ai
            
        except ProcedimentoPreAdministrativo.DoesNotExist:
            raise ValueError(f'PPA {ppa_id} não encontrado')
        except Exception as e:
            raise Exception(f'Erro ao criar AI de PPA: {str(e)}')

    @staticmethod
    @transaction.atomic
    def vincular_ai_ao_ppa(ai_id, ppa_id, usuario):
        """
        Vincula um AI existente a um PPA
        
        Args:
            ai_id: ID do Auto de Infração
            ppa_id: ID do PPA
            usuario: Usuário que está fazendo a vinculação
            
        Returns:
            MovimentacaoPPA criada
        """
        try:
            ai = AutoInfracao.objects.get(id=ai_id)
            ppa = ProcedimentoPreAdministrativo.objects.get(id=ppa_id)
            
            # Registrar movimentação
            movimentacao = MovimentacaoPPA.objects.create(
                ppa=ppa,
                tipo_movimentacao='anexo_ai',
                descricao=f'Auto de Infração {ai.numero} vinculado ao PPA',
                usuario=usuario,
                content_type=ContentType.objects.get_for_model(ai),
                object_id=ai.id
            )
            
            # Atualizar decisão do PPA se ainda não foi definida
            if ppa.decisao_final == 'pendente':
                ppa.decisao_final = 'auto_criado'
                ppa.save()
            
            return movimentacao
            
        except AutoInfracao.DoesNotExist:
            raise ValueError(f'Auto de Infração {ai_id} não encontrado')
        except ProcedimentoPreAdministrativo.DoesNotExist:
            raise ValueError(f'PPA {ppa_id} não encontrado')
        except Exception as e:
            raise Exception(f'Erro ao vincular AI ao PPA: {str(e)}')

    @staticmethod
    def _definir_sigla_por_tipo_fiscalizacao(ac):
        """
        Define a sigla do PPA baseada no tipo de fiscalização do AC
        """
        tipo_fiscalizacao = getattr(ac, 'tipo_fiscalizacao', '').upper()
        
        mapeamento = {
            'BANCO': 'BANCO',
            'POSTO': 'POSTO',
            'COMBUSTIVEL': 'POSTO',
            'SUPERMERCADO': 'SUPERMERCADO',
            'MERCADO': 'SUPERMERCADO',
            'TELECOMUNICACOES': 'TELECOMUNICACOES',
            'TELEFONIA': 'TELECOMUNICACOES',
            'ENERGIA': 'ENERGIA',
            'ELETRICA': 'ENERGIA',
            'PLANO_SAUDE': 'PLANO_SAUDE',
            'SAUDE': 'PLANO_SAUDE',
        }
        
        for chave, valor in mapeamento.items():
            if chave in tipo_fiscalizacao:
                return valor
        
        return 'DIVERSOS'

    @staticmethod
    def _gerar_assunto_de_ac(ac):
        """
        Gera o assunto do PPA baseado no AC
        """
        descricoes = []
        
        if hasattr(ac, 'descricao') and ac.descricao:
            descricoes.append(ac.descricao)
        
        if hasattr(ac, 'infrações_constatadas') and ac.infrações_constatadas:
            descricoes.append(f"Infrações: {ac.infrações_constatadas}")
        
        if hasattr(ac, 'numero') and ac.numero:
            descricoes.append(f"Ref. AC {ac.numero}")
        
        if not descricoes:
            descricoes.append("Fiscalização realizada - verificar irregularidades constatadas no Auto de Constatação")
        
        return " | ".join(descricoes)


# Funções auxiliares para facilitar uso
def criar_ppa_de_ac(ac_id, analista, dados_adicionais=None):
    """Atalho para criar PPA de AC"""
    return PPAIntegrationService.criar_ppa_de_ac(ac_id, analista, dados_adicionais)


def vincular_ac_ao_ppa(ac_id, ppa_id, usuario):
    """Atalho para vincular AC ao PPA"""
    return PPAIntegrationService.vincular_ac_ao_ppa(ac_id, ppa_id, usuario)


def criar_ai_de_ppa(ppa_id, usuario, dados_ai):
    """Atalho para criar AI de PPA"""
    return PPAIntegrationService.criar_ai_de_ppa(ppa_id, usuario, dados_ai)


def vincular_ai_ao_ppa(ai_id, ppa_id, usuario):
    """Atalho para vincular AI ao PPA"""
    return PPAIntegrationService.vincular_ai_ao_ppa(ai_id, ppa_id, usuario)

