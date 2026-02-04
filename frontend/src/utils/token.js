/**
 * @fileoverview Utilitários para gerenciamento de tokens JWT - CORRIGIDO
 * @description Funções para salvar, recuperar e validar tokens de autenticação
 */

// =========================================================================
// === CHAVES DO LOCALSTORAGE (PADRONIZADAS) ===
// =========================================================================

const TOKEN_KEY = 'procon-auth-token';
const REFRESH_TOKEN_KEY = 'procon-refresh-token';
const USER_KEY = 'procon-user-data';

// =========================================================================
// === FUNÇÕES DE GERENCIAMENTO DE TOKEN - CORRIGIDAS ===
// =========================================================================

/**
 * Salva o token de acesso no localStorage
 * ✅ CORRIGIDO: Agora aceita tanto string quanto objeto
 * @param {string|Object} tokenData - Token JWT de acesso ou objeto com tokens
 */
export const saveToken = (tokenData) => {
  if (!tokenData) {
    console.warn('[Token] Tentativa de salvar token vazio');
    return;
  }
  
  try {
    // ✅ CORREÇÃO PRINCIPAL: Trata diferentes formatos de input
    if (typeof tokenData === 'string') {
      // Se é uma string, salva diretamente como access token
      localStorage.setItem(TOKEN_KEY, tokenData);
      console.log('[Token] Token de acesso (string) salvo com sucesso');
    } 
    else if (typeof tokenData === 'object' && tokenData !== null) {
      // Se é um objeto, extrai access e refresh tokens
      if (tokenData.access) {
        localStorage.setItem(TOKEN_KEY, tokenData.access);
        console.log('[Token] Token de acesso (objeto) salvo com sucesso');
      }
      
      if (tokenData.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh);
        console.log('[Token] Refresh token salvo com sucesso');
      }
      
      // ✅ CORREÇÃO: Salva dados do usuário de forma segura
      if (tokenData.access) {
        const userData = decodeToken(tokenData.access);
        if (userData) {
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          console.log('[Token] Dados do usuário salvos com sucesso');
        }
      }
    } 
    else {
      console.error('[Token] Formato de token inválido:', typeof tokenData);
      throw new Error('Formato de token inválido');
    }
    
  } catch (error) {
    console.error('[Token] Erro ao salvar token:', error);
    throw error; // Re-lança o erro para que seja tratado pelo chamador
  }
};

/**
 * Recupera o token de acesso do localStorage
 * ✅ CORRIGIDO: Melhor tratamento de erros
 * @returns {string|null} Token JWT ou null se não existir
 */
export const getToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('[Token] Erro ao recuperar token:', error);
    return null;
  }
};

/**
 * Alias para saveToken para compatibilidade
 * @param {string|Object} tokenData - Token a ser salvo
 */
export const setToken = saveToken;

/**
 * Salva o refresh token no localStorage
 * @param {string} refreshToken - Refresh token
 */
export const saveRefreshToken = (refreshToken) => {
  if (!refreshToken) {
    console.warn('[Token] Tentativa de salvar refresh token vazio');
    return;
  }
  
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('[Token] Refresh token salvo com sucesso');
  } catch (error) {
    console.error('[Token] Erro ao salvar refresh token:', error);
    throw error;
  }
};

/**
 * Recupera o refresh token do localStorage
 * @returns {string|null} Refresh token ou null
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[Token] Erro ao recuperar refresh token:', error);
    return null;
  }
};

/**
 * Salva dados do usuário no localStorage
 * ✅ CORRIGIDO: Validação melhorada
 * @param {Object} userData - Dados do usuário
 */
export const saveUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    console.warn('[Token] Tentativa de salvar dados de usuário inválidos');
    return;
  }
  
  try {
    const jsonString = JSON.stringify(userData);
    localStorage.setItem(USER_KEY, jsonString);
    console.log('[Token] Dados do usuário salvos com sucesso');
  } catch (error) {
    console.error('[Token] Erro ao salvar dados do usuário:', error);
    throw error;
  }
};

