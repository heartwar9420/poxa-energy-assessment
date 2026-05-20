'use client';

import React, { useState, useId } from 'react';
import { DEVICE_OPTIONS, ATTRIBUTE_OPTIONS } from '@/constants/dashboard';
import { ChartAttribute, TimeRange } from '@/types/charts';

interface ChartToolbarProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onAddChart: (deviceId: string, attribute: ChartAttribute) => void;
  isAdding: boolean;
}

const SELECT_CLASSES =
  'block w-56 p-2.5 text-sm border border-slate-200 rounded-xl shadow-xs text-slate-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-200 transition-shadow';

export default function ChartToolbar({ onAddChart, isAdding }: ChartToolbarProps) {
  const deviceSelectId = useId();
  const attributeSelectId = useId();

  const [selectedDevice, setSelectedDevice] = useState(DEVICE_OPTIONS[0].value);
  const [selectedAttribute, setSelectedAttribute] = useState<ChartAttribute>(
    ATTRIBUTE_OPTIONS[0].value as ChartAttribute,
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-6 items-end">
      <div className="space-y-2">
        <label
          htmlFor={deviceSelectId}
          className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
        >
          選擇設備 (Device)
        </label>
        <select
          id={deviceSelectId}
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className={SELECT_CLASSES}
        >
          {DEVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={attributeSelectId}
          className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
        >
          選擇屬性 (Attribute)
        </label>
        <select
          id={attributeSelectId}
          value={selectedAttribute}
          onChange={(e) => setSelectedAttribute(e.target.value as ChartAttribute)}
          className={SELECT_CLASSES}
        >
          {ATTRIBUTE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={isAdding}
        onClick={() => onAddChart(selectedDevice, selectedAttribute)}
        className={`text-white text-xs font-semibold py-2.5 px-6 rounded-xl shadow-xs transition-all shrink-0 active:scale-98
          ${
            isAdding
              ? 'bg-blue-400 cursor-not-allowed opacity-70 scale-95'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isAdding ? '連線中...' : '新增圖表'}
      </button>
    </div>
  );
}
