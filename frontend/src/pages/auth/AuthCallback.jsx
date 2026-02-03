/**
 * @fileoverview Callback de autenticação do Supabase
 * @description Processa callbacks de OAuth, Magic Link e Reset de Senha
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/SupabaseAuthContext';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { getRedirectPath, profile } = useAuth();

    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Processando autenticação...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Verifica se há parâmetros de erro na URL
                const errorDescription = searchParams.get('error_description');
                if (errorDescription) {
                    throw new Error(errorDescription);
                }

                // Obtém o tipo de callback
                const type = searchParams.get('type');

                // Verifica se é um callback de recovery (reset de senha)
                if (type === 'recovery') {
                    setStatus('success');
                    setMessage('Redirecionando para redefinição de senha...');
                    setTimeout(() => navigate('/auth/reset-password'), 1500);
                    return;
                }

                // Verifica se é um callback de signup (confirmação de email)
                if (type === 'signup') {
                    setStatus('success');
                    setMessage('Email confirmado com sucesso! Redirecionando...');
                    setTimeout(() => navigate('/auth/login'), 2000);
                    return;
                }

                // Para outros tipos, verifica a sessão
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    setStatus('success');
                    setMessage('Autenticação bem-sucedida! Redirecionando...');

                    // Aguarda um pouco para o contexto atualizar
                    setTimeout(() => {
                        const redirectPath = getRedirectPath(profile);
                        navigate(redirectPath);
                    }, 1500);
                } else {
                    // Sem sessão, manda de volta para login
                    setStatus('error');
                    setMessage('Sessão não encontrada. Redirecionando para login...');
                    setTimeout(() => navigate('/auth/login'), 2000);
                }

            } catch (error) {
                console.error('[AuthCallback] Erro:', error);
                setStatus('error');
                setMessage(error.message || 'Erro ao processar autenticação');
                setTimeout(() => navigate('/auth/login'), 3000);
            }
        };

        handleCallback();
    }, [navigate, searchParams, getRedirectPath, profile]);

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <motion.div
                    className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Card */}
            <motion.div
                className="relative z-10 w-full max-w-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
                    {/* Ícone de Status */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
                        className="mb-6"
                    >
                        {status === 'processing' && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-400" />
                            </div>
                        )}
                    </motion.div>

                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white/80" />
                        </div>
                    </div>

                    {/* Mensagem */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className={`text-lg font-semibold mb-2 ${status === 'error' ? 'text-red-400' :
                                status === 'success' ? 'text-emerald-400' : 'text-white'
                            }`}>
                            {status === 'processing' && 'Processando...'}
                            {status === 'success' && 'Sucesso!'}
                            {status === 'error' && 'Ops!'}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {message}
                        </p>
                    </motion.div>

                    {/* Barra de progresso animada */}
                    {status === 'processing' && (
                        <motion.div
                            className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3, ease: "linear" }}
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
