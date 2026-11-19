import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Plus, HelpCircle, Sparkles, BookOpen, ExternalLink, Keyboard, Bot } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SeedanceStudioModal } from '../seedance/SeedanceStudioModal';
import { AIModelModal } from '../common/AIModelModal';
import { ThemeToggle } from '../common/ThemeToggle';
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
      <header className="h-16 border-b sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] lg:hidden"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
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
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-cyan-500/50'
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
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

          <ThemeToggle />
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
        <div className="space-y-4 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p style={{ color: 'var(--text-muted)' }} className="leading-relaxed">
            Welcome to <strong>ClipForge AI</strong>! Follow this simple 3-step workflow to repurpose long-form videos into viral vertical clips:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
              <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-xs mb-2">1</span>
              <h5 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Upload or Select</h5>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                Upload your MP4/MOV podcast or choose one of our instant sample videos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs mb-2">2</span>
              <h5 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Configure & Clip</h5>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                Select your target duration, clip count, 9:16 vertical ratio, and caption style.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs mb-2">3</span>
              <h5 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Edit & Export</h5>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                Fine-tune timestamps on the timeline, adjust captions live, and export SRT or metadata.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border flex items-center justify-between text-xs" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Video Player Shortcuts:</span>
            </div>
            <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <span><kbd className="px-1.5 py-0.5 rounded border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 rounded border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>← / →</kbd> Seek 2s</span>
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
