import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  InboxIcon,
  UsersIcon,
  DocumentTextIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

import { LoadingSpinner, ProconButton } from '../../components/ui';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import EncaminharModal from '../../components/caixa-entrada/EncaminharModal';
import { useAuth } from '../../context/SupabaseAuthContext';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import caixaEntradaService from '../../services/caixaEntradaService';
import { normalizeSetorFiltro, formatSetorName } from '../../utils/setor';

const tabs = [
  {
    value: 'pessoal',
    label: 'Caixa Pessoal',
    description: 'Documentos destinados diretamente a você.',
    icon: InboxIcon,
  },
  {
    value: 'setor',
    label: 'Caixa do Setor',
    description: 'Demandas compartilhadas com o seu setor.',
    icon: UsersIcon,
  },
];

const normalizeList = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.results)) {
    return response.results;
  }

  if (Array.isArray(response.documentos)) {
    return response.documentos;
  }

  return [];
};

const deriveStatsFromList = (lista) => {
  if (!Array.isArray(lista)) {
    return { total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 };
  }

  const normalize = (valor) => (typeof valor === 'string' ? valor.toUpperCase() : valor);

  const agora = new Date();

  return {
    total: lista.length,
    naoLidos: lista.filter((item) => normalize(item.status) === 'NAO_LIDO').length,
    urgentes: lista.filter((item) => normalize(item.prioridade) === 'URGENTE' || normalize(item.prioridade) === 'ALTA').length,
    atrasados: lista.filter((item) => {
      const prazo = item.prazo || item.prazo_resposta;
      if (!prazo) return false;
      const prazoDate = new Date(prazo);
      return prazoDate < agora && normalize(item.status) !== 'ARQUIVADO';
    }).length,
  };
};

const mapStatsResponse = (response, fallbackLista = []) => {
  const fallbackStats = {
    ...deriveStatsFromList(fallbackLista),
    porSetor: [],
    porTipo: [],
  };

  if (!response) {
    return fallbackStats;
  }

  const data = response.estatisticas || response;
  const porSetor = Array.isArray(data.por_setor)
    ? data.por_setor
    : Array.isArray(data.porSetor)
      ? data.porSetor
      : [];
  const porTipo = Array.isArray(data.por_tipo)
    ? data.por_tipo
    : Array.isArray(data.porTipo)
      ? data.porTipo
      : [];

  return {
    total: data.total ?? fallbackStats.total,
    naoLidos: data.nao_lidos ?? fallbackStats.naoLidos,
    urgentes: data.urgentes ?? fallbackStats.urgentes,
    atrasados: data.atrasados ?? fallbackStats.atrasados,
    porSetor,
    porTipo,
  };
};

const extractUniqueSetores = (lista) => {
  const seen = new Set();
  return lista.reduce((acc, item) => {
    const raw = (item.setor_destino || item.setor_lotacao || item.setor || '').trim();
    if (!raw) return acc;
    const upper = raw.toUpperCase();
    if (seen.has(upper)) return acc;
    seen.add(upper);
    acc.push({ value: raw, label: formatSetorName(raw), total: item.total ?? item.count ?? 0 });
    return acc;
  }, []);
};

const filterBySetor = (lista, setor) => {
  if (!setor) return lista;

  const filtroNormalizado = normalizeSetorFiltro(setor);
  return lista.filter((item) => {
    const destino = item?.setor_destino || item?.setor_lotacao || item?.setor || '';
    const destinoNormalizado = normalizeSetorFiltro(destino);
    if (!filtroNormalizado) {
      return true;
    }
    if (!destinoNormalizado) {
      return false;
    }
    const filtroUpper = filtroNormalizado.toUpperCase();
    const destinoUpper = destinoNormalizado.toUpperCase();
    return destinoUpper === filtroUpper;
  });
};

const normalizeStatus = (status) => (typeof status === 'string' ? status.toUpperCase() : status);

const applyDefaultStatusFilter = (lista, statusFiltro) => {
  if (!Array.isArray(lista)) {
    return [];
  }
  if (statusFiltro) {
    return lista;
  }
  return lista.filter((item) => !['ENCAMINHADO', 'ARQUIVADO'].includes(normalizeStatus(item.status)));
};


