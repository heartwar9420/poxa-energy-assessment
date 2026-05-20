'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartItem, ChartAttribute } from '@/types/charts';
import { API_BASE_URL } from '../lib/configs';

export function useCharts(currentDbId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['charts', currentDbId];

  const {
    data: charts = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!currentDbId) return [];
      const res = await fetch(`${API_BASE_URL}/charts?dashboardId=${currentDbId}`, { signal });
      if (!res.ok) throw new Error('API 回傳狀態異常');
      return res.json() as Promise<ChartItem[]>;
    },
    enabled: !!currentDbId,
  });

  const addMutation = useMutation({
    mutationFn: async (variables: { deviceId: string; attribute: ChartAttribute }) => {
      const res = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...variables, dashboardId: currentDbId }),
      });
      if (!res.ok) throw new Error('新增圖表失敗');
      return res.json() as Promise<ChartItem>;
    },
    onMutate: async (newChartVariables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCharts = queryClient.getQueryData<ChartItem[]>(queryKey);

      const tempId = 'temp-chart-' + Date.now();
      const optimisticChart = {
        id: tempId,
        dashboardId: currentDbId!,
        ...newChartVariables,
      } as ChartItem;

      queryClient.setQueryData<ChartItem[]>(queryKey, (old) => [...(old || []), optimisticChart]);

      return { previousCharts, tempId };
    },
    onError: (err, variables, context) => {
      if (context?.previousCharts) {
        queryClient.setQueryData(queryKey, context.previousCharts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/charts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('刪除圖表失敗');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCharts = queryClient.getQueryData<ChartItem[]>(queryKey);

      queryClient.setQueryData<ChartItem[]>(
        queryKey,
        (old) => old?.filter((chart) => chart.id !== id) || [],
      );

      return { previousCharts };
    },
    onError: (err, id, context) => {
      if (context?.previousCharts) {
        queryClient.setQueryData(queryKey, context.previousCharts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    charts: currentDbId ? charts : [],
    isLoading,
    fetchError: fetchError ? '無法取得圖表資料' : null,
    isAdding: addMutation.isPending,
    deletingIds: deleteMutation.isPending ? [deleteMutation.variables] : [],
    mutationError: addMutation.error?.message || deleteMutation.error?.message || null,
    addChart: (deviceId: string, attribute: ChartAttribute) =>
      addMutation.mutate({ deviceId, attribute }),
    deleteChart: (id: string) => deleteMutation.mutate(id),
  };
}
