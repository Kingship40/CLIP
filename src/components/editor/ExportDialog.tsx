import React, { useState } from 'react';
import { Clip, Project, FaceTrackingMode } from '../../types';
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
import { useToastStore } from '../../store/useToastStore';

export interface ExportDialogProps {
  clip?: Clip | null;
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  facePanX?: number;
  framingMode?: FaceTrackingMode;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  clip,
  project,
  isOpen,
  onClose,
  facePanX = 50,
  framingMode = 'auto',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'srt' | 'vtt' | 'json' | 'mp4'>('mp4');
  const [exportFraming, setExportFraming] = useState<FaceTrackingMode>(framingMode || clip?.faceTrackingMode || 'auto');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const targetTitle = clip ? clip.title : project?.name || 'Clips Export';

  const handleExport = async () => {
    const safeName = (clip?.title || project?.name || 'clip')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    if (selectedFormat === 'srt') {
      if (!clip && (!project || project.clips.length === 0)) {
        addToast({ title: 'No subtitles available to export', type: 'warning' });
        return;
      }
      const subtitles = clip ? clip.subtitles : project!.clips[0].subtitles;
      const startOffset = clip ? clip.startTime : 0;
      const srtData = exportToSRT(subtitles, startOffset);
      downloadText(srtData, `${safeName}_captions.srt`, 'text/plain');
      addToast({ title: 'SRT Subtitles Exported', message: 'Time-aligned relative to clip start. Ready for Premiere, CapCut, or DaVinci.', type: 'success' });
      onClose();
      return;
    }

    if (selectedFormat === 'vtt') {
      if (!clip && (!project || project.clips.length === 0)) {
        addToast({ title: 'No subtitles available to export', type: 'warning' });
        return;
      }
      const subtitles = clip ? clip.subtitles : project!.clips[0].subtitles;
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

    if (selectedFormat === 'mp4') {
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

        // 1. If clip already has a tokenized server download endpoint, fetch directly
        if (videoSource.startsWith('/api/media/clips/')) {
          addToast({
            title: 'Downloading Clip...',
            message: 'Fetching rendered MP4 with synchronized AAC audio and captions.',
            type: 'info',
          });
          setExportProgress(50);
          await downloadVideoFile(videoSource, `${safeName}_clip.mp4`);
          setExportProgress(100);
          addToast({
            title: 'Clip Downloaded!',
            message: `Saved ${safeName}_clip.mp4 with audio and captions.`,
            type: 'success',
          });
          return;
        }

        addToast({
          title: 'Exporting Clipped Video...',
          message: `Slicing segment from ${start.toFixed(1)}s to ${end.toFixed(1)}s with burned-in captions & synchronized audio.`,
          type: 'info',
        });

        const subtitles = clip?.subtitles || (project?.clips?.[0]?.subtitles) || [];
        const captionSettings = clip?.captionSettings || project?.config?.captionSettings;
        const faceCoords = clip?.faceCoordinates;
        const faceData = faceCoords ? {
          x: faceCoords.x,
          y: faceCoords.y,
          width: faceCoords.width || 25,
          height: faceCoords.height || 35,
        } : undefined;

        // 2. Try native server-side FFmpeg rendering first (fast, lossy-free, guaranteed AAC audio)
        let serverRenderSuccess = false;
        try {
          setExportProgress(20);
          const response = await fetch('/api/media/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceVideoUrl: videoSource,
              startTime: start,
              endTime: end,
              aspectRatio: aspect,
              facePanX,
              subtitles,
              captionSettings,
              keepAudio: true,
            }),
          });

          if (response.ok && (response.headers.get('content-type')?.includes('video') || response.headers.get('content-type')?.includes('octet-stream'))) {
            setExportProgress(85);
            const blob = await response.blob();
            downloadBlob(blob, `${safeName}_clip.mp4`);
            serverRenderSuccess = true;
            addToast({
              title: 'Clipped Video Downloaded (FFmpeg AAC)',
              message: `High-fidelity MP4 saved with audio & burned-in captions.`,
              type: 'success',
            });
          }
        } catch (serverErr) {
          console.info('Server-side FFmpeg rendering unavailable, using in-browser pipeline:', serverErr);
        }

