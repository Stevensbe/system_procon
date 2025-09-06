import { Navigate } from 'react-router-dom';
import { getToken, isTokenValid } from '../utils/token';

function ProtectedRoute({ children }) {
  // ✅ CORREÇÃO: Usar função padronizada do token.js
  const token = getToken();
  
  // ✅ MELHORIA: Verificar se o token é válido, não apenas se existe
  if (!token || !isTokenValid(token)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default ProtectedRoute;