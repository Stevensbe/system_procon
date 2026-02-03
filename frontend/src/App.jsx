import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// ✅ Importar função de sincronização offline
import { syncOfflineQueue } from './utils/offlineQueue';

// ✅ Importar componentes de monitoramento
import SystemMonitor from './components/common/SystemMonitor';
import monitoringService from './services/monitoringService';

// =========================================================================
// === COMPONENTES PRINCIPAIS (CARREGAMENTO IMEDIATO) ===
// =========================================================================
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorFallback from './components/common/ErrorFallback';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// ✅ CORREÇÃO: ProtectedRoute integrado diretamente
// import { useAuth, AuthState } from './context/AuthContext'; // Django Auth (desativado)
import { useAuth, AuthState } from './context/SupabaseAuthContext'; // Supabase Auth (ATIVO)

// ✅ COMPONENTES DE CONTROLE DE ROTAS
function ProtectedRoute({ children, allowedRoles }) {
  const { status, isLoading, isAuthenticated, role, getRedirectPath } = useAuth();

  if (status === AuthState.LOADING || isLoading) {
    return <LoadingSpinner message="Validando sessão..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { status, isLoading, isAuthenticated, role, getRedirectPath } = useAuth();

  if (status === AuthState.LOADING || isLoading) {
    return <LoadingSpinner message="Carregando sessão..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return children;
}

// =========================================================================
// === LAZY LOADING OTIMIZADO COM PRELOAD E ERROR BOUNDARY ===
// =========================================================================

// ✅ Função para lazy loading com retry e preload
const lazyLoad = (importFunc, retries = 3) => {
  return React.lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (attemptNumber) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            console.warn(`Tentativa ${attemptNumber} falhou:`, error);
            if (attemptNumber < retries) {
              setTimeout(() => attempt(attemptNumber + 1), 1000 * attemptNumber);
            } else {
              reject(error);
            }
          });
      };
      attempt(1);
    });
  });
};

// ✅ Função para preload de componentes
const preloadComponent = (importFunc) => {
  return () => {
    const Component = lazyLoad(importFunc);
    // Preload em background
    importFunc();
    return Component;
  };
};

// --- Páginas de Autenticação (CRÍTICAS - CARREGAMENTO IMEDIATO) ---
const Login = lazyLoad(() => import('./pages/auth/Login'));
const Logout = lazyLoad(() => import('./pages/auth/Logout'));

