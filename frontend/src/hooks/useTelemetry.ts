'use client';

import { useState, useEffect } from 'react';
import { telemetrySocket, BackendTelemetry } from '../lib/websocket';
import { ChartAttribute, TimeRange } from '@/types/charts';
import { formatTimeByRange } from '@/utils/formatters';
import { API_BASE_URL } from '@/lib/configs';

export interface UseTelemetryOptions {
  pause?: boolean;
  timeRange?: TimeRange;
}

interface TelemetryPoint {
  timestamp: string;
  timeLabel: string;
  value: number;
}

export function useTelemetry(
  deviceId: string,
  attribute: ChartAttribute,
  options?: UseTelemetryOptions,
) {
  const [chartData, setChartData] = useState<TelemetryPoint[]>([]);

  const { pause = false, timeRange = { type: 'relative', value: '1h' } } = options || {};

  const trType = timeRange.type;
  const trValue = timeRange.type === 'relative' ? timeRange.value : undefined;
  const trStart = timeRange.type === 'custom' ? timeRange.start : undefined;
  const trEnd = timeRange.type === 'custom' ? timeRange.end : undefined;

  useEffect(() => {
    if (pause) return;

    let isMounted = true;

    const isRealTime = trType === 'relative' && (trValue === '1h' || trValue === '24h');

    const activeTimeRange = (
      trType === 'relative'
        ? { type: 'relative', value: trValue }
        : { type: 'custom', start: trStart, end: trEnd }
    ) as TimeRange;

    const loadHistory = async () => {
      try {
        const params = new URLSearchParams({
          deviceId,
          attribute,
          type: trType,
        });

        if (trType === 'relative' && trValue) {
          params.append('range', trValue);
        } else if (trType === 'custom' && trStart && trEnd) {
          params.append('start', trStart);
          params.append('end', trEnd);
        }

        const res = await fetch(`${API_BASE_URL}/telemetry/history?${params.toString()}`);

        if (!res.ok) return;

        const history: BackendTelemetry[] = await res.json();

        if (isMounted && Array.isArray(history)) {
          const cleanedHistory = history
            .map((h) => ({
              timestamp: h.timestamp,
              timeLabel: formatTimeByRange(h.timestamp, activeTimeRange),
              value: Number(h.value),
            }))
            .filter((point) => !Number.isNaN(point.value));

          setChartData(cleanedHistory);
        }
      } catch (err) {
        console.error('歷史資料載入失敗:', err);
      }
    };

    loadHistory();

    let unsubscribe = () => {};

    if (isRealTime) {
      unsubscribe = telemetrySocket.subscribe(deviceId, attribute, (data) => {
        if (!isMounted) return;

        const parsedValue = Number(data.value);
        if (Number.isNaN(parsedValue)) return;

        const timeLabel = formatTimeByRange(data.timestamp, activeTimeRange);

        setChartData((prevData) => {
          if (prevData.length > 0) {
            const lastPoint = prevData[prevData.length - 1];
            if (lastPoint.timestamp === data.timestamp && lastPoint.value === parsedValue) {
              return prevData;
            }
          }

          const nextData = [
            ...prevData,
            { timestamp: data.timestamp, timeLabel, value: parsedValue },
          ];

          const maxPoints = trType === 'relative' && trValue === '24h' ? 200 : 30;
          return nextData.slice(-maxPoints);
        });
      });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [deviceId, attribute, pause, trType, trValue, trStart, trEnd]);

  return chartData;
}
