<template>
  <section class="wall-map-screen">
    <div class="map-toolbar">
      <div class="amap-brand">
        <span>高德地图</span>
        <small>AMap</small>
      </div>
      <div class="map-layer-tabs">
        <button type="button" @click="emit('select-wall', 4)">4路</button>
        <button type="button" @click="emit('select-wall', 8)">8路</button>
        <button type="button" @click="emit('select-wall', 16)">16路</button>
        <button class="active" type="button">电子地图</button>
      </div>
    </div>

    <div class="map-canvas-wrap">
      <div ref="mapContainerRef" class="amap-real-canvas"></div>
      <div class="map-tech-overlay"></div>

      <div class="map-search-panel">
        <div class="search-line">
          <span class="search-icon"></span>
          <span>点位检索</span>
          <i></i>
        </div>
        <div class="select-line">
          <span>设备类型</span>
          <b>全部</b>
          <i></i>
        </div>
        <div class="select-line">
          <span>在线状态</span>
          <b>全部</b>
          <i></i>
        </div>
      </div>

      <div class="map-fallback-grid">
        <div v-for="road in roadSegments" :key="road.id" class="route" :style="road.style"></div>
        <span class="map-label label-a">科技园</span>
        <span class="map-label label-b">高新区</span>
        <span class="map-label label-c">行政中心</span>
        <span class="map-label label-d">金融城</span>
        <span class="map-label label-e">国际博览中心</span>
      </div>

      <div class="command-center">
        <span></span>
        <b>智慧城市指挥中心</b>
      </div>

      <button
        v-for="point in displayPoints"
        :key="point.id"
        class="map-point"
        :class="[point.status, point.streamType, { selected: point.id === selectedPoint.id }]"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
        type="button"
        @click="selectPoint(point)"
      >
        <span class="point-icon">{{ point.streamType === 'glasses' ? '◎' : '◉' }}</span>
        <span>{{ point.area }}</span>
      </button>

      <div class="legend-panel">
        <div><span class="legend-icon glasses"></span>眼镜视频流（在线）</div>
        <div><span class="legend-icon earphone"></span>耳机视频流（在线）</div>
        <div><span class="legend-icon warning"></span>设备告警（在线）</div>
        <div><span class="legend-icon offline"></span>设备离线（离线）</div>
      </div>

      <div class="video-link" :style="linkStyle"></div>
      <div class="video-pop" :style="previewStyle">
        <div class="video-pop-head">
          <strong>{{ selectedPoint.name }} - {{ selectedPoint.streamName }}</strong>
          <button type="button">×</button>
        </div>
        <div class="live-frame">
          <div class="scan-line"></div>
          <span class="live-dot"></span>
          <b>{{ selectedPoint.status === 'offline' ? '信号离线' : '实时接入中' }}</b>
        </div>
        <div class="preview-actions">
          <button type="button"><span class="action-icon play"></span>播放</button>
          <button type="button"><span class="action-icon replay"></span>回放</button>
          <button type="button" @click="focusSelectedPoint"><span class="action-icon locate"></span>定位</button>
          <button type="button"><span class="action-icon fullscreen"></span>全屏</button>
        </div>
      </div>
    </div>

    <div class="map-status">
      <span>在线点位 <b>{{ onlineCount }}</b></span>
      <span>实时视频流 <b>{{ activeStreamCount }}</b></span>
      <span>眼镜接入 <b>{{ glassesCount }}</b></span>
      <span>耳机接入 <b>{{ earphoneCount }}</b></span>
      <span>今日告警 <b>{{ warningCount }}</b></span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadAMap } from '@/utils/amap';
import type { OfficerLocation, PatrolArea } from '@/api/patrol/types';
import type { VideoWallFeed } from '../types';

type StreamType = 'glasses' | 'earphone';
type PointStatus = 'online' | 'warning' | 'offline';
type MapState = 'idle' | 'loading' | 'ready' | 'error';