// --- Páginas de Autenticação Supabase (NOVO) ---
const SupabaseLogin = lazyLoad(() => import('./pages/auth/SupabaseLogin'));
const SupabaseRegister = lazyLoad(() => import('./pages/auth/SupabaseRegister'));
const ForgotPassword = lazyLoad(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyLoad(() => import('./pages/auth/ResetPassword'));
const AuthCallback = lazyLoad(() => import('./pages/auth/AuthCallback'));

// --- Portal do Cidadão (PÁGINA PÚBLICA) ---
const PortalCidadao = lazyLoad(() => import('./pages/PortalCidadao'));
const PortalEmpresa = lazyLoad(() => import('./pages/portal/PortalEmpresa'));
const PortalEmpresaLogin = lazyLoad(() => import('./pages/portal/PortalEmpresaLogin'));
const PortalEmpresaSolicitacao = lazyLoad(() => import('./pages/portal/PortalEmpresaSolicitacao'));
const PortalEmpresaSolicitacoesAdmin = lazyLoad(() => import('./pages/portal/PortalEmpresaSolicitacoesAdmin'));
const PortalEmpresaReclamacoes = lazyLoad(() => import('./pages/portal/PortalEmpresaReclamacoes'));
const PortalConsumidor = lazyLoad(() => import('./pages/portal/PortalConsumidor'));
const PortalConsumidorFeedbacksAdmin = lazyLoad(() => import('./pages/portal/PortalConsumidorFeedbacksAdmin'));
const PortalConsumidorTicketsAdmin = lazyLoad(() => import('./pages/portal/PortalConsumidorTicketsAdmin'));

// --- Dashboard (CRÍTICO - CARREGAMENTO IMEDIATO) ---
const Dashboard = lazyLoad(() => import('./pages/Dashboard'));

// --- Fiscalização Geral (PRELOAD EM BACKGROUND) ---
const FiscalizacaoHomePage = preloadComponent(() => import('./pages/fiscalizacao/FiscalizacaoHomePage'));
const SelecaoAutoPage = preloadComponent(() => import('./pages/fiscalizacao/SelecaoAutoPage'));

// --- Módulo de Fiscalização (PRELOAD EM BACKGROUND) ---
const FiscalizacaoDashboard = preloadComponent(() => import('./pages/fiscalizacao/FiscalizacaoDashboard'));
const AutoForm = preloadComponent(() => import('./pages/fiscalizacao/AutoForm'));
const AutoList = preloadComponent(() => import('./pages/fiscalizacao/AutoList'));
const TriagemListPage = lazyLoad(() => import('./pages/triagem/TriagemListPage'));

// --- Módulo de Usuários (LAZY LOADING PADRÃO) ---
const UsuariosDashboard = lazyLoad(() => import('./pages/usuarios/UsuariosDashboard'));
const UsuariosList = lazyLoad(() => import('./pages/usuarios/UsuariosList'));
const UsuarioForm = lazyLoad(() => import('./pages/usuarios/UsuarioForm'));
const SupabaseUsersAdmin = lazyLoad(() => import('./pages/usuarios/SupabaseUsersAdmin'));

// --- Autos de Banco (LAZY LOADING PADRÃO) ---
const AutoBancoListPage = lazyLoad(() => import('./pages/fiscalizacao/banco/AutoBancoListPage'));
const AutoBancoDetailPage = lazyLoad(() => import('./pages/fiscalizacao/banco/AutoBancoDetailPage'));
const AutoBancoCreatePage = lazyLoad(() => import('./pages/fiscalizacao/banco/AutoBancoCreatePage'));
const AutoBancoEditPage = lazyLoad(() => import('./pages/fiscalizacao/banco/AutoBancoEditPage'));

// --- Autos de Supermercado (LAZY LOADING PADRÃO) ---
const AutoSupermercadoListPage = lazyLoad(() => import('./pages/fiscalizacao/supermercado/AutoSupermercadoListPage'));
const AutoSupermercadoDetailPage = lazyLoad(() => import('./pages/fiscalizacao/supermercado/AutoSupermercadoDetailPage'));
const AutoSupermercadoCreatePage = lazyLoad(() => import('./pages/fiscalizacao/supermercado/AutoSupermercadoCreatePage'));
const AutoSupermercadoEditPage = lazyLoad(() => import('./pages/fiscalizacao/supermercado/AutoSupermercadoEditPage'));

// --- Autos de Posto (LAZY LOADING PADRÃO) ---
const AutoPostoListPage = lazyLoad(() => import('./pages/fiscalizacao/posto/AutoPostoListPage'));
const AutoPostoDetailPage = lazyLoad(() => import('./pages/fiscalizacao/posto/AutoPostoDetailPage'));
const AutoPostoCreatePage = lazyLoad(() => import('./pages/fiscalizacao/posto/AutoPostoCreatePage'));
const AutoPostoEditPage = lazyLoad(() => import('./pages/fiscalizacao/posto/AutoPostoEditPage'));

// --- Autos Diversos (LAZY LOADING PADRÃO) ---
const AutoDiversosListPage = lazyLoad(() => import('./pages/fiscalizacao/diversos/AutoDiversosListPage'));
const AutoDiversosDetailPage = lazyLoad(() => import('./pages/fiscalizacao/diversos/AutoDiversosDetailPage'));
const AutoDiversosCreatePage = lazyLoad(() => import('./pages/fiscalizacao/diversos/AutoDiversosCreatePage'));
const AutoDiversosEditPage = lazyLoad(() => import('./pages/fiscalizacao/diversos/AutoDiversosEditPage'));

// --- Autos de Infração (LAZY LOADING PADRÃO) ---
const AutoInfracaoListPage = lazyLoad(() => import('./pages/fiscalizacao/infracao/AutoInfracaoListPage'));
const AutoInfracaoDetailPage = lazyLoad(() => import('./pages/fiscalizacao/infracao/AutoInfracaoDetailPage'));
const AutoInfracaoCreatePage = lazyLoad(() => import('./pages/fiscalizacao/infracao/AutoInfracaoCreatePage'));
const AutoInfracaoEditPage = lazyLoad(() => import('./pages/fiscalizacao/infracao/AutoInfracaoEditPage'));

// --- Autos de Apreensão/Inutilização (LAZY LOADING PADRÃO) ---
const AutoApreensaoPage = lazyLoad(() => import('./pages/fiscalizacao/AutoApreensaoPage'));
const NotificacoesFiscalizacaoPage = lazyLoad(() => import('./pages/fiscalizacao/NotificacoesFiscalizacaoPage'));

// --- Teste de Código de Barras (LAZY LOADING PADRÃO) ---
const BarcodeTest = lazyLoad(() => import('./components/fiscalizacao/BarcodeTest'));
const BarcodeTestSimple = lazyLoad(() => import('./components/fiscalizacao/BarcodeTestSimple'));
const BarcodeTestAPI = lazyLoad(() => import('./components/fiscalizacao/BarcodeTestAPI'));

// --- Tramitação ---
const TramitacaoDashboard = React.lazy(() => import('./pages/tramitacao/TramitacaoDashboard'));

// --- Processos Administrativos ---
const ProcessoListPage = React.lazy(() => import('./pages/processos/ProcessoListPage'));
const ProcessoDetailPage = React.lazy(() => import('./pages/processos/ProcessoDetailPage'));
const ProcessoDashboard = React.lazy(() => import('./pages/processos/ProcessoDashboard'));

// --- Multas ---
const MultasPage = React.lazy(() => import('./pages/Multas'));

// --- Módulo Financeiro ---
const Financeiro = React.lazy(() => import('./pages/Financeiro'));

// --- Novos Módulos Implementados ---
const EmpresasPage = React.lazy(() => import('./pages/empresas/EmpresasPage'));
const NotificacoesPage = React.lazy(() => import('./pages/notificacoes/NotificacoesPage'));
const NotificacoesDashboard = React.lazy(() => import('./pages/notificacoes/NotificacoesDashboard'));
// --- Módulo de Recursos (Novo) ---
const RecursosDashboard = React.lazy(() => import('./pages/recursos/RecursosDashboard'));
const RecursosList = React.lazy(() => import('./pages/recursos/RecursosList'));
const RecursoForm = React.lazy(() => import('./pages/recursos/RecursoForm'));

// --- Módulo PPA - Procedimento Preliminar Administrativo (Novo) ---
const PPAListPage = React.lazy(() => import('./pages/ppa/PPAListPage'));
const PPACreatePage = React.lazy(() => import('./pages/ppa/PPACreatePage'));
const PPADetailPage = React.lazy(() => import('./pages/ppa/PPADetailPage'));
const PPAEditPage = React.lazy(() => import('./pages/ppa/PPAEditPage'));
const PPADebugPage = React.lazy(() => import('./pages/ppa/PPADebugPage'));

// --- Debug do Menu ---
const MenuDebugPage = React.lazy(() => import('./pages/MenuDebugPage'));

// --- Módulo de Atendimento (Cópia do Pro Consumidor) ---
const AtendimentoDashboard = lazyLoad(() => import('./pages/atendimento/AtendimentoDashboard'));
const AtendimentoLgpdDashboard = lazyLoad(() => import('./pages/atendimento/AtendimentoLgpdDashboard'));
const AtendimentoConfiguracaoPrazos = lazyLoad(() => import('./pages/atendimento/AtendimentoConfiguracaoPrazos'));
const AtendimentoRegrasDistribuicao = lazyLoad(() => import('./pages/atendimento/AtendimentoRegrasDistribuicao'));
const AtendimentoFilaGuiche = lazyLoad(() => import('./pages/atendimento/FilaGuiche'));
const AtendimentoPainelTv = lazyLoad(() => import('./pages/atendimento/PainelTv'));
const NovaReclamacao = lazyLoad(() => import('./pages/atendimento/NovaReclamacao'));
const DetalhesReclamacao = lazyLoad(() => import('./pages/atendimento/DetalhesReclamacao'));

// --- Módulo de Cobrança (Novo) ---
const CobrancaDashboard = React.lazy(() => import('./pages/cobranca/CobrancaDashboard'));
const BoletosList = React.lazy(() => import('./pages/cobranca/BoletosList'));
const BoletoForm = React.lazy(() => import('./pages/cobranca/BoletoForm'));
const BoletoDetail = React.lazy(() => import('./pages/cobranca/BoletoDetail'));
const PagamentoBoleto = React.lazy(() => import('./pages/cobranca/PagamentoBoleto'));
const CobrancaPage = React.lazy(() => import('./pages/cobranca/CobrancaPage'));
const CobrancaForm = React.lazy(() => import('./pages/cobranca/CobrancaForm'));
const GrmList = React.lazy(() => import('./pages/cobranca/GrmList'));
const GrmForm = React.lazy(() => import('./pages/cobranca/GrmForm'));
const GrmDetail = React.lazy(() => import('./pages/cobranca/GrmDetail'));

// --- Módulo de Remessas (Novo) ---
const RemessasList = React.lazy(() => import('./pages/cobranca/RemessasList'));
const RemessaDetail = React.lazy(() => import('./pages/cobranca/RemessaDetail'));
const RemessaForm = React.lazy(() => import('./pages/cobranca/RemessaForm'));
const AuditoriaPage = React.lazy(() => import('./pages/auditoria/AuditoriaPage'));
const AgendaPage = React.lazy(() => import('./pages/agenda/AgendaPage'));
const ConsultaPublicaPage = React.lazy(() => import('./pages/consulta-publica/ConsultaPublicaPage'));
const ProdutosPage = React.lazy(() => import('./pages/produtos/ProdutosPage'));

// --- Componentes de Demonstração ---
const IrregularidadesDemo = React.lazy(() => import('./components/fiscalizacao/IrregularidadesDemo'));

// --- Módulo Jurídico ---
const DashboardJuridico = React.lazy(() => import('./pages/juridico/DashboardJuridico'));
const ListaProcessos = React.lazy(() => import('./pages/juridico/ListaProcessos'));
const DetalheProcesso = React.lazy(() => import('./pages/juridico/DetalheProcesso'));
const FormProcesso = React.lazy(() => import('./pages/juridico/FormProcesso'));
const ListaAnalises = React.lazy(() => import('./pages/juridico/ListaAnalises'));
const RelatoriosAvancados = React.lazy(() => import('./pages/juridico/RelatoriosAvancados'));
const ConfiguracoesJuridicas = React.lazy(() => import('./pages/juridico/ConfiguracoesJuridicas'));
const DocumentosJuridicos = React.lazy(() => import('./pages/juridico/DocumentosJuridicos'));
const HistoricosJuridicos = React.lazy(() => import('./pages/juridico/HistoricosJuridicos'));
const PeticoesJuridico1 = React.lazy(() => import('./pages/juridico/PeticoesJuridico1'));
const PeticoesJuridico2 = React.lazy(() => import('./pages/juridico/PeticoesJuridico2'));

// --- Módulo de Relatórios (Novo) ---
const RelatoriosDashboard = React.lazy(() => import('./pages/relatorios/RelatoriosDashboard'));
const RelatoriosList = React.lazy(() => import('./pages/relatorios/RelatoriosList'));
const RelatorioForm = React.lazy(() => import('./pages/relatorios/RelatorioForm'));

// --- Módulo de Auditoria (Novo) ---
const AuditoriaDashboard = React.lazy(() => import('./pages/auditoria/AuditoriaDashboard'));
const AuditoriaList = React.lazy(() => import('./pages/auditoria/AuditoriaList'));

// --- Módulo de Agenda (Novo) ---
const AgendaDashboard = React.lazy(() => import('./pages/agenda/AgendaDashboard'));

// --- Módulo de Consulta Pública (Novo) ---
const ConsultaPublicaDashboard = React.lazy(() => import('./pages/consulta-publica/ConsultaPublicaDashboard'));

// --- Módulo de Análise Jurídica (Novo) ---
const AnaliseJuridicaDashboard = React.lazy(() => import('./pages/analise-juridica/AnaliseJuridicaDashboard'));
const AnaliseJuridicaForm = React.lazy(() => import('./pages/analise-juridica/AnaliseJuridicaForm'));

// --- Módulo de Relatórios Executivos (Novo) ---
const RelatoriosExecutivosDashboard = React.lazy(() => import('./pages/relatorios-executivos/RelatoriosExecutivosDashboard'));

// --- Módulo de Recursos e Defesas (Novo) ---
const RecursosDefesasDashboard = React.lazy(() => import('./pages/recursos-defesas/RecursosDefesasDashboard'));
const RecursoDefesaForm = React.lazy(() => import('./pages/recursos-defesas/RecursoForm'));

// --- Módulo de Legislação (Novo) ---
const LegislacaoDashboard = React.lazy(() => import('./pages/legislacao/LegislacaoDashboard'));

// --- Módulo de Caixa de Entrada por Setor (Novo) ---
const CaixaEntrada = lazyLoad(() => import('./pages/caixa-entrada/CaixaEntrada'));

// --- Módulo de Configurações (Novo) ---
const ConfiguracoesDashboard = React.lazy(() => import('./pages/configuracoes/ConfiguracoesDashboard'));
const ConfiguracoesSistema = React.lazy(() => import('./pages/configuracoes/ConfiguracoesSistema'));
const ParametrosGerais = React.lazy(() => import('./pages/configuracoes/ParametrosGerais'));
const BackupRestauracao = React.lazy(() => import('./pages/configuracoes/BackupRestauracao'));
const LogsSistema = React.lazy(() => import('./pages/configuracoes/LogsSistema'));

// --- Módulo de TI (Novo) ---
const TIDashboard = React.lazy(() => import('./pages/ti/TIDashboard'));

// --- Outras Páginas ---
const UsuariosPage = React.lazy(() => import('./pages/Usuarios'));
const RelatoriosPage = React.lazy(() => import('./pages/relatorios/RelatoriosPage'));
const ConfiguracoesPage = React.lazy(() => import('./pages/configuracoes/ConfiguracoesPage'));
const PerfilPage = React.lazy(() => import('./pages/perfil/PerfilPage'));
const AjudaPage = React.lazy(() => import('./pages/ajuda/AjudaPage'));
const NotFoundPage = React.lazy(() => import('./pages/errors/NotFoundPage'));

// =========================================================================
// === COMPONENTE DE LOADING PERSONALIZADO ===
// =========================================================================
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Carregando página...</p>
    </div>
  </div>
);

