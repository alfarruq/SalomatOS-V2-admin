/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // Same-origin in production (nginx); the dev server forwards to the local Django.
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: { environment: 'jsdom', globals: true },
})
