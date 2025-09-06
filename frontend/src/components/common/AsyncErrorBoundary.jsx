import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const AsyncErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Erro ao carregar conteúdo
          </h3>
          <p className="mt-2 text-sm text-red-700">
            {error?.message || 'Ocorreu um erro inesperado ao processar esta seção.'}
          </p>
          <div className="mt-4">
            <button
              onClick={resetErrorBoundary}
              className="bg-red-100 hover:bg-red-200 text-red-800 text-sm px-3 py-1 rounded border border-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Boundary para componentes assíncronos específicos
 * Permite recuperação granular sem quebrar toda a aplicação
 */
const AsyncErrorBoundary = ({ children, fallback }) => {
  return (
    <ErrorBoundary
      FallbackComponent={fallback || AsyncErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Async component error:', error, errorInfo);
        
        // Log específico para erros assíncronos
        if (import.meta.env.PROD) {
          fetch('/api/errors/async/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'async_component_error',
              message: error.message,
              stack: error.stack,
              component: errorInfo?.componentStack,
              timestamp: new Date().toISOString()
            })
          }).catch(console.error);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AsyncErrorBoundary;