import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const PagamentoBoleto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [boleto, setBoleto] = useState(null);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    dataPagamento: '',
    horaPagamento: '',
    valorPago: '',
    formaPagamento: '',
    instituicaoPagamento: '',
    numeroComprovante: '',
    observacoes: '',
    documentosComprovantes: [],
    descontos: 0,
    juros: 0,
    multa: 0,
    taxas: 0,
    valorLiquido: 0
  });

  const [errors, setErrors] = useState({});

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'boleto_bancario', label: 'Boleto Bancário' },
    { value: 'transferencia_bancaria', label: 'Transferência Bancária' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'deposito_bancario', label: 'Depósito Bancário' }
  ];

  const instituicoesPagamento = [
    { value: 'banco_brasil', label: 'Banco do Brasil' },
    { value: 'itau', label: 'Itaú Unibanco' },
    { value: 'bradesco', label: 'Bradesco' },
    { value: 'santander', label: 'Santander' },
    { value: 'caixa', label: 'Caixa Econômica Federal' },
    { value: 'sicoob', label: 'Sicoob' },
    { value: 'sicredi', label: 'Sicredi' },
    { value: 'outras', label: 'Outras Instituições' }
  ];

  useEffect(() => {
    loadBoleto();
    // Definir data e hora atuais como padrão
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    const horaAtual = agora.toTimeString().slice(0, 5);
    
    setFormData(prev => ({
      ...prev,
      dataPagamento: hoje,
      horaPagamento: horaAtual
    }));
  }, [id]);

  const loadBoleto = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        id: parseInt(id),
        numero: 'BOL-2024-001234',
        valor: 1250.75,
        valorOriginal: 1000.00,
        dataVencimento: '2024-09-15',
        devedor: {
          nome: 'Empresa ABC Ltda',
          cnpj: '12.345.678/0001-90'
        },
        processo: {
          numero: '2024001',
          assunto: 'Prática Comercial Abusiva'
        }
      };
      
      setBoleto(mockData);
      setFormData(prev => ({
        ...prev,
        valorPago: mockData.valor.toFixed(2),
        valorLiquido: mockData.valor
      }));
    } catch (error) {
      showNotification('Erro ao carregar boleto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // Recalcular valor líquido quando valores são alterados
    if (['valorPago', 'descontos', 'juros', 'multa', 'taxas'].includes(field)) {
      const valorPago = parseFloat(field === 'valorPago' ? value : formData.valorPago) || 0;
      const descontos = parseFloat(field === 'descontos' ? value : formData.descontos) || 0;
      const juros = parseFloat(field === 'juros' ? value : formData.juros) || 0;
      const multa = parseFloat(field === 'multa' ? value : formData.multa) || 0;
      const taxas = parseFloat(field === 'taxas' ? value : formData.taxas) || 0;
      
      const valorLiquido = valorPago - descontos + juros + multa + taxas;
      
      setFormData(prev => ({
        ...prev,
        valorLiquido: valorLiquido
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.dataPagamento) {
      newErrors.dataPagamento = 'Data de pagamento é obrigatória';
    }

    if (!formData.horaPagamento) {
      newErrors.horaPagamento = 'Hora de pagamento é obrigatória';
    }

    if (!formData.valorPago) {
      newErrors.valorPago = 'Valor pago é obrigatório';
    } else if (parseFloat(formData.valorPago) <= 0) {
      newErrors.valorPago = 'Valor deve ser maior que zero';
    }

    if (!formData.formaPagamento) {
      newErrors.formaPagamento = 'Forma de pagamento é obrigatória';
    }

    if (!formData.instituicaoPagamento) {
      newErrors.instituicaoPagamento = 'Instituição de pagamento é obrigatória';
    }

    if (!formData.numeroComprovante.trim()) {
      newErrors.numeroComprovante = 'Número do comprovante é obrigatório';
    }

    const dataPagamento = new Date(`${formData.dataPagamento}T${formData.horaPagamento}`);
    const agora = new Date();
    if (dataPagamento > agora) {
      newErrors.dataPagamento = 'Data de pagamento não pode ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Corrija os erros no formulário', 'error');
      return;
    }

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      showNotification('Pagamento registrado com sucesso!', 'success');
      navigate(`/cobranca/boletos/${id}`);
    } catch (error) {
      showNotification('Erro ao registrar pagamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    setFormData(prev => ({
      ...prev,
      documentosComprovantes: [...prev.documentosComprovantes, ...newFiles]
    }));
  };

  const removeFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      documentosComprovantes: prev.documentosComprovantes.filter(file => file.id !== fileId)
    }));
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularDiferenca = () => {
    const valorOriginal = boleto?.valor || 0;
    const valorLiquido = formData.valorLiquido || 0;
    return valorLiquido - valorOriginal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!boleto) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Boleto não encontrado.</p>
      </div>
    );
  }

  const diferenca = calcularDiferenca();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/cobranca/boletos/${id}`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Registrar Pagamento
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Boleto {boleto.numero}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações do Boleto */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <BanknotesIcon className="w-5 h-5 mr-2" />
                Informações do Boleto
              </h2>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número do Boleto
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {boleto.numero}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Devedor
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {boleto.devedor.nome}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valor Original
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatarMoeda(boleto.valor)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Pagamento */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Dados do Pagamento
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => handleInputChange('dataPagamento', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.dataPagamento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dataPagamento && (
                    <p className="mt-1 text-sm text-red-600">{errors.dataPagamento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora do Pagamento *
                  </label>
                  <input
                    type="time"
                    value={formData.horaPagamento}
                    onChange={(e) => handleInputChange('horaPagamento', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.horaPagamento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.horaPagamento && (
                    <p className="mt-1 text-sm text-red-600">{errors.horaPagamento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={formData.formaPagamento}
                    onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.formaPagamento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    {formasPagamento.map(forma => (
                      <option key={forma.value} value={forma.value}>
                        {forma.label}
                      </option>
                    ))}
                  </select>
                  {errors.formaPagamento && (
                    <p className="mt-1 text-sm text-red-600">{errors.formaPagamento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instituição de Pagamento *
                  </label>
                  <select
                    value={formData.instituicaoPagamento}
                    onChange={(e) => handleInputChange('instituicaoPagamento', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.instituicaoPagamento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione a instituição</option>
                    {instituicoesPagamento.map(instituicao => (
                      <option key={instituicao.value} value={instituicao.value}>
                        {instituicao.label}
                      </option>
                    ))}
                  </select>
                  {errors.instituicaoPagamento && (
                    <p className="mt-1 text-sm text-red-600">{errors.instituicaoPagamento}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número do Comprovante/Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroComprovante}
                    onChange={(e) => handleInputChange('numeroComprovante', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.numeroComprovante ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 123456789, DOC12345, TED98765"
                  />
                  {errors.numeroComprovante && (
                    <p className="mt-1 text-sm text-red-600">{errors.numeroComprovante}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Composição dos Valores
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Pago *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorPago}
                      onChange={(e) => handleInputChange('valorPago', e.target.value)}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.valorPago ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.valorPago && (
                    <p className="mt-1 text-sm text-red-600">{errors.valorPago}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descontos
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.descontos}
                      onChange={(e) => handleInputChange('descontos', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Juros
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.juros}
                      onChange={(e) => handleInputChange('juros', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Multa
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.multa}
                      onChange={(e) => handleInputChange('multa', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taxas
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxas}
                      onChange={(e) => handleInputChange('taxas', e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Líquido
                  </label>
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatarMoeda(formData.valorLiquido)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diferença */}
              {Math.abs(diferenca) > 0.01 && (
                <div className={`p-4 rounded-md ${diferenca > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <ExclamationTriangleIcon className={`w-5 h-5 ${diferenca > 0 ? 'text-yellow-400' : 'text-red-400'}`} />
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${diferenca > 0 ? 'text-yellow-800' : 'text-red-800'}`}>
                        {diferenca > 0 ? 'Pagamento a Maior' : 'Pagamento a Menor'}
                      </h3>
                      <p className={`mt-2 text-sm ${diferenca > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                        Diferença de {formatarMoeda(Math.abs(diferenca))} em relação ao valor original do boleto.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comprovantes */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <PaperClipIcon className="w-5 h-5 mr-2" />
                Comprovantes de Pagamento
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Anexe comprovantes do pagamento (PDF, JPG, PNG)
                </p>
              </div>

              {formData.documentosComprovantes.length > 0 && (
                <div className="space-y-2">
                  {formData.documentosComprovantes.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <PaperClipIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Observações
              </h2>
            </div>
            <div className="p-6">
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Observações sobre o pagamento"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Link
              to={`/cobranca/boletos/${id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Registrando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Registrar Pagamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PagamentoBoleto;