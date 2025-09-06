import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatNumber } from '../../utils/formatters';

const ConsultaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchConsultaDetail();
  }, [id]);

  const fetchConsultaDetail = async () => {
    try {
      setLoading(true);
      // Simular dados da consulta pública
      const mockData = {
        id: id,
        codigo_consulta: `CP-${id}-2024`,
        titulo: 'Consulta sobre Nova Regulamentação de E-commerce',
        descricao: 'Consulta pública para coleta de contribuições da sociedade civil, empresas e organizações sobre a nova regulamentação do comércio eletrônico no estado. A proposta visa modernizar as normas e garantir maior proteção aos consumidores nas transações online.',
        tipo_consulta: 'Consulta Pública',
        tema: 'Regulamentação Comercial',
        objetivo: 'Coletar contribuições da sociedade civil, empresas e organizações sobre a nova regulamentação do comércio eletrônico, visando modernizar as normas e garantir maior proteção aos consumidores.',
        data_inicio: '2024-03-01',
        data_fim: '2024-04-15',
        data_publicacao: '2024-02-15',
        responsavel: 'Dr. João Silva',
        responsavel_email: 'joao.silva@procon.gov.br',
        status: 'Aberta',
        permite_comentarios: true,
        requer_identificacao: true,
        publico_alvo: 'Empresas de e-commerce, consumidores, associações empresariais, advogados especializados em direito do consumidor',
        como_participar: 'As contribuições podem ser enviadas através do formulário online disponível nesta página ou por email para consulta.ecommerce@procon.gov.br até às 23:59 do dia 15 de abril de 2024.',
        criterios_participacao: 'Qualquer pessoa física ou jurídica pode participar. Para empresas, é necessário informar CNPJ. Contribuições anônimas não serão aceitas.',
        documentos: [
          { id: 1, nome: 'Minuta da Regulamentação.pdf', tamanho: '2.8 MB', downloads: 1247, data_upload: '2024-02-15' },
          { id: 2, nome: 'Análise de Impacto Regulatório.pdf', tamanho: '4.2 MB', downloads: 892, data_upload: '2024-02-15' },
          { id: 3, nome: 'Comparativo Legislação Outros Estados.xlsx', tamanho: '1.5 MB', downloads: 634, data_upload: '2024-02-20' },
          { id: 4, nome: 'FAQ - Perguntas Frequentes.pdf', tamanho: '800 KB', downloads: 2156, data_upload: '2024-02-25' }
        ],
        perguntas: [
          {
            id: 1,
            pergunta: 'Qual sua opinião sobre as novas regras propostas para plataformas de e-commerce?',
            tipo: 'Texto Livre',
            obrigatoria: true,
            respostas: 324
          },
          {
            id: 2,
            pergunta: 'Você representa qual segmento?',
            tipo: 'Múltipla Escolha',
            obrigatoria: true,
            opcoes: ['Consumidor', 'Empresa de E-commerce', 'Associação Empresarial', 'Advogado', 'Outros'],
            respostas: 324,
            distribuicao: {
              'Consumidor': 145,
              'Empresa de E-commerce': 89,
              'Associação Empresarial': 34,
              'Advogado': 28,
              'Outros': 28
            }
          },
          {
            id: 3,
            pergunta: 'Como você avalia o prazo proposto para implementação das novas regras (180 dias)?',
            tipo: 'Escolha Única',
            obrigatoria: false,
            opcoes: ['Muito curto', 'Adequado', 'Muito longo'],
            respostas: 298,
            distribuicao: {
              'Muito curto': 156,
              'Adequado': 112,
              'Muito longo': 30
            }
          },
          {
            id: 4,
            pergunta: 'Em uma escala de 1 a 5, como você avalia a clareza da redação proposta?',
            tipo: 'Escala',
            obrigatoria: false,
            respostas: 287,
            media: 3.4
          }
        ],
        participacoes: [
          {
            id: 1,
            participante: 'Associação Brasileira de E-commerce',
            tipo_participante: 'Pessoa Jurídica',
            data_participacao: '2024-03-05',
            status: 'Aprovada',
            resumo: 'Contribuição abrangente sobre prazos de implementação e aspectos técnicos'
          },
          {
            id: 2,
            participante: 'Maria Santos',
            tipo_participante: 'Pessoa Física',
            data_participacao: '2024-03-08',
            status: 'Aprovada',
            resumo: 'Perspectiva do consumidor sobre proteção de dados pessoais'
          },
          {
            id: 3,
            participante: 'Sindicato do Comércio Digital',
            tipo_participante: 'Pessoa Jurídica',
            data_participacao: '2024-03-12',
            status: 'Em Análise',
            resumo: 'Questionamentos sobre impactos econômicos da regulamentação'
          }
        ],
        estatisticas: {
          total_participacoes: 324,
          total_contribuicoes_aprovadas: 298,
          total_contribuicoes_rejeitadas: 12,
          total_contribuicoes_pendentes: 14,
          pessoas_fisicas: 201,
          pessoas_juridicas: 123,
          total_visualizacoes: 8947,
          total_downloads: 5929,
          media_tempo_pagina: '4m 32s',
          picos_acesso: [
            { data: '2024-02-15', acessos: 1247, evento: 'Publicação' },
            { data: '2024-02-28', acessos: 892, evento: 'Divulgação mídia' },
            { data: '2024-03-15', acessos: 1156, evento: 'Meio do prazo' }
          ]
        },
        canais_divulgacao: {
          site_oficial: { ativo: true, alcance: 5432 },
          redes_sociais: { ativo: true, alcance: 2156 },
          jornal_oficial: { ativo: true, alcance: 1890 },
          imprensa: { ativo: false, alcance: 0 },
          email_institucional: { ativo: true, alcance: 3456 }
        },
        historico: [
          { data: '2024-02-10', acao: 'Consulta criada', usuario: 'Dr. João Silva', observacoes: 'Consulta sobre e-commerce criada' },
          { data: '2024-02-15', acao: 'Consulta publicada', usuario: 'Sistema', observacoes: 'Publicação no site oficial' },
          { data: '2024-02-15', acao: 'Documentos anexados', usuario: 'Dr. João Silva', observacoes: 'Upload dos documentos de referência' },
          { data: '2024-02-20', acao: 'Documento adicional', usuario: 'Equipe Jurídica', observacoes: 'Comparativo com outros estados' },
          { data: '2024-02-25', acao: 'FAQ publicado', usuario: 'Equipe Comunicação', observacoes: 'Perguntas frequentes' },
          { data: '2024-03-01', acao: 'Período de participação iniciado', usuario: 'Sistema', observacoes: 'Consulta aberta para participações' },
          { data: '2024-03-05', acao: 'Primeira contribuição aprovada', usuario: 'Sistema', observacoes: 'ABComerce - primeira participação' }
        ],
        configuracoes: {
          limite_caracteres: 5000,
          permite_anexos: true,
          moderacao_previa: true,
          notificar_novas_participacoes: true
        },
        dias_restantes: 12,
        porcentagem_tempo_decorrido: 75
      };

      setConsulta(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados da consulta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Rascunho': 'bg-gray-100 text-gray-800',
      'Publicada': 'bg-blue-100 text-blue-800',
      'Aberta': 'bg-green-100 text-green-800',
      'Fechada': 'bg-red-100 text-red-800',
      'Análise': 'bg-yellow-100 text-yellow-800',
      'Finalizada': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTipoParticipanteColor = (tipo) => {
    const colors = {
      'Pessoa Física': 'bg-blue-100 text-blue-800',
      'Pessoa Jurídica': 'bg-green-100 text-green-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getParticipacaoStatusColor = (status) => {
    const colors = {
      'Aprovada': 'bg-green-100 text-green-800',
      'Rejeitada': 'bg-red-100 text-red-800',
      'Em Análise': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    navigate(`/consulta/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
      try {
        showNotification('Consulta excluída com sucesso', 'success');
        navigate('/consulta');
      } catch (error) {
        showNotification('Erro ao excluir consulta', 'error');
      }
    }
  };

  const handleDownloadDocument = (documento) => {
    showNotification(`Download iniciado: ${documento.nome}`, 'info');
  };

  const handleExportResults = () => {
    showNotification('Exportação de resultados iniciada', 'info');
  };

  if (loading) return <LoadingSpinner />;
  if (!consulta) return <div className="text-center text-red-600">Consulta não encontrada</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/consulta')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {consulta.titulo}
              </h1>
              <p className="text-gray-600">{consulta.codigo_consulta} - {consulta.tipo_consulta}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(consulta.status)}`}>
              {consulta.status}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleExportResults}
                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                title="Exportar Resultados"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
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

      {/* Status da Consulta */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Status da Consulta</h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{consulta.dias_restantes} dias restantes</p>
            <p className="text-sm text-gray-500">para o fim da consulta</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full" 
            style={{ width: `${consulta.porcentagem_tempo_decorrido}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Início: {formatDate(consulta.data_inicio)}</span>
          <span>{consulta.porcentagem_tempo_decorrido}% do prazo decorrido</span>
          <span>Fim: {formatDate(consulta.data_fim)}</span>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Participações</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(consulta.estatisticas.total_participacoes)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EyeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(consulta.estatisticas.total_visualizacoes)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentArrowDownIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(consulta.estatisticas.total_downloads)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{consulta.estatisticas.media_tempo_pagina}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'perguntas', name: 'Perguntas', icon: ChatBubbleLeftRightIcon },
            { id: 'participacoes', name: 'Participações', icon: UserGroupIcon },
            { id: 'estatisticas', name: 'Estatísticas', icon: ChartBarIcon },
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
                  <label className="block text-sm font-medium text-gray-500">Tipo de Consulta</label>
                  <p className="mt-1 text-sm text-gray-900">{consulta.tipo_consulta}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tema</label>
                  <p className="mt-1 text-sm text-gray-900">{consulta.tema}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Responsável</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">{consulta.responsavel}</span>
                    <p className="text-xs text-gray-500">{consulta.responsavel_email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data de Publicação</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(consulta.data_publicacao)}</p>
                </div>
              </div>
            </div>

            {/* Cronograma */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cronograma</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Período de Participação</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {formatDate(consulta.data_inicio)} a {formatDate(consulta.data_fim)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duração</label>
                  <p className="mt-1 text-sm text-gray-900">45 dias</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consulta.status)}`}>
                    {consulta.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Objetivo e Descrição */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Objetivo e Descrição</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Descrição</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{consulta.descricao}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Objetivo</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{consulta.objetivo}</p>
                </div>
              </div>
            </div>

            {/* Participação */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações sobre Participação</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Público Alvo</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{consulta.publico_alvo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Como Participar</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{consulta.como_participar}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Critérios de Participação</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{consulta.criterios_participacao}</p>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${consulta.permite_comentarios ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Permite comentários</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${consulta.requer_identificacao ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Requer identificação</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${consulta.configuracoes.permite_anexos ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Permite anexos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${consulta.configuracoes.moderacao_previa ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Moderação prévia</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Limite de caracteres:</span> {formatNumber(consulta.configuracoes.limite_caracteres)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'perguntas' && (
          <div className="space-y-6">
            {consulta.perguntas.map((pergunta, index) => (
              <div key={pergunta.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">Pergunta #{index + 1}</span>
                      {pergunta.obrigatoria && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Obrigatória
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {pergunta.tipo}
                      </span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{pergunta.pergunta}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Respostas</p>
                    <p className="text-2xl font-bold text-indigo-600">{pergunta.respostas}</p>
                  </div>
                </div>

                {/* Mostrar distribuição para perguntas de múltipla escolha */}
                {(pergunta.tipo === 'Múltipla Escolha' || pergunta.tipo === 'Escolha Única') && pergunta.distribuicao && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Distribuição das respostas:</h5>
                    <div className="space-y-2">
                      {Object.entries(pergunta.distribuicao).map(([opcao, quantidade]) => (
                        <div key={opcao} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{opcao}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${(quantidade / pergunta.respostas) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">{quantidade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mostrar média para perguntas de escala */}
                {pergunta.tipo === 'Escala' && pergunta.media && (
                  <div className="mt-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">Média das respostas:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(pergunta.media / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-green-600">{pergunta.media}/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'participacoes' && (
          <div className="space-y-6">
            {/* Resumo das Participações */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo das Participações</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{consulta.estatisticas.total_contribuicoes_aprovadas}</p>
                  <p className="text-sm text-green-700">Aprovadas</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{consulta.estatisticas.total_contribuicoes_pendentes}</p>
                  <p className="text-sm text-yellow-700">Pendentes</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{consulta.estatisticas.total_contribuicoes_rejeitadas}</p>
                  <p className="text-sm text-red-700">Rejeitadas</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{consulta.estatisticas.total_participacoes}</p>
                  <p className="text-sm text-blue-700">Total</p>
                </div>
              </div>
            </div>

            {/* Lista de Participações Recentes */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Participações Recentes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {consulta.participacoes.map((participacao) => (
                    <div key={participacao.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{participacao.participante}</h4>
                          <p className="text-sm text-gray-600 mt-1">{participacao.resumo}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoParticipanteColor(participacao.tipo_participante)}`}>
                              {participacao.tipo_participante}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(participacao.data_participacao)}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getParticipacaoStatusColor(participacao.status)}`}>
                          {participacao.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'estatisticas' && (
          <div className="space-y-6">
            {/* Distribuição por Tipo de Participante */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Tipo de Participante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Pessoas Físicas</span>
                    <span className="text-sm font-bold text-gray-900">{consulta.estatisticas.pessoas_fisicas}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full" 
                      style={{ width: `${(consulta.estatisticas.pessoas_fisicas / consulta.estatisticas.total_participacoes) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((consulta.estatisticas.pessoas_fisicas / consulta.estatisticas.total_participacoes) * 100)}%
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Pessoas Jurídicas</span>
                    <span className="text-sm font-bold text-gray-900">{consulta.estatisticas.pessoas_juridicas}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full" 
                      style={{ width: `${(consulta.estatisticas.pessoas_juridicas / consulta.estatisticas.total_participacoes) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((consulta.estatisticas.pessoas_juridicas / consulta.estatisticas.total_participacoes) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Picos de Acesso */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Picos de Acesso</h3>
              <div className="space-y-4">
                {consulta.estatisticas.picos_acesso.map((pico, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pico.evento}</p>
                      <p className="text-xs text-gray-500">{formatDate(pico.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{formatNumber(pico.acessos)}</p>
                      <p className="text-xs text-gray-500">acessos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Canais de Divulgação */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Efetividade dos Canais de Divulgação</h3>
              <div className="space-y-4">
                {Object.entries(consulta.canais_divulgacao).map(([canal, dados]) => (
                  <div key={canal} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${dados.ativo ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {canal.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatNumber(dados.alcance)}</p>
                      <p className="text-xs text-gray-500">alcance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Documentos de Referência</h3>
            </div>
            <div className="p-6">
              {consulta.documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {consulta.documentos.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{doc.nome}</h4>
                          <p className="text-xs text-gray-500">Tamanho: {doc.tamanho}</p>
                          <p className="text-xs text-gray-500">Publicado: {formatDate(doc.data_upload)}</p>
                          <p className="text-xs text-indigo-600 font-medium">{formatNumber(doc.downloads)} downloads</p>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="p-2 text-indigo-600 hover:text-indigo-800"
                          title="Download"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento</h3>
                  <p className="mt-1 text-sm text-gray-500">Não há documentos anexados a esta consulta.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Histórico da Consulta</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {consulta.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== consulta.historico.length - 1 && (
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

export default ConsultaDetail;