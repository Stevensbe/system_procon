import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProconLayout } from '@/components/layout/ProconLayout';
import { NotificationProvider } from '@/context/NotificationContext';

// Exemplo de páginas
const Dashboard = () => <div className="p-6"><h1>Dashboard</h1></div>;
const Fiscalizacao = () => <div className="p-6"><h1>Fiscalização</h1></div>;
const Juridico = () => <div className="p-6"><h1>Jurídico</h1></div>;
const Processos = () => <div className="p-6"><h1>Processos</h1></div>;
const Multas = () => <div className="p-6"><h1>Multas</h1></div>;
const Financeiro = () => <div className="p-6"><h1>Financeiro</h1></div>;
const Empresas = () => <div className="p-6"><h1>Empresas</h1></div>;
const Usuarios = () => <div className="p-6"><h1>Usuários</h1></div>;
const Relatorios = () => <div className="p-6"><h1>Relatórios</h1></div>;
const Configuracoes = () => <div className="p-6"><h1>Configurações</h1></div>;

// Caixa de entrada
const CaixaEntrada = () => <div className="p-6"><h1>Caixa de Entrada</h1></div>;

// Comunicação
const Inbox = () => <div className="p-6"><h1>Inbox</h1></div>;
const Notificacoes = () => <div className="p-6"><h1>Notificações</h1></div>;

export function SidebarIntegration() {
  return (
    <NotificationProvider>
      <Router>
        <ProconLayout>
          <Routes>
            {/* Rotas principais */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fiscalizacao" element={<Fiscalizacao />} />
            <Route path="/juridico" element={<Juridico />} />
            <Route path="/processos" element={<Processos />} />
            <Route path="/multas" element={<Multas />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            
            {/* Caixa de entrada */}
            <Route path="/caixa-entrada" element={<CaixaEntrada />} />
            
            {/* Comunicação */}
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
          </Routes>
        </ProconLayout>
      </Router>
    </NotificationProvider>
  );
}
