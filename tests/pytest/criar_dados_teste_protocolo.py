#!/usr/bin/env python
"""
Script para criar dados de teste para o módulo de Protocolo
"""
import os
import sys
import django
from datetime import timedelta
import random

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from protocolo.models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)


def criar_tipos_protocolo():
    """Criar tipos de protocolo"""
    tipos_data = [
        {
            'nome': 'Denúncia de Consumidor',
            'tipo': 'DENUNCIA',
            'descricao': 'Denúncias relacionadas a direitos do consumidor',
            'prazo_padrao': 30
        },
        {
            'nome': 'Reclamação Comercial',
            'tipo': 'RECLAMACAO',
            'descricao': 'Reclamações sobre produtos e serviços',
            'prazo_padrao': 45
        },
        {
            'nome': 'Consulta Técnica',
            'tipo': 'CONSULTA',
            'descricao': 'Consultas técnicas sobre procedimentos',
            'prazo_padrao': 15
        },
        {
            'nome': 'Petição Administrativa',
            'tipo': 'PETICAO',
            'descricao': 'Petições administrativas diversas',
            'prazo_padrao': 60
        },
        {
            'nome': 'Recurso Administrativo',
            'tipo': 'RECURSO',
            'descricao': 'Recursos contra decisões administrativas',
            'prazo_padrao': 90
        },
        {
            'nome': 'Outros Assuntos',
            'tipo': 'OUTROS',
            'descricao': 'Outros assuntos não classificados',
            'prazo_padrao': 30
        }
    ]
    
    tipos = []
    for tipo_data in tipos_data:
        tipo, created = TipoProtocolo.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        tipos.append(tipo)
        if created:
            print(f"✓ Tipo de protocolo criado: {tipo.nome}")
    
    return tipos


def criar_status_protocolo():
    """Criar status de protocolo"""
    status_data = [
        {
            'nome': 'Aberto',
            'descricao': 'Protocolo aberto e aguardando análise',
            'cor': '#007bff',
            'ordem': 1
        },
        {
            'nome': 'Em Análise',
            'descricao': 'Protocolo em análise técnica',
            'cor': '#ffc107',
            'ordem': 2
        },
        {
            'nome': 'Aguardando Documentação',
            'descricao': 'Aguardando documentação complementar',
            'cor': '#fd7e14',
            'ordem': 3
        },
        {
            'nome': 'Em Tramitação',
            'descricao': 'Protocolo em tramitação interna',
            'cor': '#6f42c1',
            'ordem': 4
        },
        {
            'nome': 'Aguardando Resposta',
            'descricao': 'Aguardando resposta de terceiros',
            'cor': '#20c997',
            'ordem': 5
        },
        {
            'nome': 'Concluído',
            'descricao': 'Protocolo concluído',
            'cor': '#28a745',
            'ordem': 6
        },
        {
            'nome': 'Arquivado',
            'descricao': 'Protocolo arquivado',
            'cor': '#6c757d',
            'ordem': 7
        }
    ]
    
    status_list = []
    for status_data_item in status_data:
        status, created = StatusProtocolo.objects.get_or_create(
            nome=status_data_item['nome'],
            defaults=status_data_item
        )
        status_list.append(status)
        if created:
            print(f"✓ Status criado: {status.nome}")
    
    return status_list


