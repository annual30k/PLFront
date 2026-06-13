<template>
  <WallPanel title="告警趋势" subtitle="ALARM TREND">
    <TrendChart :bars="bars" :labels="labels" />
  </WallPanel>
</template>

<script setup lang="ts">
import WallPanel from './WallPanel.vue';
import TrendChart from './TrendChart.vue';

defineProps<{
  bars: number[];
  labels: string[];
}>();
</script>
