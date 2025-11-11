import api from './api';

const BASE_URL = '/ti';

export const tiService = {
  // Usuários
  async listarUsuarios() {
    const response = await api.get(`${BASE_URL}/usuarios/`);
    return response.data;
  },

  async criarUsuario(usuarioData) {
    const response = await api.post(`${BASE_URL}/usuarios/`, usuarioData);
    return response.data;
  },

  async atualizarUsuario(id, usuarioData) {
    const response = await api.put(`${BASE_URL}/usuarios/${id}/`, usuarioData);
    return response.data;
  },

  async excluirUsuario(id) {
    const response = await api.delete(`${BASE_URL}/usuarios/${id}/`);
    return response.data;
  },

  // Módulos
  async listarModulos() {
    const response = await api.get(`${BASE_URL}/usuarios/modulos/`);
    return response.data;
  },

  // Cargos
  async listarCargos() {
    const response = await api.get(`${BASE_URL}/usuarios/cargos/`);
    return response.data;
  },

  // Validações
  async validarCPF(cpf) {
    // Validação local + verificação se já existe no sistema
    const usuarios = await this.listarUsuarios();
    const cpfExists = usuarios.some(user => user.cpf === cpf);
    return {
      isValid: true, // Validação de formato já feita no frontend
      exists: cpfExists
    };
  },

  async validarMatricula(matricula) {
    const usuarios = await this.listarUsuarios();
    const matriculaExists = usuarios.some(user => user.matricula === matricula);
    return {
      isValid: true,
      exists: matriculaExists
    };
  }
};
