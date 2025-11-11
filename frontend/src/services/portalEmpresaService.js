import api from './api';

/**
 * Serviço centralizado para o Portal da Empresa.
 * Cada função encapsula chamadas à API REST publicada em /api/portal-empresa/.
 */

const BASE_URL = '/portal-empresa';

export const listarEmpresas = (params = {}) =>
  api.get(`${BASE_URL}/empresas/`, { params }).then((response) => response.data);

export const listarTokens = (params = {}) =>
  api.get(`${BASE_URL}/tokens/`, { params }).then((response) => response.data);

export const listarUsuarios = (params = {}) =>
  api.get(`${BASE_URL}/usuarios/`, { params }).then((response) => response.data);

export const listarRespostas = (params = {}) =>
  api.get(`${BASE_URL}/respostas/`, { params }).then((response) => response.data);

export const listarHistoricos = (params = {}) =>
  api.get(`${BASE_URL}/historicos/`, { params }).then((response) => response.data);

export const listarWebhooks = (params = {}) =>
  api.get(`${BASE_URL}/webhooks/`, { params }).then((response) => response.data);

export const listarAnalytics = (params = {}) =>
  api.get(`${BASE_URL}/analytics/`, { params }).then((response) => response.data);

export const obterEngajamentoResumo = () =>
  api.get(`${BASE_URL}/engajamento/resumo/`).then((response) => response.data);

export const listarReclamacoesEmpresa = (params = {}) =>
  api.get(`${BASE_URL}/reclamacoes/`, { params }).then((response) => response.data);

export const obterReclamacaoEmpresa = (id) =>
  api.get(`${BASE_URL}/reclamacoes/${id}/`).then((response) => response.data);

export const responderReclamacaoEmpresa = async (id, payload = {}, anexos = []) => {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    formData.append(key, value);
  });

  if (Array.isArray(anexos)) {
    anexos.filter(Boolean).forEach((file) => {
      formData.append('anexos', file);
    });
  }

  const response = await api.post(`${BASE_URL}/reclamacoes/${id}/respostas/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const criarSolicitacaoCadastro = (payload) =>
  api.post(`${BASE_URL}/solicitacoes/`, payload).then((response) => response.data);

export const listarSolicitacoesCadastro = (params = {}) =>
  api.get(`${BASE_URL}/solicitacoes/`, { params }).then((response) => response.data);

export const aprovarSolicitacaoCadastro = (id) =>
  api.post(`${BASE_URL}/solicitacoes/${id}/aprovar/`).then((response) => response.data);

export const rejeitarSolicitacaoCadastro = (id, payload) =>
  api.post(`${BASE_URL}/solicitacoes/${id}/rejeitar/`, payload).then((response) => response.data);

/**
 * Resumo agregado utilizado no dashboard do portal da empresa.
 * Faz chamadas paralelas e retorna um objeto unificado.
 */
export const obterResumoPortalEmpresa = async () => {
  const [empresas, tokens, respostas, historicos, analytics, reclamacoes, engajamento] = await Promise.all([
    listarEmpresas({ page_size: 5 }),
    listarTokens({ page_size: 5 }),
    listarRespostas({ page_size: 5 }),
    listarHistoricos({ page_size: 5 }),
    listarAnalytics().catch(() => ({ indicadores: [] })),
    listarReclamacoesEmpresa({ page_size: 5 }),
    obterEngajamentoResumo().catch(() => ({})),
  ]);

  return {
    empresasRecentes: empresas?.results ?? empresas,
    tokensRecentes: tokens?.results ?? tokens,
    respostasRecentes: respostas?.results ?? respostas,
    historicosRecentes: historicos?.results ?? historicos,
    reclamacoesRecentes: reclamacoes?.results ?? reclamacoes,
    analyticsResumo: analytics,
    engajamentoResumo: engajamento,
  };
};

export default {
  listarEmpresas,
  listarTokens,
  listarUsuarios,
  listarRespostas,
  listarHistoricos,
  listarWebhooks,
  listarAnalytics,
  obterEngajamentoResumo,
  listarReclamacoesEmpresa,
  obterReclamacaoEmpresa,
  responderReclamacaoEmpresa,
  criarSolicitacaoCadastro,
  listarSolicitacoesCadastro,
  aprovarSolicitacaoCadastro,
  rejeitarSolicitacaoCadastro,
  obterResumoPortalEmpresa,
};
