'use client';

import React, { useId } from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface TrendProps {
  label: string;
  type: 'success' | 'danger' | 'neutral';
}

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: TrendProps;
  tooltip?: string;
}

const TREND_STYLES = {
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
  danger: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400',
  neutral: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400',
};

const numberFormatter = new Intl.NumberFormat('zh-TW');

const formatNumber = (val: number | string): string => {
  if (typeof val === 'string') return val;
  if (Number.isNaN(val)) return '0';
  return numberFormatter.format(val);
};

export function MetricCard({ title, value, unit, icon: Icon, trend, tooltip }: MetricCardProps) {
  const tooltipId = useId();

  return (
    <div className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between min-h-35">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <span>{title}</span>

          {tooltip && (
            <div className="relative flex items-center">
              <button
                type="button"
                aria-describedby={tooltipId}
                className="text-slate-300 hover:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-full cursor-help"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              <div
                id={tooltipId}
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block w-48 rounded-lg bg-slate-900 p-2 text-xs font-normal text-white shadow-xl z-20 pointer-events-none"
              >
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-2 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors duration-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5 h-10">
        <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {formatNumber(value)}
        </span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>

      {trend && (
        <div className="mt-4 flex items-center">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TREND_STYLES[trend.type]}`}
          >
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
