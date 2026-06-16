import type { ModuleKey } from '@/api/patrol/types';

export const patrolRealtimeRefreshMap: Record<string, ModuleKey[]> = {
  DEVICE_STATUS: ['dashboard', 'devices', 'statistics'],
  DEVICE_LOCATION: ['dashboard', 'map', 'devices', 'statistics'],
  DEVICE_EVENT: ['dashboard', 'devices', 'dispatch', 'media', 'audit'],
  DEVICE_COMMAND: ['dashboard', 'devices', 'dispatch', 'statistics', 'audit'],
  ALERT_UPDATED: ['dashboard', 'alerts', 'statistics', 'audit'],
  SOS_ACTIVE: ['dashboard', 'sos', 'statistics'],
  SOS_CANCELLED: ['dashboard', 'sos', 'statistics', 'audit'],
  SOS_CLOSED: ['dashboard', 'sos', 'statistics', 'audit'],
  MESSAGE_SENT: ['dashboard', 'messages', 'audit'],
  MESSAGE_READ: ['messages'],
  MEDIA_UPLOADED: ['dashboard', 'media', 'statistics', 'audit'],
  MEDIA_UPLOAD_PROGRESS: ['media'],
  MEDIA_UPLOAD_DONE: ['dashboard', 'media', 'statistics', 'audit'],
  MEDIA_UPLOAD_CANCELLED: ['media', 'audit'],
  MEDIA_UPLOAD_CLEANED: ['media', 'audit'],
  MEDIA_DELETED: ['dashboard', 'media', 'statistics', 'audit'],
  MEDIA_VERIFIED: ['media', 'audit'],
  DAILY_REPORT_UPDATED: ['dashboard', 'reports', 'audit'],
  PATROL_AREA_UPDATED: ['map', 'dashboard']
};
