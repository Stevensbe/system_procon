import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAutoPostoById, deletarAutoPosto } from '../../../services/fiscalizacaoService';

function AutoPostoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      try {
        const data = await getAutoPostoById(id);
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
      `Você tem certeza que deseja deletar o Auto de Posto No ${auto.numero}? Esta ação não pode ser desfeita.`
    );

    if (isConfirmado) {
      setLoading(true);
      try {
        await deletarAutoPosto(id);
        alert('Auto de Posto deletado com sucesso!');
        navigate('/fiscalizacao/postos');
      } catch (err) {
        setError(err.message || 'Falha ao deletar o auto.');
        setLoading(false);
      }
    }
  };

  const documentoUrl = `http://localhost:8000/api/postos/${id}/gerar-documento/`;

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!auto) return <div className="p-8">Auto não encontrado.</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-orange-800">Detalhes do Auto de Posto</h1>
        <p className="text-gray-600">Número: {auto.numero}</p>
      </div>

      {/* INFORMAÇÕES BÁSICAS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-700">Informações do Auto</h2>
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
          <div>
            <p className="font-medium">Origem:</p>
            <p className="capitalize">{auto.origem?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="font-medium">Porte:</p>
            <p className="capitalize">{auto.porte}</p>
          </div>
        </div>

        {/* Status da fiscalização */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium mb-3">Status da Fiscalização:</h3>
          <div className="flex gap-6">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.nada_consta ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Nada consta</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded mr-2 ${auto.sem_irregularidades ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Sem irregularidades</span>
            </div>
          </div>
        </div>
      </div>

      {/* PREÇOS DOS COMBUSTÍVEIS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-700">Preços dos Combustíveis no Totem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-medium">Gasolina Comum:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_gasolina_comum ? `R$ ${auto.preco_gasolina_comum}` : 'Não comercializado'}
            </p>
          </div>
          <div>
            <p className="font-medium">Gasolina Aditivada:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_gasolina_aditivada ? `R$ ${auto.preco_gasolina_aditivada}` : 'Não comercializado'}
            </p>
          </div>
          <div>
            <p className="font-medium">Etanol:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_etanol ? `R$ ${auto.preco_etanol}` : 'Não comercializado'}
            </p>
          </div>
          <div>
            <p className="font-medium">Diesel Comum:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_diesel_comum ? `R$ ${auto.preco_diesel_comum}` : 'Não comercializado'}
            </p>
          </div>
          <div>
            <p className="font-medium">Diesel S-10:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_diesel_s10 ? `R$ ${auto.preco_diesel_s10}` : 'Não comercializado'}
            </p>
          </div>
          <div>
            <p className="font-medium">GNV:</p>
            <p className="text-lg text-orange-600">
              {auto.preco_gnv ? `R$ ${auto.preco_gnv}` : 'Não comercializado'}
            </p>
          </div>
        </div>

        {/* Produtos não vendidos */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium mb-3">Produtos não comercializados pelo estabelecimento:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {auto.nao_vende_gas_comum && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>Gasolina Comum</div>}
            {auto.nao_vende_gas_aditivada && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>Gasolina Aditivada</div>}
            {auto.nao_vende_etanol && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>Etanol</div>}
            {auto.nao_vende_diesel_comum && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>Diesel Comum</div>}
            {auto.nao_vende_diesel_s10 && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>Diesel S-10</div>}
            {auto.nao_vende_gnv && <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-2"></span>GNV</div>}
          </div>
        </div>
      </div>

      {/* NOTAS FISCAIS */}
      {auto.notas_fiscais && auto.notas_fiscais.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">Notas Fiscais de Aquisição</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tipo</th>
                  <th className="text-left py-2">Produto</th>
                  <th className="text-left py-2">Nº da NF</th>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Preço/Litro</th>
                </tr>
              </thead>
              <tbody>
                {auto.notas_fiscais.map((nota, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 capitalize">{nota.tipo_nota}</td>
                    <td className="py-2">{nota.produto}</td>
                    <td className="py-2">{nota.numero_nota}</td>
                    <td className="py-2">{new Date(nota.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="py-2">R$ {nota.preco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUPONS FISCAIS */}
      {auto.cupons_fiscais && auto.cupons_fiscais.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">Cupons Fiscais de Venda</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Nº Cupom</th>
                  <th className="text-left py-2">Produto</th>
                  <th className="text-left py-2">Valor</th>
                  <th className="text-left py-2">% Diferença</th>
                </tr>
              </thead>
              <tbody>
                {auto.cupons_fiscais.map((cupom, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{cupom.item_tabela}</td>
                    <td className="py-2">{new Date(cupom.dia + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="py-2">{cupom.numero_cupom}</td>
                    <td className="py-2">{cupom.produto}</td>
                    <td className="py-2">R$ {cupom.valor}</td>
                    <td className="py-2">{cupom.percentual_diferenca || '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRAZO PARA DOCUMENTOS */}
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">Prazo para Envio de Documentos</h2>
        <div className="flex items-center mb-2">
          <span className="font-medium">Prazo:</span>
          <span className="ml-2 text-lg font-bold text-yellow-700">{auto.prazo_envio_documentos || 48} horas</span>
        </div>
        <p className="text-sm text-yellow-700">
          A empresa fica notificada a apresentar, no prazo de {auto.prazo_envio_documentos || 48} horas, 
          via e-mail <strong>fiscalizacaoprocon@procon.am.gov.br</strong>, as notas fiscais de aquisição e os cupons fiscais de venda 
          ao consumidor até a presente data desta fiscalização.
        </p>
      </div>

      {/* OUTRAS INFORMAÇÕES */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-700">Outras Informações</h2>
        
        {auto.outras_irregularidades && (
          <div className="mb-4">
            <p className="font-medium">Outras Irregularidades:</p>
            <p className="whitespace-pre-wrap">{auto.outras_irregularidades}</p>
          </div>
        )}

        {auto.dispositivos_legais && (
          <div className="mb-4">
            <p className="font-medium">Dispositivos Legais:</p>
            <p className="whitespace-pre-wrap">{auto.dispositivos_legais}</p>
          </div>
        )}

        {auto.info_adicionais && (
          <div className="mb-4">
            <p className="font-medium">Informações Adicionais:</p>
            <p className="whitespace-pre-wrap">{auto.info_adicionais}</p>
          </div>
        )}
      </div>

      {/* RESPONSÁVEIS */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-700">Responsáveis</h2>
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

      {/* BOTÕES DE AÇÃO - ATUALIZADO COM BOTÃO GERAR INFRAÇÃO */}
      <div className="flex gap-4 mt-8 pt-4 border-t">
        <Link
          to="/fiscalizacao/postos"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Voltar para a Lista
        </Link>
        <Link
          to={`/fiscalizacao/postos/${id}/editar`}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
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
          state={{ autoConstatacao: auto, tipoAuto: 'posto' }}
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

export default AutoPostoDetailPage;