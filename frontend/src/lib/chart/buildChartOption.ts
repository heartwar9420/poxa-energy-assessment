import { ATTRIBUTE_COLORS, DEFAULT_COLOR } from '@/constants/charts';
import { ChartAttribute, TimeRange } from '@/types/charts';
import * as echarts from 'echarts';

interface BuildChartOptionProps {
  deviceId: string;
  attribute: ChartAttribute;
  times: string[];
  values: number[];
  timeRange: TimeRange;
}

export const buildChartOption = ({
  deviceId,
  attribute,
  times,
  values,
  timeRange,
}: BuildChartOptionProps): echarts.EChartsOption => {
  if (!attribute) {
    console.error(`發現錯誤資料！deviceId: ${deviceId}, attribute 的值是:`, attribute);
  }

  const themeColor = ATTRIBUTE_COLORS[attribute] ?? DEFAULT_COLOR;

  const isLargeDataset =
    timeRange.type === 'custom' ||
    (timeRange.type === 'relative' && (timeRange.value === '7d' || timeRange.value === '30d'));

  return {
    title: {
      text: `${deviceId} - ${attribute?.toUpperCase() ?? 'UNKNOWN'}`,
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
    },
    grid: {
      top: 45,
      bottom: 10,
      left: 10,
      right: 15,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
    },
    xAxis: {
      type: 'category',
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        interval: 'auto',
      },
      data: times,
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },

    animation: !isLargeDataset,
    animationDuration: isLargeDataset ? 0 : 300,

    series: [
      {
        name: attribute,
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.05 },
        color: themeColor,
        lineStyle: { width: 2.5 },
        data: values,
      },
    ],
  };
};
