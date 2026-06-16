<template>
  <el-card v-if="section !== 'upload-tasks'" shadow="never">
    <template #header>媒体证据库</template>
    <el-table :data="files" border>
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
          <el-button link type="primary" @click="onPreview(scope.row)">预览</el-button>
          <el-button link type="primary" @click="onDownload(scope.row)">下载</el-button>
          <el-button link type="primary" @click="onVerify(scope.row.fileId)">校验</el-button>
          <el-button link type="danger" @click="onDelete(scope.row.fileId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
  <el-card v-if="section !== 'evidence'" shadow="never" class="mt-[12px]">
    <template #header>
      <div class="card-toolbar">
        <span>分片上传任务</span>
        <el-button size="small" @click="onCleanUploadTasks">清理过期任务</el-button>
      </div>
    </template>
    <el-table :data="uploadTasks" border>
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
    <PatrolPagination
      v-model:page="uploadTaskPager.page"
      v-model:page-size="uploadTaskPager.pageSize"
      :total="uploadTaskPager.total"
      @change="onReload"
    />
  </el-card>
  <el-dialog v-model="preview.visible" :title="preview.title" width="720px" @closed="onClearPreview">
    <div class="media-preview">
      <img v-if="preview.kind === 'PHOTO'" :src="preview.url" alt="media preview" />
      <audio v-else-if="preview.kind === 'AUDIO'" :src="preview.url" controls />
      <video v-else :src="preview.url" controls />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="SHA-256">{{ preview.sha256 || '-' }}</el-descriptions-item>
        <el-descriptions-item label="水印令牌">{{ preview.watermarkToken || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import type { PatrolMedia, PatrolMediaUploadTask } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  files: PatrolMedia[];
  uploadTasks: PatrolMediaUploadTask[];
  pager: PatrolPaginationState;
  uploadTaskPager: PatrolPaginationState;
  preview: Record<string, any>;
  section?: 'all' | 'evidence' | 'upload-tasks';
  onReload: () => void | Promise<void>;
  onPreview: (row: PatrolMedia) => void | Promise<void>;
  onDownload: (row: PatrolMedia) => void | Promise<void>;
  onVerify: (fileId: string) => void | Promise<void>;
  onDelete: (fileId: string) => void | Promise<void>;
  onCleanUploadTasks: () => void | Promise<void>;
  onClearPreview: () => void;
}>();
</script>

<style lang="scss" scoped>
.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
</style>
