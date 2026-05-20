import EmptyState from '@/components/EmptyState';
import { DashboardMetricsSection } from '@/components/DashboardMetricsSection';
import ChartGrid from '@/components/ChartGrid';
import { TimeRange, ChartItem, ChartAttribute } from '@/types/charts';
import ChartToolbar from './ChartToolbar';

interface DashboardContentProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  displayCharts: ChartItem[];
  onAddChart: (deviceId: string, attribute: ChartAttribute) => Promise<void>;
  onDeleteChart: (id: string) => void;
  summary: { totalSites: number };
  dashboardName: string;
  isAdding: boolean;
}

export function DashboardContent({
  timeRange,
  onTimeRangeChange,
  displayCharts,
  onAddChart,
  onDeleteChart,
  summary,
  dashboardName,
  isAdding,
}: DashboardContentProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <ChartToolbar
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          onAddChart={onAddChart}
          isAdding={isAdding}
        />
        <DashboardMetricsSection
          totalSites={summary.totalSites}
          totalWidgets={displayCharts.length}
        />
      </div>

      {displayCharts.length === 0 ? (
        <EmptyState
          title={`「${dashboardName}」目前尚無圖表`}
          description="請從上方選單挑選設備與屬性，點擊「新增圖表」組裝您的數據畫面。"
        />
      ) : (
        <ChartGrid items={displayCharts} timeRange={timeRange} onDelete={onDeleteChart} />
      )}
    </>
  );
}

DashboardContent.EmptyDashboard = function EmptyDashboard() {
  return (
    <EmptyState
      title="目前沒有任何監控儀表板"
      description="請利用右上角的輸入框建立一個場域來開始體驗！"
    />
  );
};
