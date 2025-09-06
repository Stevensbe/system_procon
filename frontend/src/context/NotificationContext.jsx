import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'sonner';

// Tipos de notificação
const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Ações do reducer
const NotificationActions = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
  MARK_AS_READ: 'MARK_AS_READ'
};

// Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0
};

// Reducer para gerenciar o estado
function notificationReducer(state, action) {
  switch (action.type) {
    case NotificationActions.ADD_NOTIFICATION:
      const newNotification = {
        id: Date.now() + Math.random(),
        ...action.payload,
        timestamp: new Date(),
        read: false
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case NotificationActions.REMOVE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length
      };
    
    case NotificationActions.MARK_AS_READ:
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, read: true }
          : notification
      );
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    
    case NotificationActions.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    
    default:
      return state;
  }
}

// Contexto de notificações
const NotificationContext = createContext();

// Hook personalizado para usar o contexto
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
}

// Provider do contexto
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Função para adicionar notificação
  const addNotification = (notification) => {
    dispatch({
      type: NotificationActions.ADD_NOTIFICATION,
      payload: notification
    });

    // Mostrar toast baseado no tipo
    const { type, title, message } = notification;
    
    switch (type) {
      case NotificationType.SUCCESS:
        toast.success(title || 'Sucesso!', {
          description: message
        });
        break;
      
      case NotificationType.ERROR:
        toast.error(title || 'Erro!', {
          description: message
        });
        break;
      
      case NotificationType.WARNING:
        toast.warning(title || 'Atenção!', {
          description: message
        });
        break;
      
      case NotificationType.INFO:
        toast.info(title || 'Informação', {
          description: message
        });
        break;
      
      default:
        toast(title || 'Notificação', {
          description: message
        });
    }
  };

  // Função para remover notificação
  const removeNotification = (id) => {
    dispatch({
      type: NotificationActions.REMOVE_NOTIFICATION,
      payload: id
    });
  };

  // Função para marcar como lida
  const markAsRead = (id) => {
    dispatch({
      type: NotificationActions.MARK_AS_READ,
      payload: id
    });
  };

  // Função para limpar todas as notificações
  const clearAll = () => {
    dispatch({
      type: NotificationActions.CLEAR_ALL
    });
  };

  // Funções de conveniência para diferentes tipos
  const success = (title, message) => {
    addNotification({
      type: NotificationType.SUCCESS,
      title,
      message
    });
  };

  const error = (title, message) => {
    addNotification({
      type: NotificationType.ERROR,
      title,
      message
    });
  };

  const warning = (title, message) => {
    addNotification({
      type: NotificationType.WARNING,
      title,
      message
    });
  };

  const info = (title, message) => {
    addNotification({
      type: NotificationType.INFO,
      title,
      message
    });
  };

  // Função para mostrar erro de API
  const showApiError = (error, defaultMessage = 'Erro na operação') => {
    const message = error?.response?.data?.detail || 
                   error?.response?.data?.message || 
                   error?.message || 
                   defaultMessage;
    
    error('Erro', message);
  };

  // Função para mostrar sucesso de operação
  const showSuccess = (message = 'Operação realizada com sucesso!') => {
    success('Sucesso!', message);
  };

  const value = {
    // Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    
    // Funções principais
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    
    // Funções de conveniência
    success,
    error,
    warning,
    info,
    showApiError,
    showSuccess,
    
    // Tipos
    NotificationType
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
