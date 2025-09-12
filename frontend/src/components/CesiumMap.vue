<template>
  <div class="toolbar">
    <button @click="flyToYokohama">横浜へ</button>
  </div>
  <div id="cesiumContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// --- リアクティブ変数 ---
const viewerRef = ref<Cesium.Viewer | null>(null);
// 各区の3D建物と避難所データをキャッシュとして管理
const tilesetCache = ref<Record<string, Cesium.Cesium3DTileset>>({});
const shelterDataSourceCache = ref<Record<string, Cesium.GeoJsonDataSource>>({});

// --- 定数データ ---
const yokohamaWards = [
  { id: '14101_tsurumi-ku', name: '鶴見区', lon: 139.675, lat: 35.509 },
  { id: '14102_kanagawa-ku', name: '神奈川区', lon: 139.631, lat: 35.485 },
  { id: '14103_nishi-ku', name: '西区', lon: 139.615, lat: 35.459 },
  { id: '14104_naka-ku', name: '中区', lon: 139.642, lat: 35.444 },
  { id: '14105_minami-ku', name: '南区', lon: 139.618, lat: 35.431 },
  { id: '14106_hodogaya-ku', name: '保土ケ谷区', lon: 139.585, lat: 35.462 },
  { id: '14107_isogo-ku', name: '磯子区', lon: 139.615, lat: 35.404 },
  { id: '14108_kanazawa-ku', name: '金沢区', lon: 139.624, lat: 35.340 },
  { id: '14109_kohoku-ku', name: '港北区', lon: 139.643, lat: 35.525 },
  { id: '14110_totsuka-ku', name: '戸塚区', lon: 139.534, lat: 35.399 },
  { id: '14111_konan-ku', name: '港南区', lon: 139.593, lat: 35.400 },
  { id: '14112_asahi-ku', name: '旭区', lon: 139.521, lat: 35.474 },
  { id: '14113_midori-ku', name: '緑区', lon: 139.544, lat: 35.517 },
  { id: '14114_seya-ku', name: '瀬谷区', lon: 139.483, lat: 35.466 },
  { id: '14115_sakae-ku', name: '栄区', lon: 139.560, lat: 35.367 },
  { id: '14116_izumi-ku', name: '泉区', lon: 139.492, lat: 35.419 },
  { id: '14117_aoba-ku', name: '青葉区', lon: 139.549, lat: 35.560 },
  { id: '14118_tsuzuki-ku', name: '都筑区', lon: 139.584, lat: 35.545 },
];

// --- 初期化処理 ---
onMounted(() => {
  nextTick(async () => {
    // あなたのCesium Ionトークンに設定
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYjFhMWNjOS04MDc5LTQ0MDctYTU3Zi02NDFiZDg4ZGFiNTkiLCJpZCI6MzM1MzE4LCJpYXQiOjE3NTYxNzYzNjl9._X9-7gpW2STjsvcU1Qr_HHKhEJBhAPjsr86ZNlUQn2g';

    const viewer = new Cesium.Viewer('cesiumContainer', {
      // ★★★ Cesium公式の標準地形データを指定 ★★★
      // これが最も安定しており、日本の高精細データも含まれます
      terrainProvider: await Cesium.createWorldTerrainAsync(),

      // ... その他のViewerオプション ...
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
    });
    viewerRef.value = viewer;
    viewer.shadows = false;

    // 背景地図をOpenStreetMapに設定
    viewer.imageryLayers.removeAll();
    const osmProvider = await Cesium.IonImageryProvider.fromAssetId(2);
    viewer.imageryLayers.addImageryProvider(osmProvider);

    // カメラの動きに応じてデータを表示/非表示にするイベントリスナーを設定
    viewer.camera.moveEnd.addEventListener(updateDataVisibility);

    // 初期表示のために、一度イベントリスナーの関数を呼び出す
    updateDataVisibility();

    // 初期視点へ移動する
    flyToYokohama();
  });
});

