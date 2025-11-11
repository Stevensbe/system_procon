import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/emoji-fix.css';

const menuItems = [
  // Itens do tipo 'main'
  { path: '/dashboard', name: 'Dashboard', icon: '🏠', type: 'main' },
  { path: '/protocolo', name: 'Protocolo', icon: '📄', type: 'main' },
  { path: '/tramitacao', name: 'Tramitação', icon: '📤', type: 'main' },
  { path: '/fiscalizacao', name: 'Fiscalização', icon: '🔍', type: 'main' },
  { path: '/juridico', name: 'Jurídico', icon: '⚖️', type: 'main' },
  { path: '/processos', name: 'Processos', icon: '📋', type: 'main' },
  { path: '/multas', name: 'Multas', icon: '💰', type: 'main' },
  { path: '/financeiro', name: 'Financeiro', icon: '💰', type: 'main' },
  { path: '/atendimento', name: 'Atendimento', icon: '👥', type: 'main' },
  { path: '/usuarios', name: 'Usuários', icon: '👥', type: 'main' },
  { path: '/relatorios', name: 'Relatórios', icon: '📊', type: 'main' },
  { path: '/configuracoes', name: 'Configurações', icon: '⚙️', type: 'main' },
  
  // Caixas de entrada setoriais\n  { path: '/caixa-entrada', name: 'Caixa Integrada', icon: '[ALL]', type: 'caixas', description: 'Visão unificada da caixa pessoal e do setor' },\n
  
  // Itens do tipo 'juridico'
  { path: '/juridico/analises', name: 'Análises Jurídicas', icon: '📋', type: 'juridico' },
  { path: '/juridico/relatorios', name: 'Relatórios Avançados', icon: '📊', type: 'juridico' },
  { path: '/analise-juridica', name: 'Análise Jurídica', icon: '🔍', type: 'juridico' },
  { path: '/relatorios-executivos', name: 'Relatórios Executivos', icon: '📊', type: 'juridico' },
  { path: '/recursos-defesas', name: 'Recursos e Defesas', icon: '⚖️', type: 'juridico' },
  
  // Itens do tipo 'fiscalizacao'
  { path: '/triagem', name: 'Triagem Inicial', icon: '📝', type: 'fiscalizacao', description: 'Fila de triagem e denúncias' },
  { path: '/fiscalizacao/infracoes', name: 'Autos de Infração', icon: '⚖️', type: 'fiscalizacao' },
  { path: '/ppa', name: 'PPAs', icon: '📋', type: 'fiscalizacao', description: 'Procedimentos Preliminares' },
  { path: '/agenda', name: 'Agenda', icon: '📅', type: 'fiscalizacao' },
  
  // Itens do tipo 'financeiro'
  { path: '/cobranca', name: 'Cobrança', icon: '💳', type: 'financeiro' },
  { path: '/recursos', name: 'Recursos', icon: '📁', type: 'financeiro' },
  
  // Itens do tipo 'atendimento'
  { path: '/atendimento/dashboard', name: 'Dashboard Atendimento', icon: '📊', type: 'atendimento' },
  { path: '/atendimento/dashboard-lgpd', name: 'Painel LGPD', icon: '🛡️', type: 'atendimento' },
  { path: '/atendimento/configuracoes', name: 'Prazos do Atendimento', icon: '🕒', type: 'atendimento' },
  { path: '/atendimento/reclamacoes/nova', name: 'Nova Reclamação', icon: '➕', type: 'atendimento' },
  { path: '/atendimento/reclamacoes', name: 'Lista de Reclamações', icon: '📋', type: 'atendimento' },
  
  // Itens do tipo 'protocolo'
  { path: '/protocolo/lista', name: 'Lista de Protocolos', icon: '📋', type: 'protocolo' },
  { path: '/protocolo/novo', name: 'Novo Protocolo', icon: '➕', type: 'protocolo' },
  { path: '/protocolo/dashboard', name: 'Dashboard Protocolo', icon: '📊', type: 'protocolo' },
  
  // Itens do tipo 'tramitacao'
  { path: '/tramitacao/lista', name: 'Lista de Tramitações', icon: '📤', type: 'tramitacao' },
  { path: '/tramitacao/tramitar', name: 'Tramitar Documento', icon: '📋', type: 'tramitacao' },
  { path: '/tramitacao/nova', name: 'Nova Tramitação', icon: '➕', type: 'tramitacao' },
  { path: '/tramitacao/dashboard', name: 'Dashboard Tramitação', icon: '📊', type: 'tramitacao' },
  { path: '/tramitacao/pendencias', name: 'Pendências', icon: '⏰', type: 'tramitacao' },
  
  // Itens do tipo 'admin'
  { path: '/auditoria', name: 'Auditoria', icon: '🔒', type: 'admin' },
  { path: '/notificacoes', name: 'Notificações', icon: '🔔', type: 'admin' },
  { path: '/legislacao', name: 'Legislação', icon: '📚', type: 'admin' },
  { path: '/produtos', name: 'Produtos', icon: '📦', type: 'admin' },
     
  // Itens do tipo 'autos'
  {
    path: '/fiscalizacao/bancos',
    name: 'Autos de Banco',
    icon: '🏦',
    type: 'autos',
  },
  {
    path: '/fiscalizacao/supermercados',
    name: 'Autos de Supermercado',
    icon: '🛒',
    type: 'autos',
  },
  {
    path: '/fiscalizacao/postos',
    name: 'Autos de Posto',
    icon: '⛽',
    type: 'autos',
  },
  {
    path: '/fiscalizacao/diversos',
    name: 'Autos Diversos',
    icon: '📋',
    type: 'autos',
  },
  {
    path: '/fiscalizacao/apreensao-inutilizacao',
    name: 'Auto Apreensão/Inutilização',
    icon: '📱',
    type: 'autos',
    description: 'Com escaneamento de código de barras'
  },
  // ✅ REMOVIDO: Item duplicado de "Autos de Infração" que estava aqui
];

