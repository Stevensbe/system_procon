// Utilitário para verificar disponibilidade do backend
let backendAvailable = false; // Assume offline por padrão 
let lastCheck = null;
const CHECK_INTERVAL = 30000; // 30 segundos

export const isBackendAvailable = async () => {
  const now = Date.now();
  
  // Se já verificou recentemente, retorna o resultado cached
  if (lastCheck && (now - lastCheck) < CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  // Para desenvolvimento, sempre assume offline se VITE_DEMO_MODE for true
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    console.info('🔄 Modo demo ativado - usando dados simulados');
    backendAvailable = false;
    lastCheck = now;
    return false;
  }
  
  try {
    // Usa o navigator.onLine primeiro como verificação rápida
    if (!navigator.onLine) {
      console.info('🔄 Sem conexão de rede - usando modo offline');
      backendAvailable = false;
      lastCheck = now;
      return false;
    }
    
    // Faz uma verificação rápida usando HEAD request (mais leve)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 segundo timeout
    
    await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/`, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Evita problemas de CORS
    });
    
    clearTimeout(timeoutId);
    backendAvailable = true;
    lastCheck = now;
    console.info('✅ Backend disponível');
    
    return true;
  } catch (error) {
    // Qualquer erro assume offline
    console.info('🔄 Backend offline, usando dados simulados');
    backendAvailable = false;
    lastCheck = now;
    return false;
  }
};

export const resetBackendCheck = () => {
  backendAvailable = null;
  lastCheck = null;
};