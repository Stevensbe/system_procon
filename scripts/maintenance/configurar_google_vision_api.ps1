# Configurador Google Vision API - PowerShell
# Execute como: powershell -ExecutionPolicy Bypass -File configurar_google_vision_api.ps1

param(
    [string]$ApiKey = ""
)

# Configurar encoding para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔍 CONFIGURADOR GOOGLE VISION API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Erro: Diretório 'frontend' não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script na raiz do projeto PROCON." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o arquivo .env.local já existe
$envFile = "frontend\.env.local"
if (Test-Path $envFile) {
    Write-Host "⚠️  Arquivo .env.local já existe!" -ForegroundColor Yellow
    Write-Host ""
    $choice = Read-Host "Deseja sobrescrever? (s/N)"
    if ($choice -ne "s" -and $choice -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 0
    }
}

Write-Host ""
Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Acesse: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Crie um projeto ou selecione um existente" -ForegroundColor White
Write-Host "3. Ative a Cloud Vision API" -ForegroundColor White
Write-Host "4. Crie uma chave de API" -ForegroundColor White
Write-Host "5. Cole a chave abaixo" -ForegroundColor White
Write-Host ""

# Solicitar a API key se não foi fornecida como parâmetro
if ([string]::IsNullOrEmpty($ApiKey)) {
    $ApiKey = Read-Host "🔑 Digite sua Google Vision API Key"
}

if ([string]::IsNullOrEmpty($ApiKey)) {
    Write-Host "❌ API Key não pode estar vazia!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Validar formato da API key (básico)
if ($ApiKey.Length -lt 20) {
    Write-Host "⚠️  Aviso: API Key parece muito curta!" -ForegroundColor Yellow
    Write-Host "   Verifique se copiou a chave completa." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continuar mesmo assim? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 0
    }
}

# Criar o conteúdo do arquivo .env.local
$envContent = @"
# Configurações do Frontend
REACT_APP_API_URL=http://localhost:8000

# Google Cloud Vision API
# Obtenha sua chave em: https://console.cloud.google.com/apis/credentials
REACT_APP_GOOGLE_VISION_API_KEY=$ApiKey

# Outras configurações
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
"@

# Salvar o arquivo
try {
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Localização: $envFile" -ForegroundColor Cyan
    Write-Host "🔑 API Key: $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)))..." -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao criar arquivo: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o servidor está rodando
Write-Host "🔍 Verificando se o servidor está rodando..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Servidor detectado na porta 3000" -ForegroundColor Yellow
    Write-Host ""
    $restart = Read-Host "Deseja reiniciar o servidor? (s/N)"
    if ($restart -eq "s" -or $restart -eq "S") {
        Write-Host "🔄 Reiniciando servidor..." -ForegroundColor Green
        Write-Host "   Feche o terminal atual e execute: npm start" -ForegroundColor White
    }
} else {
    Write-Host "ℹ️  Servidor não está rodando" -ForegroundColor Blue
    Write-Host "   Para testar, execute: npm start" -ForegroundColor White
}

# Verificar se o Node.js está instalado
Write-Host ""
Write-Host "🔍 Verificando dependências..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js não encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Node.js não encontrado" -ForegroundColor Yellow
}

# Verificar se o npm está instalado
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✅ npm encontrado: v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  npm não encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  npm não encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Reinicie o servidor de desenvolvimento" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:3000/fiscalizacao/teste-barcode" -ForegroundColor White
Write-Host "3. Teste o scanner de código de barras" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação: CONFIGURACAO_GOOGLE_VISION_API.md" -ForegroundColor Cyan
Write-Host ""

# Opção para abrir o navegador
$openBrowser = Read-Host "Deseja abrir o navegador para testar? (s/N)"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Write-Host "🌐 Abrindo navegador..." -ForegroundColor Green
    Start-Process "http://localhost:3000/fiscalizacao/teste-barcode"
}

Write-Host ""
Read-Host "Pressione Enter para sair"
