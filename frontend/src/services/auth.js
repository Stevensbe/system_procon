/**
 * @fileoverview Serviço de autenticação CORRIGIDO
 * @description Gerencia login, logout e tokens JWT
 */

// Importa funções corrigidas do token.js
import { 
  getToken,
  getRefreshToken,
  isTokenValid,
  decodeToken,
  removeToken
} from '../utils/token';

// =========================================================================
// === CONFIGURAÇÕES ===
// =========================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// =========================================================================
// === FUNÇÃO CORRIGIDA PARA SALVAR TOKEN ===
// =========================================================================

/**
 * Salva tokens de forma compatível
 */
const saveTokenData = (tokenData) => {
  try {
    if (!tokenData) {
      console.warn('[Auth] Dados de token vazios');
      return;
    }

    // Se é um objeto com access e refresh
    if (typeof tokenData === 'object' && tokenData.access) {
      localStorage.setItem('procon-auth-token', tokenData.access);
      if (tokenData.refresh) {
        localStorage.setItem('procon-refresh-token', tokenData.refresh);
      }
      console.log('[Auth] Tokens salvos com sucesso');
    } 
    // Se é uma string (só access token)
    else if (typeof tokenData === 'string') {
      localStorage.setItem('procon-auth-token', tokenData);
      console.log('[Auth] Token de acesso salvo');
    } 
    else {
      console.error('[Auth] Formato de token inválido:', typeof tokenData);
    }

    // Salva dados do usuário se possível
    if (tokenData.access) {
      const userData = decodeToken(tokenData.access);
      if (userData) {
        localStorage.setItem('procon-user-data', JSON.stringify(userData));
      }
    }

  } catch (error) {
    console.error('[Auth] Erro ao salvar token:', error);
  }
};

// =========================================================================
// === SERVIÇOS DE AUTENTICAÇÃO ===
// =========================================================================

/**
 * Realiza login do usuário
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<Object>} Dados do usuário e tokens
 */
export const loginApi = async (username, password) => {
  try {
    console.log('[Auth] Iniciando login para:', username);

    const response = await fetch(`${API_BASE_URL}/auth/token/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || 
                          data.message || 
                          data.error || 
                          `Erro ${response.status}: ${response.statusText}`;
      
      console.error('[Auth] Erro no login:', errorMessage);
      throw new Error(errorMessage);
    }

    // Valida se os tokens estão presentes
    if (!data.access) {
      throw new Error('Token de acesso não encontrado na resposta');
    }

    // Salva os tokens usando função corrigida
    saveTokenData(data);

    // Decodifica o token para obter dados do usuário
    const userData = decodeToken(data.access);

    console.log('[Auth] Login realizado com sucesso');

    return {
      access: data.access,
      refresh: data.refresh,
      user: userData,
      ...data
    };

  } catch (error) {
    console.error('[Auth] Erro durante login:', error);
    throw error;
  }
};

/**
 * Realiza logout do usuário
 * @param {boolean} callServer - Se deve chamar o servidor para invalidar o token
 * @returns {Promise<void>}
 */
export const logout = async (callServer = true) => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();

    // Chama o servidor para invalidar o token (opcional)
    if (callServer && (token || refreshToken)) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ 
            refresh: refreshToken 
          }),
        });
      } catch (error) {
        console.warn('[Auth] Erro ao invalidar token no servidor:', error);
        // Continua com o logout local mesmo se falhar no servidor
      }
    }

    // Remove tokens localmente
    removeToken();
    
    console.log('[Auth] Logout realizado com sucesso');

  } catch (error) {
    console.error('[Auth] Erro durante logout:', error);
    // Remove tokens localmente mesmo se houver erro
    removeToken();
  }
};

/**
 * Atualiza o token usando refresh token
 * @returns {Promise<string>} Novo token de acesso
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    console.log('[Auth] Atualizando token de acesso...');

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || 'Erro ao atualizar token';
      console.error('[Auth] Erro ao atualizar token:', errorMessage);
      
      // Se o refresh token for inválido, faz logout
      if (response.status === 401) {
        await logout(false); // Não chama servidor para evitar loop
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      throw new Error(errorMessage);
    }

    if (!data.access) {
      throw new Error('Novo token de acesso não encontrado na resposta');
    }

    // Salva o novo token
    saveTokenData(data);

    console.log('[Auth] Token de acesso atualizado com sucesso');

    return data.access;

  } catch (error) {
    console.error('[Auth] Erro ao atualizar token:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} True se autenticado
 */
export const isAuthenticated = () => {
  const token = getToken();
  return token && isTokenValid(token);
};

/**
 * Obtém informações do usuário atual
 * @returns {Object|null} Dados do usuário ou null
 */
export const getCurrentUser = () => {
  const token = getToken();
  if (!token || !isTokenValid(token)) {
    return null;
  }

  return decodeToken(token);
};

/**
 * Verifica se o usuário tem uma permissão específica
 * @param {string} permission - Permissão a verificar
 * @returns {boolean} True se tem a permissão
 */
export const hasPermission = (permission) => {
  const user = getCurrentUser();
  if (!user) return false;

  return user.permissions && user.permissions.includes(permission);
};

/**
 * Verifica se o usuário tem um dos roles
 * @param {string|string[]} roles - Role(s) a verificar
 * @returns {boolean} True se tem pelo menos um role
 */
export const hasRole = (roles) => {
  const user = getCurrentUser();
  if (!user) return false;

  const userRoles = user.roles || [];
  const rolesToCheck = Array.isArray(roles) ? roles : [roles];

  return rolesToCheck.some(role => userRoles.includes(role));
};

/**
 * Valida credenciais sem fazer login
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<boolean>} True se credenciais são válidas
 */
export const validateCredentials = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    return response.ok;

  } catch (error) {
    console.error('[Auth] Erro ao validar credenciais:', error);
    return false;
  }
};

/**
 * Solicita reset de senha
 * @param {string} email - Email para reset
 * @returns {Promise<Object>} Resposta do servidor
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Erro ao solicitar reset de senha');
    }

    return data;

  } catch (error) {
    console.error('[Auth] Erro ao solicitar reset de senha:', error);
    throw error;
  }
};

/**
 * Confirma reset de senha
 * @param {string} token - Token de reset
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Resposta do servidor
 */
export const confirmPasswordReset = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        token, 
        password: newPassword 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Erro ao confirmar reset de senha');
    }

    return data;

  } catch (error) {
    console.error('[Auth] Erro ao confirmar reset de senha:', error);
    throw error;
  }
};

// =========================================================================
// === EXPORTAÇÃO DEFAULT PARA COMPATIBILIDADE ===
// =========================================================================

const authService = {
  loginApi,
  logout,
  refreshAccessToken,
  isAuthenticated,
  getCurrentUser,
  hasPermission,
  hasRole,
  validateCredentials,
  requestPasswordReset,
  confirmPasswordReset
};

export default authService;

// =========================================================================
// === CONFIGURAÇÃO PARA DESENVOLVIMENTO ===
// =========================================================================

if (import.meta.env.DEV) {
  console.log('🔐 Auth Service CORRIGIDO carregado');
  
  // Expõe funções globalmente para debug
  window.authService = authService;
}
