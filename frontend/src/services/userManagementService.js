/**
 * Serviço para gerenciamento de usuários integrado com Supabase e Django
 */

import api from './api';
import { supabase } from '../lib/supabase';

const USER_MANAGEMENT_BASE = '/ti/supabase';

/**
 * Obtém lista de roles disponíveis
 */
export const getAvailableRoles = async () => {
    try {
        const response = await api.get(`${USER_MANAGEMENT_BASE}/roles/`);
        return response.data;
    } catch (error) {
        console.error('[UserManagement] Erro ao buscar roles:', error);
        throw error;
    }
};

/**
 * Lista todos os usuários do sistema
 */
export const listUsers = async () => {
    try {
        // Primeiro tenta buscar via API Django
        const response = await api.get(`${USER_MANAGEMENT_BASE}/users/`);
        return response.data;
    } catch (error) {
        // Fallback: busca direto do Supabase
        console.warn('[UserManagement] Fallback para Supabase direto:', error);
        const { data, error: sbError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (sbError) throw sbError;
        return data;
    }
};

/**
 * Cria um novo usuário
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.password - Senha do usuário
 * @param {string} userData.full_name - Nome completo
 * @param {string} userData.role - Role/cargo do usuário
 * @param {string} userData.phone - Telefone (opcional)
 */
export const createUser = async (userData) => {
    try {
        // Primeiro tenta via API Django (que usa service key)
        const response = await api.post(`${USER_MANAGEMENT_BASE}/users/create/`, userData);
        return response.data;
    } catch (apiError) {
        console.warn('[UserManagement] API Django falhou, tentando Supabase direto:', apiError);

        // Fallback: criar via Supabase signUp
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name,
                    phone: userData.phone || '',
                    role: userData.role,
                },
            },
        });

        if (error) throw error;

        // Atualiza o perfil com o role
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    role: userData.role,
                    phone: userData.phone || '',
                    is_active: true,
                });

            if (profileError) {
                console.error('[UserManagement] Erro ao criar perfil:', profileError);
            }
        }

        return {
            success: true,
            user: data.user,
            message: 'Usuário criado com sucesso',
        };
    }
};

/**
 * Atualiza o role/cargo de um usuário
 * @param {string} userId - ID do usuário
 * @param {string} newRole - Novo role
 */
export const updateUserRole = async (userId, newRole) => {
    try {
        const response = await api.patch(`${USER_MANAGEMENT_BASE}/users/${userId}/role/`, {
            role: newRole,
        });
        return response.data;
    } catch (apiError) {
        console.warn('[UserManagement] API Django falhou, tentando Supabase direto:', apiError);

        // Fallback: atualizar direto no Supabase
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;

        return {
            success: true,
            user_id: userId,
            role: newRole,
            message: `Role atualizado para ${newRole}`,
        };
    }
};

/**
 * Obtém perfil de um usuário específico
 * @param {string} userId - ID do usuário
 */
export const getUserProfile = async (userId) => {
    try {
        const response = await api.get(`${USER_MANAGEMENT_BASE}/users/${userId}/`);
        return response.data;
    } catch (error) {
        // Fallback: buscar direto do Supabase
        const { data, error: sbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (sbError) throw sbError;
        return data;
    }
};

/**
 * Desativa um usuário (soft delete)
 * @param {string} userId - ID do usuário
 */
export const deactivateUser = async (userId) => {
    try {
        const response = await api.delete(`${USER_MANAGEMENT_BASE}/users/${userId}/delete/`);
        return response.data;
    } catch (error) {
        // Fallback: desativar direto no Supabase
        const { error: sbError } = await supabase
            .from('profiles')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (sbError) throw sbError;
        return { success: true, message: 'Usuário desativado' };
    }
};

/**
 * Reativa um usuário
 * @param {string} userId - ID do usuário
 */
export const reactivateUser = async (userId) => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw error;
    return { success: true, message: 'Usuário reativado' };
};

/**
 * Sincroniza todos os usuários entre Supabase e Django
 */
export const syncAllUsers = async () => {
    try {
        const response = await api.post(`${USER_MANAGEMENT_BASE}/sync/`);
        return response.data;
    } catch (error) {
        console.error('[UserManagement] Erro ao sincronizar:', error);
        throw error;
    }
};

/**
 * Atualiza perfil do usuário atual
 * @param {Object} profileData - Dados do perfil
 */
export const updateCurrentUserProfile = async (profileData) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
        .from('profiles')
        .update({
            ...profileData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

    if (error) throw error;

    return { success: true, message: 'Perfil atualizado' };
};

export default {
    getAvailableRoles,
    listUsers,
    createUser,
    updateUserRole,
    getUserProfile,
    deactivateUser,
    reactivateUser,
    syncAllUsers,
    updateCurrentUserProfile,
};
