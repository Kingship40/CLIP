import React from 'react';
import {
  CaptionSettings,
  SubtitleSegment,
  CaptionPreset,
  CaptionPosition,
  SubtitleDisplayMode,
  SubtitleOutlineWidth,
  SubtitleTextCase,
} from '../../types';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { Plus, Trash2, Clock, Type, Sparkles, User, Globe, Sliders, Palette, MoveVertical, Eye } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDurationPrecise } from '../../utils/formatters';

export interface CaptionEditorPanelProps {
  settings: CaptionSettings;
  subtitles: SubtitleSegment[];
  currentTime: number;
  onSettingsChange: (settings: CaptionSettings) => void;
  onSubtitlesChange: (subtitles: SubtitleSegment[]) => void;
  onSeek: (time: number) => void;
}

export const CaptionEditorPanel: React.FC<CaptionEditorPanelProps> = ({
  settings,
  subtitles,
  currentTime,
  onSettingsChange,
  onSubtitlesChange,
  onSeek,
}) => {
  const presets: { id: CaptionPreset; label: string; desc: string; badge: string }[] = [
    { id: 'hormozi', label: 'Hormozi Viral', desc: 'Bold black backing with vibrant yellow active word', badge: 'Popular' },
    { id: 'boxed', label: 'Boxed Pill', desc: 'Active word highlighted in colored pill', badge: 'Signature' },
    { id: 'karaoke', label: 'Electric Karaoke', desc: 'Cyan glow with kinetic progressive text stroke', badge: 'Dynamic' },
    { id: 'bounce', label: 'Bounce & Pop', desc: 'Animated scale zoom on each spoken word', badge: 'Kinetic' },
    { id: 'minimal', label: 'Minimal Clean', desc: 'Clean translucent pill with modern typography', badge: 'Aesthetic' },
    { id: 'neon', label: 'Neon Cyber', desc: 'Violet glowing outline for high energy punch', badge: 'Vibrant' },
    { id: 'cinematic', label: 'Cinematic Box', desc: 'Sleek letterboxed typography with subtle gradient', badge: 'Clean' },
  ];

  const fontFamilies = [
    { id: 'Montserrat', label: 'Montserrat (Viral Modern)' },
    { id: 'Inter', label: 'Inter (Clean Minimal)' },
    { id: 'Impact', label: 'Impact (Heavy Punch)' },
    { id: 'Arial Black', label: 'Arial Black (Classic Bold)' },
    { id: 'Bebas Neue', label: 'Bebas Neue (Condensed Poster)' },
    { id: 'Outfit', label: 'Outfit (SaaS Modern)' },
  ];

  const displayModes: { id: SubtitleDisplayMode; label: string; desc: string }[] = [
    { id: 'word-highlight', label: 'Word Highlight', desc: 'Full line with active word pop' },
    { id: 'boxed-word', label: 'Boxed Pill', desc: 'Spoken word in colored pill' },
    { id: 'single-word', label: 'Single Word', desc: 'High-speed 1-word punch' },
    { id: 'phrase', label: 'Short Phrase', desc: '3–7 words natural speech' },
  ];

  const textCases: { id: SubtitleTextCase; label: string }[] = [
    { id: 'uppercase', label: 'ALL CAPS' },
    { id: 'title', label: 'Title Case' },
    { id: 'original', label: 'Original' },
  ];

  const outlineWidths: { id: SubtitleOutlineWidth; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'thin', label: 'Thin' },
    { id: 'medium', label: 'Medium' },
    { id: 'thick', label: 'Thick' },
  ];

  const languages = [
    { code: 'auto', label: 'Auto-Detect Language' },
    { code: 'en', label: 'English (US/UK)' },
    { code: 'es', label: 'Spanish (Español)' },
    { code: 'fr', label: 'French (Français)' },
    { code: 'de', label: 'German (Deutsch)' },
    { code: 'ja', label: 'Japanese (日本語)' },
    { code: 'pt', label: 'Portuguese (Português)' },
    { code: 'zh', label: 'Chinese (中文)' },
  ];

  const highlightColors = [
    '#FACC15', // Viral Yellow
    '#06B6D4', // Electric Cyan
    '#10B981', // Emerald Green
    '#EC4899', // Hot Pink
    '#F97316', // Flame Orange
    '#8B5CF6', // Violet Purple
    '#FFFFFF', // Pure White
  ];

  const handleUpdateText = (id: string, newText: string) => {
    const updated = subtitles.map((sub) =>
      sub.id === id ? { ...sub, text: newText } : sub
    );
    onSubtitlesChange(updated);
  };

  const handleUpdateSpeaker = (id: string, newSpeaker: string) => {
    const updated = subtitles.map((sub) =>
      sub.id === id ? { ...sub, speaker: newSpeaker } : sub
    );
    onSubtitlesChange(updated);
  };

  const handleAdjustTiming = (id: string, field: 'start' | 'end', delta: number) => {
    const updated = subtitles.map((sub) => {
      if (sub.id !== id) return sub;
      const updatedValue = Math.max(0, Math.round((sub[field] + delta) * 10) / 10);
      if (field === 'start') {
        return { ...sub, start: Math.min(updatedValue, sub.end - 0.2) };
      } else {
        return { ...sub, end: Math.max(updatedValue, sub.start + 0.2) };
      }
    });
    onSubtitlesChange(updated);
  };

  const handleDeleteSegment = (id: string) => {
    onSubtitlesChange(subtitles.filter((sub) => sub.id !== id));
  };

  const handleAddSegment = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? lastSub.end + 0.2 : currentTime;
    const newEnd = newStart + 2.5;

    const newSub: SubtitleSegment = {
      id: `sub_${Date.now()}`,
      start: Math.round(newStart * 10) / 10,
      end: Math.round(newEnd * 10) / 10,
      text: 'Add your custom caption words here...',
      speaker: 'Speaker 1',
      highlightWords: ['custom'],
    };

    onSubtitlesChange([...subtitles, newSub]);
  };

  const currentYOffset = settings.yOffset ?? (settings.position === 'top' ? 12 : settings.position === 'middle' ? 50 : 82);

  return (
    <div className="space-y-6">
      {/* Enable Toggle & Style Presets */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-5 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Automatic Subtitles & Styling
              </h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Synchronized kinetic word-highlighting & burned-in video export
              </p>
            </div>
          </div>
          <Checkbox
            checked={settings.enabled}
            onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
          />
        </div>

        {settings.enabled && (
          <div className="space-y-5 pt-1">
            {/* Viral Subtitle Style Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Subtitle Style Presets
                </label>
                <span className="text-[10px] text-brand-500 font-medium">Click to preview live</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((p) => {
                  const isSelected = settings.preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const updates: Partial<CaptionSettings> = { preset: p.id };
                        if (p.id === 'boxed') {
                          updates.displayMode = 'boxed-word';
                          updates.highlightColor = settings.highlightColor || '#FACC15';
                          updates.activeWordBgColor = settings.activeWordBgColor || '#FACC15';
                          updates.activeWordTextColor = '#000000';
                        } else if (p.id === 'bounce') {
                          updates.displayMode = 'word-highlight';
                        }
                        onSettingsChange({ ...settings, ...updates });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                          : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : 'var(--bg-surface)',
                        borderColor: isSelected ? undefined : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}>
                          {p.label}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {p.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Mode (Word Highlight / Boxed Word / Single Word / Short Phrase) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Eye className="w-3.5 h-3.5 text-brand-500" />
                <span>Animation & Display Mode</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {displayModes.map((dm) => {
                  const isSelected = (settings.displayMode || 'word-highlight') === dm.id;
                  return (
                    <button
                      key={dm.id}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, displayMode: dm.id })}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-white ring-1 ring-brand-500'
                          : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : 'var(--bg-surface)',
                        borderColor: isSelected ? undefined : 'var(--border)',
                      }}
                    >
                      <span className="font-bold block text-[11px]" style={{ color: isSelected ? undefined : 'var(--text-primary)' }}>
                        {dm.label}
                      </span>
                      <span className="text-[9px] block leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {dm.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography: Font Family, Text Case & Stroke */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Font Family
                </label>
                <select
                  className="w-full border rounded-xl p-2 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  value={settings.fontFamily || 'Montserrat'}
                  onChange={(e) => onSettingsChange({ ...settings, fontFamily: e.target.value })}
                >
                  {fontFamilies.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Text Case
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {textCases.map((tc) => {
                    const isSelected = (settings.textCase || 'uppercase') === tc.id;
                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => onSettingsChange({ ...settings, textCase: tc.id })}
                        className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-white'
                            : 'hover:border-slate-400'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : 'var(--bg-surface)',
                          borderColor: isSelected ? undefined : 'var(--border)',
                          color: isSelected ? undefined : 'var(--text-secondary)',
                        }}
                      >
                        {tc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Outline Stroke
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {outlineWidths.map((ow) => (
                    <button
                      key={ow.id}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, outlineWidth: ow.id })}
                      className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold capitalize transition-all ${
                        (settings.outlineWidth || 'medium') === ow.id
                          ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-white'
                          : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: (settings.outlineWidth || 'medium') === ow.id ? undefined : 'var(--bg-surface)',
                        borderColor: (settings.outlineWidth || 'medium') === ow.id ? undefined : 'var(--border)',
                        color: (settings.outlineWidth || 'medium') === ow.id ? undefined : 'var(--text-secondary)',
                      }}
                    >
                      {ow.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors: Active Spoken Word & Base Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Spoken Word Highlight Color</span>
                  <span className="font-mono text-[10px] text-brand-500">{settings.highlightColor}</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, highlightColor: color, activeWordBgColor: color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform shadow-sm ${
                        settings.highlightColor === color ? 'border-brand-500 scale-125' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Highlight color: ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Base Text Color</span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{settings.textColor || '#FFFFFF'}</span>
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { hex: '#FFFFFF', label: 'White' },
                    { hex: '#E2E8F0', label: 'Light Slate' },
                    { hex: '#94A3B8', label: 'Muted Slate' },
                    { hex: '#0F172A', label: 'Charcoal' },
                  ].map((tc) => (
                    <button
                      key={tc.hex}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, textColor: tc.hex })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        (settings.textColor || '#FFFFFF') === tc.hex
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-white ring-1 ring-brand-500'
                          : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: (settings.textColor || '#FFFFFF') === tc.hex ? undefined : 'var(--bg-surface)',
                        borderColor: (settings.textColor || '#FFFFFF') === tc.hex ? undefined : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: tc.hex }} />
                      <span>{tc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Position, Y-Offset Slider and Font Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Position Preset
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['bottom', 'middle', 'top'] as CaptionPosition[]).map((pos) => {
                    const isSelected = settings.position === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          const targetY = pos === 'top' ? 12 : pos === 'middle' ? 50 : 82;
                          onSettingsChange({ ...settings, position: pos, yOffset: targetY });
                        }}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold capitalize transition-all ${
                          isSelected
                            ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-white'
                            : 'hover:border-slate-400'
                        }`}
                        style={{
                          backgroundColor: isSelected ? undefined : 'var(--bg-surface)',
                          borderColor: isSelected ? undefined : 'var(--border)',
                          color: isSelected ? undefined : 'var(--text-secondary)',
                        }}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <MoveVertical className="w-3 h-3 text-brand-500" />
                    <span>Vertical Y-Offset</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-brand-500">{currentYOffset}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="1"
                  value={currentYOffset}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    let pos: CaptionPosition = 'custom';
                    if (val <= 25) pos = 'top';
                    else if (val >= 70) pos = 'bottom';
                    else if (val >= 40 && val <= 60) pos = 'middle';
                    onSettingsChange({ ...settings, yOffset: val, position: pos });
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  style={{ backgroundColor: 'var(--bg-surface-2)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Font Size
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, fontSize: sz })}
                      className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold uppercase transition-all ${
                        settings.fontSize === sz
                          ? 'bg-brand-500/20 border-brand-500 text-brand-600 dark:text-white'
                          : 'hover:border-slate-400'
                      }`}
                      style={{
                        backgroundColor: settings.fontSize === sz ? undefined : 'var(--bg-surface)',
                        borderColor: settings.fontSize === sz ? undefined : 'var(--border)',
                        color: settings.fontSize === sz ? undefined : 'var(--text-secondary)',
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Container Opacity & Speaker Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Background Pill Opacity
                  </label>
                  <span className="text-[11px] font-mono text-brand-500">
                    {Math.round((settings.backgroundOpacity ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round((settings.backgroundOpacity ?? 0.8) * 100)}
                  onChange={(e) => {
                    onSettingsChange({
                      ...settings,
                      backgroundOpacity: parseInt(e.target.value, 10) / 100,
                    });
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  style={{ backgroundColor: 'var(--bg-surface-2)' }}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="font-bold text-xs block" style={{ color: 'var(--text-primary)' }}>Speaker Labels</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Show [Speaker 1 / 2] badges</span>
                </div>
                <Checkbox
                  checked={!!settings.speakerLabels}
                  onChange={(e) => onSettingsChange({ ...settings, speakerLabels: e.target.checked })}
                />
              </div>
            </div>

            {/* Language & Opening Hook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Globe className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Spoken Language</span>
                </label>
                <select
                  className="w-full border rounded-xl p-2 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  value={settings.language || 'auto'}
                  onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Opening Title Hook (First 3s)"
                  value={settings.openingTitle || ''}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      openingTitle: e.target.value,
                      showOpeningTitle: !!e.target.value,
                    })
                  }
                  placeholder="e.g. Stop Scrolling!"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Segments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            <Type className="w-4 h-4 text-brand-500" />
            <span>Synchronized Subtitles ({subtitles.length} lines)</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSegment}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Line
          </Button>
        </div>

        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {subtitles.map((sub, idx) => {
            const isActive = currentTime >= sub.start && currentTime <= sub.end;
            return (
              <div
                key={sub.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  isActive
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                    : 'hover:border-slate-400'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: isActive ? undefined : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  {/* Jump To Player Timestamp */}
                  <button
                    type="button"
                    onClick={() => onSeek(sub.start)}
                    className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-brand-600 dark:text-brand-300 hover:text-brand-500 transition-colors px-2.5 py-0.5 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-surface-2)',
                      borderColor: 'var(--border)',
                    }}
                    title="Click to jump video player to this subtitle line"
                  >
                    <Clock className="w-3 h-3 text-brand-500" />
                    <span>
                      {formatDurationPrecise(sub.start)} – {formatDurationPrecise(sub.end)}
                    </span>
                  </button>

                  {/* Speaker Label editor & delete */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px]"
                      style={{
                        backgroundColor: 'var(--bg-surface-2)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <User className="w-3 h-3 text-cyan-500" />
                      <input
                        type="text"
                        className="w-16 bg-transparent text-[10px] text-cyan-600 dark:text-cyan-300 font-bold focus:outline-none"
                        value={sub.speaker || 'Speaker 1'}
                        onChange={(e) => handleUpdateSpeaker(sub.id, e.target.value)}
                        placeholder="Speaker"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(sub.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete segment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle text area */}
                <textarea
                  rows={2}
                  className="w-full border rounded-xl p-2.5 text-xs transition-colors focus:outline-none focus:border-brand-500"
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  value={sub.text}
                  onChange={(e) => handleUpdateText(sub.id, e.target.value)}
                  placeholder="Enter caption text..."
                />

                {/* Micro-timing adjustment steppers */}
                <div className="flex items-center justify-between text-[10px] pt-2 border-t mt-2" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Start:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustTiming(sub.id, 'start', -0.1)}
                      className="px-2 py-0.5 rounded-md border hover:border-slate-400 hover:text-brand-500 transition-colors font-mono font-bold"
                      style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      title="Start 0.1s earlier"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustTiming(sub.id, 'start', 0.1)}
                      className="px-2 py-0.5 rounded-md border hover:border-slate-400 hover:text-brand-500 transition-colors font-mono font-bold"
                      style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      title="Start 0.1s later"
                    >
                      +0.1s
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">End:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustTiming(sub.id, 'end', -0.1)}
                      className="px-2 py-0.5 rounded-md border hover:border-slate-400 hover:text-brand-500 transition-colors font-mono font-bold"
                      style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      title="End 0.1s earlier"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustTiming(sub.id, 'end', 0.1)}
                      className="px-2 py-0.5 rounded-md border hover:border-slate-400 hover:text-brand-500 transition-colors font-mono font-bold"
                      style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      title="End 0.1s later"
                    >
                      +0.1s
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
