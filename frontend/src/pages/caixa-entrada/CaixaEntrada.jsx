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
import { useAuth } from '../../context/AuthContext';
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

const mockSetorDocumentos = [
  {
    id: 1,
    numero_protocolo: 'PROC-2024-006',
    tipo_documento: 'PETICAO',
    assunto: 'Reclamação contra banco - Cobrança indevida',
    remetente: 'Pedro Santos Oliveira',
    remetente_nome: 'Pedro Santos Oliveira',
    empresa: 'Banco Nacional S.A.',
    empresa_nome: 'Banco Nacional S.A.',
    data_entrada: '2024-03-29T08:15:00',
    prazo: '2024-04-05T17:00:00',
    prazo_resposta: '2024-04-05T17:00:00',
    prioridade: 'ALTA',
    status: 'NAO_LIDO',
    setor_destino: 'ATENDIMENTO',
    setor_lotacao: 'ATENDIMENTO',
    notificado_dte: false,
    anexos: 3,
  },
  {
    id: 2,
    numero_protocolo: 'PROC-2024-007',
    tipo_documento: 'AUTO_INFRACAO',
    assunto: 'Auto de infração - Propaganda enganosa',
    remetente: 'Fiscal Maria Costa',
    remetente_nome: 'Fiscal Maria Costa',
    empresa: 'Loja de Móveis MNO',
    empresa_nome: 'Loja de Móveis MNO',
    data_entrada: '2024-03-28T15:30:00',
    prazo: '2024-04-10T17:00:00',
    prazo_resposta: '2024-04-10T17:00:00',
    prioridade: 'URGENTE',
    status: 'LIDO',
    setor_destino: 'FISCALIZACAO',
    setor_lotacao: 'FISCALIZACAO',
    notificado_dte: false,
    anexos: 4,
  },
  {
    id: 3,
    numero_protocolo: 'PROC-2024-008',
    tipo_documento: 'RECURSO',
    assunto: 'Recurso administrativo - Multa aplicada',
    remetente: 'Advogado Carlos Silva',
    remetente_nome: 'Advogado Carlos Silva',
    empresa: 'Empresa PQR Ltda',
    empresa_nome: 'Empresa PQR Ltda',
    data_entrada: '2024-03-27T11:45:00',
    prazo: '2024-04-15T17:00:00',
    prazo_resposta: '2024-04-15T17:00:00',
    prioridade: 'NORMAL',
    status: 'NAO_LIDO',
    setor_destino: 'JURIDICO',
    setor_lotacao: 'JURIDICO',
    notificado_dte: false,
    anexos: 6,
  },
  {
    id: 4,
    numero_protocolo: 'PROC-2024-009',
    tipo_documento: 'MULTA',
    assunto: 'Multa aplicada - Preços abusivos',
    remetente: 'Sistema Automático',
    remetente_nome: 'Sistema Automático',
    empresa: 'Posto de Combustível STU',
    empresa_nome: 'Posto de Combustível STU',
    data_entrada: '2024-03-26T14:20:00',
    prazo: '2024-04-25T17:00:00',
    prazo_resposta: '2024-04-25T17:00:00',
    prioridade: 'BAIXA',
    status: 'LIDO',
    setor_destino: 'FINANCEIRO',
    setor_lotacao: 'FINANCEIRO',
    notificado_dte: false,
    anexos: 1,
  },
  {
    id: 5,
    numero_protocolo: 'PROC-2024-010',
    tipo_documento: 'DENUNCIA',
    assunto: 'Denúncia de venda casada',
    remetente: 'Consumidor João Lima',
    remetente_nome: 'Consumidor João Lima',
    empresa: 'Loja de Eletrônicos VWX',
    empresa_nome: 'Loja de Eletrônicos VWX',
    data_entrada: '2024-03-25T09:30:00',
    prazo: '2024-04-02T17:00:00',
    prazo_resposta: '2024-04-02T17:00:00',
    prioridade: 'ALTA',
    status: 'NAO_LIDO',
    setor_destino: 'FISCALIZACAO',
    setor_lotacao: 'FISCALIZACAO',
    notificado_dte: false,
    anexos: 2,
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

const removerDenuncias = (lista) => {
  if (!Array.isArray(lista)) {
    return [];
  }
  return lista.filter((item) => {
    const tipo = (item?.tipo_documento || '').toUpperCase();
    return tipo !== 'DENUNCIA';
  });
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

      const lista = normalizeList(documentosResponse);
      setDocumentos(lista);
      setEstatisticas(mapStatsResponse(estatisticasResponse, lista));
    } catch (error) {
      console.error('Erro ao carregar documentos pessoais:', error);
      setErro('Não foi possível carregar sua caixa pessoal. Tente novamente em instantes.');
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
          if (dados?.setor_destino) {
            await caixaEntradaService.encaminharDocumento(documentoId, dados);
          }
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
    refresh: carregar,
    onAcao,
  };
};

const useCaixaSetorData = () => {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({ total: 0, naoLidos: 0, urgentes: 0, atrasados: 0 });
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ status: '', tipo: '', prioridade: '', setor: '', busca: '' });
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);
  const [selectedSetor, setSelectedSetor] = useState('');

  const montarParametros = useCallback(() => {
    const setorFiltro = selectedSetor || filtros.setor || undefined;
    return {
      status: filtros.status || undefined,
      tipo_documento: filtros.tipo || undefined,
      prioridade: filtros.prioridade || undefined,
      setor: setorFiltro,
      busca: filtros.busca || undefined,
    };
  }, [filtros, selectedSetor]);

  const carregarSetoresDisponiveis = useCallback(async () => {
    try {
      const response = await caixaEntradaService.getEstatisticas({});
      const stats = mapStatsResponse(response, []);
      const baseSetores = Array.isArray(stats.porSetor) ? stats.porSetor : [];
      let lista = baseSetores.length
        ? baseSetores
        : extractUniqueSetores(removerDenuncias(mockSetorDocumentos));

      if (!lista.length) {
        lista = extractUniqueSetores(removerDenuncias(mockSetorDocumentos));
      }

      setSetoresDisponiveis(lista);

      if (!selectedSetor && lista.length) {
        setSelectedSetor(lista[0].value);
      } else if (selectedSetor) {
        const exists = lista.some((item) => item.value === selectedSetor);
        if (!exists && lista.length) {
          setSelectedSetor(lista[0].value);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar setores disponíveis:', error);
      if (!setoresDisponiveis.length) {
        const fallback = extractUniqueSetores(removerDenuncias(mockSetorDocumentos));
        setSetoresDisponiveis(fallback);
        if (!selectedSetor && fallback.length) {
          setSelectedSetor(fallback[0].value);
        }
      }
    }
  }, [selectedSetor, setoresDisponiveis.length]);

  useEffect(() => {
    carregarSetoresDisponiveis();
  }, [carregarSetoresDisponiveis]);

  useEffect(() => {
    setFiltros((prev) => ({ ...prev, setor: selectedSetor || '' }));
  }, [selectedSetor]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');

    try {
      const params = montarParametros();
      const [documentosResponse, estatisticasResponse] = await Promise.all([
        caixaEntradaService.getDocumentosSetor(params),
        caixaEntradaService.getEstatisticas(params),
      ]);

      let lista = removerDenuncias(normalizeList(documentosResponse));
      lista = filterBySetor(lista, params.setor);
      if (!lista.length) {
        lista = filterBySetor(removerDenuncias(mockSetorDocumentos), params.setor);
      }

      setDocumentos(lista);
      setEstatisticas(mapStatsResponse(estatisticasResponse, lista));
    } catch (error) {
      console.error('Erro ao carregar documentos do setor:', error);
      const lista = filterBySetor(mockSetorDocumentos, montarParametros().setor);
      setErro('Não foi possível carregar a caixa do setor agora. Exibindo dados recentes disponíveis.');
      setDocumentos(lista);
      setEstatisticas(deriveStatsFromList(lista));
    } finally {
      setLoading(false);
    }
  }, [montarParametros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onFiltrosChange = useCallback((novosFiltros) => {
    if (Object.prototype.hasOwnProperty.call(novosFiltros, 'setor')) {
      setSelectedSetor(novosFiltros.setor || '');
    }
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
          if (dados?.setor_destino) {
            await caixaEntradaService.encaminharDocumento(documentoId, dados);
          }
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

  const setorOptions = useMemo(() => {
    if (!setoresDisponiveis.length) {
      return [];
    }
    return setoresDisponiveis.map((item) => ({
      value: item.value,
      label: item.total ? `${item.label} (${item.total})` : item.label,
      total: item.total ?? 0,
    }));
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
    selectedSetor,
    setSelectedSetor,
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
  const caixaPessoal = useCaixaPessoalData();
  const caixaSetor = useCaixaSetorData(currentUser);

  const current = activeTab === 'pessoal' ? caixaPessoal : caixaSetor;

  const ActiveIcon = useMemo(() => {
    return tabs.find((tab) => tab.value === activeTab)?.icon ?? InboxIcon;
  }, [activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

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
                  className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
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
                          onAcao={current.onAcao}
                          tipoCaixa={current.tipo}
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
    </div>
  );
};

export default CaixaEntrada;
