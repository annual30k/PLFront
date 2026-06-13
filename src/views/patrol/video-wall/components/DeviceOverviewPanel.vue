<template>
  <WallPanel title="设备概况" subtitle="DEVICE OVERVIEW">
    <div class="metric-grid">
      <MetricCard
        v-for="card in cards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :tone="card.tone"
        :icon="card.icon"
      />
    </div>
  </WallPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WallPanel from './WallPanel.vue';
import MetricCard from './MetricCard.vue';
import type { DeviceOverviewMetrics, MetricIconKey, MetricTone } from '../types';

const props = defineProps<{
  metrics: DeviceOverviewMetrics;
}>();

const cards = computed<Array<{ label: string; value: number; tone: MetricTone; icon: MetricIconKey }>>(() => [
  { label: '在线设备', value: props.metrics.online, tone: 'cyan', icon: 'online' },
  { label: '总设备数', value: props.metrics.total, tone: 'blue', icon: 'camera' },
  { label: '离线设备', value: props.metrics.offline, tone: 'orange', icon: 'offline' },
  { label: '设备告警', value: props.metrics.warning, tone: 'red', icon: 'alarm' }
]);
</script>

<style scoped lang="scss">
.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1vw, 20px);
  height: 100%;
  align-content: start;
}
</style>
