'use client';

import React, { useMemo, useRef } from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useVisibility } from '@/hooks/useVisibility';
import { buildChartOption } from '@/lib/chart/buildChartOption';

import ChartRenderer from './ChartRenderer';
import ChartSkeleton from './ChartSkeleton';
import { ChartAttribute, TimeRange } from '@/types/charts';

interface ChartWidgetProps {
  id: string;
  deviceId: string;
  attribute: ChartAttribute;
  timeRange: TimeRange;
  onDelete: (id: string) => void;
}

const CHART_HEIGHT = '350px';

export default function ChartWidget({
  id,
  deviceId,
  attribute,
  timeRange,
  onDelete,
}: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useVisibility(containerRef);

  const chartData = useTelemetry(deviceId, attribute, {
    pause: !isVisible,
    timeRange,
  });

  const chartOption = useMemo(() => {
    if (!isVisible || !chartData || chartData.length === 0) {
      return null;
    }

    const { times, values } = chartData.reduce(
      (acc, item) => {
        acc.times.push(item.timeLabel);
        acc.values.push(item.value);
        return acc;
      },
      { times: [] as string[], values: [] as number[] },
    );

    return buildChartOption({
      deviceId,
      attribute,
      times,
      values,
      timeRange,
    });
  }, [isVisible, chartData, deviceId, attribute, timeRange]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        onClick={() => onDelete(id)}
        aria-label="刪除圖表"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
      >
        ✕
      </button>

      {chartOption ? (
        <ChartRenderer option={chartOption} height={CHART_HEIGHT} />
      ) : (
        <ChartSkeleton height={CHART_HEIGHT} />
      )}
    </div>
  );
}
