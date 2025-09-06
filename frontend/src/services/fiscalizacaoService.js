/**
 * @fileoverview Serviço de fiscalização do PROCON-AM - URLs CORRIGIDAS
 * @description Centraliza todas as chamadas de API para autos de fiscalização
 * @version 4.1 - URLS CORRIGIDAS PARA /api/
 */

// =========================================================================
// === CONFIGURAÇÕES GLOBAIS CORRIGIDAS ===
// =========================================================================

const API_BASE_URL = 'http://localhost:8000';
// 🔥 CORREÇÃO PRINCIPAL: Mudança do prefixo das URLs
const API_PREFIX = `${API_BASE_URL}/api`; // ← CORRIGIDO de '/processos/fiscalizacao' para '/api'

console.log('🔧 Service Configuration CORRECTED:');
console.log('- API_BASE_URL:', API_BASE_URL);
console.log('- API_PREFIX:', API_PREFIX);

// Timeout padrão para requisições (30 segundos)
const REQUEST_TIMEOUT = 30000;

// =========================================================================
// === UTILITÁRIOS ===
// =========================================================================

/**
 * Função para obter token de autenticação
 */
const getToken = () => {
    try {
        return localStorage.getItem('procon-auth-token') || 
               sessionStorage.getItem('procon-auth-token') ||
               localStorage.getItem('authToken') ||
               sessionStorage.getItem('authToken');
    } catch {
        return null;
    }
};

/**
 * Constrói query string a partir de objeto de filtros
 */
