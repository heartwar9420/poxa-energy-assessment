import { TimeRange } from '@/types/charts';

export const formatTimeByRange = (isoString: string, timeRange: TimeRange): string => {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;

    const pad = (n: number) => String(n).padStart(2, '0');

    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());

    if (timeRange.type === 'relative') {
      if (timeRange.value === '7d' || timeRange.value === '30d') {
        const M = pad(date.getMonth() + 1);
        const d = pad(date.getDate());
        return `${M}-${d} ${h}:${m}`;
      }
      return `${h}:${m}:${s}`;
    }

    const M = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${M}-${d} ${h}:${m}`;
  } catch {
    return isoString;
  }
};
