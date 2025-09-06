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
  ScaleIcon,
  PaperClipIcon,
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const TramitacaoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tramitacao, setTramitacao] = useState(null);
  const [historico, setHistorico] = useState([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadTramitacao();
    loadHistorico();
  }, [id]);

  const loadTramitacao = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        id: parseInt(id),
        protocolo: 'TRAM-2024-001',
        processo: {
          numero: '2024001',
          interessado: 'João Silva',
          cpfCnpj: '123.456.789-00',
          assunto: 'Reclamação contra empresa XYZ'
        },
        tipoTramitacao: 'encaminhamento',
        tipoLabel: 'Encaminhamento',
        orgaoOrigem: {
          nome: 'PROCON Municipal',
          sigla: 'PROCON'
        },
        orgaoDestino: {
          nome: 'Ministério Público',
          sigla: 'MP'
        },
        responsavelOrigem: {
          nome: 'Ana Silva',
          cargo: 'Fiscal',
          email: 'ana@procon.gov.br'
        },
        responsavelDestino: {
          nome: 'Carlos Santos',
          cargo: 'Promotor',
          email: 'carlos@mp.gov.br'
        },
        dataEnvio: '2024-08-27T10:30:00',
        prazoResposta: '2024-09-10T23:59:00',
        prioridade: 'alta',
        prioridadeLabel: 'Alta',
        prioridadeColor: 'text-yellow-600 bg-yellow-100',
        status: 'em_andamento',
        statusLabel: 'Em Andamento',
        statusColor: 'text-blue-600 bg-blue-100',
        assunto: 'Análise de processo administrativo para possível abertura de PAC',
        motivoTramitacao: 'O processo apresenta indícios de prática comercial abusiva que pode configurar crime contra as relações de consumo, necessitando análise do Ministério Público para eventual instauração de procedimento administrativo criminal.',
        acao: 'Analisar o processo e verificar a necessidade de instauração de PAC (Procedimento Administrativo Criminal) contra a empresa fornecedora.',
        observacoes: 'Urgente - consumidores relataram problemas graves de saúde.',
        protocoloInterno: 'PROT-2024-001',
        protocoloExterno: 'MP-2024-12345',
        dataRecebimento: '2024-08-28T14:20:00',
        documentosAnexos: [
          {
            id: 1,
            nome: 'Processo_Original.pdf',
            tamanho: '2.5 MB',
            tipo: 'application/pdf',
            dataUpload: '2024-08-27T10:30:00'
          },
          {
            id: 2,
            nome: 'Laudo_Tecnico.pdf',
            tamanho: '1.8 MB',
            tipo: 'application/pdf',
            dataUpload: '2024-08-27T10:32:00'
          },
          {
            id: 3,
            nome: 'Fotos_Evidencias.zip',
            tamanho: '15.2 MB',
            tipo: 'application/zip',
            dataUpload: '2024-08-27T10:35:00'
          }
        ]
      };
      
      setTramitacao(mockData);
    } catch (error) {
      showNotification('Erro ao carregar tramitação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistorico = async () => {
    try {
      const mockHistorico = [
        {
          id: 1,
          data: '2024-08-28T16:45:00',
          usuario: 'Carlos Santos',
          acao: 'Processo recebido e distribuído',
          detalhes: 'Processo distribuído para análise da Promotoria de Defesa do Consumidor',
          status: 'info'
        },
        {
          id: 2,
          data: '2024-08-28T14:20:00',
          usuario: 'Sistema',
          acao: 'Processo recebido pelo órgão de destino',
          detalhes: 'Confirmação automática de recebimento',
          status: 'success'
        },
        {
          id: 3,
          data: '2024-08-27T10:30:00',
          usuario: 'Ana Silva',
          acao: 'Processo enviado',
          detalhes: 'Tramitação iniciada com prioridade alta',
          status: 'info'
        },
        {
          id: 4,
          data: '2024-08-27T10:25:00',
          usuario: 'Ana Silva',
          acao: 'Tramitação criada',
          detalhes: 'Nova tramitação registrada no sistema',
          status: 'info'
        }
      ];
      
      setHistorico(mockHistorico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'em_andamento':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'concluido':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'cancelado':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'baixa':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'normal':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'alta':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'urgente':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
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
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = (arquivo) => {
    showNotification(`Download iniciado: ${arquivo.nome}`, 'success');
  };

  const handleViewFile = (arquivo) => {
    showNotification(`Visualizando: ${arquivo.nome}`, 'info');
  };

  const calcularDiasRestantes = (prazo) => {
    if (!prazo) return null;
    const hoje = new Date();
    const dataPrazo = new Date(prazo);
    const diffTime = dataPrazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tramitacao) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Tramitação não encontrada.</p>
      </div>
    );
  }

  const diasRestantes = calcularDiasRestantes(tramitacao.prazoResposta);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/tramitacao/lista"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tramitação {tramitacao.protocolo}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Detalhes da tramitação do processo {tramitacao.processo.numero}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/tramitacao/${id}/editar`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Editar
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações Básicas */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Informações da Tramitação
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Protocolo
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {tramitacao.protocolo}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Tramitação
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {tramitacao.tipoLabel}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tramitacao.status)}`}>
                      {tramitacao.statusLabel}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioridade
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(tramitacao.prioridade)}`}>
                      {tramitacao.prioridadeLabel}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Envio
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(tramitacao.dataEnvio).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prazo de Resposta
                    </label>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(tramitacao.prazoResposta).toLocaleString('pt-BR')}
                      </p>
                      {diasRestantes !== null && (
                        <p className={`text-xs ${diasRestantes > 5 ? 'text-green-600' : diasRestantes > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 
                           diasRestantes === 0 ? 'Vence hoje' : `${Math.abs(diasRestantes)} dias em atraso`}
                        </p>
                      )}
                    </div>
                  </div>

                  {tramitacao.dataRecebimento && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data de Recebimento
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(tramitacao.dataRecebimento).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Órgãos e Responsáveis */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                  Órgãos e Responsáveis
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Origem
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Órgão
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {tramitacao.orgaoOrigem.nome} ({tramitacao.orgaoOrigem.sigla})
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Responsável
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {tramitacao.responsavelOrigem.nome}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {tramitacao.responsavelOrigem.cargo} - {tramitacao.responsavelOrigem.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Destino
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Órgão
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {tramitacao.orgaoDestino.nome} ({tramitacao.orgaoDestino.sigla})
                        </p>
                      </div>
                      {tramitacao.responsavelDestino && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Responsável
                          </label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {tramitacao.responsavelDestino.nome}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {tramitacao.responsavelDestino.cargo} - {tramitacao.responsavelDestino.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <ScaleIcon className="w-5 h-5 mr-2" />
                  Detalhes da Tramitação
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assunto
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {tramitacao.assunto}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo da Tramitação
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {tramitacao.motivoTramitacao}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ação Solicitada
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {tramitacao.acao}
                  </p>
                </div>

                {tramitacao.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {tramitacao.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documentos */}
            {tramitacao.documentosAnexos && tramitacao.documentosAnexos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <PaperClipIcon className="w-5 h-5 mr-2" />
                    Documentos Anexos ({tramitacao.documentosAnexos.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {tramitacao.documentosAnexos.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="flex items-center space-x-3">
                          <PaperClipIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.tamanho} • {new Date(doc.dataUpload).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewFile(doc)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            title="Visualizar"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(doc)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
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
                    Número
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tramitacao.processo.numero}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Interessado
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {tramitacao.processo.interessado}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    CPF/CNPJ
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {tramitacao.processo.cpfCnpj}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Assunto
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {tramitacao.processo.assunto}
                  </p>
                </div>
              </div>
            </div>

            {/* Protocolos */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Protocolos
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Protocolo Interno
                  </label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {tramitacao.protocoloInterno || 'Não informado'}
                  </p>
                </div>
                {tramitacao.protocoloExterno && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Protocolo Externo
                    </label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {tramitacao.protocoloExterno}
                    </p>
                  </div>
                )}
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
                    {historico.map((item, index) => (
                      <li key={item.id}>
                        <div className="relative pb-8">
                          {index !== historico.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700">
                                {getHistoricoIcon(item.status)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {item.acao}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.detalhes}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  por {item.usuario}
                                </p>
                              </div>
                              <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {new Date(item.data).toLocaleString('pt-BR')}
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

export default TramitacaoDetail;