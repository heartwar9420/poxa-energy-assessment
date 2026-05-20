'use client';

import { Trash2 } from 'lucide-react';

interface DeleteDashboardButtonProps {
  isDeleting: boolean;
  onDelete: () => void;
}

export function DeleteDashboardButton({ isDeleting, onDelete }: DeleteDashboardButtonProps) {
  const buttonClasses = [
    'inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors duration-200',
    isDeleting
      ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
      : 'text-rose-600 bg-rose-50/50 hover:bg-rose-50 border-rose-100',
  ].join(' ');

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isDeleting}
      aria-busy={isDeleting}
      className={buttonClasses}
    >
      <Trash2 className="w-3.5 h-3.5" />
      {isDeleting ? '刪除中...' : '刪除此儀表板'}
    </button>
  );
}
