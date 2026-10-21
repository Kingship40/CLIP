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
} from 'lucide-react';
import { testApiKey } from '../services/aiVideoAnalysisService';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useSettingsStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipping' | 'ai' | 'profile' | 'data'>('clipping');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    addToast({
      title: 'Preferences Saved',
      message: 'Default clipping configuration and studio settings updated.',
      type: 'success',
    });
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
      <div className="flex border-b border-slate-800 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('clipping')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'clipping'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-brand-400" />
          <span>Clipping Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'ai'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>AI Vision Models</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-cyan-400" />
          <span>Profile & Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'data'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Storage & Demo Data</span>
        </button>
      </div>

      {/* Tab 1: Clipping Defaults */}
      {activeTab === 'clipping' && (
        <div className="space-y-6">
          {/* Default Aspect Ratio */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Default Aspect Ratio</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-selected framing when creating new clipping projects
              </p>
            </div>

            <AspectRatioSelector
              value={localSettings.defaultAspectRatio}
              onChange={(ratio) => setLocalSettings({ ...localSettings, defaultAspectRatio: ratio })}
            />
          </div>

          {/* Default Duration & Language */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Duration & Language Defaults</h3>
              <p className="text-xs text-slate-400 mt-0.5">
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
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Default Caption Typography</h3>
              <p className="text-xs text-slate-400 mt-0.5">
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
                      ? 'bg-brand-500/15 border-brand-500 text-white'
                      : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
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
                label={<span className="text-xs font-semibold text-white">Auto Highlight Keywords</span>}
                description="Automatically emphasize emotional peaks and numbers with high-contrast accent colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Vision Models */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span>Multimodal AI Vision & Clipping Provider</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Connect a real multimodal AI model (Google Gemini or OpenAI ChatGPT) to inspect visual frames, analyze speech cadence, and automatically detect viral dopamine hooks across your video timeline.
                </p>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                localSettings.aiSettings?.geminiApiKey || localSettings.aiSettings?.openaiApiKey
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
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
                    ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500 text-white'
                    : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Google Gemini</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Free Tier
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
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
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500 text-white'
                    : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">OpenAI ChatGPT</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    GPT-4o
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
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
                    ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 text-white'
                    : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">Local Vision Engine</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    No Key
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Client-side visual scene variance & timeline cut detection.
                </p>
              </button>
            </div>

            {/* Provider Detailed Inputs */}
            {localSettings.aiSettings?.provider === 'gemini' && (
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Google Gemini API Configuration</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Free Gemini Key (aistudio.google.com)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400">Gemini API Key</label>
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
                      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Model</label>
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
                      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Test Gemini Key
                </Button>
              </div>
            )}

            {localSettings.aiSettings?.provider === 'openai' && (
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">OpenAI ChatGPT Configuration</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get OpenAI API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-slate-400">OpenAI API Key</label>
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
                      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Model</label>
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
                      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Test OpenAI Key
                </Button>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
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
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-5">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-brand-500/20"
              />
              <div>
                <h3 className="text-base font-bold text-white">{user?.name}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {user?.plan} Plan Active
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {user?.clipsGeneratedCount || 38} clips created
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <Input label="Full Name" value={user?.name || ''} readOnly />
              <Input label="Email Address" value={user?.email || ''} readOnly />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Notification Preferences</h3>
            <Checkbox
              checked={localSettings.emailNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })
              }
              label={<span className="text-xs font-semibold text-white">Processing Complete Alerts</span>}
              description="Receive notifications when high-resolution video exports finish compiling"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Storage & Demo Data */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold">Reset Demo Workspace Data</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
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

          <div className="p-4 rounded-xl bg-dark-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block">Local Storage Integrity</strong>
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
