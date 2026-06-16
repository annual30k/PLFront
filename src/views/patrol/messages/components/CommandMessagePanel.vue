<template>
  <el-card v-if="section !== 'history'" shadow="never" class="mb-[12px]">
    <template #header>发送指挥消息</template>
    <el-form :inline="true" :model="form" class="message-form">
      <el-form-item label="目标类型">
        <el-select v-model="form.targetType" style="width: 120px">
          <el-option label="警员" value="SINGLE" />
          <el-option label="设备" value="DEVICE" />
          <el-option label="组织" value="ORG" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标ID">
        <el-input v-model="form.targetId" style="width: 150px" />
      </el-form-item>
      <el-form-item label="标题">
        <el-input v-model="form.title" style="width: 160px" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input v-model="form.content" style="width: 360px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Promotion" @click="onSend">发送</el-button>
      </el-form-item>
    </el-form>
  </el-card>
  <el-card v-if="section !== 'send'" shadow="never">
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
          <el-button link type="primary" @click="onLoadReceipts(scope.row.messageId)">明细</el-button>
        </template>
      </el-table-column>
    </el-table>
    <PatrolPagination v-model:page="pager.page" v-model:page-size="pager.pageSize" :total="pager.total" @change="onReload" />
  </el-card>
  <el-card v-if="section !== 'send'" shadow="never" class="mt-[12px]">
    <template #header>投递明细</template>
    <el-table :data="receipts" border>
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

<script setup lang="ts">
import type { PatrolMessage, PatrolMessageReceipt } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  form: Record<string, any>;
  messages: PatrolMessage[];
  receipts: PatrolMessageReceipt[];
  pager: PatrolPaginationState;
  section?: 'all' | 'send' | 'history';
  onReload: () => void | Promise<void>;
  onSend: () => void | Promise<void>;
  onLoadReceipts: (messageId: string) => void | Promise<void>;
}>();
</script>

<style lang="scss" scoped>
.message-form {
  row-gap: 8px;
}
</style>
