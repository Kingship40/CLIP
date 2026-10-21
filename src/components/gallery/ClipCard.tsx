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
        className={`group relative bg-dark-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col ${
          clip.selected
            ? 'border-brand-500/80 shadow-md ring-1 ring-brand-500/50'
            : 'border-slate-800 hover:border-slate-700 hover:shadow-xl'
        }`}
      >
        {/* Thumbnail and Preview Overlay */}
        <div className="relative aspect-[9/16] max-h-72 w-full bg-dark-950 overflow-hidden cursor-pointer" onClick={onPreview}>
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/60 pointer-events-none" />

          {/* Top overlay: Checkbox + Viral Score */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                clip.selected
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-dark-950/70 border border-slate-600 text-transparent hover:border-white'
              }`}
              aria-label={clip.selected ? 'Deselect clip' : 'Select clip'}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              {clip.viralScore}
            </span>
          </div>

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Overlay: Time and Duration */}
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[11px] text-white">
            <span className="bg-black/75 px-2 py-0.5 rounded font-mono">
              {formatDuration(clip.startTime)} – {formatDuration(clip.endTime)}
            </span>
            <span className="bg-brand-500/80 px-2 py-0.5 rounded font-mono font-semibold">
              {formatDuration(clip.duration)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <Badge variant="cyan" size="sm">
                {clip.aspectRatio}
              </Badge>
              {clip.category && (
                <Badge variant="emerald" size="sm">
                  {clip.category.replace(/_/g, ' ')}
                </Badge>
              )}
              {clip.captionSettings.enabled && (
                <Badge variant="purple" size="sm">
                  <Type className="w-2.5 h-2.5 mr-0.5" />
                  {clip.captionSettings.preset}
                </Badge>
              )}
            </div>

            <h4
              className="text-xs sm:text-sm font-semibold text-white line-clamp-2 hover:text-brand-300 transition-colors cursor-pointer"
              onClick={onPreview}
              title={clip.title}
            >
              {clip.title}
            </h4>

            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
              {clip.description}
            </p>
          </div>

          {/* Card Action Footer */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
            <Link to={`/dashboard/clips/${clip.id}`} className="flex-1">
              <button
                type="button"
                className="w-full py-1.5 px-2.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                <span>Edit Clip</span>
              </button>
            </Link>

            <button
              type="button"
              onClick={onDownload}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              title="Download clip / export options"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
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
                  <div className="absolute right-0 bottom-full mb-1 w-36 bg-dark-850 border border-slate-700 rounded-xl shadow-xl py-1 z-30 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRename();
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-dark-750 hover:text-white flex items-center gap-2"
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
                      className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-dark-750 hover:text-white flex items-center gap-2"
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
                      className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
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
      className={`group bg-dark-900 border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${
        clip.selected
          ? 'border-brand-500 shadow-md ring-1 ring-brand-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onSelect}
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          clip.selected
            ? 'bg-brand-500 text-white'
            : 'bg-dark-950 border border-slate-700 text-transparent hover:border-slate-500'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </button>

      {/* Thumbnail */}
      <div
        className="relative w-full sm:w-32 aspect-video rounded-xl bg-dark-950 overflow-hidden shrink-0 cursor-pointer"
        onClick={onPreview}
      >
        <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-dark-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 text-white fill-current" />
        </div>
        <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
          {formatDuration(clip.duration)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
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
          <span className="text-[11px] text-slate-400 font-mono">
            {formatDuration(clip.startTime)} – {formatDuration(clip.endTime)}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-white truncate cursor-pointer hover:text-brand-300" onClick={onPreview}>
          {clip.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{clip.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
        <Link to={`/dashboard/clips/${clip.id}`}>
          <button
            type="button"
            className="py-1.5 px-3 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700/60"
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-400" />
            <span>Edit</span>
          </button>
        </Link>

        <button
          type="button"
          onClick={onDownload}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete clip"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
