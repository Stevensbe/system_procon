import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cobrancaService } from '../../services/cobrancaService';

function GrmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grm, setGrm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await cobrancaService.getGrm(id);
        setGrm(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = async () => {
    if (!grm) return;
    const blob = await cobrancaService.gerarGrmDocx(grm.id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GRM_${grm.numero_guia}.docx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!grm) {
    return <div className="p-6">GRM nao encontrada.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">GRM {grm.numero_guia}</h1>
          <p className="text-sm text-gray-600">Processo: {grm.numero_processo || '-'}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => navigate('/cobranca/grm')}
          >
            Voltar
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={handleDownload}
          >
            Gerar DOCX
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-gray-500">Autuado</span>
          <p className="text-gray-900 font-medium">{grm.autuado_nome || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">CPF/CNPJ</span>
          <p className="text-gray-900 font-medium">{grm.autuado_documento || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Auto de Infracao</span>
          <p className="text-gray-900 font-medium">{grm.numero_auto_infracao || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Valor Integral</span>
          <p className="text-gray-900 font-medium">
            {grm.valor_integral ? `R$ ${Number(grm.valor_integral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Vencimento</span>
          <p className="text-gray-900 font-medium">{grm.vencimento || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Departamento Emissor</span>
          <p className="text-gray-900 font-medium">{grm.departamento_emissor || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-xs text-gray-500">Observacao</span>
          <p className="text-gray-900">{grm.observacao_texto || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export default GrmDetail;
