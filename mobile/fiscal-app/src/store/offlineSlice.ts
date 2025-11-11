import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AutoConstatacaoPayload } from '@/services/syncService';

export interface AutoDraft extends AutoConstatacaoPayload {
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
  errorMessage?: string;
}

interface OfflineState {
  autos: AutoDraft[];
}

const initialState: OfflineState = {
  autos: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    enqueueAuto(state, action: PayloadAction<AutoDraft>) {
      state.autos.push(action.payload);
    },
    markAutoSynced(state, action: PayloadAction<{ uuid: string; numero?: string }>) {
      state.autos = state.autos.map(auto =>
        auto.uuid === action.payload.uuid
          ? { ...auto, status: 'synced', errorMessage: undefined }
          : auto,
      );
    },
    markAutoError(state, action: PayloadAction<{ uuid: string; error: string }>) {
      state.autos = state.autos.map(auto =>
        auto.uuid === action.payload.uuid
          ? { ...auto, status: 'error', errorMessage: action.payload.error }
          : auto,
      );
    },
    clearSynced(state) {
      state.autos = state.autos.filter(auto => auto.status !== 'synced');
    },
  },
});

export const { enqueueAuto, markAutoSynced, markAutoError, clearSynced } = offlineSlice.actions;
export const offlineReducer = offlineSlice.reducer;
