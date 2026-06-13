<template>
  <header class="wall-header">
    <div class="wall-date">
      <span>{{ date }}</span>
      <span>{{ weekday }}</span>
      <strong>{{ time }}</strong>
    </div>
    <div class="wall-title">
      <h1>智能视频监控系统</h1>
    </div>
    <div class="wall-actions">
      <button type="button" @click="enterSystem">进入系统</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  date: string;
  weekday: string;
  time: string;
}>();

const router = useRouter();

const enterSystem = () => {
  router.push('/index');
};
</script>

<style scoped lang="scss">
.wall-header {
  height: var(--header-height);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 clamp(22px, 1.9vw, 30px);
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: 0;
  background:
    linear-gradient(90deg, rgba(22, 178, 255, 0.34), transparent 17%, transparent 83%, rgba(22, 178, 255, 0.34)) 0 100% / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, rgba(0, 174, 255, 0.52), transparent) 50% 0 / 60% 1px no-repeat,
    linear-gradient(180deg, rgba(0, 8, 24, 0.96), rgba(0, 7, 20, 0.92));
  box-shadow:
    inset 0 -1px 0 rgba(56, 189, 248, 0.12),
    0 0 20px rgba(14, 165, 233, 0.08);
}

.wall-header::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -8px;
  z-index: 0;
  width: clamp(680px, 51vw, 800px);
  height: clamp(64px, 7.2vh, 78px);
  transform: translateX(-50%);
  background: url('@/assets/patrol/video-wall/hud-header-frame.png') center / 100% 100% no-repeat;
  opacity: 0.96;
}

.wall-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 0;
  background:
    linear-gradient(90deg, transparent 0 24%, rgba(16, 185, 255, 0.34) 24% 24.2%, transparent 24.2% 75.8%, rgba(16, 185, 255, 0.34) 75.8% 76%, transparent 76%),
    radial-gradient(ellipse at 50% 43%, rgba(96, 165, 250, 0.16), transparent 29%);
  opacity: 0.76;
}

.wall-title {
  position: relative;
  z-index: 1;
  justify-self: center;
  min-width: clamp(360px, 31vw, 480px);
  height: 100%;
  display: grid;
  place-items: center;
}

.wall-title::before,
.wall-title::after {
  content: '';
  position: absolute;
  top: 50%;
  width: clamp(58px, 4.7vw, 74px);
  height: 6px;
  transform: translateY(-50%);
  background: repeating-linear-gradient(90deg, #20e6ff 0 8px, transparent 8px 13px);
  opacity: 0.88;
}

.wall-title::before {
  left: clamp(-145px, -8.8vw, -84px);
}

.wall-title::after {
  right: clamp(-145px, -8.8vw, -84px);
}

h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: clamp(25px, 1.95vw, 34px);
  font-weight: 800;
  letter-spacing: 0;
  color: #eff6ff;
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.8),
    0 0 16px rgba(56, 189, 248, 1),
    0 0 28px rgba(37, 99, 235, 0.72);
}

.wall-date,
.wall-actions {
  display: flex;
  gap: clamp(9px, 1vw, 16px);
  align-items: center;
  font-size: clamp(12px, 0.92vw, 15px);
  white-space: nowrap;
  position: relative;
  z-index: 1;
  align-self: center;
  color: rgba(219, 234, 254, 0.92);
}

.wall-date::after {
  content: '';
  position: absolute;
  left: 7px;
  right: -42px;
  bottom: -8px;
  height: 1px;
  background:
    radial-gradient(circle, #18c8ff 0 3px, transparent 3.5px) 0 50% / 8px 8px no-repeat,
    linear-gradient(90deg, rgba(24, 200, 255, 0.85), rgba(37, 99, 235, 0.54), transparent);
}

.wall-date::before {
  content: '';
  position: absolute;
  right: -84px;
  bottom: -2px;
  width: 62px;
  height: 24px;
  border-top: 1px solid rgba(24, 200, 255, 0.65);
  border-right: 1px solid rgba(24, 200, 255, 0.42);
  transform: skewX(38deg);
  opacity: 0.68;
}

.wall-actions {
  justify-content: flex-end;
}

.wall-actions button {
  border: 1px solid rgba(56, 189, 248, 0.6);
  background:
    radial-gradient(circle at 90% 86%, #18c8ff 0 2px, transparent 3px),
    linear-gradient(180deg, rgba(14, 165, 233, 0.19), rgba(30, 64, 175, 0.13));
  color: #bae6fd;
  height: clamp(28px, 3.5vh, 30px);
  min-width: clamp(80px, 5.9vw, 96px);
  padding: 0 clamp(10px, 0.9vw, 14px);
  font-size: clamp(12px, 0.82vw, 13px);
  cursor: pointer;
  box-shadow: inset 0 0 12px rgba(14, 165, 233, 0.16);
}

.wall-actions button:hover {
  color: #e0f2fe;
  border-color: rgba(34, 211, 238, 0.88);
  box-shadow:
    inset 0 0 16px rgba(14, 165, 233, 0.28),
    0 0 10px rgba(14, 165, 233, 0.2);
}

@media (max-width: 1200px) {
  h1 {
    font-size: 24px;
  }

  .wall-header::before {
    width: 690px;
  }
}

@media (max-width: 1024px) {
  .wall-header {
    padding: 0 12px;
  }

  .wall-header::before {
    width: 600px;
  }

  h1 {
    font-size: 22px;
  }
}

@media (max-width: 720px) {
  .wall-date,
  .wall-actions {
    gap: 6px;
    font-size: 10px;
  }

  .wall-actions button {
    padding: 0 8px;
  }
}
</style>
