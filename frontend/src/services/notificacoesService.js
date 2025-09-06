import api from './api';

class NotificacoesService {
  // ===== TIPOS DE NOTIFICAÇÃO =====
  async getTiposNotificacao(params = {}) {
    try {
      const response = await api.get('/notificacoes/tipos/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de notificação:', error);
      throw error;
    }
  }

  // ===== NOTIFICAÇÕES =====
  async getNotificacoes(params = {}) {
    try {
      const response = await api.get('/notificacoes/notificacoes/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  async getNotificacao(id) {
    try {
      const response = await api.get(`/api/notificacoes/notificacoes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificação:', error);
      throw error;
    }
  }

  async createNotificacao(data) {
    try {
      const response = await api.post('/api/notificacoes/notificacoes/', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  async updateNotificacao(id, data) {
    try {
      const response = await api.patch(`/api/notificacoes/notificacoes/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      throw error;
    }
  }

  async deleteNotificacao(id) {
    try {
      await api.delete(`/api/notificacoes/notificacoes/${id}/`);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      throw error;
    }
  }

  async marcarComoLida(id) {
    try {
      const response = await api.post(`/api/notificacoes/notificacoes/${id}/marcar_como_lida/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  async marcarComoEnviada(id) {
    try {
      const response = await api.post(`/api/notificacoes/notificacoes/${id}/marcar_como_enviada/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar notificação como enviada:', error);
      throw error;
    }
  }

  async bulkAction(notificacaoIds, acao) {
    try {
      const response = await api.post('/api/notificacoes/notificacoes/bulk_action/', {
        notificacao_ids: notificacaoIds,
        acao: acao
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao executar ação em lote:', error);
      throw error;
    }
  }

  async getNaoLidas() {
    try {
      const response = await api.get('/api/notificacoes/notificacoes/nao_lidas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      throw error;
    }
  }

  async getContador() {
    try {
      const response = await api.get('/api/notificacoes/notificacoes/contador/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar contador de notificações:', error);
      throw error;
    }
  }

  // ===== PREFERÊNCIAS =====
  async getPreferencias(params = {}) {
    try {
      const response = await api.get('/api/notificacoes/preferencias/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      throw error;
    }
  }

  async getMinhasPreferencias() {
    try {
      const response = await api.get('/api/notificacoes/preferencias/minhas_preferencias/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar minhas preferências:', error);
      throw error;
    }
  }

  async createPreferencia(data) {
    try {
      const response = await api.post('/api/notificacoes/preferencias/', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      throw error;
    }
  }

  async updatePreferencia(id, data) {
    try {
      const response = await api.patch(`/api/notificacoes/preferencias/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      throw error;
    }
  }

  async deletePreferencia(id) {
    try {
      await api.delete(`/api/notificacoes/preferencias/${id}/`);
    } catch (error) {
      console.error('Erro ao deletar preferência:', error);
      throw error;
    }
  }

  // ===== TEMPLATES =====
  async getTemplates(params = {}) {
    try {
      const response = await api.get('/api/notificacoes/templates/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw error;
    }
  }

  async getTemplate(id) {
    try {
      const response = await api.get(`/api/notificacoes/templates/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      throw error;
    }
  }

  // ===== LOGS =====
  async getLogs(params = {}) {
    try {
      const response = await api.get('/api/notificacoes/logs/', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  }

  // ===== DASHBOARD =====
  async getDashboard() {
    try {
      const response = await api.get('/api/notificacoes/dashboard/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      throw error;
    }
  }

  async getEstatisticas() {
    try {
      const response = await api.get('/api/notificacoes/dashboard/estatisticas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  async getNotificacoesVencidas() {
    try {
      const response = await api.get('/api/notificacoes/dashboard/notificacoes_vencidas/');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações vencidas:', error);
      throw error;
    }
  }

  // ===== SERVIÇOS =====
  async enviarNotificacao(data) {
    try {
      const response = await api.post('/api/notificacoes/servicos/enviar_notificacao/', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  async enviarNotificacaoMassa(data) {
    try {
      const response = await api.post('/api/notificacoes/servicos/enviar_notificacao_massa/', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar notificação em massa:', error);
      throw error;
    }
  }

  async agendarNotificacao(data) {
    try {
      const response = await api.post('/api/notificacoes/servicos/agendar_notificacao/', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      throw error;
    }
  }
}

export default new NotificacoesService();