// --- ★★★ 建物と避難所の表示をまとめて管理する、スマート読み込みの最終形 ★★★ ---
async function updateDataVisibility() {
  const viewer = viewerRef.value;
  if (!viewer) return;

  const cameraHeight = viewer.camera.positionCartographic.height;

  // すべてのデータソースとタイルセットを一旦非表示に
  Object.values(tilesetCache.value).forEach(t => t.show = false);
  Object.values(shelterDataSourceCache.value).forEach(ds => ds.show = false);

  // 高度が30km以上なら、何も表示せずに終了
  if (cameraHeight > 30000) {
    return;
  }

  // カメラの中心に最も近い区を見つける
  const centerLon = Cesium.Math.toDegrees(viewer.camera.positionCartographic.longitude);
  const centerLat = Cesium.Math.toDegrees(viewer.camera.positionCartographic.latitude);
  const closestWard = yokohamaWards.reduce((prev, curr) => {
    const prevDist = Math.hypot(prev.lon - centerLon, prev.lat - centerLat);
    const currDist = Math.hypot(curr.lon - centerLon, curr.lat - centerLat);
    return currDist < prevDist ? curr : prev;
  });

  const targetWardId = closestWard.id;

  // --- 1. 最も近い区の「建物」を表示 (または新規読み込み) ---
  if (tilesetCache.value[targetWardId]) {
    tilesetCache.value[targetWardId].show = true;
  } else {
    console.log(`${closestWard.name}の建物を新規読み込み...`);
    const url = `/data/3dtiles/bldg/14100_yokohama-shi_city_2024_citygml_1_op_bldg_3dtiles_${targetWardId}_lod1/tileset.json`;
    try {
      const tileset = await Cesium.Cesium3DTileset.fromUrl(url, { maximumScreenSpaceError: 16 });
      viewer.scene.primitives.add(tileset);
      tilesetCache.value[targetWardId] = tileset;
    } catch (e) { console.error(`${targetWardId}の建物データ読み込み失敗`, e); }
  }

  // --- 2. 最も近い区の「避難所」を表示 (または新規読み込み) ---
  if (shelterDataSourceCache.value[targetWardId]) {
    shelterDataSourceCache.value[targetWardId].show = true;
  } else {
    console.log(`${closestWard.name}の避難所を新規読み込み...`);
    const wardCode = targetWardId.split('_')[0];
    const wardName = targetWardId.split('_')[1];
    const url = `/data/14100_yokohama-shi_2023_related/${wardCode}_yokohama-shi_city_2023_${wardName}_shelter.geojson`;
    try {
      const dataSource = await Cesium.GeoJsonDataSource.load(url);
      // アイコンとラベルのスタイル設定
      dataSource.entities.values.forEach(entity => {
        entity.billboard = new Cesium.BillboardGraphics({
          image: '/assets/shelter-icon.png',
          width: 32,
          height: 32,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        });

        const name = entity.properties?.['名称']?.getValue() || '名称不明';
        const address = entity.properties?.['住所']?.getValue() || '不明';

        // ラベル（施設名）の設定
        entity.label = new Cesium.LabelGraphics({
          text: name,
          font: 'bold 14px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -30),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.1, 0.1, 0.1, 0.7),
          fillColor: Cesium.Color.WHITE,
          // 1. 地形や建物との距離に関わらず、常にラベルを最前面に描画する
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          // 2. ラベルの基準点を地形に合わせる
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        });

        // クリック時に表示する情報の設定
        let description = `<h2>${name}</h2><p><strong>住所:</strong> ${address}</p>`;
        entity.description = new Cesium.ConstantProperty(description);
      });
      viewer.dataSources.add(dataSource);
      shelterDataSourceCache.value[targetWardId] = dataSource;
    } catch (e) { console.error(`${targetWardId}の避難所データ読み込み失敗`, e); }
  }
}

function flyToYokohama() { /* ... */ }
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
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