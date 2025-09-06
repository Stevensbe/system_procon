#!/usr/bin/env python
"""
Script para configurar permissões de setor na Caixa de Entrada
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from caixa_entrada.models import PermissaoSetorCaixaEntrada, AcessoEspecialCaixaEntrada


def criar_permissoes_setores():
    """Cria as permissões padrão para cada setor"""
    
    print("🔧 Configurando permissões por setor...")
    
    # Configurações de permissão por setor
    config_setores = {
        'ATENDIMENTO': {
            'nome': 'Atendimento/Protocolo',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': False,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': ['Fiscalização', 'Jurídico', 'Diretoria/Administração'],
            'tipos_documento_permitidos': ['PETICAO', 'PROTOCOLO', 'SOLICITACAO'],
        },
        'FISCALIZACAO': {
            'nome': 'Fiscalização',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': True,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': ['Jurídico', 'Diretoria/Administração', 'Financeiro'],
            'tipos_documento_permitidos': ['AUTO_INFRACAO', 'DENUNCIA', 'RELATORIO'],
        },
        'JURIDICO': {
            'nome': 'Jurídico',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': True,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': ['Diretoria/Administração', 'Financeiro'],
            'tipos_documento_permitidos': ['RECURSO', 'DEFESA', 'PROCESSO_JURIDICO'],
        },
        'DIRETORIA': {
            'nome': 'Diretoria/Administração',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': True,
                'pode_encaminhar': True,
                'pode_arquivar': True,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': True,
            },
            'setores_permitidos': ['Financeiro', 'Cobrança'],
            'tipos_documento_permitidos': ['DECISAO', 'RESOLUCAO', 'PORTARIA'],
        },
        'FINANCEIRO': {
            'nome': 'Financeiro',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': False,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': ['Cobrança'],
            'tipos_documento_permitidos': ['MULTA', 'COBRANCA', 'PAGAMENTO'],
        },
        'COBRANCA': {
            'nome': 'Cobrança',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': False,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': [],
            'tipos_documento_permitidos': ['MULTA', 'COBRANCA', 'INADIMPLENCIA'],
        },
        'ADMINISTRATIVO': {
            'nome': 'Administrativo',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': False,
                'pode_encaminhar': True,
                'pode_arquivar': False,
                'pode_excluir': False,
                'pode_gerenciar_permissoes': False,
            },
            'setores_permitidos': ['Atendimento/Protocolo', 'Fiscalização'],
            'tipos_documento_permitidos': ['DOCUMENTO_INTERNO', 'SOLICITACAO_INTERNA'],
        },
        'GERAL': {
            'nome': 'Acesso Geral',
            'permissoes': {
                'pode_visualizar': True,
                'pode_editar': True,
                'pode_encaminhar': True,
                'pode_arquivar': True,
                'pode_excluir': True,
                'pode_gerenciar_permissoes': True,
            },
            'setores_permitidos': [],
            'tipos_documento_permitidos': [],
        },
    }
    
    # Criar permissões para cada setor
    for setor_codigo, config in config_setores.items():
        permissao, created = PermissaoSetorCaixaEntrada.objects.get_or_create(
            setor=setor_codigo,
            defaults={
                'pode_visualizar': config['permissoes']['pode_visualizar'],
                'pode_editar': config['permissoes']['pode_editar'],
                'pode_encaminhar': config['permissoes']['pode_encaminhar'],
                'pode_arquivar': config['permissoes']['pode_arquivar'],
                'pode_excluir': config['permissoes']['pode_excluir'],
                'pode_gerenciar_permissoes': config['permissoes']['pode_gerenciar_permissoes'],
                'setores_permitidos': config['setores_permitidos'],
                'tipos_documento_permitidos': config['tipos_documento_permitidos'],
            }
        )
        
        if created:
            print(f"✅ Criada permissão para {config['nome']}")
        else:
            print(f"ℹ️  Permissão para {config['nome']} já existe")
    
    print(f"\n📊 Total de permissões configuradas: {PermissaoSetorCaixaEntrada.objects.count()}")


def associar_usuarios_setores():
    """Associa usuários existentes aos setores apropriados"""
    
    print("\n👥 Associando usuários aos setores...")
    
    # Mapeamento de usuários por setor (baseado no username ou email)
    mapeamento_usuarios = {
        'ATENDIMENTO': ['atendimento', 'protocolo', 'recepcao'],
        'FISCALIZACAO': ['fiscal', 'fiscalizacao', 'inspetor'],
        'JURIDICO': ['juridico', 'advogado', 'procurador'],
        'DIRETORIA': ['diretor', 'coordenador', 'gerente', 'admin'],
        'FINANCEIRO': ['financeiro', 'contador', 'tesoureiro'],
        'COBRANCA': ['cobranca', 'cobrador'],
        'ADMINISTRATIVO': ['administrativo', 'secretario'],
        'GERAL': ['superuser', 'admin'],
    }
    
    usuarios_associados = 0
    
    for setor_codigo, palavras_chave in mapeamento_usuarios.items():
        try:
            permissao = PermissaoSetorCaixaEntrada.objects.get(setor=setor_codigo)
            
            # Buscar usuários que correspondem às palavras-chave
            usuarios_setor = User.objects.filter(
                is_active=True
            ).filter(
                username__icontains=palavras_chave[0]
            )
            
            # Adicionar usuários encontrados ao setor
            for usuario in usuarios_setor:
                permissao.usuarios.add(usuario)
                usuarios_associados += 1
                print(f"✅ Usuário {usuario.username} associado ao setor {permissao.get_setor_display()}")
        
        except PermissaoSetorCaixaEntrada.DoesNotExist:
            print(f"⚠️  Permissão para setor {setor_codigo} não encontrada")
    
    # Associar superusuários ao acesso geral
    try:
        permissao_geral = PermissaoSetorCaixaEntrada.objects.get(setor='GERAL')
        superusuarios = User.objects.filter(is_superuser=True, is_active=True)
        
        for usuario in superusuarios:
            permissao_geral.usuarios.add(usuario)
            usuarios_associados += 1
            print(f"✅ Superusuário {usuario.username} associado ao Acesso Geral")
    
    except PermissaoSetorCaixaEntrada.DoesNotExist:
        print("⚠️  Permissão de acesso geral não encontrada")
    
    print(f"\n📊 Total de usuários associados: {usuarios_associados}")


def criar_acessos_especiais_exemplo():
    """Cria alguns acessos especiais de exemplo"""
    
    print("\n🔓 Criando acessos especiais de exemplo...")
    
    # Verificar se existem usuários e documentos
    usuarios = User.objects.filter(is_active=True)[:3]
    from caixa_entrada.models import CaixaEntrada
    documentos = CaixaEntrada.objects.all()[:2]
    
    if not usuarios.exists() or not documentos.exists():
        print("⚠️  Não há usuários ou documentos suficientes para criar acessos especiais")
        return
    
    # Criar acessos especiais de exemplo
    acessos_criados = 0
    
    for i, usuario in enumerate(usuarios):
        if i < len(documentos):
            documento = documentos[i]
            
            acesso, created = AcessoEspecialCaixaEntrada.objects.get_or_create(
                usuario=usuario,
                documento=documento,
                defaults={
                    'motivo': 'ANALISE_ESPECIAL',
                    'observacoes': 'Acesso especial para análise de processo',
                    'pode_editar': True,
                    'pode_encaminhar': True,
                    'pode_arquivar': False,
                    'data_fim': datetime.now() + timedelta(days=30),
                    'concedido_por': User.objects.filter(is_superuser=True).first()
                }
            )
            
            if created:
                acessos_criados += 1
                print(f"✅ Acesso especial criado para {usuario.username} no documento {documento.numero_protocolo}")
    
    print(f"\n📊 Total de acessos especiais criados: {acessos_criados}")


def mostrar_resumo_permissoes():
    """Mostra um resumo das permissões configuradas"""
    
    print("\n📋 RESUMO DAS PERMISSÕES CONFIGURADAS")
    print("=" * 50)
    
    permissoes = PermissaoSetorCaixaEntrada.objects.all().order_by('setor')
    
    for permissao in permissoes:
        print(f"\n🏢 {permissao.get_setor_display()}")
        print(f"   👥 Usuários: {permissao.usuarios.count()}")
        print(f"   👀 Pode visualizar: {permissao.pode_visualizar}")
        print(f"   ✏️  Pode editar: {permissao.pode_editar}")
        print(f"   📤 Pode encaminhar: {permissao.pode_encaminhar}")
        print(f"   📁 Pode arquivar: {permissao.pode_arquivar}")
        print(f"   🗑️  Pode excluir: {permissao.pode_excluir}")
        print(f"   ⚙️  Pode gerenciar permissões: {permissao.pode_gerenciar_permissoes}")
        
        if permissao.setores_permitidos:
            print(f"   🔗 Setores permitidos: {', '.join(permissao.setores_permitidos)}")
        
        if permissao.tipos_documento_permitidos:
            print(f"   📄 Tipos permitidos: {', '.join(permissao.tipos_documento_permitidos)}")
    
    # Mostrar acessos especiais
    acessos_especiais = AcessoEspecialCaixaEntrada.objects.filter(ativo=True)
    if acessos_especiais.exists():
        print(f"\n🔓 Acessos Especiais Ativos: {acessos_especiais.count()}")
        for acesso in acessos_especiais[:5]:  # Mostrar apenas os 5 primeiros
            print(f"   👤 {acesso.usuario.username} → {acesso.documento.numero_protocolo} ({acesso.motivo})")


def main():
    """Função principal"""
    
    print("🚀 CONFIGURADOR DE PERMISSÕES POR SETOR - CAIXA DE ENTRADA")
    print("=" * 60)
    
    try:
        # 1. Criar permissões de setor
        criar_permissoes_setores()
        
        # 2. Associar usuários aos setores
        associar_usuarios_setores()
        
        # 3. Criar acessos especiais de exemplo
        criar_acessos_especiais_exemplo()
        
        # 4. Mostrar resumo
        mostrar_resumo_permissoes()
        
        print("\n✅ Configuração de permissões concluída com sucesso!")
        print("\n📝 PRÓXIMOS PASSOS:")
        print("1. Acesse /caixa-entrada/admin/permissoes/ para gerenciar permissões")
        print("2. Acesse /caixa-entrada/admin/acesso-especial/ para conceder acessos especiais")
        print("3. Teste o acesso de diferentes usuários à caixa de entrada")
        
    except Exception as e:
        print(f"\n❌ Erro durante a configuração: {e}")
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
