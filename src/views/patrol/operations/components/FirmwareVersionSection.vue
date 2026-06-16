<template>
  <el-row :gutter="12" class="mb-[12px]">
    <el-col :xs="24" :lg="9">
      <el-card shadow="never">
        <template #header>新增设备固件</template>
        <el-form :model="form" label-width="96px">
          <el-form-item label="设备类型" required>
            <el-select v-model="form.deviceType" class="w-full">
              <el-option label="眼镜" value="GLASSES" />
              <el-option label="耳机" value="HEADSET" />
            </el-select>
          </el-form-item>
          <el-form-item label="芯片平台" required>
            <el-select v-model="form.chipset" class="w-full">
              <el-option label="炬芯 ACTS" value="ACTS" />
              <el-option label="杰理 JL" value="JL" />
              <el-option label="通用" value="" />
            </el-select>
          </el-form-item>
          <el-form-item label="厂商">
            <el-input v-model="form.vendor" placeholder="UTE / JL / ACTIONS" clearable />
          </el-form-item>
          <el-form-item label="设备型号">
            <el-input v-model="form.deviceModel" placeholder="为空表示不限型号" clearable />
          </el-form-item>
          <el-form-item label="硬件版本">
            <el-input v-model="form.hardwareVersion" placeholder="为空表示不限硬件版本" clearable />
          </el-form-item>
          <el-form-item label="排序版本号" required>
            <el-input-number v-model="form.versionCode" :min="1" :step="1" />
          </el-form-item>
          <el-form-item label="版本名称" required>
            <el-input v-model="form.versionName" placeholder="例如 AT338V000110" clearable />
          </el-form-item>
          <el-form-item label="兼容范围">
            <div class="flex gap-2">
              <el-input v-model="form.minCurrentVersion" placeholder="最低当前版本" clearable />
              <el-input v-model="form.maxCurrentVersion" placeholder="最高当前版本" clearable />
            </div>
          </el-form-item>
          <el-form-item label="强制升级">
            <el-switch v-model="form.forceUpdate" />
          </el-form-item>
          <el-form-item label="固件包" required>
            <el-upload :show-file-list="false" accept=".bin,.zip,.ufw" :http-request="onUploadPackage">
              <el-button :loading="uploadLoading" icon="UploadFilled">上传固件包</el-button>
            </el-upload>
            <div v-if="form.fileId" class="text-xs text-green-600 mt-1">固件包已上传，格式：{{ form.packageFormat }}</div>
            <div v-else class="text-xs text-gray-400 mt-1">支持炬芯 bin/zip 与杰理 ufw，上传后自动回填校验信息</div>
          </el-form-item>
          <el-form-item label="SHA-256" required>
            <el-input v-model="form.sha256" disabled placeholder="上传固件包后自动计算" />
          </el-form-item>
          <el-form-item label="更新日志" required>
            <el-input v-model="form.changelog" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Upload" :disabled="!canPublish" @click="onCreate">发布固件</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="15">
      <el-card shadow="never">
        <template #header>设备固件包</template>
        <el-table :data="versions" border>
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
import type { FirmwareVersion } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  form: Record<string, any>;
  versions: FirmwareVersion[];
  pager: PatrolPaginationState;
  uploadLoading: boolean;
  canPublish: boolean;
  onReload: () => void | Promise<void>;
  onUploadPackage: (options: any) => void | Promise<void>;
  onCreate: () => void | Promise<void>;
  onToggle: (row: FirmwareVersion) => void | Promise<void>;
}>();
</script>
