/**
 * @fileoverview Página de Recuperação de Senha com Supabase Auth
 * @description Solicita reset de senha via email
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Mail,
    ArrowLeft,
    Loader2,
    KeyRound,
    Send,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/SupabaseAuthContext';

// Animações
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function ForgotPassword() {
    const { requestPasswordReset, isLoading, error, clearError } = useAuth();

    const [email, setEmail] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleChange = (event) => {
        if (feedback) setFeedback(null);
        if (error) clearError();
        setEmail(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (feedback) setFeedback(null);
        if (error) clearError();

        // Validação
        if (!email) {
            setFeedback({ type: 'error', message: 'Por favor, informe seu email.' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setFeedback({ type: 'error', message: 'Por favor, insira um email válido.' });
            return;
        }

        setSubmitting(true);

        try {
            const result = await requestPasswordReset(email);

            if (!result.success) {
                throw new Error(result.error);
            }

            setEmailSent(true);
            setFeedback({
                type: 'success',
                message: result.message || 'Se o email existir, você receberá um link para redefinir sua senha.'
            });

        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Falha ao enviar email. Tente novamente.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isBusy = submitting || isLoading;

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background com gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

                {/* Orbs animados */}
                <motion.div
                    className="absolute top-1/4 right-1/3 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl"
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
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                        {/* Botão Voltar */}
                        <motion.div
                            className="absolute top-4 left-4"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link
                                to="/auth/login"
                                className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Link>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center gap-4"
                            initial="initial"
                            animate="animate"
                            variants={{
                                animate: {
                                    transition: { staggerChildren: 0.1 }
                                }
                            }}
                        >
                            {/* Ícone */}
                            <motion.div
                                className="relative"
                                variants={fadeInUp}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <KeyRound className="w-8 h-8 text-white" />
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
                                    Esqueceu a senha?
                                </h1>
                                <p className="text-white/60 mt-2 text-sm max-w-xs">
                                    Não se preocupe! Informe seu email e enviaremos instruções para redefinir sua senha.
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pb-8">
                        <AnimatePresence mode="wait">
                            {emailSent ? (
                                // Estado: Email enviado com sucesso
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center py-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", duration: 0.5 }}
                                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                    </motion.div>

                                    <h2 className="text-lg font-semibold text-white mb-2">
                                        Email enviado!
                                    </h2>
                                    <p className="text-white/60 text-sm mb-6">
                                        Verifique sua caixa de entrada em <span className="text-white font-medium">{email}</span> e siga as instruções para redefinir sua senha.
                                    </p>

                                    <div className="space-y-3">
                                        <p className="text-white/40 text-xs">
                                            Não recebeu o email? Verifique a pasta de spam.
                                        </p>
                                        <button
                                            onClick={() => setEmailSent(false)}
                                            className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                                        >
                                            Tentar outro email
                                        </button>
                                    </div>
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
                                        animate: {
                                            transition: { staggerChildren: 0.1 }
                                        }
                                    }}
                                >
                                    {/* Campo Email */}
                                    <motion.div className="space-y-2" variants={fadeInUp}>
                                        <label
                                            htmlFor="email"
                                            className="text-sm font-medium text-white/80 flex items-center gap-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email cadastrado
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={handleChange}
                                            disabled={isBusy}
                                            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white 
                               placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 
                               focus:ring-2 focus:ring-amber-500/20 transition-all duration-300
                               disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="seu@email.com"
                                        />
                                    </motion.div>

                                    {/* Botão */}
                                    <motion.button
                                        type="submit"
                                        disabled={isBusy}
                                        className="relative w-full py-4 rounded-xl font-semibold text-white overflow-hidden
                             bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500
                             disabled:opacity-70 disabled:cursor-not-allowed
                             transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                             shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                                        variants={fadeInUp}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isBusy ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    Enviar instruções
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

                        {/* Link voltar ao login */}
                        <div className="mt-8 text-center">
                            <Link
                                to="/auth/login"
                                className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar ao login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <p className="text-center text-xs text-white/30 mt-6">
                    © {new Date().getFullYear()} PROCON Manaus Municipal
                </p>
            </motion.div>
        </div>
    );
}
