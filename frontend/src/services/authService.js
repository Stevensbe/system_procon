import { setToken, removeToken, getToken, getRefreshToken } from '../utils/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const buildUrl = (path) => `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

const handleResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // resposta sem corpo
  }

  if (!response.ok) {
    const message =
      (data && (data.detail || data.error)) ||
      (typeof data === 'string' ? data : `Erro ${response.status}: ${response.statusText}`);
    const err = new Error(message || 'Falha na requisição');
    err.response = data;
    err.status = response.status;
    throw err;
  }

  return data;
};

const authorizedFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...JSON_HEADERS,
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  return handleResponse(response);
};

const login = async ({ username, password }) => {
  const response = await fetch(buildUrl('/api/auth/token/'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, password }),
  });

  const data = await handleResponse(response);
  const { access, refresh } = data || {};

  if (!access) {
    throw new Error('Resposta de autenticação inválida: token de acesso ausente.');
  }

  setToken({ access, refresh });

  let user = data?.user;
  if (!user) {
    user = await getProfile();
  }

  if (user) {
    try {
      localStorage.setItem('procon-auth-user', JSON.stringify(user));
    } catch (error) {
      console.warn('[Auth] Não foi possível persistir dados do usuário:', error);
    }
  }

  return {
    access,
    refresh,
    user,
    role: data?.role || user?.role,
    redirectTo: data?.redirect_to || data?.redirectTo || user?.redirect_to,
  };
};

const logout = async () => {
  try {
    const refresh = getRefreshToken();
    await authorizedFetch('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh, refresh_token: refresh }),
    });
  } catch (error) {
    console.warn('[Auth] Falha ao chamar logout na API:', error.message);
  } finally {
    removeToken();
  }
};

const getProfile = async () => {
  return authorizedFetch('/api/auth/profile/', {
    method: 'GET',
  });
};

const updateProfile = async (payload) => {
  return authorizedFetch('/api/auth/profile/update/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

const changePassword = async (payload) => {
  return authorizedFetch('/api/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

const register = async (payload) => {
  const response = await fetch(buildUrl('/api/auth/register/'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const authService = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  register,
};

export default authService;
