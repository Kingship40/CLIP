import React, { useRef, useState, useEffect } from 'react';
import { formatDuration, formatDurationPrecise } from '../../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Split,
  Eye,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Target,
  Users,
} from 'lucide-react';
import { CaptionOverlay } from '../editor/CaptionOverlay';
import { SubtitleSegment, CaptionSettings, FaceTrackingMode } from '../../types';
import { detectSpeakerFaceCentroid, detectSpeakerFaceAdvanced, FaceCentroidResult } from '../../utils/videoHelpers';
import { facePipelineInstance } from '../../services/face/facePipeline';

export interface BeforeAfterVideoPlayerProps {
  originalVideoUrl: string;
  processedVideoUrl: string;
  originalThumbnail?: string;
  processedThumbnail?: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  startTime?: number;
  endTime?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '21:9';
  processedTitle?: string;
  selectedStyle?: string;
  subtitles?: SubtitleSegment[];
  showCaptions?: boolean;
  captionSettings?: CaptionSettings;
  onToggleCaptions?: () => void;
  faceTrackingMode?: FaceTrackingMode;
  onFramingModeChange?: (mode: FaceTrackingMode) => void;
  facePanX?: number;
  onFacePanXChange?: (panX: number) => void;
}

const STYLE_FILTERS: Record<string, { filter: string; overlay?: string; badge: string }> = {
  'Cyberpunk Neo-Tokyo': {
    filter: 'contrast(135%) saturate(190%) hue-rotate(185deg) brightness(110%)',
    overlay: 'bg-gradient-to-t from-cyan-900/25 via-transparent to-purple-900/25 mix-blend-color-dodge',
    badge: 'CYBERPUNK NEON',
  },
  'Studio Ghibli Anime': {
    filter: 'contrast(130%) saturate(160%) brightness(116%) sepia(18%)',
    overlay: 'bg-gradient-to-b from-amber-400/10 via-transparent to-rose-400/10 mix-blend-soft-light',
    badge: 'GHIBLI ANIME',
  },
  '3D Pixar Animation': {
    filter: 'contrast(120%) saturate(145%) brightness(112%) sepia(10%)',
    overlay: 'bg-radial from-transparent to-indigo-950/20 mix-blend-overlay',
    badge: 'PIXAR 3D',
  },
  'Hyper-Realistic Cinema': {
    filter: 'contrast(130%) saturate(88%) brightness(95%) sepia(20%)',
    overlay: 'bg-gradient-to-r from-teal-950/20 via-transparent to-amber-950/20 mix-blend-multiply',
    badge: '35MM ARRI CINEMA',
  },
  'Claymation Stop-Motion': {
    filter: 'contrast(145%) saturate(115%) brightness(105%) sepia(30%)',
    overlay: 'bg-amber-900/10 mix-blend-color-burn',
    badge: 'CLAYMATION 12FPS',
  },
  'Vintage 90s VHS': {
    filter: 'contrast(125%) saturate(145%) hue-rotate(12deg) brightness(112%)',
    overlay: 'bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent mix-blend-overlay',
    badge: 'VHS ANALOG TAPE',
  },
  'Sci-Fi Hologram': {
    filter: 'contrast(160%) saturate(220%) hue-rotate(160deg) brightness(125%)',
    overlay: 'bg-cyan-500/10 mix-blend-screen',
    badge: 'SCI-FI HOLOGRAM',
  },
  'Oil Painting Masterpiece': {
    filter: 'contrast(135%) saturate(130%) sepia(45%)',
    overlay: 'bg-amber-800/15 mix-blend-soft-light',
    badge: 'OIL PAINTING',
  },
};

