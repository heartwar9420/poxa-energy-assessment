'use client';

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/configs';

interface SummaryData {
  totalSites: number;
  totalWidgets: number;
}

export function useDashboardSummary(currentDbId: string | null) {
  const { data, isLoading, isError, error } = useQuery<SummaryData>({
    queryKey: ['dashboardSummary', currentDbId],

    queryFn: async (): Promise<SummaryData> => {
      const res = await fetch(`${API_BASE_URL}/dashboards/${currentDbId!}/summary`);

      if (!res.ok) {
        throw new Error('無法取得摘要資料');
      }
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,

    enabled: !!currentDbId,

    placeholderData: (previousData) => {
      return previousData ?? { totalSites: 0, totalWidgets: 0 };
    },
  });

  return {
    totalSites: data?.totalSites ?? 0,
    totalWidgets: data?.totalWidgets ?? 0,

    isLoading,
    isError,
    error,
  };
}