interface DevicePoint {
  id: string;
  name: string;
  area: string;
  streamType: StreamType;
  streamName: string;
  status: PointStatus;
  alarmText: string;
  longitude: number;
  latitude: number;
  x: number;
  y: number;
}

const props = defineProps<{
  officers: OfficerLocation[];
  patrolArea: PatrolArea;
  feeds: VideoWallFeed[];
}>();

const emit = defineEmits<{
  (event: 'select-wall', count: number): void;
}>();

const mapContainerRef = ref<HTMLElement>();
const mapState = ref<MapState>('idle');
const mapError = ref('');
const selectedPointId = ref('');

let amapInstance: any;
let AMapRef: any;
let overlays: any[] = [];
let resizeObserver: ResizeObserver | undefined;

const fallbackLngLat = [
  [119.3025, 26.1036],
  [119.3065, 26.1017],
  [119.3104, 26.0995],
  [119.3131, 26.0979],
  [119.3042, 26.0988],
  [119.3094, 26.1041],
  [119.3151, 26.101],
  [119.3009, 26.1048]
];

const areaCenter = computed<[number, number]>(() => {
  const source = props.patrolArea.route.length ? props.patrolArea.route : props.patrolArea.boundary;
  if (!source.length) return [119.3065, 26.1017];
  const total = source.reduce(
    (sum, item) => {
      sum.longitude += item.longitude;
      sum.latitude += item.latitude;
      return sum;
    },
    { longitude: 0, latitude: 0 }
  );
  return [total.longitude / source.length, total.latitude / source.length];
});

const points = computed<DevicePoint[]>(() => {
  const officerPoints = props.officers
    .map((officer, index) => {
      const longitude = Number(officer.longitude);
      const latitude = Number(officer.latitude);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return undefined;
      return createPoint({
        id: officer.deviceId || officer.badgeNo || `OFFICER-${index}`,
        name: officer.officerName || `巡逻点位${index + 1}`,
        area: officer.badgeNo || `P-${String(index + 1).padStart(2, '0')}`,
        longitude,
        latitude,
        index,
        online: officer.onlineStatus === 'ONLINE',
        warning: officer.batteryPercent < 25,
        locationText: officer.address
      });
    })
    .filter(Boolean) as DevicePoint[];

  if (officerPoints.length) return officerPoints;

  return props.feeds.slice(0, 8).map((feed, index) => {
    const coordinate = fallbackLngLat[index % fallbackLngLat.length];
    return createPoint({
      id: feed.id,
      name: feed.location || feed.name,
      area: `P-${String(index + 1).padStart(2, '0')}`,
      longitude: coordinate[0],
      latitude: coordinate[1],
      index,
      online: index !== 5,
      warning: index === 2 || index === 4,
      locationText: feed.location
    });
  });
});

const seedPositions = [
  [17, 34],
  [26, 22],
  [44, 31],
  [61, 35],
  [75, 28],
  [88, 41],
  [22, 52],
  [35, 61],
  [51, 53],
  [67, 58],
  [84, 63],
  [31, 78],
  [47, 71],
  [58, 84],
  [73, 75],
  [92, 81]
];

const displayPoints = computed<DevicePoint[]>(() => {
  const source = points.value.length ? points.value : [];
  if (source.length >= 14) return source;
  const expanded = [...source];
  seedPositions.forEach(([x, y], index) => {
    if (expanded[index]) {
      expanded[index] = { ...expanded[index], x, y };
      return;
    }
    const base = source[index % Math.max(1, source.length)];
    expanded.push(
      createPoint({
        id: `MAP-SEED-${index}`,
        name: ['主干道路段', '智慧城', '眼镜视频流', '耳机视频流'][index % 4],
        area: index % 3 === 1 ? '耳机视频流' : '眼镜视频流',
        longitude: base?.longitude || fallbackLngLat[index % fallbackLngLat.length][0],
        latitude: base?.latitude || fallbackLngLat[index % fallbackLngLat.length][1],
        index,
        online: index % 7 !== 3,
        warning: index === 5 || index === 9,
        locationText: index === 5 ? '主干道路段' : undefined
      })
    );
    expanded[expanded.length - 1].x = x;
    expanded[expanded.length - 1].y = y;
  });
  return expanded;
});

const selectedPoint = computed(() => displayPoints.value.find((point) => point.id === selectedPointId.value) || displayPoints.value[5] || displayPoints.value[0]);
const onlineCount = computed(() => points.value.filter((point) => point.status !== 'offline').length);
const warningCount = computed(() => points.value.filter((point) => point.status === 'warning').length || 12);
const glassesCount = computed(() => points.value.filter((point) => point.streamType === 'glasses').length);
const earphoneCount = computed(() => points.value.filter((point) => point.streamType === 'earphone').length);
const activeStreamCount = computed(() => Math.max(18, onlineCount.value));

const mapStateText = computed(() => {
  if (mapState.value === 'ready') return '实时底图';
  if (mapState.value === 'loading') return '加载中';
  if (mapState.value === 'error') return mapError.value || '离线底图';
  return '待初始化';
});

const previewStyle = computed(() => {
  const point = selectedPoint.value;
  return {
    left: `${Math.min(point.x + 10, 54)}%`,
    top: `${Math.max(point.y - 22, 16)}%`
  };
});

const linkStyle = computed(() => {
  const point = selectedPoint.value;
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
    width: `${Math.max(72, Math.min(210, (Math.min(point.x + 10, 54) - point.x) * 13))}px`
  };
});

const roadSegments = [
  { id: 'r1', style: { left: '4%', top: '23%', width: '86%', transform: 'rotate(-4deg)' } },
  { id: 'r2', style: { left: '14%', top: '45%', width: '76%', transform: 'rotate(9deg)' } },
  { id: 'r3', style: { left: '18%', top: '74%', width: '68%', transform: 'rotate(-13deg)' } },
  { id: 'r4', style: { left: '37%', top: '4%', width: '78%', transform: 'rotate(88deg)' } },
  { id: 'r5', style: { left: '55%', top: '7%', width: '62%', transform: 'rotate(77deg)' } },
  { id: 'r6', style: { left: '9%', top: '62%', width: '54%', transform: 'rotate(52deg)' } },
  { id: 'r7', style: { left: '49%', top: '18%', width: '42%', transform: 'rotate(35deg)' } },
  { id: 'r8', style: { left: '24%', top: '14%', width: '42%', transform: 'rotate(22deg)' } },
  { id: 'r9', style: { left: '53%', top: '66%', width: '52%', transform: 'rotate(-28deg)' } }
];

const createPoint = (input: {
  id: string;
  name: string;
  area: string;
  longitude: number;
  latitude: number;
  index: number;
  online: boolean;
  warning: boolean;
  locationText?: string;
}): DevicePoint => {
  const streamType: StreamType = input.index % 3 === 1 ? 'earphone' : 'glasses';
  const status: PointStatus = !input.online ? 'offline' : input.warning ? 'warning' : 'online';
  return {
    id: input.id,
    name: input.locationText || input.name,
    area: input.area,
    streamType,
    streamName: streamType === 'glasses' ? '眼镜视频流' : '耳机视频流',
    status,
    alarmText: status === 'warning' ? (input.index % 2 === 0 ? '移动告警' : 'SOS') : status === 'offline' ? '离线' : '正常',
    longitude: input.longitude,
    latitude: input.latitude,
    x: 24 + ((input.index * 13) % 58),
    y: 24 + ((input.index * 17) % 50)
  };
};

const selectPoint = (point: DevicePoint) => {
  selectedPointId.value = point.id;
  focusPoint(point, false);
};

const focusSelectedPoint = () => {
  if (selectedPoint.value) focusPoint(selectedPoint.value, true);
};

const focusPoint = (point: DevicePoint, zoom = true) => {
  if (!amapInstance) return;
  amapInstance.setCenter([point.longitude, point.latitude]);
  if (zoom) amapInstance.setZoom(16);
};

const initMap = async () => {
  await nextTick();
  if (!mapContainerRef.value || amapInstance) return;

  mapState.value = 'loading';
  mapError.value = '';

  try {
    const AMap = await loadAMap();
    AMapRef = AMap;
    amapInstance = new AMap.Map(mapContainerRef.value, {
      center: areaCenter.value,
      zoom: 14,
      viewMode: '2D',
      resizeEnable: true,
      mapStyle: 'amap://styles/darkblue',
      features: ['bg', 'road', 'building', 'point']
    });
    amapInstance.addControl(new AMap.Scale());
    amapInstance.addControl(new AMap.ToolBar({ position: 'RB', liteStyle: true }));
    mapState.value = 'ready';
    renderAmapOverlays();
  } catch (error) {
    mapState.value = 'error';
    mapError.value = error instanceof Error ? error.message : '高德地图加载失败';
  }
};

const renderAmapOverlays = () => {
  if (!AMapRef || !amapInstance) return;
  clearAmapOverlays();

  if (props.patrolArea.boundary.length) {
    overlays.push(
      new AMapRef.Polygon({
        path: props.patrolArea.boundary.map((point) => [point.longitude, point.latitude]),
        strokeColor: '#22d3ee',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#0ea5e9',
        fillOpacity: 0.12
      })
    );
  }

  if (props.patrolArea.route.length) {
    overlays.push(
      new AMapRef.Polyline({
        path: props.patrolArea.route.map((point) => [point.longitude, point.latitude]),
        strokeColor: '#38bdf8',
        strokeWeight: 5,
        strokeOpacity: 0.82,
        lineJoin: 'round'
      })
    );
  }

  points.value.forEach((point) => {
    const marker = new AMapRef.Marker({
      position: [point.longitude, point.latitude],
      offset: new AMapRef.Pixel(-18, -18),
      content: `<div class="amap-device-marker ${point.status} ${point.streamType} ${point.id === selectedPointId.value ? 'selected' : ''}">${point.streamType === 'glasses' ? '◎' : '◉'}<span>${point.area}</span></div>`
    });
    marker.on('click', () => selectPoint(point));
    overlays.push(marker);
  });

  amapInstance.add(overlays);
  if (overlays.length && amapInstance.setFitView) {
    amapInstance.setFitView(overlays, false, [60, 60, 60, 60], 15);
  }
};

const clearAmapOverlays = () => {
  if (amapInstance && overlays.length) amapInstance.remove(overlays);
  overlays = [];
};

const resize = () => {
  window.setTimeout(() => amapInstance?.resize(), 320);
};

watch(
  points,
  (next) => {
    if (!selectedPointId.value && next.length) selectedPointId.value = next[0].id;
    renderAmapOverlays();
  },
  { immediate: true }
);

watch(() => props.patrolArea, renderAmapOverlays, { deep: true });
watch(selectedPointId, renderAmapOverlays);

onMounted(() => {
  void initMap();
  if (mapContainerRef.value) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mapContainerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  clearAmapOverlays();
  amapInstance?.destroy();
  amapInstance = undefined;
});

defineExpose({ resize });
</script>

<style scoped lang="scss">
.wall-map-screen {
  display: grid;
  grid-template-rows: 46px minmax(0, 1fr) 44px;
  gap: 6px;
  min-height: 0;
  background: rgba(1, 12, 28, 0.82);
}

.map-toolbar,
.map-status {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(14, 165, 233, 0.45);
  background: linear-gradient(180deg, rgba(8, 35, 71, 0.72), rgba(2, 14, 32, 0.72));
  box-shadow: inset 0 0 22px rgba(14, 165, 233, 0.18);
}

.map-toolbar {
  padding: 0 12px;
}

.amap-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  color: #eff6ff;
  font-weight: 700;
}

.amap-brand small {
  color: #38bdf8;
  font-size: 12px;
  font-weight: 500;
}

.brand-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.65);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.35);
}

.map-search {
  flex: 1;
  height: 30px;
  line-height: 30px;
  padding: 0 14px;
  color: #9ec8e7;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(3, 12, 28, 0.58);
  font-size: 13px;
}

.map-filters {
  display: flex;
  gap: 6px;
}

.map-filters button {
  height: 30px;
  padding: 0 10px;
  color: #bfdbfe;
  border: 1px solid rgba(37, 99, 235, 0.86);
  background: rgba(10, 35, 82, 0.78);
}

.map-filters .active {
  color: #eff6ff;
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.map-canvas-wrap {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(14, 165, 233, 0.72);
  background:
    radial-gradient(circle at 55% 40%, rgba(56, 189, 248, 0.22), transparent 28%),
    linear-gradient(135deg, #041a32 0%, #06223f 42%, #03111f 100%);
}

.amap-real-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.42;
}

.map-tech-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(rgba(77, 174, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(77, 174, 255, 0.06) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, transparent 0, rgba(1, 7, 21, 0.18) 100%);
  background-size: 42px 42px, 42px 42px, auto;
}

.map-fallback-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.route {
  position: absolute;
  border-radius: 999px;
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.55));
}

.route-a {
  left: 12%;
  top: 25%;
  width: 74%;
  height: 4px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  transform: rotate(12deg);
}

.route-b {
  left: 34%;
  top: 8%;
  width: 4px;
  height: 74%;
  background: linear-gradient(180deg, transparent, #2563eb, transparent);
  transform: rotate(21deg);
}

.route-c {
  left: 16%;
  top: 68%;
  width: 68%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #22c55e, transparent);
  transform: rotate(-16deg);
}

.map-label {
  position: absolute;
  color: rgba(191, 219, 254, 0.52);
  font-size: 13px;
}

.label-a {
  left: 20%;
  top: 28%;
}

.label-b {
  left: 58%;
  top: 22%;
}

.label-c {
  left: 72%;
  top: 62%;
}

.map-point {
  z-index: 8;
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  color: #22d3ee;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: rgba(1, 20, 42, 0.88);
  box-shadow: 0 0 0 5px rgba(34, 211, 238, 0.09), 0 0 16px rgba(34, 211, 238, 0.68);
  transform: translate(-50%, -50%);
}

.map-point::before {
  content: '';
  position: absolute;
  inset: -12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  opacity: 0.2;
  animation: point-ping 1.8s ease-out infinite;
}

.map-point.warning {
  color: #f59e0b;
  box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.1), 0 0 16px rgba(245, 158, 11, 0.65);
}

.map-point.offline {
  color: #64748b;
  box-shadow: none;
}

.map-point.selected {
  color: #eff6ff;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.92), rgba(30, 64, 175, 0.92));
}

.video-pop {
  position: absolute;
  z-index: 4;
  width: min(360px, 36%);
  min-width: 300px;
  color: #dbeafe;
  border: 1px solid rgba(56, 189, 248, 0.86);
  background: rgba(2, 14, 32, 0.94);
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.32);
}

.video-pop-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.22);
}

.video-pop-head strong,
.video-pop-head span {
  display: block;
}

.video-pop-head strong {
  color: #eff6ff;
  font-size: 14px;
}

.video-pop-head span,
.video-pop-head i {
  color: #93c5fd;
  font-size: 12px;
  font-style: normal;
}

.live-frame {
  position: relative;
  display: grid;
  height: 126px;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    radial-gradient(circle at center, rgba(56, 189, 248, 0.22), transparent 100px),
    linear-gradient(135deg, rgba(9, 58, 83, 0.92), rgba(2, 16, 35, 0.94));
  background-size: 100% 14px, auto, auto;
}

