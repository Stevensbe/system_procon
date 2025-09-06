// Service Worker para Sistema PROCON
const CACHE_NAME = 'procon-cache-v1.0';
const STATIC_CACHE = 'procon-static-v1.0';
const DYNAMIC_CACHE = 'procon-dynamic-v1.0';

// URLs para cache estático
const STATIC_URLS = [
  '/react/',
  '/react/static/css/',
  '/react/static/js/',
  '/react/static/media/',
  '/favicon.ico',
  '/manifest.json'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First para recursos estáticos
  STATIC_FIRST: 'static-first',
  // Network First para dados dinâmicos
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate para recursos importantes
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cache estático aberto');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('Service Worker: Instalação concluída');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Ativação concluída');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia baseada no tipo de recurso
  if (isStaticResource(request)) {
    event.respondWith(staticFirstStrategy(request));
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Verificar se é recurso estático
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/static/') || 
         url.pathname.includes('.css') || 
         url.pathname.includes('.js') ||
         url.pathname.includes('.png') ||
         url.pathname.includes('.jpg') ||
         url.pathname.includes('.ico');
}

// Verificar se é requisição de API
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') || 
         url.pathname.includes('/auth/') ||
         request.method === 'POST' ||
         request.method === 'PUT' ||
         request.method === 'DELETE';
}

// Estratégia Cache First para recursos estáticos
async function staticFirstStrategy(request) {
  try {
    // Tentar buscar do cache primeiro
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não estiver no cache, buscar da rede
    const networkResponse = await fetch(request);
    
    // Armazenar no cache para uso futuro
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Erro na estratégia static-first:', error);
    throw error;
  }
}

// Estratégia Network First para dados dinâmicos
async function networkFirstStrategy(request) {
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    // Se a rede funcionou, atualizar o cache
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Rede indisponível, tentando cache:', error);
    
    // Se a rede falhou, tentar buscar do cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não há cache, retornar página offline
    return caches.match('/react/offline.html');
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  try {
    // Buscar do cache imediatamente
    const cachedResponse = await caches.match(request);
    
    // Buscar da rede em background
    const networkPromise = fetch(request).then((response) => {
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => {
      // Ignorar erros de rede
    });
    
    // Retornar cache se disponível, senão aguardar rede
    return cachedResponse || networkPromise;
  } catch (error) {
    console.error('Erro na estratégia stale-while-revalidate:', error);
    throw error;
  }
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sincronização em background:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(backgroundSync());
  }
});

// Função de sincronização em background
async function backgroundSync() {
  try {
    // Sincronizar dados offline
    const offlineData = await getOfflineData();
    
    for (const data of offlineData) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        // Remover dados sincronizados
        await removeOfflineData(data.id);
      } catch (error) {
        console.error('Erro ao sincronizar dados:', error);
      }
    }
  } catch (error) {
    console.error('Erro na sincronização em background:', error);
  }
}

// Armazenar dados offline
async function storeOfflineData(data) {
  try {
    const db = await openDB();
    await db.add('offlineData', {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data
    });
  } catch (error) {
    console.error('Erro ao armazenar dados offline:', error);
  }
}

// Obter dados offline
async function getOfflineData() {
  try {
    const db = await openDB();
    return await db.getAll('offlineData');
  } catch (error) {
    console.error('Erro ao obter dados offline:', error);
    return [];
  }
}

// Remover dados offline
async function removeOfflineData(id) {
  try {
    const db = await openDB();
    await db.delete('offlineData', id);
  } catch (error) {
    console.error('Erro ao remover dados offline:', error);
  }
}

// Abrir banco de dados IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProconOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Criar store para dados offline
      if (!db.objectStoreNames.contains('offlineData')) {
        const store = db.createObjectStore('offlineData', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do PROCON',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema PROCON', options)
  );
});

// Clique em notificação push
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notificação clicada');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/react/')
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('Service Worker: Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE') {
    storeOfflineData(event.data.payload);
  }
});

console.log('Service Worker: Carregado com sucesso');
