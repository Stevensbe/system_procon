from rest_framework import serializers
from datetime import time
import os
from .models import Processo, HistoricoProcesso, DocumentoProcesso, ParecerProcesso # Adicione Processo ao import
from .models import (
    AutoBanco, 
    AtendimentoCaixaBanco, 
    AnexoAuto,
    AutoPosto, 
    NotaFiscalPosto, 
    CupomFiscalPosto,
    AutoSupermercado,
    AutoDiversos,
    AutoInfracao,
    TipoFiscalizacao,
    EvidenciaFiscalizacao,
    AutoInfracaoAvancado,
    HistoricoAutoInfracao,
    TemplateAutoInfracao,
    NotificacaoEletronica,
    ConfiguracaoFiscalizacao,
    AutoApreensaoInutilizacao,
    ItemApreensaoInutilizacao,
    EvidenciaFotografica,
    AssinaturaDigital,
    ControlePrazos
)
from django.contrib.auth.models import User
from django.utils import timezone


class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuários"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

# === SERIALIZERS PARA AUTO BANCO ===
class AtendimentoCaixaBancoSerializer(serializers.ModelSerializer):
    tempo_espera_formatado = serializers.CharField(read_only=True)
    
    class Meta:
        model = AtendimentoCaixaBanco
        fields = [
            'id',
            'letra_senha',
            'horario_chegada',
            'horario_atendimento',
            'tempo_decorrido',
            'tipo_servico',
            'limite_tempo',
            'tempo_espera_formatado',
        ]

class AnexoAutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnexoAuto
        fields = ['id', 'arquivo', 'descricao', 'enviado_em']

class AutoBancoSerializer(serializers.ModelSerializer):
    atendimentos_caixa = AtendimentoCaixaBancoSerializer(many=True, read_only=True)
    anexos = AnexoAutoSerializer(many=True, read_only=True)
    total_atendimentos = serializers.IntegerField(read_only=True)
    tem_irregularidades = serializers.BooleanField(read_only=True)
    
    # Campos para receber dados aninhados (write-only)
    atendimentos_caixa_data = serializers.JSONField(required=False, write_only=True)
    
    class Meta:
        model = AutoBanco
        fields = '__all__'
    
    def create(self, validated_data):
        # Remove os atendimentos dos dados validados
        atendimentos_data = validated_data.pop('atendimentos_caixa_data', [])
        if not isinstance(atendimentos_data, list):
            atendimentos_data = []
        
        # Cria o AutoBanco
        auto = AutoBanco.objects.create(**validated_data)
        
        # Cria os atendimentos relacionados
        for atendimento_data in atendimentos_data:
            # Converte strings de tempo para objetos time se necessário
            horario_chegada = atendimento_data.get('horario_chegada', '')
            horario_atendimento = atendimento_data.get('horario_atendimento', '')
            
            if isinstance(horario_chegada, str) and horario_chegada:
                try:
                    # Converte "10:30" para time(10, 30)
                    hora, minuto = horario_chegada.split(':')
                    horario_chegada = time(int(hora), int(minuto))
                except:
                    horario_chegada = None
            
            if isinstance(horario_atendimento, str) and horario_atendimento:
                try:
                    hora, minuto = horario_atendimento.split(':')
                    horario_atendimento = time(int(hora), int(minuto))
                except:
                    horario_atendimento = None
            
            if atendimento_data.get('letra_senha'):  # Só cria se tem senha
                limite_tempo = atendimento_data.get('limite_tempo')
                if limite_tempo is not None:
                    try:
                        limite_tempo = int(limite_tempo)
                    except (TypeError, ValueError):
                        limite_tempo = None
                AtendimentoCaixaBanco.objects.create(
                    auto_banco=auto,
                    letra_senha=atendimento_data.get('letra_senha', ''),
                    horario_chegada=horario_chegada,
                    horario_atendimento=horario_atendimento,
                    tempo_decorrido=int(atendimento_data.get('tempo_decorrido', 15)),
                    tipo_servico=atendimento_data.get('tipo_servico', 'simples'),
                    limite_tempo=limite_tempo
                )
        
        return auto
    
    def update(self, instance, validated_data):
        # Remove os atendimentos dos dados validados
        atendimentos_data = validated_data.pop('atendimentos_caixa_data', [])
        if not isinstance(atendimentos_data, list):
            atendimentos_data = []
        
        # Atualiza o AutoBanco
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Remove atendimentos existentes e cria novos
        instance.atendimentos_caixa.all().delete()
        
        for atendimento_data in atendimentos_data:
            # Mesmo processamento de conversão de tempo
            horario_chegada = atendimento_data.get('horario_chegada', '')
            horario_atendimento = atendimento_data.get('horario_atendimento', '')
            
            if isinstance(horario_chegada, str) and horario_chegada:
                try:
                    hora, minuto = horario_chegada.split(':')
                    horario_chegada = time(int(hora), int(minuto))
                except:
                    horario_chegada = None
            
            if isinstance(horario_atendimento, str) and horario_atendimento:
                try:
                    hora, minuto = horario_atendimento.split(':')
                    horario_atendimento = time(int(hora), int(minuto))
                except:
                    horario_atendimento = None
            
            if atendimento_data.get('letra_senha'):
                limite_tempo = atendimento_data.get('limite_tempo')
                if limite_tempo is not None:
                    try:
                        limite_tempo = int(limite_tempo)
                    except (TypeError, ValueError):
                        limite_tempo = None
                AtendimentoCaixaBanco.objects.create(
                    auto_banco=instance,
                    letra_senha=atendimento_data.get('letra_senha', ''),
                    horario_chegada=horario_chegada,
                    horario_atendimento=horario_atendimento,
                    tempo_decorrido=int(atendimento_data.get('tempo_decorrido', 15)),
                    tipo_servico=atendimento_data.get('tipo_servico', 'simples'),
                    limite_tempo=limite_tempo
                )
        
        return instance

# === SERIALIZERS PARA AUTO POSTO ===
class NotaFiscalPostoSerializer(serializers.ModelSerializer):
    produto_display = serializers.CharField(source='get_produto_display', read_only=True)
    tipo_nota_display = serializers.CharField(source='get_tipo_nota_display', read_only=True)
    
    class Meta:
        model = NotaFiscalPosto
        fields = '__all__'

class CupomFiscalPostoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CupomFiscalPosto
        fields = '__all__'

class AutoPostoSerializer(serializers.ModelSerializer):
    notas_fiscais = NotaFiscalPostoSerializer(many=True, read_only=True)
    cupons_fiscais = CupomFiscalPostoSerializer(many=True, read_only=True)
    anexos = AnexoAutoSerializer(many=True, read_only=True)
    
    # Campos para receber dados aninhados (write-only)
    notas_fiscais_data = serializers.ListField(
        child=serializers.DictField(), 
        required=False, 
        write_only=True
    )
    cupons_fiscais_data = serializers.ListField(
        child=serializers.DictField(), 
        required=False, 
        write_only=True
    )
    
    class Meta:
        model = AutoPosto
        fields = '__all__'
    
    def create(self, validated_data):
        # Remove dados aninhados
        notas_data = validated_data.pop('notas_fiscais_data', [])
        cupons_data = validated_data.pop('cupons_fiscais_data', [])
        
        # Cria o AutoPosto
        auto = AutoPosto.objects.create(**validated_data)
        
        # Cria notas fiscais
        for nota_data in notas_data:
            if nota_data.get('numero_nota'):  # Só cria se tem número da nota
                NotaFiscalPosto.objects.create(auto_posto=auto, **nota_data)
        
        # Cria cupons fiscais
        for cupom_data in cupons_data:
            if cupom_data.get('numero_cupom'):  # Só cria se tem número do cupom
                CupomFiscalPosto.objects.create(auto_posto=auto, **cupom_data)
        
        return auto
    
    def update(self, instance, validated_data):
        # Remove dados aninhados
        notas_data = validated_data.pop('notas_fiscais_data', [])
        cupons_data = validated_data.pop('cupons_fiscais_data', [])
        
        # Atualiza o AutoPosto
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Remove e recria notas fiscais
        instance.notas_fiscais.all().delete()
        for nota_data in notas_data:
            if nota_data.get('numero_nota'):
                NotaFiscalPosto.objects.create(auto_posto=instance, **nota_data)
        
        # Remove e recria cupons fiscais
        instance.cupons_fiscais.all().delete()
        for cupom_data in cupons_data:
            if cupom_data.get('numero_cupom'):
                CupomFiscalPosto.objects.create(auto_posto=instance, **cupom_data)
        
        return instance

