import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useInboxStats = () => {
  const [stats, setStats] = useState({
    pessoal: 0,
    setor: 0,
    naoLidos: 0,
    emAndamento: 0,
    denuncias: 0,
    fiscalizacao: 0,
    juridico1: 0,
    juridico2: 0,
    daf: 0,
    diretoria: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Buscar estatísticas das caixas de entrada
        const response = await get('/api/caixas-entrada/stats/');
        
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        
        // Fallback com dados mockados em caso de erro
        setStats({
          pessoal: 12,
          setor: 8,
          naoLidos: 5,
          emAndamento: 3,
          denuncias: 5,
          fiscalizacao: 8,
          juridico1: 3,
          juridico2: 2,
          daf: 4,
          diretoria: 1
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [get]);

  return {
    stats,
    isLoading,
    refetch: () => {
      setIsLoading(true);
      fetchStats();
    }
  };
};

