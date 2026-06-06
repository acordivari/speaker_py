import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load TAILSCALE_* keys from .env (not exposed to the client bundle — this is
  // read only here in the Node config, and the var is not VITE_-prefixed).
  const env = loadEnv(mode, process.cwd(), 'TAILSCALE')
  const tailscaleHost = env.TAILSCALE_HOST?.trim()

  // When a Tailscale host is configured we (1) bind to all interfaces so the
  // dev server is reachable over the tailnet, and (2) whitelist that hostname
  // in allowedHosts — Vite otherwise rejects unknown Host headers with
  // "Blocked request. This host is not allowed." Without the var, behaviour is
  // unchanged: localhost-only.
  const remote = tailscaleHost
    ? { host: true, allowedHosts: [tailscaleHost] }
    : {}

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/__tests__/setup.js'],
    },
    server: {
      port: 3000,
      ...remote,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/audio': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    // `vite preview` (serving a production build) honours the same host rules.
    preview: {
      port: 3000,
      ...remote,
    },
  }
})
