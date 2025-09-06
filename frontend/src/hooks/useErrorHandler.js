import { useCallback } from 'react';

/**
 * Hook personalizado para tratamento de erros
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error, context = {}) => {
    console.error('Error handled:', error, context);
    
    // Log estruturado do erro
    const errorData = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Em produção, enviar para serviço de monitoramento
    if (import.meta.env.PROD) {
      try {
        fetch('/api/errors/client/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData)
        }).catch(console.error);
      } catch (e) {
        console.error('Failed to report error:', e);
      }
    }
    
    return errorData;
  }, []);
  
  const handleAsyncError = useCallback(async (asyncFn, context = {}) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, { ...context, type: 'async' });
      throw error; // Re-throw para que o componente possa lidar com o erro
    }
  }, [handleError]);
  
  return {
    handleError,
    handleAsyncError
  };
};