<template>
  <main class="video-wall-screen">
    <WallHeader
      :date="currentDate"
      :weekday="currentWeekday"
      :time="currentTime"
    />

    <section
      class="wall-layout"
      :class="{
        'left-collapsed': leftCollapsed,
        'right-collapsed': rightCollapsed,
        'map-active': screenMode === 'map'
      }"
    >
      <aside class="side-column left-column" :class="{ collapsed: leftCollapsed }">
        <DeviceOverviewPanel :metrics="deviceOverview" />
        <AlarmStatisticsPanel :metrics="alarmSummary" />
        <PointTypePanel />
      </aside>

      <button
        class="collapse-handle collapse-left"
        type="button"
        :aria-label="leftCollapsed ? '展开看板' : '收起看板'"
        @mousedown.prevent
        @click="toggleLeftPanel"
      >
        <span>{{ leftCollapsed ? '›' : '‹' }}</span>
        <em>{{ leftCollapsed ? '»' : '«' }}</em>
      </button>

      <section class="center-stage" :class="{ 'map-mode': screenMode === 'map' }">
        <LayoutTabs v-if="screenMode === 'wall'" v-model="layoutCount" v-model:mode="screenMode" />
        <div v-if="screenMode === 'wall'" class="video-grid" :class="`grid-${layoutCount}`">
          <VideoFeedCard
            v-for="(feed, index) in visibleFeeds"
            :key="feed.id"
            :feed="feed"
            :sequence="String(index + 1).padStart(2, '0')"
            :timestamp="`${currentDate} ${currentTime}`"
          />
        </div>
        <MapScreen
          v-else
          ref="mapScreenRef"
          :officers="officers"
          :patrol-area="patrolArea"
          :feeds="feedModels"
          @select-wall="selectWallLayout"
        />
      </section>

      <button
        class="collapse-handle collapse-right"
        type="button"
        :aria-label="rightCollapsed ? '展开看板' : '收起看板'"
        @mousedown.prevent
        @click="toggleRightPanel"
      >
        <span>{{ rightCollapsed ? '‹' : '›' }}</span>
        <em>{{ rightCollapsed ? '«' : '»' }}</em>
      </button>

      <aside class="side-column right-column" :class="{ collapsed: rightCollapsed }">
        <AlarmTrendPanel :bars="trendBars" :labels="trendLabels" />
        <IntelligentAnalysisPanel :metrics="analysisMetrics" />
        <StorageStatusPanel :percent="storagePercent" />
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import WallHeader from './components/WallHeader.vue';
import DeviceOverviewPanel from './components/DeviceOverviewPanel.vue';
import AlarmStatisticsPanel from './components/AlarmStatisticsPanel.vue';
import AlarmTrendPanel from './components/AlarmTrendPanel.vue';
import PointTypePanel from './components/PointTypePanel.vue';
import IntelligentAnalysisPanel from './components/IntelligentAnalysisPanel.vue';
import StorageStatusPanel from './components/StorageStatusPanel.vue';
import LayoutTabs from './components/LayoutTabs.vue';
import VideoFeedCard from './components/VideoFeedCard.vue';
import MapScreen from './components/MapScreen.vue';
import { useVideoWallData } from './composables/useVideoWallData';

type ScreenMode = 'wall' | 'map';

const layoutCount = ref(4);
const screenMode = ref<ScreenMode>('wall');
const leftCollapsed = ref(false);
const rightCollapsed = ref(false);
const mapScreenRef = ref<InstanceType<typeof MapScreen>>();

const {
  currentDate,
  currentWeekday,
  currentTime,
  deviceOverview,
  alarmSummary,
  analysisMetrics,
  storagePercent,
  feedModels,
  officers,
  trendBars,
  trendLabels,
  patrolArea
} = useVideoWallData();

const visibleFeeds = computed(() => feedModels.value.slice(0, layoutCount.value));

const resizeMap = () => {
  window.setTimeout(() => mapScreenRef.value?.resize(), 320);
};

const toggleLeftPanel = (event: MouseEvent) => {
  leftCollapsed.value = !leftCollapsed.value;
  (event.currentTarget as HTMLButtonElement).blur();
  resizeMap();
};

const toggleRightPanel = (event: MouseEvent) => {
  rightCollapsed.value = !rightCollapsed.value;
  (event.currentTarget as HTMLButtonElement).blur();
  resizeMap();
};

