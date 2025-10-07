import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProconLayout } from '@/components/layout/ProconLayout';
import { NotificationProvider } from '@/context/NotificationContext';

// Exemplo de páginas
const Dashboard = () => <div className="p-6"><h1>Dashboard</h1></div>;
const Protocolos = () => <div className="p-6"><h1>Protocolos</h1></div>;
const Tramitacao = () => <div className="p-6"><h1>Tramitação</h1></div>;
const Fiscalizacao = () => <div className="p-6"><h1>Fiscalização</h1></div>;
const Juridico = () => <div className="p-6"><h1>Jurídico</h1></div>;
const Processos = () => <div className="p-6"><h1>Processos</h1></div>;
const Multas = () => <div className="p-6"><h1>Multas</h1></div>;
const Financeiro = () => <div className="p-6"><h1>Financeiro</h1></div>;
const Empresas = () => <div className="p-6"><h1>Empresas</h1></div>;
const Usuarios = () => <div className="p-6"><h1>Usuários</h1></div>;
const Relatorios = () => <div className="p-6"><h1>Relatórios</h1></div>;
const Configuracoes = () => <div className="p-6"><h1>Configurações</h1></div>;

// Caixas de entrada
const CaixaDenuncias = () => <div className="p-6"><h1>Caixa Denúncias</h1></div>;
const CaixaFiscalizacao = () => <div className="p-6"><h1>Caixa Fiscalização</h1></div>;
const CaixaJuridico1 = () => <div className="p-6"><h1>Caixa Jurídico 1</h1></div>;
const CaixaJuridico2 = () => <div className="p-6"><h1>Caixa Jurídico 2</h1></div>;
const CaixaDaf = () => <div className="p-6"><h1>Caixa DAF</h1></div>;
const CaixaDiretoria = () => <div className="p-6"><h1>Caixa Diretoria</h1></div>;

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
            <Route path="/protocolo" element={<Protocolos />} />
            <Route path="/tramitacao" element={<Tramitacao />} />
            <Route path="/fiscalizacao" element={<Fiscalizacao />} />
            <Route path="/juridico" element={<Juridico />} />
            <Route path="/processos" element={<Processos />} />
            <Route path="/multas" element={<Multas />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            
            {/* Caixas de entrada */}
            <Route path="/caixa-denuncias" element={<CaixaDenuncias />} />
            <Route path="/caixa-fiscalizacao" element={<CaixaFiscalizacao />} />
            <Route path="/caixa-juridico-1" element={<CaixaJuridico1 />} />
            <Route path="/caixa-juridico-2" element={<CaixaJuridico2 />} />
            <Route path="/caixa-daf" element={<CaixaDaf />} />
            <Route path="/caixa-diretoria" element={<CaixaDiretoria />} />
            
            {/* Comunicação */}
            <Route path="/caixa-entrada/pessoal" element={<Inbox />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
          </Routes>
        </ProconLayout>
      </Router>
    </NotificationProvider>
  );
}

