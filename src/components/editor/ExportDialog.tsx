import React, { useState } from 'react';
import { Clip, Project, FaceTrackingMode, CaptionSettings } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Download,
  FileCode,
  FileText,
  Video,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Server,
  Target,
  Users,
  VolumeX,
  Layers,
  User,
  Check,
  Crosshair,
  Maximize2,
} from 'lucide-react';
import {
  exportToSRT,
  exportToVTT,
  exportProjectJSON,
  downloadText,
  downloadBlob,
  downloadVideoFile,
  exportClippedVideoBlob,
} from '../../utils/videoHelpers';
import { ensureWordTimings } from '../../services/transcriptionService';
import { useToastStore } from '../../store/useToastStore';

export interface ExportDialogProps {
  clip?: Clip | null;
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  facePanX?: number;
  framingMode?: FaceTrackingMode;
}

export type ExportFormatOption = 'mp4-burned' | 'mp4-clean' | 'bundle' | 'srt' | 'vtt' | 'json';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  clip,
  project,
  isOpen,
  onClose,
  facePanX = 50,
  framingMode = 'auto',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatOption>('mp4-burned');
  const [exportFraming, setExportFraming] = useState<FaceTrackingMode>(framingMode || clip?.faceTrackingMode || 'auto');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const targetTitle = clip ? clip.title : project?.name || 'Clips Export';
  const rawSubtitles = clip ? clip.subtitles : project?.clips?.[0]?.subtitles || [];
  const subtitles = rawSubtitles.map(ensureWordTimings);
  const hasSpeech = subtitles.length > 0;

  const handleExport = async () => {
    const safeName = (clip?.title || project?.name || 'clip')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    if (selectedFormat === 'srt') {
      if (!hasSpeech) {
        addToast({ title: 'No Speech Detected', message: 'No subtitles available to export for this silent/music clip.', type: 'warning' });
        return;
      }
      const startOffset = clip ? clip.startTime : 0;
      const srtData = exportToSRT(subtitles, startOffset);
      downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
      addToast({ title: 'SRT Subtitles Exported', message: 'Time-aligned relative to clip start. Ready for Premiere, CapCut, or DaVinci.', type: 'success' });
      onClose();
      return;
    }

    if (selectedFormat === 'vtt') {
      if (!hasSpeech) {
        addToast({ title: 'No Speech Detected', message: 'No subtitles available to export for this silent/music clip.', type: 'warning' });
        return;
      }
      const startOffset = clip ? clip.startTime : 0;
      const vttData = exportToVTT(subtitles, startOffset);
      downloadText(vttData, `${safeName}_captions.vtt`, 'text/vtt');
      addToast({ title: 'WebVTT Captions Exported', message: 'Time-aligned relative to clip start. Ready for web players and social platforms.', type: 'success' });
      onClose();
      return;
    }

    if (selectedFormat === 'json') {
      if (project) {
        const jsonData = exportProjectJSON(project);
        downloadText(jsonData, `${safeName}_project_data.json`, 'application/json');
        addToast({ title: 'Project JSON Exported', message: 'All clip timestamps, aspect ratios, and settings saved.', type: 'success' });
        onClose();
      } else if (clip) {
        downloadText(JSON.stringify(clip, null, 2), `${clip.title}_metadata.json`, 'application/json');
        addToast({ title: 'Clip Metadata JSON Exported', type: 'success' });
        onClose();
      }
      return;
    }

    // Video exports: mp4-burned, mp4-clean, or bundle
    const isVideoExport = selectedFormat === 'mp4-burned' || selectedFormat === 'mp4-clean' || selectedFormat === 'bundle';
    if (isVideoExport) {
      const videoSource = clip?.videoUrl || project?.sourceVideo?.url;
      if (!videoSource) {
        addToast({ title: 'No video source found to export', type: 'error' });
        return;
      }

      setIsExportingVideo(true);
      setExportProgress(10);

      try {
        const start = clip ? clip.startTime : 0;
        const end = clip ? clip.endTime : Math.min(30, project?.sourceVideo?.duration || 30);
        const aspect = clip?.aspectRatio || '9:16';

        // Configure subtitle burning based on choice
        const shouldBurnCaptions = (selectedFormat === 'mp4-burned' || selectedFormat === 'bundle') && hasSpeech;
        const exportCaptionSettings: CaptionSettings = shouldBurnCaptions
          ? {
              ...(clip?.captionSettings || project?.config?.captionSettings || {}),
              enabled: true,
              preset: clip?.captionSettings?.preset || project?.config?.captionSettings?.preset || 'hormozi',
              fontSize: clip?.captionSettings?.fontSize || project?.config?.captionSettings?.fontSize || 'md',
              position: clip?.captionSettings?.position || project?.config?.captionSettings?.position || 'bottom',
              yOffset: clip?.captionSettings?.yOffset || project?.config?.captionSettings?.yOffset,
              fontFamily: clip?.captionSettings?.fontFamily || project?.config?.captionSettings?.fontFamily || 'Montserrat',
              highlightColor: clip?.captionSettings?.highlightColor || project?.config?.captionSettings?.highlightColor || '#FACC15',
              textColor: clip?.captionSettings?.textColor || project?.config?.captionSettings?.textColor || '#FFFFFF',
              activeWordBgColor: clip?.captionSettings?.activeWordBgColor || project?.config?.captionSettings?.activeWordBgColor || '#FACC15',
              activeWordTextColor: clip?.captionSettings?.activeWordTextColor || project?.config?.captionSettings?.activeWordTextColor || '#000000',
              displayMode: clip?.captionSettings?.displayMode || project?.config?.captionSettings?.displayMode || 'word-highlight',
              textCase: clip?.captionSettings?.textCase || project?.config?.captionSettings?.textCase || 'uppercase',
              outlineWidth: clip?.captionSettings?.outlineWidth || project?.config?.captionSettings?.outlineWidth || 'medium',
              outlineColor: clip?.captionSettings?.outlineColor || project?.config?.captionSettings?.outlineColor || '#000000',
              showOpeningTitle: false,
            }
          : {
              enabled: false,
              preset: 'minimal',
              fontSize: 'md',
              position: 'bottom',
              highlightColor: '#FACC15',
              textColor: '#FFFFFF',
              showOpeningTitle: false,
            };

        const exportSubtitles = shouldBurnCaptions ? subtitles : [];

        // 0. If clip already has a final rendered subtitled MP4 (or clean video requested with originalVideoUrl)
        const directDownloadUrl = (selectedFormat === 'mp4-burned' || selectedFormat === 'bundle')
          ? (clip?.subtitledVideoUrl || videoSource)
          : (clip?.originalVideoUrl || videoSource);

        if (directDownloadUrl && (directDownloadUrl.startsWith('http://') || directDownloadUrl.startsWith('https://') || directDownloadUrl.startsWith('/api/media/clips/'))) {
          addToast({
            title: 'Downloading Subtitled MP4...',
            message: 'Fetching rendered video with synchronized burned-in captions.',
            type: 'info',
          });
          setExportProgress(50);
          await downloadVideoFile(directDownloadUrl, `${safeName}_clip.mp4`);
          setExportProgress(100);

          if (selectedFormat === 'bundle' && hasSpeech) {
            const srtData = exportToSRT(subtitles, start);
            downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
          }

          addToast({
            title: 'Clip Downloaded!',
            message: `Saved ${safeName}_clip.mp4 with audio ${selectedFormat === 'bundle' ? 'and matching .SRT subtitles' : ''}.`,
            type: 'success',
          });
          setIsExportingVideo(false);
          onClose();
          return;
        }

        // 1. If clip already has a tokenized server download endpoint and clean/bundle was requested, fetch directly
        if (videoSource.startsWith('/api/media/clips/')) {
          addToast({
            title: 'Downloading Clip...',
            message: 'Fetching rendered MP4 with synchronized AAC audio.',
            type: 'info',
          });
          setExportProgress(50);
          await downloadVideoFile(videoSource, `${safeName}_clip.mp4`);
          setExportProgress(100);

          if (selectedFormat === 'bundle' && hasSpeech) {
            const srtData = exportToSRT(subtitles, start);
            downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
          }

          addToast({
            title: 'Clip Downloaded!',
            message: `Saved ${safeName}_clip.mp4 with audio ${selectedFormat === 'bundle' ? 'and matching .SRT subtitles' : ''}.`,
            type: 'success',
          });
          return;
        }

        addToast({
          title: shouldBurnCaptions ? 'Exporting Video with Burned-In Captions...' : 'Exporting Clean Video Clip...',
          message: `Slicing segment from ${start.toFixed(1)}s to ${end.toFixed(1)}s with synchronized audio.`,
          type: 'info',
        });

        const faceCoords = clip?.faceCoordinates;
        const faceData = faceCoords ? {
          x: faceCoords.x,
          y: faceCoords.y,
          width: faceCoords.width || 25,
          height: faceCoords.height || 35,
        } : undefined;

        // 2. Try native server-side FFmpeg rendering first
        let serverRenderSuccess = false;
        try {
          setExportProgress(25);
          const response = await fetch('/api/media/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceVideoUrl: videoSource,
              startTime: start,
              endTime: end,
              aspectRatio: aspect,
              facePanX,
              subtitles: exportSubtitles,
              captionSettings: exportCaptionSettings,
              keepAudio: true,
            }),
          });

          if (response.ok && (response.headers.get('content-type')?.includes('video') || response.headers.get('content-type')?.includes('octet-stream'))) {
            setExportProgress(85);
            const blob = await response.blob();
            downloadBlob(blob, `${safeName}_clip.mp4`);
            serverRenderSuccess = true;

            if (selectedFormat === 'bundle' && hasSpeech) {
              const srtData = exportToSRT(subtitles, start);
              downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
            }

            addToast({
              title: shouldBurnCaptions ? 'Burned-In Subtitle MP4 Downloaded' : 'Clean Video Clip Downloaded',
              message: `High-fidelity MP4 saved with synchronized AAC audio${selectedFormat === 'bundle' ? ' + .SRT subtitles' : ''}.`,
              type: 'success',
            });
          }
        } catch (serverErr) {
          console.info('Server-side FFmpeg rendering unavailable, using in-browser pipeline:', serverErr);
        }

        // 3. Fallback to client-side video clipping recorder
        if (!serverRenderSuccess) {
          const result = await exportClippedVideoBlob(
            videoSource,
            start,
            end,
            aspect,
            undefined,
            (prog) => setExportProgress(prog),
            facePanX,
            exportFraming,
            exportSubtitles,
            exportCaptionSettings,
            faceData
          );

          const fileExt = (selectedFormat === 'mp4-burned' || selectedFormat === 'mp4-clean') ? 'mp4' : result.extension;
          downloadBlob(result.blob, `${safeName}_clip.${fileExt}`);

          if (selectedFormat === 'bundle' && hasSpeech) {
            const srtData = exportToSRT(subtitles, start);
            downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
          }

          addToast({
            title: shouldBurnCaptions ? 'Burned-In Subtitle MP4 Downloaded!' : 'Clean Video File Downloaded!',
            message: `Saved ${safeName}_clip.${fileExt} with synchronized audio${selectedFormat === 'bundle' ? ' + .SRT subtitles' : ''}.`,
            type: 'success',
          });
        }
      } catch (err: any) {
        console.error('Clipping export failed:', err);
        addToast({
          title: 'Export Failed',
          message: `Unable to export video: ${err.message || 'Media processing error'}. Please verify video source access.`,
          type: 'error',
        });
      } finally {
        setIsExportingVideo(false);
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export & Download Hub"
      description={`Export assets for: ${targetTitle}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Non-speech informative notification banner */}
        {!hasSpeech && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs flex items-start gap-3">
            <VolumeX className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold block text-amber-800 dark:text-amber-200">No Spoken Dialogue Detected</span>
              <span className="text-amber-700 dark:text-amber-200/80 text-[11px] leading-tight block mt-0.5">
                This video clip contains no speech or vocal dialogue. It can be exported cleanly as high-fidelity video without subtitles.
              </span>
            </div>
          </div>
        )}

        {/* Export Formats Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Select Output Format:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Burned-in Subtitles MP4 */}
            <button
              type="button"
              onClick={() => setSelectedFormat('mp4-burned')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'mp4-burned'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Video className="w-5 h-5 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">Burned-in Subtitles (MP4)</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Permanently etched captions + synchronized AAC audio
                </span>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">
                  <Sparkles className="w-3 h-3" /> Recommended for TikTok & Reels
                </span>
              </div>
            </button>

            {/* 2. Clean Video (Subtitles Disabled) MP4 */}
            <button
              type="button"
              onClick={() => setSelectedFormat('mp4-clean')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'mp4-clean'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Video className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">Clean Video (No Subtitles)</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Crisp trimmed video with synchronized audio, no captions
                </span>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  <Check className="w-3 h-3" /> Clean Footage
                </span>
              </div>
            </button>

            {/* 3. Bundle: Video & Subtitles Together */}
            <button
              type="button"
              onClick={() => setSelectedFormat('bundle')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'bundle'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Layers className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">Video & Subtitles Together</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Clean MP4 video + synchronized .SRT subtitle file
                </span>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                  <Check className="w-3 h-3" /> Full Editing Package
                </span>
              </div>
            </button>

            {/* 4. SRT Subtitles Only */}
            <button
              type="button"
              onClick={() => setSelectedFormat('srt')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'srt'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">SubRip (.SRT) Subtitles</span>
                <span className="text-[11px] text-[var(--text-muted)]">Word-synced subtitles for video editors</span>
                <span className="inline-block mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                  ✓ Instant Download
                </span>
              </div>
            </button>

            {/* 5. WebVTT Only */}
            <button
              type="button"
              onClick={() => setSelectedFormat('vtt')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'vtt'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <FileCode className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">WebVTT (.VTT) Captions</span>
                <span className="text-[11px] text-[var(--text-muted)]">Web standard for HTML5 players & YouTube</span>
                <span className="inline-block mt-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                  ✓ Instant Download
                </span>
              </div>
            </button>

            {/* 6. JSON Data */}
            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'json'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block">Project Data (.JSON)</span>
                <span className="text-[11px] text-[var(--text-muted)]">Timestamps, viral scores, configs</span>
                <span className="inline-block mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">
                  ✓ Metadata Export
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Speaker Framing & Face Capture Selection (For MP4 clipping) */}
        {(selectedFormat === 'mp4-burned' || selectedFormat === 'mp4-clean' || selectedFormat === 'bundle') && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Camera Framing & Face Capture:</span>
              </label>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold uppercase">
                {exportFraming === 'auto'
                  ? `AI Auto (${Math.round(facePanX)}%)`
                  : exportFraming}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setExportFraming('auto')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'auto'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><Sparkles className="w-3 h-3 inline mr-1 text-cyan-600 dark:text-cyan-400" />AI Track</span>
                <span className="text-[9px] text-[var(--text-muted)]">Auto Face Centered</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('left')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'left'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><User className="w-3 h-3 inline mr-1 text-cyan-600 dark:text-cyan-400" />Left Host</span>
                <span className="text-[9px] text-[var(--text-muted)]">25% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('center')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'center'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><Crosshair className="w-3 h-3 inline mr-1 text-cyan-600 dark:text-cyan-400" />Center</span>
                <span className="text-[9px] text-[var(--text-muted)]">50% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('right')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'right'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><User className="w-3 h-3 inline mr-1 text-cyan-600 dark:text-cyan-400" />Right Guest</span>
                <span className="text-[9px] text-[var(--text-muted)]">75% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('split-dual')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'split-dual'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><Users className="w-3 h-3 inline mr-1 text-amber-600 dark:text-amber-400" />Dual Stack</span>
                <span className="text-[9px] text-[var(--text-muted)]">Podcast 2-Speaker</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('fit-blur')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'fit-blur'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-[11px]"><Maximize2 className="w-3 h-3 inline mr-1 text-purple-600 dark:text-purple-400" />Fit + Blur</span>
                <span className="text-[9px] text-[var(--text-muted)]">Full 16:9 Uncropped</span>
              </button>
            </div>
          </div>
        )}

        {/* Video Render / Slicer Info */}
        {(selectedFormat === 'mp4-burned' || selectedFormat === 'mp4-clean' || selectedFormat === 'bundle') ? (
          <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-xs text-cyan-900 dark:text-cyan-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {selectedFormat === 'mp4-burned'
                    ? 'Burned-In Subtitle Video Rendering'
                    : selectedFormat === 'bundle'
                      ? 'Video + Subtitle Bundle Export'
                      : 'Clean Video Stream Exporter'}
                </span>
              </div>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono bg-cyan-100 dark:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/30">
                {clip ? `${(clip.endTime - clip.startTime).toFixed(1)}s Segment` : 'Trimmed Clip'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              The system will slice and render the exact trimmed segment with synchronized AAC audio and save it directly to your downloads!
            </p>
            {isExportingVideo && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-700 dark:text-cyan-300">
                  <span>Rendering & Encoding Video Stream...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 text-xs text-[var(--text-secondary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Files are generated locally in your browser with zero latency.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)] dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isExportingVideo}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            isLoading={isExportingVideo}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {selectedFormat === 'mp4-burned'
              ? 'Download Burned-in Subtitle MP4'
              : selectedFormat === 'mp4-clean'
                ? 'Download Clean MP4 Video'
                : selectedFormat === 'bundle'
                  ? 'Download Video & Subtitles Together'
                  : `Download ${selectedFormat.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
