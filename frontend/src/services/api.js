import axios from 'axios';
import { getToken } from '../utils/token';

// ✅ CONFIGURAÇÃO PADRONIZADA DE API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'http://localhost:8000');

// Logger condicional para evitar logs em produção
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('- API_BASE_URL:', API_BASE_URL);
  console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Sempre usar /api como prefixo
  timeout: 30000, // ✅ Aumentado para 30 segundos para uploads
});

if (import.meta.env.DEV) {
  // // console.log('- API baseURL configurado:', api.defaults.baseURL);
}

// Interceptor para adicionar o token nas requisições
api.interceptors.request.use(
  (config) => {
    const tokenData = getToken();
    
    // Se tokenData é um objeto, pega o access token
    const token = tokenData?.access || tokenData;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se o erro é 401 e não é uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokenData = getToken();
        const refreshToken = tokenData?.refresh;
        
        if (refreshToken) {
          // Tenta fazer refresh do token
          const refreshUrl = import.meta.env.DEV ? '/auth/token/refresh/' : `${API_BASE_URL}/auth/token/refresh/`;
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          
          if (response.ok) {
            const newTokenData = await response.json();
            
            // Salva o novo token
            const { saveToken } = await import('../utils/token');
            saveToken({ 
              access: newTokenData.access,
              refresh: refreshToken 
            });
            
            // Refaz a requisição original com o novo token
            originalRequest.headers.Authorization = `Bearer ${newTokenData.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
      }
      
      // Se chegou até aqui, o refresh falhou - redireciona para login
      const { removeToken } = await import('../utils/token');
      removeToken();
      
      // Você pode adicionar aqui a lógica para redirecionar para login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;