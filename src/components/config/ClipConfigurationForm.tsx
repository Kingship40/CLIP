import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ProjectConfig,
  AspectRatio,
  ContentType,
  ClipPreference,
  CaptionPreset,
  CaptionPosition,
  SubtitleDisplayMode,
  SubtitleTextCase,
  SubtitleOutlineWidth,
} from '../../types';
import { AspectRatioSelector } from './AspectRatioSelector';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { Select } from '../common/Select';
import {
  Sparkles,
  Type,
  SlidersHorizontal,
  Layers,
  Wand2,
  Clock,
  Film,
  MessageSquare,
  HelpCircle,
  AudioLines,
  Palette,
  ExternalLink,
  CheckCircle2,
  MoveVertical,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { deepgramServiceInstance } from '../../services/deepgramService';

export interface ClipConfigurationFormProps {
  initialConfig?: ProjectConfig;
  onSubmit: (config: ProjectConfig) => void;
  isLoading?: boolean;
}

export const DEFAULT_CONFIG: ProjectConfig = {
  clipCount: 3,
  targetDuration: '30-60',
  aspectRatio: '9:16',
  contentType: 'podcast',
  preferences: ['hooks', 'educational', 'engaging'],
  captionSettings: {
    enabled: true,
    preset: 'hormozi',
    fontSize: 'md',
    position: 'bottom',
    highlightColor: '#F59E0B',
    textColor: '#FFFFFF',
    showOpeningTitle: true,
    openingTitle: 'Key Takeaway',
  },
  outputResolution: '1080p',
  language: 'en',
  keepAudio: true,
  customInstructions: '',
};

export const ClipConfigurationForm: React.FC<ClipConfigurationFormProps> = ({
  initialConfig = DEFAULT_CONFIG,
  onSubmit,
  isLoading = false,
}) => {
  const { settings } = useSettingsStore();
  const isDeepgramReady =
    deepgramServiceInstance.isConfigured() ||
    Boolean(settings.deepgramSettings?.apiKey);

  // Initialize with user defaults if available
  const [config, setConfig] = useState<ProjectConfig>(() => {
    if (settings.subtitleDefaults) {
      return {
        ...initialConfig,
        captionSettings: {
          ...initialConfig.captionSettings,
          ...settings.subtitleDefaults,
        },
      };
    }
    return initialConfig;
  });
  const [activeTab, setActiveTab] = useState<'clips' | 'captions' | 'advanced'>('clips');

  const contentTypes: { id: ContentType; label: string }[] = [
    { id: 'podcast', label: 'Podcast' },
    { id: 'interview', label: 'Interview' },
    { id: 'educational', label: 'Educational' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'vlog', label: 'Vlog' },
    { id: 'presentation', label: 'Presentation' },
    { id: 'other', label: 'Other' },
  ];

  const preferenceOptions: { id: ClipPreference; label: string; desc: string }[] = [
    { id: 'hooks', label: 'Strong Opening Hooks', desc: 'Prioritize questions, bold claims, curiosity triggers' },
    { id: 'educational', label: 'Educational Moments', desc: 'Focus on high-value mental models & insights' },
    { id: 'explanations', label: 'Important Explanations', desc: 'Crisp answers to complex problems' },
    { id: 'engaging', label: 'Funny or Engaging Moments', desc: 'High energy laughs, jokes, or emotional peaks' },
    { id: 'emotional', label: 'Emotional / Inspirational', desc: 'Inspiring stories and vulnerability' },
    { id: 'highlights', label: 'General Highlights', desc: 'Balanced best moments across the video' },
  ];

  const captionPresets: { id: CaptionPreset; label: string; preview: string; color: string }[] = [
    { id: 'hormozi', label: 'Hormozi Viral', preview: 'BOLD YELLOW WORDS', color: 'bg-amber-400 text-black font-black' },
    { id: 'boxed', label: 'Boxed Pill', preview: 'ACTIVE WORD PILL', color: 'bg-amber-400 text-black font-black px-2 rounded' },
    { id: 'karaoke', label: 'Electric Karaoke', preview: 'CYAN WORD GLOW', color: 'bg-cyan-500 text-white font-bold' },
    { id: 'bounce', label: 'Bounce & Pop', preview: 'KINETIC ZOOM POP', color: 'bg-emerald-500 text-white font-black' },
    { id: 'minimal', label: 'Clean Subtitle', preview: 'Minimal & Elegant', color: 'bg-slate-900 text-white font-medium' },
    { id: 'neon', label: 'Neon Glow', preview: 'VIOLET PULSE', color: 'bg-purple-600 text-white font-extrabold shadow-glow-brand' },
    { id: 'cinematic', label: 'Cinematic Box', preview: 'Subtitled Box', color: 'bg-black/90 text-slate-100 font-mono' },
  ];

  const togglePreference = (pref: ClipPreference) => {
    setConfig((prev) => {
      const exists = prev.preferences.includes(pref);
      const next = exists ? prev.preferences.filter((p) => p !== pref) : [...prev.preferences, pref];
      return { ...prev, preferences: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Tabs */}
      <div className="flex border-b border-[var(--border)] dark:border-slate-800 gap-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('clips')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'clips'
              ? 'border-brand-500 text-brand-700 dark:text-white font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Clip Settings & Aspect</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('captions')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'captions'
              ? 'border-brand-500 text-brand-700 dark:text-white font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Captions & Typography</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'advanced'
              ? 'border-brand-500 text-brand-700 dark:text-white font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Resolution & AI Prompts</span>
        </button>
      </div>

      {/* Tab 1: Clip Settings & Aspect */}
      {activeTab === 'clips' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Aspect Ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300">
                Target Aspect Ratio
              </label>
              <span className="text-[11px] text-[var(--text-secondary)] dark:text-slate-400 font-medium">
                Optimized for vertical feeds
              </span>
            </div>
            <AspectRatioSelector
              value={config.aspectRatio}
              onChange={(ratio) => setConfig({ ...config, aspectRatio: ratio })}
            />
          </div>

          {/* Number of clips & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Number of Clips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                Number of Clips
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig({ ...config, clipCount: num })}
                    className={`py-2 px-3 rounded-xl border text-xs transition-all ${
                      config.clipCount === num
                        ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold shadow-sm ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white dark:ring-1 dark:ring-brand-500'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] font-semibold hover:border-brand-300 hover:bg-[#F1EFFF]/50 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850 dark:hover:text-white'
                    }`}
                  >
                    {num} Clips
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      clipCount: 'custom',
                      customClipCount: config.customClipCount || 4,
                    })
                  }
                  className={`py-2 px-3 rounded-xl border text-xs transition-all ${
                    config.clipCount === 'custom'
                      ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold shadow-sm ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white dark:ring-1 dark:ring-brand-500'
                      : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] font-semibold hover:border-brand-300 hover:bg-[#F1EFFF]/50 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850 dark:hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {config.clipCount === 'custom' && (
                <div className="mt-2.5">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    label="Custom Clip Quantity"
                    value={config.customClipCount || 4}
                    onChange={(e) =>
                      setConfig({ ...config, customClipCount: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              )}
            </div>

            {/* Target Duration */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                Clip Duration Target
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '15-30', label: '15–30s' },
                  { id: '30-60', label: '30–60s' },
                  { id: '60-90', label: '60–90s' },
                  { id: 'custom', label: 'Custom' },
                ].map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        targetDuration: dur.id as any,
                        customDurationSeconds:
                          dur.id === 'custom' ? config.customDurationSeconds || 45 : undefined,
                      })
                    }
                    className={`py-2 px-2 text-center rounded-xl border text-xs transition-all ${
                      config.targetDuration === dur.id
                        ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold shadow-sm ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white dark:ring-1 dark:ring-brand-500'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] font-semibold hover:border-brand-300 hover:bg-[#F1EFFF]/50 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850 dark:hover:text-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>

              {config.targetDuration === 'custom' && (
                <div className="mt-2.5">
                  <Input
                    type="number"
                    min="10"
                    max="180"
                    label="Target Duration (Seconds)"
                    value={config.customDurationSeconds || 45}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        customDurationSeconds: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setConfig({ ...config, contentType: type.id })}
                  className={`py-2.5 px-3 text-left rounded-xl border text-xs transition-all ${
                    config.contentType === type.id
                      ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold shadow-sm ring-1 ring-brand-500/20 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white dark:ring-1 dark:ring-brand-500'
                      : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] font-medium hover:border-brand-300 hover:bg-[#F1EFFF]/50 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850 dark:hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clip Selection Preferences */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
              Clip Highlight Priorities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {preferenceOptions.map((pref) => {
                const checked = config.preferences.includes(pref.id);
                return (
                  <div
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-[#EAE8FF] border-2 border-brand-500 ring-1 ring-brand-500/20 shadow-sm dark:bg-brand-500/15 dark:border-brand-500 dark:ring-brand-500/30'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-brand-300 hover:bg-[#F1EFFF]/40 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-dark-850'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                        <div
                          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            checked
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'bg-[var(--bg-surface)] border-[var(--border)] dark:bg-dark-950 dark:border-slate-700'
                          }`}
                        >
                          {checked && (
                            <svg className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-xs text-[var(--text-primary)] dark:text-white block">
                          {pref.label}
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
                          {pref.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Captions & Typography */}
      {activeTab === 'captions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Deepgram ASR Integration Notice */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isDeepgramReady
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-[var(--bg-surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <AudioLines className={`w-4 h-4 shrink-0 ${isDeepgramReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-500'}`} />
              <span className="font-semibold">
                {isDeepgramReady
                  ? '⚡ Subtitles generated with Deepgram Nova-2 ASR (Sub-second word timestamps & speaker diarization)'
                  : 'Standard ASR active. You can add your Deepgram API Key in Admin for Nova-2 word accuracy.'}
              </span>
            </div>

            <Link
              to="/settings"
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline shrink-0"
            >
              {isDeepgramReady ? 'Configure Deepgram' : '+ Add Deepgram API Key'}
            </Link>
          </div>

          {/* Toggle Captions Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] dark:text-white">Auto Kinetic Captions</h4>
              <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 mt-0.5">
                Automatically generate dynamic animated subtitles with highlighted keywords
              </p>
            </div>
            <Checkbox
              checked={config.captionSettings.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  captionSettings: { ...config.captionSettings, enabled: e.target.checked },
                })
              }
            />
          </div>

          {config.captionSettings.enabled && (
            <>
              {/* Live Interactive Subtitle Preview */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    <span>Real-Time Subtitle Preview</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                    {config.captionSettings.preset.toUpperCase()} • {config.captionSettings.fontFamily || 'Montserrat'}
                  </span>
                </div>

                <div className="relative h-28 rounded-xl bg-gradient-to-b from-slate-900 to-black border border-slate-800 flex items-center justify-center p-4 overflow-hidden select-none">
                  <div
                    className="text-center font-black tracking-wider leading-snug px-3 py-1.5 transition-all"
                    style={{
                      fontFamily: `"${config.captionSettings.fontFamily || 'Montserrat'}", sans-serif`,
                      fontSize:
                        config.captionSettings.fontSize === 'xl'
                          ? '22px'
                          : config.captionSettings.fontSize === 'lg'
                          ? '19px'
                          : config.captionSettings.fontSize === 'sm'
                          ? '13px'
                          : '16px',
                      color: config.captionSettings.textColor || '#FFFFFF',
                      textShadow:
                        config.captionSettings.outlineWidth === 'none'
                          ? undefined
                          : `-2px -2px 0 ${config.captionSettings.outlineColor || '#000'}, 2px -2px 0 ${config.captionSettings.outlineColor || '#000'}, -2px 2px 0 ${config.captionSettings.outlineColor || '#000'}, 2px 2px 0 ${config.captionSettings.outlineColor || '#000'}`,
                    }}
                  >
                    <span className="mr-2">THE</span>
                    <span
                      className="px-2 py-0.5 rounded-lg inline-block transform scale-110 shadow-lg mx-1"
                      style={{
                        backgroundColor:
                          config.captionSettings.preset === 'boxed'
                            ? config.captionSettings.activeWordBgColor || '#F59E0B'
                            : 'transparent',
                        color:
                          config.captionSettings.preset === 'boxed'
                            ? '#000000'
                            : config.captionSettings.highlightColor || '#F59E0B',
                      }}
                    >
                      BIGGEST
                    </span>
                    <span className="mx-2">SECRET</span>
                    <span>IN 2026</span>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                  Caption Style Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {captionPresets.map((preset) => {
                    const isSelected = config.captionSettings.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: {
                              ...config.captionSettings,
                              preset: preset.id,
                              activeWordBgColor: preset.id === 'boxed' ? config.captionSettings.highlightColor || '#F59E0B' : undefined,
                            },
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 ring-1 ring-brand-500/20 shadow-sm dark:bg-brand-500/15 dark:border-brand-500'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-brand-300 hover:bg-[#F1EFFF]/40 shadow-sm dark:bg-dark-900 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="h-9 rounded-lg bg-[var(--bg-surface-2)] dark:bg-dark-950 flex items-center justify-center p-1.5 mb-2 border border-[var(--border)] dark:border-slate-800">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${preset.color}`}>
                            {preset.preview}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[var(--text-primary)] dark:text-white block truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography Controls: Font Family, Size, Text Case */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-1.5">
                    Font Family
                  </label>
                  <select
                    value={config.captionSettings.fontFamily || 'Montserrat'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        captionSettings: { ...config.captionSettings, fontFamily: e.target.value },
                      })
                    }
                    className="w-full bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Montserrat">Montserrat (Viral Modern)</option>
                    <option value="Inter">Inter (Clean Minimal)</option>
                    <option value="Impact">Impact (Heavy Punch)</option>
                    <option value="Arial Black">Arial Black (Classic Bold)</option>
                    <option value="Bebas Neue">Bebas Neue (Condensed Poster)</option>
                    <option value="Outfit">Outfit (SaaS Modern)</option>
                    <option value="Poppins">Poppins (Rounded Clean)</option>
                    <option value="Roboto">Roboto (Crisp Editorial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-1.5">
                    Font Size
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: { ...config.captionSettings, fontSize: sz },
                          })
                        }
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold uppercase transition-all ${
                          config.captionSettings.fontSize === sz
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300 hover:bg-[#F1EFFF]/50 dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-1.5">
                    Text Case
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['uppercase', 'title', 'original'] as const).map((tc) => (
                      <button
                        key={tc}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: { ...config.captionSettings, textCase: tc },
                          })
                        }
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold capitalize transition-all ${
                          (config.captionSettings.textCase || 'uppercase') === tc
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300 hover:bg-[#F1EFFF]/50 dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850'
                        }`}
                      >
                        {tc === 'uppercase' ? 'CAPS' : tc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Customization: Highlight & Primary Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                    Highlight Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#F59E0B', '#06B6D4', '#A855F7', '#10B981', '#EC4899', '#3B82F6', '#FFFFFF'].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              captionSettings: {
                                ...config.captionSettings,
                                highlightColor: color,
                                activeWordBgColor: color,
                              },
                            })
                          }
                          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            config.captionSettings.highlightColor === color
                              ? 'border-brand-600 scale-110 ring-2 ring-brand-500/40'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select highlight color ${color}`}
                        />
                      )
                    )}
                    <input
                      type="color"
                      value={config.captionSettings.highlightColor || '#F59E0B'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          captionSettings: {
                            ...config.captionSettings,
                            highlightColor: e.target.value,
                            activeWordBgColor: e.target.value,
                          },
                        })
                      }
                      className="w-7 h-7 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
                      title="Custom Hex Color"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                    Primary Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#FFFFFF', '#FEF08A', '#E2E8F0', '#F3E8FF', '#E0F2FE'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: { ...config.captionSettings, textColor: color },
                          })
                        }
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          config.captionSettings.textColor === color
                            ? 'border-brand-600 scale-110 ring-2 ring-brand-500/40'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select text color ${color}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={config.captionSettings.textColor || '#FFFFFF'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          captionSettings: { ...config.captionSettings, textColor: e.target.value },
                        })
                      }
                      className="w-7 h-7 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
                      title="Custom Text Hex Color"
                    />
                  </div>
                </div>
              </div>

              {/* Position and Display Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                    Caption Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bottom', 'middle', 'top'] as CaptionPosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: { ...config.captionSettings, position: pos },
                          })
                        }
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          config.captionSettings.position === pos
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300 hover:bg-[#F1EFFF]/50 dark:bg-dark-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-850'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-2">
                    Opening Hook Title
                  </label>
                  <Input
                    placeholder="e.g. Stop Scrolling!"
                    value={config.captionSettings.openingTitle || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        captionSettings: {
                          ...config.captionSettings,
                          openingTitle: e.target.value,
                          showOpeningTitle: !!e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Resolution & Advanced Instructions */}
      {activeTab === 'advanced' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Output Resolution"
              value={config.outputResolution}
              onChange={(e) =>
                setConfig({ ...config, outputResolution: e.target.value as any })
              }
            >
              <option value="1080p">1080p Full HD (Recommended)</option>
              <option value="720p">720p HD (Faster processing)</option>
              <option value="4k">4K Ultra HD (Pro)</option>
            </Select>

            <Select
              label="Spoken Audio Language"
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value })}
            >
              <option value="en">English (US / UK / Global)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="pt">Portuguese (Português)</option>
              <option value="ja">Japanese (日本語)</option>
              <option value="auto">Auto-detect Language</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] dark:text-slate-300 mb-1.5">
              Custom AI Instructions (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] dark:text-slate-100 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-sm"
              placeholder="e.g. Focus on pricing tips mentioned in the first 10 minutes, exclude any sponsor segments..."
              value={config.customInstructions || ''}
              onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800">
            <Checkbox
              checked={config.keepAudio}
              onChange={(e) => setConfig({ ...config, keepAudio: e.target.checked })}
              label={<span className="text-xs font-bold text-[var(--text-primary)] dark:text-white">Preserve Original Audio Quality</span>}
              description="Keep high-fidelity uncompressed AAC audio track during clipping"
            />
          </div>
        </div>
      )}

      {/* Configuration Summary & Action Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900/90 border border-[var(--border)] dark:border-brand-500/20 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="text-xs space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAE8FF] dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <span className="font-bold text-sm text-[var(--text-primary)] dark:text-white">
              Ready to generate{' '}
              <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                {config.clipCount === 'custom' ? config.customClipCount : config.clipCount} vertical clips
              </span>
            </span>
          </div>
          <p className="text-[var(--text-secondary)] dark:text-slate-400 text-xs font-medium pl-10">
            Aspect: <strong className="text-[var(--text-primary)] dark:text-slate-200">{config.aspectRatio}</strong> • Duration:{' '}
            <strong className="text-[var(--text-primary)] dark:text-slate-200">{config.targetDuration}s</strong> • Captions:{' '}
            <strong className="text-[var(--text-primary)] dark:text-slate-200">
              {config.captionSettings.enabled ? config.captionSettings.preset : 'Off'}
            </strong>
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<Wand2 className="w-5 h-5 text-white" />}
          className="w-full sm:w-auto px-6 py-3 font-bold shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 text-sm shrink-0"
        >
          Generate AI Clips
        </Button>
      </div>
    </form>
  );
};
