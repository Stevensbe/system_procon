#!/usr/bin/env python3
"""
Script para restauração do banco de dados PostgreSQL
"""
import os
import sys
import django
import subprocess
from pathlib import Path
import argparse

# Configurar Django
sys.path.append(str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def restore_postgresql(backup_file):
    """Restaura backup do PostgreSQL usando psql"""
    try:
        db_config = settings.DATABASES['default']
        
        if db_config['ENGINE'] != 'django.db.backends.postgresql':
            logger.error("Este script é específico para PostgreSQL")
            return False
        
        backup_path = Path(backup_file)
        if not backup_path.exists():
            logger.error(f"Arquivo de backup não encontrado: {backup_file}")
            return False
        
        # Comando psql para restaurar
        cmd = [
            'psql',
            f"--host={db_config['HOST']}",
            f"--port={db_config['PORT']}",
            f"--username={db_config['USER']}",
            f"--dbname={db_config['NAME']}",
            '--verbose',
            f"--file={backup_path}"
        ]
        
        # Configurar senha via variável de ambiente
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['PASSWORD']
        
        logger.info(f"Iniciando restauração de: {backup_file}")
        
        # Confirmar antes de restaurar
        response = input("⚠️  ATENÇÃO: Esta operação irá sobrescrever o banco atual. Continuar? (sim/NAO): ")
        if response.lower() != 'sim':
            logger.info("Restauração cancelada pelo usuário")
            return False
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("Restauração concluída com sucesso")
            return True
        else:
            logger.error(f"Erro na restauração: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Erro durante a restauração: {e}")
        return False

def restore_media_files(backup_file):
    """Restaura arquivos de mídia"""
    try:
        backup_path = Path(backup_file)
        if not backup_path.exists():
            logger.error(f"Arquivo de backup de mídia não encontrado: {backup_file}")
            return False
        
        media_root = Path(settings.MEDIA_ROOT)
        
        # Confirmar antes de restaurar
        response = input("⚠️  ATENÇÃO: Esta operação irá sobrescrever os arquivos de mídia atuais. Continuar? (sim/NAO): ")
        if response.lower() != 'sim':
            logger.info("Restauração de mídia cancelada pelo usuário")
            return False
        
        # Extrair tar.gz
        cmd = ['tar', '-xzf', str(backup_path), '-C', str(media_root.parent)]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("Restauração de mídia concluída com sucesso")
            return True
        else:
            logger.error(f"Erro na restauração de mídia: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Erro durante restauração de mídia: {e}")
        return False

def list_backups():
    """Lista backups disponíveis"""
    backup_dir = Path(__file__).parent.parent / 'backups'
    
    if not backup_dir.exists():
        logger.info("Nenhum backup encontrado")
        return
    
    db_backups = list(backup_dir.glob('backup_procon_*.sql'))
    media_backups = list(backup_dir.glob('media_backup_*.tar.gz'))
    
    print("\\n=== BACKUPS DE BANCO DE DADOS ===")
    for backup in sorted(db_backups, reverse=True):
        size_mb = backup.stat().st_size / 1024 / 1024
        print(f"  {backup.name} ({size_mb:.2f} MB)")
    
    print("\\n=== BACKUPS DE MÍDIA ===")
    for backup in sorted(media_backups, reverse=True):
        size_mb = backup.stat().st_size / 1024 / 1024
        print(f"  {backup.name} ({size_mb:.2f} MB)")

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Restaurar backup do sistema Procon')
    parser.add_argument('--list', action='store_true', help='Listar backups disponíveis')
    parser.add_argument('--db', type=str, help='Arquivo de backup do banco de dados')
    parser.add_argument('--media', type=str, help='Arquivo de backup de mídia')
    
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    if args.list:
        list_backups()
        return
    
    if not args.db and not args.media:
        logger.error("Especifique --db ou --media ou use --list para ver backups disponíveis")
        parser.print_help()
        return
    
    logger.info("=== INICIANDO PROCESSO DE RESTAURAÇÃO ===")
    
    success = True
    
    if args.db:
        success &= restore_postgresql(args.db)
    
    if args.media:
        success &= restore_media_files(args.media)
    
    if success:
        logger.info("=== RESTAURAÇÃO CONCLUÍDA COM SUCESSO ===")
    else:
        logger.error("=== FALHA NA RESTAURAÇÃO ===")
        sys.exit(1)

if __name__ == '__main__':
    main()