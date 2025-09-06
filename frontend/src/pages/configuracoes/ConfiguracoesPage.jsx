import React, { useState, useEffect } from 'react';
import { 
  CogIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  BellIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import AIAssistantPanel from '../../components/ai/AIAssistantPanel';

const ConfiguracoesPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [config, setConfig] = useState({
    geral: {
      nomeSistema: 'Sistema PROCON - Amazonas',
      versao: '1.0.0',
      timezone: 'America/Manaus',
      idioma: 'pt-BR',
      modoManutencao: false
    },
    email: {
      servidorSMTP: 'smtp.procon.am.gov.br',
      porta: 587,
      usuario: 'sistema@procon.am.gov.br',
      senha: '',
      usarSSL: true,
      emailRemetente: 'Sistema PROCON <sistema@procon.am.gov.br>'
    },
    backup: {
      ativo: true,
      frequencia: 'DIARIO',
      horaBackup: '02:00',
      retencaoDias: 30,
      destino: 'AWS_S3',
      bucketName: 'procon-backups'
    },
    seguranca: {
      tempoSessao: 480,
      tentativasLogin: 3,
      bloqueioTemporario: 15,
      forcarSenhaForte: true,
      expiracaoSenha: 90,
      historicoSenhas: 5
    },
    notificacoes: {
      emailAtivo: true,
      notificacoesSistema: true,
      alertasCriticos: true,
      relatoriosAutomaticos: true,
      horarioEnvio: '08:00'
    }
  });

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Configurações carregadas');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Configurações salvas:', config);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações!');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'geral', name: 'Geral', icon: CogIcon },
    { id: 'email', name: 'E-mail', icon: EnvelopeIcon },
    { id: 'backup', name: 'Backup', icon: CloudArrowUpIcon },
    { id: 'seguranca', name: 'Segurança', icon: ShieldCheckIcon },
    { id: 'notificacoes', name: 'Notificações', icon: BellIcon },
    { id: 'ia', name: 'Inteligência Artificial', icon: CpuChipIcon }
  ];

  const renderGeralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Sistema
          </label>
          <input
            type="text"
            value={config.geral.nomeSistema}
            onChange={(e) => handleInputChange('geral', 'nomeSistema', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão
          </label>
          <input
            type="text"
            value={config.geral.versao}
            onChange={(e) => handleInputChange('geral', 'versao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fuso Horário
          </label>
          <select
            value={config.geral.timezone}
            onChange={(e) => handleInputChange('geral', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="America/Manaus">America/Manaus</option>
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Idioma
          </label>
          <select
            value={config.geral.idioma}
            onChange={(e) => handleInputChange('geral', 'idioma', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="modoManutencao"
          checked={config.geral.modoManutencao}
          onChange={(e) => handleInputChange('geral', 'modoManutencao', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="modoManutencao" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Modo de Manutenção
        </label>
      </div>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Servidor SMTP
          </label>
          <input
            type="text"
            value={config.email.servidorSMTP}
            onChange={(e) => handleInputChange('email', 'servidorSMTP', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Porta
          </label>
          <input
            type="number"
            value={config.email.porta}
            onChange={(e) => handleInputChange('email', 'porta', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Usuário
          </label>
          <input
            type="email"
            value={config.email.usuario}
            onChange={(e) => handleInputChange('email', 'usuario', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Senha
          </label>
          <input
            type="password"
            value={config.email.senha}
            onChange={(e) => handleInputChange('email', 'senha', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="usarSSL"
          checked={config.email.usarSSL}
          onChange={(e) => handleInputChange('email', 'usarSSL', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="usarSSL" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Usar SSL/TLS
        </label>
      </div>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="backupAtivo"
          checked={config.backup.ativo}
          onChange={(e) => handleInputChange('backup', 'ativo', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="backupAtivo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Backup Automático Ativo
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Frequência
          </label>
          <select
            value={config.backup.frequencia}
            onChange={(e) => handleInputChange('backup', 'frequencia', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="DIARIO">Diário</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSAL">Mensal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hora do Backup
          </label>
          <input
            type="time"
            value={config.backup.horaBackup}
            onChange={(e) => handleInputChange('backup', 'horaBackup', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Retenção (dias)
          </label>
          <input
            type="number"
            value={config.backup.retencaoDias}
            onChange={(e) => handleInputChange('backup', 'retencaoDias', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Destino
          </label>
          <select
            value={config.backup.destino}
            onChange={(e) => handleInputChange('backup', 'destino', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="AWS_S3">AWS S3</option>
            <option value="LOCAL">Local</option>
            <option value="GOOGLE_DRIVE">Google Drive</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSegurancaTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tempo de Sessão (minutos)
          </label>
          <input
            type="number"
            value={config.seguranca.tempoSessao}
            onChange={(e) => handleInputChange('seguranca', 'tempoSessao', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tentativas de Login
          </label>
          <input
            type="number"
            value={config.seguranca.tentativasLogin}
            onChange={(e) => handleInputChange('seguranca', 'tentativasLogin', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bloqueio Temporário (minutos)
          </label>
          <input
            type="number"
            value={config.seguranca.bloqueioTemporario}
            onChange={(e) => handleInputChange('seguranca', 'bloqueioTemporario', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiração de Senha (dias)
          </label>
          <input
            type="number"
            value={config.seguranca.expiracaoSenha}
            onChange={(e) => handleInputChange('seguranca', 'expiracaoSenha', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="forcarSenhaForte"
          checked={config.seguranca.forcarSenhaForte}
          onChange={(e) => handleInputChange('seguranca', 'forcarSenhaForte', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="forcarSenhaForte" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Forçar Senha Forte
        </label>
      </div>
    </div>
  );

  const renderNotificacoesTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emailAtivo"
            checked={config.notificacoes.emailAtivo}
            onChange={(e) => handleInputChange('notificacoes', 'emailAtivo', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="emailAtivo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Notificações por E-mail
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="notificacoesSistema"
            checked={config.notificacoes.notificacoesSistema}
            onChange={(e) => handleInputChange('notificacoes', 'notificacoesSistema', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="notificacoesSistema" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Notificações do Sistema
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="alertasCriticos"
            checked={config.notificacoes.alertasCriticos}
            onChange={(e) => handleInputChange('notificacoes', 'alertasCriticos', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="alertasCriticos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Alertas Críticos
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="relatoriosAutomaticos"
            checked={config.notificacoes.relatoriosAutomaticos}
            onChange={(e) => handleInputChange('notificacoes', 'relatoriosAutomaticos', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="relatoriosAutomaticos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Relatórios Automáticos
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Horário de Envio
        </label>
        <input
          type="time"
          value={config.notificacoes.horarioEnvio}
          onChange={(e) => handleInputChange('notificacoes', 'horarioEnvio', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'geral':
        return renderGeralTab();
      case 'email':
        return renderEmailTab();
      case 'backup':
        return renderBackupTab();
      case 'seguranca':
        return renderSegurancaTab();
      case 'notificacoes':
        return renderNotificacoesTab();
      case 'ia':
        return <AIAssistantPanel />;
      default:
        return renderGeralTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CogIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Configurações do Sistema
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadConfiguracoes}
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Recarregar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;

