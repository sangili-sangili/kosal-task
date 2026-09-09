import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-subtle focus-visible:ring-slate-900 border border-transparent',
  accent: 'bg-brand-600 hover:bg-brand-700 text-white shadow-subtle focus-visible:ring-brand-500 border border-transparent',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-subtle focus-visible:ring-slate-400',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-slate-400',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-400 border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-subtle focus-visible:ring-rose-500 border border-transparent',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded gap-1',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-lg gap-2.5',
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      type = 'button',
      className = '',
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';
    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    const renderIcon = (icon) => {
      if (!icon) return null;
      if (React.isValidElement(icon)) return icon;
      const IconComponent = icon;
      return <IconComponent className="w-4 h-4 shrink-0" />;
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${base} ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          renderIcon(LeftIcon)
        )}
        {children && <span>{children}</span>}
        {!isLoading && renderIcon(RightIcon)}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
