import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cobrancaService } from '../../services/cobrancaService';

function GrmList() {
  const navigate = useNavigate();
  const [grms, setGrms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await cobrancaService.getGrms({ search });
      const results = Array.isArray(data) ? data : (data.results || []);
      setGrms(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDownload = async (grmId, numero) => {
    const blob = await cobrancaService.gerarGrmDocx(grmId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GRM_${numero}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Guias de Recolhimento (GRM)</h1>
          <p className="text-sm text-gray-600">Gerencie e gere documentos de GRM</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => navigate('/cobranca/grm/novo')}
        >
          Nova GRM
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Buscar por n?mero, processo ou autuado"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" type="submit">
          Buscar
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">N?mero</th>
                <th className="text-left px-4 py-3">Processo</th>
                <th className="text-left px-4 py-3">Autuado</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-right px-4 py-3">A??es</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Carregando...</td>
                </tr>
              ) : grms.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Nenhuma GRM encontrada.</td>
                </tr>
              ) : (
                grms.map((grm) => (
                  <tr key={grm.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-900">{grm.numero_guia}</td>
                    <td className="px-4 py-3 text-gray-700">{grm.numero_processo || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{grm.autuado_nome || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{grm.valor_integral ? `R$ ${Number(grm.valor_integral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{grm.vencimento || '-'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        className="px-3 py-1.5 text-blue-600 hover:text-blue-700"
                        onClick={() => navigate(`/cobranca/grm/${grm.id}`)}
                      >
                        Detalhes
                      </button>
                      <button
                        className="px-3 py-1.5 text-indigo-600 hover:text-indigo-700"
                        onClick={() => handleDownload(grm.id, grm.numero_guia)}
                      >
                        Gerar DOCX
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GrmList;
