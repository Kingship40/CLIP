import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { extractVideoMetadata, SAMPLE_VIDEOS, SampleVideo } from '../utils/videoHelpers';
import { formatDuration, formatDate, formatRelativeTime } from '../utils/formatters';
import { registerSessionVideoUrl } from '../utils/storage';
import {
  Plus,
  Video,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Search,
  FolderKanban,
  Edit3,
  Play,
  CheckCircle2,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { VideoSourceTabs, VideoInputMode } from '../components/upload/VideoSourceTabs';
import { UrlImportForm } from '../components/upload/UrlImportForm';
import { SampleVideoPicker } from '../components/upload/SampleVideoPicker';
import { EmptyState } from '../components/common/EmptyState';
import { SeedanceStudioModal } from '../components/seedance/SeedanceStudioModal';

export const DashboardPage: React.FC = () => {
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [inputMode, setInputMode] = useState<VideoInputMode>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);

  const [showSeedanceModal, setShowSeedanceModal] = useState(false);

  // Filtered projects
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recent clips gathered across all projects
  const recentClips = projects
    .flatMap((p) => p.clips.map((c) => ({ ...c, projectName: p.name })))
    .slice(0, 6);

  // Handle direct file drop on dashboard
  const handleFileDrop = async (file: File) => {
    setIsExtracting(true);
    setExtractProgress(25);
    try {
      setExtractProgress(60);
      const { metadata, objectUrl } = await extractVideoMetadata(file);
      setExtractProgress(100);

      const tempId = `temp_${Date.now()}`;
      registerSessionVideoUrl(tempId, objectUrl);

      // Store in sessionStorage to populate NewProjectPage immediately
      sessionStorage.setItem('clipforge_pending_upload', JSON.stringify({
        metadata,
        videoUrl: objectUrl,
      }));

      addToast({
        title: 'Video Loaded Successfully',
        message: `${metadata.fileName} (${formatDuration(metadata.duration)})`,
        type: 'success',
      });

      navigate('/dashboard/new');
    } catch (err: any) {
      addToast({
        title: 'Video Load Failed',
        message: err.message || 'Please upload a valid MP4 or MOV video file.',
        type: 'error',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVideoImported = (result: { metadata: any; videoUrl: string }) => {
    const tempId = `temp_${Date.now()}`;
    const activeUrl = result.videoUrl || result.metadata?.sourceUrl || 'https://vjs.zencdn.net/v/oceans.mp4';
    registerSessionVideoUrl(tempId, activeUrl);

    sessionStorage.setItem('clipforge_pending_upload', JSON.stringify({
      metadata: result.metadata,
      videoUrl: activeUrl,
    }));

    addToast({
      title: 'Media Verified & Loaded',
      message: `${result.metadata.fileName} (${formatDuration(result.metadata.duration)})`,
      type: 'success',
    });

    navigate('/dashboard/new');
  };

  const handleSelectSample = (sample: SampleVideo) => {
    sessionStorage.setItem('clipforge_pending_upload', JSON.stringify({
      metadata: {
        fileName: `${sample.title}.mp4`,
        fileSize: 45000000,
        fileType: 'video/mp4',
        duration: sample.duration,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        thumbnailUrl: sample.thumbnail,
      },
      videoUrl: sample.url,
    }));

    addToast({
      title: 'Sample Video Selected',
      message: `Loaded "${sample.title}" into configuration studio.`,
      type: 'info',
    });

    navigate('/dashboard/new');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl border shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[#5145DE] dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Short-Form Creator Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Welcome back, {user?.name?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="text-xs sm:text-sm max-w-xl leading-relaxed font-medium text-[var(--text-secondary)]">
            Upload your podcast or interview recording below to auto-extract viral highlights, generate animated subtitles, and reframe for TikTok & Reels.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex flex-wrap items-center gap-2.5">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setShowSeedanceModal(true)}
            leftIcon={<Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />}
            className="border-cyan-500/40 hover:border-cyan-400 text-cyan-700 dark:text-cyan-200 shadow-glow-cyan"
          >
            Seedance-2.5 Gen
          </Button>

          <Link to="/dashboard/new">
            <Button
              size="lg"
              variant="primary"
              leftIcon={<Plus className="w-5 h-5 text-white" />}
              className="shadow-glow-brand"
            >
              Upload & Clip
            </Button>
          </Link>
        </div>
      </div>

      {/* Seedance 2.5 Generative Modal */}
      <SeedanceStudioModal
        isOpen={showSeedanceModal}
        onClose={() => setShowSeedanceModal(false)}
      />

      {/* Large Upload Dropzone Zone directly on Dashboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--text-primary)]">
            <Video className="w-4 h-4 text-[#5145DE] dark:text-brand-500" />
            <span>Instant Video Ingestion</span>
          </h2>
          <span className="text-xs font-medium text-[var(--text-secondary)]">Upload a file or paste a link to begin clipping instantly</span>
        </div>

        <VideoSourceTabs
          activeMode={inputMode}
          onModeChange={setInputMode}
          disabled={isExtracting}
        />

        {inputMode === 'upload' ? (
          <UploadDropzone
            onFileSelected={handleFileDrop}
            isLoading={isExtracting}
            uploadProgress={extractProgress}
          />
        ) : (
          <UrlImportForm
            onVideoImported={handleVideoImported}
            onSwitchToUpload={() => setInputMode('upload')}
            isLoading={isExtracting}
          />
        )}

        <SampleVideoPicker onSelectSample={handleSelectSample} disabled={isExtracting} />
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">Recent Projects</h2>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">({projects.length})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
            <Link to="/dashboard/projects">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="You haven't created any clipping projects yet. Upload a video above or test with a sample video!"
            actionLabel="Start First Project"
            onAction={() => navigate('/dashboard/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                className="border rounded-2xl overflow-hidden hover:shadow-xl group flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Thumbnail Header */}
                <Link to={`/dashboard/projects/${project.id}`}>
                  <div className="relative aspect-video bg-black overflow-hidden cursor-pointer">
                    <img
                      src={project.sourceVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80'}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                      {formatDuration(project.sourceVideo.duration)}
                    </span>
                    <span className="absolute top-2 left-2">
                      <Badge
                        variant={project.status === 'completed' ? 'emerald' : project.status === 'processing' ? 'brand' : 'neutral'}
                        size="sm"
                      >
                        {project.status === 'completed' ? 'Ready' : project.status}
                      </Badge>
                    </span>
                  </div>
                </Link>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm truncate group-hover:text-[#5145DE] transition-colors mb-1 text-[var(--text-primary)]">
                      <Link to={`/dashboard/projects/${project.id}`}>{project.name}</Link>
                    </h3>

                    <div className="flex items-center gap-3 text-xs mt-2 text-[var(--text-secondary)] font-medium">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#5145DE] dark:text-brand-500" />
                        <strong className="text-[var(--text-primary)]">{project.clips.length}</strong> clips
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(project.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between border-[var(--border)]">
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Aspect: <strong className="text-[var(--text-primary)]">{project.config.aspectRatio}</strong>
                    </span>

                    <Link to={`/dashboard/projects/${project.id}`}>
                      <button className="text-xs font-bold text-[#5145DE] hover:text-[#4338CA] dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 transition-colors">
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Extracted Clips Row */}
      {recentClips.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Latest Generated Clips</h2>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Quick jump directly into clip editor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentClips.map((clip) => (
              <div
                key={clip.id}
                className="p-3.5 rounded-xl border hover:shadow-md transition-all flex items-center gap-3 group"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="relative w-16 aspect-[9/16] rounded-lg overflow-hidden bg-black shrink-0">
                  <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[8px] font-mono text-white">
                    {formatDuration(clip.duration)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {clip.viralScore} Hook
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {clip.aspectRatio}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold truncate group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {clip.title}
                  </h4>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    From: {clip.projectName}
                  </p>

                  <Link to={`/dashboard/clips/${clip.id}`} className="mt-2 inline-block">
                    <span className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit in Studio
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
