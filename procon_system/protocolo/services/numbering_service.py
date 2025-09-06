"""
Serviço de numeração automática de protocolos
Implementa diferentes formatos e estratégias de numeração
"""
from datetime import datetime, timedelta
from django.db import models, transaction
from django.conf import settings
from django.core.cache import cache
import re
from typing import Dict, Optional, Tuple


class ProtocolNumberingService:
    """Serviço de numeração automática de protocolos"""
    
    # Formatos disponíveis de numeração
    FORMATS = {
        'SEQUENTIAL': '{year}{seq:06d}',
        'DAILY': '{year}{month:02d}{day:02d}-{seq:04d}',
        'MONTHLY': '{year}{month:02d}-{seq:05d}',
        'HOURLY': '{year}{month:02d}{day:02d}-{hour:02d}{minute:02d}-{seq:03d}',
        'CUSTOM': '{prefix}{year}{month:02d}{day:02d}{seq:04d}{suffix}',
    }
    
    def __init__(self):
        self.cache_timeout = 300  # 5 minutos
        
    def generate_protocol_number(self, 
                                 format_type: str = 'SEQUENTIAL', 
                                 prefix: str = '', 
                                 suffix: str = '',
                                 tipo_protocolo=None) -> str:
        """
        Gera número único de protocolo baseado no formato especificado
        
        Args:
            format_type: Tipo de formato (SEQUENTIAL, DAILY, MONTHLY, etc.)
            prefix: Prefixo personalizado
            suffix: Sufixo personalizado  
            tipo_protocolo: Tipo do protocolo para numeração específica
            
        Returns:
            str: Número único do protocolo
        """
        now = datetime.now()
        
        with transaction.atomic():
            # Obter próximo número sequencial
            seq_number = self._get_next_sequence(format_type, now, tipo_protocolo)
            
            # Gerar número baseado no formato
            if format_type == 'SEQUENTIAL':
                number = self.FORMATS[format_type].format(
                    year=now.year,
                    seq=seq_number
                )
            elif format_type == 'DAILY':
                number = self.FORMATS[format_type].format(
                    year=now.year,
                    month=now.month,
                    day=now.day,
                    seq=seq_number
                )
            elif format_type == 'MONTHLY':
                number = self.FORMATS[format_type].format(
                    year=now.year,
                    month=now.month,
                    seq=seq_number
                )
            elif format_type == 'HOURLY':
                number = self.FORMATS[format_type].format(
                    year=now.year,
                    month=now.month,
                    day=now.day,
                    hour=now.hour,
                    minute=now.minute,
                    seq=seq_number
                )
            elif format_type == 'CUSTOM':
                number = self.FORMATS[format_type].format(
                    prefix=prefix,
                    year=now.year,
                    month=now.month,
                    day=now.day,
                    seq=seq_number,
                    suffix=suffix
                )
            else:
                raise ValueError(f"Formato não suportado: {format_type}")
                
            # Adicionar prefixo/sufixo se fornecidos para outros formatos
            if format_type != 'CUSTOM':
                if prefix:
                    number = f"{prefix}{number}"
                if suffix:
                    number = f"{number}{suffix}"
            
            # Validar unicidade
            if self._check_number_exists(number):
                # Se existe, tentar com próximo número
                return self.generate_protocol_number(
                    format_type, prefix, suffix, tipo_protocolo
                )
            
            return number
    
    def _get_next_sequence(self, 
                          format_type: str, 
                          date: datetime,
                          tipo_protocolo=None) -> int:
        """Obtém o próximo número sequencial baseado no tipo"""
        from ..models import Protocolo
        
        cache_key = self._get_cache_key(format_type, date, tipo_protocolo)
        
        # Tentar pegar da cache primeiro
        seq = cache.get(cache_key)
        if seq is not None:
            seq += 1
            cache.set(cache_key, seq, self.cache_timeout)
            return seq
        
        # Se não está na cache, calcular do banco
        filters = {}
        
        if format_type == 'SEQUENTIAL':
            filters['data_abertura__year'] = date.year
        elif format_type == 'DAILY':
            filters['data_abertura__date'] = date.date()
        elif format_type == 'MONTHLY':
            filters['data_abertura__year'] = date.year
            filters['data_abertura__month'] = date.month
        elif format_type == 'HOURLY':
            filters['data_abertura__date'] = date.date()
            filters['data_abertura__hour'] = date.hour
            
        if tipo_protocolo:
            filters['tipo_protocolo'] = tipo_protocolo
            
        # Contar protocolos existentes
        count = Protocolo.objects.filter(**filters).count()
        seq = count + 1
        
        # Salvar na cache
        cache.set(cache_key, seq, self.cache_timeout)
        
        return seq
    
    def _get_cache_key(self, 
                      format_type: str, 
                      date: datetime,
                      tipo_protocolo=None) -> str:
        """Gera chave de cache para o contador"""
        key_parts = ['protocol_seq', format_type]
        
        if format_type == 'SEQUENTIAL':
            key_parts.append(str(date.year))
        elif format_type == 'DAILY':
            key_parts.append(date.strftime('%Y%m%d'))
        elif format_type == 'MONTHLY':
            key_parts.append(date.strftime('%Y%m'))
        elif format_type == 'HOURLY':
            key_parts.append(date.strftime('%Y%m%d%H'))
            
        if tipo_protocolo:
            key_parts.append(f"tipo_{tipo_protocolo.id}")
            
        return '_'.join(key_parts)
    
    def _check_number_exists(self, number: str) -> bool:
        """Verifica se o número já existe"""
        from ..models import Protocolo
        return Protocolo.objects.filter(numero=number).exists()
    
    def validate_number_format(self, number: str, format_type: str) -> bool:
        """Valida se um número está no formato correto"""
        patterns = {
            'SEQUENTIAL': r'^\d{4}\d{6}$',  # YYYYNNNNNN
            'DAILY': r'^\d{8}-\d{4}$',      # YYYYMMDD-NNNN  
            'MONTHLY': r'^\d{6}-\d{5}$',    # YYYYMM-NNNNN
            'HOURLY': r'^\d{8}-\d{4}-\d{3}$', # YYYYMMDD-HHMM-NNN
        }
        
        if format_type in patterns:
            return bool(re.match(patterns[format_type], number.strip()))
        return True  # Para formatos customizados
    
    def parse_protocol_number(self, number: str) -> Dict:
        """Extrai informações do número do protocolo"""
        info = {
            'number': number,
            'year': None,
            'month': None,
            'day': None,
            'sequence': None,
            'format_detected': None
        }
        
        # Tentar diferentes padrões
        patterns = [
            (r'^(\d{4})(\d{6})$', 'SEQUENTIAL'),
            (r'^(\d{4})(\d{2})(\d{2})-(\d{4})$', 'DAILY'),
            (r'^(\d{4})(\d{2})-(\d{5})$', 'MONTHLY'),
            (r'^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-(\d{3})$', 'HOURLY'),
        ]
        
        for pattern, format_type in patterns:
            match = re.match(pattern, number.strip())
            if match:
                info['format_detected'] = format_type
                groups = match.groups()
                
                if format_type == 'SEQUENTIAL':
                    info['year'] = int(groups[0])
                    info['sequence'] = int(groups[1])
                elif format_type == 'DAILY':
                    info['year'] = int(groups[0])
                    info['month'] = int(groups[1])
                    info['day'] = int(groups[2])
                    info['sequence'] = int(groups[3])
                elif format_type == 'MONTHLY':
                    info['year'] = int(groups[0])
                    info['month'] = int(groups[1])
                    info['sequence'] = int(groups[2])
                elif format_type == 'HOURLY':
                    info['year'] = int(groups[0])
                    info['month'] = int(groups[1])
                    info['day'] = int(groups[2])
                    info['sequence'] = int(groups[5])
                
                break
                
        return info
    
    def get_statistics(self) -> Dict:
        """Retorna estatísticas da numeração"""
        from ..models import Protocolo
        
        today = datetime.now()
        
        stats = {
            'total_protocolos': Protocolo.objects.count(),
            'protocolos_hoje': Protocolo.objects.filter(
                data_abertura__date=today.date()
            ).count(),
            'protocolos_mes': Protocolo.objects.filter(
                data_abertura__year=today.year,
                data_abertura__month=today.month
            ).count(),
            'protocolos_ano': Protocolo.objects.filter(
                data_abertura__year=today.year
            ).count(),
            'formatos_detectados': {},
            'proximo_sequencial': self._get_next_sequence('SEQUENTIAL', today),
            'proximo_diario': self._get_next_sequence('DAILY', today),
            'proximo_mensal': self._get_next_sequence('MONTHLY', today),
        }
        
        # Analisar formatos existentes
        protocolos = Protocolo.objects.values_list('numero', flat=True)
        for numero in protocolos:
            parsed = self.parse_protocol_number(numero)
            formato = parsed.get('format_detected', 'CUSTOM')
            stats['formatos_detectados'][formato] = stats['formatos_detectados'].get(formato, 0) + 1
        
        return stats
    
    def reset_sequence_cache(self, format_type: str = None):
        """Limpa cache de sequências"""
        if format_type:
            # Limpar apenas um formato específico
            today = datetime.now()
            cache_key = self._get_cache_key(format_type, today)
            cache.delete(cache_key)
        else:
            # Limpar todos os caches de sequência
            cache.delete_many([
                key for key in cache._cache.keys() 
                if key.startswith('protocol_seq')
            ])
    
    def bulk_generate_numbers(self, 
                             count: int, 
                             format_type: str = 'SEQUENTIAL',
                             prefix: str = '',
                             suffix: str = '') -> list:
        """Gera múltiplos números em lote"""
        numbers = []
        
        for _ in range(count):
            number = self.generate_protocol_number(
                format_type, prefix, suffix
            )
            numbers.append(number)
            
        return numbers


# Instância global do serviço
numbering_service = ProtocolNumberingService()