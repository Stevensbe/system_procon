/**
 * Serviço para gerenciar Caixa de Entrada no Supabase
 * Integração direta com o banco de dados do Supabase
 */

import { supabase } from '../lib/supabase';

// =========================================================================
// === FUNÇÕES UTILITÁRIAS ===
// =========================================================================

/**
 * Gera um número de protocolo único
 */
const gerarNumeroProtocolo = async () => {
  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');

  const { data } = await supabase
    .from('caixa_entrada')
    .select('numero_protocolo')
    .ilike('numero_protocolo', `PROT${ano}${mes}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let sequencial = 1;
  if (data && data.length > 0 && data[0].numero_protocolo) {
    const match = data[0].numero_protocolo.match(/(\d+)$/);
    if (match) {
      sequencial = parseInt(match[1]) + 1;
    }
  }

  return `PROT${ano}${mes}${String(sequencial).padStart(5, '0')}`;
};

// =========================================================================
// === CONSTANTES ===
// =========================================================================

export const TIPO_DOCUMENTO = {
  PETICAO: 'PETICAO',
  RECURSO: 'RECURSO',
  DENUNCIA: 'DENUNCIA',
  OFICIO: 'OFICIO',
  INTIMACAO: 'INTIMACAO',
  RESPOSTA_EMPRESA: 'RESPOSTA_EMPRESA',
  NOTIFICACAO_DTE: 'NOTIFICACAO_DTE',
  DOCUMENTO_INTERNO: 'INTERNO',
  OUTROS: 'OUTROS',
};

export const STATUS = {
  NAO_LIDO: 'NAO_LIDO',
  LIDO: 'LIDO',
  EM_ANALISE: 'EM_ANALISE',
  RESPONDIDO: 'RESPONDIDO',
  ENCAMINHADO: 'ENCAMINHADO',
  ARQUIVADO: 'ARQUIVADO',
  CONCLUIDO: 'CONCLUIDO',
};

export const PRIORIDADE = {
  BAIXA: 'BAIXA',
  NORMAL: 'NORMAL',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE',
};

// =========================================================================
// === QUERY BASE ===
// =========================================================================

const buildBaseQuery = () => {
  return supabase
    .from('caixa_entrada')
    .select(`
      *,
      responsavel:profiles!caixa_entrada_responsavel_atual_id_fkey(id, email, full_name),
      destinatario:profiles!caixa_entrada_destinatario_direto_id_fkey(id, email, full_name),
      empresa:empresas!caixa_entrada_empresa_id_fkey(id, razao_social, cnpj),
      anexos:anexos_caixa_entrada(id, arquivo_nome, tipo_arquivo)
    `)
    .order('data_entrada', { ascending: false });
};

const applyFilters = (query, filtros) => {
  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }
  if (filtros.tipo_documento) {
    query = query.eq('tipo_documento', filtros.tipo_documento);
  }
  if (filtros.prioridade) {
    query = query.eq('prioridade', filtros.prioridade);
  }
  if (filtros.setor_destino || filtros.setor) {
    query = query.eq('setor_destino', filtros.setor_destino || filtros.setor);
  }
  if (filtros.responsavel_id) {
    query = query.eq('responsavel_atual_id', filtros.responsavel_id);
  }
  if (filtros.bloqueado !== undefined) {
    query = query.eq('bloqueado', filtros.bloqueado);
  }
  if (filtros.dataInicio) {
    query = query.gte('data_entrada', filtros.dataInicio);
  }
  if (filtros.dataFim) {
    query = query.lte('data_entrada', filtros.dataFim);
  }
  if (filtros.search || filtros.busca) {
    const termo = filtros.search || filtros.busca;
    query = query.or(`assunto.ilike.%${termo}%,numero_protocolo.ilike.%${termo}%,remetente_nome.ilike.%${termo}%`);
  }
  if (filtros.apenas_nao_lidos) {
    query = query.eq('status', 'NAO_LIDO');
  }
  if (filtros.notificado_dte !== undefined) {
    query = query.eq('notificado_dte', filtros.notificado_dte);
  }
  if (filtros.limit) {
    query = query.limit(filtros.limit);
  }
  return query;
};

// =========================================================================
// === CRUD DA CAIXA DE ENTRADA ===
// =========================================================================

/**
 * Lista documentos da caixa de entrada
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Array>} Lista de documentos
 */
export const listarDocumentos = async (filtros = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  let query = buildBaseQuery();

  // Filtrar por setor do usuário (exceto admin)
  if (profile?.role && profile.role !== 'admin') {
    query = query.or(`setor_destino.eq.${profile.role},destinatario_direto_id.eq.${user?.id},responsavel_atual_id.eq.${user?.id}`);
  }

  query = applyFilters(query, filtros);

  const { data, error } = await query;

  if (error) {
    console.error('[CaixaEntrada] Erro ao listar:', error);
    throw error;
  }

  return data || [];
};

/**
 * Lista documentos da caixa pessoal do usuário logado
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Array>} Lista de documentos pessoais
 */
export const getDocumentosPessoal = async (filtros = {}) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[CaixaEntrada] Usuário não autenticado');
    return [];
  }

  let query = buildBaseQuery();

  // Documentos destinados diretamente ao usuário ou onde ele é responsável
  query = query.or(`destinatario_direto_id.eq.${user.id},responsavel_atual_id.eq.${user.id}`);

  query = applyFilters(query, filtros);

  const { data, error } = await query;

  if (error) {
    console.error('[CaixaEntrada] Erro ao listar documentos pessoais:', error);
    throw error;
  }

  return data || [];
};

/**
 * Lista documentos da caixa do setor
 * @param {Object} filtros - Filtros de busca
 * @returns {Promise<Array>} Lista de documentos do setor
 */
export const getDocumentosSetor = async (filtros = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  let query = buildBaseQuery();

  // Se admin, vê todos. Senão, filtra por setor
  if (profile?.role && profile.role !== 'admin') {
    query = query.eq('setor_destino', profile.role);
  }

  query = applyFilters(query, filtros);

  const { data, error } = await query;

  if (error) {
    console.error('[CaixaEntrada] Erro ao listar documentos do setor:', error);
    throw error;
  }

  return data || [];
};

/**
 * Obtém um documento por ID
 * @param {string} id - ID do documento
 * @returns {Promise<Object>} Documento
 */
export const obterDocumento = async (id) => {
  const { data, error } = await supabase
    .from('caixa_entrada')
    .select(`
      *,
      responsavel:profiles!caixa_entrada_responsavel_atual_id_fkey(id, email, full_name, role),
      destinatario:profiles!caixa_entrada_destinatario_direto_id_fkey(id, email, full_name),
      lido_por:profiles!caixa_entrada_lido_por_id_fkey(id, email, full_name),
      bloqueado_por:profiles!caixa_entrada_bloqueado_por_id_fkey(id, email, full_name),
      empresa:empresas!caixa_entrada_empresa_id_fkey(*),
      anexos:anexos_caixa_entrada(*),
      historico:historico_caixa_entrada(*, usuario:profiles(id, email, full_name))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Visualiza documento (marca como visualizado e retorna os dados)
 * @param {string} id - ID do documento
 * @returns {Promise<Object>} Documento
 */
export const visualizarDocumento = async (id) => {
  // Primeiro marca como lido se necessário
  await marcarComoLido(id);

  // Retorna o documento completo
  return obterDocumento(id);
};

/**
 * Cria um novo documento na caixa de entrada
 * @param {Object} dados - Dados do documento
 * @returns {Promise<Object>} Documento criado
 */
export const criarDocumento = async (dados) => {
  const { data: { user } } = await supabase.auth.getUser();

  const numero_protocolo = await gerarNumeroProtocolo();

  const documento = {
    numero_protocolo,
    tipo_documento: dados.tipo_documento || 'OUTROS',
    assunto: dados.assunto,
    conteudo: dados.conteudo,
    remetente_nome: dados.remetente_nome,
    remetente_documento: dados.remetente_documento,
    remetente_email: dados.remetente_email,
    remetente_telefone: dados.remetente_telefone,
    empresa_id: dados.empresa_id,
    empresa_cnpj: dados.empresa_cnpj,
    empresa_nome: dados.empresa_nome,
    status: 'NAO_LIDO',
    prioridade: dados.prioridade || 'NORMAL',
    setor_destino: dados.setor_destino,
    setor_lotacao: dados.setor_lotacao,
    destinatario_direto_id: dados.destinatario_direto_id,
    responsavel_atual_id: dados.responsavel_atual_id,
    prazo_resposta: dados.prazo_resposta,
    observacoes: dados.observacoes,
    created_by_id: user?.id,
  };

  const { data, error } = await supabase
    .from('caixa_entrada')
    .insert(documento)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(data.id, 'CRIADO', 'Documento criado');

  return data;
};

/**
 * Atualiza um documento
 * @param {string} id - ID do documento
 * @param {Object} dados - Dados a atualizar
 * @returns {Promise<Object>} Documento atualizado
 */
export const atualizarDocumento = async (id, dados) => {
  const { data, error } = await supabase
    .from('caixa_entrada')
    .update({
      ...dados,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await registrarHistorico(id, 'ATUALIZADO', 'Documento atualizado');

  return data;
};

/**
 * Marca documento como lido
 * @param {string} id - ID do documento
 */
export const marcarComoLido = async (id) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('caixa_entrada')
    .update({
      status: 'LIDO',
      data_leitura: new Date().toISOString(),
      lido_por_id: user?.id,
    })
    .eq('id', id)
    .eq('status', 'NAO_LIDO') // Só atualiza se ainda não foi lido
    .select()
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (data) {
    await registrarHistorico(id, 'LIDO', 'Documento lido');
  }

  return data;
};

/**
 * Encaminha documento para outro setor/usuário
 * @param {string} id - ID do documento
 * @param {Object} dados - Dados do encaminhamento
 */
export const encaminharDocumento = async (id, dados) => {
  const updateData = {
    status: 'ENCAMINHADO',
    updated_at: new Date().toISOString(),
  };

  if (dados.setor_destino) {
    updateData.setor_destino = dados.setor_destino;
  }
  if (dados.responsavel_id || dados.destinatario_direto) {
    updateData.responsavel_atual_id = dados.responsavel_id || dados.destinatario_direto;
  }
  if (dados.observacoes) {
    updateData.observacoes = dados.observacoes;
  }

  const { data, error } = await supabase
    .from('caixa_entrada')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await registrarHistorico(
    id,
    'ENCAMINHADO',
    `Encaminhado para ${dados.setor_destino || 'usuário'}`,
    { setor: dados.setor_destino, responsavel_id: dados.responsavel_id }
  );

  return data;
};

/**
 * Bloqueia documento
 * @param {string} id - ID do documento
 * @param {Object} dados - Dados opcionais (motivo, etc)
 */
export const bloquearDocumento = async (id, dados = {}) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('caixa_entrada')
    .update({
      bloqueado: true,
      bloqueado_por_id: user?.id,
      bloqueado_em: new Date().toISOString(),
      observacoes: dados.motivo || dados.observacoes || undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await registrarHistorico(id, 'BLOQUEADO', dados.motivo || 'Documento bloqueado');

  return data;
};

/**
 * Desbloqueia documento
 * @param {string} id - ID do documento
 */
export const desbloquearDocumento = async (id) => {
  const { data, error } = await supabase
    .from('caixa_entrada')
    .update({
      bloqueado: false,
      bloqueado_por_id: null,
      bloqueado_em: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await registrarHistorico(id, 'DESBLOQUEADO', 'Documento desbloqueado');

  return data;
};

/**
 * Bloqueia/desbloqueia documento (toggle)
 * @param {string} id - ID do documento
 * @param {boolean} bloquear - true para bloquear, false para desbloquear
 */
export const toggleBloqueio = async (id, bloquear) => {
  if (bloquear) {
    return bloquearDocumento(id);
  } else {
    return desbloquearDocumento(id);
  }
};

/**
 * Arquiva documento
 * @param {string} id - ID do documento
 */
export const arquivarDocumento = async (id) => {
  const { data, error } = await supabase
    .from('caixa_entrada')
    .update({
      status: 'ARQUIVADO',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await registrarHistorico(id, 'ARQUIVADO', 'Documento arquivado');

  return data;
};

// =========================================================================
// === ANEXOS ===
// =========================================================================

/**
 * Adiciona anexo a um documento
 */
export const adicionarAnexo = async (documentoId, arquivo, descricao = '') => {
  const { data: { user } } = await supabase.auth.getUser();

  // Upload para o storage
  const nomeArquivo = `${documentoId}/${Date.now()}-${arquivo.name}`;

  const { error: erroUpload } = await supabase.storage
    .from('caixa-entrada-anexos')
    .upload(nomeArquivo, arquivo);

  if (erroUpload) throw erroUpload;

  const { data: { publicUrl } } = supabase.storage
    .from('caixa-entrada-anexos')
    .getPublicUrl(nomeArquivo);

  const { data, error } = await supabase
    .from('anexos_caixa_entrada')
    .insert({
      documento_id: documentoId,
      arquivo_url: publicUrl,
      arquivo_nome: arquivo.name,
      tipo_arquivo: arquivo.type,
      tamanho_bytes: arquivo.size,
      descricao,
      upload_por_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Remove anexo
 */
export const removerAnexo = async (anexoId) => {
  const { error } = await supabase
    .from('anexos_caixa_entrada')
    .delete()
    .eq('id', anexoId);

  if (error) throw error;
};

// =========================================================================
// === HISTÓRICO ===
// =========================================================================

/**
 * Registra ação no histórico
 */
const registrarHistorico = async (documentoId, acao, detalhes, dadosNovos = {}) => {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from('historico_caixa_entrada')
    .insert({
      documento_id: documentoId,
      acao,
      usuario_id: user?.id,
      detalhes,
      dados_novos: dadosNovos,
    });
};

/**
 * Obtém histórico de um documento
 */
export const obterHistorico = async (documentoId) => {
  const { data, error } = await supabase
    .from('historico_caixa_entrada')
    .select(`
      *,
      usuario:profiles(id, email, full_name)
    `)
    .eq('documento_id', documentoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// =========================================================================
// === ESTATÍSTICAS ===
// =========================================================================

/**
 * Obtém estatísticas da caixa de entrada
 * @param {Object} filtros - Filtros opcionais
 */
export const obterEstatisticas = async (filtros = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  let query = supabase
    .from('caixa_entrada')
    .select('status, prioridade, tipo_documento, setor_destino, data_entrada, prazo_resposta, destinatario_direto_id, responsavel_atual_id');

  // Aplicar filtros de acesso
  if (filtros.destinatario_direto === 'me' || filtros.apenas_pessoal) {
    query = query.or(`destinatario_direto_id.eq.${user?.id},responsavel_atual_id.eq.${user?.id}`);
  } else if (profile?.role && profile.role !== 'admin') {
    query = query.or(`setor_destino.eq.${profile.role},destinatario_direto_id.eq.${user?.id},responsavel_atual_id.eq.${user?.id}`);
  }

  if (filtros.notificado_dte !== undefined) {
    query = query.eq('notificado_dte', filtros.notificado_dte);
  }

  const { data, error } = await query;

  if (error) throw error;

  const hoje = new Date();
  const stats = {
    total: data?.length || 0,
    nao_lidos: 0,
    urgentes: 0,
    atrasados: 0,
    por_status: {},
    por_tipo: {},
    por_setor: [],
  };

  const setorCount = {};

  (data || []).forEach((doc) => {
    // Contadores
    if (doc.status === 'NAO_LIDO') stats.nao_lidos++;
    if (doc.prioridade === 'URGENTE' || doc.prioridade === 'ALTA') stats.urgentes++;
    if (doc.prazo_resposta && new Date(doc.prazo_resposta) < hoje && doc.status !== 'ARQUIVADO') {
      stats.atrasados++;
    }

    // Por status
    stats.por_status[doc.status] = (stats.por_status[doc.status] || 0) + 1;

    // Por tipo
    stats.por_tipo[doc.tipo_documento] = (stats.por_tipo[doc.tipo_documento] || 0) + 1;

    // Por setor
    if (doc.setor_destino) {
      setorCount[doc.setor_destino] = (setorCount[doc.setor_destino] || 0) + 1;
    }
  });

  // Converte setorCount para array
  stats.por_setor = Object.entries(setorCount).map(([setor, total]) => ({
    setor_destino: setor,
    setor: setor,
    total,
  }));

  return stats;
};

/**
 * Alias para compatibilidade
 */
export const getEstatisticas = obterEstatisticas;

// =========================================================================
// === EXPORTAÇÕES ===
// =========================================================================

export default {
  TIPO_DOCUMENTO,
  STATUS,
  PRIORIDADE,
  listarDocumentos,
  getDocumentosPessoal,
  getDocumentosSetor,
  obterDocumento,
  visualizarDocumento,
  criarDocumento,
  atualizarDocumento,
  marcarComoLido,
  encaminharDocumento,
  bloquearDocumento,
  desbloquearDocumento,
  toggleBloqueio,
  arquivarDocumento,
  adicionarAnexo,
  removerAnexo,
  obterHistorico,
  obterEstatisticas,
  getEstatisticas,
};
