import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAutoBancoById, atualizarAutoBanco } from '../../../services/fiscalizacaoService';

function AutoBancoEditPage() {
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
    
    // Informações específicas do banco
    agencia: '',
    codigo_banco: '',
    tipo_atendimento: '',
    horario_funcionamento: '',
    
    // Irregularidades encontradas
    tem_irregularidades: false,
    irregularidades_detalhes: '',
    
    // Documentos solicitados
    documentos_solicitados: '',
    documentos_apresentados: false,
    prazo_apresentacao: '24',
    
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
      const data = await getAutoBancoById(id);
      
      // Formatar dados para o formulário
      const formattedData = {
        ...data,
        data_fiscalizacao: data.data_fiscalizacao || '',
        hora_fiscalizacao: data.hora_fiscalizacao || '',
        tem_irregularidades: Boolean(data.tem_irregularidades),
        documentos_apresentados: Boolean(data.documentos_apresentados),
        prazo_apresentacao: data.prazo_apresentacao?.toString() || '24'
      };
      
      setFormData(formattedData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar auto de banco');
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
        prazo_apresentacao: parseInt(formData.prazo_apresentacao) || 24
      };
      
      await atualizarAutoBanco(id, dataToSend);
      navigate(`/fiscalizacao/bancos/${id}`, { 
        state: { message: 'Auto de banco atualizado com sucesso!' }
      });
    } catch (err) {
      setError(err.message || 'Erro ao atualizar auto de banco');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Carregando auto de banco...</div>
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
            to="/fiscalizacao/banco"
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
            <h1 className="text-3xl font-bold text-blue-800">Editar Auto de Banco</h1>
            <p className="text-gray-600">Auto nº {formData.numero || id}</p>
          </div>
          <Link
            to={`/fiscalizacao/bancos/${id}`}
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
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Dados Básicos</h2>
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
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Dados do Estabelecimento</h2>
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
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Responsável Legal</h2>
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
                placeholder="Ex: Gerente, Superintendente"
              />
            </div>
          </div>
        </div>

        {/* Informações específicas do banco */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Informações Bancárias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agência
              </label>
              <input
                type="text"
                name="agencia"
                value={formData.agencia}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código do Banco
              </label>
              <input
                type="text"
                name="codigo_banco"
                value={formData.codigo_banco}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Atendimento
              </label>
              <select
                name="tipo_atendimento"
                value={formData.tipo_atendimento}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione...</option>
                <option value="presencial">Presencial</option>
                <option value="autoatendimento">Autoatendimento</option>
                <option value="misto">Misto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                name="horario_funcionamento"
                value={formData.horario_funcionamento}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ex: 8h às 14h"
              />
            </div>
          </div>
        </div>

        {/* Irregularidades */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Irregularidades</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="tem_irregularidades"
                  checked={formData.tem_irregularidades}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Foram encontradas irregularidades
                </span>
              </label>
            </div>
            {formData.tem_irregularidades && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalhes das Irregularidades
                </label>
                <textarea
                  name="irregularidades_detalhes"
                  value={formData.irregularidades_detalhes || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Descreva as irregularidades encontradas..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Documentos</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documentos Solicitados
              </label>
              <textarea
                name="documentos_solicitados"
                value={formData.documentos_solicitados}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Liste os documentos solicitados..."
              />
            </div>
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
        </div>

        {/* Fiscais responsáveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Fiscais Responsáveis</h2>
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
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Observações</h2>
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
            to={`/fiscalizacao/bancos/${id}`}
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
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AutoBancoEditPage;