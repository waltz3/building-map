import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium' // ← 専用プラグインをインポート
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    cesium(), // ← プラグインを追加
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})