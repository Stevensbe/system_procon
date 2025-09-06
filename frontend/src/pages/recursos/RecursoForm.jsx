import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  CalendarDaysIcon,
  DocumentPlusIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import recursosService from '../../services/recursosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RecursoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Identificação
    numero_protocolo: '',
    tipo_recurso: '',
    instancia: 'primeira',
    
    // Processo relacionado
    numero_processo: '',
    numero_auto: '',
    
    // Requerente
    requerente_nome: '',
    requerente_tipo: 'pessoa_juridica',
    requerente_documento: '',
    requerente_endereco: '',
    requerente_telefone: '',
    requerente_email: '',
    
    // Representação
    tem_advogado: false,
    advogado_nome: '',
    advogado_oab: '',
    procuracao_anexada: false,
    
    // Datas e prazos
    data_protocolo: new Date().toISOString().split('T')[0],
    data_limite_analise: '',
    
    // Petição
    assunto: '',
    fundamentacao: '',
    pedido: '',
    valor_causa: '',
    
    // Documentos
    peticao_inicial: null,
    documentos_complementares: '',
    
    // Status e decisão
    status: 'protocolado',
    decisao: '',
    fundamentacao_decisao: '',
    data_decisao: '',
    
    // Responsável pela análise
    relator: '',
    parecer_tecnico: '',
    data_parecer: '',
    
    // Recursos desta decisão
    recurso_hierarquico: null,
    
    // Notificações
    requerente_notificado: false,
    data_notificacao: ''
  });

  const [tiposRecurso, setTiposRecurso] = useState([]);
  const [recursosHierarquicos, setRecursosHierarquicos] = useState([]);

  useEffect(() => {
    carregarDadosIniciais();
    if (isEditing) {
      carregarRecurso();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      // Carregar tipos de recurso
      const tipos = await recursosService.getTiposRecurso();
      setTiposRecurso(tipos);

      // Carregar recursos hierárquicos disponíveis
      const hierarquicos = await recursosService.getRecursosHierarquicos();
      setRecursosHierarquicos(hierarquicos);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      // Usar dados mock
      carregarDadosMock();
    }
  };

  const carregarDadosMock = () => {
    setTiposRecurso([
      { id: 1, nome: 'Recurso Ordinário', codigo: 'REC_ORD', prazo_dias: 30 },
      { id: 2, nome: 'Recurso Extraordinário', codigo: 'REC_EXT', prazo_dias: 60 },
      { id: 3, nome: 'Pedido de Revisão', codigo: 'PED_REV', prazo_dias: 45 },
      { id: 4, nome: 'Pedido de Reconsideração', codigo: 'PED_REC', prazo_dias: 15 }
    ]);

    setRecursosHierarquicos([
      { id: 1, numero_protocolo: 'REC-00100/2024', assunto: 'Recurso contra multa' },
      { id: 2, numero_protocolo: 'REC-00101/2024', assunto: 'Recurso contra decisão' }
    ]);
  };

  const carregarRecurso = async () => {
    setLoading(true);
    try {
      const recurso = await recursosService.getRecurso(id);
      setFormData({
        ...recurso,
        data_protocolo: recurso.data_protocolo ? formatDate(recurso.data_protocolo, 'YYYY-MM-DD') : '',
        data_limite_analise: recurso.data_limite_analise ? formatDate(recurso.data_limite_analise, 'YYYY-MM-DD') : '',
        data_decisao: recurso.data_decisao ? formatDate(recurso.data_decisao, 'YYYY-MM-DD') : '',
        data_parecer: recurso.data_parecer ? formatDate(recurso.data_parecer, 'YYYY-MM-DD') : '',
        data_notificacao: recurso.data_notificacao ? formatDate(recurso.data_notificacao, 'YYYY-MM-DD') : ''
      });
    } catch (error) {
      console.error('Erro ao carregar recurso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Calcular data limite automaticamente
    if (field === 'tipo_recurso' || field === 'data_protocolo') {
      calcularDataLimite();
    }
  };

  const calcularDataLimite = () => {
    if (formData.tipo_recurso && formData.data_protocolo) {
      const tipo = tiposRecurso.find(t => t.id == formData.tipo_recurso);
      if (tipo) {
        const dataProtocolo = new Date(formData.data_protocolo);
        const dataLimite = new Date(dataProtocolo);
        dataLimite.setDate(dataLimite.getDate() + tipo.prazo_dias);
        
        setFormData(prev => ({
          ...prev,
          data_limite_analise: dataLimite.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validações obrigatórias
    if (!formData.requerente_nome.trim()) {
      newErrors.requerente_nome = 'Nome do requerente é obrigatório';
    }

    if (!formData.requerente_documento.trim()) {
      newErrors.requerente_documento = 'Documento do requerente é obrigatório';
    }

    if (!formData.tipo_recurso) {
      newErrors.tipo_recurso = 'Tipo de recurso é obrigatório';
    }

    if (!formData.assunto.trim()) {
      newErrors.assunto = 'Assunto é obrigatório';
    }

    if (!formData.fundamentacao.trim()) {
      newErrors.fundamentacao = 'Fundamentação é obrigatória';
    }

    if (!formData.pedido.trim()) {
      newErrors.pedido = 'Pedido é obrigatório';
    }

    if (!formData.data_protocolo) {
      newErrors.data_protocolo = 'Data de protocolo é obrigatória';
    }

    // Validações específicas
    if (formData.requerente_email && !isValidEmail(formData.requerente_email)) {
      newErrors.requerente_email = 'Email inválido';
    }

    if (formData.valor_causa && parseFloat(formData.valor_causa) < 0) {
      newErrors.valor_causa = 'Valor da causa deve ser positivo';
    }

    if (formData.tem_advogado && !formData.advogado_nome.trim()) {
      newErrors.advogado_nome = 'Nome do advogado é obrigatório quando há representação';
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

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      
      // Adicionar todos os campos ao FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          if (key === 'peticao_inicial' && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else if (typeof formData[key] === 'boolean') {
            formDataToSend.append(key, formData[key] ? 'true' : 'false');
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      if (isEditing) {
        await recursosService.updateRecurso(id, formDataToSend);
      } else {
        await recursosService.createRecurso(formDataToSend);
      }

      navigate('/recursos');
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      setErrors({ submit: 'Erro ao salvar recurso. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/recursos');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Editar Recurso' : 'Novo Recurso'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? 'Editar informações do recurso' : 'Criar novo recurso administrativo'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção 1: Identificação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Identificação do Recurso
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do Protocolo
              </label>
              <input
                type="text"
                value={formData.numero_protocolo}
                onChange={(e) => handleInputChange('numero_protocolo', e.target.value)}
                placeholder="REC-00000/2025"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.numero_protocolo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.numero_protocolo && (
                <p className="mt-1 text-sm text-red-600">{errors.numero_protocolo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Recurso *
              </label>
              <select
                value={formData.tipo_recurso}
                onChange={(e) => handleInputChange('tipo_recurso', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.tipo_recurso ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione o tipo</option>
                {tiposRecurso.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome} ({tipo.prazo_dias} dias)
                  </option>
                ))}
              </select>
              {errors.tipo_recurso && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo_recurso}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instância
              </label>
              <select
                value={formData.instancia}
                onChange={(e) => handleInputChange('instancia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="primeira">Primeira Instância</option>
                <option value="segunda">Segunda Instância</option>
                <option value="terceira">Terceira Instância</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do Processo
              </label>
              <input
                type="text"
                value={formData.numero_processo}
                onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                placeholder="PROC-00000/2025"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do Auto
              </label>
              <input
                type="text"
                value={formData.numero_auto}
                onChange={(e) => handleInputChange('numero_auto', e.target.value)}
                placeholder="AUTO-00000/2025"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Requerente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Dados do Requerente
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Requerente *
              </label>
              <input
                type="text"
                value={formData.requerente_nome}
                onChange={(e) => handleInputChange('requerente_nome', e.target.value)}
                placeholder="Nome completo ou razão social"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.requerente_nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.requerente_nome && (
                <p className="mt-1 text-sm text-red-600">{errors.requerente_nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Requerente
              </label>
              <select
                value={formData.requerente_tipo}
                onChange={(e) => handleInputChange('requerente_tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="pessoa_fisica">Pessoa Física</option>
                <option value="pessoa_juridica">Pessoa Jurídica</option>
                <option value="representante">Representante Legal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                value={formData.requerente_documento}
                onChange={(e) => handleInputChange('requerente_documento', e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.requerente_documento ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.requerente_documento && (
                <p className="mt-1 text-sm text-red-600">{errors.requerente_documento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.requerente_email}
                onChange={(e) => handleInputChange('requerente_email', e.target.value)}
                placeholder="email@exemplo.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.requerente_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.requerente_email && (
                <p className="mt-1 text-sm text-red-600">{errors.requerente_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.requerente_telefone}
                onChange={(e) => handleInputChange('requerente_telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.requerente_endereco}
              onChange={(e) => handleInputChange('requerente_endereco', e.target.value)}
              rows={3}
              placeholder="Endereço completo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Seção 3: Representação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Representação Legal
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tem_advogado"
                checked={formData.tem_advogado}
                onChange={(e) => handleInputChange('tem_advogado', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="tem_advogado" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Há representação por advogado
              </label>
            </div>

            {formData.tem_advogado && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Advogado *
                  </label>
                  <input
                    type="text"
                    value={formData.advogado_nome}
                    onChange={(e) => handleInputChange('advogado_nome', e.target.value)}
                    placeholder="Nome completo do advogado"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                      errors.advogado_nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.advogado_nome && (
                    <p className="mt-1 text-sm text-red-600">{errors.advogado_nome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    OAB
                  </label>
                  <input
                    type="text"
                    value={formData.advogado_oab}
                    onChange={(e) => handleInputChange('advogado_oab', e.target.value)}
                    placeholder="000000/AM"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="procuracao_anexada"
                checked={formData.procuracao_anexada}
                onChange={(e) => handleInputChange('procuracao_anexada', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="procuracao_anexada" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                Procuração anexada
              </label>
            </div>
          </div>
        </div>

        {/* Seção 4: Petição */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <ScaleIcon className="h-5 w-5 mr-2" />
            Conteúdo da Petição
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assunto *
              </label>
              <input
                type="text"
                value={formData.assunto}
                onChange={(e) => handleInputChange('assunto', e.target.value)}
                placeholder="Resumo do assunto do recurso"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.assunto ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.assunto && (
                <p className="mt-1 text-sm text-red-600">{errors.assunto}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fundamentação *
              </label>
              <textarea
                value={formData.fundamentacao}
                onChange={(e) => handleInputChange('fundamentacao', e.target.value)}
                rows={6}
                placeholder="Fundamentação jurídica do recurso..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.fundamentacao ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fundamentacao && (
                <p className="mt-1 text-sm text-red-600">{errors.fundamentacao}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pedido *
              </label>
              <textarea
                value={formData.pedido}
                onChange={(e) => handleInputChange('pedido', e.target.value)}
                rows={4}
                placeholder="Pedidos específicos do recurso..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.pedido ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.pedido && (
                <p className="mt-1 text-sm text-red-600">{errors.pedido}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor da Causa (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_causa}
                onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                placeholder="0,00"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.valor_causa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.valor_causa && (
                <p className="mt-1 text-sm text-red-600">{errors.valor_causa}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seção 5: Documentos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Documentos
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Petição Inicial
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="peticao_inicial"
                      className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Fazer upload</span>
                      <input
                        id="peticao_inicial"
                        name="peticao_inicial"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('peticao_inicial', e.target.files[0])}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">ou arrastar e soltar</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC ou DOCX até 10MB
                  </p>
                </div>
              </div>
              {formData.peticao_inicial && (
                <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  {formData.peticao_inicial.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Documentos Complementares
              </label>
              <textarea
                value={formData.documentos_complementares}
                onChange={(e) => handleInputChange('documentos_complementares', e.target.value)}
                rows={3}
                placeholder="Lista de documentos anexados..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Seção 6: Prazos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Prazos e Datas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Protocolo *
              </label>
              <input
                type="date"
                value={formData.data_protocolo}
                onChange={(e) => handleInputChange('data_protocolo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${
                  errors.data_protocolo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.data_protocolo && (
                <p className="mt-1 text-sm text-red-600">{errors.data_protocolo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Limite para Análise
              </label>
              <input
                type="date"
                value={formData.data_limite_analise}
                onChange={(e) => handleInputChange('data_limite_analise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Atualizar Recurso' : 'Criar Recurso'}
              </>
            )}
          </button>
        </div>

        {/* Erro de submissão */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default RecursoForm;
