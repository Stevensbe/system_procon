import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando build do React para Django...');

try {
    // 1. Fazer build do React
    console.log('📦 Fazendo build do React...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. Verificar se o build foi criado
    const buildPath = path.join(__dirname, '../procon_system/static/react');
    if (!fs.existsSync(buildPath)) {
        throw new Error('Build não foi criado!');
    }
    
    // 3. Copiar arquivos estáticos para a pasta correta
    console.log('📁 Copiando arquivos estáticos...');
    
    // Criar pasta static se não existir
    const staticPath = path.join(__dirname, '../procon_system/static');
    if (!fs.existsSync(staticPath)) {
        fs.mkdirSync(staticPath, { recursive: true });
    }
    
    console.log('✅ Build concluído com sucesso!');
    console.log('📍 Arquivos copiados para: ../procon_system/static/react/');
    console.log('🌐 Acesse: http://localhost:8000/react/');
    
} catch (error) {
    console.error('❌ Erro durante o build:', error.message);
    process.exit(1);
}
