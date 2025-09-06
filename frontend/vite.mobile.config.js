import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Configuração específica para acesso mobile
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // PWA habilitado para melhor experiência mobile
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Sistema Procon - Mobile',
        short_name: 'Procon Mobile',
        description: 'Sistema de Proteção ao Consumidor - Versão Mobile',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: '../procon_system/static/react',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          icons: ['@heroicons/react', 'lucide-react'],
          scanner: ['quagga'] // Chunk específico para o scanner
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Permite acesso de qualquer IP
    strictPort: true, // Falha se a porta estiver ocupada
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    // Configurações para melhor performance mobile
    hmr: {
      host: '0.0.0.0'
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    // Variáveis para detectar se está rodando em mobile
    'process.env.IS_MOBILE': JSON.stringify(true)
  },
  // Otimizações para mobile
  optimizeDeps: {
    include: ['quagga', 'react', 'react-dom']
  }
}))
