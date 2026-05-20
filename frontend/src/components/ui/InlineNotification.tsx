'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

interface InlineNotificationProps {
  notification: NotificationState | null;
  onClose: () => void;
}
const VARIANT_MAP = {
  success: {
    role: 'status',
    container: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    iconColor: 'text-emerald-600',
    closeButton: 'hover:bg-emerald-100/60 text-emerald-600 focus:ring-emerald-500',
    Icon: CheckCircle2,
  },
  error: {
    role: 'alert',
    container: 'bg-rose-50 border-rose-100 text-rose-800',
    iconColor: 'text-rose-600',
    closeButton: 'hover:bg-rose-100/60 text-rose-600 focus:ring-rose-500',
    Icon: AlertCircle,
  },
} as const;

const BASE_CONTAINER_CLASSES =
  'flex items-start justify-between p-4 rounded-xl border text-sm shadow-xs animate-in fade-in slide-in-from-top-2 duration-200';

export function InlineNotification({ notification, onClose }: InlineNotificationProps) {
  if (!notification) return null;

  const currentConfig = VARIANT_MAP[notification.type];
  const { Icon, role, container, iconColor, closeButton } = currentConfig;

  const containerClasses = [BASE_CONTAINER_CLASSES, container].join(' ');

  return (
    <div role={role} className={containerClasses}>
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />

        <p className="font-medium wrap-break-word w-full leading-5">{notification.message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={`p-1 rounded-lg transition-colors shrink-0 mt-0.5 ml-2 focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${closeButton}`}
        title="關閉提示"
        aria-label="關閉通知"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
