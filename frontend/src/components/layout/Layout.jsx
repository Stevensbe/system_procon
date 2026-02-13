import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import SidebarOverlay from './SidebarOverlay';
import AlertasPrazos from '../processos/AlertasPrazos';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/SupabaseAuthContext';
import { initSidebar } from '../../utils/sidebar';
import { canAccessModuleForPath } from '../../utils/modulePermissions';
import '../../styles/modern-sidebar.css';
import '../../styles/admin-white.css';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, profile, role, getRedirectPath } = useAuth();

  // Debug: verificar o que está sendo recebido
  useEffect(() => {
    console.debug('[Layout] Estado de autenticação:', {
      user: user?.email,
      userRole: user?.role,
      profile: profile?.email,
      profileRole: profile?.role,
      role: role,
    });
  }, [user, profile, role]);

  useEffect(() => {
    // Inicializar o sidebar moderno
    initSidebar();
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redireciona para login
      navigate('/login');
    }
  };

  return (
    <div className="admin-white flex h-screen bg-white">
      <ModernSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <SidebarOverlay isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex-1 flex flex-col ml-[280px] main-content">
        {/* Header com alertas */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                className="sidebar-toggle-btn p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Toggle Sidebar"
                onClick={handleSidebarToggle}
              >
                <i className="fa fa-bars text-gray-600"></i>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Sistema PROCON</h2>
            </div>
            <div className="flex items-center space-x-4">
              <AlertasPrazos showOnlyCount={true} />
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || 'Usuário'}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  title="Fazer logout"
                >
                  <i className="fa fa-sign-out mr-1"></i>
                  Sair
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto bg-white">
          {(() => {
            // O user já vem enriquecido do contexto com role, is_superuser, etc.
            // Garante que o role está presente
            const permissionUser = {
              ...user,
              role: role || user?.role || profile?.role || 'guest',
              is_superuser: role === 'admin' || user?.is_superuser,
              is_staff: role === 'admin' || role === 'staff' || user?.is_staff,
            };

            console.debug('[Layout] Verificando permissão para:', location.pathname, {
              role: permissionUser.role,
              is_superuser: permissionUser.is_superuser,
              email: permissionUser.email
            });

            const canAccess = canAccessModuleForPath(permissionUser, location.pathname);
            console.debug('[Layout] Acesso permitido:', canAccess);

            return canAccess;
          })() ? (
            <Outlet /> /* As páginas da rota serão renderizadas aqui */
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Acesso restrito</h3>
              <p className="text-sm text-gray-600 mt-2">
                Você não tem permissão para acessar este módulo. Procure o TI para liberar seu acesso.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Role atual: {role || 'não definido'} | Path: {location.pathname}
              </p>
              <button
                type="button"
                onClick={() => navigate(getRedirectPath(role || profile || user))}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Layout;
