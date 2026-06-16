<template>
  <div class="p-2 patrol-page">
    <PatrolPageHeader :title="pageTitle" :description="pageDesc">
      <template #actions>
        <el-button type="primary" icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
      </template>
    </PatrolPageHeader>

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
              <div class="video-placeholder">
                <video
                  v-if="channel.streamUrl"
                  class="inline-live-video"
                  :src="channel.streamUrl"
                  controls
                  muted
                  playsinline
                  preload="metadata"
                />
                <div v-else class="video-standby">
                  <strong>{{ channel.channelId }}</strong>
                  <span>等待设备实时流接入</span>
                </div>
              </div>
              <div class="video-meta">
                <strong>{{ channel.officerName }}</strong>
                <span>{{ channel.deviceId }} · {{ channel.locationText }}</span>
              </div>
              <el-space wrap>
                <el-button size="small" icon="VideoPlay" @click="handleCreateSession(channel.deviceId)">连线</el-button>
                <el-button size="small" icon="Camera" @click="handleDeviceCommand(channel.deviceId, 'TAKE_PHOTO')">拍照</el-button>
                <el-button
                  size="small"
                  icon="Microphone"
                  :type="channel.talking ? 'success' : 'primary'"
                  @click="handleCreateIntercom(channel.deviceId)"
                >
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
          <el-alert :title="intercomStatus || '等待 WebRTC 信令'" :type="intercomConnected ? 'success' : 'info'" :closable="false" show-icon />
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
            <template #header>
              <div class="card-toolbar">
                <span>执勤辖区配置</span>
                <el-tag v-if="currentArea" size="small" type="success">同步到 App</el-tag>
              </div>
            </template>
            <el-form :model="areaForm" label-width="76px">
              <el-row :gutter="8">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="辖区名称">
                    <el-input v-model="areaForm.areaName" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="执勤组">
                    <el-input v-model="areaForm.teamName" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="8">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="归属">
                    <el-radio-group v-model="areaForm.ownerType">
                      <el-radio-button label="TEAM">小组</el-radio-button>
                      <el-radio-button label="USER">个人</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="组ID">
                    <el-input v-model="areaForm.teamId" placeholder="填写部门ID，组员共享该范围" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="areaForm.ownerType === 'USER'" :gutter="8">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="用户ID">
                    <el-input v-model="areaForm.userId" placeholder="个人范围优先按用户ID匹配" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="警号">
                    <el-input v-model="areaForm.badgeNo" placeholder="用户ID为空时按警号匹配" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="边界点">
                <el-input v-model="areaBoundaryText" type="textarea" :rows="5" />
              </el-form-item>
              <el-form-item label="路线点">
                <el-input v-model="areaRouteText" type="textarea" :rows="4" />
              </el-form-item>
              <el-space wrap>
                <el-button type="primary" icon="Location" @click="handleSavePatrolArea">保存辖区</el-button>
                <el-button icon="Aim" @click="applyAreaToMap">重绘范围</el-button>
              </el-space>
            </el-form>
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
      <AlertDispositionPanel
        :alerts="alerts"
        :dispositions="alertDispositions"
        :pager="alertPager"
        :on-reload="loadData"
        :on-ack="handleAck"
        :on-close="handleClose"
        :on-load-dispositions="handleLoadAlertDispositions"
      />
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
        <PatrolPagination
          v-model:page="devicePager.page"
          v-model:page-size="devicePager.pageSize"
          :total="devicePager.total"
          @change="loadData"
        />
      </el-card>
      <el-card shadow="never" class="mb-[12px]">
        <template #header>
          <div class="card-toolbar">
            <span>智能眼镜与实时流播放器</span>
            <el-tag v-if="activeDispatchSession" :type="streamPlayerStatusType">{{ activeDispatchSession.state }}</el-tag>
          </div>
        </template>
        <el-empty v-if="!selectedDeviceConfig" description="请选择设备后查看实时流" />
        <el-row v-else :gutter="12">
          <el-col :xs="24" :lg="9">
            <div class="device-product-panel">
              <img :src="smartGlassesImage" alt="智能眼镜设备" />
              <div class="device-product-meta">
                <strong>{{ selectedDeviceConfig.deviceName }}</strong>
                <span>{{ selectedDeviceConfig.deviceId }} · {{ selectedDeviceConfig.officerName }}</span>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :lg="15">
            <div ref="streamPlayerRef" class="stream-player">
              <video
                ref="streamVideoRef"
                class="stream-video"
                :src="streamVideoUrl"
                :muted="streamMuted"
                controls
                playsinline
                preload="metadata"
                @play="streamPaused = false"
                @pause="streamPaused = true"
                @volumechange="syncStreamMuted"
              />
              <div v-if="!streamVideoUrl" class="stream-empty-state">
                <strong>等待智能眼镜推流</strong>
                <span>{{ activeDispatchSession ? '调度会话已创建，尚未收到播放地址' : '点击开始实时流创建播放会话' }}</span>
              </div>
              <div class="stream-player-toolbar">
                <div class="stream-session-info">
                  <strong>{{ selectedDeviceConfig.deviceId }}</strong>
                  <span>{{ streamSessionText }}</span>
                </div>
                <el-space wrap>
                  <el-radio-group v-model="streamQuality" size="small" @change="handleStreamQualityChange">
                    <el-radio-button v-for="item in streamQualityOptions" :key="item.value" :label="item.value">
                      {{ item.label }}
                    </el-radio-button>
                  </el-radio-group>
                  <el-button size="small" :icon="streamPaused ? 'VideoPlay' : 'VideoPause'" @click="toggleStreamPlayback">
                    {{ streamPaused ? '播放' : '暂停' }}
                  </el-button>
                  <el-button size="small" :icon="streamMuted ? 'Mute' : 'Microphone'" @click="toggleStreamMuted">
                    {{ streamMuted ? '取消静音' : '静音' }}
                  </el-button>
                  <el-button size="small" icon="FullScreen" @click="requestStreamFullscreen">全屏</el-button>
                  <el-button size="small" type="primary" icon="VideoCamera" @click="handleCreateSession(selectedDeviceConfig.deviceId)">
                    开始实时流
                  </el-button>
                  <el-button size="small" type="danger" plain @click="handleCloseStreamSession">断开</el-button>
                </el-space>
              </div>
            </div>
          </el-col>
        </el-row>
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
        <PatrolPagination
          v-model:page="deviceCommandPager.page"
          v-model:page-size="deviceCommandPager.pageSize"
          :total="deviceCommandPager.total"
          @change="loadData"
        />
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
        <PatrolPagination
          v-model:page="deviceEventPager.page"
          v-model:page-size="deviceEventPager.pageSize"
          :total="deviceEventPager.total"
          @change="loadData"
        />
      </el-card>
    </template>

    <template v-else-if="module === 'media'">
      <MediaEvidencePanel
        :files="mediaFiles"
        :upload-tasks="mediaUploadTasks"
        :pager="mediaPager"
        :upload-task-pager="mediaUploadTaskPager"
        :preview="mediaPreview"
        :section="mediaSection"
        :on-reload="loadData"
        :on-preview="handlePreviewMedia"
        :on-download="handleDownloadMedia"
        :on-verify="handleVerifyMedia"
        :on-delete="handleDeleteMedia"
        :on-clean-upload-tasks="handleCleanUploadTasks"
        :on-clear-preview="clearMediaPreview"
      />
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
            <PatrolPagination
              v-model:page="dailyReportPager.page"
              v-model:page-size="dailyReportPager.pageSize"
              :total="dailyReportPager.total"
              @change="loadData"
            />
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
      <SosDispositionPanel
        :events="sosEvents"
        :timeline="sosTimeline"
        :pager="sosPager"
        :on-reload="loadData"
        :on-load-timeline="handleLoadSosTimeline"
        :on-assign-backup="handleAssignSosBackup"
        :on-notify="handleNotifySos"
        :on-add-recording="handleAddSosRecording"
        :on-add-note="handleAddSosNote"
        :on-close="handleCloseSos"
      />
    </template>

    <template v-else-if="module === 'control'">
      <ControlManagementPanel
        :persons="controlPersons"
        :vehicles="controlVehicles"
        :person-pager="controlPersonPager"
        :vehicle-pager="controlVehiclePager"
        :import-result="controlImportResult"
        :import-loading="controlImportLoading"
        :section="controlSection"
        :face-upload-loading="faceUploadLoading"
        :asset-url="assetUrl"
        :on-reload="loadData"
        :on-import-persons="handleImportControlPersons"
        :on-import-vehicles="handleImportControlVehicles"
        :on-create-person="handleCreateControlPerson"
        :on-create-vehicle="handleCreateControlVehicle"
        :on-toggle-person="handleToggleControlPerson"
        :on-toggle-vehicle="handleToggleControlVehicle"
        :on-upload-person-face="handleUploadControlPersonFace"
      />
    </template>

    <template v-else-if="module === 'messages'">
      <CommandMessagePanel
        :form="messageForm"
        :messages="messages"
        :receipts="messageReceipts"
        :pager="messagePager"
        :section="messageSection"
        :on-reload="loadData"
        :on-send="handleSendMessage"
        :on-load-receipts="handleLoadMessageReceipts"
      />
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
      <AuditLogPanel :logs="auditLogs" :pager="auditPager" :on-reload="loadData" />
    </template>

    <template v-else>
      <AppVersionSection
        v-if="operationSection === 'all' || operationSection === 'app-versions'"
        :form="versionForm"
        :versions="appVersions"
        :pager="appVersionPager"
        :upload-loading="versionUploadLoading"
        :can-publish="canPublishVersion"
        :on-reload="loadData"
        :on-upload-package="handleUploadVersionPackage"
        :on-create="handleCreateVersion"
        :on-toggle="handleToggleVersion"
      />
      <FirmwareVersionSection
        v-if="operationSection === 'all' || operationSection === 'firmware-versions'"
        :form="firmwareForm"
        :versions="firmwareVersions"
        :pager="firmwareVersionPager"
        :upload-loading="firmwareUploadLoading"
        :can-publish="canPublishFirmware"
        :on-reload="loadData"
        :on-upload-package="handleUploadFirmwarePackage"
        :on-create="handleCreateFirmware"
        :on-toggle="handleToggleFirmware"
      />
      <FirmwareUpgradeTaskSection
        v-if="operationSection === 'all' || operationSection === 'firmware-upgrade-tasks'"
        :tasks="firmwareUpgradeTasks"
        :pager="firmwareTaskPager"
        :on-reload="loadData"
      />
      <OperationsCapabilityCard v-if="operationSection === 'all' || operationSection === 'capabilities'" />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  applyDeviceSettings,
  closeDispatchSession,
  closeIntercomSession,
  configureDeviceWifi,
  listAlertDispositions,
  createAppVersion,
  createControlPerson,
  createControlVehicle,
  createDispatchSession,
  createFirmwareVersion,
  createIntercomSession,
  getPatrolDashboard,
  getCurrentPatrolArea,
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
  listPatrolAreas,
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
  sendDeviceCommand,
  sendIntercomSignal,
  savePatrolArea,
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
  uploadFirmwarePackage
} from '@/api/patrol';
import AlertDispositionPanel from '@/views/patrol/alerts/components/AlertDispositionPanel.vue';
import { useAlertDispositionActions } from '@/views/patrol/alerts/composables/useAlertDispositionActions';
import AuditLogPanel from '@/views/patrol/audit/components/AuditLogPanel.vue';
import PatrolPageHeader from '@/views/patrol/components/common/PatrolPageHeader.vue';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import ControlManagementPanel from '@/views/patrol/control/components/ControlManagementPanel.vue';
import MediaEvidencePanel from '@/views/patrol/media/components/MediaEvidencePanel.vue';
import { useMediaEvidenceActions } from '@/views/patrol/media/composables/useMediaEvidenceActions';
import CommandMessagePanel from '@/views/patrol/messages/components/CommandMessagePanel.vue';
import { useCommandMessageActions } from '@/views/patrol/messages/composables/useCommandMessageActions';
import AppVersionSection from '@/views/patrol/operations/components/AppVersionSection.vue';
import FirmwareUpgradeTaskSection from '@/views/patrol/operations/components/FirmwareUpgradeTaskSection.vue';
import FirmwareVersionSection from '@/views/patrol/operations/components/FirmwareVersionSection.vue';
import OperationsCapabilityCard from '@/views/patrol/operations/components/OperationsCapabilityCard.vue';
import SosDispositionPanel from '@/views/patrol/sos/components/SosDispositionPanel.vue';
import { useSosDispositionActions } from '@/views/patrol/sos/composables/useSosDispositionActions';
import { createPatrolPagination, readPageItems, toPageParams } from '@/views/patrol/composables/usePatrolPagination';
import { patrolModuleMeta } from '@/views/patrol/config/patrolModuleMeta';
import { patrolRealtimeRefreshMap } from '@/views/patrol/config/patrolRealtimeRefreshMap';
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
  DispatchSession,
  FirmwareUpgradeTask,
  FirmwareVersion,
  IntercomSession,
  IntercomSignal,
  ModuleKey,
  OfficerLocation,
  OfficerTrackPoint,
  PatrolArea,
  PatrolGeoPoint,
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
import smartGlassesImage from '@/assets/patrol/devices/smart-glasses-image2.png';
import { loadAMap } from '@/utils/amap';
import { PATROL_REALTIME_EVENT, PatrolRealtimeEvent } from '@/utils/sse';

