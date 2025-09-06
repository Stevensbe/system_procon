import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAutoSupermercadoById, atualizarAutoSupermercado } from '../../../services/fiscalizacaoService';

function AutoSupermercadoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Dados básicos
    numero: '',
    data_fiscalizacao: '',
    hora_fiscalizacao: '',
    
    // Dados do estabelecimento
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco: '',
    municipio: '',
    cep: '',
    telefone: '',
    email: '',
    
    // Responsável legal
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_funcao: '',
    
    // Irregularidades relacionadas a produtos
    produtos_vencidos: false,
    produtos_vencidos_obs: '',
    embalagem_violada: false,
    embalagem_violada_obs: '',
    lata_amassada: false,
    lata_amassada_obs: '',
    sem_validade: false,
    sem_validade_obs: '',
    validade_ilegivel: false,
    validade_ilegivel_obs: '',
    mal_armazenados: false,
    mal_armazenados_obs: '',
    produtos_descongelados: false,
    produtos_descongelados_obs: '',
    
    // Irregularidades de publicidade e preços
    publicidade_enganosa: false,
    publicidade_enganosa_obs: '',
    obstrucao_monitor: false,
    obstrucao_monitor_obs: '',
    precos_fora_padrao: false,
    precos_fora_padrao_obs: '',
    ausencia_precos: false,
    ausencia_precos_obs: '',
    fracionados_fora_padrao: false,
    fracionados_fora_padrao_obs: '',
    ausencia_desconto_visibilidade: false,
    ausencia_desconto_visibilidade_obs: '',
    ausencia_placas_promocao: false,
    ausencia_placas_promocao_obs: '',
    
    // Observações
    observacoes: '',
    
    // Fiscais
    fiscal_responsavel: '',
    fiscal_apoio: ''
  });

  useEffect(() => {
    carregarAuto();
  }, [id]);

  const carregarAuto = async () => {
    try {
      setLoading(true);
      const data = await getAutoSupermercadoById(id);
      
      // Formatar dados para o formulário
      const formattedData = {
        ...data,
        data_fiscalizacao: data.data_fiscalizacao || '',
        hora_fiscalizacao: data.hora_fiscalizacao || '',
        
        // Garantir que campos booleanos sejam boolean
        produtos_vencidos: Boolean(data.produtos_vencidos),
        embalagem_violada: Boolean(data.embalagem_violada),
        lata_amassada: Boolean(data.lata_amassada),
        sem_validade: Boolean(data.sem_validade),
        validade_ilegivel: Boolean(data.validade_ilegivel),
        mal_armazenados: Boolean(data.mal_armazenados),
        produtos_descongelados: Boolean(data.produtos_descongelados),
        publicidade_enganosa: Boolean(data.publicidade_enganosa),
        obstrucao_monitor: Boolean(data.obstrucao_monitor),
        precos_fora_padrao: Boolean(data.precos_fora_padrao),
        ausencia_precos: Boolean(data.ausencia_precos),
        fracionados_fora_padrao: Boolean(data.fracionados_fora_padrao),
        ausencia_desconto_visibilidade: Boolean(data.ausencia_desconto_visibilidade),
        ausencia_placas_promocao: Boolean(data.ausencia_placas_promocao)
      };
      
      setFormData(formattedData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar auto de supermercado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      await atualizarAutoSupermercado(id, formData);
      navigate(`/fiscalizacao/supermercados/${id}`, { 
        state: { message: 'Auto de supermercado atualizado com sucesso!' }
      });
    } catch (err) {
      setError(err.message || 'Erro ao atualizar auto de supermercado');
    } finally {
      setSaving(false);
    }
  };

  const IrregularidadeField = ({ name, label, obsName }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          name={name}
          checked={formData[name]}
          onChange={handleChange}
          className="mr-2"
          id={name}
        />
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      </div>
      {formData[name] && (
        <textarea
          name={obsName}
          value={formData[obsName] || ''}
          onChange={handleChange}
          placeholder="Descreva os detalhes..."
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          rows={2}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <div className="text-lg text-gray-600">Carregando auto de supermercado...</div>
        </div>
      </div>
    );
  }

  if (error && !formData.id) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-bold text-lg">Erro ao carregar auto</h3>
          <p className="mt-2">{error}</p>
          <Link 
            to="/fiscalizacao/supermercado"
            className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ← Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Editar Auto de Supermercado</h1>
            <p className="text-gray-600">Auto nº {formData.numero || id}</p>
          </div>
          <Link
            to={`/fiscalizacao/supermercados/${id}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Erro de salvamento */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Dados básicos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Dados Básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Auto
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ex: 2024/001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Fiscalização *
              </label>
              <input
                type="date"
                name="data_fiscalizacao"
                value={formData.data_fiscalizacao}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora da Fiscalização
              </label>
              <input
                type="time"
                name="hora_fiscalizacao"
                value={formData.hora_fiscalizacao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Dados do estabelecimento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Dados do Estabelecimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite a razão social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                name="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o nome fantasia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Município *
              </label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o município"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o endereço completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="00000-000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="(00) 0000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Responsável legal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Responsável Legal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Responsável
              </label>
              <input
                type="text"
                name="responsavel_nome"
                value={formData.responsavel_nome}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF do Responsável
              </label>
              <input
                type="text"
                name="responsavel_cpf"
                value={formData.responsavel_cpf}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              <input
                type="text"
                name="responsavel_funcao"
                value={formData.responsavel_funcao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ex: Gerente, Proprietário"
              />
            </div>
          </div>
        </div>

        {/* Irregularidades relacionadas a produtos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Irregularidades - Produtos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IrregularidadeField
              name="produtos_vencidos"
              label="Produtos com validade vencida"
              obsName="produtos_vencidos_obs"
            />
            <IrregularidadeField
              name="embalagem_violada"
              label="Produtos com embalagem violada"
              obsName="embalagem_violada_obs"
            />
            <IrregularidadeField
              name="lata_amassada"
              label="Latas amassadas"
              obsName="lata_amassada_obs"
            />
            <IrregularidadeField
              name="sem_validade"
              label="Produtos sem data de validade"
              obsName="sem_validade_obs"
            />
            <IrregularidadeField
              name="validade_ilegivel"
              label="Validade ilegível"
              obsName="validade_ilegivel_obs"
            />
            <IrregularidadeField
              name="mal_armazenados"
              label="Produtos mal armazenados"
              obsName="mal_armazenados_obs"
            />
            <IrregularidadeField
              name="produtos_descongelados"
              label="Produtos descongelados inadequadamente"
              obsName="produtos_descongelados_obs"
            />
          </div>
        </div>

        {/* Irregularidades de publicidade e preços */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Irregularidades - Publicidade e Preços</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IrregularidadeField
              name="publicidade_enganosa"
              label="Publicidade enganosa"
              obsName="publicidade_enganosa_obs"
            />
            <IrregularidadeField
              name="obstrucao_monitor"
              label="Obstrução de monitor de preços"
              obsName="obstrucao_monitor_obs"
            />
            <IrregularidadeField
              name="precos_fora_padrao"
              label="Preços fora do padrão"
              obsName="precos_fora_padrao_obs"
            />
            <IrregularidadeField
              name="ausencia_precos"
              label="Ausência de preços"
              obsName="ausencia_precos_obs"
            />
            <IrregularidadeField
              name="fracionados_fora_padrao"
              label="Produtos fracionados fora do padrão"
              obsName="fracionados_fora_padrao_obs"
            />
            <IrregularidadeField
              name="ausencia_desconto_visibilidade"
              label="Falta de visibilidade em descontos"
              obsName="ausencia_desconto_visibilidade_obs"
            />
            <IrregularidadeField
              name="ausencia_placas_promocao"
              label="Ausência de placas de promoção"
              obsName="ausencia_placas_promocao_obs"
            />
          </div>
        </div>

        {/* Fiscais responsáveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Fiscais Responsáveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Responsável
              </label>
              <input
                type="text"
                name="fiscal_responsavel"
                value={formData.fiscal_responsavel}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome do fiscal responsável"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal de Apoio
              </label>
              <input
                type="text"
                name="fiscal_apoio"
                value={formData.fiscal_apoio}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome do fiscal de apoio"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Observações</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações Gerais
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Link
            to={`/fiscalizacao/supermercados/${id}`}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AutoSupermercadoEditPage;