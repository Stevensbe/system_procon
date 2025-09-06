"""
SISPROCON - Sistema de Notificações Automáticas
Gerencia notificações de prazos, vencimentos e atualizações importantes
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings


class TipoNotificacao(models.Model):
    """Tipos de notificações do sistema"""
    
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]
    
    nome = models.CharField("Nome", max_length=100)
    descricao = models.TextField("Descrição", blank=True)
    prioridade = models.CharField("Prioridade", max_length=10, choices=PRIORIDADE_CHOICES, default='media')
    ativo = models.BooleanField("Ativo", default=True)
    
    # Configurações de envio
    enviar_email = models.BooleanField("Enviar por Email", default=True)
    dias_antecedencia = models.IntegerField("Dias de Antecedência", default=3)
    
    class Meta:
        verbose_name = "Tipo de Notificação"
        verbose_name_plural = "Tipos de Notificações"
    
    def __str__(self):
        return self.nome


class Notificacao(models.Model):
    """Notificações enviadas aos usuários"""
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviada', 'Enviada'),
        ('lida', 'Lida'),
        ('erro', 'Erro no Envio'),
    ]
    
    tipo = models.ForeignKey(TipoNotificacao, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificacoes')
    titulo = models.CharField("Título", max_length=200)
    mensagem = models.TextField("Mensagem")
    
    # Status e controle
    status = models.CharField("Status", max_length=10, choices=STATUS_CHOICES, default='pendente')
    data_criacao = models.DateTimeField("Criado em", auto_now_add=True)
    data_envio = models.DateTimeField("Enviado em", null=True, blank=True)
    data_leitura = models.DateTimeField("Lido em", null=True, blank=True)
    
    # Dados do objeto relacionado (protocolo, multa, etc.)
    objeto_tipo = models.CharField("Tipo do Objeto", max_length=50, blank=True)
    objeto_id = models.PositiveIntegerField("ID do Objeto", null=True, blank=True)
    objeto_url = models.URLField("URL do Objeto", blank=True)
    
    # Controle de tentativas de envio
    tentativas_envio = models.IntegerField("Tentativas de Envio", default=0)
    ultimo_erro = models.TextField("Último Erro", blank=True)
    
    class Meta:
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ['-data_criacao']
        indexes = [
            models.Index(fields=['usuario', 'status']),
            models.Index(fields=['data_criacao']),
            models.Index(fields=['tipo', 'status']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.usuario.username}"
    
    def marcar_como_lida(self):
        """Marca a notificação como lida"""
        if self.status != 'lida':
            self.status = 'lida'
            self.data_leitura = timezone.now()
            self.save()
    
    def enviar_email(self):
        """Envia notificação por email"""
        if not self.usuario.email:
            self.status = 'erro'
            self.ultimo_erro = "Usuário não possui email cadastrado"
            self.save()
            return False
        
        try:
            subject = f"[SISPROCON] {self.titulo}"
            message = self.mensagem
            
            if self.objeto_url:
                message += f"\n\nAcesse: {self.objeto_url}"
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.usuario.email],
                fail_silently=False
            )
            
            self.status = 'enviada'
            self.data_envio = timezone.now()
            self.save()
            return True
            
        except Exception as e:
            self.status = 'erro'
            self.ultimo_erro = str(e)
            self.tentativas_envio += 1
            self.save()
            return False


class GerenciadorNotificacoes:
    """Classe utilitária para gerenciar notificações automáticas"""
    
    @staticmethod
    def criar_notificacao_prazo_vencimento(protocolo):
        """Cria notificação de prazo vencendo"""
        if not protocolo.responsavel_atual:
            return None
        
        tipo_notif, created = TipoNotificacao.objects.get_or_create(
            nome="Prazo Vencendo",
            defaults={
                'descricao': 'Notificação de prazo próximo ao vencimento',
                'prioridade': 'alta',
                'dias_antecedencia': 3
            }
        )
        
        notificacao = Notificacao.objects.create(
            tipo=tipo_notif,
            usuario=protocolo.responsavel_atual,
            titulo=f"Prazo vencendo - Protocolo {protocolo.numero_protocolo}",
            mensagem=f"""
O protocolo {protocolo.numero_protocolo} possui prazo vencendo em {protocolo.dias_para_vencimento} dias.

Assunto: {protocolo.assunto}
Remetente: {protocolo.remetente_nome}
Prazo: {protocolo.prazo_resposta.strftime('%d/%m/%Y')}

É necessário tomar providências urgentes.
            """.strip(),
            objeto_tipo="protocolo",
            objeto_id=protocolo.id,
        )
        
        return notificacao
    
    @staticmethod
    def criar_notificacao_multa_vencida(multa):
        """Cria notificação de multa vencida"""
        # Busca usuários do setor financeiro
        usuarios_financeiro = User.objects.filter(
            groups__name__icontains='financeiro'
        )
        
        if not usuarios_financeiro.exists():
            # Se não há grupo específico, notifica administradores
            usuarios_financeiro = User.objects.filter(is_staff=True)
        
        tipo_notif, created = TipoNotificacao.objects.get_or_create(
            nome="Multa Vencida",
            defaults={
                'descricao': 'Notificação de multa com pagamento vencido',
                'prioridade': 'critica'
            }
        )
        
        notificacoes = []
        for usuario in usuarios_financeiro:
            notificacao = Notificacao.objects.create(
                tipo=tipo_notif,
                usuario=usuario,
                titulo=f"Multa vencida - {multa.empresa.razao_social}",
                mensagem=f"""
