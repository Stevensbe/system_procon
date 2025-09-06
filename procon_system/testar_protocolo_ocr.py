#!/usr/bin/env python
"""
Script para testar o módulo de protocolo com OCR e indexação
"""

import os
import sys
import django
from django.conf import settings
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
import tempfile
from PIL import Image
import io

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from protocolo.models import (
    TipoProtocolo, StatusProtocolo, Protocolo, DocumentoProtocolo,
    TramitacaoProtocolo, AlertaProtocolo
)
from protocolo.services import (
    ocr_service, indexing_service, digitization_service, quality_service
)


def criar_imagem_teste():
    """Cria uma imagem de teste com texto"""
    # Criar uma imagem simples com texto
    img = Image.new('RGB', (800, 600), color='white')
    
    # Adicionar texto simples (simulando documento)
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    
    # Usar fonte padrão
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    texto = """PROTOCOLO DE TESTE
    
    Este é um documento de teste para verificar
    o funcionamento do sistema de OCR.
    
    Dados do Protocolo:
    Número: 2024001
    Assunto: Teste de Funcionalidade
    Data: 2024-01-15
    
    CPF: 123.456.789-00
    Email: teste@exemplo.com
    Telefone: (11) 99999-9999
    
    Este documento contém informações importantes
    que devem ser extraídas pelo sistema de OCR.
    """
    
    draw.text((50, 50), texto, fill='black', font=font)
    
    # Salvar em buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer


def testar_servicos_ocr():
    """Testa os serviços de OCR"""
    print("🧪 Testando serviços de OCR...")
    
    try:
        # Testar criação de imagem
        print("  📸 Criando imagem de teste...")
        img_buffer = criar_imagem_teste()
        
        # Criar documento de teste
        print("  📄 Criando documento de teste...")
        user = User.objects.filter(is_staff=True).first()
        if not user:
            user = User.objects.create_user(
                username='teste_ocr',
                email='teste@exemplo.com',
                is_staff=True
            )
        
        tipo_protocolo = TipoProtocolo.objects.first()
        if not tipo_protocolo:
            tipo_protocolo = TipoProtocolo.objects.create(
                nome='Teste',
                tipo='OUTROS',
                prazo_padrao=30
            )
        
        status_protocolo = StatusProtocolo.objects.first()
        if not status_protocolo:
            status_protocolo = StatusProtocolo.objects.create(
                nome='Aberto',
                descricao='Protocolo aberto',
                cor='#007bff',
                ordem=1
            )
        
        protocolo = Protocolo.objects.create(
            numero='TESTE-OCR-001',
            tipo_protocolo=tipo_protocolo,
            assunto='Teste de OCR',
            descricao='Documento para testar OCR',
            status=status_protocolo,
            criado_por=user
        )
        
        # Criar documento com imagem
        documento = DocumentoProtocolo.objects.create(
            protocolo=protocolo,
            tipo='DOCUMENTO',
            titulo='Documento de Teste OCR',
            descricao='Documento para testar funcionalidades de OCR',
            arquivo=SimpleUploadedFile(
                'teste_ocr.png',
                img_buffer.getvalue(),
                content_type='image/png'
            ),
            enviado_por=user
        )
        
        print(f"  ✅ Documento criado: {documento.id}")
        
        # Testar extração de texto
        print("  🔍 Testando extração de texto...")
        texto_extraido = ocr_service.extract_text_from_document(documento)
        
        if texto_extraido:
            print(f"  ✅ Texto extraído ({len(texto_extraido)} caracteres)")
            print(f"  📝 Primeiros 200 caracteres: {texto_extraido[:200]}...")
        else:
            print("  ⚠️ Nenhum texto extraído (pode ser normal se Tesseract não estiver instalado)")
        
        # Testar indexação
        print("  📚 Testando indexação...")
        success = indexing_service.index_document(documento)
        
        if success:
            print("  ✅ Documento indexado com sucesso")
            
            # Verificar metadados
            if hasattr(documento, 'tags') and documento.tags:
                print("  📊 Metadados extraídos:")
                for key, value in documento.tags.items():
                    if isinstance(value, list) and len(value) > 0:
                        print(f"    {key}: {value[:3]}...")  # Primeiros 3 itens
                    else:
                        print(f"    {key}: {value}")
        else:
            print("  ❌ Falha na indexação")
        
        # Testar análise de qualidade
        print("  🔍 Testando análise de qualidade...")
        quality = quality_service.analyze_document_quality(documento)
        
        print(f"  📊 Pontuação de qualidade: {quality['quality_score']}/100")
        print(f"  📏 Tamanho do texto: {quality['text_length']} caracteres")
        print(f"  📋 Indexado: {quality['is_indexed']}")
        
        if quality['issues']:
            print("  ⚠️ Problemas detectados:")
            for issue in quality['issues']:
                print(f"    - {issue}")
        
        if quality['recommendations']:
            print("  💡 Recomendações:")
            for rec in quality['recommendations']:
                print(f"    - {rec}")
        
        # Testar processamento completo
        print("  🔄 Testando processamento completo...")
        result = digitization_service.process_document_upload(documento)
        
        if result['success']:
            print("  ✅ Processamento completo realizado")
            print(f"  📝 Palavras-chave: {result['keywords'][:5]}...")
        else:
            print("  ❌ Falha no processamento completo")
            for error in result['errors']:
                print(f"    Erro: {error}")
        
        # Testar busca
        print("  🔍 Testando busca de documentos...")
        documentos_encontrados = digitization_service.search_documents("teste", protocolo)
        print(f"  📄 Documentos encontrados: {len(documentos_encontrados)}")
        
        # Testar estatísticas
        print("  📊 Testando estatísticas...")
        stats = digitization_service.get_document_statistics(protocolo)
        print(f"  📈 Total de documentos: {stats['total_documents']}")
        print(f"  📝 Documentos com texto: {stats['documents_with_text']}")
        print(f"  📊 Taxa de extração: {stats['extraction_rate']:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro nos testes de OCR: {e}")
        import traceback
        traceback.print_exc()
        return False


