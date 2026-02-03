/**
 * @fileoverview Serviço de Administração de Usuários
 * @description Gerenciamento de usuários via Supabase
 */

import { supabase } from '../lib/supabase';

// URL base do projeto Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Lista todos os usuários (profiles)
 * @returns {Promise<Array>} Lista de usuários
 */
export const listUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Busca um usuário específico
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Dados do usuário
 */
export const getUser = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Atualiza um perfil de usuário
 * @param {string} userId - ID do usuário
 * @param {Object} updates - Dados a atualizar
 * @returns {Promise<Object>} Perfil atualizado
 */
export const updateUser = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Altera o role de um usuário
 * @param {string} userId - ID do usuário
 * @param {string} role - Novo role (admin, staff, empresa, consumer, user)
 * @returns {Promise<Object>} Perfil atualizado
 */
export const changeUserRole = async (userId, role) => {
    const validRoles = ['admin', 'staff', 'empresa', 'consumer', 'user'];
    if (!validRoles.includes(role)) {
        throw new Error(`Role inválido. Use: ${validRoles.join(', ')}`);
    }

    return updateUser(userId, { role });
};

/**
 * Ativa ou desativa um usuário
 * @param {string} userId - ID do usuário
 * @param {boolean} isActive - Se o usuário está ativo
 * @returns {Promise<Object>} Perfil atualizado
 */
export const toggleUserStatus = async (userId, isActive) => {
    return updateUser(userId, { is_active: isActive });
};

/**
 * Cria um novo usuário (via Edge Function)
 * @param {Object} userData - Dados do novo usuário
 * @returns {Promise<Object>} Usuário criado
 */
export const createUser = async (userData) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
    }

    return result;
};

/**
 * Deleta um usuário (via Edge Function)
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export const deleteUser = async (userId) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar usuário');
    }

    return result;
};

/**
 * Reseta a senha de um usuário
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export const resetUserPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
    return { success: true, message: 'Email de recuperação enviado' };
};

/**
 * Busca estatísticas de usuários
 * @returns {Promise<Object>} Estatísticas
 */
export const getUserStats = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('role, is_active');

    if (error) throw error;

    const stats = {
        total: data.length,
        active: data.filter(u => u.is_active !== false).length,
        inactive: data.filter(u => u.is_active === false).length,
        byRole: {
            admin: data.filter(u => u.role === 'admin').length,
            staff: data.filter(u => u.role === 'staff').length,
            empresa: data.filter(u => u.role === 'empresa').length,
            consumer: data.filter(u => u.role === 'consumer').length,
            user: data.filter(u => u.role === 'user' || !u.role).length,
        }
    };

    return stats;
};

export default {
    listUsers,
    getUser,
    updateUser,
    changeUserRole,
    toggleUserStatus,
    createUser,
    deleteUser,
    resetUserPassword,
    getUserStats
};
