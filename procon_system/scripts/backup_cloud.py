#!/usr/bin/env python3
"""
Script para backup automático em nuvem (AWS S3)
"""
import os
import sys
import django
import boto3
import logging
from pathlib import Path
from datetime import datetime, timedelta
import subprocess
import hashlib
from botocore.exceptions import ClientError

# Configurar Django
sys.path.append(str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procon_system.settings')
django.setup()

from django.conf import settings
from auditoria.models import BackupLog

logger = logging.getLogger(__name__)

class CloudBackupManager:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name=os.environ.get('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.environ.get('AWS_S3_BACKUP_BUCKET', 'procon-backups')
        self.backup_retention_days = int(os.environ.get('BACKUP_RETENTION_DAYS', '30'))
        
    def create_backup_log(self, nome_backup, tipo_backup, automatico=True):
        """Cria log de backup no banco"""
        return BackupLog.objects.create(
            nome_backup=nome_backup,
            tipo_backup=tipo_backup,
            data_inicio=datetime.now(),
            executado_por='sistema',
            automatico=automatico,
            local_armazenamento=f's3://{self.bucket_name}/{nome_backup}'
        )
    
    def update_backup_log(self, backup_log, **kwargs):
        """Atualiza log de backup"""
        for key, value in kwargs.items():
            setattr(backup_log, key, value)
        backup_log.save()
    
    def backup_database_to_s3(self):
        """Faz backup do banco de dados para S3"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f'db_backup_{timestamp}.sql'
            
            # Criar log de backup
            backup_log = self.create_backup_log(backup_name, 'completo')
            
            # Configurações do banco
            db_config = settings.DATABASES['default']
            
            if db_config['ENGINE'] != 'django.db.backends.postgresql':
                logger.error("Backup em nuvem suporta apenas PostgreSQL")
                self.update_backup_log(backup_log, status='falhado', sucesso=False)
                return False
            
            # Criar backup local temporário
            temp_backup_path = Path('/tmp') / backup_name
            
            # Comando pg_dump
            cmd = [
                'pg_dump',
                f"--host={db_config['HOST']}",
                f"--port={db_config['PORT']}",
                f"--username={db_config['USER']}",
                f"--dbname={db_config['NAME']}",
                '--verbose',
                '--no-password',
                f"--file={temp_backup_path}"
            ]
            
            # Configurar senha via variável de ambiente
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config['PASSWORD']
            
            logger.info(f"Iniciando backup do banco: {backup_name}")
            
            # Executar pg_dump
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Erro no pg_dump: {result.stderr}")
                self.update_backup_log(backup_log, status='falhado', sucesso=False, erro_detalhes=result.stderr)
                return False
            
            # Calcular tamanho e hash
            file_size = temp_backup_path.stat().st_size
            file_hash = self.calculate_file_hash(temp_backup_path)
            
            # Upload para S3
            logger.info("Fazendo upload para S3...")
            self.s3_client.upload_file(
                str(temp_backup_path),
                self.bucket_name,
                f'database/{backup_name}',
                ExtraArgs={
                    'Metadata': {
                        'backup-type': 'database',
                        'timestamp': timestamp,
                        'hash': file_hash,
                        'size': str(file_size)
                    }
                }
            )
            
            # Remover arquivo temporário
            temp_backup_path.unlink()
            
            # Atualizar log
            self.update_backup_log(
                backup_log,
                status='concluido',
                sucesso=True,
                data_fim=datetime.now(),
                tamanho_backup=file_size,
                hash_verificacao=file_hash,
                progresso_percentual=100
            )
            
            logger.info(f"Backup do banco concluído: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Erro no backup do banco: {e}")
            if 'backup_log' in locals():
                self.update_backup_log(backup_log, status='falhado', sucesso=False, erro_detalhes=str(e))
            return False
    
    def backup_media_to_s3(self):
        """Faz backup dos arquivos de mídia para S3"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f'media_backup_{timestamp}.tar.gz'
            
            # Criar log de backup
            backup_log = self.create_backup_log(backup_name, 'completo')
            
            # Caminho da mídia
            media_root = Path(settings.MEDIA_ROOT)
            
            if not media_root.exists():
                logger.warning("Diretório de mídia não encontrado")
                self.update_backup_log(backup_log, status='falhado', sucesso=False)
                return False
            
            # Criar backup local temporário
            temp_backup_path = Path('/tmp') / backup_name
            
            # Comando tar
            cmd = ['tar', '-czf', str(temp_backup_path), '-C', str(media_root.parent), media_root.name]
            
            logger.info(f"Iniciando backup de mídia: {backup_name}")
            
            # Executar tar
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Erro no tar: {result.stderr}")
                self.update_backup_log(backup_log, status='falhado', sucesso=False, erro_detalhes=result.stderr)
                return False
            
            # Calcular tamanho e hash
            file_size = temp_backup_path.stat().st_size
            file_hash = self.calculate_file_hash(temp_backup_path)
            
            # Upload para S3
            logger.info("Fazendo upload para S3...")
            self.s3_client.upload_file(
                str(temp_backup_path),
                self.bucket_name,
                f'media/{backup_name}',
                ExtraArgs={
                    'Metadata': {
                        'backup-type': 'media',
                        'timestamp': timestamp,
                        'hash': file_hash,
                        'size': str(file_size)
                    }
                }
            )
            
            # Remover arquivo temporário
            temp_backup_path.unlink()
            
            # Atualizar log
            self.update_backup_log(
                backup_log,
                status='concluido',
                sucesso=True,
                data_fim=datetime.now(),
                tamanho_backup=file_size,
                hash_verificacao=file_hash,
                progresso_percentual=100
            )
            
            logger.info(f"Backup de mídia concluído: {backup_name}")
            return True
            
        except Exception as e:
            logger.error(f"Erro no backup de mídia: {e}")
            if 'backup_log' in locals():
                self.update_backup_log(backup_log, status='falhado', sucesso=False, erro_detalhes=str(e))
            return False
    
    def calculate_file_hash(self, file_path):
        """Calcula hash SHA256 do arquivo"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def cleanup_old_backups(self):
        """Remove backups antigos do S3"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.backup_retention_days)
            
            # Listar objetos no bucket
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='database/'
            )
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    # Verificar data do objeto
                    if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                        logger.info(f"Removendo backup antigo: {obj['Key']}")
                        self.s3_client.delete_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
            
            # Limpar backups de mídia antigos
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='media/'
            )
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                        logger.info(f"Removendo backup de mídia antigo: {obj['Key']}")
                        self.s3_client.delete_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
            
            logger.info("Limpeza de backups antigos concluída")
            
        except Exception as e:
            logger.error(f"Erro na limpeza de backups: {e}")
    
    def verify_backup_integrity(self, backup_key):
        """Verifica integridade do backup"""
        try:
            # Baixar metadados
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=backup_key
            )
            
            # Verificar se tem metadados de hash
            if 'Metadata' in response and 'hash' in response['Metadata']:
                stored_hash = response['Metadata']['hash']
                
                # Baixar arquivo e calcular hash
                temp_file = Path('/tmp') / f'verify_{backup_key.split("/")[-1]}'
                
                self.s3_client.download_file(self.bucket_name, backup_key, str(temp_file))
                calculated_hash = self.calculate_file_hash(temp_file)
                
                # Remover arquivo temporário
                temp_file.unlink()
                
                # Comparar hashes
                if stored_hash == calculated_hash:
                    logger.info(f"Backup {backup_key} - Integridade OK")
                    return True
                else:
                    logger.error(f"Backup {backup_key} - Hash não confere")
                    return False
            else:
                logger.warning(f"Backup {backup_key} - Sem hash armazenado")
                return False
                
        except Exception as e:
            logger.error(f"Erro na verificação de integridade: {e}")
            return False

def main():
    """Função principal"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Verificar variáveis de ambiente
    required_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BACKUP_BUCKET']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.error(f"Variáveis de ambiente obrigatórias não configuradas: {missing_vars}")
        sys.exit(1)
    
    logger.info("=== INICIANDO BACKUP EM NUVEM ===")
    
    backup_manager = CloudBackupManager()
    
    # Fazer backups
    db_success = backup_manager.backup_database_to_s3()
    media_success = backup_manager.backup_media_to_s3()
    
    # Limpeza de backups antigos
    backup_manager.cleanup_old_backups()
    
    if db_success and media_success:
        logger.info("=== BACKUP EM NUVEM CONCLUÍDO COM SUCESSO ===")
    elif db_success or media_success:
        logger.warning("=== BACKUP EM NUVEM PARCIALMENTE CONCLUÍDO ===")
    else:
        logger.error("=== FALHA NO BACKUP EM NUVEM ===")
        sys.exit(1)

if __name__ == '__main__':
    main()
