'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type NotificationType = 'success' | 'error';

export interface NotificationState {
  type: NotificationType;
  message: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showNotification = useCallback(
    (type: NotificationType, message: string, duration = 3000) => {
      clearTimer();

      setNotification({ type, message });

      if (type === 'success') {
        timerRef.current = setTimeout(() => {
          setNotification((current) => (current?.type === 'success' ? null : current));
        }, duration);
      }
    },
    [],
  );

  const clearNotification = useCallback(() => {
    clearTimer();
    setNotification(null);
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  return { notification, showNotification, clearNotification };
}
