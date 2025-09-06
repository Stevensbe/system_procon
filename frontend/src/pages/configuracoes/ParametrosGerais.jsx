import React, { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon,
  CogIcon, UserGroupIcon, BuildingOfficeIcon, DocumentTextIcon, BellIcon,
  ClockIcon, CalendarIcon, CurrencyDollarIcon, GlobeAltIcon, ShieldCheckIcon,
  EyeIcon, EyeSlashIcon, DocumentTextIcon as DocumentIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';

const ParametrosGerais = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});

  const [formData, setFormData] = useState({
    // Parâmetros de Negócio
    nomeOrgao: 'PROCON - Fundação de Proteção e Defesa do Consumidor',
    siglaOrgao: 'PROCON',
    cnpjOrgao: '12.345.678/0001-90',
    enderecoOrgao: 'Rua das Palmeiras, 123 - Centro',
    cidadeOrgao: 'São Paulo',
    estadoOrgao: 'SP',
    cepOrgao: '01234-567',
    telefoneOrgao: '(11) 3333-4444',
    emailOrgao: 'contato@procon.gov.br',
    websiteOrgao: 'https://www.procon.gov.br',
    
    // Parâmetros de Interface
    temaPadrao: 'claro',
    idiomaPadrao: 'pt-BR',
    timezonePadrao: 'America/Sao_Paulo',
    formatoData: 'dd/MM/yyyy',
    formatoHora: 'HH:mm',
    formatoMoeda: 'R$ #,##0.00',
    formatoDecimal: ',',
    formatoMilhares: '.',
    paginacaoPadrao: 20,
    ordenacaoPadrao: 'asc',
    
    // Parâmetros de Comportamento
    sessaoTimeout: 30,
    maxTentativasLogin: 5,
    bloqueioTemporario: 15,
    complexidadeSenha: 'alta',
    tamanhoMinimoSenha: 8,
    expiracaoSenha: 90,
    historicoSenhas: 5,
    autenticacao2fa: true,
    captchaLogin: false,
    
    // Parâmetros de Notificação
    notificacoesEmail: true,
    notificacoesPush: true,
    notificacoesSMS: false,
    emailRemetente: 'noreply@procon.gov.br',
    nomeRemetente: 'Sistema PROCON',
    templateEmail: 'padrao',
    assinaturaEmail: 'Atenciosamente,\nEquipe PROCON',
    
    // Parâmetros de Documentos
    formatoDocumento: 'PDF',
    qualidadeDocumento: 'alta',
    marcaDagua: true,
    textoMarcaDagua: 'PROCON - Documento Oficial',
    assinaturaDigital: false,
    certificadoDigital: '',
    validadeDocumento: 365,
    
    // Parâmetros de Backup
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    horaBackup: '02:00',
    retencaoBackup: 30,
    backupRemoto: true,
    servidorBackup: 'backup.procon.gov.br',
    usuarioBackup: 'backup_user',
    senhaBackup: '********',
    
    // Parâmetros de Log
    logAtivo: true,
    nivelLog: 'info',
    rotacaoLog: 'diaria',
    retencaoLog: 90,
    logRemoto: false,
    servidorLog: '',
    usuarioLog: '',
    senhaLog: '',
    
    // Parâmetros de Segurança
    firewall: true,
    antivirus: true,
    criptografia: true,
    algoritmoCriptografia: 'AES-256',
    certificadoSSL: true,
    validadeCertificado: '2025-12-31',
    renovacaoAutomatica: true,
    
    // Parâmetros de Performance
    cacheAtivo: true,
    tamanhoCache: 512,
    tempoCache: 3600,
    compressao: true,
    nivelCompressao: 'media',
    maxConexoes: 1000,
    timeoutConexao: 30,
    
    // Parâmetros de Integração
    apiAtiva: true,
    chaveAPI: 'procon_api_key_2024',
    limiteRequisicoes: 1000,
    periodoRequisicoes: 3600,
    webhookAtivo: false,
    urlWebhook: '',
    secretWebhook: '',
    
    // Parâmetros de Manutenção
    modoManutencao: false,
    mensagemManutencao: 'Sistema em manutenção. Tente novamente em breve.',
    horarioManutencao: '02:00-04:00',
    notificarManutencao: true,
    manutencaoAgendada: false,
    dataManutencao: '',
    duracaoManutencao: 120
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    setLoading(true);
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Os dados já estão no estado inicial
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error);
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

    if (!formData.nomeOrgao.trim()) {
      newErrors.nomeOrgao = 'Nome do órgão é obrigatório';
    }

    if (!formData.siglaOrgao.trim()) {
      newErrors.siglaOrgao = 'Sigla do órgão é obrigatória';
    }

    if (!formData.cnpjOrgao.trim()) {
      newErrors.cnpjOrgao = 'CNPJ é obrigatório';
    }

    if (!formData.emailOrgao.includes('@')) {
      newErrors.emailOrgao = 'Email inválido';
    }

    if (formData.sessaoTimeout < 5 || formData.sessaoTimeout > 480) {
      newErrors.sessaoTimeout = 'Timeout de sessão deve estar entre 5 e 480 minutos';
    }

    if (formData.maxTentativasLogin < 1 || formData.maxTentativasLogin > 10) {
      newErrors.maxTentativasLogin = 'Máximo de tentativas deve estar entre 1 e 10';
    }

    if (formData.tamanhoMinimoSenha < 6 || formData.tamanhoMinimoSenha > 20) {
      newErrors.tamanhoMinimoSenha = 'Tamanho mínimo da senha deve estar entre 6 e 20 caracteres';
    }

    if (formData.paginacaoPadrao < 5 || formData.paginacaoPadrao > 100) {
      newErrors.paginacaoPadrao = 'Paginação deve estar entre 5 e 100 itens';
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
      
      alert('Parâmetros salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      alert('Erro ao salvar parâmetros. Tente novamente.');
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

  const handleResetDefaults = () => {
    if (confirm('Tem certeza que deseja restaurar os parâmetros padrão? Esta ação não pode ser desfeita.')) {
      // Resetar para valores padrão
      setFormData({
        ...formData,
        temaPadrao: 'claro',
        idiomaPadrao: 'pt-BR',
        timezonePadrao: 'America/Sao_Paulo',
        formatoData: 'dd/MM/yyyy',
        formatoHora: 'HH:mm',
        paginacaoPadrao: 20,
        ordenacaoPadrao: 'asc',
        sessaoTimeout: 30,
        maxTentativasLogin: 5,
        bloqueioTemporario: 15,
        complexidadeSenha: 'alta',
        tamanhoMinimoSenha: 8,
        expiracaoSenha: 90,
        historicoSenhas: 5,
        autenticacao2fa: true,
        captchaLogin: false
      });
      alert('Parâmetros restaurados para os valores padrão!');
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
              Parâmetros Gerais
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure os parâmetros gerais do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Restaurar Padrões
          </button>
          <button
            onClick={() => handleTestConnection('parametros')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Testar Configuração
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Parâmetros de Negócio */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 mr-2" />
              Parâmetros de Negócio
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Órgão
                </label>
                <input
                  type="text"
                  value={formData.nomeOrgao}
                  onChange={(e) => handleInputChange('nomeOrgao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.nomeOrgao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nomeOrgao && (
                  <p className="mt-1 text-sm text-red-600">{errors.nomeOrgao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sigla do Órgão
                </label>
                <input
                  type="text"
                  value={formData.siglaOrgao}
                  onChange={(e) => handleInputChange('siglaOrgao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.siglaOrgao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.siglaOrgao && (
                  <p className="mt-1 text-sm text-red-600">{errors.siglaOrgao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpjOrgao}
                  onChange={(e) => handleInputChange('cnpjOrgao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.cnpjOrgao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cnpjOrgao && (
                  <p className="mt-1 text-sm text-red-600">{errors.cnpjOrgao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.emailOrgao}
                  onChange={(e) => handleInputChange('emailOrgao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.emailOrgao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.emailOrgao && (
                  <p className="mt-1 text-sm text-red-600">{errors.emailOrgao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefoneOrgao}
                  onChange={(e) => handleInputChange('telefoneOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.websiteOrgao}
                  onChange={(e) => handleInputChange('websiteOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.enderecoOrgao}
                  onChange={(e) => handleInputChange('enderecoOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.cidadeOrgao}
                  onChange={(e) => handleInputChange('cidadeOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estadoOrgao}
                  onChange={(e) => handleInputChange('estadoOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.cepOrgao}
                  onChange={(e) => handleInputChange('cepOrgao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Parâmetros de Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Parâmetros de Interface
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tema Padrão
                </label>
                <select
                  value={formData.temaPadrao}
                  onChange={(e) => handleInputChange('temaPadrao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="claro">Claro</option>
                  <option value="escuro">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idioma Padrão
                </label>
                <select
                  value={formData.idiomaPadrao}
                  onChange={(e) => handleInputChange('idiomaPadrao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fuso Horário Padrão
                </label>
                <select
                  value={formData.timezonePadrao}
                  onChange={(e) => handleInputChange('timezonePadrao', e.target.value)}
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
                  Formato de Data
                </label>
                <select
                  value={formData.formatoData}
                  onChange={(e) => handleInputChange('formatoData', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                  <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                  <option value="dd-MM-yyyy">dd-MM-yyyy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Hora
                </label>
                <select
                  value={formData.formatoHora}
                  onChange={(e) => handleInputChange('formatoHora', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="HH:mm">24 horas (HH:mm)</option>
                  <option value="hh:mm a">12 horas (hh:mm AM/PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Moeda
                </label>
                <select
                  value={formData.formatoMoeda}
                  onChange={(e) => handleInputChange('formatoMoeda', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="R$ #,##0.00">R$ #,##0.00</option>
                  <option value="$#,##0.00">$#,##0.00</option>
                  <option value="€#,##0.00">€#,##0.00</option>
                  <option value="#,##0.00 R$">#,##0.00 R$</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paginação Padrão
                </label>
                <input
                  type="number"
                  value={formData.paginacaoPadrao}
                  onChange={(e) => handleInputChange('paginacaoPadrao', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.paginacaoPadrao ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.paginacaoPadrao && (
                  <p className="mt-1 text-sm text-red-600">{errors.paginacaoPadrao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenação Padrão
                </label>
                <select
                  value={formData.ordenacaoPadrao}
                  onChange={(e) => handleInputChange('ordenacaoPadrao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="asc">Crescente (A-Z)</option>
                  <option value="desc">Decrescente (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Parâmetros de Comportamento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Parâmetros de Comportamento
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamanho Mínimo da Senha
                </label>
                <input
                  type="number"
                  value={formData.tamanhoMinimoSenha}
                  onChange={(e) => handleInputChange('tamanhoMinimoSenha', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.tamanhoMinimoSenha ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tamanhoMinimoSenha && (
                  <p className="mt-1 text-sm text-red-600">{errors.tamanhoMinimoSenha}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiração da Senha (dias)
                </label>
                <input
                  type="number"
                  value={formData.expiracaoSenha}
                  onChange={(e) => handleInputChange('expiracaoSenha', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Histórico de Senhas
                </label>
                <input
                  type="number"
                  value={formData.historicoSenhas}
                  onChange={(e) => handleInputChange('historicoSenhas', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
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
                  checked={formData.captchaLogin}
                  onChange={(e) => handleInputChange('captchaLogin', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar CAPTCHA no Login
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Parâmetros de Notificação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BellIcon className="w-5 h-5 mr-2" />
              Parâmetros de Notificação
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Remetente
                </label>
                <input
                  type="email"
                  value={formData.emailRemetente}
                  onChange={(e) => handleInputChange('emailRemetente', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Remetente
                </label>
                <input
                  type="text"
                  value={formData.nomeRemetente}
                  onChange={(e) => handleInputChange('nomeRemetente', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template de Email
                </label>
                <select
                  value={formData.templateEmail}
                  onChange={(e) => handleInputChange('templateEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="padrao">Padrão</option>
                  <option value="moderno">Moderno</option>
                  <option value="simples">Simples</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assinatura do Email
              </label>
              <textarea
                value={formData.assinaturaEmail}
                onChange={(e) => handleInputChange('assinaturaEmail', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificacoesEmail}
                  onChange={(e) => handleInputChange('notificacoesEmail', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Notificações por Email
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificacoesPush}
                  onChange={(e) => handleInputChange('notificacoesPush', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Notificações Push
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificacoesSMS}
                  onChange={(e) => handleInputChange('notificacoesSMS', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Habilitar Notificações por SMS
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
            {saving ? 'Salvando...' : 'Salvar Parâmetros'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParametrosGerais;
