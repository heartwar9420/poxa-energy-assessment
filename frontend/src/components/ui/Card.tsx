'use client';

import React from 'react';

const CARD_BASE_CLASSES =
  'bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={[CARD_BASE_CLASSES, className].join(' ')} {...props}>
      {children}
    </div>
  );
}
