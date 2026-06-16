import { acknowledgeAlert, closeAlert, listAlertDispositions } from '@/api/patrol';
import type { PatrolAlertDisposition } from '@/api/patrol/types';
import { ElMessage } from 'element-plus';
import type { Ref } from 'vue';

export const useAlertDispositionActions = (dispositions: Ref<PatrolAlertDisposition[]>, reload: () => void | Promise<void>) => {
  const handleAck = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    ElMessage.success('预警已确认');
    await reload();
  };

  const handleClose = async (alertId: string) => {
    await closeAlert(alertId, 'RESOLVED', '平台端处置闭环');
    ElMessage.success('预警已关闭');
    await reload();
  };

  const handleLoadAlertDispositions = async (alertId: string) => {
    dispositions.value = (await listAlertDispositions(alertId)).data;
  };

  return {
    handleAck,
    handleClose,
    handleLoadAlertDispositions
  };
};
