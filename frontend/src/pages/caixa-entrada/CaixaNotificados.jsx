import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import { formatDate, formatDateTime } from '../../utils/formatters';

const CaixaNotificados = () => {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState([]);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    prioridade: '',
    busca: ''
  });
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    naoLidos: 0,
    urgentes: 0,
    atrasados: 0
  });

  useEffect(() => {
    carregarDocumentos();
  }, [filtros]);

  const carregarDocumentos = async () => {
    setLoading(true);
    try {
      // Simular carregamento dos documentos notificados no DTE
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockDocumentos = [
        {
          id: 1,
          numero_protocolo: 'PROC-2024-013',
          tipo_documento: 'PETICAO',
          assunto: 'Reclamação contra empresa de telefonia - NOTIFICADO DTE',
          remetente: 'João Silva Santos',
          empresa: 'Telefonia XYZ Ltda',
          data_entrada: '2024-03-29T10:30:00',
          data_notificacao_dte: '2024-03-29T14:00:00',
          prazo: '2024-04-05T17:00:00',
          prioridade: 'ALTA',
          status: 'NAO_LIDO',
          setor_destino: 'ATENDIMENTO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 2
        },
        {
          id: 2,
          numero_protocolo: 'PROC-2024-014',
          tipo_documento: 'RECURSO',
          assunto: 'Recurso administrativo - Auto de infração - NOTIFICADO DTE',
          remetente: 'Maria Fernanda Costa',
          empresa: 'Supermercado ABC',
          data_entrada: '2024-03-28T14:15:00',
          data_notificacao_dte: '2024-03-28T16:30:00',
          prazo: '2024-04-10T17:00:00',
          prioridade: 'URGENTE',
          status: 'LIDO',
          setor_destino: 'JURIDICO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 5
        },
        {
          id: 3,
          numero_protocolo: 'PROC-2024-015',
          tipo_documento: 'AUTO_INFRACAO',
          assunto: 'Auto de infração - Preços abusivos - NOTIFICADO DTE',
          remetente: 'Fiscal João Silva',
          empresa: 'Posto de Combustível JKL',
          data_entrada: '2024-03-25T11:30:00',
          data_notificacao_dte: '2024-03-27T09:15:00',
          prazo: '2024-04-01T17:00:00',
          prioridade: 'URGENTE',
          status: 'NAO_LIDO',
          setor_destino: 'FISCALIZACAO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 3
        },
        {
          id: 4,
          numero_protocolo: 'PROC-2024-016',
          tipo_documento: 'MULTA',
          assunto: 'Multa aplicada - Propaganda enganosa - NOTIFICADO DTE',
          remetente: 'Sistema Automático',
          empresa: 'Loja de Móveis MNO',
          data_entrada: '2024-03-26T14:20:00',
          data_notificacao_dte: '2024-03-28T11:45:00',
          prazo: '2024-04-25T17:00:00',
          prioridade: 'BAIXA',
          status: 'LIDO',
          setor_destino: 'FINANCEIRO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 1
        },
        {
          id: 5,
          numero_protocolo: 'PROC-2024-017',
          tipo_documento: 'DENUNCIA',
          assunto: 'Denúncia de venda casada - NOTIFICADO DTE',
          remetente: 'Consumidor João Lima',
          empresa: 'Loja de Eletrônicos VWX',
          data_entrada: '2024-03-25T09:30:00',
          data_notificacao_dte: '2024-03-26T15:20:00',
          prazo: '2024-04-02T17:00:00',
          prioridade: 'ALTA',
          status: 'NAO_LIDO',
          setor_destino: 'FISCALIZACAO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 2
        },
        {
          id: 6,
          numero_protocolo: 'PROC-2024-018',
          tipo_documento: 'RECLAMACAO',
          assunto: 'Problema com produto defeituoso - NOTIFICADO DTE',
          remetente: 'Ana Paula Ferreira',
          empresa: 'Loja Virtual YZA',
          data_entrada: '2024-03-24T16:45:00',
          data_notificacao_dte: '2024-03-25T10:30:00',
          prazo: '2024-04-01T17:00:00',
          prioridade: 'NORMAL',
          status: 'LIDO',
          setor_destino: 'ATENDIMENTO',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 0
        },
        {
          id: 7,
          numero_protocolo: 'PROC-2024-019',
          tipo_documento: 'DOCUMENTO_INTERNO',
          assunto: 'Relatório mensal de atividades - NOTIFICADO DTE',
          remetente: 'Coordenador Setorial',
          empresa: 'PROCON-AM',
          data_entrada: '2024-03-23T10:00:00',
          data_notificacao_dte: '2024-03-24T08:45:00',
          prazo: '2024-03-30T17:00:00',
          prioridade: 'BAIXA',
          status: 'NAO_LIDO',
          setor_destino: 'DIRETORIA',
          destinatario_direto: 'usuario_atual',
          notificado_dte: true,
          anexos: 1
        }
      ];

      // Aplicar filtros
      let documentosFiltrados = mockDocumentos;
      
      if (filtros.status) {
        documentosFiltrados = documentosFiltrados.filter(doc => doc.status === filtros.status);
      }
      
      if (filtros.tipo) {
        documentosFiltrados = documentosFiltrados.filter(doc => doc.tipo_documento === filtros.tipo);
      }
      
      if (filtros.prioridade) {
        documentosFiltrados = documentosFiltrados.filter(doc => doc.prioridade === filtros.prioridade);
      }
      
      if (filtros.busca) {
        const buscaLower = filtros.busca.toLowerCase();
        documentosFiltrados = documentosFiltrados.filter(doc => 
          doc.assunto.toLowerCase().includes(buscaLower) ||
          doc.remetente.toLowerCase().includes(buscaLower) ||
          doc.numero_protocolo.toLowerCase().includes(buscaLower) ||
          doc.empresa.toLowerCase().includes(buscaLower)
        );
      }

      setDocumentos(documentosFiltrados);
      
      // Calcular estatísticas
      const stats = {
        total: mockDocumentos.length,
        naoLidos: mockDocumentos.filter(doc => doc.status === 'NAO_LIDO').length,
        urgentes: mockDocumentos.filter(doc => doc.prioridade === 'URGENTE').length,
        atrasados: mockDocumentos.filter(doc => {
          const prazo = new Date(doc.prazo);
          const hoje = new Date();
          return prazo < hoje && doc.status !== 'ARQUIVADO';
        }).length
      };
      
      setEstatisticas(stats);
      
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (novosFiltros) => {
    setFiltros(novosFiltros);
  };

  const handleAcaoDocumento = async (documentoId, acao) => {
    try {
      console.log(`Executando ação ${acao} no documento ${documentoId}`);
      
      // Simular ação
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualizar lista
      await carregarDocumentos();
      
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BellIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notificados DTE
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Documentos notificados no DTE (Documento de Tramitação Eletrônica)
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={carregarDocumentos}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {estatisticas.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <EyeIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {estatisticas.naoLidos}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Não Lidos
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {estatisticas.urgentes}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Urgentes
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <ClockIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {estatisticas.atrasados}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Atrasados
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FiltrosCaixa filtros={filtros} onFiltrosChange={handleFiltrosChange} />

        {/* Documents List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Documentos Notificados ({documentos.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Documentos notificados no DTE
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documentos.length > 0 ? (
              documentos.map((documento) => (
                <DocumentoCard
                  key={documento.id}
                  documento={documento}
                  onAcao={handleAcaoDocumento}
                  tipoCaixa="notificados"
                />
              ))
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Não há documentos notificados no DTE com os filtros aplicados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaNotificados;
