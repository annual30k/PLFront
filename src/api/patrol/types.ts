export type ModuleKey =
  | 'dashboard'
  | 'dispatch'
  | 'map'
  | 'alerts'
  | 'devices'
  | 'media'
  | 'sos'
  | 'control'
  | 'messages'
  | 'statistics'
  | 'audit'
  | 'operations';

export interface PatrolMetric {
  label: string;
  value: string;
  note: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info' | string;
}

export interface PatrolWorkItem {
  id: string;
  title: string;
  officer: string;
  source: string;
  status: string;
  level: string;
  timeText: string;
}

export interface PlatformCapacity {
  pilotOfficerCount: number;
  pilotDeviceCount: number;
  maxVideoChannels: number;
  videoWallLayouts: string;
  mapProvider: string;
  algorithmProvider: string;
}

export interface DashboardSummary {
  metrics: PatrolMetric[];
  workItems: PatrolWorkItem[];
  capacity: PlatformCapacity;
}

export interface PatrolDevice {
  deviceId: string;
  deviceName: string;
  officerName: string;
  badgeNo: string;
  deptName: string;
  onlineStatus: string;
  batteryPercent: number;
  signalBars: number;
  firmwareVersion: string;
  storageText: string;
  workState: string;
  lastOnlineTime: string;
}

export interface PatrolDeviceCommand {
  commandId: string;
  deviceId: string;
  command: string;
  operatorId: string;
  status: string;
  resultMessage: string;
  sentAt: string;
  ackAt: string;
}

export interface PatrolDeviceEvent {
  eventId: string;
  deviceId: string;
  eventType: string;
  eventLevel: string;
  eventTitle: string;
  eventDetail: string;
  occurredAt: string;
}

export interface DispatchChannel {
  channelId: string;
  deviceId: string;
  officerName: string;
  deptName: string;
  state: string;
  mode: string;
  latencyMs: number;
  locationText: string;
  talking: boolean;
}

export interface OfficerLocation {
  badgeNo: string;
  officerName: string;
  deptName: string;
  deviceId: string;
  latitude: string;
  longitude: string;
  address: string;
  onlineStatus: string;
  batteryPercent: number;
  reportedAt: string;
}

export interface OfficerTrackPoint {
  badgeNo: string;
  latitude: string;
  longitude: string;
  address: string;
  reportedAt: string;
}

export interface PatrolAlert {
  alertId: string;
  alertType: string;
  title: string;
  targetName: string;
  deviceId: string;
  officerName: string;
  locationText: string;
  status: string;
  level: string;
  confidence: string;
  occurredAt: string;
}

export interface PatrolAlertDisposition {
  dispositionId: string;
  alertId: string;
  actionType: string;
  actionResult: string;
  operatorName: string;
  note: string;
  attachmentsCount: number;
  occurredAt: string;
}

export interface PatrolMedia {
  fileId: string;
  fileName: string;
  mediaType: string;
  deviceId: string;
  officerName: string;
  bizRef: string;
  sizeText: string;
  verifyStatus: string;
  storagePath: string;
  capturedAt: string;
  sha256?: string;
  watermarkToken?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  contentUri?: string;
}

export interface PatrolMediaAction {
  fileId: string;
  status: string;
  message: string;
}

export interface PatrolMediaUploadTask {
  taskId: string;
  fileId: string;
  fileName: string;
  mediaType: string;
  storageSide: string;
  status: string;
  uploadedChunks: number;
  totalChunks: number;
  uploadedChunkIndexes: number[];
  uploadedBytes: number;
  fileSizeBytes: number;
  progress: number;
  expectedSha256: string;
  actualSha256: string;
  errorMessage: string;
  officerName: string;
  deviceId: string;
  createdAt: string;
  completedAt: string;
}

export interface PatrolCleanupResult {
  cleaned: number;
  message: string;
}

export interface AppVersion {
  versionId: string;
  versionCode: number;
  versionName: string;
  forceUpdate: boolean;
  changelog: string;
  downloadUrl: string;
  sha256: string;
  fileId: string;
  status: string;
  publishedAt: string;
}

export interface AppVersionPayload {
  versionCode: number;
  versionName: string;
  forceUpdate: boolean;
  changelog: string;
  downloadUrl?: string;
  sha256?: string;
  fileId?: string;
}

export interface PatrolSos {
  sosId: string;
  officerName: string;
  badgeNo: string;
  deptName: string;
  deviceId: string;
  locationText: string;
  status: string;
  disposition: string;
  recordingAudio: boolean;
  backupEtaMinutes: number;
  createdAt: string;
}

export interface PatrolSosAction {
  sosId: string;
  status: string;
  message: string;
}

export interface ControlPerson {
  controlId: string;
  name: string;
  category: string;
  riskLevel: string;
  status: string;
  source: string;
  expiresAt: string;
}

export interface ControlPersonPayload {
  name: string;
  category: string;
  idCardNo?: string;
  riskLevel: string;
  expiresAt: string;
  remark?: string;
}

export interface ControlVehicle {
  controlId: string;
  plateNo: string;
  vehicleDesc: string;
  riskLevel: string;
  status: string;
  source: string;
  expiresAt: string;
}

export interface ControlVehiclePayload {
  plateNo: string;
  vehicleDesc: string;
  vehicleType?: string;
  riskLevel: string;
  expiresAt: string;
  remark?: string;
}

export interface ControlStatusResult {
  controlId: string;
  status: string;
  message: string;
}

export interface PatrolMessage {
  messageId: string;
  title: string;
  content: string;
  targetType: string;
  targetName: string;
  channel: string;
  status: string;
  readCount: number;
  totalCount: number;
  sentAt: string;
}

export interface MessageSendPayload {
  targetId: string;
  targetType: string;
  title?: string;
  content: string;
}

export interface MessageResult {
  messageId: string;
  targetId: string;
  status: string;
  sentAt: string;
}

export interface StatisticsTrendItem {
  date: string;
  alerts: number;
  sos: number;
  media: number;
  dispatchSessions: number;
}

export interface StatisticsRankingItem {
  name: string;
  value: number;
  note: string;
}

export interface StatisticsOverview {
  metrics: PatrolMetric[];
  alertTrend: StatisticsTrendItem[];
  deviceRiskRanking: StatisticsRankingItem[];
  dispositionStats: StatisticsRankingItem[];
}

export interface SystemAuditLog {
  logId: string;
  logType: string;
  operatorName: string;
  action: string;
  resource: string;
  result: string;
  ipAddress: string;
  traceId: string;
  occurredAt: string;
}

export interface SystemCapability {
  database: string[];
  storage: string;
  cache: string;
  map: string;
  videoLayouts: number[];
  algorithm: string;
  policeCallIntegration: string;
}
