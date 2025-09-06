import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDevelopment = import.meta.env.DEV;

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Ícone de Erro */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Oops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
            </p>
          </div>

          {/* Detalhes do Erro (apenas em desenvolvimento) */}
          {isDevelopment && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Detalhes do Erro (Desenvolvimento):
              </h3>
              <pre className="text-xs text-red-700 overflow-auto max-h-32">
                {error?.message || 'Erro desconhecido'}
              </pre>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-3">
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tentar Novamente
              </button>
            )}
            
            <button
              onClick={handleReload}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Recarregar Página
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir para o Dashboard
            </button>
          </div>

          {/* Informações de Contato */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Se o problema persistir, entre em contato com o suporte técnico:
              <br />
              <a 
                href="mailto:suporte@procon.am.gov.br" 
                className="text-blue-600 hover:text-blue-500"
              >
                suporte@procon.am.gov.br
              </a>
            </p>
          </div>

          {/* Código do Erro */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Código do erro: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;