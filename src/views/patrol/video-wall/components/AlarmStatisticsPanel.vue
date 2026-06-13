<template>
  <WallPanel title="告警统计" subtitle="ALARM STATISTICS">
    <div class="alarm-statistics">
      <div class="alarm-donut" :style="donutStyle">
        <div class="alarm-donut-core">
          <strong>{{ metrics.total }}</strong>
          <span>告警总数</span>
        </div>
      </div>
      <div class="legend">
        <div v-for="item in legendItems" :key="item.label" class="legend-row">
          <i :style="{ background: item.color }"></i>
          <span>{{ item.label }}</span>
          <b>{{ item.value }}</b>
          <em>{{ item.percent }}%</em>
        </div>
      </div>
    </div>
  </WallPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WallPanel from './WallPanel.vue';
import type { AlarmSummaryMetrics } from '../types';

const props = defineProps<{
  metrics: AlarmSummaryMetrics;
}>();

const legendItems = computed(() => {
  const knownTotal = props.metrics.critical + props.metrics.sos + props.metrics.media + props.metrics.pending;
  const other = Math.max(0, props.metrics.total - knownTotal);
  const total = Math.max(1, props.metrics.total);
  return [
    { label: '重点预警', value: props.metrics.critical, color: '#ff697f' },
    { label: 'SOS', value: props.metrics.sos, color: '#ff9f50' },
    { label: '媒体待核', value: props.metrics.media, color: '#23d6ee' },
    { label: '消息待达', value: props.metrics.pending, color: '#5ca8ff' },
    { label: '其他告警', value: other, color: '#1687ff' }
  ].map((item) => ({
    ...item,
    percent: Math.round((item.value / total) * 100)
  }));
});

const donutStyle = computed(() => {
  let cursor = 0;
  const segments = legendItems.value
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor;
      const end = Math.min(100, cursor + item.percent);
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });
  if (cursor < 100) segments.push(`rgba(13, 42, 83, 0.92) ${cursor}% 100%`);
  return {
    background: `conic-gradient(from -90deg, ${segments.join(', ')})`
  };
});
</script>

<style scoped lang="scss">
.alarm-statistics {
  display: grid;
  grid-template-columns: minmax(102px, 0.92fr) minmax(142px, 1.08fr);
  gap: clamp(10px, 1.15vw, 18px);
  align-items: center;
  height: 100%;
  min-height: 0;
  padding: clamp(2px, 0.42vw, 8px) clamp(5px, 0.68vw, 12px);
  box-sizing: border-box;
}

.alarm-donut {
  width: min(100%, clamp(108px, 8.9vw, 158px));
  aspect-ratio: 1;
  justify-self: center;
  border-radius: 50%;
  position: relative;
  box-shadow:
    0 0 24px rgba(14, 165, 233, 0.34),
    inset 0 0 18px rgba(0, 0, 0, 0.35);
}

.alarm-donut::before,
.alarm-donut-core {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.alarm-donut::before {
  inset: 13%;
  background:
    radial-gradient(circle, rgba(2, 12, 31, 0.98), rgba(4, 18, 42, 0.95));
  box-shadow:
    inset 0 0 18px rgba(0, 168, 255, 0.13),
    0 0 12px rgba(2, 6, 23, 0.7);
}

.alarm-donut-core {
  inset: 21%;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  background: radial-gradient(circle, rgba(5, 20, 45, 0.98), rgba(1, 7, 19, 0.98));
  box-shadow: inset 0 0 16px rgba(34, 211, 238, 0.14);
}

.alarm-donut-core strong {
  color: #eff6ff;
  font-size: clamp(28px, 2.58vw, 48px);
  line-height: 0.98;
  font-weight: 800;
}

.alarm-donut-core span {
  margin-top: clamp(3px, 0.36vw, 6px);
  color: #cfe8ff;
  font-size: clamp(10px, 0.82vw, 15px);
  white-space: nowrap;
}

.legend {
  display: grid;
  gap: clamp(7px, 0.8vw, 13px);
  width: 100%;
  min-width: 0;
  color: #bfdbfe;
}

.legend-row {
  display: grid;
  grid-template-columns: 9px minmax(58px, 1fr) minmax(24px, auto) minmax(34px, auto);
  gap: clamp(7px, 0.64vw, 11px);
  align-items: center;
  min-width: 0;
  font-size: clamp(10px, 0.82vw, 15px);
  line-height: 1.1;
}

.legend-row i {
  display: inline-block;
  width: clamp(6px, 0.52vw, 8px);
  height: clamp(6px, 0.52vw, 8px);
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.legend-row span {
  min-width: 0;
  overflow: hidden;
  color: #c7defc;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-row b {
  color: #9bd7ff;
  font-weight: 800;
  text-align: right;
}

.legend-row em {
  color: #6fa7df;
  font-style: normal;
  text-align: right;
}

@media (max-width: 1366px), (max-height: 760px) {
  .alarm-statistics {
    grid-template-columns: minmax(82px, 0.85fr) minmax(126px, 1.15fr);
    gap: 8px;
    padding-inline: 3px;
  }

  .legend-row {
    grid-template-columns: 8px minmax(50px, 1fr) minmax(20px, auto) minmax(30px, auto);
  }
}
</style>
