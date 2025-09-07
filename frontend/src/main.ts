import { createApp } from 'vue'
import App from './App.vue'

// Cesium は HTML で読み込むため、グローバル変数として扱う
declare const Cesium: any

createApp(App).mount('#app')
