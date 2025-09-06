import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  InboxIcon,
  UserIcon,
  BuildingOfficeIcon,
  BellIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/formatters';

const CaixaEntrada = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pessoal');
  const [estatisticas, setEstatisticas] = useState({
    pessoal: { total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 },
    setor: { total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 },
    notificados: { total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 }
  });

  useEffect(() => {
    // Determinar aba ativa baseada na URL
    if (location.pathname.includes('/pessoal')) {
      setActiveTab('pessoal');
    } else if (location.pathname.includes('/setor')) {
      setActiveTab('setor');
    } else if (location.pathname.includes('/notificados')) {
      setActiveTab('notificados');
    }
    
    carregarEstatisticas();
  }, [location.pathname]);

  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      // Simular carregamento das estatísticas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEstatisticas({
        pessoal: { total: 12, naoLidos: 3, urgentes: 2, atrasados: 1 },
        setor: { total: 45, naoLidos: 8, urgentes: 5, atrasados: 3 },
        notificados: { total: 7, naoLidos: 2, urgentes: 1, atrasados: 0 }
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'pessoal',
      name: 'Caixa Pessoal',
      icon: UserIcon,
      path: '/caixa-entrada/pessoal',
      description: 'Documentos destinados diretamente a você',
      stats: estatisticas.pessoal
    },
    {
      id: 'setor',
      name: 'Caixa Setor',
      icon: BuildingOfficeIcon,
      path: '/caixa-entrada/setor',
      description: 'Documentos do seu setor e setores com acesso',
      stats: estatisticas.setor
    },
    {
      id: 'notificados',
      name: 'Notificados DTE',
      icon: BellIcon,
      path: '/caixa-entrada/notificados',
      description: 'Documentos notificados no DTE',
      stats: estatisticas.notificados
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <InboxIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Caixa de Entrada
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sistema de gestão de documentos - similar ao SIGED
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={carregarEstatisticas}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                  {tab.stats.naoLidos > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {tab.stats.naoLidos}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <div
                key={tab.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className={`text-lg font-medium ${
                        isActive
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {tab.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tab.stats.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {tab.stats.naoLidos}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Não Lidos
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {tab.stats.urgentes}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Urgentes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {tab.stats.atrasados}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Atrasados
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium mb-2">
                Selecione uma caixa para visualizar os documentos
              </h3>
              <p className="text-sm">
                Use as abas acima para navegar entre as diferentes caixas de entrada
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaEntrada;
