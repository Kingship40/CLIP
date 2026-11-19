import React from 'react';
import { cn } from '../../utils/formatters';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'emerald' | 'amber' | 'rose' | 'danger' | 'neutral' | 'cyan' | 'purple';
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
    brand: 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30 font-semibold',
    emerald: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
    amber: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold',
    rose: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold',
    danger: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-semibold',
    cyan: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 font-semibold',
    purple: 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold',
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
