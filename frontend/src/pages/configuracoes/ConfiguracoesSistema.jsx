import React, { useState, useEffect } from 'react';
import {
  CogIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ComputerDesktopIcon, GlobeAltIcon, ShieldCheckIcon, CpuChipIcon,
  ServerIcon, WifiIcon, LockClosedIcon, EyeIcon, EyeSlashIcon,
  DocumentTextIcon, BellIcon, ClockIcon, CalendarIcon, WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

const ConfiguracoesSistema = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});

  const [formData, setFormData] = useState({
    // Informações Gerais
    nomeSistema: 'Sistema PROCON',
    versao: '2.1.0',
    ambiente: 'produção',
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR',
    moeda: 'BRL',
    
    // Configurações de Rede
    hostname: 'procon-server-01',
    porta: 8000,
    ssl: true,
    dominio: 'procon.gov.br',
    ipServidor: '192.168.1.100',
    gateway: '192.168.1.1',
    dns: ['8.8.8.8', '8.8.4.4'],
    
    // Configurações de Segurança
    sessaoTimeout: 30,
    maxTentativasLogin: 5,
    bloqueioTemporario: 15,
    complexidadeSenha: 'alta',
    autenticacao2fa: true,
    firewall: true,
    antivirus: true,
    
    // Configurações de Performance
    maxConexoes: 1000,
    timeoutConexao: 30,
    cacheAtivo: true,
    tamanhoCache: 512,
    compressao: true,
    logLevel: 'info',
    
    // Configurações de Notificação
    emailNotificacoes: true,
    emailAdmin: 'admin@procon.gov.br',
    smtpServidor: 'smtp.procon.gov.br',
    smtpPorta: 587,
    smtpUsuario: 'notificacoes@procon.gov.br',
    smtpSenha: '********',
    smtpSeguro: true,
    
    // Configurações de Backup
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    horaBackup: '02:00',
    retencaoBackup: 30,
    backupRemoto: true,
    servidorBackup: 'backup.procon.gov.br',
    
    // Configurações de Log
    logAtivo: true,
    nivelLog: 'info',
    rotacaoLog: 'diaria',
    retencaoLog: 90,
    logRemoto: false,
    servidorLog: '',
    
    // Configurações de Manutenção
    modoManutencao: false,
    mensagemManutencao: 'Sistema em manutenção. Tente novamente em breve.',
    horarioManutencao: '02:00-04:00',
    notificarManutencao: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Os dados já estão no estado inicial
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
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

    if (!formData.nomeSistema.trim()) {
      newErrors.nomeSistema = 'Nome do sistema é obrigatório';
    }

    if (!formData.hostname.trim()) {
      newErrors.hostname = 'Hostname é obrigatório';
    }

    if (formData.porta < 1 || formData.porta > 65535) {
      newErrors.porta = 'Porta deve estar entre 1 e 65535';
    }

    if (formData.sessaoTimeout < 5 || formData.sessaoTimeout > 480) {
      newErrors.sessaoTimeout = 'Timeout de sessão deve estar entre 5 e 480 minutos';
    }

    if (formData.maxTentativasLogin < 1 || formData.maxTentativasLogin > 10) {
      newErrors.maxTentativasLogin = 'Máximo de tentativas deve estar entre 1 e 10';
    }

    if (formData.emailNotificacoes && !formData.emailAdmin.includes('@')) {
      newErrors.emailAdmin = 'Email administrativo inválido';
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
      
      alert('Configurações salvas com sucesso!');
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

  const handleTestConnection = async (type) => {
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Teste de ${type} realizado com sucesso!`);
    } catch (error) {
      alert(`Erro no teste de ${type}. Verifique as configurações.`);
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
              Configurações do Sistema
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie as configurações gerais do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleTestConnection('sistema')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Testar Sistema
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Gerais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ComputerDesktopIcon className="w-5 h-5 mr-2" />
              Informações Gerais
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Sistema
                </label>
                <input
                  type="text"
                  value={formData.nomeSistema}
                  onChange={(e) => handleInputChange('nomeSistema', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.nomeSistema ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nomeSistema && (
                  <p className="mt-1 text-sm text-red-600">{errors.nomeSistema}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Versão
                </label>
                <input
                  type="text"
                  value={formData.versao}
                  onChange={(e) => handleInputChange('versao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ambiente
                </label>
                <select
                  value={formData.ambiente}
                  onChange={(e) => handleInputChange('ambiente', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="desenvolvimento">Desenvolvimento</option>
                  <option value="homologacao">Homologação</option>
                  <option value="producao">Produção</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fuso Horário
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                  <option value="America/Manaus">America/Manaus</option>
                  <option value="America/Belem">America/Belem</option>
                  <option value="America/Fortaleza">America/Fortaleza</option>
                  <option value="America/Recife">America/Recife</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idioma
                </label>
                <select
                  value={formData.idioma}
                  onChange={(e) => handleInputChange('idioma', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moeda
                </label>
                <select
                  value={formData.moeda}
                  onChange={(e) => handleInputChange('moeda', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Rede */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              Configurações de Rede
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hostname
                </label>
                <input
                  type="text"
                  value={formData.hostname}
                  onChange={(e) => handleInputChange('hostname', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.hostname ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hostname && (
                  <p className="mt-1 text-sm text-red-600">{errors.hostname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Porta
                </label>
                <input
                  type="number"
                  value={formData.porta}
                  onChange={(e) => handleInputChange('porta', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.porta ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.porta && (
                  <p className="mt-1 text-sm text-red-600">{errors.porta}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domínio
                </label>
                <input
                  type="text"
                  value={formData.dominio}
                  onChange={(e) => handleInputChange('dominio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IP do Servidor
                </label>
                <input
                  type="text"
                  value={formData.ipServidor}
                  onChange={(e) => handleInputChange('ipServidor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gateway
                </label>
                <input
                  type="text"
                  value={formData.gateway}
                  onChange={(e) => handleInputChange('gateway', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DNS Primário
                </label>
                <input
                  type="text"
                  value={formData.dns[0]}
                  onChange={(e) => handleInputChange('dns', [e.target.value, formData.dns[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ssl}
                  onChange={(e) => handleInputChange('ssl', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar SSL/HTTPS
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Segurança */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Configurações de Segurança
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeout de Sessão (minutos)
                </label>
                <input
                  type="number"
                  value={formData.sessaoTimeout}
                  onChange={(e) => handleInputChange('sessaoTimeout', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.sessaoTimeout ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.sessaoTimeout && (
                  <p className="mt-1 text-sm text-red-600">{errors.sessaoTimeout}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de Tentativas de Login
                </label>
                <input
                  type="number"
                  value={formData.maxTentativasLogin}
                  onChange={(e) => handleInputChange('maxTentativasLogin', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.maxTentativasLogin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxTentativasLogin && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxTentativasLogin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bloqueio Temporário (minutos)
                </label>
                <input
                  type="number"
                  value={formData.bloqueioTemporario}
                  onChange={(e) => handleInputChange('bloqueioTemporario', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complexidade de Senha
                </label>
                <select
                  value={formData.complexidadeSenha}
                  onChange={(e) => handleInputChange('complexidadeSenha', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="muito_alta">Muito Alta</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.autenticacao2fa}
                  onChange={(e) => handleInputChange('autenticacao2fa', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Autenticação de Dois Fatores (2FA)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.firewall}
                  onChange={(e) => handleInputChange('firewall', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Firewall
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.antivirus}
                  onChange={(e) => handleInputChange('antivirus', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Antivírus
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CpuChipIcon className="w-5 h-5 mr-2" />
              Configurações de Performance
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de Conexões
                </label>
                <input
                  type="number"
                  value={formData.maxConexoes}
                  onChange={(e) => handleInputChange('maxConexoes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeout de Conexão (segundos)
                </label>
                <input
                  type="number"
                  value={formData.timeoutConexao}
                  onChange={(e) => handleInputChange('timeoutConexao', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamanho do Cache (MB)
                </label>
                <input
                  type="number"
                  value={formData.tamanhoCache}
                  onChange={(e) => handleInputChange('tamanhoCache', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nível de Log
                </label>
                <select
                  value={formData.logLevel}
                  onChange={(e) => handleInputChange('logLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.cacheAtivo}
                  onChange={(e) => handleInputChange('cacheAtivo', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Cache
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.compressao}
                  onChange={(e) => handleInputChange('compressao', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Compressão
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configurações de Notificação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BellIcon className="w-5 h-5 mr-2" />
              Configurações de Notificação
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Administrativo
                </label>
                <input
                  type="email"
                  value={formData.emailAdmin}
                  onChange={(e) => handleInputChange('emailAdmin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.emailAdmin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.emailAdmin && (
                  <p className="mt-1 text-sm text-red-600">{errors.emailAdmin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={formData.smtpServidor}
                  onChange={(e) => handleInputChange('smtpServidor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Porta SMTP
                </label>
                <input
                  type="number"
                  value={formData.smtpPorta}
                  onChange={(e) => handleInputChange('smtpPorta', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuário SMTP
                </label>
                <input
                  type="text"
                  value={formData.smtpUsuario}
                  onChange={(e) => handleInputChange('smtpUsuario', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha SMTP
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.smtpSenha ? 'text' : 'password'}
                    value={formData.smtpSenha}
                    onChange={(e) => handleInputChange('smtpSenha', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('smtpSenha')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.smtpSenha ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.emailNotificacoes}
                  onChange={(e) => handleInputChange('emailNotificacoes', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Notificações por Email
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.smtpSeguro}
                  onChange={(e) => handleInputChange('smtpSeguro', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Usar Conexão Segura (TLS/SSL)
                </span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleTestConnection('email')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Testar Email
              </button>
            </div>
          </div>
        </div>

        {/* Configurações de Manutenção */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <WrenchScrewdriverIcon className="w-5 h-5 mr-2" />
              Configurações de Manutenção
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horário de Manutenção
                </label>
                <input
                  type="text"
                  value={formData.horarioManutencao}
                  onChange={(e) => handleInputChange('horarioManutencao', e.target.value)}
                  placeholder="Ex: 02:00-04:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensagem de Manutenção
                </label>
                <textarea
                  value={formData.mensagemManutencao}
                  onChange={(e) => handleInputChange('mensagemManutencao', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.modoManutencao}
                  onChange={(e) => handleInputChange('modoManutencao', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Ativar Modo de Manutenção
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificarManutencao}
                  onChange={(e) => handleInputChange('notificarManutencao', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Notificar Usuários sobre Manutenção
                </span>
              </label>
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

export default ConfiguracoesSistema;
