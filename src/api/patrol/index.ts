import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  AppVersion,
  AppVersionPackage,
  AppVersionPayload,
  ControlPerson,
  ControlPersonFaceImage,
  ControlPersonPayload,
  ControlImportResult,
  ControlStatusResult,
  ControlVehicle,
  ControlVehiclePayload,
  DashboardSummary,
  DeviceAdvancedSettings,
  DeviceConfig,
  DeviceControlResult,
  DeviceWifiState,
  DispatchAction,
  DispatchChannel,
  DispatchSession,
  FirmwarePackage,
  FirmwareUpgradeTask,
  FirmwareVersion,
  FirmwareVersionPayload,
  IntercomSession,
  IntercomSignal,
  MessageResult,
  MessageSendPayload,
  OfficerLocation,
  OfficerTrackPoint,
  PatrolArea,
  PatrolAlert,
  PatrolAlertDisposition,
  PatrolDailyReport,
  PatrolDevice,
  PatrolDeviceCommand,
  PatrolDeviceEvent,
  PatrolMedia,
  PatrolMediaAction,
  PatrolCleanupResult,
  PatrolMediaUploadTask,
  PatrolMessage,
  PatrolMessageReceipt,
  PatrolSos,
  PatrolSosAction,
  PatrolSosTimeline,
  StatisticsOverview,
  SystemAuditLog,
  SystemCapability
} from './types';

export const getPatrolDashboard = (): AxiosPromise<DashboardSummary> => {
  return request({
    url: '/patrol/dashboard/summary',
    method: 'get'
  });
};

export const listPatrolDevices = (): AxiosPromise<PatrolDevice[]> => {
  return request({
    url: '/patrol/devices',
    method: 'get'
  });
};

export const listDeviceConfigs = (): AxiosPromise<DeviceConfig[]> => {
  return request({
    url: '/patrol/devices/configs',
    method: 'get'
  });
};

export const getDeviceConfig = (deviceId: string): AxiosPromise<DeviceConfig> => {
  return request({
    url: `/patrol/devices/${deviceId}/config`,
    method: 'get'
  });
};

export const configureDeviceWifi = (deviceId: string, data: DeviceWifiState): AxiosPromise<DeviceConfig> => {
  return request({
    url: `/patrol/devices/${deviceId}/wifi`,
    method: 'post',
    data
  });
};

export const applyDeviceSettings = (deviceId: string, data: DeviceAdvancedSettings): AxiosPromise<DeviceConfig> => {
  return request({
    url: `/patrol/devices/${deviceId}/settings`,
    method: 'post',
    data
  });
};

export const startDeviceRealtimeAudio = (deviceId: string): AxiosPromise<DeviceControlResult> => {
  return request({
    url: `/patrol/devices/${deviceId}/realtime-audio/start`,
    method: 'post'
  });
};

export const stopDeviceRealtimeAudio = (deviceId: string): AxiosPromise<DeviceControlResult> => {
  return request({
    url: `/patrol/devices/${deviceId}/realtime-audio/stop`,
    method: 'post'
  });
};

export const markDeviceMediaSyncCompleted = (deviceId: string): AxiosPromise<DeviceControlResult> => {
  return request({
    url: `/patrol/devices/${deviceId}/media-sync/completed`,
    method: 'post'
  });
};

export const sendDeviceCommand = (deviceId: string, command: string) => {
  return request({
    url: `/patrol/devices/${deviceId}/commands`,
    method: 'post',
    data: {
      command,
      operatorId: 'web-console',
      requestId: `web-${Date.now()}`
    }
  });
};

export const listDeviceCommands = (): AxiosPromise<PatrolDeviceCommand[]> => {
  return request({
    url: '/patrol/devices/commands',
    method: 'get'
  });
};

export const listDeviceEvents = (): AxiosPromise<PatrolDeviceEvent[]> => {
  return request({
    url: '/patrol/devices/events',
    method: 'get'
  });
};

