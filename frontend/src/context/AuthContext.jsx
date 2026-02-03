// Compat layer: use Supabase Auth as default auth context.
// This keeps existing imports from ./AuthContext working.
export { AuthProvider, useAuth, AuthState } from './SupabaseAuthContext';
export { default } from './SupabaseAuthContext';