# === SERIALIZERS PARA AUTO SUPERMERCADO ===
class AutoSupermercadoSerializer(serializers.ModelSerializer):
    tem_irregularidades = serializers.BooleanField(read_only=True)
    anexos = AnexoAutoSerializer(many=True, read_only=True)
    
    class Meta:
        model = AutoSupermercado
        fields = '__all__'
        
    def to_representation(self, instance):
        """Adiciona informações sobre irregularidades encontradas"""
        data = super().to_representation(instance)
        
        # Lista de irregularidades marcadas
        irregularidades_marcadas = []
        campos_irregularidades = [
            ('comercializar_produtos_vencidos', 'Comercializar produtos vencidos'),
            ('comercializar_embalagem_violada', 'Comercializar produtos com embalagem violada'),
            ('comercializar_lata_amassada', 'Comercializar produtos com lata amassada'),
            ('comercializar_sem_validade', 'Comercializar produtos sem validade'),
            ('comercializar_mal_armazenados', 'Comercializar produtos mal armazenados'),
            ('comercializar_descongelados', 'Comercializar produtos descongelados'),
            ('publicidade_enganosa', 'Publicidade enganosa'),
            ('obstrucao_monitor', 'Obstrução do monitor'),
            ('afixacao_precos_fora_padrao', 'Afixação de preços fora do padrão'),
            ('ausencia_afixacao_precos', 'Ausência de afixação de preços'),
            ('afixacao_precos_fracionados_fora_padrao', 'Afixação de preços fracionados fora do padrão'),
            ('ausencia_visibilidade_descontos', 'Ausência de visibilidade de descontos'),
            ('ausencia_placas_promocao_vencimento', 'Ausência de placas sobre promoção de produtos próximos ao vencimento'),
        ]
        
        for campo, descricao in campos_irregularidades:
            if getattr(instance, campo, False):
                irregularidades_marcadas.append(descricao)
        
        data['irregularidades_marcadas'] = irregularidades_marcadas

        return data

# === SERIALIZERS PARA AUTO DIVERSOS ===
class AutoDiversosSerializer(serializers.ModelSerializer):
    tem_irregularidades = serializers.BooleanField(read_only=True)
    anexos = AnexoAutoSerializer(many=True, read_only=True)
    
    class Meta:
        model = AutoDiversos
        fields = '__all__'
        
    def to_representation(self, instance):
        """Adiciona informações sobre irregularidades encontradas"""
        data = super().to_representation(instance)
        
        # Lista de irregularidades marcadas
        irregularidades_marcadas = []
        campos_irregularidades = [
            ('publicidade_enganosa', 'Publicidade enganosa'),
            ('afixacao_precos_fora_padrao', 'Afixação de preços fora do padrão'),
            ('ausencia_afixacao_precos', 'Ausência de afixação de preços'),
            ('afixacao_precos_eletronico_fora_padrao', 'Afixação de preços no comércio eletrônico fora do padrão'),
            ('ausencia_afixacao_precos_eletronico', 'Ausência de afixação de preços no comércio eletrônico'),
            ('afixacao_precos_fracionados_fora_padrao', 'Afixação de preços de produtos fracionados fora do padrão'),
            ('ausencia_visibilidade_descontos', 'Ausência de visibilidade de descontos'),
            ('ausencia_exemplar_cdc', 'Ausência do exemplar do CDC'),
            ('substituicao_troco', 'Substituição do troco por outros produtos'),
        ]
        
        for campo, descricao in campos_irregularidades:
            if getattr(instance, campo, False):
                irregularidades_marcadas.append(descricao)
        
        data['irregularidades_marcadas'] = irregularidades_marcadas
        
        return data

# === SERIALIZERS PARA AUTO INFRAÇÃO ===
class AutoInfracaoSerializer(serializers.ModelSerializer):
    # Campos computados
    valor_multa_formatado = serializers.CharField(read_only=True)
    status_display = serializers.CharField(read_only=True)
    tem_infracoes_marcadas = serializers.BooleanField(read_only=True)
    validado_por_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = AutoInfracao
        fields = '__all__'
        read_only_fields = ('numero', 'criado_em', 'atualizado_em')

    def get_validado_por_nome(self, obj):
        usuario = getattr(obj, 'validado_por', None)
        if not usuario:
            return ''
        return usuario.get_full_name() or usuario.username
    
    def validate_cnpj(self, value):
        """Validação de CNPJ"""
        if value and len(value.replace('.', '').replace('/', '').replace('-', '')) != 14:
            raise serializers.ValidationError("CNPJ deve ter 14 dígitos")
        return value
    
    def validate_responsavel_cpf(self, value):
        """Validação de CPF"""
        if value and len(value.replace('.', '').replace('-', '')) != 11:
            raise serializers.ValidationError("CPF deve ter 11 dígitos")
        return value
    
    def validate_valor_multa(self, value):
        """Validação do valor da multa"""
        if value and value <= 0:
            raise serializers.ValidationError("Valor da multa deve ser maior que zero")
        return value



