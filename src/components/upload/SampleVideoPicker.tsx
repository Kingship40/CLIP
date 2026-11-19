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
    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
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
            className="group flex flex-col text-left p-3 rounded-2xl border hover:border-brand-500/80 hover:shadow-md transition-all text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-2.5">
              <img
                src={sample.thumbnail}
                alt={sample.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                {formatDuration(sample.duration)}
              </span>
              <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                {sample.category}
              </span>
            </div>

            <h5 className="font-bold truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {sample.title}
            </h5>
            <p className="text-[11px] line-clamp-2 mt-1 leading-normal" style={{ color: 'var(--text-secondary)' }}>
              {sample.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
