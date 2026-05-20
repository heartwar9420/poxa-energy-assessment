'use client';

import React from 'react';

const BADGE_VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100/50',
  warning: 'bg-amber-50 text-amber-700 border-amber-100/50',
  error: 'bg-rose-50 text-rose-700 border-rose-100/50',
  neutral: 'bg-slate-50 text-slate-600 border-slate-100',
} as const;

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof BADGE_VARIANTS;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        BADGE_VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