# Serializer específico para criar infrações a partir de um auto
class AutoInfracaoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para criação de Auto de Infração.
    Permite criação manual ou baseada em Auto de Constatação.
    """
    auto_tipo = serializers.ChoiceField(
        choices=[
            ('banco', 'Auto Banco'),
            ('posto', 'Auto Posto'),
            ('supermercado', 'Auto Supermercado'),
            ('autobanco', 'Auto Banco'),
            ('autoposto', 'Auto Posto'),
            ('autosupermercado', 'Auto Supermercado'),
            ('autodiversos', 'Auto Diversos'),
            ('diversos', 'Auto Diversos'),
        ],
        write_only=True,
        required=False,
        allow_null=True
    )
    auto_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = AutoInfracao
        fields = '__all__'
        read_only_fields = (
            'numero',
            'validacao_formal_status',
            'validacao_formal_motivo',
            'validado_por',
            'validado_em',
        )

    def validate(self, attrs):
        auto_tipo = attrs.get('auto_tipo')
        auto_id = attrs.get('auto_id')

        if not auto_tipo and not auto_id:
            return attrs

        if not auto_tipo or not auto_id:
            raise serializers.ValidationError({
                'auto_tipo': 'Informe o tipo do auto vinculado',
                'auto_id': 'Informe o ID do auto vinculado'
            })

        model_mapping = {
            'banco': AutoBanco,
            'posto': AutoPosto,
            'supermercado': AutoSupermercado,
            'autobanco': AutoBanco,
            'autoposto': AutoPosto,
            'autosupermercado': AutoSupermercado,
            'autodiversos': AutoDiversos,
            'diversos': AutoDiversos,
        }

        if auto_tipo not in model_mapping:
            raise serializers.ValidationError({
                'auto_tipo': f'Tipo inválido: {auto_tipo}'
            })

        model_class = model_mapping[auto_tipo]
        try:
            auto_obj = model_class.objects.get(pk=auto_id)
        except model_class.DoesNotExist:
            raise serializers.ValidationError({
                'auto_id': f'{auto_tipo} com ID {auto_id} não encontrado'
            })

        if not attrs.get('data_fiscalizacao'):
            attrs['data_fiscalizacao'] = auto_obj.data_fiscalizacao
        if not attrs.get('hora_fiscalizacao'):
            attrs['hora_fiscalizacao'] = getattr(auto_obj, 'hora_fiscalizacao', None)
        if not attrs.get('municipio'):
            attrs['municipio'] = getattr(auto_obj, 'municipio', '')
        if not attrs.get('estado'):
            attrs['estado'] = getattr(auto_obj, 'estado', '')
        if not attrs.get('razao_social'):
            attrs['razao_social'] = getattr(auto_obj, 'razao_social', '')
        if not attrs.get('nome_fantasia'):
            attrs['nome_fantasia'] = getattr(auto_obj, 'nome_fantasia', '')
        if not attrs.get('atividade'):
            attrs['atividade'] = getattr(auto_obj, 'atividade', '')
        if not attrs.get('endereco'):
            attrs['endereco'] = getattr(auto_obj, 'endereco', '')
        if not attrs.get('cep'):
            attrs['cep'] = getattr(auto_obj, 'cep', '')
        if not attrs.get('cnpj'):
            attrs['cnpj'] = getattr(auto_obj, 'cnpj', '')
        if not attrs.get('telefone'):
            attrs['telefone'] = getattr(auto_obj, 'telefone', '')
        if not attrs.get('responsavel_nome'):
            attrs['responsavel_nome'] = getattr(auto_obj, 'responsavel_nome', '')
        if not attrs.get('responsavel_cpf'):
            attrs['responsavel_cpf'] = getattr(auto_obj, 'responsavel_cpf', '')
        if not attrs.get('estabelecimento_responsavel'):
            attrs['estabelecimento_responsavel'] = getattr(auto_obj, 'estabelecimento_responsavel', '')
        if not attrs.get('auto_constatacao_numero'):
            attrs['auto_constatacao_numero'] = getattr(auto_obj, 'numero', '')

        return attrs

    def create(self, validated_data):
        validated_data.pop('auto_tipo', None)
        validated_data.pop('auto_id', None)

        return AutoInfracao.objects.create(**validated_data)

# Serializer simplificado para listagem
class AutoInfracaoSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de infrações"""
    razao_social = serializers.CharField(read_only=True)
    auto_origem = serializers.CharField(read_only=True)
    
    class Meta:
        model = AutoInfracao
        fields = [
            'id', 'numero', 'razao_social', 'auto_origem', 
            'tipo_infracao', 'gravidade', 'status', 
            'data_fiscalizacao', 'valor_multa'
        ]
        
# === SERIALIZERS PARA RELATÓRIOS E ESTATÍSTICAS ===
class RelatorioMensalSerializer(serializers.Serializer):
    """Serializer para relatórios mensais"""
    mes = serializers.IntegerField(min_value=1, max_value=12)
    ano = serializers.IntegerField(min_value=2020, max_value=2030)
    tipo_auto = serializers.ChoiceField(
        choices=[
            ('banco', 'Banco'),
            ('posto', 'Posto'),
            ('supermercado', 'Supermercado'),
            ('diversos', 'Diversos'),
            ('todos', 'Todos')
        ],
        default='todos'
    )

class EstatisticasSerializer(serializers.Serializer):
    """Serializer para estatísticas gerais"""
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    
    def validate(self, data):
        if data.get('data_inicio') and data.get('data_fim'):
            if data['data_inicio'] > data['data_fim']:
                raise serializers.ValidationError("Data início deve ser anterior à data fim")
        return data

class DashboardSerializer(serializers.Serializer):
    """Serializer para dados do dashboard"""
    periodo = serializers.ChoiceField(
        choices=[
            ('7d', 'Últimos 7 dias'),
            ('30d', 'Últimos 30 dias'),
            ('3m', 'Últimos 3 meses'),
            ('6m', 'Últimos 6 meses'),
            ('1a', 'Último ano')
        ],
        default='30d'
    )
    incluir_infracoes = serializers.BooleanField(default=True)
    incluir_anexos = serializers.BooleanField(default=False)

# === SERIALIZERS DE RESPOSTA PARA DASHBOARDS ===
class AutosResumoSerializer(serializers.Serializer):
    total_bancos = serializers.IntegerField()
    total_postos = serializers.IntegerField()
    total_supermercados = serializers.IntegerField()
    total_diversos = serializers.IntegerField()


class InfracoesResumoSerializer(serializers.Serializer):
    total_infracoes = serializers.IntegerField()
    infracoes_mes = serializers.IntegerField()
    infracoes_pendentes = serializers.IntegerField()
    por_gravidade = serializers.DictField(child=serializers.IntegerField())


class ProcessosResumoSerializer(serializers.Serializer):
    total_processos = serializers.IntegerField()
    processos_pendentes = serializers.IntegerField()
    processos_finalizados = serializers.IntegerField()
    por_status = serializers.DictField(child=serializers.IntegerField())


class FiscalizacaoDashboardStatsSerializer(serializers.Serializer):
    autos = AutosResumoSerializer()
    infracoes = InfracoesResumoSerializer()
    processos = ProcessosResumoSerializer()
    tendencias = serializers.DictField(child=serializers.DictField(child=serializers.IntegerField()))
    resumo = serializers.DictField(child=serializers.IntegerField())


class FiscalizacaoEstatisticasResponseSerializer(serializers.Serializer):
    periodo = serializers.DictField(child=serializers.CharField(allow_null=True))
    totais = serializers.DictField(child=serializers.IntegerField())
    por_origem = serializers.DictField(child=serializers.IntegerField())
    irregularidades = serializers.DictField(child=serializers.IntegerField())
    infracoes_por_gravidade = serializers.DictField(child=serializers.IntegerField())
    infracoes_por_tipo = serializers.DictField(child=serializers.IntegerField())


class ProcessosDashboardSerializer(serializers.Serializer):
    resumo = serializers.DictField(child=serializers.IntegerField())
    por_status = serializers.DictField(child=serializers.IntegerField())
    por_prioridade = serializers.DictField(child=serializers.IntegerField())
    valores = serializers.DictField()
    tempo_medio_tramitacao = serializers.DictField()

class DashboardResponseSerializer(serializers.Serializer):
    """Serializer para resposta do dashboard"""
    total_autos = serializers.IntegerField()
    autos_por_tipo = serializers.DictField()
    autos_por_mes = serializers.ListField()
    irregularidades_mais_comuns = serializers.ListField()
    municipios_mais_fiscalizados = serializers.ListField()
    
class EstatisticasResponseSerializer(serializers.Serializer):
    """Serializer para resposta de estatísticas"""
    total_autos = serializers.IntegerField()
    total_com_irregularidades = serializers.IntegerField()
    total_sem_irregularidades = serializers.IntegerField()
    percentual_irregularidades = serializers.FloatField()
    autos_por_origem = serializers.DictField()
    autos_por_municipio = serializers.DictField()
    periodo_analisado = serializers.DictField()

# === SERIALIZERS SIMPLIFICADOS PARA LISTAS ===
class AutoSimpleSerializer(serializers.Serializer):
    """Serializer simplificado para listas de autos"""
    id = serializers.IntegerField()
    numero = serializers.CharField()
    razao_social = serializers.CharField()
    data_fiscalizacao = serializers.DateField()
    tipo = serializers.CharField()
    tem_irregularidades = serializers.BooleanField()

