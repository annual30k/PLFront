<template>
  <div class="p-2 patrol-page">
    <el-card class="mb-[12px]" shadow="never">
      <div class="page-head">
        <div>
          <div class="page-title">{{ pageTitle }}</div>
          <div class="page-desc">{{ pageDesc }}</div>
        </div>
        <el-space>
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
                <el-button size="small" icon="Microphone" :type="channel.talking ? 'success' : 'primary'" @click="handleCreateIntercom(channel.deviceId)">
                  {{ channel.talking ? '对讲中' : 'VoIP对讲' }}
                </el-button>
              </el-space>
            </div>
          </el-col>
        </el-row>
      </el-card>
      <el-dialog v-model="intercomDialogVisible" title="WebRTC/VoIP 对讲" width="620px">
        <el-descriptions v-if="activeIntercomSession" :column="1" border>
          <el-descriptions-item label="会话ID">{{ activeIntercomSession.sessionId }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ activeIntercomSession.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ intercomStatus || activeIntercomSession.state }}</el-descriptions-item>
          <el-descriptions-item label="音频路由">{{ activeIntercomSession.audioRoute }}</el-descriptions-item>
          <el-descriptions-item label="信令">{{ activeIntercomSession.signalingUrl }}</el-descriptions-item>
          <el-descriptions-item label="ICE">{{ activeIntercomSession.iceServers.join(', ') }}</el-descriptions-item>
          <el-descriptions-item label="说明">{{ activeIntercomSession.message }}</el-descriptions-item>
        </el-descriptions>
        <div class="intercom-panel">
          <audio ref="intercomRemoteAudio" autoplay playsinline controls />
          <el-alert
            :title="intercomStatus || '等待 WebRTC 信令'"
            :type="intercomConnected ? 'success' : 'info'"
            :closable="false"
            show-icon
          />
        </div>
        <template #footer>
          <el-button :disabled="!activeIntercomSession" @click="handleRestartIntercomWebRtc">重新协商</el-button>
          <el-button type="danger" @click="handleCloseIntercom">关闭对讲</el-button>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="module === 'map'">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>警力一张图</template>
            <div class="map-panel">
              <div ref="mapContainer" class="amap-container">
                <div v-if="mapError" class="map-fallback">
                  <div>地图加载失败</div>
                  <span>{{ mapError }}</span>
                </div>
              </div>
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
              <el-table-column label="轨迹" width="80">
                <template #default="scope">
                  <el-button link type="primary" @click="handleLoadTrack(scope.row.badgeNo)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never" class="mt-[12px]">
            <template #header>轨迹回放</template>
            <el-table :data="trackPoints" border>
              <el-table-column prop="reportedAt" label="上报时间" width="170" />
              <el-table-column prop="address" label="位置" min-width="160" show-overflow-tooltip />
              <el-table-column prop="latitude" label="纬度" width="110" />
              <el-table-column prop="longitude" label="经度" width="110" />
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
              <el-button link type="info" @click="handleLoadAlertDispositions(scope.row.alertId)">流水</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" class="mt-[12px]">
        <template #header>预警处置流水</template>
        <el-table :data="alertDispositions" border>
          <el-table-column prop="occurredAt" label="处置时间" width="170" />
          <el-table-column prop="actionType" label="动作" width="90" />
          <el-table-column prop="actionResult" label="结果" width="100" />
          <el-table-column prop="operatorName" label="操作人" width="110" />
          <el-table-column prop="attachmentsCount" label="附件" width="80" />
          <el-table-column prop="note" label="说明" min-width="180" show-overflow-tooltip />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'devices'">
      <el-card shadow="never" class="mb-[12px]">
        <template #header>智能穿戴设备台账</template>
        <el-table :data="devices" border>
          <el-table-column prop="deviceId" label="设备编号" width="130" />
          <el-table-column prop="deviceName" label="设备名称" width="130" />
          <el-table-column prop="officerName" label="绑定警员" width="100" />
          <el-table-column prop="deptName" label="部门" min-width="140" />
          <el-table-column prop="onlineStatus" label="在线状态" width="100" />
          <el-table-column prop="batteryPercent" label="电量" width="90">
            <template #default="scope">
              <el-progress
                :percentage="scope.row.batteryPercent"
                :show-text="false"
                :status="scope.row.batteryPercent < 20 ? 'exception' : undefined"
              />
            </template>
          </el-table-column>
          <el-table-column prop="firmwareVersion" label="固件" width="100" />
          <el-table-column prop="storageText" label="存储" width="110" />
          <el-table-column prop="workState" label="工作状态" width="140" />
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleOpenDeviceConfig(scope.row.deviceId)">配置</el-button>
              <el-button link type="primary" @click="handleDeviceCommand(scope.row.deviceId, 'TAKE_PHOTO')">拍照</el-button>
              <el-button link type="primary" @click="handleCreateSession(scope.row.deviceId)">视频</el-button>
              <el-button link type="danger" @click="handleDeviceCommand(scope.row.deviceId, 'STOP_STREAM')">断开</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" class="mb-[12px]">
        <template #header>
          <div class="card-toolbar">
            <span>设备能力与高级配置</span>
            <el-tag v-if="selectedDeviceConfig" type="info">{{ selectedDeviceConfig.deviceId }}</el-tag>
          </div>
        </template>
        <el-empty v-if="!selectedDeviceConfig" description="请选择设备配置" />
        <template v-else>
          <el-descriptions :column="3" border class="mb-[12px]">
            <el-descriptions-item label="设备">{{ selectedDeviceConfig.deviceName }}</el-descriptions-item>
            <el-descriptions-item label="警员">{{ selectedDeviceConfig.officerName }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ selectedDeviceConfig.deptName }}</el-descriptions-item>
            <el-descriptions-item label="实时音频">{{ selectedDeviceConfig.realtimeAudioSyncing ? '同步中' : '未同步' }}</el-descriptions-item>
            <el-descriptions-item label="最近媒体同步">{{ selectedDeviceConfig.lastMediaSyncAt }}</el-descriptions-item>
            <el-descriptions-item label="Wi-Fi">{{ selectedDeviceConfig.wifi.connected ? '已连接' : '未连接' }}</el-descriptions-item>
          </el-descriptions>
          <div class="capability-list">
            <el-tag :type="selectedDeviceConfig.capabilities.supportsGlasses ? 'success' : 'info'">眼镜</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsEarphone ? 'success' : 'info'">耳机</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsWifi ? 'success' : 'info'">Wi-Fi</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsFileTransfer ? 'success' : 'info'">文件传输</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsPhoto ? 'success' : 'info'">拍照</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsVideo ? 'success' : 'info'">视频</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsAudioRecord ? 'success' : 'info'">录音</el-tag>
            <el-tag :type="selectedDeviceConfig.capabilities.supportsRealtimeAudio ? 'success' : 'info'">实时音频</el-tag>
          </div>
          <el-row :gutter="12" class="mt-[12px]">
            <el-col :xs="24" :lg="10">
              <el-form :model="deviceWifiForm" label-width="92px">
                <el-form-item label="启用Wi-Fi">
                  <el-switch v-model="deviceWifiForm.enabled" />
                </el-form-item>
                <el-form-item label="SSID">
                  <el-input v-model="deviceWifiForm.ssid" />
                </el-form-item>
                <el-form-item label="密码状态">
                  <el-switch v-model="deviceWifiForm.passwordConfigured" active-text="已配置" inactive-text="未配置" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSaveDeviceWifi">保存 Wi-Fi</el-button>
                </el-form-item>
              </el-form>
            </el-col>
            <el-col :xs="24" :lg="14">
              <el-form :model="deviceSettingsForm" label-width="96px">
                <el-row :gutter="8">
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="视频宽度">
                      <el-input-number v-model="deviceSettingsForm.videoWidth" :min="0" :step="40" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="视频高度">
                      <el-input-number v-model="deviceSettingsForm.videoHeight" :min="0" :step="40" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="帧率">
                      <el-input-number v-model="deviceSettingsForm.videoFrameRate" :min="1" :max="60" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="录制秒数">
                      <el-input-number v-model="deviceSettingsForm.recordingDurationSeconds" :min="10" :step="60" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="亮度">
                      <el-input-number v-model="deviceSettingsForm.brightnessLevel" :min="1" :max="5" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="竖屏录制">
                      <el-switch v-model="deviceSettingsForm.verticalRecording" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="增强音效">
                  <el-switch v-model="deviceSettingsForm.enhancedSound" />
                </el-form-item>
                <el-space wrap>
                  <el-button type="primary" @click="handleSaveDeviceSettings">保存高级设置</el-button>
                  <el-button @click="handleToggleRealtimeAudio">
                    {{ selectedDeviceConfig.realtimeAudioSyncing ? '停止实时音频' : '开启实时音频' }}
                  </el-button>
                  <el-button @click="handleMarkMediaSyncCompleted">标记媒体同步完成</el-button>
                </el-space>
              </el-form>
            </el-col>
          </el-row>
        </template>
      </el-card>
      <el-card shadow="never">
        <template #header>最近指令</template>
        <el-table :data="deviceCommands" border>
          <el-table-column prop="sentAt" label="下发时间" width="170" />
          <el-table-column prop="deviceId" label="设备编号" width="130" />
          <el-table-column prop="command" label="指令" width="130" />
          <el-table-column prop="operatorId" label="操作人" width="110" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="resultMessage" label="结果" min-width="220" show-overflow-tooltip />
          <el-table-column prop="ackAt" label="回执时间" width="170" />
        </el-table>
      </el-card>
      <el-card shadow="never" class="mt-[12px]">
        <template #header>设备事件日志</template>
        <el-table :data="deviceEvents" border>
          <el-table-column prop="occurredAt" label="发生时间" width="170" />
          <el-table-column prop="deviceId" label="设备编号" width="130" />
          <el-table-column prop="eventType" label="类型" width="120" />
          <el-table-column prop="eventLevel" label="级别" width="90" />
          <el-table-column prop="eventTitle" label="事件" width="150" />
          <el-table-column prop="eventDetail" label="详情" min-width="220" show-overflow-tooltip />
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
          <el-table-column prop="sha256" label="SHA-256" min-width="180" show-overflow-tooltip />
          <el-table-column prop="storagePath" label="存储位置" min-width="160" />
          <el-table-column prop="capturedAt" label="采集时间" width="170" />
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handlePreviewMedia(scope.row)">预览</el-button>
              <el-button link type="primary" @click="handleDownloadMedia(scope.row)">下载</el-button>
              <el-button link type="primary" @click="handleVerifyMedia(scope.row.fileId)">校验</el-button>
              <el-button link type="danger" @click="handleDeleteMedia(scope.row.fileId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" class="mt-[12px]">
        <template #header>
          <div class="card-toolbar">
            <span>分片上传任务</span>
            <el-button size="small" @click="handleCleanUploadTasks">清理过期任务</el-button>
          </div>
        </template>
        <el-table :data="mediaUploadTasks" border>
          <el-table-column prop="taskId" label="任务ID" width="170" show-overflow-tooltip />
          <el-table-column prop="fileName" label="文件名" min-width="170" show-overflow-tooltip />
          <el-table-column prop="mediaType" label="类型" width="90" />
          <el-table-column prop="officerName" label="警员" width="100" />
          <el-table-column prop="deviceId" label="设备" width="130" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="进度" width="160">
            <template #default="scope">
              <el-progress :percentage="Math.round((scope.row.progress || 0) * 100)" :show-text="true" />
            </template>
          </el-table-column>
          <el-table-column label="分片" width="100">
            <template #default="scope">{{ scope.row.uploadedChunks }}/{{ scope.row.totalChunks }}</template>
          </el-table-column>
          <el-table-column label="已传序号" min-width="160" show-overflow-tooltip>
            <template #default="scope">{{ (scope.row.uploadedChunkIndexes || []).join(', ') || '-' }}</template>
          </el-table-column>
          <el-table-column prop="fileId" label="媒体ID" width="150" show-overflow-tooltip />
          <el-table-column prop="errorMessage" label="失败原因" min-width="160" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column prop="completedAt" label="完成时间" width="170" />
        </el-table>
      </el-card>
      <el-dialog v-model="mediaPreview.visible" :title="mediaPreview.title" width="720px" @closed="clearMediaPreview">
        <div class="media-preview">
          <img v-if="mediaPreview.kind === 'PHOTO'" :src="mediaPreview.url" alt="media preview" />
          <audio v-else-if="mediaPreview.kind === 'AUDIO'" :src="mediaPreview.url" controls />
          <video v-else :src="mediaPreview.url" controls />
          <el-descriptions :column="1" border>
            <el-descriptions-item label="SHA-256">{{ mediaPreview.sha256 || '-' }}</el-descriptions-item>
            <el-descriptions-item label="水印令牌">{{ mediaPreview.watermarkToken || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
    </template>

    <template v-else-if="module === 'reports'">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>
              <div class="card-toolbar">
                <span>小脑日报列表</span>
                <el-select v-model="reportStatusFilter" clearable placeholder="全部状态" style="width: 160px" @change="loadData">
                  <el-option label="待复核" value="PENDING_REVIEW" />
                  <el-option label="已复核" value="REVIEWED" />
                  <el-option label="已归档" value="ARCHIVED" />
                </el-select>
              </div>
            </template>
            <el-table :data="dailyReports" border @row-click="activeDailyReport = $event">
              <el-table-column prop="generatedAt" label="生成时间" width="170" />
              <el-table-column prop="missionId" label="任务编号" min-width="180" show-overflow-tooltip />
              <el-table-column prop="officerName" label="警员" width="110" />
              <el-table-column prop="deviceId" label="小脑/设备" width="140" />
              <el-table-column prop="model" label="模型" width="150" show-overflow-tooltip />
              <el-table-column prop="backend" label="后端" width="110" />
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" @click.stop="activeDailyReport = scope.row">查看</el-button>
                  <el-button link type="success" @click.stop="handleUpdateDailyReportStatus(scope.row.reportId, 'REVIEWED')">复核</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="9">
          <el-card shadow="never">
            <template #header>报告详情</template>
            <el-empty v-if="!activeDailyReport" description="请选择一份日报" />
            <template v-else>
              <el-descriptions :column="1" border class="mb-[12px]">
                <el-descriptions-item label="日报ID">{{ activeDailyReport.reportId }}</el-descriptions-item>
                <el-descriptions-item label="任务编号">{{ activeDailyReport.missionId }}</el-descriptions-item>
                <el-descriptions-item label="警员">{{ activeDailyReport.officerName }} / {{ activeDailyReport.operatorId }}</el-descriptions-item>
                <el-descriptions-item label="状态">{{ activeDailyReport.status }}</el-descriptions-item>
                <el-descriptions-item label="提交来源">{{ activeDailyReport.submitSource }}</el-descriptions-item>
              </el-descriptions>
              <el-alert
                v-if="activeDailyReport.requiresHumanConfirmation"
                class="mb-[12px]"
                type="warning"
                title="AI 生成日报需人工复核后归档"
                :closable="false"
                show-icon
              />
              <el-input
                v-model="activeDailyReport.content"
                class="report-content-editor"
                type="textarea"
                :autosize="{ minRows: 16, maxRows: 32 }"
                resize="vertical"
                placeholder="请输入或修改日报正文"
              />
              <el-collapse class="mt-[12px]">
                <el-collapse-item title="媒体选择" name="media">
                  <pre class="json-block">{{ formatJson(activeDailyReport.mediaSelectionJson) }}</pre>
                </el-collapse-item>
                <el-collapse-item title="结构化上下文" name="context">
                  <pre class="json-block">{{ formatJson(activeDailyReport.structuredContextJson) }}</pre>
                </el-collapse-item>
              </el-collapse>
              <el-space class="mt-[12px]">
                <el-button :loading="reportContentSaving" type="success" @click="handleSaveDailyReportContent">保存正文</el-button>
                <el-button type="primary" @click="handleUpdateDailyReportStatus(activeDailyReport.reportId, 'REVIEWED')">标记已复核</el-button>
                <el-button @click="handleUpdateDailyReportStatus(activeDailyReport.reportId, 'ARCHIVED')">归档</el-button>
              </el-space>
            </template>
          </el-card>
        </el-col>
      </el-row>
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
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleLoadSosTimeline(scope.row.sosId)">流水</el-button>
              <el-button link type="primary" @click="handleAssignSosBackup(scope.row.sosId)">增援</el-button>
              <el-button link type="primary" @click="handleNotifySos(scope.row.sosId)">通知</el-button>
              <el-button link type="primary" @click="handleAddSosRecording(scope.row.sosId)">录音</el-button>
              <el-button link type="primary" @click="handleAddSosNote(scope.row.sosId)">备注</el-button>
              <el-button link type="success" @click="handleCloseSos(scope.row.sosId)">关闭</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" class="mt-[12px]">
        <template #header>处置时间线</template>
        <el-table :data="sosTimeline" border>
          <el-table-column prop="occurredAt" label="时间" width="170" />
          <el-table-column prop="actionType" label="动作" width="130" />
          <el-table-column prop="actionResult" label="结果" width="110" />
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column prop="contactName" label="联系人" width="100" />
          <el-table-column prop="contactPhone" label="电话" width="130" />
          <el-table-column prop="attachmentFileName" label="附件" width="150" show-overflow-tooltip />
          <el-table-column prop="backupEtaMinutes" label="ETA" width="80" />
          <el-table-column prop="note" label="说明" min-width="200" show-overflow-tooltip />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'control'">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-toolbar">
                <span>人员布控</span>
                <el-space>
                  <el-upload :show-file-list="false" accept=".xlsx,.xls" :http-request="handleImportControlPersons">
                    <el-button size="small" :loading="controlImportLoading">导入</el-button>
                  </el-upload>
                  <el-button type="primary" size="small" icon="Plus" @click="handleCreateControlPerson">新增人员</el-button>
                </el-space>
              </div>
            </template>
            <el-table :data="controlPersons" border>
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="category" label="类别" width="110" />
              <el-table-column prop="riskLevel" label="风险" width="90" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column label="人脸底库" width="130">
                <template #default="scope">
                  <el-space v-if="scope.row.hasFaceImage" :size="6">
                    <el-image class="face-thumb" :src="assetUrl(scope.row.faceImageUrl)" fit="cover" :preview-src-list="[assetUrl(scope.row.faceImageUrl)]" />
                    <el-tag size="small" type="success">已入库</el-tag>
                  </el-space>
                  <el-tag v-else size="small" type="info">未上传</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="source" label="来源" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" @click="handleToggleControlPerson(scope.row)">
                    {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
                  </el-button>
                  <el-upload
                    class="inline-upload"
                    :show-file-list="false"
                    accept="image/*"
                    :http-request="(options: any) => handleUploadControlPersonFace(scope.row, options)"
                  >
                    <el-button link type="primary" :loading="faceUploadLoading[scope.row.controlId]">
                      {{ scope.row.hasFaceImage ? '换照片' : '传照片' }}
                    </el-button>
                  </el-upload>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-toolbar">
                <span>车辆布控</span>
                <el-space>
                  <el-upload :show-file-list="false" accept=".xlsx,.xls" :http-request="handleImportControlVehicles">
                    <el-button size="small" :loading="controlImportLoading">导入</el-button>
                  </el-upload>
                  <el-button type="primary" size="small" icon="Plus" @click="handleCreateControlVehicle">新增车辆</el-button>
                </el-space>
              </div>
            </template>
            <el-table :data="controlVehicles" border>
              <el-table-column prop="plateNo" label="车牌" width="110" />
              <el-table-column prop="vehicleDesc" label="车辆" />
              <el-table-column prop="riskLevel" label="风险" width="90" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column prop="source" label="来源" />
              <el-table-column label="操作" width="90" fixed="right">
                <template #default="scope">
                  <el-button link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" @click="handleToggleControlVehicle(scope.row)">
                    {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-alert
        v-if="controlImportResult"
        class="mt-[12px]"
        :type="controlImportResult.failed > 0 ? 'warning' : 'success'"
        :title="controlImportResult.message"
        show-icon
        :closable="false"
      >
        <template v-if="controlImportResult.errors?.length" #default>
          <div v-for="item in controlImportResult.errors.slice(0, 5)" :key="`${item.rowNo}-${item.reason}`">
            第 {{ item.rowNo }} 行：{{ item.reason }}
          </div>
        </template>
      </el-alert>
    </template>

    <template v-else-if="module === 'messages'">
      <el-card shadow="never" class="mb-[12px]">
        <template #header>发送指挥消息</template>
        <el-form :inline="true" :model="messageForm" class="message-form">
          <el-form-item label="目标类型">
            <el-select v-model="messageForm.targetType" style="width: 120px">
              <el-option label="警员" value="SINGLE" />
              <el-option label="设备" value="DEVICE" />
              <el-option label="组织" value="ORG" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标ID">
            <el-input v-model="messageForm.targetId" style="width: 150px" />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="messageForm.title" style="width: 160px" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="messageForm.content" style="width: 360px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Promotion" @click="handleSendMessage">发送</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card shadow="never">
        <template #header>消息流水</template>
        <el-table :data="messages" border>
          <el-table-column prop="sentAt" label="发送时间" width="170" />
          <el-table-column prop="title" label="标题" width="130" />
          <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
          <el-table-column prop="targetType" label="目标类型" width="100" />
          <el-table-column prop="targetName" label="目标" width="130" />
          <el-table-column prop="channel" label="通道" width="80" />
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column label="已投递" width="90">
            <template #default="scope">{{ scope.row.deliveredCount }}/{{ scope.row.totalCount }}</template>
          </el-table-column>
          <el-table-column label="已读" width="90">
            <template #default="scope">{{ scope.row.readCount }}/{{ scope.row.totalCount }}</template>
          </el-table-column>
          <el-table-column prop="pendingCount" label="待补偿" width="90" />
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleLoadMessageReceipts(scope.row.messageId)">明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never" class="mt-[12px]">
        <template #header>投递明细</template>
        <el-table :data="messageReceipts" border>
          <el-table-column prop="recipientId" label="接收人" width="120" />
          <el-table-column prop="recipientName" label="姓名" width="110" />
          <el-table-column prop="deviceId" label="设备" width="130" />
          <el-table-column prop="deliveryStatus" label="状态" width="110" />
          <el-table-column prop="deliveredAt" label="投递时间" width="170" />
          <el-table-column prop="readAt" label="已读时间" width="170" />
          <el-table-column prop="lastPullAt" label="最近拉取" width="170" />
        </el-table>
      </el-card>
    </template>

    <template v-else-if="module === 'statistics'">
      <el-row :gutter="12" class="mb-[12px]">
        <el-col v-for="metric in statistics?.metrics || []" :key="metric.label" :xs="12" :sm="6">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-value" :class="`metric-${metric.type}`">{{ metric.value }}</div>
            <div class="metric-note">{{ metric.note }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :xs="24" :lg="14">
          <el-card shadow="never">
            <template #header>近 7 日趋势</template>
            <el-table :data="statistics?.alertTrend || []" border>
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="alerts" label="预警" />
              <el-table-column prop="sos" label="SOS" />
              <el-table-column prop="media" label="媒体" />
              <el-table-column prop="dispatchSessions" label="指令/调度" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-card shadow="never" class="mb-[12px]">
            <template #header>设备风险</template>
            <el-table :data="statistics?.deviceRiskRanking || []" border>
              <el-table-column prop="name" label="对象" />
              <el-table-column prop="value" label="数值" width="80" />
              <el-table-column prop="note" label="说明" />
            </el-table>
          </el-card>
          <el-card shadow="never">
            <template #header>处置统计</template>
            <el-table :data="statistics?.dispositionStats || []" border>
              <el-table-column prop="name" label="状态" />
              <el-table-column prop="value" label="数量" width="80" />
              <el-table-column prop="note" label="类型" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="module === 'audit'">
      <el-card shadow="never">
        <template #header>操作审计</template>
        <el-table :data="auditLogs" border>
          <el-table-column prop="occurredAt" label="时间" width="170" />
          <el-table-column prop="logType" label="类型" width="100" />
          <el-table-column prop="operatorName" label="操作人" width="110" />
          <el-table-column prop="action" label="动作" min-width="160" />
          <el-table-column prop="resource" label="资源" min-width="140" show-overflow-tooltip />
          <el-table-column prop="result" label="结果" width="90" />
          <el-table-column prop="ipAddress" label="IP" width="120" />
          <el-table-column prop="traceId" label="Trace" min-width="220" show-overflow-tooltip />
        </el-table>
      </el-card>
    </template>

    <template v-else>
      <el-row :gutter="12" class="mb-[12px]">
        <el-col :xs="24" :lg="9">
          <el-card shadow="never">
            <template #header>新增 App 版本</template>
            <el-form :model="versionForm" label-width="86px">
              <el-form-item label="版本号" required>
                <el-input-number v-model="versionForm.versionCode" :min="1" :step="1" />
              </el-form-item>
              <el-form-item label="版本名称" required>
                <el-input v-model="versionForm.versionName" placeholder="例如 1.3.0" clearable />
              </el-form-item>
              <el-form-item label="强制更新">
                <el-switch v-model="versionForm.forceUpdate" />
              </el-form-item>
              <el-form-item label="APK" required>
                <el-upload :show-file-list="false" accept=".apk" :http-request="handleUploadVersionPackage">
                  <el-button :loading="versionUploadLoading" icon="UploadFilled">上传安装包</el-button>
                </el-upload>
                <div v-if="versionForm.fileId" class="text-xs text-green-600 mt-1">安装包已上传，校验信息已自动生成</div>
                <div v-else class="text-xs text-gray-400 mt-1">请先上传 APK，下载地址和 SHA-256 将自动回填</div>
              </el-form-item>
              <el-form-item label="下载地址" required>
                <el-input v-model="versionForm.downloadUrl" disabled placeholder="上传 APK 后自动生成" />
              </el-form-item>
              <el-form-item label="SHA-256" required>
                <el-input v-model="versionForm.sha256" disabled placeholder="上传 APK 后自动计算" />
              </el-form-item>
              <el-form-item label="更新日志" required>
                <el-input v-model="versionForm.changelog" type="textarea" :rows="4" placeholder="请输入本次版本变更内容" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Upload" :disabled="!canPublishVersion" @click="handleCreateVersion">发布版本</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>App 版本包</template>
            <el-table :data="appVersions" border>
              <el-table-column prop="versionCode" label="编码" width="80" />
              <el-table-column prop="versionName" label="版本" width="110" />
              <el-table-column prop="status" label="状态" width="110" />
              <el-table-column label="强制" width="80">
                <template #default="scope">{{ scope.row.forceUpdate ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column prop="downloadUrl" label="下载地址" min-width="240" show-overflow-tooltip />
              <el-table-column prop="publishedAt" label="发布时间" width="170" />
              <el-table-column label="操作" width="110" fixed="right">
                <template #default="scope">
                  <el-button link :type="scope.row.status === 'PUBLISHED' ? 'warning' : 'success'" @click="handleToggleVersion(scope.row)">
                    {{ scope.row.status === 'PUBLISHED' ? '停用' : '发布' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="12" class="mb-[12px]">
        <el-col :xs="24" :lg="9">
          <el-card shadow="never">
            <template #header>新增设备固件</template>
            <el-form :model="firmwareForm" label-width="96px">
              <el-form-item label="设备类型" required>
                <el-select v-model="firmwareForm.deviceType" class="w-full">
                  <el-option label="眼镜" value="GLASSES" />
                  <el-option label="耳机" value="HEADSET" />
                </el-select>
              </el-form-item>
              <el-form-item label="芯片平台" required>
                <el-select v-model="firmwareForm.chipset" class="w-full">
                  <el-option label="炬芯 ACTS" value="ACTS" />
                  <el-option label="杰理 JL" value="JL" />
                  <el-option label="通用" value="" />
                </el-select>
              </el-form-item>
              <el-form-item label="厂商">
                <el-input v-model="firmwareForm.vendor" placeholder="UTE / JL / ACTIONS" clearable />
              </el-form-item>
              <el-form-item label="设备型号">
                <el-input v-model="firmwareForm.deviceModel" placeholder="为空表示不限型号" clearable />
              </el-form-item>
              <el-form-item label="硬件版本">
                <el-input v-model="firmwareForm.hardwareVersion" placeholder="为空表示不限硬件版本" clearable />
              </el-form-item>
              <el-form-item label="排序版本号" required>
                <el-input-number v-model="firmwareForm.versionCode" :min="1" :step="1" />
              </el-form-item>
              <el-form-item label="版本名称" required>
                <el-input v-model="firmwareForm.versionName" placeholder="例如 AT338V000110" clearable />
              </el-form-item>
              <el-form-item label="兼容范围">
                <div class="flex gap-2">
                  <el-input v-model="firmwareForm.minCurrentVersion" placeholder="最低当前版本" clearable />
                  <el-input v-model="firmwareForm.maxCurrentVersion" placeholder="最高当前版本" clearable />
                </div>
              </el-form-item>
              <el-form-item label="强制升级">
                <el-switch v-model="firmwareForm.forceUpdate" />
              </el-form-item>
              <el-form-item label="固件包" required>
                <el-upload :show-file-list="false" accept=".bin,.zip,.ufw" :http-request="handleUploadFirmwarePackage">
                  <el-button :loading="firmwareUploadLoading" icon="UploadFilled">上传固件包</el-button>
                </el-upload>
                <div v-if="firmwareForm.fileId" class="text-xs text-green-600 mt-1">固件包已上传，格式：{{ firmwareForm.packageFormat }}</div>
                <div v-else class="text-xs text-gray-400 mt-1">支持炬芯 bin/zip 与杰理 ufw，上传后自动回填校验信息</div>
              </el-form-item>
              <el-form-item label="SHA-256" required>
                <el-input v-model="firmwareForm.sha256" disabled placeholder="上传固件包后自动计算" />
              </el-form-item>
              <el-form-item label="更新日志" required>
                <el-input v-model="firmwareForm.changelog" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Upload" :disabled="!canPublishFirmware" @click="handleCreateFirmware">发布固件</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="15">
          <el-card shadow="never">
            <template #header>设备固件包</template>
            <el-table :data="firmwareVersions" border>
              <el-table-column prop="versionCode" label="编码" width="80" />
              <el-table-column prop="versionName" label="版本" width="150" />
              <el-table-column prop="deviceType" label="设备" width="90" />
              <el-table-column prop="chipset" label="芯片" width="90" />
              <el-table-column prop="packageFormat" label="格式" width="80" />
              <el-table-column prop="status" label="状态" width="110" />
              <el-table-column label="强制" width="80">
                <template #default="scope">{{ scope.row.forceUpdate ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column prop="downloadUrl" label="下载地址" min-width="220" show-overflow-tooltip />
              <el-table-column prop="publishedAt" label="发布时间" width="170" />
              <el-table-column label="操作" width="110" fixed="right">
                <template #default="scope">
                  <el-button link :type="scope.row.status === 'PUBLISHED' ? 'warning' : 'success'" @click="handleToggleFirmware(scope.row)">
                    {{ scope.row.status === 'PUBLISHED' ? '停用' : '发布' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never" class="mb-[12px]">
        <template #header>设备固件升级记录</template>
        <el-table :data="firmwareUpgradeTasks" border>
          <el-table-column prop="taskId" label="任务ID" min-width="180" show-overflow-tooltip />
          <el-table-column prop="deviceId" label="设备ID" min-width="150" show-overflow-tooltip />
          <el-table-column prop="fromVersion" label="原版本" width="140" />
          <el-table-column prop="toVersion" label="目标版本" width="140" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column label="进度" width="180">
            <template #default="scope">
              <el-progress :percentage="Math.round((scope.row.progress || 0) * 100)" />
            </template>
          </el-table-column>
          <el-table-column prop="errorMessage" label="失败原因" min-width="180" show-overflow-tooltip />
          <el-table-column prop="startedAt" label="开始时间" width="170" />
          <el-table-column prop="finishedAt" label="完成时间" width="170" />
        </el-table>
      </el-card>
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
  addPatrolSosNote,
  addPatrolSosRecording,
  acknowledgeAlert,
  applyDeviceSettings,
  assignPatrolSosBackup,
  cleanPatrolMediaUploadTasks,
  closeIntercomSession,
  configureDeviceWifi,
  listAlertDispositions,
  closePatrolSos,
  closeAlert,
  createAppVersion,
  createControlPerson,
  createControlVehicle,
  createDispatchSession,
  createFirmwareVersion,
  createIntercomSession,
  deletePatrolMedia,
  downloadPatrolMedia,
  getPatrolDashboard,
  getStatisticsOverview,
  getDeviceConfig,
  importControlPersons,
  importControlVehicles,
  listDeviceCommands,
  listDeviceConfigs,
  listDeviceEvents,
  listAppVersions,
  listControlPersons,
  listControlVehicles,
  listDispatchChannels,
  listFirmwareUpgradeTasks,
  listFirmwareVersions,
  listIntercomSignals,
  listOfficerLocations,
  listOfficerTrack,
  listPatrolAlerts,
  listPatrolDailyReports,
  listPatrolDevices,
  listPatrolMedia,
  listPatrolMessageReceipts,
  listPatrolMediaUploadTasks,
  listPatrolMessages,
  listPatrolSos,
  listPatrolSosTimeline,
  listSystemAuditLogs,
  markDeviceMediaSyncCompleted,
  notifyPatrolSosContact,
  sendPatrolMessage,
  sendDeviceCommand,
  sendIntercomSignal,
  startDeviceRealtimeAudio,
  stopDeviceRealtimeAudio,
  updateControlPersonStatus,
  updateAppVersionStatus,
  updateControlVehicleStatus,
  updateFirmwareVersionStatus,
  updatePatrolDailyReportContent,
  updatePatrolDailyReportStatus,
  uploadControlPersonFaceImage,
  uploadAppVersionPackage,
  uploadFirmwarePackage,
  verifyPatrolMedia
} from '@/api/patrol';
import {
  AppVersion,
  ControlPerson,
  ControlImportResult,
  ControlVehicle,
  DashboardSummary,
  DeviceAdvancedSettings,
  DeviceConfig,
  DeviceWifiState,
  DispatchChannel,
  FirmwareUpgradeTask,
  FirmwareVersion,
  IntercomSession,
  IntercomSignal,
  ModuleKey,
  OfficerLocation,
  OfficerTrackPoint,
  PatrolAlert,
  PatrolAlertDisposition,
  PatrolDailyReport,
  PatrolDevice,
  PatrolDeviceCommand,
  PatrolDeviceEvent,
  PatrolMedia,
  PatrolMediaUploadTask,
  PatrolMessage,
  PatrolMessageReceipt,
  PatrolSos,
  PatrolSosTimeline,
  StatisticsOverview,
  SystemAuditLog
} from '@/api/patrol/types';
import { loadAMap } from '@/utils/amap';
import { PATROL_REALTIME_EVENT, PatrolRealtimeEvent } from '@/utils/sse';

const props = defineProps<{ module: ModuleKey }>();

const loading = ref(false);
const wallLayout = ref(8);
const dashboard = ref<DashboardSummary>();
const devices = ref<PatrolDevice[]>([]);
const deviceConfigs = ref<DeviceConfig[]>([]);
const selectedDeviceConfig = ref<DeviceConfig>();
const deviceCommands = ref<PatrolDeviceCommand[]>([]);
const deviceEvents = ref<PatrolDeviceEvent[]>([]);
const channels = ref<DispatchChannel[]>([]);
const activeIntercomSession = ref<IntercomSession>();
const intercomDialogVisible = ref(false);
const intercomRemoteAudio = ref<HTMLAudioElement>();
const intercomStatus = ref('');
const intercomConnected = ref(false);
const officers = ref<OfficerLocation[]>([]);
const trackPoints = ref<OfficerTrackPoint[]>([]);
const alerts = ref<PatrolAlert[]>([]);
const alertDispositions = ref<PatrolAlertDisposition[]>([]);
const mediaFiles = ref<PatrolMedia[]>([]);
const mediaUploadTasks = ref<PatrolMediaUploadTask[]>([]);
const dailyReports = ref<PatrolDailyReport[]>([]);
const activeDailyReport = ref<PatrolDailyReport>();
const reportStatusFilter = ref('');
const reportContentSaving = ref(false);
const sosEvents = ref<PatrolSos[]>([]);
const sosTimeline = ref<PatrolSosTimeline[]>([]);
const controlPersons = ref<ControlPerson[]>([]);
const controlVehicles = ref<ControlVehicle[]>([]);
const controlImportResult = ref<ControlImportResult>();
const controlImportLoading = ref(false);
const faceUploadLoading = ref<Record<string, boolean>>({});
const messages = ref<PatrolMessage[]>([]);
const messageReceipts = ref<PatrolMessageReceipt[]>([]);
const statistics = ref<StatisticsOverview>();
const auditLogs = ref<SystemAuditLog[]>([]);
const appVersions = ref<AppVersion[]>([]);
const versionUploadLoading = ref(false);
const firmwareVersions = ref<FirmwareVersion[]>([]);
const firmwareUpgradeTasks = ref<FirmwareUpgradeTask[]>([]);
const firmwareUploadLoading = ref(false);
const deviceWifiForm = reactive<DeviceWifiState>({
  enabled: false,
  ssid: '',
  passwordConfigured: false,
  connected: false
});
const deviceSettingsForm = reactive<DeviceAdvancedSettings>({
  videoWidth: 240,
  videoHeight: 0,
  videoFrameRate: 16,
  recordingDurationSeconds: 86400,
  verticalRecording: true,
  enhancedSound: true,
  brightnessLevel: 2
});
const messageForm = reactive({
  targetType: 'SINGLE',
  targetId: 'POLICE_9527',
  title: '指挥消息',
  content: '请保持在线并确认当前位置。'
});
const versionForm = reactive({
  versionCode: 3,
  versionName: '1.3.0',
  forceUpdate: false,
  downloadUrl: '',
  sha256: '',
  fileId: '',
  changelog: '对接平台端版本包管理\n优化媒体上传状态同步'
});
const firmwareForm = reactive({
  deviceType: 'GLASSES',
  vendor: 'UTE',
  chipset: 'ACTS',
  deviceModel: '',
  hardwareVersion: '',
  firmwareType: 'FULL',
  versionCode: 110,
  versionName: 'AT338V000110',
  minCurrentVersion: '',
  maxCurrentVersion: '',
  forceUpdate: false,
  downloadUrl: '',
  sha256: '',
  fileId: '',
  fileSizeBytes: 0,
  packageFormat: '',
  upgradeMode: 'APP_BLE',
  grayScope: 'ALL',
  grayTargets: '',
  remark: '',
  changelog: '修复设备连接稳定性\n优化 OTA 升级流程'
});
const mapContainer = ref<HTMLDivElement>();
const mapInstance = shallowRef<any>();
const mapInfoWindow = shallowRef<any>();
const mapMarkers: any[] = [];
const mapError = ref('');
const mediaPreview = reactive({
  visible: false,
  title: '',
  kind: 'VIDEO',
  url: '',
  sha256: '',
  watermarkToken: ''
});

const pageMeta: Record<ModuleKey, { title: string; desc: string }> = {
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

const pageTitle = computed(() => pageMeta[props.module].title);
const pageDesc = computed(() => pageMeta[props.module].desc);
const hasUploadedVersionPackage = computed(() =>
  Boolean(versionForm.fileId && versionForm.downloadUrl && versionForm.sha256)
);
const canPublishVersion = computed(() =>
  Number(versionForm.versionCode) > 0 &&
  versionForm.versionName.trim().length > 0 &&
  versionForm.changelog.trim().length > 0 &&
  hasUploadedVersionPackage.value &&
  !versionUploadLoading.value
);
const hasUploadedFirmwarePackage = computed(() =>
  Boolean(firmwareForm.fileId && firmwareForm.downloadUrl && firmwareForm.sha256)
);
const canPublishFirmware = computed(() =>
  Number(firmwareForm.versionCode) > 0 &&
  firmwareForm.versionName.trim().length > 0 &&
  firmwareForm.changelog.trim().length > 0 &&
  hasUploadedFirmwarePackage.value &&
  !firmwareUploadLoading.value
);
let realtimeRefreshTimer: ReturnType<typeof setTimeout> | undefined;
let intercomPeerConnection: RTCPeerConnection | undefined;
let intercomLocalStream: MediaStream | undefined;
let intercomRemoteStream: MediaStream | undefined;
let intercomSignalTimer: ReturnType<typeof setTimeout> | undefined;
let intercomLastSignalId = '';
let intercomPendingRemoteIceCandidates: RTCIceCandidateInit[] = [];
const FALLBACK_ICE_SERVER = 'stun:stun.l.google.com:19302';

const assetUrl = (url?: string) => {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseApi = import.meta.env.VITE_APP_BASE_API || '';
  return `${baseApi}${url.startsWith('/') ? url : `/${url}`}`;
};

const realtimeRefreshModules: Record<string, ModuleKey[]> = {
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
  DAILY_REPORT_UPDATED: ['dashboard', 'reports', 'audit']
};

const shouldRefreshForRealtime = (event: PatrolRealtimeEvent) => {
  const modules = realtimeRefreshModules[event.type] || [];
  return modules.includes(props.module) || event.module === props.module;
};

const scheduleRealtimeRefresh = () => {
  if (realtimeRefreshTimer) {
    return;
  }
  realtimeRefreshTimer = setTimeout(async () => {
    realtimeRefreshTimer = undefined;
    await loadData();
  }, 300);
};

const handlePatrolRealtime = (event: Event) => {
  const detail = (event as CustomEvent<PatrolRealtimeEvent>).detail;
  if (detail?.namespace === 'PATROL' && shouldRefreshForRealtime(detail)) {
    scheduleRealtimeRefresh();
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    if (props.module === 'dashboard') {
      dashboard.value = (await getPatrolDashboard()).data;
    } else if (props.module === 'dispatch') {
      channels.value = (await listDispatchChannels()).data;
    } else if (props.module === 'map') {
      officers.value = (await listOfficerLocations()).data;
      await nextTick();
      await renderOfficerMap();
    } else if (props.module === 'alerts') {
      alerts.value = (await listPatrolAlerts()).data;
      if (alerts.value.length > 0) {
        alertDispositions.value = (await listAlertDispositions(alerts.value[0].alertId)).data;
      }
    } else if (props.module === 'devices') {
      const [devicesRes, configsRes, commandsRes, eventsRes] = await Promise.all([
        listPatrolDevices(),
        listDeviceConfigs(),
        listDeviceCommands(),
        listDeviceEvents()
      ]);
      devices.value = devicesRes.data;
      deviceConfigs.value = configsRes.data;
      deviceCommands.value = commandsRes.data;
      deviceEvents.value = eventsRes.data;
      const selected = selectedDeviceConfig.value
        ? deviceConfigs.value.find((item) => item.deviceId === selectedDeviceConfig.value?.deviceId)
        : deviceConfigs.value[0];
      if (selected) {
        applySelectedDeviceConfig(selected);
      }
    } else if (props.module === 'media') {
      const [mediaRes, uploadTasksRes] = await Promise.all([listPatrolMedia(), listPatrolMediaUploadTasks()]);
      mediaFiles.value = mediaRes.data;
      mediaUploadTasks.value = uploadTasksRes.data;
    } else if (props.module === 'reports') {
      dailyReports.value = (await listPatrolDailyReports({ status: reportStatusFilter.value })).data;
      activeDailyReport.value = activeDailyReport.value
        ? dailyReports.value.find((item) => item.reportId === activeDailyReport.value?.reportId)
        : dailyReports.value[0];
    } else if (props.module === 'sos') {
      sosEvents.value = (await listPatrolSos()).data;
      if (sosEvents.value.length > 0) {
        sosTimeline.value = (await listPatrolSosTimeline(sosEvents.value[0].sosId)).data;
      } else {
        sosTimeline.value = [];
      }
    } else if (props.module === 'control') {
      const [personsRes, vehiclesRes] = await Promise.all([listControlPersons(), listControlVehicles()]);
      controlPersons.value = personsRes.data;
      controlVehicles.value = vehiclesRes.data;
    } else if (props.module === 'messages') {
      messages.value = (await listPatrolMessages()).data;
      if (messages.value.length > 0) {
        messageReceipts.value = (await listPatrolMessageReceipts(messages.value[0].messageId)).data;
      } else {
        messageReceipts.value = [];
      }
    } else if (props.module === 'statistics') {
      statistics.value = (await getStatisticsOverview()).data;
    } else if (props.module === 'audit') {
      auditLogs.value = (await listSystemAuditLogs()).data;
    } else if (props.module === 'operations') {
      const [appVersionsRes, firmwareVersionsRes, firmwareTasksRes] = await Promise.all([
        listAppVersions(),
        listFirmwareVersions(),
        listFirmwareUpgradeTasks()
      ]);
      appVersions.value = appVersionsRes.data;
      firmwareVersions.value = firmwareVersionsRes.data;
      firmwareUpgradeTasks.value = firmwareTasksRes.data;
    }
  } finally {
    loading.value = false;
  }
};

const applySelectedDeviceConfig = (config: DeviceConfig) => {
  selectedDeviceConfig.value = config;
  Object.assign(deviceWifiForm, config.wifi);
  Object.assign(deviceSettingsForm, config.settings);
};

const handleOpenDeviceConfig = async (deviceId: string) => {
  const config = (await getDeviceConfig(deviceId)).data;
  applySelectedDeviceConfig(config);
};

const refreshSelectedDeviceConfig = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  const config = (await getDeviceConfig(selectedDeviceConfig.value.deviceId)).data;
  applySelectedDeviceConfig(config);
};

const handleSaveDeviceWifi = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  const config = (await configureDeviceWifi(selectedDeviceConfig.value.deviceId, { ...deviceWifiForm })).data;
  applySelectedDeviceConfig(config);
  ElMessage.success('设备 Wi-Fi 已保存');
  await loadData();
};

const handleSaveDeviceSettings = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  const config = (await applyDeviceSettings(selectedDeviceConfig.value.deviceId, { ...deviceSettingsForm })).data;
  applySelectedDeviceConfig(config);
  ElMessage.success('高级设置已保存');
  await loadData();
};

const handleToggleRealtimeAudio = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  const result = selectedDeviceConfig.value.realtimeAudioSyncing
    ? (await stopDeviceRealtimeAudio(selectedDeviceConfig.value.deviceId)).data
    : (await startDeviceRealtimeAudio(selectedDeviceConfig.value.deviceId)).data;
  ElMessage.success(result.message);
  await refreshSelectedDeviceConfig();
  await loadData();
};

const handleMarkMediaSyncCompleted = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  const result = (await markDeviceMediaSyncCompleted(selectedDeviceConfig.value.deviceId)).data;
  ElMessage.success(result.message);
  await refreshSelectedDeviceConfig();
  await loadData();
};

const handleDeviceCommand = async (deviceId: string, command: string) => {
  await sendDeviceCommand(deviceId, command);
  ElMessage.success('设备指令已下发');
  if (props.module === 'devices') {
    await loadData();
  }
};

const handleUpdateDailyReportStatus = async (reportId: string, status: string) => {
  activeDailyReport.value = (await updatePatrolDailyReportStatus(reportId, status)).data;
  ElMessage.success(status === 'ARCHIVED' ? '日报已归档' : '日报已标记复核');
  await loadData();
};

const handleSaveDailyReportContent = async () => {
  if (!activeDailyReport.value) {
    return;
  }
  reportContentSaving.value = true;
  try {
    activeDailyReport.value = (await updatePatrolDailyReportContent(activeDailyReport.value.reportId, activeDailyReport.value.content || '')).data;
    ElMessage.success('日报正文已保存');
    await loadData();
  } finally {
    reportContentSaving.value = false;
  }
};

const formatJson = (value?: string) => {
  if (!value) {
    return '{}';
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const handleCreateSession = async (deviceId: string) => {
  await createDispatchSession(deviceId);
  ElMessage.success('调度会话已创建');
};

const handleCreateIntercom = async (deviceId: string) => {
  await cleanupIntercomWebRtc(false);
  try {
    activeIntercomSession.value = (await createIntercomSession(deviceId)).data;
    intercomDialogVisible.value = true;
    await nextTick();
    await startIntercomWebRtc(true);
    ElMessage.success('WebRTC 对讲会话已创建，已开始媒体协商');
    await loadData();
  } catch (error) {
    const sessionId = activeIntercomSession.value?.sessionId;
    await cleanupIntercomWebRtc(false);
    if (sessionId) {
      await closeIntercomSession(sessionId).catch(() => undefined);
    }
    activeIntercomSession.value = undefined;
    intercomDialogVisible.value = false;
    intercomStatus.value = '';
    ElMessage.error(`WebRTC 对讲启动失败：${toErrorMessage(error)}`);
    await loadData();
  }
};

const handleRestartIntercomWebRtc = async () => {
  if (!activeIntercomSession.value) {
    return;
  }
  await cleanupIntercomWebRtc(false);
  try {
    await startIntercomWebRtc(false);
    ElMessage.success('WebRTC 已重新协商');
  } catch (error) {
    await cleanupIntercomWebRtc(false);
    ElMessage.error(`WebRTC 重新协商失败：${toErrorMessage(error)}`);
  }
};

const handleCloseIntercom = async () => {
  if (!activeIntercomSession.value) {
    return;
  }
  await cleanupIntercomWebRtc(true);
  activeIntercomSession.value = (await closeIntercomSession(activeIntercomSession.value.sessionId)).data;
  intercomDialogVisible.value = false;
  ElMessage.success('对讲会话已关闭');
  await loadData();
};

const startIntercomWebRtc = async (resetSignalCursor: boolean) => {
  const session = activeIntercomSession.value;
  if (!session) {
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    intercomStatus.value = '当前浏览器不支持麦克风采集';
    throw new Error('当前浏览器不支持麦克风采集');
  }
  intercomStatus.value = '正在打开麦克风';
  intercomConnected.value = false;
  intercomPendingRemoteIceCandidates = [];
  if (resetSignalCursor) {
    intercomLastSignalId = '';
  }
  intercomLocalStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: false
  });
  intercomRemoteStream = new MediaStream();
  if (intercomRemoteAudio.value) {
    intercomRemoteAudio.value.srcObject = intercomRemoteStream;
  }

  const peerConnection = new RTCPeerConnection({ iceServers: toRtcIceServers(session.iceServers) });
  intercomPeerConnection = peerConnection;
  peerConnection.onconnectionstatechange = () => {
    intercomConnected.value = peerConnection.connectionState === 'connected';
    intercomStatus.value = `WebRTC ${peerConnection.connectionState}`;
  };
  peerConnection.oniceconnectionstatechange = () => {
    intercomStatus.value = `ICE ${peerConnection.iceConnectionState}`;
  };
  peerConnection.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => intercomRemoteStream?.addTrack(track));
    intercomRemoteAudio.value?.play().catch(() => undefined);
  };
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate && activeIntercomSession.value?.sessionId === session.sessionId) {
      await sendIntercomSignal(session.sessionId, 'ice', JSON.stringify(event.candidate.toJSON()));
    }
  };
  intercomLocalStream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, intercomLocalStream as MediaStream));
  const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
  await peerConnection.setLocalDescription(offer);
  await sendIntercomSignal(session.sessionId, 'offer', offer.sdp || '');
  intercomStatus.value = 'offer 已发送，等待 App answer';
  scheduleIntercomSignalPoll();
};

