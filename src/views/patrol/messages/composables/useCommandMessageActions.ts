import { listPatrolMessageReceipts, sendPatrolMessage } from '@/api/patrol';
import type { PatrolMessageReceipt } from '@/api/patrol/types';
import { ElMessage } from 'element-plus';
import type { Ref } from 'vue';

export const useCommandMessageActions = (
  form: Record<string, any>,
  receipts: Ref<PatrolMessageReceipt[]>,
  reload: () => void | Promise<void>
) => {
  const handleSendMessage = async () => {
    await sendPatrolMessage({ ...form });
    ElMessage.success('指挥消息已发送');
    await reload();
  };

  const handleLoadMessageReceipts = async (messageId: string) => {
    receipts.value = (await listPatrolMessageReceipts(messageId)).data;
  };

  return {
    handleSendMessage,
    handleLoadMessageReceipts
  };
};
