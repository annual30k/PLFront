<template>
  <el-card shadow="never" class="mb-[12px]">
    <template #header>设备固件升级记录</template>
    <el-table :data="tasks" border>
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
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
</template>

<script setup lang="ts">
import type { FirmwareUpgradeTask } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  tasks: FirmwareUpgradeTask[];
  pager: PatrolPaginationState;
  onReload: () => void | Promise<void>;
}>();
</script>
