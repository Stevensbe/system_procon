import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Users,
  SkipForward,
  PlayCircle,
  Square,
  ArrowRightCircle,
} from 'lucide-react';

import atendimentoFilaService from '../../services/atendimentoFilaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotifications';

const REFRESH_INTERVAL = 8000;

const prioridadeOptions = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Prioritaria', value: 'PRIORITARIA' },
];

function FilaGuiche() {
  const { showSuccess, showError } = useNotification();
  const [balcoes, setBalcoes] = useState([]);
  const [selectedBalcaoId, setSelectedBalcaoId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [prioridade, setPrioridade] = useState('NORMAL');
  const [observacoes, setObservacoes] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    const carregarBalcoes = async () => {
      try {
        const data = await atendimentoFilaService.listarBalcoes();
        // Garantir que balcoes seja sempre um array
        const balcoesArray = Array.isArray(data) ? data : (data?.results || data?.balcoes || []);
        setBalcoes(balcoesArray);
        if (balcoesArray && balcoesArray.length > 0) {
          setSelectedBalcaoId(balcoesArray[0].id);
        }
      } catch (error) {
        console.error(error);
        showError('Nao foi possivel carregar os balcoes de atendimento.');
        // Fallback com array vazio
        setBalcoes([]);
      } finally {
        setLoading(false);
      }
    };

    carregarBalcoes();
  }, [showError]);

  const fetchStatus = async (balcaoId) => {
    if (!balcaoId) return;
    try {
      const data = await atendimentoFilaService.obterStatusFila(balcaoId);
      setStatus(data);
    } catch (error) {
      console.error(error);
      showError('Nao foi possivel atualizar a fila do balcao selecionado.');
    }
  };

  useEffect(() => {
    if (!selectedBalcaoId) return;
    fetchStatus(selectedBalcaoId);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => fetchStatus(selectedBalcaoId), REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedBalcaoId]);

  const filaAtiva = status?.fila;
  const senhaAtual = useMemo(
    () => status?.senhas?.em_atendimento?.[0] || null,
    [status],
  );

  const handleEmitirSenha = async () => {
    if (!selectedBalcaoId) return;
    try {
      setActionLoading(true);
      await atendimentoFilaService.emitirSenha(selectedBalcaoId, {
        prioridade,
        observacoes,
      });
      showSuccess('Senha emitida com sucesso.');
      setObservacoes('');
      fetchStatus(selectedBalcaoId);
    } catch (error) {
      console.error(error);
      showError(error.response?.data?.detail || 'Falha ao emitir a senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChamarProxima = async () => {
    if (!selectedBalcaoId) return;
    try {
      setActionLoading(true);
      await atendimentoFilaService.chamarProxima(selectedBalcaoId);
      showSuccess('Proxima senha chamada.');
      fetchStatus(selectedBalcaoId);
    } catch (error) {
      console.error(error);
      showError(error.response?.data?.detail || 'Falha ao chamar proxima senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIniciar = async () => {
    if (!senhaAtual) return;
    try {
      setActionLoading(true);
      await atendimentoFilaService.iniciarSenha(senhaAtual.id);
      showSuccess(`Senha ${senhaAtual.identificador} em atendimento.`);
      fetchStatus(selectedBalcaoId);
    } catch (error) {
      console.error(error);
      showError('Falha ao iniciar atendimento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizar = async () => {
    if (!senhaAtual) return;
    try {
      setActionLoading(true);
      await atendimentoFilaService.finalizarSenha(senhaAtual.id);
      showSuccess(`Senha ${senhaAtual.identificador} finalizada.`);
      fetchStatus(selectedBalcaoId);
    } catch (error) {
      console.error(error);
      showError('Nao foi possivel finalizar a senha atual.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePular = async () => {
    if (!senhaAtual) return;
    try {
      setActionLoading(true);
      await atendimentoFilaService.pularSenha(senhaAtual.id, 'Senha pulada pelo guiche.');
      showSuccess(`Senha ${senhaAtual.identificador} foi reposicionada na fila.`);
      fetchStatus(selectedBalcaoId);
    } catch (error) {
      console.error(error);
      showError('Nao foi possivel pular a senha atual.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando filas de atendimento..." />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestao de Filas de Atendimento</h1>
          <p className="text-sm text-gray-600">
            Controle a emissao e o fluxo de senhas para cada balcao em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Balcao
            <select
              className="ml-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedBalcaoId || ''}
              onChange={(event) => setSelectedBalcaoId(Number(event.target.value))}
            >
              {Array.isArray(balcoes) && balcoes.map((balcao) => (
                <option key={balcao.id} value={balcao.id}>
                  {balcao.nome} ({balcao.codigo})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:border-blue-300"
            onClick={() => fetchStatus(selectedBalcaoId)}
          >
            <Clock className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      {status ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-900">Atendendo agora</p>
                <p className="mt-3 text-3xl font-semibold text-blue-700">
                  {senhaAtual ? senhaAtual.identificador : ''}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {senhaAtual ? senhaAtual.prioridade : 'Nenhuma senha chamada'}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-900">Em espera</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-700">
                  {status?.senhas?.em_espera?.length || 0}
                </p>
                <p className="mt-1 text-xs text-emerald-600">Senhas aguardando atendimento</p>
              </div>
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                <p className="text-sm font-medium text-purple-900">Finalizadas hoje</p>
                <p className="mt-3 text-3xl font-semibold text-purple-700">
                  {filaAtiva?.quantidade_finalizadas || 0}
                </p>
                <p className="mt-1 text-xs text-purple-600">
                  Ultima chamada: {filaAtiva?.ultima_senha_chamada || ''}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-blue-500" />
                Acoes do Balcao
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Emissao de senha
                  </label>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <select
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={prioridade}
                      onChange={(event) => setPrioridade(event.target.value)}
                    >
                      {prioridadeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleEmitirSenha}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Emitir senha
                    </button>
                  </div>
                  <textarea
                    placeholder="Observacoes (opcional)"
                    value={observacoes}
                    onChange={(event) => setObservacoes(event.target.value)}
                    className="h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Fluxo da fila
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleChamarProxima}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <ArrowRightCircle className="h-4 w-4" />
                      Chamar proxima
                    </button>
                    <button
                      type="button"
                      onClick={handleIniciar}
                      disabled={!senhaAtual || actionLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Iniciar
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizar}
                      disabled={!senhaAtual || actionLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Square className="h-4 w-4" />
                      Finalizar
                    </button>
                    <button
                      type="button"
                      onClick={handlePular}
                      disabled={!senhaAtual || actionLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <SkipForward className="h-4 w-4" />
                      Pular
                    </button>
                  </div>
                  {senhaAtual && (
                    <p className="text-xs text-gray-500">
                      Operando sobre a senha <strong>{senhaAtual.identificador}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-gray-500" />
                Senhas em espera
              </h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {status?.senhas?.em_espera?.length ? (
                  status.senhas.em_espera.map((senha) => (
                    <div key={senha.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{senha.identificador}</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{senha.prioridade}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Emitida em {new Date(senha.emitido_em).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-sm text-gray-500">Nenhuma senha aguardando atendimento.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Resumo da fila
              </h3>
              <dl className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <dt>Ultima senha emitida</dt>
                  <dd className="font-medium">{filaAtiva?.ultima_senha_emitida || ''}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total emitidas (dia)</dt>
                  <dd className="font-medium">{filaAtiva?.quantidade_emitidas || 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total chamadas (dia)</dt>
                  <dd className="font-medium">{filaAtiva?.quantidade_chamadas || 0}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total finalizadas (dia)</dt>
                  <dd className="font-medium">{filaAtiva?.quantidade_finalizadas || 0}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                Ultimas senhas finalizadas
              </h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                {status?.senhas?.finalizadas?.length ? (
                  status.senhas.finalizadas.map((senha) => (
                    <div key={senha.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{senha.identificador}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(senha.finalizado_em).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Nenhuma senha finalizada recentemente.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          Selecione um balcao para visualizar a fila de atendimento.
        </div>
      )}
    </div>
  );
}

export default FilaGuiche;
