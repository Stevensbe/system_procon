import { test, expect } from '@playwright/test';

test.describe('Módulo de Protocolo', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
    
    // Fazer login (ajustar credenciais conforme necessário)
    await page.fill('[data-testid="email"]', 'admin@procon.am.gov.br');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('/dashboard');
  });

  test('deve navegar para o módulo de protocolo', async ({ page }) => {
    // Clicar no menu Protocolo
    await page.click('text=Protocolo');
    
    // Verificar se foi redirecionado para a lista
    await expect(page).toHaveURL('/protocolo/lista');
    await expect(page.locator('h1')).toContainText('Protocolos');
  });

  test('deve exibir lista de protocolos com filtros', async ({ page }) => {
    await page.goto('/protocolo/lista');
    
    // Verificar se os filtros estão presentes
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
    await expect(page.locator('select')).toHaveCount(3); // Tipo, Status, Prioridade
    
    // Verificar se a tabela está presente
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar se as estatísticas estão presentes
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Em Tramitação')).toBeVisible();
    await expect(page.locator('text=Atrasados')).toBeVisible();
    await expect(page.locator('text=Concluídos')).toBeVisible();
  });

  test('deve criar novo protocolo', async ({ page }) => {
    await page.goto('/protocolo/lista');
    
    // Clicar no botão "Novo Protocolo"
    await page.click('text=Novo Protocolo');
    
    // Verificar se foi redirecionado para o formulário
    await expect(page).toHaveURL('/protocolo/novo');
    
    // Preencher dados básicos
    await page.fill('[name="assunto"]', 'Teste de Protocolo E2E');
    await page.fill('[name="descricao"]', 'Descrição do teste automatizado');
    await page.selectOption('[name="tipo_solicitacao"]', 'Reclamação');
    await page.selectOption('[name="prioridade"]', 'Normal');
    
    // Preencher dados do requerente
    await page.fill('[name="nome_requerente"]', 'João Teste Silva');
    await page.fill('[name="cpf_cnpj"]', '123.456.789-00');
    await page.fill('[name="email"]', 'joao.teste@email.com');
    await page.fill('[name="telefone"]', '(11) 98765-4321');
    
    // Salvar protocolo
    await page.click('text=Salvar Protocolo');
    
    // Verificar se foi redirecionado para os detalhes
    await expect(page).toHaveURL(/\/protocolo\/\d+$/);
    await expect(page.locator('text=Teste de Protocolo E2E')).toBeVisible();
  });

  test('deve visualizar detalhes do protocolo', async ({ page }) => {
    // Navegar para um protocolo específico (ajustar ID conforme necessário)
    await page.goto('/protocolo/1');
    
    // Verificar se as informações básicas estão presentes
    await expect(page.locator('text=PROT-1-2024')).toBeVisible();
    await expect(page.locator('text=Em Análise')).toBeVisible();
    
    // Verificar se as abas estão presentes
    await expect(page.locator('text=Dados')).toBeVisible();
    await expect(page.locator('text=Documentos')).toBeVisible();
    await expect(page.locator('text=Tramitação')).toBeVisible();
    await expect(page.locator('text=Alertas')).toBeVisible();
  });

  test('deve fazer upload de documentos', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de documentos
    await page.click('text=Documentos');
    
    // Verificar se o componente de upload está presente
    await expect(page.locator('text=Arraste arquivos aqui')).toBeVisible();
    
    // Simular upload de arquivo (criar arquivo temporário se necessário)
    const filePath = 'test-files/test-document.pdf';
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Verificar se o arquivo foi adicionado
    await expect(page.locator('text=test-document.pdf')).toBeVisible();
  });

  test('deve filtrar protocolos', async ({ page }) => {
    await page.goto('/protocolo/lista');
    
    // Aplicar filtro de busca
    await page.fill('input[placeholder*="Buscar"]', 'reclamação');
    await page.click('text=Filtrar');
    
    // Verificar se os resultados foram filtrados
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    
    // Limpar filtros
    await page.click('text=Limpar');
    
    // Verificar se todos os resultados voltaram
    await expect(page.locator('table tbody tr')).toHaveCount.greaterThan(1);
  });

  test('deve editar protocolo', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Clicar no botão editar
    await page.click('text=Editar');
    
    // Verificar se foi redirecionado para o formulário de edição
    await expect(page).toHaveURL('/protocolo/1/editar');
    
    // Modificar o assunto
    await page.fill('[name="assunto"]', 'Protocolo Editado via E2E');
    
    // Salvar alterações
    await page.click('text=Salvar Protocolo');
    
    // Verificar se as alterações foram salvas
    await expect(page.locator('text=Protocolo Editado via E2E')).toBeVisible();
  });

  test('deve tramitar protocolo', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de tramitação
    await page.click('text=Tramitação');
    
    // Verificar se o histórico de tramitação está presente
    await expect(page.locator('text=Histórico de Tramitação')).toBeVisible();
    
    // Clicar no botão de tramitar (se existir)
    await page.click('text=Tramitar');
    
    // Preencher dados da tramitação
    await page.selectOption('[name="novo_responsavel"]', '2'); // ID do responsável
    await page.fill('[name="observacoes"]', 'Tramitação via teste E2E');
    
    // Confirmar tramitação
    await page.click('text=Confirmar Tramitação');
    
    // Verificar se a tramitação foi registrada
    await expect(page.locator('text=Tramitação via teste E2E')).toBeVisible();
  });

  test('deve visualizar alertas do protocolo', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de alertas
    await page.click('text=Alertas');
    
    // Verificar se os alertas estão presentes
    await expect(page.locator('text=Alertas do Protocolo')).toBeVisible();
    
    // Marcar alerta como lido
    await page.click('[title="Marcar como lido"]');
    
    // Verificar se o alerta foi marcado como lido
    await expect(page.locator('text=Alerta marcado como lido')).toBeVisible();
  });

  test('deve exportar relatório', async ({ page }) => {
    await page.goto('/protocolo/lista');
    
    // Clicar no botão de exportar (se existir)
    await page.click('text=Exportar');
    
    // Verificar se o modal de exportação aparece
    await expect(page.locator('text=Exportar Protocolos')).toBeVisible();
    
    // Selecionar formato PDF
    await page.click('text=PDF');
    
    // Confirmar exportação
    await page.click('text=Exportar');
    
    // Verificar se o download foi iniciado
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('deve excluir protocolo', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Clicar no botão excluir
    await page.click('text=Excluir');
    
    // Confirmar exclusão no modal
    await page.click('text=Confirmar');
    
    // Verificar se foi redirecionado para a lista
    await expect(page).toHaveURL('/protocolo/lista');
    
    // Verificar se a mensagem de sucesso aparece
    await expect(page.locator('text=Protocolo excluído com sucesso')).toBeVisible();
  });

  test('deve usar funcionalidades de OCR', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de documentos
    await page.click('text=Documentos');
    
    // Fazer upload de uma imagem
    const imagePath = 'test-files/test-image.jpg';
    await page.setInputFiles('input[type="file"]', imagePath);
    
    // Verificar se o OCR foi processado
    await expect(page.locator('text=Texto extraído via OCR')).toBeVisible();
    
    // Clicar para ver o texto extraído
    await page.click('[title="Ver texto extraído"]');
    
    // Verificar se o modal com o texto aparece
    await expect(page.locator('text=Texto Extraído (OCR)')).toBeVisible();
  });

  test('deve usar visualizador de documentos', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de documentos
    await page.click('text=Documentos');
    
    // Clicar em um documento para visualizar
    await page.click('text=Nota Fiscal.pdf');
    
    // Verificar se o visualizador abre
    await expect(page.locator('text=Nota Fiscal.pdf')).toBeVisible();
    
    // Testar controles de zoom
    await page.click('[title="Aumentar zoom"]');
    await expect(page.locator('text=125%')).toBeVisible();
    
    // Fechar visualizador
    await page.click('[title="Fechar"]');
  });

  test('deve usar timeline de tramitação', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Navegar para a aba de tramitação
    await page.click('text=Tramitação');
    
    // Verificar se a timeline está presente
    await expect(page.locator('text=Histórico de Tramitação')).toBeVisible();
    
    // Expandir uma movimentação
    await page.click('[aria-label="Expandir movimentação"]');
    
    // Verificar se os detalhes aparecem
    await expect(page.locator('text=Responsável:')).toBeVisible();
    await expect(page.locator('text=Data/Hora:')).toBeVisible();
  });

  test('deve usar sistema de alertas', async ({ page }) => {
    await page.goto('/protocolo/1');
    
    // Verificar se os alertas estão presentes
    await expect(page.locator('text=Alertas do Protocolo')).toBeVisible();
    
    // Expandir lista de alertas
    await page.click('text=Expandir');
    
    // Verificar se todos os alertas aparecem
    await expect(page.locator('text=Total:')).toBeVisible();
    await expect(page.locator('text=Não lidos:')).toBeVisible();
    
    // Marcar todos como lidos
    await page.click('text=Marcar todos como lidos');
    
    // Verificar se a ação foi executada
    await expect(page.locator('text=Todos os alertas marcados como lidos')).toBeVisible();
  });
});

test.describe('Responsividade do Módulo de Protocolo', () => {
  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    // Configurar viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/protocolo/lista');
    
    // Verificar se a interface se adapta
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Novo Protocolo')).toBeVisible();
    
    // Verificar se os filtros são responsivos
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
  });

  test('deve funcionar em tablets', async ({ page }) => {
    // Configurar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/protocolo/lista');
    
    // Verificar se a interface se adapta
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Filtros')).toBeVisible();
  });
});
