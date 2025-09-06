import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CobrancaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processos, setProcessos] = useState([]);
  const [multas, setMultas] = useState([]);
  
  const [formData, setFormData] = useState({
    numero: '',
    tipo: '',
    processo: '',
    multa: '',
    devedor: '',
    valor_original: '',
    valor_atualizado: '',
    data_vencimento: '',
    data_emissao: '',
    status: 'PENDENTE',
    forma_pagamento: '',
    parcelas: 1,
    observacoes: '',
    documentos_anexos: []
  });

  const tiposCobranca = [
    { value: 'MULTA', label: 'Multa' },
    { value: 'TAXA', label: 'Taxa' },
    { value: 'EMOLUMENTO', label: 'Emolumento' },
    { value: 'CUSTA', label: 'Custa' },
    { value: 'OUTROS', label: 'Outros' }
  ];

  const statusCobranca = [
    { value: 'PENDENTE', label: 'Pendente', color: 'text-yellow-600' },
    { value: 'EM_PROCESSAMENTO', label: 'Em Processamento', color: 'text-blue-600' },
    { value: 'PAGO', label: 'Pago', color: 'text-green-600' },
    { value: 'VENCIDO', label: 'Vencido', color: 'text-red-600' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'text-gray-600' }
  ];

  const formasPagamento = [
    { value: 'BOLETO', label: 'Boleto Bancário' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'TRANSFERENCIA', label: 'Transferência Bancária' },
    { value: 'DINHEIRO', label: 'Dinheiro' }
  ];

  useEffect(() => {
    carregarDadosIniciais();
    if (id) {
      carregarCobranca();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      
      // Carregar processos disponíveis
      const processosData = await cobrancaService.listarProcessos();
      setProcessos(processosData);
      
      // Carregar multas disponíveis
      const multasData = await cobrancaService.listarMultas();
      setMultas(multasData);
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const carregarCobranca = async () => {
    try {
      setLoading(true);
      const cobranca = await cobrancaService.obterCobranca(id);
      setFormData(cobranca);
    } catch (error) {
      console.error('Erro ao carregar cobrança:', error);
      toast.error('Erro ao carregar cobrança');
      navigate('/cobranca');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documentos_anexos: [...prev.documentos_anexos, ...files]
    }));
  };

  const removerAnexo = (index) => {
    setFormData(prev => ({
      ...prev,
      documentos_anexos: prev.documentos_anexos.filter((_, i) => i !== index)
    }));
  };

  const calcularValorAtualizado = () => {
    const valorOriginal = parseFloat(formData.valor_original) || 0;
    const dataVencimento = new Date(formData.data_vencimento);
    const hoje = new Date();
    const diasAtraso = Math.max(0, Math.floor((hoje - dataVencimento) / (1000 * 60 * 60 * 24)));
    
    // Juros de 1% ao mês + multa de 2%
    const jurosMensal = 0.01;
    const multa = 0.02;
    
    if (diasAtraso > 0) {
      const mesesAtraso = diasAtraso / 30;
      const juros = valorOriginal * jurosMensal * mesesAtraso;
      const multaValor = valorOriginal * multa;
      return valorOriginal + juros + multaValor;
    }
    
    return valorOriginal;
  };

  const validarFormulario = () => {
    const erros = [];
    
    if (!formData.numero.trim()) {
      erros.push('Número da cobrança é obrigatório');
    }
    
    if (!formData.tipo) {
      erros.push('Tipo de cobrança é obrigatório');
    }
    
    if (!formData.devedor.trim()) {
      erros.push('Devedor é obrigatório');
    }
    
    if (!formData.valor_original || parseFloat(formData.valor_original) <= 0) {
      erros.push('Valor original deve ser maior que zero');
    }
    
    if (!formData.data_vencimento) {
      erros.push('Data de vencimento é obrigatória');
    }
    
    if (!formData.data_emissao) {
      erros.push('Data de emissão é obrigatória');
    }
    
    return erros;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const erros = validarFormulario();
    if (erros.length > 0) {
      erros.forEach(erro => toast.error(erro));
      return;
    }
    
    // Calcular valor atualizado
    const valorAtualizado = calcularValorAtualizado();
    const dadosParaSalvar = {
      ...formData,
      valor_atualizado: valorAtualizado.toFixed(2)
    };
    
    try {
      setSaving(true);
      
      if (id) {
        await cobrancaService.atualizarCobranca(id, dadosParaSalvar);
        toast.success('Cobrança atualizada com sucesso!');
      } else {
        await cobrancaService.criarCobranca(dadosParaSalvar);
        toast.success('Cobrança criada com sucesso!');
      }
      
      navigate('/cobranca');
    } catch (error) {
      console.error('Erro ao salvar cobrança:', error);
      toast.error('Erro ao salvar cobrança');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cobranca')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {id ? 'Editar Cobrança' : 'Nova Cobrança'}
                </h1>
                <p className="text-gray-600">
                  {id ? 'Edite os dados da cobrança' : 'Crie uma nova cobrança'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Número da Cobrança */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Cobrança *
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: COB-2025-001"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cobrança *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o tipo</option>
                {tiposCobranca.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Processo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processo
              </label>
              <select
                name="processo"
                value={formData.processo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um processo</option>
                {processos.map(processo => (
                  <option key={processo.id} value={processo.id}>
                    {processo.numero} - {processo.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Multa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multa
              </label>
              <select
                name="multa"
                value={formData.multa}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma multa</option>
                {multas.map(multa => (
                  <option key={multa.id} value={multa.id}>
                    {multa.numero} - R$ {multa.valor}
                  </option>
                ))}
              </select>
            </div>

            {/* Devedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devedor *
              </label>
              <input
                type="text"
                name="devedor"
                value={formData.devedor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do devedor"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusCobranca.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor Original */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Original *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  name="valor_original"
                  value={formData.valor_original}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            {/* Valor Atualizado (Calculado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Atualizado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  value={calcularValorAtualizado().toFixed(2)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            {/* Data de Emissão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Emissão *
              </label>
              <input
                type="date"
                name="data_emissao"
                value={formData.data_emissao}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento *
              </label>
              <input
                type="date"
                name="data_vencimento"
                value={formData.data_vencimento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <select
                name="forma_pagamento"
                value={formData.forma_pagamento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione a forma</option>
                {formasPagamento.map(forma => (
                  <option key={forma.value} value={forma.value}>
                    {forma.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parcelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Parcelas
              </label>
              <input
                type="number"
                name="parcelas"
                value={formData.parcelas}
                onChange={handleInputChange}
                min="1"
                max="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Observações */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais"
              />
            </div>

            {/* Anexos */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documentos Anexos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              
              {formData.documentos_anexos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.documentos_anexos.map((arquivo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{arquivo.name}</span>
                      <button
                        type="button"
                        onClick={() => removerAnexo(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/cobranca')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <DocumentCheckIcon className="h-4 w-4" />
              )}
              <span>{saving ? 'Salvando...' : 'Salvar Cobrança'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CobrancaForm;
