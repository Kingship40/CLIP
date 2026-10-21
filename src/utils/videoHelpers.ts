import { VideoMetadata, SubtitleSegment, Project, Clip, CaptionSettings } from '../types';
import { renderCaptionToCanvas } from '../services/captionBurner';

/**
 * Extracts metadata from a user-uploaded video file in the browser.
 */
export async function extractVideoMetadata(file: File): Promise<{
  metadata: VideoMetadata;
  objectUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // Timeout safety in case video is corrupt or unsupported
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Video metadata extraction timed out. The file may be corrupt or in an unsupported format.'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      video.remove();
    };

    const onError = () => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video. Ensure the file is a valid MP4, MOV, or WebM video.'));
    };

    const onLoadedMetadata = () => {
      // Seek slightly into the video to capture a non-black thumbnail
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;

      video.addEventListener('seeked', function onSeeked() {
        video.removeEventListener('seeked', onSeeked);

        let thumbnailUrl = '';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (e) {
          console.warn('Could not generate canvas thumbnail:', e);
        }

        cleanup();

        // Calculate aspect ratio string
        const w = video.videoWidth;
        const h = video.videoHeight;
        let aspectRatio = '16:9';
        const ratio = w / h;
        if (Math.abs(ratio - 16 / 9) < 0.08) aspectRatio = '16:9';
        else if (Math.abs(ratio - 9 / 16) < 0.08) aspectRatio = '9:16';
        else if (Math.abs(ratio - 1) < 0.08) aspectRatio = '1:1';
        else if (Math.abs(ratio - 4 / 3) < 0.08) aspectRatio = '4:3';
        else aspectRatio = `${w}:${h}`;

        resolve({
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'video/mp4',
            duration: Math.round(video.duration * 10) / 10,
            width: w,
            height: h,
            aspectRatio,
            thumbnailUrl,
          },
          objectUrl,
        });
      }, { once: true });
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    video.src = objectUrl;
  });
}

/**
 * Sample video options for fast testing without needing a local video file
 */
export interface SampleVideo {
  id: string;
  title: string;
  category: string;
  duration: number;
  description: string;
  url: string;
  thumbnail: string;
}

export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'sample-podcast',
    title: 'Future of Generative AI & Creative Work',
    category: 'Podcast',
    duration: 185,
    description: 'A deep discussion on how artificial intelligence is transforming digital media, content repurposing, and video creators.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-interview',
    title: 'Founder Secrets: Scaling to $10M ARR',
    category: 'Interview',
    duration: 240,
    description: 'An interview covering tactical growth strategies, customer discovery, and building modern product teams.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-tutorial',
    title: 'Mastering Modern Web Architecture in 2026',
    category: 'Tutorial',
    duration: 310,
    description: 'Comprehensive breakdown of frontend state management, video streaming, and micro-animations.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  },
];

/**
 * Exports subtitle segments to SubRip (.srt) format
 */
