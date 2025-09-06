import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function FiscalizacaoHomePage() {
  const [stats, setStats] = useState({
    bancos: { total: 0, loading: true },
    supermercados: { total: 0, loading: true },
    postos: { total: 0, loading: true },
    diversos: { total: 0, loading: true },
    infracoes: { total: 0, loading: true } // 🔥 ADICIONADO
  });

  useEffect(() => {
    // Simular carregamento de estatísticas
    // Em uma aplicação real, você faria chamadas para a API aqui
    setTimeout(() => {
      setStats({
        bancos: { total: 25, loading: false },
        supermercados: { total: 18, loading: false },
        postos: { total: 12, loading: false },
        diversos: { total: 8, loading: false },
        infracoes: { total: 7, loading: false } // 🔥 ADICIONADO
      });
    }, 1000);
  }, []);

  const autoTypes = [
    {
      id: 'bancos',
      title: 'Autos de Banco',
      description: 'Lei das Filas - Instituições Bancárias',
      icon: '🏦',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      hoverColor: 'hover:bg-blue-100',
      listPath: '/fiscalizacao/bancos',
      createPath: '/fiscalizacao/bancos/novo',
      stats: stats.bancos
    },
    {
      id: 'supermercados',
      title: 'Autos de Supermercado',
      description: 'Fiscalização de Supermercados e Comércios',
      icon: '🛒',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      hoverColor: 'hover:bg-green-100',
      listPath: '/fiscalizacao/supermercados',
      createPath: '/fiscalizacao/supermercados/novo',
      stats: stats.supermercados
    },
    {
      id: 'postos',
      title: 'Autos de Posto',
      description: 'Postos de Combustível e Derivados',
      icon: '⛽',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      hoverColor: 'hover:bg-orange-100',
      listPath: '/fiscalizacao/postos',
      createPath: '/fiscalizacao/postos/novo',
      stats: stats.postos
    },
    {
      id: 'diversos',
      title: 'Autos Diversos',
      description: 'Legislação Diversa e Outras Irregularidades',
      icon: '📋',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      hoverColor: 'hover:bg-purple-100',
      listPath: '/fiscalizacao/diversos',
      createPath: '/fiscalizacao/diversos/novo',
      stats: stats.diversos
    },
    // 🔥 CARD DE INFRAÇÕES ADICIONADO
    {
      id: 'infracoes',
      title: 'Autos de Infração',
      description: 'Autuações e Processos Administrativos',
      icon: '⚖️',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      hoverColor: 'hover:bg-red-100',
      listPath: '/fiscalizacao/infracoes',
      createPath: '/fiscalizacao/infracoes/novo', // Rota corrigida
      stats: stats.infracoes
    }
  ];

  const totalAutos = Object.values(stats).reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Fiscalização</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todos os autos de constatação e infrações do PROCON Amazonas
        </p>
        {/* 🔥 INFORMAÇÃO SOBRE INFRAÇÕES ADICIONADA */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            <strong>🆕 Novo:</strong> Agora você pode criar e gerenciar Autos de Infração diretamente no sistema!
          </p>
        </div>
      </div>

      {/* ESTATÍSTICAS GERAIS - ATUALIZADA PARA 6 COLUNAS */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Resumo Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalAutos}</div>
            <div className="text-sm text-gray-600">Total de Autos</div>
          </div>
          {autoTypes.map((type) => (
            <div key={type.id} className={`text-center p-4 ${type.bgColor} rounded-lg border ${type.borderColor}`}>
              <div className={`text-2xl font-bold ${type.textColor}`}>
                {type.stats.loading ? '...' : type.stats.total}
              </div>
              <div className={`text-sm ${type.textColor}`}>{type.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CARDS DOS TIPOS DE AUTO - AGORA COM GRID RESPONSIVO PARA 5 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {autoTypes.map((type) => (
          <div 
            key={type.id} 
            className={`${type.bgColor} border ${type.borderColor} rounded-lg p-6 transition-colors duration-200 ${type.hoverColor}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{type.icon}</span>
                <div>
                  <h3 className={`text-lg font-semibold ${type.textColor}`}>
                    {type.title}
                  </h3>
                  <p className={`text-sm ${type.textColor} opacity-80`}>
                    {type.description}
                  </p>
                </div>
              </div>
              <div className={`text-right`}>
                <div className={`text-xl font-bold ${type.textColor}`}>
                  {type.stats.loading ? '...' : type.stats.total}
                </div>
                <div className={`text-xs ${type.textColor} opacity-70`}>
                  registros
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={type.listPath}
                className={`flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-center text-sm font-medium transition-colors duration-200`}
              >
                📋 Ver Lista
              </Link>
              <Link
                to={type.createPath}
                className={`flex-1 px-4 py-2 bg-${type.color}-600 text-white rounded hover:bg-${type.color}-700 text-center text-sm font-medium transition-colors duration-200`}
              >
                ➕ Criar Novo
              </Link>
            </div>

            {/* INFORMAÇÕES ADICIONAIS */}
            <div className={`mt-4 pt-4 border-t ${type.borderColor}`}>
              <div className="text-xs space-y-1">
                {type.id === 'bancos' && (
                  <>
                    <div className={`${type.textColor} opacity-70`}>
                      • Lei das Filas (Lei nº 5.867/2022)
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Atendimento bancário e caixas
                    </div>
                  </>
                )}
                {type.id === 'supermercados' && (
                  <>
                    <div className={`${type.textColor} opacity-70`}>
                      • Produtos vencidos e irregulares
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Preços e publicidade enganosa
                    </div>
                  </>
                )}
                {type.id === 'postos' && (
                  <>
                    <div className={`${type.textColor} opacity-70`}>
                      • Preços de combustíveis
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Notas fiscais e cupons
                    </div>
                  </>
                )}
                {type.id === 'diversos' && (
                  <>
                    <div className={`${type.textColor} opacity-70`}>
                      • Lei de afixação de preços
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Advertências e medidas disciplinares
                    </div>
                  </>
                )}
                {/* 🔥 INFORMAÇÕES ESPECÍFICAS DE INFRAÇÕES */}
                {type.id === 'infracoes' && (
                  <>
                    <div className={`${type.textColor} opacity-70`}>
                      • Autuações por infrações ao CDC
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Multas e processos administrativos
                    </div>
                    <div className={`${type.textColor} opacity-70`}>
                      • Decreto nº 43.614/2021
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            to="/relatorios"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">📊</span>
            <div>
              <div className="font-medium">Relatórios</div>
              <div className="text-sm text-gray-600">Gerar relatórios</div>
            </div>
          </Link>
          
          <Link 
            to="/exportar"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">💾</span>
            <div>
              <div className="font-medium">Exportar</div>
              <div className="text-sm text-gray-600">Exportar dados</div>
            </div>
          </Link>
          
          <Link 
            to="/configuracoes"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">⚙️</span>
            <div>
              <div className="font-medium">Configurações</div>
              <div className="text-sm text-gray-600">Configurar sistema</div>
            </div>
          </Link>
          
          <Link 
            to="/ajuda"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-2xl mr-3">❓</span>
            <div>
              <div className="font-medium">Ajuda</div>
              <div className="text-sm text-gray-600">Documentação</div>
            </div>
          </Link>
        </div>
      </div>

      {/* INFORMAÇÕES DO SISTEMA - ATUALIZADA */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-8">
        <div className="flex items-start">
          <span className="text-blue-400 text-xl mr-3">ℹ️</span>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Sistema de Fiscalização PROCON-AM</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Versão:</strong> 2.1 - Sistema Integrado com Autos de Infração</p>
              <p>• <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p>• <strong>Suporte:</strong> Departamento de Tecnologia da Informação</p>
              <p>• <strong>Funcionalidades:</strong> Criação, edição, visualização, autuação e geração de documentos</p>
              <p>• <strong>🆕 Novo:</strong> Módulo de Infrações integrado com assinaturas opcionais</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiscalizacaoHomePage;