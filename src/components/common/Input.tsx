import React from 'react';
import { cn } from '../../utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full border rounded-lg px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
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
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center" style={{ color: 'var(--text-muted)' }}>
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
