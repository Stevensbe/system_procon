import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, UserRound, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HERO_GRADIENT = 'from-slate-900 via-slate-950 to-slate-900';
const CARD_GRADIENT = 'from-slate-900/90 via-slate-900/80 to-slate-900/60';
const REMEMBER_KEY = 'auth:last-username';

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
    <div className={`relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br ${HERO_GRADIENT} py-12`}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.2),transparent_55%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl text-slate-50"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
            <Sparkles className="h-3.5 w-3.5" />
            Atendimento PROCON
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Acesse o painel de gestao e atendimento do PROCON
          </h1>
          <p className="mt-4 text-base text-slate-300/90">
            Realize triagens, acompanhe protocolos, gerencie filas de atendimento e monitore indicadores criticos em um unico ambiente seguro.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300/80">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">1</span>
              Autenticacao unificada para equipes internas e parceiros.
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">2</span>
              Redirecionamento automatico conforme perfil de acesso (admin, empresa ou consumidor).
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">3</span>
              Seguranca reforcada com tokens JWT e monitoramento em tempo real.
            </li>
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className={`w-full max-w-md rounded-3xl border border-slate-800/70 bg-gradient-to-br ${CARD_GRADIENT} p-8 shadow-[0_30px_120px_-40px_rgba(59,130,246,0.45)] backdrop-blur`}
        >
          <div className="flex items-center gap-3 text-slate-200">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-200">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-blue-200/80">Area segura</p>
              <h2 className="text-2xl font-semibold text-white">Entrar no sistema</h2>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <UserRound className="h-4 w-4 text-blue-300" />
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange('username')}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="seu.email@procon.gov"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <LockKeyhole className="h-4 w-4 text-blue-300" />
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange('password')}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="********"
              />
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                  checked={formData.remember}
                  onChange={handleChange('remember')}
                />
                Lembrar usuario
              </label>
              <span className="text-xs text-slate-500">Precisa de ajuda? Contate o suporte interno.</span>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/60"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar no sistema'
              )}
            </button>
          </form>

          <div className="mt-6 min-h-[48px] text-sm">
            {feedback && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}
            {!feedback && error && (
              <div className="rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default Login;
