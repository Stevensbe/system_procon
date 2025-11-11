import React, { useCallback, useEffect, useState } from 'react';
import atendimentoService from '../../services/atendimentoService';
import { useNotification } from '../../hooks/useNotifications';

const AtendimentoConfiguracaoPrazos = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    prazo_resposta_dias: '',
    prazo_conciliacao_dias: '',
    prazo_decisao_dias: '',
  });
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const carregarConfiguracao = useCallback(async () => {
    setLoading(true);
    try {
      const data = await atendimentoService.obterConfiguracao();
      setFormData({
        prazo_resposta_dias: data.prazo_resposta_dias ?? '',
        prazo_conciliacao_dias: data.prazo_conciliacao_dias ?? '',
        prazo_decisao_dias: data.prazo_decisao_dias ?? '',
      });
      setUltimaAtualizacao(new Date());
    } catch (error) {
      const mensagem =
        error?.response?.data?.detail ||
        error?.response?.data?.erro ||
        error?.message ||
        'Não foi possível carregar as configurações.';
      showError(mensagem);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    carregarConfiguracao();
  }, [carregarConfiguracao]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        prazo_resposta_dias: Number(formData.prazo_resposta_dias),
        prazo_conciliacao_dias: Number(formData.prazo_conciliacao_dias),
        prazo_decisao_dias: Number(formData.prazo_decisao_dias),
      };

      const data = await atendimentoService.atualizarConfiguracao(payload);
      setFormData({
        prazo_resposta_dias: data.prazo_resposta_dias ?? '',
        prazo_conciliacao_dias: data.prazo_conciliacao_dias ?? '',
        prazo_decisao_dias: data.prazo_decisao_dias ?? '',
      });
      setUltimaAtualizacao(new Date());
      showSuccess('Configurações atualizadas com sucesso.');
    } catch (error) {
      const mensagem =
        error?.response?.data?.detail ||
        error?.response?.data?.erro ||
        error?.message ||
        'Não foi possível salvar as configurações.';
      showError(mensagem);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações de Prazos</h1>
        <p className="text-gray-600 mt-2">
          Ajuste os prazos padrão utilizados para resposta das empresas, conciliações e decisões.
        </p>
        {ultimaAtualizacao && (
          <p className="text-xs text-gray-400 mt-1">
            Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Prazos do Atendimento</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo para Resposta (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  name="prazo_resposta_dias"
                  value={formData.prazo_resposta_dias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilizado para definir o prazo padrão concedido às empresas após a notificação inicial.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo para Conciliação (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  name="prazo_conciliacao_dias"
                  value={formData.prazo_conciliacao_dias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Intervalo utilizado para agendar audiências de conciliação após a resposta inicial.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo para Decisão (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  name="prazo_decisao_dias"
                  value={formData.prazo_decisao_dias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo máximo recomendado para elaboração da decisão final quando não há acordo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={carregarConfiguracao}
                  disabled={loading || saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Reverter
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AtendimentoConfiguracaoPrazos;
