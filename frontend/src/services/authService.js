import { saveToken } from '../utils/token'; // Ajuste o caminho se necessário

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const loginApi = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Falha no login.');
  }

  // CORREÇÃO: Passamos o objeto 'data' completo, que contém 'access' e 'refresh'.
  saveToken(data);
  
  return data;
};

export const logout = () => {
  // A função para remover o token precisa existir em token.js
  // removeToken();
  localStorage.removeItem('procon-auth-token'); // Ou removemos diretamente
};

const authService = {
  loginApi,
  logout
};

export default authService;