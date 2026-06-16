import {
  addPatrolSosNote,
  addPatrolSosRecording,
  assignPatrolSosBackup,
  closePatrolSos,
  listPatrolSosTimeline,
  notifyPatrolSosContact
} from '@/api/patrol';
import type { PatrolSosTimeline } from '@/api/patrol/types';
import { ElMessage } from 'element-plus';
import type { Ref } from 'vue';

export const useSosDispositionActions = (timeline: Ref<PatrolSosTimeline[]>, reload: () => void | Promise<void>) => {
  const handleLoadSosTimeline = async (sosId: string) => {
    timeline.value = (await listPatrolSosTimeline(sosId)).data;
  };

  const handleAssignSosBackup = async (sosId: string) => {
    const result = (
      await assignPatrolSosBackup(sosId, {
        contactName: '巡逻组 A-42',
        contactPhone: '110-PTL-A42',
        backupEtaMinutes: 5,
        note: '已指派最近警力前往增援'
      })
    ).data;
    ElMessage.success(result.message);
    await handleLoadSosTimeline(sosId);
    await reload();
  };

  const handleNotifySos = async (sosId: string) => {
    const result = (
      await notifyPatrolSosContact(sosId, {
        contactName: '值班指挥员',
        contactPhone: '0591-110000',
        note: '已同步SOS位置和现场状态'
      })
    ).data;
    ElMessage.success(result.message);
    await handleLoadSosTimeline(sosId);
  };

  const handleAddSosRecording = async (sosId: string) => {
    const result = (
      await addPatrolSosRecording(sosId, {
        fileId: `SOS-AUD-${Date.now()}`,
        fileName: 'SOS现场录音.m4a',
        note: '已关联端侧SOS录音附件'
      })
    ).data;
    ElMessage.success(result.message);
    await handleLoadSosTimeline(sosId);
  };

  const handleAddSosNote = async (sosId: string) => {
    const result = (await addPatrolSosNote(sosId, '平台端补充处置记录')).data;
    ElMessage.success(result.message);
    await handleLoadSosTimeline(sosId);
  };

  const handleCloseSos = async (sosId: string) => {
    const result = (await closePatrolSos(sosId)).data;
    if (result.status === 'CLOSED') {
      ElMessage.success(result.message);
    } else {
      ElMessage.warning(result.message);
    }
    await handleLoadSosTimeline(sosId);
    await reload();
  };

  return {
    handleLoadSosTimeline,
    handleAssignSosBackup,
    handleNotifySos,
    handleAddSosRecording,
    handleAddSosNote,
    handleCloseSos
  };
};
