import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ArrowDownTrayIcon, ClockIcon, CalendarIcon, DocumentTextIcon, ServerIcon,
  WrenchScrewdriverIcon, EyeIcon, EyeSlashIcon, PlayIcon, PauseIcon,
  ArrowPathIcon, TrashIcon, DocumentArrowDownIcon, CloudIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

const BackupRestauracao = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  const [formData, setFormData] = useState({
    // Configurações de Backup Automático
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    horaBackup: '02:00',
    diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    diaMes: 1,
    retencaoBackup: 30,
    compressaoBackup: true,
    criptografiaBackup: true,
    
    // Configurações de Backup Remoto
    backupRemoto: true,
    servidorBackup: 'backup.procon.gov.br',
    portaBackup: 22,
    protocoloBackup: 'SFTP',
    usuarioBackup: 'backup_user',
    senhaBackup: '********',
    caminhoBackup: '/backups/procon',
    limiteEspaco: 100,
    
    // Configurações de Backup Manual
    incluirBanco: true,
    incluirArquivos: true,
    incluirConfiguracoes: true,
    incluirLogs: false,
    tamanhoMaximo: 2048,
    nomeBackup: 'backup_manual',
    
    // Configurações de Restauração
    validacaoRestauracao: true,
    backupRestauracao: true,
    confirmacaoRestauracao: true,
    modoRestauracao: 'completo',
    selecionarTabelas: false,
    tabelasSelecionadas: []
  });

  const [backups, setBackups] = useState([
    {
      id: 1,
      nome: 'backup_2024_01_15_020000',
      tipo: 'automatico',
      tamanho: '1.2 GB',
      dataCriacao: '2024-01-15T02:00:00',
      status: 'concluido',
      integridade: 'verificada',
      localizacao: 'remoto',
      duracao: '15 min'
    },
    {
      id: 2,
      nome: 'backup_2024_01_14_020000',
      tipo: 'automatico',
      tamanho: '1.1 GB',
      dataCriacao: '2024-01-14T02:00:00',
      status: 'concluido',
      integridade: 'verificada',
      localizacao: 'remoto',
      duracao: '14 min'
    },
    {
      id: 3,
      nome: 'backup_manual_2024_01_13_143000',
      tipo: 'manual',
      tamanho: '1.3 GB',
      dataCriacao: '2024-01-13T14:30:00',
      status: 'concluido',
      integridade: 'verificada',
      localizacao: 'local',
      duracao: '18 min'
    },
    {
      id: 4,
      nome: 'backup_2024_01_12_020000',
      tipo: 'automatico',
      tamanho: '1.0 GB',
      dataCriacao: '2024-01-12T02:00:00',
      status: 'erro',
      integridade: 'falhou',
      localizacao: 'remoto',
      duracao: '0 min'
    }
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadBackupConfig();
  }, []);

  const loadBackupConfig = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Os dados já estão no estado inicial
    } catch (error) {
      console.error('Erro ao carregar configurações de backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.backupRemoto && !formData.servidorBackup.trim()) {
      newErrors.servidorBackup = 'Servidor de backup é obrigatório';
    }

    if (formData.backupRemoto && !formData.usuarioBackup.trim()) {
      newErrors.usuarioBackup = 'Usuário de backup é obrigatório';
    }

    if (formData.backupRemoto && !formData.senhaBackup.trim()) {
      newErrors.senhaBackup = 'Senha de backup é obrigatória';
    }

    if (formData.portaBackup < 1 || formData.portaBackup > 65535) {
      newErrors.portaBackup = 'Porta deve estar entre 1 e 65535';
    }

    if (formData.retencaoBackup < 1 || formData.retencaoBackup > 365) {
      newErrors.retencaoBackup = 'Retenção deve estar entre 1 e 365 dias';
    }

    if (formData.limiteEspaco < 1 || formData.limiteEspaco > 1000) {
      newErrors.limiteEspaco = 'Limite de espaço deve estar entre 1 e 1000 GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Configurações de backup salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTestConnection = async () => {
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Teste de conexão realizado com sucesso!');
    } catch (error) {
      alert('Erro no teste de conexão. Verifique as configurações.');
    }
  };

  const handleBackupManual = async () => {
    if (!formData.nomeBackup.trim()) {
      alert('Nome do backup é obrigatório');
      return;
    }

    setBackupInProgress(true);
    try {
      // Simular backup manual
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Adicionar novo backup à lista
      const novoBackup = {
        id: Date.now(),
        nome: formData.nomeBackup,
        tipo: 'manual',
        tamanho: '1.2 GB',
        dataCriacao: new Date().toISOString(),
        status: 'concluido',
        integridade: 'verificada',
        localizacao: formData.backupRemoto ? 'remoto' : 'local',
        duracao: '15 min'
      };
      
      setBackups(prev => [novoBackup, ...prev]);
      alert('Backup manual realizado com sucesso!');
    } catch (error) {
      alert('Erro ao realizar backup manual. Tente novamente.');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup "${backup.nome}"? Esta ação irá sobrescrever os dados atuais.`)) {
      return;
    }

    setRestoreInProgress(true);
    try {
      // Simular restauração
      await new Promise(resolve => setTimeout(resolve, 8000));
      alert('Restauração realizada com sucesso!');
    } catch (error) {
      alert('Erro ao realizar restauração. Tente novamente.');
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDeleteBackup = async (backup) => {
    if (!confirm(`Tem certeza que deseja excluir o backup "${backup.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBackups(prev => prev.filter(b => b.id !== backup.id));
      alert('Backup excluído com sucesso!');
    } catch (error) {
      alert('Erro ao excluir backup. Tente novamente.');
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      // Simular download
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Download do backup "${backup.nome}" iniciado!`);
    } catch (error) {
      alert('Erro ao fazer download do backup. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluido': return 'text-green-600';
      case 'em_andamento': return 'text-blue-600';
      case 'erro': return 'text-red-600';
      case 'pendente': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'em_andamento': return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'erro': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'pendente': return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getIntegridadeColor = (integridade) => {
    switch (integridade) {
      case 'verificada': return 'text-green-600';
      case 'falhou': return 'text-red-600';
      case 'pendente': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/configuracoes/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Backup e Restauração
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie backups e restaurações do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Testar Conexão
          </button>
          <button
            onClick={handleBackupManual}
            disabled={backupInProgress}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {backupInProgress ? 'Backup em Andamento...' : 'Backup Manual'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Configurações de Backup Automático */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Configurações de Backup Automático
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequência de Backup
                </label>
                <select
                  value={formData.frequenciaBackup}
                  onChange={(e) => handleInputChange('frequenciaBackup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora do Backup
                </label>
                <input
                  type="time"
                  value={formData.horaBackup}
                  onChange={(e) => handleInputChange('horaBackup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retenção (dias)
                </label>
                <input
                  type="number"
                  value={formData.retencaoBackup}
                  onChange={(e) => handleInputChange('retencaoBackup', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.retencaoBackup ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.retencaoBackup && (
                  <p className="mt-1 text-sm text-red-600">{errors.retencaoBackup}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limite de Espaço (GB)
                </label>
                <input
                  type="number"
                  value={formData.limiteEspaco}
                  onChange={(e) => handleInputChange('limiteEspaco', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.limiteEspaco ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.limiteEspaco && (
                  <p className="mt-1 text-sm text-red-600">{errors.limiteEspaco}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.backupAutomatico}
                  onChange={(e) => handleInputChange('backupAutomatico', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Backup Automático
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.compressaoBackup}
                  onChange={(e) => handleInputChange('compressaoBackup', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Comprimir Backup
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.criptografiaBackup}
                  onChange={(e) => handleInputChange('criptografiaBackup', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Criptografar Backup
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Backup Remoto */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ServerIcon className="w-5 h-5 mr-2" />
              Configurações de Backup Remoto
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servidor de Backup
                </label>
                <input
                  type="text"
                  value={formData.servidorBackup}
                  onChange={(e) => handleInputChange('servidorBackup', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.servidorBackup ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.servidorBackup && (
                  <p className="mt-1 text-sm text-red-600">{errors.servidorBackup}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Porta
                </label>
                <input
                  type="number"
                  value={formData.portaBackup}
                  onChange={(e) => handleInputChange('portaBackup', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.portaBackup ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.portaBackup && (
                  <p className="mt-1 text-sm text-red-600">{errors.portaBackup}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protocolo
                </label>
                <select
                  value={formData.protocoloBackup}
                  onChange={(e) => handleInputChange('protocoloBackup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="SFTP">SFTP</option>
                  <option value="FTP">FTP</option>
                  <option value="SCP">SCP</option>
                  <option value="S3">Amazon S3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={formData.usuarioBackup}
                  onChange={(e) => handleInputChange('usuarioBackup', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.usuarioBackup ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.usuarioBackup && (
                  <p className="mt-1 text-sm text-red-600">{errors.usuarioBackup}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.senhaBackup ? 'text' : 'password'}
                    value={formData.senhaBackup}
                    onChange={(e) => handleInputChange('senhaBackup', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.senhaBackup ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('senhaBackup')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.senhaBackup ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.senhaBackup && (
                  <p className="mt-1 text-sm text-red-600">{errors.senhaBackup}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caminho no Servidor
                </label>
                <input
                  type="text"
                  value={formData.caminhoBackup}
                  onChange={(e) => handleInputChange('caminhoBackup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.backupRemoto}
                  onChange={(e) => handleInputChange('backupRemoto', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Backup Remoto
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Backup Manual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
              Configurações de Backup Manual
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Backup
                </label>
                <input
                  type="text"
                  value={formData.nomeBackup}
                  onChange={(e) => handleInputChange('nomeBackup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamanho Máximo (MB)
                </label>
                <input
                  type="number"
                  value={formData.tamanhoMaximo}
                  onChange={(e) => handleInputChange('tamanhoMaximo', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.incluirBanco}
                  onChange={(e) => handleInputChange('incluirBanco', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Incluir Banco de Dados
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.incluirArquivos}
                  onChange={(e) => handleInputChange('incluirArquivos', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Incluir Arquivos
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.incluirConfiguracoes}
                  onChange={(e) => handleInputChange('incluirConfiguracoes', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Incluir Configurações
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.incluirLogs}
                  onChange={(e) => handleInputChange('incluirLogs', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Incluir Logs
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Backups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Lista de Backups
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Integridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {backup.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.tipo === 'automatico' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {backup.tipo === 'automatico' ? 'Automático' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {backup.tamanho}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(backup.dataCriacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(backup.status)}
                          <span className={`ml-2 text-sm ${getStatusColor(backup.status)}`}>
                            {backup.status === 'concluido' ? 'Concluído' : 
                             backup.status === 'em_andamento' ? 'Em Andamento' :
                             backup.status === 'erro' ? 'Erro' : 'Pendente'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${getIntegridadeColor(backup.integridade)}`}>
                          {backup.integridade === 'verificada' ? 'Verificada' :
                           backup.integridade === 'falhou' ? 'Falhou' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.localizacao === 'remoto' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {backup.localizacao === 'remoto' ? 'Remoto' : 'Local'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(backup)}
                          disabled={restoreInProgress || backup.status === 'erro'}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Restaurar"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/configuracoes/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BackupRestauracao;
