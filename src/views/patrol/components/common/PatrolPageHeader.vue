<template>
  <el-card class="mb-[12px]" shadow="never">
    <div class="patrol-page-header">
      <div>
        <div class="patrol-page-header__title">{{ title }}</div>
        <div class="patrol-page-header__description">{{ description }}</div>
      </div>
      <el-space>
        <slot name="actions" />
      </el-space>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style lang="scss" scoped>
.patrol-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.patrol-page-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.patrol-page-header__description {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}
</style>