class FiscalSerializer(serializers.Serializer):
    """Serializer para informações de fiscais"""
    nome = serializers.CharField()
    total_autos = serializers.IntegerField()
    periodo = serializers.CharField()

# === SERIALIZERS PARA VALIDAÇÃO DE UPLOADS ===
class AnexoUploadSerializer(serializers.Serializer):
    """Serializer para upload de anexos"""
    arquivo = serializers.FileField()
    descricao = serializers.CharField(max_length=255, required=False)
    
    def validate_arquivo(self, value):
        """Valida o arquivo enviado"""
        # Tamanho máximo: 10MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Arquivo muito grande. Tamanho máximo: 10MB")
        
        # Tipos permit

class HistoricoProcessoSerializer(serializers.ModelSerializer):
    """Serializer para histórico de mudanças do processo"""
    
    class Meta:
        model = HistoricoProcesso
        fields = [
            'id', 'status_anterior', 'status_novo', 
            'observacao', 'usuario', 'data_mudanca'
        ]
        read_only_fields = ['data_mudanca']


class DocumentoProcessoSerializer(serializers.ModelSerializer):
    """Serializer para documentos do processo"""
    
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    tamanho_arquivo = serializers.SerializerMethodField()
    url_download = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentoProcesso
        fields = [
            'id', 'tipo', 'tipo_display', 'titulo', 
            'arquivo', 'descricao', 'data_upload', 
            'usuario_upload', 'tamanho_arquivo', 'url_download'
        ]
        read_only_fields = ['data_upload']
    
    def get_tamanho_arquivo(self, obj):
        """Retorna tamanho do arquivo formatado"""
        if obj.arquivo:
            try:
                size = obj.arquivo.size
                if size < 1024:
                    return f"{size} B"
                elif size < 1024**2:
                    return f"{size/1024:.1f} KB"
                else:
                    return f"{size/(1024**2):.1f} MB"
            except:
                return "N/A"
        return None
    
    def get_url_download(self, obj):
        """Retorna URL para download do arquivo"""
        if obj.arquivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None


