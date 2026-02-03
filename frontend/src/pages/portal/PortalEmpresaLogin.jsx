import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ShieldCheck, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/SupabaseAuthContext';

/**
 * Tela de login dedicada ao Portal da Empresa.
 * Utiliza framer-motion para transicoes suaves e icones do lucide-react,
 * seguindo o layout moderno acordado com o time.
 */
function PortalEmpresaLogin() {
  const navigate = useNavigate();
  const { login, isLoading, clearError, error } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('portal-empresa-last-user');
    if (stored) {
      setFormData((prev) => ({
        ...prev,
        username: stored,
      }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (feedback) setFeedback(null);
    if (error) clearError();

    if (!formData.username.trim() || !formData.password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Informe usuario e senha para continuar.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (!result.success) {
        throw new Error(result.error || 'Nao foi possivel autenticar.');
      }

      if (rememberMe) {
        localStorage.setItem('portal-empresa-last-user', formData.username);
      } else {
        localStorage.removeItem('portal-empresa-last-user');
      }

      setFeedback({
        type: 'success',
        message: 'Login efetuado com sucesso. Redirecionando...',
      });

      setTimeout(() => {
        navigate(result.redirectTo || '/portal-empresa');
      }, 900);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Nao foi possivel autenticar. Verifique suas credenciais.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-950 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-5xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-10 lg:grid-cols-[1.2fr_1fr]"
        >
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-[0_40px_120px_-35px_rgba(15,118,255,0.4)] backdrop-blur">
            <div className="flex items-center gap-3 text-slate-100">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Building2 className="h-7 w-7" />
              </span>
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-300/80">Portal Corporativo</p>
                <h1 className="text-3xl font-semibold text-white">Acesso restrito as empresas conveniadas</h1>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-base text-slate-300/90">
              Faca login com as credenciais fornecidas pelo time de TI do PROCON. Em caso de primeiro acesso,
              utilize o cadastro corporativo disponivel ao lado para solicitar habilitacao da sua organizacao.
            </p>

            <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8">
              <div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-blue-400" />
                      Usuario
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring"
                      placeholder="cnpj@empresa.com"
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <LockKeyhole className="h-4 w-4 text-blue-400" />
                      Senha
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring"
                      placeholder="********"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe((prev) => !prev)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                      />
                      Lembrar usuario
                    </label>
                    <Link
                      to="/recuperar-senha"
                      className="font-medium text-blue-300 transition hover:text-blue-200"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/70"
                  >
                    {isSubmitting || isLoading ? 'Entrando...' : 'Entrar no portal'}
                  </button>
                </form>

                {(feedback || (!feedback && error)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${feedback?.type === 'success'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                      }`}
                  >
                    {feedback?.message || error}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="flex flex-col justify-between rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-slate-900/60 p-8 text-blue-50 shadow-[0_40px_120px_-25px_rgba(59,130,246,0.35)] backdrop-blur"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/25 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Novo acesso
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">Ainda nao possui credenciais?</h2>
              <p className="mt-3 text-sm text-blue-100/80">
                Solicite o cadastro da sua empresa para receber credenciais de acesso, tokens de API e habilitar webhooks.
              </p>
            </div>

            <div className="mt-10 space-y-6">
              <div className="flex gap-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-100">
                  <Mail className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white">Solicitacao de credenciais</h3>
                  <p className="mt-1 text-sm text-blue-100/80">
                    Envie os dados cadastrais e aguarde a analise da equipe de TI. Voce recebera um e-mail com instrucoes
                    assim que o acesso for liberado.
                  </p>
                </div>
              </div>

              <Link
                to="/portal-empresa/solicitacao"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Solicitar acesso ao portal
              </Link>

              <p className="text-xs text-blue-100/70">
                Duvidas? Entre em contato com <strong>suporte-ti@procon.gov.br</strong> ou acione seu gestor de relacionamento.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PortalEmpresaLogin;
