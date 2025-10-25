import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 使用 path.resolve
    }
  },
  server: {
    port: 8080, // 前端端口号
    proxy: {
      // 匹配所有以 "/api" 开头的请求路径
      '/api': {
        target: 'http://localhost:3001', // 后端服务地址（需与后端启动端口一致）
        changeOrigin: true, // 开启跨域（虚拟主机站点需要）
        ws: true, // 支持WebSocket
      }
    }
  }
})