const selectWallLayout = (count: number) => {
  layoutCount.value = count;
  screenMode.value = 'wall';
};
</script>

<style scoped lang="scss">
.video-wall-screen {
  --screen-pad-x: 0px;
  --screen-pad-y: 0px;
  --header-height: clamp(50px, 7.2vh, 62px);
  --side-width: clamp(260px, 20.8vw, 320px);
  --layout-gap: clamp(6px, 0.65vw, 10px);
  --content-pad-x: clamp(8px, 0.78vw, 12px);
  --content-pad-bottom: clamp(8px, 0.78vw, 12px);
  --panel-pad-x: clamp(8px, 0.78vw, 12px);
  --panel-pad-y: clamp(7px, 0.72vw, 10px);
  --collapse-gap: 16px;
  --collapsed-rail-width: 8px;
  --metric-height: clamp(42px, 5.8vh, 62px);
  --metric-value-size: clamp(21px, 1.76vw, 36px);
  --donut-size: clamp(76px, 5.8vw, 116px);
  --label-size: clamp(11px, 0.95vw, 18px);
  --panel-title-size: clamp(14px, 1.14vw, 24px);
  --feed-info-size: clamp(12px, 0.95vw, 17px);
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  color: #dbeafe;
  background: #010715;
  font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
  padding: 0;
  position: relative;
  box-sizing: border-box;
}

.video-wall-screen::before,
.video-wall-screen::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.video-wall-screen::before {
  content: none;
}

.video-wall-screen::after {
  content: none;
}

.wall-layout {
  position: relative;
  z-index: 1;
  margin: var(--layout-gap) var(--content-pad-x) var(--content-pad-bottom);
  height: calc(100vh - var(--header-height) - var(--layout-gap) - var(--content-pad-bottom));
  display: grid;
  grid-template-columns: var(--side-width) minmax(0, 1fr) var(--side-width);
  gap: var(--layout-gap);
  background: #010715;
  transition: grid-template-columns 240ms ease;
}

.wall-layout.left-collapsed {
  grid-template-columns: var(--collapsed-rail-width) minmax(0, 1fr) var(--side-width);
}

.wall-layout.right-collapsed {
  grid-template-columns: var(--side-width) minmax(0, 1fr) var(--collapsed-rail-width);
}

.wall-layout.left-collapsed.right-collapsed {
  grid-template-columns: var(--collapsed-rail-width) minmax(0, 1fr) var(--collapsed-rail-width);
}

.side-column,
.center-stage {
  min-height: 0;
}

.side-column {
  display: grid;
  gap: var(--layout-gap);
  margin: 0;
  padding: 0;
  background: #010715;
  opacity: 1;
  transform: translateX(0);
  filter: none;
  transition:
    opacity 260ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 260ms ease;
  will-change: opacity, transform;
}

.side-column.collapsed {
  opacity: 0;
  pointer-events: none;
  filter: blur(1px);
}

.left-column.collapsed {
  transform: translateX(calc(-100% - var(--layout-gap)));
}

.right-column.collapsed {
  transform: translateX(calc(100% + var(--layout-gap)));
}

.left-column {
  grid-template-rows: 0.86fr 1.05fr 0.9fr;
}

.right-column {
  grid-template-rows: 0.82fr 0.9fr 1fr;
}

.center-stage {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  gap: 8px;
  background: #010715;
}

.center-stage.map-mode {
  grid-template-rows: minmax(0, 1fr);
  gap: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.wall-layout.map-active {
  margin: 0;
  height: calc(100vh - var(--header-height));
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  background: transparent;
}

.wall-layout.map-active .center-stage {
  grid-column: 1 / -1;
  grid-row: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: transparent;
}

.wall-layout.map-active .center-stage :deep(.wall-map-screen) {
  width: 100%;
  height: 100%;
}

.wall-layout.map-active .side-column {
  position: absolute;
  z-index: 30;
  top: var(--layout-gap);
  bottom: var(--content-pad-bottom);
  width: var(--side-width);
}

.wall-layout.map-active .left-column {
  left: var(--content-pad-x);
}

.wall-layout.map-active .right-column {
  right: var(--content-pad-x);
}

.wall-layout.map-active .collapse-handle {
  z-index: 40;
}

.collapse-handle {
  position: absolute;
  z-index: 8;
  top: 50%;
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  color: #eff6ff;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  opacity: 1;
  transform: translateY(-50%);
  transition:
    opacity 160ms ease,
    transform 180ms ease,
    left 300ms cubic-bezier(0.22, 1, 0.36, 1),
    right 300ms cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
}

.collapse-handle::before,
.collapse-handle::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.collapse-handle::before {
  display: none;
}

.collapse-handle::after {
  display: none;
}

.collapse-handle:hover {
  transform: translateY(-50%) scale(1.01);
}

.collapse-handle span {
  display: none;
}

.collapse-handle em {
  position: absolute;
  z-index: 1;
  top: 50%;
  color: rgba(206, 230, 245, 0.72);
  text-shadow: 0 0 8px rgba(147, 197, 253, 0.72);
  font-size: 30px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%);
  animation: none;
  transition: opacity 160ms ease;
}

