import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          {/* Ilustração 404 */}
          <div className="mb-8">
            <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold text-gray-400">404</span>
            </div>
          </div>

          {/* Título e Descrição */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Página não encontrada
            </h1>
            <p className="text-gray-600 mb-2">
              A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-sm text-gray-500">
              Verifique o endereço digitado ou use os links abaixo para navegar.
            </p>
          </div>

          {/* URL atual para debug */}
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500 mb-1">URL atual:</p>
            <code className="text-sm text-gray-700 break-all">
              {window.location.pathname}
            </code>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Voltar
            </button>
            
            <Link
              to="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🏠 Ir para o Dashboard
            </Link>
          </div>

          {/* Links Úteis */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Páginas úteis:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link 
                to="/fiscalizacao" 
                className="text-blue-600 hover:text-blue-500"
              >
                Fiscalização
              </Link>
              <Link 
                to="/relatorios" 
                className="text-blue-600 hover:text-blue-500"
              >
                Relatórios
              </Link>
              <Link 
                to="/fiscalizacao/bancos" 
                className="text-blue-600 hover:text-blue-500"
              >
                Autos de Banco
              </Link>
              <Link 
                to="/ajuda" 
                className="text-blue-600 hover:text-blue-500"
              >
                Ajuda
              </Link>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Precisa de ajuda?
              <br />
              <a 
                href="mailto:suporte@procon.am.gov.br" 
                className="text-blue-600 hover:text-blue-500"
              >
                suporte@procon.am.gov.br
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;