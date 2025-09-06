import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import tramitacaoService from '../../services/tramitacaoService';
import { toast } from 'react-hot-toast';

const TramitacaoList = () => {
  const [tramitacoes, setTramitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: '',
    setor_origem: '',
    setor_destino: '',
    data_inicio: '',
    data_fim: '',
    busca: ''
  });
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    por_pagina: 20,
    total: 0
  });
  const [selecionados, setSelecionados] = useState([]);
  const [setores, setSetores] = useState([]);

  useEffect(() => {
    carregarDados();
    carregarSetores();
  }, [paginacao.pagina, filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await tramitacaoService.listarTramitacoes({
        ...filtros,
        pagina: paginacao.pagina,
        por_pagina: paginacao.por_pagina
      });
      
      setTramitacoes(response.results || response);
      setPaginacao(prev => ({
        ...prev,
        total: response.count || response.length
      }));
    } catch (error) {
      console.error('Erro ao carregar tramitações:', error);
      toast.error('Erro ao carregar tramitações');
    } finally {
      setLoading(false);
    }
  };

  const carregarSetores = async () => {
    try {
      const setoresData = await tramitacaoService.listarSetores();
      setSetores(setoresData);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      setor_origem: '',
      setor_destino: '',
      data_inicio: '',
      data_fim: '',
      busca: ''
    });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  const handleSelecao = (id) => {
    setSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelecaoTodos = () => {
    if (selecionados.length === tramitacoes.length) {
      setSelecionados([]);
    } else {
      setSelecionados(tramitacoes.map(t => t.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-50';
      case 'ENVIADA': return 'text-blue-600 bg-blue-50';
      case 'RECEBIDA': return 'text-green-600 bg-green-50';
      case 'ATRASADA': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDENTE': return <ClockIcon className="w-4 h-4" />;
      case 'ENVIADA': return <DocumentArrowUpIcon className="w-4 h-4" />;
      case 'RECEBIDA': return <CheckCircleIcon className="w-4 h-4" />;
      case 'ATRASADA': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <DocumentArrowDownIcon className="w-4 h-4" />;
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDiasAtraso = (dataLimite) => {
    if (!dataLimite) return 0;
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diffTime = hoje - limite;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalPaginas = Math.ceil(paginacao.total / paginacao.por_pagina);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tramitações</h1>
              <p className="text-gray-600 mt-2">Gerencie todas as tramitações do sistema</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={carregarDados}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Atualizar
              </button>
              <Link
                to="/tramitacao/nova"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Nova Tramitação
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por protocolo, assunto, setor..."
                  value={filtros.busca}
                  onChange={(e) => handleFiltroChange('busca', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <select
                value={filtros.status}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ENVIADA">Enviada</option>
                <option value="RECEBIDA">Recebida</option>
                <option value="ATRASADA">Atrasada</option>
              </select>
            </div>

            {/* Setor Origem */}
            <div>
              <select
                value={filtros.setor_origem}
                onChange={(e) => handleFiltroChange('setor_origem', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os setores origem</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>{setor.nome}</option>
                ))}
              </select>
            </div>

            {/* Setor Destino */}
            <div>
              <select
                value={filtros.setor_destino}
                onChange={(e) => handleFiltroChange('setor_destino', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os setores destino</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>{setor.nome}</option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Data Fim */}
            <div>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button
                onClick={limparFiltros}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Ações em lote */}
        {selecionados.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selecionados.length} tramitação(ões) selecionada(s)
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Marcar como Recebida
                </button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selecionados.length === tramitacoes.length && tramitacoes.length > 0}
                      onChange={handleSelecaoTodos}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origem → Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Tramitação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prazo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tramitacoes.map((tramitacao) => (
                  <tr key={tramitacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(tramitacao.id)}
                        onChange={() => handleSelecao(tramitacao.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tramitacao.protocolo?.numero_protocolo || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {tramitacao.protocolo?.assunto || 'Assunto não informado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tramitacao.status)}`}>
                        {getStatusIcon(tramitacao.status)}
                        {tramitacao.status}
                      </span>
                      {tramitacao.prazo_limite && calcularDiasAtraso(tramitacao.prazo_limite) > 0 && (
                        <div className="mt-1 text-xs text-red-600">
                          {calcularDiasAtraso(tramitacao.prazo_limite)} dias atrasado
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tramitacao.setor_origem?.nome} → {tramitacao.setor_destino?.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(tramitacao.data_tramitacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tramitacao.prazo_limite ? formatarData(tramitacao.prazo_limite) : 'Sem prazo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tramitacao.usuario?.nome || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/tramitacao/${tramitacao.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/tramitacao/${tramitacao.id}/editar`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir esta tramitação?')) {
                              // Implementar exclusão
                              toast.success('Tramitação excluída com sucesso');
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacao.pagina === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacao.pagina === totalPaginas}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((paginacao.pagina - 1) * paginacao.por_pagina) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(paginacao.pagina * paginacao.por_pagina, paginacao.total)}
                    </span>{' '}
                    de <span className="font-medium">{paginacao.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                      disabled={paginacao.pagina === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      const pagina = i + 1;
                      return (
                        <button
                          key={pagina}
                          onClick={() => setPaginacao(prev => ({ ...prev, pagina }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagina === paginacao.pagina
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pagina}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setPaginacao(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                      disabled={paginacao.pagina === totalPaginas}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TramitacaoList;
