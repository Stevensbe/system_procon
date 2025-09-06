import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getToken, setToken, removeToken, isTokenValid } from '../utils/token';
import authService from '../services/authService';

// Estados da autenticação
const AuthState = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// Ações do reducer
const AuthActions = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Estado inicial
const initialState = {
  user: null,
  token: null,
  status: AuthState.IDLE,
  error: null,
  isLoading: false
};

// Reducer para gerenciar o estado
function authReducer(state, action) {
  switch (action.type) {
    case AuthActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        status: action.payload ? AuthState.LOADING : state.status
      };
    
    case AuthActions.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        status: AuthState.AUTHENTICATED,
        error: null,
        isLoading: false
      };
    
    case AuthActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        status: AuthState.ERROR,
        isLoading: false
      };
    
    case AuthActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        status: AuthState.UNAUTHENTICATED,
        error: null,
        isLoading: false
      };
    
    case AuthActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
}

// Contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Provider do contexto
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token na inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      
      if (token && isTokenValid(token)) {
        try {
          dispatch({ type: AuthActions.SET_LOADING, payload: true });
          
          // Buscar dados do usuário
          const userData = await authService.getProfile();
          
          dispatch({
            type: AuthActions.SET_USER,
            payload: { user: userData, token }
          });
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          removeToken();
          dispatch({ type: AuthActions.LOGOUT });
        }
      } else {
        dispatch({ type: AuthActions.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Função de login
  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActions.SET_LOADING, payload: true });
      dispatch({ type: AuthActions.CLEAR_ERROR });

      const response = await authService.login(credentials);
      const { access, refresh, user } = response;

      // Salvar tokens
      setToken(access, refresh);

      dispatch({
        type: AuthActions.SET_USER,
        payload: { user, token: access }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro no login';
      dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Chamar logout no servidor
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar tokens locais
      removeToken();
      dispatch({ type: AuthActions.LOGOUT });
    }
  };

  // Função de registro
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActions.SET_LOADING, payload: true });
      dispatch({ type: AuthActions.CLEAR_ERROR });

      const response = await authService.register(userData);
      const { access, refresh, user } = response;

      // Salvar tokens
      setToken(access, refresh);

      dispatch({
        type: AuthActions.SET_USER,
        payload: { user, token: access }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro no registro';
      dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AuthActions.SET_LOADING, payload: true });
      dispatch({ type: AuthActions.CLEAR_ERROR });

      const updatedUser = await authService.updateProfile(profileData);

      dispatch({
        type: AuthActions.SET_USER,
        payload: { user: updatedUser, token: state.token }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar perfil';
      dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Função para alterar senha
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: AuthActions.SET_LOADING, payload: true });
      dispatch({ type: AuthActions.CLEAR_ERROR });

      await authService.changePassword(passwordData);

      dispatch({ type: AuthActions.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro ao alterar senha';
      dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Função para limpar erros
  const clearError = () => {
    dispatch({ type: AuthActions.CLEAR_ERROR });
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = state.status === AuthState.AUTHENTICATED;

  // Verificar se é admin
  const isAdmin = state.user?.is_superuser || false;

  // Verificar se é staff
  const isStaff = state.user?.is_staff || false;

  // Verificar permissões
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Admin tem todas as permissões
    if (isAdmin) return true;
    
    // Verificar permissões específicas do usuário
    return state.user.permissions?.includes(permission) || false;
  };

  const value = {
    // Estado
    user: state.user,
    token: state.token,
    status: state.status,
    error: state.error,
    isLoading: state.isLoading,
    
    // Funções
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilitários
    isAuthenticated,
    isAdmin,
    isStaff,
    hasPermission,
    
    // Estados
    AuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
