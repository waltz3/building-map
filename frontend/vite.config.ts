import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['cesium'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cesium: ['cesium'],
        },
      },
    },
  },
  server: {
    fs: {
      allow: [
        'node_modules/cesium/Build/Cesium',
        // プロジェクト外のファイルを許可する場合
        path.resolve(__dirname, 'src')
      ],
    },
  }
})
