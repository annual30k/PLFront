import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  ControlPerson,
  ControlVehicle,
  DashboardSummary,
  DispatchChannel,
  MessageResult,
  MessageSendPayload,
  OfficerLocation,
  PatrolAlert,
  PatrolDevice,
  PatrolMedia,
  PatrolMessage,
  PatrolSos,
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

export const listDispatchChannels = (): AxiosPromise<DispatchChannel[]> => {
  return request({
    url: '/patrol/dispatch/channels',
    method: 'get'
  });
};

export const createDispatchSession = (deviceId: string, mode = 'LOW_LATENCY') => {
  return request({
    url: '/patrol/dispatch/sessions',
    method: 'post',
    data: { deviceId, mode }
  });
};

export const listOfficerLocations = (): AxiosPromise<OfficerLocation[]> => {
  return request({
    url: '/patrol/map/officers',
    method: 'get'
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

export const listPatrolMedia = (): AxiosPromise<PatrolMedia[]> => {
  return request({
    url: '/patrol/media',
    method: 'get'
  });
};

export const listPatrolSos = (): AxiosPromise<PatrolSos[]> => {
  return request({
    url: '/patrol/sos',
    method: 'get'
  });
};

export const listControlPersons = (): AxiosPromise<ControlPerson[]> => {
  return request({
    url: '/patrol/control/persons',
    method: 'get'
  });
};

export const listControlVehicles = (): AxiosPromise<ControlVehicle[]> => {
  return request({
    url: '/patrol/control/vehicles',
    method: 'get'
  });
};

export const listPatrolMessages = (): AxiosPromise<PatrolMessage[]> => {
  return request({
    url: '/patrol/messages',
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
