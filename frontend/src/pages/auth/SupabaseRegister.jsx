/**
 * @fileoverview Página de Registro com Supabase Auth
 * @description Registro moderno e elegante integrado com Supabase
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    Lock,
    UserPlus,
    Mail,
    User,
    Phone,
    Loader2,
    Shield,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/SupabaseAuthContext';

// Animações
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

// Validações de senha
const passwordRequirements = [
    { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
    { id: 'uppercase', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'Um número', test: (p) => /[0-9]/.test(p) },
];

export default function SupabaseRegister() {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError, isAuthenticated } = useAuth();

    // Estados do formulário
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Redireciona se já estiver autenticado
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Atualiza força da senha
    useEffect(() => {
        const metRequirements = passwordRequirements.filter(req => req.test(formData.password));
        setPasswordStrength((metRequirements.length / passwordRequirements.length) * 100);
    }, [formData.password]);

    // Limpa feedback quando mudar campos
    const handleChange = (field) => (event) => {
        if (feedback) setFeedback(null);
        if (error) clearError();

        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    // Formata telefone
    const handlePhoneChange = (event) => {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        // Formata como (99) 99999-9999
        if (value.length > 0) {
            if (value.length <= 2) {
                value = `(${value}`;
            } else if (value.length <= 7) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
        }

        setFormData(prev => ({ ...prev, phone: value }));
    };

    // Submit do formulário
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (feedback) setFeedback(null);
        if (error) clearError();

        // Validações
        if (!formData.fullName.trim()) {
            setFeedback({ type: 'error', message: 'Por favor, informe seu nome completo.' });
            return;
        }

        if (!formData.email) {
            setFeedback({ type: 'error', message: 'Por favor, informe seu email.' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFeedback({ type: 'error', message: 'Por favor, insira um email válido.' });
            return;
        }

        if (passwordStrength < 100) {
            setFeedback({ type: 'error', message: 'A senha não atende todos os requisitos.' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFeedback({ type: 'error', message: 'As senhas não coincidem.' });
            return;
        }

        if (!acceptedTerms) {
            setFeedback({ type: 'error', message: 'Você precisa aceitar os termos de uso.' });
            return;
        }

        setSubmitting(true);

        try {
            const result = await register({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone.replace(/\D/g, '')
            });

            if (!result.success) {
                throw new Error(result.error || 'Não foi possível criar a conta.');
            }

            if (result.needsEmailConfirmation) {
                setFeedback({
                    type: 'success',
                    message: result.message || 'Verifique seu email para confirmar o cadastro!'
                });
            } else {
                setFeedback({
                    type: 'success',
                    message: 'Conta criada com sucesso! Redirecionando...'
                });
                setTimeout(() => {
                    navigate(result.redirectTo || '/dashboard');
                }, 1500);
            }

        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Falha no registro. Tente novamente.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isBusy = submitting || isLoading;

    // Cor da barra de força da senha
    const getStrengthColor = () => {
        if (passwordStrength <= 25) return 'bg-red-500';
        if (passwordStrength <= 50) return 'bg-orange-500';
        if (passwordStrength <= 75) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background com gradiente animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

                {/* Orbs animados */}
                <motion.div
                    className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1.3, 1, 1.3],
                        opacity: [0.5, 0.3, 0.5]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Card de Registro */}
            <motion.div
                className="relative z-10 w-full max-w-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="relative pt-8 pb-6 px-8">
                        {/* Decoração superior */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />

                        <motion.div
                            className="flex flex-col items-center gap-3"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {/* Botão Voltar */}
                            <motion.div
                                className="absolute top-4 left-4"
                                variants={fadeInUp}
                            >
                                <Link
                                    to="/auth/login"
                                    className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Link>
                            </motion.div>

                            {/* Logo/Ícone */}
                            <motion.div
                                className="relative"
                                variants={fadeInUp}
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <UserPlus className="w-7 h-7 text-white" />
                                </div>
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                </motion.div>
                            </motion.div>

                            <motion.div className="text-center" variants={fadeInUp}>
                                <h1 className="text-xl font-bold text-white">
                                    Criar nova conta
                                </h1>
                                <p className="text-white/60 mt-1 text-sm">
                                    Preencha os dados para se cadastrar
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Formulário */}
                    <div className="px-8 pb-8">
                        <motion.form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {/* Campo Nome Completo */}
                            <motion.div className="space-y-1.5" variants={fadeInUp}>
                                <label
                                    htmlFor="fullName"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    Nome Completo
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange('fullName')}
                                    disabled={isBusy}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
                           placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 
                           focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Seu nome completo"
                                />
                            </motion.div>

                            {/* Campo Email */}
                            <motion.div className="space-y-1.5" variants={fadeInUp}>
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    disabled={isBusy}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
                           placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 
                           focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="seu@email.com"
                                />
                            </motion.div>

                            {/* Campo Telefone */}
                            <motion.div className="space-y-1.5" variants={fadeInUp}>
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Telefone
                                    <span className="text-white/40 text-xs">(opcional)</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    disabled={isBusy}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
                           placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 
                           focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="(92) 99999-9999"
                                />
                            </motion.div>

                            {/* Campo Senha */}
                            <motion.div className="space-y-1.5" variants={fadeInUp}>
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Senha
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange('password')}
                                        disabled={isBusy}
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white 
                             placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 
                             focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        disabled={isBusy}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Barra de força da senha */}
                                {formData.password && (
                                    <div className="mt-2 space-y-2">
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full ${getStrengthColor()} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${passwordStrength}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {passwordRequirements.map(req => (
                                                <div
                                                    key={req.id}
                                                    className={`flex items-center gap-1.5 text-xs ${req.test(formData.password) ? 'text-emerald-400' : 'text-white/40'
                                                        }`}
                                                >
                                                    {req.test(formData.password) ? (
                                                        <Check className="w-3 h-3" />
                                                    ) : (
                                                        <X className="w-3 h-3" />
                                                    )}
                                                    {req.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Campo Confirmar Senha */}
                            <motion.div className="space-y-1.5" variants={fadeInUp}>
                                <label
                                    htmlFor="confirmPassword"
                                    className="text-sm font-medium text-white/80 flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Confirmar Senha
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange('confirmPassword')}
                                        disabled={isBusy}
                                        className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white 
                             placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed
                             ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                                                : formData.confirmPassword && formData.password === formData.confirmPassword
                                                    ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                                                    : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(prev => !prev)}
                                        disabled={isBusy}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        As senhas não coincidem
                                    </p>
                                )}
                            </motion.div>

                            {/* Termos de Uso */}
                            <motion.div variants={fadeInUp}>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            disabled={isBusy}
                                            className="sr-only peer"
                                        />
                                        <div className="w-5 h-5 rounded-md border border-white/20 bg-white/5 
                                  peer-checked:bg-indigo-500 peer-checked:border-indigo-500 
                                  transition-all duration-200 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                                        Eu li e aceito os{' '}
                                        <a href="/termos" className="text-indigo-400 hover:text-indigo-300 underline">
                                            Termos de Uso
                                        </a>
                                        {' '}e a{' '}
                                        <a href="/privacidade" className="text-indigo-400 hover:text-indigo-300 underline">
                                            Política de Privacidade
                                        </a>
                                    </span>
                                </label>
                            </motion.div>

                            {/* Botão de Registro */}
                            <motion.button
                                type="submit"
                                disabled={isBusy}
                                className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden
                         bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500
                         disabled:opacity-70 disabled:cursor-not-allowed
                         transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                                variants={fadeInUp}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isBusy ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Criando conta...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Criar conta
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
                      flex items-start gap-3 p-4 rounded-xl text-sm
                      ${feedback?.type === 'success'
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            }
                    `}>
                                            {feedback?.type === 'success' ? (
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span>{feedback?.message || error}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.form>

                        {/* Divisor */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-4 bg-transparent text-white/40">
                                    Já tem conta?
                                </span>
                            </div>
                        </div>

                        {/* Link de Login */}
                        <Link
                            to="/auth/login"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl 
                       border border-white/10 text-white/80 font-medium
                       hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Fazer login
                        </Link>
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
