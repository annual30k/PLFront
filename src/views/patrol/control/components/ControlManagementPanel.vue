<template>
  <div>
    <el-row :gutter="12">
      <el-col v-if="section !== 'vehicles'" :xs="24" :lg="section === 'persons' ? 24 : 12">
        <el-card shadow="never">
          <template #header>
            <div class="card-toolbar">
              <span>人员布控</span>
              <el-space>
                <el-upload :show-file-list="false" accept=".xlsx,.xls" :http-request="onImportPersons">
                  <el-button size="small" :loading="importLoading">导入</el-button>
                </el-upload>
                <el-button type="primary" size="small" icon="Plus" @click="onCreatePerson">新增人员</el-button>
              </el-space>
            </div>
          </template>
          <el-table :data="persons" border>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="category" label="类别" width="110" />
            <el-table-column prop="riskLevel" label="风险" width="90" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="人脸底库" width="130">
              <template #default="scope">
                <el-space v-if="scope.row.hasFaceImage" :size="6">
                  <el-image
                    class="face-thumb"
                    :src="assetUrl(scope.row.faceImageUrl)"
                    fit="cover"
                    :preview-src-list="[assetUrl(scope.row.faceImageUrl)]"
                  />
                  <el-tag size="small" type="success">已入库</el-tag>
                </el-space>
                <el-tag v-else size="small" type="info">未上传</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" @click="onTogglePerson(scope.row)">
                  {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
                </el-button>
                <el-upload
                  class="inline-upload"
                  :show-file-list="false"
                  accept="image/*"
                  :http-request="(options: any) => onUploadPersonFace(scope.row, options)"
                >
                  <el-button link type="primary" :loading="faceUploadLoading[scope.row.controlId]">
                    {{ scope.row.hasFaceImage ? '换照片' : '传照片' }}
                  </el-button>
                </el-upload>
              </template>
            </el-table-column>
          </el-table>
          <PatrolPagination
            v-model:page="personPager.page"
            v-model:page-size="personPager.pageSize"
            :total="personPager.total"
            @change="onReload"
          />
        </el-card>
      </el-col>

      <el-col v-if="section !== 'persons'" :xs="24" :lg="section === 'vehicles' ? 24 : 12">
        <el-card shadow="never">
          <template #header>
            <div class="card-toolbar">
              <span>车辆布控</span>
              <el-space>
                <el-upload :show-file-list="false" accept=".xlsx,.xls" :http-request="onImportVehicles">
                  <el-button size="small" :loading="importLoading">导入</el-button>
                </el-upload>
                <el-button type="primary" size="small" icon="Plus" @click="onCreateVehicle">新增车辆</el-button>
              </el-space>
            </div>
          </template>
          <el-table :data="vehicles" border>
            <el-table-column prop="plateNo" label="车牌" width="110" />
            <el-table-column prop="vehicleDesc" label="车辆" />
            <el-table-column prop="riskLevel" label="风险" width="90" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="source" label="来源" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="scope">
                <el-button link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" @click="onToggleVehicle(scope.row)">
                  {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <PatrolPagination
            v-model:page="vehiclePager.page"
            v-model:page-size="vehiclePager.pageSize"
            :total="vehiclePager.total"
            @change="onReload"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="importResult"
      class="mt-[12px]"
      :type="importResult.failed > 0 ? 'warning' : 'success'"
      :title="importResult.message"
      show-icon
      :closable="false"
    >
      <template v-if="importResult.errors?.length" #default>
        <div v-for="item in importResult.errors.slice(0, 5)" :key="`${item.rowNo}-${item.reason}`">
          第 {{ item.rowNo }} 行：{{ item.reason }}
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import type { ControlImportResult, ControlPerson, ControlVehicle } from '@/api/patrol/types';
import PatrolPagination from '@/views/patrol/components/common/PatrolPagination.vue';
import type { PatrolPaginationState } from '@/views/patrol/composables/usePatrolPagination';

defineProps<{
  persons: ControlPerson[];
  vehicles: ControlVehicle[];
  personPager: PatrolPaginationState;
  vehiclePager: PatrolPaginationState;
  importResult?: ControlImportResult;
  importLoading: boolean;
  section?: 'all' | 'persons' | 'vehicles';
  faceUploadLoading: Record<string, boolean>;
  assetUrl: (url?: string) => string;
  onReload: () => void | Promise<void>;
  onImportPersons: (options: any) => void | Promise<void>;
  onImportVehicles: (options: any) => void | Promise<void>;
  onCreatePerson: () => void | Promise<void>;
  onCreateVehicle: () => void | Promise<void>;
  onTogglePerson: (row: ControlPerson) => void | Promise<void>;
  onToggleVehicle: (row: ControlVehicle) => void | Promise<void>;
  onUploadPersonFace: (row: ControlPerson, options: any) => void | Promise<void>;
}>();
</script>

<style lang="scss" scoped>
.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.face-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #f3f4f6;
}

.inline-upload {
  display: inline-flex;
}
</style>
