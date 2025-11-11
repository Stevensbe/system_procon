import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Search,
  XCircle,
} from 'lucide-react';
import portalConsumidorService from '../../services/portalConsumidorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS = {
  PENDENTE: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  REVISADO: { label: 'Revisado', color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  RESPONDIDO: { label: 'Respondido', color: 'bg-blue-500/15 text-blue-300 border border-blue-500/30' },
};

const FILTERS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'REVISADO', label: 'Revisados' },
  { value: 'RESPONDIDO', label: 'Respondidos' },
];

function PortalConsumidorFeedbacksAdmin() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('PENDENTE');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await portalConsumidorService.listarFeedbacksAdmin({ 
        ordering: '-data_feedback',
        page_size: 50 
      });
      const results = data?.results ?? data ?? [];
      setFeedbacks(results);
    } catch (err) {
      console.error('Erro ao carregar feedbacks', err);
      setError('Não foi possível carregar os feedbacks. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbacks;

    // Filtro por status
    if (filter !== 'TODOS') {
      filtered = filtered.filter((item) => {
        if (filter === 'PENDENTE') return !item.revisado;
        if (filter === 'REVISADO') return item.revisado && !item.acoes_tomadas;
        if (filter === 'RESPONDIDO') return item.acoes_tomadas;
        return true;
      });
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.consumidor_email?.toLowerCase().includes(term) ||
        item.tipo_feedback?.toLowerCase().includes(term) ||
        item.sugestoes?.toLowerCase().includes(term) ||
        item.aspecto_melhoria?.toLowerCase().includes(term) ||
        item.protocolo_relacionado?.includes(term)
      );
    }

    return filtered;
  }, [feedbacks, filter, searchTerm]);

  const updateFeedbackStatus = (id, updates) => {
    setFeedbacks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );
  };

  const handleRevisar = async (feedbackItem) => {
    try {
      updateFeedbackStatus(feedbackItem.id, { revisado: true, revisado_por: user?.username });
      await portalConsumidorService.atualizarFeedbackAdmin(feedbackItem.id, {
        revisado: true,
        revisado_por: user?.id,
        data_revisao: new Date().toISOString(),
      });
      setFeedback({
        type: 'success',
        message: `Feedback de ${feedbackItem.consumidor_email || 'consumidor anônimo'} marcado como revisado.`,
      });
    } catch (err) {
      console.error('Erro ao revisar feedback', err);
      setFeedback({
        type: 'error',
        message: 'Não foi possível marcar o feedback como revisado.',
      });
      // Reverter mudança local
      updateFeedbackStatus(feedbackItem.id, { revisado: false, revisado_por: null });
    }
  };

  const handleResponder = async (feedbackItem, resposta) => {
    try {
      updateFeedbackStatus(feedbackItem.id, { 
        acoes_tomadas: resposta,
        revisado: true,
        revisado_por: user?.username 
      });
      await portalConsumidorService.atualizarFeedbackAdmin(feedbackItem.id, {
        acoes_tomadas: resposta,
        revisado: true,
        revisado_por: user?.id,
        data_revisao: new Date().toISOString(),
      });
      setFeedback({
        type: 'success',
        message: `Resposta enviada para ${feedbackItem.consumidor_email || 'consumidor anônimo'}.`,
      });
      setShowModal(false);
      setSelectedFeedback(null);
    } catch (err) {
      console.error('Erro ao responder feedback', err);
      setFeedback({
        type: 'error',
        message: 'Não foi possível enviar a resposta.',
      });
    }
  };

  const openResponderModal = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-700/80 dark:bg-slate-900">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
            <MessageSquare className="h-4 w-4" />
            Painel Administrativo
          </div>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="fa fa-comments text-blue-500" />
            Feedbacks do Portal Consumidor
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie feedbacks recebidos dos consumidores, marque como revisados e responda quando necessário.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchFeedbacks}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por email, tipo, protocolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Consumidor</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Protocolo</th>
                <th className="px-4 py-3">Nota</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70 dark:divide-slate-800 dark:bg-slate-900/60">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12">
                    <LoadingSpinner message="Carregando feedbacks..." />
                  </td>
                </tr>
              )}

              {!loading && filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    {feedbacks.length === 0
                      ? 'Nenhum feedback encontrado.'
                      : 'Nenhum registro com o filtro selecionado.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredFeedbacks.map((feedbackItem) => (
                  <tr key={feedbackItem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {feedbackItem.consumidor_email || 'Anônimo'}
                      </div>
                      {feedbackItem.consumidor_email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {feedbackItem.consumidor_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-slate-900 dark:text-slate-100">
                        {feedbackItem.tipo_feedback?.replace(/_/g, ' ') || 'Feedback'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400">
                      {feedbackItem.protocolo_relacionado || '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {typeof feedbackItem.nota_geral === 'number' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {feedbackItem.nota_geral}
                          </span>
                          <span className="text-xs text-slate-500">/10</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                          feedbackItem.acoes_tomadas
                            ? STATUS_LABELS.RESPONDIDO.color
                            : feedbackItem.revisado
                            ? STATUS_LABELS.REVISADO.color
                            : STATUS_LABELS.PENDENTE.color
                        }`}
                      >
                        {feedbackItem.acoes_tomadas
                          ? STATUS_LABELS.RESPONDIDO.label
                          : feedbackItem.revisado
                          ? STATUS_LABELS.REVISADO.label
                          : STATUS_LABELS.PENDENTE.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400">
                      {new Date(feedbackItem.data_feedback).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2 text-xs">
                        {!feedbackItem.revisado && (
                          <button
                            type="button"
                            onClick={() => handleRevisar(feedbackItem)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-white transition hover:bg-emerald-400"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Revisar
                          </button>
                        )}
                        {!feedbackItem.acoes_tomadas && (
                          <button
                            type="button"
                            onClick={() => openResponderModal(feedbackItem)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 font-medium text-white transition hover:bg-blue-400"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Responder
                          </button>
                        )}
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

      {/* Modal de Resposta */}
      <AnimatePresence>
        {showModal && selectedFeedback && (
          <ModalResponder
            feedback={selectedFeedback}
            onClose={() => {
              setShowModal(false);
              setSelectedFeedback(null);
            }}
            onResponder={handleResponder}
          />
        )}
      </AnimatePresence>

      {/* Feedback de Ações */}
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
                : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {feedback.type === 'error' && <XCircle className="h-5 w-5" />}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalResponder({ feedback, onClose, onResponder }) {
  const [resposta, setResposta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resposta.trim()) return;

    setIsSubmitting(true);
    try {
      await onResponder(feedback, resposta.trim());
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Responder Feedback
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <div className="mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Consumidor:</span>
            <span className="ml-2 text-slate-900 dark:text-slate-100">
              {feedback.consumidor_email || 'Anônimo'}
            </span>
          </div>
          <div className="mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tipo:</span>
            <span className="ml-2 text-slate-900 dark:text-slate-100">
              {feedback.tipo_feedback?.replace(/_/g, ' ') || 'Feedback'}
            </span>
          </div>
          {feedback.sugestoes && (
            <div className="mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Sugestão:</span>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                "{feedback.sugestoes}"
              </p>
            </div>
          )}
          {feedback.aspecto_melhoria && (
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Melhoria:</span>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                "{feedback.aspecto_melhoria}"
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="resposta" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Resposta / Ações Tomadas
            </label>
            <textarea
              id="resposta"
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
              placeholder="Descreva as ações tomadas ou a resposta ao feedback do consumidor..."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !resposta.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Enviar Resposta
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default PortalConsumidorFeedbacksAdmin;