const props = withDefaults(defineProps<{ module: ModuleKey; section?: string }>(), {
  section: ''
});

const loading = ref(false);
const wallLayout = ref(8);
const dashboard = ref<DashboardSummary>();
const devices = ref<PatrolDevice[]>([]);
const deviceConfigs = ref<DeviceConfig[]>([]);
const selectedDeviceConfig = ref<DeviceConfig>();
const deviceCommands = ref<PatrolDeviceCommand[]>([]);
const deviceEvents = ref<PatrolDeviceEvent[]>([]);
const channels = ref<DispatchChannel[]>([]);
const activeDispatchSession = ref<DispatchSession>();
const streamPlayerRef = ref<HTMLDivElement>();
const streamVideoRef = ref<HTMLVideoElement>();
const streamQuality = ref('LOW_LATENCY');
const streamMuted = ref(true);
const streamPaused = ref(true);
const activeIntercomSession = ref<IntercomSession>();
const intercomDialogVisible = ref(false);
const intercomRemoteAudio = ref<HTMLAudioElement>();
const intercomStatus = ref('');
const intercomConnected = ref(false);
const officers = ref<OfficerLocation[]>([]);
const trackPoints = ref<OfficerTrackPoint[]>([]);
const patrolAreas = ref<PatrolArea[]>([]);
const currentArea = ref<PatrolArea>();
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
const alertPager = reactive(createPatrolPagination(20));
const devicePager = reactive(createPatrolPagination(20));
const deviceConfigPager = reactive(createPatrolPagination(20));
const deviceCommandPager = reactive(createPatrolPagination(20));
const deviceEventPager = reactive(createPatrolPagination(20));
const mediaPager = reactive(createPatrolPagination(20));
const mediaUploadTaskPager = reactive(createPatrolPagination(20));
const dailyReportPager = reactive(createPatrolPagination(20));
const sosPager = reactive(createPatrolPagination(20));
const controlPersonPager = reactive(createPatrolPagination(20));
const controlVehiclePager = reactive(createPatrolPagination(20));
const messagePager = reactive(createPatrolPagination(20));
const auditPager = reactive(createPatrolPagination(20));
const appVersionPager = reactive(createPatrolPagination(20));
const firmwareVersionPager = reactive(createPatrolPagination(20));
const firmwareTaskPager = reactive(createPatrolPagination(20));
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
const areaForm = reactive<PatrolArea>({
  areaId: 'AREA-FZ-WQ-001',
  areaName: '五四路核心勤务区',
  teamId: 'PTL-GROUP-A',
  teamName: '第一巡逻支队 A 组',
  ownerType: 'TEAM',
  userId: '',
  badgeNo: '',
  boundary: [],
  route: [],
  updatedAt: ''
});
const areaBoundaryText = ref('26.1048,119.3009\n26.1044,119.3137\n26.0977,119.3145\n26.0968,119.3024');
const areaRouteText = ref('26.1036,119.3025\n26.1017,119.3065\n26.0995,119.3104\n26.0979,119.3131');
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
const mapOverlays: any[] = [];
const mapError = ref('');
const mediaPreview = reactive({
  visible: false,
  title: '',
  kind: 'VIDEO',
  url: '',
  sha256: '',
  watermarkToken: ''
});
const streamQualityOptions = [
  { label: '流畅', value: 'LOW_LATENCY' },
  { label: '高清', value: 'HIGH_DEFINITION' },
  { label: '自动', value: 'AUTO' }
];

