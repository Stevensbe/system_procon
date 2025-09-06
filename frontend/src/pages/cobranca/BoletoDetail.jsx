import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  PaperClipIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  BanknotesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const BoletoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [boleto, setBoleto] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadBoleto();
    loadHistoricoPagamentos();
  }, [id]);

  const loadBoleto = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        id: parseInt(id),
        numero: 'BOL-2024-001234',
        linhaDigitavel: '34191.09008 01234.567890 12345.678901 8 98760000012345',
        codigoBarras: '34198987600000123451090001234567891234567890',
        valor: 1250.75,
        valorOriginal: 1000.00,
        valorJuros: 150.00,
        valorMulta: 100.75,
        valorDesconto: 0.00,
        dataEmissao: '2024-08-15T10:30:00',
        dataVencimento: '2024-09-15T23:59:59',
        dataPagamento: null,
        status: 'pendente',
        statusLabel: 'Pendente',
        statusColor: 'text-yellow-600 bg-yellow-100',
        devedor: {
          nome: 'Empresa ABC Ltda',
          cnpj: '12.345.678/0001-90',
          endereco: 'Rua Principal, 123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01000-000',
          telefone: '(11) 3333-4444',
          email: 'financeiro@empresaabc.com.br'
        },
        processo: {
          numero: '2024001',
          tipo: 'Multa Administrativa',
          assunto: 'Prática Comercial Abusiva',
          fiscal: 'Ana Silva'
        },
        banco: {
          codigo: '341',
          nome: 'Itaú Unibanco',
          agencia: '1234',
          conta: '56789-0'
        },
        observacoes: 'Pagamento referente à multa aplicada por prática comercial abusiva conforme processo administrativo.',
        instrucoesCobranca: [
          'Sr. Caixa, não receber após o vencimento',
          'Após vencimento cobrar multa de 10% + juros de 1% a.m.',
          'Em caso de dúvidas, entrar em contato com o PROCON'
        ],
        documentosAnexos: [
          {
            id: 1,
            nome: 'Auto_Infracao_Original.pdf',
            tamanho: '2.1 MB',
            tipo: 'application/pdf',
            dataUpload: '2024-08-15T10:30:00'
          },
          {
            id: 2,
            nome: 'Notificacao_Cobranca.pdf',
            tamanho: '850 KB',
            tipo: 'application/pdf',
            dataUpload: '2024-08-15T10:32:00'
          }
        ],
        taxas: {
          taxaEmissao: 2.50,
          taxaCobranca: 5.00,
          taxaRegistro: 10.00
        }
      };
      
      setBoleto(mockData);
    } catch (error) {
      showNotification('Erro ao carregar boleto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricoPagamentos = async () => {
    try {
      const mockHistorico = [
        {
          id: 1,
          data: '2024-08-15T10:30:00',
          usuario: 'Sistema',
          acao: 'Boleto emitido',
          detalhes: 'Boleto gerado automaticamente após vencimento do prazo de pagamento voluntário',
          status: 'info',
          valor: null
        },
        {
          id: 2,
          data: '2024-08-16T14:20:00',
          usuario: 'João Santos',
          acao: 'Boleto enviado por email',
          detalhes: 'Enviado para: financeiro@empresaabc.com.br',
          status: 'success',
          valor: null
        },
        {
          id: 3,
          data: '2024-08-20T09:15:00',
          usuario: 'Sistema',
          acao: 'Lembrete enviado',
          detalhes: 'Email de lembrete sobre vencimento próximo',
          status: 'info',
          valor: null
        }
      ];
      
      setHistoricoPagamentos(mockHistorico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pago':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'vencido':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'cancelado':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getHistoricoIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const calcularDiasVencimento = (dataVencimento) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarCNPJ = (cnpj) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatarCEP = (cep) => {
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const handleImprimirBoleto = () => {
    showNotification('Preparando boleto para impressão...', 'info');
    // Aqui implementaria a lógica de impressão
  };

  const handleBaixarBoleto = () => {
    showNotification('Download do boleto iniciado', 'success');
    // Aqui implementaria o download do PDF
  };

  const handleEnviarEmail = () => {
    showNotification('Email enviado com sucesso!', 'success');
    // Aqui implementaria o envio por email
  };

  const handleRegistrarPagamento = () => {
    navigate(`/cobranca/boletos/${id}/pagamento`);
  };

  const handleCancelarBoleto = () => {
    if (confirm('Tem certeza que deseja cancelar este boleto?')) {
      showNotification('Boleto cancelado com sucesso!', 'success');
      // Aqui implementaria o cancelamento
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!boleto) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Boleto não encontrado.</p>
      </div>
    );
  }

  const diasVencimento = calcularDiasVencimento(boleto.dataVencimento);
  const isVencido = diasVencimento < 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/cobranca/boletos"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Boleto {boleto.numero}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Detalhes do boleto de cobrança
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(boleto.status)}`}>
              {boleto.statusLabel}
            </span>
          </div>
        </div>

        {/* Alert para boletos vencidos */}
        {isVencido && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Boleto Vencido
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  Este boleto venceu há {Math.abs(diasVencimento)} dias. 
                  Podem ter sido aplicados juros e multas ao valor original.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dados do Boleto */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <BanknotesIcon className="w-5 h-5 mr-2" />
                  Dados do Boleto
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número do Boleto
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {boleto.numero}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Emissão
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(boleto.dataEmissao).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Vencimento
                    </label>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
                      </p>
                      {diasVencimento !== null && (
                        <p className={`text-xs ${isVencido ? 'text-red-600' : diasVencimento <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {isVencido ? `Vencido há ${Math.abs(diasVencimento)} dias` : 
                           diasVencimento === 0 ? 'Vence hoje' : 
                           `${diasVencimento} dias para vencimento`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor Total
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatarMoeda(boleto.valor)}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Linha Digitável
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded flex-1">
                        {boleto.linhaDigitavel}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(boleto.linhaDigitavel)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Copiar linha digitável"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código de Barras
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded flex-1 break-all">
                        {boleto.codigoBarras}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(boleto.codigoBarras)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Copiar código de barras"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Composição do Valor */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  Composição do Valor
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Valor Original:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatarMoeda(boleto.valorOriginal)}
                    </span>
                  </div>
                  
                  {boleto.valorJuros > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Juros:</span>
                      <span className="text-sm font-medium text-red-600">
                        + {formatarMoeda(boleto.valorJuros)}
                      </span>
                    </div>
                  )}
                  
                  {boleto.valorMulta > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Multa:</span>
                      <span className="text-sm font-medium text-red-600">
                        + {formatarMoeda(boleto.valorMulta)}
                      </span>
                    </div>
                  )}
                  
                  {boleto.valorDesconto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Desconto:</span>
                      <span className="text-sm font-medium text-green-600">
                        - {formatarMoeda(boleto.valorDesconto)}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900 dark:text-white">Total a Pagar:</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {formatarMoeda(boleto.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Taxas */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Taxas Bancárias:</h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Taxa de Emissão:</span>
                        <span>{formatarMoeda(boleto.taxas.taxaEmissao)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Cobrança:</span>
                        <span>{formatarMoeda(boleto.taxas.taxaCobranca)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Registro:</span>
                        <span>{formatarMoeda(boleto.taxas.taxaRegistro)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Devedor */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Dados do Devedor
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome/Razão Social
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {boleto.devedor.nome}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CNPJ
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatarCNPJ(boleto.devedor.cnpj)}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Endereço Completo
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {boleto.devedor.endereco}, {boleto.devedor.bairro}, {boleto.devedor.cidade}/{boleto.devedor.uf}, 
                      CEP: {formatarCEP(boleto.devedor.cep)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {boleto.devedor.telefone}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {boleto.devedor.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruções de Cobrança */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Instruções de Cobrança
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {boleto.instrucoesCobranca.map((instrucao, index) => (
                    <li key={index} className="text-sm text-gray-900 dark:text-white flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {instrucao}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Observações */}
            {boleto.observacoes && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Observações
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {boleto.observacoes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ações */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Ações
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={handleImprimirBoleto}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  Imprimir Boleto
                </button>

                <button
                  onClick={handleBaixarBoleto}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Baixar PDF
                </button>

                <button
                  onClick={handleEnviarEmail}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Enviar por Email
                </button>

                <Link
                  to={`/cobranca/boletos/${id}/editar`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  Editar Boleto
                </Link>

                {boleto.status === 'pendente' && (
                  <>
                    <button
                      onClick={handleRegistrarPagamento}
                      className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Registrar Pagamento
                    </button>

                    <button
                      onClick={handleCancelarBoleto}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                      Cancelar Boleto
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dados do Processo */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Processo Relacionado
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Número do Processo
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {boleto.processo.numero}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Tipo
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.processo.tipo}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Assunto
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.processo.assunto}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Fiscal Responsável
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.processo.fiscal}
                  </p>
                </div>
              </div>
            </div>

            {/* Dados Bancários */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dados Bancários
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Banco
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.banco.codigo} - {boleto.banco.nome}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Agência
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.banco.agencia}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Conta
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.banco.conta}
                  </p>
                </div>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Histórico
                </h2>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {historicoPagamentos.map((item, index) => (
                      <li key={item.id}>
                        <div className="relative pb-8">
                          {index !== historicoPagamentos.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700">
                                {getHistoricoIcon(item.status)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                  {item.acao}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {item.detalhes}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    por {item.usuario}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(item.data).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                {item.valor && (
                                  <p className="text-sm font-medium text-green-600 mt-1">
                                    {formatarMoeda(item.valor)}
                                  </p>
                                )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoletoDetail;