import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAutoPostoById, atualizarAutoPosto } from '../../../services/fiscalizacaoService';

function AutoPostoEditPage() {
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
    
    // Preços dos combustíveis no totem
    gasolina_comum_totem: '',
    gasolina_aditivada_totem: '',
    etanol_totem: '',
    diesel_comum_totem: '',
    diesel_s10_totem: '',
    gnv_totem: '',
    
    // Preços nas bombas
    gasolina_comum_bomba: '',
    gasolina_aditivada_bomba: '',
    etanol_bomba: '',
    diesel_comum_bomba: '',
    diesel_s10_bomba: '',
    gnv_bomba: '',
    
    // Documentos
    documentos_apresentados: false,
    prazo_apresentacao: '24',
    
    // Observações
    observacoes: '',
    irregularidades_encontradas: '',
    
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
      const data = await getAutoPostoById(id);
      
      // Formatar dados para o formulário
      const formattedData = {
        ...data,
        data_fiscalizacao: data.data_fiscalizacao || '',
        hora_fiscalizacao: data.hora_fiscalizacao || '',
        documentos_apresentados: Boolean(data.documentos_apresentados),
        prazo_apresentacao: data.prazo_apresentacao?.toString() || '24',
        
        // Garantir que campos de preço sejam strings
        gasolina_comum_totem: data.gasolina_comum_totem?.toString() || '',
        gasolina_aditivada_totem: data.gasolina_aditivada_totem?.toString() || '',
        etanol_totem: data.etanol_totem?.toString() || '',
        diesel_comum_totem: data.diesel_comum_totem?.toString() || '',
        diesel_s10_totem: data.diesel_s10_totem?.toString() || '',
        gnv_totem: data.gnv_totem?.toString() || '',
        
        gasolina_comum_bomba: data.gasolina_comum_bomba?.toString() || '',
        gasolina_aditivada_bomba: data.gasolina_aditivada_bomba?.toString() || '',
        etanol_bomba: data.etanol_bomba?.toString() || '',
        diesel_comum_bomba: data.diesel_comum_bomba?.toString() || '',
        diesel_s10_bomba: data.diesel_s10_bomba?.toString() || '',
        gnv_bomba: data.gnv_bomba?.toString() || ''
      };
      
      setFormData(formattedData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar auto de posto');
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
      
      // Preparar dados para envio
      const dataToSend = {
        ...formData,
        // Converter strings vazias para null nos campos de preço
        gasolina_comum_totem: formData.gasolina_comum_totem || null,
        gasolina_aditivada_totem: formData.gasolina_aditivada_totem || null,
        etanol_totem: formData.etanol_totem || null,
        diesel_comum_totem: formData.diesel_comum_totem || null,
        diesel_s10_totem: formData.diesel_s10_totem || null,
        gnv_totem: formData.gnv_totem || null,
        
        gasolina_comum_bomba: formData.gasolina_comum_bomba || null,
        gasolina_aditivada_bomba: formData.gasolina_aditivada_bomba || null,
        etanol_bomba: formData.etanol_bomba || null,
        diesel_comum_bomba: formData.diesel_comum_bomba || null,
        diesel_s10_bomba: formData.diesel_s10_bomba || null,
        gnv_bomba: formData.gnv_bomba || null,
        
        prazo_apresentacao: parseInt(formData.prazo_apresentacao) || 24
      };
      
      await atualizarAutoPosto(id, dataToSend);
      navigate(`/fiscalizacao/postos/${id}`, { 
        state: { message: 'Auto de posto atualizado com sucesso!' }
      });
    } catch (err) {
      setError(err.message || 'Erro ao atualizar auto de posto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <div className="text-lg text-gray-600">Carregando auto de posto...</div>
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
            to="/fiscalizacao/posto"
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
            <h1 className="text-3xl font-bold text-orange-800">Editar Auto de Posto</h1>
            <p className="text-gray-600">Auto nº {formData.numero || id}</p>
          </div>
          <Link
            to={`/fiscalizacao/postos/${id}`}
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
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Dados Básicos</h2>
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
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Dados do Estabelecimento</h2>
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
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Responsável Legal</h2>
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

        {/* Preços dos combustíveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Preços dos Combustíveis</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Preços no Totem</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gasolina Comum
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gasolina_comum_totem"
                  value={formData.gasolina_comum_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gasolina Aditivada
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gasolina_aditivada_totem"
                  value={formData.gasolina_aditivada_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etanol
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="etanol_totem"
                  value={formData.etanol_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diesel Comum
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="diesel_comum_totem"
                  value={formData.diesel_comum_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diesel S-10
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="diesel_s10_totem"
                  value={formData.diesel_s10_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GNV
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gnv_totem"
                  value={formData.gnv_totem}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Preços nas Bombas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gasolina Comum
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gasolina_comum_bomba"
                  value={formData.gasolina_comum_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gasolina Aditivada
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gasolina_aditivada_bomba"
                  value={formData.gasolina_aditivada_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etanol
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="etanol_bomba"
                  value={formData.etanol_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diesel Comum
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="diesel_comum_bomba"
                  value={formData.diesel_comum_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diesel S-10
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="diesel_s10_bomba"
                  value={formData.diesel_s10_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GNV
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="gnv_bomba"
                  value={formData.gnv_bomba}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="documentos_apresentados"
                  checked={formData.documentos_apresentados}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Documentos apresentados no local
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prazo para apresentação (horas)
              </label>
              <select
                name="prazo_apresentacao"
                value={formData.prazo_apresentacao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="24">24 horas</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fiscais responsáveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Fiscais Responsáveis</h2>
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
          <h2 className="text-xl font-semibold text-orange-800 mb-4">Observações</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Irregularidades Encontradas
              </label>
              <textarea
                name="irregularidades_encontradas"
                value={formData.irregularidades_encontradas}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Descreva as irregularidades encontradas..."
              />
            </div>
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
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Link
            to={`/fiscalizacao/postos/${id}`}
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
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AutoPostoEditPage;