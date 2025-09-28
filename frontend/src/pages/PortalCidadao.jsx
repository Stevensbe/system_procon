import React, { useState, useEffect, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ScaleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  CpuChipIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import portalCidadaoService from '../services/portalCidadaoService';
import PeticionamentoForm from '../components/portal/PeticionamentoForm';
import ConsultaResultado from '../components/portal/ConsultaResultado';
import AvaliacaoServico from '../components/portal/AvaliacaoServico';
import DenunciaForm from '../components/portal/DenunciaForm';
import AcompanhamentoProcesso from '../components/portal/AcompanhamentoProcesso';
import NotificationContainer from '../components/ui/NotificationContainer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useNotification from '../hooks/useNotification';
import PortalAI from '../components/portal/PortalAI';
// Importar apenas PWA Manager - Auditoria desabilitada para economizar memória
import { pwaManager } from '../utils/pwa';
import { auditSystem } from '../utils/audit';
import { saveToken, removeToken, getToken } from '../utils/token';

const PortalCidadao = () => {
  const [activeTab, setActiveTab] = useState('consulta');
  const [denunciaLoading, setDenunciaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formulariosBusca, setFormulariosBusca] = useState('');
  const [formulariosCategoria, setFormulariosCategoria] = useState('');
  const [estatisticas, setEstatisticas] = useState({
    processosAtendidos: 1250,
    problemasResolvidos: 850,
    taxaSucesso: 68,
    satisfacao: 95
  });
  
  // Estados de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [historicoAtividades, setHistoricoAtividades] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [tema, setTema] = useState('claro');
  const [showTemaModal, setShowTemaModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [consultaData, setConsultaData] = useState({
    tipo_consulta: 'PROTOCOLO',
    numero_protocolo: '',
    documento: ''
  });
  const [consultaResult, setConsultaResult] = useState(null);
  const [avaliacao, setAvaliacao] = useState({
    tipo_servico: 'GERAL',
    nota: 5,
    comentario: '',
    nome: '',
    email: ''
  });

  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  } = useNotification();

  const displayName = useMemo(() => {
    if (!user) {
      return 'Usuário';
    }
    return user.profile?.nome_completo || user.first_name || user.username || user.email || 'Usuário';
  }, [user]);

  const sanitizeDigits = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  // === CONSULTA PÚBLICA ===
  const handleConsultaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConsultaResult(null);

    try {
      const resultado = await portalCidadaoService.consultarPublica(consultaData);

      if (resultado?.encontrado) {
        setConsultaResult(resultado);
        showSuccess('Consulta realizada', 'Dados encontrados com sucesso!');
      } else {
        const message =
          resultado?.detail ||
          resultado?.erro ||
          'Nenhum resultado encontrado para os dados informados.';

        setConsultaResult({
          ...(resultado || {}),
          encontrado: false,
          erro: message,
        });

        if (resultado?.statusCode === 501) {
          showInfo('Consulta indisponível', message);
        } else if (resultado?.statusCode === 400) {
          showWarning('Dados inválidos', message);
        } else if (resultado?.statusCode === 404) {
          showWarning('Nenhum resultado', message);
        } else {
          showWarning('Consulta não concluída', message);
        }
      }
    } catch (error) {
      console.error('Erro na consulta:', error);
      const message = error.message || 'Erro ao realizar consulta. Tente novamente.';
      setConsultaResult({
        encontrado: false,
        erro: message,
      });
      showError('Erro na consulta', message);
    } finally {
      setLoading(false);
    }
  };

  // === DENÚNCIA ===
  const handleDenunciaSubmit = async (formData) => {
    setDenunciaLoading(true);
    
    try {
      const response = await portalCidadaoService.enviarDenuncia(formData);
      
      if (response.data) {
        showSuccess(
          'Denúncia enviada com sucesso!', 
          `Protocolo: ${response.data.numero_protocolo}. Você receberá uma confirmação por email.`,
          8000
        );
        setActiveTab('consulta');
      }
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      showError(
        'Erro ao enviar denúncia', 
        'Não foi possível enviar sua denúncia. Tente novamente ou entre em contato conosco.'
      );
    }
    
    setDenunciaLoading(false);
  };

  // === AVALIAÇÃO DE SERVIÇOS ===
  const handleAvaliacaoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await portalCidadaoService.enviarAvaliacao(avaliacao);
      
      if (response.data) {
        showSuccess('Avaliação enviada', 'Obrigado por sua avaliação!');
        setAvaliacao({
          tipo_servico: 'GERAL',
          nota: 5,
          comentario: '',
          nome: '',
          email: ''
        });
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      showError('Erro ao enviar avaliação', 'Não foi possível enviar sua avaliação. Tente novamente.');
    }
    
    setLoading(false);
  };

  // === PETIÇÃO ===
  const handlePeticaoSubmit = async (formData) => {
    try {
      const response = await portalCidadaoService.enviarPeticao(formData);
      
      if (response.data) {
        showSuccess(
          'Petição enviada com sucesso!', 
          `Protocolo: ${response.data.numero_peticao}. Você receberá uma confirmação por email.`,
          8000
        );
        setActiveTab('consulta');
      }
    } catch (error) {
      console.error('Erro ao enviar petição:', error);
      showError(
        'Erro ao enviar petição', 
        'Não foi possível enviar sua petição. Tente novamente ou entre em contato conosco.'
      );
    }
  };

  // === CONTATO ===
  const handleContatoSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dados = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      assunto: formData.get('assunto'),
      mensagem: formData.get('mensagem')
    };

    setLoading(true);
    try {
      const response = await portalCidadaoService.enviarEmailContato(dados);
      if (response.data.success) {
        showSuccess('Mensagem enviada', 'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.');
        e.target.reset();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError('Erro ao enviar mensagem', 'Não foi possível enviar sua mensagem. Tente novamente.');
    }
    setLoading(false);
  };

  // === AUTENTICAÇÃO ===
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = (formData.get('email') || '').trim();
    const dados = {
      username: email,
      password: formData.get('password')
    };

    setAuthLoading(true);
    try {
      const response = await portalCidadaoService.login(dados);
      if (response.data?.access) {
        saveToken({ access: response.data.access, refresh: response.data.refresh });
        const userData = response.data.user || {};
        const profileData = response.data.profile || null;
        setUser({ ...userData, profile: profileData });
        setIsAuthenticated(true);
        setShowLoginModal(false);
        showSuccess('Login realizado', 'Bem-vindo de volta!');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      showError('Erro no login', 'Email ou senha incorretos.');
    }
    setAuthLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nome = (formData.get('nome') || '').trim();
    const email = (formData.get('email') || '').trim();
    const cpf = (formData.get('cpf') || '').trim();
    const telefone = (formData.get('telefone') || '').trim();
    const cidade = (formData.get('cidade') || '').trim();
    const estado = (formData.get('estado') || '').trim();
    const endereco = (formData.get('endereco') || '').trim();

    const dados = {
      nome,
      email,
      cpf,
      telefone,
      cidade,
      estado,
      endereco,
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };

    if (dados.password !== dados.confirmPassword) {
      showError('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }

    if (!dados.cpf) {
      showError('CPF obrigatório', 'Informe um CPF válido para concluir o cadastro.');
      return;
    }

    if (!dados.cidade) {
      showError('Local obrigatório', 'Informe a cidade ou localidade para concluir o cadastro.');
      return;
    }

    setAuthLoading(true);
    try {
      const payload = {
        username: email,
        email,
        password: dados.password,
        nome,
        cpf: sanitizeDigits(cpf),
        telefone: sanitizeDigits(telefone),
        cidade,
        estado: estado ? estado.toUpperCase() : '',
        endereco,
      };

      const response = await portalCidadaoService.register(payload);
      const tokens = response.data?.tokens;
      const userData = response.data?.user;
      const profileData = response.data?.profile || null;

      if (tokens?.access) {
        saveToken({ access: tokens.access, refresh: tokens.refresh });
      }

      if (userData) {
        setUser({ ...userData, profile: profileData });
        setIsAuthenticated(true);
      }

      setShowRegisterModal(false);
      showSuccess('Conta criada', 'Sua conta foi criada com sucesso! Você já está conectado.');
    } catch (error) {
      console.error('Erro no registro:', error);
      const backendErrors = error.response?.data?.errors || error.response?.data;
      let message = 'Não foi possível criar sua conta. Tente novamente.';

      if (backendErrors) {
        if (typeof backendErrors === 'string') {
          message = backendErrors;
        } else if (backendErrors.detail) {
          message = backendErrors.detail;
        } else if (typeof backendErrors === 'object') {
          const joined = Object.values(backendErrors)
            .flat()
            .filter(Boolean)
            .map(item => (typeof item === 'string' ? item : JSON.stringify(item)))
            .join('\n');
          if (joined) {
            message = joined;
          }
        }
      }

      showError('Erro no registro', message);
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    showSuccess('Logout realizado', 'Você saiu da sua conta.');
  };

  // Verificar token ao carregar
  useEffect(() => {
    const token = getToken();
    if (token) {
      portalCidadaoService.verifyToken()
        .then(response => {
          const userData = response.data || {};
          const profileData = userData.profile || null;
          setUser({ ...userData, profile: profileData });
          setIsAuthenticated(true);
        })
        .catch(() => {
          removeToken();
        });
    }

    // Inicializar sistemas avançados apenas se necessário
    const initializeAdvancedSystems = async () => {
      try {
        // Verificar memória antes de inicializar
        if ('memory' in performance) {
          const memory = performance.memory;
          const usage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
          
          if (usage > 60) {
            console.warn('Memória alta, inicializando modo básico');
            return;
          }
        }
        
        // Inicializar apenas em desktop e com memória suficiente
        if (window.innerWidth > 768) {
          // Inicializar PWA apenas se suportado (auditoria desabilitada)
          if (pwaManager && typeof pwaManager.init === 'function' && 'serviceWorker' in navigator) {
            try {
              pwaManager.init();
            } catch (error) {
              console.warn('Erro ao inicializar PWA:', error);
            }
          }
        }
        
        console.log('Sistemas avançados inicializados no Portal do Cidadão (Modo Otimizado)');
      } catch (error) {
        console.error('Erro ao inicializar sistemas avançados:', error);
      }
    };

    // Executar com delay maior para evitar sobrecarga
    setTimeout(initializeAdvancedSystems, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sistema de Notificações */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Header Público */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">PROCON</h1>
              <p className="text-blue-200">Portal do Cidadão</p>
            </div>
            
            {/* Menu Mobile Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
                        {/* Menu de Navegação Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setActiveTab('consulta')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Consultar
              </button>
              <button
                onClick={() => setActiveTab('denuncia')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Denúncia
              </button>
              <button
                onClick={() => setActiveTab('orientacoes')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Orientações
              </button>
              <button
                onClick={() => setActiveTab('formularios')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Formulários
              </button>
              <button
                onClick={() => setActiveTab('sobre')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Sobre
              </button>
              <button
                onClick={() => setActiveTab('contato')}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Contato
              </button>
              
              {/* Botões de Autenticação */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveTab('historico')}
                    className="text-blue-200 hover:text-white transition-colors text-sm"
                  >
                    Meu Histórico
                  </button>
                  
                  {/* Botão de IA */}
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Assistente de IA"
                  >
                    <CpuChipIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de Auditoria */}
                  <button
                    onClick={() => {
                      const logs = auditSystem.getLogs();
                      console.log('Logs de Auditoria:', logs);
                      showInfo('Auditoria', `Total de logs: ${logs.length}`);
                    }}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Sistema de Auditoria"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de PWA */}
                  <button
                    onClick={() => {
                      const pwaInfo = pwaManager.getInfo();
                      console.log('Informações PWA:', pwaInfo);
                      showInfo('PWA', `Status: ${pwaInfo.isInstalled ? 'Instalado' : 'Não instalado'}`);
                    }}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Progressive Web App"
                  >
                    <CloudArrowUpIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de Notificações */}
                  <button
                    onClick={() => setShowNotificacoes(!showNotificacoes)}
                    className="relative text-blue-200 hover:text-white transition-colors"
                  >
                    <BellIcon className="h-5 w-5" />
                    {notificacoes.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificacoes.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Botão de Tema */}
                  <button
                    onClick={() => setShowTemaModal(true)}
                    className="text-blue-200 hover:text-white transition-colors"
                  >
                    {tema === 'claro' ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <span className="text-blue-200 text-sm">Olá, {displayName}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Botão de IA */}
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Assistente de IA"
                  >
                    <CpuChipIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de Auditoria */}
                  <button
                    onClick={() => {
                      const logs = auditSystem.getLogs();
                      console.log('Logs de Auditoria:', logs);
                      showInfo('Auditoria', `Total de logs: ${logs.length}`);
                    }}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Sistema de Auditoria"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Botão de PWA */}
                  <button
                    onClick={() => {
                      const pwaInfo = pwaManager.getInfo();
                      console.log('Informações PWA:', pwaInfo);
                      showInfo('PWA', `Status: ${pwaInfo.isInstalled ? 'Instalado' : 'Não instalado'}`);
                    }}
                    className="relative text-blue-200 hover:text-white transition-colors"
                    title="Progressive Web App"
                  >
                    <CloudArrowUpIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-blue-200 hover:text-white transition-colors text-sm"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-white text-blue-900 px-4 py-2 rounded-md hover:bg-gray-100 text-sm font-medium"
                  >
                    Cadastrar
                  </button>
                </div>
              )}
            </nav>
            
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-5 w-5" />
                <span>(92) 3212-0000</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-5 w-5" />
                <span>contato@procon.am.gov.br</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-800 border-t border-blue-700">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => { setActiveTab('consulta'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Consultar
                </button>
                <button 
                  onClick={() => { setActiveTab('denuncia'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Denúncia
                </button>
                <button 
                  onClick={() => { setActiveTab('orientacoes'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Orientações
                </button>
                <button 
                  onClick={() => { setActiveTab('formularios'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Formulários
                </button>
                <button 
                  onClick={() => { setActiveTab('sobre'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Sobre
                </button>
                <button 
                  onClick={() => { setActiveTab('contato'); setMobileMenuOpen(false); }}
                  className="text-blue-200 hover:text-white transition-colors text-left py-2"
                >
                  Contato
                </button>
              </div>
            </nav>
          </div>
        )}
        
        {/* Dropdown de Notificações */}
        {showNotificacoes && isAuthenticated && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-40">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-gray-900">Notificações</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.map((notificacao, index) => (
                  <div key={index} className="p-4 border-b hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notificacao.tipo === 'info' ? 'bg-blue-100' :
                          notificacao.tipo === 'success' ? 'bg-green-100' :
                          notificacao.tipo === 'warning' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {notificacao.tipo === 'info' && <InformationCircleIcon className="h-4 w-4 text-blue-600" />}
                          {notificacao.tipo === 'success' && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                          {notificacao.tipo === 'warning' && <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />}
                          {notificacao.tipo === 'error' && <XCircleIcon className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notificacao.titulo}</p>
                        <p className="text-sm text-gray-500">{notificacao.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-1">{notificacao.data}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notificacoes.length > 0 && (
              <div className="p-3 border-t">
                <button
                  onClick={() => setNotificacoes([])}
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                >
                  Limpar todas
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Banner Principal */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Defenda Seus Direitos de Consumidor
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Consulte processos, faça denúncias e obtenha orientações
          </p>
          
                      {/* Cards de Ações Rápidas */}
            <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                   onClick={() => setActiveTab('consulta')}>
                <MagnifyingGlassIcon className="h-10 w-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-1 text-sm">Consultar</h3>
                <p className="text-xs text-blue-100">Acompanhe seu processo</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                   onClick={() => setActiveTab('acompanhamento')}>
                <ClockIcon className="h-10 w-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-1 text-sm">Acompanhar</h3>
                <p className="text-xs text-blue-100">Status do processo</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                   onClick={() => setActiveTab('denuncia')}>
                <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-1 text-sm">Denunciar</h3>
                <p className="text-xs text-blue-100">Nova denúncia</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                   onClick={() => setActiveTab('peticao')}>
                <DocumentTextIcon className="h-10 w-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-1 text-sm">Petição</h3>
                <p className="text-xs text-blue-100">Nova solicitação</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                   onClick={() => setActiveTab('avaliacao')}>
                <StarIcon className="h-10 w-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-1 text-sm">Avaliar</h3>
                <p className="text-xs text-blue-100">Sua opinião</p>
              </div>
            </div>
            
            {/* Estatísticas do PROCON */}
            <div className="mt-12 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">{estatisticas.processosAtendidos}</div>
                <div className="text-sm text-blue-100">Processos Atendidos</div>
                <div className="text-xs text-blue-200 mt-1">Este ano</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">{estatisticas.problemasResolvidos}</div>
                <div className="text-sm text-blue-100">Problemas Resolvidos</div>
                <div className="text-xs text-blue-200 mt-1">Taxa de sucesso: {estatisticas.taxaSucesso}%</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">{estatisticas.satisfacao}%</div>
                <div className="text-sm text-blue-100">Satisfação</div>
                <div className="text-xs text-blue-200 mt-1">Avaliação dos usuários</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">24h</div>
                <div className="text-sm text-blue-100">Portal Online</div>
                <div className="text-xs text-blue-200 mt-1">Sempre disponível</div>
              </div>
            </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {[
              { id: 'consulta', label: 'Consulta Pública', icon: MagnifyingGlassIcon },
              { id: 'acompanhamento', label: 'Acompanhar Processo', icon: ClockIcon },
              { id: 'denuncia', label: 'Nova Denúncia', icon: ExclamationTriangleIcon },
              { id: 'peticao', label: 'Nova Petição', icon: DocumentTextIcon },
              { id: 'orientacoes', label: 'Orientações', icon: InformationCircleIcon },
              { id: 'sobre', label: 'Sobre o PROCON', icon: BuildingOfficeIcon },
              { id: 'contato', label: 'Contato', icon: EnvelopeIcon },
              { id: 'formularios', label: 'Formulários', icon: DocumentTextIcon },
              { id: 'avaliacao', label: 'Avaliar Serviço', icon: StarIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo das Tabs */}
          <div className="max-w-4xl mx-auto">
            
            {/* CONSULTA PÚBLICA */}
            {activeTab === 'consulta' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <MagnifyingGlassIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Consulta Pública
                </h3>
                
                <form onSubmit={handleConsultaSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Consulta
                      </label>
                      <select
                        value={consultaData.tipo_consulta}
                        onChange={(e) => setConsultaData({
                          ...consultaData,
                          tipo_consulta: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PROTOCOLO">Protocolo</option>
                        <option value="PETICAO">Petição</option>
                        <option value="PROCESSO">Processo</option>
                        <option value="MULTA">Multa</option>
                        <option value="RECURSO">Recurso</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do Protocolo
                      </label>
                      <input
                        type="text"
                        value={consultaData.numero_protocolo}
                        onChange={(e) => setConsultaData({
                          ...consultaData,
                          numero_protocolo: e.target.value
                        })}
                        placeholder="Ex: 2025000001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPF/CNPJ
                      </label>
                      <input
                        type="text"
                        value={consultaData.documento}
                        onChange={(e) => setConsultaData({
                          ...consultaData,
                          documento: e.target.value
                        })}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" color="white" />
                        <span className="ml-2">Consultando...</span>
                      </div>
                    ) : (
                      'Consultar'
                    )}
                  </button>
                </form>
                
                {/* Resultado da Consulta */}
                {consultaResult && (
                  <div className="mt-8">
                    <ConsultaResultado 
                      resultado={consultaResult} 
                      tipo={(consultaResult?.tipo || consultaData.tipo_consulta || 'PROTOCOLO').toLowerCase()} 
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* ACOMPANHAMENTO DE PROCESSO */}
            {activeTab === 'acompanhamento' && (
              <AcompanhamentoProcesso
                onSuccess={() => showSuccess('Processo encontrado', 'Dados do processo carregados com sucesso!')}
                onError={(mensagem) => showError('Erro ao buscar processo', mensagem)}
              />
            )}

            {/* NOVA DENÚNCIA */}
            {activeTab === 'denuncia' && (
              <DenunciaForm 
                onSubmit={handleDenunciaSubmit}
                loading={denunciaLoading}
              />
            )}

            {/* NOVA PETIÇÃO */}
            {activeTab === 'peticao' && (
              <PeticionamentoForm 
                onSuccess={handlePeticaoSubmit}
                onCancel={() => setActiveTab('consulta')}
              />
            )}
            
            {/* ORIENTAÇÕES */}
            {activeTab === 'orientacoes' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <InformationCircleIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Orientações ao Consumidor
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <ScaleIcon className="h-12 w-12 text-blue-600 mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Direitos Básicos</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Conheça seus direitos fundamentais como consumidor
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Direito à informação clara</li>
                      <li>• Proteção contra práticas abusivas</li>
                      <li>• Direito de arrependimento</li>
                      <li>• Garantia e assistência técnica</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-green-600 mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Como Reclamar</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Passo a passo para fazer sua reclamação
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Tente resolver com a empresa</li>
                      <li>• Documente tudo</li>
                      <li>• Procure o PROCON</li>
                      <li>• Acompanhe o processo</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <DocumentTextIcon className="h-12 w-12 text-purple-600 mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Documentos Necessários</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      O que você precisa para fazer uma reclamação
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• RG e CPF</li>
                      <li>• Comprovante de compra</li>
                      <li>• Comunicações com a empresa</li>
                      <li>• Fotos e evidências</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <PhoneIcon className="h-12 w-12 text-red-600 mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Canais de Atendimento</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Como entrar em contato conosco
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Telefone: (92) 3212-0000</li>
                      <li>• E-mail: contato@procon.am.gov.br</li>
                      <li>• Presencial: Seg-Sex 8h-17h</li>
                      <li>• Portal online 24h</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SOBRE O PROCON */}
            {activeTab === 'sobre' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <BuildingOfficeIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Sobre o PROCON Amazonas
                </h3>
                
                <div className="space-y-8">
                  {/* Missão */}
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-semibold mb-3 text-blue-600">Nossa Missão</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Defender e promover os direitos dos consumidores, garantindo relações de consumo 
                      justas e equilibradas, por meio de ações de fiscalização, mediação e educação, 
                      contribuindo para o fortalecimento da cidadania e do desenvolvimento econômico sustentável.
                    </p>
                  </div>

                  {/* Visão */}
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold mb-3 text-green-600">Nossa Visão</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Ser referência nacional na defesa dos direitos do consumidor, reconhecido pela 
                      excelência dos serviços prestados e pela capacidade de promover mudanças positivas 
                      no mercado de consumo.
                    </p>
                  </div>

                  {/* Valores */}
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h4 className="text-xl font-semibold mb-3 text-purple-600">Nossos Valores</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Transparência</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Ética e Integridade</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Compromisso Social</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Inovação</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Acessibilidade</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Eficiência</span>
                      </div>
                    </div>
                  </div>

                  {/* Estrutura */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-xl font-semibold mb-4 text-gray-800">Nossa Estrutura</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2 text-blue-600">Direção Geral</h5>
                        <p className="text-gray-600 text-sm mb-4">
                          Responsável pela gestão estratégica e administrativa do órgão.
                        </p>
                        
                        <h5 className="font-medium mb-2 text-blue-600">Coordenação de Fiscalização</h5>
                        <p className="text-gray-600 text-sm mb-4">
                          Realiza fiscalizações e aplica medidas administrativas.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-blue-600">Coordenação Jurídica</h5>
                        <p className="text-gray-600 text-sm mb-4">
                          Análise jurídica de processos e pareceres técnicos.
                        </p>
                        
                        <h5 className="font-medium mb-2 text-blue-600">Atendimento ao Consumidor</h5>
                        <p className="text-gray-600 text-sm">
                          Recepção de denúncias e orientação aos consumidores.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTATO */}
            {activeTab === 'contato' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <EnvelopeIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Entre em Contato
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Informações de Contato */}
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <MapPinIcon className="h-6 w-6 text-blue-600" />
                        <h4 className="font-semibold text-gray-800">Endereço</h4>
                      </div>
                      <p className="text-gray-600">
                        Av. Djalma Batista, 1018 - Chapada<br />
                        Manaus - AM, CEP: 69050-010
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <PhoneIcon className="h-6 w-6 text-green-600" />
                        <h4 className="font-semibold text-gray-800">Telefones</h4>
                      </div>
                      <div className="space-y-1 text-gray-600">
                        <p>(92) 3212-0000 - Geral</p>
                        <p>(92) 3212-0001 - Atendimento</p>
                        <p>(92) 3212-0002 - Fiscalização</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                        <h4 className="font-semibold text-gray-800">E-mails</h4>
                      </div>
                      <div className="space-y-1 text-gray-600">
                        <p>contato@procon.am.gov.br</p>
                        <p>atendimento@procon.am.gov.br</p>
                        <p>fiscalizacao@procon.am.gov.br</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <ClockIcon className="h-6 w-6 text-orange-600" />
                        <h4 className="font-semibold text-gray-800">Horário de Funcionamento</h4>
                      </div>
                      <div className="space-y-1 text-gray-600">
                        <p><strong>Segunda a Sexta:</strong> 8h às 18h</p>
                        <p><strong>Sábado:</strong> 8h às 12h</p>
                        <p><strong>Portal Online:</strong> 24h por dia</p>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de Contato */}
                  <div>
                    <form onSubmit={handleContatoSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          name="nome"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="seu@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          name="telefone"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(92) 99999-9999"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assunto
                        </label>
                        <select name="assunto" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Selecione o assunto</option>
                          <option value="duvida">Dúvida</option>
                          <option value="sugestao">Sugestão</option>
                          <option value="reclamacao">Reclamação</option>
                          <option value="elogio">Elogio</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensagem
                        </label>
                        <textarea
                          rows="4"
                          name="mensagem"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite sua mensagem..."
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Enviando...' : 'Enviar Mensagem'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* FORMULÁRIOS */}
            {activeTab === 'formularios' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Formulários para Download
                </h3>
                
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4">
                    <input
                      type="text"
                      placeholder="Buscar formulários..."
                      value={formulariosBusca}
                      onChange={(e) => setFormulariosBusca(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select 
                      value={formulariosCategoria}
                      onChange={(e) => setFormulariosCategoria(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as categorias</option>
                      <option value="Denúncia">Denúncia</option>
                      <option value="Petição">Petição</option>
                      <option value="Recurso">Recurso</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      titulo: "Formulário de Denúncia",
                      descricao: "Formulário para registrar denúncias contra fornecedores",
                      categoria: "Denúncia",
                      tamanho: "150 KB",
                      downloads: 1250
                    },
                    {
                      titulo: "Petição Inicial",
                      descricao: "Modelo de petição inicial para processos administrativos",
                      categoria: "Petição",
                      tamanho: "200 KB",
                      downloads: 890
                    },
                    {
                      titulo: "Recurso Administrativo",
                      descricao: "Formulário para interposição de recursos",
                      categoria: "Recurso",
                      tamanho: "180 KB",
                      downloads: 456
                    },
                    {
                      titulo: "Termo de Compromisso",
                      descricao: "Modelo de termo de compromisso de ajustamento",
                      categoria: "Outros",
                      tamanho: "120 KB",
                      downloads: 320
                    },
                    {
                      titulo: "Procuração Específica",
                      descricao: "Modelo de procuração para representação legal",
                      categoria: "Outros",
                      tamanho: "95 KB",
                      downloads: 678
                    },
                    {
                      titulo: "Declaração de Hipossuficiência",
                      descricao: "Formulário para solicitação de gratuidade",
                      categoria: "Outros",
                      tamanho: "80 KB",
                      downloads: 234
                    }
                  ].filter(formulario => {
                    const matchBusca = formulariosBusca === '' || 
                      formulario.titulo.toLowerCase().includes(formulariosBusca.toLowerCase()) ||
                      formulario.descricao.toLowerCase().includes(formulariosBusca.toLowerCase());
                    const matchCategoria = formulariosCategoria === '' || 
                      formulario.categoria === formulariosCategoria;
                    return matchBusca && matchCategoria;
                  }).map((formulario, index) => (
                    <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="h-8 w-8 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-2">{formulario.titulo}</h4>
                          <p className="text-gray-600 text-sm mb-3">{formulario.descricao}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {formulario.categoria}
                            </span>
                            <div className="flex space-x-4">
                              <span>{formulario.tamanho}</span>
                              <span>{formulario.downloads} downloads</span>
                            </div>
                          </div>
                          
                          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center">
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AVALIAÇÃO DE SERVIÇOS */}
            {activeTab === 'avaliacao' && (
              <AvaliacaoServico 
                onSuccess={() => {
                  showSuccess('Avaliação enviada', 'Obrigado por sua avaliação!');
                  setTimeout(() => setActiveTab('consulta'), 3000);
                }}
              />
            )}

            {/* HISTÓRICO DE ATIVIDADES */}
            {activeTab === 'historico' && isAuthenticated && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <ClockIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Meu Histórico
                </h3>
                
                {historicoAtividades.length === 0 ? (
                  <div className="text-center py-12">
                    <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h4>
                    <p className="text-gray-500">Suas atividades aparecerão aqui conforme você usar o portal.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historicoAtividades.map((atividade, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              atividade.tipo === 'consulta' ? 'bg-blue-100' :
                              atividade.tipo === 'denuncia' ? 'bg-red-100' :
                              atividade.tipo === 'download' ? 'bg-green-100' :
                              'bg-gray-100'
                            }`}>
                              {atividade.tipo === 'consulta' && <MagnifyingGlassIcon className="h-4 w-4 text-blue-600" />}
                              {atividade.tipo === 'denuncia' && <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />}
                              {atividade.tipo === 'download' && <DocumentTextIcon className="h-4 w-4 text-green-600" />}
                              {atividade.tipo === 'contato' && <EnvelopeIcon className="h-4 w-4 text-gray-600" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{atividade.titulo}</p>
                            <p className="text-sm text-gray-500">{atividade.descricao}</p>
                            <p className="text-xs text-gray-400 mt-1">{atividade.data}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Entrar</h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sua senha"
                />
              </div>
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Cadastrar</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  required
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone (opcional)
                </label>
                <input
                  type="text"
                  name="telefone"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade / Localidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    name="estado"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="UF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço (opcional)
                </label>
                <input
                  type="text"
                  name="endereco"
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, complemento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirme sua senha"
                />
              </div>
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Faça login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização de Tema */}
      {showTemaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Personalizar Tema</h3>
              <button
                onClick={() => setShowTemaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Tema */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tema</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTema('claro')}
                    className={`p-4 border rounded-lg text-center ${
                      tema === 'claro' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <SunIcon className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Claro</span>
                  </button>
                  <button
                    onClick={() => setTema('escuro')}
                    className={`p-4 border rounded-lg text-center ${
                      tema === 'escuro' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MoonIcon className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Escuro</span>
                  </button>
                </div>
              </div>
              
              {/* Tamanho da Fonte */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tamanho da Fonte</h4>
                <div className="flex items-center space-x-4">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm">A-</button>
                  <span className="text-base">Normal</span>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm">A+</button>
                </div>
              </div>
              
              {/* Contraste */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contraste</h4>
                <div className="flex items-center space-x-4">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm">Normal</button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm">Alto</button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowTemaModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowTemaModal(false);
                  showSuccess('Tema aplicado', 'Suas preferências foram salvas!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de IA */}
      <PortalAI 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">PROCON</h3>
              <p className="text-gray-400 text-sm">
                Defendendo os direitos do consumidor desde sempre.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Contato</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-4 w-4" />
                  <span>(92) 3212-0000</span>
                </div>
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>contato@procon.am.gov.br</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>Endereço da sede</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Links Úteis</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <button 
                  onClick={() => setActiveTab('orientacoes')} 
                  className="block hover:text-white text-left w-full"
                >
                  Orientações
                </button>
                <button 
                  onClick={() => setActiveTab('formularios')} 
                  className="block hover:text-white text-left w-full"
                >
                  Formulários
                </button>
                <button 
                  onClick={() => setActiveTab('sobre')} 
                  className="block hover:text-white text-left w-full"
                >
                  Sobre o PROCON
                </button>
                <button 
                  onClick={() => setActiveTab('consulta')} 
                  className="block hover:text-white text-left w-full"
                >
                  Consultar Processo
                </button>
                <button 
                  onClick={() => setActiveTab('orientacoes')} 
                  className="block hover:text-white text-left w-full"
                >
                  FAQ
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Horário de Atendimento</h4>
              <div className="text-sm text-gray-400">
                <p>Segunda a Sexta</p>
                <p>8:00 às 17:00</p>
                <p className="mt-2">Portal disponível 24h</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 PROCON - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalCidadao;