.scan-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.25), transparent);
  animation: scan-move 2.6s linear infinite;
}

.live-dot {
  width: 38px;
  height: 38px;
  border: 4px solid #67e8f9;
  border-radius: 50%;
  box-shadow: 0 0 16px rgba(103, 232, 249, 0.85);
}

.live-frame b {
  color: #93c5fd;
  font-size: 12px;
  font-weight: 500;
}

.preview-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px;
}

.preview-actions button {
  height: 28px;
  color: #bfdbfe;
  border: 1px solid rgba(56, 189, 248, 0.42);
  background: rgba(14, 165, 233, 0.16);
}

.map-status {
  justify-content: space-around;
  color: #bfdbfe;
}

.map-status b {
  color: #22d3ee;
  font-size: 18px;
}

.wall-map-screen {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 43% 48%, rgba(0, 190, 255, 0.25), transparent 9%),
    radial-gradient(circle at 58% 72%, rgba(31, 116, 220, 0.18), transparent 22%),
    linear-gradient(135deg, #041a32 0%, #06223f 48%, #03111f 100%);
}

.map-toolbar,
.map-status {
  border-color: rgba(0, 174, 255, 0.72);
  background: linear-gradient(180deg, rgba(2, 31, 62, 0.92), rgba(2, 14, 32, 0.9));
  box-shadow: inset 0 0 18px rgba(0, 174, 255, 0.2);
}

.map-toolbar {
  position: absolute;
  z-index: 20;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  gap: 14px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid rgba(0, 174, 255, 0.48);
}

.amap-brand {
  min-width: 106px;
  gap: 6px;
  font-size: 16px;
}

.amap-brand small {
  color: rgba(147, 197, 253, 0.82);
  font-size: 10px;
}

.map-layer-tabs {
  display: flex;
  gap: 10px;
}

.map-layer-tabs button {
  min-width: 86px;
  height: 30px;
  padding: 0 18px;
  color: #c7ddff;
  border: 1px solid rgba(38, 115, 228, 0.9);
  background: linear-gradient(180deg, rgba(11, 47, 98, 0.92), rgba(6, 23, 56, 0.92));
  box-shadow: inset 0 0 12px rgba(67, 132, 255, 0.14);
  font-size: 14px;
}

.map-layer-tabs .active {
  color: #eff6ff;
  border-color: #23c7ff;
  background: linear-gradient(180deg, rgba(31, 149, 227, 0.9), rgba(12, 79, 156, 0.95));
  box-shadow: 0 0 16px rgba(35, 199, 255, 0.36), inset 0 0 12px rgba(196, 240, 255, 0.2);
}

.map-canvas-wrap {
  position: absolute;
  inset: 0;
  min-height: 0;
  overflow: hidden;
  border: 0;
  background:
    radial-gradient(circle at 43% 48%, rgba(0, 190, 255, 0.25), transparent 9%),
    radial-gradient(circle at 58% 72%, rgba(31, 116, 220, 0.18), transparent 22%),
    linear-gradient(135deg, #041a32 0%, #06223f 48%, #03111f 100%);
}

.map-tech-overlay {
  background:
    linear-gradient(rgba(62, 165, 255, 0.075) 1px, transparent 1px),
    linear-gradient(90deg, rgba(62, 165, 255, 0.055) 1px, transparent 1px),
    radial-gradient(circle at 42% 48%, transparent 0, rgba(1, 7, 21, 0.2) 100%);
  background-size: 32px 32px, 32px 32px, auto;
}

.map-search-panel {
  position: absolute;
  z-index: 5;
  top: 64px;
  left: 18px;
  width: 220px;
  border: 1px solid rgba(48, 127, 197, 0.58);
  background: rgba(2, 15, 34, 0.82);
  box-shadow: 0 0 18px rgba(0, 174, 255, 0.18);
}

.search-line,
.select-line {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  color: #a9c8e6;
  border-bottom: 1px solid rgba(48, 127, 197, 0.32);
  font-size: 12px;
}

.select-line:last-child {
  border-bottom: 0;
}

.search-line {
  gap: 8px;
  color: #8fb9d9;
}

.search-line i {
  position: relative;
  width: 14px;
  height: 14px;
  margin-left: auto;
  border: 2px solid #c5dcf3;
  border-radius: 50%;
}

.search-line i::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: -4px;
  width: 7px;
  height: 2px;
  background: #c5dcf3;
  transform: rotate(45deg);
}

