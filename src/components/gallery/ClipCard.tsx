import React, { useState } from 'react';
import { Clip } from '../../types';
import { formatDuration } from '../../utils/formatters';
import {
  Play,
  Edit3,
  Download,
  MoreVertical,
  Copy,
  Trash2,
  Sparkles,
  Type,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';

export interface ClipCardProps {
  clip: Clip;
  viewMode?: 'grid' | 'list';
  onSelect: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  viewMode = 'grid',
  onSelect,
  onPreview,
  onDownload,
  onDuplicate,
  onDelete,
  onRename,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Grid Layout
  if (viewMode === 'grid') {
    return (
      <div
        className={`group relative border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col shadow-sm ${
          clip.selected
            ? 'border-brand-500 shadow-md ring-2 ring-brand-500/30'
            : 'hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        style={{
          backgroundColor: clip.selected ? 'var(--bg-selected)' : 'var(--bg-surface)',
          borderColor: clip.selected ? undefined : 'var(--border)',
        }}
      >
        {/* Thumbnail and Preview Overlay */}
        <div className="relative aspect-[9/16] max-h-72 w-full bg-black overflow-hidden cursor-pointer" onClick={onPreview}>
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

          {/* Top overlay: Checkbox + Viral Score */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                clip.selected
                  ? 'bg-brand-600 text-white shadow-md ring-2 ring-white/80'
                  : 'bg-white/90 border border-slate-300 dark:bg-black/70 dark:border-slate-400 text-transparent hover:border-brand-500 hover:scale-105'
              }`}
              aria-label={clip.selected ? 'Deselect clip' : 'Select clip'}
            >
              <Check className="w-3.5 h-3.5 stroke-[3] text-brand-600 dark:text-white" />
            </button>

            <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-amber-300 border border-amber-500/40 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{clip.viralScore}</span>
            </span>
          </div>

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Overlay: Time and Duration */}
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[11px] text-white">
            <span className="bg-black/75 px-2 py-0.5 rounded font-mono font-medium">
              {formatDuration(clip.startTime)} – {formatDuration(clip.endTime)}
            </span>
            <span className="bg-brand-600 px-2 py-0.5 rounded font-mono font-bold shadow-sm">
              {formatDuration(clip.duration)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <Badge variant="cyan" size="sm">
                {clip.aspectRatio}
              </Badge>
              {clip.category && (
                <Badge variant="emerald" size="sm">
                  {clip.category.replace(/_/g, ' ')}
                </Badge>
              )}
              {clip.subtitleProcessingStatus === 'completed' || clip.subtitledVideoUrl ? (
                <Badge variant="emerald" size="sm">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
                  Burned Captions
                </Badge>
              ) : clip.subtitleProcessingStatus === 'in_progress' || clip.subtitleProcessingStatus === 'in_queue' ? (
                <Badge variant="amber" size="sm">
                  <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin text-amber-600" />
                  Rendering Captions...
                </Badge>
              ) : clip.subtitleProcessingStatus === 'failed' ? (
                <Badge variant="danger" size="sm" title={clip.subtitleProcessingError}>
                  <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                  Subtitles Failed
                </Badge>
              ) : clip.captionSettings.enabled ? (
                <Badge variant="purple" size="sm">
                  <Type className="w-2.5 h-2.5 mr-0.5" />
                  {clip.captionSettings.preset}
                </Badge>
              ) : null}
            </div>

            <h4
              className="text-xs sm:text-sm font-bold line-clamp-2 hover:text-[#5145DE] transition-colors cursor-pointer leading-snug text-[var(--text-primary)]"
              onClick={onPreview}
              title={clip.title}
            >
              {clip.title}
            </h4>

            <p className="text-[11px] line-clamp-2 mt-1 leading-relaxed font-medium text-[var(--text-secondary)]">
              {clip.description}
            </p>
          </div>

          {/* Card Action Footer */}
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between gap-1.5 border-[var(--border)]">
            <Link to={`/dashboard/clips/${clip.id}`} className="flex-1">
              <button
                type="button"
                className="w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border shadow-sm hover:border-brand-300 hover:text-brand-700 hover:bg-[#EAE8FF] dark:hover:bg-brand-950/40 dark:hover:text-brand-300 text-[var(--text-primary)] bg-[var(--bg-surface-2)] border-[var(--border)]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#5145DE] dark:text-brand-400" />
                <span>Edit Clip</span>
              </button>
            </Link>

            <button
              type="button"
              onClick={onDownload}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
              style={{ color: 'var(--text-secondary)' }}
              title="Download clip / export options"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div
                    className="absolute right-0 bottom-full mb-1 w-36 rounded-xl shadow-xl py-1 z-30 text-xs border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRename();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Rename</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDuplicate();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full px-3 py-1.5 text-left text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List Layout
  return (
    <div
      className={`group border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${
        clip.selected
          ? 'border-brand-500 shadow-md ring-1 ring-brand-500/50'
          : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: clip.selected ? undefined : 'var(--border)',
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onSelect}
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
          clip.selected
            ? 'bg-brand-600 text-white shadow-md'
            : 'border text-transparent hover:border-brand-500 hover:scale-105'
        }`}
        style={{
          backgroundColor: clip.selected ? undefined : 'var(--bg-elevated)',
          borderColor: clip.selected ? undefined : 'var(--border)',
        }}
      >
        <Check className="w-3.5 h-3.5 stroke-[3] text-brand-600 dark:text-white" />
      </button>

      {/* Thumbnail */}
      <div
        className="relative w-full sm:w-32 aspect-video rounded-xl bg-black overflow-hidden shrink-0 cursor-pointer shadow-sm"
        onClick={onPreview}
      >
        <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 text-white fill-current" />
        </div>
        <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white font-medium">
          {formatDuration(clip.duration)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
            <Sparkles className="w-3 h-3" />
            {clip.viralScore} Hook Score
          </span>
          <Badge variant="cyan" size="sm">
            {clip.aspectRatio}
          </Badge>
          {clip.category && (
            <Badge variant="emerald" size="sm">
              {clip.category.replace(/_/g, ' ')}
            </Badge>
          )}
          {clip.subtitleProcessingStatus === 'completed' || clip.subtitledVideoUrl ? (
            <Badge variant="emerald" size="sm">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600 dark:text-emerald-400" />
              Burned Captions
            </Badge>
          ) : clip.subtitleProcessingStatus === 'in_progress' || clip.subtitleProcessingStatus === 'in_queue' ? (
            <Badge variant="amber" size="sm">
              <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin text-amber-600" />
              Rendering Captions...
            </Badge>
          ) : null}
        </div>

        <h4
          className="text-sm font-bold truncate cursor-pointer hover:text-[#5145DE] transition-colors text-[var(--text-primary)]"
          onClick={onPreview}
        >
          {clip.title}
        </h4>
        <p className="text-xs line-clamp-1 mt-0.5 font-medium text-[var(--text-secondary)]">{clip.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
        <Link to={`/dashboard/clips/${clip.id}`}>
          <button
            type="button"
            className="py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border shadow-sm transition-all hover:bg-[#EAE8FF] hover:text-brand-700 hover:border-brand-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 text-[var(--text-primary)] bg-[var(--bg-surface-2)] border-[var(--border)]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#5145DE] dark:text-brand-400" />
            <span>Edit</span>
          </button>
        </Link>

        <button
          type="button"
          onClick={onDownload}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
          style={{ color: 'var(--text-secondary)' }}
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-lg transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
          title="Delete clip"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
