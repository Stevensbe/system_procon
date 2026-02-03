// Utilitário para verificar se todos os módulos estão funcionando
export const checkModules = () => {
  const modules = {
    // Módulos principais
    dashboard: () => import('../pages/Dashboard'),
    fiscalizacao: () => import('../pages/fiscalizacao/FiscalizacaoHomePage'),
    juridico: () => import('../pages/juridico/DashboardJuridico'),
    processos: () => import('../pages/processos/ProcessoListPage'),
    multas: () => import('../pages/Multas'),
    financeiro: () => import('../pages/Financeiro'),
    usuarios: () => import('../pages/usuarios/UsuariosDashboard'),
    relatorios: () => import('../pages/relatorios/RelatoriosDashboard'),
    configuracoes: () => import('../pages/configuracoes/ConfiguracoesDashboard'),
    
    // Módulos jurídicos
    analiseJuridica: () => import('../pages/analise-juridica/AnaliseJuridicaDashboard'),
    relatoriosExecutivos: () => import('../pages/relatorios-executivos/RelatoriosExecutivosDashboard'),
    recursosDefesas: () => import('../pages/recursos-defesas/RecursosDefesasDashboard'),
    
    // Módulos de fiscalização
    agenda: () => import('../pages/agenda/AgendaDashboard'),
    consultaPublica: () => import('../pages/consulta-publica/ConsultaPublicaDashboard'),
    
    // Módulos financeiros
    cobranca: () => import('../pages/cobranca/CobrancaDashboard'),
    recursos: () => import('../pages/recursos/RecursosDashboard'),
    tramitacao: () => import('../pages/tramitacao/TramitacaoDashboard'),
    
    // Módulos administrativos
    auditoria: () => import('../pages/auditoria/AuditoriaDashboard'),
    notificacoes: () => import('../pages/notificacoes/NotificacoesDashboard'),
    legislacao: () => import('../pages/legislacao/LegislacaoDashboard'),
    produtos: () => import('../pages/produtos/ProdutosPage'),
  };

  const results = {};
  
  Object.entries(modules).forEach(([name, importFn]) => {
    try {
      // Testa se o módulo pode ser importado
      importFn().then(() => {
        results[name] = { status: 'success', message: 'Módulo carregado com sucesso' };
      }).catch((error) => {
        results[name] = { status: 'error', message: `Erro ao carregar: ${error.message}` };
      });
    } catch (error) {
      results[name] = { status: 'error', message: `Erro ao importar: ${error.message}` };
    }
  });

  return results;
};

// Função para verificar se o servidor está rodando
export const checkServerStatus = async () => {
  try {
    const response = await fetch('/api/health/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return { status: 'success', message: 'Servidor Django funcionando' };
    } else {
      return { status: 'error', message: `Servidor retornou status ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', message: `Erro de conexão: ${error.message}` };
  }
};

// Função para verificar todas as rotas
export const checkRoutes = () => {
  const routes = [
    '/dashboard',
    '/fiscalizacao',
    '/juridico',
    '/processos',
    '/multas',
    '/financeiro',
    '/usuarios',
    '/relatorios',
    '/configuracoes',
    '/analise-juridica',
    '/relatorios-executivos',
    '/recursos-defesas',
    '/agenda',
    '/consulta-publica',
    '/cobranca',
    '/recursos',
    '/tramitacao',
    '/auditoria',
    '/notificacoes',
    '/legislacao',
    '/produtos'
  ];

  return routes;
};

// Função principal de diagnóstico
export const runDiagnostics = async () => {
  console.log('🔍 Iniciando diagnóstico do sistema...');
  
  // Verificar módulos
  console.log('📦 Verificando módulos...');
  const moduleResults = checkModules();
  
  // Verificar servidor
  console.log('🌐 Verificando servidor...');
  const serverStatus = await checkServerStatus();
  
  // Verificar rotas
  console.log('🛣️ Verificando rotas...');
  const routes = checkRoutes();
  
  const diagnostics = {
    modules: moduleResults,
    server: serverStatus,
    routes: routes,
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Resultado do diagnóstico:', diagnostics);
  
  return diagnostics;
};
