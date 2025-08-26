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
import 'leaflet/dist/leaflet.css'

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

      // ここから避難所表示
      fetch('/data/shelter.geojson')
        .then(res => res.json())
        .then((geojson) => {
          L.geoJSON(geojson, {
            pointToLayer: (feature, latlng) => {
              return L.marker(latlng).bindPopup(
                `<b>${feature.properties?.name || '避難所'}</b>`
              );
            }
          }).addTo(map);
        })
        .catch(err => console.error('GeoJSON 読み込み失敗:', err));

      
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
