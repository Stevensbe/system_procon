import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import caixaEntradaService from '../../services/caixaEntradaService';

const CaixaPessoal = () => {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState([]);
  const [paginacao, setPaginacao] = useState({ count: 0, next: null, previous: null });
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
  const [erro, setErro] = useState('');

  const montarParametros = useCallback(() => {
    return {
      status: filtros.status || undefined,
      tipo_documento: filtros.tipo || undefined,
      prioridade: filtros.prioridade || undefined,
      busca: filtros.busca || undefined,
      destinatario_direto: 'me',
      apenas_pessoal: true,
      notificado_dte: false
    };
  }, [filtros]);

  const carregarDocumentos = useCallback(async () => {
    setLoading(true);
    setErro('');

    try {
      const params = montarParametros();
      const [documentosResponse, estatisticasResponse] = await Promise.all([
        caixaEntradaService.getDocumentosPessoal(params),
        caixaEntradaService.getEstatisticas(params)
      ]);

      const listaDocumentos = Array.isArray(documentosResponse)
        ? documentosResponse
        : Array.isArray(documentosResponse?.results)
          ? documentosResponse.results
          : [];

      const totalRegistros =
        typeof documentosResponse?.count === 'number'
          ? documentosResponse.count
          : estatisticasResponse?.total ?? listaDocumentos.length;

      setDocumentos(listaDocumentos);
      setPaginacao({
        count: totalRegistros,
        next: documentosResponse?.next ?? null,
        previous: documentosResponse?.previous ?? null
      });

      setEstatisticas({
        total: estatisticasResponse?.total ?? totalRegistros,
        naoLidos: estatisticasResponse?.nao_lidos ?? 0,
        urgentes: estatisticasResponse?.urgentes ?? 0,
        atrasados: estatisticasResponse?.atrasados ?? 0
      });
    } catch (error) {
      console.error('Erro ao carregar documentos pessoais:', error);
      setErro('Não foi possível carregar a sua caixa pessoal no momento. Tente novamente em instantes.');
      setDocumentos([]);
      setEstatisticas({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
      setPaginacao({ count: 0, next: null, previous: null });
    } finally {
      setLoading(false);
    }
  }, [montarParametros]);

  useEffect(() => {
    carregarDocumentos();
  }, [carregarDocumentos]);

  const handleFiltrosChange = useCallback((novosFiltros) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  const handleAcaoDocumento = useCallback(
    async (documentoId, acao, dados = {}) => {
      try {
        switch (acao) {
          case 'marcar_lido':
            await caixaEntradaService.marcarComoLido(documentoId);
            break;
          case 'arquivar':
            await caixaEntradaService.arquivarDocumento(documentoId);
            break;
          case 'encaminhar':
            if (dados?.setor_destino) {
              await caixaEntradaService.encaminharDocumento(documentoId, dados);
            } else {
              console.warn('Encaminhamento requer dados adicionais (setor_destino).');
            }
            break;
          case 'visualizar':
            await caixaEntradaService.visualizarDocumento(documentoId);
            break;
          default:
            console.warn(`Ação não tratada: ${acao}`);
        }

        await carregarDocumentos();
      } catch (error) {
        console.error(`Erro ao executar ação ${acao} no documento ${documentoId}:`, error);
        setErro('Não foi possível concluir a ação solicitada. Verifique os dados e tente novamente.');
      }
    },
    [carregarDocumentos]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Minha Caixa Pessoal</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Documentos destinados diretamente a você, com prioridade sobre os demais fluxos.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Voltar ao Dashboard
              </Link>
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

      {erro && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {erro}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <EyeIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.naoLidos}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Não lidos</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.urgentes}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Urgentes</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <ClockIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.atrasados}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Atrasados</div>
              </div>
            </div>
          </div>
        </div>

        <FiltrosCaixa filtros={filtros} onFiltrosChange={handleFiltrosChange} showSetorFilter={false} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documentos ({documentos.length})</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Resultados filtrados apenas para você
            </span>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documentos.length > 0 ? (
              documentos.map((documento) => (
                <DocumentoCard
                  key={documento.id}
                  documento={documento}
                  onAcao={handleAcaoDocumento}
                  tipoCaixa="pessoal"
                />
              ))
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Ajuste os filtros ou aguarde novos encaminhamentos para a sua caixa pessoal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaPessoal;