function Sidebar() {
  const linkClasses = "sidebar-nav-link flex items-center px-4 py-2.5 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200";
  const activeLinkClasses = "bg-blue-500 dark:bg-blue-600 text-white shadow-md";
  
  // Estilo específico para garantir que os emojis sejam exibidos corretamente
  const iconStyle = {
    fontSize: '16px',
    display: 'inline-block',
    minWidth: '20px',
    textAlign: 'center',
    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif'
  };

  // 🔍 DEBUG: Ver quais itens de fiscalização existem
  React.useEffect(() => {
    const fiscalizacaoItems = menuItems.filter(item => item.type === 'fiscalizacao');
    console.log('🔍 DEBUG SIDEBAR - Itens de Fiscalização:', fiscalizacaoItems);
    console.log('🔍 Total de itens:', fiscalizacaoItems.length);
    fiscalizacaoItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.icon} ${item.name} → ${item.path}`);
    });
  }, []);

  return (
    <aside className="w-64 bg-gray-100 dark:bg-[#1a1d21] p-4 flex flex-col h-full transition-colors duration-300">
      {/* HEADER */}
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center transition-colors duration-300">
        PROCON-AM
      </div>
      
      <nav className="flex flex-col space-y-2 flex-1">
        {/* Secao de Caixas de Entrada por Setor */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            Caixas de Entrada
          </h3>
          {menuItems
            .filter(item => item.type === 'caixas')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </NavLink>
            ))}
        </div>

        {/* Itens principais do menu */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            📋 Módulos Principais
          </h3>
          {menuItems
            .filter(item => item.type === 'main')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'autos' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            📋 Autos de Fiscalização
          </h3>
          {menuItems
            .filter(item => item.type === 'autos')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'juridico' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            ⚖️ Jurídico
          </h3>
          {menuItems
            .filter(item => item.type === 'juridico')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'fiscalizacao' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            🔍 Fiscalização
          </h3>
          {menuItems
            .filter(item => item.type === 'fiscalizacao')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'financeiro' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            💰 Financeiro
          </h3>
          {menuItems
            .filter(item => item.type === 'financeiro')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'protocolo' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            📄 Protocolo
          </h3>
          {menuItems
            .filter(item => item.type === 'protocolo')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'tramitacao' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            📤 Tramitação
          </h3>
          {menuItems
            .filter(item => item.type === 'tramitacao')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>

        {/* Itens do tipo 'admin' */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-4">
            🔧 Administração
          </h3>
          {menuItems
            .filter(item => item.type === 'admin')
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
              >
                <span className="sidebar-icon-emoji text-lg mr-3" style={iconStyle}>{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
        </div>
      </nav>

      {/* FOOTER */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Sistema PROCON-AM
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;


