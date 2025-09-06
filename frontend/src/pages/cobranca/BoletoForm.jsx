import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BoletoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Informações Básicas
    numero: '',
    tipo: 'multa',
    status: 'pendente',
    valor: '',
    valorOriginal: '',
    vencimento: '',
    emissao: new Date().toISOString().split('T')[0],
    
    // Informações do Devedor
    devedor: '',
    documento: '',
    tipoDocumento: 'cpf',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    
    // Informações Bancárias
    banco: '',
    agencia: '',
    conta: '',
    carteira: '',
    nossoNumero: '',
    codigoBarras: '',
    linhaDigitavel: '',
    
    // Informações Adicionais
    descricao: '',
    observacoes: '',
    processo: '',
    autoInfracao: '',
    
    // Configurações
    multaAtraso: '',
    jurosMora: '',
    desconto: '',
    descontoAte: '',
    
    // Documentos
    documentos: []
  });

  const [tiposBoleto, setTiposBoleto] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [processos, setProcessos] = useState([]);

  useEffect(() => {
    carregarDadosIniciais();
    if (id) {
      carregarBoleto();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      const [tipos, bancosData, processosData] = await Promise.all([
        cobrancaService.getTiposBoleto(),
        cobrancaService.getBancos(),
        cobrancaService.getProcessos()
      ]);
      
      // Ensure data is always arrays to prevent map errors
      setTiposBoleto(Array.isArray(tipos) ? tipos : []);
      setBancos(Array.isArray(bancosData) ? bancosData : []);
      setProcessos(Array.isArray(processosData) ? processosData : []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      // Set empty arrays as fallback
      setTiposBoleto([]);
      setBancos([]);
      setProcessos([]);
    }
  };

  const carregarBoleto = async () => {
    try {
      setLoading(true);
      const boleto = await cobrancaService.getBoleto(id);
      setFormData(boleto);
    } catch (error) {
      console.error('Erro ao carregar boleto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Cálculos automáticos
    if (field === 'valor' || field === 'multaAtraso' || field === 'jurosMora') {
      calcularValorTotal();
    }
  };

  const calcularValorTotal = () => {
    const valor = parseFloat(formData.valor) || 0;
    const multa = parseFloat(formData.multaAtraso) || 0;
    const juros = parseFloat(formData.jurosMora) || 0;
    
    const valorTotal = valor + multa + juros;
    setFormData(prev => ({ ...prev, valorTotal: valorTotal.toFixed(2) }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const novosDocumentos = files.map(file => ({
      id: Date.now() + Math.random(),
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      arquivo: file
    }));
    
    setFormData(prev => ({
      ...prev,
      documentos: [...prev.documentos, ...novosDocumentos]
    }));
  };

  const removerDocumento = (documentoId) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter(doc => doc.id !== documentoId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validações obrigatórias
    if (!formData.numero) newErrors.numero = 'Número é obrigatório';
    if (!formData.devedor) newErrors.devedor = 'Devedor é obrigatório';
    if (!formData.documento) newErrors.documento = 'Documento é obrigatório';
    if (!formData.valor) newErrors.valor = 'Valor é obrigatório';
    if (!formData.vencimento) newErrors.vencimento = 'Vencimento é obrigatório';
    if (!formData.banco) newErrors.banco = 'Banco é obrigatório';

    // Validações específicas
    if (formData.valor && parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (formData.documento) {
      if (formData.tipoDocumento === 'cpf' && formData.documento.length !== 11) {
        newErrors.documento = 'CPF deve ter 11 dígitos';
      }
      if (formData.tipoDocumento === 'cnpj' && formData.documento.length !== 14) {
        newErrors.documento = 'CNPJ deve ter 14 dígitos';
      }
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const formDataToSend = new FormData();
      
      // Adicionar campos do formulário
      Object.keys(formData).forEach(key => {
        if (key !== 'documentos') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Adicionar documentos
      formData.documentos.forEach(doc => {
        if (doc.arquivo) {
          formDataToSend.append('documentos', doc.arquivo);
        }
      });

      if (id) {
        await cobrancaService.updateBoleto(id, formDataToSend);
      } else {
        await cobrancaService.createBoleto(formDataToSend);
      }
      
      navigate('/cobranca/boletos');
    } catch (error) {
      console.error('Erro ao salvar boleto:', error);
      setErrors({ submit: 'Erro ao salvar boleto. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/cobranca/boletos');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Editar Boleto' : 'Novo Boleto'}
            </h1>
            <p className="text-gray-600">
              {id ? 'Edite as informações do boleto' : 'Crie um novo boleto de cobrança'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Salvando...' : 'Salvar Boleto'}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-sm text-red-800">{errors.submit}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Informações Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Boleto *
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.numero ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Número do boleto"
              />
              {errors.numero && (
                <p className="mt-1 text-sm text-red-600">{errors.numero}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="multa">Multa</option>
                <option value="taxa">Taxa</option>
                <option value="juros">Juros</option>
                <option value="correção">Correção</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Emissão
              </label>
              <input
                type="date"
                value={formData.emissao}
                onChange={(e) => handleInputChange('emissao', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.valor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0,00"
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Original
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valorOriginal}
                onChange={(e) => handleInputChange('valorOriginal', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vencimento *
              </label>
              <input
                type="date"
                value={formData.vencimento}
                onChange={(e) => handleInputChange('vencimento', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.vencimento ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.vencimento && (
                <p className="mt-1 text-sm text-red-600">{errors.vencimento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processo
              </label>
              <select
                value={formData.processo}
                onChange={(e) => handleInputChange('processo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um processo</option>
                {processos.map(processo => (
                  <option key={processo.id} value={processo.id}>
                    {processo.numero} - {processo.empresa}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informações do Devedor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <UserIcon className="w-5 h-5 mr-2" />
            Informações do Devedor
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome/Razão Social *
              </label>
              <input
                type="text"
                value={formData.devedor}
                onChange={(e) => handleInputChange('devedor', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.devedor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nome completo ou razão social"
              />
              {errors.devedor && (
                <p className="mt-1 text-sm text-red-600">{errors.devedor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento
              </label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documento *
              </label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.documento ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={formData.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
              {errors.documento && (
                <p className="mt-1 text-sm text-red-600">{errors.documento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Endereço completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="AM">Amazonas</option>
                <option value="AC">Acre</option>
                <option value="AP">Amapá</option>
                <option value="PA">Pará</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000-000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Informações Bancárias */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
            Informações Bancárias
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banco *
              </label>
              <select
                value={formData.banco}
                onChange={(e) => handleInputChange('banco', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.banco ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o banco</option>
                {bancos.map(banco => (
                  <option key={banco.codigo} value={banco.codigo}>
                    {banco.codigo} - {banco.nome}
                  </option>
                ))}
              </select>
              {errors.banco && (
                <p className="mt-1 text-sm text-red-600">{errors.banco}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agência
              </label>
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => handleInputChange('agencia', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => handleInputChange('conta', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000000-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carteira
              </label>
              <input
                type="text"
                value={formData.carteira}
                onChange={(e) => handleInputChange('carteira', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="17"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nosso Número
              </label>
              <input
                type="text"
                value={formData.nossoNumero}
                onChange={(e) => handleInputChange('nossoNumero', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <input
                type="text"
                value={formData.codigoBarras}
                onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000000000000000000000000000000000000000000"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linha Digitável
              </label>
              <input
                type="text"
                value={formData.linhaDigitavel}
                onChange={(e) => handleInputChange('linhaDigitavel', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Juros e Multas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
            Configurações de Juros e Multas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multa por Atraso (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.multaAtraso}
                onChange={(e) => handleInputChange('multaAtraso', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Juros de Mora (% ao mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.jurosMora}
                onChange={(e) => handleInputChange('jurosMora', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desconto (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.desconto}
                onChange={(e) => handleInputChange('desconto', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desconto até
              </label>
              <input
                type="date"
                value={formData.descontoAte}
                onChange={(e) => handleInputChange('descontoAte', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Informações Adicionais
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição detalhada do boleto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto de Infração
              </label>
              <input
                type="text"
                value={formData.autoInfracao}
                onChange={(e) => handleInputChange('autoInfracao', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número do auto de infração"
              />
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
            Documentos Anexados
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionar Documentos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="mt-1 text-sm text-gray-500">
                Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG
              </p>
            </div>

            {formData.documentos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Documentos anexados:</h4>
                {formData.documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentDuplicateIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.nome}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.tamanho / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerDocumento(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Salvando...' : 'Salvar Boleto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoletoForm;
