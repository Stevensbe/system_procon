
// Correção para frontend/src/services/auth.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const loginApi = async (username, password) => {
  try {
    console.log('[Auth] Tentando login em:', `${API_BASE_URL}/auth/token/`);
    
    const response = await fetch(`${API_BASE_URL}/auth/token/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Auth] Resposta não é JSON:', text);
      throw new Error(`Servidor retornou ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || 
                          data.message || 
                          data.error || 
                          `Erro ${response.status}: ${response.statusText}`;
      
      console.error('[Auth] Erro no login:', errorMessage);
      throw new Error(errorMessage);
    }

    // Salvar tokens
    if (data.access) {
      localStorage.setItem('procon-auth-token', data.access);
    }
    if (data.refresh) {
      localStorage.setItem('procon-refresh-token', data.refresh);
    }
    
    return data;

  } catch (error) {
    console.error('[Auth] Erro durante login:', error);
    throw error;
  }
};
