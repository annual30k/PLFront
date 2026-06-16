<template>
  <el-row :gutter="12" class="mb-[12px]">
    <el-col :xs="24" :lg="9">
      <el-card shadow="never">
        <template #header>新增 App 版本</template>
        <el-form :model="form" label-width="86px">
          <el-form-item label="版本号" required>
            <el-input-number v-model="form.versionCode" :min="1" :step="1" />
          </el-form-item>
          <el-form-item label="版本名称" required>
            <el-input v-model="form.versionName" placeholder="例如 1.3.0" clearable />
          </el-form-item>
          <el-form-item label="强制更新">
            <el-switch v-model="form.forceUpdate" />
          </el-form-item>
          <el-form-item label="APK" required>
            <el-upload :show-file-list="false" accept=".apk" :http-request="onUploadPackage">
              <el-button :loading="uploadLoading" icon="UploadFilled">上传安装包</el-button>
            </el-upload>
            <div v-if="form.fileId" class="text-xs text-green-600 mt-1">安装包已上传，校验信息已自动生成</div>
            <div v-else class="text-xs text-gray-400 mt-1">请先上传 APK，下载地址和 SHA-256 将自动回填</div>
          </el-form-item>
          <el-form-item label="下载地址" required>
            <el-input v-model="form.downloadUrl" disabled placeholder="上传 APK 后自动生成" />
          </el-form-item>
          <el-form-item label="SHA-256" required>
            <el-input v-model="form.sha256" disabled placeholder="上传 APK 后自动计算" />
          </el-form-item>
          <el-form-item label="更新日志" required>
            <el-input v-model="form.changelog" type="textarea" :rows="4" placeholder="请输入本次版本变更内容" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Upload" :disabled="!canPublish" @click="onCreate">发布版本</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="15">
      <el-card shadow="never">
        <template #header>App 版本包</template>
        <el-table :data="versions" border>
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
              <el-button link :type="scope.row.status === 'PUBLISHED' ? 'warning' : 'success'" @click="onToggle(scope.row)">
                {{ scope.row.status === 'PUBLISHED' ? '停用' : '发布' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import type { AppVersion } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  form: Record<string, any>;
  versions: AppVersion[];
  pager: PatrolPaginationState;
  uploadLoading: boolean;
  canPublish: boolean;
  onReload: () => void | Promise<void>;
  onUploadPackage: (options: any) => void | Promise<void>;
  onCreate: () => void | Promise<void>;
  onToggle: (row: AppVersion) => void | Promise<void>;
}>();
</script>
