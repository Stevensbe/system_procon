import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cobrancaService } from '../../services/cobrancaService';

const initialState = {
  processo: '',
  auto_infracao: '',
  multa: '',
  autuado_nome: '',
  autuado_documento: '',
  numero_auto_infracao: '',
  numero_processo: '',
  valor_integral: '',
  valor_a_vista: '',
  valor_parcelado: '',
  quantidade_parcelas: '',
  valor_parcela: '',
  vencimento: '',
  observacao_texto: '',
  recebedor_nome: '',
  recebedor_cnpj: '',
  banco_nome: '',
  banco_agencia: '',
  banco_conta: '',
};

function GrmForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProcessos = async () => {
      const data = await cobrancaService.getProcessos();
      setProcessos(Array.isArray(data) ? data : []);
    };
    loadProcessos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.processo) delete payload.processo;
      if (!payload.auto_infracao) delete payload.auto_infracao;
      if (!payload.multa) delete payload.multa;

      const grm = await cobrancaService.createGrm(payload);
      navigate(`/cobranca/grm/${grm.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nova GRM</h1>
        <p className="text-sm text-gray-600">Crie uma guia manualmente ou informe o processo para preencher automaticamente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Processo (opcional)</label>
            <select
              name="processo"
              value={formData.processo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Selecione</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>{p.numero || p.numero_processo || p.numeroProcesso || p.id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">N?mero do Processo</label>
            <input
              name="numero_processo"
              value={formData.numero_processo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Autuado</label>
            <input
              name="autuado_nome"
              value={formData.autuado_nome}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CPF/CNPJ Autuado</label>
            <input
              name="autuado_documento"
              value={formData.autuado_documento}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">N?mero do Auto de Infra??o</label>
            <input
              name="numero_auto_infracao"
              value={formData.numero_auto_infracao}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Integral</label>
            <input
              name="valor_integral"
              value={formData.valor_integral}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor ? Vista</label>
            <input
              name="valor_a_vista"
              value={formData.valor_a_vista}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Parcelado</label>
            <input
              name="valor_parcelado"
              value={formData.valor_parcelado}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade de Parcelas</label>
            <input
              name="quantidade_parcelas"
              value={formData.quantidade_parcelas}
              onChange={handleChange}
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor da Parcela</label>
            <input
              name="valor_parcela"
              value={formData.valor_parcela}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vencimento</label>
            <input
              name="vencimento"
              value={formData.vencimento}
              onChange={handleChange}
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Observa??o</label>
            <textarea
              name="observacao_texto"
              value={formData.observacao_texto}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Recebedor</label>
            <input
              name="recebedor_nome"
              value={formData.recebedor_nome}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CNPJ Recebedor</label>
            <input
              name="recebedor_cnpj"
              value={formData.recebedor_cnpj}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Banco</label>
            <input
              name="banco_nome"
              value={formData.banco_nome}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ag?ncia</label>
            <input
              name="banco_agencia"
              value={formData.banco_agencia}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Conta</label>
            <input
              name="banco_conta"
              value={formData.banco_conta}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => navigate('/cobranca/grm')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default GrmForm;
