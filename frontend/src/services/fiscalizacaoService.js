/**
 * Serviço para gerenciar Autos de Constatação no Supabase
 * Integração direta com o banco de dados do Supabase
 */

import { supabase } from '../lib/supabase';
import api from './api';

// =========================================================================
// === UTILITARIOS API DJANGO ===
// =========================================================================

const isFormData = (payload) =>
  typeof FormData !== 'undefined' && payload instanceof FormData;

const requestConfig = (payload) =>
  isFormData(payload) ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

const normalizeListResponse = (data, page = 1) => {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
      current_page: page,
      total_pages: 1,
    };
  }

  if (data && data.results) {
    const pageSize = data.page_size || data.results.length || 1;
    const totalPages =
      data.total_pages || (data.count ? Math.ceil(data.count / pageSize) : undefined);
    return {
      ...data,
      current_page: data.page || data.current_page || page,
      total_pages: totalPages,
    };
  }

  return data;
};

// =========================================================================
// === FUNÇÕES UTILITÁRIAS ===
// =========================================================================

/**
 * Gera um número de auto único
 */
const gerarNumeroAuto = async (tipo) => {
    const ano = new Date().getFullYear();
    const prefixo = tipo.toUpperCase().substring(0, 3);

    // Busca o último número do tipo
    const { data } = await supabase
        .from('autos_constatacao')
        .select('numero')
        .ilike('numero', `${prefixo}%${ano}`)
        .order('created_at', { ascending: false })
        .limit(1);

    let sequencial = 1;
    if (data && data.length > 0) {
        const match = data[0].numero.match(/(\d+)\/\d{4}$/);
        if (match) {
            sequencial = parseInt(match[1]) + 1;
        }
    }

    return `${prefixo}${String(sequencial).padStart(4, '0')}/${ano}`;
};

// =========================================================================
// === CRUD DE AUTOS ===
// =========================================================================

/**
 * Lista todos os autos com filtros
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Array>} Lista de autos
 */
export const listarAutos = async (filtros = {}) => {
    let query = supabase
        .from('autos_constatacao')
        .select(`
      *,
      fiscal_1:profiles!autos_constatacao_fiscal_1_id_fkey(id, email, full_name),
      fiscal_2:profiles!autos_constatacao_fiscal_2_id_fkey(id, email, full_name),
      fotos:autos_fotos(id, url, descricao, tipo)
    `)
        .order('data_fiscalizacao', { ascending: false });

    // Aplicar filtros
    if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
    }
    if (filtros.status) {
        query = query.eq('status', filtros.status);
    }
    if (filtros.fiscal_id) {
        query = query.or(`fiscal_1_id.eq.${filtros.fiscal_id},fiscal_2_id.eq.${filtros.fiscal_id}`);
    }
    if (filtros.dataInicio) {
        query = query.gte('data_fiscalizacao', filtros.dataInicio);
    }
    if (filtros.dataFim) {
        query = query.lte('data_fiscalizacao', filtros.dataFim);
    }
    if (filtros.cnpj) {
        query = query.eq('cnpj', filtros.cnpj);
    }
    if (filtros.municipio) {
        query = query.ilike('municipio', `%${filtros.municipio}%`);
    }
    if (filtros.search) {
        query = query.or(`razao_social.ilike.%${filtros.search}%,numero.ilike.%${filtros.search}%,cnpj.ilike.%${filtros.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Fiscalizacao] Erro ao listar autos:', error);
        throw error;
    }

    return data || [];
};

/**
 * Obtém um auto por ID com dados específicos do tipo
 * @param {string} id - ID do auto
 * @returns {Promise<Object>} Auto completo
 */
export const obterAuto = async (id) => {
    // Busca dados base
    const { data: auto, error } = await supabase
        .from('autos_constatacao')
        .select(`
      *,
      fiscal_1:profiles!autos_constatacao_fiscal_1_id_fkey(id, email, full_name, role),
      fiscal_2:profiles!autos_constatacao_fiscal_2_id_fkey(id, email, full_name, role),
      fotos:autos_fotos(id, url, descricao, tipo, created_at)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    if (!auto) throw new Error('Auto não encontrado');

    // Busca dados específicos do tipo
    const tabela = `autos_${auto.tipo}`;
    const { data: dadosEspecificos } = await supabase
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();

    return {
        ...auto,
        dados_especificos: dadosEspecificos || {},
    };
};

/**
 * Cria um novo auto de constatação
 * @param {Object} dados - Dados do auto
 * @param {string} tipo - Tipo do auto (banco, posto, supermercado, diversos)
 * @returns {Promise<Object>} Auto criado
 */
export const criarAuto = async (dados, tipo) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Gera número único
    const numero = await gerarNumeroAuto(tipo);

    // Dados base do auto
    const autoBase = {
        numero,
        tipo,
        cnpj: dados.cnpj,
        razao_social: dados.razao_social,
        nome_fantasia: dados.nome_fantasia,
        endereco: dados.endereco,
        bairro: dados.bairro,
        municipio: dados.municipio || 'Manaus',
        uf: dados.uf || 'AM',
        cep: dados.cep,
        telefone: dados.telefone,
        email: dados.email,
        data_fiscalizacao: dados.data_fiscalizacao || new Date().toISOString().split('T')[0],
        hora_inicio: dados.hora_inicio,
        hora_fim: dados.hora_fim,
        fiscal_1_id: dados.fiscal_1_id || user?.id,
        fiscal_1_nome: dados.fiscal_1_nome,
        fiscal_1_matricula: dados.fiscal_1_matricula,
        fiscal_2_id: dados.fiscal_2_id,
        fiscal_2_nome: dados.fiscal_2_nome,
        fiscal_2_matricula: dados.fiscal_2_matricula,
        nada_consta: dados.nada_consta || false,
        sem_irregularidades: dados.sem_irregularidades || false,
        cominacao_legal: dados.cominacao_legal,
        observacoes: dados.observacoes,
        prazo_cumprimento_dias: dados.prazo_cumprimento_dias,
        status: 'ABERTO',
        porte: dados.porte,
        assinatura_fiscal_1: dados.assinatura_fiscal_1,
        assinatura_fiscal_2: dados.assinatura_fiscal_2,
        assinatura_responsavel: dados.assinatura_responsavel,
        responsavel_nome: dados.responsavel_nome,
        responsavel_cpf: dados.responsavel_cpf,
        responsavel_cargo: dados.responsavel_cargo,
        uuid_local: dados.uuid_local,
        criado_no_mobile: dados.criado_no_mobile || false,
        created_by_id: user?.id,
    };

    // Insere auto base
    const { data: autoCriado, error: erroAuto } = await supabase
        .from('autos_constatacao')
        .insert(autoBase)
        .select()
        .single();

    if (erroAuto) throw erroAuto;

    // Insere dados específicos do tipo
    const dadosEspecificos = { id: autoCriado.id };

    if (tipo === 'banco') {
        Object.assign(dadosEspecificos, {
            atuacao: dados.atuacao,
            qtd_atendentes_disponiveis: dados.qtd_atendentes_disponiveis,
            qtd_atendentes_ocupados: dados.qtd_atendentes_ocupados,
            qtd_guiches_abertos: dados.qtd_guiches_abertos,
            qtd_guiches_fechados: dados.qtd_guiches_fechados,
            qtd_pessoas_fila: dados.qtd_pessoas_fila,
            tempo_espera_minutos: dados.tempo_espera_minutos,
            relogio_exposto: dados.relogio_exposto,
            painel_informativo: dados.painel_informativo,
            area_acessivel: dados.area_acessivel,
            banheiro_acessivel: dados.banheiro_acessivel,
            tempo_espera_excedido: dados.tempo_espera_excedido,
            falta_acessibilidade: dados.falta_acessibilidade,
            irregularidades: dados.irregularidades || [],
        });
    } else if (tipo === 'posto') {
        Object.assign(dadosEspecificos, {
            preco_gasolina_comum: dados.preco_gasolina_comum,
            preco_gasolina_aditivada: dados.preco_gasolina_aditivada,
            preco_etanol: dados.preco_etanol,
            preco_diesel: dados.preco_diesel,
            preco_diesel_s10: dados.preco_diesel_s10,
            preco_gnv: dados.preco_gnv,
            bandeira: dados.bandeira,
            qtd_bombas: dados.qtd_bombas,
            horario_funcionamento: dados.horario_funcionamento,
            painel_precos_visivel: dados.painel_precos_visivel,
            precos_legivel: dados.precos_legivel,
            alvara_visivel: dados.alvara_visivel,
            preco_abusivo: dados.preco_abusivo,
            painel_irregular: dados.painel_irregular,
            irregularidades: dados.irregularidades || [],
        });
    } else if (tipo === 'supermercado') {
        Object.assign(dadosEspecificos, {
            comercializar_produtos_vencidos: dados.comercializar_produtos_vencidos,
            produtos_sem_preco: dados.produtos_sem_preco,
            divergencia_preco_caixa: dados.divergencia_preco_caixa,
            falta_informacao_produto: dados.falta_informacao_produto,
            produtos_vencidos: dados.produtos_vencidos || [],
            qtd_produtos_vencidos: dados.qtd_produtos_vencidos || 0,
            auto_apreensao: dados.auto_apreensao,
            numero_auto_apreensao: dados.numero_auto_apreensao,
            irregularidades: dados.irregularidades || [],
        });
    } else {
        Object.assign(dadosEspecificos, {
            legislacao_aplicada: dados.legislacao_aplicada,
            artigos_infringidos: dados.artigos_infringidos,
            descricao_irregularidade: dados.descricao_irregularidade,
            dados_extras: dados.dados_extras || {},
        });
    }

    const { error: erroDados } = await supabase
        .from(`autos_${tipo}`)
        .insert(dadosEspecificos);

    if (erroDados) {
        console.error('[Fiscalizacao] Erro ao inserir dados específicos:', erroDados);
    }

    return autoCriado;
};

