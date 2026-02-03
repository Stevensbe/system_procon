import React from 'react';

const menuItems = [
  // Itens do tipo 'main'
  { path: '/dashboard', name: 'Dashboard', icon: '🏠', type: 'main' },
  { path: '/fiscalizacao', name: 'Fiscalização', icon: '🔍', type: 'main' },
  { path: '/juridico', name: 'Jurídico', icon: '⚖️', type: 'main' },
  { path: '/processos', name: 'Processos', icon: '📋', type: 'main' },
  { path: '/multas', name: 'Multas', icon: '💰', type: 'main' },
  { path: '/financeiro', name: 'Financeiro', icon: '💰', type: 'main' },
  { path: '/atendimento', name: 'Atendimento', icon: '👥', type: 'main' },
  { path: '/usuarios', name: 'Usuários', icon: '👥', type: 'main' },
  { path: '/relatorios', name: 'Relatórios', icon: '📊', type: 'main' },
  { path: '/configuracoes', name: 'Configurações', icon: '⚙️', type: 'main' },
  
  // Caixas de entrada setoriais
  { path: '/caixa-entrada', name: 'Caixa Integrada', icon: '[ALL]', type: 'caixas', description: 'Visão unificada da caixa pessoal e do setor' },
  
  // Itens do tipo 'juridico'
  { path: '/juridico/analises', name: 'Análises Jurídicas', icon: '📋', type: 'juridico' },
  { path: '/juridico/relatorios', name: 'Relatórios Avançados', icon: '📊', type: 'juridico' },
  { path: '/analise-juridica', name: 'Análise Jurídica', icon: '🔍', type: 'juridico' },
  { path: '/relatorios-executivos', name: 'Relatórios Executivos', icon: '📊', type: 'juridico' },
  { path: '/recursos-defesas', name: 'Recursos e Defesas', icon: '⚖️', type: 'juridico' },
  
  // Itens do tipo 'fiscalizacao'
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
];

const MenuDebugPage = () => {
  const fiscalizacaoItems = menuItems.filter(item => item.type === 'fiscalizacao');

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <div className="alert alert-info">
            <h2>🔍 Debug do Menu - Itens de Fiscalização</h2>
            <p>Esta página mostra TODOS os itens do tipo 'fiscalizacao' no array menuItems.</p>
          </div>

          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Itens do Tipo 'fiscalizacao'</h3>
            </div>
            <div className="card-body">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ícone</th>
                    <th>Nome</th>
                    <th>Path</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {fiscalizacaoItems.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td style={{ fontSize: '24px' }}>{item.icon}</td>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.path}</code></td>
                      <td><span className="badge badge-info">{item.type}</span></td>
                      <td>{item.description || <em className="text-muted">sem descrição</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="alert alert-success mt-4">
                <h5>✅ Total de itens 'fiscalizacao': {fiscalizacaoItems.length}</h5>
              </div>

              {fiscalizacaoItems.find(item => item.path === '/ppa') ? (
                <div className="alert alert-success">
                  <h5>✅ Item PPA ENCONTRADO no array!</h5>
                  <pre>{JSON.stringify(fiscalizacaoItems.find(item => item.path === '/ppa'), null, 2)}</pre>
                </div>
              ) : (
                <div className="alert alert-danger">
                  <h5>❌ Item PPA NÃO encontrado no array!</h5>
                  <p>Isso indica um problema no arquivo Sidebar.jsx</p>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header bg-warning text-dark">
              <h3 className="mb-0">🔧 Ações de Debug</h3>
            </div>
            <div className="card-body">
              <div className="btn-group" role="group">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    console.log('Todos os items de fiscalização:', fiscalizacaoItems);
                  }}
                >
                  📋 Log no Console
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    alert('Cache limpo! Recarregando...');
                    window.location.reload(true);
                  }}
                >
                  🗑️ Limpar Cache e Recarregar
                </button>
                <button 
                  className="btn btn-info"
                  onClick={() => {
                    window.location.href = '/ppa';
                  }}
                >
                  🔄 Ir para /ppa
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    window.location.href = '/dashboard';
                  }}
                >
                  🏠 Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header bg-dark text-white">
              <h3 className="mb-0">💻 Comandos para Testar</h3>
            </div>
            <div className="card-body">
              <h5>1. Verificar no Console do Navegador (F12):</h5>
              <pre className="bg-light p-3 rounded">
{`// Copie e cole no console:
const sidebarItems = ${JSON.stringify(fiscalizacaoItems, null, 2)};
console.table(sidebarItems);`}
              </pre>

              <h5 className="mt-3">2. Limpar Cache Agressivo:</h5>
              <pre className="bg-light p-3 rounded">
{`// No console:
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
window.location.reload(true);`}
              </pre>

              <h5 className="mt-3">3. Reiniciar Frontend:</h5>
              <pre className="bg-dark text-white p-3 rounded">
{`# No terminal:
cd frontend
# Pare com Ctrl+C
npm start`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDebugPage;


