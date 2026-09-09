import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { selectToasts, removeToast } from '../../store/slices/notificationSlice';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
};

const toastBorders = {
  success: 'border-emerald-200 bg-white shadow-emerald-500/5',
  error: 'border-rose-200 bg-white shadow-rose-500/5',
  warning: 'border-amber-200 bg-white shadow-amber-500/5',
  info: 'border-brand-200 bg-white shadow-brand-500/5',
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
        toastBorders[toast.type] || toastBorders.info
      }`}
      role="alert"
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1 text-sm font-medium text-slate-800 break-words">
        {toast.message}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useSelector(selectToasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export default ToastContainer;