/**
 * Atualiza um auto existente
 * @param {string} id - ID do auto
 * @param {Object} dados - Dados a atualizar
 * @returns {Promise<Object>} Auto atualizado
 */
export const atualizarAuto = async (id, dados) => {
    const { data: auto, error } = await supabase
        .from('autos_constatacao')
        .update({
            ...dados,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // Se tem dados específicos, atualiza também
    if (dados.dados_especificos && auto.tipo) {
        await supabase
            .from(`autos_${auto.tipo}`)
            .update(dados.dados_especificos)
            .eq('id', id);
    }

    return auto;
};

/**
 * Exclui um auto
 * @param {string} id - ID do auto
 */
export const excluirAuto = async (id) => {
    const { error } = await supabase
        .from('autos_constatacao')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// =========================================================================
// === FOTOS DOS AUTOS ===
// =========================================================================

/**
 * Adiciona foto a um auto
 * @param {string} autoId - ID do auto
 * @param {File} arquivo - Arquivo da foto
 * @param {string} descricao - Descrição da foto
 * @param {string} tipo - Tipo (fachada, irregularidade, etc)
 */
export const adicionarFoto = async (autoId, arquivo, descricao = '', tipo = 'irregularidade') => {
    // Upload para o storage
    const nomeArquivo = `${autoId}/${Date.now()}-${arquivo.name}`;

    const { data: upload, error: erroUpload } = await supabase.storage
        .from('autos-fotos')
        .upload(nomeArquivo, arquivo);

    if (erroUpload) throw erroUpload;

    // Obtém URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('autos-fotos')
        .getPublicUrl(nomeArquivo);

    // Registra no banco
    const { data, error } = await supabase
        .from('autos_fotos')
        .insert({
            auto_id: autoId,
            url: publicUrl,
            descricao,
            tipo,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Remove foto de um auto
 * @param {string} fotoId - ID da foto
 */
export const removerFoto = async (fotoId) => {
    const { error } = await supabase
        .from('autos_fotos')
        .delete()
        .eq('id', fotoId);

    if (error) throw error;
};

// =========================================================================
// === ESTATÍSTICAS ===
// =========================================================================

/**
 * Obtém estatísticas dos autos
 */
export const obterEstatisticas = async (filtros = {}) => {
    const { data, error } = await supabase
        .from('autos_constatacao')
        .select('tipo, status, nada_consta, data_fiscalizacao');

    if (error) throw error;

    const stats = {
        total: data.length,
        por_tipo: {},
        por_status: {},
        com_irregularidades: 0,
        sem_irregularidades: 0,
        por_mes: {},
    };

    data.forEach((auto) => {
        // Por tipo
        stats.por_tipo[auto.tipo] = (stats.por_tipo[auto.tipo] || 0) + 1;

        // Por status
        stats.por_status[auto.status] = (stats.por_status[auto.status] || 0) + 1;

        // Irregularidades
        if (auto.nada_consta) {
            stats.sem_irregularidades++;
        } else {
            stats.com_irregularidades++;
        }

        // Por mês
        if (auto.data_fiscalizacao) {
            const mes = auto.data_fiscalizacao.substring(0, 7);
            stats.por_mes[mes] = (stats.por_mes[mes] || 0) + 1;
        }
    });

    return stats;
};

// =========================================================================
// === API DJANGO (AUTOS DE FISCALIZACAO) ===
// =========================================================================

export const consultarCNPJReceita = async (cnpj) => {
    const response = await api.get('atendimento/api/consultar-cnpj/', {
        params: { cnpj },
    });

    const data = response.data || {};
    if (!data.sucesso) {
        const erro = data.erro || 'Nao foi possivel consultar o CNPJ.';
        throw new Error(erro);
    }
    return data;
};

const listarAutosPorEndpoint = async (endpoint, page = 1, filtros = {}) => {
    const params = { ...(filtros || {}) };
    if (page) {
        params.page = page;
    }
    const response = await api.get(`${endpoint}/`, { params });
    return normalizeListResponse(response.data, page);
};

const criarAutoPorEndpoint = async (endpoint, payload) => {
    const response = await api.post(`${endpoint}/`, payload, requestConfig(payload));
    return response.data;
};

const obterAutoPorEndpoint = async (endpoint, id) => {
    const response = await api.get(`${endpoint}/${id}/`);
    return response.data;
};

const atualizarAutoPorEndpoint = async (endpoint, id, payload) => {
    const response = await api.put(`${endpoint}/${id}/`, payload, requestConfig(payload));
    return response.data;
};

const deletarAutoPorEndpoint = async (endpoint, id) => {
    const response = await api.delete(`${endpoint}/${id}/`);
    return response.data;
};

// === Auto Banco ===
export const listarAutosBanco = (page = 1, filtros = {}) => listarAutosPorEndpoint('bancos', page, filtros);
export const criarAutoBanco = (payload) => criarAutoPorEndpoint('bancos', payload);
export const getAutoBancoById = (id) => obterAutoPorEndpoint('bancos', id);
export const atualizarAutoBanco = (id, payload) => atualizarAutoPorEndpoint('bancos', id, payload);
export const deletarAutoBanco = (id) => deletarAutoPorEndpoint('bancos', id);

// === Auto Posto ===
export const listarAutosPostos = (page = 1, filtros = {}) => listarAutosPorEndpoint('postos', page, filtros);
export const criarAutoPosto = (payload) => criarAutoPorEndpoint('postos', payload);
export const getAutoPostoById = (id) => obterAutoPorEndpoint('postos', id);
export const atualizarAutoPosto = (id, payload) => atualizarAutoPorEndpoint('postos', id, payload);
export const deletarAutoPosto = (id) => deletarAutoPorEndpoint('postos', id);

// === Auto Supermercado ===
export const listarAutosSupermercado = (page = 1, filtros = {}) =>
    listarAutosPorEndpoint('supermercados', page, filtros);
export const criarAutoSupermercado = (payload) => criarAutoPorEndpoint('supermercados', payload);
export const getAutoSupermercadoById = (id) => obterAutoPorEndpoint('supermercados', id);
export const atualizarAutoSupermercado = (id, payload) =>
    atualizarAutoPorEndpoint('supermercados', id, payload);
export const deletarAutoSupermercado = (id) => deletarAutoPorEndpoint('supermercados', id);

// === Auto Diversos ===
export const listarAutosDiversos = (page = 1, filtros = {}) => listarAutosPorEndpoint('diversos', page, filtros);
export const criarAutoDiversos = (payload) => criarAutoPorEndpoint('diversos', payload);
export const getAutoDiversosById = (id) => obterAutoPorEndpoint('diversos', id);
export const atualizarAutoDiversos = (id, payload) => atualizarAutoPorEndpoint('diversos', id, payload);
export const deletarAutoDiversos = (id) => deletarAutoPorEndpoint('diversos', id);

// === Auto de Infracao ===
export const listarAutosInfracao = (page = 1, filtros = {}) => listarAutosPorEndpoint('infracoes', page, filtros);
export const criarAutoInfracao = (payload) => criarAutoPorEndpoint('infracoes', payload);
export const obterAutoInfracao = (id) => obterAutoPorEndpoint('infracoes', id);
export const atualizarAutoInfracao = (id, payload) => atualizarAutoPorEndpoint('infracoes', id, payload);
export const deletarAutoInfracao = (id) => deletarAutoPorEndpoint('infracoes', id);
export const validarAutoInfracaoFormal = async (id, payload) => {
    const response = await api.post(`infracoes/${id}/validacao-formal/`, payload || {});
    return response.data;
};

// Alias para evitar erros em chamadas de debug
export const listarAutosSupermercados = listarAutosSupermercado;

export default {
    listarAutos,
    obterAuto,
    criarAuto,
    atualizarAuto,
    excluirAuto,
    adicionarFoto,
    removerFoto,
    obterEstatisticas,
    consultarCNPJReceita,
    listarAutosBanco,
    criarAutoBanco,
    getAutoBancoById,
    atualizarAutoBanco,
    deletarAutoBanco,
    listarAutosPostos,
    criarAutoPosto,
    getAutoPostoById,
    atualizarAutoPosto,
    deletarAutoPosto,
    listarAutosSupermercado,
    criarAutoSupermercado,
    getAutoSupermercadoById,
    atualizarAutoSupermercado,
    deletarAutoSupermercado,
    listarAutosDiversos,
    criarAutoDiversos,
    getAutoDiversosById,
    atualizarAutoDiversos,
    deletarAutoDiversos,
    listarAutosInfracao,
    criarAutoInfracao,
    obterAutoInfracao,
    atualizarAutoInfracao,
    deletarAutoInfracao,
    validarAutoInfracaoFormal,
    listarAutosSupermercados,
};
