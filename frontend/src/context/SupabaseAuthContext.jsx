/**
 * @fileoverview Contexto de Autenticação com Supabase
 * @description Gerencia autenticação usando Supabase Auth
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
    supabase,
    signInWithPassword,
    signUp,
    signOut,
    getSession,
    getCurrentUser,
    getProfile,
    updateProfile as updateProfileApi,
    resetPassword as resetPasswordApi,
    updatePassword as updatePasswordApi,
    onAuthStateChange
} from '../lib/supabase';

// Estados da autenticação
export const AuthState = {
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
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_PROFILE: 'SET_PROFILE'
};

// Estado inicial
const initialState = {
    user: null,
    profile: null,
    session: null,
    role: null,
    status: AuthState.IDLE,
    error: null,
    isLoading: true
};

// Reducer para gerenciar o estado
function authReducer(state, action) {
    switch (action.type) {
        case AuthActions.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                status: action.payload ? AuthState.LOADING : state.status,
                error: null
            };

        case AuthActions.SET_USER:
            return {
                ...state,
                user: action.payload.user,
                session: action.payload.session,
                profile: action.payload.profile || state.profile,
                role: action.payload.role || deriveUserRole(action.payload.profile),
                status: AuthState.AUTHENTICATED,
                error: null,
                isLoading: false
            };

        case AuthActions.SET_PROFILE:
            return {
                ...state,
                profile: action.payload,
                role: deriveUserRole(action.payload)
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
                profile: null,
                session: null,
                role: null,
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

// Função para derivar role do perfil
const deriveUserRole = (profile) => {
    if (!profile) return 'guest';
    if (profile.role) return profile.role;
    return 'user';
};

// Mapeia erros do Supabase para mensagens amigáveis
const getErrorMessage = (error) => {
    const errorMessages = {
        'Invalid login credentials': 'Email ou senha incorretos',
        'Email not confirmed': 'Por favor, confirme seu email antes de fazer login',
        'User already registered': 'Este email já está cadastrado',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'Unable to validate email address: invalid format': 'Formato de email inválido',
        'Signup requires a valid password': 'Informe uma senha válida',
    };

    const message = error?.message || error;
    return errorMessages[message] || message || 'Ocorreu um erro inesperado';
};

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

    // Função para carregar perfil do usuário
    const loadProfile = useCallback(async (userId) => {
        try {
            const profile = await getProfile(userId);
            dispatch({ type: AuthActions.SET_PROFILE, payload: profile });
            return profile;
        } catch (error) {
            console.warn('[Auth] Perfil não encontrado, criando...', error);
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
                // Usuário está no fluxo de recuperação de senha
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
                redirectTo: getRedirectPath(profile)
            };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [loadProfile, getRedirectPath]);

    // Função de registro
    const register = useCallback(async (userData) => {
        try {
            dispatch({ type: AuthActions.SET_LOADING, payload: true });
            dispatch({ type: AuthActions.CLEAR_ERROR });

            const { user, session } = await signUp({
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName || userData.full_name || userData.name,
                phone: userData.phone
            });

            // Se o email não precisa de confirmação, faz login automático
            if (session) {
                const profile = await loadProfile(user.id);

                dispatch({
                    type: AuthActions.SET_USER,
                    payload: { user, session, profile }
                });

                return {
                    success: true,
                    user,
                    needsEmailConfirmation: false,
                    redirectTo: getRedirectPath(profile)
                };
            }

            dispatch({ type: AuthActions.SET_LOADING, payload: false });

            return {
                success: true,
                user,
                needsEmailConfirmation: true,
                message: 'Por favor, verifique seu email para confirmar o cadastro'
            };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [loadProfile, getRedirectPath]);

    // Função de logout
    const logout = useCallback(async () => {
        try {
            await signOut();
            dispatch({ type: AuthActions.LOGOUT });
        } catch (error) {
            console.error('[Auth] Erro no logout:', error);
            // Faz logout local mesmo se falhar no servidor
            dispatch({ type: AuthActions.LOGOUT });
        }
    }, []);

    // Função para atualizar perfil
    const updateProfile = useCallback(async (profileData) => {
        try {
            dispatch({ type: AuthActions.SET_LOADING, payload: true });

            if (!state.user?.id) {
                throw new Error('Usuário não autenticado');
            }

            const updatedProfile = await updateProfileApi(state.user.id, profileData);

            dispatch({ type: AuthActions.SET_PROFILE, payload: updatedProfile });
            dispatch({ type: AuthActions.SET_LOADING, payload: false });

            return { success: true, profile: updatedProfile };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [state.user?.id]);

    // Função para solicitar reset de senha
    const requestPasswordReset = useCallback(async (email) => {
        try {
            dispatch({ type: AuthActions.SET_LOADING, payload: true });

            await resetPasswordApi(email);

            dispatch({ type: AuthActions.SET_LOADING, payload: false });

            return {
                success: true,
                message: 'Se o email existir, você receberá um link para redefinir sua senha'
            };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, []);

    // Função para alterar senha
    const changePassword = useCallback(async (newPassword) => {
        try {
            dispatch({ type: AuthActions.SET_LOADING, payload: true });

            await updatePasswordApi(newPassword);

            dispatch({ type: AuthActions.SET_LOADING, payload: false });

            return { success: true, message: 'Senha alterada com sucesso' };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            dispatch({ type: AuthActions.SET_ERROR, payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, []);

    // Função para limpar erros
    const clearError = useCallback(() => {
        dispatch({ type: AuthActions.CLEAR_ERROR });
    }, []);

    // Verificar se o usuário está autenticado
    const isAuthenticated = state.status === AuthState.AUTHENTICATED;

    // Verificar se é admin
    const isAdmin = state.profile?.role === 'admin';

    // Verificar se é staff
    const isStaff = state.profile?.role === 'staff' || isAdmin;

    // Verificar permissões
    const hasPermission = useCallback((permission) => {
        if (!state.profile) return false;
        if (isAdmin) return true;
        return state.profile.permissions?.includes(permission) || false;
    }, [state.profile, isAdmin]);

    // Verificar se tem um dos roles
    const hasRole = useCallback((roles) => {
        if (!state.profile?.role) return false;
        const rolesToCheck = Array.isArray(roles) ? roles : [roles];
        return rolesToCheck.includes(state.profile.role);
    }, [state.profile?.role]);

    // Criar objeto user enriquecido para compatibilidade com sistema de permissões
    const enrichedUser = state.user ? {
        ...state.user,
        role: state.role,
        profile: state.profile,
        // Campos para compatibilidade com Django Auth
        first_name: state.profile?.full_name?.split(' ')[0] || '',
        last_name: state.profile?.full_name?.split(' ').slice(1).join(' ') || '',
        username: state.user?.email?.split('@')[0] || 'usuario',
        is_superuser: state.role === 'admin',
        is_staff: state.role === 'admin' || state.role === 'staff',
    } : null;

    const value = {
        // Estado
        user: enrichedUser,
        profile: state.profile,
        session: state.session,
        role: state.role,
        status: state.status,
        error: state.error,
        isLoading: state.isLoading,

        // Funções
        login,
        logout,
        register,
        updateProfile,
        requestPasswordReset,
        changePassword,
        clearError,

        // Utilitários
        isAuthenticated,
        isAdmin,
        isStaff,
        hasPermission,
        hasRole,
        getRedirectPath,

        // Cliente Supabase (para uso avançado)
        supabase,

        // Estados
        AuthState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
