import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria or available right now.',
  actionLabel = null,
  onAction = null,
  secondaryActionLabel = null,
  onSecondaryAction = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-white border border-dashed border-slate-200 ${className}`}>
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex items-center gap-2.5">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
