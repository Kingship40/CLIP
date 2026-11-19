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

  // Text Case Transformation
  const formatWord = (w: string) => {
    if (settings.textCase === 'uppercase' || (!settings.textCase && (settings.preset === 'hormozi' || settings.preset === 'boxed'))) {
      return w.toUpperCase();
    }
    if (settings.textCase === 'title') {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  };

  // Font family and outline styles
  const outlineColor = settings.outlineColor || '#000000';
  const textShadowStyle = settings.outlineWidth === 'none'
    ? undefined
    : settings.outlineWidth === 'thin'
      ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
      : settings.outlineWidth === 'thick'
        ? `-3px -3px 0 ${outlineColor}, 3px -3px 0 ${outlineColor}, -3px 3px 0 ${outlineColor}, 3px 3px 0 ${outlineColor}`
        : `-2px -2px 0 ${outlineColor}, 2px -2px 0 ${outlineColor}, -2px 2px 0 ${outlineColor}, 2px 2px 0 ${outlineColor}`;

  // Word-level kinetic timestamp active index
  const rawWords = activeSegment ? activeSegment.text.trim().split(/\s+/).filter(Boolean) : [];
  let activeWordIdx = -1;
  if (activeSegment) {
    const matchTime = (currentTime >= activeSegment.start && currentTime <= activeSegment.end)
      ? currentTime
      : (relTime >= activeSegment.start && relTime <= activeSegment.end)
        ? relTime
        : absTime;
    if (activeSegment.words && activeSegment.words.length > 0) {
      activeWordIdx = activeSegment.words.findIndex((w) => matchTime >= w.start && matchTime <= w.end);
    }
    if (activeWordIdx === -1 && rawWords.length > 0) {
      const progress = Math.max(0, Math.min(1, (matchTime - activeSegment.start) / Math.max(0.1, activeSegment.end - activeSegment.start)));
      activeWordIdx = Math.min(rawWords.length - 1, Math.floor(progress * rawWords.length));
    }
  }

  // Preset styles
  const getPresetStyles = (segment: SubtitleSegment) => {
    const highlightWords = (segment.highlightWords || []).map((w) => w.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''));
    const isSingleWord = settings.displayMode === 'single-word';
    const wordsToDisplay = isSingleWord && rawWords[activeWordIdx]
      ? [rawWords[activeWordIdx]]
      : rawWords;

    const renderWords = (customPresetClass = '') => (
      <p
        className={`font-black uppercase tracking-wider leading-snug ${isSingleWord ? 'text-2xl sm:text-4xl' : fontSizes[settings.fontSize]} ${customPresetClass}`}
        style={{
          fontFamily: settings.fontFamily ? `"${settings.fontFamily}", system-ui, sans-serif` : undefined,
          textShadow: textShadowStyle,
        }}
      >
        {wordsToDisplay.map((rawWord, i) => {
          const word = formatWord(rawWord);
          const cleanWord = rawWord.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const isKeyword = highlightWords.some((hw) => cleanWord.includes(hw));
          const isSpokenActive = (settings.displayMode === 'word-highlight' || settings.displayMode === 'boxed-word' || settings.displayMode === 'karaoke' || !settings.displayMode) &&
            ((isSingleWord ? 0 : i) === activeWordIdx);
          const isHighlighted = isKeyword || isSpokenActive;

          const isBoxedStyle = settings.preset === 'boxed' || settings.displayMode === 'boxed-word';
          const isBounceStyle = settings.preset === 'bounce';

          // Boxed active word pill
          if (isSpokenActive && isBoxedStyle) {
            return (
              <span
                key={i}
                className="inline-block mr-1.5 px-2.5 py-0.5 rounded-lg shadow-xl font-black transition-all duration-75 transform scale-110"
                style={{
                  backgroundColor: settings.activeWordBgColor || settings.highlightColor,
                  color: settings.activeWordTextColor || '#000000',
                  textShadow: 'none',
                }}
              >
                {word}
              </span>
            );
          }

          const scaleClass = isBounceStyle && isSpokenActive
            ? 'scale-125 font-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]'
            : isHighlighted
              ? 'scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-black'
              : 'text-white drop-shadow-md';

          return (
            <span
              key={i}
              className={`inline-block mr-1.5 transition-all duration-75 ${scaleClass}`}
              style={{
                color: isHighlighted ? settings.highlightColor : (settings.textColor || '#FFFFFF'),
                textShadow: isSpokenActive ? `0 0 16px ${settings.highlightColor}` : textShadowStyle,
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    );

    const customBgStyle: React.CSSProperties = settings.backgroundColor
      ? {
          backgroundColor: settings.backgroundColor,
          opacity: settings.backgroundOpacity ?? 0.85,
        }
      : {};

    switch (settings.preset) {
      case 'boxed':
        return (
          <div
            className="bg-black/55 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-2xl inline-block max-w-[90%] mx-auto"
            style={customBgStyle}
          >
            {renderWords()}
          </div>
        );

      case 'bounce':
        return (
          <div
            className="bg-black/75 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-2xl inline-block max-w-[90%] mx-auto"
            style={customBgStyle}
          >
            {renderWords()}
          </div>
        );

      case 'hormozi':
        return (
          <div
            className="bg-black/85 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-2xl inline-block max-w-[90%] mx-auto"
            style={customBgStyle}
          >
            {renderWords()}
          </div>
        );

      case 'karaoke':
        return (
          <div className="px-3 py-1.5 inline-block max-w-[90%] mx-auto">
            {renderWords('text-outline-black')}
          </div>
        );

      case 'neon':
        return (
          <div
            className="bg-dark-950/90 px-4 py-2 rounded-2xl border border-purple-500/50 shadow-glow-brand inline-block max-w-[90%] mx-auto"
            style={customBgStyle}
          >
            {renderWords('text-purple-200')}
          </div>
        );

      case 'cinematic':
        return (
          <div
            className="bg-black/95 px-3 py-1 rounded-sm border-l-2 border-brand-500 inline-block max-w-[85%] mx-auto"
            style={customBgStyle}
          >
            {renderWords('font-sans font-medium text-slate-100')}
          </div>
        );

      case 'minimal':
      default:
        return (
          <div
            className="bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg inline-block max-w-[90%] mx-auto"
            style={customBgStyle}
          >
            {renderWords('font-medium text-white drop-shadow-sm')}
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
            settings.yOffset !== undefined || settings.position === 'custom'
              ? ''
              : positionClasses[settings.position] || 'bottom-16'
          }`}
          style={
            settings.yOffset !== undefined
              ? { top: `${settings.yOffset}%`, transform: 'translateY(-50%)' }
              : undefined
          }
        >
          {/* Speaker Badge */}
          {settings.speakerLabels && activeSegment.speaker && (
            <div className="block mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-dark-950/90 border border-sky-400/80 text-sky-300 text-[10px] font-black tracking-wider uppercase shadow-md">
                {activeSegment.speaker}
              </span>
            </div>
          )}
          {getPresetStyles(activeSegment)}
        </div>
      )}
    </div>
  );
};
