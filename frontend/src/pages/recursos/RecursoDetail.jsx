import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';

const RecursoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [recurso, setRecurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchRecursoDetail();
  }, [id]);

  const fetchRecursoDetail = async () => {
    try {
      setLoading(true);
      // Simular dados do recurso
      const mockData = {
        id: id,
        numero_protocolo: `REC-${id}-2024`,
        processo_origem: {
          id: 1,
          numero: 'PROC-001-2024',
          consumidor: 'João Silva',
          fornecedor: 'Empresa ABC Ltda'
        },
        tipo_recurso: 'Recurso Ordinário',
        requerente: 'João Silva',
        requerente_tipo: 'Consumidor',
        data_protocolo: '2024-01-15',
        data_limite_resposta: '2024-02-15',
        status: 'Em Análise',
        motivo_recurso: 'Decisão contrária aos fatos apresentados',
        fundamentacao: 'O recurso baseia-se na apresentação de novos documentos que comprovam a veracidade dos fatos alegados pelo consumidor...',
        valor_recurso: 2500.00,
        documentos: [
          { id: 1, nome: 'Petição Inicial do Recurso.pdf', tamanho: '2.3 MB', data_upload: '2024-01-15' },
          { id: 2, nome: 'Documentos Comprobatórios.pdf', tamanho: '1.8 MB', data_upload: '2024-01-15' },
          { id: 3, nome: 'Procuração.pdf', tamanho: '512 KB', data_upload: '2024-01-15' }
        ],
        historico: [
          { data: '2024-01-15', acao: 'Recurso protocolado', usuario: 'Sistema', observacoes: 'Protocolo automático' },
          { data: '2024-01-16', acao: 'Recurso distribuído', usuario: 'Ana Silva', observacoes: 'Distribuído para análise jurídica' },
          { data: '2024-01-20', acao: 'Análise iniciada', usuario: 'Dr. Carlos Santos', observacoes: 'Início da análise técnica' },
          { data: '2024-01-25', acao: 'Solicitação de esclarecimentos', usuario: 'Dr. Carlos Santos', observacoes: 'Solicitados esclarecimentos adicionais' }
        ],
        decisao_anterior: {
          data: '2024-01-10',
          decisao: 'Improcedente',
          relator: 'Dra. Maria Oliveira',
          fundamentacao: 'Não foram apresentadas provas suficientes para caracterizar o vício do produto.'
        },
        prazo_manifestacao: '2024-02-10',
        observacoes: 'Recurso apresenta documentação nova e relevante para reanálise do caso.'
      };

      setRecurso(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados do recurso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Protocolado': 'bg-blue-100 text-blue-800',
      'Em Análise': 'bg-yellow-100 text-yellow-800',
      'Pendente': 'bg-orange-100 text-orange-800',
      'Deferido': 'bg-green-100 text-green-800',
      'Indeferido': 'bg-red-100 text-red-800',
      'Parcialmente Deferido': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    navigate(`/recursos/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este recurso?')) {
      try {
        showNotification('Recurso excluído com sucesso', 'success');
        navigate('/recursos');
      } catch (error) {
        showNotification('Erro ao excluir recurso', 'error');
      }
    }
  };

  const handleDownloadDocument = (documento) => {
    showNotification(`Download iniciado: ${documento.nome}`, 'info');
  };

  if (loading) return <LoadingSpinner />;
  if (!recurso) return <div className="text-center text-red-600">Recurso não encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/recursos')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {recurso.numero_protocolo}
              </h1>
              <p className="text-gray-600">Recurso - {recurso.tipo_recurso}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(recurso.status)}`}>
              {recurso.status}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                title="Excluir"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'documentos', name: 'Documentos', icon: DocumentArrowDownIcon },
            { id: 'historico', name: 'Histórico', icon: ClockIcon },
            { id: 'decisao', name: 'Decisão Anterior', icon: ExclamationTriangleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Processo de Origem</label>
                  <p className="mt-1 text-sm text-gray-900">{recurso.processo_origem.numero}</p>
                  <p className="text-xs text-gray-500">{recurso.processo_origem.consumidor} vs {recurso.processo_origem.fornecedor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Requerente</label>
                  <div className="mt-1 flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{recurso.requerente}</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {recurso.requerente_tipo}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo de Recurso</label>
                  <p className="mt-1 text-sm text-gray-900">{recurso.tipo_recurso}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Valor do Recurso</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{formatCurrency(recurso.valor_recurso)}</p>
                </div>
              </div>
            </div>

            {/* Prazos */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Prazos</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data do Protocolo</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(recurso.data_protocolo)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prazo para Resposta</label>
                  <div className="mt-1 flex items-center">
                    <ClockIcon className="h-4 w-4 text-red-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(recurso.data_limite_resposta)}</span>
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Urgente
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prazo para Manifestação</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(recurso.prazo_manifestacao)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fundamentação */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Motivo e Fundamentação</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Motivo do Recurso</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{recurso.motivo_recurso}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fundamentação</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{recurso.fundamentacao}</p>
                </div>
                {recurso.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Observações</label>
                    <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{recurso.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Documentos do Recurso</h3>
            </div>
            <div className="p-6">
              {recurso.documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recurso.documentos.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{doc.nome}</h4>
                          <p className="text-xs text-gray-500">Tamanho: {doc.tamanho}</p>
                          <p className="text-xs text-gray-500">Upload: {formatDate(doc.data_upload)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1 text-gray-600 hover:text-indigo-600"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1 text-gray-600 hover:text-green-600"
                            title="Download"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento</h3>
                  <p className="mt-1 text-sm text-gray-500">Não há documentos anexados a este recurso.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Histórico de Tramitação</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recurso.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== recurso.historico.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                              <ClockIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{item.acao}</p>
                              <p className="text-sm text-gray-500">por {item.usuario}</p>
                              {item.observacoes && (
                                <p className="text-sm text-gray-600 mt-1">{item.observacoes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(item.data)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'decisao' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Decisão Anterior</h3>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <XCircleIcon className="h-6 w-6 text-red-500 mt-1 mr-3" />
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-red-900 mb-2">
                      Decisão: {recurso.decisao_anterior.decisao}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-red-800">Data da Decisão:</span>
                        <span className="ml-2 text-sm text-red-700">{formatDate(recurso.decisao_anterior.data)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-800">Relator:</span>
                        <span className="ml-2 text-sm text-red-700">{recurso.decisao_anterior.relator}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-red-800 block mb-1">Fundamentação:</span>
                        <p className="text-sm text-red-700 bg-white p-3 rounded border border-red-200 leading-relaxed">
                          {recurso.decisao_anterior.fundamentacao}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecursoDetail;