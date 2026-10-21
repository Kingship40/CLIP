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
              'flex flex-col items-center text-center p-3.5 rounded-xl border transition-all text-xs focus:outline-none select-none relative',
              isSelected
                ? 'bg-brand-500/15 border-brand-500 shadow-sm ring-1 ring-brand-500'
                : 'bg-dark-900 border-slate-800 hover:border-slate-700 hover:bg-dark-850'
            )}
          >
            {/* Visual Frame Mockup */}
            <div className="h-12 flex items-center justify-center mb-2.5">
              <div
                className={cn(
                  'rounded-md border-2 flex items-center justify-center transition-colors',
                  opt.frameClass,
                  isSelected
                    ? 'border-brand-400 bg-brand-500/30'
                    : 'border-slate-600 bg-dark-950/50'
                )}
              >
                <span className={cn('text-[10px]', isSelected ? 'text-brand-300' : 'text-slate-500')}>
                  {opt.icon}
                </span>
              </div>
            </div>

            <span
              className={cn(
                'font-semibold text-xs',
                isSelected ? 'text-white' : 'text-slate-300'
              )}
            >
              {opt.name}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{opt.sub}</span>
          </button>
        );
      })}
    </div>
  );
};
