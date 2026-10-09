import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Component dependencies import CSS and assets, which require the VM pool in Vitest 1.
    poolMatchGlobs: [[path.resolve(__dirname, 'test/components/**').replace(/\\/g, '/'), 'vmThreads']],
    deps: {
      optimizer: {
        web: {
          // Bundle the browser UI libraries only for jsdom component tests.
          enabled: true,
          include: ['@opentiny/tiny-robot', '@opentiny/vue']
        }
      }
    }
  },
  resolve: {
    mainFields: ['module'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@opentiny/tiny-engine-meta-register': path.resolve(__dirname, './test/mocks/meta-register.ts')
    }
  }
})
