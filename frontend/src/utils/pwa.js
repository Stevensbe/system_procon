// Utilitário para Progressive Web App (PWA)
export class PWAManager {
  constructor() {
    this.registration = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.deferredPrompt = null;
    this.offlineData = [];
    
    // Verificar memória antes de inicializar
    if (this.checkMemoryAvailability()) {
      this.init();
    } else {
      console.warn('PWAManager: Memória insuficiente, inicializando modo básico');
    }
  }

  // Verificar disponibilidade de memória
  checkMemoryAvailability() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      return usage < 75; // Retornar true se uso < 75%
    }
    return true; // Fallback para dispositivos sem API de memória
  }

  // Inicializar PWA
  async init() {
    try {
      // Registrar Service Worker apenas se necessário
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', this.registration);
        
        // Aguardar atualizações
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      }

      // Verificar se já está instalado
      this.checkInstallation();
      
      // Configurar listeners
      this.setupEventListeners();
      
      // Carregar dados offline apenas se necessário
      if (this.isOnline) {
        await this.loadOfflineData();
      }
      
      console.log('PWA Manager inicializado (Otimizado)');
    } catch (error) {
      console.error('Erro ao inicializar PWA:', error);
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Listener para instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // Listener para status online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });

    // Listener para mensagens do Service Worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  // Verificar se o app está instalado
  checkInstallation() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('PWA está instalado');
    }
  }

  // Mostrar prompt de instalação
  showInstallPrompt() {
    if (this.deferredPrompt && !this.isInstalled) {
      // Criar banner de instalação
      const installBanner = document.createElement('div');
      installBanner.className = 'pwa-install-banner';
      installBanner.innerHTML = `
        <div class="pwa-install-content">
          <div class="pwa-install-text">
            <h3>Instalar Sistema PROCON</h3>
            <p>Acesse rapidamente o sistema diretamente do seu dispositivo</p>
          </div>
          <div class="pwa-install-actions">
            <button class="pwa-install-btn" onclick="window.pwaManager.install()">
              Instalar
            </button>
            <button class="pwa-dismiss-btn" onclick="window.pwaManager.dismissInstall()">
              Agora não
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(installBanner);
    }
  }

  // Instalar PWA
  async install() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalado pelo usuário');
        this.isInstalled = true;
      }
      
      this.deferredPrompt = null;
      this.dismissInstall();
    }
  }

  // Dismiss prompt de instalação
  dismissInstall() {
    const banner = document.querySelector('.pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Mostrar notificação de atualização
  showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <div class="pwa-update-text">
          <h3>Nova versão disponível</h3>
          <p>Uma nova versão do Sistema PROCON está disponível</p>
        </div>
        <div class="pwa-update-actions">
          <button class="pwa-update-btn" onclick="window.pwaManager.update()">
            Atualizar
          </button>
          <button class="pwa-dismiss-btn" onclick="window.pwaManager.dismissUpdate()">
            Depois
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
  }

  // Atualizar PWA
  async update() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar página após atualização
      window.location.reload();
    }
  }

  // Dismiss notificação de atualização
  dismissUpdate() {
    const banner = document.querySelector('.pwa-update-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Handler para quando ficar online
  onOnline() {
    console.log('Conexão restaurada');
    
    // Sincronizar dados offline
    this.syncOfflineData();
    
    // Mostrar notificação
    this.showNotification('Conexão restaurada', 'Você está online novamente', 'success');
  }

  // Handler para quando ficar offline
  onOffline() {
    console.log('Conexão perdida');
    
    // Mostrar notificação
    this.showNotification('Modo offline', 'Algumas funcionalidades podem estar limitadas', 'warning');
  }

  // Armazenar dados para sincronização offline
  async storeOfflineData(data) {
    try {
      this.offlineData.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...data
      });
      
      // Salvar no localStorage como backup
      localStorage.setItem('offlineData', JSON.stringify(this.offlineData));
      
      // Enviar para Service Worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STORE_OFFLINE',
          payload: data
        });
      }
      
      console.log('Dados armazenados para sincronização offline');
    } catch (error) {
      console.error('Erro ao armazenar dados offline:', error);
    }
  }

  // Carregar dados offline
  async loadOfflineData() {
    try {
      const savedData = localStorage.getItem('offlineData');
      if (savedData) {
        this.offlineData = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
    }
  }

  // Sincronizar dados offline
  async syncOfflineData() {
    if (this.offlineData.length === 0) return;
    
    console.log('Sincronizando dados offline...');
    
    for (const data of this.offlineData) {
      try {
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        if (response.ok) {
          // Remover dados sincronizados
          this.offlineData = this.offlineData.filter(item => item.id !== data.id);
        }
      } catch (error) {
        console.error('Erro ao sincronizar dados:', error);
      }
    }
    
    // Atualizar localStorage
    localStorage.setItem('offlineData', JSON.stringify(this.offlineData));
    
    if (this.offlineData.length === 0) {
      this.showNotification('Sincronização concluída', 'Todos os dados foram sincronizados', 'success');
    }
  }

  // Solicitar permissão para notificações push
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Permissão para notificações concedida');
        return true;
      } else {
        console.log('Permissão para notificações negada');
        return false;
      }
    }
    return false;
  }

  // Enviar notificação push
  async sendPushNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    }
  }

  // Mostrar notificação simples
  showNotification(title, message, type = 'info') {
    // Usar sistema de notificações existente ou criar uma simples
    if (window.notificationSystem) {
      window.notificationSystem.sendNotification({
        title,
        message,
        type
      });
    } else {
      this.sendPushNotification(title, message);
    }
  }

  // Handler para mensagens do Service Worker
  handleServiceWorkerMessage(data) {
    console.log('Mensagem do Service Worker:', data);
    
    switch (data.type) {
      case 'OFFLINE_DATA_SYNCED':
        this.showNotification('Sincronização', 'Dados sincronizados com sucesso', 'success');
        break;
      case 'UPDATE_AVAILABLE':
        this.showUpdateNotification();
        break;
      default:
        console.log('Mensagem não tratada:', data);
    }
  }

  // Obter informações do PWA
  getInfo() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      hasServiceWorker: !!this.registration,
      offlineDataCount: this.offlineData.length,
      canInstall: !!this.deferredPrompt
    };
  }

  // Limpar cache
  async clearCache() {
    if (this.registration) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Cache limpo');
    }
  }

  // Verificar atualizações
  async checkForUpdates() {
    if (this.registration) {
      await this.registration.update();
    }
  }
}

// Instância global do PWA Manager
export const pwaManager = new PWAManager();

// Hook para PWA
export const usePWA = () => {
  const [pwaInfo, setPwaInfo] = useState(pwaManager.getInfo());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateInfo = () => {
      setPwaInfo(pwaManager.getInfo());
    };

    // Atualizar informações periodicamente
    const interval = setInterval(updateInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const install = async () => {
    setIsLoading(true);
    try {
      await pwaManager.install();
      setPwaInfo(pwaManager.getInfo());
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const update = async () => {
    setIsLoading(true);
    try {
      await pwaManager.update();
    } catch (error) {
      console.error('Erro ao atualizar PWA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await pwaManager.requestNotificationPermission();
      setPwaInfo(pwaManager.getInfo());
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    setIsLoading(true);
    try {
      await pwaManager.clearCache();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pwaInfo,
    isLoading,
    install,
    update,
    requestNotificationPermission,
    clearCache,
    storeOfflineData: pwaManager.storeOfflineData.bind(pwaManager),
    syncOfflineData: pwaManager.syncOfflineData.bind(pwaManager)
  };
};

export default PWAManager;
