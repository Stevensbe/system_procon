import { useQuery } from '@tanstack/react-query';
import { listarAgendamentos } from '@/services/syncService';

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: listarAgendamentos,
    staleTime: 1000 * 60 * 2,
  });
}
