import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

const RelatorioForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    modulo: '',
    tipo: '',
    periodo: {
      inicio: '',
      fim: ''
    },
    formato: 'PDF',
    incluirGraficos: true,
    incluirTabelas: true,
    incluirResumo: true,
    filtros: {
      status: '',
      responsavel: '',
      departamento: '',
      categoria: ''
    },
    agendamento: {
      ativo: false,
      frequencia: 'mensal',
      proximaExecucao: ''
    },
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  const modulos = [
    {
      id: 'fiscalizacao',
      nome: 'Fiscalização',
      icon: BuildingOfficeIcon,
      descricao: 'Relatórios de autos de infração, fiscalizações e multas',
      tipos: [
        { id: 'autos_infracao', nome: 'Autos de Infração', descricao: 'Relatório detalhado de autos de infração' },
        { id: 'fiscalizacoes_mes', nome: 'Fiscalizações do Mês', descricao: 'Resumo mensal de fiscalizações realizadas' },
        { id: 'multas_cobranca', nome: 'Multas e Cobranças', descricao: 'Análise de multas aplicadas e cobranças' },
        { id: 'performance_fiscais', nome: 'Performance dos Fiscais', descricao: 'Métricas de performance dos fiscais' }
      ]
    },
    {
      id: 'juridico',
      nome: 'Jurídico',
      icon: ScaleIcon,
      descricao: 'Relatórios de processos jurídicos e análises',
      tipos: [
        { id: 'processos_status', nome: 'Processos por Status', descricao: 'Análise de processos por status atual' },
        { id: 'analises_juridicas', nome: 'Análises Jurídicas', descricao: 'Relatório de análises jurídicas realizadas' },
        { id: 'prazos_vencimento', nome: 'Prazos de Vencimento', descricao: 'Controle de prazos de vencimento' },
        { id: 'performance_analistas', nome: 'Performance dos Analistas', descricao: 'Métricas de performance dos analistas' }
      ]
    },
    {
      id: 'usuarios',
      nome: 'Usuários',
      icon: UserGroupIcon,
      descricao: 'Relatórios de usuários e acessos ao sistema',
      tipos: [
        { id: 'usuarios_ativos', nome: 'Usuários Ativos', descricao: 'Relatório de usuários ativos no sistema' },
        { id: 'acessos_sistema', nome: 'Acessos ao Sistema', descricao: 'Análise de acessos e uso do sistema' },
        { id: 'performance_usuarios', nome: 'Performance de Usuários', descricao: 'Métricas de performance dos usuários' },
        { id: 'auditoria_acessos', nome: 'Auditoria de Acessos', descricao: 'Relatório de auditoria de acessos' }
      ]
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      icon: CurrencyDollarIcon,
      descricao: 'Relatórios financeiros e contábeis',
      tipos: [
        { id: 'receitas_despesas', nome: 'Receitas e Despesas', descricao: 'Análise de receitas e despesas' },
        { id: 'multas_recebidas', nome: 'Multas Recebidas', descricao: 'Relatório de multas recebidas' },
        { id: 'orcamento_execucao', nome: 'Orçamento e Execução', descricao: 'Controle de orçamento e execução' },
        { id: 'fluxo_caixa', nome: 'Fluxo de Caixa', descricao: 'Análise do fluxo de caixa' }
      ]
    }
  ];

  const formatos = [
    { id: 'PDF', nome: 'PDF', descricao: 'Documento PDF (recomendado)' },
    { id: 'EXCEL', nome: 'Excel', descricao: 'Planilha Excel (.xlsx)' },
    { id: 'CSV', nome: 'CSV', descricao: 'Arquivo CSV (dados brutos)' }
  ];

  const frequencias = [
    { id: 'unica', nome: 'Execução Única', descricao: 'Executar apenas uma vez' },
    { id: 'diaria', nome: 'Diária', descricao: 'Executar todos os dias' },
    { id: 'semanal', nome: 'Semanal', descricao: 'Executar uma vez por semana' },
    { id: 'mensal', nome: 'Mensal', descricao: 'Executar uma vez por mês' },
    { id: 'trimestral', nome: 'Trimestral', descricao: 'Executar a cada 3 meses' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.modulo) {
      newErrors.modulo = 'Módulo é obrigatório';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo de relatório é obrigatório';
    }

    if (!formData.periodo.inicio) {
      newErrors['periodo.inicio'] = 'Data de início é obrigatória';
    }

    if (!formData.periodo.fim) {
      newErrors['periodo.fim'] = 'Data de fim é obrigatória';
    }

    if (formData.periodo.inicio && formData.periodo.fim) {
      if (new Date(formData.periodo.inicio) > new Date(formData.periodo.fim)) {
        newErrors['periodo.fim'] = 'Data de fim deve ser posterior à data de início';
      }
    }

    if (formData.agendamento.ativo && !formData.agendamento.proximaExecucao) {
      newErrors['agendamento.proximaExecucao'] = 'Data da próxima execução é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setGenerating(true);
    try {
      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Sucesso - redirecionar para lista
      navigate('/relatorios/lista');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getModuloIcon = (moduloId) => {
    const modulo = modulos.find(m => m.id === moduloId);
    return modulo ? modulo.icon : DocumentTextIcon;
  };

  const getTiposByModulo = (moduloId) => {
    const modulo = modulos.find(m => m.id === moduloId);
    return modulo ? modulo.tipos : [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/relatorios/lista"
              className="mr-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerar Relatório
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Configure e gere um novo relatório personalizado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Informações Básicas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título do Relatório *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.titulo 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Ex: Relatório de Fiscalização - Junho 2024"
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.titulo}
                </p>
              )}
            </div>

            {/* Módulo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulo *
              </label>
              <select
                value={formData.modulo}
                onChange={(e) => {
                  handleInputChange('modulo', e.target.value);
                  handleInputChange('tipo', ''); // Reset tipo when modulo changes
                }}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.modulo 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">Selecione um módulo...</option>
                {modulos.map(modulo => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nome}
                  </option>
                ))}
              </select>
              {errors.modulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.modulo}
                </p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Relatório *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                disabled={!formData.modulo}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.tipo 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {formData.modulo ? 'Selecione um tipo...' : 'Selecione um módulo primeiro'}
                </option>
                {formData.modulo && getTiposByModulo(formData.modulo).map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.tipo}
                </p>
              )}
            </div>

            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Início *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.periodo.inicio}
                  onChange={(e) => handleInputChange('periodo.inicio', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['periodo.inicio'] 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {errors['periodo.inicio'] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors['periodo.inicio']}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Fim *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.periodo.fim}
                  onChange={(e) => handleInputChange('periodo.fim', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['periodo.fim'] 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {errors['periodo.fim'] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors['periodo.fim']}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Configurações do Relatório */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <DocumentChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configurações do Relatório
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Saída
              </label>
              <select
                value={formData.formato}
                onChange={(e) => handleInputChange('formato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {formatos.map(formato => (
                  <option key={formato.id} value={formato.id}>
                    {formato.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Incluir Gráficos */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="incluirGraficos"
                checked={formData.incluirGraficos}
                onChange={(e) => handleInputChange('incluirGraficos', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="incluirGraficos" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Incluir Gráficos
              </label>
            </div>

            {/* Incluir Tabelas */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="incluirTabelas"
                checked={formData.incluirTabelas}
                onChange={(e) => handleInputChange('incluirTabelas', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="incluirTabelas" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Incluir Tabelas
              </label>
            </div>

            {/* Incluir Resumo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="incluirResumo"
                checked={formData.incluirResumo}
                onChange={(e) => handleInputChange('incluirResumo', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="incluirResumo" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Incluir Resumo Executivo
              </label>
            </div>
          </div>
        </div>

        {/* Filtros Adicionais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <FunnelIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Filtros Adicionais
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.filtros.status}
                onChange={(e) => handleInputChange('filtros.status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsável
              </label>
              <input
                type="text"
                value={formData.filtros.responsavel}
                onChange={(e) => handleInputChange('filtros.responsavel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome do responsável"
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento
              </label>
              <select
                value={formData.filtros.departamento}
                onChange={(e) => handleInputChange('filtros.departamento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos os departamentos</option>
                <option value="fiscalizacao">Fiscalização</option>
                <option value="juridico">Jurídico</option>
                <option value="administrativo">Administrativo</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={formData.filtros.categoria}
                onChange={(e) => handleInputChange('filtros.categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Categoria específica"
              />
            </div>
          </div>
        </div>

        {/* Agendamento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Agendamento (Opcional)
            </h2>
          </div>

          <div className="space-y-4">
            {/* Ativar Agendamento */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="agendamentoAtivo"
                checked={formData.agendamento.ativo}
                onChange={(e) => handleInputChange('agendamento.ativo', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="agendamentoAtivo" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Agendar execução automática
              </label>
            </div>

            {formData.agendamento.ativo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frequência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequência
                  </label>
                  <select
                    value={formData.agendamento.frequencia}
                    onChange={(e) => handleInputChange('agendamento.frequencia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {frequencias.map(freq => (
                      <option key={freq.id} value={freq.id}>
                        {freq.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Próxima Execução */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Próxima Execução *
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.agendamento.proximaExecucao}
                      onChange={(e) => handleInputChange('agendamento.proximaExecucao', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors['agendamento.proximaExecucao'] 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                  </div>
                  {errors['agendamento.proximaExecucao'] && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors['agendamento.proximaExecucao']}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Observações
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações Adicionais
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Informações adicionais sobre o relatório..."
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/relatorios/lista"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={generating}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RelatorioForm;
