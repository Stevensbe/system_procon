import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback';

// Função para capturar e reportar erros
const logError = (error, errorInfo) => {
  console.error('Error captured by boundary:', error, errorInfo);
  
  // Em produção, enviar para serviço de monitoramento
  if (import.meta.env.PROD) {
    // Aqui você pode integrar com Sentry, LogRocket, etc.
    // Exemplo com fetch para seu backend
    try {
      fetch('/api/errors/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          errorInfo: errorInfo
        })
      }).catch(console.error);
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }
};

const GlobalErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Limpar estado de erro e tentar recuperar
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorBoundary;