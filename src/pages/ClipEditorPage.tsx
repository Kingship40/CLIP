import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clip, Project } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { VideoPlayer } from '../components/editor/VideoPlayer';
import { ClipTimeline } from '../components/editor/ClipTimeline';
import { CaptionEditorPanel } from '../components/editor/CaptionEditorPanel';
import { ClipMetadataEditor } from '../components/editor/ClipMetadataEditor';
import { ExportDialog } from '../components/editor/ExportDialog';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Download,
  Sliders,
  Type,
  FileText,
  Undo2,
  Sparkles,
} from 'lucide-react';

export const ClipEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateClip } = useProjectStore();
  const { addToast } = useToastStore();

  // Find the clip and its parent project
  let foundProject: Project | undefined;
  let foundClip: Clip | undefined;

  for (const p of projects) {
    const c = p.clips.find((clip) => clip.id === id);
    if (c) {
      foundProject = p;
      foundClip = c;
      break;
    }
  }

  // Local working copy of clip state
  const [clip, setClip] = useState<Clip | null>(foundClip || null);
  const [initialClipState, setInitialClipState] = useState<Clip | null>(foundClip || null);
  const [history, setHistory] = useState<Clip[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(foundClip?.startTime || 0);
  const [activeTab, setActiveTab] = useState<'captions' | 'metadata'>('captions');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (foundClip) {
      setClip(foundClip);
      setInitialClipState(foundClip);
      setCurrentTime(foundClip.startTime);
    }
  }, [foundClip]);

  if (!clip || !foundProject) {
    return (
      <EmptyState
        title="Clip Not Found"
        description="The clip you are trying to edit could not be found."
        actionLabel="Back to Projects"
        onAction={() => navigate('/dashboard/projects')}
      />
    );
  }

  const handleUpdate = (updates: Partial<Clip>) => {
    setHistory((prev) => [...prev, clip]);
    setClip((prev) => (prev ? { ...prev, ...updates } : null));
    setIsDirty(true);
  };

  const handleTimelineRangeChange = (start: number, end: number) => {
    const duration = Math.round((end - start) * 10) / 10;
    handleUpdate({
      startTime: start,
      endTime: end,
      duration,
    });
    // If current playhead is outside the new bounds, clamp it
    if (currentTime < start || currentTime > end) {
      setCurrentTime(start);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setClip(previous);
    addToast({ title: 'Undo successful', type: 'info' });
  };

  const handleReset = () => {
    if (initialClipState) {
      setClip(initialClipState);
      setCurrentTime(initialClipState.startTime);
      setIsDirty(false);
      addToast({ title: 'Edits reset to original', type: 'info' });
    }
  };

  const handleSave = () => {
    if (clip && foundProject) {
      updateClip(foundProject.id, clip.id, clip);
      setIsDirty(false);
      addToast({
        title: 'Clip Changes Saved!',
        message: 'All timestamp, subtitle, and framing adjustments updated.',
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/projects/${foundProject.id}`}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-muted)' }}
            title="Return to project workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-md" style={{ color: 'var(--text-primary)' }}>
                {clip.title}
              </h1>
              {isDirty && (
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Unsaved Edits
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Project: {foundProject.name} • Master Video: {foundProject.sourceVideo.name}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              leftIcon={<Undo2 className="w-4 h-4" />}
            >
              Undo
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            leftIcon={<Download className="w-4 h-4 text-brand-500" />}
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Video Player + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): HTML5 Video Player + Dual-Handle Interactive Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="border rounded-2xl p-4 sm:p-6 flex flex-col items-center shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <VideoPlayer
              clip={clip}
              currentTime={currentTime}
              onTimeUpdate={(t) => setCurrentTime(t)}
              aspectRatio={clip.aspectRatio}
            />
          </div>

          {/* Interactive Dual-Handle Timeline */}
          <ClipTimeline
            totalDuration={foundProject.sourceVideo.duration || 180}
            startTime={clip.startTime}
            endTime={clip.endTime}
            currentTime={currentTime}
            onRangeChange={handleTimelineRangeChange}
            onSeek={(t) => setCurrentTime(t)}
            onResetRange={() => {
              if (initialClipState) {
                handleTimelineRangeChange(initialClipState.startTime, initialClipState.endTime);
              }
            }}
          />
        </div>

        {/* Right Column (5/12): Tabs for Subtitles & Clip Metadata */}
        <div
          className="lg:col-span-5 border rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Editor Tabs */}
          <div className="flex border-b text-xs font-semibold" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('captions')}
              className={`pb-3 pr-4 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                activeTab === 'captions'
                  ? 'border-brand-500 text-brand-600 dark:text-white'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Type className="w-4 h-4 text-brand-500" />
              <span>Captions & Styling</span>
            </button>

            <button
              onClick={() => setActiveTab('metadata')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                activeTab === 'metadata'
                  ? 'border-brand-500 text-brand-600 dark:text-white'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>Title, Hashtags & Aspect</span>
            </button>
          </div>

          {/* Tab 1: Captions */}
          {activeTab === 'captions' && (
            <CaptionEditorPanel
              settings={clip.captionSettings}
              subtitles={clip.subtitles}
              currentTime={currentTime}
              onSettingsChange={(newSettings) => handleUpdate({ captionSettings: newSettings })}
              onSubtitlesChange={(newSubtitles) => handleUpdate({ subtitles: newSubtitles })}
              onSeek={(t) => setCurrentTime(t)}
            />
          )}

          {/* Tab 2: Metadata */}
          {activeTab === 'metadata' && (
            <ClipMetadataEditor
              clip={clip}
              onChange={(updates) => handleUpdate(updates)}
            />
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        clip={clip}
        project={foundProject}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
