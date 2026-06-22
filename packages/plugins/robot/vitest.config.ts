import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@opentiny/tiny-engine-meta-register': path.resolve(__dirname, './test/mocks/meta-register.ts')
    }
  }
})
