# Sistema Procon - Inicialização Mobile
# Script PowerShell para Windows

param(
    [switch]$SkipChecks,
    [switch]$ForceReinstall
)

# Configurar encoding para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 SISTEMA PROCON - INICIALIZAÇÃO MOBILE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para verificar se um comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar Node.js
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Para instalar Node.js:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Baixe a versão LTS" -ForegroundColor White
    Write-Host "3. Execute o instalador" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter após instalar o Node.js"
    
    if (-not (Test-Command "node")) {
        Write-Host "❌ Node.js ainda não foi encontrado. Saindo..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Node.js encontrado!" -ForegroundColor Green
node --version

# Verificar Python
Write-Host ""
Write-Host "📋 Verificando Python..." -ForegroundColor Yellow
if (-not (Test-Command "python")) {
    Write-Host "❌ Python não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Para instalar Python:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://python.org/" -ForegroundColor White
    Write-Host "2. Baixe a versão 3.8+" -ForegroundColor White
    Write-Host "3. Execute o instalador" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter após instalar o Python"
    
    if (-not (Test-Command "python")) {
        Write-Host "❌ Python ainda não foi encontrado. Saindo..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Python encontrado!" -ForegroundColor Green
python --version

# Obter IP da máquina
Write-Host ""
Write-Host "🌐 Obtendo IP da máquina..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "127.*"} | Select-Object -First 1).IPAddress
}

if (-not $ipAddress) {
    Write-Host "❌ Não foi possível obter o IP da máquina!" -ForegroundColor Red
    $ipAddress = "localhost"
}

Write-Host "✅ IP encontrado: $ipAddress" -ForegroundColor Green

# Verificar e instalar dependências do Frontend
Write-Host ""
Write-Host "📦 Verificando dependências do Frontend..." -ForegroundColor Yellow
if ($ForceReinstall -or -not (Test-Path "frontend\node_modules")) {
    Write-Host "⏳ Instalando dependências do Frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências do Frontend!" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✅ Dependências do Frontend instaladas!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependências do Frontend já instaladas" -ForegroundColor Green
}

# Verificar e instalar dependências do Backend
Write-Host ""
Write-Host "📦 Verificando dependências do Backend..." -ForegroundColor Yellow
if ($ForceReinstall -or -not (Test-Path "procon_system\venv")) {
    Write-Host "⏳ Criando ambiente virtual Python..." -ForegroundColor Yellow
    Set-Location procon_system
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao criar ambiente virtual!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⏳ Ativando ambiente virtual..." -ForegroundColor Yellow
    & ".\venv\Scripts\Activate.ps1"
    
    Write-Host "⏳ Instalando dependências Python..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências Python!" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✅ Dependências do Backend instaladas!" -ForegroundColor Green
} else {
    Write-Host "✅ Ambiente virtual Python já existe" -ForegroundColor Green
}

# Verificar se as portas estão disponíveis
Write-Host ""
Write-Host "🔍 Verificando portas..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "⚠️  Porta 3000 está em uso!" -ForegroundColor Yellow
    Write-Host "   Processo: $($port3000.ProcessName) (PID: $($port3000.OwningProcess))" -ForegroundColor White
    $kill3000 = Read-Host "Deseja encerrar o processo? (s/n)"
    if ($kill3000 -eq "s") {
        Stop-Process -Id $port3000.OwningProcess -Force
        Write-Host "✅ Processo encerrado!" -ForegroundColor Green
    }
}

if ($port8000) {
    Write-Host "⚠️  Porta 8000 está em uso!" -ForegroundColor Yellow
    Write-Host "   Processo: $($port8000.ProcessName) (PID: $($port8000.OwningProcess))" -ForegroundColor White
    $kill8000 = Read-Host "Deseja encerrar o processo? (s/n)"
    if ($kill8000 -eq "s") {
        Stop-Process -Id $port8000.OwningProcess -Force
        Write-Host "✅ Processo encerrado!" -ForegroundColor Green
    }
}

# Iniciar Backend
Write-Host ""
Write-Host "🔄 Iniciando Backend Django..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\procon_system
    & ".\venv\Scripts\Activate.ps1"
    python manage.py runserver 0.0.0.0:8000
}

# Aguardar um pouco para o backend inicializar
Write-Host "⏳ Aguardando inicialização do backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar Frontend
Write-Host ""
Write-Host "🔄 Iniciando Frontend React..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev:mobile
}

# Aguardar um pouco para o frontend inicializar
Write-Host "⏳ Aguardando inicialização do frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Mostrar informações de acesso
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📱 INFORMAÇÕES DE ACESSO MOBILE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 IP da máquina: $ipAddress" -ForegroundColor White
Write-Host "🔗 Frontend: http://$ipAddress`:3000" -ForegroundColor Green
Write-Host "🔗 Backend: http://$ipAddress`:8000" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host "1. Aguarde os servidores inicializarem (pode demorar 1-2 minutos)" -ForegroundColor White
Write-Host "2. No celular, acesse: http://$ipAddress`:3000" -ForegroundColor White
Write-Host "3. Para testar o escaneamento:" -ForegroundColor White
Write-Host "   - Acesse: /fiscalizacao/apreensao-inutilizacao" -ForegroundColor White
Write-Host "   - Clique no botão da câmera 📷" -ForegroundColor White
Write-Host "   - Use o código: 7891234567890" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Celular e PC devem estar na mesma rede Wi-Fi" -ForegroundColor White
Write-Host "- Para parar: Pressione Ctrl+C neste terminal" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para limpar jobs ao sair
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Encerrando servidores..." -ForegroundColor Yellow
    if ($backendJob) { Stop-Job $backendJob; Remove-Job $backendJob }
    if ($frontendJob) { Stop-Job $frontendJob; Remove-Job $frontendJob }
    Write-Host "✅ Servidores encerrados!" -ForegroundColor Green
}

# Registrar função de limpeza
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Aguardar tecla para sair
Write-Host "Pressione Ctrl+C para parar os servidores..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Cleanup
}
