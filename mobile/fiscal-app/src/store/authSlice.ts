import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthResponse } from '@/services/authService';

interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'loading' | 'authenticated';
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.status = 'authenticated';
    },
    setStatus(state, action: PayloadAction<AuthState['status']>) {
      state.status = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'idle';
    },
  },
});

export const { setCredentials, clearAuth, setStatus } = authSlice.actions;
export const authReducer = authSlice.reducer;