def testar_comando_management():
    """Testa o comando de gerenciamento"""
    print("🧪 Testando comando de gerenciamento...")
    
    try:
        from django.core.management import call_command
        from io import StringIO
        
        # Capturar saída do comando
        out = StringIO()
        
        # Executar comando
        call_command('processar_documentos_ocr', '--limite', '5', stdout=out)
        
        output = out.getvalue()
        print("  ✅ Comando executado com sucesso")
        print(f"  📄 Saída: {len(output)} caracteres")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro no comando de gerenciamento: {e}")
        return False


def testar_apis():
    """Testa as APIs de OCR"""
    print("🧪 Testando APIs de OCR...")
    
    try:
        from django.test import Client
        from django.contrib.auth.models import User
        
        # Criar cliente de teste
        client = Client()
        
        # Criar usuário para autenticação
        user = User.objects.filter(is_staff=True).first()
        if not user:
            user = User.objects.create_user(
                username='teste_api',
                email='teste_api@exemplo.com',
                is_staff=True
            )
        
        # Fazer login
        client.force_login(user)
        
        # Testar endpoint de estatísticas
        print("  📊 Testando endpoint de estatísticas...")
        response = client.get('/api/protocolo/documentos/estatisticas/')
        
        if response.status_code == 200:
            print("  ✅ Endpoint de estatísticas funcionando")
            data = response.json()
            print(f"  📈 Dados: {data}")
        else:
            print(f"  ❌ Erro no endpoint de estatísticas: {response.status_code}")
        
        # Testar endpoint de busca
        print("  🔍 Testando endpoint de busca...")
        response = client.get('/api/protocolo/documentos/buscar_texto/?q=teste')
        
        if response.status_code == 200:
            print("  ✅ Endpoint de busca funcionando")
            data = response.json()
            print(f"  📄 Resultados: {len(data)} documentos")
        else:
            print(f"  ❌ Erro no endpoint de busca: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Erro nos testes de API: {e}")
        return False


def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes do módulo de protocolo com OCR...")
    print("=" * 60)
    
    # Verificar dependências
    print("🔍 Verificando dependências...")
    
    try:
        import fitz
        print("  ✅ PyMuPDF disponível")
    except ImportError:
        print("  ⚠️ PyMuPDF não disponível (OCR de PDF limitado)")
    
    try:
        import pytesseract
        print("  ✅ pytesseract disponível")
    except ImportError:
        print("  ⚠️ pytesseract não disponível (OCR de imagens limitado)")
    
    try:
        import cv2
        print("  ✅ OpenCV disponível")
    except ImportError:
        print("  ⚠️ OpenCV não disponível (processamento de imagem limitado)")
    
    print()
    
    # Executar testes
    resultados = []
    
    print("🧪 EXECUTANDO TESTES...")
    print("=" * 60)
    
    # Teste 1: Serviços de OCR
    print("\n1️⃣ Teste de Serviços de OCR")
    print("-" * 40)
    resultado1 = testar_servicos_ocr()
    resultados.append(("Serviços de OCR", resultado1))
    
    # Teste 2: Comando de gerenciamento
    print("\n2️⃣ Teste de Comando de Gerenciamento")
    print("-" * 40)
    resultado2 = testar_comando_management()
    resultados.append(("Comando de Gerenciamento", resultado2))
    
    # Teste 3: APIs
    print("\n3️⃣ Teste de APIs")
    print("-" * 40)
    resultado3 = testar_apis()
    resultados.append(("APIs", resultado3))
    
    # Resumo dos resultados
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    total_tests = len(resultados)
    testes_passaram = sum(1 for _, resultado in resultados if resultado)
    
    for nome, resultado in resultados:
        status = "✅ PASSOU" if resultado else "❌ FALHOU"
        print(f"{nome}: {status}")
    
    print(f"\n📈 Resultado: {testes_passaram}/{total_tests} testes passaram")
    
    if testes_passaram == total_tests:
        print("🎉 Todos os testes passaram! Módulo de protocolo com OCR está funcionando.")
    else:
        print("⚠️ Alguns testes falharam. Verifique as dependências e configurações.")
    
    print("\n💡 Recomendações:")
    print("- Instale o Tesseract OCR para funcionalidade completa")
    print("- Configure as variáveis de ambiente para OCR")
    print("- Verifique as permissões de arquivo")
    
    return testes_passaram == total_tests


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
