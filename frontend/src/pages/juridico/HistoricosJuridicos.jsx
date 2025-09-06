import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const HistoricosJuridicos = () => {
  const [historicos, setHistoricos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo_acao: '',
    usuario: '',
    entidade: '',
    data_inicio: '',
    data_fim: '',
    modulo: '',
    severidade: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [historicoDetalhado, setHistoricoDetalhado] = useState(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { notifications, addNotification, removeNotification } = useNotification();

  useEffect(() => {
    carregarHistoricos();
  }, [filtros, pagina]);

  const carregarHistoricos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagina,
        ...filtros
      });
      
      const response = await juridicoService.listarHistoricos(params.toString());
      setHistoricos(response.data.results || response.data);
      setTotalPaginas(Math.ceil((response.data.count || 0) / 20));
    } catch (error) {
      console.error('Erro ao carregar históricos:', error);
      addNotification('Erro ao carregar históricos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPagina(1);
  };

  const limparFiltros = () => {
    setFiltros({
      tipo_acao: '',
      usuario: '',
      entidade: '',
      data_inicio: '',
      data_fim: '',
      modulo: '',
      severidade: ''
    });
    setPagina(1);
  };

  const verDetalhes = async (id) => {
    try {
      const response = await juridicoService.getHistoricoDetalhado(id);
      setHistoricoDetalhado(response.data);
      setMostrarDetalhes(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      addNotification('Erro ao carregar detalhes do histórico', 'error');
    }
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const exportarHistorico = async (formato = 'pdf') => {
    try {
      const params = new URLSearchParams(filtros);
      const response = await juridicoService.exportarHistorico(params.toString(), formato);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historico_juridico_${new Date().toISOString().split('T')[0]}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      addNotification(`Histórico exportado com sucesso (${formato.toUpperCase()})`, 'success');
    } catch (error) {
      console.error('Erro ao exportar histórico:', error);
      addNotification('Erro ao exportar histórico', 'error');
    }
  };

  const getSeveridadeColor = (severidade) => {
    switch (severidade) {
      case 'CRITICA':
        return 'bg-red-100 text-red-800';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAIXA':
        return 'bg-green-100 text-green-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoAcaoIcon = (tipo) => {
    switch (tipo) {
      case 'CRIACAO':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'EDICAO':
        return <PencilIcon className="h-5 w-5 text-blue-600" />;
      case 'EXCLUSAO':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'VISUALIZACAO':
        return <EyeIcon className="h-5 w-5 text-gray-600" />;
      case 'LOGIN':
        return <UserIcon className="h-5 w-5 text-purple-600" />;
      case 'LOGOUT':
        return <ArrowPathIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarDiferencaTempo = (data) => {
    if (!data) return '-';
    const agora = new Date();
    const dataEvento = new Date(data);
    const diffMs = agora - dataEvento;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffMins > 0) {
      return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Históricos Jurídicos
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sistema completo de auditoria e rastreamento de atividades
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => exportarHistorico('pdf')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportar PDF
              </button>
              <button
                onClick={() => exportarHistorico('excel')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros de Auditoria
              </h3>
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
              </button>
            </div>
          </div>
          
          {mostrarFiltros && (
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Ação
                  </label>
                  <select
                    value={filtros.tipo_acao}
                    onChange={(e) => handleFiltroChange('tipo_acao', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Todas as ações</option>
                    <option value="CRIACAO">Criação</option>
                    <option value="EDICAO">Edição</option>
                    <option value="EXCLUSAO">Exclusão</option>
                    <option value="VISUALIZACAO">Visualização</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usuário
                  </label>
                  <input
                    type="text"
                    value={filtros.usuario}
                    onChange={(e) => handleFiltroChange('usuario', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nome do usuário"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entidade
                  </label>
                  <input
                    type="text"
                    value={filtros.entidade}
                    onChange={(e) => handleFiltroChange('entidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Nome da entidade"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Módulo
                  </label>
                  <select
                    value={filtros.modulo}
                    onChange={(e) => handleFiltroChange('modulo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Todos os módulos</option>
                    <option value="PROCESSO">Processo</option>
                    <option value="ANALISE">Análise</option>
                    <option value="DOCUMENTO">Documento</option>
                    <option value="RECURSO">Recurso</option>
                    <option value="USUARIO">Usuário</option>
                    <option value="CONFIGURACAO">Configuração</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severidade
                  </label>
                  <select
                    value={filtros.severidade}
                    onChange={(e) => handleFiltroChange('severidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Todas as severidades</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                    <option value="INFO">Informação</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={limparFiltros}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={carregarHistoricos}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Históricos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registros de Auditoria ({historicos.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {historicos.map((historico) => (
              <div key={historico.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTipoAcaoIcon(historico.tipo_acao)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {historico.titulo}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeveridadeColor(historico.severidade)}`}>
                          {historico.severidade}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {historico.tipo_acao}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {historico.descricao}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {historico.usuario?.nome || 'Sistema'}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {historico.modulo} - {historico.entidade}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatarDataHora(historico.data_hora)}
                          </span>
                        </div>
                      </div>
                      
                      {historico.detalhes && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleExpanded(historico.id)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {expandedItems.has(historico.id) ? (
                              <ChevronDownIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 mr-1" />
                            )}
                            {expandedItems.has(historico.id) ? 'Ocultar' : 'Mostrar'} detalhes
                          </button>
                          
                          {expandedItems.has(historico.id) && (
                            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong className="text-gray-900 dark:text-white">IP:</strong>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {historico.ip_address || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-900 dark:text-white">User Agent:</strong>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {historico.user_agent ? historico.user_agent.substring(0, 50) + '...' : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-900 dark:text-white">Sessão:</strong>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {historico.session_id || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-gray-900 dark:text-white">Duração:</strong>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {historico.duracao ? `${historico.duracao}ms` : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              {historico.dados_anteriores && (
                                <div className="mt-3">
                                  <strong className="text-gray-900 dark:text-white">Dados Anteriores:</strong>
                                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-500 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(historico.dados_anteriores, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {historico.dados_novos && (
                                <div className="mt-3">
                                  <strong className="text-gray-900 dark:text-white">Dados Novos:</strong>
                                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-500 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(historico.dados_novos, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => verDetalhes(historico.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver detalhes completos"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {formatarDiferencaTempo(historico.data_hora)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Página {pagina} de {totalPaginas}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagina(pagina - 1)}
                    disabled={pagina === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagina(pagina + 1)}
                    disabled={pagina === totalPaginas}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && historicoDetalhado && (
        <HistoricoDetalhesModal
          historico={historicoDetalhado}
          onClose={() => setMostrarDetalhes(false)}
        />
      )}
    </div>
  );
};

// Componente Modal para Detalhes do Histórico
const HistoricoDetalhesModal = ({ historico, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes do Registro de Auditoria
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Informações Básicas
              </h3>
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-900 dark:text-white">ID:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.id}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Título:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.titulo}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Descrição:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.descricao}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Tipo de Ação:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.tipo_acao}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Severidade:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.severidade}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Contexto
              </h3>
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-900 dark:text-white">Módulo:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.modulo}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Entidade:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.entidade}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">ID da Entidade:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{historico.entidade_id}</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Data/Hora:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {new Date(historico.data_hora).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Duração:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.duracao ? `${historico.duracao}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Informações do Usuário
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-900 dark:text-white">Usuário:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.usuario?.nome || 'Sistema'}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Email:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.usuario?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Perfil:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.usuario?.perfil || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-900 dark:text-white">IP Address:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.ip_address || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Session ID:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.session_id || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">User Agent:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {historico.user_agent || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados de Mudança */}
          {(historico.dados_anteriores || historico.dados_novos) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Dados de Mudança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {historico.dados_anteriores && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Dados Anteriores
                    </h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-600 rounded text-sm overflow-x-auto">
                      {JSON.stringify(historico.dados_anteriores, null, 2)}
                    </pre>
                  </div>
                )}
                
                {historico.dados_novos && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Dados Novos
                    </h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-600 rounded text-sm overflow-x-auto">
                      {JSON.stringify(historico.dados_novos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadados */}
          {historico.metadados && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Metadados
              </h3>
              <pre className="p-4 bg-gray-100 dark:bg-gray-600 rounded text-sm overflow-x-auto">
                {JSON.stringify(historico.metadados, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricosJuridicos;
