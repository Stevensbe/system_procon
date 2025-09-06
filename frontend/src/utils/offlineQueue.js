// frontend/src/utils/offlineQueue.js
import Dexie from 'dexie';
import { 
  criarAutoBanco, 
  criarAutoPosto, 
  criarAutoSupermercado, 
  criarAutoDiversos 
} from '../services/fiscalizacaoService';

// Constantes de configuração
const DB_NAME = 'SISPROCON_Offline';
const DB_VERSION = 2;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo base para retry exponencial

// Status dos itens na fila
const QUEUE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  FAILED: 'failed',
  COMPLETED: 'completed'
};

// Configura o banco de dados local
const db = new Dexie(DB_NAME);
db.version(DB_VERSION).stores({
  autosQueue: '++id, endpoint, payload, status, createdAt, updatedAt, retryCount, lastError'
});

// Mapeia endpoints para funções da API
const apiFunctions = {
  'autobanco': criarAutoBanco,
  'autoposto': criarAutoPosto,
  'autosupermercado': criarAutoSupermercado,
  'autodiversos': criarAutoDiversos,
};

// Utilitários
const logger = {
  info: (message) => console.log(`ℹ️ [OfflineQueue] ${message}`),
  success: (message) => console.log(`✅ [OfflineQueue] ${message}`),
  error: (message, error) => {
    console.error(`❌ [OfflineQueue] ${message}`, error);
  },
  warn: (message) => console.warn(`⚠️ [OfflineQueue] ${message}`)
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Valida se o endpoint é suportado
const validateEndpoint = (endpoint) => {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Endpoint deve ser uma string válida');
  }
  
  if (!apiFunctions[endpoint]) {
    throw new Error(`Endpoint '${endpoint}' não é suportado. Endpoints válidos: ${Object.keys(apiFunctions).join(', ')}`);
  }
};

// Valida o payload
const validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload deve ser um objeto válido');
  }
  
  // Adicione validações específicas do seu domínio aqui
  // Por exemplo: campos obrigatórios, tipos de dados, etc.
};

/**
 * Adiciona um auto à fila offline
 * @param {string} endpoint - Nome do endpoint/tipo de auto
 * @param {object} payload - Dados do auto a serem enviados
 * @param {object} options - Opções adicionais
 * @returns {Promise<number>} ID do item na fila
 */
export const addToOfflineQueue = async (endpoint, payload, options = {}) => {
  try {
    // Validações
    validateEndpoint(endpoint);
    validatePayload(payload);
    
    const now = new Date().toISOString();
    const queueItem = {
      endpoint,
      payload: JSON.parse(JSON.stringify(payload)), // Deep clone para evitar referências
      status: QUEUE_STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      lastError: null,
      priority: options.priority || 0, // Para implementar priorização futura
      metadata: options.metadata || {} // Dados adicionais se necessário
    };
    
    const id = await db.autosQueue.add(queueItem);
    
    logger.success(`Auto para ${endpoint} salvo offline (ID: ${id})`);
    
    // Notificação mais discreta e informativa
    if (options.showNotification !== false) {
      showOfflineNotification(endpoint);
    }
    
    // Tenta sincronizar imediatamente se houver conexão
    if (navigator.onLine) {
      setTimeout(() => syncOfflineQueue(), 100);
    }
    
    return id;
    
  } catch (error) {
    logger.error('Erro ao salvar auto offline:', error);
    
    // Notificação de erro mais específica
    if (error.message.includes('quota')) {
      alert('Erro: Espaço de armazenamento insuficiente. Limpe dados antigos ou sincronize pendências.');
    } else {
      alert(`Erro ao salvar o auto: ${error.message}`);
    }
    
    throw error;
  }
};

/**
 * Sincroniza a fila offline com o servidor
 * @param {object} options - Opções de sincronização
 * @returns {Promise<object>} Resultado da sincronização
 */
