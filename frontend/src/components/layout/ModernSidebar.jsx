import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Roles padrão para itens de menu
const DEFAULT_ROLES = ['admin', 'staff'];

// Menu items organizados por categoria
const baseMenuItems = [
  // Dashboard
  { path: '/dashboard', name: 'Dashboard', icon: 'fa-dashboard', type: 'main' },
  
  // Caixas de Entrada Específicas (padronizadas com Sidebar.jsx)
  { path: '/caixa-denuncias', name: 'Caixa Denuncias', icon: 'fa-exclamation-triangle', type: 'caixas', description: 'Denuncias direcionadas para Fiscalizacao' },
  { path: '/caixa-fiscalizacao', name: 'Caixa Fiscalizacao', icon: 'fa-file-text', type: 'caixas', description: 'Documentos internos do setor de Fiscalizacao' },
  { path: '/caixa-juridico-1', name: 'Caixa Juridico 1', icon: 'fa-gavel', type: 'caixas', description: 'Peticoes e analises da primeira instancia juridica' },
  { path: '/caixa-juridico-2', name: 'Caixa Juridico 2', icon: 'fa-legal', type: 'caixas', description: 'Recursos e segunda instancia juridica' },
  { path: '/caixa-daf', name: 'Caixa DAF', icon: 'fa-money', type: 'caixas', description: 'Demandas da diretoria administrativa financeira' },
  
  // Protocolo e Tramitação
  { path: '/protocolo', name: 'Protocolo', icon: 'fa-file-o', type: 'protocolo' },
  { path: '/protocolo/lista', name: 'Lista de Protocolos', icon: 'fa-list', type: 'protocolo' },
  { path: '/protocolo/novo', name: 'Novo Protocolo', icon: 'fa-plus', type: 'protocolo' },
  { path: '/tramitacao', name: 'Tramitação', icon: 'fa-exchange', type: 'tramitacao' },
  { path: '/tramitacao/lista', name: 'Lista de Tramitações', icon: 'fa-list-alt', type: 'tramitacao' },
  { path: '/tramitacao/tramitar', name: 'Tramitar Documento', icon: 'fa-share', type: 'tramitacao' },
  
  // Fiscalização
  { path: '/fiscalizacao', name: 'Fiscalização', icon: 'fa-search', type: 'fiscalizacao' },
  { path: '/triagem', name: 'Triagem Inicial', icon: 'fa-clipboard-list', type: 'fiscalizacao', description: 'Fila de triagem e denúncias' },
  { path: '/fiscalizacao/infracoes', name: 'Autos de Infração', icon: 'fa-balance-scale', type: 'fiscalizacao' },
  { path: '/fiscalizacao/bancos', name: 'Autos de Banco', icon: 'fa-university', type: 'fiscalizacao' },
  { path: '/fiscalizacao/supermercados', name: 'Autos de Supermercado', icon: 'fa-shopping-cart', type: 'fiscalizacao' },
  { path: '/fiscalizacao/postos', name: 'Autos de Posto', icon: 'fa-car', type: 'fiscalizacao' },
  { path: '/fiscalizacao/diversos', name: 'Autos Diversos', icon: 'fa-file', type: 'fiscalizacao' },
  { path: '/fiscalizacao/apreensao-inutilizacao', name: 'Auto Apreensão', icon: 'fa-ban', type: 'fiscalizacao', description: 'Com escaneamento' },
  { path: '/ppa', name: 'PPAs', icon: 'fa-clipboard', type: 'fiscalizacao', description: 'Procedimentos Preliminares' },
  { path: '/agenda', name: 'Agenda', icon: 'fa-calendar', type: 'fiscalizacao' },
  
  // Jurídico
  { path: '/juridico', name: 'Jurídico', icon: 'fa-balance-scale', type: 'juridico' },
  { path: '/juridico/analises', name: 'Análises Jurídicas', icon: 'fa-search-plus', type: 'juridico' },
  { path: '/analise-juridica', name: 'Análise Jurídica', icon: 'fa-gavel', type: 'juridico' },
  { path: '/recursos-defesas', name: 'Recursos e Defesas', icon: 'fa-legal', type: 'juridico' },
  { path: '/legislacao', name: 'Legislação', icon: 'fa-book', type: 'juridico' },
  
  // Financeiro
  { path: '/financeiro', name: 'Financeiro', icon: 'fa-line-chart', type: 'financeiro' },
  { path: '/multas', name: 'Multas', icon: 'fa-money', type: 'financeiro' },
  { path: '/cobranca', name: 'Cobrança', icon: 'fa-credit-card', type: 'financeiro' },
  { path: '/recursos', name: 'Recursos', icon: 'fa-folder', type: 'financeiro' },
  
  // Processos
  { path: '/processos', name: 'Processos', icon: 'fa-tasks', type: 'processos' },
  { path: '/peticionamento', name: 'Peticionamento', icon: 'fa-file-text-o', type: 'processos' },
  
  // Atendimento
  { path: '/atendimento/filas', name: 'Fila de Atendimento', icon: 'fa-ticket', type: 'atendimento' },
  { path: '/atendimento/dashboard-lgpd', name: 'Painel LGPD', icon: 'fa-user-shield', type: 'atendimento' },
  { path: '/atendimento/configuracoes', name: 'Configurar Prazos', icon: 'fa-clock', type: 'atendimento' },
  { path: '/atendimento/regras-distribuicao', name: 'Regras de Distribuição', icon: 'fa-random', type: 'atendimento' },

  // Relatórios
  { path: '/relatorios', name: 'Relatórios', icon: 'fa-bar-chart', type: 'relatorios' },
  { path: '/relatorios-executivos', name: 'Relatórios Executivos', icon: 'fa-pie-chart', type: 'relatorios' },
  
  // Administração
  { path: '/usuarios', name: 'Usuários', icon: 'fa-users', type: 'admin' },
  { path: '/ti', name: 'TI', icon: 'fa-desktop', type: 'admin', roles: ['admin'] },
  { path: '/configuracoes', name: 'Configurações', icon: 'fa-cogs', type: 'admin' },
  { path: '/auditoria', name: 'Auditoria', icon: 'fa-shield', type: 'admin' },
  { path: '/notificacoes', name: 'Notificações', icon: 'fa-bell', type: 'admin' },
  { path: '/produtos', name: 'Produtos', icon: 'fa-cube', type: 'admin' },
  
  // Portais Externos
  { path: '/portal-empresa', name: 'Portal Empresa', icon: 'fa-building', type: 'portais', roles: ['empresa'] },
  { path: '/portal-empresa/reclamacoes', name: 'Minhas Reclamacoes', icon: 'fa-list', type: 'portais', roles: ['empresa', 'admin', 'staff'] },
  { path: '/portal-consumidor', name: 'Portal Consumidor', icon: 'fa-user-circle', type: 'portais', roles: ['consumer', 'admin', 'staff'] },
  { path: '/portal-consumidor/feedbacks', name: 'Feedbacks Consumidor', icon: 'fa-comments', type: 'portais', roles: ['admin', 'staff'] },
  { path: '/portal-consumidor/tickets', name: 'Tickets Consumidor', icon: 'fa-life-ring', type: 'portais', roles: ['admin', 'staff'] },
];


