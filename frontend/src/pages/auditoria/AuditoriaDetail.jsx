import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate } from '../../utils/formatters';

const AuditoriaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchAuditoriaDetail();
  }, [id]);

  const fetchAuditoriaDetail = async () => {
    try {
      setLoading(true);
      // Simular dados da auditoria
      const mockData = {
        id: id,
        numero_auditoria: `AUD-${id}-2024`,
        tipo_auditoria: 'Auditoria de Conformidade',
        objeto_auditoria: 'Processo de Atendimento ao Consumidor',
        data_inicio: '2024-02-01',
        data_fim: '2024-02-15',
        data_conclusao: '2024-02-20',
        equipe_auditoria: 'Equipe de Auditoria Interna',
        responsavel_auditoria: 'Ana Paula Silva',
        departamento_auditado: 'Atendimento',
        objetivo: 'Verificar conformidade dos processos de atendimento com as normas estabelecidas e identificar oportunidades de melhoria no sistema de atendimento ao consumidor.',
        escopo: 'Todos os canais de atendimento (presencial, telefônico, online), incluindo protocolos, procedimentos e sistemas utilizados.',
        criterios: 'ISO 9001:2015, Regulamentações do PROCON, Código de Defesa do Consumidor, Procedimentos Internos v2.1',
        metodologia: 'Entrevistas estruturadas com colaboradores, análise documental, observação direta dos processos, revisão de registros e sistemas.',
        status: 'Concluída',
        observacoes: 'Auditoria de rotina anual com foco em melhorias identificadas na auditoria anterior.',
        documentos: [
          { id: 1, nome: 'Relatório Final de Auditoria.pdf', tamanho: '3.2 MB', data_upload: '2024-02-20' },
          { id: 2, nome: 'Check-list de Auditoria.xlsx', tamanho: '1.5 MB', data_upload: '2024-02-01' },
          { id: 3, nome: 'Evidências Fotográficas.zip', tamanho: '8.7 MB', data_upload: '2024-02-15' },
          { id: 4, nome: 'Atas de Reunião.pdf', tamanho: '2.1 MB', data_upload: '2024-02-10' }
        ],
        achados: [
          {
            id: 1,
            titulo: 'Documentação de procedimentos desatualizada',
            descricao: 'Encontrados manuais de procedimento com versões desatualizadas em 3 pontos de atendimento, causando inconsistências no atendimento.',
            tipo: 'Não Conformidade',
            prioridade: 'Alta',
            prazo_implementacao: '2024-03-01',
            responsavel: 'João Santos - Coordenador de Atendimento',
            status: 'Em Andamento',
            data_identificacao: '2024-02-05',
            acao_corretiva: 'Revisão e atualização de todos os manuais de procedimento'
          },
          {
            id: 2,
            titulo: 'Sistema de backup não testado regularmente',
            descricao: 'Verificado que os testes de backup não são realizados conforme periodicidade estabelecida (mensal).',
            tipo: 'Não Conformidade',
            prioridade: 'Média',
            prazo_implementacao: '2024-03-15',
            responsavel: 'Carlos Silva - TI',
            status: 'Pendente',
            data_identificacao: '2024-02-08',
            acao_corretiva: 'Implementar rotina automatizada de testes de backup'
          },
          {
            id: 3,
            titulo: 'Oportunidade de digitalização de processos',
            descricao: 'Identificados processos manuais que podem ser digitalizados para maior eficiência e rastreabilidade.',
            tipo: 'Oportunidade de Melhoria',
            prioridade: 'Baixa',
            prazo_implementacao: '2024-06-01',
            responsavel: 'Maria Oliveira - Processos',
            status: 'Planejado',
            data_identificacao: '2024-02-12',
            acao_corretiva: 'Análise de viabilidade para digitalização'
          }
        ],
        recomendacoes: [
          {
            id: 1,
            titulo: 'Implementar sistema de versionamento de documentos',
            descricao: 'Criar sistema centralizado de controle de versões para todos os documentos operacionais.',
            prazo: '2024-04-01',
            responsavel: 'TI + Qualidade',
            status: 'Aprovado',
            impacto: 'Alto'
          },
          {
            id: 2,
            titulo: 'Treinamento periódico da equipe',
            descricao: 'Estabelecer programa de treinamento trimestral sobre procedimentos e atualizações normativas.',
            prazo: '2024-03-30',
            responsavel: 'RH + Coordenação',
            status: 'Em Implementação',
            impacto: 'Médio'
          },
          {
            id: 3,
            titulo: 'Dashboard de monitoramento de KPIs',
            descricao: 'Criar painel de controle para acompanhamento em tempo real dos indicadores de atendimento.',
            prazo: '2024-05-01',
            responsavel: 'TI + Atendimento',
            status: 'Em Análise',
            impacto: 'Alto'
          }
        ],
        historico: [
          { data: '2024-01-15', acao: 'Auditoria programada', usuario: 'Sistema', observacoes: 'Auditoria incluída no cronograma anual' },
          { data: '2024-01-30', acao: 'Equipe definida', usuario: 'Ana Paula Silva', observacoes: 'Equipe de auditoria designada' },
          { data: '2024-02-01', acao: 'Auditoria iniciada', usuario: 'Ana Paula Silva', observacoes: 'Início dos trabalhos de campo' },
          { data: '2024-02-05', acao: 'Primeira não conformidade identificada', usuario: 'Carlos Auditor', observacoes: 'Documentação desatualizada' },
          { data: '2024-02-15', acao: 'Trabalho de campo concluído', usuario: 'Ana Paula Silva', observacoes: 'Coleta de evidências finalizada' },
          { data: '2024-02-20', acao: 'Relatório final emitido', usuario: 'Ana Paula Silva', observacoes: 'Auditoria concluída com sucesso' },
          { data: '2024-02-22', acao: 'Reunião de apresentação', usuario: 'Ana Paula Silva', observacoes: 'Resultados apresentados à direção' }
        ],
        metricas: {
          total_achados: 3,
          nao_conformidades: 2,
          oportunidades_melhoria: 1,
          observacoes: 0,
          percentual_conformidade: 85,
          prazo_medio_correcao: 30, // dias
          achados_criticos: 0,
          achados_pendentes: 2
        }
      };

      setAuditoria(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados da auditoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planejada': 'bg-blue-100 text-blue-800',
      'Em Andamento': 'bg-yellow-100 text-yellow-800',
      'Concluída': 'bg-green-100 text-green-800',
      'Cancelada': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTipoAchadoColor = (tipo) => {
    const colors = {
      'Não Conformidade': 'bg-red-100 text-red-800',
      'Oportunidade de Melhoria': 'bg-blue-100 text-blue-800',
      'Observação': 'bg-gray-100 text-gray-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Crítica': 'bg-red-500 text-white',
      'Alta': 'bg-red-100 text-red-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Baixa': 'bg-green-100 text-green-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    navigate(`/auditoria/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta auditoria?')) {
      try {
        showNotification('Auditoria excluída com sucesso', 'success');
        navigate('/auditoria');
      } catch (error) {
        showNotification('Erro ao excluir auditoria', 'error');
      }
    }
  };

  const handleDownloadDocument = (documento) => {
    showNotification(`Download iniciado: ${documento.nome}`, 'info');
  };

  if (loading) return <LoadingSpinner />;
  if (!auditoria) return <div className="text-center text-red-600">Auditoria não encontrada</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/auditoria')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {auditoria.numero_auditoria}
              </h1>
              <p className="text-gray-600">{auditoria.tipo_auditoria} - {auditoria.objeto_auditoria}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auditoria.status)}`}>
              {auditoria.status}
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

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conformidade</p>
              <p className="text-2xl font-bold text-gray-900">{auditoria.metricas.percentual_conformidade}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Achados</p>
              <p className="text-2xl font-bold text-gray-900">{auditoria.metricas.total_achados}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{auditoria.metricas.achados_pendentes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prazo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{auditoria.metricas.prazo_medio_correcao}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'achados', name: 'Achados', icon: ExclamationTriangleIcon },
            { id: 'recomendacoes', name: 'Recomendações', icon: CheckCircleIcon },
            { id: 'documentos', name: 'Documentos', icon: DocumentArrowDownIcon },
            { id: 'historico', name: 'Histórico', icon: ClockIcon }
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
                  <label className="block text-sm font-medium text-gray-500">Tipo de Auditoria</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.tipo_auditoria}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Objeto da Auditoria</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.objeto_auditoria}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Responsável</label>
                  <div className="mt-1 flex items-center">
                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{auditoria.responsavel_auditoria}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Departamento Auditado</label>
                  <div className="mt-1 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{auditoria.departamento_auditado}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Equipe de Auditoria</label>
                  <p className="mt-1 text-sm text-gray-900">{auditoria.equipe_auditoria}</p>
                </div>
              </div>
            </div>

            {/* Cronograma */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cronograma</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data de Início</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(auditoria.data_inicio)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data de Fim</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(auditoria.data_fim)}</span>
                  </div>
                </div>
                {auditoria.data_conclusao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Data de Conclusão</label>
                    <div className="mt-1 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm text-gray-900">{formatDate(auditoria.data_conclusao)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Escopo e Metodologia */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Escopo e Metodologia</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Objetivo</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{auditoria.objetivo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Escopo</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{auditoria.escopo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Critérios</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{auditoria.criterios}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Metodologia</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{auditoria.metodologia}</p>
                </div>
                {auditoria.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Observações</label>
                    <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{auditoria.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achados' && (
          <div className="space-y-6">
            {auditoria.achados.map((achado) => (
              <div key={achado.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{achado.titulo}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoAchadoColor(achado.tipo)}`}>
                        {achado.tipo}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(achado.prioridade)}`}>
                        {achado.prioridade}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{achado.descricao}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Responsável:</span>
                        <p className="text-gray-600">{achado.responsavel}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prazo:</span>
                        <p className="text-gray-600">{formatDate(achado.prazo_implementacao)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          achado.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          achado.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {achado.status}
                        </span>
                      </div>
                    </div>
                    
                    {achado.acao_corretiva && (
                      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <span className="font-medium text-blue-900 block mb-1">Ação Corretiva:</span>
                        <p className="text-blue-800 text-sm">{achado.acao_corretiva}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recomendacoes' && (
          <div className="space-y-6">
            {auditoria.recomendacoes.map((rec) => (
              <div key={rec.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{rec.titulo}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.impacto === 'Alto' ? 'bg-red-100 text-red-800' :
                        rec.impacto === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Impacto {rec.impacto}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{rec.descricao}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Responsável:</span>
                        <p className="text-gray-600">{rec.responsavel}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prazo:</span>
                        <p className="text-gray-600">{formatDate(rec.prazo)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          rec.status === 'Implementado' ? 'bg-green-100 text-green-800' :
                          rec.status === 'Em Implementação' ? 'bg-yellow-100 text-yellow-800' :
                          rec.status === 'Aprovado' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Documentos da Auditoria</h3>
            </div>
            <div className="p-6">
              {auditoria.documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auditoria.documentos.map((doc) => (
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
                  <p className="mt-1 text-sm text-gray-500">Não há documentos anexados a esta auditoria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Histórico da Auditoria</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {auditoria.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== auditoria.historico.length - 1 && (
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
      </div>
    </div>
  );
};

export default AuditoriaDetail;