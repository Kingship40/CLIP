import React, { useState } from 'react';
import {
  ProjectConfig,
  AspectRatio,
  ContentType,
  ClipPreference,
  CaptionPreset,
  CaptionPosition,
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
} from 'lucide-react';

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
    openingTitle: 'Key Takeaway 🔥',
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
  const [config, setConfig] = useState<ProjectConfig>(initialConfig);
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
    { id: 'hormozi', label: 'Hormozi Bold', preview: 'BOLD YELLOW WORDS', color: 'bg-amber-400 text-black font-black' },
    { id: 'karaoke', label: 'Electric Karaoke', preview: 'CYAN WORD GLOW', color: 'bg-cyan-500 text-white font-bold' },
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
      <div className="flex border-b border-slate-800 gap-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('clips')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'clips'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-brand-400" />
          <span>Clip Settings & Aspect</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('captions')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'captions'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4 text-cyan-400" />
          <span>Captions & Typography</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'advanced'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span>Resolution & AI Prompts</span>
        </button>
      </div>

      {/* Tab 1: Clip Settings & Aspect */}
      {activeTab === 'clips' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Aspect Ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Aspect Ratio
              </label>
              <span className="text-[11px] text-slate-400">Optimized for vertical feeds</span>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Number of Clips
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig({ ...config, clipCount: num })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      config.clipCount === num
                        ? 'bg-brand-500/20 border-brand-500 text-white ring-1 ring-brand-500'
                        : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850 hover:text-white'
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
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    config.clipCount === 'custom'
                      ? 'bg-brand-500/20 border-brand-500 text-white ring-1 ring-brand-500'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850 hover:text-white'
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
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
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                      config.targetDuration === dur.id
                        ? 'bg-brand-500/20 border-brand-500 text-white ring-1 ring-brand-500'
                        : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850 hover:text-white'
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setConfig({ ...config, contentType: type.id })}
                  className={`py-2 px-3 text-left rounded-lg border text-xs font-medium transition-all ${
                    config.contentType === type.id
                      ? 'bg-brand-500/15 border-brand-500/60 text-white font-semibold'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clip Selection Preferences */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Clip Highlight Priorities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {preferenceOptions.map((pref) => {
                const checked = config.preferences.includes(pref.id);
                return (
                  <div
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-brand-500/10 border-brand-500/50 text-white'
                        : 'bg-dark-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => togglePreference(pref.id)}
                      label={<span className="font-semibold text-xs text-white">{pref.label}</span>}
                      description={pref.desc}
                    />
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900 border border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-white">Auto Kinetic Captions</h4>
              <p className="text-xs text-slate-400 mt-0.5">
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
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Caption Style Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {captionPresets.map((preset) => {
                    const isSelected = config.captionSettings.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            captionSettings: { ...config.captionSettings, preset: preset.id },
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                            : 'bg-dark-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="h-10 rounded-lg bg-dark-950 flex items-center justify-center p-2 mb-2 border border-slate-800">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${preset.color}`}>
                            {preset.preview}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-white block">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Position and Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
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
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                          config.captionSettings.position === pos
                            ? 'bg-brand-500/20 border-brand-500 text-white'
                            : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Font Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
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
                        className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold uppercase transition-all ${
                          config.captionSettings.fontSize === sz
                            ? 'bg-brand-500/20 border-brand-500 text-white'
                            : 'bg-dark-900 border-slate-800 text-slate-400 hover:bg-dark-850'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keyword Highlight Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Highlight Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#F59E0B', '#06B6D4', '#A855F7', '#10B981', '#EC4899', '#3B82F6'].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              captionSettings: { ...config.captionSettings, highlightColor: color },
                            })
                          }
                          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            config.captionSettings.highlightColor === color
                              ? 'border-white scale-110 ring-2 ring-white/30'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select highlight color ${color}`}
                        />
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Opening Hook Title
                  </label>
                  <Input
                    placeholder="e.g. Stop Scrolling! 🚀"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Custom AI Instructions (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Focus on pricing tips mentioned in the first 10 minutes, exclude any sponsor segments..."
              value={config.customInstructions || ''}
              onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800">
            <Checkbox
              checked={config.keepAudio}
              onChange={(e) => setConfig({ ...config, keepAudio: e.target.checked })}
              label={<span className="text-xs font-semibold text-white">Preserve Original Audio Quality</span>}
              description="Keep high-fidelity uncompressed AAC audio track during clipping"
            />
          </div>
        </div>
      )}

      {/* Configuration Summary & Action */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 to-dark-900 border border-brand-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-white">
              Ready to generate{' '}
              <span className="text-brand-300">
                {config.clipCount === 'custom' ? config.customClipCount : config.clipCount} vertical clips
              </span>
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Aspect: {config.aspectRatio} • Duration: {config.targetDuration}s • Captions:{' '}
            {config.captionSettings.enabled ? config.captionSettings.preset : 'Off'}
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          leftIcon={<Wand2 className="w-5 h-5 text-white" />}
          className="w-full sm:w-auto shadow-glow-brand"
        >
          Generate AI Clips
        </Button>
      </div>
    </form>
  );
};
