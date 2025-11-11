import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BootstrapResponse } from '@/services/syncService';

interface BootstrapState {
  lastSyncAt: string | null;
  pendingCount: number;
  config: BootstrapResponse['config'] | null;
  empresas: BootstrapResponse['empresas'];
  checklists: Record<string, string[]>;
  status: 'idle' | 'loading' | 'synced' | 'error';
}

const initialState: BootstrapState = {
  lastSyncAt: null,
  pendingCount: 0,
  config: null,
  empresas: [],
  checklists: {},
  status: 'idle',
};

const bootstrapSlice = createSlice({
  name: 'bootstrap',
  initialState,
  reducers: {
    setBootstrap(state, action: PayloadAction<{ data: BootstrapResponse; pendingCount: number }>) {
      state.lastSyncAt = action.payload.data.timestamp;
      state.config = action.payload.data.config;
      state.empresas = action.payload.data.empresas ?? [];
      state.checklists = Object.fromEntries(
        (action.payload.data.checklists ?? []).map(item => [item.tipo, item.itens]),
      );
      state.pendingCount = action.payload.pendingCount;
      state.status = 'synced';
    },
    setBootstrapStatus(state, action: PayloadAction<BootstrapState['status']>) {
      state.status = action.payload;
    },
    setPendingCount(state, action: PayloadAction<number>) {
      state.pendingCount = action.payload;
    },
  },
});

export const { setBootstrap, setBootstrapStatus, setPendingCount } = bootstrapSlice.actions;
export const bootstrapReducer = bootstrapSlice.reducer;
