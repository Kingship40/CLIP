import React, { useRef, useEffect } from 'react';
import { Clip } from '../../types';
import { Modal } from '../common/Modal';
import { formatDuration } from '../../utils/formatters';
import { Sparkles, Edit3 } from 'lucide-react';
import { Button } from '../common/Button';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    if (isOpen && videoRef.current && clip) {
      videoRef.current.currentTime = clip.startTime;
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
                if (videoRef.current && videoRef.current.currentTime >= clip.endTime) {
                  videoRef.current.currentTime = clip.startTime;
                }
              }}
            />
          ) : (
            <div className="text-center p-6 text-slate-400">
              <p className="text-sm">Video file preview unavailable.</p>
            </div>
          )}

          {/* Kinetic Caption Mockup Overlay */}
          {clip.captionSettings.enabled && (
            <div className="absolute bottom-12 inset-x-4 pointer-events-none text-center">
              <span className="inline-block px-3 py-1 rounded bg-black/75 text-amber-300 font-extrabold text-sm uppercase tracking-wide shadow-md">
                {clip.hookSummary.slice(0, 40)}...
              </span>
            </div>
          )}
        </div>

        {/* Info & Intelligence Rationale */}
        <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Viral Score: {clip.viralScore}/100</span>
                </span>
                {clip.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {clip.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-slate-400 font-mono text-[11px]">
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
            <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2">
              <strong className="text-cyan-400 font-semibold">AI Selection Rationale: </strong>
              {clip.rationale}
            </p>
          )}

          {clip.scoreBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
              <div className="bg-dark-900 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 block">Hook</span>
                <span className="font-bold text-amber-300">{clip.scoreBreakdown.hookStrength}%</span>
              </div>
              <div className="bg-dark-900 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 block">Impact</span>
                <span className="font-bold text-cyan-300">{clip.scoreBreakdown.emotionalIntellectual}%</span>
              </div>
              <div className="bg-dark-900 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 block">Clarity</span>
                <span className="font-bold text-emerald-300">{clip.scoreBreakdown.clarityContext}%</span>
              </div>
              <div className="bg-dark-900 p-1.5 rounded border border-slate-800/80 text-center">
                <span className="text-slate-400 block">Payoff</span>
                <span className="font-bold text-purple-300">{clip.scoreBreakdown.payoffValue}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
