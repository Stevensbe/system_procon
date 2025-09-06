import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';
import DocumentUploader from '../../components/protocolo/DocumentUploader';
import DocumentViewer from '../../components/protocolo/DocumentViewer';
import ProtocoloTimeline from '../../components/protocolo/ProtocoloTimeline';
import ProtocoloAlerts from '../../components/protocolo/ProtocoloAlerts';

const ProtocoloDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [protocolo, setProtocolo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchProtocoloDetail();
  }, [id]);

  const fetchProtocoloDetail = async () => {
    try {
      setLoading(true);
      // Simular dados do protocolo
      const mockData = {
        id: id,
        numero_protocolo: `PROT-${id}-2024`,
        data_protocolo: '2024-03-15',
        prazo_resposta: '2024-04-15',
        status: 'Em Análise',
        prioridade: 'Alta',
        urgente: false,
        tipo_solicitacao: 'Reclamação',
        canal_entrada: 'Online',
        assunto: 'Produto com defeito não trocado pela loja',
        descricao: 'Comprei um smartphone Samsung Galaxy A54 no valor de R$ 1.500,00 na Loja TecnoMundo em 01/03/2024. O aparelho apresentou defeito na tela após 15 dias de uso normal. Procurei a loja para realizar a troca conforme garantia, mas a empresa se recusa a fazer a troca alegando mau uso, o que não é verdade. Solicito providências para que seja feita a troca do produto ou restituição do valor pago.',
        observacoes: 'Cliente possui nota fiscal e certificado de garantia válidos. Aparelho apresenta problema técnico comprovado.',
        
        // Dados do Requerente
        requerente: {
          tipo: 'Pessoa Física',
          nome: 'Maria Silva Santos',
          cpf_cnpj: '123.456.789-00',
          email: 'maria.santos@email.com',
          telefone: '(11) 98765-4321',
          endereco: 'Rua das Flores, 123, Apto 45',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          forma_contato_preferida: 'Email'
        },
        
        // Dados do Fornecedor
        fornecedor: {
          nome: 'Loja TecnoMundo Ltda',
          cnpj: '12.345.678/0001-90',
          endereco: 'Av. Principal, 456, Shopping Center Norte',
          telefone: '(11) 3333-4444',
          email: 'contato@tecnomundo.com.br'
        },
        
        // Detalhes da Ocorrência
        ocorrencia: {
          data: '2024-03-01',
          local: 'Loja física - Shopping Center Norte',
          produto_servico: 'Smartphone Samsung Galaxy A54 128GB',
          categoria: 'Produtos',
          subcategoria: 'Eletrônicos',
          valor_envolvido: 1500.00
        },
        
        // Configurações
        configuracoes: {
          autoriza_divulgacao: false,
          solicita_anonimato: false,
          possui_procuracao: false
        },
        
        // Documentos
        documentos: [
          { id: 1, nome: 'Nota Fiscal.pdf', tamanho: '2.3 MB', tipo: 'PDF', data_upload: '2024-03-15' },
          { id: 2, nome: 'Foto do Defeito.jpg', tamanho: '1.8 MB', tipo: 'Imagem', data_upload: '2024-03-15' },
          { id: 3, nome: 'Certificado Garantia.pdf', tamanho: '512 KB', tipo: 'PDF', data_upload: '2024-03-15' },
          { id: 4, nome: 'Conversa WhatsApp.jpg', tamanho: '3.2 MB', tipo: 'Imagem', data_upload: '2024-03-16' }
        ],
        
        // Tramitação
        tramitacao: {
          departamento_atual: 'Fiscalização de Produtos',
          responsavel_atual: 'Ana Paula Silva',
          data_distribuicao: '2024-03-16',
          observacoes_internas: 'Caso típico de recusa indevida de troca. Produto claramente com defeito de fabricação.'
        },
        
        // Histórico
        historico: [
          { 
            data: '2024-03-15', 
            acao: 'Protocolo criado', 
            usuario: 'Sistema - Portal Online', 
            observacoes: 'Protocolo registrado via portal web',
            status: 'Protocolado'
          },
          { 
            data: '2024-03-15', 
            acao: 'Documentos anexados', 
            usuario: 'Maria Silva Santos', 
            observacoes: '3 documentos enviados pelo requerente',
            status: 'Protocolado'
          },
          { 
            data: '2024-03-16', 
            acao: 'Protocolo distribuído', 
            usuario: 'Carlos Distribuidor', 
            observacoes: 'Encaminhado para Fiscalização de Produtos',
            status: 'Distribuído'
          },
          { 
            data: '2024-03-16', 
            acao: 'Análise iniciada', 
            usuario: 'Ana Paula Silva', 
            observacoes: 'Início da análise técnica do caso',
            status: 'Em Análise'
          },
          { 
            data: '2024-03-18', 
            acao: 'Documento adicional anexado', 
            usuario: 'Maria Silva Santos', 
            observacoes: 'Cliente enviou conversa de WhatsApp com a loja',
            status: 'Em Análise'
          },
          { 
            data: '2024-03-20', 
            acao: 'Empresa notificada', 
            usuario: 'Ana Paula Silva', 
            observacoes: 'Notificação enviada para TecnoMundo Ltda',
            status: 'Aguardando Resposta Empresa'
          }
        ],
        
        // Métricas
        metricas: {
          dias_tramitacao: 8,
          dias_restantes_prazo: 23,
          percentual_prazo_decorrido: 25,
          total_documentos: 4,
          total_movimentacoes: 6
        },
        
        // Respostas/Manifestações
        manifestacoes: [
          {
            id: 1,
            tipo: 'Resposta da Empresa',
            autor: 'TecnoMundo Ltda - Setor Jurídico',
            data: '2024-03-22',
            conteudo: 'A empresa informa que o produto foi analisado por nossa equipe técnica e constatou-se uso inadequado pelo consumidor, o que exclui a garantia conforme termos do certificado.',
            status: 'Recebida',
            documentos_anexos: 1
          },
          {
            id: 2,
            tipo: 'Tréplica do Consumidor',
            autor: 'Maria Silva Santos',
            data: '2024-03-25',
            conteudo: 'Discordo totalmente da alegação da empresa. O aparelho foi usado normalmente e o defeito é claramente de fabricação. Solicito nova análise técnica por perito independente.',
            status: 'Recebida',
            documentos_anexos: 0
          }
        ],
        
        // Dados para notificação
        notificacao_empresa: {
          enviada: true,
          data_envio: '2024-03-20',
          prazo_resposta: '2024-03-30',
          forma_envio: 'Email e Correio',
          status_entrega: 'Entregue'
        }
      };

      setProtocolo(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados do protocolo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Protocolado': 'bg-blue-100 text-blue-800',
      'Distribuído': 'bg-yellow-100 text-yellow-800',
      'Em Análise': 'bg-orange-100 text-orange-800',
      'Aguardando Resposta Empresa': 'bg-purple-100 text-purple-800',
      'Aguardando Documentos': 'bg-indigo-100 text-indigo-800',
      'Finalizado': 'bg-green-100 text-green-800',
      'Arquivado': 'bg-gray-100 text-gray-800',
      'Cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Urgente': 'bg-red-500 text-white',
      'Alta': 'bg-red-100 text-red-800',
      'Normal': 'bg-green-100 text-green-800',
      'Baixa': 'bg-gray-100 text-gray-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const getTipoSolicitacaoIcon = (tipo) => {
    const icons = {
      'Reclamação': ExclamationTriangleIcon,
      'Denúncia': XCircleIcon,
      'Consulta': ChatBubbleLeftRightIcon,
      'Sugestão': CheckCircleIcon,
      'Elogio': CheckCircleIcon
    };
    return icons[tipo] || DocumentTextIcon;
  };

  const handleEdit = () => {
    navigate(`/protocolo/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este protocolo?')) {
      try {
        showNotification('Protocolo excluído com sucesso', 'success');
        navigate('/protocolo');
      } catch (error) {
        showNotification('Erro ao excluir protocolo', 'error');
      }
    }
  };

  const handleDownloadDocument = (documento) => {
    showNotification(`Download iniciado: ${documento.nome}`, 'info');
  };

  const handlePrintProtocol = () => {
    showNotification('Preparando impressão...', 'info');
    window.print();
  };

  if (loading) return <LoadingSpinner />;
  if (!protocolo) return <div className="text-center text-red-600">Protocolo não encontrado</div>;

  const TipoIcon = getTipoSolicitacaoIcon(protocolo.tipo_solicitacao);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/protocolo')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {protocolo.numero_protocolo}
              </h1>
              <p className="text-gray-600 flex items-center">
                <TipoIcon className="h-4 w-4 mr-1" />
                {protocolo.tipo_solicitacao} - {protocolo.canal_entrada}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(protocolo.status)}`}>
              {protocolo.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(protocolo.prioridade)}`}>
              {protocolo.prioridade}
            </span>
            {protocolo.urgente && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Urgente
              </span>
            )}
            <div className="flex space-x-2">
              <button
                onClick={handlePrintProtocol}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                title="Imprimir"
              >
                <DocumentTextIcon className="h-5 w-5" />
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

      {/* Status da Tramitação */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-blue-50 rounded-lg mb-2">
              <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Protocolado em</p>
            <p className="text-lg font-bold text-gray-900">{formatDate(protocolo.data_protocolo)}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-orange-50 rounded-lg mb-2">
              <ClockIcon className="h-8 w-8 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Dias em tramitação</p>
            <p className="text-lg font-bold text-gray-900">{protocolo.metricas.dias_tramitacao}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-green-50 rounded-lg mb-2">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Dias restantes</p>
            <p className="text-lg font-bold text-gray-900">{protocolo.metricas.dias_restantes_prazo}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-purple-50 rounded-lg mb-2">
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Documentos</p>
            <p className="text-lg font-bold text-gray-900">{protocolo.metricas.total_documentos}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso do Prazo</span>
            <span>{protocolo.metricas.percentual_prazo_decorrido}% decorrido</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ width: `${protocolo.metricas.percentual_prazo_decorrido}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Início: {formatDate(protocolo.data_protocolo)}</span>
            <span>Prazo: {formatDate(protocolo.prazo_resposta)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'requerente', name: 'Requerente', icon: UserIcon },
            { id: 'fornecedor', name: 'Fornecedor', icon: BuildingOfficeIcon },
            { id: 'manifestacoes', name: 'Manifestações', icon: ChatBubbleLeftRightIcon },
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
            {/* Dados da Solicitação */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Solicitação</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Assunto</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{protocolo.assunto}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <div className="mt-1 flex items-center">
                    <TipoIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{protocolo.tipo_solicitacao}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Canal de Entrada</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.canal_entrada}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Categoria</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.ocorrencia.categoria}</p>
                </div>
              </div>
            </div>

            {/* Tramitação Atual */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tramitação Atual</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Departamento</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.tramitacao.departamento_atual}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Responsável</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.tramitacao.responsavel_atual}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data de Distribuição</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(protocolo.tramitacao.data_distribuicao)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(protocolo.status)}`}>
                    {protocolo.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Descrição Detalhada</h3>
              <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">
                {protocolo.descricao}
              </p>
            </div>

            {/* Detalhes da Ocorrência */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes da Ocorrência</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data da Ocorrência</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(protocolo.ocorrencia.data)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Valor Envolvido</label>
                  <div className="mt-1 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(protocolo.ocorrencia.valor_envolvido)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Local da Ocorrência</label>
                  <div className="mt-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{protocolo.ocorrencia.local}</span>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-500">Produto/Serviço</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.ocorrencia.produto_servico}</p>
                </div>
              </div>
            </div>

            {/* Observações */}
            {protocolo.observacoes && (
              <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações</h3>
                <p className="text-sm text-gray-900 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  {protocolo.observacoes}
                </p>
              </div>
            )}

            {/* Observações Internas */}
            {protocolo.tramitacao.observacoes_internas && (
              <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações Internas</h3>
                <p className="text-sm text-gray-900 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  {protocolo.tramitacao.observacoes_internas}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requerente' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Dados do Requerente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo</label>
                <p className="mt-1 text-sm text-gray-900">{protocolo.requerente.tipo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome/Razão Social</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">{protocolo.requerente.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">CPF/CNPJ</label>
                <p className="mt-1 text-sm text-gray-900">{protocolo.requerente.cpf_cnpj}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <a href={`mailto:${protocolo.requerente.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                    {protocolo.requerente.email}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Telefone</label>
                <div className="mt-1 flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <a href={`tel:${protocolo.requerente.telefone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                    {protocolo.requerente.telefone}
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Forma de Contato Preferida</label>
                <p className="mt-1 text-sm text-gray-900">{protocolo.requerente.forma_contato_preferida}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Endereço</label>
                <div className="mt-1 flex items-center">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {protocolo.requerente.endereco}, {protocolo.requerente.cidade} - {protocolo.requerente.estado}, CEP: {protocolo.requerente.cep}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Configurações</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${protocolo.configuracoes.autoriza_divulgacao ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Autoriza divulgação para fins estatísticos</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${protocolo.configuracoes.solicita_anonimato ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Solicitou anonimato na tramitação</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${protocolo.configuracoes.possui_procuracao ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Possui procuração para representação</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fornecedor' && (
          <div className="space-y-6">
            {/* Dados do Fornecedor */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Dados da Empresa/Fornecedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nome/Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{protocolo.fornecedor.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{protocolo.fornecedor.cnpj}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`mailto:${protocolo.fornecedor.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {protocolo.fornecedor.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefone</label>
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${protocolo.fornecedor.telefone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {protocolo.fornecedor.telefone}
                    </a>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Endereço</label>
                  <div className="mt-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{protocolo.fornecedor.endereco}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status da Notificação */}
            {protocolo.notificacao_empresa && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Status da Notificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status da Notificação</label>
                    <div className="mt-1 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-700 font-medium">Notificada</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Data de Envio</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(protocolo.notificacao_empresa.data_envio)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Prazo para Resposta</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(protocolo.notificacao_empresa.prazo_resposta)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Forma de Envio</label>
                    <p className="mt-1 text-sm text-gray-900">{protocolo.notificacao_empresa.forma_envio}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status de Entrega</label>
                    <span className="mt-1 inline-flex px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {protocolo.notificacao_empresa.status_entrega}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manifestacoes' && (
          <div className="space-y-6">
            {protocolo.manifestacoes.map((manifestacao) => (
              <div key={manifestacao.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{manifestacao.tipo}</h4>
                    <p className="text-sm text-gray-600">
                      Por: {manifestacao.autor} - {formatDate(manifestacao.data)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    manifestacao.status === 'Recebida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {manifestacao.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed">{manifestacao.conteudo}</p>
                </div>
                {manifestacao.documentos_anexos > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
                    {manifestacao.documentos_anexos} documento(s) anexado(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Documentos do Protocolo</h3>
            </div>
            <div className="p-6">
              {protocolo.documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {protocolo.documentos.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              doc.tipo === 'PDF' ? 'bg-red-100 text-red-800' : 
                              doc.tipo === 'Imagem' ? 'bg-green-100 text-green-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.tipo}
                            </span>
                          </div>
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
                  <p className="mt-1 text-sm text-gray-500">Não há documentos anexados a este protocolo.</p>
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
                  {protocolo.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== protocolo.historico.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(item.status)}`}>
                              <ClockIcon className="h-4 w-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{item.acao}</p>
                              <p className="text-sm text-gray-500">por {item.usuario}</p>
                              {item.observacoes && (
                                <p className="text-sm text-gray-600 mt-1">{item.observacoes}</p>
                              )}
                              <span className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
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

export default ProtocoloDetail;