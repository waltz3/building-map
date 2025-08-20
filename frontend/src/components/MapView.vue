<template>
  <div id="map" class="map-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import L from 'leaflet';


// デフォルトマーカー画像の設定
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// TypeScript に無視させる
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

// @ts-ignore
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default defineComponent({
  name: 'MapView',
  setup() {
    onMounted(() => {
      const map = L.map('map').setView([35.4478, 139.6425], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      
    });
  }
});
</script>

<style scoped>
.map-container {
  width: 800px;
  height: 600px; /* 高さは必ず明示 */
}
</style>