A multa #{multa.pk} está vencida há {abs(multa.dias_para_vencimento)} dias.

Empresa: {multa.empresa.razao_social}
CNPJ: {multa.empresa.cnpj}
Valor: R$ {multa.valor:.2f}
Vencimento: {multa.data_vencimento.strftime('%d/%m/%Y')}

É necessário iniciar processo de cobrança.
                """.strip(),
                objeto_tipo="multa",
                objeto_id=multa.id,
            )
            notificacoes.append(notificacao)
        
        return notificacoes
    
    @staticmethod
    def criar_notificacao_processo_finalizado(processo):
        """Cria notificação quando processo é finalizado"""
        # Busca usuários do setor jurídico
        usuarios_juridico = User.objects.filter(
            groups__name__icontains='juridico'
        )
        
        if not usuarios_juridico.exists():
            usuarios_juridico = User.objects.filter(is_staff=True)
        
        tipo_notif, created = TipoNotificacao.objects.get_or_create(
            nome="Processo Finalizado",
            defaults={
                'descricao': 'Notificação de processo administrativo finalizado',
                'prioridade': 'media'
            }
        )
        
        notificacoes = []
        for usuario in usuarios_juridico:
            notificacao = Notificacao.objects.create(
                tipo=tipo_notif,
                usuario=usuario,
                titulo=f"Processo finalizado - {processo.numero_processo}",
                mensagem=f"""
O processo {processo.numero_processo} foi finalizado.

Autuado: {processo.autuado}
Status: {processo.get_status_display()}
Valor da multa: R$ {processo.valor_multa:.2f if processo.valor_multa else 0:.2f}

Processo disponível para consulta no sistema.
                """.strip(),
                objeto_tipo="processo",
                objeto_id=processo.id,
            )
            notificacoes.append(notificacao)
        
        return notificacoes
    
    @staticmethod
    def verificar_prazos_vencendo():
        """Verifica protocolos com prazos próximos ao vencimento"""
        from .models import ProtocoloDocumento
        
        # Busca protocolos que vencem em até 3 dias
        data_limite = timezone.now() + timedelta(days=3)
        protocolos_vencendo = ProtocoloDocumento.objects.filter(
            prazo_resposta__lte=data_limite,
            status__in=['PROTOCOLADO', 'EM_TRAMITACAO', 'EM_ANALISE'],
            responsavel_atual__isnull=False
        )
        
        notificacoes_criadas = []
        for protocolo in protocolos_vencendo:
            # Verifica se já foi criada notificação para este prazo
            notif_existe = Notificacao.objects.filter(
                objeto_tipo="protocolo",
                objeto_id=protocolo.id,
                tipo__nome="Prazo Vencendo",
                data_criacao__date=timezone.now().date()
            ).exists()
            
            if not notif_existe:
                notif = GerenciadorNotificacoes.criar_notificacao_prazo_vencimento(protocolo)
                if notif:
                    notificacoes_criadas.append(notif)
        
        return notificacoes_criadas
    
    @staticmethod
    def verificar_multas_vencidas():
        """Verifica multas com pagamento vencido"""
        from multas.models import Multa
        
        multas_vencidas = Multa.objects.filter(
            status='pendente',
            data_vencimento__lt=timezone.now().date()
        )
        
        notificacoes_criadas = []
        for multa in multas_vencidas:
            # Atualiza status da multa
            multa.status = 'vencida'
            multa.save()
            
            # Verifica se já foi criada notificação hoje
            notif_existe = Notificacao.objects.filter(
                objeto_tipo="multa",
                objeto_id=multa.id,
                tipo__nome="Multa Vencida",
                data_criacao__date=timezone.now().date()
            ).exists()
            
            if not notif_existe:
                notifs = GerenciadorNotificacoes.criar_notificacao_multa_vencida(multa)
                notificacoes_criadas.extend(notifs)
        
        return notificacoes_criadas
    
    @staticmethod
    def enviar_notificacoes_pendentes():
        """Envia todas as notificações pendentes por email"""
        notificacoes_pendentes = Notificacao.objects.filter(
            status='pendente',
            tipo__enviar_email=True
        )
        
        enviadas = 0
        erros = 0
        
        for notificacao in notificacoes_pendentes:
            if notificacao.enviar_email():
                enviadas += 1
            else:
                erros += 1
        
        return {'enviadas': enviadas, 'erros': erros}


def executar_verificacoes_automaticas():
    """
    Função principal para executar todas as verificações automáticas
    Deve ser chamada periodicamente (ex: via cron job)
    """
    print("🔄 Iniciando verificações automáticas...")
    
    # Verifica prazos vencendo
    notifs_prazos = GerenciadorNotificacoes.verificar_prazos_vencendo()
    print(f"📅 Criadas {len(notifs_prazos)} notificações de prazos vencendo")
    
    # Verifica multas vencidas
    notifs_multas = GerenciadorNotificacoes.verificar_multas_vencidas()
    print(f"💰 Criadas {len(notifs_multas)} notificações de multas vencidas")
    
    # Envia notificações pendentes
    resultado_envio = GerenciadorNotificacoes.enviar_notificacoes_pendentes()
    print(f"📧 Enviadas: {resultado_envio['enviadas']}, Erros: {resultado_envio['erros']}")
    
    print("✅ Verificações automáticas concluídas")
    
    return {
        'prazos': len(notifs_prazos),
        'multas': len(notifs_multas),
        'envios': resultado_envio
    }