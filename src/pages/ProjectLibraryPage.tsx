import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { Project } from '../types';
import { formatDuration, formatDate, formatRelativeTime } from '../utils/formatters';
import {
  FolderKanban,
  Search,
  Plus,
  Play,
  Layers,
  Clock,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/Dialog';
import { Modal } from '../components/common/Modal';

export const ProjectLibraryPage: React.FC = () => {
  const { projects, deleteProject, duplicateProject, renameProject } = useProjectStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'clips' | 'name'>('recent');

  // Modals state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sourceVideo.name.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'clips') {
        return b.clips.length - a.clips.length;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortBy]);

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      addToast({ title: 'Project Deleted', type: 'info' });
      setProjectToDelete(null);
    }
  };

  const handleSaveRename = () => {
    if (projectToRename && renameValue.trim()) {
      renameProject(projectToRename.id, renameValue.trim());
      addToast({ title: 'Project Renamed', type: 'success' });
      setProjectToRename(null);
    }
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateProject(id);
    if (dup) {
      addToast({ title: 'Project Duplicated', message: `Created copy "${dup.name}"`, type: 'success' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FolderKanban className="w-6 h-6 text-brand-500" />
            <span>Project Library</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage your long-form video projects, extracted clips, and export archives.
          </p>
        </div>

        <Link to="/dashboard/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4 text-white" />}>
            New Project
          </Button>
        </Link>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search projects by title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div
            className="flex items-center p-1 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            {(['all', 'completed', 'processing'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs focus:outline-none cursor-pointer"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <option value="recent">Recently Created</option>
              <option value="clips">Most Clips</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match your search"
          description="Try adjusting your filters, or start a new clipping project with an uploaded video."
          actionLabel="Create Project"
          onAction={() => navigate('/dashboard/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="border rounded-2xl overflow-hidden hover:shadow-xl group flex flex-col justify-between transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Thumbnail Container */}
              <div
                className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              >
                <img
                  src={project.sourceVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80'}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  {formatDuration(project.sourceVideo.duration)}
                </span>

                <span className="absolute top-2 left-2">
                  <Badge
                    variant={project.status === 'completed' ? 'emerald' : 'brand'}
                    size="sm"
                  >
                    {project.status === 'completed' ? 'Ready' : project.status}
                  </Badge>
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-bold text-base truncate group-hover:text-brand-500 transition-colors cursor-pointer flex-1"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                      title={project.name}
                    >
                      {project.name}
                    </h3>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === project.id ? null : project.id)
                        }
                        className="p-1 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === project.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div
                            className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl py-1 z-30 text-xs border"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setProjectToRename(project);
                                setRenameValue(project.name);
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
                                setActiveMenuId(null);
                                handleDuplicate(project.id);
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
                                setActiveMenuId(null);
                                setProjectToDelete(project);
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

                  <p className="text-xs line-clamp-1 mt-1" style={{ color: 'var(--text-muted)' }}>
                    File: {project.sourceVideo.name}
                  </p>

                  <div className="flex items-center gap-4 text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-500" />
                      <strong style={{ color: 'var(--text-primary)' }}>{project.clips.length}</strong> short clips
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(project.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Framing: <strong style={{ color: 'var(--text-secondary)' }}>{project.config.aspectRatio}</strong>
                  </span>

                  <Link to={`/dashboard/projects/${project.id}`}>
                    <Button variant="secondary" size="sm">
                      Open Project
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={!!projectToRename}
        onClose={() => setProjectToRename(null)}
        title="Rename Project"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Project Title"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new project title"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setProjectToRename(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRename}>
              Save Name
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${projectToDelete?.name}"? All ${projectToDelete?.clips.length || 0} clips will be removed.`}
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
};
