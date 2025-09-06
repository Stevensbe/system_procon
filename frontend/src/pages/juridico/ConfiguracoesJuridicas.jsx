import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  ScaleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import juridicoService from '../../services/juridicoService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationContainer from '../../components/ui/NotificationContainer';
import useNotification from '../../hooks/useNotification';

const ConfiguracoesJuridicas = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    // Prazos padrão
    prazo_analise_inicial: 15,
    prazo_analise_complementar: 10,
    prazo_resposta_empresa: 30,
    prazo_recurso: 10,
    prazo_apelacao: 15,
    
    // Configurações de processo
    numeracao_automatica: true,
    prefixo_processo: 'PROC',
    ano_atual: new Date().getFullYear(),
    sequencial_inicial: 1,
    
    // Configurações de notificação
    alerta_prazo_vencendo: 5,
    alerta_prazo_vencido: 1,
    notificar_analista: true,
    notificar_coordenador: true,
    notificar_email: true,
    notificar_sistema: true,
    
    // Configurações de documento
    template_parecer_padrao: '',
    template_resposta_padrao: '',
    assinatura_digital_obrigatoria: true,
    revisao_obrigatoria: true,
    
    // Configurações de acesso
    permissao_criar_processo: ['analista', 'coordenador', 'admin'],
    permissao_editar_processo: ['analista', 'coordenador', 'admin'],
    permissao_excluir_processo: ['coordenador', 'admin'],
    permissao_visualizar_todos: ['coordenador', 'admin'],
    
    // Configurações de relatório
    relatorio_automatico: true,
    frequencia_relatorio: 'semanal',
    incluir_estatisticas: true,
    incluir_graficos: true
  });

  const { notifications, addNotification, removeNotification } = useNotification();

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await juridicoService.getConfiguracoes();
      setConfiguracoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      addNotification('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfiguracoes(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const salvarConfiguracoes = async () => {
    try {
      setSaving(true);
      await juridicoService.salvarConfiguracoes(configuracoes);
      addNotification('Configurações salvas com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      addNotification('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const restaurarPadroes = async () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      try {
        setSaving(true);
        await juridicoService.restaurarConfiguracoesPadrao();
        await carregarConfiguracoes();
        addNotification('Configurações restauradas com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao restaurar configurações:', error);
        addNotification('Erro ao restaurar configurações', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configurações Jurídicas
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Configure parâmetros e comportamentos do sistema jurídico
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={restaurarPadroes}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Restaurar Padrões
              </button>
              <button
                onClick={salvarConfiguracoes}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prazos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurações de Prazos
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo Análise Inicial (dias)
                </label>
                <input
                  type="number"
                  name="prazo_analise_inicial"
                  value={configuracoes.prazo_analise_inicial}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo Análise Complementar (dias)
                </label>
                <input
                  type="number"
                  name="prazo_analise_complementar"
                  value={configuracoes.prazo_analise_complementar}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo Resposta Empresa (dias)
                </label>
                <input
                  type="number"
                  name="prazo_resposta_empresa"
                  value={configuracoes.prazo_resposta_empresa}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo Recurso (dias)
                </label>
                <input
                  type="number"
                  name="prazo_recurso"
                  value={configuracoes.prazo_recurso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </div>

          {/* Numeração */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Numeração de Processos
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="numeracao_automatica"
                  checked={configuracoes.numeracao_automatica}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Numeração automática de processos
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prefixo do Processo
                </label>
                <input
                  type="text"
                  name="prefixo_processo"
                  value={configuracoes.prefixo_processo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="PROC"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ano Atual
                </label>
                <input
                  type="number"
                  name="ano_atual"
                  value={configuracoes.ano_atual}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="2020"
                  max="2030"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sequencial Inicial
                </label>
                <input
                  type="number"
                  name="sequencial_inicial"
                  value={configuracoes.sequencial_inicial}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurações de Notificação
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alerta Prazo Vencendo (dias antes)
                </label>
                <input
                  type="number"
                  name="alerta_prazo_vencendo"
                  value={configuracoes.alerta_prazo_vencendo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alerta Prazo Vencido (dias após)
                </label>
                <input
                  type="number"
                  name="alerta_prazo_vencido"
                  value={configuracoes.alerta_prazo_vencido}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  max="30"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notificar_analista"
                    checked={configuracoes.notificar_analista}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Notificar analista responsável
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notificar_coordenador"
                    checked={configuracoes.notificar_coordenador}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Notificar coordenador
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notificar_email"
                    checked={configuracoes.notificar_email}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Notificar por email
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notificar_sistema"
                    checked={configuracoes.notificar_sistema}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Notificar no sistema
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <ScaleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurações de Documentos
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Parecer Padrão
                </label>
                <textarea
                  name="template_parecer_padrao"
                  value={configuracoes.template_parecer_padrao}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Template padrão para pareceres jurídicos..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Resposta Padrão
                </label>
                <textarea
                  name="template_resposta_padrao"
                  value={configuracoes.template_resposta_padrao}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Template padrão para respostas..."
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="assinatura_digital_obrigatoria"
                    checked={configuracoes.assinatura_digital_obrigatoria}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Assinatura digital obrigatória
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="revisao_obrigatoria"
                    checked={configuracoes.revisao_obrigatoria}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Revisão obrigatória antes da publicação
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <UserGroupIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurações de Acesso
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Criar Processo
                </label>
                <select
                  multiple
                  value={configuracoes.permissao_criar_processo}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleMultiSelectChange('permissao_criar_processo', values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="analista">Analista</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editar Processo
                </label>
                <select
                  multiple
                  value={configuracoes.permissao_editar_processo}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleMultiSelectChange('permissao_editar_processo', values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="analista">Analista</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excluir Processo
                </label>
                <select
                  multiple
                  value={configuracoes.permissao_excluir_processo}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    handleMultiSelectChange('permissao_excluir_processo', values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Relatórios */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <CogIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configurações de Relatórios
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="relatorio_automatico"
                  checked={configuracoes.relatorio_automatico}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Gerar relatórios automaticamente
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequência do Relatório
                </label>
                <select
                  name="frequencia_relatorio"
                  value={configuracoes.frequencia_relatorio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="incluir_estatisticas"
                    checked={configuracoes.incluir_estatisticas}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Incluir estatísticas detalhadas
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="incluir_graficos"
                    checked={configuracoes.incluir_graficos}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Incluir gráficos e visualizações
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesJuridicas;