export const syncOfflineQueue = async (options = {}) => {
  const { 
    maxConcurrent = 3, 
    stopOnFirstError = false,
    onProgress = null 
  } = options;
  
  try {
    // Busca apenas itens pendentes ou com falha (que não ultrapassaram o limite de retry)
    const autosPendentes = await db.autosQueue
      .where('status')
      .anyOf([QUEUE_STATUS.PENDING, QUEUE_STATUS.FAILED])
      .and(item => item.retryCount < MAX_RETRY_ATTEMPTS)
      .toArray();
    
    if (autosPendentes.length === 0) {
      logger.info('Fila offline está vazia ou sem itens válidos para sincronização');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    logger.info(`Iniciando sincronização de ${autosPendentes.length} auto(s) pendente(s)...`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Processa em lotes para evitar sobrecarga
    const batches = chunkArray(autosPendentes, maxConcurrent);
    
    for (const batch of batches) {
      const batchPromises = batch.map(item => 
        syncSingleItem(item, results, onProgress)
      );
      
      await Promise.allSettled(batchPromises);
      
      if (stopOnFirstError && results.failed > 0) {
        logger.warn('Sincronização interrompida devido a erro');
        break;
      }
    }
    
    logger.info(
      `Sincronização concluída: ${results.success} sucessos, ` +
      `${results.failed} falhas, ${results.skipped} ignorados`
    );
    
    // Limpa itens completados antigos (opcional)
    await cleanupOldItems();
    
    return results;
    
  } catch (error) {
    logger.error('Erro durante sincronização:', error);
    throw error;
  }
};

/**
 * Sincroniza um item individual
 */
const syncSingleItem = async (item, results, onProgress) => {
  try {
    // Marca como processando
    await updateQueueItem(item.id, { 
      status: QUEUE_STATUS.PROCESSING,
      updatedAt: new Date().toISOString()
    });
    
    const apiFunc = apiFunctions[item.endpoint];
    if (!apiFunc) {
      throw new Error(`Função API não encontrada para endpoint: ${item.endpoint}`);
    }
    
    // Retry com backoff exponencial
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          const delayTime = RETRY_DELAY * Math.pow(2, attempt - 1);
          logger.info(`Tentativa ${attempt + 1} para item ${item.id} após ${delayTime}ms`);
          await delay(delayTime);
        }
        
        await apiFunc(item.payload);
        
        // Sucesso - marca como completado
        await updateQueueItem(item.id, { 
          status: QUEUE_STATUS.COMPLETED,
          updatedAt: new Date().toISOString(),
          lastError: null
        });
        
        results.success++;
        logger.success(`Auto ${item.id} (${item.endpoint}) enviado com sucesso`);
        
        if (onProgress) {
          onProgress({ type: 'success', item, attempt: attempt + 1 });
        }
        
        return;
        
      } catch (error) {
        lastError = error;
        
        // Atualiza contador de retry
        await updateQueueItem(item.id, { 
          retryCount: attempt + 1,
          lastError: error.message,
          updatedAt: new Date().toISOString()
        });
        
        logger.warn(`Tentativa ${attempt + 1} falhou para item ${item.id}: ${error.message}`);
      }
    }
    
    // Todas as tentativas falharam
    await updateQueueItem(item.id, { 
      status: QUEUE_STATUS.FAILED,
      updatedAt: new Date().toISOString()
    });
    
    results.failed++;
    results.errors.push({ itemId: item.id, endpoint: item.endpoint, error: lastError });
    logger.error(`Item ${item.id} falhou após ${MAX_RETRY_ATTEMPTS} tentativas:`, lastError);
    
    if (onProgress) {
      onProgress({ type: 'failed', item, error: lastError });
    }
    
  } catch (error) {
    results.skipped++;
    logger.error(`Erro ao processar item ${item.id}:`, error);
    
    if (onProgress) {
      onProgress({ type: 'skipped', item, error });
    }
  }
};

/**
 * Atualiza um item da fila
 */
const updateQueueItem = async (id, updates) => {
  await db.autosQueue.update(id, updates);
};

/**
 * Divide array em chunks
 */
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Limpa itens antigos completados (mais de 7 dias)
 */
const cleanupOldItems = async () => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const deleted = await db.autosQueue
    .where('status')
    .equals(QUEUE_STATUS.COMPLETED)
    .and(item => new Date(item.updatedAt) < weekAgo)
    .delete();
    
  if (deleted > 0) {
    logger.info(`Removidos ${deleted} itens antigos da fila`);
  }
};

/**
 * Mostra notificação offline mais elegante
 */
const showOfflineNotification = (endpoint) => {
  // Você pode substituir por uma biblioteca de toast/notification mais elegante
  const message = `Auto ${endpoint} salvo offline e será sincronizado automaticamente quando a conexão for restaurada.`;
  
  // Exemplo com toast customizado (substitua pela sua biblioteca de UI)
  if (window.showToast) {
    window.showToast(message, 'info');
  } else {
    // Fallback para alert nativo
    alert(message);
  }
};

// Funções utilitárias adicionais

/**
 * Retorna estatísticas da fila offline
 */
export const getQueueStats = async () => {
  const stats = {};
  
  for (const status of Object.values(QUEUE_STATUS)) {
    stats[status] = await db.autosQueue.where('status').equals(status).count();
  }
  
  const oldestPending = await db.autosQueue
    .where('status')
    .equals(QUEUE_STATUS.PENDING)
    .orderBy('createdAt')
    .first();
    
  return {
    ...stats,
    total: await db.autosQueue.count(),
    oldestPendingDate: oldestPending?.createdAt
  };
};

/**
 * Remove todos os itens da fila (use com cuidado!)
 */
export const clearQueue = async (status = null) => {
  if (status) {
    return await db.autosQueue.where('status').equals(status).delete();
  } else {
    return await db.autosQueue.clear();
  }
};

/**
 * Retorna itens da fila com filtros
 */
export const getQueueItems = async (filters = {}) => {
  let query = db.autosQueue;
  
  if (filters.status) {
    query = query.where('status').equals(filters.status);
  }
  
  if (filters.endpoint) {
    query = query.where('endpoint').equals(filters.endpoint);
  }
  
  return await query.toArray();
};

// Auto-sincronização quando a conexão é restaurada
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('Conexão restaurada - iniciando sincronização automática');
    syncOfflineQueue().catch(error => 
      logger.error('Erro na sincronização automática:', error)
    );
  });
  
  window.addEventListener('offline', () => {
    logger.info('Conexão perdida - modo offline ativado');
  });
}

export default {
  addToOfflineQueue,
  syncOfflineQueue,
  getQueueStats,
  clearQueue,
  getQueueItems,
  QUEUE_STATUS
};