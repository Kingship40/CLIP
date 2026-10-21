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
            {label && <span className="uppercase tracking-wider text-slate-400">{label}</span>}
            {valueDisplay && <span className="text-slate-300 font-mono">{valueDisplay}</span>}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          className={cn(
            'w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-dark-800 transition-all focus:outline-none focus:ring-1 focus:ring-brand-500',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
