import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load the data. Please check your connection and try again.",
  onRetry = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl bg-rose-50/40 border border-rose-200/80 ${className}`}>
      <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900">{title}</h3>
      <p className="mt-1 text-xs text-rose-700/80 max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={RefreshCw}
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
