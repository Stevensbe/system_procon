/**
 * Servico de Atendimento via API (Django).
 */

import api from './api';

export const TIPO_ATENDIMENTO = {
  RECLAMACAO: 'RECLAMACAO',
  CONSULTA: 'CONSULTA',
  DENUNCIA: 'DENUNCIA',
  ORIENTACAO: 'ORIENTACAO',
  OUTROS: 'OUTROS',
};

export const STATUS_ATENDIMENTO = {
  ABERTO: 'ABERTO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  AGUARDANDO_EMPRESA: 'AGUARDANDO_EMPRESA',
  AGUARDANDO_CONSUMIDOR: 'AGUARDANDO_CONSUMIDOR',
  RESOLVIDO: 'RESOLVIDO',
  NAO_RESOLVIDO: 'NAO_RESOLVIDO',
  CANCELADO: 'CANCELADO',
  ARQUIVADO: 'ARQUIVADO',
};

export const GRAVIDADE = {
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
};

const BASE_URL = 'atendimento/api';

const normalizarAnexos = (anexos) => {
  if (!anexos) {
    return [];
  }
  if (Array.isArray(anexos)) {
    return anexos;
  }
  if (typeof File !== 'undefined' && anexos instanceof File) {
    return [anexos];
  }
  if (typeof FileList !== 'undefined' && anexos instanceof FileList) {
    return Array.from(anexos);
  }
  return [];
};

const appendFormValue = (formData, key, value) => {
  if (value === null || value === undefined) {
    return;
  }

  if (value instanceof Date) {
    formData.append(key, value.toISOString());
    return;
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? 'true' : 'false');
    return;
  }

  const isFile = typeof File !== 'undefined' && value instanceof File;
  const isBlob = typeof Blob !== 'undefined' && value instanceof Blob;

  if (typeof value === 'object' && !isFile && !isBlob) {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, value);
};

const buildFormData = (payload, anexos) => {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  normalizarAnexos(anexos).forEach((arquivo) => {
    if (arquivo) {
      formData.append('anexos', arquivo);
    }
  });

  return formData;
};

// =========================================================================
// Reclamações / Atendimento presencial
// =========================================================================

export const listarReclamacoes = async (filtros = {}, page = 1, pageSize = 20) => {
  const params = { ...(filtros || {}) };
  if (page) params.page = page;
  if (pageSize) params.page_size = pageSize;

  const response = await api.get(`${BASE_URL}/reclamacoes/`, { params });
  return response.data;
};

export const obterReclamacao = async (id) => {
  const response = await api.get(`${BASE_URL}/reclamacoes/${id}/`);
  return response.data;
};

export const registrarPresencial = async (payload = {}) => {
  const { anexos, ...rest } = payload || {};
  const formData = buildFormData(rest, anexos);
  const response = await api.post(`${BASE_URL}/registros-presenciais/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const consultarCnpj = async (cnpj) => {
  const response = await api.get(`${BASE_URL}/consultar-cnpj/`, {
    params: { cnpj },
  });
  return response.data;
};

export const solicitarCadastroRapidoEmpresa = async (payload) => {
  const response = await api.post(`${BASE_URL}/empresas/cadastro-rapido/`, payload);
  return response.data;
};

// =========================================================================
// Configuracao de prazos
// =========================================================================

export const obterConfiguracao = async () => {
  const response = await api.get(`${BASE_URL}/configuracoes/`);
  return response.data;
};

export const atualizarConfiguracao = async (payload) => {
  const response = await api.put(`${BASE_URL}/configuracoes/`, payload);
  return response.data;
};

// =========================================================================
// Regras de distribuicao
// =========================================================================

export const listarRegrasDistribuicao = async () => {
  const response = await api.get(`${BASE_URL}/distribuicao/regras/`);
  return response.data;
};

export const criarRegraDistribuicao = async (payload) => {
  const response = await api.post(`${BASE_URL}/distribuicao/regras/`, payload);
  return response.data;
};

export const atualizarRegraDistribuicao = async (id, payload) => {
  const response = await api.put(`${BASE_URL}/distribuicao/regras/${id}/`, payload);
  return response.data;
};

export const removerRegraDistribuicao = async (id) => {
  const response = await api.delete(`${BASE_URL}/distribuicao/regras/${id}/`);
  return response.data;
};

// =========================================================================
// LGPD - Remocao de dados
// =========================================================================

export const solicitarRemocaoDados = async (atendimentoId, observacoes = '') => {
  const response = await api.post(`${BASE_URL}/atendimentos/${atendimentoId}/remocao/solicitar/`, {
    observacoes,
  });
  return response.data;
};

export const confirmarRemocaoDados = async (atendimentoId) => {
  const response = await api.post(`${BASE_URL}/atendimentos/${atendimentoId}/remocao/confirmar/`);
  return response.data;
};

// =========================================================================
// Compatibilidade basica (aliases)
// =========================================================================

export const listarAtendimentos = async (filtros = {}, page = 1, pageSize = 20) => {
  const data = await listarReclamacoes(filtros, page, pageSize);
  return data?.results || [];
};

export const obterAtendimento = async (id) => obterReclamacao(id);

export const criarAtendimento = async (dados) => registrarPresencial(dados);

export default {
  TIPO_ATENDIMENTO,
  STATUS_ATENDIMENTO,
  GRAVIDADE,
  listarReclamacoes,
  obterReclamacao,
  registrarPresencial,
  consultarCnpj,
  solicitarCadastroRapidoEmpresa,
  obterConfiguracao,
  atualizarConfiguracao,
  listarRegrasDistribuicao,
  criarRegraDistribuicao,
  atualizarRegraDistribuicao,
  removerRegraDistribuicao,
  solicitarRemocaoDados,
  confirmarRemocaoDados,
  listarAtendimentos,
  obterAtendimento,
  criarAtendimento,
};
