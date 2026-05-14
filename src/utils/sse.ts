import { getToken } from '@/utils/auth';
import { ElNotification } from 'element-plus';
import { useNoticeStore } from '@/store/modules/notice';

export const PATROL_REALTIME_EVENT = 'patrol:realtime';

export interface PatrolRealtimeEvent {
  namespace: 'PATROL';
  type: string;
  module: string;
  title: string;
  summary: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

const parsePatrolEvent = (message: string): PatrolRealtimeEvent | undefined => {
  try {
    const event = JSON.parse(message) as Partial<PatrolRealtimeEvent>;
    if (event.namespace === 'PATROL' && event.type) {
      return {
        namespace: 'PATROL',
        type: event.type,
        module: event.module || '',
        title: event.title || '巡检事件',
        summary: event.summary || event.title || event.type,
        resourceId: event.resourceId,
        payload: event.payload,
        occurredAt: event.occurredAt
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
};

// 初始化
export const initSSE = (url: any) => {
  if (import.meta.env.VITE_APP_SSE === 'false') {
    return;
  }

  url = url + '?Authorization=Bearer ' + getToken() + '&clientid=' + import.meta.env.VITE_APP_CLIENT_ID;
  const { data, error } = useEventSource(url, [], {
    autoReconnect: {
      retries: 5,
      delay: 5000,
      onFailed() {
        console.log('Failed to connect after 5 retries');
      }
    }
  });

  watch(error, () => {
    console.log('SSE connection error:', error.value);
    error.value = null;
  });

  watch(data, () => {
    if (!data.value) return;
    const patrolEvent = parsePatrolEvent(data.value);
    const noticeMessage = patrolEvent ? `${patrolEvent.title}：${patrolEvent.summary}` : data.value;
    useNoticeStore().addNotice({
      message: noticeMessage,
      read: false,
      time: new Date().toLocaleString()
    });
    ElNotification({
      title: patrolEvent?.title || '消息',
      message: patrolEvent?.summary || data.value,
      type: 'success',
      duration: 3000
    });
    if (patrolEvent) {
      window.dispatchEvent(new CustomEvent(PATROL_REALTIME_EVENT, { detail: patrolEvent }));
    }
    data.value = null;
  });
};
