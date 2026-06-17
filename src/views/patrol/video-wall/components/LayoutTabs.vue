<template>
  <div class="layout-tabs">
    <span>画面布局</span>
    <button
      v-for="item in layoutOptions"
      :key="item"
      :class="{ active: mode === 'wall' && modelValue === item }"
      type="button"
      @click="$emit('update:mode', 'wall'); $emit('update:modelValue', item)"
    >
      {{ item }}路
    </button>
    <button type="button" :class="{ active: mode === 'map' }" @click="$emit('update:mode', 'map')">电子地图</button>
  </div>
</template>

<script setup lang="ts">
const layoutOptions = [4, 8, 16];

defineProps<{
  modelValue: number;
  mode: 'wall' | 'map';
}>();

defineEmits<{
  'update:modelValue': [value: number];
  'update:mode': [value: 'wall' | 'map'];
}>();
</script>

<style scoped lang="scss">
.layout-tabs {
  display: flex;
  align-items: center;
  gap: clamp(8px, 0.78vw, 12px);
  padding: 0 clamp(12px, 1.3vw, 20px);
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%);
  position: relative;
  overflow: hidden;
  border: 0;
  background: linear-gradient(180deg, rgba(8, 35, 71, 0.52), rgba(2, 14, 32, 0.56)), rgba(3, 14, 32, 0.46);
  box-shadow:
    inset 0 0 28px rgba(14, 165, 233, 0.2),
    inset 0 1px 0 rgba(125, 211, 252, 0.22),
    0 0 16px rgba(14, 165, 233, 0.17);
}

.layout-tabs::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: url('@/assets/patrol/video-wall/hud-panel-frame-transparent.png') center / 100% 100% no-repeat;
  opacity: 0.52;
  pointer-events: none;
}

.layout-tabs > * {
  position: relative;
  z-index: 1;
}

button {
  min-width: clamp(64px, 5.46vw, 84px);
  height: clamp(28px, 3.7vh, 32px);
  border: 1px solid rgba(37, 99, 235, 0.9);
  background: rgba(10, 35, 82, 0.78);
  color: #bfdbfe;
  text-align: center;
  line-height: calc(clamp(28px, 3.7vh, 32px) - 2px);
  font-size: clamp(12px, 0.88vw, 14px);
  box-shadow: inset 0 0 14px rgba(37, 99, 235, 0.18);
}

.active {
  color: #eff6ff;
  border-color: #38bdf8;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.58), rgba(30, 64, 175, 0.58));
  box-shadow:
    inset 0 0 18px rgba(125, 211, 252, 0.26),
    0 0 16px rgba(56, 189, 248, 0.35);
}

@media (max-width: 1024px) {
  .layout-tabs {
    gap: 6px;
    padding: 0 10px;
  }

  button,
  a {
    min-width: 56px;
  }
}
</style>
