import api from './api';

/**
 * Serviço para o Portal do Consumidor.
 * Mapeia os endpoints expostos em /api/portal-consumidor/.
 */

const BASE_URL = '/portal-consumidor';

export const criarSessaoConsulta = (payload) =>
  api.post(`${BASE_URL}/sessoes/`, payload).then((response) => response.data);

export const obterSessao = (id, token) =>
  api
    .get(`${BASE_URL}/sessoes/${id}/`, {
      params: token ? { token } : undefined,
    })
    .then((response) => response.data);

export const consultarDocumento = (id, payload) =>
  api
    .post(`${BASE_URL}/sessoes/${id}/consultar/`, payload)
    .then((response) => response.data);

export const listarHistoricos = (id, token) =>
  api
    .get(`${BASE_URL}/sessoes/${id}/historicos/`, {
      params: token ? { token } : undefined,
    })
    .then((response) => response.data);

export const listarNotificacoes = (params = {}) =>
  api.get(`${BASE_URL}/notificacoes/`, { params }).then((response) => response.data);

export const enviarFeedback = (payload) =>
  api.post(`${BASE_URL}/feedbacks/`, payload).then((response) => response.data);

export const criarTicketSuporte = (payload) =>
  api.post(`${BASE_URL}/tickets/`, payload).then((response) => response.data);

export const listarTickets = (params = {}) =>
  api.get(`${BASE_URL}/tickets/`, { params }).then((response) => response.data);

export const listarTicketsAdmin = (params = {}) =>
  api.get(`${BASE_URL}/tickets-admin/`, { params }).then((response) => response.data);

export const atualizarTicketAdmin = (id, payload) =>
  api.patch(`${BASE_URL}/tickets-admin/${id}/`, payload).then((response) => response.data);

/**
 * Resumo consolidado para o dashboard do portal do consumidor.
 */
export const obterResumoPortalConsumidor = async ({ email, cpf } = {}) => {
  const [notificacoes, feedbacksRecentes, ticketsPend, resumoTickets] = await Promise.all([
    listarNotificacoes({ email, cpf, page_size: 5 }),
    api
      .get(`${BASE_URL}/feedbacks/`, { params: { page_size: 5 } })
      .then((response) => response.data)
      .catch(() => ({ results: [] })),
    api
      .get(`${BASE_URL}/tickets-admin/`, { params: { status: 'ABERTO,EM_ANALISE', page_size: 5 } })
      .then((response) => response.data)
      .catch(() => ({ results: [] })),
    api
      .get(`${BASE_URL}/tickets-admin/resumo/`)
      .then((response) => response.data)
      .catch(() => ({})),
  ]);

  const feedbackItems = feedbacksRecentes?.results ?? feedbacksRecentes ?? [];
  const pendentes = feedbackItems.filter((feedback) => !feedback.revisado).length;
  const ticketItems = ticketsPend?.results ?? ticketsPend ?? [];

  return {
    notificacoesRecentes: notificacoes?.results ?? notificacoes,
    feedbacksRecentes: feedbackItems,
    feedbacksPendentes: pendentes,
    ticketsPendentes: ticketItems.length,
    ticketsAbertosRecentes: ticketItems,
    metricasTickets: resumoTickets,
  };
};

export const listarFeedbacksAdmin = (params = {}) =>
  api.get(`${BASE_URL}/feedbacks-admin/`, { params }).then((response) => response.data);

export const atualizarFeedbackAdmin = (id, payload) =>
  api.patch(`${BASE_URL}/feedbacks-admin/${id}/`, payload).then((response) => response.data);

export default {
  criarSessaoConsulta,
  obterSessao,
  consultarDocumento,
  listarHistoricos,
  listarNotificacoes,
  enviarFeedback,
  criarTicketSuporte,
  listarTickets,
  obterResumoPortalConsumidor,
  listarFeedbacksAdmin,
  atualizarFeedbackAdmin,
  listarTicketsAdmin,
  atualizarTicketAdmin,
};
