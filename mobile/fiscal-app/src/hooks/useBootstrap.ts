import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { fetchBootstrap } from '@/services/syncService';
import { setBootstrap, setBootstrapStatus } from '@/store/bootstrapSlice';

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const { lastSyncAt, pendingCount, status } = useAppSelector(state => state.bootstrap);
  const offlineAutos = useAppSelector(state => state.offline.autos);

  const initialize = useCallback(async () => {
    try {
      dispatch(setBootstrapStatus('loading'));
      const data = await fetchBootstrap(lastSyncAt ?? undefined);
      const offlinePending = offlineAutos.filter(auto => auto.status !== 'synced').length;
      dispatch(setBootstrap({ data, pendingCount: offlinePending }));
      dispatch(setBootstrapStatus('synced'));
    } catch (error) {
      console.warn('Falha ao sincronizar bootstrap', error);
      dispatch(setBootstrapStatus('error'));
    }
  }, [dispatch, lastSyncAt, pendingCount]);

  const offlinePending = offlineAutos.filter(auto => auto.status !== 'synced').length;
  return {
    initialize,
    lastSyncAt,
    pendingCount: pendingCount ?? offlinePending,
    status,
    deviceId: uuidv4(),
  };
}
