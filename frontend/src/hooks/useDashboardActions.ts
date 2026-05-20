'use client';

import { useState } from 'react';
import { useDashboards } from '@/hooks/useDashboards';
import { useNotification } from '@/hooks/useNotification';

export function useDashboardActions() {
  const {
    dashboards,
    currentDbId,
    currentDb,
    isLoading: isDashboardsLoading,
    isCreating,
    isDeleting,
    createDashboard,
    deleteDashboard,
    selectDashboard,
    updateDashboardName,
    isRenaming: isRenamingDashboard,
  } = useDashboards();

  const { notification, showNotification, clearNotification } = useNotification();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openDeleteConfirm = () => setIsConfirmOpen(true);
  const closeDeleteConfirm = () => setIsConfirmOpen(false);

  const handleCreate = async (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName || isCreating) {
      return false;
    }

    clearNotification();

    try {
      const success = await createDashboard(trimmedName);
      if (success) {
        showNotification('success', `成功建立儀表板「${trimmedName}」！`);
        return true;
      }
      showNotification('error', '建立儀表板失敗，請檢查後端服務是否正常。');
    } catch (err) {
      console.error('建立儀表板發生例外錯誤:', err);
      showNotification('error', '網路連線異常，無法建立儀表板。');
    }
    return false;
  };

  const confirmDelete = async () => {
    if (!currentDb || isDeleting) return false;

    closeDeleteConfirm();

    try {
      const success = await deleteDashboard();
      if (success) {
        showNotification('success', `已成功刪除儀表板「${currentDb.name}」及其關聯圖表。`);
        return true;
      }
      showNotification('error', '資料庫刪除作業失敗，請稍後再試。');
      return false;
    } catch (err) {
      console.error('刪除儀表板發生例外錯誤:', err);
      showNotification('error', '網路連線異常，資料庫刪除作業失敗。');
      return false;
    }
  };

  return {
    dashboards,
    currentDbId,
    currentDb,
    isDashboardsLoading,
    isCreating,
    isDeleting,
    notification,
    clearNotification,
    isConfirmOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleCreate,
    confirmDelete,
    selectDashboard,
    updateDashboardName,
    isRenaming: isRenamingDashboard,
  };
}