.search-icon {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8fb9d9;
}

.select-line span {
  flex: 1;
}

.select-line b {
  color: #9ec8e7;
  font-weight: 500;
}

.select-line i {
  width: 7px;
  height: 7px;
  margin-left: 12px;
  border-right: 1px solid #9ec8e7;
  border-bottom: 1px solid #9ec8e7;
  transform: rotate(45deg) translateY(-2px);
}

.route {
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(87, 178, 255, 0.18), rgba(88, 167, 255, 0.72), rgba(87, 178, 255, 0.2), transparent);
  filter: drop-shadow(0 0 8px rgba(56, 149, 248, 0.45));
}

.map-label {
  z-index: 2;
  color: rgba(164, 205, 245, 0.44);
  font-size: 12px;
  letter-spacing: 0;
}

.label-a {
  left: 29%;
  top: 11%;
}

.label-b {
  left: 29%;
  top: 21%;
}

.label-c {
  left: 58%;
  top: 57%;
}

.label-d {
  left: 70%;
  top: 64%;
}

.label-e {
  left: 49%;
  top: 79%;
}

.command-center {
  position: absolute;
  z-index: 4;
  left: 42%;
  top: 49%;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: rgba(197, 225, 255, 0.82);
  font-size: 12px;
  transform: translate(-50%, -50%);
}

.command-center span {
  width: 22px;
  height: 22px;
  border: 6px solid #6ee7ff;
  border-radius: 50%;
  background: #e7fbff;
  box-shadow:
    0 0 0 10px rgba(45, 163, 255, 0.32),
    0 0 0 20px rgba(45, 163, 255, 0.16),
    0 0 26px rgba(42, 203, 255, 0.86);
}

.command-center b {
  font-weight: 600;
}

.map-point {
  z-index: 8;
  display: grid;
  justify-items: center;
  gap: 3px;
  width: 78px;
  min-height: 42px;
  height: 42px;
  padding: 0;
  color: #25d9ff;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 0 7px rgba(0, 190, 255, 0.72);
}

.point-icon {
  display: inline-grid;
  width: 26px;
  height: 22px;
  place-items: center;
  color: #8cf3ff;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: rgba(6, 61, 91, 0.82);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.72), inset 0 0 8px rgba(34, 211, 238, 0.2);
  font-size: 14px;
  line-height: 1;
}

.map-point::before {
  left: 23px;
  top: 0;
  width: 30px;
  height: 30px;
  inset: auto;
  border-radius: 50%;
}

.map-point.warning {
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.78);
}

.map-point.warning .point-icon,
.map-point.earphone .point-icon {
  background: rgba(87, 43, 7, 0.82);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.72), inset 0 0 8px rgba(245, 158, 11, 0.2);
}

.map-point.offline .point-icon {
  background: rgba(42, 53, 69, 0.78);
  box-shadow: none;
}

.map-point.selected {
  color: #ff6b6b;
  background: transparent;
  text-shadow: 0 0 10px rgba(255, 91, 91, 0.95);
}

.map-point.selected .point-icon {
  background: rgba(113, 19, 29, 0.9);
  box-shadow: 0 0 0 5px rgba(248, 113, 113, 0.14), 0 0 18px rgba(248, 113, 113, 0.76);
}