export const BeforeAfterVideoPlayer: React.FC<BeforeAfterVideoPlayerProps> = ({
  originalVideoUrl,
  processedVideoUrl,
  originalThumbnail,
  processedThumbnail,
  currentTime,
  onTimeUpdate,
  startTime = 0,
  endTime = 30,
  aspectRatio = '9:16',
  processedTitle = 'Seedance 2.5 AI Processed',
  selectedStyle = 'Cyberpunk Neo-Tokyo',
  subtitles = [],
  showCaptions = true,
  captionSettings = {
    enabled: true,
    preset: 'hormozi',
    fontSize: 'md',
    position: 'bottom',
    highlightColor: '#FACC15',
    textColor: '#FFFFFF',
    showOpeningTitle: false,
  },
  onToggleCaptions,
  faceTrackingMode = 'auto',
  onFramingModeChange,
  facePanX = 50,
  onFacePanXChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalVidRef = useRef<HTMLVideoElement>(null);
  const processedVidRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [activeAudioStream, setActiveAudioStream] = useState<'processed' | 'original'>('processed');
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'ai-only' | 'original-only'>('split');

  // AI Face-Tracking & Camera Framing State
  const [framingMode, setFramingMode] = useState<FaceTrackingMode>(faceTrackingMode);
  const [smoothedPanX, setSmoothedPanX] = useState<number>(facePanX);
  const [faceData, setFaceData] = useState<FaceCentroidResult | null>(null);
  const [showFaceHUD, setShowFaceHUD] = useState<boolean>(true);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // Sync with parent props
  useEffect(() => {
    if (faceTrackingMode) setFramingMode(faceTrackingMode);
  }, [faceTrackingMode]);

  useEffect(() => {
    if (facePanX !== undefined) setSmoothedPanX(facePanX);
  }, [facePanX]);

  // Synchronize playback times
  useEffect(() => {
    if (originalVidRef.current && Math.abs(originalVidRef.current.currentTime - currentTime) > 0.3) {
      originalVidRef.current.currentTime = currentTime;
    }
    if (processedVidRef.current && Math.abs(processedVidRef.current.currentTime - currentTime) > 0.3) {
      processedVidRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    const play = !isPlaying;
    setIsPlaying(play);

    if (play) {
      if (originalVidRef.current) {
        if (originalVidRef.current.currentTime >= endTime || originalVidRef.current.currentTime < startTime) {
          originalVidRef.current.currentTime = startTime;
        }
        originalVidRef.current.play().catch(() => {});
      }
      if (processedVidRef.current) {
        if (processedVidRef.current.currentTime >= endTime || processedVidRef.current.currentTime < startTime) {
          processedVidRef.current.currentTime = startTime;
        }
        processedVidRef.current.play().catch(() => {});
      }
    } else {
      originalVidRef.current?.pause();
      processedVidRef.current?.pause();
    }
  };

  const handleTimeUpdate = () => {
    const vid = processedVidRef.current || originalVidRef.current;
    if (!vid) return;

    onTimeUpdate(vid.currentTime);

    // Loop within startTime and endTime
    if (vid.currentTime >= endTime) {
      if (originalVidRef.current) originalVidRef.current.currentTime = startTime;
      if (processedVidRef.current) processedVidRef.current.currentTime = startTime;
    }

    // Dynamic Face Detection & Auto-Framing for 9:16 vertical crop
    if (aspectRatio === '9:16' && vid.readyState >= 2) {
      if (framingMode === 'auto') {
        detectSpeakerFaceAdvanced(vid).then((detected) => {
          setFaceData(detected);
          if (detected.confidence > 0.1) {
            setSmoothedPanX(detected.x);
            onFacePanXChange?.(detected.x);
          }
        }).catch(() => {
          const detected = detectSpeakerFaceCentroid(vid, smoothedPanX);
          setFaceData(detected);
          if (detected.confidence > 0.1) {
            const targetX = detected.x;
            setSmoothedPanX((prev) => {
              const next = prev + (targetX - prev) * 0.18;
              const rounded = Math.round(next * 10) / 10;
              onFacePanXChange?.(rounded);
              return rounded;
            });
          }
        });
      } else if (framingMode === 'left') {
        setSmoothedPanX((prev) => {
          const next = prev + (25 - prev) * 0.25;
          const rounded = Math.round(next * 10) / 10;
          onFacePanXChange?.(rounded);
          return rounded;
        });
      } else if (framingMode === 'center') {
        setSmoothedPanX((prev) => {
          const next = prev + (50 - prev) * 0.25;
          const rounded = Math.round(next * 10) / 10;
          onFacePanXChange?.(rounded);
          return rounded;
        });
      } else if (framingMode === 'right') {
        setSmoothedPanX((prev) => {
          const next = prev + (75 - prev) * 0.25;
          const rounded = Math.round(next * 10) / 10;
          onFacePanXChange?.(rounded);
          return rounded;
        });
      }
    }
  };

  const handleSelectFraming = (mode: FaceTrackingMode) => {
    setFramingMode(mode);
    onFramingModeChange?.(mode);
    facePipelineInstance.updateConfig({ compositionMode: mode });
    if (mode === 'left') {
      setSmoothedPanX(25);
      onFacePanXChange?.(25);
    } else if (mode === 'center') {
      setSmoothedPanX(50);
      onFacePanXChange?.(50);
    } else if (mode === 'right') {
      setSmoothedPanX(75);
      onFacePanXChange?.(75);
    } else if (mode === 'auto') {
      const vid = processedVidRef.current || originalVidRef.current;
      if (vid && vid.readyState >= 2) {
        detectSpeakerFaceAdvanced(vid).then((detected) => {
          setFaceData(detected);
          setSmoothedPanX(detected.x);
          onFacePanXChange?.(detected.x);
        }).catch(() => {
          const detected = detectSpeakerFaceCentroid(vid, 50);
          setFaceData(detected);
          setSmoothedPanX(detected.x);
          onFacePanXChange?.(detected.x);
        });
      }
    }
  };

  const handleSelectTrack = (trackId: number) => {
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
      facePipelineInstance.updateConfig({ selectedTrackId: null });
    } else {
      setSelectedTrackId(trackId);
      facePipelineInstance.updateConfig({ selectedTrackId: trackId });
    }
  };

  // Dragging slider logic
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) handleSliderMove(e.clientX);
    };
    const onMouseUp = () => setIsDraggingSlider(false);

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length > 0) handleSliderMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingSlider]);

  const aspectStyles: Record<string, string> = {
    '9:16': 'aspect-[9/16] max-h-[580px]',
    '16:9': 'aspect-video max-h-[480px]',
    '1:1': 'aspect-square max-h-[520px]',
    '21:9': 'aspect-[21/9] max-h-[420px]',
  };

  const activeStyleObj = STYLE_FILTERS[selectedStyle] || STYLE_FILTERS['Cyberpunk Neo-Tokyo'];

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const stepTime = (delta: number) => {
    const next = Math.max(startTime, Math.min(endTime, currentTime + delta));
    if (originalVidRef.current) originalVidRef.current.currentTime = next;
    if (processedVidRef.current) processedVidRef.current.currentTime = next;
    onTimeUpdate(next);
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      {/* Top View Mode & Control Switcher */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl px-2 gap-2 text-xs">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-dark-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'side-by-side' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ai-only')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'ai-only' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Enhanced</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('original-only')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'original-only' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>
        </div>

        {/* Right Tools: Captions Toggle & Audio Stream */}
        <div className="flex items-center gap-2">
          {onToggleCaptions && (
            <button
              type="button"
              onClick={onToggleCaptions}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all ${
                showCaptions
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-dark-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle AI Subtitles Overlay"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>{showCaptions ? 'Captions ON' : 'Captions OFF'}</span>
            </button>
          )}

          {/* Audio Track Selector */}
          <div className="flex items-center gap-1.5 bg-dark-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Audio:</span>
            <button
              type="button"
              onClick={() => setActiveAudioStream(activeAudioStream === 'processed' ? 'original' : 'processed')}
              className="text-xs font-semibold text-cyan-300 hover:text-white transition-colors"
            >
              {activeAudioStream === 'processed' ? '✨ Seedance 48kHz' : 'Source'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Camera Framing & Speaker Tracking Toolbar (9:16 vertical modes) */}
      {aspectRatio === '9:16' && (
        <div className="flex flex-wrap items-center justify-between w-full max-w-3xl px-3 py-2 bg-dark-950/90 rounded-2xl border border-cyan-500/30 text-xs shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Face Reframe:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1 bg-dark-900 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSelectFraming('auto')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  framingMode === 'auto'
                    ? 'bg-gradient-to-r from-cyan-500 to-brand-500 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Auto-detect speaker face and dynamically glide camera"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>🎯 Auto Track ({Math.round(smoothedPanX)}%)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('left')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  framingMode === 'left' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Frame Left Speaker (~25% X)"
              >
                👈 Left
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('center')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  framingMode === 'center' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Frame Center Stage (~50% X)"
              >
                ⊙ Center
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('right')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  framingMode === 'right' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Frame Right Speaker (~75% X)"
              >
                👉 Right
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('split-dual')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                  framingMode === 'split-dual' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Dual Speaker Stack for 2-person interviews/podcasts"
              >
                <Users className="w-3 h-3" />
                <span>👥 Dual Split</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('fit-blur')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                  framingMode === 'fit-blur' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Full 16:9 uncropped view with ambient blurred fill"
              >
                <Maximize2 className="w-3 h-3" />
                <span>🖼️ Fit+Blur</span>
              </button>
            </div>

            {/* Detected Tracks Badges */}
            {faceData?.detectedFaces && faceData.detectedFaces.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Tracks:</span>
                {faceData.detectedFaces.map((f, i) => {
                  const isSelected = selectedTrackId === f.trackId;
                  const isPrimary = !selectedTrackId && faceData.trackId === f.trackId;
                  return (
                    <button
                      key={f.trackId ?? i}
                      type="button"
                      onClick={() => f.trackId && handleSelectTrack(f.trackId)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-cyan-500 text-white border-cyan-400 shadow-glow-cyan'
                          : isPrimary
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                          : 'bg-dark-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title={
                        isSelected
                          ? `Locked to Track #${f.trackId} (Click to release lock)`
                          : `Click to lock framing on Track #${f.trackId}`
                      }
                    >
                      <Target className="w-2.5 h-2.5 text-cyan-400" />
                      <span>#{f.trackId ?? i + 1}</span>
                      {f.isSpeaking && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Active speech" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* HUD Toggle */}
          <button
            type="button"
            onClick={() => setShowFaceHUD(!showFaceHUD)}
            className={`px-2.5 py-1 rounded-xl border text-[10px] font-mono font-semibold transition-all flex items-center gap-1 ${
              showFaceHUD
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-dark-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle AI Face Tracking Bounding Reticle"
          >
            <Eye className="w-3 h-3" />
            <span>{showFaceHUD ? 'Face Reticle: ON' : 'Face Reticle: OFF'}</span>
          </button>
        </div>
      )}

      {/* Main Video Viewport */}
      {viewMode === 'side-by-side' ? (
        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Left: Original */}
          <div className={`relative ${aspectStyles[aspectRatio]} bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center`}>
            {framingMode === 'fit-blur' && aspectRatio === '9:16' ? (
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <video
                  src={originalVideoUrl}
                  playsInline
                  muted
                  className="w-full h-full object-cover filter blur-2xl scale-125 opacity-55 pointer-events-none absolute inset-0"
                />
                <video
                  ref={originalVidRef}
                  src={originalVideoUrl}
                  playsInline
                  muted={isMuted || activeAudioStream !== 'original'}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
            ) : framingMode === 'split-dual' && aspectRatio === '9:16' ? (
              <div className="relative w-full h-full overflow-hidden flex flex-col">
                <div className="w-full h-1/2 overflow-hidden relative border-b-2 border-cyan-500/70">
                  <video
                    ref={originalVidRef}
                    src={originalVideoUrl}
                    playsInline
                    muted={isMuted || activeAudioStream !== 'original'}
                    onTimeUpdate={handleTimeUpdate}
                    style={{ objectPosition: '25% 35%' }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none z-10">
                    Host (Left)
                  </span>
                </div>
                <div className="w-full h-1/2 overflow-hidden relative">
                  <video
                    src={originalVideoUrl}
                    playsInline
                    muted={isMuted || activeAudioStream !== 'original'}
                    style={{ objectPosition: '75% 35%' }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/40 pointer-events-none z-10">
                    Guest (Right)
                  </span>
                </div>
              </div>
            ) : (
              <video
                ref={originalVidRef}
                src={originalVideoUrl}
                playsInline
                muted={isMuted || activeAudioStream !== 'original'}
                onTimeUpdate={handleTimeUpdate}
                style={{
                  objectPosition: aspectRatio === '9:16' ? `${smoothedPanX}% 40%` : undefined,
                }}
                className="w-full h-full object-cover"
              />
            )}

            <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 pointer-events-none z-10">
              Original Video
            </span>

            {/* AI Face Reticle for Left side */}
            {aspectRatio === '9:16' && showFaceHUD && framingMode !== 'fit-blur' && framingMode !== 'split-dual' && (
              <div
                className="absolute pointer-events-none z-20 transition-all duration-150 ease-out"
                style={{
                  left: '50%',
                  top: `${faceData?.y || 32}%`,
                  width: '135px',
                  height: '155px',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`w-full h-full relative border rounded-xl ${
                  faceData?.isSpeaking ? 'border-emerald-400/60 bg-emerald-500/5' : 'border-cyan-400/40 bg-cyan-500/5'
                }`}>
                  <div className={`absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${faceData?.isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'} shadow-glow-cyan animate-ping`} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-950/90 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/60 shadow flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
                    <span>TRACK #{faceData?.trackId ?? 1}</span>
                    {faceData?.isSpeaking ? (
                      <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SPEAKING
                      </span>
                    ) : (
                      <span className="text-slate-400">• {Math.round((faceData?.confidence || 0.95) * 100)}%</span>
                    )}
                  </div>
                  {faceData?.explanation && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-dark-950/90 text-[9px] text-slate-300 font-sans px-2 py-0.5 rounded border border-slate-700/60 shadow whitespace-nowrap max-w-[180px] truncate">
                      {faceData.explanation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Captions Overlay */}
            {showCaptions && (
              <CaptionOverlay
                subtitles={subtitles}
                currentTime={currentTime}
                settings={captionSettings}
                clipStartTime={startTime}
                clipEndTime={endTime}
              />
            )}
          </div>

          {/* Right: Seedance 2.5 Processed with AI Generative Filter & Overlay */}
          <div className={`relative ${aspectStyles[aspectRatio]} bg-black rounded-2xl overflow-hidden border border-cyan-500/50 shadow-glow-cyan flex items-center justify-center`}>
            {framingMode === 'fit-blur' && aspectRatio === '9:16' ? (
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <video
                  src={processedVideoUrl}
                  playsInline
                  muted
                  className="w-full h-full object-cover filter blur-2xl scale-125 opacity-55 pointer-events-none absolute inset-0"
                />
                <video
                  ref={processedVidRef}
                  src={processedVideoUrl}
                  playsInline
                  muted={isMuted || activeAudioStream !== 'processed'}
                  style={{ filter: activeStyleObj.filter }}
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
            ) : framingMode === 'split-dual' && aspectRatio === '9:16' ? (
              <div className="relative w-full h-full overflow-hidden flex flex-col">
                <div className="w-full h-1/2 overflow-hidden relative border-b-2 border-cyan-500/70">
                  <video
                    ref={processedVidRef}
                    src={processedVideoUrl}
                    playsInline
                    muted={isMuted || activeAudioStream !== 'processed'}
                    style={{ objectPosition: '25% 35%', filter: activeStyleObj.filter }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none z-10">
                    Host (Left)
                  </span>
                </div>
                <div className="w-full h-1/2 overflow-hidden relative">
                  <video
                    src={processedVideoUrl}
                    playsInline
                    muted={isMuted || activeAudioStream !== 'processed'}
                    style={{ objectPosition: '75% 35%', filter: activeStyleObj.filter }}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/40 pointer-events-none z-10">
                    Guest (Right)
                  </span>
                </div>
              </div>
            ) : (
              <video
                ref={processedVidRef}
                src={processedVideoUrl}
                playsInline
                muted={isMuted || activeAudioStream !== 'processed'}
                style={{
                  objectPosition: aspectRatio === '9:16' ? `${smoothedPanX}% 40%` : undefined,
                  filter: activeStyleObj.filter,
                }}
                className="w-full h-full object-cover"
              />
            )}

            {activeStyleObj.overlay && (
              <div className={`absolute inset-0 ${activeStyleObj.overlay} pointer-events-none z-10`} />
            )}
            <span className="absolute top-3 left-3 bg-cyan-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 pointer-events-none z-10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeStyleObj.badge}</span>
            </span>

            {/* AI Face Reticle for Right side */}
            {aspectRatio === '9:16' && showFaceHUD && framingMode !== 'fit-blur' && framingMode !== 'split-dual' && (
              <div
                className="absolute pointer-events-none z-20 transition-all duration-150 ease-out"
                style={{
                  left: '50%',
                  top: `${faceData?.y || 32}%`,
                  width: '135px',
                  height: '155px',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`w-full h-full relative border rounded-xl ${
                  faceData?.isSpeaking ? 'border-emerald-400/60 bg-emerald-500/5' : 'border-cyan-400/40 bg-cyan-500/5'
                }`}>
                  <div className={`absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${faceData?.isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'} shadow-glow-cyan animate-ping`} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-950/90 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/60 shadow flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
                    <span>TRACK #{faceData?.trackId ?? 1}</span>
                    {faceData?.isSpeaking ? (
                      <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SPEAKING
                      </span>
                    ) : (
                      <span className="text-slate-400">• {Math.round((faceData?.confidence || 0.95) * 100)}%</span>
                    )}
                  </div>
                  {faceData?.explanation && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-dark-950/90 text-[9px] text-slate-300 font-sans px-2 py-0.5 rounded border border-slate-700/60 shadow whitespace-nowrap max-w-[180px] truncate">
                      {faceData.explanation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Captions Overlay */}
            {showCaptions && (
              <CaptionOverlay
                subtitles={subtitles}
                currentTime={currentTime}
                settings={captionSettings}
                clipStartTime={startTime}
                clipEndTime={endTime}
              />
            )}
          </div>
        </div>
      ) : (
        /* Split-Screen Slider / Single View */
        <div
          ref={containerRef}
          className={`relative w-full ${aspectStyles[aspectRatio]} bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group select-none`}
        >
          {/* Base Layer: Original Video */}
          {framingMode === 'fit-blur' && aspectRatio === '9:16' ? (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center absolute inset-0">
              <video
                src={originalVideoUrl}
                playsInline
                muted
                className="w-full h-full object-cover filter blur-2xl scale-125 opacity-55 pointer-events-none absolute inset-0"
              />
              <video
                ref={originalVidRef}
                src={originalVideoUrl}
                playsInline
                muted={isMuted || activeAudioStream !== 'original'}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain relative z-10"
              />
            </div>
          ) : framingMode === 'split-dual' && aspectRatio === '9:16' ? (
            <div className="relative w-full h-full overflow-hidden flex flex-col absolute inset-0">
              <div className="w-full h-1/2 overflow-hidden relative border-b-2 border-cyan-500/70">
                <video
                  ref={originalVidRef}
                  src={originalVideoUrl}
                  playsInline
                  muted={isMuted || activeAudioStream !== 'original'}
                  onTimeUpdate={handleTimeUpdate}
                  style={{ objectPosition: '25% 35%' }}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none z-10">
                  Host (Left)
                </span>
              </div>
              <div className="w-full h-1/2 overflow-hidden relative">
                <video
                  src={originalVideoUrl}
                  playsInline
                  muted={isMuted || activeAudioStream !== 'original'}
                  style={{ objectPosition: '75% 35%' }}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/40 pointer-events-none z-10">
                  Guest (Right)
                </span>
              </div>
            </div>
          ) : (
            <video
              ref={originalVidRef}
              src={originalVideoUrl}
              playsInline
              muted={isMuted || activeAudioStream !== 'original'}
              onTimeUpdate={handleTimeUpdate}
              style={{
                objectPosition: aspectRatio === '9:16' ? `${smoothedPanX}% 40%` : undefined,
              }}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}

          {/* Overlay Layer: Seedance 2.5 AI Video (Clipped by slider position) */}
          {viewMode !== 'original-only' && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath:
                  viewMode === 'ai-only'
                    ? 'inset(0% 0% 0% 0%)'
                    : `inset(0 0 0 ${sliderPos}%)`,
              }}
            >
              {framingMode === 'fit-blur' && aspectRatio === '9:16' ? (
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <video
                    src={processedVideoUrl}
                    playsInline
                    muted
                    className="w-full h-full object-cover filter blur-2xl scale-125 opacity-55 pointer-events-none absolute inset-0"
                  />
                  <video
                    ref={processedVidRef}
                    src={processedVideoUrl}
                    playsInline
                    muted={isMuted || activeAudioStream !== 'processed'}
                    style={{ filter: activeStyleObj.filter }}
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              ) : framingMode === 'split-dual' && aspectRatio === '9:16' ? (
                <div className="relative w-full h-full overflow-hidden flex flex-col">
                  <div className="w-full h-1/2 overflow-hidden relative border-b-2 border-cyan-500/70">
                    <video
                      ref={processedVidRef}
                      src={processedVideoUrl}
                      playsInline
                      muted={isMuted || activeAudioStream !== 'processed'}
                      style={{ objectPosition: '25% 35%', filter: activeStyleObj.filter }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full h-1/2 overflow-hidden relative">
                    <video
                      src={processedVideoUrl}
                      playsInline
                      muted={isMuted || activeAudioStream !== 'processed'}
                      style={{ objectPosition: '75% 35%', filter: activeStyleObj.filter }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <video
                  ref={processedVidRef}
                  src={processedVideoUrl}
                  playsInline
                  muted={isMuted || activeAudioStream !== 'processed'}
                  style={{
                    objectPosition: aspectRatio === '9:16' ? `${smoothedPanX}% 40%` : undefined,
                    filter: activeStyleObj.filter,
                  }}
                  className="w-full h-full object-cover"
                />
              )}

              {activeStyleObj.overlay && (
                <div className={`absolute inset-0 ${activeStyleObj.overlay} pointer-events-none`} />
              )}
            </div>
          )}

          {/* AI Face Reticle for Split View */}
          {aspectRatio === '9:16' && showFaceHUD && framingMode !== 'fit-blur' && framingMode !== 'split-dual' && (
            <div
              className="absolute pointer-events-none z-20 transition-all duration-150 ease-out"
              style={{
                left: '50%',
                top: `${faceData?.y || 32}%`,
                width: '140px',
                height: '160px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className={`w-full h-full relative border rounded-xl ${
                faceData?.isSpeaking ? 'border-emerald-400/60 bg-emerald-500/5' : 'border-cyan-400/40 bg-cyan-500/5'
              }`}>
                <div className={`absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                <div className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 ${faceData?.isSpeaking ? 'border-emerald-400' : 'border-cyan-400'}`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${faceData?.isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'} shadow-glow-cyan animate-ping`} />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-950/90 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/60 shadow flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
                  <span>
                    {framingMode === 'auto'
                      ? `TRACK #${faceData?.trackId ?? 1}`
                      : `${framingMode.toUpperCase()} SPEAKER`}
                  </span>
                  {faceData?.isSpeaking ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SPEAKING
                    </span>
                  ) : (
                    <span className="text-slate-400">• {Math.round((faceData?.confidence || 0.95) * 100)}%</span>
                  )}
                </div>
                {faceData?.explanation && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-dark-950/90 text-[9px] text-slate-300 font-sans px-2 py-0.5 rounded border border-slate-700/60 shadow whitespace-nowrap max-w-[180px] truncate">
                    {faceData.explanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Draggable Vertical Divider Handle */}
          {viewMode === 'split' && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-2xl flex items-center justify-center -translate-x-1/2"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={() => setIsDraggingSlider(true)}
              onTouchStart={() => setIsDraggingSlider(true)}
            >
              <div className="w-8 h-8 rounded-full bg-white text-dark-950 font-bold text-xs flex items-center justify-center shadow-2xl border-2 border-dark-900 ring-2 ring-cyan-500/50 hover:scale-110 transition-transform">
                <Split className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Top Edge Labels */}
          {viewMode === 'split' && (
            <>
              <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 border border-slate-700 pointer-events-none z-10">
                Original
              </span>
              <span className="absolute top-3 right-3 bg-cyan-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none z-10 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {activeStyleObj.badge}
              </span>
            </>
          )}

          {/* Captions Overlay on Split Player */}
          {showCaptions && (
            <CaptionOverlay
              subtitles={subtitles}
              currentTime={currentTime}
              settings={captionSettings}
              clipStartTime={startTime}
              clipEndTime={endTime}
            />
          )}

          {/* Play/Pause Click Overlay */}
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          >
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-glow-cyan transform hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            )}
          </div>

          {/* Floating Bottom Video Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between z-30 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (originalVidRef.current) originalVidRef.current.currentTime = startTime;
                  if (processedVidRef.current) processedVidRef.current.currentTime = startTime;
                  onTimeUpdate(startTime);
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Restart clip to start boundary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Micro-steppers */}
              <button
                type="button"
                onClick={() => stepTime(-1.0)}
                className="p-1 rounded-md hover:bg-white/20 text-[10px] font-mono text-slate-300"
                title="Step backward 1s"
              >
                −1s
              </button>
              <button
                type="button"
                onClick={() => stepTime(1.0)}
                className="p-1 rounded-md hover:bg-white/20 text-[10px] font-mono text-slate-300"
                title="Step forward 1s"
              >
                +1s
              </button>

              <span className="font-mono text-[11px] text-slate-300 ml-1">
                {formatDurationPrecise(currentTime)} / {formatDurationPrecise(endTime)}
              </span>

              <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 border border-white/10">
                {(endTime - startTime).toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
