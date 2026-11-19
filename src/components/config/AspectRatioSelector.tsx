import React from 'react';
import { AspectRatio } from '../../types';
import { Smartphone, Monitor, Square, Film } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange }) => {
  const options: {
    id: AspectRatio;
    name: string;
    sub: string;
    icon: React.ReactNode;
    frameClass: string;
  }[] = [
    {
      id: '9:16',
      name: '9:16 Vertical',
      sub: 'TikTok, Reels, Shorts',
      icon: <Smartphone className="w-4 h-4" />,
      frameClass: 'w-6 h-10',
    },
    {
      id: '16:9',
      name: '16:9 Landscape',
      sub: 'YouTube, Web, X',
      icon: <Monitor className="w-4 h-4" />,
      frameClass: 'w-10 h-6',
    },
    {
      id: '1:1',
      name: '1:1 Square',
      sub: 'Instagram, Feed',
      icon: <Square className="w-4 h-4" />,
      frameClass: 'w-7 h-7',
    },
    {
      id: 'original',
      name: 'Original Ratio',
      sub: 'Preserve source framing',
      icon: <Film className="w-4 h-4" />,
      frameClass: 'w-9 h-6 border-dashed',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex flex-col items-center text-center p-3.5 rounded-xl border transition-all text-xs focus:outline-none select-none relative cursor-pointer',
              isSelected
                ? 'bg-[#EAE8FF] border-2 border-brand-500 ring-1 ring-brand-500/20 shadow-sm dark:bg-brand-500/20 dark:border-brand-500 dark:ring-brand-500'
                : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-brand-300 hover:bg-[#F1EFFF]/50 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-dark-850'
            )}
          >
            {/* Visual Frame Mockup */}
            <div className="h-12 flex items-center justify-center mb-2.5">
              <div
                className={cn(
                  'rounded-md border-2 flex items-center justify-center transition-colors',
                  opt.frameClass,
                  isSelected
                    ? 'border-brand-500 bg-brand-100/60 dark:border-brand-400 dark:bg-brand-500/30'
                    : 'border-slate-300 bg-[var(--bg-surface-2)] dark:border-slate-700 dark:bg-dark-950/50'
                )}
              >
                <span
                  className={cn(
                    'text-[10px]',
                    isSelected
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-[var(--text-muted)] dark:text-slate-400'
                  )}
                >
                  {opt.icon}
                </span>
              </div>
            </div>

            <span
              className={cn(
                'font-bold text-xs',
                isSelected
                  ? 'text-brand-700 dark:text-white'
                  : 'text-[var(--text-primary)] dark:text-slate-300'
              )}
            >
              {opt.name}
            </span>
            <span
              className={cn(
                'text-[10px] mt-0.5 line-clamp-1 font-medium',
                isSelected
                  ? 'text-brand-600/90 dark:text-slate-400'
                  : 'text-[var(--text-secondary)] dark:text-slate-400'
              )}
            >
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
};
