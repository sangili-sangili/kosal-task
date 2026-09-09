import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm focus-visible:ring-brand-500 border border-transparent',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus-visible:ring-slate-400 border border-slate-200',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-brand-500',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500 border border-transparent',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-400 border border-transparent',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-md gap-1.5',
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
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100';
    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;

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
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          renderIcon(LeftIcon)
        )}
        <span>{children}</span>
        {!isLoading && renderIcon(RightIcon)}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
