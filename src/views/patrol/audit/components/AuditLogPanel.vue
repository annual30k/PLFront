<template>
  <el-card shadow="never">
    <template #header>操作审计</template>
    <el-table :data="logs" border>
      <el-table-column prop="occurredAt" label="时间" width="170" />
      <el-table-column prop="logType" label="类型" width="100" />
      <el-table-column prop="operatorName" label="操作人" width="110" />
      <el-table-column prop="action" label="动作" min-width="160" />
      <el-table-column prop="resource" label="资源" min-width="140" show-overflow-tooltip />
      <el-table-column prop="result" label="结果" width="90" />
      <el-table-column prop="ipAddress" label="IP" width="120" />
      <el-table-column prop="traceId" label="Trace" min-width="220" show-overflow-tooltip />
    </el-table>
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
</template>

<script setup lang="ts">
import type { SystemAuditLog } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  logs: SystemAuditLog[];
  pager: PatrolPaginationState;
  onReload: () => void | Promise<void>;
}>();
</script>