const pageTitle = computed(() => patrolModuleMeta[props.module].title);
const pageDesc = computed(() => patrolModuleMeta[props.module].desc);
const controlSection = computed(() => (props.section === 'persons' || props.section === 'vehicles' ? props.section : 'all'));
const mediaSection = computed(() => (props.section === 'evidence' || props.section === 'upload-tasks' ? props.section : 'all'));
const messageSection = computed(() => (props.section === 'send' || props.section === 'history' ? props.section : 'all'));
const operationSection = computed(() => {
  const allowedSections = ['app-versions', 'firmware-versions', 'firmware-upgrade-tasks', 'capabilities'];
  return allowedSections.includes(props.section || '') ? props.section : 'all';
});
const streamVideoUrl = computed(() => activeDispatchSession.value?.relayUrl || '');
const streamSessionText = computed(() => {
  if (!activeDispatchSession.value) {
    return '未创建播放会话';
  }
  return `${activeDispatchSession.value.sessionId} · ${activeDispatchSession.value.mode}`;
});
const streamPlayerStatusType = computed(() => {
  const state = activeDispatchSession.value?.state;
  if (state === 'LIVE' || state === 'READY') {
    return 'success';
  }
  if (state === 'RESERVED') {
    return 'warning';
  }
  return 'info';
});
const hasUploadedVersionPackage = computed(() => Boolean(versionForm.fileId && versionForm.downloadUrl && versionForm.sha256));
const canPublishVersion = computed(
  () =>
    Number(versionForm.versionCode) > 0 &&
    versionForm.versionName.trim().length > 0 &&
    versionForm.changelog.trim().length > 0 &&
    hasUploadedVersionPackage.value &&
    !versionUploadLoading.value
);
const hasUploadedFirmwarePackage = computed(() => Boolean(firmwareForm.fileId && firmwareForm.downloadUrl && firmwareForm.sha256));
const canPublishFirmware = computed(
  () =>
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

const shouldRefreshForRealtime = (event: PatrolRealtimeEvent) => {
  const modules = patrolRealtimeRefreshMap[event.type] || [];
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
      const [officersRes, areasRes, currentAreaRes] = await Promise.all([listOfficerLocations(), listPatrolAreas(), getCurrentPatrolArea()]);
      officers.value = officersRes.data;
      patrolAreas.value = areasRes.data;
      applyAreaForm(currentAreaRes.data);
      await nextTick();
      await renderOfficerMap();
    } else if (props.module === 'alerts') {
      alerts.value = readPageItems((await listPatrolAlerts(toPageParams(alertPager))).data, alertPager);
      if (alerts.value.length > 0) {
        alertDispositions.value = (await listAlertDispositions(alerts.value[0].alertId)).data;
      }
    } else if (props.module === 'devices') {
      const [devicesRes, configsRes, commandsRes, eventsRes, channelsRes] = await Promise.all([
        listPatrolDevices(toPageParams(devicePager)),
        listDeviceConfigs(toPageParams(deviceConfigPager)),
        listDeviceCommands(toPageParams(deviceCommandPager)),
        listDeviceEvents(toPageParams(deviceEventPager)),
        listDispatchChannels()
      ]);
      devices.value = readPageItems(devicesRes.data, devicePager);
      deviceConfigs.value = readPageItems(configsRes.data, deviceConfigPager);
      deviceCommands.value = readPageItems(commandsRes.data, deviceCommandPager);
      deviceEvents.value = readPageItems(eventsRes.data, deviceEventPager);
      channels.value = channelsRes.data;
      const selected = selectedDeviceConfig.value
        ? deviceConfigs.value.find((item) => item.deviceId === selectedDeviceConfig.value?.deviceId)
        : deviceConfigs.value[0];
      if (selected) {
        applySelectedDeviceConfig(selected);
      }
    } else if (props.module === 'media') {
      const [mediaRes, uploadTasksRes] = await Promise.all([
        listPatrolMedia(toPageParams(mediaPager)),
        listPatrolMediaUploadTasks(toPageParams(mediaUploadTaskPager))
      ]);
      mediaFiles.value = readPageItems(mediaRes.data, mediaPager);
      mediaUploadTasks.value = readPageItems(uploadTasksRes.data, mediaUploadTaskPager);
    } else if (props.module === 'reports') {
      dailyReports.value = readPageItems(
        (await listPatrolDailyReports({ ...toPageParams(dailyReportPager), status: reportStatusFilter.value })).data,
        dailyReportPager
      );
      activeDailyReport.value = activeDailyReport.value
        ? dailyReports.value.find((item) => item.reportId === activeDailyReport.value?.reportId)
        : dailyReports.value[0];
    } else if (props.module === 'sos') {
      sosEvents.value = readPageItems((await listPatrolSos(toPageParams(sosPager))).data, sosPager);
      if (sosEvents.value.length > 0) {
        sosTimeline.value = (await listPatrolSosTimeline(sosEvents.value[0].sosId)).data;
      } else {
        sosTimeline.value = [];
      }
    } else if (props.module === 'control') {
      const [personsRes, vehiclesRes] = await Promise.all([
        listControlPersons(toPageParams(controlPersonPager)),
        listControlVehicles(toPageParams(controlVehiclePager))
      ]);
      controlPersons.value = readPageItems(personsRes.data, controlPersonPager);
      controlVehicles.value = readPageItems(vehiclesRes.data, controlVehiclePager);
    } else if (props.module === 'messages') {
      messages.value = readPageItems((await listPatrolMessages(toPageParams(messagePager))).data, messagePager);
      if (messages.value.length > 0) {
        messageReceipts.value = (await listPatrolMessageReceipts(messages.value[0].messageId)).data;
      } else {
        messageReceipts.value = [];
      }
    } else if (props.module === 'statistics') {
      statistics.value = (await getStatisticsOverview()).data;
    } else if (props.module === 'audit') {
      auditLogs.value = readPageItems((await listSystemAuditLogs(toPageParams(auditPager))).data, auditPager);
    } else if (props.module === 'operations') {
      const [appVersionsRes, firmwareVersionsRes, firmwareTasksRes] = await Promise.all([
        listAppVersions(toPageParams(appVersionPager)),
        listFirmwareVersions(toPageParams(firmwareVersionPager)),
        listFirmwareUpgradeTasks(toPageParams(firmwareTaskPager))
      ]);
      appVersions.value = readPageItems(appVersionsRes.data, appVersionPager);
      firmwareVersions.value = readPageItems(firmwareVersionsRes.data, firmwareVersionPager);
      firmwareUpgradeTasks.value = readPageItems(firmwareTasksRes.data, firmwareTaskPager);
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
  activeDispatchSession.value = (await createDispatchSession(deviceId, streamQuality.value)).data;
  await nextTick();
  if (streamVideoUrl.value) {
    streamVideoRef.value?.load();
    await streamVideoRef.value?.play().catch(() => undefined);
  }
  ElMessage.success(activeDispatchSession.value.relayUrl ? '实时流播放器已接入' : '播放会话已创建，等待设备推流地址');
};

const handleStreamQualityChange = async () => {
  if (!selectedDeviceConfig.value) {
    return;
  }
  await handleCreateSession(selectedDeviceConfig.value.deviceId);
};

const toggleStreamPlayback = async () => {
  const video = streamVideoRef.value;
  if (!video || !streamVideoUrl.value) {
    ElMessage.info('当前没有可播放的实时流地址');
    return;
  }
  if (video.paused) {
    await video.play();
  } else {
    video.pause();
  }
};

const toggleStreamMuted = () => {
  streamMuted.value = !streamMuted.value;
  if (streamVideoRef.value) {
    streamVideoRef.value.muted = streamMuted.value;
  }
};

const syncStreamMuted = () => {
  if (streamVideoRef.value) {
    streamMuted.value = streamVideoRef.value.muted;
  }
};

const requestStreamFullscreen = async () => {
  const target = streamPlayerRef.value;
  if (!target?.requestFullscreen) {
    ElMessage.warning('当前浏览器不支持播放器全屏');
    return;
  }
  await target.requestFullscreen();
};

const handleCloseStreamSession = async () => {
  if (activeDispatchSession.value?.sessionId) {
    await closeDispatchSession(activeDispatchSession.value.sessionId);
  }
  streamVideoRef.value?.pause();
  activeDispatchSession.value = undefined;
  streamPaused.value = true;
  ElMessage.success('实时流会话已断开');
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

const { handleAck, handleClose, handleLoadAlertDispositions } = useAlertDispositionActions(alertDispositions, loadData);
const { handleSendMessage, handleLoadMessageReceipts } = useCommandMessageActions(messageForm, messageReceipts, loadData);

const handleLoadTrack = async (badgeNo: string) => {
  trackPoints.value = (await listOfficerTrack(badgeNo)).data;
  ElMessage.success('轨迹已加载');
};

const applyAreaForm = (area: PatrolArea) => {
  currentArea.value = area;
  Object.assign(areaForm, area);
  areaBoundaryText.value = pointsToText(area.boundary);
  areaRouteText.value = pointsToText(area.route);
};

const pointsToText = (points: PatrolGeoPoint[]) => (points || []).map((point) => `${point.latitude},${point.longitude}`).join('\n');

const parsePointText = (value: string): PatrolGeoPoint[] => {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [latitudeText, longitudeText] = line.split(/[,，\s]+/);
      return {
        latitude: Number(latitudeText),
        longitude: Number(longitudeText)
      };
    })
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
};

