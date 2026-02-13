import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

const InfoCard = ({ title, value, accent }) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="p-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  </div>
);

const AtendimentoLgpdDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dados, setDados] = useState(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('atendimento/api/relatorios-detalhados/');
      setDados(data);
    } catch (err) {
      const mensagem = err?.response?.data?.erro || err?.message || 'Não foi possível carregar as métricas.';
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const lgpd = dados?.lgpd || {
    consentimentos_confirmados: 0,
    consentimentos_pendentes: 0,
    remocoes_pendentes: 0,
    remocoes_concluidas: 0,
  };

  const anexos = dados?.anexos || { ativos: 0, removidos: 0 };
  const portal = dados?.portal_empresa || {};
  const ultimaAtualizacao = formatDateTime(dados?.ultima_atualizacao);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel LGPD</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe consentimentos, solicitações de remoção e impacto de anexos e respostas do Portal Empresa.
          </p>
          <p className="text-xs text-gray-400 mt-1">Última atualização: {ultimaAtualizacao}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <InfoCard
          title="Consentimentos Confirmados"
          value={lgpd.consentimentos_confirmados}
          accent="text-emerald-600"
        />
        <InfoCard
          title="Consentimentos Pendentes"
          value={lgpd.consentimentos_pendentes}
          accent="text-amber-600"
        />
        <InfoCard
          title="Remoções Pendentes"
          value={lgpd.remocoes_pendentes}
          accent="text-red-600"
        />
        <InfoCard
          title="Remoções Concluídas"
          value={lgpd.remocoes_concluidas}
          accent="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Status de Anexos</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Anexos Ativos</span>
              <span className="text-lg font-semibold text-gray-900">{anexos.ativos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Anexos Removidos</span>
              <span className="text-lg font-semibold text-gray-900">{anexos.removidos}</span>
            </div>
            <p className="text-xs text-gray-500">
              Utilizar estes números para priorizar anonimizações e auditorias de documentação sensível.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Portal Empresa</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard title="Respostas Enviadas" value={portal.respostas_enviadas || 0} />
              <InfoCard title="Em Análise" value={portal.respostas_em_analise || 0} />
              <InfoCard title="Aceitas" value={portal.respostas_aceitas || 0} />
              <InfoCard title="Rejeitadas" value={portal.respostas_rejeitadas || 0} />
            </div>
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700">
              Última resposta registrada: {formatDateTime(portal.ultima_resposta_em)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoLgpdDashboard;
