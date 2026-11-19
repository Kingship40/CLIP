import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { AspectRatio, CaptionPreset } from '../types';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Checkbox } from '../components/common/Checkbox';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/Dialog';
import { AspectRatioSelector } from '../components/config/AspectRatioSelector';
import {
  Settings,
  User,
  Sliders,
  Type,
  Bell,
  Trash2,
  Sparkles,
  ShieldCheck,
  Save,
  RotateCcw,
  Bot,
  Key,
  ExternalLink,
  Zap,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Flame,
  AudioLines,
  Palette,
  Layers,
  Radio,
  FileText,
} from 'lucide-react';
import { testApiKey } from '../services/aiVideoAnalysisService';
import { verifyDeepgramApiKey, deepgramServiceInstance } from '../services/deepgramService';
import { CaptionSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useSettingsStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipping' | 'subtitles' | 'ai' | 'profile' | 'data'>('subtitles');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Deepgram settings state
  const [showDeepgramKey, setShowDeepgramKey] = useState(false);
  const [isTestingDeepgramKey, setIsTestingDeepgramKey] = useState(false);
  const [deepgramTestResult, setDeepgramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    updateSettings(localSettings);

    // Synchronize Deepgram API key and model with client service & backend
    if (localSettings.deepgramSettings?.apiKey) {
      deepgramServiceInstance.setApiKey(
        localSettings.deepgramSettings.apiKey,
        localSettings.deepgramSettings.model
      );
      fetch('/api/deepgram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: localSettings.deepgramSettings.apiKey,
          model: localSettings.deepgramSettings.model,
        }),
      }).catch(() => {});
    }

    // Synchronize Gemini API key and model with client service & backend
    if (localSettings.aiSettings?.geminiApiKey) {
      fetch('/api/gemini/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: localSettings.aiSettings.geminiApiKey,
          model: localSettings.aiSettings.geminiModel,
        }),
      }).catch(() => {});
    }

    addToast({
      title: 'Preferences Saved',
      message: 'Deepgram API credentials and subtitle style preferences saved.',
      type: 'success',
    });
  };

  const handleTestDeepgram = async () => {
    const key = localSettings.deepgramSettings?.apiKey;
    if (!key || !key.trim()) {
      setDeepgramTestResult({
        success: false,
        message: 'Please enter a Deepgram API Key before testing.',
      });
      return;
    }

    setIsTestingDeepgramKey(true);
    setDeepgramTestResult(null);

    try {
      const res = await verifyDeepgramApiKey(key.trim());
      setDeepgramTestResult(res);

      if (res.success) {
        setLocalSettings((prev) => ({
          ...prev,
          deepgramSettings: {
            ...prev.deepgramSettings!,
            apiKey: key.trim(),
            isKeyVerified: true,
          },
        }));

        deepgramServiceInstance.setApiKey(key.trim(), localSettings.deepgramSettings?.model);

        addToast({
          title: 'Deepgram API Verified',
          message: res.message,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Verification Failed',
          message: res.message,
          type: 'error',
        });
      }
    } catch (e: any) {
      setDeepgramTestResult({
        success: false,
        message: e.message || 'Deepgram API verification failed.',
      });
    } finally {
      setIsTestingDeepgramKey(false);
    }
  };

  const handleResetData = () => {
    resetAllData();
    setIsResetConfirmOpen(false);
    addToast({
      title: 'Storage Reset',
      message: 'Reset projects and settings to default demo seed data.',
      type: 'info',
    });
    setLocalSettings(settings);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-400" />
            <span>Preferences & Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Customize default aspect ratios, caption styles, profile info, and local storage.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          leftIcon={<Save className="w-4 h-4 text-white" />}
        >
          Save Preferences
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] dark:border-slate-800 gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('subtitles')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'subtitles'
              ? 'border-brand-500 text-brand-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Type className="w-4 h-4 text-brand-500" />
          <span>Subtitles & Deepgram API</span>
          {localSettings.deepgramSettings?.apiKey && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Deepgram Key Active" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('clipping')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'clipping'
              ? 'border-brand-500 text-brand-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-brand-400" />
          <span>Clipping Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-brand-500 text-brand-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>AI Vision Models</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-cyan-400" />
          <span>Profile & Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
            activeTab === 'data'
              ? 'border-brand-500 text-brand-600 dark:text-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Storage & Demo Data</span>
        </button>
      </div>

      {/* Tab: Subtitles & Deepgram API */}
      {activeTab === 'subtitles' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Deepgram Speech-to-Text API Credentials Card */}
          <div
            className="p-6 rounded-2xl border space-y-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <AudioLines className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Deepgram Speech-to-Text API
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Transcribe authentic spoken dialogue with sub-second word timestamps using Deepgram Nova-2
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    localSettings.deepgramSettings?.apiKey && localSettings.deepgramSettings?.isKeyVerified
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                      : localSettings.deepgramSettings?.apiKey
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
                      : 'bg-slate-500/10 text-slate-500 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {localSettings.deepgramSettings?.apiKey && localSettings.deepgramSettings?.isKeyVerified
                    ? '✓ Deepgram Active'
                    : localSettings.deepgramSettings?.apiKey
                    ? 'Key Stored (Unverified)'
                    : 'Not Configured'}
                </span>

                <a
                  href="https://console.deepgram.com/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                >
                  <span>Get Free Key ($200 Credit)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* API Key Input Row */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Deepgram API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showDeepgramKey ? 'text' : 'password'}
                      value={localSettings.deepgramSettings?.apiKey || ''}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          deepgramSettings: {
                            apiKey: e.target.value,
                            model: localSettings.deepgramSettings?.model || 'nova-2',
                            language: localSettings.deepgramSettings?.language || 'auto',
                            smartFormat: localSettings.deepgramSettings?.smartFormat !== false,
                            punctuate: localSettings.deepgramSettings?.punctuate !== false,
                            diarize: localSettings.deepgramSettings?.diarize !== false,
                            utterances: localSettings.deepgramSettings?.utterances !== false,
                            isKeyVerified: false,
                          },
                        })
                      }
                      placeholder="e.g. 48c0bf8244..."
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepgramKey(!showDeepgramKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title={showDeepgramKey ? 'Hide key' : 'Show key'}
                    >
                      {showDeepgramKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    isLoading={isTestingDeepgramKey}
                    onClick={handleTestDeepgram}
                    leftIcon={<Zap className="w-4 h-4 text-amber-500" />}
                    className="font-bold shrink-0"
                  >
                    Test Deepgram Key
                  </Button>
                </div>
              </div>

              {/* Test Result Message */}
              {deepgramTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    deepgramTestResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {deepgramTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{deepgramTestResult.message}</span>
                </div>
              )}
            </div>

            {/* Model & Language Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Deepgram ASR Model
                </label>
                <select
                  value={localSettings.deepgramSettings?.model || 'nova-2'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        ...(localSettings.deepgramSettings || {
                          apiKey: '',
                          smartFormat: true,
                          punctuate: true,
                          diarize: true,
                          utterances: true,
                        }),
                        model: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                >
                  <option value="nova-2">nova-2 (Recommended: 40x Faster, Lowest Word Error Rate)</option>
                  <option value="nova-2-general">nova-2-general (Conversational / General Audio)</option>
                  <option value="nova-2-meeting">nova-2-meeting (Multi-speaker Podcasts & Meetings)</option>
                  <option value="nova-2-phonecall">nova-2-phonecall (Telephony & Low Bitrate Audio)</option>
                  <option value="nova-3">nova-3 (Next-Gen Preview)</option>
                  <option value="enhanced">enhanced (Legacy High Accuracy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Default Transcription Language
                </label>
                <select
                  value={localSettings.deepgramSettings?.language || 'auto'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        ...(localSettings.deepgramSettings || {
                          apiKey: '',
                          model: 'nova-2',
                          smartFormat: true,
                          punctuate: true,
                          diarize: true,
                          utterances: true,
                        }),
                        language: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                >
                  <option value="auto">Auto-detect Spoken Language</option>
                  <option value="en">English (US / UK / Global)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="pt">Portuguese (Português)</option>
                  <option value="ja">Japanese (日本語)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
              </div>
            </div>

            {/* Smart Feature Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <Checkbox
                  checked={localSettings.deepgramSettings?.smartFormat !== false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        apiKey: localSettings.deepgramSettings?.apiKey || '',
                        model: localSettings.deepgramSettings?.model || 'nova-2',
                        language: localSettings.deepgramSettings?.language || 'auto',
                        punctuate: localSettings.deepgramSettings?.punctuate !== false,
                        diarize: localSettings.deepgramSettings?.diarize !== false,
                        utterances: localSettings.deepgramSettings?.utterances !== false,
                        smartFormat: e.target.checked,
                      },
                    })
                  }
                  label={<span className="text-xs font-bold text-[var(--text-primary)]">Smart Number & Date Formatting</span>}
                  description="Formats numbers and currencies cleanly (e.g. '$10M' instead of 'ten million dollars')"
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <Checkbox
                  checked={localSettings.deepgramSettings?.punctuate !== false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        apiKey: localSettings.deepgramSettings?.apiKey || '',
                        model: localSettings.deepgramSettings?.model || 'nova-2',
                        language: localSettings.deepgramSettings?.language || 'auto',
                        smartFormat: localSettings.deepgramSettings?.smartFormat !== false,
                        diarize: localSettings.deepgramSettings?.diarize !== false,
                        utterances: localSettings.deepgramSettings?.utterances !== false,
                        punctuate: e.target.checked,
                      },
                    })
                  }
                  label={<span className="text-xs font-bold text-[var(--text-primary)]">Smart Punctuation & Capitalization</span>}
                  description="Adds natural punctuation and commas for clean subtitle phrase breaks"
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <Checkbox
                  checked={localSettings.deepgramSettings?.diarize !== false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        apiKey: localSettings.deepgramSettings?.apiKey || '',
                        model: localSettings.deepgramSettings?.model || 'nova-2',
                        language: localSettings.deepgramSettings?.language || 'auto',
                        smartFormat: localSettings.deepgramSettings?.smartFormat !== false,
                        punctuate: localSettings.deepgramSettings?.punctuate !== false,
                        utterances: localSettings.deepgramSettings?.utterances !== false,
                        diarize: e.target.checked,
                      },
                    })
                  }
                  label={<span className="text-xs font-bold text-[var(--text-primary)]">Multi-Speaker Diarization</span>}
                  description="Identifies who spoke each phrase (Speaker 1, Speaker 2) for interview podcasts"
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <Checkbox
                  checked={localSettings.deepgramSettings?.utterances !== false}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      deepgramSettings: {
                        apiKey: localSettings.deepgramSettings?.apiKey || '',
                        model: localSettings.deepgramSettings?.model || 'nova-2',
                        language: localSettings.deepgramSettings?.language || 'auto',
                        smartFormat: localSettings.deepgramSettings?.smartFormat !== false,
                        punctuate: localSettings.deepgramSettings?.punctuate !== false,
                        diarize: localSettings.deepgramSettings?.diarize !== false,
                        utterances: e.target.checked,
                      },
                    })
                  }
                  label={<span className="text-xs font-bold text-[var(--text-primary)]">Natural Utterance Segmentation</span>}
                  description="Splits dialogue along natural breathing pauses for readable video pacing"
                />
              </div>
            </div>
          </div>

          {/* Subtitle Style Defaults & Customization Card */}
          <div
            className="p-6 rounded-2xl border space-y-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Default Subtitle Style & Typography
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Customize the default visual aesthetic, fonts, and colors for all newly generated clips
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Live Subtitle Preview */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>Live Subtitle Preview</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-brand-600">
                  {localSettings.subtitleDefaults?.preset || localSettings.defaultCaptionPreset || 'hormozi'} •{' '}
                  {localSettings.subtitleDefaults?.fontFamily || 'Montserrat'}
                </span>
              </div>

              <div className="relative h-32 rounded-xl bg-gradient-to-b from-slate-900 to-black border border-slate-800 flex items-center justify-center p-4 overflow-hidden select-none">
                <div
                  className="text-center font-black tracking-wider leading-snug px-4 py-2 transition-all"
                  style={{
                    fontFamily: `"${localSettings.subtitleDefaults?.fontFamily || 'Montserrat'}", sans-serif`,
                    fontSize:
                      localSettings.subtitleDefaults?.fontSize === 'xl'
                        ? '22px'
                        : localSettings.subtitleDefaults?.fontSize === 'lg'
                        ? '19px'
                        : localSettings.subtitleDefaults?.fontSize === 'sm'
                        ? '14px'
                        : '16px',
                    color: localSettings.subtitleDefaults?.textColor || '#FFFFFF',
                    textShadow:
                      localSettings.subtitleDefaults?.outlineWidth === 'none'
                        ? undefined
                        : `-2px -2px 0 ${localSettings.subtitleDefaults?.outlineColor || '#000'}, 2px -2px 0 ${localSettings.subtitleDefaults?.outlineColor || '#000'}, -2px 2px 0 ${localSettings.subtitleDefaults?.outlineColor || '#000'}, 2px 2px 0 ${localSettings.subtitleDefaults?.outlineColor || '#000'}`,
                  }}
                >
                  <span className="mr-2">STOP</span>
                  <span
                    className="px-2 py-0.5 rounded-lg inline-block transform scale-110 shadow-lg mx-1"
                    style={{
                      backgroundColor:
                        localSettings.subtitleDefaults?.preset === 'boxed'
                          ? localSettings.subtitleDefaults?.activeWordBgColor || '#F59E0B'
                          : 'transparent',
                      color:
                        localSettings.subtitleDefaults?.preset === 'boxed'
                          ? '#000000'
                          : localSettings.subtitleDefaults?.highlightColor || '#F59E0B',
                    }}
                  >
                    LEAVING
                  </span>
                  <span className="mx-2">VALUE</span>
                  <span>ON THE TABLE</span>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                Caption Preset Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'hormozi', label: 'Hormozi Viral', badge: 'High Energy' },
                  { id: 'boxed', label: 'Boxed Pill', badge: 'Signature' },
                  { id: 'karaoke', label: 'Electric Karaoke', badge: 'Dynamic' },
                  { id: 'bounce', label: 'Bounce & Pop', badge: 'Kinetic' },
                  { id: 'minimal', label: 'Minimal Clean', badge: 'Aesthetic' },
                  { id: 'neon', label: 'Neon Cyber', badge: 'Vibrant' },
                  { id: 'cinematic', label: 'Cinematic Box', badge: 'Subtle' },
                ].map((preset) => {
                  const isSelected =
                    (localSettings.subtitleDefaults?.preset || localSettings.defaultCaptionPreset) === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          defaultCaptionPreset: preset.id as any,
                          subtitleDefaults: {
                            ...(localSettings.subtitleDefaults || {}),
                            preset: preset.id as any,
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                        isSelected
                          ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 font-bold dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{preset.label}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">{preset.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Family & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Font Family
                </label>
                <select
                  value={localSettings.subtitleDefaults?.fontFamily || 'Montserrat'}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      subtitleDefaults: {
                        ...(localSettings.subtitleDefaults || {}),
                        fontFamily: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Font Size
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => {
                    const isSelected = (localSettings.subtitleDefaults?.fontSize || 'md') === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            subtitleDefaults: {
                              ...(localSettings.subtitleDefaults || {}),
                              fontSize: sz,
                            },
                          })
                        }
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-bold uppercase transition-all ${
                          isSelected
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                  Text Transform
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['uppercase', 'title', 'original'] as const).map((tc) => {
                    const isSelected = (localSettings.subtitleDefaults?.textCase || 'uppercase') === tc;
                    return (
                      <button
                        key={tc}
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            subtitleDefaults: {
                              ...(localSettings.subtitleDefaults || {}),
                              textCase: tc,
                            },
                          })
                        }
                        className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold capitalize transition-all ${
                          isSelected
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300'
                        }`}
                      >
                        {tc === 'uppercase' ? 'CAPS' : tc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colors: Highlight & Text Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                  Active Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  {['#F59E0B', '#06B6D4', '#10B981', '#EC4899', '#8B5CF6', '#F97316', '#FFFFFF'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            subtitleDefaults: {
                              ...(localSettings.subtitleDefaults || {}),
                              highlightColor: color,
                              activeWordBgColor: color,
                            },
                          })
                        }
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          (localSettings.subtitleDefaults?.highlightColor || '#F59E0B') === color
                            ? 'border-brand-600 scale-110 ring-2 ring-brand-500/40'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select highlight ${color}`}
                      />
                    )
                  )}
                  <input
                    type="color"
                    value={localSettings.subtitleDefaults?.highlightColor || '#F59E0B'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        subtitleDefaults: {
                          ...(localSettings.subtitleDefaults || {}),
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                  Primary Text Color
                </label>
                <div className="flex items-center gap-2">
                  {['#FFFFFF', '#FEF08A', '#E2E8F0', '#F3E8FF', '#E0F2FE'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          subtitleDefaults: {
                            ...(localSettings.subtitleDefaults || {}),
                            textColor: color,
                          },
                        })
                      }
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        (localSettings.subtitleDefaults?.textColor || '#FFFFFF') === color
                          ? 'border-brand-600 scale-110 ring-2 ring-brand-500/40'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select text ${color}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={localSettings.subtitleDefaults?.textColor || '#FFFFFF'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        subtitleDefaults: {
                          ...(localSettings.subtitleDefaults || {}),
                          textColor: e.target.value,
                        },
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                  Vertical Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bottom', 'middle', 'top'] as const).map((pos) => {
                    const isSelected = (localSettings.subtitleDefaults?.position || 'bottom') === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            subtitleDefaults: {
                              ...(localSettings.subtitleDefaults || {}),
                              position: pos,
                            },
                          })
                        }
                        className={`py-2 px-2 text-center rounded-xl border text-xs font-bold capitalize transition-all ${
                          isSelected
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300'
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                  Display Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'word-highlight', label: 'Word Highlight' },
                    { id: 'boxed-word', label: 'Boxed Pill' },
                    { id: 'single-word', label: 'Single Word' },
                    { id: 'phrase', label: 'Short Phrase' },
                  ].map((mode) => {
                    const isSelected =
                      (localSettings.subtitleDefaults?.displayMode || 'word-highlight') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            subtitleDefaults: {
                              ...(localSettings.subtitleDefaults || {}),
                              displayMode: mode.id as any,
                            },
                          })
                        }
                        className={`py-2 px-2 text-center rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#EAE8FF] border-2 border-brand-500 text-brand-700 dark:bg-brand-500/20 dark:border-brand-500 dark:text-white'
                            : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-brand-300'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Clipping Defaults */}
      {activeTab === 'clipping' && (
        <div className="space-y-6">
          {/* Appearance & Theme Card */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Appearance & Theme</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Choose between clean light mode, immersive dark mode, or follow your system preference
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light Theme', desc: 'Soft off-white canvas with high contrast', Icon: Sun },
                { id: 'dark', label: 'Dark Theme', desc: 'Refined charcoal & navy surfaces', Icon: Moon },
                { id: 'system', label: 'System Mode', desc: 'Syncs with operating system', Icon: Monitor },
              ].map(({ id, label, desc, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const theme = id as any;
                    setLocalSettings({ ...localSettings, theme });
                    updateSettings({ theme });
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    localSettings.theme === id
                      ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500'
                      : 'hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: localSettings.theme === id ? undefined : 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-brand-500" />
                    <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{label}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Default Aspect Ratio */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Default Aspect Ratio</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Pre-selected framing when creating new clipping projects
              </p>
            </div>

            <AspectRatioSelector
              value={localSettings.defaultAspectRatio}
              onChange={(ratio) => setLocalSettings({ ...localSettings, defaultAspectRatio: ratio })}
            />
          </div>

          {/* Default Duration & Language */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Duration & Language Defaults</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Set baseline lengths for generated short-form clips
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default Target Duration"
                value={localSettings.defaultDuration}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultDuration: e.target.value as any })
                }
              >
                <option value="15-30">15–30 seconds (High-Velocity Hooks)</option>
                <option value="30-60">30–60 seconds (Standard Reels / Shorts)</option>
                <option value="60-90">60–90 seconds (In-Depth Explanations)</option>
              </Select>

              <Select
                label="Primary Spoken Language"
                value={localSettings.defaultLanguage}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, defaultLanguage: e.target.value })
                }
              >
                <option value="en">English (US / Global)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="ja">Japanese (日本語)</option>
              </Select>
            </div>
          </div>

          {/* Caption Style Defaults */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Default Caption Typography</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Default visual preset for dynamic subtitles
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'hormozi', label: 'Hormozi Bold' },
                { id: 'karaoke', label: 'Electric Karaoke' },
                { id: 'minimal', label: 'Minimal Clean' },
                { id: 'neon', label: 'Neon Glow' },
                { id: 'cinematic', label: 'Cinematic Box' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, defaultCaptionPreset: p.id as CaptionPreset })
                  }
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    localSettings.defaultCaptionPreset === p.id
                      ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-white'
                      : 'hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: localSettings.defaultCaptionPreset === p.id ? undefined : 'var(--border)',
                    color: localSettings.defaultCaptionPreset === p.id ? undefined : 'var(--text-secondary)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <Checkbox
                checked={localSettings.autoHighlightKeywords}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoHighlightKeywords: e.target.checked })
                }
                label={<span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Auto Highlight Keywords</span>}
                description="Automatically emphasize emotional peaks and numbers with high-contrast accent colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Vision Models */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span>Multimodal AI Vision & Clipping Provider</span>
                </h3>
                <p className="text-xs text-[var(--text-description)] mt-1 max-w-xl leading-relaxed">
                  Connect a real multimodal AI model (Google Gemini or OpenAI ChatGPT) to inspect visual frames, analyze speech cadence, and automatically detect viral dopamine hooks across your video timeline.
                </p>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                localSettings.aiSettings?.geminiApiKey || localSettings.aiSettings?.openaiApiKey
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] border-[var(--border)] dark:border-slate-700'
              }`}>
                {localSettings.aiSettings?.geminiApiKey || localSettings.aiSettings?.openaiApiKey
                  ? 'Real AI Connected'
                  : 'Client-Side Engine'}
              </span>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    aiSettings: { ...localSettings.aiSettings, provider: 'gemini' },
                  })
                }
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localSettings.aiSettings?.provider === 'gemini'
                    ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500 text-cyan-900 dark:text-white shadow-sm'
                    : 'bg-[var(--bg-surface-2)] dark:bg-dark-950 border-[var(--border)] dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[var(--text-primary)]">Google Gemini</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                    Free Tier
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-description)]">
                  Native video frame inspection & fast transcription at zero cost.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    aiSettings: { ...localSettings.aiSettings, provider: 'openai' },
                  })
                }
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localSettings.aiSettings?.provider === 'openai'
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500 text-emerald-900 dark:text-white shadow-sm'
                    : 'bg-[var(--bg-surface-2)] dark:bg-dark-950 border-[var(--border)] dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[var(--text-primary)]">OpenAI ChatGPT</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    GPT-4o
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-description)]">
                  GPT-4o Vision multimodal frame analysis & hook synthesis.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    aiSettings: { ...localSettings.aiSettings, provider: 'waveform' },
                  })
                }
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localSettings.aiSettings?.provider === 'waveform'
                    ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 text-brand-900 dark:text-white shadow-sm'
                    : 'bg-[var(--bg-surface-2)] dark:bg-dark-950 border-[var(--border)] dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[var(--text-primary)]">Local Vision Engine</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-300">
                    No Key
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-description)]">
                  Client-side visual scene variance & timeline cut detection.
                </p>
              </button>
            </div>

            {/* Provider Detailed Inputs */}
            {localSettings.aiSettings?.provider === 'gemini' && (
              <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Google Gemini API Configuration</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Free Gemini Key (aistudio.google.com)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Gemini API Key</label>
                    <input
                      type="password"
                      value={localSettings.aiSettings?.geminiApiKey || ''}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          aiSettings: {
                            ...localSettings.aiSettings,
                            geminiApiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="AIzaSy..."
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Model</label>
                    <select
                      value={localSettings.aiSettings?.geminiModel || 'gemini-1.5-flash'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          aiSettings: {
                            ...localSettings.aiSettings,
                            geminiModel: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fastest)</option>
                      <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isTestingKey}
                  onClick={async () => {
                    setIsTestingKey(true);
                    setTestResult(null);
                    const res = await testApiKey(
                      'gemini',
                      localSettings.aiSettings?.geminiApiKey || '',
                      localSettings.aiSettings?.geminiModel
                    );
                    setIsTestingKey(false);
                    setTestResult(res);
                  }}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Test Gemini Key
                </Button>
              </div>
            )}

            {localSettings.aiSettings?.provider === 'openai' && (
              <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-950 border border-[var(--border)] dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">OpenAI ChatGPT Configuration</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get OpenAI API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)]">OpenAI API Key</label>
                    <input
                      type="password"
                      value={localSettings.aiSettings?.openaiApiKey || ''}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          aiSettings: {
                            ...localSettings.aiSettings,
                            openaiApiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="sk-proj-..."
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Model</label>
                    <select
                      value={localSettings.aiSettings?.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          aiSettings: {
                            ...localSettings.aiSettings,
                            openaiModel: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Economical)</option>
                      <option value="gpt-4o">gpt-4o (Flagship Vision)</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isTestingKey}
                  onClick={async () => {
                    setIsTestingKey(true);
                    setTestResult(null);
                    const res = await testApiKey(
                      'openai',
                      localSettings.aiSettings?.openaiApiKey || '',
                      localSettings.aiSettings?.openaiModel
                    );
                    setIsTestingKey(false);
                    setTestResult(res);
                  }}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Test OpenAI Key
                </Button>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Profile & Plan */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-brand-500/20"
              />
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{user?.name}</h3>
                <p className="text-xs text-[var(--text-description)]">{user?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {user?.plan} Plan Active
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {user?.clipsGeneratedCount || 38} clips created
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border)] dark:border-slate-800">
              <Input label="Full Name" value={user?.name || ''} readOnly />
              <Input label="Email Address" value={user?.email || ''} readOnly />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Notification Preferences</h3>
            <Checkbox
              checked={localSettings.emailNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })
              }
              label={<span className="text-xs font-semibold text-[var(--text-primary)]">Processing Complete Alerts</span>}
              description="Receive notifications when high-resolution video exports finish compiling"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Storage & Demo Data */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold">Reset Demo Workspace Data</h3>
            </div>
            <p className="text-xs text-[var(--text-description)] leading-relaxed max-w-xl">
              This action clears all custom projects and restores the original seed projects and default settings. Temporary local video object URLs will be refreshed.
            </p>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset All Local Project Data
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-800 flex items-start gap-3 text-xs text-[var(--text-secondary)]">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[var(--text-primary)] block">Local Storage Integrity</strong>
              <p>ClipForge AI stores lightweight project metadata in your browser's LocalStorage. No confidential credentials or sensitive secrets are recorded.</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset All Local Project Data?"
        message="This will clear your local browser database and restore the original seed projects. Any uploaded videos will be replaced with sample demo records."
        confirmText="Reset Storage"
        variant="danger"
      />
    </div>
  );
};
