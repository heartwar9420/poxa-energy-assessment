'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
      <div className="space-y-1.5">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm font-medium text-slate-400">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center gap-3 shrink-0 md:self-center">{action}</div>}
    </div>
  );
}
