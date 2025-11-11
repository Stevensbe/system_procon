import api from './api';

const BASE_URL = '/atendimento'; // Removido /api duplicado

export const listarBalcoes = async () => {
  const response = await api.get(`${BASE_URL}/balcoes/`);
  return response.data;
};

export const obterStatusFila = async (balcaoId) => {
  const response = await api.get(`${BASE_URL}/balcoes/${balcaoId}/status/`);
  return response.data;
};

export const emitirSenha = async (balcaoId, payload) => {
  const response = await api.post(`${BASE_URL}/balcoes/${balcaoId}/emitir-senha/`, payload);
  return response.data;
};

export const chamarProxima = async (balcaoId) => {
  const response = await api.post(`${BASE_URL}/balcoes/${balcaoId}/chamar-proxima/`);
  return response.data;
};

export const iniciarSenha = async (senhaId) => {
  const response = await api.post(`${BASE_URL}/senhas/${senhaId}/iniciar/`);
  return response.data;
};

export const finalizarSenha = async (senhaId) => {
  const response = await api.post(`${BASE_URL}/senhas/${senhaId}/finalizar/`);
  return response.data;
};

export const cancelarSenha = async (senhaId, motivo = '') => {
  const response = await api.post(`${BASE_URL}/senhas/${senhaId}/cancelar/`, { motivo });
  return response.data;
};

export const pularSenha = async (senhaId, motivo = '') => {
  const response = await api.post(`${BASE_URL}/senhas/${senhaId}/pular/`, { motivo });
  return response.data;
};

export const listarBalcoesAuto = async () => {
  const response = await api.get(`${BASE_URL}/autoatendimento/`);
  return response.data;
};

export const obterBalcaoAuto = async (balcaoId) => {
  const response = await api.get(`${BASE_URL}/autoatendimento/${balcaoId}/`);
  return response.data;
};

export const retirarSenhaAuto = async (balcaoId, payload = {}) => {
  const response = await api.post(`${BASE_URL}/autoatendimento/${balcaoId}/retirar/`, payload);
  return response.data;
};

const atendimentoFilaService = {
  listarBalcoes,
  obterStatusFila,
  emitirSenha,
  chamarProxima,
  iniciarSenha,
  finalizarSenha,
  cancelarSenha,
  pularSenha,
  listarBalcoesAuto,
  obterBalcaoAuto,
  retirarSenhaAuto,
};

export default atendimentoFilaService;
