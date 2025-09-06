import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocumentSolid,
  ExclamationTriangleIcon as ExclamationSolid,
  ScaleIcon as ScaleSolid,
  CurrencyDollarIcon as CurrencySolid,
  UserGroupIcon as UserGroupSolid,
  ChartBarIcon as ChartBarSolid,
  CogIcon as CogSolid
} from '@heroicons/react/24/solid';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Menu items com ícones e estados ativos
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: HomeIcon, 
      iconSolid: HomeSolid,
      description: 'Visão geral do sistema'
    },
    { 
      name: 'Fiscalização', 
      path: '/fiscalizacao', 
      icon: ExclamationTriangleIcon, 
      iconSolid: ExclamationSolid,
      description: 'Gestão de autos e inspeções'
    },
    { 
      name: 'Jurídico', 
      path: '/juridico', 
      icon: ScaleIcon, 
      iconSolid: ScaleSolid,
      description: 'Processos e análises jurídicas'
    },
          {
        name: 'Recursos',
        path: '/recursos/dashboard',
        icon: DocumentTextIcon,
        iconSolid: DocumentSolid,
        description: 'Gestão de recursos administrativos'
      },
      {
        name: 'Cobrança',
        path: '/cobranca/dashboard',
        icon: CurrencyDollarIcon,
        iconSolid: CurrencyDollarIcon,
        description: 'Gestão de boletos e pagamentos'
      },
    { 
      name: 'Multas', 
      path: '/multas', 
      icon: CurrencyDollarIcon, 
      iconSolid: CurrencySolid,
      description: 'Controle de multas e arrecadação'
    },
    { 
      name: 'Protocolo', 
      path: '/protocolo', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentSolid,
      description: 'Tramitação de documentos'
    },
    { 
      name: 'Peticionamento', 
      path: '/peticionamento', 
      icon: DocumentTextIcon, 
      iconSolid: DocumentSolid,
      description: 'Gestão de petições'
    },
    { 
      name: 'Financeiro', 
      path: '/financeiro', 
      icon: CurrencyDollarIcon, 
      iconSolid: CurrencySolid,
      description: 'Relatórios financeiros'
    },
    { 
      name: 'Usuários', 
      path: '/usuarios', 
      icon: UserGroupIcon, 
      iconSolid: UserGroupSolid,
      description: 'Gestão de usuários'
    },
    { 
      name: 'Relatórios', 
      path: '/relatorios', 
      icon: ChartBarIcon, 
      iconSolid: ChartBarSolid,
      description: 'Relatórios e estatísticas'
    },
    { 
      name: 'Configurações', 
      path: '/configuracoes', 
      icon: CogIcon, 
      iconSolid: CogSolid,
      description: 'Configurações do sistema'
    }
  ];

  useEffect(() => {
    // Carregar preferências do usuário
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Aplicar tema
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Carregar dados do usuário
    loadUserData();
    loadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
      // Simular dados do usuário
      setUser({
        name: 'Administrador',
        email: 'admin@procon.am.gov.br',
        role: 'Administrador',
        avatar: null
      });
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Simular notificações
      setNotifications([
        {
          id: 1,
          title: 'Novo processo jurídico',
          message: 'Processo #2025-001234 foi protocolado',
          type: 'info',
          time: '2 min atrás'
        },
        {
          id: 2,
          title: 'Multa vencida',
          message: 'Multa #M2025-000567 vence hoje',
          type: 'warning',
          time: '15 min atrás'
        },
        {
          id: 3,
          title: 'Fiscalização agendada',
          message: 'Inspeção agendada para amanhã às 10h',
          type: 'success',
          time: '1 hora atrás'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    // Limpar dados da sessão
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
              SISPROCON
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = isActive(item.path) ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                title={item.description}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role || 'Administrador'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={darkMode ? 'Modo claro' : 'Modo escuro'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative">
                  <BellIcon className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Sair"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="hidden sm:block text-sm">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-800">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
