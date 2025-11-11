import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { clearAuth, setCredentials, setStatus } from '@/store/authSlice';
import { login as loginService, LoginPayload, logout as logoutService } from '@/services/authService';

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const login = useCallback(
    async (payload: LoginPayload) => {
      dispatch(setStatus('loading'));
      try {
        const response = await loginService(payload);
        dispatch(setCredentials(response));
        dispatch(setStatus('authenticated'));
      } catch (error) {
        dispatch(setStatus('idle'));
        throw error;
      }
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    dispatch(clearAuth());
    await logoutService();
    router.replace('/login');
  }, [dispatch, router]);

  return { login, logout };
}

export function useAuthSelector() {
  const { user, status } = useAppSelector(state => state.auth);
  return {
    user,
    status,
    isAuthenticated: Boolean(user),
  };
}
