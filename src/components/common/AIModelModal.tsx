import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { testApiKey } from '../../services/aiVideoAnalysisService';
import {
  Sparkles,
  Bot,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';

export interface AIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIModelModal: React.FC<AIModelModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { addToast } = useToastStore();

  const [provider, setProvider] = useState<'gemini' | 'openai' | 'waveform'>(
    settings.aiSettings?.provider || 'gemini'
  );
  const [geminiKey, setGeminiKey] = useState(settings.aiSettings?.geminiApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(settings.aiSettings?.openaiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(
    settings.aiSettings?.geminiModel || 'gemini-1.5-flash'
  );
  const [openaiModel, setOpenaiModel] = useState(
    settings.aiSettings?.openaiModel || 'gpt-4o-mini'
  );

  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const activeKey = provider === 'gemini' ? geminiKey : openaiKey;
    const activeModel = provider === 'gemini' ? geminiModel : openaiModel;

    const res = await testApiKey(provider as any, activeKey, activeModel);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      addToast({
        title: 'Connection Successful',
        message: res.message,
        type: 'success',
      });
    } else {
      addToast({
        title: 'Connection Failed',
        message: res.message,
        type: 'error',
      });
    }
  };

  const handleSave = () => {
    updateSettings({
      aiSettings: {
        provider,
        geminiApiKey: geminiKey.trim(),
        openaiApiKey: openaiKey.trim(),
        geminiModel: geminiModel as any,
        openaiModel: openaiModel as any,
        isKeyVerified: testResult?.success || false,
      },
    });

    addToast({
      title: 'AI Service Configured',
      message: `Active AI provider set to ${
        provider === 'gemini'
          ? 'Google Gemini Vision'
          : provider === 'openai'
          ? 'OpenAI ChatGPT'
          : 'Free Client-Side Engine'
      }.`,
      type: 'success',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect AI Video Vision Model"
      description="Connect a real multimodal AI to watch your video frames and extract viral short clips."
      maxWidth="md"
    >
      <div className="space-y-5 text-xs text-slate-300">
        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-dark-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setProvider('gemini');
              setTestResult(null);
            }}
            className={`p-2 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              provider === 'gemini'
                ? 'bg-cyan-500 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Google Gemini</span>
            <span className="text-[9px] font-mono opacity-80">Free Tier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('openai');
              setTestResult(null);
            }}
            className={`p-2 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              provider === 'openai'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>OpenAI ChatGPT</span>
            <span className="text-[9px] font-mono opacity-80">GPT-4o Vision</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('waveform');
              setTestResult(null);
            }}
            className={`p-2 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              provider === 'waveform'
                ? 'bg-brand-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Free Local Engine</span>
            <span className="text-[9px] font-mono opacity-80">No Key Needed</span>
          </button>
        </div>

        {/* Gemini Provider Section */}
        {provider === 'gemini' && (
          <div className="space-y-3 p-4 rounded-xl bg-dark-950 border border-slate-800 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Google Gemini Vision (Free API)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Google Gemini 1.5 Flash natively watches video frames at 60fps speeds with microsecond audio transcription. Completely free at Google AI Studio.
                </p>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all font-semibold text-[11px] flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Gemini API Key:</span>
                {geminiKey && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Key saved
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Gemini Model:</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value as any)}
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest, High Quota Free Tier)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental (Next-Gen Video Vision)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deepest Analysis)</option>
              </select>
            </div>
          </div>
        )}

        {/* OpenAI ChatGPT Section */}
        {provider === 'openai' && (
          <div className="space-y-3 p-4 rounded-xl bg-dark-950 border border-slate-800 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>OpenAI ChatGPT Vision</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Uses GPT-4o / GPT-4o-mini with Vision to inspect sampled video frames and detect high-energy dopamine hooks.
                </p>
              </div>

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-semibold text-[11px] flex items-center gap-1"
              >
                <span>OpenAI Keys</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">OpenAI API Key:</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="sk-proj-..."
                  className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">OpenAI Model:</label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value as any)}
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Cost-Effective Vision)</option>
                <option value="gpt-4o">GPT-4o (Full Flagship Multimodal)</option>
              </select>
            </div>
          </div>
        )}

        {/* Free Local Engine Section */}
        {provider === 'waveform' && (
          <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2 animate-in fade-in">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-400" />
              <span>Client-Side Scene & Energy Engine</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No API keys required. Analyzes your video file directly inside your browser by sampling visual scene changes, calculating frame variance, and cutting clips at peak activity moments.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[10px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready to use instantly with 100% privacy (zero network calls).</span>
            </div>
          </div>
        )}

        {/* Test Connection Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="text-xs">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {provider !== 'waveform' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isTesting}
              onClick={handleTestConnection}
              leftIcon={<Zap className="w-4 h-4 text-amber-400" />}
            >
              Test Connection
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Save & Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
