# Script para atualizar projeto no GitHub
# Uso: .\git-update.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$false)]
    [string]$mensagem = "Atualização do projeto"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ATUALIZAÇÃO DO PROJETO NO GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se está em um repositório git
if (-not (Test-Path .git)) {
    Write-Host "ERRO: Este diretório não é um repositório Git!" -ForegroundColor Red
    Write-Host "Execute 'git init' primeiro ou navegue até a pasta do projeto." -ForegroundColor Yellow
    exit 1
}

# Verifica se há mudanças
Write-Host "[1/5] Verificando status do repositório..." -ForegroundColor Yellow
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✓ Nenhuma mudança detectada. Nada para commitar." -ForegroundColor Green
    Write-Host ""
    Write-Host "Deseja fazer push mesmo assim? (s/n): " -NoNewline -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -ne "s" -and $resposta -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ Mudanças detectadas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Arquivos modificados:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
}

# Adiciona todos os arquivos
Write-Host "[2/5] Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Arquivos adicionados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao adicionar arquivos!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Faz commit
Write-Host "[3/5] Criando commit..." -ForegroundColor Yellow
Write-Host "Mensagem: $mensagem" -ForegroundColor Cyan
git commit -m $mensagem
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao criar commit!" -ForegroundColor Red
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  - Nenhuma mudança para commitar" -ForegroundColor Yellow
    Write-Host "  - Problema com a mensagem do commit" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Verifica branch atual
Write-Host "[4/5] Verificando branch atual..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "Branch atual: $branch" -ForegroundColor Cyan
Write-Host ""

# Verifica se há remote configurado
$remote = git remote -v
if ([string]::IsNullOrWhiteSpace($remote)) {
    Write-Host "⚠ AVISO: Nenhum remote configurado!" -ForegroundColor Yellow
    Write-Host "Deseja adicionar um remote? (s/n): " -NoNewline -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -eq "s" -or $resposta -eq "S") {
        Write-Host "Digite a URL do repositório GitHub: " -NoNewline -ForegroundColor Yellow
        $url = Read-Host
        git remote add origin $url
        Write-Host "✓ Remote 'origin' adicionado!" -ForegroundColor Green
    } else {
        Write-Host "Operação cancelada. Configure o remote manualmente." -ForegroundColor Yellow
        exit 0
    }
}
Write-Host ""

# Faz push
Write-Host "[5/5] Enviando para o GitHub..." -ForegroundColor Yellow
Write-Host "Branch: $branch" -ForegroundColor Cyan

# Tenta push, se falhar, pergunta se quer criar branch upstream
git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠ Push falhou. Branch pode não existir no remote." -ForegroundColor Yellow
    Write-Host "Deseja criar a branch no remote? (s/n): " -NoNewline -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -eq "s" -or $resposta -eq "S") {
        git push -u origin $branch
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Branch criada e push realizado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "✗ Erro ao fazer push!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ Push realizado com sucesso!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ PROJETO ATUALIZADO NO GITHUB!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "  - Branch: $branch" -ForegroundColor White
Write-Host "  - Commit: $mensagem" -ForegroundColor White
Write-Host "  - Status: Enviado com sucesso" -ForegroundColor White
Write-Host ""

