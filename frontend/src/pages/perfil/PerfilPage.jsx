import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  CogIcon,
  LockClosedIcon,
  BellIcon,
  ShieldCheckIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/formatters';

const PerfilPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userData, setUserData] = useState({
    id: 1,
    nome: 'João Silva Santos',
    email: 'joao.silva@procon.am.gov.br',
    cpf: '123.456.789-00',
    telefone: '(92) 98765-4321',
    cargo: 'Fiscal de Defesa do Consumidor',
    departamento: 'Fiscalização',
    dataAdmissao: '2022-03-15',
    ultimoLogin: '2024-03-29T14:30:00',
    status: 'Ativo',
    avatar: null,
    configuracoes: {
      tema: 'claro',
      idioma: 'pt-BR',
      notificacoes: {
        email: true,
        push: true,
        sms: false
      },
      privacidade: {
        perfilPublico: false,
        mostrarEmail: false,
        mostrarTelefone: false
      }
    }
  });

  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const [sessoes, setSessoes] = useState([
    {
      id: 1,
      dispositivo: 'Desktop - Windows',
      navegador: 'Chrome 120.0',
      ip: '192.168.1.100',
      localizacao: 'Manaus, AM',
      ultimoAcesso: '2024-03-29T14:30:00',
      ativo: true
    },
    {
      id: 2,
      dispositivo: 'Mobile - Android',
      navegador: 'Chrome Mobile 120.0',
      ip: '192.168.1.101',
      localizacao: 'Manaus, AM',
      ultimoAcesso: '2024-03-29T12:15:00',
      ativo: false
    },
    {
      id: 3,
      dispositivo: 'Desktop - Windows',
      navegador: 'Firefox 121.0',
      ip: '10.0.0.50',
      localizacao: 'Escritório PROCON',
      ultimoAcesso: '2024-03-28T16:45:00',
      ativo: false
    }
  ]);

  const [atividades, setAtividades] = useState([
    {
      id: 1,
      acao: 'Login no sistema',
      timestamp: '2024-03-29T14:30:00',
      ip: '192.168.1.100',
      sucesso: true
    },
    {
      id: 2,
      acao: 'Criação de auto de infração',
      timestamp: '2024-03-29T14:15:00',
      ip: '192.168.1.100',
      sucesso: true
    },
    {
      id: 3,
      acao: 'Tentativa de alteração de senha',
      timestamp: '2024-03-29T13:45:00',
      ip: '192.168.1.100',
      sucesso: false
    },
    {
      id: 4,
      acao: 'Visualização de relatório',
      timestamp: '2024-03-29T13:30:00',
      ip: '192.168.1.100',
      sucesso: true
    },
    {
      id: 5,
      acao: 'Logout do sistema',
      timestamp: '2024-03-28T17:00:00',
      ip: '10.0.0.50',
      sucesso: true
    }
  ]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Dados do usuário carregados');
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Perfil atualizado:', userData);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil!');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.senhaAtual || !passwordData.novaSenha || !passwordData.confirmarSenha) {
      alert('Todos os campos são obrigatórios!');
      return;
    }

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      alert('Nova senha e confirmação não coincidem!');
      return;
    }

    if (passwordData.novaSenha.length < 8) {
      alert('Nova senha deve ter pelo menos 8 caracteres!');
      return;
    }

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Senha alterada');
      alert('Senha alterada com sucesso!');
      setPasswordData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha!');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (section, field, value) => {
    setUserData(prev => ({
      ...prev,
      configuracoes: {
        ...prev.configuracoes,
        [section]: {
          ...prev.configuracoes[section],
          [field]: value
        }
      }
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const encerrarSessao = async (sessaoId) => {
    try {
      setSessoes(prev => prev.filter(sessao => sessao.id !== sessaoId));
      alert('Sessão encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      alert('Erro ao encerrar sessão!');
    }
  };

  const getDeviceIcon = (dispositivo) => {
    if (dispositivo.toLowerCase().includes('mobile')) {
      return <DevicePhoneMobileIcon className="h-5 w-5" />;
    }
    return <ComputerDesktopIcon className="h-5 w-5" />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="h-24 w-24 bg-gray-300 rounded-full flex items-center justify-center">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-gray-600" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
              <PhotoIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{userData.nome}</h1>
            <p className="text-gray-600">{userData.cargo}</p>
            <p className="text-gray-500">{userData.departamento}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userData.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {userData.status}
              </span>
              <span className="text-sm text-gray-500">
                Último login: {formatDateTime(userData.ultimoLogin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dados', label: 'Dados Pessoais', icon: UserIcon },
              { id: 'senha', label: 'Alterar Senha', icon: LockClosedIcon },
              { id: 'configuracoes', label: 'Configurações', icon: CogIcon },
              { id: 'seguranca', label: 'Segurança', icon: ShieldCheckIcon },
              { id: 'atividade', label: 'Atividade', icon: ClockIcon }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Dados Pessoais */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={userData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={userData.cpf}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={userData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={userData.cargo}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Admissão
                  </label>
                  <input
                    type="text"
                    value={formatDate(userData.dataAdmissao)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Alterar Senha */}
          {activeTab === 'senha' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Alterar Senha</h3>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </button>
              </div>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.senhaAtual}
                      onChange={(e) => handlePasswordInputChange('senhaAtual', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.novaSenha}
                      onChange={(e) => handlePasswordInputChange('novaSenha', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    A senha deve ter pelo menos 8 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmarSenha}
                      onChange={(e) => handlePasswordInputChange('confirmarSenha', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configurações */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Preferências</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
                    <select
                      value={userData.configuracoes.tema}
                      onChange={(e) => handleConfigChange('tema', null, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="claro">Claro</option>
                      <option value="escuro">Escuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={userData.configuracoes.idioma}
                      onChange={(e) => handleConfigChange('idioma', null, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notificações</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notif-email"
                        checked={userData.configuracoes.notificacoes.email}
                        onChange={(e) => handleConfigChange('notificacoes', 'email', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif-email" className="ml-2 block text-sm text-gray-700">
                        Notificações por email
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notif-push"
                        checked={userData.configuracoes.notificacoes.push}
                        onChange={(e) => handleConfigChange('notificacoes', 'push', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif-push" className="ml-2 block text-sm text-gray-700">
                        Notificações push
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notif-sms"
                        checked={userData.configuracoes.notificacoes.sms}
                        onChange={(e) => handleConfigChange('notificacoes', 'sms', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif-sms" className="ml-2 block text-sm text-gray-700">
                        Notificações por SMS
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Segurança */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Sessões Ativas</h3>

              <div className="space-y-4">
                {sessoes.map((sessao) => (
                  <div key={sessao.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg">
                        {getDeviceIcon(sessao.dispositivo)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{sessao.dispositivo}</h4>
                        <p className="text-sm text-gray-600">{sessao.navegador}</p>
                        <p className="text-xs text-gray-500">
                          {sessao.localizacao} " IP: {sessao.ip}
                        </p>
                        <p className="text-xs text-gray-500">
                          Último acesso: {formatDateTime(sessao.ultimoAcesso)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {sessao.ativo && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Atual
                        </span>
                      )}
                      {!sessao.ativo && (
                        <button
                          onClick={() => encerrarSessao(sessao.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Encerrar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Atividade */}
          {activeTab === 'atividade' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Log de Atividades</h3>

              <div className="space-y-4">
                {atividades.map((atividade) => (
                  <div key={atividade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        atividade.sucesso ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {atividade.sucesso ? (
                          <CheckIcon className="h-5 w-5" />
                        ) : (
                          <XMarkIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{atividade.acao}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(atividade.timestamp)} " IP: {atividade.ip}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      atividade.sucesso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {atividade.sucesso ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;