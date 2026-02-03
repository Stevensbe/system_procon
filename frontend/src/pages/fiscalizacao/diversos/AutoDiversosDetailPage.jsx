import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAutoDiversosById, deletarAutoDiversos } from '../../../services/fiscalizacaoService';

function AutoDiversosDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        const data = await getAutoDiversosById(id);
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
      `Você tem certeza que deseja deletar o Auto Diversos No ${auto.numero}? Esta ação não pode ser desfeita.`
    );

    if (isConfirmado) {
      setLoading(true);
      try {
        await deletarAutoDiversos(id);
        alert('Auto Diversos deletado com sucesso!');
        navigate('/fiscalizacao/diversos');
      } catch (err) {
        setError(err.message || 'Falha ao deletar o auto.');
        setLoading(false);
      }
    }
  };

  const documentoUrl = `http://localhost:8000/api/diversos/${id}/gerar-documento/`;

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!auto) return <div className="p-8">Auto não encontrado.</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-800">Detalhes do Auto Diversos</h1>
        <p className="text-gray-600">Número: {auto.numero}</p>
      </div>

      {/* INFORMAÇÕES BÁSICAS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Informações do Auto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Número:</p>
            <p>{auto.numero}</p>
          </div>
          <div>
            <p className="font-medium">Estabelecimento:</p>
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
          <div>
            <p className="font-medium">Origem:</p>
            <p className="capitalize">{auto.origem?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="font-medium">Porte:</p>
            <p className="capitalize">{auto.porte}</p>
          </div>
        </div>
      </div>

      {/* IRREGULARIDADES CONSTATADAS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Irregularidades Constatadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.publicidade_enganosa ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Publicidade enganosa</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.precos_fora_padrao ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Afixação de preços fora do padrão</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_precos ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de afixação de preços</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.precos_eletronico_fora_padrao ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Preços no e-commerce fora do padrão</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_precos_eletronico ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de preços no e-commerce</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.fracionados_fora_padrao ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Fracionados fora do padrão</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_desconto_visibilidade ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de visibilidade de descontos</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_exemplar_cdc ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência do exemplar do CDC</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.substituicao_troco ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Substituição do troco</span>
            </div>
          </div>
        </div>
      </div>

      {/* MEDIDA DISCIPLINAR */}
      {auto.aplicar_advertencia && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Medida Disciplinar Aplicada</h2>
          <div className="flex items-center mb-4">
            <span className="w-4 h-4 bg-yellow-500 rounded mr-2"></span>
            <span className="font-medium">ADVERTÊNCIA aplicada como medida disciplinar</span>
          </div>
          <div className="bg-white p-4 rounded border">
            <p className="text-sm text-yellow-800">
              <strong>Justificativa:</strong> Razão pela qual, resolvemos aplicar-lhe como medida disciplinar a presente 
              <strong> ADVERTÊNCIA</strong> e com o intuito de evitar a reincidência ou o cometimento de outra(s) falta(s) 
              de qualquer natureza prevista em lei que nos obrigará a tomar outras medidas cabíveis de acordo com a 
              legislação em vigor orientamos o autuado a providenciar sua imediata adequação à lei.
            </p>
          </div>
        </div>
      )}

      {/* OUTRAS INFORMAÇÕES */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Outras Informações</h2>
        
        {auto.outras_irregularidades && (
          <div className="mb-4">
            <p className="font-medium">Outras Irregularidades:</p>
            <p className="whitespace-pre-wrap">{auto.outras_irregularidades}</p>
          </div>
        )}

        {auto.narrativa_fatos && (
          <div className="mb-4">
            <p className="font-medium">Narrativa dos Fatos:</p>
            <p className="whitespace-pre-wrap">{auto.narrativa_fatos}</p>
          </div>
        )}

        {auto.observacoes && (
          <div className="mb-4">
            <p className="font-medium">Observações:</p>
            <p className="whitespace-pre-wrap">{auto.observacoes}</p>
          </div>
        )}
      </div>

      {(auto.assinatura_fiscal_1 || auto.assinatura_fiscal_2 || auto.assinatura_representante) && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Assinaturas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {auto.assinatura_fiscal_1 && (
              <div className="text-center">
                <h4 className="font-medium text-gray-800 mb-2">Fiscal Principal</h4>
                <img
                  src={auto.assinatura_fiscal_1}
                  alt="Assinatura do Fiscal Principal"
                  className="border border-gray-300 rounded max-h-32 mx-auto"
                />
              </div>
            )}
            {auto.assinatura_fiscal_2 && (
              <div className="text-center">
                <h4 className="font-medium text-gray-800 mb-2">Fiscal Secundário</h4>
                <img
                  src={auto.assinatura_fiscal_2}
                  alt="Assinatura do Fiscal Secundário"
                  className="border border-gray-300 rounded max-h-32 mx-auto"
                />
              </div>
            )}
            {auto.assinatura_representante && (
              <div className="text-center">
                <h4 className="font-medium text-gray-800 mb-2">Representante</h4>
                <img
                  src={auto.assinatura_representante}
                  alt="Assinatura do Representante"
                  className="border border-gray-300 rounded max-h-32 mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESPONSÁVEIS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Responsáveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Autoridade Fiscalizadora</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Fiscal 1:</p>
                <p>{auto.fiscal_nome_1}</p>
                <p className="text-sm text-gray-600">Matrícula: {auto.fiscal_matricula_1}</p>
              </div>
              {auto.fiscal_nome_2 && (
                <div>
                  <p className="text-sm font-medium">Fiscal 2:</p>
                  <p>{auto.fiscal_nome_2}</p>
                  <p className="text-sm text-gray-600">Matrícula: {auto.fiscal_matricula_2}</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Estabelecimento Fiscalizado</h3>
            <div>
              <p className="text-sm font-medium">Responsável:</p>
              <p>{auto.responsavel_nome}</p>
              <p className="text-sm text-gray-600">CPF: {auto.responsavel_cpf}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AVISO RECEITA BRUTA */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Receita Bruta Anual</h3>
        <p className="text-sm text-blue-700">
          O autuado foi intimado a encaminhar ao Departamento de Fiscalização a Receita Bruta Anual declarada, 
          sob pena da mesma ser estimada por este PROCON/AM, caso não seja fornecida no prazo de 05 dias corridos, 
          contados a partir da lavratura do presente Auto.
        </p>
      </div>

      {/* BOTÕES DE AÇÃO - ATUALIZADO COM BOTÃO GERAR INFRAÇÃO */}
      <div className="flex gap-4 mt-8 pt-4 border-t">
        <Link
          to="/fiscalizacao/diversos"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Voltar para a Lista
        </Link>
        <Link
          to={`/fiscalizacao/diversos/editar/${id}`}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          ✏️ Editar
        </Link>
        <a
          href={documentoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📄 Gerar Documento (.docx)
        </a>
        
        {/* 🔥 BOTÃO GERAR INFRAÇÃO ADICIONADO */}
        <Link
          to={`/fiscalizacao/infracoes/novo`}
          state={{ autoConstatacao: auto, tipoAuto: 'diversos' }}
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

export default AutoDiversosDetailPage;
