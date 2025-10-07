const SETOR_ALIAS_MAP = {
  FISCALIZACAO: 'Fiscalização',
  FISCALIZACAO_DENUNCIAS: 'Fiscalização',
  FISCALIZACAO_PROPRIO: 'Fiscalização',
  JURIDICO: 'Jurídico',
  JURIDICO_1: 'Jurídico 1',
  JURIDICO_2: 'Jurídico 2',
  DIRETORIA: 'Diretoria/Administração',
  DAF: 'Diretoria Administrativa Financeira',
  FINANCEIRO: 'Financeiro',
  COBRANCA: 'Cobrança',
  ADMINISTRATIVO: 'Administrativo',
  ATENDIMENTO: 'Atendimento',
  PROTOCOLO: 'Atendimento',
  GERAL: 'Geral',
};

const sanitizeValue = (valor) => {
  if (valor === undefined || valor === null) {
    return '';
  }
  return String(valor).trim();
};

export const normalizeSetorFiltro = (valor) => {
  const texto = sanitizeValue(valor);
  if (!texto) {
    return texto;
  }

  const ascii = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const codigo = ascii.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return SETOR_ALIAS_MAP[codigo] || texto;
};

export const formatSetorName = (valor) => {
  const texto = sanitizeValue(valor);
  if (!texto) {
    return 'Geral';
  }

  const normalizado = normalizeSetorFiltro(texto) || texto;
  const partes = normalizado
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase());

  return partes.join(' ') || 'Geral';
};

export const getSetorAliasMap = () => ({ ...SETOR_ALIAS_MAP });

