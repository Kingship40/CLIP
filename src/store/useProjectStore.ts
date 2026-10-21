import { create } from 'zustand';
import { Project, Clip, ProcessingJob } from '../types';
import { getStoredProjects, saveStoredProjects, SEED_PROJECTS } from '../utils/storage';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  currentJob: ProcessingJob | null;

  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  renameProject: (id: string, newName: string) => void;
  getProject: (id: string) => Project | undefined;

  // Clips actions
  updateClip: (projectId: string, clipId: string, updates: Partial<Clip>) => void;
  deleteClip: (projectId: string, clipId: string) => void;
  toggleClipSelection: (projectId: string, clipId: string) => void;
  selectAllClips: (projectId: string, selected: boolean) => void;
  duplicateClip: (projectId: string, clipId: string) => Clip | null;

  // Job actions
  setCurrentJob: (job: ProcessingJob | null) => void;
  updateCurrentJob: (updates: Partial<ProcessingJob>) => void;

  resetProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: getStoredProjects(),
  activeProjectId: null,
  currentJob: null,

  addProject: (project) => {
    set((state) => {
      const updated = [project, ...state.projects];
      saveStoredProjects(updated);
      return { projects: updated };
    });
  },

  updateProject: (id, updates) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      saveStoredProjects(updated);
      return { projects: updated };
    });
  },

  deleteProject: (id) => {
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveStoredProjects(updated);
      return { projects: updated };
    });
  },

  duplicateProject: (id) => {
    const existing = get().projects.find((p) => p.id === id);
    if (!existing) return null;

    const newId = `proj_${Date.now()}_copy`;
    const duplicated: Project = {
      ...existing,
      id: newId,
      name: `${existing.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clips: existing.clips.map((c, i) => ({
        ...c,
        id: `clip_${Date.now()}_${i + 1}`,
        projectId: newId,
        createdAt: new Date().toISOString(),
      })),
    };

    set((state) => {
      const updated = [duplicated, ...state.projects];
      saveStoredProjects(updated);
      return { projects: updated };
    });

    return duplicated;
  },

  renameProject: (id, newName) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, name: newName.trim(), updatedAt: new Date().toISOString() } : p
      );
      saveStoredProjects(updated);
      return { projects: updated };
    });
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  updateClip: (projectId, clipId, updates) => {
    set((state) => {
      const updatedProjects = state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedClips = proj.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          return { ...clip, ...updates, updatedAt: new Date().toISOString() };
        });
        return { ...proj, clips: updatedClips, updatedAt: new Date().toISOString() };
      });

      saveStoredProjects(updatedProjects);
      return { projects: updatedProjects };
    });
  },

  deleteClip: (projectId, clipId) => {
    set((state) => {
      const updatedProjects = state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          clips: proj.clips.filter((c) => c.id !== clipId),
          updatedAt: new Date().toISOString(),
        };
      });

      saveStoredProjects(updatedProjects);
      return { projects: updatedProjects };
    });
  },

  toggleClipSelection: (projectId, clipId) => {
    set((state) => {
      const updatedProjects = state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) => (c.id === clipId ? { ...c, selected: !c.selected } : c)),
        };
      });
      saveStoredProjects(updatedProjects);
      return { projects: updatedProjects };
    });
  },

  selectAllClips: (projectId, selected) => {
    set((state) => {
      const updatedProjects = state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          clips: proj.clips.map((c) => ({ ...c, selected })),
        };
      });
      saveStoredProjects(updatedProjects);
      return { projects: updatedProjects };
    });
  },

  duplicateClip: (projectId, clipId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return null;
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip) return null;

    const duplicatedClip: Clip = {
      ...clip,
      id: `clip_${Date.now()}_copy`,
      title: `${clip.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedProjects = state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          clips: [...proj.clips, duplicatedClip],
          updatedAt: new Date().toISOString(),
        };
      });
      saveStoredProjects(updatedProjects);
      return { projects: updatedProjects };
    });

    return duplicatedClip;
  },

  setCurrentJob: (job) => set({ currentJob: job }),

  updateCurrentJob: (updates) => {
    set((state) => ({
      currentJob: state.currentJob ? { ...state.currentJob, ...updates } : null,
    }));
  },

  resetProjects: () => {
    saveStoredProjects(SEED_PROJECTS);
    set({ projects: SEED_PROJECTS, currentJob: null });
  },
}));
