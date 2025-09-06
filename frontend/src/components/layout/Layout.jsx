import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AlertasPrazos from '../processos/AlertasPrazos';
import ThemeToggle from '../ui/ThemeToggle';

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header com alertas */}
        <header className="bg-white dark:bg-[#1a1d21] shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-4 transition-colors duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Sistema PROCON-AM</h2>
            </div>
            <div className="flex items-center space-x-4">
              <AlertasPrazos showOnlyCount={true} />
              <ThemeToggle />
              <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
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
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
          <Outlet /> {/* As páginas da rota serão renderizadas aqui */}
        </main>
      </div>
    </div>
  );
}

export default Layout;