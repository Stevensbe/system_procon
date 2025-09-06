"""
Validadores de segurança para entrada de dados
"""
import re
import html
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def sanitize_html(text):
    """Remove tags HTML perigosas"""
    if not text:
        return text
    
    # Lista de tags permitidas
    allowed_tags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br']
    
    # Remover todas as tags exceto as permitidas
    pattern = r'<(?!\/?(?:' + '|'.join(allowed_tags) + r')\b)[^>]+>'
    text = re.sub(pattern, '', text)
    
    return html.escape(text)

def validate_cnpj(value):
    """Valida formato de CNPJ"""
    if not value:
        return value
    
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', str(value))
    
    if len(cnpj) != 14:
        raise ValidationError(_('CNPJ deve ter 14 dígitos'))
    
    # Validação do CNPJ
    if cnpj == cnpj[0] * 14:
        raise ValidationError(_('CNPJ inválido'))
    
    return cnpj

def validate_cpf(value):
    """Valida formato de CPF"""
    if not value:
        return value
    
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', str(value))
    
    if len(cpf) != 11:
        raise ValidationError(_('CPF deve ter 11 dígitos'))
    
    # Validação do CPF
    if cpf == cpf[0] * 11:
        raise ValidationError(_('CPF inválido'))
    
    return cpf

def validate_phone(value):
    """Valida formato de telefone"""
    if not value:
        return value
    
    # Remove caracteres não numéricos
    phone = re.sub(r'[^0-9]', '', str(value))
    
    if len(phone) < 10 or len(phone) > 11:
        raise ValidationError(_('Telefone deve ter 10 ou 11 dígitos'))
    
    return phone

def validate_email(value):
    """Valida formato de email"""
    if not value:
        return value
    
    # Padrão básico de email
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, value):
        raise ValidationError(_('Email inválido'))
    
    return value.lower()

def validate_sql_injection(value):
    """Detecta tentativas de SQL injection"""
    if not value:
        return value
    
    # Padrões suspeitos
    suspicious_patterns = [
        r'(\b(union|select|insert|update|delete|drop|create|alter)\b)',
        r'(\b(or|and)\b\s+\d+\s*=\s*\d+)',
        r'(\b(exec|execute|script)\b)',
        r'(\b(union|select|insert|update|delete|drop|create|alter)\b)',
        r'(\b(union|select|insert|update|delete|drop|create|alter)\b)',
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(_('Entrada suspeita detectada'))
    
    return value

def validate_xss(value):
    """Detecta tentativas de XSS"""
    if not value:
        return value
    
    # Padrões suspeitos de XSS
    xss_patterns = [
        r'<script[^>]*>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
    ]
    
    for pattern in xss_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(_('Conteúdo malicioso detectado'))
    
    return value