        // 3. Fallback to client-side video clipping recorder with Web Audio API capture
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
            subtitles,
            captionSettings,
            faceData
          );

          downloadBlob(result.blob, `${safeName}_clip.${result.extension}`);
          addToast({
            title: 'Clipped Video File Downloaded!',
            message: `Saved ${safeName}_clip.${result.extension} with audio, burned-in captions & ${exportFraming.toUpperCase()} framing.`,
            type: 'success',
          });
        }
      } catch (err: any) {
        console.warn('Clipping export failed, falling back to direct video file download:', err);
        await downloadVideoFile(videoSource, `${safeName}_video.mp4`);
        addToast({
          title: 'Video File Downloaded',
          message: 'Saved video file directly to your downloads.',
          type: 'success',
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
        {/* Export Formats Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Output Format:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* SRT */}
            <button
              type="button"
              onClick={() => setSelectedFormat('srt')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'srt'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-dark-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">SubRip (.SRT)</span>
                <span className="text-[11px] text-slate-400">Word-synced subtitles for video editors</span>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold uppercase">
                  ✓ Instant Download
                </span>
              </div>
            </button>

            {/* VTT */}
            <button
              type="button"
              onClick={() => setSelectedFormat('vtt')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'vtt'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-dark-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <FileCode className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">WebVTT (.VTT)</span>
                <span className="text-[11px] text-slate-400">Web video player caption standard</span>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold uppercase">
                  ✓ Instant Download
                </span>
              </div>
            </button>

            {/* JSON */}
            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'json'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-dark-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <FileCode className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Project Data (.JSON)</span>
                <span className="text-[11px] text-slate-400">Timestamps, viral scores, configs</span>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold uppercase">
                  ✓ Instant Download
                </span>
              </div>
            </button>

            {/* Clipped Video Export */}
            <button
              type="button"
              onClick={() => setSelectedFormat('mp4')}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedFormat === 'mp4'
                  ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-dark-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Video className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Clipped Video File (.WebM / .MP4)</span>
                <span className="text-[11px] text-slate-400">
                  Trimmed from {clip?.startTime !== undefined ? clip.startTime.toFixed(1) : '0.0'}s to{' '}
                  {clip?.endTime !== undefined ? clip.endTime.toFixed(1) : '30.0'}s
                </span>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold uppercase">
                  ✓ Direct Video Download
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Speaker Framing & Face Capture Selection (For MP4/WebM clipping) */}
        {selectedFormat === 'mp4' && (
          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Camera Framing & Face Capture:</span>
              </label>
              <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
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
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-glow-cyan'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">🎯 AI Track</span>
                <span className="text-[9px] text-slate-500">Auto Face Centered</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('left')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'left'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">👈 Left Host</span>
                <span className="text-[9px] text-slate-500">25% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('center')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'center'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">⊙ Center</span>
                <span className="text-[9px] text-slate-500">50% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('right')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'right'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">👉 Right Guest</span>
                <span className="text-[9px] text-slate-500">75% Pan Lock</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('split-dual')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'split-dual'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">👥 Dual Stack</span>
                <span className="text-[9px] text-slate-500">Podcast 2-Speaker</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFraming('fit-blur')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  exportFraming === 'fit-blur'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                    : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-semibold text-[11px]">🖼️ Fit + Blur</span>
                <span className="text-[9px] text-slate-500">Full 16:9 Uncropped</span>
              </button>
            </div>
          </div>
        )}

        {/* Video Render / Slicer Info */}
        {selectedFormat === 'mp4' ? (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Browser Video Slicer & Exporter</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-mono bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                {clip ? `${(clip.endTime - clip.startTime).toFixed(1)}s Segment` : 'Trimmed Clip'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              The browser will record and slice the exact trimmed segment directly into a playable video file (.webm / .mp4) and save it directly to your downloads!
            </p>
            {isExportingVideo && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                  <span>Slicing & Recording Video Stream...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Files are generated locally in your browser with zero latency.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isExportingVideo}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            isLoading={isExportingVideo}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {selectedFormat === 'mp4' ? 'Download Clipped Video File' : `Download ${selectedFormat.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