const menuItems = baseMenuItems.map((item) => ({
  ...item,
  roles: item.roles || DEFAULT_ROLES,
}));

// Configuração das categorias
const categories = {
  main: { title: 'Dashboard', icon: 'fa-dashboard' },
  caixas: { title: 'Caixas de Entrada', icon: 'fa-inbox' },
  protocolo: { title: 'Protocolo', icon: 'fa-file-o' },
  tramitacao: { title: 'Tramitação', icon: 'fa-exchange' },
  fiscalizacao: { title: 'Fiscalização', icon: 'fa-search' },
  juridico: { title: 'Jurídico', icon: 'fa-balance-scale' },
  financeiro: { title: 'Financeiro', icon: 'fa-line-chart' },
  processos: { title: 'Processos', icon: 'fa-tasks' },
  atendimento: { title: 'Atendimento', icon: 'fa-headset' },
  relatorios: { title: 'Relatórios', icon: 'fa-bar-chart' },
  admin: { title: 'Administração', icon: 'fa-cogs' },
  portais: { title: 'Portais Externos', icon: 'fa-globe' },
};

function ModernSidebar({ isOpen = false, onClose }) {
  const [expandedCategories, setExpandedCategories] = useState({
    caixas: true, // Caixas sempre expandidas por padrão
    main: true,   // Dashboard sempre expandido
  });

  const { role } = useAuth();
  const effectiveRole = role || 'admin';
  const filteredItems = menuItems.filter((item) => item.roles.includes(effectiveRole));
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isCategoryExpanded = (category) => {
    return expandedCategories[category] || false;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div id="leftside-navigation" className="nano">
        <ul className="nano-content">
          {/* Logo/Header */}
          <li className="sidebar-header">
            <div className="sidebar-brand">
              <i className="fa fa-shield"></i>
              <span>PROCON-AM</span>
            </div>
          </li>

          {/* Menu Items por Categoria */}
          {Object.entries(categories).map(([categoryKey, category]) => {
            const items = groupedItems[categoryKey] || [];
            if (items.length === 0) return null;

            const isExpanded = isCategoryExpanded(categoryKey);
            const hasSubItems = items.length > 1;

            return (
              <li key={categoryKey} className={hasSubItems ? 'sub-menu' : ''}>
                {hasSubItems ? (
                  <a 
                    href="javascript:void(0);" 
                    onClick={() => toggleCategory(categoryKey)}
                    className={isExpanded ? 'active' : ''}
                  >
                    <i className={`fa ${category.icon}`}></i>
                    <span>{category.title}</span>
                    <i className={`arrow fa fa-angle-${isExpanded ? 'down' : 'right'} pull-right`}></i>
                  </a>
                ) : (
                  <NavLink to={items[0].path}>
                    <i className={`fa ${category.icon}`}></i>
                    <span>{category.title}</span>
                  </NavLink>
                )}
                
                {hasSubItems && (
                  <ul style={{ display: isExpanded ? 'block' : 'none' }}>
                    {items.map((item) => (
                      <li key={item.path}>
                        <NavLink to={item.path} onClick={onClose}>
                          <i className={`fa ${item.icon}`}></i>
                          <span>{item.name}</span>
                          {item.description && (
                            <small className="item-description">{item.description}</small>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

          {/* Footer */}
          <li className="sidebar-footer">
            <div className="footer-info">
              <small>Sistema PROCON-AM</small>
              <small>v2.0.0</small>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default ModernSidebar;
