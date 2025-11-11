import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  CircleSlash2,
  Filter,
  Loader2,
  MailOpen,
  RefreshCcw,
} from 'lucide-react';
import portalEmpresaService from '../../services/portalEmpresaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_LABELS = {
  PENDENTE: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  APROVADA: { label: 'Aprovada', color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  REJEITADA: { label: 'Rejeitada', color: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' },
};

const FILTERS = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'APROVADA', label: 'Aprovadas' },
  { value: 'REJEITADA', label: 'Rejeitadas' },
];

function PortalEmpresaSolicitacoesAdmin() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('PENDENTE');
  const [feedback, setFeedback] = useState(null);

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await portalEmpresaService.listarSolicitacoesCadastro({ ordering: '-criado_em' });
      const results = data?.results ?? data ?? [];
      setSolicitacoes(results);
    } catch (err) {
      console.error('Erro ao carregar solicitações de cadastro', err);
      setError('Não foi possível carregar as solicitações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const filteredSolicitacoes = useMemo(() => {
    if (filter === 'TODAS') {
      return solicitacoes;
    }
    return solicitacoes.filter((item) => item.status === filter);
  }, [filter, solicitacoes]);

  const updateSolicitacaoStatus = (id, status, extra = {}) => {
    setSolicitacoes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              ...extra,
            }
          : item,
      ),
    );
  };

  const handleAprovar = async (solicitacao) => {
    if (solicitacao.status !== 'PENDENTE') {
      setFeedback({ type: 'info', message: 'Solicitação já analisada.' });
      return;
    }
    try {
      updateSolicitacaoStatus(solicitacao.id, 'APROVADA');
      await portalEmpresaService.aprovarSolicitacaoCadastro(solicitacao.id);
      setFeedback({
        type: 'success',
        message: `Solicitação da empresa ${solicitacao.razao_social} aprovada. Credenciais enviadas.`,
      });
      await fetchSolicitacoes();
    } catch (err) {
      console.error('Erro ao aprovar solicitação', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Não foi possível aprovar a solicitação.',
      });
      await fetchSolicitacoes();
    }
  };

  const handleRejeitar = async (solicitacao) => {
    if (solicitacao.status !== 'PENDENTE') {
      setFeedback({ type: 'info', message: 'Solicitação já analisada.' });
      return;
    }

    const motivo = window.prompt(
      `Defina o motivo da rejeição para ${solicitacao.razao_social} (campo opcional):`,
      '',
    );
    try {
      updateSolicitacaoStatus(solicitacao.id, 'REJEITADA', { motivo_rejeicao: motivo || '' });
      await portalEmpresaService.rejeitarSolicitacaoCadastro(solicitacao.id, { motivo });
      setFeedback({
        type: 'warning',
        message: `Solicitação da empresa ${solicitacao.razao_social} rejeitada.`,
      });
      await fetchSolicitacoes();
    } catch (err) {
      console.error('Erro ao rejeitar solicitação', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Não foi possível rejeitar a solicitação.',
      });
      await fetchSolicitacoes();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-700/80 dark:bg-slate-900">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
            <MailOpen className="h-4 w-4" />
            Painel TI – Portal Empresa
          </div>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <Building2 className="h-6 w-6 text-blue-500" />
            Solicitações de cadastro
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Analise os pedidos enviados pelas empresas, aprovando ou rejeitando após a validação cadastral. As ações
            disparam automaticamente a criação da empresa e o envio de credenciais.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchSolicitacoes}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl border px-3.5 py-1.5 text-sm transition ${
                  filter === item.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-500 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70 dark:divide-slate-800 dark:bg-slate-900/60">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <LoadingSpinner message="Carregando solicitações..." />
                  </td>
                </tr>
              )}

              {!loading && filteredSolicitacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {solicitacoes.length === 0
                      ? 'Nenhuma solicitação encontrada.'
                      : 'Nenhum registro com o filtro selecionado.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredSolicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{solicitacao.razao_social}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        CNPJ:&nbsp;
                        {solicitacao.cnpj || '—'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Enviado em {new Date(solicitacao.criado_em).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {solicitacao.responsavel_legal}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {solicitacao.cargo_responsavel || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400">
                      <p>{solicitacao.email_contato}</p>
                      {solicitacao.telefone_contato && <p>{formatPhone(solicitacao.telefone_contato)}</p>}
                      <p className="mt-1 text-slate-400 dark:text-slate-500">
                        {solicitacao.cidade}/{solicitacao.estado}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_LABELS[solicitacao.status]?.color || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[solicitacao.status]?.label || solicitacao.status}
                      </span>
                      {solicitacao.motivo_rejeicao && (
                        <p className="mt-2 text-xs text-rose-400 dark:text-rose-300">
                          Motivo: {solicitacao.motivo_rejeicao}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleAprovar(solicitacao)}
                          disabled={solicitacao.status !== 'PENDENTE'}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejeitar(solicitacao)}
                          disabled={solicitacao.status !== 'PENDENTE'}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 font-medium text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-rose-500/60"
                        >
                          <CircleSlash2 className="h-3.5 w-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onAnimationComplete={() => {
              setTimeout(() => setFeedback(null), 4000);
            }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${
              feedback.type === 'success'
                ? 'bg-emerald-500 text-white'
                : feedback.type === 'warning'
                ? 'bg-amber-500 text-slate-900'
                : feedback.type === 'info'
                ? 'bg-blue-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {feedback.type === 'error' && <CircleSlash2 className="h-5 w-5" />}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatPhone = (value = '') => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value;
};

export default PortalEmpresaSolicitacoesAdmin;
