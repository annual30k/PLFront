<template>
  <WallPanel title="智能分析" subtitle="INTELLIGENT ANALYSIS">
    <div class="analysis-grid">
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
import type { AnalysisMetrics, MetricIconKey, MetricTone } from '../types';

const props = defineProps<{
  metrics: AnalysisMetrics;
}>();

const cards = computed<Array<{ label: string; value: number; tone: MetricTone; icon: MetricIconKey }>>(() => [
  { label: '人脸检测', value: props.metrics.face, tone: 'blue', icon: 'face' },
  { label: '人流统计', value: props.metrics.people, tone: 'cyan', icon: 'people' },
  { label: '车辆检测', value: props.metrics.vehicle, tone: 'blue', icon: 'vehicle' },
  { label: '行为分析', value: props.metrics.behavior, tone: 'cyan', icon: 'behavior' }
]);
</script>

<style scoped lang="scss">
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1vw, 20px);
  height: 100%;
  align-content: start;
}
</style>
