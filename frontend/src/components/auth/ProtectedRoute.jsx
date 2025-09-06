import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, isTokenValid } from '../../utils/token';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, requiredPermissions = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = carregando
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = getToken();
        
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Verifica se o token é válido
        if (!isTokenValid(token)) {
          setIsAuthenticated(false);
          return;
        }

        // Aqui você pode fazer uma chamada para validar o token no servidor
        // e obter informações do usuário
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token inválido no servidor
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Se não conseguir validar no servidor, assume que está autenticado
          // se o token existe e não expirou (para funcionar offline)
          console.warn('Não foi possível validar token no servidor:', error);
          setIsAuthenticated(true);
        }

      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  // Verifica permissões
  const hasRequiredPermissions = (userPermissions, requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  };

  // Ainda carregando
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" />
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Verificar permissões se necessário
  if (requiredPermissions.length > 0 && user) {
    if (!hasRequiredPermissions(user.permissions, requiredPermissions)) {
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
              Você não tem permissão para acessar esta página.
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

  // Usuário autenticado e com permissões adequadas
  return children;
};

export default ProtectedRoute;