import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAutoBancoById, deletarAutoBanco } from '../../../services/fiscalizacaoService';

function AutoBancoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        const data = await getAutoBancoById(id);
        setAuto(data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar detalhes.');
      } finally {
        setLoading(false);
      }
    };
    carregarDetalhes();
  }, [id]);

  const handleDelete = async () => {
    const isConfirmado = window.confirm(
      `Você tem certeza que deseja deletar o Auto de Banco No ${auto.numero}? Esta ação não pode ser desfeita.`
    );

    if (isConfirmado) {
      setLoading(true);
      try {
        await deletarAutoBanco(id);
        alert('Auto de Banco deletado com sucesso!');
        navigate('/fiscalizacao/bancos');
      } catch (err) {
        setError(err.message || 'Falha ao deletar o auto.');
        setLoading(false);
      }
    }
  };

  const documentoUrl = `http://localhost:8000/api/bancos/${id}/gerar-documento/`;

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!auto) return <div className="p-8">Auto não encontrado.</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Detalhes do Auto de Banco</h1>
        <p className="text-gray-600">Número: {auto.numero}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Auto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Número:</p>
            <p>{auto.numero}</p>
          </div>
          <div>
            <p className="font-medium">Razão Social:</p>
            <p>{auto.razao_social}</p>
          </div>
          <div>
            <p className="font-medium">Nome Fantasia:</p>
            <p>{auto.nome_fantasia || '-'}</p>
          </div>
          <div>
            <p className="font-medium">CNPJ:</p>
            <p>{auto.cnpj}</p>
          </div>
          <div>
            <p className="font-medium">Data da Fiscalização:</p>
            <p>{new Date(auto.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="font-medium">Hora da Fiscalização:</p>
            <p>{auto.hora_fiscalizacao}</p>
          </div>
          <div>
            <p className="font-medium">Endereço:</p>
            <p>{auto.endereco}</p>
          </div>
          <div>
            <p className="font-medium">Município/UF:</p>
            <p>{auto.municipio}/{auto.estado}</p>
          </div>
        </div>

        {auto.observacoes && (
          <div className="mt-4">
            <p className="font-medium">Observações:</p>
            <p className="whitespace-pre-wrap">{auto.observacoes}</p>
          </div>
        )}
      </div>

      {auto.atendimentos_caixa && auto.atendimentos_caixa.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Atendimentos de Caixa</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Senha</th>
                <th className="text-left py-2">Chegada</th>
                <th className="text-left py-2">Atendimento</th>
                <th className="text-left py-2">Tempo de Espera</th>
              </tr>
            </thead>
            <tbody>
              {auto.atendimentos_caixa.map((atendimento, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{atendimento.letra_senha}</td>
                  <td className="py-2">{atendimento.horario_chegada}</td>
                  <td className="py-2">{atendimento.horario_atendimento}</td>
                  <td className="py-2">{atendimento.tempo_espera_formatado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-4 mt-8 pt-4 border-t">
        <Link
          to="/fiscalizacao/bancos"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Voltar para a Lista
        </Link>
        <Link
          to={`/fiscalizacao/bancos/${id}/editar`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ✏️ Editar
        </Link>
        <a
          href={documentoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Gerar Documento (.docx)
        </a>
        
        {/* Botão para Gerar Infração */}
        <Link
          to={`/fiscalizacao/infracoes/novo`} // ✅ PLURAL
         state={{ autoConstatacao: auto }}
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 font-bold"
>
        ⚖️ Gerar Infração
         </Link>
        
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 ml-auto"
        >
          {loading ? 'Deletando...' : 'Deletar'}
        </button>
      </div>
    </div>
  );
}

export default AutoBancoDetailPage;