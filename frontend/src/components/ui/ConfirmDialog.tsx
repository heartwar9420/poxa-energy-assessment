'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';

const STYLES = {
  OVERLAY_BASE:
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs',
  ANIMATION: 'animate-in duration-200 fade-in',
  PANEL:
    'w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-xl space-y-6 zoom-in-95 cursor-default',
  ICON_CONTAINER: 'p-3 rounded-xl shrink-0',
  CANCEL_BTN:
    'px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50',
  CONFIRM_BTN_BASE:
    'px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm shrink-0',
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogTitleId = useId();
  const dialogDescId = useId();

  const isDanger = variant === 'danger';
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const focusableElements = getFocusableElements(dialogRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const currentElements = getFocusableElements(dialogRef.current);
        if (currentElements.length === 0) return;

        const firstElement = currentElements[0];
        const lastElement = currentElements[currentElements.length - 1];
        const activeElement = document.activeElement;

        if (!dialogRef.current?.contains(activeElement)) {
          if (e.shiftKey) lastElement.focus();
          else firstElement.focus();
          e.preventDefault();
          return;
        }

        if (e.shiftKey && activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isMounted || !isOpen) return null;

  const IconComponent = isDanger ? AlertTriangle : Info;

  const confirmBtnClasses = [
    STYLES.CONFIRM_BTN_BASE,
    isLoading && 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200',
    !isLoading && isDanger && 'bg-rose-600 text-white hover:bg-rose-700 active:scale-98',
    !isLoading && !isDanger && 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98',
  ]
    .filter(Boolean)
    .join(' ');

  const handleBackdropClick = () => {
    if (!isLoading) onCancel();
  };

  const dialogLayout = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      aria-describedby={dialogDescId}
      onClick={handleBackdropClick}
      className={`${STYLES.OVERLAY_BASE} ${STYLES.ANIMATION} ${isLoading ? 'cursor-not-allowed' : ''}`}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`${STYLES.PANEL} ${STYLES.ANIMATION}`}
      >
        <div className="flex gap-4 items-start">
          <div
            className={`${STYLES.ICON_CONTAINER} ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <h3 id={dialogTitleId} className="text-base font-bold text-slate-900">
              {title}
            </h3>
            <p id={dialogDescId} className="text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={STYLES.CANCEL_BTN}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmBtnClasses}
          >
            {isLoading ? '處理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogLayout, document.body);
}
