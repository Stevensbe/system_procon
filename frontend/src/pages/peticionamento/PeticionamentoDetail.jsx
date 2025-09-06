import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ScaleIcon,
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
  ChatBubbleLeftRightIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PeticionamentoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [peticionamento, setPeticionamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchPeticionamentoDetail();
  }, [id]);

  const fetchPeticionamentoDetail = async () => {
    try {
      setLoading(true);
      // Simular dados do peticionamento
      const mockData = {
        id: id,
        numero_peticionamento: `PET-${id}-2024`,
        numero_processo: 'PROC-2024-001234',
        tipo_peticionamento: 'Petição Inicial',
        data_apresentacao: '2024-03-20',
        data_protocolo: '2024-03-20T14:30:00',
        status: 'Protocolado',
        prioridade: 'Alta',
        urgente: false,
        confidencial: false,
        assunto: 'Ação de Reparação de Danos - Produto com Defeito',
        descricao: 'Petição inicial requerendo reparação de danos materiais e morais decorrentes de produto defeituoso (smartphone Samsung Galaxy A54) vendido pela empresa requerida. O produto apresentou defeito na tela após 15 dias de uso normal, sendo recusada a troca pela loja sob alegação infundada de mau uso pelo consumidor.',
        fundamentacao_legal: 'Art. 6º, VI e VIII (direitos básicos do consumidor - proteção contra publicidade enganosa e facilitação da defesa); Art. 14, §1º (responsabilidade do fornecedor por defeitos); Art. 18, §1º, II (prazo para solução de vícios aparentes) do Código de Defesa do Consumidor (Lei 8.078/90)',
        
        // Dados do Peticionário
        peticionario: {
          tipo: 'Pessoa Física',
          nome: 'João Carlos da Silva',
          cpf_cnpj: '123.456.789-00',
          email: 'joao.silva@email.com',
          telefone: '(11) 98765-4321',
          endereco: 'Rua das Palmeiras, 456, Apto 78',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          profissao: 'Engenheiro Civil'
        },
        
        // Dados do Procurador
        procurador: {
          nome: 'Dra. Maria Fernanda Costa',
          oab: 'SP 234.567',
          email: 'maria.costa@advocacia.com',
          telefone: '(11) 3333-4444',
          escritorio: 'Costa & Associados Advocacia'
        },
        
        // Parte Contrária
        parte_contraria: {
          nome: 'TecnoMax Eletrônicos Ltda',
          cnpj: '12.345.678/0001-90',
          endereco: 'Av. Comercial, 789, Centro Empresarial, São Paulo - SP',
          telefone: '(11) 4444-5555',
          email: 'juridico@tecnomax.com.br'
        },
        
        // Pedidos
        pedidos: [
          {
            id: 1,
            tipo: 'Principal',
            descricao: 'Condenação da requerida ao pagamento de indenização por danos materiais no valor de R$ 1.500,00 (mil e quinhentos reais), correspondente ao valor do produto defeituoso',
            fundamentacao: 'Produto apresentou defeito dentro do prazo de garantia, configurando vício do produto nos termos do art. 18 do CDC',
            valor_causa: 1500.00,
            prazo_cumprimento: '30 dias',
            status: 'Ativo'
          },
          {
            id: 2,
            tipo: 'Principal',
            descricao: 'Condenação da requerida ao pagamento de indenização por danos morais no valor de R$ 3.500,00 (três mil e quinhentos reais)',
            fundamentacao: 'Constrangimento e aborrecimento decorrentes da recusa injustificada da troca do produto',
            valor_causa: 3500.00,
            prazo_cumprimento: '30 dias',
            status: 'Ativo'
          },
          {
            id: 3,
            tipo: 'Subsidiário',
            descricao: 'Alternativamente, troca do produto por outro da mesma espécie, em perfeitas condições de funcionamento',
            fundamentacao: 'Direito à substituição previsto no art. 18, §1º, I do CDC',
            valor_causa: 1500.00,
            prazo_cumprimento: '15 dias',
            status: 'Alternativo'
          }
        ],
        
        // Informações Processuais
        informacoes_processuais: {
          competencia: '1ª Vara Cível de São Paulo',
          categoria_direito: 'Direito do Consumidor',
          subcategoria: 'Vícios do Produto',
          valor_total_causa: 5000.00,
          beneficiario_gratuidade: false,
          requer_liminar: true,
          requer_tutela_antecipada: false,
          forma_intimacao: 'Email',
          protocolo_relacionado: 'PROT-2024-000789'
        },
        
        // Documentos
        documentos: [
          { 
            id: 1, 
            nome: 'Petição Inicial.pdf', 
            tamanho: '3.2 MB', 
            tipo: 'PDF', 
            categoria: 'Petição',
            data_upload: '2024-03-20',
            obrigatorio: true
          },
          { 
            id: 2, 
            nome: 'RG - João Carlos.pdf', 
            tamanho: '1.1 MB', 
            tipo: 'PDF', 
            categoria: 'Identidade',
            data_upload: '2024-03-20',
            obrigatorio: true
          },
          { 
            id: 3, 
            nome: 'Comprovante Residência.pdf', 
            tamanho: '890 KB', 
            tipo: 'PDF', 
            categoria: 'Comprovante',
            data_upload: '2024-03-20',
            obrigatorio: true
          },
          { 
            id: 4, 
            nome: 'Procuração - Maria Fernanda.pdf', 
            tamanho: '654 KB', 
            tipo: 'PDF', 
            categoria: 'Procuração',
            data_upload: '2024-03-20',
            obrigatorio: true
          },
          { 
            id: 5, 
            nome: 'Nota Fiscal Produto.pdf', 
            tamanho: '1.8 MB', 
            tipo: 'PDF', 
            categoria: 'Comprobatório',
            data_upload: '2024-03-20',
            obrigatorio: false
          },
          { 
            id: 6, 
            nome: 'Fotos do Defeito.zip', 
            tamanho: '4.2 MB', 
            tipo: 'Arquivo', 
            categoria: 'Comprobatório',
            data_upload: '2024-03-20',
            obrigatorio: false
          },
          { 
            id: 7, 
            nome: 'Laudo Técnico.pdf', 
            tamanho: '2.1 MB', 
            tipo: 'PDF', 
            categoria: 'Comprobatório',
            data_upload: '2024-03-21',
            obrigatorio: false
          }
        ],
        
        // Histórico
        historico: [
          { 
            data: '2024-03-20', 
            acao: 'Peticionamento criado', 
            usuario: 'Dra. Maria Fernanda Costa', 
            observacoes: 'Petição inicial elaborada e documentos coletados',
            status: 'Rascunho'
          },
          { 
            data: '2024-03-20', 
            acao: 'Documentos anexados', 
            usuario: 'Dra. Maria Fernanda Costa', 
            observacoes: '6 documentos anexados (4 obrigatórios, 2 comprobatórios)',
            status: 'Rascunho'
          },
          { 
            data: '2024-03-20', 
            acao: 'Petição protocolada', 
            usuario: 'Sistema - PROCON', 
            observacoes: 'Petição protocolada via sistema às 14:30h',
            status: 'Protocolado'
          },
          { 
            data: '2024-03-20', 
            acao: 'Número de processo gerado', 
            usuario: 'Sistema - Judiciário', 
            observacoes: 'Processo PROC-2024-001234 criado automaticamente',
            status: 'Processando'
          },
          { 
            data: '2024-03-21', 
            acao: 'Documento adicional anexado', 
            usuario: 'Dra. Maria Fernanda Costa', 
            observacoes: 'Laudo técnico complementar anexado',
            status: 'Processando'
          },
          { 
            data: '2024-03-21', 
            acao: 'Distribuição automática', 
            usuario: 'Sistema - Judiciário', 
            observacoes: 'Processo distribuído para 1ª Vara Cível',
            status: 'Distribuído'
          }
        ],
        
        // Andamentos Processuais (se houver)
        andamentos: [
          {
            id: 1,
            data: '2024-03-21',
            tipo: 'Distribuição',
            descricao: 'Processo distribuído para 1ª Vara Cível de São Paulo',
            responsavel: 'Sistema Judiciário',
            observacoes: 'Distribuição automática por sorteio eletrônico'
          },
          {
            id: 2,
            data: '2024-03-22',
            tipo: 'Despacho Inicial',
            descricao: 'Despacho determinando citação da parte requerida',
            responsavel: 'Juiz Dr. Roberto Silva',
            observacoes: 'Prazo de 15 dias para citação'
          }
        ],
        
        // Configurações
        configuracoes: {
          autoriza_publicacao: false,
          requer_vista_autos: true,
          notificacao_email: true,
          acompanhamento_processo: true
        },
        
        // Métricas
        metricas: {
          dias_desde_protocolo: 5,
          total_documentos: 7,
          documentos_obrigatorios: 4,
          valor_total_pedidos: 5000.00,
          total_andamentos: 2,
          status_documentacao: 'Completa'
        },
        
        observacoes: 'Caso com boa fundamentação jurídica e documentação completa. Cliente possui todos os comprovantes necessários e laudo técnico que comprova o defeito do produto.',
        observacoes_internas: 'Processo com alta probabilidade de êxito. Documentação bem organizada e fundamentação sólida baseada no CDC.'
      };

      setPeticionamento(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados do peticionamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Rascunho': 'bg-gray-100 text-gray-800',
      'Protocolado': 'bg-blue-100 text-blue-800',
      'Processando': 'bg-yellow-100 text-yellow-800',
      'Distribuído': 'bg-green-100 text-green-800',
      'Em Andamento': 'bg-orange-100 text-orange-800',
      'Finalizado': 'bg-purple-100 text-purple-800',
      'Arquivado': 'bg-gray-100 text-gray-800'
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

  const getTipoPedidoColor = (tipo) => {
    const colors = {
      'Principal': 'bg-indigo-100 text-indigo-800',
      'Subsidiário': 'bg-orange-100 text-orange-800',
      'Alternativo': 'bg-yellow-100 text-yellow-800',
      'Cautelar': 'bg-red-100 text-red-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getCategoriaDocColor = (categoria) => {
    const colors = {
      'Petição': 'bg-purple-100 text-purple-800',
      'Identidade': 'bg-blue-100 text-blue-800',
      'Comprovante': 'bg-green-100 text-green-800',
      'Procuração': 'bg-orange-100 text-orange-800',
      'Comprobatório': 'bg-yellow-100 text-yellow-800'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    navigate(`/peticionamento/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este peticionamento?')) {
      try {
        showNotification('Peticionamento excluído com sucesso', 'success');
        navigate('/peticionamento');
      } catch (error) {
        showNotification('Erro ao excluir peticionamento', 'error');
      }
    }
  };

  const handleDownloadDocument = (documento) => {
    showNotification(`Download iniciado: ${documento.nome}`, 'info');
  };

  const handlePrintPetition = () => {
    showNotification('Preparando impressão da petição...', 'info');
    window.print();
  };

  if (loading) return <LoadingSpinner />;
  if (!peticionamento) return <div className="text-center text-red-600">Peticionamento não encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/peticionamento')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {peticionamento.numero_peticionamento}
              </h1>
              <p className="text-gray-600 flex items-center">
                <ScaleIcon className="h-4 w-4 mr-1" />
                {peticionamento.tipo_peticionamento}
                {peticionamento.numero_processo && (
                  <span className="ml-4 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    {peticionamento.numero_processo}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(peticionamento.status)}`}>
              {peticionamento.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(peticionamento.prioridade)}`}>
              {peticionamento.prioridade}
            </span>
            {peticionamento.urgente && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Urgente
              </span>
            )}
            {peticionamento.confidencial && (
              <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-medium">
                Confidencial
              </span>
            )}
            <div className="flex space-x-2">
              <button
                onClick={handlePrintPetition}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                title="Imprimir Petição"
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

      {/* Resumo Executivo */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-blue-50 rounded-lg mb-2">
              <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Data Protocolo</p>
            <p className="text-lg font-bold text-gray-900">{formatDate(peticionamento.data_apresentacao)}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-green-50 rounded-lg mb-2">
              <BanknotesIcon className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Valor da Causa</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(peticionamento.informacoes_processuais.valor_total_causa)}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-purple-50 rounded-lg mb-2">
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Documentos</p>
            <p className="text-lg font-bold text-gray-900">{peticionamento.metricas.total_documentos}</p>
            <p className="text-xs text-gray-500">{peticionamento.metricas.status_documentacao}</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-orange-50 rounded-lg mb-2">
              <ClockIcon className="h-8 w-8 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Dias Tramitando</p>
            <p className="text-lg font-bold text-gray-900">{peticionamento.metricas.dias_desde_protocolo}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'partes', name: 'Partes', icon: UserIcon },
            { id: 'pedidos', name: 'Pedidos', icon: CheckCircleIcon },
            { id: 'documentos', name: 'Documentos', icon: DocumentArrowDownIcon },
            { id: 'andamentos', name: 'Andamentos', icon: ClockIcon },
            { id: 'historico', name: 'Histórico', icon: ChatBubbleLeftRightIcon }
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
            {/* Informações da Petição */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Petição</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Assunto</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{peticionamento.assunto}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <div className="mt-1 flex items-center">
                    <ScaleIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{peticionamento.tipo_peticionamento}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Competência</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.informacoes_processuais.competencia}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Categoria de Direito</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.informacoes_processuais.categoria_direito}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Subcategoria</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.informacoes_processuais.subcategoria}</p>
                </div>
              </div>
            </div>

            {/* Informações Processuais */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Processuais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Valor Total da Causa</label>
                  <div className="mt-1 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(peticionamento.informacoes_processuais.valor_total_causa)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Forma de Intimação</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.informacoes_processuais.forma_intimacao}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Protocolo Relacionado</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.informacoes_processuais.protocolo_relacionado}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Configurações</label>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className={`h-4 w-4 ${peticionamento.informacoes_processuais.beneficiario_gratuidade ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm text-gray-700">Beneficiário da justiça gratuita</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className={`h-4 w-4 ${peticionamento.informacoes_processuais.requer_liminar ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm text-gray-700">Requer liminar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className={`h-4 w-4 ${peticionamento.informacoes_processuais.requer_tutela_antecipada ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm text-gray-700">Requer tutela antecipada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição dos Fatos */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Descrição dos Fatos</h3>
              <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">
                {peticionamento.descricao}
              </p>
            </div>

            {/* Fundamentação Legal */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fundamentação Legal</h3>
              <p className="text-sm text-gray-900 bg-blue-50 p-4 rounded-lg leading-relaxed border-l-4 border-blue-400">
                {peticionamento.fundamentacao_legal}
              </p>
            </div>

            {/* Observações */}
            {peticionamento.observacoes && (
              <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações</h3>
                <p className="text-sm text-gray-900 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  {peticionamento.observacoes}
                </p>
              </div>
            )}

            {/* Observações Internas */}
            {peticionamento.observacoes_internas && (
              <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações Internas</h3>
                <p className="text-sm text-gray-900 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  {peticionamento.observacoes_internas}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'partes' && (
          <div className="space-y-8">
            {/* Dados do Peticionário */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Peticionário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.peticionario.tipo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nome/Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{peticionamento.peticionario.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">CPF/CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.peticionario.cpf_cnpj}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Profissão</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.peticionario.profissao}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`mailto:${peticionamento.peticionario.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {peticionamento.peticionario.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefone</label>
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${peticionamento.peticionario.telefone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {peticionamento.peticionario.telefone}
                    </a>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Endereço</label>
                  <div className="mt-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {peticionamento.peticionario.endereco}, {peticionamento.peticionario.cidade} - {peticionamento.peticionario.estado}, CEP: {peticionamento.peticionario.cep}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Procurador */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Procurador
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nome</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{peticionamento.procurador.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">OAB</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.procurador.oab}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Escritório</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.procurador.escritorio}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`mailto:${peticionamento.procurador.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {peticionamento.procurador.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefone</label>
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${peticionamento.procurador.telefone}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {peticionamento.procurador.telefone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Parte Contrária */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Parte Contrária/Requerida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nome/Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{peticionamento.parte_contraria.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{peticionamento.parte_contraria.cnpj}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{peticionamento.parte_contraria.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefone</label>
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{peticionamento.parte_contraria.telefone}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Endereço</label>
                  <div className="mt-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{peticionamento.parte_contraria.endereco}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Pedidos da Petição</h3>
              <div className="space-y-6">
                {peticionamento.pedidos.map((pedido, index) => (
                  <div key={pedido.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-medium text-gray-700">Pedido #{index + 1}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoPedidoColor(pedido.tipo)}`}>
                          {pedido.tipo}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pedido.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pedido.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Valor</p>
                        <p className="text-lg font-bold text-indigo-600">{formatCurrency(pedido.valor_causa)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Pedido</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">
                          {pedido.descricao}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fundamentação</label>
                        <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg leading-relaxed border-l-4 border-blue-400">
                          {pedido.fundamentacao}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Prazo para Cumprimento</label>
                          <p className="mt-1 text-sm text-gray-900">{pedido.prazo_cumprimento}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Valor da Causa</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">{formatCurrency(pedido.valor_causa)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Valor Total dos Pedidos:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(peticionamento.pedidos.reduce((total, pedido) => total + pedido.valor_causa, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Documentos do Peticionamento</h3>
            </div>
            <div className="p-6">
              {peticionamento.documentos.length > 0 ? (
                <div className="space-y-4">
                  {/* Documentos Obrigatórios */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Documentos Obrigatórios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {peticionamento.documentos.filter(doc => doc.obrigatorio).map((doc) => (
                        <div key={doc.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoriaDocColor(doc.categoria)}`}>
                                  {doc.categoria}
                                </span>
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
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
                  </div>

                  {/* Documentos Comprobatórios */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Documentos Comprobatórios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {peticionamento.documentos.filter(doc => !doc.obrigatorio).map((doc) => (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoriaDocColor(doc.categoria)}`}>
                                  {doc.categoria}
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
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento</h3>
                  <p className="mt-1 text-sm text-gray-500">Não há documentos anexados a este peticionamento.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'andamentos' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Andamentos Processuais</h3>
            </div>
            <div className="p-6">
              {peticionamento.andamentos && peticionamento.andamentos.length > 0 ? (
                <div className="space-y-6">
                  {peticionamento.andamentos.map((andamento) => (
                    <div key={andamento.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{andamento.tipo}</h4>
                          <p className="text-sm text-gray-600">
                            Por: {andamento.responsavel} - {formatDate(andamento.data)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Processual
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-900 leading-relaxed">{andamento.descricao}</p>
                      </div>
                      {andamento.observacoes && (
                        <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          <strong>Observações:</strong> {andamento.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum andamento processual</h3>
                  <p className="mt-1 text-sm text-gray-500">Ainda não há andamentos processuais registrados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Histórico do Peticionamento</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {peticionamento.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== peticionamento.historico.length - 1 && (
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

export default PeticionamentoDetail;