import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function FiscalizacaoHomePage() {
  const [stats, setStats] = useState({
    bancos: { total: 0, loading: true },
    supermercados: { total: 0, loading: true },
    postos: { total: 0, loading: true },
    diversos: { total: 0, loading: true },
    infracoes: { total: 0, loading: true }
  });

  useEffect(() => {
    // No futuro, faremos chamadas à API aqui para buscar os totais
    setTimeout(() => {
      setStats({
        bancos: { total: 25, loading: false },
        supermercados: { total: 18, loading: false },
        postos: { total: 12, loading: false },
        diversos: { total: 8, loading: false },
        infracoes: { total: 5, loading: false }
      });
    }, 1000);
  }, []);

  const autoTypes = [
    {
      id: 'bancos',
      title: 'Autos de Banco',
      description: 'Fiscalizações em agências bancárias e instituições financeiras',
      icon: '🏦',
      color: 'blue',
      listPath: '/fiscalizacao/bancos',
      createPath: '/fiscalizacao/bancos/novo', // Rota corrigida
      stats: stats.bancos
    },
    {
      id: 'supermercados',
      title: 'Autos de Supermercado', 
      description: 'Fiscalizações em supermercados e estabelecimentos de varejo alimentício',
      icon: '🛒',
      color: 'green',
      listPath: '/fiscalizacao/supermercados',
      createPath: '/fiscalizacao/supermercados/novo', // Rota corrigida
      stats: stats.supermercados
    },
    {
      id: 'postos',
      title: 'Autos de Posto',
      description: 'Fiscalizações em postos de combustível e derivados',
      icon: '⛽',
      color: 'orange',
      listPath: '/fiscalizacao/postos', 
      createPath: '/fiscalizacao/postos/novo', // Rota corrigida
      stats: stats.postos
    },
    {
      id: 'diversos',
      title: 'Autos Diversos',
      description: 'Fiscalizações em outros tipos de estabelecimentos comerciais',
      icon: '🏪',
      color: 'purple',
      listPath: '/fiscalizacao/diversos',
      createPath: '/fiscalizacao/diversos/novo',
      stats: stats.diversos
    },
    {
      id: 'infracoes',
      title: 'Autos de Infração',
      description: 'Autuações e processos administrativos por infrações ao CDC',
      icon: '⚖️',
      color: 'red',
      listPath: '/fiscalizacao/infracoes',
      createPath: '/fiscalizacao/infracoes/novo', // Rota corrigida
      stats: stats.infracoes
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        accent: 'text-blue-600 dark:text-blue-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800', 
        text: 'text-green-700 dark:text-green-300',
        button: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
        accent: 'text-green-600 dark:text-green-400'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-700 dark:text-orange-300', 
        button: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600',
        accent: 'text-orange-600 dark:text-orange-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        button: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600', 
        accent: 'text-purple-600 dark:text-purple-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        accent: 'text-red-600 dark:text-red-400'
      }
    };
    return colors[color] || colors.blue;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0f12] p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors duration-300">
            📋 Sistema de Fiscalização
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg transition-colors duration-300">
            Gerencie todos os autos de constatação e infrações do PROCON Amazonas
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors duration-300">
            <p className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-300">
              <strong>💡 Dica:</strong> Escolha o tipo de auto correspondente ao estabelecimento fiscalizado. 
              Para autuações, use "Autos de Infração".
            </p>
          </div>
        </div>
        
        {/* Cards para cada tipo de auto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {autoTypes.map((type) => {
            const colorClasses = getColorClasses(type.color);
            
            return (
              <div 
                key={type.id} 
                className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <h3 className={`text-xl font-bold ${colorClasses.text} transition-colors duration-300`}>
                        {type.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="text-right">
                    {type.stats.loading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ) : (
                      <div>
                        <div className={`text-2xl font-bold ${colorClasses.accent} transition-colors duration-300`}>
                          {type.stats.total}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide transition-colors duration-300">
                          Total
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Descrição */}
                <p className={`${colorClasses.text} text-sm mb-6 leading-relaxed transition-colors duration-300`}>
                  {type.description}
                </p>
                
                {/* Botões de Ação */}
                <div className="flex gap-3">
                  <Link 
                    to={type.listPath} 
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-center rounded-lg font-medium border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    📋 Ver Lista
                  </Link>
                  <Link 
                    to={type.createPath} 
                    className={`flex-1 px-4 py-3 ${colorClasses.button} text-white text-center rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg`}
                  >
                    ➕ Criar Novo
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seção de Ações Rápidas */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            ⚡ Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/fiscalizacao/relatorios"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-gray-900">Relatórios</div>
                <div className="text-sm text-gray-500">Gerar relatórios consolidados</div>
              </div>
            </Link>
            
            <Link 
              to="/fiscalizacao/buscar"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
            >
              <span className="text-2xl">🔍</span>
              <div>
                <div className="font-medium text-gray-900">Buscar Auto</div>
                <div className="text-sm text-gray-500">Localizar auto por CNPJ/número</div>
              </div>
            </Link>
            
            <Link 
              to="/fiscalizacao/estatisticas"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            >
              <span className="text-2xl">📈</span>
              <div>
                <div className="font-medium text-gray-900">Estatísticas</div>
                <div className="text-sm text-gray-500">Dashboard com métricas</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Informações Legais */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚖️</span>
            <div className="text-sm text-gray-600">
              <strong>Base Legal:</strong> Sistema baseado na Lei Federal nº 8.078/90 (Código de Defesa do Consumidor), 
              Decreto Estadual nº 43.614/2021 (Processo Administrativo) e demais normas aplicáveis ao PROCON Amazonas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiscalizacaoHomePage;
