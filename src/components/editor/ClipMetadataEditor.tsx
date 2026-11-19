import React, { useState } from 'react';
import { Clip, AspectRatio } from '../../types';
import { Input } from '../common/Input';
import { AspectRatioSelector } from '../config/AspectRatioSelector';
import { Sparkles, Hash, Plus, X } from 'lucide-react';

export interface ClipMetadataEditorProps {
  clip: Clip;
  onChange: (updates: Partial<Clip>) => void;
}

export const ClipMetadataEditor: React.FC<ClipMetadataEditorProps> = ({ clip, onChange }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!newTag.trim()) return;

    let clean = newTag.trim();
    if (!clean.startsWith('#')) clean = `#${clean}`;

    if (!clip.hashtags.includes(clean)) {
      onChange({ hashtags: [...clip.hashtags, clean] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange({ hashtags: clip.hashtags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Viral Hook Insight Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-transparent border border-amber-500/30 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>AI Viral Retention Score: {clip.viralScore}/100</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">High Engagement</span>
        </div>
        <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{clip.hookSummary}</p>
      </div>

      {/* Title */}
      <Input
        label="Clip Title"
        value={clip.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Enter hook title"
      />

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          Caption / Post Description
        </label>
        <textarea
          rows={3}
          value={clip.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          placeholder="Write video description for TikTok, Reels, or YouTube Shorts..."
        />
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
          Target Framing
        </label>
        <AspectRatioSelector
          value={clip.aspectRatio}
          onChange={(ratio) => onChange({ aspectRatio: ratio })}
        />
      </div>

      {/* Suggested Hashtags */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
          Hashtags & Distribution Keywords
        </label>

        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {clip.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-[var(--bg-surface-2)] dark:bg-dark-900 border border-[var(--border)] dark:border-slate-700 text-[var(--text-primary)] px-2.5 py-1 rounded-lg"
            >
              <Hash className="w-3 h-3 text-brand-500 dark:text-brand-400" />
              <span>{tag.replace('#', '')}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-500 dark:hover:text-rose-400 ml-0.5 p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add hashtag (e.g. #marketing)..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-2 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-elevated)] dark:bg-dark-850 dark:hover:bg-dark-800 border border-[var(--border)] dark:border-slate-700 text-[var(--text-primary)] dark:text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
