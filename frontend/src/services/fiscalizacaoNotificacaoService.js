import api from './api';

const BASE_URL = '/notificacoes-eletronicas/';

const listNotificacoes = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

const createNotificacao = async (payload) => {
  const response = await api.post(BASE_URL, payload);
  return response.data;
};

const enviarNotificacao = async (id) => {
  const response = await api.post(`${BASE_URL}${id}/enviar/`);
  return response.data;
};

const updateNotificacao = async (id, payload) => {
  const response = await api.patch(`${BASE_URL}${id}/`, payload);
  return response.data;
};

const deleteNotificacao = async (id) => {
  const response = await api.delete(`${BASE_URL}${id}/`);
  return response.data;
};

export default {
  listNotificacoes,
  createNotificacao,
  enviarNotificacao,
  updateNotificacao,
  deleteNotificacao,
};