const scheduleIntercomSignalPoll = () => {
  if (intercomSignalTimer) {
    clearTimeout(intercomSignalTimer);
  }
  intercomSignalTimer = setTimeout(pollIntercomSignals, 700);
};

const pollIntercomSignals = async () => {
  const session = activeIntercomSession.value;
  if (!session || !intercomPeerConnection) {
    return;
  }
  try {
    const signals = (await listIntercomSignals(session.sessionId, intercomLastSignalId)).data;
    for (const signal of signals) {
      intercomLastSignalId = signal.signalId;
      if (signal.sender === 'WEB') {
        continue;
      }
      await handleIntercomSignal(signal);
    }
  } catch (error) {
    intercomStatus.value = `信令轮询失败：${toErrorMessage(error)}`;
  } finally {
    if (activeIntercomSession.value && intercomPeerConnection) {
      scheduleIntercomSignalPoll();
    }
  }
};

const handleIntercomSignal = async (signal: IntercomSignal) => {
  const peerConnection = intercomPeerConnection;
  if (!peerConnection) {
    return;
  }
  const type = signal.type.toLowerCase();
  if (type === 'answer' && signal.payload) {
    await peerConnection.setRemoteDescription({ type: 'answer', sdp: signal.payload });
    await flushIntercomPendingIceCandidates(peerConnection);
    intercomStatus.value = 'answer 已接收，音频流连接中';
  } else if (type === 'ice' && signal.payload) {
    await addIntercomRemoteIceCandidate(peerConnection, signal.payload);
  } else if (type === 'ready') {
    intercomStatus.value = 'App 已接入，等待媒体协商';
  } else if (type === 'hangup') {
    await cleanupIntercomWebRtc(false);
    intercomStatus.value = 'App 已挂断';
  }
};

