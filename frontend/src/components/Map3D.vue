<template>
  <div id="map3d" class="map3d-container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount } from 'vue';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default defineComponent({
  name: 'Map3D',
  setup() {
    let map: Map | null = null;

    onMounted(() => {
      map = new maplibregl.Map({
        container: 'map3d',
        // シンプルな OSM ラスタースタイル
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            { id: 'osm', type: 'raster', source: 'osm' }
          ]
        } as any,
        center: [139.6425, 35.4478], // 横浜あたり（経度,緯度）
        zoom: 15,
        pitch: 60,
        bearing: -17
      });

      map.on('load', () => {
        // ① 建物（GeoJSON）を 3D 表示（fill-extrusion）
        map!.addSource('buildings', {
          type: 'geojson',
          data: '/data/buildings_sample.geojson'
        });

        map!.addLayer({
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: 'buildings',
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'height'],
              0, '#d1e9ff',
              30, '#9fd4ff',
              60, '#6bbcff',
              90, '#409bff'
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-opacity': 0.9
          }
        });

        // ② 避難所（ポイント）を重ねる（既に置いた shelter.geojson を使用）
        //    いまは鶴見区のファイルを public/data/shelter.geojson にコピー済みと想定
        map!.addSource('shelters', {
          type: 'geojson',
          data: '/data/shelter.geojson'
        });

        // ポイントを丸で表示
        map!.addLayer({
          id: 'shelters-circle',
          type: 'circle',
          source: 'shelters',
          paint: {
            'circle-radius': 5,
            'circle-opacity': 0.9,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });

        // クリックでポップアップ
        map!.on('click', 'shelters-circle', (e) => {
          const feature = e.features?.[0];
          const coords = (feature?.geometry as any).coordinates;
          const props = feature?.properties || {};
          new maplibregl.Popup()
            .setLngLat(coords as [number, number])
            .setHTML(`
            <strong>${props['名称'] || '名称不明'}</strong><br/>
            住所: ${props['住所'] || ''}<br/>
            種別: ${props['施設の種類'] || ''}
          `)
          .addTo(map!);
        });

        // ホバー時にカーソル変更
        map!.on('mouseenter', 'shelters-circle', () => {
          map!.getCanvas().style.cursor = 'pointer';
        });
        map!.on('mouseleave', 'shelters-circle', () => {
          map!.getCanvas().style.cursor = '';
        });
      });
    });

    onBeforeUnmount(() => {
      if (map) map.remove();
    });

    return {};
  }
});
</script>

<style scoped>
.map3d-container {
  width: 800px;    /* 必要なら 100% に */
  height: 600px;   /* 必須：高さ */
}
</style>
