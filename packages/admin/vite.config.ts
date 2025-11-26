// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // 支持 TS/TSX 编译

export default defineConfig({
  plugins: [react()], // 该插件自动处理 TS/TSX
  resolve: {
    alias: {
      '@': '/src', // 和 tsconfig.json 的 paths 保持一致
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://123.57.81.94',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
