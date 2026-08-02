import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose the shell's OPENAI_API_KEY to the browser as import.meta.env.OPENAI_API_KEY.
  // Demo-only: a client-embedded key should be replaced by a backend proxy in production.
  envPrefix: ['VITE_', 'OPENAI_'],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/components/**', 'src/hooks/**', 'src/contexts/**'],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80,
      },
    },
  },
})
