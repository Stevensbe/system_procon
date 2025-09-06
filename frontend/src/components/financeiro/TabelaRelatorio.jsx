import React, { useState, useEffect } from 'react';

const TabelaRelatorio = ({ 
  dados = [], 
  empresas = [], 
  isLoading = false,
  onFilter,
  filtros = {},
  totalRegistros = 0,
  paginacao = {},
  onPageChange,
  onExportar
}) => {
  const [filtrosLocais, setFiltrosLocais] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    empresa: '',
    search: '',
    ...filtros
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleFiltroChange = (campo, valor) => {
    const novosFiltros = { ...filtrosLocais, [campo]: valor };
    setFiltrosLocais(novosFiltros);
  };

  const aplicarFiltros = () => {
    onFilter(filtrosLocais);
  };

  const limparFiltros = () => {
    const filtrosVazios = {
      data_inicio: '',
      data_fim: '',
      status: '',
      empresa: '',
      search: ''
    };
    setFiltrosLocais(filtrosVazios);
    onFilter(filtrosVazios);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'paga': 'bg-green-100 text-green-800',
      'pendente': 'bg-yellow-100 text-yellow-800',
      'vencida': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'paga': 'Paga',
      'pendente': 'Pendente',
      'vencida': 'Vencida'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-table text-purple-500 mr-2"></i>
          Relatório Detalhado de Multas
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExportar}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <i className="fas fa-download mr-2"></i>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filtrosLocais.data_inicio}
              onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filtrosLocais.data_fim}
              onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtrosLocais.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos os status</option>
              <option value="paga">Paga</option>
              <option value="pendente">Pendente</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              value={filtrosLocais.empresa}
              onChange={(e) => handleFiltroChange('empresa', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razao_social}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar (empresa, CNPJ ou nº processo)
            </label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={filtrosLocais.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={aplicarFiltros}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i className="fas fa-search mr-2"></i>
              Filtrar
            </button>
            <button
              onClick={limparFiltros}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i className="fas fa-times mr-2"></i>
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Emissão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Processo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dados.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-lg">Nenhuma multa encontrada</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Tente ajustar os filtros de busca ou verificar se há dados cadastrados.
                  </p>
                </td>
              </tr>
            ) : (
              Array.isArray(dados) ? dados.map((multa) => (
                <tr key={multa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{multa.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {multa.empresa?.razao_social}
                    </div>
                    <div className="text-sm text-gray-500">
                      {multa.empresa?.cnpj}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(multa.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(multa.data_emissao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(multa.data_vencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(multa.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {multa.processo?.numero || '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
                      <p>Erro ao carregar dados. Dados inválidos recebidos.</p>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação e Resumo */}
      {Array.isArray(dados) && dados.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Mostrando {dados.length} de {totalRegistros} registros
          </div>
          
          {paginacao && (paginacao.previous || paginacao.next) && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange('previous')}
                disabled={!paginacao.previous}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Anterior
              </button>
              <button
                onClick={() => onPageChange('next')}
                disabled={!paginacao.next}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <i className="fas fa-chevron-right ml-2"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabelaRelatorio;