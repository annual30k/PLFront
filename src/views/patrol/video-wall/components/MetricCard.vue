<template>
  <div class="metric-box" :class="[tone, { 'no-icon': !icon }]">
    <i v-if="icon" class="metric-icon" :style="iconStyle"></i>
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import iconsSprite from '@/assets/patrol/video-wall/hud-icons-sprite.png';
import type { MetricIconKey, MetricTone } from '../types';

const props = withDefaults(defineProps<{
  label: string;
  value: string | number;
  tone?: MetricTone;
  icon?: MetricIconKey;
}>(), {
  tone: 'blue'
});

const iconPositions: Record<MetricIconKey, string> = {
  camera: '0% 0%',
  online: '33.333% 0%',
  offline: '66.666% 0%',
  alarm: '100% 0%',
  face: '0% 100%',
  people: '33.333% 100%',
  vehicle: '66.666% 100%',
  behavior: '100% 100%'
};

const iconStyle = computed(() => ({
  backgroundImage: `url(${iconsSprite})`,
  backgroundPosition: props.icon ? iconPositions[props.icon] : '0% 0%'
}));
</script>

<style scoped lang="scss">
.metric-box {
  border: 1px solid rgba(0, 128, 255, 0.84);
  background:
    radial-gradient(circle at 18% 52%, rgba(34, 211, 238, 0.24), transparent 36%),
    linear-gradient(180deg, rgba(9, 48, 93, 0.9), rgba(4, 22, 56, 0.96));
  height: 100%;
  min-height: var(--metric-height);
  box-sizing: border-box;
  padding: clamp(6px, 0.58vw, 11px) clamp(7px, 0.74vw, 14px);
  overflow: hidden;
  line-height: 1.15;
  display: grid;
  grid-template-columns: clamp(28px, 2.68vw, 50px) minmax(0, 1fr);
  grid-template-rows: 1fr 1fr;
  column-gap: clamp(4px, 0.48vw, 10px);
  align-items: center;
  box-shadow:
    inset 0 0 22px rgba(0, 117, 255, 0.26),
    inset 0 1px 0 rgba(125, 211, 252, 0.24),
    0 0 10px rgba(0, 154, 255, 0.12);
}

.metric-box.no-icon {
  grid-template-columns: 1fr;
}

.metric-icon {
  grid-row: 1 / span 2;
  width: clamp(28px, 2.55vw, 48px);
  aspect-ratio: 1;
  justify-self: center;
  background-repeat: no-repeat;
  background-size: 400% 200%;
  filter: drop-shadow(0 0 9px rgba(34, 211, 238, 0.84));
}

span {
  grid-column: 2;
  color: #9dc1ef;
  font-size: clamp(9px, 0.62vw, 14px);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: end;
}

strong {
  grid-column: 2;
  margin-top: 0;
  font-size: var(--metric-value-size);
  color: #38bdf8;
  min-width: 0;
  line-height: 0.92;
  font-weight: 800;
  text-shadow: 0 0 13px rgba(56, 189, 248, 0.48);
  align-self: start;
}

.metric-box.no-icon span,
.metric-box.no-icon strong {
  grid-column: 1;
}

.metric-box.orange strong {
  color: #fb923c;
}

.metric-box.red strong {
  color: #fb7185;
}

.metric-box.blue strong {
  color: #60a5fa;
}

@media (max-width: 1366px), (max-height: 760px) {
  strong {
    margin-top: -1px;
  }
}
</style>
