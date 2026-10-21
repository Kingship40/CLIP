import React, { useRef, useState, useCallback, useEffect } from 'react';
import { formatDuration, formatDurationPrecise } from '../../utils/formatters';
import { Scissors, Clock, Play, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export interface ClipTimelineProps {
  totalDuration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  onRangeChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
  onResetRange?: () => void;
}

export const ClipTimeline: React.FC<ClipTimelineProps> = ({
  totalDuration,
  startTime,
  endTime,
  currentTime,
  onRangeChange,
  onSeek,
  onResetRange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playhead' | null>(null);

  const durationSafe = Math.max(1, totalDuration || 100);
  const startPercent = Math.min(100, Math.max(0, (startTime / durationSafe) * 100));
  const endPercent = Math.min(100, Math.max(0, (endTime / durationSafe) * 100));
  const currentPercent = Math.min(100, Math.max(0, (currentTime / durationSafe) * 100));
  const clipDuration = Math.max(0, endTime - startTime);

  // Time conversion helper from pointer coordinates
  const getTimeFromEvent = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const pos = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, pos));
      return clamped * durationSafe;
    },
    [durationSafe]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const time = getTimeFromEvent(e);

      if (isDragging === 'start') {
        const newStart = Math.min(time, endTime - 3); // minimum 3s clip
        onRangeChange(Math.max(0, Math.round(newStart * 10) / 10), endTime);
      } else if (isDragging === 'end') {
        const newEnd = Math.max(time, startTime + 3);
        onRangeChange(startTime, Math.min(durationSafe, Math.round(newEnd * 10) / 10));
      } else if (isDragging === 'playhead') {
        onSeek(Math.round(time * 10) / 10);
      }
    };

    const handleUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, startTime, endTime, durationSafe, getTimeFromEvent, onRangeChange, onSeek]);

  // Click on track to seek
  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const time = getTimeFromEvent(e.nativeEvent);
    onSeek(Math.round(time * 10) / 10);
  };

  // Generate ruler tick marks
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const sec = (durationSafe / tickCount) * i;
    return {
      percent: (i / tickCount) * 100,
      label: formatDuration(sec),
    };
  });

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 select-none">
      {/* Header Info: Start / End / Duration Readouts & Steppers */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-white">Clip Range Trimming:</span>
          <span className="font-mono bg-dark-950 px-2 py-0.5 rounded text-brand-300 border border-brand-500/30">
            {formatDurationPrecise(startTime)} → {formatDurationPrecise(endTime)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clip Duration:</span>
            <strong className="text-white font-mono bg-dark-950 px-2 py-0.5 rounded border border-slate-800">
              {formatDurationPrecise(clipDuration)} ({clipDuration.toFixed(1)}s)
            </strong>
          </div>

          {onResetRange && (
            <button
              onClick={onResetRange}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              title="Reset to original highlight duration"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Timeline Track */}
      <div className="relative pt-6 pb-2">
        {/* Ruler Ticks */}
        <div className="absolute top-0 inset-x-0 h-4 flex justify-between text-[10px] text-slate-500 font-mono pointer-events-none">
          {ticks.map((t, idx) => (
            <span
              key={idx}
              className="transform -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
              style={{ left: `${t.percent}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* Track Base */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-10 bg-dark-950 rounded-xl border border-slate-800 cursor-pointer overflow-hidden shadow-inner group"
        >
          {/* Audio Waveform Simulation Background */}
          <div className="absolute inset-0 flex items-center justify-around opacity-20 pointer-events-none px-2">
            {Array.from({ length: 48 }).map((_, i) => {
              const h = Math.sin(i * 0.4) * 35 + Math.cos(i * 0.9) * 20 + 40;
              return (
                <div
                  key={i}
                  className="w-1 bg-slate-300 rounded-full"
                  style={{ height: `${Math.max(15, Math.min(90, h))}%` }}
                />
              );
            })}
          </div>

          {/* Active Clip Region Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-brand-500/25 border-y-2 border-brand-500 transition-all pointer-events-none"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(2, endPercent - startPercent)}%`,
            }}
          />

          {/* Current Playhead Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 pointer-events-none shadow-glow-cyan"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md ring-2 ring-white/50" />
          </div>

          {/* Draggable Start Handle */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging('start');
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDragging('start');
            }}
            className="absolute top-0 bottom-0 w-4 bg-brand-500 hover:bg-brand-400 cursor-ew-resize flex items-center justify-center z-20 transition-colors shadow-lg -translate-x-1/2 rounded-l-md"
            style={{ left: `${startPercent}%` }}
            title={`Start time: ${formatDurationPrecise(startTime)}`}
          >
            <div className="w-1 h-4 bg-white/70 rounded-full" />
          </div>

          {/* Draggable End Handle */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging('end');
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDragging('end');
            }}
            className="absolute top-0 bottom-0 w-4 bg-brand-500 hover:bg-brand-400 cursor-ew-resize flex items-center justify-center z-20 transition-colors shadow-lg -translate-x-1/2 rounded-r-md"
            style={{ left: `${endPercent}%` }}
            title={`End time: ${formatDurationPrecise(endTime)}`}
          >
            <div className="w-1 h-4 bg-white/70 rounded-full" />
          </div>
        </div>
      </div>

      {/* Accessible Stepper & Micro Adjustment Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Start Time Stepper */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Start Cut:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRangeChange(Math.max(0, startTime - 1), endTime)}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="-1 second"
            >
              -1s
            </button>
            <button
              onClick={() => onRangeChange(Math.max(0, startTime - 0.2), endTime)}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="-0.2 seconds"
            >
              -0.2s
            </button>
            <span className="font-mono text-sm font-bold text-white px-2">
              {formatDurationPrecise(startTime)}
            </span>
            <button
              onClick={() => onRangeChange(Math.min(endTime - 2, startTime + 0.2), endTime)}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="+0.2 seconds"
            >
              +0.2s
            </button>
            <button
              onClick={() => onRangeChange(Math.min(endTime - 2, startTime + 1), endTime)}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="+1 second"
            >
              +1s
            </button>
          </div>
        </div>

        {/* End Time Stepper */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            End Cut:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRangeChange(startTime, Math.max(startTime + 2, endTime - 1))}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="-1 second"
            >
              -1s
            </button>
            <button
              onClick={() => onRangeChange(startTime, Math.max(startTime + 2, endTime - 0.2))}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="-0.2 seconds"
            >
              -0.2s
            </button>
            <span className="font-mono text-sm font-bold text-white px-2">
              {formatDurationPrecise(endTime)}
            </span>
            <button
              onClick={() => onRangeChange(startTime, Math.min(durationSafe, endTime + 0.2))}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="+0.2 seconds"
            >
              +0.2s
            </button>
            <button
              onClick={() => onRangeChange(startTime, Math.min(durationSafe, endTime + 1))}
              className="p-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700/60"
              title="+1 second"
            >
              +1s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
