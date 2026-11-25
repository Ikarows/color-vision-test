import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  // 构建日期（换域名公告据此推算旧域名停用日期）
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  server: {
    port: 5173,
    open: true
  }
})
