import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // Fundamental: impede que vejam o código original
    minify: 'esbuild',
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'], // Remove quase todos os logs
      },
      mangle: {
        toplevel: true, // Renomeia variáveis globais para letras únicas (a, b, c)
      },
      format: {
        comments: false, // Remove todos os comentários
      },
    },
    rollupOptions: {
      output: {
        // Divide o código em pedaços aleatórios para dificultar a leitura
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
