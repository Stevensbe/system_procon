#!/usr/bin/env node

/**
 * Script para iniciar o servidor de desenvolvimento com acesso mobile
 * Permite que outros dispositivos na rede acessem o frontend
 */

const { execSync } = require('child_process');
const os = require('os');

// Função para obter o IP da máquina
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Ignorar interfaces não IPv4 e loopback
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    
    return 'localhost';
}

// Função para mostrar informações de acesso
function showAccessInfo(ip) {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR DE DESENVOLVIMENTO MOBILE');
    console.log('='.repeat(60));
    console.log(`📱 IP da máquina: ${ip}`);
    console.log(`🌐 URL de acesso: http://${ip}:3000`);
    console.log(`🔗 URL local: http://localhost:3000`);
    console.log('\n📋 INSTRUÇÕES PARA ACESSO MOBILE:');
    console.log('1. Certifique-se de que o celular está na mesma rede Wi-Fi');
    console.log('2. No navegador do celular, acesse:');
    console.log(`   http://${ip}:3000`);
    console.log('3. Para testar o escaneamento de código de barras:');
    console.log('   - Acesse: /fiscalizacao/apreensao-inutilizacao');
    console.log('   - Clique no botão da câmera ao lado do campo "Item"');
    console.log('   - Use o código de teste: 7891234567890');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('- O celular e computador devem estar na mesma rede');
    console.log('- Se não conseguir acessar, verifique o firewall');
    console.log('- Para parar o servidor: Ctrl+C');
    console.log('='.repeat(60) + '\n');
}

// Função para verificar se a porta está disponível
function checkPort(port) {
    try {
        const net = require('net');
        const server = net.createServer();
        
        return new Promise((resolve) => {
            server.listen(port, () => {
                server.close();
                resolve(true);
            });
            
            server.on('error', () => {
                resolve(false);
            });
        });
    } catch (error) {
        return Promise.resolve(true);
    }
}

// Função principal
async function startMobileServer() {
    try {
        const ip = getLocalIP();
        
        // Verificar se a porta 3000 está disponível
        const portAvailable = await checkPort(3000);
        
        if (!portAvailable) {
            console.log('❌ Erro: Porta 3000 já está em uso!');
            console.log('   Feche outros servidores ou use uma porta diferente.');
            process.exit(1);
        }
        
        // Mostrar informações de acesso
        showAccessInfo(ip);
        
        // Configurar variáveis de ambiente para o Vite
        process.env.VITE_HOST = '0.0.0.0';
        process.env.VITE_PORT = '3000';
        
        // Iniciar o servidor Vite com configurações para acesso mobile
        console.log('🔄 Iniciando servidor...\n');
        
        execSync('npm run dev -- --host 0.0.0.0 --port 3000', {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    startMobileServer();
}

module.exports = { startMobileServer, getLocalIP, showAccessInfo };
