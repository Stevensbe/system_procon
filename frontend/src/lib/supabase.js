/**
 * @fileoverview Cliente Supabase para autenticação e banco de dados
 * @description Configuração do cliente Supabase com autenticação
 */

import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
}

// Opções do cliente Supabase
const supabaseOptions = {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'procon-supabase-auth',
        flowType: 'pkce',
    },
    global: {
        headers: {
            'X-Client-Info': 'procon-system/1.0.0',
        },
    },
    db: {
        schema: 'public',
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
};

// Cria o cliente Supabase
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    supabaseOptions
);

// =========================================================================
// === FUNÇÕES DE AUTENTICAÇÃO ===
// =========================================================================

/**
 * Registra um novo usuário
 * @param {Object} params - Parâmetros de registro
 * @param {string} params.email - Email do usuário
 * @param {string} params.password - Senha do usuário
 * @param {string} params.fullName - Nome completo do usuário
 * @param {string} params.phone - Telefone do usuário
 * @returns {Promise<Object>} Dados do usuário registrado
 */
export const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
    return data;
};

/**
 * Faz login com email e senha
 * @param {Object} params - Parâmetros de login
 * @param {string} params.email - Email do usuário
 * @param {string} params.password - Senha do usuário
 * @returns {Promise<Object>} Dados da sessão
 */
export const signInWithPassword = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

/**
 * Faz login com OAuth (Google, GitHub, etc.)
 * @param {string} provider - Provedor OAuth ('google', 'github', etc.)
 * @returns {Promise<Object>} Dados da sessão
 */
export const signInWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
    return data;
};

/**
 * Faz login com Magic Link (link por email)
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
export const signInWithMagicLink = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
    return data;
};

/**
 * Faz logout do usuário
 * @returns {Promise<void>}
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

/**
 * Obtém a sessão atual
 * @returns {Promise<Object|null>} Sessão atual ou null
 */
export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

/**
 * Obtém o usuário atual
 * @returns {Promise<Object|null>} Usuário atual ou null
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
};

/**
 * Solicita reset de senha
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
export const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
};

/**
 * Atualiza a senha do usuário
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Dados do usuário atualizado
 */
export const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
    return data;
};

/**
 * Atualiza os dados do usuário
 * @param {Object} userData - Dados a atualizar
 * @returns {Promise<Object>} Dados do usuário atualizado
 */
export const updateUser = async (userData) => {
    const { data, error } = await supabase.auth.updateUser({
        data: userData,
    });

    if (error) throw error;
    return data;
};

// =========================================================================
// === FUNÇÕES DE PERFIL ===
// =========================================================================

/**
 * Obtém o perfil do usuário (cria automaticamente se não existir)
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Perfil do usuário
 */
export const getProfile = async (userId) => {
    // Primeiro tenta buscar o perfil
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();  // Usa maybeSingle para não dar erro se não encontrar

    // Se encontrou, retorna
    if (data) {
        return data;
    }

    // Se não encontrou (e não foi erro de conexão), cria o perfil
    if (error && error.code !== 'PGRST116') {
        console.error('[Supabase] Erro ao buscar perfil:', error);
        throw error;
    }

    // Busca dados do usuário autenticado para criar o perfil
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Usuário não autenticado');
    }

    console.log('[Supabase] Criando perfil automaticamente para:', user.email);

    // Cria o perfil com dados do auth
    const newProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        role: user.app_metadata?.role || user.user_metadata?.role || 'user',
        phone: user.user_metadata?.phone || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

    if (createError) {
        console.error('[Supabase] Erro ao criar perfil:', createError);
        // Retorna perfil básico mesmo com erro para não quebrar a aplicação
        return newProfile;
    }

    console.log('[Supabase] Perfil criado com sucesso:', createdProfile);
    return createdProfile;
};

/**
 * Atualiza o perfil do usuário
 * @param {string} userId - ID do usuário
 * @param {Object} updates - Dados a atualizar
 * @returns {Promise<Object>} Perfil atualizado
 */
export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// =========================================================================
// === LISTENERS DE AUTENTICAÇÃO ===
// =========================================================================

/**
 * Escuta mudanças no estado de autenticação
 * @param {Function} callback - Função de callback
 * @returns {Object} Subscription (para cancelar com .unsubscribe())
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
};

// =========================================================================
// === DEBUG (apenas em desenvolvimento) ===
// =========================================================================

if (import.meta.env.DEV) {
    console.log('🔐 Supabase Client carregado');
    console.log('📍 URL:', supabaseUrl);

    // Expõe para debug
    window.supabase = supabase;
}

export default supabase;
