import React, { useEffect } from 'react';
import { useAuth } from '../../context/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const PPADebugPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 DEBUG PPA - Informações de autenticação:', {
      isAuthenticated: auth.isAuthenticated,
      role: auth.role,
      user: auth.user,
      isAdmin: auth.isAdmin,
      isStaff: auth.isStaff,
      status: auth.status,
    });
  }, [auth]);

  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <div className="alert alert-info">
            <h2>🔍 Página de Debug do PPA</h2>
            <p>Esta página mostra informações de autenticação e permissões.</p>
          </div>

          {/* Status de Autenticação */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">📊 Status de Autenticação (Context)</h3>
            </div>
            <div className="card-body">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Autenticado:</th>
                    <td>
                      {auth.isAuthenticated ? (
                        <span className="badge badge-success">✅ Sim</span>
                      ) : (
                        <span className="badge badge-danger">❌ Não</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Role:</th>
                    <td><strong>{auth.role || 'N/A'}</strong></td>
                  </tr>
                  <tr>
                    <th>É Admin:</th>
                    <td>
                      {auth.isAdmin ? (
                        <span className="badge badge-success">✅ Sim</span>
                      ) : (
                        <span className="badge badge-warning">❌ Não</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>É Staff:</th>
                    <td>
                      {auth.isStaff ? (
                        <span className="badge badge-success">✅ Sim</span>
                      ) : (
                        <span className="badge badge-warning">❌ Não</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Username:</th>
                    <td>{auth.user?.username || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Status:</th>
                    <td><code>{auth.status}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dados do LocalStorage */}
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="mb-0">💾 Dados do LocalStorage</h3>
            </div>
            <div className="card-body">
              <h5>Usuário:</h5>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(userFromStorage, null, 2)}
              </pre>

              <h5 className="mt-3">Token:</h5>
              <div>
                {token ? (
                  <>
                    <span className="badge badge-success">✅ Token presente</span>
                    <pre className="bg-light p-3 rounded mt-2" style={{ maxHeight: '100px', overflow: 'auto' }}>
                      {token.substring(0, 50)}...
                    </pre>
                  </>
                ) : (
                  <span className="badge badge-danger">❌ Token ausente</span>
                )}
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h3 className="mb-0">🔎 Diagnóstico</h3>
            </div>
            <div className="card-body">
              {!auth.isAuthenticated && (
                <div className="alert alert-danger">
                  <h5>❌ Você não está autenticado!</h5>
                  <p>Faça login primeiro: <a href="/login">/login</a></p>
                </div>
              )}

              {auth.isAuthenticated && !auth.isStaff && !auth.isAdmin && (
                <div className="alert alert-danger">
                  <h5>⚠️ Você não tem permissão de Staff/Admin!</h5>
                  <p><strong>Problema identificado:</strong> As rotas do PPA exigem <code>allowedRoles={['admin', 'staff']}</code></p>
                  <hr />
                  <h6>Solução:</h6>
                  <p>Execute no terminal do backend:</p>
                  <pre className="bg-dark text-white p-3 rounded">
                    {`python3 manage.py shell

# No shell:
from django.contrib.auth.models import User
user = User.objects.get(username='${auth.user?.username || 'SEU_USERNAME'}')
user.is_staff = True
user.is_superuser = True
user.save()
print(f"✅ {user.username} agora é admin!")
exit()`}
                  </pre>
                  <p className="mb-0">Depois faça logout e login novamente.</p>
                </div>
              )}

              {auth.isAuthenticated && (auth.isStaff || auth.isAdmin) && (
                <div className="alert alert-success">
                  <h5>✅ Você tem as permissões corretas!</h5>
                  <p><strong>Role:</strong> {auth.role}</p>
                  <p><strong>Staff:</strong> {auth.isStaff ? 'Sim' : 'Não'}</p>
                  <p><strong>Admin:</strong> {auth.isAdmin ? 'Sim' : 'Não'}</p>
                  <hr />
                  <p className="mb-0">
                    Se mesmo assim o PPA não funciona, pode ser um problema de cache ou de rotas.
                    Tente: <code>Ctrl+Shift+R</code> para recarregar sem cache.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="card">
            <div className="card-header bg-dark text-white">
              <h3 className="mb-0">⚙️ Ações</h3>
            </div>
            <div className="card-body">
              <div className="btn-group btn-group-lg" role="group">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/ppa')}
                >
                  🔄 Tentar Acessar /ppa
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    alert('Cache limpo! Faça login novamente.');
                    navigate('/login');
                  }}
                >
                  🗑️ Limpar Cache
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  🔄 Recarregar Página
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  🏠 Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Console Logs */}
          <div className="alert alert-secondary mt-4">
            <strong>💡 Dica:</strong> Abra o Console do navegador (F12) para ver mais logs de debug!
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPADebugPage;

