// Utilitário para detectar e configurar modo demo

export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

export const showDemoModeNotice = () => {
  if (isDemoMode()) {
    console.log(
      '%c🔄 MODO DEMONSTRAÇÃO ATIVADO %c\n' +
      'O sistema está exibindo dados simulados.\n' +
      'Para conectar com o backend real, defina VITE_DEMO_MODE=false no .env.local',
      'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
      'color: #92400e; font-weight: normal;'
    );
  }
};

// Auto-executar quando o módulo é importado
showDemoModeNotice();
