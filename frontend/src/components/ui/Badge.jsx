import React from 'react';

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-800 border-orange-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-xs',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-full border';
  const variantClass = variantStyles[variant] || variantStyles.default;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <span className={`${base} ${variantClass} ${sizeClass} ${className}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-emerald-500'
              : variant === 'danger'
              ? 'bg-rose-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : variant === 'purple'
              ? 'bg-purple-500'
              : variant === 'sky'
              ? 'bg-sky-500'
              : 'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