class ParecerProcessoSerializer(serializers.ModelSerializer):
    elaborado_por_display = serializers.SerializerMethodField()
    processo_numero = serializers.CharField(source='processo.numero_processo', read_only=True)
    autuado = serializers.CharField(source='processo.autuado', read_only=True)

    class Meta:
        model = ParecerProcesso
        fields = [
            'id',
            'processo',
            'processo_numero',
            'autuado',
            'numero_parecer',
            'sintese_fatica',
            'parecer',
            'decisao',
            'elaborado_por',
            'elaborado_por_nome',
            'elaborado_por_display',
            'cargo_elaborador',
            'data_emissao',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = ['numero_parecer', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'processo': {'required': False},
            'elaborado_por': {'required': False},
        }

    def get_elaborado_por_display(self, obj):
        if obj.elaborado_por_nome:
            return obj.elaborado_por_nome
        if obj.elaborado_por:
            return obj.elaborado_por.get_full_name() or obj.elaborado_por.username
        return ''


class ProcessoSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de processos"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    prioridade_display = serializers.CharField(source='get_prioridade_display', read_only=True)
    status_cor = serializers.CharField(read_only=True)
    prioridade_cor = serializers.CharField(read_only=True)
    dias_ate_prazo_defesa = serializers.IntegerField(read_only=True)
    prazo_vencido = serializers.BooleanField(read_only=True)
    tempo_tramitacao = serializers.IntegerField(read_only=True)
    
    # Dados do auto de infração relacionado
    auto_infracao_numero = serializers.CharField(source='auto_infracao.numero', read_only=True)
    tipo_infracao = serializers.CharField(source='auto_infracao.tipo_infracao', read_only=True)
    gravidade = serializers.CharField(source='auto_infracao.gravidade', read_only=True)
    
    class Meta:
        model = Processo
        fields = [
            'id', 'numero_processo', 'autuado', 'cnpj',
            'status', 'status_display', 'status_cor',
            'prioridade', 'prioridade_display', 'prioridade_cor', 
            'valor_multa', 'valor_final',
            'prazo_defesa', 'dias_ate_prazo_defesa', 'prazo_vencido',
            'data_notificacao', 'criado_em', 'tempo_tramitacao',
            'auto_infracao_numero', 'tipo_infracao', 'gravidade'
        ]


class ProcessoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes do processo"""
    
    # Campos calculados e de display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    prioridade_display = serializers.CharField(source='get_prioridade_display', read_only=True)
    status_cor = serializers.CharField(read_only=True)
    prioridade_cor = serializers.CharField(read_only=True)
    
    # Propriedades calculadas
    dias_ate_prazo_defesa = serializers.IntegerField(read_only=True)
    dias_ate_prazo_recurso = serializers.IntegerField(read_only=True)
    prazo_vencido = serializers.BooleanField(read_only=True)
    tempo_tramitacao = serializers.IntegerField(read_only=True)
    pode_apresentar_defesa = serializers.BooleanField(read_only=True)
    pode_apresentar_recurso = serializers.BooleanField(read_only=True)
    
    # Dados do auto de infração relacionado (aninhado)
    auto_infracao_detalhes = serializers.SerializerMethodField()
    
    # Relacionamentos aninhados
    historico = HistoricoProcessoSerializer(many=True, read_only=True)
    documentos = DocumentoProcessoSerializer(many=True, read_only=True)
    
    # Estatísticas
    total_documentos = serializers.SerializerMethodField()
    
    class Meta:
        model = Processo
        fields = [
            'id', 'numero_processo', 'autuado', 'cnpj',
            'status', 'status_display', 'status_cor',
            'prioridade', 'prioridade_display', 'prioridade_cor',
            
            # Prazos e datas
            'prazo_defesa', 'prazo_recurso', 
            'data_notificacao', 'data_defesa', 'data_recurso', 
            'data_julgamento', 'data_finalizacao',
            
            # Valores
            'valor_multa', 'valor_final',
            
            # Responsáveis
            'fiscal_responsavel', 'analista_responsavel',
            
            # Observações
            'observacoes', 'observacoes_internas',
            
            # Campos calculados
            'dias_ate_prazo_defesa', 'dias_ate_prazo_recurso',
            'prazo_vencido', 'tempo_tramitacao',
            'pode_apresentar_defesa', 'pode_apresentar_recurso',
            
            # Relacionamentos
            'auto_infracao', 'auto_infracao_detalhes',
            'historico', 'documentos', 'total_documentos',
            
            # Metadados
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['numero_processo', 'criado_em', 'atualizado_em']
    
    def get_auto_infracao_detalhes(self, obj):
        """Retorna dados resumidos do auto de infração"""
        auto_infracao = getattr(obj, 'auto_infracao', None)
        if auto_infracao:
            return {
                'id': auto_infracao.id,
                'numero': auto_infracao.numero,
                'tipo_infracao': getattr(auto_infracao, 'tipo_infracao', None),
                'gravidade': getattr(auto_infracao, 'gravidade', None),
                'data_fiscalizacao': auto_infracao.data_fiscalizacao,
                'valor_multa': auto_infracao.valor_multa,
                'descricao_infracao': getattr(auto_infracao, 'descricao_infracao', None),
                'base_legal': getattr(auto_infracao, 'base_legal', None),
                'base_legal_cdc': getattr(auto_infracao, 'base_legal_cdc', None),
                'base_legal_outras': getattr(auto_infracao, 'base_legal_outras', None),
                'auto_origem': getattr(auto_infracao, 'auto_origem', None),
                'relatorio': getattr(auto_infracao, 'relatorio', None),
                'razao_social': getattr(auto_infracao, 'razao_social', None),
                'cnpj': getattr(auto_infracao, 'cnpj', None),
                'endereco': getattr(auto_infracao, 'endereco', None),
                'municipio': getattr(auto_infracao, 'municipio', None),
            }
        return None
    
    def get_total_documentos(self, obj):
        """Conta total de documentos por tipo"""
        documentos = obj.documentos.all()
        return {
            'total': documentos.count(),
            'defesas': documentos.filter(tipo='defesa').count(),
            'recursos': documentos.filter(tipo='recurso').count(),
            'pareceres': documentos.filter(tipo='parecer').count(),
            'decisoes': documentos.filter(tipo='decisao').count(),
            'outros': documentos.filter(tipo='outros').count(),
        }


class ProcessoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para criação e atualização de processos"""
    
    class Meta:
        model = Processo
        fields = [
            'auto_infracao', 'autuado', 'cnpj', 
            'status', 'prioridade',
            'prazo_defesa', 'prazo_recurso',
            'data_notificacao', 'data_defesa', 'data_recurso',
            'data_julgamento', 'valor_multa', 'valor_final',
            'fiscal_responsavel', 'analista_responsavel',
            'observacoes', 'observacoes_internas'
        ]
    
    def validate_auto_infracao(self, value):
        """Valida se o auto de infração já não tem processo"""
        if self.instance is None:  # Apenas na criação
            if hasattr(value, 'processo'):
                raise serializers.ValidationError(
                    "Este auto de infração já possui um processo associado."
                )
        return value
    
    def validate(self, data):
        """Validações cruzadas"""
        # Validação de prazos
        if data.get('prazo_defesa') and data.get('data_notificacao'):
            if data['prazo_defesa'] <= data['data_notificacao']:
                raise serializers.ValidationError({
                    'prazo_defesa': 'Prazo para defesa deve ser posterior à notificação'
                })
        
        # Validação de valores
        if data.get('valor_final') and data.get('valor_multa'):
            if data['valor_final'] > data['valor_multa']:
                raise serializers.ValidationError({
                    'valor_final': 'Valor final não pode ser maior que a multa original'
                })
        
        return data
    
    def create(self, validated_data):
        """Criação customizada do processo"""
        # Auto-preenche dados do auto de infração se não fornecidos
        auto_infracao = validated_data.get('auto_infracao')
        
        if auto_infracao:
            if not validated_data.get('autuado'):
                validated_data['autuado'] = auto_infracao.razao_social
            
            if not validated_data.get('cnpj'):
                validated_data['cnpj'] = auto_infracao.cnpj
            
            if not validated_data.get('valor_multa'):
                validated_data['valor_multa'] = auto_infracao.valor_multa
            
            if not validated_data.get('fiscal_responsavel'):
                validated_data['fiscal_responsavel'] = auto_infracao.fiscal_responsavel
        
        processo = super().create(validated_data)
        
        # Calcula prazos automáticamente se não fornecidos
        if processo.data_notificacao and not processo.prazo_defesa:
            processo.calcular_prazos()
            processo.save()
        
        return processo


class AtualizarStatusProcessoSerializer(serializers.Serializer):
    """Serializer para atualização de status do processo"""
    
    novo_status = serializers.ChoiceField(choices=Processo.STATUS_CHOICES)
    observacao = serializers.CharField(required=False, allow_blank=True)
    data_evento = serializers.DateField(
        required=False, 
        help_text="Data do evento (defesa, recurso, etc.)"
    )
    
    def validate_novo_status(self, value):
        """Valida transições de status"""
        processo = self.context.get('processo')
        
        if not processo:
            return value
        
        # Define transições válidas
        transicoes_validas = {
            'aguardando_defesa': ['defesa_apresentada', 'em_analise', 'arquivado', 'prescrito'],
            'defesa_apresentada': ['em_analise', 'aguardando_recurso', 'finalizado_improcedente'],
            'em_analise': ['aguardando_recurso', 'finalizado_procedente', 'finalizado_improcedente'],
            'aguardando_recurso': ['recurso_apresentado', 'finalizado_procedente'],
            'recurso_apresentado': ['julgamento', 'finalizado_procedente', 'finalizado_improcedente'],
            'julgamento': ['finalizado_procedente', 'finalizado_improcedente'],
        }
        
        status_atual = processo.status
        if status_atual in transicoes_validas:
            if value not in transicoes_validas[status_atual]:
                raise serializers.ValidationError(
                    f"Transição de '{status_atual}' para '{value}' não é permitida."
                )
        
        return value


class ProcessoEstatisticasSerializer(serializers.Serializer):
    """Serializer para estatísticas de processos"""
    
    # Totais por status
    total_processos = serializers.IntegerField()
    aguardando_defesa = serializers.IntegerField()
    em_analise = serializers.IntegerField() 
    finalizados = serializers.IntegerField()
    arquivados = serializers.IntegerField()
    
    # Prazos
    prazos_vencidos = serializers.IntegerField()
    prazos_proximos_vencimento = serializers.IntegerField()  # próximos 7 dias
    
    # Valores
    valor_total_multas = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_medio_multa = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Tempos médios
    tempo_medio_tramitacao = serializers.IntegerField()  # em dias
    
    # Por prioridade
    processos_por_prioridade = serializers.DictField()
    
    # Por fiscal
    processos_por_fiscal = serializers.ListField()


class ProcessoResumoMensalSerializer(serializers.Serializer):
    """Serializer para resumo mensal de processos"""
    
    mes = serializers.CharField()
    ano = serializers.IntegerField()
    
    # Criados no mês
    processos_criados = serializers.IntegerField()
    valor_multas_mes = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Finalizados no mês
    processos_finalizados = serializers.IntegerField()
    procedentes = serializers.IntegerField()
    improcedentes = serializers.IntegerField()
    
    # Prazos vencidos no mês
    prazos_vencidos_mes = serializers.IntegerField()
    
    # Top infrações
    principais_infracoes = serializers.ListField()
    
    # Fiscais mais ativos
    fiscais_ativos = serializers.ListField()


# === SERIALIZERS PARA DOCUMENTOS ===

class DocumentoUploadSerializer(serializers.ModelSerializer):
    """Serializer para upload de documentos do processo"""

    tipo_documento = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = DocumentoProcesso
        fields = ['tipo', 'tipo_documento', 'titulo', 'arquivo', 'descricao', 'usuario_upload']
        extra_kwargs = {
            'tipo': {'required': False},
            'titulo': {'required': False, 'allow_blank': True},
            'usuario_upload': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        tipo = attrs.get('tipo')
        tipo_documento = attrs.pop('tipo_documento', None)

        if not tipo and tipo_documento:
            tipo_map = {
                'auto_infracao': 'auto_infracao',
                'defesa_previa': 'defesa',
                'recurso': 'recurso',
                'parecer_juridico': 'parecer',
                'notificacao': 'outros',
                'comprovante_pagamento': 'outros',
                'documento_adicional': 'outros',
                'correspondencia': 'outros',
                'laudo_tecnico': 'outros',
                'outros': 'outros',
                'decisao': 'decisao',
            }
            tipo = tipo_map.get(tipo_documento, tipo_documento)
            attrs['tipo'] = tipo

        if not tipo:
            raise serializers.ValidationError({'tipo': 'Tipo do documento é obrigatório.'})

        tipos_validos = {choice[0] for choice in DocumentoProcesso.TIPO_DOCUMENTO_CHOICES}
        if tipo not in tipos_validos:
            raise serializers.ValidationError({'tipo': 'Tipo do documento inválido.'})

        if not attrs.get('titulo'):
            arquivo = attrs.get('arquivo')
            if arquivo and getattr(arquivo, 'name', ''):
                attrs['titulo'] = os.path.splitext(os.path.basename(arquivo.name))[0]

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            nome_usuario = request.user.get_full_name() or request.user.username
            if nome_usuario:
                validated_data['usuario_upload'] = nome_usuario
        return super().create(validated_data)
    
    def validate_arquivo(self, value):
        """Valida o arquivo enviado"""
        # Tamanho máximo: 50MB
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("Arquivo muito grande. Máximo: 50MB")
        
        # Tipos permitidos
        tipos_permitidos = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        if value.content_type not in tipos_permitidos:
            raise serializers.ValidationError(
                "Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX"
            )
        
        return value


# === SERIALIZERS PARA FILTROS E BUSCA ===

class ProcessoFiltroSerializer(serializers.Serializer):
    """Serializer para filtros de busca de processos"""
    
    status = serializers.MultipleChoiceField(
        choices=Processo.STATUS_CHOICES,
        required=False
    )
    
    prioridade = serializers.MultipleChoiceField(
        choices=Processo.PRIORIDADE_CHOICES,
        required=False
    )
    
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    
    prazo_vencido = serializers.BooleanField(required=False)
    
    fiscal_responsavel = serializers.CharField(required=False)
    analista_responsavel = serializers.CharField(required=False)
    
    valor_minimo = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False
    )
    
    valor_maximo = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False
    )
    
    tipo_infracao = serializers.CharField(required=False)
    gravidade = serializers.CharField(required=False)
    
    municipio = serializers.CharField(required=False)
    
    def validate(self, data):
        """Validações de filtros"""
        if data.get('data_inicio') and data.get('data_fim'):
            if data['data_inicio'] > data['data_fim']:
                raise serializers.ValidationError(
                    "Data início deve ser anterior à data fim"
                )
        
        if data.get('valor_minimo') and data.get('valor_maximo'):
            if data['valor_minimo'] > data['valor_maximo']:
                raise serializers.ValidationError(
                    "Valor mínimo deve ser menor que valor máximo"
                )
        
        return data


