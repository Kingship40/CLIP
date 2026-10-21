import React, { useState, useEffect, useRef } from 'react';
import {
  Link2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ClipboardPaste,
  ShieldAlert,
  Youtube,
  Film,
  Play,
  RotateCcw,
  AlertTriangle,
  Upload,
  Volume2,
  Info,
  Download,
  Trash2,
  ShieldCheck,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { videoImportServiceInstance } from '../../services/import/videoImportService';
import {
  ImportedVideoMetadata,
  ImportedMediaResult,
  ImportProgressCallback,
  ImportStageInfo,
  ImportStage,
  IngestionJob,
} from '../../services/import/types';
import { backgroundJobQueueInstance } from '../../services/backend/backgroundJobQueue';
import { formatDuration } from '../../utils/formatters';
import { Clip } from '../../types';

interface UrlImportFormProps {
  onVideoImported?: (result: { metadata: ImportedVideoMetadata; videoUrl: string }) => void;
  onSwitchToUpload?: () => void;
  isLoading?: boolean;
}

function getStageHumanName(stage: ImportStage): string {
  switch (stage) {
    case 'checking_link':
    case 'validating_link':
    case 'validating':
      return 'Checking link';
    case 'identifying_platform':
      return 'Identifying platform';
    case 'checking_authorized_access':
    case 'waiting_for_media_access':
      return 'Checking authorized access';
    case 'importing_source_privately':
      return 'Importing source privately';
    case 'analyzing_video_audio':
    case 'verifying_media':
      return 'Analyzing video and audio';
    case 'detecting_moments':
      return 'Detecting promising moments';
    case 'generating_clips':
      return 'Generating clips';
    case 'rendering_captions':
      return 'Rendering captions';
    case 'ready_to_download':
    case 'ready_for_clipping':
    case 'completed':
      return 'Ready to download';
    case 'action_required':
      return 'Action required';
    case 'import_failed':
    case 'failed':
      return 'Import failed';
    default:
      return 'Processing';
  }
}

export const UrlImportForm: React.FC<UrlImportFormProps> = ({
  onVideoImported,
  onSwitchToUpload,
  isLoading: parentLoading = false,
}) => {
  const [url, setUrl] = useState('');
  const [activeJob, setActiveJob] = useState<IngestionJob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Restore existing active job from queue on mount (page refresh persistence)
  useEffect(() => {
    const runningJobs = backgroundJobQueueInstance.getAllJobs();
    const active = runningJobs.find(
      (j) => j.status === 'running' || j.stage === 'ready_to_download' || j.status === 'action_required'
    );
    if (active) {
      setActiveJob(active);
      if (active.sourceUrl) setUrl(active.sourceUrl);
      subscribeToJob(active.id);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const subscribeToJob = (jobId: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    unsubscribeRef.current = backgroundJobQueueInstance.subscribe(jobId, (updated) => {
      setActiveJob(updated);
      if (updated.error && updated.status === 'failed') {
        setErrorMessage(updated.error);
      }
    });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage(null);
      }
    } catch {
      // Manual paste fallback
    }
  };

  const handleClear = () => {
    if (activeJob && activeJob.status === 'running') {
      backgroundJobQueueInstance.cancelJob(activeJob.id);
    }
    setUrl('');
    setErrorMessage(null);
    setActiveJob(null);
  };

  const handleQuickSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a video link to import.');
      return;
    }

    setErrorMessage(null);

    try {
      // Submit job to background queue (with request deduplication)
      const job = await backgroundJobQueueInstance.submitJob(trimmed, {
        retentionPolicy: 'immediate',
        clipCount: 3,
        targetDurationSeconds: 30,
      });

      setActiveJob(job);
      subscribeToJob(job.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit video ingestion job.');
    }
  };

  const handleCancel = () => {
    if (activeJob) {
      backgroundJobQueueInstance.cancelJob(activeJob.id);
    }
  };

  const handleDeleteResults = () => {
    if (activeJob) {
      backgroundJobQueueInstance.deleteJobResults(activeJob.id);
      setActiveJob(null);
      setUrl('');
    }
  };

  const handleDownloadClip = (clip: Clip) => {
    // Trigger download
    const link = document.createElement('a');
    link.href = clip.videoUrl;
    link.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (!activeJob || activeJob.clips.length === 0) return;
    activeJob.clips.forEach((clip, index) => {
      setTimeout(() => {
        handleDownloadClip(clip);
      }, index * 400);
    });
  };

  const isProcessing =
    activeJob?.status === 'running' && activeJob?.stage !== 'ready_to_download';

  // Detected provider badge
  const detectedProvider = videoImportServiceInstance.getProvider(url.trim());

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* URL Input Box Card */}
      <div className="bg-dark-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-400" />
              <span>Background AI Video Ingestion</span>
            </h3>

            {detectedProvider && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-dark-950 border border-slate-800 text-cyan-300">
                {detectedProvider.id.includes('youtube') ? (
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{detectedProvider.displayName}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Paste a public video link from YouTube, TikTok, Instagram, Vimeo, or a direct MP4/S3 stream. The backend analyzes the actual audiovisual content privately without publishing the full video.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="flex items-center gap-2 bg-dark-950/90 border border-slate-800 focus-within:border-cyan-500/80 rounded-xl px-3.5 py-2.5 transition-colors">
              <Link2 className="w-4 h-4 text-slate-500 flex-shrink-0" />

              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Paste YouTube, TikTok, Instagram, Vimeo, or direct MP4/WebM video URL..."
                disabled={isProcessing || parentLoading}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />

              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear URL"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePasteClipboard}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-dark-900 hover:bg-slate-800 border border-slate-800 hover:text-white transition-colors"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          {/* Quick Samples & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Test Sources:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickSample('https://vjs.zencdn.net/v/oceans.mp4')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-cyan-300 hover:text-white hover:border-cyan-500/50 transition-colors"
              >
                Authorized Direct MP4
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                YouTube Video
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.tiktok.com/@creator/video/1234567890')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                TikTok Reel
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.instagram.com/reel/C123456/')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                Instagram Reel
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isProcessing && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                  className="border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!url.trim() || isProcessing || parentLoading}
                className="bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-400 hover:to-brand-400 text-white font-bold"
                leftIcon={
                  isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )
                }
              >
                {isProcessing ? 'Processing Privately...' : 'Process Video'}
              </Button>
            </div>
          </div>
        </form>

        {/* 11-Stage Progress & Status Indicator */}
        {isProcessing && activeJob && (
          <div className="p-4 rounded-xl bg-dark-950/80 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>
                  <span className="text-cyan-400 font-bold uppercase tracking-wider mr-1.5">
                    [{getStageHumanName(activeJob.stage)}]
                  </span>
                  {activeJob.metadata?.fileName
                    ? `Processing "${activeJob.metadata.fileName}" privately...`
                    : 'Running background ingestion & AI analysis...'}
                </span>
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {activeJob.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-brand-500 transition-all duration-300 ease-out"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Private Backend Workspace • Source video will not be published</span>
              </span>
              <span>Retention: Immediate deletion on finish</span>
            </div>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <span className="font-bold block text-rose-300">Import Failed</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Action Required Card: Platform Metadata-Only Preview (YouTube, TikTok, Instagram) */}
        {activeJob && activeJob.stage === 'action_required' && activeJob.metadata && (
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {activeJob.metadata.thumbnailUrl ? (
                  <div className="w-24 h-14 rounded-lg bg-dark-950 overflow-hidden flex-shrink-0 border border-slate-800 relative">
                    <img
                      src={activeJob.metadata.thumbnailUrl}
                      alt={activeJob.metadata.fileName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1 rounded bg-black/80 text-white">
                      {formatDuration(activeJob.metadata.duration)}
                    </span>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-dark-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Action Required: Metadata Only</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      by {activeJob.metadata.author || activeJob.providerName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {activeJob.metadata.fileName.replace(/\.mp4$/, '')}
                  </h4>

                  <p className="text-xs text-slate-400">
                    Platform: <span className="text-slate-300 font-semibold">{activeJob.providerName}</span> | Aspect Ratio: <span className="text-slate-300 font-semibold">{activeJob.metadata.aspectRatio}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation of Limitation */}
            <div className="p-3.5 rounded-lg bg-dark-950/70 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-300 block">
                  Why is automatic media download unavailable?
                </span>
                <span>
                  {activeJob.error || activeJob.metadata.mediaAccessMessage}
                </span>
              </div>
            </div>

            {/* Guiding Action Row */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <span className="text-xs text-slate-400">
                To run viral AI clipping, upload the creator video file directly:
              </span>

              <div className="flex items-center gap-2">
                {onSwitchToUpload && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onSwitchToUpload}
                    className="bg-brand-500 hover:bg-brand-400 text-white font-bold"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Switch to Upload Video File
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-slate-800 text-slate-300 hover:text-white"
                >
                  Try Another Link
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION: Ready to Download (Generated Clips with Individual & All Downloads) */}
        {activeJob && activeJob.stage === 'ready_to_download' && activeJob.clips.length > 0 && (
          <div className="p-6 rounded-2xl bg-dark-950 border border-emerald-500/30 space-y-6 animate-in fade-in duration-300 shadow-2xl">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-bold text-white">
                    Generated Short Clips Ready
                  </h4>
                  <Badge variant="emerald" size="sm">
                    {activeJob.clips.length} Clips Produced
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Source Master Cleaned Up & Protected</span>
                  </span>
                  <span>•</span>
                  <span>Full source video was not published</span>
                </div>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download All ({activeJob.clips.length})
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteResults}
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Results
                </Button>
              </div>
            </div>

            {/* Generated Clip Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJob.clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="bg-dark-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all p-4 space-y-3"
                >
                  {/* Clip Header & Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>Score: {clip.viralScore}/100</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-dark-950 px-2 py-0.5 rounded border border-slate-800">
                      {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="space-y-1.5 flex-1">
                    <h5 className="text-sm font-bold text-white line-clamp-2">
                      {clip.title}
                    </h5>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {clip.hookSummary || clip.description}
                    </p>
                    {clip.subtitles && clip.subtitles.length > 0 && (
                      <div className="p-2 rounded bg-dark-950/80 border border-slate-800/80 text-[11px] text-amber-200/80 italic line-clamp-2">
                        "{clip.subtitles[0].text}"
                      </div>
                    )}
                  </div>

                  {/* Footer Meta & Download Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{Math.round(clip.duration)}s • 9:16 Short</span>
                    </span>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadClip(clip)}
                      className="bg-dark-950 hover:bg-slate-800 text-white font-semibold text-xs py-1 px-2.5"
                      leftIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
                    >
                      Download MP4
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security, Privacy, and Platform Notice */}
      <div className="p-4 rounded-xl bg-dark-900/40 border border-slate-800/80 flex items-start gap-3 text-[11px] text-slate-400 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Privacy & Platform Integrity Guard: </span>
          ClipForge AI processes source media privately in temporary backend storage and automatically removes master source files upon completion. Full source videos are never published or publicly hosted. Only finished clips are accessible by the authenticated user.
        </div>
      </div>
    </div>
  );
};