const handleSavePatrolArea = async () => {
  const boundary = parsePointText(areaBoundaryText.value);
  const route = parsePointText(areaRouteText.value);
  if (boundary.length < 3) {
    ElMessage.warning('边界至少需要 3 个点');
    return;
  }
  if (route.length < 2) {
    ElMessage.warning('路线至少需要 2 个点');
    return;
  }
  if (areaForm.ownerType === 'TEAM' && !areaForm.teamId?.trim()) {
    ElMessage.warning('小组范围必须填写组ID');
    return;
  }
  if (areaForm.ownerType === 'USER' && !areaForm.userId?.trim() && !areaForm.badgeNo?.trim()) {
    ElMessage.warning('个人范围必须填写用户ID或警号');
    return;
  }
  const saved = (
    await savePatrolArea({
      ...areaForm,
      boundary,
      route
    })
  ).data;
  applyAreaForm(saved);
  ElMessage.success('执勤辖区已保存并同步到移动端');
  await renderOfficerMap();
};

const applyAreaToMap = async () => {
  currentArea.value = {
    ...areaForm,
    boundary: parsePointText(areaBoundaryText.value),
    route: parsePointText(areaRouteText.value)
  };
  await renderOfficerMap();
};

const {
  clearMediaPreview,
  handleVerifyMedia,
  handlePreviewMedia,
  handleDownloadMedia,
  handleDeleteMedia,
  handleCleanUploadTasks
} = useMediaEvidenceActions(mediaPreview, loadData);
const {
  handleLoadSosTimeline,
  handleAssignSosBackup,
  handleNotifySos,
  handleAddSosRecording,
  handleAddSosNote,
  handleCloseSos
} = useSosDispositionActions(sosTimeline, loadData);

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
    renderAreaOverlay(AMap);
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
      mapInstance.value.setFitView([...mapMarkers, ...mapOverlays], false, [64, 48, 64, 48]);
    } else if (mapOverlays.length) {
      mapInstance.value.setFitView(mapOverlays, false, [64, 48, 64, 48]);
    }
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '高德地图 SDK 初始化异常';
  }
};