def criar_protocolos(tipos, status_list, usuarios):
    """Criar protocolos de teste"""
    assuntos = [
        "Reclamação sobre produto com defeito",
        "Denúncia de propaganda enganosa",
        "Consulta sobre direitos do consumidor",
        "Petição para revisão de multa",
        "Recurso contra decisão administrativa",
        "Denúncia de venda casada",
        "Reclamação sobre atendimento",
        "Consulta sobre procedimentos",
        "Petição para regularização",
        "Recurso de reconsideração"
    ]
    
    prioridades = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']
    
    protocolos = []
    for i in range(50):
        # Gerar número de protocolo
        ano = timezone.now().year
        numero = f"PROC{ano}{i+1:04d}"
        
        # Dados do protocolo
        protocolo_data = {
            'numero': numero,
            'tipo_protocolo': random.choice(tipos),
            'assunto': f"{random.choice(assuntos)} #{i+1}",
            'descricao': f"Descrição detalhada do protocolo {numero}",
            'prioridade': random.choice(prioridades),
            'status': random.choice(status_list),
            'responsavel_atual': random.choice(usuarios) if random.random() > 0.3 else None,
            'criado_por': random.choice(usuarios),
            'observacoes': f"Observações do protocolo {numero}",
            'tags': [f"tag{i%5}", f"categoria{i%3}"]
        }
        
        # Definir datas
        data_abertura = timezone.now() - timedelta(days=random.randint(1, 365))
        protocolo_data['data_abertura'] = data_abertura
        
        # Definir data limite baseada no tipo
        prazo_dias = protocolo_data['tipo_protocolo'].prazo_padrao
        protocolo_data['data_limite'] = data_abertura + timedelta(days=prazo_dias)
        
        # Definir data de conclusão se status for concluído
        if protocolo_data['status'].nome == 'Concluído':
            protocolo_data['data_conclusao'] = data_abertura + timedelta(days=random.randint(1, prazo_dias))
        
        protocolo = Protocolo.objects.create(**protocolo_data)
        protocolos.append(protocolo)
        
        if (i + 1) % 10 == 0:
            print(f"✓ Protocolos criados: {i + 1}")
    
    return protocolos


def criar_documentos_protocolo(protocolos, usuarios):
    """Criar documentos para os protocolos"""
    tipos_documento = ['PETICAO', 'DOCUMENTO', 'COMPROVANTE', 'RESPOSTA', 'OUTROS']
    extensoes = ['.pdf', '.doc', '.docx', '.jpg', '.png']
    
    documentos = []
    for protocolo in protocolos:
        # Criar 1-3 documentos por protocolo
        num_docs = random.randint(1, 3)
        
        for j in range(num_docs):
            documento_data = {
                'protocolo': protocolo,
                'tipo': random.choice(tipos_documento),
                'titulo': f"Documento {j+1} - {protocolo.numero}",
                'descricao': f"Descrição do documento {j+1}",
                'tamanho': random.randint(100000, 5000000),  # 100KB a 5MB
                'extensao': random.choice(extensoes),
                'texto_extraido': f"Texto extraído do documento {j+1} do protocolo {protocolo.numero}",
                'indexado': random.choice([True, False]),
                'enviado_por': random.choice(usuarios)
            }
            
            documento = DocumentoProtocolo.objects.create(**documento_data)
            documentos.append(documento)
    
    print(f"✓ Documentos criados: {len(documentos)}")
    return documentos


def criar_tramitacoes_protocolo(protocolos, status_list, usuarios):
    """Criar histórico de tramitações"""
    tramitacoes = []
    
    for protocolo in protocolos:
        # Criar 1-4 tramitações por protocolo
        num_tramitacoes = random.randint(1, 4)
        status_atual = protocolo.status
        
        for k in range(num_tramitacoes):
            # Escolher próximo status (não pode ser o mesmo)
            status_disponiveis = [s for s in status_list if s != status_atual]
            if status_disponiveis:
                status_novo = random.choice(status_disponiveis)
                
                tramitacao_data = {
                    'protocolo': protocolo,
                    'status_anterior': status_atual,
                    'status_novo': status_novo,
                    'responsavel_anterior': protocolo.responsavel_atual,
                    'responsavel_novo': random.choice(usuarios) if random.random() > 0.3 else None,
                    'observacoes': f"Tramitação {k+1}: {status_atual.nome} → {status_novo.nome}",
                    'tramitado_por': random.choice(usuarios)
                }
                
                tramitacao = TramitacaoProtocolo.objects.create(**tramitacao_data)
                tramitacoes.append(tramitacao)
                
                status_atual = status_novo
    
    print(f"✓ Tramitações criadas: {len(tramitacoes)}")
    return tramitacoes