export const listDispatchChannels = (): AxiosPromise<DispatchChannel[]> => {
  return request({
    url: '/patrol/dispatch/channels',
    method: 'get'
  });
};

export const createDispatchSession = (deviceId: string, mode = 'LOW_LATENCY'): AxiosPromise<DispatchSession> => {
  return request({
    url: '/patrol/dispatch/sessions',
    method: 'post',
    data: { deviceId, mode }
  });
};

export const closeDispatchSession = (sessionId: string): AxiosPromise<DispatchAction> => {
  return request({
    url: `/patrol/dispatch/sessions/${sessionId}`,
    method: 'delete'
  });
};

export const createIntercomSession = (deviceId: string, mode = 'FULL_DUPLEX'): AxiosPromise<IntercomSession> => {
  return request({
    url: '/patrol/dispatch/intercom/sessions',
    method: 'post',
    data: {
      deviceId,
      mode,
      initiatorId: 'web-console'
    }
  });
};

export const closeIntercomSession = (sessionId: string): AxiosPromise<IntercomSession> => {
  return request({
    url: `/patrol/dispatch/intercom/sessions/${sessionId}/close`,
    method: 'post'
  });
};

export const sendIntercomSignal = (sessionId: string, type: string, payload = ''): AxiosPromise<IntercomSignal> => {
  return request({
    url: `/patrol/dispatch/intercom/sessions/${sessionId}/signals`,
    method: 'post',
    data: {
      sender: 'WEB',
      type,
      payload
    }
  });
};

export const listIntercomSignals = (sessionId: string, afterSignalId = ''): AxiosPromise<IntercomSignal[]> => {
  return request({
    url: `/patrol/dispatch/intercom/sessions/${sessionId}/signals`,
    method: 'get',
    params: { afterSignalId }
  });
};

export const listOfficerLocations = (): AxiosPromise<OfficerLocation[]> => {
  return request({
    url: '/patrol/map/officers',
    method: 'get'
  });
};

export const listOfficerTrack = (badgeNo: string): AxiosPromise<OfficerTrackPoint[]> => {
  return request({
    url: `/patrol/map/officers/${badgeNo}/track`,
    method: 'get'
  });
};

export const listPatrolAreas = (): AxiosPromise<PatrolArea[]> => {
  return request({
    url: '/patrol/areas',
    method: 'get'
  });
};

export const getCurrentPatrolArea = (): AxiosPromise<PatrolArea> => {
  return request({
    url: '/patrol/areas/current',
    method: 'get'
  });
};

export const savePatrolArea = (data: PatrolArea): AxiosPromise<PatrolArea> => {
  return request({
    url: '/patrol/areas',
    method: 'post',
    data
  });
};

export const listPatrolAlerts = (): AxiosPromise<PatrolAlert[]> => {
  return request({
    url: '/patrol/alerts',
    method: 'get'
  });
};

export const acknowledgeAlert = (alertId: string) => {
  return request({
    url: `/patrol/alerts/${alertId}/ack`,
    method: 'post'
  });
};

export const closeAlert = (alertId: string, result = 'RESOLVED', note = '') => {
  return request({
    url: `/patrol/alerts/${alertId}/close`,
    method: 'post',
    data: { result, note }
  });
};

export const listAlertDispositions = (alertId: string): AxiosPromise<PatrolAlertDisposition[]> => {
  return request({
    url: `/patrol/alerts/${alertId}/dispositions`,
    method: 'get'
  });
};

export const listPatrolMedia = (): AxiosPromise<PatrolMedia[]> => {
  return request({
    url: '/patrol/media',
    method: 'get'
  });
};

export const listPatrolMediaUploadTasks = (): AxiosPromise<PatrolMediaUploadTask[]> => {
  return request({
    url: '/patrol/media/upload-tasks',
    method: 'get'
  });
};

