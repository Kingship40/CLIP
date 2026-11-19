import React, { useRef, useEffect, useState } from 'react';
import { Clip } from '../../types';
import { Modal } from '../common/Modal';
import { formatDuration } from '../../utils/formatters';
import { Sparkles, Edit3 } from 'lucide-react';
import { Button } from '../common/Button';
import { Link } from 'react-router-dom';
import { CaptionOverlay } from '../editor/CaptionOverlay';

export interface ClipPreviewModalProps {
  clip: Clip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClipPreviewModal: React.FC<ClipPreviewModalProps> = ({
  clip,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isOpen && videoRef.current && clip) {
      videoRef.current.currentTime = clip.startTime;
      setCurrentTime(clip.startTime);
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, clip]);

  if (!clip) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="truncate">{clip.title}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 shrink-0">
            {formatDuration(clip.duration)}
          </span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Aspect Frame Container */}
        <div className="relative aspect-[9/16] max-h-[55vh] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
          {clip.videoUrl ? (
            <video
              ref={videoRef}
              src={clip.videoUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  if (videoRef.current.currentTime >= clip.endTime) {
                    videoRef.current.currentTime = clip.startTime;
                  }
                }
              }}
            />
          ) : (
            <div className="text-center p-6 text-slate-400">
              <p className="text-sm">Video file preview unavailable.</p>
            </div>
          )}

          {/* Synchronized Subtitles Overlay (only shown if not already burned into the video) */}
          {clip.captionSettings?.enabled && clip.subtitles && clip.subtitles.length > 0 && !clip.subtitledVideoUrl && (
            <div className="absolute inset-0 pointer-events-none">
              <CaptionOverlay
                subtitles={clip.subtitles}
                currentTime={currentTime}
                settings={clip.captionSettings}
                clipStartTime={clip.startTime}
                clipEndTime={clip.endTime}
              />
            </div>
          )}
        </div>

        {/* Info & Intelligence Rationale */}
        <div
          className="p-3.5 rounded-xl border space-y-2 text-xs"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Viral Score: {clip.viralScore}/100</span>
                </span>
                {clip.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {clip.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {formatDuration(clip.startTime)} – {formatDuration(clip.endTime)} ({formatDuration(clip.duration)})
              </p>
            </div>

            <Link to={`/dashboard/clips/${clip.id}`}>
              <Button size="sm" variant="primary" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                Open in Clip Editor
              </Button>
            </Link>
          </div>

          {clip.rationale && (
            <p className="text-[11px] leading-relaxed border-t pt-2" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">AI Selection Rationale: </strong>
              {clip.rationale}
            </p>
          )}

          {clip.scoreBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
              <div
                className="p-1.5 rounded border text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="block" style={{ color: 'var(--text-muted)' }}>Hook</span>
                <span className="font-bold text-amber-600 dark:text-amber-300">{clip.scoreBreakdown.hookStrength}%</span>
              </div>
              <div
                className="p-1.5 rounded border text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="block" style={{ color: 'var(--text-muted)' }}>Impact</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-300">{clip.scoreBreakdown.emotionalIntellectual}%</span>
              </div>
              <div
                className="p-1.5 rounded border text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="block" style={{ color: 'var(--text-muted)' }}>Clarity</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-300">{clip.scoreBreakdown.clarityContext}%</span>
              </div>
              <div
                className="p-1.5 rounded border text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="block" style={{ color: 'var(--text-muted)' }}>Payoff</span>
                <span className="font-bold text-purple-600 dark:text-purple-300">{clip.scoreBreakdown.payoffValue}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
