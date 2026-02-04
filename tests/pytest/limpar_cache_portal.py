#!/usr/bin/env python3
"""
Script para limpar cache e resolver problemas de memória do Portal Cidadão
"""

import os
import shutil
import glob
from datetime import datetime

def limpar_cache_frontend():
    """Limpar cache do frontend"""
    print("🧹 LIMPANDO CACHE DO FRONTEND")
    print("=" * 50)
    
    # Diretórios para limpar
    diretorios_cache = [
        'frontend/node_modules/.cache',
        'frontend/dist',
        'frontend/.vite',
        'procon_system/static/react',
        'procon_system/staticfiles'
    ]
    
    for diretorio in diretorios_cache:
        if os.path.exists(diretorio):
            try:
                shutil.rmtree(diretorio)
                print(f"✅ Cache removido: {diretorio}")
            except Exception as e:
                print(f"❌ Erro ao remover {diretorio}: {e}")
        else:
            print(f"ℹ️ Diretório não encontrado: {diretorio}")

def limpar_logs_django():
    """Limpar logs do Django"""
    print("\n📝 LIMPANDO LOGS DO DJANGO")
    print("=" * 50)
    
    # Arquivos de log para limpar
    logs_patterns = [
        '*.log',
        'logs/*.log',
        'procon_system/*.log'
    ]
    
    for pattern in logs_patterns:
        for arquivo in glob.glob(pattern):
            try:
                os.remove(arquivo)
                print(f"✅ Log removido: {arquivo}")
            except Exception as e:
                print(f"❌ Erro ao remover {arquivo}: {e}")

def limpar_arquivos_temporarios():
    """Limpar arquivos temporários"""
    print("\n🗑️ LIMPANDO ARQUIVOS TEMPORÁRIOS")
    print("=" * 50)
    
    # Padrões de arquivos temporários
    temp_patterns = [
        '*.tmp',
        '*.temp',
        '*~',
        '.DS_Store',
        'Thumbs.db'
    ]
    
    for pattern in temp_patterns:
        for arquivo in glob.glob(pattern, recursive=True):
            try:
                os.remove(arquivo)
                print(f"✅ Arquivo temporário removido: {arquivo}")
            except Exception as e:
                print(f"❌ Erro ao remover {arquivo}: {e}")

def verificar_espaco_disco():
    """Verificar espaço em disco"""
    print("\n💾 VERIFICANDO ESPAÇO EM DISCO")
    print("=" * 50)
    
    try:
        import psutil
        
        # Verificar espaço em disco
        disk_usage = psutil.disk_usage('.')
        total_gb = disk_usage.total / (1024**3)
        used_gb = disk_usage.used / (1024**3)
        free_gb = disk_usage.free / (1024**3)
        percent_used = (disk_usage.used / disk_usage.total) * 100
        
        print(f"📊 Total: {total_gb:.2f} GB")
        print(f"📊 Usado: {used_gb:.2f} GB ({percent_used:.1f}%)")
        print(f"📊 Livre: {free_gb:.2f} GB")
        
        if percent_used > 90:
            print("⚠️ ATENÇÃO: Disco quase cheio!")
        elif percent_used > 80:
            print("⚠️ Disco com pouco espaço livre")
        else:
            print("✅ Espaço em disco adequado")
            
    except ImportError:
        print("ℹ️ psutil não instalado, pulando verificação de disco")

def otimizar_banco_dados():
    """Otimizar banco de dados SQLite"""
    print("\n🗄️ OTIMIZANDO BANCO DE DADOS")
    print("=" * 50)
    
    db_file = 'procon_system/db.sqlite3'
    
    if os.path.exists(db_file):
        try:
            import sqlite3
            
            # Conectar ao banco
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # Verificar tamanho antes
            cursor.execute("PRAGMA page_count;")
            page_count_before = cursor.fetchone()[0]
            
            # Otimizar banco
            cursor.execute("VACUUM;")
            cursor.execute("ANALYZE;")
            
            # Verificar tamanho depois
            cursor.execute("PRAGMA page_count;")
            page_count_after = cursor.fetchone()[0]
            
            conn.close()
            
            print(f"✅ Banco otimizado: {page_count_before} -> {page_count_after} páginas")
            
        except Exception as e:
            print(f"❌ Erro ao otimizar banco: {e}")
    else:
        print("ℹ️ Arquivo de banco não encontrado")

def rebuildar_frontend():
    """Rebuildar o frontend"""
    print("\n🔨 REBUILDANDO FRONTEND")
    print("=" * 50)
    
    try:
        # Navegar para o diretório frontend
        os.chdir('frontend')
        
        # Instalar dependências
        print("📦 Instalando dependências...")
        os.system('npm install')
        
        # Build para Django
        print("🔨 Fazendo build...")
        os.system('npm run build:django')
        
        # Voltar ao diretório raiz
        os.chdir('..')
        
        print("✅ Frontend rebuildado com sucesso")
        
    except Exception as e:
        print(f"❌ Erro ao rebuildar frontend: {e}")

def main():
    """Função principal"""
    print("🚀 LIMPANDO CACHE E OTIMIZANDO PORTAL CIDADÃO")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Executar limpezas
    limpar_cache_frontend()
    limpar_logs_django()
    limpar_arquivos_temporarios()
    verificar_espaco_disco()
    otimizar_banco_dados()
    
    # Perguntar se quer rebuildar
    print("\n" + "=" * 60)
    print("🔨 REBUILDAR FRONTEND?")
    print("=" * 60)
    print("Isso pode resolver problemas de memória e performance.")
    
    try:
        resposta = input("Deseja rebuildar o frontend? (s/n): ").lower().strip()
        if resposta in ['s', 'sim', 'y', 'yes']:
            rebuildar_frontend()
        else:
            print("ℹ️ Rebuild pulado")
    except KeyboardInterrupt:
        print("\nℹ️ Operação cancelada pelo usuário")
    
    print("\n" + "=" * 60)
    print("🏁 LIMPEZA CONCLUÍDA")
    print("=" * 60)
    print("💡 Dicas para evitar problemas de memória:")
    print("   1. Reinicie o servidor Django após a limpeza")
    print("   2. Use o modo de desenvolvimento para testes")
    print("   3. Monitore o uso de memória no navegador")
    print("   4. Limpe o cache do navegador regularmente")

if __name__ == '__main__':
    main()
