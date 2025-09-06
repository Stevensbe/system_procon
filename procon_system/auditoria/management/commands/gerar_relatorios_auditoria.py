#!/usr/bin/env python
"""
Comando para gerar relatórios de auditoria avançados
"""
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from auditoria.services import relatorio_service, seguranca_service


class Command(BaseCommand):
    help = 'Gera relatórios de auditoria avançados'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tipo',
            type=str,
            choices=['atividade', 'seguranca', 'performance', 'sessoes', 'todos'],
            default='todos',
            help='Tipo de relatório a gerar',
        )
        parser.add_argument(
            '--periodo',
            type=int,
            default=30,
            help='Período em dias para o relatório (padrão: 30)',
        )
        parser.add_argument(
            '--usuario',
            type=str,
            help='Usuário específico para filtrar (apenas para relatório de atividade)',
        )
        parser.add_argument(
            '--formato',
            type=str,
            choices=['json', 'texto'],
            default='texto',
            help='Formato de saída do relatório',
        )
        parser.add_argument(
            '--arquivo',
            type=str,
            help='Arquivo para salvar o relatório (apenas para formato JSON)',
        )
        parser.add_argument(
            '--verificar-ips',
            action='store_true',
            help='Verificar IPs suspeitos',
        )
        parser.add_argument(
            '--verificar-usuarios',
            action='store_true',
            help='Verificar usuários com atividade suspeita',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔍 Iniciando geração de relatórios de auditoria...')
        )

        periodo = options['periodo']
        formato = options['formato']
        arquivo = options['arquivo']

        # Gerar relatórios conforme tipo solicitado
        if options['tipo'] in ['atividade', 'todos']:
            self.gerar_relatorio_atividade(periodo, options['usuario'], formato, arquivo)

        if options['tipo'] in ['seguranca', 'todos']:
            self.gerar_relatorio_seguranca(periodo, formato, arquivo)

        if options['tipo'] in ['performance', 'todos']:
            self.gerar_relatorio_performance(periodo, formato, arquivo)

        if options['tipo'] in ['sessoes', 'todos']:
            self.gerar_relatorio_sessoes(periodo, formato, arquivo)

        # Verificações de segurança
        if options['verificar_ips']:
            self.verificar_ips_suspeitos()

        if options['verificar_usuarios']:
            self.verificar_usuarios_suspeitos()

        self.stdout.write(
            self.style.SUCCESS('✅ Geração de relatórios concluída!')
        )

    def gerar_relatorio_atividade(self, periodo, usuario, formato, arquivo):
        """Gera relatório de atividade dos usuários"""
        self.stdout.write('📊 Gerando relatório de atividade dos usuários...')
        
        try:
            relatorio = relatorio_service.relatorio_atividade_usuarios(periodo, usuario)
            
            if formato == 'json':
                self.salvar_relatorio_json(relatorio, arquivo, 'atividade')
            else:
                self.exibir_relatorio_atividade(relatorio)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao gerar relatório de atividade: {e}')
            )

    def gerar_relatorio_seguranca(self, periodo, formato, arquivo):
        """Gera relatório de segurança"""
        self.stdout.write('🔒 Gerando relatório de segurança...')
        
        try:
            relatorio = relatorio_service.relatorio_seguranca(periodo)
            
            if formato == 'json':
                self.salvar_relatorio_json(relatorio, arquivo, 'seguranca')
            else:
                self.exibir_relatorio_seguranca(relatorio)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao gerar relatório de segurança: {e}')
            )

    def gerar_relatorio_performance(self, periodo, formato, arquivo):
        """Gera relatório de performance"""
        self.stdout.write('⚡ Gerando relatório de performance...')
        
        try:
            relatorio = relatorio_service.relatorio_performance(periodo)
            
            if formato == 'json':
                self.salvar_relatorio_json(relatorio, arquivo, 'performance')
            else:
                self.exibir_relatorio_performance(relatorio)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao gerar relatório de performance: {e}')
            )

    def gerar_relatorio_sessoes(self, periodo, formato, arquivo):
        """Gera relatório de sessões"""
        self.stdout.write('👥 Gerando relatório de sessões...')
        
        try:
            relatorio = relatorio_service.relatorio_sessoes(periodo)
            
            if formato == 'json':
                self.salvar_relatorio_json(relatorio, arquivo, 'sessoes')
            else:
                self.exibir_relatorio_sessoes(relatorio)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao gerar relatório de sessões: {e}')
            )

    def verificar_ips_suspeitos(self):
        """Verifica IPs suspeitos"""
        self.stdout.write('🔍 Verificando IPs suspeitos...')
        
        try:
            # Obter IPs únicos dos últimos eventos
            from auditoria.models import LogSeguranca
            ips_unicos = LogSeguranca.objects.values_list('ip_origem', flat=True).distinct()
            
            ips_suspeitos = []
            for ip in ips_unicos:
                if ip:
                    resultado = seguranca_service.verificar_ip_suspeito(ip)
                    if resultado['suspeito']:
                        ips_suspeitos.append(resultado)
            
            if ips_suspeitos:
                self.stdout.write(f'⚠️  Encontrados {len(ips_suspeitos)} IPs suspeitos:')
                for ip_info in ips_suspeitos:
                    self.stdout.write(f'   IP: {ip_info["ip"]} - Risco: {ip_info["nivel_risco"]}')
                    for acao in ip_info['acoes_recomendadas']:
                        self.stdout.write(f'     → {acao}')
            else:
                self.stdout.write(self.style.SUCCESS('✅ Nenhum IP suspeito encontrado'))
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao verificar IPs suspeitos: {e}')
            )

    def verificar_usuarios_suspeitos(self):
        """Verifica usuários com atividade suspeita"""
        self.stdout.write('👤 Verificando usuários com atividade suspeita...')
        
        try:
            # Obter usuários únicos dos últimos eventos
            from auditoria.models import LogSistema
            usuarios_unicos = LogSistema.objects.values_list('usuario', flat=True).distinct()
            
            usuarios_suspeitos = []
            for usuario in usuarios_unicos:
                if usuario:
                    resultado = seguranca_service.verificar_atividade_suspeita(usuario)
                    if resultado['suspeito']:
                        usuarios_suspeitos.append(resultado)
            
            if usuarios_suspeitos:
                self.stdout.write(f'⚠️  Encontrados {len(usuarios_suspeitos)} usuários suspeitos:')
                for user_info in usuarios_suspeitos:
                    self.stdout.write(f'   Usuário: {user_info["usuario"]} - Risco: {user_info["nivel_risco"]}')
                    for acao in user_info['acoes_recomendadas']:
                        self.stdout.write(f'     → {acao}')
            else:
                self.stdout.write(self.style.SUCCESS('✅ Nenhum usuário suspeito encontrado'))
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao verificar usuários suspeitos: {e}')
            )

    def salvar_relatorio_json(self, relatorio, arquivo, tipo):
        """Salva relatório em formato JSON"""
        if not arquivo:
            arquivo = f'relatorio_{tipo}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json'
        
        try:
            with open(arquivo, 'w', encoding='utf-8') as f:
                json.dump(relatorio, f, indent=2, ensure_ascii=False, default=str)
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Relatório salvo em: {arquivo}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao salvar arquivo: {e}')
            )

    def exibir_relatorio_atividade(self, relatorio):
        """Exibe relatório de atividade em formato texto"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('📊 RELATÓRIO DE ATIVIDADE DOS USUÁRIOS')
        self.stdout.write('='*60)
        
        periodo = relatorio['periodo']
        resumo = relatorio['resumo']
        
        self.stdout.write(f'Período: {periodo["inicio"].strftime("%d/%m/%Y")} a {periodo["fim"].strftime("%d/%m/%Y")}')
        self.stdout.write(f'Total de eventos: {resumo["total_eventos"]}')
        self.stdout.write(f'Usuários ativos: {resumo["usuarios_ativos"]}')
        self.stdout.write(f'Média de eventos por dia: {resumo["media_eventos_por_dia"]:.2f}')
        
        # Top usuários
        if relatorio['eventos_por_usuario']:
            self.stdout.write('\n🏆 TOP 10 USUÁRIOS MAIS ATIVOS:')
            for i, user in enumerate(relatorio['eventos_por_usuario'][:10], 1):
                self.stdout.write(f'{i:2d}. {user["usuario"]}: {user["total"]} eventos ({user["sucessos"]} sucessos, {user["falhas"]} falhas)')

    def exibir_relatorio_seguranca(self, relatorio):
        """Exibe relatório de segurança em formato texto"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🔒 RELATÓRIO DE SEGURANÇA')
        self.stdout.write('='*60)
        
        resumo = relatorio['resumo']
        
        self.stdout.write(f'Total de eventos de segurança: {resumo["total_eventos_seguranca"]}')
        self.stdout.write(f'Eventos críticos: {resumo["eventos_criticos"]}')
        self.stdout.write(f'Eventos bloqueados: {resumo["eventos_bloqueados"]}')
        
        # IPs suspeitos
        if relatorio['ips_suspeitos']:
            self.stdout.write('\n🚨 TOP 10 IPs SUSPEITOS:')
            for i, ip in enumerate(relatorio['ips_suspeitos'], 1):
                self.stdout.write(f'{i:2d}. {ip["ip_origem"]}: {ip["total_eventos"]} eventos ({ip["eventos_bloqueados"]} bloqueados)')

    def exibir_relatorio_performance(self, relatorio):
        """Exibe relatório de performance em formato texto"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('⚡ RELATÓRIO DE PERFORMANCE')
        self.stdout.write('='*60)
        
        resumo = relatorio['resumo']
        
        self.stdout.write(f'Total de requisições: {resumo["total_requisicoes"]}')
        self.stdout.write(f'Tempo médio de resposta: {resumo["tempo_medio_geral"]:.2f}ms')
        self.stdout.write(f'Taxa de erro: {resumo["taxa_erro_geral"]:.2f}%')
        
        # Recursos mais acessados
        if relatorio['performance_por_recurso']:
            self.stdout.write('\n📈 TOP 10 RECURSOS MAIS ACESSADOS:')
            for i, recurso in enumerate(relatorio['performance_por_recurso'][:10], 1):
                self.stdout.write(f'{i:2d}. {recurso["recurso"]}: {recurso["total_acessos"]} acessos ({recurso["tempo_medio"]:.2f}ms)')

    def exibir_relatorio_sessoes(self, relatorio):
        """Exibe relatório de sessões em formato texto"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('👥 RELATÓRIO DE SESSÕES')
        self.stdout.write('='*60)
        
        resumo = relatorio['resumo']
        
        self.stdout.write(f'Total de sessões: {resumo["total_sessoes"]}')
        self.stdout.write(f'Sessões ativas: {resumo["sessoes_ativas"]}')
        self.stdout.write(f'Sessões encerradas: {resumo["sessoes_encerradas"]}')
        
        # Usuários com mais sessões
        if relatorio['sessoes_por_usuario']:
            self.stdout.write('\n👤 TOP 10 USUÁRIOS COM MAIS SESSÕES:')
            for i, user in enumerate(relatorio['sessoes_por_usuario'][:10], 1):
                self.stdout.write(f'{i:2d}. {user["usuario"]}: {user["total_sessoes"]} sessões ({user["sessoes_ativas"]} ativas)')
