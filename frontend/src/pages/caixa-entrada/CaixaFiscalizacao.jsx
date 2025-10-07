import React, { useState, useEffect, useCallback } from 'react';
import {
  InboxIcon,
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
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import { formatDate, formatDateTime } from '../../utils/formatters';
import caixaEntradaService from '../../services/caixaEntradaService';
import { normalizeSetorFiltro } from '../../utils/setor';

const CaixaFiscalizacao = () => {
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    naoLidos: 0,
    urgentes: 0,
    atrasados: 0
  });
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    prioridade: '',
    busca: ''
  });

  const carregarDocumentos = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar documentos do setor Fiscalização via API
      const response = await caixaEntradaService.getDocumentosSetor({
        ...filtros,
        setor: 'FISCALIZACAO_PROPRIO',
        tipo_documento: 'AUTO_INFRACAO'
      });
      const lista = Array.isArray(response) ? response : response?.results ?? response?.documentos ?? [];
      const setorAlvo = normalizeSetorFiltro('FISCALIZACAO_PROPRIO');
      const filtrada = lista.filter((item) => {
        const destinoNormalizado = normalizeSetorFiltro(item?.setor_destino || item?.setor_lotacao || item?.setor);
        if (!setorAlvo) {
          return !destinoNormalizado;
        }
        return destinoNormalizado === setorAlvo;
      });
      setDocumentos(filtrada);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      // Fallback para mock data em caso de erro
      const mockDocumentos = [
        {
          id: 1,
          numero_protocolo: '2024/001234',
          assunto: 'Auto de Infração - Venda irregular',
          remetente_nome: 'Fiscal João Silva',
          empresa_nome: 'Loja ABC Ltda',
          data_entrada: '2024-01-15T10:30:00',
          prazo_resposta: '2024-01-22T10:30:00',
          prioridade: 'URGENTE',
          status: 'NAO_LIDO',
          setor_destino: 'FISCALIZACAO_PROPRIO',
          tipo_documento: 'AUTO_INFRACAO',
          notificado_dte: false,
          anexos_count: 3
        },
        {
          id: 2,
          numero_protocolo: '2024/001235',
          assunto: 'Denúncia - Produto vencido',
          remetente_nome: 'Cidadão Maria Santos',
          empresa_nome: 'Supermercado XYZ',
          data_entrada: '2024-01-15T14:20:00',
          prazo_resposta: '2024-01-20T14:20:00',
          prioridade: 'ALTA',
          status: 'EM_ANALISE',
          setor_destino: 'FISCALIZACAO_PROPRIO',
          tipo_documento: 'DENUNCIA',
          notificado_dte: false,
          anexos_count: 2
        },
        {
          id: 3,
          numero_protocolo: '2024/001236',
          assunto: 'Relatório de Fiscalização',
          remetente_nome: 'Fiscal Pedro Costa',
          empresa_nome: 'Farmácia Central',
          data_entrada: '2024-01-15T16:45:00',
          prazo_resposta: '2024-01-25T16:45:00',
          prioridade: 'NORMAL',
          status: 'NAO_LIDO',
          setor_destino: 'FISCALIZACAO_PROPRIO',
          tipo_documento: 'RELATORIO',
          notificado_dte: false,
          anexos_count: 1
        }
      ];
      setDocumentos(mockDocumentos.filter((doc) => doc.tipo_documento !== 'DENUNCIA'));
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const carregarEstatisticas = useCallback(async () => {
    try {
      const response = await caixaEntradaService.getEstatisticas({
        setor: 'FISCALIZACAO_PROPRIO',
        tipo_documento: filtros.tipo || 'AUTO_INFRACAO'
      });
      const dados = response && response.estatisticas ? response.estatisticas : (response || {});
      const total = dados.total ?? dados.count ?? 0;
      const naoLidos = dados.nao_lidos ?? dados.naoLidos ?? 0;
      const urgentes = dados.urgentes ?? dados.prioridade_urgente ?? 0;
      const atrasados = dados.atrasados ?? dados.vencidos ?? 0;
      setEstatisticas({
        total,
        naoLidos,
        urgentes,
        atrasados,
      });
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
      // Fallback para calculo local
      setEstatisticas({
        total: documentos.length,
        naoLidos: documentos.filter(d => d.status === 'NAO_LIDO').length,
        urgentes: documentos.filter(d => d.prioridade === 'URGENTE').length,
        atrasados: documentos.filter(d => {
          const prazo = new Date(d.prazo_resposta);
          const hoje = new Date();
          return prazo < hoje && d.status !== 'ARQUIVADO';
        }).length
      });
    }
  }, [documentos, filtros]);

  useEffect(() => {
    carregarDocumentos();
  }, [carregarDocumentos]);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  const handleFiltrosChange = (novosFiltros) => {
    setFiltros(novosFiltros);
  };

  const handleRefresh = useCallback(() => {
    carregarDocumentos();
    carregarEstatisticas();
  }, [carregarDocumentos, carregarEstatisticas]);

  const handleAcaoDocumento = useCallback(async (documentoId, acao) => {
    if (acao === 'visualizar') {
      return;
    }

    try {
      setLoading(true);
      if (acao === 'marcar_lido') {
        await caixaEntradaService.marcarComoLido(documentoId);
        setDocumentos(prev => prev.map(doc => (
          doc.id === documentoId ? { ...doc, status: 'LIDO' } : doc
        )));
      } else if (acao === 'encaminhar') {
        const setorDestino = typeof window !== 'undefined'
          ? window.prompt('Para qual setor deseja encaminhar? (JURIDICO/FINANCEIRO/DIRETORIA)')
          : null;
        if (!setorDestino) {
          return;
        }

        await caixaEntradaService.encaminharDocumento(documentoId, {
          setor_destino: setorDestino,
          observacoes: 'Encaminhado pela Fiscalização',
        });
        setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
      } else if (acao === 'arquivar') {
        await caixaEntradaService.arquivarDocumento(documentoId);
        setDocumentos(prev => prev.map(doc => (
          doc.id === documentoId ? { ...doc, status: 'ARQUIVADO' } : doc
        )));
      } else {
        console.warn('Ação não reconhecida:', acao);
      }

      await carregarDocumentos();
      await carregarEstatisticas();

    } catch (error) {
      console.error('Erro ao executar ação:', error);
      if (typeof window !== 'undefined') {
        window.alert(`Erro ao executar ação: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [carregarDocumentos, carregarEstatisticas]);

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
              <InboxIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📋 Caixa de Autos - Fiscalização
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Autos de infração e constatação criados pelos fiscais
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Total
                </h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {estatisticas.total}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Não Lidos
                </h3>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {estatisticas.naoLidos}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Urgentes
                </h3>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {estatisticas.urgentes}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Atrasados
                </h3>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {estatisticas.atrasados}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <FiltrosCaixa
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            showSetorFilter={false}
          />
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Autos de Infração/Constatação
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {documentos.length} documento(s) encontrado(s)
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documentos.length > 0 ? (
              documentos.map((documento) => (
                <DocumentoCard
                  key={documento.id}
                  documento={documento}
                  onRefresh={handleRefresh}
                  onAcao={handleAcaoDocumento}
                />
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-sm">
                  Não há documentos na caixa de entrada da Fiscalização com os filtros aplicados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaFiscalizacao;