export const cleanPatrolMediaUploadTasks = (): AxiosPromise<PatrolCleanupResult> => {
  return request({
    url: '/patrol/media/upload-tasks/cleanup',
    method: 'post'
  });
};

export const verifyPatrolMedia = (fileId: string): AxiosPromise<PatrolMediaAction> => {
  return request({
    url: `/patrol/media/${fileId}/verify`,
    method: 'post'
  });
};

export const deletePatrolMedia = (fileId: string): AxiosPromise<PatrolMediaAction> => {
  return request({
    url: `/patrol/media/${fileId}`,
    method: 'delete'
  });
};

export const listPatrolDailyReports = (params?: { missionId?: string; status?: string }): AxiosPromise<PatrolDailyReport[]> => {
  return request({
    url: '/patrol/daily-reports',
    method: 'get',
    params
  });
};

export const updatePatrolDailyReportStatus = (reportId: string, status: string): AxiosPromise<PatrolDailyReport> => {
  return request({
    url: `/patrol/daily-reports/${reportId}/status`,
    method: 'patch',
    data: { status }
  });
};

export const updatePatrolDailyReportContent = (reportId: string, content: string): AxiosPromise<PatrolDailyReport> => {
  return request({
    url: `/patrol/daily-reports/${reportId}/content`,
    method: 'patch',
    data: { content }
  });
};

export const downloadPatrolMedia = (fileId: string) => {
  return request({
    url: `/files/${fileId}/download`,
    method: 'get',
    responseType: 'blob'
  });
};

export const listAppVersions = (): AxiosPromise<AppVersion[]> => {
  return request({
    url: '/patrol/versions',
    method: 'get'
  });
};

export const createAppVersion = (data: AppVersionPayload): AxiosPromise<AppVersion> => {
  return request({
    url: '/patrol/versions',
    method: 'post',
    data
  });
};

export const uploadAppVersionPackage = (file: File): AxiosPromise<AppVersionPackage> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: '/patrol/versions/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateAppVersionStatus = (versionId: string, status: string): AxiosPromise<AppVersion> => {
  return request({
    url: `/patrol/versions/${versionId}/status`,
    method: 'patch',
    data: { status }
  });
};

export const listFirmwareVersions = (): AxiosPromise<FirmwareVersion[]> => {
  return request({
    url: '/patrol/firmware-versions',
    method: 'get'
  });
};

export const createFirmwareVersion = (data: FirmwareVersionPayload): AxiosPromise<FirmwareVersion> => {
  return request({
    url: '/patrol/firmware-versions',
    method: 'post',
    data
  });
};

export const uploadFirmwarePackage = (file: File): AxiosPromise<FirmwarePackage> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: '/patrol/firmware-versions/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateFirmwareVersionStatus = (firmwareId: string, status: string): AxiosPromise<FirmwareVersion> => {
  return request({
    url: `/patrol/firmware-versions/${firmwareId}/status`,
    method: 'patch',
    data: { status }
  });
};

export const listFirmwareUpgradeTasks = (): AxiosPromise<FirmwareUpgradeTask[]> => {
  return request({
    url: '/patrol/firmware-upgrade-tasks',
    method: 'get'
  });
};

export const listPatrolSos = (): AxiosPromise<PatrolSos[]> => {
  return request({
    url: '/patrol/sos',
    method: 'get'
  });
};

export const listPatrolSosTimeline = (sosId: string): AxiosPromise<PatrolSosTimeline[]> => {
  return request({
    url: `/patrol/sos/${sosId}/timeline`,
    method: 'get'
  });
};

export const assignPatrolSosBackup = (
  sosId: string,
  data: { contactName: string; contactPhone: string; backupEtaMinutes: number; note: string }
): AxiosPromise<PatrolSosAction> => {
  return request({
    url: `/patrol/sos/${sosId}/backup`,
    method: 'post',
    data
  });
};

export const addPatrolSosRecording = (sosId: string, data: { fileId: string; fileName: string; note: string }): AxiosPromise<PatrolSosAction> => {
  return request({
    url: `/patrol/sos/${sosId}/recordings`,
    method: 'post',
    data
  });
};

