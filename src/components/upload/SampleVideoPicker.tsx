import React from 'react';
import { SAMPLE_VIDEOS, SampleVideo } from '../../utils/videoHelpers';
import { Play, Sparkles } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export interface SampleVideoPickerProps {
  onSelectSample: (sample: SampleVideo) => void;
  disabled?: boolean;
}

export const SampleVideoPicker: React.FC<SampleVideoPickerProps> = ({
  onSelectSample,
  disabled = false,
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-800/80">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Or try with high-quality sample video:
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SAMPLE_VIDEOS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSample(sample)}
            className="group flex flex-col text-left p-2.5 rounded-xl bg-dark-900 border border-slate-800 hover:border-brand-500/50 hover:bg-dark-850 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-dark-950 mb-2">
              <img
                src={sample.thumbnail}
                alt={sample.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-dark-950/40 group-hover:bg-dark-950/20 transition-colors flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-500/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                {formatDuration(sample.duration)}
              </span>
              <span className="absolute top-1.5 left-1.5 bg-brand-500/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                {sample.category}
              </span>
            </div>

            <h5 className="font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
              {sample.title}
            </h5>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
              {sample.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
