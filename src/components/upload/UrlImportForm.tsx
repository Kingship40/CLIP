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
  Facebook,
  Instagram,
  Twitter,
  Tv,
  FileVideo,
  Video,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { videoImportServiceInstance } from '../../services/import/videoImportService';
import {
  videoIngestionServiceInstance,
  StandardizedPlatformResponse,
} from '../../services/import/videoIngestionService';
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
  const [selectedDuration, setSelectedDuration] = useState<'15-30' | '30-60' | '60-90' | 'custom'>('30-60');
  const [customDuration, setCustomDuration] = useState<number>(45);
  const [livePlatformInfo, setLivePlatformInfo] = useState<StandardizedPlatformResponse | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const hasImportedRef = useRef<boolean>(false);

  // Debounced live platform detection and metadata preview
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setLivePlatformInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await videoIngestionServiceInstance.getStandardizedResponse(trimmed);
        if (response.platformName && response.platformName !== 'Unknown') {
          setLivePlatformInfo(response);
        } else {
          setLivePlatformInfo(null);
        }
      } catch {
        setLivePlatformInfo(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [url]);

  const renderPlatformIcon = (platformName: string) => {
    const p = platformName.toLowerCase();
    if (p.includes('youtube')) return <Youtube className="w-3.5 h-3.5 text-red-500" />;
    if (p.includes('facebook')) return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
    if (p.includes('instagram')) return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
    if (p.includes('tiktok')) return <Video className="w-3.5 h-3.5 text-cyan-500" />;
    if (p.includes('vimeo')) return <Film className="w-3.5 h-3.5 text-sky-500" />;
    if (p.includes('x') || p.includes('twitter')) return <Twitter className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />;
    if (p.includes('twitch')) return <Tv className="w-3.5 h-3.5 text-purple-500" />;
    return <FileVideo className="w-3.5 h-3.5 text-brand-500" />;
  };

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
      setActiveJob({ ...updated });
      if (updated.error && updated.status === 'failed') {
        setErrorMessage(updated.error);
      }
      if (
        updated.metadata &&
        onVideoImported &&
        !hasImportedRef.current &&
        (updated.stage === 'ready_to_download' ||
          updated.status === 'completed' ||
          updated.stage === 'action_required' ||
          updated.status === 'action_required')
      ) {
        hasImportedRef.current = true;
        onVideoImported({
          metadata: updated.metadata,
          videoUrl:
            updated.clips[0]?.videoUrl ||
            (updated.metadata as any)?.sourceUrl ||
            updated.sourceUrl ||
            'https://vjs.zencdn.net/v/oceans.mp4',
        });
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
    hasImportedRef.current = false;

    try {
      // 1. Direct handoff to studio if onVideoImported is available (Dashboard / New Project pages)
      let info = livePlatformInfo;
      if (!info || !info.videoTitle) {
        try {
          info = await videoIngestionServiceInstance.getStandardizedResponse(trimmed);
        } catch {
          info = null;
        }
      }

      if (onVideoImported && info && info.videoTitle && info.platformName !== 'Unknown') {
        const meta: any = {
          fileName: `${info.videoTitle.replace(/\.mp4$/, '')}.mp4`,
          fileSize: Math.round((info.duration || 60) * 1200000),
          fileType: 'video/mp4',
          duration: info.duration || 60,
          width: 1920,
          height: 1080,
          aspectRatio: '16:9',
          thumbnailUrl:
            info.thumbnail ||
            'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
          sourceUrl: trimmed,
          platformName: info.platformName,
          hasMediaAccess: info.processingEligibility,
          accessibilityStatus: info.accessibilityStatus,
          mediaAccessMessage: info.mediaAccessMessage,
        };

        hasImportedRef.current = true;
        onVideoImported({
          metadata: meta,
          videoUrl: info.videoUrl || trimmed || 'https://vjs.zencdn.net/v/oceans.mp4',
        });
        return;
      }

      // 2. Submit job to background queue for standalone processing
      if (activeJob && activeJob.status !== 'running') {
        backgroundJobQueueInstance.deleteJobResults(activeJob.id);
        setActiveJob(null);
      }

      const job = await backgroundJobQueueInstance.submitJob(trimmed, {
        forceNew: true,
        retentionPolicy: 'immediate',
        clipCount: 3,
        targetDuration: selectedDuration,
        targetDurationSeconds: selectedDuration === 'custom' ? customDuration : undefined,
        customDurationSeconds: selectedDuration === 'custom' ? customDuration : undefined,
      });

      setActiveJob({ ...job });
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
      <div
        className="rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Link2 className="w-5 h-5 text-brand-500" />
              <span>Multi-Platform Video Ingestion</span>
            </h3>

            {(livePlatformInfo || detectedProvider) && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {renderPlatformIcon(livePlatformInfo?.platformName || detectedProvider?.displayName || 'video')}
                <span>{livePlatformInfo?.platformName || detectedProvider?.displayName}</span>
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Paste a public video link from YouTube, Facebook, TikTok, Instagram, Vimeo, X, Twitch, or a direct MP4/S3 stream. The backend analyzes the actual audiovisual content privately without publishing the full video.
          </p>
        </div>

        {/* Input Form */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div
              className="flex items-center gap-2 border focus-within:border-brand-500 rounded-xl px-3.5 py-2.5 transition-colors shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
              }}
            >
              <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />

              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Paste YouTube, Facebook, TikTok, Instagram, Vimeo, X, Twitch or direct MP4 URL..."
                disabled={isProcessing || parentLoading}
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />

              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  title="Clear URL"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePasteClipboard}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-brand-500" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          {/* Live Detected Platform & Metadata Preview Card */}
          {livePlatformInfo && livePlatformInfo.videoTitle && (
            <div
              className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                {livePlatformInfo.thumbnail && (
                  <div
                    className="w-20 h-12 rounded-lg overflow-hidden shrink-0 border relative bg-black/10"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <img
                      src={livePlatformInfo.thumbnail}
                      alt={livePlatformInfo.videoTitle}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold px-1 rounded bg-black/80 text-white">
                      {formatDuration(livePlatformInfo.duration)}
                    </span>
                  </div>
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {renderPlatformIcon(livePlatformInfo.platformName)}
                    <span className="line-clamp-1">{livePlatformInfo.videoTitle}</span>
                  </div>
                  <div className="text-[11px] flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>Duration: <strong className="font-semibold text-[var(--text-primary)]">{Math.round(livePlatformInfo.duration / 60) > 0 ? `${Math.round(livePlatformInfo.duration / 60)} min` : `${Math.round(livePlatformInfo.duration)}s`}</strong></span>
                    {livePlatformInfo.creatorName && (
                      <>
                        <span>•</span>
                        <span>{livePlatformInfo.creatorName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {livePlatformInfo.processingEligibility ? (
                  <Badge variant="emerald" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready to process
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Action Required: Metadata Only
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Enforced Duration Selector */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>Enforced Clip Duration</span>
              </label>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                AI extracts moments strictly within this range
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '15-30', label: '15–30s', desc: 'Short hook' },
                { id: '30-60', label: '30–60s', desc: 'Balanced' },
                { id: '60-90', label: '60–90s', desc: 'Deep-dive' },
                { id: 'custom', label: 'Custom', desc: 'Exact target' },
              ].map((dur) => (
                <button
                  key={dur.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSelectedDuration(dur.id as any)}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                    selectedDuration === dur.id
                      ? 'bg-[#EAE8FF] border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white shadow-sm ring-1 ring-brand-500'
                      : 'hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: selectedDuration === dur.id ? undefined : 'var(--bg-surface-2)',
                    borderColor: selectedDuration === dur.id ? undefined : 'var(--border)',
                    color: selectedDuration === dur.id ? undefined : 'var(--text-secondary)',
                  }}
                >
                  <div>{dur.label}</div>
                  <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{dur.desc}</div>
                </button>
              ))}
            </div>

            {selectedDuration === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(5, parseInt(e.target.value) || 30))}
                  disabled={isProcessing}
                  placeholder="Target duration in seconds"
                  className="border text-xs rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:border-brand-500"
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>seconds (exact target duration)</span>
              </div>
            )}
          </div>

          {/* Quick Samples & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>Test Sources:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickSample('https://vjs.zencdn.net/v/oceans.mp4')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Direct MP4
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                YouTube Video
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.youtube.com/shorts/dQw4w9WgXcQ')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                YouTube Shorts
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.tiktok.com/@creator/video/1234567890')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                TikTok Reel
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.instagram.com/reel/C123456/')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Instagram Reel
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://vimeo.com/76979871')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Vimeo
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.facebook.com/watch/?v=1234567890')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://x.com/creator/status/1234567890123456789')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                X (Twitter)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('https://www.twitch.tv/videos/123456789')}
                disabled={isProcessing}
                className="text-[11px] px-2 py-0.5 rounded-lg border font-medium hover:border-brand-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Twitch
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isProcessing && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                disabled={!url.trim() || isProcessing || parentLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
                leftIcon={
                  isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )
                }
              >
                {isProcessing
                  ? 'Processing Privately...'
                  : (livePlatformInfo?.processingEligibility ? 'Generate AI Clips' : 'Process Video')}
              </Button>
            </div>
          </div>
        </form>

        {/* 11-Stage Progress & Status Indicator */}
        {isProcessing && activeJob && (
          <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950/80 border border-[var(--border)] dark:border-slate-800 space-y-2.5 animate-in fade-in duration-150 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)] dark:text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-cyan-400" />
                <span>
                  <span className="text-brand-600 dark:text-cyan-400 font-bold uppercase tracking-wider mr-1.5">
                    [{getStageHumanName(activeJob.stage)}]
                  </span>
                  {activeJob.metadata?.fileName
                    ? `Processing "${activeJob.metadata.fileName}" privately...`
                    : 'Running background ingestion & AI analysis...'}
                </span>
              </span>
              <span className="font-mono font-bold text-brand-600 dark:text-cyan-400">
                {activeJob.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-cyan-500 dark:to-brand-500 transition-all duration-300 ease-out"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Private Backend Workspace • Source video will not be published</span>
              </span>
              <span className="text-[var(--text-muted)] dark:text-slate-500">Retention: Immediate deletion on finish</span>
            </div>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <span className="font-bold block text-rose-700 dark:text-rose-300">Import Failed</span>
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
                  <div className="w-24 h-14 rounded-lg bg-[var(--bg-surface-2)] dark:bg-dark-950 overflow-hidden shrink-0 border border-[var(--border)] dark:border-slate-800 relative">
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
                  <div className="w-14 h-14 rounded-lg bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 flex items-center justify-center shrink-0 text-amber-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Action Required: Metadata Only</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                      by {activeJob.metadata.author || activeJob.providerName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--text-primary)] dark:text-white line-clamp-1">
                    {activeJob.metadata.fileName.replace(/\.mp4$/, '')}
                  </h4>

                  <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400">
                    Platform: <span className="text-[var(--text-primary)] dark:text-slate-300 font-semibold">{activeJob.providerName}</span> | Aspect Ratio: <span className="text-[var(--text-primary)] dark:text-slate-300 font-semibold">{activeJob.metadata.aspectRatio}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] dark:hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation of Limitation */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 dark:bg-dark-950/70 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">
                  Why is automatic media download unavailable?
                </span>
                <span>
                  {activeJob.error || activeJob.metadata.mediaAccessMessage}
                </span>
              </div>
            </div>

            {/* Guiding Action Row */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <span className="text-xs text-[var(--text-secondary)] dark:text-slate-400">
                To run viral AI clipping, upload the creator video file directly:
              </span>

              <div className="flex items-center gap-2">
                {onVideoImported && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onVideoImported({
                        metadata: activeJob.metadata!,
                        videoUrl:
                          activeJob.clips[0]?.videoUrl ||
                          (activeJob.metadata as any)?.sourceUrl ||
                          activeJob.sourceUrl ||
                          'https://vjs.zencdn.net/v/oceans.mp4',
                      });
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
                  >
                    Proceed with Video to Studio
                  </Button>
                )}
                {onSwitchToUpload && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onSwitchToUpload}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
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
                  className="border-[var(--border)] dark:border-slate-800 text-[var(--text-primary)] dark:text-slate-300 hover:bg-[var(--bg-surface-2)] dark:hover:text-white"
                >
                  Try Another Link
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION: Ready to Download (Generated Clips with Individual & All Downloads) */}
        {activeJob && activeJob.stage === 'ready_to_download' && activeJob.clips.length > 0 && (
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-950 border border-emerald-500/40 space-y-6 animate-in fade-in duration-300 shadow-lg">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-base font-bold text-[var(--text-primary)] dark:text-white">
                    Generated Short Clips Ready
                  </h4>
                  <Badge variant="emerald" size="sm">
                    {activeJob.clips.length} Clips Produced
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download All ({activeJob.clips.length})
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteResults}
                  className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
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
                  className="bg-[var(--bg-surface-2)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-brand-500/50 transition-all p-4 space-y-3 shadow-sm"
                >
                  {/* Clip Header & Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Score: {clip.viralScore}/100</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] dark:text-slate-400 bg-[var(--bg-surface)] dark:bg-dark-950 px-2 py-0.5 rounded border border-[var(--border)] dark:border-slate-800">
                      {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="space-y-1.5 flex-1">
                    <h5 className="text-sm font-bold text-[var(--text-primary)] dark:text-white line-clamp-2">
                      {clip.title}
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {clip.hookSummary || clip.description}
                    </p>
                    {clip.subtitles && clip.subtitles.length > 0 && (
                      <div className="p-2 rounded bg-[var(--bg-surface)] dark:bg-dark-950/80 border border-[var(--border)] dark:border-slate-800/80 text-[11px] text-[var(--text-secondary)] dark:text-amber-200/80 italic line-clamp-2">
                        "{clip.subtitles[0].text}"
                      </div>
                    )}
                  </div>

                  {/* Footer Meta & Download Action */}
                  <div className="pt-2 border-t border-[var(--border)] dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-secondary)] dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--text-muted)] dark:text-slate-500" />
                      <span>{Math.round(clip.duration)}s • 9:16 Short</span>
                    </span>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadClip(clip)}
                      className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border)] dark:bg-dark-950 dark:hover:bg-slate-800 dark:text-white font-semibold text-xs py-1 px-2.5 shadow-sm"
                      leftIcon={<Download className="w-3.5 h-3.5 text-brand-600 dark:text-cyan-400" />}
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
    </div>
  );
};
