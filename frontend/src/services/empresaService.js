/**
 * Serviço para gerenciar Empresas no Supabase
 * Integração direta com o banco de dados do Supabase
 */

import { supabase } from '../lib/supabase';

// =========================================================================
// === CRUD DE EMPRESAS ===
// =========================================================================

/**
 * Lista empresas com filtros
 */
export const listarEmpresas = async (filtros = {}) => {
    let query = supabase
        .from('empresas')
        .select('*')
        .order('razao_social', { ascending: true });

    // Aplicar filtros
    if (filtros.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
    }
    if (filtros.porte) {
        query = query.eq('porte', filtros.porte);
    }
    if (filtros.municipio) {
        query = query.ilike('municipio', `%${filtros.municipio}%`);
    }
    if (filtros.search) {
        query = query.or(`razao_social.ilike.%${filtros.search}%,nome_fantasia.ilike.%${filtros.search}%,cnpj.ilike.%${filtros.search}%`);
    }
    if (filtros.limit) {
        query = query.limit(filtros.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

/**
 * Busca empresa por CNPJ
 */
export const buscarPorCnpj = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('cnpj', cnpjLimpo)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

/**
 * Obtém empresa por ID
 */
export const obterEmpresa = async (id) => {
    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Cria ou atualiza empresa (upsert por CNPJ)
 */
export const salvarEmpresa = async (dados) => {
    const cnpjLimpo = dados.cnpj?.replace(/\D/g, '');

    const empresa = {
        cnpj: cnpjLimpo,
        razao_social: dados.razao_social,
        nome_fantasia: dados.nome_fantasia,
        endereco: dados.endereco,
        bairro: dados.bairro,
        municipio: dados.municipio || 'Manaus',
        uf: dados.uf || 'AM',
        cep: dados.cep?.replace(/\D/g, ''),
        telefone: dados.telefone,
        email: dados.email,
        porte: dados.porte,
        ramo_atividade: dados.ramo_atividade,
        responsavel_nome: dados.responsavel_nome,
        responsavel_telefone: dados.responsavel_telefone,
        ativo: dados.ativo !== false,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('empresas')
        .upsert(empresa, { onConflict: 'cnpj' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Atualiza empresa
 */
export const atualizarEmpresa = async (id, dados) => {
    const { data, error } = await supabase
        .from('empresas')
        .update({
            ...dados,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Desativa empresa (soft delete)
 */
export const desativarEmpresa = async (id) => {
    const { data, error } = await supabase
        .from('empresas')
        .update({
            ativo: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Reativa empresa
 */
export const reativarEmpresa = async (id) => {
    const { data, error } = await supabase
        .from('empresas')
        .update({
            ativo: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Busca empresas para autocomplete
 */
export const buscarEmpresas = async (termo, limite = 10) => {
    const { data, error } = await supabase
        .from('empresas')
        .select('id, cnpj, razao_social, nome_fantasia')
        .eq('ativo', true)
        .or(`razao_social.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%,cnpj.ilike.%${termo}%`)
        .limit(limite);

    if (error) throw error;
    return data || [];
};

// =========================================================================
// === CONSULTA CNPJ (RECEITA FEDERAL) ===
// =========================================================================

/**
 * Consulta CNPJ na API pública da Receita Federal
 * Usando a API BrasilAPI
 */
export const consultarCnpj = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

        if (!response.ok) {
            throw new Error('CNPJ não encontrado');
        }

        const dados = await response.json();

        return {
            cnpj: dados.cnpj,
            razao_social: dados.razao_social,
            nome_fantasia: dados.nome_fantasia || dados.razao_social,
            endereco: `${dados.logradouro}, ${dados.numero}${dados.complemento ? ' - ' + dados.complemento : ''}`,
            bairro: dados.bairro,
            municipio: dados.municipio,
            uf: dados.uf,
            cep: dados.cep,
            telefone: dados.ddd_telefone_1,
            email: dados.email,
            porte: dados.porte,
            situacao_cadastral: dados.descricao_situacao_cadastral,
            atividade_principal: dados.cnae_fiscal_descricao,
        };
    } catch (error) {
        console.error('[Empresa] Erro ao consultar CNPJ:', error);
        throw error;
    }
};

// =========================================================================
// === ESTATÍSTICAS ===
// =========================================================================

export const obterEstatisticas = async () => {
    const { data, error } = await supabase
        .from('empresas')
        .select('ativo, porte, municipio');

    if (error) throw error;

    const stats = {
        total: data.length,
        ativas: 0,
        inativas: 0,
        por_porte: {},
        por_municipio: {},
    };

    data.forEach((emp) => {
        if (emp.ativo) stats.ativas++;
        else stats.inativas++;

        if (emp.porte) {
            stats.por_porte[emp.porte] = (stats.por_porte[emp.porte] || 0) + 1;
        }
        if (emp.municipio) {
            stats.por_municipio[emp.municipio] = (stats.por_municipio[emp.municipio] || 0) + 1;
        }
    });

    return stats;
};

export default {
    listarEmpresas,
    buscarPorCnpj,
    obterEmpresa,
    salvarEmpresa,
    atualizarEmpresa,
    desativarEmpresa,
    reativarEmpresa,
    buscarEmpresas,
    consultarCnpj,
    obterEstatisticas,
};
