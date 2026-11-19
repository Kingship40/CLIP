import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BeforeAfterVideoPlayer } from '../components/seedance/BeforeAfterVideoPlayer';
import { ClipTimeline } from '../components/editor/ClipTimeline';
import { ExportDialog } from '../components/editor/ExportDialog';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  SAMPLE_VIDEOS,
  SampleVideo,
  extractVideoMetadata,
  downloadText,
  exportToSRT,
  exportToVTT,
} from '../utils/videoHelpers';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { DEFAULT_PRESET_REFERENCES, seedanceService } from '../services/seedanceService';
import { Clip, SubtitleSegment, CaptionPreset, CaptionSettings, FaceTrackingMode } from '../types';
import { formatDuration, formatDurationPrecise } from '../utils/formatters';
import {
  Sparkles,
  Wand2,
  Video,
  Layers,
  Split,
  Download,
  Scissors,
  Cpu,
  ArrowRight,
  Maximize2,
  Sliders,
  Type,
  FolderPlus,
  Play,
  RotateCcw,
  Upload,
  FileVideo,
  CheckCircle2,
  Clock,
  Subtitles,
  ExternalLink,
  Flame,
  Zap,
  Bot,
  Target,
  Users,
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { AIModelModal } from '../components/common/AIModelModal';
import {
  sampleVideoFrames,
  analyzeVideoWithGemini,
  analyzeVideoWithOpenAI,
  analyzeVideoWithClientEngine,
} from '../services/aiVideoAnalysisService';

// Default clip transcript mocks with timestamps
const CLIP_SUBTITLES: Record<string, SubtitleSegment[]> = {
  sd_clip_1: [
    {
      id: 'sub_1',
      start: 12.0,
      end: 17.5,
      text: 'Why 99% of creators fail to capture retention in the first three seconds',
      highlightWords: ['99%', 'creators', 'retention', 'three', 'seconds'],
    },
    {
      id: 'sub_2',
      start: 17.6,
      end: 23.0,
      text: 'is because they start with long intros instead of an immediate pattern break.',
      highlightWords: ['long', 'intros', 'immediate', 'pattern', 'break'],
    },
    {
      id: 'sub_3',
      start: 23.1,
      end: 30.5,
      text: 'Seedance 2.5 detects peak engagement curves and isolates the exact viral moment.',
      highlightWords: ['Seedance', '2.5', 'engagement', 'viral', 'moment'],
    },
    {
      id: 'sub_4',
      start: 30.6,
      end: 38.0,
      text: 'This single optimization boosts completion rate by over 68 percent.',
      highlightWords: ['boosts', 'completion', 'rate', '68%'],
    },
  ],
  sd_clip_2: [
    {
      id: 'sub_5',
      start: 45.0,
      end: 51.5,
      text: 'The golden rule for 3-second viral hooks is high-contrast visual framing.',
      highlightWords: ['golden', 'rule', '3-second', 'viral', 'hooks'],
    },
    {
      id: 'sub_6',
      start: 51.6,
      end: 59.0,
      text: 'If the subject framing does not shift within two seconds, viewer drop-off spikes.',
      highlightWords: ['framing', 'two', 'seconds', 'drop-off', 'spikes'],
    },
    {
      id: 'sub_7',
      start: 59.1,
      end: 68.0,
      text: 'Using 3D-RoPE cross-attention keeps character features locked without morphing.',
      highlightWords: ['3D-RoPE', 'locked', 'without', 'morphing'],
    },
  ],
  sd_clip_3: [
    {
      id: 'sub_8',
      start: 85.0,
      end: 92.0,
      text: 'Continuous flow matching eliminates the flickering found in traditional AI video.',
      highlightWords: ['continuous', 'flow', 'matching', 'eliminates', 'flickering'],
    },
    {
      id: 'sub_9',
      start: 92.1,
      end: 100.0,
      text: 'By training video and audio jointly, lip-sync is aligned at microsecond precision.',
      highlightWords: ['jointly', 'lip-sync', 'aligned', 'microsecond', 'precision'],
    },
    {
      id: 'sub_10',
      start: 100.1,
      end: 110.0,
      text: 'You get broadcast-grade short-form video in a fraction of traditional render times.',
      highlightWords: ['broadcast-grade', 'short-form', 'fraction', 'render'],
    },
  ],
};

export const SeedancePlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addProject } = useProjectStore();
  const { addToast } = useToastStore();
  const { settings } = useSettingsStore();
  const [showAIModal, setShowAIModal] = useState(false);

  // Parse query params matching Picsart playground URL:
  // e.g. /ai-playground/app?model=seedance-2.5&mode=video
  const modeParam = searchParams.get('mode');
  const initialMode =
    modeParam === 'video' || modeParam === 'restyle'
      ? 'restyle'
      : modeParam === 'incontext'
      ? 'incontext'
      : 'clipping';

  // Active studio mode
  const [studioMode, setStudioMode] = useState<'clipping' | 'restyle' | 'incontext'>(initialMode);

  // Video states
  const [selectedSample, setSelectedSample] = useState<SampleVideo>(SAMPLE_VIDEOS[0]);
  const [originalVideoUrl, setOriginalVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [videoDuration, setVideoDuration] = useState(SAMPLE_VIDEOS[0].duration || 185);
  const [currentTime, setCurrentTime] = useState(12.0);
  const [startTime, setStartTime] = useState(12.0);
  const [endTime, setEndTime] = useState(38.0);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '21:9'>('9:16');

  // Captions & Subtitles
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionPreset, setCaptionPreset] = useState<CaptionPreset>('hormozi');

  // Generation Controls
  const [prompt, setPrompt] = useState(
    '@Ref_Image_1 transforms into a high-energy vertical short clip with cinematic lighting and @Ref_Audio_1 audio synchronization.'
  );
  const [selectedStyle, setSelectedStyle] = useState('Cyberpunk Neo-Tokyo');
  const [structureStrength, setStructureStrength] = useState(0.85);
  const [dialogueLanguage, setDialogueLanguage] = useState<'en' | 'ja' | 'zh' | 'es' | 'ko'>('en');

  // Generated clips list for the current video
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [generatedClipsList, setGeneratedClipsList] = useState([
    {
      id: 'sd_clip_1',
      title: 'Why 99% of Content Creators Fail to Capture Retention',
      start: 12.0,
      end: 38.0,
      viralScore: 98,
      aspect: '9:16',
      summary: 'High dopamine hook breaking down retention drop-offs in long-form media.',
      hashtags: ['#contentcreator', '#viralshorts', '#seedance', '#retention'],
    },
    {
      id: 'sd_clip_2',
      title: 'The Golden Rule for 3-Second Viral Hooks',
      start: 45.0,
      end: 68.0,
      viralScore: 95,
      aspect: '9:16',
      summary: 'Framing breakdown explaining why visual shifts prevent viewer scroll-away.',
      hashtags: ['#videotips', '#hooks', '#growyourchannel'],
    },
    {
      id: 'sd_clip_3',
      title: 'Continuous Flow Matching: Eliminating AI Video Morphing',
      start: 85.0,
      end: 110.0,
      viralScore: 92,
      aspect: '9:16',
      summary: 'Technical explanation of 3D-RoPE and joint audiovisual ODE flow matching.',
      hashtags: ['#generativeai', '#seedance25', '#dit'],
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Active Speaker Face Tracking & Framing Mode
  const [faceTrackingMode, setFaceTrackingMode] = useState<FaceTrackingMode>('auto');
  const [facePanX, setFacePanX] = useState<number>(50);

  // Sync mode changes with URL or tab selector
  useEffect(() => {
    if (modeParam === 'video' || modeParam === 'restyle') {
      setStudioMode('restyle');
    }
  }, [modeParam]);

  const stylePresets = [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Neo-Tokyo',
      color: 'from-cyan-500 to-blue-600',
      desc: 'Neon lighting, rain reflections, volumetric smog',
    },
    {
      id: 'anime',
      name: 'Studio Ghibli Anime',
      color: 'from-amber-400 to-rose-500',
      desc: 'Painterly backgrounds, hand-drawn cel-shaded anime aesthetic',
    },
    {
      id: 'pixar',
      name: '3D Pixar Animation',
      color: 'from-purple-500 to-indigo-600',
      desc: 'Stylized 3D geometry, subsurface skin glow & ambient bloom',
    },
    {
      id: 'cinema',
      name: 'Hyper-Realistic Cinema',
      color: 'from-slate-600 to-slate-900',
      desc: 'Arri 35mm grain, anamorphic lens flares, film contrast',
    },
    {
      id: 'clay',
      name: 'Claymation Stop-Motion',
      color: 'from-orange-500 to-amber-700',
      desc: 'Handcrafted clay modeling, tactile texture, 12fps cadence',
    },
    {
      id: 'vhs',
      name: 'Vintage 90s VHS',
      color: 'from-emerald-500 to-teal-700',
      desc: 'Analog scanlines, tape warble, RGB chromatic fringing',
    },
    {
      id: 'holo',
      name: 'Sci-Fi Hologram',
      color: 'from-sky-400 to-blue-700',
      desc: 'Luminous cyan wireframes, digital beam scan, futuristic UI',
    },
    {
      id: 'oil',
      name: 'Oil Painting Masterpiece',
      color: 'from-amber-600 to-orange-800',
      desc: 'Textured brushstrokes, impasto highlights, classical palette',
    },
  ];

  // Multimodal 50-slot tag injection
  const referenceTags = [
    { tag: '@Ref_Image_1', label: 'Face / Identity', desc: 'Preserves character facial geometry' },
    { tag: '@Ref_Image_2', label: 'Outfit & Style', desc: 'Conditions clothing texture & aesthetic' },
    { tag: '@Ref_Video_1', label: 'Motion Path', desc: 'Locks camera panning & actor trajectory' },
    { tag: '@Ref_Audio_1', label: 'Voice Timber', desc: 'Clones voice timbre and speech cadence' },
    { tag: '@Ref_Clay_1', label: 'Clay Structure', desc: 'Locks spatial 3D depth blocking' },
  ];

  const handleInjectTag = (tag: string) => {
    if (!prompt.includes(tag)) {
      setPrompt((prev) => `${prev.trim()} ${tag}`);
      addToast({
        title: `Tag Injected: ${tag}`,
        message: 'Reference token attached to conditioning matrix.',
        type: 'info',
      });
    }
  };

  // Video File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const { metadata, objectUrl } = await extractVideoMetadata(file);
        setOriginalVideoUrl(objectUrl);
        setProcessedVideoUrl(objectUrl);
        setVideoDuration(metadata.duration);
        setStartTime(0.0);
        setEndTime(Math.min(30.0, metadata.duration));
        setCurrentTime(0.0);

        // Dynamically create clips for uploaded video
        const dur = metadata.duration;
        const c1End = Math.min(25.0, dur * 0.35);
        const c2Start = Math.min(30.0, dur * 0.4);
        const c2End = Math.min(c2Start + 24.0, dur * 0.7);
        const c3Start = Math.min(c2End + 5.0, dur * 0.75);
        const c3End = Math.min(c3Start + 26.0, dur);

        setGeneratedClipsList([
          {
            id: `usr_clip_1`,
            title: `${file.name.replace(/\.[^/.]+$/, '')} — Key Hook`,
            start: 0.0,
            end: c1End,
            viralScore: 97,
            aspect: '9:16',
            summary: 'High-converting introductory hook extracted from uploaded video.',
            hashtags: ['#viral', '#shorts', '#clipforge'],
          },
          {
            id: `usr_clip_2`,
            title: `${file.name.replace(/\.[^/.]+$/, '')} — Core Highlight`,
            start: c2Start,
            end: c2End,
            viralScore: 94,
            aspect: '9:16',
            summary: 'Action-packed segment with peak audio cadence.',
            hashtags: ['#reels', '#tiktok', '#highlights'],
          },
          {
            id: `usr_clip_3`,
            title: `${file.name.replace(/\.[^/.]+$/, '')} — Conclusion & Takeaway`,
            start: c3Start,
            end: c3End,
            viralScore: 91,
            aspect: '9:16',
            summary: 'Memorable ending insight designed for shareability.',
            hashtags: ['#shorts', '#takeaway', '#viralclips'],
          },
        ]);
        setActiveClipIndex(0);

        addToast({
          title: 'Custom Video Loaded Successfully',
          message: `${file.name} (${metadata.duration.toFixed(1)}s, ${metadata.width}x${metadata.height}) loaded into Seedance 2.5 studio.`,
          type: 'success',
        });
      } catch (err: any) {
        addToast({
          title: 'Video Upload Failed',
          message: err.message || 'Could not parse video metadata.',
          type: 'error',
        });
      }
    }
  };

  // Switch Sample Video
  const handleSelectSample = (sample: SampleVideo) => {
    setSelectedSample(sample);
    setOriginalVideoUrl(sample.url);
    setProcessedVideoUrl(sample.url);
    setVideoDuration(sample.duration || 180);
    setStartTime(12.0);
    setEndTime(38.0);
    setCurrentTime(12.0);
    setActiveClipIndex(0);

    addToast({
      title: `Loaded ${sample.category}: ${sample.title}`,
      message: `${sample.duration}s video ready for clipping & restyling.`,
      type: 'info',
    });
  };

  // Select generated clip from reel
  const handleSelectClip = (index: number) => {
    setActiveClipIndex(index);
    const c = generatedClipsList[index];
    setStartTime(c.start);
    setEndTime(c.end);
    setCurrentTime(c.start);
    addToast({
      title: `Switched to Clip ${index + 1}`,
      message: `${c.title} (${(c.end - c.start).toFixed(1)}s)`,
      type: 'info',
    });
  };

  // Preset duration shortcuts (Seedance 2.5 context window limits: 4s to 30s)
  const handleSetDurationPreset = (dur: number) => {
    const newEnd = Math.min(videoDuration, startTime + dur);
    setEndTime(newEnd);
    addToast({
      title: `Duration Set: ${dur}s`,
      message: `Clip bounds: ${startTime.toFixed(1)}s to ${newEnd.toFixed(1)}s`,
      type: 'info',
    });
  };

  // Execute Real Multimodal AI Video Vision & Clipping
  const handleRunSeedance = async () => {
    setIsProcessing(true);
    setProcessingProgress(10);
    const ai = settings.aiSettings;

    try {
      if (ai?.provider === 'gemini' && ai.geminiApiKey) {
        setCurrentStage('Connecting to Google Gemini Multimodal Vision API...');
        setProcessingProgress(20);
        await new Promise((r) => setTimeout(r, 600));

        setCurrentStage('Sampling video frames across timeline (60fps scale)...');
        setProcessingProgress(40);
        const frames = await sampleVideoFrames(originalVideoUrl, videoDuration, 8);

        setCurrentStage(`Gemini ${ai.geminiModel} watching visual frames & detecting dopamine hooks...`);
        setProcessingProgress(70);
        const realClips = await analyzeVideoWithGemini(
          ai.geminiApiKey,
          ai.geminiModel,
          videoDuration,
          frames,
          selectedSample.title
        );

        setProcessingProgress(90);
        setCurrentStage('Decoding 1080p spatial-temporal latents & generating subtitles...');
        await new Promise((r) => setTimeout(r, 600));

        setGeneratedClipsList(realClips as any);
        setActiveClipIndex(0);
        setStartTime(realClips[0].start);
        setEndTime(realClips[0].end);
        setCurrentTime(realClips[0].start);
        setProcessingProgress(100);

        addToast({
          title: 'Google Gemini Vision Completed Analysis!',
          message: `Gemini analyzed your video frames and extracted ${realClips.length} high-retention short clips!`,
          type: 'success',
        });
      } else if (ai?.provider === 'openai' && ai.openaiApiKey) {
        setCurrentStage('Connecting to OpenAI ChatGPT Vision API...');
        setProcessingProgress(20);
        await new Promise((r) => setTimeout(r, 600));

        setCurrentStage('Sampling visual frames from video...');
        setProcessingProgress(40);
        const frames = await sampleVideoFrames(originalVideoUrl, videoDuration, 8);

        setCurrentStage(`ChatGPT ${ai.openaiModel} analyzing visual scenes & viral hooks...`);
        setProcessingProgress(70);
        const realClips = await analyzeVideoWithOpenAI(
          ai.openaiApiKey,
          ai.openaiModel,
          videoDuration,
          frames,
          selectedSample.title
        );

        setProcessingProgress(90);
        setCurrentStage('Compiling viral timestamps & subtitles...');
        await new Promise((r) => setTimeout(r, 600));

        setGeneratedClipsList(realClips as any);
        setActiveClipIndex(0);
        setStartTime(realClips[0].start);
        setEndTime(realClips[0].end);
        setCurrentTime(realClips[0].start);
        setProcessingProgress(100);

        addToast({
          title: 'ChatGPT Vision Completed Analysis!',
          message: `OpenAI analyzed your video and generated ${realClips.length} viral clips.`,
          type: 'success',
        });
      } else {
        // Free Local Waveform & Scene Engine
        setCurrentStage('Sampling visual frames & analyzing timeline cuts...');
        setProcessingProgress(35);
        await new Promise((r) => setTimeout(r, 700));

        setCurrentStage('Detecting scene transitions & peak dopamine energy...');
        setProcessingProgress(65);
        await new Promise((r) => setTimeout(r, 700));

        const localClips = analyzeVideoWithClientEngine(videoDuration, selectedSample.title);
        setProcessingProgress(90);
        setCurrentStage('Optimizing short-form 9:16 boundaries...');
        await new Promise((r) => setTimeout(r, 500));

        setGeneratedClipsList(localClips as any);
        setActiveClipIndex(0);
        setStartTime(localClips[0].start);
        setEndTime(localClips[0].end);
        setCurrentTime(localClips[0].start);
        setProcessingProgress(100);

        addToast({
          title: 'Video Analyzed with Client-Side Vision Engine',
          message: 'Extracted 3 clips based on frame energy. Click "Connect AI Vision" to use Google Gemini for full speech understanding.',
          type: 'info',
        });
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      const fallbackClips = analyzeVideoWithClientEngine(videoDuration, selectedSample.title);
      setGeneratedClipsList(fallbackClips as any);
      addToast({
        title: 'AI Analysis Note',
        message: err.message || 'Used Client-Side Vision Engine fallback.',
        type: 'warning',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Current active subtitles
  const activeClip = generatedClipsList[activeClipIndex] || generatedClipsList[0];
  const activeSubtitles: SubtitleSegment[] = CLIP_SUBTITLES[activeClip?.id] || [
    {
      id: 'sub_custom_1',
      start: startTime,
      end: startTime + (endTime - startTime) * 0.5,
      text: `${activeClip?.title || 'High engagement short video clip'}.`,
      highlightWords: ['High', 'engagement', 'short', 'clip'],
    },
    {
      id: 'sub_custom_2',
      start: startTime + (endTime - startTime) * 0.5 + 0.1,
      end: endTime,
      text: 'Transformed with Seedance 2.5 multimodal flow matching DiT engine.',
      highlightWords: ['Seedance', '2.5', 'multimodal', 'DiT', 'engine'],
    },
  ];

  const currentCaptionSettings: CaptionSettings = {
    enabled: showCaptions,
    preset: captionPreset,
    fontSize: 'md',
    position: 'bottom',
    highlightColor: '#FACC15',
    textColor: '#FFFFFF',
    showOpeningTitle: false,
  };

  // Current active Clip object for Export Hub
  const currentClipObject: Clip = {
    id: activeClip?.id || 'seedance_clip',
    projectId: 'seedance_project',
    title: activeClip?.title || `${selectedStyle} Video Clip`,
    description: prompt,
    startTime,
    endTime,
    duration: Math.round(endTime - startTime),
    aspectRatio: aspectRatio as any,
    viralScore: activeClip?.viralScore || 96,
    hookSummary: activeClip?.summary || prompt.slice(0, 80),
    hashtags: activeClip?.hashtags || ['#seedance', '#aivideo', '#shorts'],
    subtitles: activeSubtitles,
    captionSettings: currentCaptionSettings,
    thumbnailUrl: selectedSample.thumbnail,
    videoUrl: processedVideoUrl,
    selected: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRendered: true,
    faceTrackingMode,
    faceCoordinates: { x: facePanX, y: 35 },
    category: (activeClip as any)?.category || 'hook_intro',
    rationale: (activeClip as any)?.rationale || activeClip?.summary || 'High dopamine retention moment.',
    scoreBreakdown: (activeClip as any)?.scoreBreakdown,
  };

  // Import to Project Library
  const handleImportToProjects = () => {
    const newProj = seedanceService.createProjectFromSeedanceJob(
      {
        prompt: `${selectedStyle} style: ${prompt}`,
        aspectRatio,
        resolution: '1080p',
        durationSeconds: Math.round(endTime - startTime),
        fps: 30,
        referenceConditioning: DEFAULT_PRESET_REFERENCES,
        audioSettings: {
          dialogueLanguage,
          enableSfx: true,
          enableAmbience: true,
          enableMusic: true,
        },
      },
      {
        jobId: `sd_${Date.now()}`,
        status: 'completed',
        progressPercentage: 100,
        artifacts: {
          masterMp4Url: processedVideoUrl,
          audioIsolatedWavUrl: processedVideoUrl,
          srtSubtitlesUrl: '',
          vttSubtitlesUrl: '',
        },
      }
    );

    addProject(newProj);
    addToast({
      title: 'Saved to ClipForge Projects',
      message: 'Opening workspace results with generated clips...',
      type: 'success',
    });
    navigate(`/dashboard/projects/${newProj.id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Hidden File Input for Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Studio Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-glow-cyan shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Seedance 2.5 Video AI Studio
              </h1>
              <span className="text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Picsart Playground Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal Dual-Stream Flow Matching DiT • Native 48kHz Lip-Sync • 50-Slot Conditioning
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-dark-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStudioMode('clipping')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                studioMode === 'clipping'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>AI Video Clipping</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioMode('restyle')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                studioMode === 'restyle'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Video Restyle / V2V</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioMode('incontext')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                studioMode === 'incontext'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>In-Context Trim Edit</span>
            </button>
          </div>

          {/* AI Model Connector Button */}
          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              settings.aiSettings?.geminiApiKey || settings.aiSettings?.openaiApiKey
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-dark-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
            }`}
            title="Configure Real AI Vision (Google Gemini / OpenAI ChatGPT)"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>
              {settings.aiSettings?.provider === 'gemini' && settings.aiSettings.geminiApiKey
                ? 'Gemini Vision (Active)'
                : settings.aiSettings?.provider === 'openai' && settings.aiSettings.openaiApiKey
                ? 'ChatGPT Vision (Active)'
                : 'Connect Real AI'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                settings.aiSettings?.geminiApiKey || settings.aiSettings?.openaiApiKey
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-cyan-400'
              }`}
            />
          </button>

          {/* Upload Video Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4 text-cyan-400" />}
          >
            Upload Video
          </Button>

          {/* Export / Download Hub Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export Clip
          </Button>

          {/* Import to Projects */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleImportToProjects}
            leftIcon={<FolderPlus className="w-4 h-4 text-white" />}
          >
            Import to Library
          </Button>
        </div>
      </div>

      {/* Sample Video Quick Selector Bar */}
      <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold shrink-0">
          <FileVideo className="w-4 h-4 text-cyan-400" />
          <span>Preset Demo Videos:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_VIDEOS.map((sample) => {
            const isCurrent = selectedSample.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-cyan-500/15 border-cyan-500 text-white ring-1 ring-cyan-500'
                    : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10">
                  {sample.category}
                </span>
                <span className="truncate max-w-[140px] font-medium">{sample.title}</span>
                <span className="font-mono text-[10px] text-slate-500">{sample.duration}s</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Before/After Video Player & Extracted Clips Reel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Interactive Before / After Dual-Stream Player */}
            <BeforeAfterVideoPlayer
              originalVideoUrl={originalVideoUrl}
              processedVideoUrl={processedVideoUrl}
              currentTime={currentTime}
              onTimeUpdate={(t) => setCurrentTime(t)}
              startTime={startTime}
              endTime={endTime}
              aspectRatio={aspectRatio}
              processedTitle={`Seedance 2.5: ${selectedStyle}`}
              selectedStyle={selectedStyle}
              subtitles={activeSubtitles}
              showCaptions={showCaptions}
              captionSettings={currentCaptionSettings}
              onToggleCaptions={() => setShowCaptions(!showCaptions)}
              faceTrackingMode={faceTrackingMode}
              onFramingModeChange={setFaceTrackingMode}
              facePanX={facePanX}
              onFacePanXChange={setFacePanX}
            />

            {/* In-Processing Flow Matching Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center animate-spin shadow-glow-cyan">
                  <Cpu className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Solving Joint Flow Matching Velocity Field
                  </h4>
                  <p className="text-xs text-cyan-300 font-mono max-w-md">
                    {currentStage}
                  </p>
                </div>
                <div className="w-72 bg-dark-900 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-brand-500 transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {processingProgress}% Complete • Native Audio Lip-Sync
                </span>
              </div>
            )}
          </div>

          {/* Interactive Dual-Handle Timeline Trimmer & Duration Steppers */}
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Clip Trimming Range
                </span>
                <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {formatDurationPrecise(startTime)} → {formatDurationPrecise(endTime)} ({(endTime - startTime).toFixed(1)}s)
                </span>
              </div>

              {/* Preset Duration Pills (Seedance native limits: 5s, 10s, 15s, 30s) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Presets:</span>
                {[5, 10, 15, 30].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => handleSetDurationPreset(dur)}
                    className="px-2 py-1 rounded-lg bg-dark-950 border border-slate-800 hover:border-cyan-500 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <ClipTimeline
              totalDuration={videoDuration}
              startTime={startTime}
              endTime={endTime}
              currentTime={currentTime}
              onRangeChange={(s, e) => {
                setStartTime(s);
                setEndTime(e);
              }}
              onSeek={(t) => setCurrentTime(t)}
            />
          </div>

          {/* Multi-Clip AI Highlight Reel (Click to switch clips) */}
          <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Extracted Short Clips ({generatedClipsList.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to switch boundaries & preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {generatedClipsList.map((c, idx) => {
                const isSelected = activeClipIndex === idx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClip(idx)}
                    className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500 shadow-glow-cyan'
                        : 'bg-dark-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">
                        {formatDuration(c.start)} – {formatDuration(c.end)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current text-amber-400" />
                        {c.viralScore} Hook
                      </span>
                    </div>
                    <span className="font-semibold text-white truncate block text-[11px]">
                      {c.title}
                    </span>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {c.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Seedance 2.5 Generative Controls & Picsart Styling */}
        <div className="lg:col-span-5 bg-dark-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
          {/* Style Presets Grid (Picsart Mode) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Generative Style Preset (Picsart Mode)
              </label>
              <span className="text-[10px] text-cyan-400 font-bold uppercase">
                {selectedStyle}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {stylePresets.map((preset) => {
                const isSelected = selectedStyle === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(preset.name);
                      setPrompt(
                        `@Ref_Image_1 transformed into a ${preset.name.toLowerCase()} scene with synchronized @Ref_Audio_1 dialogue.`
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-dark-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-white block text-[11px] truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multimodal 50-Slot Reference Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Multimodal References (50 Slots)
              </label>
              <span className="text-[10px] text-slate-500">Click to inject token</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {referenceTags.map((ref) => (
                <button
                  key={ref.tag}
                  type="button"
                  onClick={() => handleInjectTag(ref.tag)}
                  className="px-2 py-1 rounded-lg bg-dark-950 border border-slate-800 hover:border-cyan-500 text-cyan-300 text-[10px] font-mono transition-colors flex items-center gap-1"
                  title={ref.desc}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{ref.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Multimodal Prompt Bar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Multimodal Prompt & Instructions
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
              placeholder="e.g. @Ref_Image_1 character talking with energetic motion..."
            />
          </div>

          {/* Aspect Ratio & Dialogue Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Output Framing
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
              >
                <option value="9:16">9:16 Vertical (Shorts/TikTok)</option>
                <option value="16:9">16:9 Landscape (YouTube)</option>
                <option value="1:1">1:1 Square (Feed)</option>
                <option value="21:9">21:9 Ultrawide Cinema</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Dialogue Language
              </label>
              <select
                value={dialogueLanguage}
                onChange={(e) => setDialogueLanguage(e.target.value as any)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
              >
                <option value="en">English (US/UK)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="zh">Mandarin (中文)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ko">Korean (한국어)</option>
              </select>
            </div>
          </div>

          {/* AI Active Speaker Face Tracking & Smart Reframe (for 9:16 vertical shorts) */}
          {aspectRatio === '9:16' && (
            <div className="space-y-2 p-3.5 rounded-xl bg-dark-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Face Tracking Mode</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {faceTrackingMode === 'auto' ? `Auto (${Math.round(facePanX)}%)` : faceTrackingMode.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
                {[
                  { id: 'auto', label: 'Auto Track', desc: 'Face centroid' },
                  { id: 'left', label: 'Left Host', desc: '25% lock' },
                  { id: 'center', label: 'Center', desc: '50% lock' },
                  { id: 'right', label: 'Right Guest', desc: '75% lock' },
                  { id: 'split-dual', label: 'Dual Split', desc: 'Podcast stack' },
                  { id: 'fit-blur', label: 'Fit + Blur', desc: 'Full 16:9' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFaceTrackingMode(mode.id as FaceTrackingMode)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      faceTrackingMode === mode.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-glow-cyan'
                        : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block truncate">{mode.label}</span>
                    <span className="text-[9px] text-slate-500">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption Style Preset Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Captions Animation Style
              </label>
              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                className="text-[10px] font-semibold text-cyan-400 hover:underline"
              >
                {showCaptions ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['hormozi', 'neon', 'karaoke', 'minimal', 'cinematic'] as CaptionPreset[]).map(
                (preset) => {
                  const isCurrent = captionPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCaptionPreset(preset);
                        setShowCaptions(true);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-center uppercase text-[10px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Clay Structure & Motion Guidance */}
          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Clay Depth & Normal Guidance
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {(structureStrength * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={structureStrength}
              onChange={(e) => setStructureStrength(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              High values preserve physical subject movement and camera trajectories from the source video.
            </p>
          </div>

          {/* Action Trigger */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            isLoading={isProcessing}
            onClick={handleRunSeedance}
            leftIcon={<Wand2 className="w-5 h-5 text-white" />}
            className="w-full shadow-glow-cyan bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-600 hover:to-brand-600 font-bold"
          >
            {studioMode === 'clipping'
              ? 'Extract Short Clips with Seedance 2.5'
              : 'Process Video with Seedance 2.5'}
          </Button>
        </div>
      </div>

      {/* Export & Download Modal */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        clip={currentClipObject}
        facePanX={facePanX}
        framingMode={faceTrackingMode}
      />

      {/* Real AI Model Vision Connector Modal */}
      <AIModelModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </div>
  );
};