class ProcessoBuscaSerializer(serializers.Serializer):
    """Serializer para busca textual em processos"""
    
    termo = serializers.CharField(
        min_length=2,
        help_text="Termo de busca (mínimo 2 caracteres)"
    )
    
    campos = serializers.MultipleChoiceField(
        choices=[
            ('numero_processo', 'Número do Processo'),
            ('autuado', 'Autuado'), 
            ('cnpj', 'CNPJ'),
            ('observacoes', 'Observações'),
            ('fiscal_responsavel', 'Fiscal Responsável'),
            ('analista_responsavel', 'Analista Responsável'),
        ],
        required=False,
        help_text="Campos onde buscar (se vazio, busca em todos)"
    )
    
    limite = serializers.IntegerField(
        min_value=1,
        max_value=100,
        default=20,
        help_text="Limite de resultados"
    )
            
# === SERIALIZERS PARA MODELOS AVANÇADOS ===

class TipoFiscalizacaoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de fiscalização"""
    class Meta:
        model = TipoFiscalizacao
        fields = [
            'id', 'nome', 'tipo', 'descricao', 'ativo', 'data_criacao'
        ]
        read_only_fields = ['data_criacao']


class EvidenciaFiscalizacaoSerializer(serializers.ModelSerializer):
    """Serializer para evidências de fiscalização"""
    upload_por = UserSerializer(read_only=True)
    
    class Meta:
        model = EvidenciaFiscalizacao
        fields = [
            'id', 'auto_infracao', 'tipo', 'titulo', 'descricao', 'arquivo',
            'nome_arquivo', 'tamanho_arquivo', 'data_upload', 'upload_por'
        ]
        read_only_fields = ['nome_arquivo', 'tamanho_arquivo', 'data_upload', 'upload_por']


class EvidenciaFiscalizacaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de evidências"""
    class Meta:
        model = EvidenciaFiscalizacao
        fields = [
            'auto_infracao', 'tipo', 'titulo', 'descricao', 'arquivo'
        ]
    
    def create(self, validated_data):
        validated_data['upload_por'] = self.context['request'].user
        return super().create(validated_data)


class AutoInfracaoAvancadoSerializer(serializers.ModelSerializer):
    """Serializer para autos de infração avançados"""
    auto_infracao = AutoInfracaoSerializer(read_only=True)
    gerado_por = UserSerializer(read_only=True)
    assinado_por = UserSerializer(read_only=True)
    modificado_por = UserSerializer(read_only=True)
    dias_restantes_defesa = serializers.ReadOnlyField()
    dias_restantes_pagamento = serializers.ReadOnlyField()
    esta_atrasado_defesa = serializers.ReadOnlyField()
    esta_atrasado_pagamento = serializers.ReadOnlyField()
    
    class Meta:
        model = AutoInfracaoAvancado
        fields = [
            'id', 'auto_infracao', 'gerado_automaticamente', 'template_utilizado',
            'data_geracao', 'gerado_por', 'assinatura_digital', 'certificado_assinatura',
            'data_assinatura', 'assinado_por', 'notificacao_eletronica', 'email_notificacao',
            'data_notificacao', 'protocolo_notificacao', 'prazo_defesa', 'data_limite_defesa',
            'prazo_pagamento', 'data_limite_pagamento', 'status_workflow', 'versao_documento',
            'hash_documento', 'data_modificacao', 'modificado_por', 'dias_restantes_defesa',
            'dias_restantes_pagamento', 'esta_atrasado_defesa', 'esta_atrasado_pagamento'
        ]
        read_only_fields = [
            'data_geracao', 'data_assinatura', 'data_notificacao', 'data_modificacao',
            'dias_restantes_defesa', 'dias_restantes_pagamento', 'esta_atrasado_defesa',
            'esta_atrasado_pagamento'
        ]


class AutoInfracaoAvancadoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de autos avançados"""
    class Meta:
        model = AutoInfracaoAvancado
        fields = [
            'auto_infracao', 'gerado_automaticamente', 'template_utilizado',
            'assinatura_digital', 'certificado_assinatura', 'notificacao_eletronica',
            'email_notificacao', 'prazo_defesa', 'prazo_pagamento', 'status_workflow'
        ]
    
    def create(self, validated_data):
        validated_data['gerado_por'] = self.context['request'].user
        validated_data['modificado_por'] = self.context['request'].user
        return super().create(validated_data)


class HistoricoAutoInfracaoSerializer(serializers.ModelSerializer):
    """Serializer para histórico de autos de infração"""
    usuario = UserSerializer(read_only=True)
    
    class Meta:
        model = HistoricoAutoInfracao
        fields = [
            'id', 'auto_infracao', 'usuario', 'acao', 'descricao', 'dados_anteriores',
            'dados_novos', 'data_acao', 'ip_origem'
        ]
        read_only_fields = ['data_acao']


class TemplateAutoInfracaoSerializer(serializers.ModelSerializer):
    """Serializer para templates de autos de infração"""
    tipo_fiscalizacao = TipoFiscalizacaoSerializer(read_only=True)
    criado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = TemplateAutoInfracao
        fields = [
            'id', 'nome', 'descricao', 'tipo_fiscalizacao', 'configuracao',
            'campos_obrigatorios', 'campos_opcionais', 'base_legal_padrao',
            'fundamentacao_padrao', 'valor_multa_padrao', 'prazo_defesa_padrao',
            'prazo_pagamento_padrao', 'ativo', 'padrao', 'criado_por', 'data_criacao'
        ]
        read_only_fields = ['data_criacao']


class TemplateAutoInfracaoCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de templates"""
    class Meta:
        model = TemplateAutoInfracao
        fields = [
            'nome', 'descricao', 'tipo_fiscalizacao', 'configuracao',
            'campos_obrigatorios', 'campos_opcionais', 'base_legal_padrao',
            'fundamentacao_padrao', 'valor_multa_padrao', 'prazo_defesa_padrao',
            'prazo_pagamento_padrao', 'ativo', 'padrao'
        ]
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class NotificacaoEletronicaSerializer(serializers.ModelSerializer):
    """Serializer para notificações eletrônicas"""
    auto_infracao = AutoInfracaoSerializer(read_only=True)
    enviado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = NotificacaoEletronica
        fields = [
            'id', 'auto_infracao', 'tipo', 'destinatario', 'assunto', 'mensagem',
            'status', 'protocolo', 'data_envio', 'data_entrega', 'tentativas',
            'erro_mensagem', 'enviado_por', 'data_criacao'
        ]
        read_only_fields = ['protocolo', 'data_envio', 'data_entrega', 'tentativas', 'data_criacao']


class NotificacaoEletronicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de notificações"""
    class Meta:
        model = NotificacaoEletronica
        fields = [
            'auto_infracao', 'tipo', 'destinatario', 'assunto', 'mensagem'
        ]
    
    def create(self, validated_data):
        validated_data['enviado_por'] = self.context['request'].user
        return super().create(validated_data)


class ConfiguracaoFiscalizacaoSerializer(serializers.ModelSerializer):
    """Serializer para configurações de fiscalização"""
    configurado_por = UserSerializer(read_only=True)
    
    class Meta:
        model = ConfiguracaoFiscalizacao
        fields = [
            'id', 'max_evidencias_por_auto', 'max_tamanho_arquivo', 'tipos_arquivo_permitidos',
            'notificar_prazos', 'dias_antecedencia_prazo', 'notificar_atrasos',
            'assinatura_digital_obrigatoria', 'certificado_padrao', 'workflow_automatico',
            'aprovacao_obrigatoria', 'configurado_por', 'data_configuracao'
        ]
        read_only_fields = ['data_configuracao']


# --- SERIALIZERS PARA EVIDÊNCIAS FOTOGRÁFICAS ---
class EvidenciaFotograficaSerializer(serializers.ModelSerializer):
    fiscal_upload_nome = serializers.CharField(source='fiscal_upload.get_full_name', read_only=True)
    foto_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EvidenciaFotografica
        fields = [
            'id', 'tipo_evidencia', 'descricao', 'foto', 'foto_url',
            'data_upload', 'fiscal_upload', 'fiscal_upload_nome',
            'auto', 'auto_posto', 'auto_supermercado', 'auto_diversos'
        ]
        read_only_fields = ['id', 'data_upload', 'fiscal_upload_nome']
    
    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
        return None
    
    def create(self, validated_data):
        # Define o fiscal responsável automaticamente
        validated_data['fiscal_upload'] = self.context['request'].user
        return super().create(validated_data)


# --- SERIALIZERS PARA ASSINATURA DIGITAL ---
class AssinaturaDigitalSerializer(serializers.ModelSerializer):
    assinante_nome = serializers.CharField(source='nome_assinante', read_only=True)
    assinatura_manual_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AssinaturaDigital
        fields = [
            'id', 'tipo_assinatura', 'nome_assinante', 'cpf_assinante',
            'email_assinante', 'hash_assinatura', 'certificado_digital',
            'status', 'data_assinatura', 'data_expiracao', 'ip_assinatura',
            'user_agent', 'assinatura_manual', 'assinatura_manual_url',
            'auto', 'auto_posto', 'auto_supermercado', 'auto_diversos',
            'assinante_nome'
        ]
        read_only_fields = ['id', 'data_assinatura', 'ip_assinatura', 'user_agent']
    
    def get_assinatura_manual_url(self, obj):
        if obj.assinatura_manual:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.assinatura_manual.url)
        return None
    
    def validate(self, data):
        # Validação de CPF
        cpf = data.get('cpf_assinante', '')
        if cpf and not self.validar_cpf(cpf):
            raise serializers.ValidationError("CPF inválido")
        
        # Validação de data de expiração
        data_expiracao = data.get('data_expiracao')
        if data_expiracao and data_expiracao <= timezone.now():
            raise serializers.ValidationError("Data de expiração deve ser futura")
        
        return data
    
    def validar_cpf(self, cpf):
        """Validação básica de CPF"""
        cpf = ''.join(filter(str.isdigit, cpf))
        if len(cpf) != 11:
            return False
        return True


# --- SERIALIZERS PARA NOTIFICAÇÃO ELETRÔNICA ---
class NotificacaoEletronicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificacaoEletronica
        fields = [
            'id', 'numero', 'tipo_notificacao', 'destinatario_nome', 'destinatario_email',
            'destinatario_cpf_cnpj', 'representante_legal', 'assunto', 'mensagem', 'anexos',
            'status', 'data_envio', 'data_entrega', 'data_leitura',
            'tentativas_envio', 'max_tentativas', 'proxima_tentativa',
            'logs_envio', 'auto', 'auto_posto', 'auto_supermercado', 'auto_diversos', 'auto_infracao',
            'processo', 'ppa'
        ]
        read_only_fields = [
            'id', 'numero', 'data_envio', 'data_entrega', 'data_leitura',
            'tentativas_envio', 'proxima_tentativa', 'logs_envio', 'processo', 'ppa'
        ]
    
    def validate(self, data):
        # Validação de email
        email = data.get('destinatario_email', '')
        if email and not self.validar_email(email):
            raise serializers.ValidationError("Email inválido")
        
        # Validação de CPF/CNPJ
        cpf_cnpj = data.get('destinatario_cpf_cnpj', '')
        if cpf_cnpj and not self.validar_cpf_cnpj(cpf_cnpj):
            raise serializers.ValidationError("CPF/CNPJ inválido")
        
        return data
    
    def validar_email(self, email):
        """Validação básica de email"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validar_cpf_cnpj(self, cpf_cnpj):
        """Validação básica de CPF/CNPJ"""
        cpf_cnpj = ''.join(filter(str.isdigit, cpf_cnpj))
        return len(cpf_cnpj) in [11, 14]


