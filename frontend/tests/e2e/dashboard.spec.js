import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve carregar dashboard com dados', async ({ page }) => {
    // Verificar se os KPIs estão visíveis
    await expect(page.locator('[data-testid="kpi-arrecadacao"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-pendente"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-atraso"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-conversao"]')).toBeVisible();
    
    // Verificar se os gráficos estão carregados
    await expect(page.locator('[data-testid="grafico-arrecadacao"]')).toBeVisible();
    await expect(page.locator('[data-testid="grafico-multas"]')).toBeVisible();
  });

  test('deve navegar para módulos do sistema', async ({ page }) => {
    // Testar navegação para Multas
    await page.click('[data-testid="nav-multas"]');
    await expect(page).toHaveURL('/multas');
    
    // Voltar para dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Testar navegação para Fiscalização
    await page.click('[data-testid="nav-fiscalizacao"]');
    await expect(page).toHaveURL('/fiscalizacao');
  });

  test('deve filtrar dados por período', async ({ page }) => {
    // Selecionar período diferente
    await page.click('[data-testid="periodo-selector"]');
    await page.click('[data-testid="periodo-ultimo-mes"]');
    
    // Verificar se os dados foram atualizados
    await expect(page.locator('[data-testid="kpi-arrecadacao"]')).toBeVisible();
    
    // Aguardar carregamento dos dados
    await page.waitForTimeout(2000);
  });

  test('deve mostrar loading durante carregamento', async ({ page }) => {
    // Recarregar página para ver loading
    await page.reload();
    
    // Verificar se loading aparece
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Aguardar carregamento completo
    await expect(page.locator('[data-testid="kpi-arrecadacao"]')).toBeVisible();
  });

  test('deve ser responsivo em mobile', async ({ page }) => {
    // Mudar para viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar se menu mobile aparece
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verificar se KPIs estão em layout mobile
    await expect(page.locator('[data-testid="kpi-arrecadacao"]')).toBeVisible();
  });

  test('deve exportar relatórios', async ({ page }) => {
    // Clicar no botão de exportar
    await page.click('[data-testid="export-button"]');
    
    // Selecionar formato PDF
    await page.click('[data-testid="export-pdf"]');
    
    // Verificar se download foi iniciado
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