const useCaixaPessoalData = () => {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ status: '', tipo: '', prioridade: '', busca: '' });

  const montarParametros = useCallback(() => ({
    status: filtros.status || undefined,
    tipo_documento: filtros.tipo || undefined,
    prioridade: filtros.prioridade || undefined,
    busca: filtros.busca || undefined,
    destinatario_direto: 'me',
    apenas_pessoal: true,
    notificado_dte: false,
  }), [filtros]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');

    try {
      const params = montarParametros();
      const [documentosResponse, estatisticasResponse] = await Promise.all([
        caixaEntradaService.getDocumentosPessoal(params),
        caixaEntradaService.getEstatisticas(params),
      ]);

      let lista = normalizeList(documentosResponse);
      lista = applyDefaultStatusFilter(lista, filtros.status);

      const stats = mapStatsResponse(estatisticasResponse, lista);
      if (!filtros.status) {
        const statsLocal = deriveStatsFromList(lista);
        stats.total = statsLocal.total;
        stats.naoLidos = statsLocal.naoLidos;
        stats.urgentes = statsLocal.urgentes;
        stats.atrasados = statsLocal.atrasados;
      }

      setDocumentos(lista);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar documentos da caixa pessoal:', error);
      setErro('Nao foi possivel carregar a caixa pessoal agora. Tente novamente em instantes.');
      setDocumentos([]);
      setEstatisticas({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
    } finally {
      setLoading(false);
    }
  }, [montarParametros]);


  useEffect(() => {
    carregar();
  }, [carregar]);

  const onFiltrosChange = useCallback((novosFiltros) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  const refresh = useCallback(() => {
    carregar();
  }, [carregar]);

  const onAcao = useCallback(async (documentoId, acao, dados = {}) => {
    try {
      switch (acao) {
        case 'marcar_lido':
          await caixaEntradaService.marcarComoLido(documentoId);
          break;
        case 'arquivar':
          await caixaEntradaService.arquivarDocumento(documentoId);
          break;
        case 'encaminhar':
          if (dados?.setor_destino || dados?.destinatario_direto) {
            await caixaEntradaService.encaminharDocumento(documentoId, dados);
          }
          break;
        case 'bloquear':
          await caixaEntradaService.bloquearDocumento(documentoId, dados);
          break;
        case 'desbloquear':
          await caixaEntradaService.desbloquearDocumento(documentoId);
          break;
        case 'visualizar':
          await caixaEntradaService.visualizarDocumento(documentoId);
          break;
        default:
          console.warn(`Ação não tratada: ${acao}`);
      }
      await carregar();
    } catch (error) {
      console.error(`Erro ao executar ação ${acao}:`, error);
      setErro('Não foi possível concluir a ação solicitada. Verifique os dados e tente novamente.');
    }
  }, [carregar]);

  return {
    tipo: 'pessoal',
    loading,
    documentos,
    estatisticas,
    erro,
    filtros,
    onFiltrosChange,
    refresh,
    onAcao,
  };
};

const useCaixaSetorData = () => {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    prioridade: '',
    busca: '',
    setor: '',
  });
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);

  const montarParametros = useCallback(() => ({
    status: filtros.status || undefined,
    tipo_documento: filtros.tipo || undefined,
    prioridade: filtros.prioridade || undefined,
    busca: filtros.busca || undefined,
    setor: filtros.setor || undefined,
    notificado_dte: false,
  }), [filtros]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');

    try {
      const params = montarParametros();
      const [documentosResponse, estatisticasResponse] = await Promise.all([
        caixaEntradaService.getDocumentosSetor(params),
        caixaEntradaService.getEstatisticas(params),
      ]);

      let lista = normalizeList(documentosResponse);
      if (params.setor) {
        lista = filterBySetor(lista, params.setor);
      }
      lista = applyDefaultStatusFilter(lista, filtros.status);

      const stats = mapStatsResponse(estatisticasResponse, lista);
      if (!filtros.status) {
        const statsLocal = deriveStatsFromList(lista);
        stats.total = statsLocal.total;
        stats.naoLidos = statsLocal.naoLidos;
        stats.urgentes = statsLocal.urgentes;
        stats.atrasados = statsLocal.atrasados;
      }
      setDocumentos(lista);
      setEstatisticas(stats);

      const usarSetoresLista = !filtros.status;
      const baseSetores = (!usarSetoresLista && Array.isArray(stats.porSetor) && stats.porSetor.length)
        ? stats.porSetor.map((item) => {
          const raw = (item.setor_destino || item.setor || '').trim();
          if (!raw) {
            return null;
          }
          return {
            value: raw,
            label: formatSetorName(raw),
            total: item.total ?? item.count ?? 0,
          };
        }).filter(Boolean)
        : extractUniqueSetores(lista);

      const seen = new Set();
      const setoresUnicos = baseSetores.filter((item) => {
        const key = (item.value || '').toUpperCase();
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      setSetoresDisponiveis(setoresUnicos);
    } catch (error) {
      console.error('Erro ao carregar documentos do setor:', error);
      setErro('Nao foi possivel carregar a caixa do setor agora. Tente novamente em instantes.');
      setDocumentos([]);
      setEstatisticas({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
      setSetoresDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }, [montarParametros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onFiltrosChange = useCallback((novosFiltros) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  const refresh = useCallback(() => {
    carregar();
  }, [carregar]);

  const onAcao = useCallback(async (documentoId, acao, dados = {}) => {
    try {
      switch (acao) {
        case 'marcar_lido':
          await caixaEntradaService.marcarComoLido(documentoId);
          break;
        case 'arquivar':
          await caixaEntradaService.arquivarDocumento(documentoId);
          break;
        case 'encaminhar':
          if (dados?.setor_destino || dados?.destinatario_direto) {
            await caixaEntradaService.encaminharDocumento(documentoId, dados);
          }
          break;
        case 'bloquear':
          await caixaEntradaService.bloquearDocumento(documentoId, dados);
          break;
        case 'desbloquear':
          await caixaEntradaService.desbloquearDocumento(documentoId);
          break;
        case 'visualizar':
          await caixaEntradaService.visualizarDocumento(documentoId);
          break;
        default:
          console.warn(`A‡Æo nÆo tratada: ${acao}`);
      }
      await carregar();
    } catch (error) {
      console.error(`Erro ao executar a‡Æo ${acao}:`, error);
      setErro('NÆo foi poss¡vel concluir a a‡Æo solicitada. Verifique os dados e tente novamente.');
    }
  }, [carregar]);

  const setorOptions = useMemo(() => {
    if (!setoresDisponiveis.length) {
      return [{ value: '', label: 'Todos os setores' }];
    }
    const options = setoresDisponiveis.map((item) => ({
      value: item.value,
      label: item.total ? `${item.label} (${item.total})` : item.label,
      total: item.total ?? 0,
    }));
    return [{ value: '', label: 'Todos os setores' }, ...options];
  }, [setoresDisponiveis]);

  return {
    tipo: 'setor',
    loading,
    documentos,
    estatisticas,
    erro,
    filtros,
    onFiltrosChange,
    refresh,
    onAcao,
    setorOptions,
    setoresDisponiveis,
  };
};

const statsConfig = [
  {
    key: 'total',
    label: 'Total de Itens',
    icon: DocumentTextIcon,
    accent: 'from-blue-500/10 to-blue-500/20 border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-300',
  },
  {
    key: 'naoLidos',
    label: 'Não Lidos',
    icon: EyeIcon,
    accent: 'from-sky-500/10 to-sky-500/30 border-sky-200 dark:border-sky-900/60 text-sky-600 dark:text-sky-300',
  },
  {
    key: 'urgentes',
    label: 'Urgentes',
    icon: ExclamationTriangleIcon,
    accent: 'from-amber-500/10 to-amber-500/30 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-300',
  },
  {
    key: 'atrasados',
    label: 'Atrasados',
    icon: ClockIcon,
    accent: 'from-rose-500/10 to-rose-500/30 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300',
  },
];

const StatsGrid = ({ stats, loading }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
    {statsConfig.map((card, index) => {
      const Icon = card.icon;
      const value = stats[card.key] ?? 0;
      return (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.25 }}
          className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${card.accent}`}
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? <span className="animate-pulse">···</span> : value}
                </div>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/60 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
);

const CaixaEntrada = () => {
  const { user } = useAuth();
  const currentUser = user;

  const [activeTab, setActiveTab] = useState('pessoal');
  const [encaminharAberto, setEncaminharAberto] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const caixaPessoal = useCaixaPessoalData();
  const caixaSetor = useCaixaSetorData();

  const current = activeTab === 'pessoal' ? caixaPessoal : caixaSetor;

  const ActiveIcon = useMemo(() => {
    return tabs.find((tab) => tab.value === activeTab)?.icon ?? InboxIcon;
  }, [activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleAcao = useCallback((documentoId, acao, dados = {}) => {
    if (acao === 'encaminhar') {
      const documento = current.documentos.find((item) => item.id === documentoId) || null;
      setDocumentoSelecionado(documento);
      setEncaminharAberto(true);
      return;
    }
    current.onAcao(documentoId, acao, dados);
  }, [current]);

  const handleConfirmarEncaminhamento = useCallback(async (payload) => {
    if (!documentoSelecionado) {
      return;
    }
    await current.onAcao(documentoSelecionado.id, 'encaminhar', payload);
    setEncaminharAberto(false);
    setDocumentoSelecionado(null);
  }, [current, documentoSelecionado]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex flex-col gap-6 mb-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              <ActiveIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Caixa de Entrada</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Acompanhe em um único lugar as demandas pessoais e do setor.
              </p>
            </div>
          </div>

          <div className="relative inline-flex items-center rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            {tabs.map((tab) => {
              const isActive = tab.value === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleTabChange(tab.value)}
                  className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-highlight"
                      className="absolute inset-0 rounded-full bg-white shadow dark:bg-slate-800"
                      transition={{ type: 'spring', duration: 0.3 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tabs.find((tab) => tab.value === activeTab)?.description}
          </p>
        </header>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg backdrop-blur-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <StatsGrid stats={current.estatisticas} loading={current.loading} />
            <div className="ml-auto">
              <ProconButton
                variant="outline"
                icon={ArrowPathIcon}
                onClick={current.refresh}
                loading={current.loading}
              >
                Atualizar
              </ProconButton>
            </div>
          </div>

          {current.erro && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {current.erro}
            </div>
          )}

          <div className="mb-8">
            <FiltrosCaixa
              filtros={current.filtros}
              onFiltrosChange={current.onFiltrosChange}
              showSetorFilter={current.tipo === 'setor'}
              setorOptions={current.tipo === 'setor' ? current.setorOptions : null}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documentos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {current.tipo === 'pessoal'
                    ? 'Itens destinados diretamente a você.'
                    : 'Itens compartilhados com o seu setor.'}
                </p>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {current.documentos.length} resultado{current.documentos.length === 1 ? '' : 's'}
              </span>
            </div>

            {current.loading && current.documentos.length === 0 ? (
              <div className="py-24 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {current.documentos.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {current.documentos.map((documento) => (
                      <motion.div
                        key={documento.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                      >
                        <DocumentoCard
                          documento={documento}
                          onAcao={handleAcao}
                          tipoCaixa={current.tipo}
                          usuarioAtual={currentUser}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum documento encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <EncaminharModal
        open={encaminharAberto}
        documento={documentoSelecionado}
        setores={caixaSetor.setoresDisponiveis && caixaSetor.setoresDisponiveis.length ? caixaSetor.setoresDisponiveis : undefined}
        onClose={() => {
          setEncaminharAberto(false);
          setDocumentoSelecionado(null);
        }}
        onConfirm={handleConfirmarEncaminhamento}
      />
    </div>
  );
};

export default CaixaEntrada;
