<template>
  <CesiumMap />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
//import MapView from './components/MapView.vue';
//import Map3D from './components/Map3D.vue';
import CesiumMap from './components/CesiumMap.vue';

export default defineComponent({
  name: 'App',
  //components: { MapView }
  //components: { Map3D }
  components: { CesiumMap }
});
</script>
