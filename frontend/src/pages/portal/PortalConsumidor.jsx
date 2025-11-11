import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, LifeBuoy } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorFallback from '../../components/common/ErrorFallback';
import portalConsumidorService from '../../services/portalConsumidorService';
import { useAuth } from '../../context/AuthContext';

const ListaVazia = ({ mensagem }) => (
  <li className="px-4 py-6 text-center text-sm text-gray-500">{mensagem}</li>
);

const PRIORIDADE_LABELS = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

function PortalConsumidor() {
  const { role } = useAuth();
  const isStaffView = useMemo(
    () => ['admin', 'staff'].includes(role || ''),
    [role],
  );

  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregarResumo = async () => {
      try {
        setLoading(true);
        const dados = await portalConsumidorService.obterResumoPortalConsumidor();
        setResumo(dados);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar resumo do portal do consumidor', error);
        setErro(error);
      } finally {
        setLoading(false);
      }
    };

    carregarResumo();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Carregando dados do Portal do Consumidor..." />;
  }

  if (erro) {
    return (
      <ErrorFallback
        error={erro}
        message="Não foi possível carregar os dados do Portal do Consumidor."
        onReset={() => window.location.reload()}
      />
    );
  }

const {
    notificacoesRecentes = [],
    feedbacksRecentes = [],
    feedbacksPendentes = 0,
    ticketsPendentes = 0,
    ticketsAbertosRecentes = [],
    metricasTickets = {},
  } = resumo || {};

  const tempoMedioRespostaHoras = metricasTickets.tempo_medio_resposta_horas ?? 0;
  const respondidosUltimos7Dias = metricasTickets.respondidos_ultimos_7_dias ?? 0;
  const abertosUltimos7Dias = metricasTickets.abertos_ultimos_7_dias ?? 0;
  const ticketsPorPrioridade = metricasTickets.por_prioridade ?? {};
  const ticketsPendentesPorPrioridade = metricasTickets.pendentes_por_prioridade ?? {};

  const priorityChartData = Object.entries(ticketsPorPrioridade).map(([key, value]) => ({
    prioridade: PRIORIDADE_LABELS[key] || key,
    total: value,
    pendentes: ticketsPendentesPorPrioridade[key] || 0,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal do Consumidor</h1>
          <p className="text-sm text-gray-600">
            Acompanhe notificações enviadas aos consumidores, feedbacks recebidos e indicadores operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isStaffView && (
            <>
              <Link
                to="/portal-consumidor/feedbacks"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <i className="fa fa-comments" />
                Gerenciar feedbacks
              </Link>
              <Link
                to="/portal-consumidor/tickets"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
              >
                <LifeBuoy className="h-4 w-4" />
                Tickets de suporte
              </Link>
            </>
          )}
          <Link
            to="/caixa-entrada/pessoal"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <i className="fa fa-inbox" />
            Ir para Caixa de Entrada
          </Link>
        </div>
      </header>

      {isStaffView && (
        <section className="grid gap-4 sm:grid-cols-4">
          <ResumoCard
            icon={<Clock className="h-5 w-5" />}
            value={feedbacksPendentes}
            label="Feedbacks pendentes"
            subtitle="Aguardando revisão interna"
            highlight={feedbacksPendentes > 0}
          />
          <ResumoCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            value={feedbacksRecentes.length}
            label="Feedbacks recentes"
            subtitle="Últimos registros recebidos"
          />
          <ResumoCard
            icon={<i className="fa fa-bullhorn" />}
            value={notificacoesRecentes.length}
            label="Notificações recentes"
            subtitle="Comunicações enviadas no período"
          />
          <ResumoCard
            icon={<LifeBuoy className="h-5 w-5" />}
            value={ticketsPendentes}
            label="Tickets abertos"
            subtitle="Aguardando tratativa"
            highlight={ticketsPendentes > 0}
          />
        </section>
      )}

      <section className={`grid gap-6 ${isStaffView ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <ListaWidget
          titulo="Notificações recentes"
          itens={notificacoesRecentes}
          renderItem={(item) => (
            <li key={item.id || item.token || JSON.stringify(item)} className="px-4 py-3 space-y-2">
              <p className="text-sm font-medium text-gray-900">{item.titulo ?? '-'}</p>
              {item.descricao && (
                <p className="text-xs text-gray-600">{item.descricao}</p>
              )}
              {item.created_at && (
                <p className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleString('pt-BR')}
                </p>
              )}
            </li>
          )}
        />
        <ListaWidget
          titulo="Feedbacks recebidos"
          itens={feedbacksRecentes}
          vazio="Nenhum feedback registrado."
          renderItem={(item) => (
            <FeedbackWidgetItem key={item.id} item={item} mostrarStatus={isStaffView} />
          )}
        />
        {isStaffView && (
          <ListaWidget
            titulo="Tickets de suporte em aberto"
            itens={ticketsAbertosRecentes}
            vazio="Nenhum ticket aguardando resposta."
            renderItem={(item) => <TicketWidgetItem key={item.id} item={item} />}
          />
        )}
      </section>

      {isStaffView && (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Tempo médio de resposta"
            value={`${tempoMedioRespostaHoras.toFixed(1)} h`}
            description="Base nos tickets respondidos"
          />
          <MetricCard
            title="Tickets respondidos (7 dias)"
            value={respondidosUltimos7Dias}
            description={`Abertos no período: ${abertosUltimos7Dias}`}
          />
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Distribuição por prioridade</h3>
            <div className="mt-3 h-48">
              <PriorityChart data={priorityChartData} />
            </div>
            <PriorityList data={ticketsPorPrioridade} pendentes={ticketsPendentesPorPrioridade} />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-800">
        <h2 className="text-lg font-semibold">Dica rápida</h2>
        <p className="mt-2 text-sm">
          Utilize o portal para permitir que consumidores consultem protocolos, acompanhem respostas e enviem feedbacks.
          Todas as solicitações ficam registradas e podem ser revisadas neste dashboard, na caixa de entrada ou no painel de feedbacks.
        </p>
      </section>
    </div>
  );
}

function ListaWidget({ titulo, itens, renderItem, vazio = 'Nenhum registro disponível.' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {Array.isArray(itens) && itens.length > 0
          ? itens.map(renderItem)
          : <ListaVazia mensagem={vazio} />}
      </ul>
    </div>
  );
}

function TicketWidgetItem({ item }) {
  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{item.assunto}</p>
          <p className="text-xs text-gray-500">
            {item.consumidor_email || item.consumidor_nome || 'Consumidor não identificado'}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
          {item.prioridade}
        </span>
      </div>
      {item.protocolo_relacionado && (
        <p className="text-xs text-gray-600">Protocolo {item.protocolo_relacionado}</p>
      )}
      <p className="text-xs text-gray-400">
        Aberto em {new Date(item.data_criacao).toLocaleString('pt-BR')}
      </p>
    </li>
  );
}

function FeedbackWidgetItem({ item, mostrarStatus }) {
  const statusPill = mostrarStatus ? (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        item.revisado
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {item.revisado ? 'Revisado' : 'Pendente'}
    </span>
  ) : null;

  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {item.consumidor_email || 'Feedback anônimo'}
          </p>
          <p className="text-xs text-gray-500">
            {item.tipo_feedback?.replace(/_/g, ' ') || 'Feedback'}
            {item.protocolo_relacionado && ` • Protocolo ${item.protocolo_relacionado}`}
          </p>
        </div>
        {statusPill}
      </div>

      {typeof item.nota_geral === 'number' && (
        <p className="text-xs text-gray-500">
          Nota geral: <span className="font-semibold text-gray-700">{item.nota_geral}/10</span>
        </p>
      )}

      {item.sugestoes && (
        <p className="text-xs text-gray-600 italic">&ldquo;{item.sugestoes}&rdquo;</p>
      )}
      {!item.sugestoes && item.aspecto_melhoria && (
        <p className="text-xs text-gray-600 italic">&ldquo;{item.aspecto_melhoria}&rdquo;</p>
      )}

      {mostrarStatus && item.acoes_tomadas && (
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Ações tomadas:</span> {item.acoes_tomadas}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {new Date(item.data_feedback).toLocaleString('pt-BR')}
      </p>
    </li>
  );
}

function ResumoCard({ icon, value, label, subtitle, highlight = false }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition ${
        highlight
          ? 'border-amber-400 bg-amber-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className="rounded-full bg-slate-900/5 p-2 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}

function PriorityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-500">
        Sem dados de prioridade no momento.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="prioridade" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value, name) => [
            value,
            name === 'total' ? 'Total' : 'Pendentes',
          ]}
        />
        <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="pendentes" fill="#fb923c" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PriorityList({ data, pendentes = {} }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return <p className="mt-4 text-xs text-gray-500">Sem dados de prioridade no momento.</p>;
  }

  const total = entries.reduce((acc, [, count]) => acc + count, 0) || 1;

  return (
    <ul className="mt-4 space-y-3">
      {entries.map(([prioridade, count]) => {
        const label = PRIORIDADE_LABELS[prioridade] || prioridade;
        const percent = Math.round((count / total) * 100);
        return (
          <li key={prioridade}>
            <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span className="font-semibold text-gray-700">
            {count} {pendentes[prioridade] ? `• Pendentes ${pendentes[prioridade]}` : ''}
          </span>
        </div>
            <div className="mt-1 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default PortalConsumidor;
