import React from 'react';
import { UploadCloud, Link2 } from 'lucide-react';

export type VideoInputMode = 'upload' | 'link';

interface VideoSourceTabsProps {
  activeMode: VideoInputMode;
  onModeChange: (mode: VideoInputMode) => void;
  disabled?: boolean;
}

export const VideoSourceTabs: React.FC<VideoSourceTabsProps> = ({
  activeMode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex p-1.5 rounded-2xl bg-dark-950/80 border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange('upload')}
          disabled={disabled}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeMode === 'upload'
              ? 'bg-brand-500 text-white shadow-glow-brand font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-dark-900'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Video</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('link')}
          disabled={disabled}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeMode === 'link'
              ? 'bg-brand-500 text-white shadow-glow-brand font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-dark-900'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Link2 className="w-4 h-4" />
          <span>Paste Video Link</span>
          <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            New
          </span>
        </button>
      </div>
    </div>
  );
};
