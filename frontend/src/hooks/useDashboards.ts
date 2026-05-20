'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../lib/configs';

export interface DashboardItem {
  id: string;
  name: string;
}

export function useDashboards() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDbId = searchParams.get('dbId');
  const queryClient = useQueryClient();

  const { data: dashboards = [], isLoading } = useQuery<DashboardItem[]>({
    queryKey: ['dashboards'],
    queryFn: async (): Promise<DashboardItem[]> => {
      const res = await fetch(`${API_BASE_URL}/dashboards`);
      if (!res.ok) throw new Error('無法取得看板');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isLoading || dashboards.length === 0) return;

    const isInvalidDbId = currentDbId && !dashboards.some((db) => db.id === currentDbId);

    if (!currentDbId || isInvalidDbId) {
      router.replace(`${pathname}?dbId=${dashboards[0].id}`);
    }
  }, [isLoading, dashboards, currentDbId, pathname, router]);

  const createMutation = useMutation({
    mutationFn: async (name: string): Promise<DashboardItem> => {
      const response = await fetch(`${API_BASE_URL}/dashboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('建立失敗');
      return response.json();
    },
    onSuccess: (newDb) => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      router.push(`${pathname}?dbId=${newDb.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<DashboardItem> => {
      const response = await fetch(`${API_BASE_URL}/dashboards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('重命名失敗');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!currentDbId) throw new Error('未指定要刪除的看板');
      const response = await fetch(`${API_BASE_URL}/dashboards/${currentDbId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('刪除失敗');
      return true;
    },
    onSuccess: () => {
      const currentDbs = queryClient.getQueryData<DashboardItem[]>(['dashboards']) || [];
      const updatedDbs = currentDbs.filter((db) => db.id !== currentDbId);

      queryClient.invalidateQueries({ queryKey: ['dashboards'] });

      if (updatedDbs.length > 0) {
        router.push(`${pathname}?dbId=${updatedDbs[0].id}`);
      } else {
        router.push(pathname);
      }
    },
  });

  const selectDashboard = (id: string) => {
    if (id === currentDbId) return;
    router.push(`${pathname}?dbId=${id}`);
  };

  const currentDb = dashboards.find((db) => db.id === currentDbId);

  return {
    dashboards,
    currentDbId,
    currentDb,
    isLoading,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRenaming: updateMutation.isPending,

    createDashboard: async (name: string) => {
      if (!name.trim()) return false;
      try {
        await createMutation.mutateAsync(name);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    updateDashboardName: async (id: string, name: string) => {
      if (!name.trim()) return false;
      try {
        await updateMutation.mutateAsync({ id, name });
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    deleteDashboard: async () => {
      try {
        await deleteMutation.mutateAsync();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    selectDashboard,
  };
}