def criar_alertas_protocolo(protocolos, usuarios):
    """Criar alertas para os protocolos"""
    tipos_alerta = ['PRAZO', 'ATRASO', 'TRAMITACAO', 'DOCUMENTO', 'OUTROS']
    niveis = ['INFO', 'AVISO', 'URGENTE']
    
    alertas = []
    for protocolo in protocolos:
        # Criar 0-2 alertas por protocolo
        num_alertas = random.randint(0, 2)
        
        for l in range(num_alertas):
            alerta_data = {
                'protocolo': protocolo,
                'tipo': random.choice(tipos_alerta),
                'titulo': f"Alerta {l+1} - {protocolo.numero}",
                'mensagem': f"Mensagem do alerta {l+1} para o protocolo {protocolo.numero}",
                'nivel': random.choice(niveis),
                'ativo': random.choice([True, False])
            }
            
            # Marcar alguns alertas como lidos
            if not alerta_data['ativo']:
                alerta_data['data_leitura'] = timezone.now() - timedelta(days=random.randint(1, 30))
                alerta_data['lido_por'] = random.choice(usuarios)
            
            alerta = AlertaProtocolo.objects.create(**alerta_data)
            alertas.append(alerta)
    
    print(f"✓ Alertas criados: {len(alertas)}")
    return alertas


def main():
    """Função principal"""
    print("🚀 Criando dados de teste para o módulo de Protocolo...")
    
    # Verificar se existem usuários
    usuarios = list(User.objects.all())
    if not usuarios:
        print("❌ Nenhum usuário encontrado. Crie usuários primeiro.")
        return
    
    print(f"✓ Usuários encontrados: {len(usuarios)}")
    
    # Criar tipos de protocolo
    print("\n📋 Criando tipos de protocolo...")
    tipos = criar_tipos_protocolo()
    
    # Criar status de protocolo
    print("\n📊 Criando status de protocolo...")
    status_list = criar_status_protocolo()
    
    # Criar protocolos
    print("\n📝 Criando protocolos...")
    protocolos = criar_protocolos(tipos, status_list, usuarios)
    
    # Criar documentos
    print("\n📎 Criando documentos...")
    documentos = criar_documentos_protocolo(protocolos, usuarios)
    
    # Criar tramitações
    print("\n🔄 Criando tramitações...")
    tramitacoes = criar_tramitacoes_protocolo(protocolos, status_list, usuarios)
    
    # Criar alertas
    print("\n⚠️ Criando alertas...")
    alertas = criar_alertas_protocolo(protocolos, usuarios)
    
    # Resumo final
    print("\n" + "="*50)
    print("✅ DADOS DE TESTE CRIADOS COM SUCESSO!")
    print("="*50)
    print(f"📋 Tipos de Protocolo: {len(tipos)}")
    print(f"📊 Status de Protocolo: {len(status_list)}")
    print(f"📝 Protocolos: {len(protocolos)}")
    print(f"📎 Documentos: {len(documentos)}")
    print(f"🔄 Tramitações: {len(tramitacoes)}")
    print(f"⚠️ Alertas: {len(alertas)}")
    print("="*50)
    
    # Estatísticas
    protocolos_atrasados = Protocolo.objects.filter(
        ativo=True,
        data_limite__lt=timezone.now(),
        data_conclusao__isnull=True
    ).count()
    
    print(f"\n📈 ESTATÍSTICAS:")
    print(f"   • Protocolos atrasados: {protocolos_atrasados}")
    print(f"   • Protocolos urgentes: {Protocolo.objects.filter(prioridade='URGENTE').count()}")
    print(f"   • Documentos indexados: {DocumentoProtocolo.objects.filter(indexado=True).count()}")
    print(f"   • Alertas ativos: {AlertaProtocolo.objects.filter(ativo=True).count()}")


if __name__ == '__main__':
    main()