const addIntercomRemoteIceCandidate = async (peerConnection: RTCPeerConnection, payload: string) => {
  const candidate = JSON.parse(payload) as RTCIceCandidateInit;
  if (!candidate.candidate) {
    return;
  }
  if (!peerConnection.remoteDescription) {
    intercomPendingRemoteIceCandidates.push(candidate);
    return;
  }
  await peerConnection.addIceCandidate(candidate);
};

const flushIntercomPendingIceCandidates = async (peerConnection: RTCPeerConnection) => {
  const candidates = intercomPendingRemoteIceCandidates;
  intercomPendingRemoteIceCandidates = [];
  for (const candidate of candidates) {
    await peerConnection.addIceCandidate(candidate);
  }
};

const cleanupIntercomWebRtc = async (sendHangup: boolean) => {
  const sessionId = activeIntercomSession.value?.sessionId;
  if (intercomSignalTimer) {
    clearTimeout(intercomSignalTimer);
    intercomSignalTimer = undefined;
  }
  if (sendHangup && sessionId) {
    await sendIntercomSignal(sessionId, 'hangup', '');
  }
  intercomPeerConnection?.getSenders().forEach((sender) => sender.track?.stop());
  intercomPeerConnection?.close();
  intercomPeerConnection = undefined;
  intercomPendingRemoteIceCandidates = [];
  intercomLocalStream?.getTracks().forEach((track) => track.stop());
  intercomLocalStream = undefined;
  intercomRemoteStream?.getTracks().forEach((track) => track.stop());
  intercomRemoteStream = undefined;
  if (intercomRemoteAudio.value) {
    intercomRemoteAudio.value.srcObject = null;
  }
  intercomConnected.value = false;
};

