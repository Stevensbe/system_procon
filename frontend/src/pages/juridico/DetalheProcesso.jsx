import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const DetalheProcesso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const { notifications, addNotification, removeNotification } = useNotification();

  useEffect(() => {
    carregarProcesso();
  }, [id]);

  const carregarProcesso = async () => {
    try {
      setLoading(true);
      const response = await juridicoService.getProcesso(id);
      setProcesso(response.data);
    } catch (error) {
      console.error('Erro ao carregar processo:', error);
      addNotification('Erro ao carregar dados do processo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ABERTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'EM_ANALISE':
        return 'bg-blue-100 text-blue-800';
      case 'RESPONDIDO':
        return 'bg-green-100 text-green-800';
      case 'ARQUIVADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAIXA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatarMoeda = (valor) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!processo) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Processo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/juridico/processos')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {processo.numero}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {processo.parte}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <PencilIcon className="h-5 w-5 mr-2" />
                Editar
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center">
                <TrashIcon className="h-5 w-5 mr-2" />
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Status e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(processo.status)}`}>
                  {processo.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Prioridade
                </p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(processo.prioridade)}`}>
                  {processo.prioridade}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Analista
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {processo.analista ? `${processo.analista.user.first_name} ${processo.analista.user.last_name}` : 'Não atribuído'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'geral', name: 'Geral', icon: DocumentTextIcon },
                { id: 'analises', name: 'Análises', icon: DocumentTextIcon },
                { id: 'respostas', name: 'Respostas', icon: DocumentTextIcon },
                { id: 'prazos', name: 'Prazos', icon: ClockIcon },
                { id: 'documentos', name: 'Documentos', icon: DocumentTextIcon },
                { id: 'historico', name: 'Histórico', icon: DocumentTextIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Geral */}
            {activeTab === 'geral' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Informações Básicas
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Número da Petição</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{processo.numero_peticao || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Parte Envolvida</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{processo.parte}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">CNPJ da Empresa</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{processo.empresa_cnpj || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Assunto</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{processo.assunto}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor da Causa</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatarMoeda(processo.valor_causa)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Datas e Controle
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Abertura</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatarDataHora(processo.data_abertura)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Limite</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatarDataHora(processo.data_limite)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Conclusão</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatarDataHora(processo.data_conclusao)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Dias Restantes</dt>
                        <dd className={`text-sm font-medium ${
                          processo.esta_atrasado ? 'text-red-600 dark:text-red-400' : 
                          processo.dias_restantes <= 3 ? 'text-orange-600 dark:text-orange-400' : 
                          'text-gray-900 dark:text-white'
                        }`}>
                          {processo.dias_restantes !== null ? `${processo.dias_restantes} dias` : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Modificação</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatarDataHora(processo.data_modificacao)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Descrição
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {processo.descricao || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Análises */}
            {activeTab === 'analises' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Análises Jurídicas
                  </h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Nova Análise
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Funcionalidade de análises será implementada em breve.
                </p>
              </div>
            )}

            {/* Tab Respostas */}
            {activeTab === 'respostas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Respostas Jurídicas
                  </h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Nova Resposta
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Funcionalidade de respostas será implementada em breve.
                </p>
              </div>
            )}

            {/* Tab Prazos */}
            {activeTab === 'prazos' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Prazos Jurídicos
                  </h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Novo Prazo
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Funcionalidade de prazos será implementada em breve.
                </p>
              </div>
            )}

            {/* Tab Documentos */}
            {activeTab === 'documentos' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Documentos
                  </h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    Upload Documento
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Funcionalidade de documentos será implementada em breve.
                </p>
              </div>
            )}

            {/* Tab Histórico */}
            {activeTab === 'historico' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Histórico de Alterações
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Funcionalidade de histórico será implementada em breve.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheProcesso;