/**
 * Recupera dados do usuário do localStorage
 * ✅ CORRIGIDO: Melhor tratamento de parse errors
 * @returns {Object|null} Dados do usuário ou null
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    // ✅ CORREÇÃO: Verifica se é JSON válido antes do parse
    try {
      return JSON.parse(userData);
    } catch (parseError) {
      console.error('[Token] Dados do usuário não são JSON válido:', parseError);
      // Remove dados corrompidos
      localStorage.removeItem(USER_KEY);
      return null;
    }
  } catch (error) {
    console.error('[Token] Erro ao recuperar dados do usuário:', error);
    return null;
  }
};

/**
 * Remove todos os dados de autenticação do localStorage
 * ✅ CORRIGIDO: Mais robusto
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('[Token] Todos os tokens removidos');
  } catch (error) {
    console.error('[Token] Erro ao remover tokens:', error);
    // Mesmo com erro, tenta remover individualmente
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  }
};

// =========================================================================
// === FUNÇÕES DE VALIDAÇÃO E DECODIFICAÇÃO - MELHORADAS ===
// =========================================================================

/**
 * Decodifica o payload do token JWT
 * ✅ CORRIGIDO: Melhor tratamento de erros
 * @param {string} token - Token JWT
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  try {
    // Um JWT tem 3 partes separadas por pontos: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.warn('[Token] Token JWT inválido: não tem 3 partes');
      return null;
    }
    
    // O payload é a segunda parte (índice 1)
    const payload = parts[1];
    
    // Decodifica de base64URL para base64 padrão
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Adiciona padding se necessário
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // ✅ CORREÇÃO: Melhor tratamento de decode e parse
    let decoded;
    try {
      decoded = atob(padded);
    } catch (decodeError) {
      console.error('[Token] Erro ao decodificar base64:', decodeError);
      return null;
    }
    
    let parsed;
    try {
      parsed = JSON.parse(decoded);
    } catch (parseError) {
      console.error('[Token] Erro ao fazer parse do JSON do token:', parseError);
      return null;
    }
    
    return parsed;
    
  } catch (error) {
    console.error('[Token] Erro geral ao decodificar token:', error);
    return null;
  }
};

/**
 * Verifica se o token é válido e não expirou
 * ✅ CORRIGIDO: Mais robusto
 * @param {string} token - Token JWT
 * @returns {boolean} True se válido, false caso contrário
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const payload = decodeToken(token);
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  // Verifica se o token tem data de expiração
  if (!payload.exp || typeof payload.exp !== 'number') {
    console.warn('[Token] Token sem data de expiração válida');
    return false;
  }
  
  // Verifica se não expirou (exp está em segundos, Date.now() em milissegundos)
  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp <= now;
  
  if (isExpired) {
    console.log('[Token] Token expirado');
    // Em desenvolvimento, permite uma pequena margem para tokens expirados recentemente
    // Isso evita redirecionamentos desnecessários quando há refresh token disponível
    if (import.meta.env?.DEV) {
      const expirationBuffer = 60; // 60 segundos de buffer
      const isRecentlyExpired = (now - payload.exp) <= expirationBuffer;
      if (isRecentlyExpired) {
        console.log('[Token] Token recentemente expirado, mas dentro do buffer de desenvolvimento');
        return true;
      }
    }
    return false;
  }
  
  return true;
};

// =========================================================================
// === FUNÇÕES UTILITÁRIAS - MANTIDAS ===
// =========================================================================

/**
 * Verifica se o usuário está logado
 * @returns {boolean} True se logado
 */
export const isAuthenticated = () => {
  const token = getToken();
  return token && isTokenValid(token);
};

/**
 * Limpa todos os dados de autenticação
 */
export const logout = () => {
  removeToken();
  console.log('[Token] Logout realizado localmente');
};

/**
 * Obtém informações do usuário a partir do token
 * @param {string} token - Token JWT
 * @returns {Object|null} Informações do usuário ou null
 */
export const getUserFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return {
    id: payload.sub || payload.user_id || payload.id,
    username: payload.username || payload.preferred_username,
    email: payload.email,
    name: payload.name || payload.full_name,
    firstName: payload.given_name || payload.first_name,
    lastName: payload.family_name || payload.last_name,
    permissions: payload.permissions || payload.scopes || [],
    roles: payload.roles || payload.groups || [],
    isAdmin: payload.is_admin || payload.is_superuser || false,
    isStaff: payload.is_staff || false,
    isActive: payload.is_active !== false,
    exp: payload.exp,
    iat: payload.iat,
    iss: payload.iss,
    aud: payload.aud
  };
};

// =========================================================================
// === CONFIGURAÇÃO PARA DESENVOLVIMENTO ===
// =========================================================================

if (import.meta.env?.DEV) {
  console.log('🔧 Token Utils CORRIGIDO carregado em modo desenvolvimento');
  
  // Expõe funções globalmente para debug
  window.tokenUtils = {
    getToken,
    saveToken,
    decodeToken,
    isTokenValid,
    getUserFromToken,
    isAuthenticated,
    removeToken
  };
}
