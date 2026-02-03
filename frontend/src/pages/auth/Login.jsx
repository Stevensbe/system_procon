import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import manausBackground from '../../assets/manaus-background.jpg';
import logoPrefeitura from '../../assets/logo-prefeitura.png';

const REMEMBER_KEY = 'auth:last-username';

function ProconLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={logoPrefeitura}
        alt="Prefeitura de Manaus - PROCON"
        className="h-16 w-auto object-contain"
      />
      <p className="text-xs text-primary-foreground/80 text-center max-w-xs">
        Protecao e Defesa do Consumidor
      </p>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  });
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem(REMEMBER_KEY);
    if (storedUsername) {
      setFormData((prev) => ({ ...prev, username: storedUsername, remember: true }));
    }
  }, []);

  const handleChange = (field) => (event) => {
    if (feedback) setFeedback(null);
    if (error) clearError();
    const value = field === 'remember' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (feedback) setFeedback(null);
    if (error) clearError();

    if (!formData.username || !formData.password) {
      setFeedback({ type: 'error', message: 'Informe usuario e senha para continuar.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (!result.success) {
        throw new Error(result.error || 'Nao foi possivel autenticar.');
      }

      if (formData.remember) {
        localStorage.setItem(REMEMBER_KEY, formData.username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      setFeedback({ type: 'success', message: 'Bem-vindo! Redirecionando...' });
      setTimeout(() => navigate(result.redirectTo || '/dashboard'), 500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Falha no login. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || isLoading;

  return (
    <div className="procon-login min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${manausBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--overlay-dark))]/80 via-[hsl(var(--overlay-dark))]/70 to-[hsl(var(--procon-blue-dark))]/60" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="login-card rounded-xl overflow-hidden">
          <div className="procon-header py-8 px-6">
            <ProconLogo />
          </div>

          <div className="procon-accent-bar" />

          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">Acesso ao Sistema</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Entre com suas credenciais para acessar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange('username')}
                    className="input-procon w-full rounded-md bg-white/95 px-4 py-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder="seu.email@procon.gov"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    className="input-procon w-full rounded-md bg-white/95 px-4 py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary"
                    checked={formData.remember}
                    onChange={handleChange('remember')}
                  />
                  <span>Lembrar-me</span>
                </label>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                data-testid="login-button"
                disabled={isBusy}
                className="btn-procon w-full h-11 rounded-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 min-h-[48px] text-sm">
              {feedback && (
                <div
                  className={`rounded-md border px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border-emerald-300/70 bg-emerald-100/50 text-emerald-700'
                      : 'border-rose-300/70 bg-rose-100/50 text-rose-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}
              {!feedback && error && (
                <div className="rounded-md border border-rose-300/70 bg-rose-100/50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 px-6 py-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>Prefeitura de Manaus</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-muted-foreground/50 rounded-full" />
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>151</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-muted-foreground/50 rounded-full" />
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>procon@manaus.am.gov.br</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/70 mt-6">
          (c) {new Date().getFullYear()} PROCON Manaus Municipal - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

export default Login;
