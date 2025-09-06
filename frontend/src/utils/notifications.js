// Sistema de Notificações Push em Tempo Real
import { toast } from 'react-hot-toast';

export class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.subscribers = new Set();
    this.soundEnabled = true;
    this.desktopEnabled = true;
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Inicializar sistema de notificações
  async initialize(userId) {
    this.userId = userId;
    
    // Solicitar permissão para notificações desktop
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.desktopEnabled = permission === 'granted';
    }

    // Conectar WebSocket para notificações em tempo real
    this.connectWebSocket();
    
    // Configurar Service Worker para notificações push
    this.setupServiceWorker();
    
    console.log('Sistema de notificações inicializado');
  }

  // Conectar WebSocket
  connectWebSocket() {
    try {
      this.websocket = new WebSocket(`ws://localhost:8000/ws/notifications/${this.userId}/`);
      
      this.websocket.onopen = () => {
        console.log('WebSocket conectado para notificações');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        this.handleIncomingNotification(notification);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket desconectado');
        this.handleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }

  // Reconectar WebSocket
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connectWebSocket();
      }, delay);
    }
  }

  // Configurar Service Worker
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);
        
        // Solicitar permissão para notificações push
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
          });
          
          // Enviar subscription para o servidor
          this.sendSubscriptionToServer(subscription);
        }
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  // Converter chave VAPID
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Enviar subscription para servidor
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/notifications/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: this.userId
        })
      });
    } catch (error) {
      console.error('Erro ao enviar subscription:', error);
    }
  }

  // Processar notificação recebida
  handleIncomingNotification(notification) {
    // Adicionar à lista de notificações
    this.notifications.unshift({
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false
    });

    // Limitar número de notificações
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notificar subscribers
    this.notifySubscribers();

    // Mostrar notificação
    this.showNotification(notification);

    // Salvar no localStorage
    this.saveNotifications();
  }

  // Mostrar notificação
  showNotification(notification) {
    // Toast notification
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {this.getNotificationIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Fechar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right'
    });

    // Desktop notification
    if (this.desktopEnabled && notification.desktop) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.important || false
      });
    }

    // Som de notificação
    if (this.soundEnabled && notification.sound) {
      this.playNotificationSound();
    }
  }

  // Obter ícone da notificação
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      default: '🔔'
    };
    return icons[type] || icons.default;
  }

  // Tocar som de notificação
  playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  // Enviar notificação
  sendNotification(notification) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(notification));
    }
  }

  // Marcar notificação como lida
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
      this.saveNotifications();
    }
  }

  // Marcar todas como lidas
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
    this.saveNotifications();
  }

  // Deletar notificação
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
    this.saveNotifications();
  }

  // Limpar todas as notificações
  clearAllNotifications() {
    this.notifications = [];
    this.notifySubscribers();
    this.saveNotifications();
  }

  // Obter notificações não lidas
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Obter notificações
  getNotifications(limit = 50) {
    return this.notifications.slice(0, limit);
  }

  // Salvar notificações no localStorage
  saveNotifications() {
    try {
      localStorage.setItem(`notifications_${this.userId}`, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  }

  // Carregar notificações do localStorage
  loadNotifications() {
    try {
      const saved = localStorage.getItem(`notifications_${this.userId}`);
      if (saved) {
        this.notifications = JSON.parse(saved);
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  // Subscribir para mudanças
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notificar subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.notifications, this.getUnreadCount());
      } catch (error) {
        console.error('Erro ao notificar subscriber:', error);
      }
    });
  }

  // Configurar preferências
  setPreferences(preferences) {
    this.soundEnabled = preferences.sound !== undefined ? preferences.sound : this.soundEnabled;
    this.desktopEnabled = preferences.desktop !== undefined ? preferences.desktop : this.desktopEnabled;
    
    localStorage.setItem(`notification_preferences_${this.userId}`, JSON.stringify({
      sound: this.soundEnabled,
      desktop: this.desktopEnabled
    }));
  }

  // Carregar preferências
  loadPreferences() {
    try {
      const saved = localStorage.getItem(`notification_preferences_${this.userId}`);
      if (saved) {
        const preferences = JSON.parse(saved);
        this.soundEnabled = preferences.sound;
        this.desktopEnabled = preferences.desktop;
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  }

  // Desconectar
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
    }
    this.subscribers.clear();
  }
}

// Instância global do sistema de notificações
export const notificationSystem = new NotificationSystem();

// Hook para notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe((notifications, unreadCount) => {
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    });

    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead: notificationSystem.markAsRead.bind(notificationSystem),
    markAllAsRead: notificationSystem.markAllAsRead.bind(notificationSystem),
    deleteNotification: notificationSystem.deleteNotification.bind(notificationSystem),
    clearAll: notificationSystem.clearAllNotifications.bind(notificationSystem),
    sendNotification: notificationSystem.sendNotification.bind(notificationSystem)
  };
};

export default NotificationSystem;
