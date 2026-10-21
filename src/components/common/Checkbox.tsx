import React from 'react';
import { cn } from '../../utils/formatters';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, id, onChange, ...props }, ref) => {
    const checkId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={checkId} className="flex items-start gap-3 cursor-pointer group select-none">
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            type="checkbox"
            id={checkId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded border transition-colors flex items-center justify-center',
              checked
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'bg-dark-900 border-slate-700 group-hover:border-slate-500'
            )}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && <span className="text-slate-200 group-hover:text-white transition-colors">{label}</span>}
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