const renderAreaOverlay = (AMap: any) => {
  const area = currentArea.value;
  if (!area) {
    return;
  }
  const boundary = area.boundary.map((point) => [point.longitude, point.latitude]);
  const route = area.route.map((point) => [point.longitude, point.latitude]);
  if (boundary.length >= 3) {
    const polygon = new AMap.Polygon({
      path: boundary,
      strokeColor: '#00d8ff',
      strokeOpacity: 0.96,
      strokeWeight: 3,
      fillColor: '#0ea5e9',
      fillOpacity: 0.16,
      zIndex: 50
    });
    polygon.setMap(mapInstance.value);
    mapOverlays.push(polygon);
  }
  if (route.length >= 2) {
    const polyline = new AMap.Polyline({
      path: route,
      strokeColor: '#facc15',
      strokeOpacity: 0.95,
      strokeWeight: 6,
      strokeStyle: 'solid',
      lineJoin: 'round',
      zIndex: 55
    });
    polyline.setMap(mapInstance.value);
    mapOverlays.push(polyline);
  }
};

const clearMapMarkers = () => {
  while (mapMarkers.length) {
    mapMarkers.pop()?.setMap(null);
  }
  while (mapOverlays.length) {
    mapOverlays.pop()?.setMap(null);
  }
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

.device-product-panel {
  display: grid;
  min-height: 332px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
}

.device-product-panel img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #f8fafc;
}

