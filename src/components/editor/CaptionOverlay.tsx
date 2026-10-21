import React from 'react';
import { CaptionSettings, SubtitleSegment } from '../../types';

export interface CaptionOverlayProps {
  subtitles: SubtitleSegment[];
  currentTime: number;
  settings: CaptionSettings;
  clipStartTime: number;
  clipEndTime: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  subtitles,
  currentTime,
  settings,
  clipStartTime,
}) => {
  if (!settings.enabled) return null;

  // Support both absolute video playback and clip-relative playback
  const relTime = currentTime >= clipStartTime ? currentTime - clipStartTime : currentTime;
  const absTime = currentTime + clipStartTime;

  // Find active subtitle segment matching either direct, relative, or absolute timings
  const activeSegment = subtitles.find((sub) => {
    if (currentTime >= sub.start && currentTime <= sub.end) return true;
    if (relTime >= sub.start && relTime <= sub.end) return true;
    if (absTime >= sub.start && absTime <= sub.end) return true;
    return false;
  });

  // Positioning classes
  const positionClasses = {
    top: 'top-10',
    middle: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-16',
  };

  // Font size classes
  const fontSizes = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  };

  // Preset styles
  const getPresetStyles = (text: string, highlightWords: string[] = []) => {
    const words = text.split(' ');

    switch (settings.preset) {
      case 'hormozi':
        return (
          <div className="bg-black/85 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-2xl inline-block max-w-[90%] mx-auto">
            <p className={`font-black uppercase tracking-wider leading-snug ${fontSizes[settings.fontSize]}`}>
              {words.map((word, i) => {
                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const isHighlight = highlightWords.some((hw) =>
                  cleanWord.includes(hw.toLowerCase())
                );
                return (
                  <span
                    key={i}
                    className={`inline-block mr-1.5 transition-all ${
                      isHighlight
                        ? 'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                        : 'text-white drop-shadow-md'
                    }`}
                    style={{ color: isHighlight ? settings.highlightColor : '#FFFFFF' }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>
        );

      case 'karaoke':
        return (
          <div className="px-3 py-1.5 inline-block max-w-[90%] mx-auto">
            <p className={`font-extrabold uppercase tracking-wide leading-tight text-outline-black ${fontSizes[settings.fontSize]}`}>
              {words.map((word, i) => {
                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const isHighlight = highlightWords.some((hw) =>
                  cleanWord.includes(hw.toLowerCase())
                );
                return (
                  <span
                    key={i}
                    className="inline-block mr-1.5 transition-all"
                    style={{
                      color: isHighlight ? settings.highlightColor : '#FFFFFF',
                      textShadow: isHighlight ? `0 0 12px ${settings.highlightColor}` : undefined,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>
        );

      case 'neon':
        return (
          <div className="bg-dark-950/90 px-4 py-2 rounded-2xl border border-purple-500/50 shadow-glow-brand inline-block max-w-[90%] mx-auto">
            <p className={`font-extrabold tracking-wide uppercase ${fontSizes[settings.fontSize]} text-purple-200`}>
              {words.map((word, i) => {
                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const isHighlight = highlightWords.some((hw) =>
                  cleanWord.includes(hw.toLowerCase())
                );
                return (
                  <span
                    key={i}
                    className="inline-block mr-1.5"
                    style={{ color: isHighlight ? settings.highlightColor : undefined }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>
        );

      case 'cinematic':
        return (
          <div className="bg-black/95 px-3 py-1 rounded-sm border-l-2 border-brand-500 inline-block max-w-[85%] mx-auto">
            <p className={`font-sans font-medium text-slate-100 ${fontSizes[settings.fontSize]}`}>
              {text}
            </p>
          </div>
        );

      case 'minimal':
      default:
        return (
          <div className="bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg inline-block max-w-[90%] mx-auto">
            <p className={`font-medium text-white drop-shadow-sm ${fontSizes[settings.fontSize]}`}>
              {text}
            </p>
          </div>
        );
    }
  };

  // Show opening hook banner during first 3.2 seconds of clip
  const elapsedInClip = currentTime >= clipStartTime ? currentTime - clipStartTime : currentTime;
  const isFirst3Seconds = elapsedInClip >= 0 && elapsedInClip <= 3.2;

  return (
    <div className="absolute inset-x-0 inset-y-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* Opening Title Hook */}
      {settings.showOpeningTitle && settings.openingTitle && isFirst3Seconds && (
        <div className="self-center top-6 absolute animate-in fade-in zoom-in duration-300">
          <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xl border border-white/20">
            {settings.openingTitle}
          </div>
        </div>
      )}

      {/* Synchronized Caption Line */}
      {activeSegment && (
        <div
          className={`absolute inset-x-4 text-center transition-all duration-150 ${
            positionClasses[settings.position]
          }`}
        >
          {getPresetStyles(activeSegment.text, activeSegment.highlightWords)}
        </div>
      )}
    </div>
  );
};
