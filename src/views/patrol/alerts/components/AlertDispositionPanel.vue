<template>
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
          <el-button link type="primary" @click="onAck(scope.row.alertId)">确认</el-button>
          <el-button link type="success" @click="onClose(scope.row.alertId)">关闭</el-button>
          <el-button link type="info" @click="onLoadDispositions(scope.row.alertId)">流水</el-button>
        </template>
      </el-table-column>
    </el-table>
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
  <el-card shadow="never" class="mt-[12px]">
    <template #header>预警处置流水</template>
    <el-table :data="dispositions" border>
      <el-table-column prop="occurredAt" label="处置时间" width="170" />
      <el-table-column prop="actionType" label="动作" width="90" />
      <el-table-column prop="actionResult" label="结果" width="100" />
      <el-table-column prop="operatorName" label="操作人" width="110" />
      <el-table-column prop="attachmentsCount" label="附件" width="80" />
      <el-table-column prop="note" label="说明" min-width="180" show-overflow-tooltip />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import type { PatrolAlert, PatrolAlertDisposition } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  alerts: PatrolAlert[];
  dispositions: PatrolAlertDisposition[];
  pager: PatrolPaginationState;
  onReload: () => void | Promise<void>;
  onAck: (alertId: string) => void | Promise<void>;
  onClose: (alertId: string) => void | Promise<void>;
  onLoadDispositions: (alertId: string) => void | Promise<void>;
}>();
</script>
