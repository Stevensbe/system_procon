import React, { useState, useEffect } from 'react';
import { 
  DocumentChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const RelatoriosPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fiscalizacao');
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: 'TODOS',
    status: 'TODOS',
    departamento: 'TODOS'
  });

  const [relatorios, setRelatorios] = useState({
    fiscalizacao: {
      total: 1247,
      emAndamento: 892,
      concluidos: 355,
      porTipo: [
        { tipo: 'Bancos', quantidade: 156, percentual: 12.5 },
        { tipo: 'Supermercados', quantidade: 234, percentual: 18.8 },
        { tipo: 'Postos', quantidade: 89, percentual: 7.1 },
        { tipo: 'Telefonia', quantidade: 67, percentual: 5.4 },
        { tipo: 'Outros', quantidade: 701, percentual: 56.2 }
      ]
    },
    financeiro: {
      arrecadacaoTotal: 15800000,
      arrecadacaoMes: 1250000,
      multasPagas: 423,
      multasPendentes: 144,
      porMes: [
        { mes: 'Jan', valor: 1200000 },
        { mes: 'Fev', valor: 1350000 },
        { mes: 'Mar', valor: 1100000 },
        { mes: 'Abr', valor: 1400000 },
        { mes: 'Mai', valor: 1250000 },
        { mes: 'Jun', valor: 1300000 }
      ]
    },
    denuncias: {
      total: 234,
      atendidas: 189,
      pendentes: 45,
      porCategoria: [
        { categoria: 'Bancos', quantidade: 45, percentual: 19.2 },
        { categoria: 'Telefonia', quantidade: 38, percentual: 16.2 },
        { categoria: 'Energia', quantidade: 32, percentual: 13.7 },
        { categoria: 'Transporte', quantidade: 28, percentual: 12.0 },
        { categoria: 'Outros', quantidade: 91, percentual: 38.9 }
      ]
    }
  });

  useEffect(() => {
    loadRelatorios();
  }, [filtros]);

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Relatórios carregados com filtros:', filtros);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = async (tipo, formato) => {
    try {
    setLoading(true);
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.${formato}`;
      link.click();
      
      alert(`Relatório ${tipo} exportado com sucesso em formato ${formato.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-300">Gere relatórios e análises do sistema</p>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
            </div>
            
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Início
            </label>
            <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
              />
            </div>
            
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Fim
            </label>
            <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
              />
            </div>
            
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="FISCALIZACAO">Fiscalização</option>
              <option value="MULTAS">Multas</option>
              <option value="DENUNCIAS">Denúncias</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departamento
            </label>
            <select
              value={filtros.departamento}
              onChange={(e) => setFiltros({...filtros, departamento: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            >
              <option value="TODOS">Todos os Departamentos</option>
              <option value="FISCALIZACAO">Fiscalização</option>
              <option value="JURIDICO">Jurídico</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
            </select>
          </div>
            </div>
          </div>

      {/* Tabs de Relatórios */}
      <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'fiscalizacao', label: 'Fiscalização', icon: BuildingOfficeIcon },
              { id: 'financeiro', label: 'Financeiro', icon: CurrencyDollarIcon },
              { id: 'denuncias', label: 'Denúncias', icon: UserGroupIcon },
              { id: 'executivo', label: 'Executivo', icon: ChartBarIcon }
            ].map(tab => {
              const Icon = tab.icon;
          return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
          );
        })}
          </nav>
        </div>

        <div className="p-6">
          {/* Relatório de Fiscalização */}
          {activeTab === 'fiscalizacao' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relatório de Fiscalização</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportarRelatorio('fiscalizacao', 'pdf')}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportarRelatorio('fiscalizacao', 'xlsx')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Excel
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Fiscalizações</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                        {formatNumber(relatorios.fiscalizacao.total)}
                      </p>
                    </div>
                  </div>
      </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Em Andamento</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                        {formatNumber(relatorios.fiscalizacao.emAndamento)}
                      </p>
                    </div>
            </div>
            </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <DocumentChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Concluídos</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                        {formatNumber(relatorios.fiscalizacao.concluidos)}
                    </p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Detalhamento por Tipo */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fiscalizações por Tipo</h4>
                <div className="space-y-3">
                  {relatorios.fiscalizacao.porTipo.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300">{item.tipo}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(item.quantidade)} ({item.percentual}%)
                    </span>
                        <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${item.percentual}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Relatório Financeiro */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relatório Financeiro</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportarRelatorio('financeiro', 'pdf')}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportarRelatorio('financeiro', 'xlsx')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Excel
                  </button>
                </div>
              </div>

              {/* KPIs Financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Arrecadação Total</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-200">
                        {formatCurrency(relatorios.financeiro.arrecadacaoTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Arrecadação Mensal</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                        {formatCurrency(relatorios.financeiro.arrecadacaoMes)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <DocumentChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Multas Pagas</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-200">
                        {formatNumber(relatorios.financeiro.multasPagas)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Multas Pendentes</p>
                      <p className="text-xl font-bold text-red-900 dark:text-red-200">
                        {formatNumber(relatorios.financeiro.multasPendentes)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Arrecadação Mensal */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Arrecadação Mensal</h4>
                <div className="space-y-3">
                  {relatorios.financeiro.porMes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.mes}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.valor)}
                        </span>
                        <div className="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full" 
                            style={{ width: `${(item.valor / 1400000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Relatório de Denúncias */}
          {activeTab === 'denuncias' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relatório de Denúncias</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportarRelatorio('denuncias', 'pdf')}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportarRelatorio('denuncias', 'xlsx')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Excel
                  </button>
                </div>
              </div>

              {/* KPIs de Denúncias */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total de Denúncias</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                        {formatNumber(relatorios.denuncias.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <DocumentChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Atendidas</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                        {formatNumber(relatorios.denuncias.atendidas)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                        {formatNumber(relatorios.denuncias.pendentes)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Denúncias por Categoria */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Denúncias por Categoria</h4>
                <div className="space-y-3">
                  {relatorios.denuncias.porCategoria.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                        <span className="text-gray-700 dark:text-gray-300">{item.categoria}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(item.quantidade)} ({item.percentual}%)
                        </span>
                        <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${item.percentual}%` }}
                          ></div>
                        </div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          )}

          {/* Relatório Executivo */}
          {activeTab === 'executivo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relatório Executivo</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportarRelatorio('executivo', 'pdf')}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => exportarRelatorio('executivo', 'xlsx')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Excel
                  </button>
                </div>
              </div>

              {/* Resumo Executivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Resumo Geral</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Fiscalizações:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {formatNumber(relatorios.fiscalizacao.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Arrecadação Total:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {formatCurrency(relatorios.financeiro.arrecadacaoTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Denúncias:</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {formatNumber(relatorios.denuncias.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">Taxa de Efetividade</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Fiscalizações Concluídas:</span>
                      <span className="font-semibold text-green-900 dark:text-green-200">
                        {((relatorios.fiscalizacao.concluidos / relatorios.fiscalizacao.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Denúncias Atendidas:</span>
                      <span className="font-semibold text-green-900 dark:text-green-200">
                        {((relatorios.denuncias.atendidas / relatorios.denuncias.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Multas Pagas:</span>
                      <span className="font-semibold text-green-900 dark:text-green-200">
                        {((relatorios.financeiro.multasPagas / (relatorios.financeiro.multasPagas + relatorios.financeiro.multasPendentes)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;
