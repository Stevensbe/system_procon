/**
 * @fileoverview Página de Redefinição de Senha com Supabase Auth
 * @description Permite ao usuário definir uma nova senha após reset
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    Lock,
    KeyRound,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Check,
    X,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/SupabaseAuthContext';

// Animações
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

// Validações de senha
const passwordRequirements = [
    { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
    { id: 'uppercase', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'Um número', test: (p) => /[0-9]/.test(p) },
];

export default function ResetPassword() {
    const navigate = useNavigate();
    const { changePassword, isLoading, error, clearError, session } = useAuth();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [resetComplete, setResetComplete] = useState(false);

    // Verifica se usuário está em modo de recuperação
    useEffect(() => {
        if (!session) {
            // Se não há sessão, pode ter expirado ou não veio do link correto
            console.log('[ResetPassword] Nenhuma sessão encontrada');
        }
    }, [session]);

    // Atualiza força da senha
    useEffect(() => {
        const metRequirements = passwordRequirements.filter(req => req.test(formData.password));
        setPasswordStrength((metRequirements.length / passwordRequirements.length) * 100);
    }, [formData.password]);

    const handleChange = (field) => (event) => {
        if (feedback) setFeedback(null);
        if (error) clearError();
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (feedback) setFeedback(null);
        if (error) clearError();

        // Validações
        if (passwordStrength < 100) {
            setFeedback({ type: 'error', message: 'A senha não atende todos os requisitos.' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFeedback({ type: 'error', message: 'As senhas não coincidem.' });
            return;
        }

        setSubmitting(true);

        try {
            const result = await changePassword(formData.password);

            if (!result.success) {
                throw new Error(result.error);
            }

            setResetComplete(true);
            setFeedback({
                type: 'success',
                message: 'Senha alterada com sucesso!'
            });

        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Falha ao alterar senha. Tente novamente.'
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
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

                <motion.div
                    className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Card */}
            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="relative pt-10 pb-8 px-8">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                        <motion.div
                            className="flex flex-col items-center gap-4"
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: { transition: { staggerChildren: 0.1 } }
                            }}
                        >
                            <motion.div className="relative" variants={fadeInUp}>
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    {resetComplete ? (
                                        <ShieldCheck className="w-8 h-8 text-white" />
                                    ) : (
                                        <KeyRound className="w-8 h-8 text-white" />
                                    )}
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
                                    {resetComplete ? 'Senha Alterada!' : 'Nova Senha'}
                                </h1>
                                <p className="text-white/60 mt-2 text-sm">
                                    {resetComplete
                                        ? 'Sua senha foi atualizada com sucesso'
                                        : 'Crie uma nova senha segura para sua conta'
                                    }
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pb-8">
                        <AnimatePresence mode="wait">
                            {resetComplete ? (
                                // Estado: Reset completo
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", duration: 0.5 }}
                                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                    </motion.div>

                                    <p className="text-white/60 text-sm mb-6">
                                        Você já pode fazer login com sua nova senha.
                                    </p>

                                    <Link
                                        to="/auth/login"
                                        className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
                             transform transition-all duration-300 hover:scale-[1.02]
                             shadow-lg shadow-emerald-500/25"
                                    >
                                        Fazer Login
                                    </Link>
                                </motion.div>
                            ) : (
                                // Estado: Formulário
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                    initial="initial"
                                    animate="animate"
                                    variants={{
                                        animate: { transition: { staggerChildren: 0.1 } }
                                    }}
                                >
                                    {/* Campo Nova Senha */}
                                    <motion.div className="space-y-2" variants={fadeInUp}>
                                        <label
                                            htmlFor="password"
                                            className="text-sm font-medium text-white/80 flex items-center gap-2"
                                        >
                                            <Lock className="w-4 h-4" />
                                            Nova Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange('password')}
                                                disabled={isBusy}
                                                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border border-white/10 text-white 
                                 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 
                                 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300
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

                                        {/* Barra de força */}
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
                                    <motion.div className="space-y-2" variants={fadeInUp}>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="text-sm font-medium text-white/80 flex items-center gap-2"
                                        >
                                            <Lock className="w-4 h-4" />
                                            Confirmar Nova Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={handleChange('confirmPassword')}
                                                disabled={isBusy}
                                                className={`w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border text-white 
                                 placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all duration-300
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                                                        : formData.confirmPassword && formData.password === formData.confirmPassword
                                                            ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                                                            : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20'
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
                                            <p className="text-xs text-red-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                As senhas não coincidem
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Botão */}
                                    <motion.button
                                        type="submit"
                                        disabled={isBusy}
                                        className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden
                             bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
                             disabled:opacity-70 disabled:cursor-not-allowed
                             transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                             shadow-lg shadow-emerald-500/25"
                                        variants={fadeInUp}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isBusy ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Alterando...
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5" />
                                                    Alterar Senha
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
                          ${feedback?.type === 'success'
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
                            )}
                        </AnimatePresence>

                        {/* Link voltar */}
                        {!resetComplete && (
                            <div className="mt-8 text-center">
                                <Link
                                    to="/auth/login"
                                    className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar ao login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-white/30 mt-6">
                    © {new Date().getFullYear()} PROCON Manaus Municipal
                </p>
            </motion.div>
        </div>
    );
}
