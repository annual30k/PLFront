export type FeedTone = 'cool' | 'indoor' | 'parking' | 'street';

export type MetricTone = 'cyan' | 'blue' | 'orange' | 'red';

export type MetricIconKey =
  | 'camera'
  | 'online'
  | 'offline'
  | 'alarm'
  | 'face'
  | 'people'
  | 'vehicle'
  | 'behavior';

export interface VideoWallFeed {
  id: string;
  name: string;
  location: string;
  state: string;
  tone: FeedTone;
  streamUrl?: string;
  waitingText: string;
}

export interface DeviceOverviewMetrics {
  online: number;
  total: number;
  offline: number;
  warning: number;
}

export interface AlarmSummaryMetrics {
  total: number;
  critical: number;
  sos: number;
  media: number;
  pending: number;
}

export interface AnalysisMetrics {
  face: number;
  people: number;
  vehicle: number;
  behavior: number;
}