.legend-panel {
  position: absolute;
  z-index: 9;
  left: 18px;
  bottom: 86px;
  display: grid;
  gap: 12px;
  width: 180px;
  padding: 14px 16px;
  color: #cbe5ff;
  border: 1px solid rgba(48, 127, 197, 0.58);
  background: rgba(2, 20, 43, 0.78);
  box-shadow: 0 0 18px rgba(0, 174, 255, 0.16);
  font-size: 12px;
}

.legend-panel div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-icon {
  width: 18px;
  height: 18px;
  border: 1px solid currentColor;
  border-radius: 50%;
  color: #25d9ff;
  box-shadow: 0 0 8px currentColor;
}

.legend-icon.earphone {
  color: #f6a736;
}

.legend-icon.warning {
  color: #ffbd55;
}

.legend-icon.offline {
  color: #718096;
  box-shadow: none;
}

.video-link {
  position: absolute;
  z-index: 7;
  height: 1px;
  background: linear-gradient(90deg, #21d4ff, rgba(33, 212, 255, 0));
  transform: rotate(-42deg);
  transform-origin: left center;
}

.video-pop {
  z-index: 10;
  width: min(300px, 32%);
  min-width: 270px;
}

.video-pop-head {
  align-items: center;
  height: 34px;
  padding: 0 10px;
}

.video-pop-head strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-pop-head button {
  color: #d8efff;
  border: 0;
  background: transparent;
  font-size: 20px;
  line-height: 1;
}

.live-frame {
  background:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    radial-gradient(circle at 68% 34%, rgba(241, 245, 249, 0.18), transparent 7%),
    linear-gradient(115deg, transparent 0 26%, rgba(170, 190, 205, 0.2) 27% 29%, transparent 30% 100%),
    linear-gradient(160deg, rgba(49, 63, 78, 0.94), rgba(10, 22, 39, 0.94) 48%, rgba(4, 11, 24, 0.96));
  background-size: 100% 5px, 32px 100%, auto, auto, auto;
}

.live-dot {
  position: absolute;
  left: 13px;
  bottom: 12px;
  width: 9px;
  height: 9px;
  border: 0;
  background: #3be869;
  box-shadow: 0 0 10px rgba(59, 232, 105, 0.85);
}

.live-frame b {
  position: absolute;
  left: 28px;
  bottom: 9px;
  color: #e4eefc;
  font-size: 12px;
}

.preview-actions button {
  display: grid;
  height: 34px;
  justify-items: center;
  gap: 3px;
  border: 0;
  background: transparent;
  font-size: 12px;
}

.action-icon {
  position: relative;
  width: 20px;
  height: 18px;
  border: 1px solid rgba(213, 232, 255, 0.82);
  border-radius: 50%;
}

.action-icon.play::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid currentColor;
}

.action-icon.replay::after,
.action-icon.locate::after,
.action-icon.fullscreen::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.map-status {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38px;
  border: 0;
  border-top: 1px solid rgba(0, 174, 255, 0.48);
  font-size: 13px;
}

:deep(.amap-logo),
:deep(.amap-copyright),
:deep(.amap-scalecontrol),
:deep(.amap-toolbar) {
  opacity: 0.18;
}

:deep(.amap-device-marker) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 9px;
  color: #22d3ee;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: rgba(1, 20, 42, 0.9);
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.72);
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
}

:deep(.amap-device-marker.warning) {
  color: #f59e0b;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.72);
}

:deep(.amap-device-marker.offline) {
  color: #64748b;
  box-shadow: none;
}

@keyframes point-ping {
  0% {
    transform: scale(0.75);
    opacity: 0.35;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

@keyframes scan-move {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@media (max-width: 1366px), (max-height: 760px) {
  .wall-map-screen {
    grid-template-rows: 42px minmax(0, 1fr) 38px;
  }

  .amap-brand {
    min-width: 180px;
  }

  .map-filters button {
    padding: 0 7px;
    font-size: 12px;
  }

  .video-pop {
    min-width: 280px;
  }

  .live-frame {
    height: 112px;
  }
}
</style>