const buildQueryString = (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(item => {
                    params.append(key, String(item));
                });
            } else {
                params.append(key, String(value));
            }
        }
    });
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * === FUNÇÃO PRINCIPAL CORRIGIDA ===
 * Faz requisição para API com tratamento adequado para FormData
 */
 async function apiRequest(endpoint, method = 'GET', data = null, options = {}) {
    const token = getToken();
    
    // === CORREÇÃO CRÍTICA: Detectar FormData ===
    const isFormData = data instanceof FormData;
    
    const config = {
        method,
        headers: {
            // === CORREÇÃO: NÃO definir Content-Type para FormData ===
            // Deixar o browser definir automaticamente com boundary
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Accept': 'application/json',
            ...options.headers,
        },
        // === CORREÇÃO: Tratamento diferente para FormData vs JSON ===
        body: isFormData ? data : (data ? JSON.stringify(data) : null)
    };

    try {
        console.log(`[API Request] ${method} ${endpoint}`);
        console.log(`[Data Type] ${isFormData ? 'FormData' : 'JSON'}`);
        
        // === LOG ESPECIAL PARA FORMDATA (PARA DEBUG) ===
        if (isFormData) {
            console.log('[FormData Contents]:');
            for (let [key, value] of data.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }
        }
        
        const response = await fetch(endpoint, config);
        
        console.log(`[Response] Status: ${response.status} ${response.statusText}`);
        console.log(`[Response] Content-Type: ${response.headers.get('content-type')}`);
        
        // Para DELETE sem conteúdo
        if (method === 'DELETE' && response.status === 204) {
            return { success: true };
        }
        
        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await response.text();
            console.error(`[Non-JSON Response] ${responseText.substring(0, 500)}`);
            
            if (response.status === 400) {
                throw new Error(`Erro 400: Dados inválidos. Resposta: ${responseText.substring(0, 200)}`);
            } else if (response.status === 401) {
                throw new Error('Token inválido ou expirado. Faça login novamente.');
            } else if (response.status === 404) {
                throw new Error('Endpoint não encontrado. Verifique a URL da API.');
            } else if (response.status >= 500) {
                throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
            } else {
                throw new Error(`Erro ${response.status}: ${responseText || response.statusText}`);
            }
        }
        
        let json = {};
        try {
            json = await response.json();
        } catch (parseError) {
            console.error('[JSON Parse Error]', parseError);
            throw new Error('Resposta do servidor não é um JSON válido');
        }
        
        if (!response.ok) {
            console.error('[API Error Response]', json);
            
            // === TRATAMENTO ESPECÍFICO PARA ERRO 400 ===
            if (response.status === 400) {
                let errorMessage = 'Erro 400: Dados inválidos';
                
                if (json.detail) {
                    errorMessage = `Erro 400: ${json.detail}`;
                } else if (json.errors) {
                    const errors = typeof json.errors === 'object' 
                        ? Object.entries(json.errors)
                            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                            .join('\n')
                        : json.errors;
                    errorMessage = `Erro de validação:\n${errors}`;
                } else if (json.message) {
                    errorMessage = `Erro 400: ${json.message}`;
                } else if (typeof json === 'string') {
                    errorMessage = `Erro 400: ${json}`;
                }
                
                throw new Error(errorMessage);
            }
            
            // Outros erros HTTP
            const errorMessage = json.detail || json.message || json.error || `Erro ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        
        console.log('[Success Response]', json);
        
        // Normalizar resposta para listagens
        if (method === 'GET' && endpoint.includes('/api/')) {
            if (Array.isArray(json)) {
                return {
                    results: json,
                    count: json.length,
                    next: null,
                    previous: null
                };
            } else if (json.results && Array.isArray(json.results)) {
                return json;
            } else if (json && typeof json === 'object' && !Array.isArray(json)) {
                return json;
            } else {
                return {
                    results: [],
                    count: 0,
                    next: null,
                    previous: null
                };
            }
        }
        
        return json;
        
    } catch (error) {
        console.error(`[API Error] ${method} ${endpoint}:`, error);
        throw error;
    }
}

// =========================================================================
// === FUNÇÕES PRINCIPAIS - CRIAR AUTOS (URLs CORRIGIDAS) ===
// =========================================================================

/**
 * Cria novo auto diversos - URLs CORRIGIDAS
 */
export const criarAutoDiversos = async (formData) => {
    console.log('=== CRIANDO AUTO DIVERSOS ===');
    console.log('Tipo de dados:', formData instanceof FormData ? 'FormData' : typeof formData);
    
    if (!(formData instanceof FormData)) {
        throw new Error('criarAutoDiversos espera FormData, recebeu: ' + typeof formData);
    }
    
    return apiRequest(`${API_PREFIX}/diversos/`, 'POST', formData);
};

/**
 * Cria novo auto de supermercado - URLs CORRIGIDAS
 */
export const criarAutoSupermercado = async (formData) => {
    console.log('=== CRIANDO AUTO SUPERMERCADO ===');
    console.log('Tipo de dados:', formData instanceof FormData ? 'FormData' : typeof formData);
    
    if (!(formData instanceof FormData)) {
        throw new Error('criarAutoSupermercado espera FormData, recebeu: ' + typeof formData);
    }
    
    return apiRequest(`${API_PREFIX}/supermercados/`, 'POST', formData);
};

/**
 * Cria novo auto de banco - URLs CORRIGIDAS
 */
export const criarAutoBanco = async (formData) => {
    console.log('=== CRIANDO AUTO BANCO ===');
    console.log('Tipo de dados:', formData instanceof FormData ? 'FormData' : typeof formData);
    
    if (!(formData instanceof FormData)) {
        throw new Error('criarAutoBanco espera FormData, recebeu: ' + typeof formData);
    }
    
    return apiRequest(`${API_PREFIX}/bancos/`, 'POST', formData);
};

/**
 * Cria novo auto de posto - URLs CORRIGIDAS
 */
export const criarAutoPosto = async (formData) => {
    console.log('=== CRIANDO AUTO POSTO ===');
    console.log('Tipo de dados:', formData instanceof FormData ? 'FormData' : typeof formData);
    
    if (!(formData instanceof FormData)) {
        throw new Error('criarAutoPosto espera FormData, recebeu: ' + typeof formData);
    }
    
    return apiRequest(`${API_PREFIX}/postos/`, 'POST', formData);
};

/**
 * Cria novo auto de infração - URLs CORRIGIDAS
 */
export const criarAutoInfracao = async (formData) => {
    console.log('=== CRIANDO AUTO INFRAÇÃO ===');
    console.log('Tipo de dados:', formData instanceof FormData ? 'FormData' : typeof formData);
    
    if (!(formData instanceof FormData)) {
        throw new Error('criarAutoInfracao espera FormData, recebeu: ' + typeof formData);
    }
    
    // CORRIGIDO: infracoes em vez de infrações
    return apiRequest(`${API_PREFIX}/infracoes/`, 'POST', formData);
};

/**
 * Lista autos de infração - URL CORRIGIDA
 */
export const listarAutosInfracao = async (page = 1, filters = {}) => {
    const queryString = buildQueryString({ page, ...filters });
    // CORRIGIDO: infracoes em vez de infrações
    return apiRequest(`${API_PREFIX}/infracoes/${queryString}`, 'GET');
};

/**
 * Busca auto de infração por ID - URL CORRIGIDA
 */
// Removido: declaração duplicada de getAutoInfracaoById

// (Removido: declaração duplicada de atualizarAutoInfracao)

/**
 * Deleta auto de infração - URL CORRIGIDA
 */
// (Removido: declaração duplicada de deletarAutoInfracao)

// =========================================================================
// === TESTE PARA INFRAÇÕES (URLs CORRIGIDAS) ===
// =========================================================================

/**
 * Testa especificamente o endpoint de infrações
 */
export const testarInfracoes = async () => {
    try {
        console.log('🧪 Testando endpoint de infrações...');
        
        const endpoint = `${API_PREFIX}/infracoes/`;
        console.log('- Endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint infrações OK! Dados:', data);
            return data;
        } else {
            console.log('❌ Erro no endpoint infrações');
            const text = await response.text();
            console.log('Resposta:', text.substring(0, 300));
            return null;
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar infrações:', error);
        return null;
    }
};

// =========================================================================
// === FUNÇÕES DE LISTAGEM (URLs CORRIGIDAS) ===
// =========================================================================

/**
 * Lista autos diversos
 */
export const listarAutosDiversos = async (page = 1, filters = {}) => {
    const queryString = buildQueryString({ page, ...filters });
    return apiRequest(`${API_PREFIX}/diversos/${queryString}`, 'GET');
};

/**
 * Lista autos de supermercado
 */
export const listarAutosSupermercado = async (page = 1, filters = {}) => {
    const queryString = buildQueryString({ page, ...filters });
    return apiRequest(`${API_PREFIX}/supermercados/${queryString}`, 'GET');
};

/**
 * Lista autos de banco
 */
export const listarAutosBanco = async (page = 1, filters = {}) => {
    const queryString = buildQueryString({ page, ...filters });
    return apiRequest(`${API_PREFIX}/bancos/${queryString}`, 'GET');
};

/**
 * Lista autos de posto
 */
export const listarAutosPostos = async (page = 1, filters = {}) => {
    const queryString = buildQueryString({ page, ...filters });
    return apiRequest(`${API_PREFIX}/postos/${queryString}`, 'GET');
};

/* Removido: declaração duplicada de listarAutosInfracao */

// =========================================================================
// === FUNÇÕES DE BUSCA POR ID (URLs CORRIGIDAS) ===
// =========================================================================

export const getAutoDiversosById = async (id) => {
    return apiRequest(`${API_PREFIX}/diversos/${id}/`, 'GET');
};

export const getAutoSupermercadoById = async (id) => {
    return apiRequest(`${API_PREFIX}/supermercados/${id}/`, 'GET');
};

export const getAutoBancoById = async (id) => {
    return apiRequest(`${API_PREFIX}/bancos/${id}/`, 'GET');
};

export const getAutoPostoById = async (id) => {
    return apiRequest(`${API_PREFIX}/postos/${id}/`, 'GET');
};

export const getAutoInfracaoById = async (id) => {
    return apiRequest(`${API_PREFIX}/infracoes/${id}/`, 'GET');
};

// =========================================================================
// === FUNÇÕES DE ATUALIZAÇÃO (URLs CORRIGIDAS) ===
// =========================================================================

export const atualizarAutoDiversos = async (id, formData) => {
    return apiRequest(`${API_PREFIX}/diversos/${id}/`, 'PUT', formData);
};

export const atualizarAutoSupermercado = async (id, formData) => {
    return apiRequest(`${API_PREFIX}/supermercados/${id}/`, 'PUT', formData);
};

export const atualizarAutoBanco = async (id, formData) => {
    return apiRequest(`${API_PREFIX}/bancos/${id}/`, 'PUT', formData);
};

export const atualizarAutoPosto = async (id, formData) => {
    return apiRequest(`${API_PREFIX}/postos/${id}/`, 'PUT', formData);
};

export const obterAutoInfracao = async (id) => {
    return apiRequest(`${API_PREFIX}/infracoes/${id}/`, 'GET');
};

export const atualizarAutoInfracao = async (id, formData) => {
    return apiRequest(`${API_PREFIX}/infracoes/${id}/`, 'PUT', formData);
};

// =========================================================================
// === FUNÇÕES DE EXCLUSÃO (URLs CORRIGIDAS) ===
// =========================================================================

export const deletarAutoDiversos = async (id) => {
    return apiRequest(`${API_PREFIX}/diversos/${id}/`, 'DELETE');
};

export const deletarAutoSupermercado = async (id) => {
    return apiRequest(`${API_PREFIX}/supermercados/${id}/`, 'DELETE');
};

export const deletarAutoBanco = async (id) => {
    return apiRequest(`${API_PREFIX}/bancos/${id}/`, 'DELETE');
};

export const deletarAutoPosto = async (id) => {
    return apiRequest(`${API_PREFIX}/postos/${id}/`, 'DELETE');
};

export const deletarAutoInfracao = async (id) => {
    return apiRequest(`${API_PREFIX}/infracoes/${id}/`, 'DELETE');
};

export const gerarDocumentoInfracao = async (id) => {
    try {
        console.log(`📄 Gerando documento para auto de infração ${id}...`);
        
        const response = await fetch(`${API_BASE_URL}/infracoes/${id}/documento/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ Documento do auto de infração ${id} gerado com sucesso`);
        return response;
    } catch (error) {
        console.error('❌ Erro ao gerar documento da infração:', error);
        throw error;
    }
};

// =========================================================================
// === FUNÇÕES DE ESTATÍSTICAS (URLs CORRIGIDAS) ===
// =========================================================================

export const estatisticas = async () => {
    return apiRequest(`${API_PREFIX}/estatisticas-gerais/`, 'GET');
};

export const dashboardStats = async (periodo = '30d') => {
    return apiRequest(`${API_PREFIX}/dashboard-stats/?periodo=${periodo}`, 'GET');
};

export const buscarAutos = async (query, limit = 20) => {
    const params = new URLSearchParams({ q: query, limit });
    return apiRequest(`${API_PREFIX}/buscar-autos/?${params}`, 'GET');
};

// =========================================================================
// === FUNÇÕES DE DEBUG E TESTE (URLs CORRIGIDAS) ===
// =========================================================================

/**
 * Testa conexão básica com a API
 */
export const testeConexao = async () => {
    try {
        console.log('🔄 Testando conexão...');
        console.log('- API_PREFIX:', API_PREFIX);
        
        const endpoint = `${API_PREFIX}/diversos/`;
        console.log('- Endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
        console.log('- Content-Type:', response.headers.get('content-type'));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conexão OK! Dados:', data);
            return data;
        } else if (response.status === 404) {
            console.log('❌ Erro 404: Endpoint não encontrado');
            console.log('💡 Possível solução: Verificar se as URLs do backend estão corretas');
            console.log('💡 Testando endpoint alternativo...');
            
            // Tenta endpoints alternativos
            const alternativeEndpoints = [
                `${API_BASE_URL}/processos/fiscalizacao/diversos/`,
                `${API_BASE_URL}/fiscalizacao/diversos/`,
                `${API_BASE_URL}/diversos/`
            ];
            
            for (const altEndpoint of alternativeEndpoints) {
                console.log(`🔍 Testando: ${altEndpoint}`);
                try {
                    const altResponse = await fetch(altEndpoint, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                    });
                    if (altResponse.ok) {
                        console.log(`✅ Encontrou endpoint alternativo: ${altEndpoint}`);
                        return { alternativeEndpoint: altEndpoint };
                    }
                } catch (e) {
                    console.log(`❌ ${altEndpoint} também não funciona`);
                }
            }
            
            return null;
        } else {
            const text = await response.text();
            console.log('❌ Erro na conexão. Resposta:', text.substring(0, 300));
            return null;
        }
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        return null;
    }
};

/**
 * Testa especificamente o POST para diversos
 */
export const testarFormDataDiversos = async () => {
    try {
        console.log('🧪 Testando FormData para diversos...');
        
        const testFormData = new FormData();
        testFormData.append('razao_social', 'TESTE FORMDATA LTDA');
        testFormData.append('cnpj', '12.345.678/0001-90');
        testFormData.append('atividade', 'Teste de FormData');
        testFormData.append('endereco', 'Rua Teste FormData, 123');
        testFormData.append('municipio', 'Manaus');
        testFormData.append('estado', 'AM');
        testFormData.append('data_fiscalizacao', '2025-01-15');
        testFormData.append('hora_fiscalizacao', '14:30');
        testFormData.append('origem', 'acao');
        testFormData.append('fiscal_nome_1', 'João Silva Teste');
        testFormData.append('responsavel_nome', 'Maria Santos Teste');
        testFormData.append('responsavel_cpf', '123.456.789-00');
        testFormData.append('narrativa_fatos', 'Teste de narrativa para FormData');
        testFormData.append('receita_bruta_notificada', 'true');
        
        console.log('📤 Dados de teste preparados. Pronto para enviar...');
        console.log('⚠️ ATENÇÃO: Esta é só uma simulação. Para testar de verdade, chame criarAutoDiversos(testFormData)');
        
        return {
            ready: true,
            formData: testFormData,
            message: 'Dados de teste preparados com sucesso'
        };
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return {
            error: error.message,
            ready: false
        };
    }
};

// =========================================================================
// === FUNÇÕES UTILITÁRIAS ===
// =========================================================================

export const validarCNPJ = (cnpj) => {
    if (!cnpj) return false;
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.length === 14;
};

export const validarCPF = (cpf) => {
    if (!cpf) return false;
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
};

export const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatarCPF = (cpf) => {
    if (!cpf) return '';
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    const cleanPhone = telefone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length === 11) {
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
};

export const formatarData = (data) => {
    if (!data) return '';
    const date = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
    return date.toLocaleDateString('pt-BR');
};

// =========================================================================
// === ALIASES PARA COMPATIBILIDADE ===
// =========================================================================

export const listarAutosPosto = listarAutosPostos;
export const getProcessoUnificado = async (id) => {
  try {
    console.log(`🔍 Buscando processo ${id} com API unificada`);
    
    const response = await apiRequest(`${API_PREFIX}/processo/${id}/`, 'GET');
    
    if (response && response.found) {
      console.log(`✅ Processo encontrado como ${response.label}`);
      return {
        processo: response.data,
        tipo: response.tipo,
        label: response.label
      };
    } else {
      throw new Error('Processo não encontrado em nenhum tipo de auto');
    }
    
  } catch (error) {
    console.error('❌ Erro na busca unificada:', error);
    // Se API unificada falhar, tenta método fallback
    console.warn('⚠️ Tentando método fallback...');
    return await getProcessoFallback(id);
  }
};

/**
 * 🔄 FUNÇÃO DE FALLBACK: Se API unificada falhar
 */
const getProcessoFallback = async (id) => {
  console.log('🔄 Usando método fallback (múltiplas chamadas)');
  
  // Array de funções de busca com seus respectivos tipos
  const buscadores = [
    { func: getAutoDiversosById, tipo: 'diversos', label: 'Auto Diversos' },
    { func: getAutoSupermercadoById, tipo: 'supermercados', label: 'Auto Supermercado' },
    { func: getAutoBancoById, tipo: 'bancos', label: 'Auto Banco' },
    { func: getAutoPostoById, tipo: 'postos', label: 'Auto Posto' },
    { func: getAutoInfracaoById, tipo: 'infracoes', label: 'Auto Infração' }
  ];
  
  // Tentar cada tipo até encontrar o processo
  for (const { func, tipo, label } of buscadores) {
    try {
      console.log(`🔍 Tentando buscar como ${label}...`);
      const resultado = await func(id);
      if (resultado) {
        console.log(`✅ Processo encontrado como ${label}`);
        return {
          processo: resultado,
          tipo: tipo,
          label: label
        };
      }
    } catch (err) {
      console.log(`❌ Não encontrado como ${label}:`, err.message);
      // Continua tentando os outros tipos
    }
  }
  
  throw new Error('Processo não encontrado em nenhum tipo de auto');
};

/**
 * 📋 NOVA FUNÇÃO: Lista unificada de todos os processos
 */
export const listarProcessosUnificado = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();
    
    // Adiciona parâmetros de busca
    if (params.search) searchParams.append('search', params.search);
    if (params.tipo) searchParams.append('tipo', params.tipo);
    if (params.data_inicio) searchParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) searchParams.append('data_fim', params.data_fim);
    if (params.page) searchParams.append('page', params.page);
    if (params.page_size) searchParams.append('page_size', params.page_size);
    
    const url = `${API_PREFIX}/processos/unificado/?${searchParams.toString()}`;
    console.log(`📋 Listando processos unificado: ${url}`);
    
    const data = await apiRequest(url, 'GET');
    console.log(`✅ ${data.count || 0} processos encontrados`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro na listagem unificada:', error);
    // Se falhar, usa método tradicional como fallback
    console.warn('⚠️ Usando método tradicional como fallback...');
    return await listarProcessosTradicional(params);
  }
};

/**
 * 🔄 FUNÇÃO DE FALLBACK: Lista tradicional
 */
const listarProcessosTradicional = async (params = {}) => {
  try {
    console.log('🔄 Carregando com método tradicional...');
    
    // Carregar todos os tipos de autos em paralelo
    const [
      autosDiversos,
      autosSupermercado,
      autosBanco,
      autosPostos,
      autosInfracao
    ] = await Promise.allSettled([
      listarAutosDiversos(1, params),
      listarAutosSupermercado(1, params),
      listarAutosBanco(1, params),
      listarAutosPostos(1, params),
      listarAutosInfracao(1, params)
    ]);

    const todosOsProcessos = [];

    // Processar resultados de cada tipo
    if (autosDiversos.status === 'fulfilled' && autosDiversos.value?.results) {
      autosDiversos.value.results.forEach(auto => {
        todosOsProcessos.push({ ...auto, tipo: 'diverso', tipo_label: 'Auto Diversos' });
      });
    }

    if (autosSupermercado.status === 'fulfilled' && autosSupermercado.value?.results) {
      autosSupermercado.value.results.forEach(auto => {
        todosOsProcessos.push({ ...auto, tipo: 'supermercado', tipo_label: 'Auto Supermercado' });
      });
    }

    if (autosBanco.status === 'fulfilled' && autosBanco.value?.results) {
      autosBanco.value.results.forEach(auto => {
        todosOsProcessos.push({ ...auto, tipo: 'banco', tipo_label: 'Auto Banco' });
      });
    }

    if (autosPostos.status === 'fulfilled' && autosPostos.value?.results) {
      autosPostos.value.results.forEach(auto => {
        todosOsProcessos.push({ ...auto, tipo: 'posto', tipo_label: 'Auto Posto' });
      });
    }

    if (autosInfracao.status === 'fulfilled' && autosInfracao.value?.results) {
      autosInfracao.value.results.forEach(auto => {
        todosOsProcessos.push({ ...auto, tipo: 'infracao', tipo_label: 'Auto Infração' });
      });
    }

    // Ordenar por data de criação (mais recente primeiro)
    todosOsProcessos.sort((a, b) => {
      const dataA = new Date(a.created_at || a.data_fiscalizacao || 0);
      const dataB = new Date(b.created_at || b.data_fiscalizacao || 0);
      return dataB - dataA;
    });

    console.log(`✅ Carregados ${todosOsProcessos.length} processos (tradicional)`);
    
    // Simula paginação
    const page = parseInt(params.page) || 1;
    const page_size = parseInt(params.page_size) || 25;
    const start = (page - 1) * page_size;
    const end = start + page_size;
    
    return {
      results: todosOsProcessos.slice(start, end),
      count: todosOsProcessos.length,
      current_page: page,
      total_pages: Math.ceil(todosOsProcessos.length / page_size),
      page_size: page_size,
      has_next: end < todosOsProcessos.length,
      has_previous: page > 1
    };
    
  } catch (error) {
    console.error('❌ Erro no método tradicional:', error);
    throw error;
  }
};

/**
 * 🚀 NOVA FUNÇÃO: Dashboard com cache
 */
export const getDashboardCached = async (periodo = '30d') => {
  try {
    return await apiRequest(`${API_PREFIX}/dashboard/cached/?periodo=${periodo}`, 'GET');
  } catch (error) {
    console.error('❌ Erro no dashboard cached:', error);
    // Fallback para dashboard normal
    console.warn('⚠️ Usando dashboard normal como fallback...');
    return await dashboardStats(periodo);
  }
};

/**
 * 🔍 NOVA FUNÇÃO: Busca avançada
 */
export const buscarProcessosAvancado = async (termo, options = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('q', termo);
    
    if (options.limit) params.append('limit', options.limit);
    if (options.tipos) params.append('tipos', options.tipos);
    
    return await apiRequest(`${API_PREFIX}/busca/?${params.toString()}`, 'GET');
    
  } catch (error) {
    console.error('❌ Erro na busca avançada:', error);
    // Fallback para busca simples
    return await buscarAutos(termo, options.limit);
  }
};

/**
 * 🧪 NOVA FUNÇÃO: Teste de performance
 */
export const testarPerformance = async (processoId) => {
  try {
    return await apiRequest(`${API_PREFIX}/teste-performance/${processoId}/`, 'GET');
  } catch (error) {
    console.error('❌ Erro no teste de performance:', error);
    return {
      error: error.message,
      processo_id: processoId,
      performance: null
    };
  }
};

// ===== ATUALIZAR O EXPORT DEFAULT (SUBSTITUIR A SEÇÃO EXPORT DEFAULT) =====

export default {
    // Funções originais (manter todas)
    criarAutoDiversos,
    criarAutoSupermercado,
    criarAutoBanco,
    criarAutoPosto,
    criarAutoInfracao,
    
    listarAutosDiversos,
    listarAutosSupermercado,
    listarAutosBanco,
    listarAutosPostos,
    listarAutosPosto, // Alias
    listarAutosInfracao,
    
    getAutoDiversosById,
    getAutoSupermercadoById,
    getAutoBancoById,
    getAutoPostoById,
    getAutoInfracaoById,
    obterAutoInfracao,
    
    atualizarAutoDiversos,
    atualizarAutoSupermercado,
    atualizarAutoBanco,
    atualizarAutoPosto,
    atualizarAutoInfracao,
    
    deletarAutoDiversos,
    deletarAutoSupermercado,
    deletarAutoBanco,
    deletarAutoPosto,
    deletarAutoInfracao,
    
    gerarDocumentoInfracao,
    
    estatisticas,
    dashboardStats,
    buscarAutos,
    testeConexao,
    testarFormDataDiversos,
    validarCNPJ,
    validarCPF,
    formatarCNPJ,
    formatarCPF,
    formatarTelefone,
    formatarData,
    
    // ✅ NOVAS FUNÇÕES UNIFICADAS (ADICIONAR)
    getProcessoUnificado,
    listarProcessosUnificado,
    getDashboardCached,
    buscarProcessosAvancado,
    testarPerformance,
    
    // Configurações
    API_BASE_URL,
    API_PREFIX,
    apiRequest
};

// ===== ATUALIZAR A CONFIGURAÇÃO GLOBAL (SUBSTITUIR A SEÇÃO FINAL) =====

if (typeof window !== 'undefined') {
    window.fiscalizacaoServiceCORRECTED = {
        // Funções originais
        testeConexao,
        testarFormDataDiversos,
        criarAutoDiversos,
        criarAutoSupermercado,
        listarAutosDiversos,
        
        // ✅ NOVAS FUNÇÕES UNIFICADAS
        getProcessoUnificado,
        listarProcessosUnificado,
        getDashboardCached,
        buscarProcessosAvancado,
        testarPerformance,
        
        API_PREFIX,
        API_BASE_URL
    };
    
    console.log('✅ Service ATUALIZADO com APIs UNIFICADAS!');
    console.log('🚀 Novas funcionalidades disponíveis:');
    console.log('- getProcessoUnificado(id) - Uma chamada em vez de 5');
    console.log('- listarProcessosUnificado(params) - Lista unificada');
    console.log('- getDashboardCached(periodo) - Dashboard com cache');
    console.log('- buscarProcessosAvancado(termo) - Busca avançada');
    console.log('- testarPerformance(id) - Testa performance');
    console.log('');
    console.log('🧪 Teste as novas funcionalidades:');
    console.log('- window.fiscalizacaoServiceCORRECTED.getProcessoUnificado(1)');
    console.log('- window.fiscalizacaoServiceCORRECTED.testarPerformance(1)');
}