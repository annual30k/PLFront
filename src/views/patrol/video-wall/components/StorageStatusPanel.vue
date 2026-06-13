<template>
  <WallPanel title="存储状态" subtitle="STORAGE STATUS">
    <div class="storage">
      <DonutGauge :value="`${percent}%`" label="存储使用率" :percent="percent" class-name="storage-donut" />
      <div class="legend">
        <span>总容量 <b>{{ total }} TB</b></span>
        <span>已使用 <b>{{ used }} TB</b></span>
        <span>剩余 <b>{{ free }} TB</b></span>
      </div>
    </div>
  </WallPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WallPanel from './WallPanel.vue';
import DonutGauge from './DonutGauge.vue';

const props = withDefaults(defineProps<{
  percent: number;
  total?: number;
}>(), {
  total: 512
});

const used = computed(() => Math.round((props.percent / 100) * props.total));
const free = computed(() => props.total - used.value);
</script>

<style scoped lang="scss">
.storage {
  --donut-size: clamp(112px, 8.8vw, 158px);
  display: grid;
  grid-template-columns: minmax(108px, 0.92fr) minmax(134px, 1.08fr);
  gap: clamp(12px, 1.18vw, 22px);
  align-items: center;
  line-height: 1.15;
  height: 100%;
  min-height: 0;
  padding: clamp(4px, 0.62vw, 10px) clamp(8px, 0.9vw, 16px);
  box-sizing: border-box;
}

.storage :deep(.donut) {
  justify-self: center;
}

.legend {
  display: grid;
  gap: clamp(16px, 1.6vw, 31px);
  min-width: 0;
  width: 100%;
  font-size: clamp(13px, 1vw, 20px);
  line-height: 1;
  color: #bfdbfe;
}

.legend span {
  display: grid;
  grid-template-columns: minmax(52px, 1fr) minmax(72px, auto);
  gap: clamp(8px, 0.86vw, 15px);
  align-items: center;
  min-width: 0;
}

.legend b {
  color: #22d3ee;
  margin-left: 0;
  font-weight: 800;
  text-align: right;
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.35);
}

@media (max-width: 1366px), (max-height: 760px) {
  .storage {
    --donut-size: clamp(88px, 7vw, 124px);
    grid-template-columns: minmax(84px, 0.86fr) minmax(118px, 1.14fr);
    gap: 8px;
    padding-inline: 5px;
  }

  .legend {
    gap: 12px;
  }
}
</style>
