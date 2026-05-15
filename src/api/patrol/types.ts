export type ModuleKey =
  | 'dashboard'
  | 'dispatch'
  | 'map'
  | 'alerts'
  | 'devices'
  | 'media'
  | 'reports'
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

export interface DeviceCapabilities {
  supportsGlasses: boolean;
  supportsEarphone: boolean;
  supportsWifi: boolean;
  supportsFileTransfer: boolean;
  supportsPhoto: boolean;
  supportsVideo: boolean;
  supportsAudioRecord: boolean;
  supportsRealtimeAudio: boolean;
}

export interface DeviceWifiState {
  enabled: boolean;
  ssid: string;
  passwordConfigured: boolean;
  connected: boolean;
}

export interface DeviceAdvancedSettings {
  videoWidth: number;
  videoHeight: number;
  videoFrameRate: number;
  recordingDurationSeconds: number;
  verticalRecording: boolean;
  enhancedSound: boolean;
  brightnessLevel: number;
}

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  officerName: string;
  badgeNo: string;
  deptName: string;
  capabilities: DeviceCapabilities;
  wifi: DeviceWifiState;
  settings: DeviceAdvancedSettings;
  realtimeAudioSyncing: boolean;
  lastMediaSyncAt: string;
}

export interface DeviceControlResult {
  success: boolean;
  state: string;
  message: string;
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

export interface IntercomSession {
  sessionId: string;
  deviceId: string;
  state: string;
  mode: string;
  signalingUrl: string;
  audioRoute: string;
  iceServers: string[];
  startedAt: number;
  expiresAt: number;
  message: string;
}

export interface IntercomSignal {
  signalId: string;
  sessionId: string;
  sender: string;
  type: string;
  payload: string;
  timestamp: number;
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

export interface PatrolDailyReport {
  reportId: string;
  missionId: string;
  reportType: string;
  deviceId: string;
  operatorId: string;
  officerName: string;
  model: string;
  backend: string;
  generatedAt: string;
  content: string;
  mediaSelectionJson: string;
  structuredContextJson: string;
  requiresHumanConfirmation: boolean;
  status: string;
  submitSource: string;
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

export interface AppVersionPackage {
  fileId: string;
  fileName: string;
  downloadUrl: string;
  sha256: string;
  fileSizeBytes: number;
  sizeText: string;
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

export interface PatrolSosTimeline {
  dispositionId: string;
  sosId: string;
  actionType: string;
  actionResult: string;
  operatorName: string;
  note: string;
  contactName?: string;
  contactPhone?: string;
  attachmentFileId?: string;
  attachmentFileName?: string;
  backupEtaMinutes?: number;
  occurredAt: string;
}

export interface ControlPerson {
  controlId: string;
  name: string;
  category: string;
  riskLevel: string;
  status: string;
  source: string;
  expiresAt: string;
  faceImageUrl?: string;
  faceImageSha256?: string;
  faceUpdatedAt?: string;
  hasFaceImage?: boolean;
}

export interface ControlPersonPayload {
  name: string;
  category: string;
  idCardNo?: string;
  riskLevel: string;
  expiresAt: string;
  remark?: string;
  faceImageUrl?: string;
  faceImageSha256?: string;
}

export interface ControlPersonFaceImage {
  controlId: string;
  faceImageUrl: string;
  faceImageSha256: string;
  faceUpdatedAt: string;
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

export interface ControlImportError {
  rowNo: number;
  reason: string;
}

export interface ControlImportResult {
  taskId: string;
  total: number;
  success: number;
  failed: number;
  message: string;
  errors: ControlImportError[];
}

export interface PatrolMessage {
  messageId: string;
  title: string;
  content: string;
  targetType: string;
  targetName: string;
  channel: string;
  status: string;
  deliveredCount: number;
  pendingCount: number;
  readCount: number;
  totalCount: number;
  sentAt: string;
}

export interface PatrolMessageReceipt {
  receiptId: string;
  messageId: string;
  recipientId: string;
  recipientName: string;
  deviceId: string;
  deliveryStatus: string;
  deliveredAt: string;
  readAt: string;
  lastPullAt: string;
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
