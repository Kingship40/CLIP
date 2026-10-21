import React, { useState } from 'react';
import { Sparkles, X, ChevronRight, Server } from 'lucide-react';
import { Modal } from '../common/Modal';

export const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="bg-brand-950/90 border-b border-brand-500/20 text-xs px-4 py-2 flex items-center justify-between text-brand-200">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <span className="font-semibold text-white">Interactive Frontend Demo:</span>
          <span className="text-brand-300/90 hidden sm:inline">
            Processing and AI highlight detection are simulated locally. No video files leave your browser.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-300 hover:text-white underline underline-offset-2"
          >
            Backend Architecture Info
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-brand-400 hover:text-white p-0.5 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ClipForge AI — System Architecture & Integration"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 flex items-start gap-3">
            <Server className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Production Backend Readiness</h4>
              <p className="text-slate-400 text-xs mt-1">
                This frontend is built with typed service interfaces (<code className="text-brand-300">IClippingService</code>) located in <code className="text-brand-300">src/services/clippingService.ts</code>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider">How to connect a real Python / AI backend:</h5>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300">
              <li>
                <strong>Video Upload:</strong> Stream user MP4/MOV files to cloud storage (S3 / GCS) via presigned URLs.
              </li>
              <li>
                <strong>Audio Transcription:</strong> Send audio stream to Whisper / OpenAI / Deepgram for word-level timestamps.
              </li>
              <li>
                <strong>Highlight Scoring:</strong> Run an LLM (Gemini / Claude / GPT-4o) over timestamps to score curiosity, retention, and generate punchy viral hooks.
              </li>
              <li>
                <strong>FFmpeg Video Rendering:</strong> Crop to 9:16 vertical using face-tracking or center-crop, burn kinetic captions, and export high-bitrate MP4.
              </li>
            </ol>
          </div>

          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-200">
            <strong>Current status:</strong> You can upload real MP4 videos or load sample videos, generate demo clips, interactively trim start/end timestamps, customize caption styles, and export project data and SRT files.
          </div>
        </div>
      </Modal>
    </>
  );
};
