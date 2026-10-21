import React from 'react';
import { cn } from '../../utils/formatters';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'neutral' | 'cyan' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const sizes = {
    sm: 'text-[10px] font-medium px-2 py-0.5 rounded-full border',
    md: 'text-xs font-medium px-2.5 py-1 rounded-full border',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
