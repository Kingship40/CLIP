import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Plus, HelpCircle, Sparkles, BookOpen, ExternalLink, Keyboard, Bot } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SeedanceStudioModal } from '../seedance/SeedanceStudioModal';
import { AIModelModal } from '../common/AIModelModal';
import { useSettingsStore } from '../../store/useSettingsStore';

export interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSeedanceModal, setShowSeedanceModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const { settings } = useSettingsStore();
  const location = useLocation();

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/dashboard') return 'Dashboard Overview';
    if (p === '/dashboard/new') return 'New Clipping Project';
    if (p === '/dashboard/projects') return 'Project Library';
    if (p.startsWith('/dashboard/projects/')) return 'Project Workspace';
    if (p.startsWith('/dashboard/clips/')) return 'Clip Video Editor';
    if (p === '/dashboard/seedance') return 'Seedance 2.5 AI Video Studio';
    if (p === '/settings') return 'Preferences & Settings';
    return 'Creative Studio';
  };

  const hasApiKey =
    (settings.aiSettings?.provider === 'gemini' && !!settings.aiSettings?.geminiApiKey) ||
    (settings.aiSettings?.provider === 'openai' && !!settings.aiSettings?.openaiApiKey);

  return (
    <>
      <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 lg:hidden"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Model Vision Connection Pill */}
          <button
            onClick={() => setShowAIModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hasApiKey
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-dark-950 text-slate-300 border-slate-800 hover:border-cyan-500/50'
            }`}
            title="Configure Real AI Model (Gemini / ChatGPT / Local Vision)"
          >
            <Bot className={`w-3.5 h-3.5 ${hasApiKey ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">
              {settings.aiSettings?.provider === 'gemini' && settings.aiSettings.geminiApiKey
                ? 'Gemini Vision (Active)'
                : settings.aiSettings?.provider === 'openai' && settings.aiSettings.openaiApiKey
                ? 'ChatGPT Vision (Active)'
                : 'Connect AI Vision'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </button>

          <button
            onClick={() => setShowSeedanceModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-brand-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all shadow-glow-cyan"
            title="Launch Seedance-2.5 Multimodal Engine"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Seedance-2.5 Gen</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-dark-800 transition-colors"
            title="Help & Workflow Guide"
          >
            <HelpCircle className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {location.pathname !== '/dashboard/new' && (
            <NavLink to="/dashboard/new">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                <span>New Project</span>
              </Button>
            </NavLink>
          )}
        </div>
      </header>

      {/* Seedance 2.5 Generative Modal */}
      <SeedanceStudioModal
        isOpen={showSeedanceModal}
        onClose={() => setShowSeedanceModal(false)}
      />

      {/* Guide Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="ClipForge AI — Quick Workflow Guide"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <p className="text-slate-400 leading-relaxed">
            Welcome to <strong>ClipForge AI</strong>! Follow this simple 3-step workflow to repurpose long-form videos into viral vertical clips:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-xs mb-2">1</span>
              <h5 className="font-semibold text-white mb-1">Upload or Select</h5>
              <p className="text-slate-400 text-xs">
                Upload your MP4/MOV podcast or choose one of our instant sample videos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs mb-2">2</span>
              <h5 className="font-semibold text-white mb-1">Configure & Clip</h5>
              <p className="text-slate-400 text-xs">
                Select your target duration, clip count, 9:16 vertical ratio, and caption style.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs mb-2">3</span>
              <h5 className="font-semibold text-white mb-1">Edit & Export</h5>
              <p className="text-slate-400 text-xs">
                Fine-tune timestamps on the timeline, adjust captions live, and export SRT or metadata.
              </p>
            </div>
          </div>

          <div className="p-3 bg-dark-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium">Video Player Shortcuts:</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span><kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-slate-700 text-slate-200">Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-slate-700 text-slate-200">← / →</kbd> Seek 2s</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* AI Model Connector Modal */}
      <AIModelModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </>
  );
};
