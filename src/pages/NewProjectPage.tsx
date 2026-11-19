import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, VideoMetadata, ProjectConfig, ProcessingJob } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { extractVideoMetadata, SampleVideo } from '../utils/videoHelpers';
import { registerSessionVideoUrl, getSessionVideoUrl } from '../utils/storage';
import { clippingService } from '../services/clippingService';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { VideoSourceTabs, VideoInputMode } from '../components/upload/VideoSourceTabs';
import { UrlImportForm } from '../components/upload/UrlImportForm';
import { SampleVideoPicker } from '../components/upload/SampleVideoPicker';
import { VideoMetadataPanel } from '../components/upload/VideoMetadataPanel';
import { ClipConfigurationForm, DEFAULT_CONFIG } from '../components/config/ClipConfigurationForm';
import { ProcessingProgress } from '../components/processing/ProcessingProgress';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProject, updateProject } = useProjectStore();
  const { addToast } = useToastStore();

  const [inputMode, setInputMode] = useState<VideoInputMode>('upload');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);

  // Active processing state
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);

  // Check if a video was preloaded from Dashboard
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('clipforge_pending_upload');
      if (pending) {
        const parsed = JSON.parse(pending);
        setMetadata(parsed.metadata);
        setVideoUrl(parsed.videoUrl);
        sessionStorage.removeItem('clipforge_pending_upload');
      }
    } catch (e) {
      console.warn('Could not read pending upload:', e);
    }
  }, []);

  const handleFileSelected = async (file: File) => {
    setIsExtracting(true);
    setExtractProgress(20);
    try {
      setExtractProgress(50);
      const res = await extractVideoMetadata(file);
      setExtractProgress(100);

      const tempId = `temp_${Date.now()}`;
      registerSessionVideoUrl(tempId, res.objectUrl);

      setMetadata(res.metadata);
      setVideoUrl(res.objectUrl);

      addToast({
        title: 'Video Loaded',
        message: `${res.metadata.fileName} ready for clipping configuration.`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Metadata Extraction Error',
        message: err.message || 'Unable to parse video file.',
        type: 'error',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSelectSample = (sample: SampleVideo) => {
    const meta: VideoMetadata = {
      fileName: `${sample.title}.mp4`,
      fileSize: 45000000,
      fileType: 'video/mp4',
      duration: sample.duration,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      thumbnailUrl: sample.thumbnail,
    };
    setMetadata(meta);
    setVideoUrl(sample.url);
    addToast({
      title: 'Sample Video Selected',
      message: `Loaded "${sample.title}"`,
      type: 'info',
    });
  };

  const handleResetVideo = () => {
    setMetadata(null);
    setVideoUrl(undefined);
  };

  const handleVideoImported = (result: { metadata: VideoMetadata; videoUrl: string }) => {
    const tempId = `temp_${Date.now()}`;
    const activeUrl = result.videoUrl || (result.metadata as any)?.sourceUrl || 'https://vjs.zencdn.net/v/oceans.mp4';
    registerSessionVideoUrl(tempId, activeUrl);

    setMetadata(result.metadata);
    setVideoUrl(activeUrl);

    addToast({
      title: 'Media Ready',
      message: `"${result.metadata.fileName}" verified and ready for clipping.`,
      type: 'success',
    });
  };

  const handleStartProcessing = async (config: ProjectConfig) => {
    if (!metadata) return;

    if (!videoUrl) {
      addToast({
        title: 'Cannot Start Clipping',
        message: 'No verified video media is available. Please upload a source video file to continue.',
        type: 'error',
      });
      return;
    }

    const projectId = `proj_${Date.now()}`;
    const projectName = metadata.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    const newProject: Project = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processing',
      sourceVideo: {
        name: metadata.fileName,
        size: metadata.fileSize,
        type: metadata.fileType,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.aspectRatio,
        url: videoUrl,
        thumbnailUrl: metadata.thumbnailUrl,
      },
      config,
      clips: [],
    };

    addProject(newProject);
    setActiveProject(newProject);

    try {
      // Run clipping pipeline simulation
      const job = await clippingService.createJob(newProject, (updatedJob) => {
        setCurrentJob(updatedJob);
      });

      // Generate clips using intelligent viral moment engine
      const clips = await clippingService.generateClips(newProject);
      updateProject(projectId, {
        status: 'completed',
        clips,
        job,
      });

      addToast({
        title: 'Clipping Pipeline Complete!',
        message: `Extracted ${clips.length} vertical short clips.`,
        type: 'success',
      });

      // Navigate to project workspace
      navigate(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        addToast({ title: 'Pipeline Cancelled', type: 'info' });
        setActiveProject(null);
        setCurrentJob(null);
      } else {
        addToast({ title: 'Pipeline Error', message: err.message, type: 'error' });
      }
    }
  };

  const handleCancelJob = async () => {
    if (currentJob) {
      await clippingService.cancelJob(currentJob.id);
    }
  };

  // If currently processing a job, show the multi-stage pipeline screen!
  if (activeProject && currentJob && currentJob.status === 'running') {
    return (
      <ProcessingProgress
        project={activeProject}
        job={currentJob}
        onCancel={handleCancelJob}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Back button and page title */}
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              New Clipping Project
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Upload long video, choose target aspect ratio and generate short-form clips.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Upload / Selected Video View */}
      {!metadata ? (
        <div className="space-y-6">
          <VideoSourceTabs
            activeMode={inputMode}
            onModeChange={setInputMode}
            disabled={isExtracting}
          />

          {inputMode === 'upload' ? (
            <UploadDropzone
              onFileSelected={handleFileSelected}
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
      ) : (
        <div className="space-y-6">
          {/* Metadata Display Panel */}
          <VideoMetadataPanel
            metadata={metadata}
            videoUrl={videoUrl}
            onReset={handleResetVideo}
          />

          {/* Step 2: Configuration Form */}
          <div
            className="border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Clip Generation Preferences
              </h2>
            </div>

            <ClipConfigurationForm
              initialConfig={DEFAULT_CONFIG}
              onSubmit={handleStartProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
};
