#!/usr/bin/env python3
"""
Script para backup do banco de dados PostgreSQL
"""
import os
import sys
import django
import subprocess
from datetime import datetime
from pathlib import Path

# Configurar Django
sys.path.append(str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.conf import settings
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def create_backup_directory():
    """Cria diretório de backup se não existir"""
    backup_dir = Path(__file__).parent.parent / 'backups'
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def backup_postgresql():
    """Realiza backup do PostgreSQL usando pg_dump"""
    try:
        db_config = settings.DATABASES['default']
        
        if db_config['ENGINE'] != 'django.db.backends.postgresql':
            logger.error("Este script é específico para PostgreSQL")
            return False
        
        backup_dir = create_backup_directory()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = backup_dir / f'backup_procon_{timestamp}.sql'
        
        # Comando pg_dump
        cmd = [
            'pg_dump',
            f"--host={db_config['HOST']}",
            f"--port={db_config['PORT']}",
            f"--username={db_config['USER']}",
            f"--dbname={db_config['NAME']}",
            '--verbose',
            '--clean',
            '--no-owner',
            '--no-privileges',
            f"--file={backup_file}"
        ]
        
        # Configurar senha via variável de ambiente
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['PASSWORD']
        
        logger.info(f"Iniciando backup para: {backup_file}")
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Backup criado com sucesso: {backup_file}")
            logger.info(f"Tamanho do arquivo: {backup_file.stat().st_size / 1024 / 1024:.2f} MB")
            return backup_file
        else:
            logger.error(f"Erro no backup: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Erro durante o backup: {e}")
        return False

def backup_media_files():
    """Realiza backup dos arquivos de mídia"""
    try:
        backup_dir = create_backup_directory()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        media_backup = backup_dir / f'media_backup_{timestamp}.tar.gz'
        
        media_root = Path(settings.MEDIA_ROOT)
        
        if not media_root.exists():
            logger.warning("Diretório de mídia não encontrado")
            return False
        
        # Criar tar.gz dos arquivos de mídia
        cmd = ['tar', '-czf', str(media_backup), '-C', str(media_root.parent), media_root.name]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Backup de mídia criado: {media_backup}")
            logger.info(f"Tamanho do arquivo: {media_backup.stat().st_size / 1024 / 1024:.2f} MB")
            return media_backup
        else:
            logger.error(f"Erro no backup de mídia: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Erro durante backup de mídia: {e}")
        return False

def cleanup_old_backups(keep_days=30):
    """Remove backups antigos"""
    try:
        backup_dir = create_backup_directory()
        cutoff_time = datetime.now().timestamp() - (keep_days * 24 * 60 * 60)
        
        removed_count = 0
        for backup_file in backup_dir.glob('backup_*'):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
                removed_count += 1
                logger.info(f"Removido backup antigo: {backup_file}")
        
        logger.info(f"Limpeza concluída. {removed_count} backups antigos removidos.")
        
    except Exception as e:
        logger.error(f"Erro durante limpeza: {e}")

def main():
    """Função principal"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    logger.info("=== INICIANDO PROCESSO DE BACKUP ===")
    
    # Backup do banco de dados
    db_backup = backup_postgresql()
    
    # Backup dos arquivos de mídia
    media_backup = backup_media_files()
    
    # Limpeza de backups antigos
    cleanup_old_backups()
    
    if db_backup and media_backup:
        logger.info("=== BACKUP CONCLUÍDO COM SUCESSO ===")
    elif db_backup or media_backup:
        logger.warning("=== BACKUP PARCIALMENTE CONCLUÍDO ===")
    else:
        logger.error("=== FALHA NO BACKUP ===")
        sys.exit(1)

if __name__ == '__main__':
    main()