const toRtcIceServers = (urls: string[]): RTCIceServer[] => {
  const normalized = urls
    .map((url) => url.trim())
    .filter((url) => {
      const lower = url.toLowerCase();
      if (lower.startsWith('stun:') || lower.startsWith('stuns:')) {
        return !lower.includes('.local');
      }
      // 后端当前只下发无用户名/密码的 TURN 占位地址，浏览器无法用它完成中继。
      return false;
    });
  return (normalized.length ? normalized : [FALLBACK_ICE_SERVER]).map((url) => ({ urls: url }));
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return '麦克风权限被拒绝';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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

const handleLoadAlertDispositions = async (alertId: string) => {
  alertDispositions.value = (await listAlertDispositions(alertId)).data;
};

const handleSendMessage = async () => {
  await sendPatrolMessage({ ...messageForm });
  ElMessage.success('指挥消息已发送');
  await loadData();
};

const handleLoadMessageReceipts = async (messageId: string) => {
  messageReceipts.value = (await listPatrolMessageReceipts(messageId)).data;
};

const handleLoadTrack = async (badgeNo: string) => {
  trackPoints.value = (await listOfficerTrack(badgeNo)).data;
  ElMessage.success('轨迹已加载');
};

const handleVerifyMedia = async (fileId: string) => {
  const result = (await verifyPatrolMedia(fileId)).data;
  ElMessage.success(result.message);
  await loadData();
};

const handlePreviewMedia = async (row: PatrolMedia) => {
  clearMediaPreview();
  const blob = (await downloadPatrolMedia(row.fileId)) as unknown as Blob;
  mediaPreview.visible = true;
  mediaPreview.title = row.fileName;
  mediaPreview.kind = row.mediaType;
  mediaPreview.url = URL.createObjectURL(blob);
  mediaPreview.sha256 = row.sha256 || '';
  mediaPreview.watermarkToken = row.watermarkToken || '';
};

const handleDownloadMedia = async (row: PatrolMedia) => {
  const blob = (await downloadPatrolMedia(row.fileId)) as unknown as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = row.fileName || `${row.fileId}.bin`;
  link.click();
  URL.revokeObjectURL(url);
};

const handleDeleteMedia = async (fileId: string) => {
  const result = (await deletePatrolMedia(fileId)).data;
  if (result.status === 'DELETED') {
    ElMessage.success(result.message);
  } else {
    ElMessage.warning(result.message);
  }
  await loadData();
};

const handleCleanUploadTasks = async () => {
  const result = (await cleanPatrolMediaUploadTasks()).data;
  ElMessage.success(`${result.message}：${result.cleaned}`);
  await loadData();
};

const handleLoadSosTimeline = async (sosId: string) => {
  sosTimeline.value = (await listPatrolSosTimeline(sosId)).data;
};

const handleAssignSosBackup = async (sosId: string) => {
  const result = (
    await assignPatrolSosBackup(sosId, {
      contactName: '巡逻组 A-42',
      contactPhone: '110-PTL-A42',
      backupEtaMinutes: 5,
      note: '已指派最近警力前往增援'
    })
  ).data;
  ElMessage.success(result.message);
  await handleLoadSosTimeline(sosId);
  await loadData();
};

const handleNotifySos = async (sosId: string) => {
  const result = (
    await notifyPatrolSosContact(sosId, {
      contactName: '值班指挥员',
      contactPhone: '0591-110000',
      note: '已同步SOS位置和现场状态'
    })
  ).data;
  ElMessage.success(result.message);
  await handleLoadSosTimeline(sosId);
};

const handleAddSosRecording = async (sosId: string) => {
  const result = (
    await addPatrolSosRecording(sosId, {
      fileId: `SOS-AUD-${Date.now()}`,
      fileName: 'SOS现场录音.m4a',
      note: '已关联端侧SOS录音附件'
    })
  ).data;
  ElMessage.success(result.message);
  await handleLoadSosTimeline(sosId);
};

const handleAddSosNote = async (sosId: string) => {
  const result = (await addPatrolSosNote(sosId, '平台端补充处置记录')).data;
  ElMessage.success(result.message);
  await handleLoadSosTimeline(sosId);
};

const handleCloseSos = async (sosId: string) => {
  const result = (await closePatrolSos(sosId)).data;
  if (result.status === 'CLOSED') {
    ElMessage.success(result.message);
  } else {
    ElMessage.warning(result.message);
  }
  await handleLoadSosTimeline(sosId);
  await loadData();
};

const handleControlImportResult = async (result: ControlImportResult) => {
  controlImportResult.value = result;
  if (result.failed > 0) {
    ElMessage.warning(result.message);
  } else {
    ElMessage.success(result.message);
  }
  await loadData();
};

const handleImportControlPersons = async (options: any) => {
  controlImportLoading.value = true;
  try {
    const result = (await importControlPersons(options.file)).data;
    await handleControlImportResult(result);
  } finally {
    controlImportLoading.value = false;
  }
};

const handleImportControlVehicles = async (options: any) => {
  controlImportLoading.value = true;
  try {
    const result = (await importControlVehicles(options.file)).data;
    await handleControlImportResult(result);
  } finally {
    controlImportLoading.value = false;
  }
};

const handleCreateControlPerson = async () => {
  await createControlPerson({
    name: `临控人员${Date.now().toString().slice(-4)}`,
    category: '临控人员',
    riskLevel: 'MEDIUM',
    expiresAt: '2026-06-30',
    remark: '平台端新增验证'
  });
  ElMessage.success('人员布控已新增');
  await loadData();
};

const handleToggleControlPerson = async (row: ControlPerson) => {
  const status = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  const result = (await updateControlPersonStatus(row.controlId, status)).data;
  ElMessage.success(result.message);
  await loadData();
};

const handleUploadControlPersonFace = async (row: ControlPerson, options: any) => {
  faceUploadLoading.value[row.controlId] = true;
  try {
    await uploadControlPersonFaceImage(row.controlId, options.file);
    ElMessage.success('人脸底库照片已上传，下一轮小脑同步会自动下发');
    await loadData();
  } finally {
    faceUploadLoading.value[row.controlId] = false;
  }
};

const handleCreateControlVehicle = async () => {
  await createControlVehicle({
    plateNo: `闽A${Date.now().toString().slice(-5)}`,
    vehicleDesc: '平台端新增车辆',
    vehicleType: 'SEDAN',
    riskLevel: 'MEDIUM',
    expiresAt: '2026-06-30',
    remark: '平台端新增验证'
  });
  ElMessage.success('车辆布控已新增');
  await loadData();
};

const handleToggleControlVehicle = async (row: ControlVehicle) => {
  const status = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  const result = (await updateControlVehicleStatus(row.controlId, status)).data;
  ElMessage.success(result.message);
  await loadData();
};

const validateVersionForm = () => {
  if (!versionForm.versionCode || versionForm.versionCode < 1) {
    ElMessage.warning('请填写有效的版本号');
    return false;
  }
  if (!versionForm.versionName.trim()) {
    ElMessage.warning('请填写版本名称');
    return false;
  }
  if (!versionForm.changelog.trim()) {
    ElMessage.warning('请填写更新日志');
    return false;
  }
  if (!hasUploadedVersionPackage.value) {
    ElMessage.warning('请先上传 APK 安装包，系统会自动生成下载地址和 SHA-256');
    return false;
  }
  return true;
};

const handleCreateVersion = async () => {
  if (!validateVersionForm()) {
    return;
  }
  await createAppVersion({
    ...versionForm,
    versionName: versionForm.versionName.trim(),
    changelog: versionForm.changelog.trim()
  });
  ElMessage.success('App 版本已发布');
  await loadData();
};

const handleUploadVersionPackage = async (options: any) => {
  const file = options.file as File;
  if (!file.name.toLowerCase().endsWith('.apk')) {
    ElMessage.warning('请上传 APK 安装包');
    options.onError?.(new Error('invalid apk package'));
    return;
  }
  versionUploadLoading.value = true;
  versionForm.downloadUrl = '';
  versionForm.sha256 = '';
  versionForm.fileId = '';
  try {
    const result = (await uploadAppVersionPackage(file)).data;
    versionForm.downloadUrl = result.downloadUrl;
    versionForm.sha256 = result.sha256;
    versionForm.fileId = result.fileId;
    if (!versionForm.versionName || versionForm.versionName === '1.3.0') {
      versionForm.versionName = file.name.replace(/\\.apk$/i, '');
    }
    ElMessage.success(`安装包已上传：${result.sizeText}`);
    options.onSuccess?.(result);
  } catch (error) {
    options.onError?.(error);
    throw error;
  } finally {
    versionUploadLoading.value = false;
  }
};

const handleToggleVersion = async (row: AppVersion) => {
  await updateAppVersionStatus(row.versionId, row.status === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED');
  ElMessage.success('版本状态已更新');
  await loadData();
};

const validateFirmwareForm = () => {
  if (!firmwareForm.versionCode || firmwareForm.versionCode < 1) {
    ElMessage.warning('请填写有效的固件排序版本号');
    return false;
  }
  if (!firmwareForm.versionName.trim()) {
    ElMessage.warning('请填写固件版本名称');
    return false;
  }
  if (!firmwareForm.changelog.trim()) {
    ElMessage.warning('请填写固件更新日志');
    return false;
  }
  if (!hasUploadedFirmwarePackage.value) {
    ElMessage.warning('请先上传固件包，系统会自动生成下载地址和 SHA-256');
    return false;
  }
  return true;
};

const handleCreateFirmware = async () => {
  if (!validateFirmwareForm()) {
    return;
  }
  await createFirmwareVersion({
    ...firmwareForm,
    versionName: firmwareForm.versionName.trim(),
    changelog: firmwareForm.changelog.trim()
  });
  ElMessage.success('设备固件版本已发布');
  await loadData();
};

const handleUploadFirmwarePackage = async (options: any) => {
  const file = options.file as File;
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.bin') && !lower.endsWith('.zip') && !lower.endsWith('.ufw')) {
    ElMessage.warning('请上传 bin、zip 或 ufw 固件包');
    options.onError?.(new Error('invalid firmware package'));
    return;
  }
  firmwareUploadLoading.value = true;
  firmwareForm.downloadUrl = '';
  firmwareForm.sha256 = '';
  firmwareForm.fileId = '';
  try {
    const result = (await uploadFirmwarePackage(file)).data;
    firmwareForm.downloadUrl = result.downloadUrl;
    firmwareForm.sha256 = result.sha256;
    firmwareForm.fileId = result.fileId;
    firmwareForm.fileSizeBytes = result.fileSizeBytes;
    firmwareForm.packageFormat = result.packageFormat;
    if (!firmwareForm.versionName || firmwareForm.versionName === 'AT338V000110') {
      firmwareForm.versionName = file.name.replace(/\.(bin|zip|ufw)$/i, '');
    }
    ElMessage.success(`固件包已上传：${result.sizeText}`);
    options.onSuccess?.(result);
  } catch (error) {
    options.onError?.(error);
    throw error;
  } finally {
    firmwareUploadLoading.value = false;
  }
};

const handleToggleFirmware = async (row: FirmwareVersion) => {
  await updateFirmwareVersionStatus(row.firmwareId, row.status === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED');
  ElMessage.success('固件状态已更新');
  await loadData();
};

const renderOfficerMap = async () => {
  if (props.module !== 'map' || !mapContainer.value) {
    return;
  }
  try {
    mapError.value = '';
    const AMap = await loadAMap();
    if (!mapInstance.value) {
      mapInstance.value = new AMap.Map(mapContainer.value, {
        center: [119.30655, 26.1002],
        zoom: 15,
        viewMode: '2D',
        resizeEnable: true
      });
      mapInstance.value.addControl(new AMap.Scale());
      mapInstance.value.addControl(new AMap.ToolBar({ position: { top: '12px', right: '12px' } }));
      mapInfoWindow.value = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -28) });
    }

    clearMapMarkers();
    const points = officers.value
      .map((officer) => ({
        officer,
        longitude: Number(officer.longitude),
        latitude: Number(officer.latitude)
      }))
      .filter((item) => Number.isFinite(item.longitude) && Number.isFinite(item.latitude));

    points.forEach(({ officer, longitude, latitude }) => {
      const marker = new AMap.Marker({
        position: [longitude, latitude],
        title: `${officer.officerName} · ${officer.deviceId}`,
        anchor: 'bottom-center'
      });
      marker.setLabel({
        direction: 'top',
        offset: new AMap.Pixel(0, -6),
        content: `<div class="amap-officer-label">${escapeHtml(officer.officerName)} · ${escapeHtml(officer.onlineStatus)}</div>`
      });
      marker.on('click', () => {
        mapInfoWindow.value?.setContent(`
          <div class="amap-officer-window">
            <strong>${escapeHtml(officer.officerName)}</strong>
            <span>${escapeHtml(officer.deviceId)} · ${escapeHtml(officer.address)}</span>
            <span>电量 ${officer.batteryPercent}% · ${escapeHtml(officer.reportedAt)}</span>
          </div>
        `);
        mapInfoWindow.value?.open(mapInstance.value, [longitude, latitude]);
      });
      marker.setMap(mapInstance.value);
      mapMarkers.push(marker);
    });

    if (mapMarkers.length) {
      mapInstance.value.setFitView(mapMarkers, false, [64, 48, 64, 48]);
    }
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '高德地图 SDK 初始化异常';
  }
};

