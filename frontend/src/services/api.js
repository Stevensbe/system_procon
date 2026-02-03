import axios from 'axios';
import { getToken, getRefreshToken, isTokenValid } from '../utils/token';

// ✅ CONFIGURAÇÃO PADRONIZADA DE API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'http://localhost:8000');

// Detecta sessao Supabase (evita redirect indevido para /login em 401)
const SUPABASE_STORAGE_KEY = 'procon-supabase-auth';

const getSupabaseAccessToken = () => {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Suporta diferentes formatos do storage do Supabase
    return (
      data?.access_token ||
      data?.currentSession?.access_token ||
      data?.session?.access_token ||
      null
    );
  } catch (error) {
    console.warn('[API] Falha ao ler sessao do Supabase:', error);
    return null;
  }
};

const hasSupabaseSession = () => Boolean(getSupabaseAccessToken());

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
  console.log('- API baseURL configurado:', api.defaults.baseURL);
}

// Interceptor para adicionar o token nas requisições
api.interceptors.request.use(
  (config) => {
    const supabaseToken = getSupabaseAccessToken();
    const token = supabaseToken || getToken();
    
    // Logs de debug em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('[API Request]', {
        url: config.url,
        method: config.method,
        tokenPresent: !!token,
        tokenValid: token ? isTokenValid(token) : false,
        authSource: supabaseToken ? 'supabase' : 'django',
        fullUrl: `${api.defaults.baseURL}${config.url}`
      });
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[API Request] ⚠️ Token não encontrado! A requisição pode falhar com 401.');
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request] Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas e refresh token
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[API Response]', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const supabaseSessionActive = hasSupabaseSession();
    
    // Log detalhado do erro
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // Se o erro é 401 e não é uma tentativa de refresh
    if (error.response?.status === 401 && supabaseSessionActive) {
      console.warn('[API] 401 com sessao Supabase ativa. Pulando refresh Django/redirect.');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('[API] 🔄 Erro 401 detectado, tentando refresh do token...');
      
      try {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          console.error('[API] ❌ Refresh token não encontrado no localStorage');
          throw new Error('Refresh token não disponível');
        }
        
        // Tenta fazer refresh do token diretamente na API
        const refreshUrl = `${API_BASE_URL}/api/auth/token/refresh/`;
        console.log('[API] 🔄 Tentando renovar token em:', refreshUrl);
        
        const response = await axios.post(
          refreshUrl,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.status === 200) {
          const newTokenData = response.data;
          
          if (!newTokenData.access) {
            throw new Error('Novo token de acesso não recebido na resposta');
          }
          
          // Salva o novo token
          const { saveToken } = await import('../utils/token');
          saveToken({
            access: newTokenData.access,
            refresh: newTokenData.refresh || refreshToken
          });
          
          console.log('[API] ✅ Token renovado com sucesso');
          
          // Refaz a requisição original com o novo token
          originalRequest.headers.Authorization = `Bearer ${newTokenData.access}`;
          console.log('[API] 🔄 Refazendo requisição original com novo token');
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] ❌ Erro ao renovar token:', {
          message: refreshError.message,
          response: refreshError.response?.data,
          status: refreshError.response?.status
        });
        
        // Se chegou até aqui, o refresh falhou - limpa tokens e redireciona
        const { removeToken } = await import('../utils/token');
        removeToken();
        
        console.warn('[API] 🚪 Tokens removidos. Redirecionando para login...');
        
        // Redireciona para login se não estiver já na página de login
        if (!supabaseSessionActive && window.location.pathname !== '/login' && window.location.pathname !== '/auth/login') {
          // Usa um pequeno delay para garantir que o erro seja logado
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
