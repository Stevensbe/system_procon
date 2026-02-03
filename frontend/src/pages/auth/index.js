/**
 * @fileoverview Exportações do módulo de autenticação
 * @description Centraliza exports das páginas de auth
 */

// Páginas de autenticação originais
export { default as Login } from './Login';
export { default as Logout } from './Logout';

// Páginas de autenticação Supabase
export { default as SupabaseLogin } from './SupabaseLogin';
export { default as SupabaseRegister } from './SupabaseRegister';
export { default as ForgotPassword } from './ForgotPassword';
export { default as ResetPassword } from './ResetPassword';
export { default as AuthCallback } from './AuthCallback';
