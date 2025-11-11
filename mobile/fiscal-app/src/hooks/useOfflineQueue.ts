import { useCallback } from 'react';
import { enqueueAuto, markAutoError, markAutoSynced } from '@/store/offlineSlice';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { enviarAutoConstatacao, AutoConstatacaoPayload } from '@/services/syncService';

export function useOfflineQueue() {
  const dispatch = useAppDispatch();
  const autos = useAppSelector(state => state.offline.autos);

  const addAutoDraft = useCallback(
    async (payload: AutoConstatacaoPayload) => {
      const draft = {
        ...payload,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };
      dispatch(enqueueAuto(draft));
      try {
        const response = await enviarAutoConstatacao(payload);
        dispatch(markAutoSynced({ uuid: payload.uuid, numero: response.numero }));
        return response;
      } catch (error: any) {
        dispatch(markAutoError({ uuid: payload.uuid, error: error?.message || 'Erro ao sincronizar' }));
        throw error;
      }
    },
    [dispatch],
  );

  return {
    autos,
    addAutoDraft,
  };
}
