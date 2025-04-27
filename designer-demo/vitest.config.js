import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 1_000 * 60 * 10, // 10分钟超时，因为构建可能需要较长时间
    include: ['tests/**/*.test.js'],
    hookTimeout: 1_000 * 60 * 10, // 10分钟超时，因为构建可能需要较长时间
    // 这里需要串行执行，否则构建会相互覆盖，无法测试
    fileParallelism: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}) 