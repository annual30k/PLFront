import type { ModuleKey } from '@/api/patrol/types';

export const patrolModuleMeta: Record<ModuleKey, { title: string; desc: string }> = {
  dashboard: { title: '指挥工作台', desc: '聚合在线警力、设备、视频会话、预警、SOS 与媒体上传状态。' },
  dispatch: { title: '指挥调度', desc: '视频墙保留，实时对讲走 WebRTC/VoIP，App 使用系统蓝牙 Headset/SCO/A2DP 作为麦克风和扬声器。' },
  map: { title: '警力一张图', desc: '基于高德地图接入实时位置，设备最新点按 3 秒周期刷新。' },
  alerts: { title: '布控预警', desc: '接收第三方人脸比对和车牌 OCR 结果，形成预警处置闭环。' },
  devices: { title: '设备管理', desc: '管理智能执法耳机台账、绑定关系、在线状态、电量、固件和指令。' },
  media: { title: '媒体证据', desc: '管理图片、视频、音频、SOS 录音和处置附件，后续接入 MinIO。' },
  reports: { title: '日报管理', desc: '查看边缘小脑提交的执勤日报、媒体选择、结构化上下文和人工复核状态。' },
  sos: { title: 'SOS 求助', desc: '实时接收一键求助、定位、录音状态、增援 ETA 和处置结果。' },
  control: { title: '人员车辆布控', desc: '维护人员/车辆布控任务，重点人员人脸底库自动同步到边缘小脑。' },
  messages: { title: '消息通知', desc: '向警员、设备或组织发送指挥消息，并查看消息送达状态。' },
  statistics: { title: '统计分析', desc: '基于设备、预警、SOS、媒体和指令流水沉淀运行指标。' },
  audit: { title: '审计日志', desc: '记录关键指挥操作、业务资源、操作人和链路追踪信息。' },
  operations: { title: '运维监控', desc: '沉淀数据库、Redis、MinIO、流媒体和第三方接口的运行能力边界。' }
};
