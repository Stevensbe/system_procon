/**
 * Contexto de Autenticação usando Supabase
 * Gerencia o estado de autenticação do usuário com Supabase Auth
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { supabase } from '../lib/supabase';
import { 
  signInWithPassword, 
  signOut, 
  getSession, 
  getProfile,
  onAuthStateChange 
} from '../lib/supabase';

const SUPABASE_STORAGE_KEY = 'procon-supabase-auth';

export const AuthState = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
};

const AuthActions = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_PROFILE: 'SET_PROFILE',
};

// Deriva o role do usuário baseado no perfil ou metadados
const deriveUserRole = (profile) => {
  if (!profile) return 'user';
  
  // Prioridade: role do perfil > app_metadata > user_metadata > padrão
  if (profile.role) return profile.role;
  if (profile.app_metadata?.role) return profile.app_metadata.role;
  if (profile.user_metadata?.role) return profile.user_metadata.role;
  
  return 'user';
};

const initialState = {
  user: null,
  profile: null,
  session: null,
  role: null,
  authState: AuthState.IDLE,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case AuthActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        authState: action.payload ? AuthState.LOADING : state.authState,
      };
    case AuthActions.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        profile: action.payload.profile || state.profile,
        role: action.payload.role || deriveUserRole(action.payload.profile),
        authState: action.payload.user ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED,
        loading: false,
        error: null,
      };
    case AuthActions.SET_PROFILE:
      return {
        ...state,
        profile: action.payload,
        role: deriveUserRole(action.payload),
      };
    case AuthActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        authState: AuthState.ERROR,
        loading: false,
      };
    case AuthActions.LOGOUT:
      return {
        ...initialState,
        authState: AuthState.UNAUTHENTICATED,
        loading: false,
      };
    case AuthActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Contexto
const AuthContext = createContext(null);

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

  // Função para carregar perfil do usuário
  const loadProfile = useCallback(async (userId) => {
    try {
      const profile = await getProfile(userId);
      dispatch({ type: AuthActions.SET_PROFILE, payload: profile });
      return profile;
    } catch (error) {
      console.warn('[Auth] Perfil não encontrado, usando dados básicos:', error);
      return null;
    }
  }, []);

  // Função para obter caminho de redirecionamento baseado no role
  const getRedirectPath = useCallback((roleOrProfile) => {
    let role = roleOrProfile;

    if (roleOrProfile && typeof roleOrProfile === 'object') {
      role = deriveUserRole(roleOrProfile);
    }

    switch (role) {
      case 'admin':
      case 'staff':
        return '/dashboard';
      case 'empresa':
        return '/portal-empresa';
      case 'consumer':
        return '/portal-consumidor';
      default:
        return '/dashboard';
    }
  }, []);

  // Efeito para escutar mudanças na autenticação
  useEffect(() => {
    let mounted = true;

    // Verifica sessão inicial
    const initializeAuth = async () => {
      try {
        dispatch({ type: AuthActions.SET_LOADING, payload: true });

        const session = await getSession();

        if (session?.user && mounted) {
          const profile = await loadProfile(session.user.id);

          dispatch({
            type: AuthActions.SET_USER,
            payload: {
              user: session.user,
              session,
              profile,
              role: deriveUserRole(profile)
            }
          });
        } else if (mounted) {
          dispatch({ type: AuthActions.LOGOUT });
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização:', error);
        if (mounted) {
          dispatch({ type: AuthActions.LOGOUT });
        }
      }
    };

    initializeAuth();

    // Escuta mudanças na autenticação
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('[Auth] Evento:', event);

      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id);
        dispatch({
          type: AuthActions.SET_USER,
          payload: {
            user: session.user,
            session,
            profile,
            role: deriveUserRole(profile)
          }
        });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: AuthActions.LOGOUT });
      } else if (event === 'TOKEN_REFRESHED') {
        dispatch({
          type: AuthActions.SET_USER,
          payload: {
            user: session?.user,
            session,
            profile: state.profile
          }
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] Modo de recuperação de senha');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // Função de login
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AuthActions.SET_LOADING, payload: true });
      dispatch({ type: AuthActions.CLEAR_ERROR });

      const { user, session } = await signInWithPassword({
        email: credentials.email || credentials.username,
        password: credentials.password
      });

      const profile = await loadProfile(user.id);

      dispatch({
        type: AuthActions.SET_USER,
        payload: { user, session, profile }
      });

      return {
        success: true,
        user,
        profile,
        redirectPath: getRedirectPath(profile)
      };
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      const errorMessage = error.message || 'Erro ao fazer login';
      dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [loadProfile, getRedirectPath]);

  // Função de logout
  const logout = useCallback(async () => {
    try {
      await signOut();
      dispatch({ type: AuthActions.LOGOUT });
      localStorage.removeItem(SUPABASE_STORAGE_KEY);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Erro no logout:', error);
      // Força logout mesmo com erro
      dispatch({ type: AuthActions.LOGOUT });
      return { success: false, error: error.message };
    }
  }, []);

  // Atualiza perfil
  const updateProfile = useCallback(async (updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: AuthActions.SET_PROFILE, payload: data });
      return { success: true, profile: data };
    } catch (error) {
      console.error('[Auth] Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Limpa erro
  const clearError = useCallback(() => {
    dispatch({ type: AuthActions.CLEAR_ERROR });
  }, []);

  // Verifica se está autenticado
  const isAuthenticated = state.authState === AuthState.AUTHENTICATED && !!state.user;

  // Verifica permissões
  const hasRole = useCallback((role) => {
    if (!state.role) return false;
    if (Array.isArray(role)) {
      return role.includes(state.role);
    }
    return state.role === role;
  }, [state.role]);

  const isAdmin = hasRole(['admin', 'administrador']);
  const isStaff = hasRole(['admin', 'staff', 'gerente', 'diretoria']);

  // Valor do contexto
  const value = {
    // Estado
    user: state.user,
    profile: state.profile,
    session: state.session,
    role: state.role,
    loading: state.loading,
    error: state.error,
    authState: state.authState,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isStaff,
    
    // Métodos
    login,
    logout,
    updateProfile,
    clearError,
    hasRole,
    getRedirectPath,
    loadProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
