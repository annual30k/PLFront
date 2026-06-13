import type { DispatchChannel, PatrolArea } from '@/api/patrol/types';
import type { FeedTone } from '../types';

export const trendBars = [24, 34, 30, 56, 38, 48, 76, 54, 81, 42, 78, 62];

export const trendLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

export const feedTones: FeedTone[] = ['cool', 'indoor', 'parking', 'street'];

export const fallbackChannels = (): DispatchChannel[] =>
  Array.from({ length: 16 }, (_, index) => ({
    channelId: `通道${index + 1}`,
    deviceId: `PL-${String(index + 1).padStart(3, '0')}`,
    officerName: `警员${index + 1}`,
    deptName: '第一巡逻支队',
    state: index < 4 ? 'WAITING' : 'STANDBY',
    mode: 'LOW_LATENCY',
    latencyMs: 80 + index * 7,
    locationText: ['主干道北段', '商务楼大厅', '地下停车场', '园区东门'][index % 4],
    talking: false
  }));

export const fallbackArea = (): PatrolArea => ({
  areaId: 'AREA-FZ-WQ-001',
  areaName: '五四路核心勤务区',
  teamId: 'PTL-GROUP-A',
  teamName: '第一巡逻支队 A 组',
  updatedAt: '',
  boundary: [
    { latitude: 26.1048, longitude: 119.3009 },
    { latitude: 26.1044, longitude: 119.3137 },
    { latitude: 26.0977, longitude: 119.3145 },
    { latitude: 26.0968, longitude: 119.3024 }
  ],
  route: [
    { latitude: 26.1036, longitude: 119.3025 },
    { latitude: 26.1017, longitude: 119.3065 },
    { latitude: 26.0995, longitude: 119.3104 },
    { latitude: 26.0979, longitude: 119.3131 }
  ]
});
