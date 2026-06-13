<template>
  <section class="wall-panel">
    <div class="panel-title">
      <strong>{{ title }}</strong>
      <span>{{ subtitle }}</span>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();
</script>

<style scoped lang="scss">
.wall-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: calc(var(--panel-pad-y) + 2px) calc(var(--panel-pad-x) + 2px) var(--panel-pad-y);
  overflow: hidden;
  position: relative;
  border: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(18, 197, 255, 0.15), transparent 42%),
    linear-gradient(90deg, rgba(6, 32, 64, 0.25), rgba(3, 17, 39, 0.42) 22%, rgba(3, 17, 39, 0.42) 78%, rgba(6, 32, 64, 0.25)),
    linear-gradient(180deg, rgba(4, 20, 45, 0.58), rgba(5, 18, 41, 0.64) 46%, rgba(3, 13, 33, 0.56));
  box-shadow:
    inset 0 0 42px rgba(0, 171, 255, 0.12),
    inset 0 1px 0 rgba(125, 211, 252, 0.16),
    0 0 16px rgba(14, 165, 233, 0.2);
}

.wall-panel::before,
.wall-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.wall-panel::before {
  inset: -1px;
  z-index: 2;
  box-sizing: border-box;
  border: 0;
  background-image: url('@/assets/patrol/video-wall/hud-panel-frame-transparent.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  opacity: 1;
}

.wall-panel::after {
  right: -1px;
  top: -1px;
  width: 34px;
  height: 34px;
  border-top: 2px solid #18c8ff;
  transform: rotate(45deg) translate(4px, 16px);
  opacity: 0.7;
}

.panel-title {
  display: flex;
  gap: clamp(9px, 0.9vw, 15px);
  align-items: baseline;
  height: clamp(22px, 2.95vh, 34px);
  padding: 0 0 clamp(5px, 0.55vw, 8px);
  margin-bottom: clamp(3px, 0.46vw, 6px);
  border-bottom: 1px solid rgba(103, 186, 242, 0.24);
  position: relative;
  z-index: 3;
}

.panel-title::before {
  content: '';
  position: absolute;
  left: calc(var(--panel-pad-x) * -1);
  top: calc(var(--panel-pad-y) * -1);
  width: clamp(142px, 12.5vw, 232px);
  height: clamp(28px, 3.15vh, 42px);
  background:
    linear-gradient(90deg, rgba(7, 61, 105, 0.86), rgba(7, 46, 88, 0.48), transparent),
    linear-gradient(180deg, rgba(34, 211, 238, 0.08), transparent);
  clip-path: polygon(0 0, 84% 0, 100% 100%, 0 100%);
}

.panel-title strong {
  color: #eff6ff;
  font-size: var(--panel-title-size);
  line-height: 1;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(191, 219, 254, 0.26);
  position: relative;
  z-index: 1;
}

.panel-title span {
  color: #1fbfff;
  font-size: clamp(9px, 0.78vw, 16px);
  line-height: 1;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

.panel-body {
  position: relative;
  z-index: 3;
  padding: clamp(4px, 0.5vw, 8px) clamp(2px, 0.26vw, 5px) clamp(4px, 0.5vw, 8px);
  min-height: 0;
  height: 100%;
  background:
    linear-gradient(180deg, rgba(13, 38, 71, 0.16), rgba(1, 8, 22, 0.08)),
    radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.06), transparent 62%);
}

@media (max-width: 1366px), (max-height: 760px) {
  .panel-body {
    padding-top: 4px;
  }
}
</style>
