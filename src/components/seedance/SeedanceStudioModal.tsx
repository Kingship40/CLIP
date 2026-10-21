import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Seedance25GenerationRequest,
  SeedanceJobResponse,
  ImageReferenceSlot,
  VideoReferenceSlot,
  AudioReferenceSlot,
} from '../../types/seedance';
import { DEFAULT_PRESET_REFERENCES, seedanceService } from '../../services/seedanceService';
import { useProjectStore } from '../../store/useProjectStore';
import { useToastStore } from '../../store/useToastStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { AspectRatioSelector } from '../config/AspectRatioSelector';
import {
  Sparkles,
  Wand2,
  Layers,
  Image as ImageIcon,
  Video,
  Mic,
  Sliders,
  Cpu,
  Clock,
  CheckCircle2,
  Loader2,
  Box,
  Tag,
  ArrowRight,
} from 'lucide-react';

export interface SeedanceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeedanceStudioModal: React.FC<SeedanceStudioModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addProject } = useProjectStore();
  const { addToast } = useToastStore();

  const [prompt, setPrompt] = useState(
    '@Ref_Image_1 walks through a futuristic cyberpunk night market in Neo-Tokyo while speaking in @Ref_Audio_1 with perfect lip synchronization. The camera performs a smooth sweeping tracking shot matching @Ref_Video_1.'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '21:9'>('9:16');
  const [duration, setDuration] = useState(15);
  const [resolution, setResolution] = useState<'1080p' | '4k'>('1080p');
  const [language, setLanguage] = useState<'en' | 'ja' | 'zh' | 'es' | 'ko' | 'fr'>('ja');
  const [enableClayStructure, setEnableClayStructure] = useState(true);
  const [enableInContextEdit, setEnableInContextEdit] = useState(false);
  const [editStartTime, setEditStartTime] = useState(3.0);
  const [editEndTime, setEditEndTime] = useState(8.5);

  const [images, setImages] = useState<ImageReferenceSlot[]>(DEFAULT_PRESET_REFERENCES.images);
  const [videos, setVideos] = useState<VideoReferenceSlot[]>(DEFAULT_PRESET_REFERENCES.videos);
  const [audios, setAudios] = useState<AudioReferenceSlot[]>(DEFAULT_PRESET_REFERENCES.audios);

  const [activeJob, setActiveJob] = useState<SeedanceJobResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInsertTag = (tag: string) => {
    setPrompt((prev) => `${prev} ${tag}`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast({ title: 'Please enter a generation prompt', type: 'warning' });
      return;
    }

    const request: Seedance25GenerationRequest = {
      prompt,
      aspectRatio,
      resolution,
      durationSeconds: duration,
      fps: 30,
      referenceConditioning: {
        images,
        videos,
        audios,
      },
      structureGuidance: enableClayStructure
        ? {
            enabled: true,
            conditioningStrength: 0.85,
            clayRenderDepthUrl: 'https://assets.seedance.ai/refs/market_depth.mp4',
          }
        : undefined,
      inContextEditing: enableInContextEdit
        ? {
            enabled: true,
            timeWindow: { startTime: editStartTime, endTime: editEndTime },
            preserveOutsideWindow: true,
          }
        : undefined,
      audioSettings: {
        dialogueLanguage: language as any,
        enableSfx: true,
        enableAmbience: true,
        enableMusic: true,
      },
      samplingParameters: {
        steps: 25,
        guidanceScale: 4.5,
        audioGuidanceScale: 3.5,
      },
    };

    setIsGenerating(true);

    try {
      const jobResponse = await seedanceService.generateMultimodalStream(request, (job) => {
        setActiveJob({ ...job });
      });

      const newProject = seedanceService.createProjectFromSeedanceJob(request, jobResponse);
      addProject(newProject);

      addToast({
        title: 'Seedance 2.5 Generation Succeeded!',
        message: `Synthesized ${duration}s clip with synchronized ${language.toUpperCase()} audio.`,
        type: 'success',
      });

      onClose();
      navigate(`/dashboard/projects/${newProject.id}`);
    } catch (err: any) {
      addToast({ title: 'Generation failed', message: err.message, type: 'error' });
    } finally {
      setIsGenerating(false);
      setActiveJob(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isGenerating && onClose()}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-brand-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-extrabold tracking-tight">Project Seedance-2.5</span>
            <span className="ml-2 text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              Joint Audiovisual DiT
            </span>
          </div>
        </div>
      }
      description="Unified multimodal generative foundation model matching ByteDance's Seedance 2.5 architecture."
      maxWidth="2xl"
    >
      {/* If currently running the generation flow ODE */}
      {isGenerating && activeJob ? (
        <div className="py-8 px-4 space-y-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-glow-cyan animate-pulse">
            <Cpu className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">
              Solving Joint Audiovisual Flow Matching ODE
            </h4>
            <p className="text-xs text-cyan-300 font-mono">
              {activeJob.currentStage}
            </p>
          </div>

          <div className="w-full bg-dark-950 rounded-full h-3 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-brand-500 to-purple-500 transition-all duration-300 shadow-glow-brand"
              style={{ width: `${activeJob.progressPercentage}%` }}
            />
          </div>

          <div className="p-3 bg-dark-950 rounded-xl border border-slate-800 text-xs text-slate-400 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Engine Architecture</span>
              <strong className="text-slate-200">48-Layer DiT • 3D-RoPE</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">AV Synchronization</span>
              <strong className="text-emerald-400">Microsecond Native Sync</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-slate-300 text-[11px]">
                Multimodal Prompt with Reference Tagging:
              </label>
              <span className="text-[10px] text-slate-400">Up to 50 Active Slots</span>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Describe your scene and reference slot bindings (e.g. @Ref_Image_1 walks through...)"
            />

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Insert Tags:</span>
              <button
                type="button"
                onClick={() => handleInsertTag('@Ref_Image_1')}
                className="px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-300 font-mono hover:bg-brand-500/30 transition-colors"
              >
                @Ref_Image_1 (Face)
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('@Ref_Image_2')}
                className="px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-300 font-mono hover:bg-brand-500/30 transition-colors"
              >
                @Ref_Image_2 (Costume)
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('@Ref_Video_1')}
                className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono hover:bg-cyan-500/30 transition-colors"
              >
                @Ref_Video_1 (Camera Motion)
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('@Ref_Audio_1')}
                className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono hover:bg-purple-500/30 transition-colors"
              >
                @Ref_Audio_1 (Voice Timbre)
              </button>
            </div>
          </div>

          {/* Reference Conditioning Matrix (Images, Videos, Audios) */}
          <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Multimodal Slots ({images.length + videos.length + audios.length}/50)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Cross-Slot Leakage Masked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              {images.map((img) => (
                <div key={img.tag} className="p-2 rounded-lg bg-dark-900 border border-slate-800 flex items-center gap-2">
                  <img src={img.thumbnailUrl} alt={img.name} className="w-8 h-8 rounded object-cover shrink-0" />
                  <div className="truncate">
                    <span className="font-mono text-brand-400 font-bold block">{img.tag}</span>
                    <span className="text-slate-400 text-[10px] truncate block">{img.name}</span>
                  </div>
                </div>
              ))}
              {videos.map((vid) => (
                <div key={vid.tag} className="p-2 rounded-lg bg-dark-900 border border-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-mono text-cyan-400 font-bold block">{vid.tag}</span>
                    <span className="text-slate-400 text-[10px] truncate block">{vid.name}</span>
                  </div>
                </div>
              ))}
              {audios.map((aud) => (
                <div key={aud.tag} className="p-2 rounded-lg bg-dark-900 border border-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 font-bold">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-mono text-purple-400 font-bold block">{aud.tag}</span>
                    <span className="text-slate-400 text-[10px] truncate block">{aud.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Duration (3D-RoPE Stable)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds (Standard)</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds (Full Single-Pass)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Spoken Dialogue Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="en">English (US/UK)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="zh">Mandarin Chinese (中文)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ko">Korean (한국어)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Resolution & Pipeline
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="1080p">1080p Full HD (24fps)</option>
                <option value="4k">4K Ultra HD (30fps)</option>
              </select>
            </div>
          </div>

          {/* Advanced Structural Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-dark-950 border border-slate-800">
              <Checkbox
                checked={enableClayStructure}
                onChange={(e) => setEnableClayStructure(e.target.checked)}
                label={<span className="font-semibold text-white">Clay-Render Depth Adapter</span>}
                description="Locks camera trajectory and spatial geometry using normal & depth map controlnet branch"
              />
            </div>

            <div className="p-3 rounded-xl bg-dark-950 border border-slate-800">
              <Checkbox
                checked={enableInContextEdit}
                onChange={(e) => setEnableInContextEdit(e.target.checked)}
                label={<span className="font-semibold text-white">Localized Timestamp Inpainting</span>}
                description="Modifies only 00:03 to 00:08 while preserving surrounding frames bit-exact"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              Output Aspect: <strong>{aspectRatio}</strong> • Audiovisual Dual-Stream
            </span>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                leftIcon={<Wand2 className="w-4 h-4 text-white" />}
                className="shadow-glow-cyan bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-600 hover:to-brand-600"
              >
                Generate with Seedance-2.5
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
