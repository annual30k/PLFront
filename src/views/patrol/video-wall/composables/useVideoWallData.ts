import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  getCurrentPatrolArea,
  listDispatchChannels,
  listOfficerLocations,
  listPatrolAlerts,
  listPatrolDevices,
  listPatrolMedia,
  listPatrolMessages,
  listPatrolSos
} from '@/api/patrol';
import type {
  DispatchChannel,
  OfficerLocation,
  PatrolAlert,
  PatrolArea,
  PatrolDevice,
  PatrolMedia,
  PatrolMessage,
  PatrolSos
} from '@/api/patrol/types';
import { getToken } from '@/utils/auth';
import { fallbackArea, fallbackChannels, feedTones, trendBars, trendLabels } from '../data/videoWallData';
import type { AlarmSummaryMetrics, AnalysisMetrics, DeviceOverviewMetrics, VideoWallFeed } from '../types';

const padTime = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;

const formatTime = (date: Date) => `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;

export const useVideoWallData = () => {
  const now = ref(new Date());
  const devices = ref<PatrolDevice[]>([]);
  const channels = ref<DispatchChannel[]>([]);
  const officers = ref<OfficerLocation[]>([]);
  const alerts = ref<PatrolAlert[]>([]);
  const media = ref<PatrolMedia[]>([]);
  const sos = ref<PatrolSos[]>([]);
  const messages = ref<PatrolMessage[]>([]);
  const patrolArea = ref<PatrolArea>(fallbackArea());
  let clockTimer: ReturnType<typeof setInterval> | undefined;
  let dataTimer: ReturnType<typeof setInterval> | undefined;

  const currentDate = computed(() => formatDate(now.value));
  const currentWeekday = computed(() => ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.value.getDay()]);
  const currentTime = computed(() => formatTime(now.value));

  const deviceOverview = computed<DeviceOverviewMetrics>(() => {
    const total = devices.value.length || 256;
    const online = devices.value.length ? devices.value.filter((item) => item.onlineStatus === 'ONLINE').length : 236;
    return {
      online,
      total,
      offline: Math.max(0, total - online),
      warning: devices.value.length ? devices.value.filter((item) => item.batteryPercent < 25 || item.onlineStatus !== 'ONLINE').length : 12
    };
  });

  const alarmSummary = computed<AlarmSummaryMetrics>(() => ({
    total: alerts.value.length + sos.value.length || 128,
    critical: alerts.value.length ? alerts.value.filter((item) => item.level === 'CRITICAL').length : 32,
    sos: sos.value.length || 28,
    media: media.value.length ? media.value.filter((item) => item.verifyStatus !== 'VERIFIED').length : 20,
    pending: messages.value.length ? messages.value.reduce((sum, item) => sum + (item.pendingCount || 0), 0) : 18
  }));

  const storagePercent = computed(() => Math.min(92, Math.max(38, 52 + media.value.length * 3)));

  const analysisMetrics = computed<AnalysisMetrics>(() => ({
    face: 80 + alerts.value.length * 8,
    people: 1600 + officers.value.length * 96,
    vehicle: 120 + channels.value.length * 9,
    behavior: 20 + sos.value.length * 4 + alerts.value.length
  }));

  const feedModels = computed<VideoWallFeed[]>(() => {
    const source = channels.value.length ? channels.value : fallbackChannels();
    return source.map((channel, index) => {
      const streamUrl = (channel as DispatchChannel & { streamUrl?: string }).streamUrl;
      return {
        id: channel.channelId || `CH-${index + 1}`,
        name: channel.channelId || `通道${index + 1}`,
        location: channel.locationText || officers.value[index % Math.max(1, officers.value.length)]?.address || '核心勤务区',
        state: streamUrl ? 'LIVE' : '待接入',
        tone: feedTones[index % feedTones.length],
        streamUrl,
        waitingText: streamUrl ? '实时流接入中' : '等待实时流接入'
      };
    });
  });

  const loadData = async () => {
    if (!getToken()) {
      patrolArea.value = fallbackArea();
      channels.value = fallbackChannels();
      return;
    }

    const [deviceRes, channelRes, officerRes, alertRes, mediaRes, sosRes, messageRes, areaRes] = await Promise.allSettled([
      listPatrolDevices(),
      listDispatchChannels(),
      listOfficerLocations(),
      listPatrolAlerts(),
      listPatrolMedia(),
      listPatrolSos(),
      listPatrolMessages(),
      getCurrentPatrolArea()
    ]);

    if (deviceRes.status === 'fulfilled') devices.value = deviceRes.value.data;
    if (channelRes.status === 'fulfilled') channels.value = channelRes.value.data;
    if (officerRes.status === 'fulfilled') officers.value = officerRes.value.data;
    if (alertRes.status === 'fulfilled') alerts.value = alertRes.value.data;
    if (mediaRes.status === 'fulfilled') media.value = mediaRes.value.data;
    if (sosRes.status === 'fulfilled') sos.value = sosRes.value.data;
    if (messageRes.status === 'fulfilled') messages.value = messageRes.value.data;
    patrolArea.value = areaRes.status === 'fulfilled' ? areaRes.value.data : fallbackArea();
  };

  onMounted(() => {
    void loadData();
    clockTimer = setInterval(() => {
      now.value = new Date();
    }, 1000);
    dataTimer = setInterval(() => {
      void loadData();
    }, 15000);
  });

  onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer);
    if (dataTimer) clearInterval(dataTimer);
  });

  return {
    currentDate,
    currentWeekday,
    currentTime,
    deviceOverview,
    alarmSummary,
    analysisMetrics,
    storagePercent,
    feedModels,
    trendBars,
    trendLabels,
    patrolArea,
    loadData
  };
};