export const notifyPatrolSosContact = (
  sosId: string,
  data: { contactName: string; contactPhone: string; note: string }
): AxiosPromise<PatrolSosAction> => {
  return request({
    url: `/patrol/sos/${sosId}/notify`,
    method: 'post',
    data
  });
};

export const addPatrolSosNote = (sosId: string, note: string): AxiosPromise<PatrolSosAction> => {
  return request({
    url: `/patrol/sos/${sosId}/notes`,
    method: 'post',
    data: { note }
  });
};

export const closePatrolSos = (sosId: string): AxiosPromise<PatrolSosAction> => {
  return request({
    url: `/patrol/sos/${sosId}/close`,
    method: 'post'
  });
};

export const listControlPersons = (): AxiosPromise<ControlPerson[]> => {
  return request({
    url: '/patrol/control/persons',
    method: 'get'
  });
};

export const createControlPerson = (data: ControlPersonPayload): AxiosPromise<ControlPerson> => {
  return request({
    url: '/patrol/control/persons',
    method: 'post',
    data
  });
};

export const updateControlPersonStatus = (controlId: string, status: string): AxiosPromise<ControlStatusResult> => {
  return request({
    url: `/patrol/control/persons/${controlId}/status`,
    method: 'patch',
    data: { status }
  });
};

export const updateControlPersonFaceImage = (
  controlId: string,
  data: { faceImageUrl: string; faceImageSha256?: string }
): AxiosPromise<ControlPerson> => {
  return request({
    url: `/patrol/control/persons/${controlId}/face-image`,
    method: 'patch',
    data
  });
};

export const uploadControlPersonFaceImage = (controlId: string, file: File): AxiosPromise<ControlPersonFaceImage> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: `/patrol/control/persons/${controlId}/face-image/upload`,
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const importControlPersons = (file: File): AxiosPromise<ControlImportResult> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: '/patrol/control/persons/import',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const listControlVehicles = (): AxiosPromise<ControlVehicle[]> => {
  return request({
    url: '/patrol/control/vehicles',
    method: 'get'
  });
};

export const createControlVehicle = (data: ControlVehiclePayload): AxiosPromise<ControlVehicle> => {
  return request({
    url: '/patrol/control/vehicles',
    method: 'post',
    data
  });
};

export const updateControlVehicleStatus = (controlId: string, status: string): AxiosPromise<ControlStatusResult> => {
  return request({
    url: `/patrol/control/vehicles/${controlId}/status`,
    method: 'patch',
    data: { status }
  });
};

export const importControlVehicles = (file: File): AxiosPromise<ControlImportResult> => {
  const data = new FormData();
  data.append('file', file);
  return request({
    url: '/patrol/control/vehicles/import',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const listPatrolMessages = (): AxiosPromise<PatrolMessage[]> => {
  return request({
    url: '/patrol/messages',
    method: 'get'
  });
};

export const listPatrolMessageReceipts = (messageId: string): AxiosPromise<PatrolMessageReceipt[]> => {
  return request({
    url: `/patrol/messages/${messageId}/receipts`,
    method: 'get'
  });
};

export const sendPatrolMessage = (data: MessageSendPayload): AxiosPromise<MessageResult> => {
  return request({
    url: '/patrol/messages/send',
    method: 'post',
    data
  });
};

export const getStatisticsOverview = (): AxiosPromise<StatisticsOverview> => {
  return request({
    url: '/patrol/statistics/overview',
    method: 'get'
  });
};

export const listSystemAuditLogs = (): AxiosPromise<SystemAuditLog[]> => {
  return request({
    url: '/patrol/system/audit-logs',
    method: 'get'
  });
};

export const getSystemCapabilities = (): AxiosPromise<SystemCapability> => {
  return request({
    url: '/patrol/system/capabilities',
    method: 'get'
  });
};