.collapse-handle:hover em {
  opacity: 0.86;
  animation: side-chevron-flow 1.25s ease-in-out infinite;
}

.collapse-left {
  left: calc(var(--side-width) + var(--collapse-gap) - 36px);
}

.left-collapsed .collapse-left {
  left: calc(var(--collapsed-rail-width) - 36px);
}

.collapse-left em {
  right: 22px;
}

.collapse-right {
  right: calc(var(--side-width) + var(--collapse-gap) - 36px);
}

.right-collapsed .collapse-right {
  right: calc(var(--collapsed-rail-width) - 36px);
}

.collapse-right em {
  left: 22px;
}

.collapse-right:hover em {
  animation-name: side-chevron-flow-reverse;
}

.video-grid {
  display: grid;
  gap: 4px;
  min-height: 0;
  padding: clamp(2px, 0.26vw, 4px);
  border: 0;
  background: rgba(1, 12, 28, 0.82);
  position: relative;
  box-shadow:
    inset 0 0 24px rgba(0, 163, 255, 0.2),
    0 0 16px rgba(14, 165, 233, 0.12);
}

.video-grid::before {
  content: none;
}

.video-grid.grid-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.video-grid.grid-8,
.video-grid.grid-16 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 1366px), (max-height: 760px) {
  .video-wall-screen {
    --side-width: clamp(238px, 20vw, 286px);
    --layout-gap: 6px;
    --content-pad-x: 8px;
    --content-pad-bottom: 8px;
    --panel-pad-x: 8px;
    --panel-pad-y: 7px;
    --metric-height: 42px;
    --donut-size: 76px;
    --metric-value-size: 22px;
    --label-size: 11px;
    --panel-title-size: 14px;
  }

  .right-column {
    grid-template-rows: 0.72fr 0.82fr 0.92fr;
  }

  .left-column {
    grid-template-rows: 0.76fr 0.98fr 0.78fr;
  }

}

@media (max-width: 1200px) {
  .wall-layout {
    grid-template-columns: minmax(220px, 25vw) minmax(0, 1fr) minmax(220px, 25vw);
  }

  .wall-layout.left-collapsed {
    grid-template-columns: var(--collapsed-rail-width) minmax(0, 1fr) minmax(220px, 25vw);
  }

  .wall-layout.right-collapsed {
    grid-template-columns: minmax(220px, 25vw) minmax(0, 1fr) var(--collapsed-rail-width);
  }
}

@media (max-width: 1024px) {
  .video-wall-screen {
    --side-width: 220px;
    --header-height: 56px;
    --metric-height: 38px;
    --donut-size: 68px;
    --metric-value-size: 20px;
    --label-size: 10px;
  }
}

@media (max-width: 720px) {
  .video-wall-screen {
    --side-width: 200px;
    --layout-gap: 4px;
    --metric-height: 34px;
    --donut-size: 60px;
    --metric-value-size: 18px;
  }
}

@keyframes arrow-nudge-left {
  0%,
  100% {
    transform: translateX(3px);
  }
  50% {
    transform: translateX(-4px);
  }
}

@keyframes arrow-nudge-right {
  0%,
  100% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(4px);
  }
}

@keyframes side-chevron-flow {
  0%,
  100% {
    opacity: 0.4;
    transform: translateY(-50%) translateX(0);
  }
  50% {
    opacity: 0.86;
    transform: translateY(-50%) translateX(7px);
  }
}

@keyframes side-chevron-flow-reverse {
  0%,
  100% {
    opacity: 0.4;
    transform: translateY(-50%) translateX(0);
  }
  50% {
    opacity: 0.86;
    transform: translateY(-50%) translateX(-7px);
  }
}
</style>
