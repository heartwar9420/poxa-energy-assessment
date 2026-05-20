import ChartWidget from '@/components/ChartWidget';
import { ChartItem, TimeRange } from '@/types/charts';

interface ChartGridProps {
  items: ChartItem[];
  timeRange: TimeRange;
  onDelete: (id: string) => void;
}

export default function ChartGrid({ items, timeRange, onDelete }: ChartGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {items.map((item) => (
        <ChartWidget
          key={`${item.id}-${item.deviceId}-${item.attribute}-${timeRange.type}-${timeRange.value || 'custom'}`}
          id={item.id}
          deviceId={item.deviceId}
          attribute={item.attribute}
          timeRange={timeRange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
