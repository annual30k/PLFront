<template>
  <el-card shadow="never">
    <template #header>SOS 实时求助</template>
    <el-table :data="events" border>
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
          <el-button link type="primary" @click="onLoadTimeline(scope.row.sosId)">流水</el-button>
          <el-button link type="primary" @click="onAssignBackup(scope.row.sosId)">增援</el-button>
          <el-button link type="primary" @click="onNotify(scope.row.sosId)">通知</el-button>
          <el-button link type="primary" @click="onAddRecording(scope.row.sosId)">录音</el-button>
          <el-button link type="primary" @click="onAddNote(scope.row.sosId)">备注</el-button>
          <el-button link type="success" @click="onClose(scope.row.sosId)">关闭</el-button>
        </template>
      </el-table-column>
    </el-table>
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
  <el-card shadow="never" class="mt-[12px]">
    <template #header>处置时间线</template>
    <el-table :data="timeline" border>
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

<script setup lang="ts">
import type { PatrolSos, PatrolSosTimeline } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  events: PatrolSos[];
  timeline: PatrolSosTimeline[];
  pager: PatrolPaginationState;
  onReload: () => void | Promise<void>;
  onLoadTimeline: (sosId: string) => void | Promise<void>;
  onAssignBackup: (sosId: string) => void | Promise<void>;
  onNotify: (sosId: string) => void | Promise<void>;
  onAddRecording: (sosId: string) => void | Promise<void>;
  onAddNote: (sosId: string) => void | Promise<void>;
  onClose: (sosId: string) => void | Promise<void>;
}>();
</script>