.device-product-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.device-product-meta strong,
.device-product-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-product-meta span {
  color: #6b7280;
  font-size: 12px;
}

.stream-player {
  position: relative;
  display: grid;
  min-height: 332px;
  overflow: hidden;
  border: 1px solid #111827;
  border-radius: 6px;
  background: #020617;
}

.stream-video {
  width: 100%;
  min-height: 270px;
  aspect-ratio: 16 / 9;
  background: #020617;
  object-fit: contain;
}

.stream-empty-state {
  position: absolute;
  inset: 0 0 62px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #e5e7eb;
  text-align: center;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 45%, rgba(37, 99, 235, 0.22), transparent 32%),
    repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.08) 0 1px, transparent 1px 8px);
}

.stream-empty-state strong {
  font-size: 16px;
  line-height: 24px;
}

.stream-empty-state span {
  max-width: min(420px, calc(100% - 32px));
  color: #94a3b8;
  font-size: 13px;
  line-height: 20px;
}

.stream-player-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 62px;
  padding: 10px 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  background: #0f172a;
}

.stream-session-info {
  display: flex;
  min-width: 148px;
  flex-direction: column;
  gap: 2px;
  color: #e5e7eb;
}

.stream-session-info strong,
.stream-session-info span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stream-session-info span {
  color: #94a3b8;
  font-size: 12px;
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
  position: relative;
  overflow: hidden;
  height: 132px;
  margin: 10px 0;
  border-radius: 4px;
  background: linear-gradient(135deg, #111827, #1f2937);
  color: #93c5fd;
}

.inline-live-video,
.video-standby {
  width: 100%;
  height: 100%;
}

.inline-live-video {
  display: block;
  object-fit: cover;
}

.video-standby {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 20px;
  font-weight: 700;
}

.video-standby span {
  color: #9ca3af;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
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

@media (max-width: 768px) {
  .stream-player-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .stream-session-info {
    width: 100%;
  }
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
