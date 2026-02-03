import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAutoSupermercadoById, deletarAutoSupermercado } from '../../../services/fiscalizacaoService';

function AutoSupermercadoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        const data = await getAutoSupermercadoById(id);
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
      `Você tem certeza que deseja deletar o Auto de Supermercado No ${auto.numero}? Esta ação não pode ser desfeita.`
    );

    if (isConfirmado) {
      setLoading(true);
      try {
        await deletarAutoSupermercado(id);
        alert('Auto de Supermercado deletado com sucesso!');
        navigate('/fiscalizacao/supermercados');
      } catch (err) {
        setError(err.message || 'Falha ao deletar o auto.');
        setLoading(false);
      }
    }
  };

  const documentoUrl = `http://localhost:8000/api/supermercados/${id}/gerar-documento/`;

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!auto) return <div className="p-8">Auto não encontrado.</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Detalhes do Auto de Supermercado</h1>
        <p className="text-gray-600">Número: {auto.numero}</p>
      </div>

      {/* INFORMAÇÕES BÁSICAS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Informações do Auto</h2>
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
            <p className="font-medium">Porte:</p>
            <p>{auto.porte || '-'}</p>
          </div>
          <div>
            <p className="font-medium">Atuação:</p>
            <p>{auto.atuacao || '-'}</p>
          </div>
          <div>
            <p className="font-medium">Atividade:</p>
            <p>{auto.atividade || '-'}</p>
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
            <p className="font-medium">Prazo de Cumprimento:</p>
            <p>{auto.prazo_cumprimento_dias} dias</p>
          </div>
        </div>
      </div>

      {/* IRREGULARIDADES DE PRODUTOS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Irregularidades de Produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_produtos_vencidos ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Produtos vencidos</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_embalagem_violada ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Embalagem violada</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_lata_amassada ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Lata amassada</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_sem_validade ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Sem validade</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_mal_armazenados ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Mal armazenados</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.comercializar_descongelados ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Produtos descongelados</span>
            </div>
          </div>
        </div>
      </div>

      {/* IRREGULARIDADES DE PREÇOS E PUBLICIDADE */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Irregularidades de Preços e Publicidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.publicidade_enganosa ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Publicidade enganosa</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.obstrucao_monitor ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Obstrução do monitor</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.afixacao_precos_fora_padrao ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Preços fora do padrão</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_afixacao_precos ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de preços</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.afixacao_precos_fracionados_fora_padrao ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Fracionados fora do padrão</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_visibilidade_descontos ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de visibilidade de descontos</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.ausencia_placas_promocao_vencimento ? 'bg-red-500' : 'bg-gray-300'}`}></span>
              <span>Ausência de placas de promoção</span>
            </div>
          </div>
        </div>
      </div>

      {/* OUTRAS INFORMAÇÕES */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Outras Informações</h2>
        
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

        {auto.cominacao_legal && (
          <div className="mb-4">
            <p className="font-medium">Cominacao Legal:</p>
            <p className="whitespace-pre-wrap">{auto.cominacao_legal}</p>
          </div>
        )}

        {auto.instrucoes_fiscalizado && (
          <div className="mb-4">
            <p className="font-medium">Instrucoes ao Fiscalizado:</p>
            <p className="whitespace-pre-wrap">{auto.instrucoes_fiscalizado}</p>
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded mr-2 ${auto.possui_anexo ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Possui anexo</span>
          </div>
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded mr-2 ${auto.auto_apreensao ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Possui auto de apreensão</span>
          </div>
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded mr-2 ${auto.necessita_pericia ? 'bg-yellow-500' : 'bg-gray-300'}`}></span>
            <span>Necessita perícia</span>
          </div>
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded mr-2 ${auto.vicios_aparentes ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Vicios aparentes</span>
          </div>
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded mr-2 ${auto.receita_bruta_notificada ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Receita bruta notificada</span>
          </div>
        </div>

        {auto.auto_apreensao_numero && (
          <div className="mt-4">
            <p className="font-medium">Número do Auto de Apreensão:</p>
            <p>{auto.auto_apreensao_numero}</p>
          </div>
        )}
      </div>

      {(auto.assinatura_fiscal_1 || auto.assinatura_fiscal_2 || auto.assinatura_representante) && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Assinaturas</h2>
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
        <h2 className="text-xl font-semibold mb-4 text-green-700">Responsáveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Autoridade Fiscalizadora</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Fiscal 1:</p>
                <p>{auto.fiscal_nome_1}</p>
              </div>
              {auto.fiscal_nome_2 && (
                <div>
                  <p className="text-sm font-medium">Fiscal 2:</p>
                  <p>{auto.fiscal_nome_2}</p>
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

      {/* BOTÕES DE AÇÃO - ATUALIZADO COM BOTÃO GERAR INFRAÇÃO */}
      <div className="flex gap-4 mt-8 pt-4 border-t">
        <Link
          to="/fiscalizacao/supermercados"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Voltar para a Lista
        </Link>
        <Link
          to={`/fiscalizacao/supermercados/${id}/editar`}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
          state={{ autoConstatacao: auto, tipoAuto: 'supermercado' }}
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 font-bold"
        >
          ⚖️ Gerar Infração
        </Link>
        
        {/* 🚨 BOTÃO GERAR AUTO DE INUTILIZAÇÃO OU APREENSÃO ADICIONADO */}
        <Link
          to={`/fiscalizacao/apreensao-inutilizacao/novo`}
          state={{ autoConstatacao: auto, tipoAuto: 'supermercado' }}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold"
        >
          🚨 Gerar Auto de Inutilização ou Apreensão
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

export default AutoSupermercadoDetailPage;
