import React, { useRef, useState, useEffect } from 'react';
import { Clip, AspectRatio, FaceTrackingMode } from '../../types';
import { CaptionOverlay } from './CaptionOverlay';
import { formatDuration, formatDurationPrecise } from '../../utils/formatters';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Repeat,
  AlertCircle,
  Target,
  Sparkles,
  Users,
  Eye,
  User,
  Crosshair,
} from 'lucide-react';
import { detectSpeakerFaceCentroid, detectSpeakerFaceAdvanced, FaceCentroidResult } from '../../utils/videoHelpers';
import { facePipelineInstance } from '../../services/face/facePipeline';

export interface VideoPlayerProps {
  clip: Clip;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  aspectRatio: AspectRatio;
  onFramingChange?: (mode: FaceTrackingMode, panX: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  clip,
  currentTime,
  onTimeUpdate,
  aspectRatio,
  onFramingChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [hasError, setHasError] = useState(false);

  // AI Active Speaker Face Tracking State
  const [framingMode, setFramingMode] = useState<FaceTrackingMode>(clip.faceTrackingMode || 'auto');
  const [facePanX, setFacePanX] = useState<number>(clip.faceCoordinates?.x ?? 50);
  const [faceData, setFaceData] = useState<FaceCentroidResult | null>(null);
  const [showFaceHUD, setShowFaceHUD] = useState<boolean>(true);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const lastFaceCheckRef = useRef<number>(0);

  // Sync video time when external timeline changes
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.4) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // If we are at or past the clip end time, loop back to clip start
      if (videoRef.current.currentTime >= clip.endTime || videoRef.current.currentTime < clip.startTime) {
        videoRef.current.currentTime = clip.startTime;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Keyboard shortcut (Spacebar) for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, clip]);

  // Enforce clip bounds and run AI face tracking during playback
  const handleTimeUpdateInternal = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    onTimeUpdate(time);

    // AI Face-Tracking & Camera Gliding for 9:16 vertical shorts (Throttled to maintain smooth 60fps playback)
    const now = Date.now();
    const vElem = videoRef.current;
    if (aspectRatio === '9:16' && vElem && vElem.readyState >= 2 && now - lastFaceCheckRef.current > 500) {
      lastFaceCheckRef.current = now;
      if (framingMode === 'auto') {
        detectSpeakerFaceAdvanced(vElem).then((detected) => {
          setFaceData(detected);
          if (detected.confidence > 0.1 && Math.abs(detected.x - facePanX) > 2) {
            setFacePanX(detected.x);
            onFramingChange?.('auto', detected.x);
          }
        }).catch(() => {
          if (!videoRef.current) return;
          const detected = detectSpeakerFaceCentroid(videoRef.current, facePanX);
          setFaceData(detected);
          if (detected.confidence > 0.1 && Math.abs(detected.x - facePanX) > 2) {
            const target = detected.x;
            setFacePanX((prev) => {
              const next = prev + (target - prev) * 0.18;
              const rounded = Math.round(next * 10) / 10;
              onFramingChange?.('auto', rounded);
              return rounded;
            });
          }
        });
      } else if (framingMode === 'left') {
        if (Math.abs(facePanX - 25) > 1) {
          setFacePanX(25);
          onFramingChange?.('left', 25);
        }
      } else if (framingMode === 'center') {
        if (Math.abs(facePanX - 50) > 1) {
          setFacePanX(50);
          onFramingChange?.('center', 50);
        }
      } else if (framingMode === 'right') {
        if (Math.abs(facePanX - 75) > 1) {
          setFacePanX(75);
          onFramingChange?.('right', 75);
        }
      }
    }

    // If playback reached the clip end time
    if (videoRef.current && time >= clip.endTime) {
      if (isLooping) {
        videoRef.current.currentTime = clip.startTime;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSelectFraming = (mode: FaceTrackingMode) => {
    setFramingMode(mode);
    facePipelineInstance.updateConfig({ compositionMode: mode });
    let pan = 50;
    if (mode === 'left') pan = 25;
    else if (mode === 'center') pan = 50;
    else if (mode === 'right') pan = 75;
    else if (mode === 'auto' && videoRef.current && videoRef.current.readyState >= 2) {
      const vEl = videoRef.current;
      detectSpeakerFaceAdvanced(vEl).then((detected) => {
        setFaceData(detected);
        setFacePanX(detected.x);
        onFramingChange?.(mode, detected.x);
      }).catch(() => {
        if (!videoRef.current) return;
        const detected = detectSpeakerFaceCentroid(videoRef.current, 50);
        setFaceData(detected);
        setFacePanX(detected.x);
        onFramingChange?.(mode, detected.x);
      });
      return;
    }
    setFacePanX(pan);
    onFramingChange?.(mode, pan);
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

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Aspect ratio wrapper styling
  const aspectStyles: Record<AspectRatio, string> = {
    '9:16': 'aspect-[9/16] max-h-[580px]',
    '16:9': 'aspect-video max-h-[480px]',
    '1:1': 'aspect-square max-h-[500px]',
    '21:9': 'aspect-[21/9] max-h-[420px]',
    '4:3': 'aspect-[4/3] max-h-[500px]',
    'original': 'aspect-video max-h-[480px]',
  };

  return (
    <div className="flex flex-col items-center w-full space-y-2.5">
      {/* AI Face Framing Toolbar (for 9:16 vertical shorts) */}
      {aspectRatio === '9:16' && (
        <div className="flex flex-wrap items-center justify-between w-full max-w-lg px-3 py-1.5 bg-dark-950/90 rounded-xl border border-cyan-500/30 text-xs shadow-md backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Face Reframe:</span>
            </span>

            <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-0.5 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleSelectFraming('auto')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                  framingMode === 'auto'
                    ? 'bg-cyan-500 text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="AI dynamic face tracking"
              >
                <Sparkles className="w-3 h-3" /> Auto ({Math.round(facePanX)}%)
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('left')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  framingMode === 'left' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User className="w-3 h-3" /> Left
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('center')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  framingMode === 'center' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Crosshair className="w-3 h-3" /> Center
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('right')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  framingMode === 'right' ? 'bg-cyan-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User className="w-3 h-3" /> Right
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('split-dual')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  framingMode === 'split-dual' ? 'bg-amber-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Dual Speaker Stack"
              >
                <Users className="w-3 h-3" /> Dual
              </button>

              <button
                type="button"
                onClick={() => handleSelectFraming('fit-blur')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  framingMode === 'fit-blur' ? 'bg-purple-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Fit full 16:9 with ambient blurred background"
              >
                <Maximize2 className="w-3 h-3" /> Fit
              </button>
            </div>

            {/* Detected Tracks Badges */}
            {faceData?.detectedFaces && faceData.detectedFaces.length > 0 && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                <span className="text-[9px] text-slate-400 font-mono">Tracks:</span>
                {faceData.detectedFaces.map((f, i) => {
                  const isSelected = selectedTrackId === f.trackId;
                  const isPrimary = !selectedTrackId && faceData.trackId === f.trackId;
                  return (
                    <button
                      key={f.trackId ?? i}
                      type="button"
                      onClick={() => f.trackId && handleSelectTrack(f.trackId)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 border ${
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

          <button
            type="button"
            onClick={() => setShowFaceHUD(!showFaceHUD)}
            className={`px-1.5 py-0.5 rounded-md border text-[9px] font-mono transition-colors ${
              showFaceHUD ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-dark-900 text-slate-500 border-slate-800'
            }`}
          >
            {showFaceHUD ? 'HUD ON' : 'HUD OFF'}
          </button>
        </div>
      )}

      {/* Player Container */}
      <div
        ref={containerRef}
        className={`relative w-full ${aspectStyles[aspectRatio]} bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center`}
      >
        {/* Video Element */}
        {clip.videoUrl ? (
          framingMode === 'fit-blur' && aspectRatio === '9:16' ? (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
              <video
                src={clip.videoUrl}
                playsInline
                muted
                className="w-full h-full object-cover filter blur-2xl scale-125 opacity-55 pointer-events-none absolute inset-0"
              />
              <video
                ref={videoRef}
                src={clip.videoUrl}
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain relative z-10"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdateInternal}
                onError={() => setHasError(true)}
              />
            </div>
          ) : framingMode === 'split-dual' && aspectRatio === '9:16' ? (
            <div className="relative w-full h-full overflow-hidden flex flex-col">
              <div className="w-full h-1/2 overflow-hidden relative border-b-2 border-cyan-500/70">
                <video
                  ref={videoRef}
                  src={clip.videoUrl}
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '25% 35%' }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdateInternal}
                  onError={() => setHasError(true)}
                />
                <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-cyan-500/40 pointer-events-none z-10">
                  Host (Left)
                </span>
              </div>
              <div className="w-full h-1/2 overflow-hidden relative">
                <video
                  src={clip.videoUrl}
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '75% 35%' }}
                />
                <span className="absolute top-2 left-2 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/40 pointer-events-none z-10">
                  Guest (Right)
                </span>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={clip.videoUrl}
              playsInline
              muted={isMuted}
              style={{
                objectPosition: aspectRatio === '9:16' ? `${facePanX}% 40%` : undefined,
              }}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdateInternal}
              onError={() => setHasError(true)}
            />
          )
        ) : (
          <div className="text-center p-6 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-medium">Video Source Offline</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Upload a local file or load a sample video to preview live video frames.
            </p>
          </div>
        )}

        {/* AI Face Reticle for 9:16 Player */}
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

        {/* Live Caption Overlay Synchronized with Playhead (rendered if not already permanently burned into video) */}
        {!clip.subtitledVideoUrl && (
          <CaptionOverlay
            subtitles={clip.subtitles}
            currentTime={currentTime}
            settings={clip.captionSettings}
            clipStartTime={clip.startTime}
            clipEndTime={clip.endTime}
          />
        )}

        {/* Big Center Play/Pause Overlay Button */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between z-20 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Left: Play/Pause, Rewind, Time */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = clip.startTime;
                  onTimeUpdate(clip.startTime);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Jump to clip start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] text-slate-300 ml-1">
              {formatDurationPrecise(currentTime)} / {formatDurationPrecise(clip.endTime)}
            </span>
          </div>

          {/* Right: Volume, Loop, Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLooping ? 'text-brand-400 bg-white/10' : 'text-slate-400 hover:text-white'
              }`}
              title={isLooping ? 'Looping enabled' : 'Looping disabled'}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
