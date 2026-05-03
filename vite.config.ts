import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  base: '/',
  plugins: [TanStackRouterVite(), react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 8080
  },
  build: {
    outDir: 'dist'
  }
})
