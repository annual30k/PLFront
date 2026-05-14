<template>
  <div class="p-2 patrol-page">
    <el-card class="mb-[12px]" shadow="never">
      <div class="page-head">
        <div>
          <div class="page-title">{{ pageTitle }}</div>
          <div class="page-desc">{{ pageDesc }}</div>
        </div>
        <el-space>
          <el-tag type="success">试点 100 警员 / 150 设备</el-tag>
          <el-tag type="warning">视频墙 2 / 4 / 8 / 12 / 16</el-tag>
          <el-button type="primary" icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
        </el-space>
      </div>
    </el-card>

    <template v-if="module === 'dashboard'">
      <el-row :gutter="12" class="mb-[12px]">
        <el-col v-for="metric in dashboard?.metrics || []" :key="metric.label" :xs="12" :sm="8" :lg="4">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-value" :class="`metric-${metric.type}`">{{ metric.value }}</div>
            <div class="metric-note">{{ metric.note }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>实时待办</template>
            <el-table :data="dashboard?.workItems || []" border>
              <el-table-column prop="title" label="事项" min-width="140" />
              <el-table-column prop="officer" label="警员" width="100" />
              <el-table-column prop="source" label="来源" min-width="180" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column prop="timeText" label="时间" width="100" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="9">
          <el-card shadow="never">
            <template #header>平台能力边界</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="地图">{{ dashboard?.capacity.mapProvider }}</el-descriptions-item>
              <el-descriptions-item label="算法">{{ dashboard?.capacity.algorithmProvider }}</el-descriptions-item>
              <el-descriptions-item label="最大并发">{{ dashboard?.capacity.maxVideoChannels }} 路</el-descriptions-item>
              <el-descriptions-item label="布局">{{ dashboard?.capacity.videoWallLayouts }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="module === 'dispatch'">
      <el-card shadow="never">
        <template #header>
          <div class="card-toolbar">
            <span>指挥调度视频墙</span>
            <el-radio-group v-model="wallLayout" size="small">
              <el-radio-button v-for="item in [2, 4, 8, 12, 16]" :key="item" :label="item">{{ item }} 路</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <el-row :gutter="12">
          <el-col v-for="channel in channels" :key="channel.channelId" :xs="24" :sm="12" :lg="6">
            <div class="video-tile">
              <div class="video-state">
                <el-tag :type="channel.state === 'LIVE' ? 'success' : 'warning'" size="small">{{ channel.state }}</el-tag>
                <span>{{ channel.mode }} · {{ channel.latencyMs || '--' }} ms</span>
              </div>
              <div class="video-placeholder">{{ channel.channelId }}</div>
              <div class="video-meta">
                <strong>{{ channel.officerName }}</strong>
                <span>{{ channel.deviceId }} · {{ channel.locationText }}</span>
              </div>
              <el-space wrap>
                <el-button size="small" icon="VideoPlay" @click="handleCreateSession(channel.deviceId)">连线</el-button>
                <el-button size="small" icon="Camera" @click="handleDeviceCommand(channel.deviceId, 'TAKE_PHOTO')">拍照</el-button>
                <el-button size="small" icon="Microphone">{{ channel.talking ? '对讲中' : '对讲' }}</el-button>
              </el-space>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </template>

    <template v-else-if="module === 'map'">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>警力一张图</template>
            <div class="map-panel">
              <div v-for="officer in officers" :key="officer.badgeNo" class="map-point" :style="pointStyle(officer)">
                <el-tooltip :content="`${officer.officerName} · ${officer.address}`">
                  <span></span>
                </el-tooltip>
              </div>
              <div class="map-grid"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="9">
          <el-card shadow="never">
            <template #header>在线警员</template>
            <el-table :data="officers" border>
              <el-table-column prop="officerName" label="姓名" width="90" />
              <el-table-column prop="deviceId" label="设备" width="120" />
              <el-table-column prop="address" label="位置" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="module === 'alerts'">
      <el-card shadow="never">
        <template #header>布控预警处置</template>
        <el-table :data="alerts" border>
          <el-table-column prop="occurredAt" label="预警时间" width="170" />
          <el-table-column prop="alertType" label="类型" width="90" />
          <el-table-column prop="targetName" label="布控对象" width="120" />
          <el-table-column prop="officerName" label="触发警员" width="100" />
          <el-table-column prop="deviceId" label="设备编号" width="130" />
          <el-table-column prop="locationText" label="位置" min-width="150" show-overflow-tooltip />
          <el-table-column prop="confidence" label="置信度" width="90" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleAck(scope.row.alertId)">确认</el-button>
              <el-button link type="success" @click="handleClose(scope.row.alertId)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'devices'">
      <el-card shadow="never">
        <template #header>智能穿戴设备台账</template>
        <el-table :data="devices" border>
          <el-table-column prop="deviceId" label="设备编号" width="130" />
          <el-table-column prop="deviceName" label="设备名称" width="130" />
          <el-table-column prop="officerName" label="绑定警员" width="100" />
          <el-table-column prop="deptName" label="部门" min-width="140" />
          <el-table-column prop="onlineStatus" label="在线状态" width="100" />
          <el-table-column prop="batteryPercent" label="电量" width="90">
            <template #default="scope">
              <el-progress :percentage="scope.row.batteryPercent" :show-text="false" :status="scope.row.batteryPercent < 20 ? 'exception' : undefined" />
            </template>
          </el-table-column>
          <el-table-column prop="firmwareVersion" label="固件" width="100" />
          <el-table-column prop="storageText" label="存储" width="110" />
          <el-table-column prop="workState" label="工作状态" width="140" />
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleDeviceCommand(scope.row.deviceId, 'TAKE_PHOTO')">拍照</el-button>
              <el-button link type="primary" @click="handleCreateSession(scope.row.deviceId)">视频</el-button>
              <el-button link type="danger" @click="handleDeviceCommand(scope.row.deviceId, 'STOP_STREAM')">断开</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'media'">
      <el-card shadow="never">
        <template #header>媒体证据库</template>
        <el-table :data="mediaFiles" border>
          <el-table-column prop="fileName" label="文件名" min-width="180" />
          <el-table-column prop="mediaType" label="类型" width="90" />
          <el-table-column prop="officerName" label="警员" width="100" />
          <el-table-column prop="deviceId" label="设备" width="130" />
          <el-table-column prop="bizRef" label="关联事件" width="150" />
          <el-table-column prop="sizeText" label="大小" width="100" />
          <el-table-column prop="verifyStatus" label="校验" width="110" />
          <el-table-column prop="storagePath" label="存储位置" min-width="160" />
          <el-table-column prop="capturedAt" label="采集时间" width="170" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'sos'">
      <el-card shadow="never">
        <template #header>SOS 实时求助</template>
        <el-table :data="sosEvents" border>
          <el-table-column prop="createdAt" label="上报时间" width="170" />
          <el-table-column prop="officerName" label="警员" width="100" />
          <el-table-column prop="badgeNo" label="警号" width="100" />
          <el-table-column prop="deptName" label="部门" min-width="140" />
          <el-table-column prop="locationText" label="位置" min-width="180" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="disposition" label="处置" width="130" />
          <el-table-column prop="backupEtaMinutes" label="增援 ETA" width="100" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'control'">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never">
            <template #header>人员布控</template>
            <el-table :data="controlPersons" border>
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="category" label="类别" width="110" />
              <el-table-column prop="riskLevel" label="风险" width="90" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column prop="source" label="来源" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="never">
            <template #header>车辆布控</template>
            <el-table :data="controlVehicles" border>
              <el-table-column prop="plateNo" label="车牌" width="110" />
              <el-table-column prop="vehicleDesc" label="车辆" />
              <el-table-column prop="riskLevel" label="风险" width="90" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column prop="source" label="来源" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else>
      <el-card shadow="never">
        <template #header>运维能力</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="数据库">MySQL 8 / 达梦 DM8 / 人大金仓 KingbaseES V8</el-descriptions-item>
          <el-descriptions-item label="缓存">Redis + Redisson，支持单机、哨兵、集群</el-descriptions-item>
          <el-descriptions-item label="对象存储">MinIO，证据文件预签名访问</el-descriptions-item>
          <el-descriptions-item label="部署">Docker Compose 起步，生产支持多实例</el-descriptions-item>
          <el-descriptions-item label="流媒体">独立媒体节点，业务后端只管理会话和鉴权</el-descriptions-item>
          <el-descriptions-item label="第三方">人脸比对、车牌 OCR、110 接处警接口预留</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  acknowledgeAlert,
  closeAlert,
  createDispatchSession,
  getPatrolDashboard,
  listControlPersons,
  listControlVehicles,
  listDispatchChannels,
  listOfficerLocations,
  listPatrolAlerts,
  listPatrolDevices,
  listPatrolMedia,
  listPatrolSos,
  sendDeviceCommand
} from '@/api/patrol';
import {
  ControlPerson,
  ControlVehicle,
  DashboardSummary,
  DispatchChannel,
  ModuleKey,
  OfficerLocation,
  PatrolAlert,
  PatrolDevice,
  PatrolMedia,
  PatrolSos
} from '@/api/patrol/types';

const props = defineProps<{ module: ModuleKey }>();

const loading = ref(false);
const wallLayout = ref(8);
const dashboard = ref<DashboardSummary>();
const devices = ref<PatrolDevice[]>([]);
const channels = ref<DispatchChannel[]>([]);
const officers = ref<OfficerLocation[]>([]);
const alerts = ref<PatrolAlert[]>([]);
const mediaFiles = ref<PatrolMedia[]>([]);
const sosEvents = ref<PatrolSos[]>([]);
const controlPersons = ref<ControlPerson[]>([]);
const controlVehicles = ref<ControlVehicle[]>([]);

const pageMeta: Record<ModuleKey, { title: string; desc: string }> = {
  dashboard: { title: '指挥工作台', desc: '聚合在线警力、设备、视频会话、预警、SOS 与媒体上传状态。' },
  dispatch: { title: '指挥调度', desc: '支持 2/4/8/12/16 路视频墙、单点连线、截图、对讲和设备指令下发。' },
  map: { title: '警力一张图', desc: '基于高德地图接入实时位置，设备最新点按 3 秒周期刷新。' },
  alerts: { title: '布控预警', desc: '接收第三方人脸比对和车牌 OCR 结果，形成预警处置闭环。' },
  devices: { title: '设备管理', desc: '管理智能执法耳机台账、绑定关系、在线状态、电量、固件和指令。' },
  media: { title: '媒体证据', desc: '管理图片、视频、音频、SOS 录音和处置附件，后续接入 MinIO。' },
  sos: { title: 'SOS 求助', desc: '实时接收一键求助、定位、录音状态、增援 ETA 和处置结果。' },
  control: { title: '人员车辆布控', desc: '维护人员/车辆布控任务，预留本地重点库同步接口。' },
  operations: { title: '运维监控', desc: '沉淀数据库、Redis、MinIO、流媒体和第三方接口的运行能力边界。' }
};

const pageTitle = computed(() => pageMeta[props.module].title);
const pageDesc = computed(() => pageMeta[props.module].desc);

const loadData = async () => {
  loading.value = true;
  try {
    if (props.module === 'dashboard') {
      dashboard.value = (await getPatrolDashboard()).data;
    } else if (props.module === 'dispatch') {
      channels.value = (await listDispatchChannels()).data;
    } else if (props.module === 'map') {
      officers.value = (await listOfficerLocations()).data;
    } else if (props.module === 'alerts') {
      alerts.value = (await listPatrolAlerts()).data;
    } else if (props.module === 'devices') {
      devices.value = (await listPatrolDevices()).data;
    } else if (props.module === 'media') {
      mediaFiles.value = (await listPatrolMedia()).data;
    } else if (props.module === 'sos') {
      sosEvents.value = (await listPatrolSos()).data;
    } else if (props.module === 'control') {
      const [personsRes, vehiclesRes] = await Promise.all([listControlPersons(), listControlVehicles()]);
      controlPersons.value = personsRes.data;
      controlVehicles.value = vehiclesRes.data;
    }
  } finally {
    loading.value = false;
  }
};

const handleDeviceCommand = async (deviceId: string, command: string) => {
  await sendDeviceCommand(deviceId, command);
  ElMessage.success('设备指令已下发');
};

const handleCreateSession = async (deviceId: string) => {
  await createDispatchSession(deviceId);
  ElMessage.success('调度会话已创建');
};

const handleAck = async (alertId: string) => {
  await acknowledgeAlert(alertId);
  ElMessage.success('预警已确认');
  loadData();
};

const handleClose = async (alertId: string) => {
  await closeAlert(alertId, 'RESOLVED', '平台端处置闭环');
  ElMessage.success('预警已关闭');
  loadData();
};

const pointStyle = (officer: OfficerLocation) => {
  const seed = officer.badgeNo.split('').reduce((sum, item) => sum + item.charCodeAt(0), 0);
  return {
    left: `${18 + (seed % 58)}%`,
    top: `${18 + ((seed * 7) % 54)}%`
  };
};

watch(() => props.module, loadData);
onMounted(loadData);
</script>

<style lang="scss" scoped>
.patrol-page {
  color: #1f2937;
}

.page-head,
.card-toolbar,
.video-state,
.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.page-desc {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.metric-card {
  min-height: 118px;
}

.metric-label,
.metric-note {
  color: #6b7280;
  font-size: 13px;
}

.metric-value {
  margin: 12px 0 8px;
  font-size: 32px;
  font-weight: 800;
  line-height: 36px;
}

.metric-primary {
  color: #2563eb;
}

.metric-success {
  color: #059669;
}

.metric-warning {
  color: #d97706;
}

.metric-danger {
  color: #dc2626;
}

.metric-info {
  color: #4b5563;
}

.video-tile {
  min-height: 260px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 132px;
  margin: 10px 0;
  border-radius: 4px;
  background: linear-gradient(135deg, #111827, #1f2937);
  color: #93c5fd;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 22px;
  font-weight: 700;
}

.video-meta {
  margin-bottom: 10px;
  align-items: flex-start;
}

.video-meta span {
  color: #6b7280;
  font-size: 12px;
  text-align: right;
}

.map-panel {
  position: relative;
  height: 520px;
  overflow: hidden;
  border-radius: 6px;
  background:
    linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
    linear-gradient(135deg, #eef6ff, #f8fafc);
  background-size: 48px 48px, 48px 48px, 100% 100%;
}

.map-grid {
  position: absolute;
  inset: 42px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 8px;
}

.map-point {
  position: absolute;
  z-index: 2;
}

.map-point span {
  display: block;
  width: 16px;
  height: 16px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 0 7px rgba(37, 99, 235, 0.16);
}
</style>
