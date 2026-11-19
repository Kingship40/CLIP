import React from 'react';
import { cn } from '../../utils/formatters';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full appearance-none border rounded-lg px-3.5 py-2 pr-9 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer',
              error
                ? 'border-rose-500/80 focus:border-rose-500'
                : 'hover:border-slate-400 focus:border-brand-500',
              className
            )}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: error ? undefined : 'var(--border)',
              color: 'var(--text-primary)',
            }}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
