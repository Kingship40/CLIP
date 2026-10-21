import React from 'react';
import { CaptionSettings, SubtitleSegment, CaptionPreset, CaptionPosition } from '../../types';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { Plus, Trash2, Clock, Type, Sparkles } from 'lucide-react';
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
  const presets: { id: CaptionPreset; label: string; desc: string }[] = [
    { id: 'hormozi', label: 'Hormozi Bold', desc: 'Yellow key highlight with dark backing' },
    { id: 'karaoke', label: 'Electric Karaoke', desc: 'Cyan glow with kinetic text stroke' },
    { id: 'minimal', label: 'Minimal Clean', desc: 'Clean translucent pill subtitle' },
    { id: 'neon', label: 'Neon Glow', desc: 'Violet glowing outline for high energy' },
    { id: 'cinematic', label: 'Cinematic Box', desc: 'Sleek letterboxed typography' },
  ];

  const handleUpdateText = (id: string, newText: string) => {
    const updated = subtitles.map((sub) =>
      sub.id === id ? { ...sub, text: newText } : sub
    );
    onSubtitlesChange(updated);
  };

  const handleDeleteSegment = (id: string) => {
    onSubtitlesChange(subtitles.filter((sub) => sub.id !== id));
  };

  const handleAddSegment = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? lastSub.end + 0.2 : currentTime;
    const newEnd = newStart + 3.0;

    const newSub: SubtitleSegment = {
      id: `sub_${Date.now()}`,
      start: Math.round(newStart * 10) / 10,
      end: Math.round(newEnd * 10) / 10,
      text: 'Add your custom caption words here...',
      highlightWords: ['custom'],
    };

    onSubtitlesChange([...subtitles, newSub]);
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle & Style Presets */}
      <div className="p-4 rounded-xl bg-dark-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Dynamic Kinetic Captions
            </h4>
            <p className="text-[11px] text-slate-400">
              Synchronized animated subtitles with viral keyword coloring
            </p>
          </div>
          <Checkbox
            checked={settings.enabled}
            onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Presets */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Preset Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map((p) => {
                  const isSelected = settings.preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, preset: p.id })}
                      className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500 text-white'
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold block">{p.label}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position and Size */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Position
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['bottom', 'middle', 'top'] as CaptionPosition[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, position: pos })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold capitalize ${
                        settings.position === pos
                          ? 'bg-brand-500/20 border-brand-500 text-white'
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Size
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, fontSize: sz })}
                      className={`py-1.5 px-1.5 text-center rounded-lg border text-[11px] font-semibold uppercase ${
                        settings.fontSize === sz
                          ? 'bg-brand-500/20 border-brand-500 text-white'
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Highlight color & opening hook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Keyword Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  {['#F59E0B', '#06B6D4', '#A855F7', '#10B981', '#EC4899', '#3B82F6'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSettingsChange({ ...settings, highlightColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          settings.highlightColor === color
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Opening Title Hook"
                  value={settings.openingTitle || ''}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      openingTitle: e.target.value,
                      showOpeningTitle: !!e.target.value,
                    })
                  }
                  placeholder="e.g. Stop Scrolling! 🛑"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Subtitle Segments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Type className="w-4 h-4 text-brand-400" />
            <span>Subtitle Segments ({subtitles.length})</span>
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

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {subtitles.map((sub, idx) => {
            const isActive = currentTime >= sub.start && currentTime <= sub.end;
            return (
              <div
                key={sub.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isActive
                    ? 'bg-brand-500/10 border-brand-500/60 ring-1 ring-brand-500/30'
                    : 'bg-dark-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    type="button"
                    onClick={() => onSeek(sub.start)}
                    className="flex items-center gap-1 text-[11px] font-mono text-brand-300 hover:text-white transition-colors bg-dark-950 px-2 py-0.5 rounded border border-slate-800"
                    title="Click to jump player to this sentence"
                  >
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {formatDurationPrecise(sub.start)} – {formatDurationPrecise(sub.end)}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(sub.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete segment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  className="w-full bg-dark-950 border border-slate-800/80 rounded-lg p-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                  value={sub.text}
                  onChange={(e) => handleUpdateText(sub.id, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
