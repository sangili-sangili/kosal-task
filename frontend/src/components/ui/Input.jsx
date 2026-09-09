import React, { useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      id,
      name,
      placeholder,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      isSearch = false,
      onClear,
      className = '',
      required = false,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || name;
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const ResolvedLeftIcon = isSearch ? Search : LeftIcon;

    const renderIcon = (icon) => {
      if (!icon) return null;
      if (React.isValidElement(icon)) return icon;
      const IconComponent = icon;
      return <IconComponent className="h-4 w-4" />;
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg">
          {ResolvedLeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {renderIcon(ResolvedLeftIcon)}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={computedType}
            value={value}
            placeholder={placeholder}
            className={`block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 transition-colors
              ${ResolvedLeftIcon ? 'pl-9' : 'pl-3.5'}
              ${isPassword || RightIcon || (isSearch && value) ? 'pr-9' : 'pr-3.5'}
              py-2
              ${
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white'
              }
              focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : isSearch && value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            RightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                {renderIcon(RightIcon)}
              </div>
            )
          )}
        </div>

        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
