import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Preencher formulário de login
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    
    // Clicar no botão de login
    await page.click('[data-testid="login-button"]');
    
    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verificar se o usuário está logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Preencher formulário com credenciais inválidas
    await page.fill('[data-testid="username-input"]', 'usuario_invalido');
    await page.fill('[data-testid="password-input"]', 'senha_invalida');
    
    // Clicar no botão de login
    await page.click('[data-testid="login-button"]');
    
    // Verificar se a mensagem de erro aparece
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
    
    // Verificar se ainda está na página de login
    await expect(page).toHaveURL('/login');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Fazer login primeiro
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL('/dashboard');
    
    // Clicar no menu do usuário
    await page.click('[data-testid="user-menu"]');
    
    // Clicar no botão de logout
    await page.click('[data-testid="logout-button"]');
    
    // Verificar se foi redirecionado para login
    await expect(page).toHaveURL('/login');
  });

  test('deve proteger rotas sem autenticação', async ({ page }) => {
    // Tentar acessar dashboard sem estar logado
    await page.goto('/dashboard');
    
    // Verificar se foi redirecionado para login
    await expect(page).toHaveURL('/login');
  });

  test('deve manter sessão após refresh', async ({ page }) => {
    // Fazer login
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Aguardar redirecionamento
    await expect(page).toHaveURL('/dashboard');
    
    // Fazer refresh da página
    await page.reload();
    
    // Verificar se ainda está logado
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
