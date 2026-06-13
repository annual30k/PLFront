<template>
  <main class="video-wall-screen">
    <WallHeader
      :date="currentDate"
      :weekday="currentWeekday"
      :time="currentTime"
    />

    <section class="wall-layout">
      <aside class="side-column left-column">
        <DeviceOverviewPanel :metrics="deviceOverview" />
        <AlarmStatisticsPanel :metrics="alarmSummary" />
        <AlarmTrendPanel :bars="trendBars" :labels="trendLabels" />
      </aside>

      <section class="center-stage">
        <LayoutTabs v-model="layoutCount" />
        <div class="video-grid" :class="`grid-${layoutCount}`">
          <VideoFeedCard
            v-for="(feed, index) in visibleFeeds"
            :key="feed.id"
            :feed="feed"
            :sequence="String(index + 1).padStart(2, '0')"
            :timestamp="`${currentDate} ${currentTime}`"
          />
        </div>
      </section>

      <aside class="side-column right-column">
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
import IntelligentAnalysisPanel from './components/IntelligentAnalysisPanel.vue';
import StorageStatusPanel from './components/StorageStatusPanel.vue';
import LayoutTabs from './components/LayoutTabs.vue';
import VideoFeedCard from './components/VideoFeedCard.vue';
import { useVideoWallData } from './composables/useVideoWallData';

const layoutCount = ref(4);

const {
  currentDate,
  currentWeekday,
  currentTime,
  deviceOverview,
  alarmSummary,
  analysisMetrics,
  storagePercent,
  feedModels,
  trendBars,
  trendLabels
} = useVideoWallData();

const visibleFeeds = computed(() => feedModels.value.slice(0, layoutCount.value));
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
</style>
