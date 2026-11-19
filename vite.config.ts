/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    // Ruling: sandbox blocks fork worker kill (EACCES); threads avoid that.
    pool: 'threads',
    include: ['src/**/*.test.ts'],
  },
})