export function exportToSRT(subtitles: SubtitleSegment[], clipStartTime: number = 0): string {
  function formatSRTTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  return subtitles
    .map((sub, index) => {
      const start = Math.max(0, sub.start >= clipStartTime && clipStartTime > 0 ? sub.start - clipStartTime : sub.start);
      const end = Math.max(start + 0.1, sub.end >= clipStartTime && clipStartTime > 0 ? sub.end - clipStartTime : sub.end);
      return `${index + 1}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${sub.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Exports subtitle segments to WebVTT (.vtt) format
 */
export function exportToVTT(subtitles: SubtitleSegment[], clipStartTime: number = 0): string {
  function formatVTTTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  const lines = ['WEBVTT\n'];
  subtitles.forEach((sub, index) => {
    const start = Math.max(0, sub.start >= clipStartTime && clipStartTime > 0 ? sub.start - clipStartTime : sub.start);
    const end = Math.max(start + 0.1, sub.end >= clipStartTime && clipStartTime > 0 ? sub.end - clipStartTime : sub.end);
    lines.push(`${index + 1}`);
    lines.push(`${formatVTTTime(start)} --> ${formatVTTTime(end)}`);
    lines.push(`${sub.text.trim()}\n`);
  });

  return lines.join('\n');
}

/**
 * Browser file download triggers
 */
export function downloadText(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportProjectJSON(project: Project): string {
  // Strip out large blob object URLs so JSON is pure metadata
  const cleanProject = {
    ...project,
    sourceVideo: {
      ...project.sourceVideo,
      url: undefined, // Don't serialize temporary blob URLs
    },
    clips: project.clips.map(c => ({
      ...c,
      videoUrl: undefined,
    })),
  };
  return JSON.stringify(cleanProject, null, 2);
}

/**
 * Triggers an instant download of the video file from a URL or Blob.
 */
export async function downloadVideoFile(videoUrl: string, filename: string): Promise<void> {
  try {
    const res = await fetch(videoUrl);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  } catch {
    // Fallback direct anchor click
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

import { facePipelineInstance } from '../services/face/facePipeline';

export interface FaceDetectionBox {
  x: number; // 0 to 100% horizontal center
  y: number; // 0 to 100% vertical center
  width: number; // % width
  height: number; // % height
  confidence: number; // 0 to 1
  speakerZone: 'left' | 'center' | 'right';
  trackId?: number;
  isSpeaking?: boolean;
  speakingScore?: number;
}

export interface FaceCentroidResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  speakerCount: number;
  speakerZone: 'left' | 'center' | 'right';
  detectedFaces: FaceDetectionBox[];
  trackId?: number;
  isSpeaking?: boolean;
  speakingScore?: number;
  panY?: number;
  explanation?: string;
}

/**
 * Advanced asynchronous face detection, tracking and reframing using FacePipeline.
 */
export async function detectSpeakerFaceAdvanced(
  video: HTMLVideoElement | HTMLCanvasElement,
  audioLevel: number = 0.5
): Promise<FaceCentroidResult> {
  try {
    const timestamp = 'currentTime' in video ? video.currentTime * 1000 : Date.now();
    const result = await facePipelineInstance.processFrame(video, timestamp, audioLevel);
    const primary = result.primaryTrack;

    const detectedFaces: FaceDetectionBox[] = result.tracks.map((t) => ({
      x: Math.round((t.box.x + t.box.width / 2) * 100),
      y: Math.round((t.box.y + t.box.height / 2) * 100),
      width: Math.round(t.box.width * 100),
      height: Math.round(t.box.height * 100),
      confidence: Math.round(t.confidence * 100) / 100,
      speakerZone: (t.box.x + t.box.width / 2) < 0.38 ? 'left' : (t.box.x + t.box.width / 2) > 0.62 ? 'right' : 'center',
      trackId: t.trackId,
      isSpeaking: t.isSpeaking,
      speakingScore: Math.round(t.speakingScore * 100) / 100,
    }));

    if (primary) {
      return {
        x: Math.round(result.reframing.panX),
        y: Math.round((primary.box.y + primary.box.height * 0.36) * 100),
        width: Math.round(primary.box.width * 100),
        height: Math.round(primary.box.height * 100),
        confidence: Math.round(primary.confidence * 100) / 100,
        speakerCount: result.tracks.length,
        speakerZone: result.reframing.panX < 38 ? 'left' : result.reframing.panX > 62 ? 'right' : 'center',
        detectedFaces,
        trackId: primary.trackId,
        isSpeaking: primary.isSpeaking,
        speakingScore: Math.round(primary.speakingScore * 100) / 100,
        panY: Math.round(result.reframing.panY),
        explanation: result.reframing.explanation,
      };
    }
  } catch (err) {
    console.warn('FacePipeline advanced frame processing error, falling back:', err);
  }

  return {
    x: 50,
    y: 35,
    width: 25,
    height: 35,
    confidence: 0.5,
    speakerCount: 1,
    speakerZone: 'center',
    detectedFaces: [],
    trackId: 1,
    isSpeaking: false,
    panY: 35,
    explanation: 'Holding default center reframing.',
  };
}

/**
 * Detects the primary speaker's face centroid, bounding box, confidence,
 * and multi-speaker zones using real-time canvas skin chrominance & luminance clustering.
 */
export function detectSpeakerFaceCentroid(
  video: HTMLVideoElement,
  fallbackX: number = 50
): FaceCentroidResult {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        x: fallbackX,
        y: 35,
        width: 25,
        height: 35,
        confidence: 0,
        speakerCount: 1,
        speakerZone: fallbackX < 38 ? 'left' : fallbackX > 62 ? 'right' : 'center',
        detectedFaces: [],
      };
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Define 3 spatial zones: Left (0-38%), Center (34-66%), Right (62-100%)
    const zones = {
      left: { weight: 0, wx: 0, wy: 0, minX: 160, maxX: 0, minY: 90, maxY: 0 },
      center: { weight: 0, wx: 0, wy: 0, minX: 160, maxX: 0, minY: 90, maxY: 0 },
      right: { weight: 0, wx: 0, wy: 0, minX: 160, maxX: 0, minY: 90, maxY: 0 },
    };

    // Human faces reside in the upper 75% of the frame
    const maxRow = Math.floor(canvas.height * 0.75);

    for (let y = 6; y < maxRow; y += 2) {
      for (let x = 6; x < canvas.width - 6; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Multi-ethnic skin chrominance locus check
        const total = r + g + b;
        if (total === 0) continue;
        const rNorm = r / total;
        const gNorm = g / total;

        const isSkin =
          r > 65 &&
          g > 30 &&
          b > 15 &&
          r > g &&
          r > b &&
          r - g >= 10 &&
          Math.abs(r - b) >= 10 &&
          rNorm > 0.36 &&
          rNorm < 0.65 &&
          gNorm > 0.24 &&
          gNorm < 0.38;

        if (isSkin) {
          // Weight pixels closer to typical head height (20-45% from top)
          const verticalBias = 1.0 - Math.abs((y - 30) / 45);
          const weight = Math.max(0.2, verticalBias);

          const pctX = (x / canvas.width) * 100;

          if (pctX < 40) {
            zones.left.weight += weight;
            zones.left.wx += x * weight;
            zones.left.wy += y * weight;
            zones.left.minX = Math.min(zones.left.minX, x);
            zones.left.maxX = Math.max(zones.left.maxX, x);
            zones.left.minY = Math.min(zones.left.minY, y);
            zones.left.maxY = Math.max(zones.left.maxY, y);
          } else if (pctX > 60) {
            zones.right.weight += weight;
            zones.right.wx += x * weight;
            zones.right.wy += y * weight;
            zones.right.minX = Math.min(zones.right.minX, x);
            zones.right.maxX = Math.max(zones.right.maxX, x);
            zones.right.minY = Math.min(zones.right.minY, y);
            zones.right.maxY = Math.max(zones.right.maxY, y);
          } else {
            zones.center.weight += weight;
            zones.center.wx += x * weight;
            zones.center.wy += y * weight;
            zones.center.minX = Math.min(zones.center.minX, x);
            zones.center.maxX = Math.max(zones.center.maxX, x);
            zones.center.minY = Math.min(zones.center.minY, y);
            zones.center.maxY = Math.max(zones.center.maxY, y);
          }
        }
      }
    }

    const detectedFaces: FaceDetectionBox[] = [];

    // Analyze Left Zone
    if (zones.left.weight > 20) {
      const cx = (zones.left.wx / zones.left.weight / canvas.width) * 100;
      const cy = (zones.left.wy / zones.left.weight / canvas.height) * 100;
      const w = Math.max(16, ((zones.left.maxX - zones.left.minX) / canvas.width) * 100);
      const h = Math.max(22, ((zones.left.maxY - zones.left.minY) / canvas.height) * 100);
      detectedFaces.push({
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.min(35, Math.round(w)),
        height: Math.min(45, Math.round(h)),
        confidence: Math.min(0.98, Math.round((zones.left.weight / 160) * 100) / 100),
        speakerZone: 'left',
      });
    }

    // Analyze Center Zone
    if (zones.center.weight > 20) {
      const cx = (zones.center.wx / zones.center.weight / canvas.width) * 100;
      const cy = (zones.center.wy / zones.center.weight / canvas.height) * 100;
      const w = Math.max(16, ((zones.center.maxX - zones.center.minX) / canvas.width) * 100);
      const h = Math.max(22, ((zones.center.maxY - zones.center.minY) / canvas.height) * 100);
      detectedFaces.push({
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.min(35, Math.round(w)),
        height: Math.min(45, Math.round(h)),
        confidence: Math.min(0.98, Math.round((zones.center.weight / 160) * 100) / 100),
        speakerZone: 'center',
      });
    }

    // Analyze Right Zone
    if (zones.right.weight > 20) {
      const cx = (zones.right.wx / zones.right.weight / canvas.width) * 100;
      const cy = (zones.right.wy / zones.right.weight / canvas.height) * 100;
      const w = Math.max(16, ((zones.right.maxX - zones.right.minX) / canvas.width) * 100);
      const h = Math.max(22, ((zones.right.maxY - zones.right.minY) / canvas.height) * 100);
      detectedFaces.push({
        x: Math.round(cx),
        y: Math.round(cy),
        width: Math.min(35, Math.round(w)),
        height: Math.min(45, Math.round(h)),
        confidence: Math.min(0.98, Math.round((zones.right.weight / 160) * 100) / 100),
        speakerZone: 'right',
      });
    }

    // If we found faces, select the strongest primary face
    if (detectedFaces.length > 0) {
      detectedFaces.sort((a, b) => b.confidence - a.confidence);
      const primary = detectedFaces[0];
      return {
        x: primary.x,
        y: primary.y,
        width: primary.width,
        height: primary.height,
        confidence: primary.confidence,
        speakerCount: detectedFaces.length,
        speakerZone: primary.speakerZone,
        detectedFaces,
      };
    }
  } catch {
    // If CORS or error, return fallback
  }

  return {
    x: fallbackX,
    y: 35,
    width: 25,
    height: 35,
    confidence: 0,
    speakerCount: 1,
    speakerZone: fallbackX < 38 ? 'left' : fallbackX > 62 ? 'right' : 'center',
    detectedFaces: [],
  };
}

/**
 * Records and slices the exact trimmed segment [startTime, endTime] of a video
 * in the browser using MediaRecorder + Canvas and returns a downloadable video Blob.
 * Dynamically frames the speaker's face using facePanX and framingMode ('auto' | 'left' | 'center' | 'right' | 'fit-blur' | 'split-dual').
 */
export async function exportClippedVideoBlob(
  videoUrl: string,
  startTime: number,
  endTime: number,
  aspectRatio: string = '9:16',
  filterCss?: string,
  onProgress?: (percent: number) => void,
  facePanX: number = 50,
  framingMode: string = 'auto',
  subtitles?: SubtitleSegment[],
  captionSettings?: CaptionSettings,
  faceData?: { x: number; y: number; width: number; height: number }
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = false; // Audio must be unmuted for Web Audio API capture
    video.volume = 1.0;
    video.src = videoUrl;

    const canvas = document.createElement('canvas');
    if (aspectRatio === '9:16') {
      canvas.width = 720;
      canvas.height = 1280;
    } else if (aspectRatio === '1:1') {
      canvas.width = 720;
      canvas.height = 720;
    } else {
      canvas.width = 1280;
      canvas.height = 720;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }

    const duration = Math.max(0.5, endTime - startTime);

    // Set up Web Audio API capture to route audio track directly into MediaRecorder
    let audioContext: AudioContext | null = null;
    let audioSource: MediaElementAudioSourceNode | null = null;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioContext = new AudioCtxClass();
        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {});
        }
        audioSource = audioContext.createMediaElementSource(video);
        audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        // Routed exclusively to destination node so export is silent to speaker but records audio!
      }
    } catch (e) {
      console.warn('Web Audio capture initialization error:', e);
    }

    const cleanup = () => {
      video.pause();
      video.src = '';
      video.remove();
      canvas.remove();
      if (audioSource) {
        try { audioSource.disconnect(); } catch (_) {}
      }
      if (audioDestination) {
        try { audioDestination.disconnect(); } catch (_) {}
      }
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (_) {}
      }
    };

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = startTime;

      video.addEventListener('seeked', () => {
        try {
          // Collect all audio tracks (from Web Audio destination or video captureStream)
          let audioTracks: MediaStreamTrack[] = [];
          if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
            audioTracks = audioDestination.stream.getAudioTracks();
          } else if (typeof (video as unknown as { captureStream?: () => MediaStream }).captureStream === 'function') {
            try {
              const vStream = (video as unknown as { captureStream: () => MediaStream }).captureStream();
              if (vStream && vStream.getAudioTracks().length > 0) {
                audioTracks = vStream.getAudioTracks();
              }
            } catch (err) {
              console.warn('video.captureStream() audio fallback failed:', err);
            }
          }

          const canvasStream = canvas.captureStream(30);
          const combinedTracks = [
            ...canvasStream.getVideoTracks(),
            ...audioTracks,
          ];
          const stream = new MediaStream(combinedTracks);

          const candidateMimes = [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
          ];
          let preferredMime = 'video/webm';
          let ext = 'webm';
          for (const m of candidateMimes) {
            if (MediaRecorder.isTypeSupported(m)) {
              preferredMime = m;
              ext = m.startsWith('video/mp4') ? 'mp4' : 'webm';
              break;
            }
          }

          const recorder = new MediaRecorder(stream, {
            mimeType: preferredMime,
            audioBitsPerSecond: 192000,
            videoBitsPerSecond: 3500000,
          });
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            const finalBlob = new Blob(chunks, { type: preferredMime });
            cleanup();
            resolve({ blob: finalBlob, mimeType: preferredMime, extension: ext });
          };

          recorder.start(100);

          let animFrameId: number;
          const drawFrame = () => {
            if (video.paused || video.ended || video.currentTime >= endTime) {
              if (recorder.state === 'recording') recorder.stop();
              cancelAnimationFrame(animFrameId);
              return;
            }

            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const cw = canvas.width;
            const ch = canvas.height;

            if (aspectRatio === '9:16' && framingMode === 'fit-blur') {
              // 1. Draw blurred ambient video background to fill 9:16 frame
              ctx.save();
              ctx.filter = 'blur(20px) brightness(50%)';
              const bgScale = Math.max(cw / vw, ch / vh);
              const bgW = vw * bgScale;
              const bgH = vh * bgScale;
              ctx.drawImage(video, (cw - bgW) / 2, (ch - bgH) / 2, bgW, bgH);
              ctx.restore();

              // 2. Draw sharp uncropped video centered
              const fgScale = Math.min(cw / vw, ch / vh);
              const fgW = vw * fgScale;
              const fgH = vh * fgScale;
              ctx.filter = filterCss || 'none';
              ctx.drawImage(video, (cw - fgW) / 2, (ch - fgH) / 2, fgW, fgH);
            } else if (aspectRatio === '9:16' && framingMode === 'split-dual') {
              // Dual-speaker stacked layout for podcasts
              const halfH = ch / 2;
              const splitScale = Math.max(cw / vw, halfH / vh);
              const sW = vw * splitScale;
              const sH = vh * splitScale;

              // Top half: Left Speaker (25% X)
              ctx.save();
              ctx.beginPath();
              ctx.rect(0, 0, cw, halfH);
              ctx.clip();
              const dxTop = (cw - sW) * 0.25;
              const dyTop = (halfH - sH) / 2;
              ctx.filter = filterCss || 'none';
              ctx.drawImage(video, dxTop, dyTop, sW, sH);
              ctx.restore();

              // Bottom half: Right Speaker (75% X)
              ctx.save();
              ctx.beginPath();
              ctx.rect(0, halfH, cw, halfH);
              ctx.clip();
              const dxBottom = (cw - sW) * 0.75;
              const dyBottom = halfH + ((halfH - sH) / 2);
              ctx.filter = filterCss || 'none';
              ctx.drawImage(video, dxBottom, dyBottom, sW, sH);
              ctx.restore();

              // Sleek neon cyan divider
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(0, halfH);
              ctx.lineTo(cw, halfH);
              ctx.stroke();
            } else {
              // Kinematic cover crop with face-aware 2D pan and safe headroom margins
              let panRatioX = 0.5;
              let panRatioY = 0.5;

              if (framingMode === 'left') {
                panRatioX = 0.25;
              } else if (framingMode === 'right') {
                panRatioX = 0.75;
              } else if (framingMode === 'center') {
                panRatioX = 0.50;
              } else {
                // Auto mode: check if pipeline has a current decision or passed facePanX
                const lastDec = facePipelineInstance.getLastDecision();
                if (lastDec && framingMode === 'auto') {
                  panRatioX = Math.max(0, Math.min(1, lastDec.panX / 100));
                  panRatioY = Math.max(0, Math.min(1, lastDec.panY / 100));
                } else {
                  panRatioX = Math.max(0, Math.min(100, facePanX)) / 100;
                  panRatioY = 0.36; // 36% rule-of-thirds eye line headroom
                }
              }

              const scale = Math.max(cw / vw, ch / vh);
              const sw = vw * scale;
              const sh = vh * scale;

              const dx = (cw - sw) * panRatioX;
              const dy = (ch - sh) * panRatioY;

              ctx.filter = filterCss || 'none';
              ctx.drawImage(video, dx, dy, sw, sh);
            }

            // Burned-in Subtitles Overlay directly onto canvas frame
            if (subtitles && subtitles.length > 0 && captionSettings && captionSettings.enabled) {
              renderCaptionToCanvas(
                ctx,
                subtitles,
                captionSettings,
                video.currentTime,
                cw,
                ch,
                faceData,
                startTime
              );
            }

            const prog = Math.min(100, Math.round(((video.currentTime - startTime) / duration) * 100));
            if (onProgress) onProgress(prog);

            animFrameId = requestAnimationFrame(drawFrame);
          };

          video.play().then(() => {
            animFrameId = requestAnimationFrame(drawFrame);
          }).catch((e) => {
            console.warn('Video play error during export capture, attempting muted play fallback:', e);
            video.muted = true;
            video.play().then(() => {
              animFrameId = requestAnimationFrame(drawFrame);
            }).catch((playErr) => {
              cleanup();
              reject(playErr);
            });
          });
        } catch (err) {
          cleanup();
          reject(err);
        }
      }, { once: true });
    }, { once: true });

    video.addEventListener('error', () => {
      cleanup();
      reject(new Error('Video source load failed for clipping export.'));
    }, { once: true });
  });
}
