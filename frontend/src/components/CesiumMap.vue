<template>
  <div id="cesiumContainer" class="map-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import * as Cesium from 'cesium';

// Ion トークン
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYjFhMWNjOS04MDc5LTQ0MDctYTU3Zi02NDFiZDg4ZGFiNTkiLCJpZCI6MzM1MzE4LCJpYXQiOjE3NTYxNzYzNjl9._X9-7gpW2STjsvcU1Qr_HHKhEJBhAPjsr86ZNlUQn2g';

export default defineComponent({
  name: 'CesiumMap',
  setup() {
    onMounted(async () => {
      // Vite + Cesium のアセットパスを指定
      Cesium.buildModuleUrl.setBaseUrl("/cesium/");

      // Viewer 初期化
      const viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false, // false にしておく
      });

      // OSM タイルを追加
      const osmProvider = new Cesium.IonImageryProvider({ assetId: 2 });
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(osmProvider);
    });
  }
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}
</style>