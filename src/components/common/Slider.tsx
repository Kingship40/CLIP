import React from 'react';
import { cn } from '../../utils/formatters';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  valueDisplay?: React.ReactNode;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueDisplay, ...props }, ref) => {
    return (
      <div className="w-full">
        {(label || valueDisplay) && (
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            {label && <span className="uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>}
            {valueDisplay && <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{valueDisplay}</span>}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          className={cn(
            'w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-brand-500',
            className
          )}
          style={{ backgroundColor: 'var(--border)' }}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
