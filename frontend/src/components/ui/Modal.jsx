import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZE_MAP = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

export function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size = 'md',
  showClose = true,
  showCloseButton = true,
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;
  const resolvedWidth = maxWidth || SIZE_MAP[size] || 'max-w-lg';
  const shouldShowClose = showClose && showCloseButton;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Body */}
      <div
        className={`relative w-full ${resolvedWidth} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-10 transition-all duration-150 animate-in zoom-in-95 my-auto ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Pinned Header */}
        {(title || shouldShowClose) && (
          <div className="shrink-0 flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
            <div className="pr-4">
              {title && <h3 className="text-base font-semibold text-slate-900 leading-tight">{title}</h3>}
              {description && <p className="text-xs text-slate-500 mt-1 leading-normal">{description}</p>}
            </div>
            {shouldShowClose && (
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
}

export default Modal;

