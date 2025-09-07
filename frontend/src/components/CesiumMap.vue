<template>
  <div class="toolbar">
    <button @click="flyToYokohama">横浜へ</button>
  </div>
  <div id="cesiumContainer" class="map-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

// Cesium はグローバル
declare const Cesium: any

export default defineComponent({
  name: 'CesiumMap',
  setup() {
    const viewerRef = ref<any>(null)

    onMounted(async () => {
      // Cesium 静的アセットのベースパス
      (Cesium as any).buildModuleUrl.setBaseUrl('/Cesium/')

      // Ion トークン
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYjFhMWNjOS04MDc5LTQ0MDctYTU3Zi02NDFiZDg4ZGFiNTkiLCJpZCI6MzM1MzE4LCJpYXQiOjE3NTYxNzYzNjl9._X9-7gpW2STjsvcU1Qr_HHKhEJBhAPjsr86ZNlUQn2g'

      // Viewer 初期化
      const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
      })
      viewerRef.value = viewer

      // OSM ベースマップ
      viewer.imageryLayers.removeAll()
      const osmProvider = await Cesium.IonImageryProvider.fromAssetId(2)
      viewer.imageryLayers.addImageryProvider(osmProvider)

      // 3D Tiles 読み込み
      const tilesetUrl =
        '/data/3dtiles/bldg/14100_yokohama-shi_city_2024_citygml_1_op_bldg_3dtiles_14101_tsurumi-ku_lod1/tileset.json'
      const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl)
      viewer.scene.primitives.add(tileset)
      tileset.maximumScreenSpaceError = 4
      viewer.shadows = true
      tileset.shadows = Cesium.ShadowMode.ENABLED
      await viewer.zoomTo(tileset)
    })

    function flyToYokohama() {
      const viewer = viewerRef.value
      if (!viewer) return
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(139.6425, 35.4478, 3000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 1.2,
      })
    }

    return { flyToYokohama }
  },
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}

.toolbar {
  position: absolute;
  z-index: 10;
  left: 8px;
  top: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.toolbar button {
  padding: 6px 10px;
}
</style>
