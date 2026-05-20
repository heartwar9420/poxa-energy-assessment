import { ATTRIBUTE_OPTIONS } from '@/constants/dashboard';

export type ChartAttribute = (typeof ATTRIBUTE_OPTIONS)[number]['value'];

export interface ChartItem {
  id: string;
  deviceId: string;
  attribute: ChartAttribute;
}

export type RelativeTimeRange = '1h' | '24h' | '7d' | '30d';

export interface RelativeRange {
  type: 'relative';
  value: RelativeTimeRange;
}

export interface CustomRange {
  type: 'custom';
  start: string;
  end: string;
}

export type TimeRange = RelativeRange | CustomRange;
