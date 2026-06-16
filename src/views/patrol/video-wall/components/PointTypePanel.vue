<template>
  <WallPanel title="点位类型" subtitle="POINT TYPE">
    <div class="point-type-list">
      <button
        v-for="item in pointTypes"
        :key="item.label"
        class="point-type-item"
        :class="item.tone"
        type="button"
      >
        <span class="point-type-icon" aria-hidden="true">
          <img :src="item.iconSrc" :alt="item.label" />
        </span>
        <span class="point-type-label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <span class="point-type-chevron" aria-hidden="true">›</span>
      </button>
    </div>
  </WallPanel>
</template>

<script setup lang="ts">
import WallPanel from './WallPanel.vue';
import glassesIcon from '@/assets/patrol/video-wall/point-type-glasses.png';
import headsetIcon from '@/assets/patrol/video-wall/point-type-headset.png';

const pointTypes = [
  { label: '眼镜视频流', value: 128, iconSrc: glassesIcon, tone: 'cyan' },
  { label: '耳机视频流', value: 64, iconSrc: headsetIcon, tone: 'orange' }
] as const;
</script>

<style scoped lang="scss">
.point-type-list {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1vh, 16px);
  padding: clamp(6px, 0.5vw, 10px) clamp(4px, 0.42vw, 8px);
  box-sizing: border-box;
}

.point-type-item {
  width: 100%;
  min-width: 0;
  min-height: 0;
  border: 1px solid rgba(0, 128, 255, 0.78);
  background:
    linear-gradient(90deg, rgba(7, 45, 85, 0.82), rgba(5, 27, 64, 0.9)),
    radial-gradient(circle at 18% 50%, rgba(34, 211, 238, 0.18), transparent 32%);
  box-shadow:
    inset 0 0 24px rgba(0, 117, 255, 0.22),
    inset 0 1px 0 rgba(125, 211, 252, 0.22),
    0 0 12px rgba(0, 154, 255, 0.1);
  color: #dbeafe;
  padding: clamp(7px, 0.7vw, 12px) clamp(9px, 0.9vw, 16px);
  display: grid;
  grid-template-columns: clamp(48px, 3.9vw, 66px) minmax(0, 1fr) auto auto;
  gap: clamp(8px, 0.85vw, 15px);
  align-items: center;
  cursor: default;
  overflow: hidden;
  box-sizing: border-box;
}

.point-type-icon {
  width: clamp(50px, 4vw, 74px);
  aspect-ratio: 1.45;
  display: grid;
  place-items: center;
  justify-self: center;
}

.point-type-icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.58));
}

.point-type-label {
  min-width: 0;
  color: #9fbce7;
  font-size: clamp(13px, 0.95vw, 19px);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 10px rgba(148, 163, 184, 0.26);
}

strong {
  color: #38bdf8;
  font-size: clamp(24px, 1.8vw, 36px);
  line-height: 1;
  font-weight: 900;
  text-shadow: 0 0 13px rgba(56, 189, 248, 0.5);
}

.point-type-chevron {
  color: #a5c5ee;
  font-size: clamp(26px, 2vw, 38px);
  line-height: 1;
  margin-left: clamp(2px, 0.25vw, 5px);
  transform: translateY(-1px);
}

.point-type-item.orange strong {
  color: #f59e3d;
}

.point-type-item.orange .point-type-icon img {
  filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.58));
}

.point-type-item.orange {
  background:
    linear-gradient(90deg, rgba(7, 45, 85, 0.82), rgba(5, 27, 64, 0.9)),
    radial-gradient(circle at 18% 50%, rgba(251, 146, 60, 0.16), transparent 32%);
}

@media (max-width: 1366px), (max-height: 760px) {
  .point-type-list {
    gap: 8px;
    padding: 5px 4px;
  }

  .point-type-item {
    grid-template-columns: 48px minmax(0, 1fr) auto auto;
    gap: 8px;
    padding: 6px 9px;
  }
}
</style>
