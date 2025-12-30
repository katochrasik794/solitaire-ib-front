import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env so we can align proxy target with VITE_API_BASE_URL
  const env = loadEnv(mode, process.cwd(), '')
  // Force localhost in development, use env variable if set
  const apiBase = mode === 'production' 
    ? (env.VITE_API_BASE_URL || '/api')
    : (env.VITE_API_BASE_URL || 'http://localhost:5005/api')
  
  // If apiBase ends with /api, strip it for proxy target
  const proxyTarget = apiBase.replace(/\/?api\/?$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget || 'http://localhost:5005',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    // Ensure base is set correctly
    base: mode === 'production' ? '/' : '/'
  }
})
