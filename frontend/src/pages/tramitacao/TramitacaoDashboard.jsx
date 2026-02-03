import React, { useEffect, useMemo, useState } from 'react';
import tramitacaoService from '../../services/tramitacaoService';

const defaultFormState = {
  protocoloId: '',
  setorDestino: '',
  motivo: '',
  observacoes: '',
  prazoDias: ''
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const TramitacaoDashboard = () => {
  const [stats, setStats] = useState(null);
  const [protocolos, setProtocolos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [tramitacoes, setTramitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsData, protocolosData, setoresData, tramitacoesData] = await Promise.all([
        tramitacaoService.obterEstatisticas(),
        tramitacaoService.listarProtocolos(),
        tramitacaoService.listarSetores(),
        tramitacaoService.listarTramitacoes()
      ]);

      setStats(statsData);
      setProtocolos(normalizeList(protocolosData));
      setSetores(normalizeList(setoresData));
      setTramitacoes(normalizeList(tramitacoesData));
    } catch (err) {
      console.error('Erro ao carregar dados da tramitacao:', err);
      setError('Erro ao carregar dados de tramitacao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const selectedProtocolo = useMemo(() => {
    const protocoloId = Number(formData.protocoloId);
    if (!protocoloId) return null;
    return protocolos.find((item) => item.id === protocoloId) || null;
  }, [formData.protocoloId, protocolos]);

  const setoresDisponiveis = useMemo(() => {
    if (!selectedProtocolo) return setores;
    return setores.filter((setor) => setor.id !== selectedProtocolo.setor_atual);
  }, [setores, selectedProtocolo]);

  const tramitacoesRecentes = useMemo(() => tramitacoes.slice(0, 10), [tramitacoes]);

  const abrirTramitarModal = (protocolo) => {
    setFormError('');
    setFormData({
      ...defaultFormState,
      protocoloId: protocolo ? String(protocolo.id) : ''
    });
    setShowTramitarModal(true);
  };

  const fecharTramitarModal = () => {
    if (actionLoading) return;
    setShowTramitarModal(false);
    setFormError('');
    setFormData(defaultFormState);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      if (field === 'protocoloId') {
        return {
          ...prev,
          protocoloId: value,
          setorDestino: ''
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleTramitar = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.protocoloId || !formData.setorDestino || !formData.motivo.trim()) {
      setFormError('Preencha protocolo, setor destino e motivo.');
      return;
    }

    const payload = {
      setor_destino: Number(formData.setorDestino),
      motivo: formData.motivo.trim(),
      observacoes: formData.observacoes.trim()
    };

    if (formData.prazoDias) {
      payload.prazo_dias = Number(formData.prazoDias);
    }

    try {
      setActionLoading(true);
      await tramitacaoService.tramitarProtocolo(formData.protocoloId, payload);
      fecharTramitarModal();
      await carregarDados();
    } catch (err) {
      console.error('Erro ao tramitar protocolo:', err);
      setFormError('Erro ao tramitar protocolo.');
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors duration-300">Carregando tramitacao...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0f12] py-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg mb-6 transition-colors duration-300">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Tramitacao</h1>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                  Painel de protocolos e encaminhamentos
                </p>
              </div>
              <button
                onClick={() => abrirTramitarModal(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
              >
                Tramitar documento
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 transition-colors duration-300">
            <p className="text-red-800 dark:text-red-200 transition-colors duration-300">{error}</p>
          </div>
        )}

        {stats && (
          <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg mb-6 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Resumo</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {stats.total_protocolos || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Total protocolos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                  {stats.protocolos_hoje || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Protocolos hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors duration-300">
                  {stats.protocolos_vencidos || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Prazos vencidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 transition-colors duration-300">
                  {stats.protocolos_prox_vencimento || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Prox vencimento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">
                  {stats.tramitacoes_pendentes || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Pendentes</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg p-6 mt-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Historico de tramitacoes</h3>
            <button
              onClick={carregarDados}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Atualizar
            </button>
          </div>
          {tramitacoesRecentes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Nenhuma tramitacao registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acao</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1a1d21] divide-y divide-gray-200 dark:divide-gray-700">
                  {tramitacoesRecentes.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white transition-colors duration-300">
                        {item.protocolo_numero}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        {item.acao_display || item.acao}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        {item.setor_origem_nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        {item.setor_destino_nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        {tramitacaoService.formatarDataHora(item.data_tramitacao)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        {item.data_recebimento ? 'Recebido' : 'Pendente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showTramitarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white dark:bg-[#1a1d21] rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tramitar protocolo</h2>
                <button
                  onClick={fecharTramitarModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={actionLoading}
                >
                  X
                </button>
              </div>
            </div>
            <form onSubmit={handleTramitar} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Protocolo</label>
                <select
                  value={formData.protocoloId}
                  onChange={(event) => handleFormChange('protocoloId', event.target.value)}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-[#111418] text-gray-900 dark:text-white"
                  disabled={actionLoading}
                >
                  <option value="">Selecione</option>
                  {protocolos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.numero_protocolo} - {item.assunto}
                    </option>
                  ))}
                </select>
                {selectedProtocolo && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Setor atual: {selectedProtocolo.setor_atual_nome || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor destino</label>
                <select
                  value={formData.setorDestino}
                  onChange={(event) => handleFormChange('setorDestino', event.target.value)}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-[#111418] text-gray-900 dark:text-white"
                  disabled={actionLoading}
                >
                  <option value="">Selecione</option>
                  {setoresDisponiveis.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.sigla} - {setor.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(event) => handleFormChange('motivo', event.target.value)}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-[#111418] text-gray-900 dark:text-white"
                  placeholder="Descreva o motivo"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observacoes</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(event) => handleFormChange('observacoes', event.target.value)}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-[#111418] text-gray-900 dark:text-white"
                  rows={3}
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prazo (dias)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.prazoDias}
                  onChange={(event) => handleFormChange('prazoDias', event.target.value)}
                  className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-[#111418] text-gray-900 dark:text-white"
                  placeholder="Opcional"
                  disabled={actionLoading}
                />
              </div>

              {formError && (
                <div className="text-sm text-red-600">{formError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharTramitarModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TramitacaoDashboard;
