from django import template

register = template.Library()

@register.filter
def get_range(value):
    """
    Retorna um range de 1 até o valor especificado
    Útil para paginação
    """
    try:
        return range(1, int(value) + 1)
    except (ValueError, TypeError):
        return range(1)
