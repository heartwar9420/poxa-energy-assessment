'use client';

import { useState, useEffect } from 'react';
import { ChartItem, ChartAttribute } from '@/types/charts';
import { API_BASE_URL } from '../lib/configs';

export function useCharts(currentDbId: string | null) {
  const [charts, setCharts] = useState<ChartItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentDbId) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchChartsData = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/charts?dashboardId=${currentDbId}`, { signal });

        if (!res.ok) {
          throw new Error('API 回傳狀態異常');
        }

        const data = (await res.json()) as ChartItem[];
        setCharts(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('無法取得圖表資料:', err);
        setFetchError('無法取得圖表資料，請稍後再試');
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchChartsData();

    return () => {
      controller.abort();
    };
  }, [currentDbId]);

  const addChart = async (deviceId: string, attribute: ChartAttribute) => {
    if (!currentDbId || isAdding) return;

    setIsAdding(true);
    setMutationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, attribute, dashboardId: currentDbId }),
      });

      if (!response.ok) {
        throw new Error('新增圖表失敗: API 狀態異常');
      }

      const newChart = (await response.json()) as ChartItem;
      setCharts((prev) => [...prev, newChart]);
    } catch (err) {
      console.error('新增圖表失敗:', err);
      setMutationError('新增圖表失敗，請稍後再試');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteChart = async (id: string) => {
    if (deletingIds.includes(id)) return;

    setDeletingIds((prev) => [...prev, id]);
    setMutationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/charts/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('刪除圖表失敗: API 狀態異常');
      }

      setCharts((prev) => prev.filter((chart) => chart.id !== id));
    } catch (err) {
      console.error('刪除圖表失敗:', err);
      setMutationError('刪除圖表失敗，請稍後再試');
    } finally {
      setDeletingIds((prev) => prev.filter((prevId) => prevId !== id));
    }
  };

  return {
    charts: currentDbId ? charts : [],
    isLoading,
    fetchError,
    isAdding,
    deletingIds,
    mutationError,
    addChart,
    deleteChart,
  };
}