const clearMapMarkers = () => {
  while (mapMarkers.length) {
    mapMarkers.pop()?.setMap(null);
  }
};

const clearMediaPreview = () => {
  if (mediaPreview.url) {
    URL.revokeObjectURL(mediaPreview.url);
  }
  mediaPreview.url = '';
  mediaPreview.title = '';
  mediaPreview.sha256 = '';
  mediaPreview.watermarkToken = '';
};

const escapeHtml = (value: unknown) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

watch(() => props.module, loadData);
onMounted(() => {
  window.addEventListener(PATROL_REALTIME_EVENT, handlePatrolRealtime);
  loadData();
});
onBeforeUnmount(() => {
  window.removeEventListener(PATROL_REALTIME_EVENT, handlePatrolRealtime);
  if (realtimeRefreshTimer) {
    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = undefined;
  }
  clearMapMarkers();
  clearMediaPreview();
  void cleanupIntercomWebRtc(false);
  mapInstance.value?.destroy?.();
});
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

.capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.face-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #f3f4f6;
}

.inline-upload {
  display: inline-flex;
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
  background: #eef2f7;
}

.amap-container {
  position: absolute;
  inset: 0;
}

.map-fallback {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.map-fallback span {
  max-width: 420px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.media-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-preview img,
.media-preview video {
  width: 100%;
  max-height: 420px;
  border-radius: 6px;
  background: #111827;
  object-fit: contain;
}

.media-preview audio {
  width: 100%;
}

.report-content-editor {
  width: 100%;
}

.report-content-editor :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 24px;
  color: #111827;
}

.json-block {
  max-height: 280px;
  overflow: auto;
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: #111827;
  color: #d1d5db;
  font-size: 12px;
  line-height: 18px;
}

.intercom-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.intercom-panel audio {
  width: 100%;
}

:deep(.amap-officer-label) {
  padding: 4px 8px;
  border: 1px solid rgba(37, 99, 235, 0.22);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}

:deep(.amap-officer-window) {
  display: flex;
  min-width: 210px;
  flex-direction: column;
  gap: 4px;
  color: #374151;
  font-size: 12px;
  line-height: 18px;
}

:deep(.amap-officer-window strong) {
  color: #111827;
  font-size: 14px;
}
</style>
