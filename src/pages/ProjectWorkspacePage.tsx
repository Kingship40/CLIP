import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { ClipGallery } from '../components/gallery/ClipGallery';
import { ExportDialog } from '../components/editor/ExportDialog';
import { ConfirmDialog } from '../components/common/Dialog';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatDuration, formatDate, formatRelativeTime } from '../utils/formatters';
import {
  ArrowLeft,
  Video,
  Clock,
  Layers,
  Sparkles,
  Download,
  Edit3,
  Copy,
  Trash2,
  Share2,
  Play,
  Film,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject, deleteProject, duplicateProject } = useProjectStore();
  const { addToast } = useToastStore();

  const project = getProject(id || '');

  const [isExportAllOpen, setIsExportAllOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!project) {
    return (
      <EmptyState
        title="Project Not Found"
        description="The clipping project you requested does not exist or may have been deleted."
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    );
  }

  const handleSaveRename = () => {
    if (renameValue.trim()) {
      updateProject(project.id, { name: renameValue.trim() });
      addToast({ title: 'Project Renamed', type: 'success' });
      setIsRenameOpen(false);
    }
  };

  const handleDuplicate = () => {
    const duplicated = duplicateProject(project.id);
    if (duplicated) {
      addToast({ title: 'Project Duplicated', message: `Created "${duplicated.name}"`, type: 'success' });
      navigate(`/dashboard/projects/${duplicated.id}`);
    }
  };

  const handleDelete = () => {
    deleteProject(project.id);
    addToast({ title: 'Project Deleted', type: 'info' });
    navigate('/dashboard/projects');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/projects"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {project.name}
              </h1>
              <Badge variant="emerald" size="sm" className="font-bold">
                Completed
              </Badge>
            </div>
            <p className="text-xs mt-1 font-medium text-[var(--text-secondary)]">
              Source: <strong className="font-bold text-[var(--text-primary)]">{project.sourceVideo.name}</strong> • Created <span className="font-semibold text-[var(--text-primary)]">{formatRelativeTime(project.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Project Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRenameValue(project.name);
              setIsRenameOpen(true);
            }}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Rename
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDuplicate}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Duplicate
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportAllOpen(true)}
            leftIcon={<Download className="w-4 h-4 text-white" />}
          >
            Export Hub
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          />
        </div>
      </div>

      {/* Source Video Overview Banner */}
      <div
        className="p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-28 sm:w-36 aspect-video rounded-xl bg-black overflow-hidden shrink-0 shadow-sm border" style={{ borderColor: 'var(--border)' }}>
            <img
              src={project.sourceVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80'}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.2 rounded text-[9px] font-mono text-white">
              {formatDuration(project.sourceVideo.duration)}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Source Master Summary</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Processed Privately • Source Not Exposed</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-secondary)]">
              <span>Duration: <strong className="font-bold text-[var(--text-primary)]">{formatDuration(project.sourceVideo.duration)}</strong></span>
              <span>Aspect: <strong className="font-bold text-[var(--text-primary)]">{project.config.aspectRatio}</strong></span>
              <span>Content: <strong className="capitalize font-bold text-[var(--text-primary)]">{project.config.contentType}</strong></span>
              <span>Target Duration: <strong className="font-bold text-[var(--text-primary)]">{project.config.targetDuration}s</strong></span>
              <span>Clips: <strong className="text-[#5145DE] dark:text-brand-400 font-extrabold">{project.clips.length}</strong> of <strong className="font-bold text-[var(--text-primary)]">{project.config.clipCount === 'custom' ? project.config.customClipCount : project.config.clipCount} requested</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link to="/dashboard/new">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-500" />}>
              Clip Another Video
            </Button>
          </Link>
        </div>
      </div>

      {/* Generated Clips Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Generated Short Clips</span>
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Click "Edit Clip" on any card to trim timestamps, customize captions, or fine-tune keywords.
            </p>
          </div>
        </div>

        <ClipGallery project={project} />
      </div>

      {/* Export All Dialog */}
      <ExportDialog
        project={project}
        isOpen={isExportAllOpen}
        onClose={() => setIsExportAllOpen(false)}
      />

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Rename Project"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new project name"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRename}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}" and all its ${project.clips.length} generated clips? This action cannot be undone.`}
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
};
