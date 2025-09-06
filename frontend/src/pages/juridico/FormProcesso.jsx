import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// Ícone de salvar
const SaveIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m1 0h4" />
  </svg>
);
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const FormProcesso = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analistas, setAnalistas] = useState([]);
  const [carregandoAnalistas, setCarregandoAnalistas] = useState(true);
  const { notifications, addNotification, removeNotification } = useNotification();

  const [formData, setFormData] = useState({
    numero_peticao: '',
    parte: '',
    empresa_cnpj: '',
    assunto: '',
    descricao: '',
    valor_causa: '',
    status: 'ABERTO',
    prioridade: 'MEDIA',
    data_limite: '',
    analista: ''
  });

  const [errors, setErrors] = useState({});

  const isEditing = Boolean(id);

  useEffect(() => {
    carregarAnalistas();
    if (isEditing) {
      carregarProcesso();
    }
  }, [id]);

  const carregarAnalistas = async () => {
    try {
      setCarregandoAnalistas(true);
      const response = await juridicoService.listarAnalistas();
      setAnalistas(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar analistas:', error);
      addNotification('Erro ao carregar lista de analistas', 'error');
    } finally {
      setCarregandoAnalistas(false);
    }
  };

  const carregarProcesso = async () => {
    try {
      setLoading(true);
      const response = await juridicoService.getProcesso(id);
      const processo = response.data;
      
      setFormData({
        numero_peticao: processo.numero_peticao || '',
        parte: processo.parte || '',
        empresa_cnpj: processo.empresa_cnpj || '',
        assunto: processo.assunto || '',
        descricao: processo.descricao || '',
        valor_causa: processo.valor_causa || '',
        status: processo.status || 'ABERTO',
        prioridade: processo.prioridade || 'MEDIA',
        data_limite: processo.data_limite ? new Date(processo.data_limite).toISOString().split('T')[0] : '',
        analista: processo.analista?.id || ''
      });
    } catch (error) {
      console.error('Erro ao carregar processo:', error);
      addNotification('Erro ao carregar dados do processo', 'error');
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
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.parte.trim()) {
      novosErros.parte = 'Parte envolvida é obrigatória';
    }

    if (!formData.assunto.trim()) {
      novosErros.assunto = 'Assunto é obrigatório';
    }

    if (!formData.descricao.trim()) {
      novosErros.descricao = 'Descrição é obrigatória';
    }

    if (formData.valor_causa && isNaN(parseFloat(formData.valor_causa))) {
      novosErros.valor_causa = 'Valor da causa deve ser um número válido';
    }

    if (formData.empresa_cnpj && !validarCNPJ(formData.empresa_cnpj)) {
      novosErros.empresa_cnpj = 'CNPJ inválido';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const validarCNPJ = (cnpj) => {
    // Remover caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Validar dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;
    
    if (parseInt(cnpj.charAt(12)) !== digito1) return false;
    
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpj.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;
    
    return parseInt(cnpj.charAt(13)) === digito2;
  };

  const formatarCNPJ = (value) => {
    const cnpj = value.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e) => {
    const { value } = e.target;
    const cnpjFormatado = formatarCNPJ(value);
    setFormData(prev => ({
      ...prev,
      empresa_cnpj: cnpjFormatado
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      addNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const dadosProcesso = {
        ...formData,
        valor_causa: formData.valor_causa ? parseFloat(formData.valor_causa) : null,
        data_limite: formData.data_limite ? new Date(formData.data_limite).toISOString() : null,
        analista: formData.analista || null
      };

      if (isEditing) {
        await juridicoService.atualizarProcesso(id, dadosProcesso);
        addNotification('Processo atualizado com sucesso!', 'success');
      } else {
        await juridicoService.criarProcesso(dadosProcesso);
        addNotification('Processo criado com sucesso!', 'success');
      }
      
      navigate('/juridico/processos');
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
      addNotification('Erro ao salvar processo', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/juridico/processos')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Processo' : 'Novo Processo'}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {isEditing ? 'Atualize as informações do processo' : 'Preencha as informações do novo processo'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número da Petição
                  </label>
                  <input
                    type="text"
                    name="numero_peticao"
                    value={formData.numero_peticao}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.numero_peticao ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número da petição (opcional)"
                  />
                  {errors.numero_peticao && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numero_peticao}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parte Envolvida *
                  </label>
                  <input
                    type="text"
                    name="parte"
                    value={formData.parte}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.parte ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nome da parte envolvida"
                    required
                  />
                  {errors.parte && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.parte}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNPJ da Empresa
                  </label>
                  <input
                    type="text"
                    name="empresa_cnpj"
                    value={formData.empresa_cnpj}
                    onChange={handleCNPJChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.empresa_cnpj ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  {errors.empresa_cnpj && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa_cnpj}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assunto *
                  </label>
                  <input
                    type="text"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.assunto ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Assunto do processo"
                    required
                  />
                  {errors.assunto && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assunto}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da Causa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="valor_causa"
                      value={formData.valor_causa}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.valor_causa ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.valor_causa && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.valor_causa}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Limite
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="data_limite"
                      value={formData.data_limite}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status e Prioridade */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Status e Atribuição
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="ABERTO">Aberto</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="AGUARDANDO_DOCUMENTO">Aguardando Documento</option>
                    <option value="RESPONDIDO">Respondido</option>
                    <option value="ARQUIVADO">Arquivado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <select
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analista Responsável
                  </label>
                  <select
                    name="analista"
                    value={formData.analista}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={carregandoAnalistas}
                  >
                    <option value="">Selecione um analista</option>
                    {analistas.map((analista) => (
                      <option key={analista.id} value={analista.id}>
                        {analista.user.first_name} {analista.user.last_name} - {analista.oab}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.descricao ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descreva detalhadamente o processo..."
                required
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descricao}</p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/juridico/processos')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <SaveIcon className="h-5 w-5 mr-2" />
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormProcesso;
