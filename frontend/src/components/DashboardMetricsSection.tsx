import { MetricCard } from '@/components/ui/MetricCard';
import { Activity, Layers } from 'lucide-react';

interface DashboardMetricsSectionProps {
  totalSites: number;
  totalWidgets: number;
}

export function DashboardMetricsSection({
  totalSites,
  totalWidgets,
}: DashboardMetricsSectionProps) {
  return (
    <>
      <MetricCard
        title="監控場域站點"
        value={totalSites}
        unit="Sites"
        icon={Layers}
        trend={{ label: '資料同步中', type: 'neutral' }}
        tooltip="目前所架設的監控場域總數。"
      />
      <MetricCard
        title="當前監控圖表"
        value={totalWidgets}
        unit="Widgets"
        icon={Activity}
        trend={{ label: '即時數據刷新', type: 'success' }}
        tooltip="當前監控場域中已部署的監控圖表數量。"
      />
    </>
  );
}
