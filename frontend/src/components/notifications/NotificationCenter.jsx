import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon,
  TrashIcon,
  CogIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../utils/notifications';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const [settings, setSettings] = useState({
    sound: true,
    desktop: true,
    autoClose: 5000
  });

  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      default: '🔔'
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      default: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    };
    return colors[type] || colors.default;
  };

  const renderNotification = (notification) => (
    <div
      key={notification.id}
      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
        !notification.read ? 'opacity-100' : 'opacity-75'
      } transition-opacity duration-200`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-lg">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.title}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(notification.timestamp)}
              </span>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
          
          {notification.action && (
            <div className="mt-2">
              <button
                onClick={() => notification.action.callback()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {!notification.read && (
            <button
              onClick={() => markAsRead(notification.id)}
              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              title="Marcar como lida"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => deleteNotification(notification.id)}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Excluir"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Configurações
        </h3>
        <button
          onClick={() => setShowSettings(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Som de Notificação
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tocar som quando receber notificação
            </p>
          </div>
          <button
            onClick={() => handleSettingsChange('sound', !settings.sound)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.sound ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.sound ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {settings.sound ? (
              <SpeakerWaveIcon className="absolute right-1 h-3 w-3 text-white" />
            ) : (
              <SpeakerXMarkIcon className="absolute left-1 h-3 w-3 text-gray-400" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notificações Desktop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mostrar notificações no sistema
            </p>
          </div>
          <button
            onClick={() => handleSettingsChange('desktop', !settings.desktop)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.desktop ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.desktop ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Auto-fechar (segundos)
          </label>
          <select
            value={settings.autoClose / 1000}
            onChange={(e) => handleSettingsChange('autoClose', parseInt(e.target.value) * 1000)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={3}>3 segundos</option>
            <option value={5}>5 segundos</option>
            <option value={10}>10 segundos</option>
            <option value={0}>Não fechar automaticamente</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Notificações
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Configurações"
                >
                  <CogIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>

          {/* Configurações */}
          {showSettings && renderSettings()}

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nenhuma notificação
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Você está em dia com suas notificações.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map(renderNotification)}
              </div>
            )}
          </div>

          {/* Rodapé */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAll}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Limpar todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
