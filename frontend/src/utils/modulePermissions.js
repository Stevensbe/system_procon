export const normalizePermissoesModulos = (user) => {
  if (!user) return null;
  const source = user.profile || user;
  return (
    source.permissoesModulos ||
    source.permissoes_modulos ||
    source.permissionsModules ||
    null
  );
};

export const hasAnyPermission = (permissoesModulos) => {
  if (!permissoesModulos || typeof permissoesModulos !== 'object') return false;
  return Object.values(permissoesModulos).some((modulo) =>
    modulo && typeof modulo === 'object'
      ? Object.values(modulo).some(Boolean)
      : false
  );
};

const PATH_MODULE_MAP = [
  { prefix: '/dashboard', key: 'dashboard' },
  { prefix: '/caixa-entrada', key: 'processos' },
  { prefix: '/processos', key: 'processos' },
  { prefix: '/tramitacao', key: 'processos' },
  { prefix: '/fiscalizacao', key: 'fiscalizacao' },
  { prefix: '/triagem', key: 'fiscalizacao' },
  { prefix: '/ppa', key: 'fiscalizacao' },
  { prefix: '/agenda', key: 'fiscalizacao' },
  { prefix: '/juridico', key: 'juridico' },
  { prefix: '/analise-juridica', key: 'juridico' },
  { prefix: '/recursos-defesas', key: 'juridico' },
  { prefix: '/peticionamento', key: 'juridico' },
  { prefix: '/cobranca', key: 'cobranca' },
  { prefix: '/financeiro', key: 'cobranca' },
  { prefix: '/multas', key: 'cobranca' },
  { prefix: '/relatorios', key: 'relatorios' },
  { prefix: '/relatorios-executivos', key: 'relatorios' },
  { prefix: '/auditoria', key: 'auditoria' },
  { prefix: '/configuracoes', key: 'configuracoes' },
  { prefix: '/ti', key: 'configuracoes' },
  { prefix: '/usuarios', key: 'configuracoes' },
  { prefix: '/notificacoes', key: 'configuracoes' },
  { prefix: '/produtos', key: 'configuracoes' },
  { prefix: '/portal-empresa', key: 'portal-empresa' },
  { prefix: '/portal-consumidor', key: 'portal-consumidor' },
  { prefix: '/atendimento', key: 'atendimento' },
  { prefix: '/painel-atendimento', key: 'atendimento' },
];

export const getModuleKeyForPath = (path) => {
  if (!path) return null;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const sorted = [...PATH_MODULE_MAP].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find((item) => normalized.startsWith(item.prefix));
  return match ? match.key : null;
};

export const canAccessModule = (user, moduleKey, action = 'visualizar') => {
  // Se não há módulo específico, libera
  if (!moduleKey) return true;

  // Se não há usuário, bloqueia
  if (!user) {
    console.debug('[modulePermissions] Sem usuário, bloqueando acesso');
    return false;
  }

  // Verificação para Django Auth (is_superuser)
  if (user.is_superuser) {
    console.debug('[modulePermissions] is_superuser detectado, liberando acesso');
    return true;
  }

  // ✅ Verificação para Supabase Auth (role)
  // Tenta encontrar o role em múltiplos lugares possíveis
  const userRole =
    user.role ||
    user.profile?.role ||
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    null;
  const roleKey = String(userRole || '').toLowerCase();

  console.debug('[modulePermissions] Role detectado:', userRole, 'para módulo:', moduleKey);

  // Admins e staff têm acesso total
  if (roleKey === 'admin') {
    console.debug('[modulePermissions] Role admin, liberando todos os módulos');
    return true;
  }
  if (roleKey === 'staff') {
    console.debug('[modulePermissions] Role staff, liberando todos os módulos');
    return true;
  }

  // Verifica permissões específicas por módulo
  const perms = normalizePermissoesModulos(user);
  if (!perms || !hasAnyPermission(perms)) {
    if (roleKey === 'atendimento' || roleKey === 'protocolo') {
      const hasAccess = moduleKey === 'atendimento';
      console.debug('[modulePermissions] Role atendimento/protocolo, acesso restrito:', hasAccess);
      return hasAccess;
    }
    // Modo rígido com mínimo: libera Dashboard e Caixa de Entrada/Processos
    const hasAccess = moduleKey === 'dashboard' || moduleKey === 'processos';
    console.debug('[modulePermissions] Sem permissões definidas, acesso básico:', hasAccess);
    return hasAccess;
  }

  const modulePerms = perms[moduleKey];
  if (!modulePerms) return false;

  if (Object.prototype.hasOwnProperty.call(modulePerms, action)) {
    return Boolean(modulePerms[action]);
  }

  return Object.values(modulePerms).some(Boolean);
};

export const canAccessModuleForPath = (user, path, action = 'visualizar') => {
  const moduleKey = getModuleKeyForPath(path);
  return canAccessModule(user, moduleKey, action);
};
