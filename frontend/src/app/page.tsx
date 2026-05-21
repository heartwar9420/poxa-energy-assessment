'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import DashboardTabs from '@/components/DashboardTabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineNotification } from '@/components/ui/InlineNotification';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DeleteDashboardButton } from '@/components/DeleteDashboardButton';
import { DashboardContent } from '@/components/DashboardContent';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { useCharts } from '@/hooks/useCharts';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { TimeRange } from '@/types/charts';

function DashboardInner() {
  const {
    dashboards,
    currentDbId,
    currentDb,
    isDashboardsLoading,
    isCreating,
    isDeleting,
    notification,
    clearNotification,
    handleCreate,
    selectDashboard,
    confirmDelete,
    updateDashboardName,
    isConfirmOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useDashboardActions();
  const { charts: displayCharts, addChart, deleteChart, isAdding } = useCharts(currentDbId);
  const summary = useDashboardSummary(currentDbId);

  const [newDbName, setNewDbName] = useState('');
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    type: 'relative',
    value: '1h',
  });

  const dashboardName = currentDb?.name ?? '未命名儀表板';

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = newDbName.trim();

    if (!trimmedName || isCreating) {
      return;
    }

    const success = await handleCreate(trimmedName);
    if (success) setNewDbName('');
  };

  const handleSaveRename = async (id: string, newName: string): Promise<boolean> => {
    return await updateDashboardName(id, newName);
  };

  if (isDashboardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 animate-pulse">
        儲能系統載入中...
      </div>
    );
  }

  return (
    <main className="p-8 bg-linear-to-b from-slate-50 to-white min-h-screen antialiased">
      <div className="max-w-7xl mx-auto space-y-10">
        <InlineNotification notification={notification} onClose={clearNotification} />

        <DashboardTabs
          dashboards={dashboards}
          currentDbId={currentDbId}
          newDbName={newDbName}
          onSelectDashboard={selectDashboard}
          onNewDbNameChange={setNewDbName}
          onCreateDashboard={handleCreateSubmit}
          isCreating={isCreating}
          editingDbId={editingDbId}
          onStartRename={(id) => setEditingDbId(id)}
          onCancelRename={() => setEditingDbId(null)}
          onSaveRename={handleSaveRename}
        />

        {dashboards.length === 0 ? (
          <DashboardContent.EmptyDashboard />
        ) : (
          <>
            <PageHeader
              title={dashboardName}
              subtitle="儲能資產管理與電網數據即時監控中心"
              action={
                <DeleteDashboardButton isDeleting={isDeleting} onDelete={openDeleteConfirm} />
              }
            />

            <DashboardContent
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              displayCharts={displayCharts}
              onAddChart={addChart}
              onDeleteChart={deleteChart}
              summary={summary}
              dashboardName={dashboardName}
              isAdding={isAdding}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`確定要刪除「${dashboardName}」嗎？`}
        description="本操作屬破壞性操作且無法復原。"
        confirmText="確定刪除"
        cancelText="留著好了"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteConfirm}
      />
    </main>
  );
}

const Dashboard = dynamic(() => Promise.resolve(DashboardInner), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 animate-pulse">
      儲能資產環境初始化中...
    </div>
  ),
});

export default Dashboard;
