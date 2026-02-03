/**
 * @fileoverview Página de Login com Supabase Auth
 * @description Login moderno e elegante integrado com Supabase
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    Lock,
    LogIn,
    Mail,
    Loader2,
    Shield,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Building2,
    Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/SupabaseAuthContext';

// Configuração do "lembrar-me"
const REMEMBER_KEY = 'auth:last-email';

// Animações
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function SupabaseLogin() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError, isAuthenticated, getRedirectPath, profile } = useAuth();

    // Estados do formulário
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Redireciona se já estiver autenticado
    useEffect(() => {
        if (isAuthenticated && profile) {
            navigate(getRedirectPath(profile));
        }
    }, [isAuthenticated, profile, navigate, getRedirectPath]);

    // Carrega email salvo
    useEffect(() => {
        const savedEmail = localStorage.getItem(REMEMBER_KEY);
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail, remember: true }));
        }
    }, []);

    // Limpa feedback quando mudar campos
    const handleChange = (field) => (event) => {
        if (feedback) setFeedback(null);
        if (error) clearError();

        const value = field === 'remember' ? event.target.checked : event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Submit do formulário
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (feedback) setFeedback(null);
        if (error) clearError();

        // Validação básica
        if (!formData.email || !formData.password) {
            setFeedback({
                type: 'error',
                message: 'Por favor, preencha email e senha.'
            });
            return;
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFeedback({
                type: 'error',
                message: 'Por favor, insira um email válido.'
            });
            return;
        }

        setSubmitting(true);

        try {
            const result = await login({
                email: formData.email,
                password: formData.password
            });

            if (!result.success) {
                throw new Error(result.error || 'Não foi possível autenticar.');
            }

            // Salva email se "lembrar-me" estiver marcado
            if (formData.remember) {
                localStorage.setItem(REMEMBER_KEY, formData.email);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
            }

            setFeedback({
                type: 'success',
                message: 'Login realizado! Redirecionando...'
            });

            // Redireciona após animação
            setTimeout(() => {
                navigate(result.redirectTo || '/dashboard');
            }, 800);

        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Falha no login. Tente novamente.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isBusy = submitting || isLoading;

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background com gradiente animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

                {/* Orbs animados */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Card de Login */}
            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="relative pt-10 pb-8 px-8">
                        {/* Decoração superior */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />

                        <motion.div
                            className="flex flex-col items-center gap-4"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {/* Logo/Ícone */}
                            <motion.div
                                className="relative"
                                variants={fadeInUp}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                </motion.div>
                            </motion.div>

                            <motion.div className="text-center" variants={fadeInUp}>
                                <h1 className="text-2xl font-bold text-white">
                                    Bem-vindo de volta
                                </h1>
                                <p className="text-white/60 mt-2 text-sm">
                                    Entre com sua conta para continuar
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Formulário */}
                    <div className="px-8 pb-8">
                        <motion.form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {/* Campo Email */}
                            <motion.div className="space-y-2" variants={fadeInUp}>
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <div className="relative group">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        disabled={isBusy}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white 
                             placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 
                             focus:ring-2 focus:ring-purple-500/20 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="seu@email.com"
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity duration-300" />
                                </div>
                            </motion.div>

                            {/* Campo Senha */}
                            <motion.div className="space-y-2" variants={fadeInUp}>
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Senha
                                </label>
                                <div className="relative group">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={formData.password}
                                        onChange={handleChange('password')}
                                        disabled={isBusy}
                                        className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border border-white/10 text-white 
                             placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 
                             focus:ring-2 focus:ring-purple-500/20 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        disabled={isBusy}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 
                             transition-colors disabled:opacity-50"
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Opções */}
                            <motion.div
                                className="flex items-center justify-between"
                                variants={fadeInUp}
                            >
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={formData.remember}
                                            onChange={handleChange('remember')}
                                            disabled={isBusy}
                                            className="sr-only peer"
                                        />
                                        <div className="w-5 h-5 rounded-md border border-white/20 bg-white/5 
                                  peer-checked:bg-purple-500 peer-checked:border-purple-500 
                                  transition-all duration-200 flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                                        Lembrar-me
                                    </span>
                                </label>

                                <Link
                                    to="/auth/forgot-password"
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </motion.div>

                            {/* Botão de Login */}
                            <motion.button
                                type="submit"
                                disabled={isBusy}
                                className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden
                         bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                         disabled:opacity-70 disabled:cursor-not-allowed
                         transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                                variants={fadeInUp}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isBusy ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Entrando...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            Entrar
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </span>
                            </motion.button>

                            {/* Feedback */}
                            <AnimatePresence mode="wait">
                                {(feedback || error) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`
                      flex items-center gap-3 p-4 rounded-xl text-sm
                      ${feedback?.type === 'success' || (!feedback && !error)
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            }
                    `}>
                                            {feedback?.type === 'success' ? (
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            )}
                                            <span>{feedback?.message || error}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.form>

                        {/* Divisor */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-4 bg-transparent text-white/40">
                                    Novo por aqui?
                                </span>
                            </div>
                        </div>

                        {/* Link de Cadastro */}
                        <Link
                            to="/auth/register"
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl 
                       border border-white/10 text-white/80 font-medium
                       hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                        >
                            Criar uma conta
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Footer */}
                    <div className="bg-white/5 px-6 py-4 border-t border-white/10">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/40">
                            <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>PROCON Manaus</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                <span>151</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                <span>procon@manaus.am.gov.br</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <p className="text-center text-xs text-white/30 mt-6">
                    © {new Date().getFullYear()} PROCON Manaus Municipal - Todos os direitos reservados
                </p>
            </motion.div>
        </div>
    );
}
