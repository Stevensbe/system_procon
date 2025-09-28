import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import SidebarOverlay from './SidebarOverlay';
import AlertasPrazos from '../processos/AlertasPrazos';
import ThemeToggle from '../ui/ThemeToggle';
import { initSidebar } from '../../utils/sidebar';
import '../../styles/modern-sidebar.css';
import '../../styles/admin-white.css';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <h2 className="text-lg font-semibold text-gray-900">Sistema PROCON-AM</h2>
            </div>
            <div className="flex items-center space-x-4">
              <AlertasPrazos showOnlyCount={true} />
              <ThemeToggle />
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
          <Outlet /> {/* As páginas da rota serão renderizadas aqui */}
        </main>
      </div>
    </div>
  );
}

export default Layout;