// ✅ FALLBACK SIMPLES CASO LoadingSpinner NÃO EXISTA
const SimpleLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Carregando formulário...</p>
      <p className="mt-2 text-sm text-gray-400">Aguarde, carregando arquivo grande...</p>
    </div>
  </div>
);

// ✅ FALLBACK SIMPLES PARA ERRO
const SimpleErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h2>
      <p className="text-gray-600 mb-6">
        {error?.message || 'Erro inesperado na aplicação'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

// =========================================================================
// === COMPONENTE PRINCIPAL ===
// =========================================================================
function App() {
  useEffect(() => {
    // Tenta sincronizar quando o app carrega, caso já esteja online
    if (navigator.onLine) {
      syncOfflineQueue().catch(error => {
        console.error('Erro na sincronização inicial:', error);
      });
    }

    // Inicializar monitoramento
    monitoringService.trackPageView('app_start');

    // Sincronizar eventos de monitoramento armazenados
    monitoringService.syncStoredEvents();

    // Configurar sincronização automática quando voltar online
    const handleOnline = () => {
      monitoringService.syncStoredEvents();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>

            {/* ===== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ===== */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/logout" element={<Logout />} />

            {/* ===== ROTAS DE AUTENTICAÇÃO SUPABASE (NOVAS) ===== */}
            <Route
              path="/auth/login"
              element={
                <PublicRoute>
                  <SupabaseLogin />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/register"
              element={
                <PublicRoute>
                  <SupabaseRegister />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route
              path="/painel-atendimento/:balcaoId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <AtendimentoPainelTv />
                </ProtectedRoute>
              }
            />

            {/* ===== PORTAL DO CIDADÃO (PÁGINA PÚBLICA) ===== */}
            <Route path="/portal-cidadao" element={<PortalCidadao />} />
            <Route path="/portal-empresa/login" element={<PortalEmpresaLogin />} />
            <Route path="/portal-empresa/solicitacao" element={<PortalEmpresaSolicitacao />} />

            {/* ===== REDIRECIONAMENTO RAIZ ===== */}
            <Route path="/" element={<Navigate to="/caixa-entrada" replace />} />

            {/* ===== ROTAS PROTEGIDAS (COM LAYOUT) ===== */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Layout />
                </ProtectedRoute>
              }
            >

              {/* === DASHBOARD === */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* === FISCALIZAÇÃO === */}
              <Route path="fiscalizacao" element={<FiscalizacaoHomePage />} />
              <Route path="fiscalizacao/dashboard" element={<FiscalizacaoDashboard />} />
              <Route path="fiscalizacao/selecao" element={<SelecaoAutoPage />} />
              <Route path="fiscalizacao/autos" element={<AutoList />} />
              <Route path="triagem" element={<TriagemListPage />} />

              {/* === TESTE DE CÓDIGO DE BARRAS === */}
              <Route path="fiscalizacao/teste-barcode" element={<BarcodeTest />} />
              <Route path="fiscalizacao/teste-simples" element={<BarcodeTestSimple />} />
              <Route path="fiscalizacao/teste-api" element={<BarcodeTestAPI />} />
              <Route path="fiscalizacao/novo-auto" element={<AutoForm />} />
              <Route path="fiscalizacao/auto/:id/editar" element={<AutoForm />} />

              {/* === AUTOS DE BANCO === */}
              <Route path="fiscalizacao/bancos" element={<AutoBancoListPage />} />
              <Route path="fiscalizacao/bancos/novo" element={<AutoBancoCreatePage />} />
              <Route path="fiscalizacao/bancos/:id" element={<AutoBancoDetailPage />} />
              <Route path="fiscalizacao/bancos/:id/editar" element={<AutoBancoEditPage />} />

              {/* === AUTOS DE SUPERMERCADO === */}
              <Route path="fiscalizacao/supermercados" element={<AutoSupermercadoListPage />} />
              <Route path="fiscalizacao/supermercados/novo" element={<AutoSupermercadoCreatePage />} />
              <Route path="fiscalizacao/supermercados/:id" element={<AutoSupermercadoDetailPage />} />
              <Route path="fiscalizacao/supermercados/:id/editar" element={<AutoSupermercadoEditPage />} />

              {/* === AUTOS DE POSTO === */}
              <Route path="fiscalizacao/postos" element={<AutoPostoListPage />} />
              <Route path="fiscalizacao/postos/novo" element={<AutoPostoCreatePage />} />
              <Route path="fiscalizacao/postos/:id" element={<AutoPostoDetailPage />} />
              <Route path="fiscalizacao/postos/:id/editar" element={<AutoPostoEditPage />} />

              {/* === AUTOS DIVERSOS === */}
              <Route path="fiscalizacao/diversos" element={<AutoDiversosListPage />} />
              <Route path="fiscalizacao/diversos/novo" element={<AutoDiversosCreatePage />} />
              <Route path="fiscalizacao/diversos/:id" element={<AutoDiversosDetailPage />} />
              <Route path="fiscalizacao/diversos/:id/editar" element={<AutoDiversosEditPage />} />

              {/* === AUTOS DE INFRAÇÃO === */}
              <Route path="fiscalizacao/infracoes" element={<AutoInfracaoListPage />} />
              <Route path="fiscalizacao/infracoes/novo" element={<AutoInfracaoCreatePage />} />
              <Route path="fiscalizacao/infracoes/:id" element={<AutoInfracaoDetailPage />} />
              <Route path="fiscalizacao/infracoes/:id/editar" element={<AutoInfracaoEditPage />} />

              {/* === AUTOS DE APREENSÃO/INUTILIZAÇÃO === */}
              <Route path="fiscalizacao/apreensao-inutilizacao" element={<AutoApreensaoPage />} />
              <Route path="fiscalizacao/apreensao-inutilizacao/:id" element={<AutoApreensaoPage />} />
              <Route path="fiscalizacao/notificacoes" element={<NotificacoesFiscalizacaoPage />} />

              {/* === MÓDULO DE USUÁRIOS === */}
              <Route path="usuarios" element={<SupabaseUsersAdmin />} />
              <Route path="usuarios/admin" element={<SupabaseUsersAdmin />} />
              <Route path="usuarios/dashboard" element={<UsuariosDashboard />} />
              <Route path="usuarios/lista" element={<UsuariosList />} />
              <Route path="usuarios/novo" element={<UsuarioForm />} />
              <Route path="usuarios/:id/editar" element={<UsuarioForm />} />

              {/* === MÓDULO DE RELATÓRIOS === */}
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="relatorios/dashboard" element={<RelatoriosDashboard />} />
              <Route path="relatorios/lista" element={<RelatoriosList />} />
              <Route path="relatorios/gerar" element={<RelatorioForm />} />
              <Route path="relatorios/:id" element={<RelatoriosList />} />

              {/* === MÓDULO DE CONFIGURAÇÕES === */}
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="configuracoes/dashboard" element={<ConfiguracoesDashboard />} />
              <Route path="configuracoes/sistema" element={<ConfiguracoesSistema />} />
              <Route path="configuracoes/parametros" element={<ParametrosGerais />} />
              <Route path="configuracoes/backup" element={<BackupRestauracao />} />
              <Route path="configuracoes/logs" element={<LogsSistema />} />

              {/* === MÓDULO DE TI === */}
              <Route path="ti" element={<TIDashboard />} />

              {/* === MÓDULO DE CAIXA DE ENTRADA POR SETOR === */}
              <Route path="caixa-entrada" element={<CaixaEntrada />} />
              <Route path="caixa-entrada/:setor" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-entrada/:setor/:categoria" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-denuncias" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-fiscalizacao" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-juridico-1" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-juridico-2" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-daf" element={<Navigate to="/caixa-entrada" replace />} />
              <Route path="caixa-diretoria" element={<Navigate to="/caixa-entrada" replace />} />

              {/* === MÓDULO DE RECURSOS === */}
              <Route path="recursos" element={<Navigate to="/recursos/dashboard" replace />} />
              <Route path="recursos/dashboard" element={<RecursosDashboard />} />
              <Route path="recursos/lista" element={<RecursosList />} />
              <Route path="recursos/novo" element={<RecursoForm />} />
              <Route path="recursos/:id/editar" element={<RecursoForm />} />

              {/* === DEBUG DO MENU === */}
              <Route path="menu-debug" element={<MenuDebugPage />} />

              {/* === MÓDULO PPA - PROCEDIMENTO PRELIMINAR ADMINISTRATIVO === */}
              <Route path="ppa/debug" element={<PPADebugPage />} />
              <Route path="ppa" element={<PPAListPage />} />
              <Route path="ppa/novo" element={<PPACreatePage />} />
              <Route path="ppa/:id" element={<PPADetailPage />} />
              <Route path="ppa/:id/editar" element={<PPAEditPage />} />

              {/* === MÓDULO DE ATENDIMENTO (CÓPIA DO PRO CONSUMIDOR) === */}
              <Route path="atendimento" element={<Navigate to="/atendimento/dashboard" replace />} />
              <Route path="atendimento/dashboard" element={<AtendimentoDashboard />} />
              <Route path="atendimento/dashboard-lgpd" element={<AtendimentoLgpdDashboard />} />
              <Route path="atendimento/configuracoes" element={<AtendimentoConfiguracaoPrazos />} />
              <Route path="atendimento/regras-distribuicao" element={<AtendimentoRegrasDistribuicao />} />
              <Route
                path="atendimento/filas"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <AtendimentoFilaGuiche />
                  </ProtectedRoute>
                }
              />
              <Route path="atendimento/reclamacoes/nova" element={<NovaReclamacao />} />
              <Route path="atendimento/reclamacoes/:id" element={<DetalhesReclamacao />} />

              {/* === MÓDULO DE COBRANÇA === */}
              <Route path="cobranca" element={<CobrancaPage />} />
              <Route path="cobranca/dashboard" element={<CobrancaDashboard />} />
              <Route path="cobranca/boletos" element={<BoletosList />} />
              <Route path="cobranca/boletos/novo" element={<BoletoForm />} />
              <Route path="cobranca/boletos/:id" element={<BoletoDetail />} />
              <Route path="cobranca/boletos/:id/editar" element={<BoletoForm />} />
              <Route path="cobranca/boletos/:id/pagamento" element={<PagamentoBoleto />} />
              <Route path="cobranca/nova" element={<CobrancaForm />} />
              <Route path="cobranca/:id/editar" element={<CobrancaForm />} />
              <Route path="cobranca/grm" element={<GrmList />} />
              <Route path="cobranca/grm/novo" element={<GrmForm />} />
              <Route path="cobranca/grm/:id" element={<GrmDetail />} />

              {/* === MÓDULO DE REMESSAS === */}
              <Route path="cobranca/remessas" element={<RemessasList />} />
              <Route path="cobranca/remessas/novo" element={<RemessaForm />} />
              <Route path="cobranca/remessas/:id" element={<RemessaDetail />} />
              <Route path="cobranca/remessas/:id/editar" element={<RemessaForm />} />

              {/* === MÓDULO DE NOTIFICAÇÕES === */}
              <Route path="notificacoes" element={<Navigate to="/notificacoes/dashboard" replace />} />
              <Route path="notificacoes/dashboard" element={<NotificacoesDashboard />} />
              <Route path="notificacoes/historico" element={<Navigate to="/notificacoes/dashboard" replace />} />
              <Route path="notificacoes/templates" element={<Navigate to="/notificacoes/dashboard" replace />} />
              <Route path="notificacoes/relatorios" element={<Navigate to="/notificacoes/dashboard" replace />} />
              <Route path="notificacoes/configuracoes" element={<Navigate to="/notificacoes/dashboard" replace />} />

              {/* === MÓDULO DE AUDITORIA === */}
              <Route path="auditoria" element={<AuditoriaDashboard />} />
              <Route path="auditoria/dashboard" element={<AuditoriaDashboard />} />
              <Route path="auditoria/logs" element={<AuditoriaList />} />
              <Route path="auditoria/logs/:id" element={<AuditoriaList />} />
              <Route path="auditoria/seguranca" element={<AuditoriaList />} />
              <Route path="auditoria/sessoes" element={<AuditoriaList />} />
              <Route path="auditoria/backup" element={<AuditoriaList />} />
              <Route path="auditoria/relatorios" element={<AuditoriaList />} />
              <Route path="auditoria/configuracoes" element={<AuditoriaList />} />

              {/* === MÓDULO DE AGENDA === */}
              <Route path="agenda" element={<AgendaDashboard />} />
              <Route path="agenda/dashboard" element={<AgendaDashboard />} />
              <Route path="agenda/eventos" element={<AgendaDashboard />} />
              <Route path="agenda/eventos/:id" element={<AgendaDashboard />} />
              <Route path="agenda/eventos/:id/editar" element={<AgendaDashboard />} />
              <Route path="agenda/novo" element={<AgendaDashboard />} />
              <Route path="agenda/fiscais" element={<AgendaDashboard />} />
              <Route path="agenda/tipos" element={<AgendaDashboard />} />
              <Route path="agenda/relatorios" element={<AgendaDashboard />} />

              {/* === MÓDULO DE CONSULTA PÚBLICA === */}
              <Route path="consulta-publica" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/dashboard" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/consultas" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/consultas/:id" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/empresas" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/empresa/:cnpj" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/processos" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/processo/:numero" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/ranking" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/precos" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/restricoes" element={<ConsultaPublicaDashboard />} />
              <Route path="consulta-publica/relatorios" element={<ConsultaPublicaDashboard />} />

              {/* === MÓDULO DE ANÁLISE JURÍDICA === */}
              <Route path="analise-juridica" element={<AnaliseJuridicaDashboard />} />
              <Route path="analise-juridica/dashboard" element={<AnaliseJuridicaDashboard />} />
              <Route path="analise-juridica/nova" element={<AnaliseJuridicaForm />} />
              <Route path="analise-juridica/:id" element={<AnaliseJuridicaForm />} />
              <Route path="analise-juridica/analista/:id" element={<AnaliseJuridicaDashboard />} />

              {/* === MÓDULO DE RELATÓRIOS EXECUTIVOS === */}
              <Route path="relatorios-executivos" element={<RelatoriosExecutivosDashboard />} />
              <Route path="relatorios-executivos/dashboard" element={<RelatoriosExecutivosDashboard />} />
              <Route path="relatorios-executivos/novo" element={<RelatoriosExecutivosDashboard />} />
              <Route path="relatorios-executivos/:id" element={<RelatoriosExecutivosDashboard />} />
              <Route path="relatorios-executivos/usuario/:id" element={<RelatoriosExecutivosDashboard />} />

              {/* === MÓDULO DE RECURSOS E DEFESAS === */}
              <Route path="recursos-defesas" element={<RecursosDefesasDashboard />} />
              <Route path="recursos-defesas/dashboard" element={<RecursosDefesasDashboard />} />
              <Route path="recursos-defesas/novo" element={<RecursoDefesaForm />} />
              <Route path="recursos-defesas/:id" element={<RecursoDefesaForm />} />
              <Route path="recursos-defesas/advogado/:id" element={<RecursosDefesasDashboard />} />

              {/* === MÓDULO DE LEGISLAÇÃO === */}
              <Route path="legislacao" element={<LegislacaoDashboard />} />
              <Route path="legislacao/dashboard" element={<LegislacaoDashboard />} />
              <Route path="legislacao/lei/:id" element={<LegislacaoDashboard />} />
              <Route path="legislacao/nova" element={<LegislacaoDashboard />} />
              <Route path="legislacao/categoria/:categoria" element={<LegislacaoDashboard />} />
              <Route path="legislacao/tipo/:tipo" element={<LegislacaoDashboard />} />

              {/* === MÓDULO DE PROCESSOS === */}
              <Route path="processos" element={<ProcessoListPage />} />
              <Route path="processos/dashboard" element={<ProcessoDashboard />} />
              <Route path="processos/:id" element={<ProcessoDetailPage />} />

              {/* === TRAMITAÇÃO === */}
              <Route path="tramitacao" element={<TramitacaoDashboard />} />

              {/* === MÓDULO JURÍDICO === */}
              <Route path="juridico" element={<DashboardJuridico />} />
              <Route path="juridico/dashboard" element={<DashboardJuridico />} />
              <Route path="juridico/processos" element={<ListaProcessos />} />
              <Route path="juridico/processos/novo" element={<FormProcesso />} />
              <Route path="juridico/processos/:id" element={<DetalheProcesso />} />
              <Route path="juridico/processos/:id/editar" element={<FormProcesso />} />
              <Route path="juridico/analises" element={<ListaAnalises />} />
              <Route path="juridico/analises/nova" element={<AnaliseJuridicaForm />} />
              <Route path="juridico/analises/:id" element={<AnaliseJuridicaForm />} />
              <Route path="juridico/analises/:id/editar" element={<AnaliseJuridicaForm />} />
              <Route path="juridico/relatorios" element={<RelatoriosAvancados />} />
              <Route path="juridico/configuracoes" element={<ConfiguracoesJuridicas />} />
              <Route path="juridico/documentos" element={<DocumentosJuridicos />} />
              <Route path="juridico/historicos" element={<HistoricosJuridicos />} />
              <Route path="juridico/peticoes" element={<PeticoesJuridico1 />} />
              <Route path="juridico/recursos" element={<PeticoesJuridico2 />} />

              {/* === OUTROS MÓDULOS === */}
              <Route path="multas" element={<MultasPage />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="empresas" element={<EmpresasPage />} />
              <Route path="portal-empresa/solicitacoes" element={<PortalEmpresaSolicitacoesAdmin />} />
              <Route path="auditoria" element={<AuditoriaPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="consulta-publica" element={<ConsultaPublicaPage />} />
              <Route path="produtos" element={<ProdutosPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="ajuda" element={<AjudaPage />} />
              <Route path="demo/irregularidades" element={<IrregularidadesDemo />} />

              {/* === REDIRECIONAMENTOS ÚTEIS === */}
              <Route path="fiscal" element={<Navigate to="/fiscalizacao" replace />} />
              <Route path="autos" element={<Navigate to="/fiscalizacao" replace />} />

              {/* === ROTAS DE COMPATIBILIDADE (DEPRECATED) === */}
              <Route path="fiscalizacao/banco/*" element={<Navigate to="/fiscalizacao/bancos" replace />} />
              <Route path="fiscalizacao/supermercado/*" element={<Navigate to="/fiscalizacao/supermercados" replace />} />
              <Route path="fiscalizacao/posto/*" element={<Navigate to="/fiscalizacao/postos" replace />} />
              <Route path="fiscalizacao/infracao/*" element={<Navigate to="/fiscalizacao/infracoes" replace />} />

            </Route>

            <Route
              path="/portal-empresa/reclamacoes"
              element={
                <ProtectedRoute allowedRoles={['empresa', 'admin', 'staff']}>
                  <PortalEmpresaReclamacoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal-empresa"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'empresa']}>
                  <PortalEmpresa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal-consumidor"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'consumer']}>
                  <PortalConsumidor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal-consumidor/feedbacks"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <PortalConsumidorFeedbacksAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal-consumidor/tickets"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <PortalConsumidorTicketsAdmin />
                </ProtectedRoute>
              }
            />
            {/* ===== PÁGINA 404 (DEVE SER A ÚLTIMA ROTA) ===== */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </Suspense>

        {/* Monitor do Sistema */}
        <SystemMonitor />
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;
