import React from 'react';

export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      rows = 3,
      placeholder,
      required = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const textareaId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 mb-1">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          placeholder={placeholder}
          className={`block w-full rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 transition-colors
            px-3.5 py-2
            ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white'
            }
            focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />

        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
