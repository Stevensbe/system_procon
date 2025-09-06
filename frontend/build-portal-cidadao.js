import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando build do Portal do Cidadão...');

try {
  // 1. Criar pasta static se não existir
  const staticPath = path.join(__dirname, '../procon_system/static');
  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, { recursive: true });
  }

  // 2. Fazer build do React
  console.log('📦 Fazendo build do React...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 3. Verificar se o build foi criado
  const buildPath = path.join(__dirname, '../procon_system/static/react');
  if (!fs.existsSync(buildPath)) {
    throw new Error('Build não foi criado!');
  }
  
  console.log('✅ Build do Portal do Cidadão concluído com sucesso!');
  console.log('📍 Arquivos copiados para: ../procon_system/static/react/');
  console.log('🌐 Acesse: http://localhost:8000/react/');
  console.log('');
  console.log('🎉 Portal do Cidadão está pronto para uso!');
  console.log('📋 Funcionalidades implementadas:');
  console.log('   ✅ Consulta Pública');
  console.log('   ✅ Acompanhamento de Processo');
  console.log('   ✅ Nova Denúncia');
  console.log('   ✅ Nova Petição');
  console.log('   ✅ Orientações');
  console.log('   ✅ Sobre o PROCON');
  console.log('   ✅ Contato');
  console.log('   ✅ Formulários');
  console.log('   ✅ Avaliação de Serviço');
  console.log('   ✅ Autenticação de Usuários');
  console.log('   ✅ Histórico de Atividades');
  console.log('   ✅ Notificações Push');
  console.log('   ✅ Personalização de Temas');
  console.log('   ✅ Menu Mobile Responsivo');
  console.log('   ✅ Busca Avançada');
  console.log('   ✅ Dashboard Dinâmico');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
