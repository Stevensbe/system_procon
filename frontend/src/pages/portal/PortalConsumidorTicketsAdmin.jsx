import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Filter,
  XCircle,
} from 'lucide-react';

import portalConsumidorService from '../../services/portalConsumidorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/SupabaseAuthContext';

const STATUS_OPCOES = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'RESPONDIDO', label: 'Respondido' },
  { value: 'FECHADO', label: 'Fechado' },
];

const PRIORIDADE_OPCOES = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

function PortalConsumidorTicketsAdmin() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: 'ABERTO,EM_ANALISE',
    prioridade: '',
    search: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const filtrosQuery = useMemo(() => {
    const params = {};
    if (filtros.status) params.status = filtros.status;
    if (filtros.prioridade) params.prioridade = filtros.prioridade;
    if (filtros.search) params.search = filtros.search;
    params.page_size = 50;
    return params;
  }, [filtros]);

  const carregarTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await portalConsumidorService.listarTicketsAdmin(filtrosQuery);
      const results = data?.results ?? data ?? [];
      setTickets(results);
    } catch (err) {
      console.error('Erro ao carregar tickets', err);
      setError('Não foi possível carregar os tickets de suporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTickets();
  }, [carregarTickets, filtrosQuery]);

  const atualizarTicketLocal = (ticketId, updates) => {
    setTickets((prev) =>
      prev.map((item) => (item.id === ticketId ? { ...item, ...updates } : item)),
    );
  };

  const handleResponder = async (ticket, resposta, novoStatus = 'RESPONDIDO') => {
    try {
      atualizarTicketLocal(ticket.id, {
        resposta,
        status: novoStatus,
        respondido_por: user?.id,
        respondido_por_nome: user?.username,
        data_resposta: new Date().toISOString(),
      });

      await portalConsumidorService.atualizarTicketAdmin(ticket.id, {
        resposta,
        status: novoStatus,
      });

      setFeedback({
        type: 'success',
        message: `Resposta enviada para ${ticket.consumidor_email || 'consumidor'}.`,
      });
      setMostrarModal(false);
      setTicketSelecionado(null);
      carregarTickets();
    } catch (err) {
      console.error('Erro ao responder ticket', err);
      setFeedback({
        type: 'error',
        message: 'Não foi possível enviar a resposta. Tente novamente.',
      });
      carregarTickets();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-700/80 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-orange-500" />
            Tickets de suporte do consumidor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize demandas enviadas pelo portal e responda consumidores diretamente.
          </p>
        </div>
        <button
          type="button"
          onClick={carregarTickets}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </button>
      </header>

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-[200px_200px_1fr]">
          <FiltroSelect
            label="Status"
            value={filtros.status}
            onChange={(value) => setFiltros((prev) => ({ ...prev, status: value }))}
            options={[{ value: '', label: 'Todos' }, ...STATUS_OPCOES]}
            icon={<ShieldCheck className="h-4 w-4 text-blue-500" />}
          />
          <FiltroSelect
            label="Prioridade"
            value={filtros.prioridade}
            onChange={(value) => setFiltros((prev) => ({ ...prev, prioridade: value }))}
            options={[{ value: '', label: 'Todas' }, ...PRIORIDADE_OPCOES]}
            icon={<Filter className="h-4 w-4 text-amber-500" />}
          />
          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={filtros.search}
              onChange={(event) => setFiltros((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Buscar por e-mail, protocolo ou assunto"
              className="ml-2 w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/60 dark:bg-slate-800/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Consumidor</th>
                <th className="px-4 py-3">Assunto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhum ticket encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {ticket.consumidor_nome || 'Consumidor'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ticket.consumidor_email || 'Sem e-mail informado'}
                      </div>
                      {ticket.consumidor_cpf && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">{ticket.consumidor_cpf}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{ticket.assunto}</div>
                      {ticket.protocolo_relacionado && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          Protocolo {ticket.protocolo_relacionado}
                        </div>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {ticket.descricao}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge status={ticket.status} />
                      {ticket.data_resposta && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          Respondido em {new Date(ticket.data_resposta).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${prioridadeClass(ticket.prioridade)}`}>
                        {ticket.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTicketSelecionado(ticket);
                            setMostrarModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Responder
                        </button>
                        {ticket.status !== 'FECHADO' && (
                          <button
                            type="button"
                            onClick={() => handleResponder(ticket, ticket.resposta || 'Encerrado pelo analista.', 'FECHADO')}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
                          >
                            Fechar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {error && (
          <div className="border-t border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
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
              setTimeout(() => setFeedback(null), 3500);
            }}
            className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarModal && ticketSelecionado && (
          <ModalResponder
            ticket={ticketSelecionado}
            onClose={() => {
              setMostrarModal(false);
              setTicketSelecionado(null);
            }}
            onResponder={handleResponder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FiltroSelect({ label, value, onChange, options, icon }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {icon}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="ml-2 w-full border-none bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function StatusBadge({ status }) {
  const config = {
    ABERTO: { label: 'Aberto', classes: 'bg-orange-100 text-orange-700' },
    EM_ANALISE: { label: 'Em análise', classes: 'bg-amber-100 text-amber-700' },
    RESPONDIDO: { label: 'Respondido', classes: 'bg-blue-100 text-blue-700' },
    FECHADO: { label: 'Fechado', classes: 'bg-slate-100 text-slate-700' },
  }[status] || { label: status, classes: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}

function prioridadeClass(prioridade) {
  switch (prioridade) {
    case 'URGENTE':
      return 'bg-rose-100 text-rose-700';
    case 'ALTA':
      return 'bg-amber-100 text-amber-700';
    case 'MEDIA':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function ModalResponder({ ticket, onClose, onResponder }) {
  const [resposta, setResposta] = useState(ticket.resposta || '');
  const [status, setStatus] = useState(ticket.status === 'FECHADO' ? 'FECHADO' : 'RESPONDIDO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resposta.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onResponder(ticket, resposta.trim(), status);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Responder ticket
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consumidor: {ticket.consumidor_email || ticket.consumidor_nome || 'Não informado'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{ticket.assunto}</p>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{ticket.descricao}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status do ticket
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="RESPONDIDO">Responder e manter aberto</option>
              <option value="FECHADO">Responder e fechar</option>
              <option value="EM_ANALISE">Marcar em análise</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Resposta ao consumidor
            <textarea
              value={resposta}
              onChange={(event) => setResposta(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              placeholder="Descreva a orientação enviada ao consumidor..."
              required
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !resposta.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-500/70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {isSubmitting ? 'Enviando...' : 'Enviar resposta'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default PortalConsumidorTicketsAdmin;
