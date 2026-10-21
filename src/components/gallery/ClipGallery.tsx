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
} from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Control Bar: Search, Sort, Filter, Views */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-900 border border-slate-800">
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
          <div className="flex items-center bg-dark-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'all' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({project.clips.length})
            </button>
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'selected' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Selected ({selectedCount})
            </button>
            <button
              onClick={() => setFilterMode('high_viral')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'high_viral' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Viral (90+)
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-dark-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="viralScore">Viral Score</option>
              <option value="time">Timeline Order</option>
              <option value="duration">Clip Duration</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-dark-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-dark-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-dark-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when any clips exist) */}
      {project.clips.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllToggle}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-brand-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span>•</span>
            <span>
              <strong className="text-white">{selectedCount}</strong> of {project.clips.length} selected
            </span>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkExportOpen(true)}
                leftIcon={<Download className="w-3.5 h-3.5 text-brand-400" />}
              >
                Export Selected ({selectedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDeleteSelected}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              >
                Delete Selected
              </Button>
            </div>
          )}
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
