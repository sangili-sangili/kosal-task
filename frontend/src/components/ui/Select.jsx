import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      options = [],
      placeholder,
      required = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative rounded-lg">
          <select
            ref={ref}
            id={selectId}
            name={name}
            className={`block w-full rounded-lg border text-sm text-slate-900 bg-white transition-colors
              px-3.5 py-2 pr-9 appearance-none
              ${
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800'
              }
              focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
