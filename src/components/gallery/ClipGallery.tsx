import React, { useState, useMemo } from 'react';
import { Clip, Project } from '../../types';
import { ClipCard } from './ClipCard';
import { ClipPreviewModal } from './ClipPreviewModal';
import { ExportDialog } from '../editor/ExportDialog';
import { ConfirmDialog } from '../common/Dialog';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { useProjectStore } from '../../store/useProjectStore';
import { useToastStore } from '../../store/useToastStore';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Download,
  Trash2,
  Sparkles,
  ArrowUpDown,
  Archive,
  Loader2,
} from 'lucide-react';
import {
  downloadAllProjectClips,
  getEligibleCompletedClips,
  DownloadAllProgress,
} from '../../services/downloadAllService';

export interface ClipGalleryProps {
  project: Project;
}

export const ClipGallery: React.FC<ClipGalleryProps> = ({ project }) => {
  const {
    updateClip,
    deleteClip,
    toggleClipSelection,
    selectAllClips,
    duplicateClip,
  } = useProjectStore();
  const { addToast } = useToastStore();

  // Local UI filters & view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'viralScore' | 'duration' | 'title' | 'time'>('viralScore');
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'high_viral'>('all');

  // Modals state
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const [exportClip, setExportClip] = useState<Clip | null>(null);
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<Clip | null>(null);
  const [clipToRename, setClipToRename] = useState<Clip | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Download All state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<DownloadAllProgress | null>(null);

  // Eligible completed clips for Download All
  const { eligibleClips, inProgressCount, failedCount } = useMemo(() => {
    return getEligibleCompletedClips(project);
  }, [project]);

  // Filter & Sort computation
  const filteredClips = useMemo(() => {
    let result = [...project.clips];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.hashtags.some((h) => h.toLowerCase().includes(q))
      );
    }

    // Filter mode
    if (filterMode === 'selected') {
      result = result.filter((c) => c.selected);
    } else if (filterMode === 'high_viral') {
      result = result.filter((c) => c.viralScore >= 90);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'viralScore') return b.viralScore - a.viralScore;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'time') return a.startTime - b.startTime;
      return 0;
    });

    return result;
  }, [project.clips, searchQuery, filterMode, sortBy]);

  const selectedCount = project.clips.filter((c) => c.selected).length;
  const allSelected = project.clips.length > 0 && selectedCount === project.clips.length;

  const handleSelectAllToggle = () => {
    selectAllClips(project.id, !allSelected);
  };

  const handleConfirmDelete = () => {
    if (clipToDelete) {
      deleteClip(project.id, clipToDelete.id);
      addToast({ title: 'Clip deleted', type: 'info' });
      setClipToDelete(null);
    }
  };

  const handleSaveRename = () => {
    if (clipToRename && renameValue.trim()) {
      updateClip(project.id, clipToRename.id, { title: renameValue.trim() });
      addToast({ title: 'Clip renamed successfully', type: 'success' });
      setClipToRename(null);
    }
  };

  const handleDuplicate = (clip: Clip) => {
    const dup = duplicateClip(project.id, clip.id);
    if (dup) {
      addToast({ title: 'Clip duplicated', message: 'Created copy of clip segment metadata', type: 'success' });
    }
  };

  const handleBulkDeleteSelected = () => {
    const selected = project.clips.filter((c) => c.selected);
    if (selected.length === 0) return;
    selected.forEach((c) => deleteClip(project.id, c.id));
    addToast({ title: `${selected.length} clips deleted`, type: 'info' });
  };

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    if (eligibleClips.length === 0) {
      if (inProgressCount > 0) {
        addToast({
          title: 'Clips Still Processing',
          message: `${inProgressCount} clip${inProgressCount > 1 ? 's are' : ' is'} currently being processed. Please wait a moment.`,
          type: 'info',
        });
      } else {
        addToast({
          title: 'No Completed Clips',
          message: failedCount > 0
            ? 'All generated clips in this project encountered an error and cannot be packaged.'
            : 'There are no completed clips available to download in this project.',
          type: 'warning',
        });
      }
      return;
    }

    setIsDownloadingAll(true);
    setDownloadAllProgress({
      stage: 'preparing',
      progress: 5,
      message: `Preparing ${eligibleClips.length} clips for ZIP archive...`,
      totalClips: eligibleClips.length,
      currentClip: 0,
    });

    if (inProgressCount > 0) {
      addToast({
        title: 'Downloading Available Clips',
        message: `Packaging ${eligibleClips.length} completed clips (${inProgressCount} clip${inProgressCount > 1 ? 's' : ''} still processing).`,
        type: 'info',
      });
    }

    try {
      const result = await downloadAllProjectClips(project, (prog) => {
        setDownloadAllProgress(prog);
      });

      if (result.success) {
        addToast({
          title: 'All Clips Downloaded!',
          message: `Saved ${result.filename} (${result.clipCount} clips packaged with README manifest).`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Download Failed',
          message: result.error || 'Failed to generate ZIP archive.',
          type: 'error',
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Download Error',
        message: err.message || 'Error occurred while creating ZIP package.',
        type: 'error',
      });
    } finally {
      setIsDownloadingAll(false);
      setTimeout(() => setDownloadAllProgress(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search, Sort, Filter, Views */}
      <div
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Search Input */}
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search clips, hooks, hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div
            className="flex items-center p-1 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              All ({project.clips.length})
            </button>
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'selected'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              Selected ({selectedCount})
            </button>
            <button
              onClick={() => setFilterMode('high_viral')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'high_viral'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              Top Viral (90+)
            </button>
          </div>

          {/* Sort Selector */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              <option value="viralScore">Viral Score</option>
              <option value="time">Timeline Order</option>
              <option value="duration">Clip Duration</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div
            className="flex items-center p-1 rounded-xl border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#EAE8FF] text-brand-700 font-bold dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#EAE8FF] text-brand-700 font-bold dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Download All Packaging Progress Banner */}
      {isDownloadingAll && downloadAllProgress && (
        <div
          className="p-4 rounded-2xl border shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
              <span>{downloadAllProgress.message}</span>
            </div>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
              {downloadAllProgress.progress}%
            </span>
          </div>
          <div className="w-full bg-[var(--bg-surface-2)] rounded-full h-2 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${downloadAllProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Generated Short Clips Toolbar: Selection, Download All, Export Selected, Delete Selected */}
      {project.clips.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllToggle}
              className="flex items-center gap-1.5 font-medium transition-colors hover:text-brand-600"
              style={{ color: 'var(--text-secondary)' }}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              ) : (
                <Square className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCount}</strong> of {project.clips.length} selected
            </span>
          </div>

          {/* Differentiated Toolbar Actions: Download All, Export Selected, Delete Selected */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* DOWNLOAD ALL BUTTON (Primary action, available whenever clips exist) */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || eligibleClips.length === 0}
              leftIcon={
                isDownloadingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-white" />
                )
              }
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
              title={
                eligibleClips.length === 0
                  ? 'No completed clips available to download'
                  : `Download all ${eligibleClips.length} clips packaged into a single ZIP archive`
              }
            >
              {isDownloadingAll
                ? `Preparing ZIP (${downloadAllProgress?.progress || 0}%)...`
                : `Download All (${eligibleClips.length})`}
            </Button>

            {/* EXPORT SELECTED BUTTON */}
            {selectedCount > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkExportOpen(true)}
                  leftIcon={<Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                >
                  Export Selected ({selectedCount})
                </Button>

                {/* DELETE SELECTED BUTTON */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDeleteSelected}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  Delete Selected
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Clip Cards Display */}
      {filteredClips.length === 0 ? (
        <EmptyState
          title="No clips match your filter"
          description="Try adjusting your search query, clearing filters, or generating new clips."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setFilterMode('all');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              viewMode="grid"
              onSelect={() => toggleClipSelection(project.id, clip.id)}
              onPreview={() => setPreviewClip(clip)}
              onDownload={() => setExportClip(clip)}
              onDuplicate={() => handleDuplicate(clip)}
              onDelete={() => setClipToDelete(clip)}
              onRename={() => {
                setClipToRename(clip);
                setRenameValue(clip.title);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              viewMode="list"
              onSelect={() => toggleClipSelection(project.id, clip.id)}
              onPreview={() => setPreviewClip(clip)}
              onDownload={() => setExportClip(clip)}
              onDuplicate={() => handleDuplicate(clip)}
              onDelete={() => setClipToDelete(clip)}
              onRename={() => {
                setClipToRename(clip);
                setRenameValue(clip.title);
              }}
            />
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      <ClipPreviewModal
        clip={previewClip}
        isOpen={!!previewClip}
        onClose={() => setPreviewClip(null)}
      />

      {/* Individual Clip Export Dialog */}
      <ExportDialog
        clip={exportClip}
        project={project}
        isOpen={!!exportClip}
        onClose={() => setExportClip(null)}
      />

      {/* Bulk Export Dialog */}
      <ExportDialog
        project={project}
        isOpen={isBulkExportOpen}
        onClose={() => setIsBulkExportOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!clipToDelete}
        onClose={() => setClipToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Clip?"
        message={`Are you sure you want to delete "${clipToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Clip"
        variant="danger"
      />

      {/* Rename Modal */}
      <Modal
        isOpen={!!clipToRename}
        onClose={() => setClipToRename(null)}
        title="Rename Clip"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Clip Title"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new clip title"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setClipToRename(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRename}>
              Save Name
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
