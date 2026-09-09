import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function ErrorState({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl bg-rose-50/50 border border-rose-200 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900">{title}</h3>
      <p className="mt-1 text-sm text-rose-600/90 max-w-md">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={RefreshCw}
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
