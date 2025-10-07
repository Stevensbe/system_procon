import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { get, post } = useApi();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        
        // Buscar notificações do usuário
        const response = await get('/api/notifications/');
        
        if (response.data) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unread_count || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        
        // Fallback com dados mockados
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
    
    // Atualizar notificações a cada 15 segundos
    const interval = setInterval(fetchNotifications, 15000);
    
    return () => clearInterval(interval);
  }, [get]);

  const markAsRead = async (notificationId) => {
    try {
      await post(`/api/notifications/${notificationId}/mark-read/`);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await post('/api/notifications/mark-all-read/');
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await post(`/api/notifications/${notificationId}/delete/`);
      
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      // Ajustar contador se a notificação não estava lida
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const clearAll = async () => {
    try {
      await post('/api/notifications/clear-all/');
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
};


export const useNotification = useNotifications;
export default useNotifications;

