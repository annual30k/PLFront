<template>
  <div class="patrol-pagination">
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      @update:current-page="$emit('update:page', $event)"
      @update:page-size="$emit('update:pageSize', $event)"
      @change="$emit('change')"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    page: number;
    pageSize: number;
    total: number;
    pageSizes?: number[];
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100]
  }
);

defineEmits<{
  'update:page': [value: number];
  'update:pageSize': [value: number];
  change: [];
}>();
</script>

<style lang="scss" scoped>
.patrol-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
