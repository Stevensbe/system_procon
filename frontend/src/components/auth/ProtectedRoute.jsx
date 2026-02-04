import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthState } from '../../context/SupabaseAuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
  const { user, role, status, isLoading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Debug: mostrar status atual
  console.debug('[ProtectedRoute]', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    status,
    role,
    userEmail: user?.email,
    allowedRoles
  });

  // Ainda carregando estado de autenticação
  if (isLoading || status === AuthState?.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" />
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - redireciona para login
  if (!isAuthenticated) {
    console.debug('[ProtectedRoute] Usuário não autenticado, redirecionando para login');
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Verificar roles (se especificado)
  if (allowedRoles.length > 0) {
    const effectiveRole = role || user?.role || user?.profile?.role || 'guest';
    const isAllowed = allowedRoles.includes(effectiveRole);

    console.debug('[ProtectedRoute] Verificando role:', { effectiveRole, allowedRoles, isAllowed });

    if (!isAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-2">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Seu role: {effectiveRole} | Roles permitidos: {allowedRoles.join(', ')}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Voltar
              </button>
              <Navigate to="/dashboard" replace />
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar permissões específicas (se especificado)
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));

    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-6">
              Você não tem as permissões necessárias para acessar esta página.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Voltar
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>Permissões necessárias:</p>
              <ul className="mt-2">
                {requiredPermissions.map(permission => (
                  <li key={permission} className="font-mono">
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
  }

  // Usuário autenticado e autorizado
  return children;
};

export default ProtectedRoute;
