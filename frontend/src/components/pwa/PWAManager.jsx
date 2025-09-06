import React, { useState, useEffect } from 'react';
import { 
  DevicePhoneMobileIcon,
  WifiIcon,
  WifiSlashIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowPathIcon,
  TrashIcon,
  BellIcon,
  BellSlashIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { usePWA } from '../../utils/pwa';

const PWAManager = () => {
  const { 
    pwaInfo, 
    isLoading, 
    install, 
    update, 
    requestNotificationPermission, 
    clearCache,
    storeOfflineData,
    syncOfflineData 
  } = usePWA();

  const [showDetails, setShowDetails] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Verificar permissão de notificação
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await update();
    } catch (error) {
      console.error('Erro ao atualizar PWA:', error);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationPermission('granted');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  const handleSyncOfflineData = async () => {
    try {
      await syncOfflineData();
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'offline':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'installed':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <WifiIcon className="h-4 w-4" />;
      case 'offline':
        return <WifiSlashIcon className="h-4 w-4" />;
      case 'installed':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      default:
        return <CogIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                PWA Manager
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerenciar funcionalidades do aplicativo
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CogIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status Principal */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Status Online/Offline */}
          <div className={`p-3 rounded-lg border ${getStatusColor(pwaInfo.isOnline ? 'online' : 'offline')}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(pwaInfo.isOnline ? 'online' : 'offline')}
              <span className="text-sm font-medium">
                {pwaInfo.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Status Instalação */}
          <div className={`p-3 rounded-lg border ${getStatusColor(pwaInfo.isInstalled ? 'installed' : 'default')}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(pwaInfo.isInstalled ? 'installed' : 'default')}
              <span className="text-sm font-medium">
                {pwaInfo.isInstalled ? 'Instalado' : 'Não Instalado'}
              </span>
            </div>
          </div>
        </div>

        {/* Dados Offline */}
        {pwaInfo.offlineDataCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CloudArrowDownIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  {pwaInfo.offlineDataCount} item(s) aguardando sincronização
                </span>
              </div>
              <button
                onClick={handleSyncOfflineData}
                disabled={isLoading}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              >
                Sincronizar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Ações Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instalar PWA */}
            {pwaInfo.canInstall && !pwaInfo.isInstalled && (
              <button
                onClick={handleInstall}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span>Instalar App</span>
              </button>
            )}

            {/* Atualizar PWA */}
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Verificar Atualizações</span>
            </button>

            {/* Notificações */}
            {notificationPermission === 'default' && (
              <button
                onClick={handleRequestNotificationPermission}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <BellIcon className="h-4 w-4" />
                <span>Ativar Notificações</span>
              </button>
            )}

            {/* Limpar Cache */}
            <button
              onClick={handleClearCache}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Limpar Cache</span>
            </button>
          </div>

          {/* Informações Detalhadas */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Informações do Sistema
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Service Worker:</span>
                <span className={`ml-2 ${pwaInfo.hasServiceWorker ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {pwaInfo.hasServiceWorker ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Notificações:</span>
                <span className={`ml-2 ${
                  notificationPermission === 'granted' ? 'text-green-600 dark:text-green-400' :
                  notificationPermission === 'denied' ? 'text-red-600 dark:text-red-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {notificationPermission === 'granted' ? 'Ativadas' :
                   notificationPermission === 'denied' ? 'Negadas' : 'Pendentes'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Dados Offline:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {pwaInfo.offlineDataCount} item(s)
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Pode Instalar:</span>
                <span className={`ml-2 ${pwaInfo.canInstall ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {pwaInfo.canInstall ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>

          {/* Status de Sincronização */}
          {pwaInfo.offlineDataCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CloudArrowUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Sincronização Offline
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {pwaInfo.offlineDataCount} item(s) serão sincronizados quando a conexão for restaurada
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSyncOfflineData}
                  disabled={isLoading || !pwaInfo.isOnline}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sincronizando...' : 'Sincronizar Agora'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default PWAManager;
