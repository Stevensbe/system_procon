#!/usr/bin/env node

/**
 * Teste Rápido da Configuração Google Vision API
 * Execute: node testar_configuracao_api.js
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
    const envFile = path.join(__dirname, 'frontend', '.env.local');
    
    log('🔍 Verificando arquivo .env.local...', 'cyan');
    
    if (!fs.existsSync(envFile)) {
        log('❌ Arquivo .env.local não encontrado!', 'red');
        log('   Execute o script de configuração primeiro.', 'yellow');
        return false;
    }
    
    const content = fs.readFileSync(envFile, 'utf8');
    const apiKeyMatch = content.match(/REACT_APP_GOOGLE_VISION_API_KEY=(.+)/);
    
    if (!apiKeyMatch) {
        log('❌ Variável REACT_APP_GOOGLE_VISION_API_KEY não encontrada!', 'red');
        return false;
    }
    
    const apiKey = apiKeyMatch[1].trim();
    
    if (!apiKey || apiKey === 'sua_chave_google_vision_aqui') {
        log('❌ API Key não configurada ou está com valor padrão!', 'red');
        return false;
    }
    
    log('✅ API Key encontrada!', 'green');
    log(`🔑 Chave: ${apiKey.substring(0, 10)}...`, 'cyan');
    
    return true;
}

function testApiKey() {
    log('🧪 Testando API Key...', 'cyan');
    
    // Carregar variáveis de ambiente do .env.local
    const envFile = path.join(__dirname, 'frontend', '.env.local');
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^([^#][^=]+)=(.*)$/);
            if (match) {
                process.env[match[1]] = match[2];
            }
        });
    }
    
    const apiKey = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
        log('❌ API Key não encontrada nas variáveis de ambiente!', 'red');
        return false;
    }
    
    // Teste básico da API (sem fazer request real)
    log('✅ API Key carregada nas variáveis de ambiente!', 'green');
    
    // Verificar formato da chave
    if (apiKey.length < 20) {
        log('⚠️  API Key parece muito curta!', 'yellow');
    } else if (apiKey.length > 50) {
        log('⚠️  API Key parece muito longa!', 'yellow');
    } else {
        log('✅ Formato da API Key parece correto!', 'green');
    }
    
    return true;
}

function checkDependencies() {
    log('🔍 Verificando dependências...', 'cyan');
    
    const packageJsonPath = path.join(__dirname, 'frontend', 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        log('❌ package.json não encontrado!', 'red');
        return false;
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        log('✅ package.json encontrado!', 'green');
        
        // Verificar se o React está instalado
        if (packageJson.dependencies && packageJson.dependencies.react) {
            log(`✅ React ${packageJson.dependencies.react}`, 'green');
        } else {
            log('⚠️  React não encontrado nas dependências!', 'yellow');
        }
        
        return true;
    } catch (error) {
        log('❌ Erro ao ler package.json!', 'red');
        return false;
    }
}

function checkServerStatus() {
    log('🔍 Verificando status do servidor...', 'cyan');
    
    const net = require('net');
    const client = new net.Socket();
    
    return new Promise((resolve) => {
        client.connect(3000, 'localhost', () => {
            log('✅ Servidor rodando na porta 3000!', 'green');
            client.destroy();
            resolve(true);
        });
        
        client.on('error', () => {
            log('ℹ️  Servidor não está rodando na porta 3000', 'blue');
            log('   Execute: npm start', 'white');
            client.destroy();
            resolve(false);
        });
        
        // Timeout de 2 segundos
        setTimeout(() => {
            log('ℹ️  Timeout ao verificar servidor', 'blue');
            client.destroy();
            resolve(false);
        }, 2000);
    });
}

async function main() {
    log('', 'white');
    log('========================================', 'cyan');
    log('  🧪 TESTE DE CONFIGURAÇÃO GOOGLE VISION', 'cyan');
    log('========================================', 'cyan');
    log('', 'white');
    
    let allTestsPassed = true;
    
    // Teste 1: Verificar arquivo .env.local
    if (!checkEnvFile()) {
        allTestsPassed = false;
    }
    
    log('', 'white');
    
    // Teste 2: Verificar API Key
    if (!testApiKey()) {
        allTestsPassed = false;
    }
    
    log('', 'white');
    
    // Teste 3: Verificar dependências
    if (!checkDependencies()) {
        allTestsPassed = false;
    }
    
    log('', 'white');
    
    // Teste 4: Verificar servidor
    const serverRunning = await checkServerStatus();
    
    log('', 'white');
    log('📊 RESUMO DOS TESTES:', 'cyan');
    log('', 'white');
    
    if (allTestsPassed) {
        log('✅ Todos os testes de configuração passaram!', 'green');
        log('', 'white');
        log('🎯 PRÓXIMOS PASSOS:', 'green');
        log('1. Se o servidor não estiver rodando, execute: npm start', 'white');
        log('2. Acesse: http://localhost:3000/fiscalizacao/teste-barcode', 'white');
        log('3. Teste o scanner de código de barras', 'white');
    } else {
        log('❌ Alguns testes falharam!', 'red');
        log('', 'white');
        log('🔧 SOLUÇÃO:', 'yellow');
        log('1. Execute o script de configuração:', 'white');
        log('   Windows: configurar_google_vision_api.bat', 'white');
        log('   PowerShell: .\\configurar_google_vision_api.ps1', 'white');
        log('   Linux/Mac: ./configurar_google_vision_api.sh', 'white');
        log('2. Configure sua API Key do Google Cloud Vision', 'white');
        log('3. Execute este teste novamente', 'white');
    }
    
    log('', 'white');
}

// Executar o teste
main().catch(error => {
    log(`❌ Erro durante o teste: ${error.message}`, 'red');
    process.exit(1);
});
