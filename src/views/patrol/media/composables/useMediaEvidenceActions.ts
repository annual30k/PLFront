import { cleanPatrolMediaUploadTasks, deletePatrolMedia, downloadPatrolMedia, verifyPatrolMedia } from '@/api/patrol';
import type { PatrolMedia } from '@/api/patrol/types';
import { ElMessage } from 'element-plus';

interface MediaPreviewState {
  visible: boolean;
  title: string;
  kind: string;
  url: string;
  sha256: string;
  watermarkToken: string;
}

export const useMediaEvidenceActions = (preview: MediaPreviewState, reload: () => void | Promise<void>) => {
  const clearMediaPreview = () => {
    if (preview.url) {
      URL.revokeObjectURL(preview.url);
    }
    preview.url = '';
    preview.title = '';
    preview.sha256 = '';
    preview.watermarkToken = '';
  };

  const handleVerifyMedia = async (fileId: string) => {
    const result = (await verifyPatrolMedia(fileId)).data;
    ElMessage.success(result.message);
    await reload();
  };

  const handlePreviewMedia = async (row: PatrolMedia) => {
    clearMediaPreview();
    const blob = (await downloadPatrolMedia(row.fileId)) as unknown as Blob;
    preview.visible = true;
    preview.title = row.fileName;
    preview.kind = row.mediaType;
    preview.url = URL.createObjectURL(blob);
    preview.sha256 = row.sha256 || '';
    preview.watermarkToken = row.watermarkToken || '';
  };

  const handleDownloadMedia = async (row: PatrolMedia) => {
    const blob = (await downloadPatrolMedia(row.fileId)) as unknown as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = row.fileName || `${row.fileId}.bin`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMedia = async (fileId: string) => {
    const result = (await deletePatrolMedia(fileId)).data;
    if (result.status === 'DELETED') {
      ElMessage.success(result.message);
    } else {
      ElMessage.warning(result.message);
    }
    await reload();
  };

  const handleCleanUploadTasks = async () => {
    const result = (await cleanPatrolMediaUploadTasks()).data;
    ElMessage.success(`${result.message}：${result.cleaned}`);
    await reload();
  };

  return {
    clearMediaPreview,
    handleVerifyMedia,
    handlePreviewMedia,
    handleDownloadMedia,
    handleDeleteMedia,
    handleCleanUploadTasks
  };
};
