import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { multasService } from '../services/multasService';
import { formatCurrency, formatDate } from '../utils/formatters';
import MultaForm from '../components/MultaForm';
import MultasDashboard from '../components/multas/MultasDashboard';

export default function Multas() {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMulta, setSelectedMulta] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    loadMultas();
  }, []);

  const loadMultas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const data = await multasService.getMultas(params);
      setMultas(data.results || data);
    } catch (error) {
      console.error('Erro ao carregar multas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMultas();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    loadMultas();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendente': { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      'paga': { color: 'bg-green-100 text-green-800', text: 'Paga' },
      'vencida': { color: 'bg-red-100 text-red-800', text: 'Vencida' },
      'cancelada': { color: 'bg-gray-100 text-gray-800', text: 'Cancelada' }
    };
    
    const config = statusConfig[status] || statusConfig['pendente'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleViewDetails = (multa) => {
    setSelectedMulta(multa);
    setShowDetailsModal(true);
  };

  const handleMarcarComoPaga = async (id) => {
    try {
      await multasService.marcarComoPaga(id);
      loadMultas();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const handleCancelarMulta = async (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta multa?')) {
      try {
        await multasService.cancelarMulta(id);
        loadMultas();
      } catch (error) {
        console.error('Erro ao cancelar multa:', error);
      }
    }
  };

  const handleSaveMulta = () => {
    setShowCreateModal(false);
    loadMultas();
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-[#0c0f12] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Gestão de Multas</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors duration-300">
              Gerencie as multas aplicadas e acompanhe o status de pagamento
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              {showDashboard ? 'Ver Lista' : 'Ver Dashboard'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nova Multa
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
                  <div className="bg-white dark:bg-[#1a1d21] rounded-lg shadow-sm p-4 transition-colors duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por processo, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              >
                <option value="">Todos os Status</option>
                <option value="false">Pendente</option>
                <option value="true">Paga</option>
              </select>
              
              <button
                onClick={loadMultas}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard ou Tabela */}
      {showDashboard ? (
        <MultasDashboard />
      ) : (
        <>
          {/* Filtros e Busca */}
                     <div className="bg-white dark:bg-[#1a1d21] rounded-lg shadow-sm p-4 mb-6 transition-colors duration-300">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por processo, empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                >
                  <option value="">Todos os Status</option>
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="vencida">Vencida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                
                <button
                  onClick={loadMultas}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

                    {/* Tabela de Multas */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando multas...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {multas.map((multa) => (
                      <tr key={multa.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {multa.processo_info?.numero || multa.processo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {multa.empresa_info?.razao_social || multa.empresa}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(multa.valor)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(multa.data_vencimento)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(multa.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(multa)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalhes"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            
                            {multa.status === 'pendente' && (
                              <>
                                <button
                                  onClick={() => handleMarcarComoPaga(multa.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Marcar como paga"
                                >
                                  <DocumentArrowUpIcon className="w-5 h-5" />
                                </button>
                                
                                <button
                                  onClick={() => handleCancelarMulta(multa.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancelar multa"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            
                            {multa.status === 'vencida' && (
                              <button
                                onClick={() => handleMarcarComoPaga(multa.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Marcar como paga"
                              >
                                <DocumentArrowUpIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {multas.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma multa encontrada</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedMulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detalhes da Multa</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processo</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedMulta.processo_info?.numero || selectedMulta.processo}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedMulta.empresa_info?.razao_social || selectedMulta.empresa}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {formatCurrency(selectedMulta.valor)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMulta.status)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedMulta.data_emissao)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedMulta.data_vencimento)}
                  </p>
                </div>
              </div>
              
              {selectedMulta.observacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedMulta.observacoes}
                  </p>
                </div>
              )}
              
              {selectedMulta.comprovante_pagamento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comprovante de Pagamento</label>
                  <a
                    href={selectedMulta.comprovante_pagamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                    Ver comprovante
                  </a>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <MultaForm
          onSave={handleSaveMulta}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}