# --- SERIALIZERS PARA CONTROLE DE PRAZOS ---
class ControlePrazosSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(source='responsavel.get_full_name', read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ControlePrazos
        fields = [
            'id', 'tipo_prazo', 'descricao', 'data_inicio', 'data_fim',
            'data_prorrogacao', 'status', 'dias_restantes', 'alerta_5_dias',
            'alerta_3_dias', 'alerta_1_dia', 'alerta_vencido', 'responsavel',
            'responsavel_nome', 'notificar_emails', 'historico_alteracoes',
            'auto', 'auto_posto', 'auto_supermercado', 'auto_diversos'
        ]
        read_only_fields = ['id', 'dias_restantes', 'historico_alteracoes']
    
    def validate(self, data):
        # Validação de datas
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim')
        
        if data_inicio and data_fim and data_inicio >= data_fim:
            raise serializers.ValidationError("Data de fim deve ser posterior à data de início")
        
        # Validação de prorrogação
        data_prorrogacao = data.get('data_prorrogacao')
        if data_prorrogacao and data_fim and data_prorrogacao <= data_fim:
            raise serializers.ValidationError("Data de prorrogação deve ser posterior à data de fim")
        
        return data


# --- SERIALIZERS PARA CONFIGURAÇÕES ---
class ConfiguracaoFiscalizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoFiscalizacao
        fields = '__all__'
        read_only_fields = ['id']


# --- SERIALIZERS PARA DASHBOARD AVANÇADO ---
class DashboardFiscalizacaoAvancadoSerializer(serializers.Serializer):
    """Serializer para dados do dashboard avançado de fiscalização"""
    
    # Estatísticas gerais
    total_autos = serializers.IntegerField()
    autos_este_mes = serializers.IntegerField()
    autos_pendentes = serializers.IntegerField()
    autos_vencidos = serializers.IntegerField()
    
    # Evidências
    total_evidencias = serializers.IntegerField()
    evidencias_este_mes = serializers.IntegerField()
    
    # Assinaturas
    assinaturas_pendentes = serializers.IntegerField()
    assinaturas_vencidas = serializers.IntegerField()
    
    # Notificações
    notificacoes_pendentes = serializers.IntegerField()
    notificacoes_enviadas = serializers.IntegerField()
    notificacoes_entregues = serializers.IntegerField()
    
    # Prazos
    prazos_vencendo = serializers.IntegerField()
    prazos_vencidos = serializers.IntegerField()
    
    # Gráficos
    autos_por_tipo = serializers.DictField()
    autos_por_mes = serializers.ListField()
    status_evidencias = serializers.DictField()
    status_assinaturas = serializers.DictField()
    
    # Alertas
    alertas_criticos = serializers.ListField()
    alertas_importantes = serializers.ListField()


class RelatorioFiscalizacaoSerializer(serializers.Serializer):
    """Serializer para relatórios de fiscalização"""
    periodo = serializers.CharField()
    total_fiscalizacoes = serializers.IntegerField()
    total_autos = serializers.IntegerField()
    total_multas = serializers.DecimalField(max_digits=15, decimal_places=2)
    fiscalizacoes_por_mes = serializers.ListField()
    fiscais_mais_ativos = serializers.ListField()
    tipos_mais_fiscalizados = serializers.ListField()
    municipios_mais_fiscalizados = serializers.ListField()


# === SERIALIZERS PARA FILTROS AVANÇADOS ===

class AutoInfracaoAvancadoFilterSerializer(serializers.Serializer):
    """Serializer para filtros de autos avançados"""
    status_workflow = serializers.CharField(required=False)
    gerado_automaticamente = serializers.BooleanField(required=False)
    assinatura_digital = serializers.BooleanField(required=False)
    notificacao_eletronica = serializers.BooleanField(required=False)
    atrasado = serializers.BooleanField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)
    template_utilizado = serializers.CharField(required=False)


class EvidenciaFilterSerializer(serializers.Serializer):
    """Serializer para filtros de evidências"""
    tipo = serializers.CharField(required=False)
    auto_infracao = serializers.IntegerField(required=False)
    upload_por = serializers.IntegerField(required=False)
    data_inicio = serializers.DateField(required=False)
    data_fim = serializers.DateField(required=False)


# === SERIALIZERS PARA AÇÕES ESPECÍFICAS ===

class GerarAutoAutomaticoSerializer(serializers.Serializer):
    """Serializer para geração automática de autos"""
    template_id = serializers.IntegerField()
    dados_estabelecimento = serializers.DictField()
    infracoes_constatadas = serializers.ListField()
    valor_multa = serializers.DecimalField(max_digits=12, decimal_places=2)
    observacoes = serializers.CharField(required=False, allow_blank=True)


class AssinarAutoSerializer(serializers.Serializer):
    """Serializer para assinatura de autos"""
    certificado = serializers.CharField(required=False)
    senha_certificado = serializers.CharField(required=False, write_only=True)
    motivo_assinatura = serializers.CharField(required=False, allow_blank=True)


class NotificarAutoSerializer(serializers.Serializer):
    """Serializer para notificação de autos"""
    tipo_notificacao = serializers.ChoiceField(choices=[
        ('auto_infracao', 'Auto de Infração'),
        ('prazo_vencendo', 'Prazo Vencendo'),
        ('prazo_vencido', 'Prazo Vencido'),
        ('defesa_apresentada', 'Defesa Apresentada'),
        ('recurso_apresentado', 'Recurso Apresentado'),
        ('decisao_proferida', 'Decisão Proferida'),
    ])
    destinatario = serializers.CharField()
    assunto = serializers.CharField()
    mensagem = serializers.CharField(required=False, allow_blank=True)
    enviar_copia = serializers.BooleanField(default=False)
    email_copia = serializers.EmailField(required=False)


class UploadEvidenciaSerializer(serializers.Serializer):
    """Serializer para upload de evidências"""
    auto_infracao = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=EvidenciaFiscalizacao.TIPO_CHOICES)
    titulo = serializers.CharField()
    descricao = serializers.CharField(required=False, allow_blank=True)
    arquivo = serializers.FileField()            

class AutoApreensaoInutilizacaoSerializer(serializers.ModelSerializer):
    """
    Serializer para Auto de Apreensão/Inutilização
    Baseado no formulário oficial do PROCON-AM
    """
    itens_detalhados = serializers.SerializerMethodField()
    total_itens = serializers.SerializerMethodField()
    valor_total = serializers.SerializerMethodField()
    numero_completo = serializers.SerializerMethodField()
    auto_constatacao_info = serializers.SerializerMethodField()
    proximo_numero = serializers.SerializerMethodField()
    
    class Meta:
        model = AutoApreensaoInutilizacao
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'numero_documento')
    
    def get_itens_detalhados(self, obj):
        """Retorna os itens detalhados do auto"""
        return ItemApreensaoInutilizacaoSerializer(obj.itens_detalhados.all(), many=True).data
    
    def get_total_itens(self, obj):
        """Retorna o total de itens"""
        return obj.get_total_itens()
    
    def get_valor_total(self, obj):
        """Retorna o valor total dos itens"""
        return obj.get_valor_total()
    
    def get_numero_completo(self, obj):
        """Retorna o número completo do documento"""
        return obj.get_numero_completo()
    
    def get_auto_constatacao_info(self, obj):
        """Retorna informações do auto de constatação vinculado"""
        if obj.auto_constatacao:
            return {
                'id': obj.auto_constatacao.id,
                'numero': obj.auto_constatacao.numero,
                'razao_social': obj.auto_constatacao.razao_social,
                'nome_fantasia': obj.auto_constatacao.nome_fantasia,
                'data_fiscalizacao': obj.auto_constatacao.data_fiscalizacao,
                'hora_fiscalizacao': obj.auto_constatacao.hora_fiscalizacao,
            }
        return None
    
    def get_proximo_numero(self, obj):
        """Retorna o próximo número que será gerado"""
        from .utils import obter_proximo_numero_apreensao_preview
        return obter_proximo_numero_apreensao_preview()
    
    def create(self, validated_data):
        """Cria o auto e associa ao usuário atual"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ItemApreensaoInutilizacaoSerializer(serializers.ModelSerializer):
    """
    Serializer para itens de apreensão/inutilização
    """
    valor_total = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemApreensaoInutilizacao
        fields = '__all__'
    
    def get_valor_total(self, obj):
        """Calcula o valor total do item"""
        return obj.get_valor_total()

class AutoSupermercadoListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar autos de supermercado
    """
    class Meta:
        model = AutoSupermercado
        fields = [
            'id',
            'numero',
            'razao_social',
            'nome_fantasia',
            'atividade',
            'endereco',
            'cep',
            'municipio',
            'estado',
            'cnpj',
            'telefone',
            'data_fiscalizacao',
            'hora_fiscalizacao',
            'fiscal_nome_1',
            'fiscal_nome_2',
            'responsavel_nome',
            'responsavel_cpf',
        ]
