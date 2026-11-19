/**
 * FFmpeg Hardcoded Subtitle, Audio Synchronization & Stream Mapping Engine.
 * Executes native FFmpeg/FFprobe with explicit stream mapping, H.264/AAC encoding,
 * ASS subtitle burning, and strict post-render media stream verification.
 */

import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import ffmpegStatic from 'ffmpeg-static';
// @ts-ignore
import ffprobeStatic from 'ffprobe-static';
import { CaptionSettings, SubtitleSegment } from '../types';
import { generateAssSubtitleFile } from './captionBurner';
import { mapTranscriptToClip } from './transcriptionService';

const execFileAsync = promisify(execFile);

export interface MediaProbeResult {
  hasVideo: boolean;
  videoCodec?: string;
  width?: number;
  height?: number;
  duration: number;
  hasAudio: boolean;
  audioCodec?: string;
  channels?: number;
  sampleRate?: number;
  bitrate?: number;
  formatName?: string;
  sizeBytes?: number;
}

export interface FFmpegRenderOptions {
  inputVideoPath: string;
  outputVideoPath: string;
  startTime: number;
  endTime: number;
  minDuration?: number;
  maxDuration?: number;
  exactDuration?: number;
  toleranceSeconds?: number;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  facePanX?: number; // 0 to 100%
  facePanY?: number; // 0 to 100%
  subtitles?: SubtitleSegment[];
  captionSettings?: CaptionSettings;
  keepAudio?: boolean;
  audioSourcePath?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface FFmpegRenderResult {
  outputPath: string;
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
  videoCodec: string;
  audioCodec?: string;
  fileSizeBytes: number;
  verified: boolean;
}

export class FFmpegService {
  private ffmpegPath: string | null = null;
  private ffprobePath: string | null = null;

  constructor() {
    this.resolveBinaries();
  }

  /**
   * Resolves FFmpeg and FFprobe binary paths from npm static packages or system environment.
   */
  private resolveBinaries(): void {
    if (ffmpegStatic && typeof ffmpegStatic === 'string' && fs.existsSync(ffmpegStatic)) {
      this.ffmpegPath = ffmpegStatic;
    } else if ((ffmpegStatic as any)?.default && typeof (ffmpegStatic as any).default === 'string' && fs.existsSync((ffmpegStatic as any).default)) {
      this.ffmpegPath = (ffmpegStatic as any).default;
    } else {
      this.ffmpegPath = 'ffmpeg';
    }

    const probeCandidate = (ffprobeStatic as any)?.path || (ffprobeStatic as any)?.default?.path;
    if (probeCandidate && fs.existsSync(probeCandidate)) {
      this.ffprobePath = probeCandidate;
    } else {
      this.ffprobePath = 'ffprobe';
    }
  }

  public getFFmpegBinary(): string {
    if (!this.ffmpegPath) this.resolveBinaries();
    return this.ffmpegPath || 'ffmpeg';
  }

  public getFFprobeBinary(): string {
    if (!this.ffprobePath) this.resolveBinaries();
    return this.ffprobePath || 'ffprobe';
  }

  /**
   * Deeply inspects an audio or video file using FFprobe and returns parsed stream metadata.
   */
  public async probeMedia(filePath: string): Promise<MediaProbeResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Media file does not exist for FFprobe inspection: ${filePath}`);
    }

    const ffprobe = this.getFFprobeBinary();
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    try {
      const { stdout } = await execFileAsync(ffprobe, args);
      const data = JSON.parse(stdout);

      const streams = data.streams || [];
      const format = data.format || {};

      const videoStream = streams.find((s: any) => s.codec_type === 'video');
      const audioStream = streams.find((s: any) => s.codec_type === 'audio');

      const duration = parseFloat(format.duration) || parseFloat(videoStream?.duration) || parseFloat(audioStream?.duration) || 0;

      return {
        hasVideo: !!videoStream,
        videoCodec: videoStream?.codec_name,
        width: videoStream ? parseInt(videoStream.width, 10) : undefined,
        height: videoStream ? parseInt(videoStream.height, 10) : undefined,
        duration: Math.round(duration * 100) / 100,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name,
        channels: audioStream ? parseInt(audioStream.channels, 10) : undefined,
        sampleRate: audioStream ? parseInt(audioStream.sample_rate, 10) : undefined,
        bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
        formatName: format.format_name,
        sizeBytes: format.size ? parseInt(format.size, 10) : fs.statSync(filePath).size,
      };
    } catch (err: any) {
      throw new Error(`FFprobe inspection failed for "${filePath}": ${err.message}`);
    }
  }

  /**
   * Renders and trims a video segment with Hardcoded Subtitles, Kinematic Face Reframing,
   * Synchronized Audio preservation, and explicit MP4 H.264/AAC stream mapping.
   */
  public async renderClippedVideo(options: FFmpegRenderOptions): Promise<FFmpegRenderResult> {
    const {
      inputVideoPath,
      outputVideoPath,
      startTime,
      endTime,
      aspectRatio = '9:16',
      facePanX = 50,
      subtitles = [],
      captionSettings,
      keepAudio = true,
      audioSourcePath,
    } = options;

    if (!fs.existsSync(inputVideoPath)) {
      throw new Error(`Input source video not found: ${inputVideoPath}`);
    }

    const clipDuration = Math.max(0.5, endTime - startTime);

    // 1. Inspect source video streams
    const sourceProbe = await this.probeMedia(inputVideoPath);
    if (!sourceProbe.hasVideo) {
      throw new Error(`Source file contains no valid video stream: ${inputVideoPath}`);
    }

    const sourceW = sourceProbe.width || 1920;
    const sourceH = sourceProbe.height || 1080;

    // 2. Prepare target dimensions and reframing crop parameters
    let targetW = 720;
    let targetH = 1280;
    if (aspectRatio === '1:1') {
      targetW = 720;
      targetH = 720;
    } else if (aspectRatio === '16:9') {
      targetW = 1280;
      targetH = 720;
    }

    // Calculate face-aware crop box for vertical/square framing
    const targetRatio = targetW / targetH;
    const sourceRatio = sourceW / sourceH;

    let filterChain = '';

    if (Math.abs(targetRatio - sourceRatio) > 0.05) {
      let cropW = sourceW;
      let cropH = sourceH;

      if (targetRatio < sourceRatio) {
        // Cropping horizontal width (e.g. 16:9 into 9:16)
        cropW = Math.round(sourceH * targetRatio);
        if (cropW % 2 !== 0) cropW -= 1;
        const panRatio = Math.max(0, Math.min(100, facePanX)) / 100;
        let cropX = Math.round((sourceW - cropW) * panRatio);
        if (cropX + cropW > sourceW) cropX = sourceW - cropW;
        if (cropX < 0) cropX = 0;
        filterChain += `crop=${cropW}:${cropH}:${cropX}:0,scale=${targetW}:${targetH}`;
      } else {
        // Cropping vertical height
        cropH = Math.round(sourceW / targetRatio);
        if (cropH % 2 !== 0) cropH -= 1;
        const cropY = Math.round((sourceH - cropH) / 2);
        filterChain += `crop=${cropW}:${cropH}:0:${cropY},scale=${targetW}:${targetH}`;
      }
    } else {
      filterChain += `scale=${targetW}:${targetH}`;
    }

    // Normalize variable frame rates (VFR) to constant 30 FPS (CFR) and align presentation timestamps
    filterChain += `,fps=fps=30:round=near,setpts=PTS-STARTPTS`;

    // 3. Generate and burn ASS hardcoded subtitles if present
    let tempAssPath: string | null = null;
    if (captionSettings && captionSettings.enabled && subtitles.length > 0) {
      // Check if subtitles are already relative to [0, clipDuration]
      const isAlreadyRelative =
        startTime > 0 &&
        subtitles[0].start >= 0 &&
        subtitles[subtitles.length - 1].end <= clipDuration + 2.0 &&
        subtitles.every((s) => s.end <= clipDuration + 3.0 && s.start < clipDuration);

      // Map subtitles safely without double-subtracting startTime
      const clipRelativeSubs = subtitles
        .filter((s) => {
          if (isAlreadyRelative) {
            return s.start < clipDuration && s.end > 0;
          }
          return s.end > startTime && s.start < endTime;
        })
        .map((s) => ({
          ...s,
          start: Math.max(0, isAlreadyRelative ? s.start : s.start - startTime),
          end: Math.min(clipDuration, isAlreadyRelative ? s.end : s.end - startTime),
        }));

      if (clipRelativeSubs.length > 0) {
        const assContent = generateAssSubtitleFile(
          clipRelativeSubs,
          captionSettings,
          targetW,
          targetH
        );

        tempAssPath = path.join(
          path.dirname(outputVideoPath),
          `temp_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.ass`
        );
        fs.writeFileSync(tempAssPath, assContent, 'utf8');

        // Escape Windows path for FFmpeg subtitles filter
        const escapedAssPath = tempAssPath
          .replace(/\\/g, '/')
          .replace(/:/g, '\\:');

        filterChain += `,subtitles='${escapedAssPath}'`;
      }
    }

    // 4. Construct FFmpeg command arguments with explicit stream mapping
    const ffmpeg = this.getFFmpegBinary();
    const effectiveAudioSource = audioSourcePath || inputVideoPath;
    const audioProbe = (effectiveAudioSource === inputVideoPath)
      ? sourceProbe
      : await this.probeMedia(effectiveAudioSource);

    const hasAudio = audioProbe.hasAudio && keepAudio;

    const args: string[] = [
      '-y',
      '-ss', startTime.toFixed(3),
      '-i', inputVideoPath,
    ];

    if (hasAudio && effectiveAudioSource !== inputVideoPath) {
      args.push(
        '-ss', startTime.toFixed(3),
        '-i', effectiveAudioSource
      );
    }

    // Exact duration cut parameter placed after input
    args.push('-t', clipDuration.toFixed(3));

    // Video filters
    args.push('-vf', filterChain);

    // Stream Mapping & Audio/Video Timestamp Synchronization
    if (hasAudio) {
      if (effectiveAudioSource !== inputVideoPath) {
        args.push('-map', '0:v:0', '-map', '1:a:0');
      } else {
        args.push('-map', '0:v:0', '-map', '0:a:0');
      }
      args.push(
        '-af', 'aresample=async=1000:first_pts=0,asetpts=PTS-STARTPTS',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2'
      );
    } else {
      args.push('-map', '0:v:0');
    }

    // Video encoding: H.264 High Profile, constant 30fps, faststart for instant playback
    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-max_muxing_queue_size', '1024',
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart',
      outputVideoPath
    );

    // 5. Execute FFmpeg
    try {
      await execFileAsync(ffmpeg, args);
    } catch (err: any) {
      throw new Error(`FFmpeg execution failed: ${err.stderr || err.message}`);
    } finally {
      // Clean up temporary ASS file
      if (tempAssPath && fs.existsSync(tempAssPath)) {
        try { fs.unlinkSync(tempAssPath); } catch {}
      }
    }

    // 6. Post-Render Verification with FFprobe
    const verified = await this.verifyExportedMp4(outputVideoPath, {
      expectedDuration: options.exactDuration || clipDuration,
      minDuration: options.minDuration,
      maxDuration: options.maxDuration,
      expectAudio: hasAudio,
      toleranceSeconds: options.toleranceSeconds || 0.35,
    });

    return {
      outputPath: outputVideoPath,
      duration: verified.duration,
      hasAudio: verified.hasAudio,
      hasVideo: verified.hasVideo,
      videoCodec: verified.videoCodec || 'h264',
      audioCodec: verified.audioCodec,
      fileSizeBytes: verified.sizeBytes || 0,
      verified: true,
    };
  }

  /**
   * Verifies an exported MP4 file using FFprobe to guarantee streams, codecs, and durations.
   */
  public async verifyExportedMp4(
    filePath: string,
    expected: {
      expectedDuration?: number;
      minDuration?: number;
      maxDuration?: number;
      expectAudio?: boolean;
      toleranceSeconds?: number;
    } = {}
  ): Promise<MediaProbeResult> {
    const probe = await this.probeMedia(filePath);

    if (!probe.hasVideo) {
      throw new Error(`Export verification failed: Output file has no video stream (${filePath}).`);
    }

    if (expected.expectAudio && !probe.hasAudio) {
      throw new Error(`Export verification failed: Output file is missing expected audio track (${filePath}).`);
    }

    if (probe.hasAudio && probe.audioCodec !== 'aac' && probe.audioCodec !== 'mp3') {
      console.warn(`Audio codec is ${probe.audioCodec}, recommended is AAC.`);
    }

    const tol = expected.toleranceSeconds || 0.45;

    // Check exact or expected target duration
    if (expected.expectedDuration !== undefined) {
      const diff = Math.abs(probe.duration - expected.expectedDuration);
      if (diff > tol) {
        throw new Error(
          `Export verification failed: Output duration (${probe.duration.toFixed(2)}s) differs from target (${expected.expectedDuration.toFixed(2)}s) by ${diff.toFixed(2)}s (allowed tolerance: ±${tol}s).`
        );
      }
    }

    // Check range duration
    if (expected.minDuration !== undefined && probe.duration < expected.minDuration - tol) {
      throw new Error(
        `Export verification failed: Output duration (${probe.duration.toFixed(2)}s) is shorter than minimum allowed (${expected.minDuration}s - tolerance: ${(expected.minDuration - tol).toFixed(2)}s).`
      );
    }
    if (expected.maxDuration !== undefined && probe.duration > expected.maxDuration + tol) {
      throw new Error(
        `Export verification failed: Output duration (${probe.duration.toFixed(2)}s) exceeds maximum allowed (${expected.maxDuration}s + tolerance: ${(expected.maxDuration + tol).toFixed(2)}s).`
      );
    }

    return probe;
  }

  /**
   * Extracts a single frame at a specific timestamp to an image file.
   */
  public async extractFrame(videoPath: string, timestampSeconds: number, outputPath: string): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    const ffmpeg = this.getFFmpegBinary();
    const args = [
      '-ss', timestampSeconds.toString(),
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      outputPath,
    ];
    await execFileAsync(ffmpeg, args);
    return outputPath;
  }

  /**
   * Extracts clean, speech-optimized audio from a video file for Deepgram transcription.
   */
  public async extractAudio(
    videoPath: string,
    outputAudioPath?: string,
    startTime?: number,
    duration?: number
  ): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    const outPath = outputAudioPath || path.join(
      path.dirname(videoPath),
      `audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp3`
    );

    const ffmpeg = this.getFFmpegBinary();
    const args: string[] = ['-y'];

    if (startTime !== undefined && startTime > 0) {
      args.push('-ss', startTime.toFixed(3));
    }
    args.push('-i', videoPath);

    if (duration !== undefined && duration > 0) {
      args.push('-t', duration.toFixed(3));
    }

    // Extract audio as 16kHz mono MP3 or PCM WAV (optimal for Deepgram Nova-2)
    args.push(
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-c:a', outPath.endsWith('.wav') ? 'pcm_s16le' : 'libmp3lame',
      '-q:a', '2',
      outPath
    );

    await execFileAsync(ffmpeg, args);
    return outPath;
  }

  /**
   * Extracts representative chronological video frames across video duration
   * for Gemini Multimodal Vision analysis.
   */
  public async extractVideoFrames(
    videoPath: string,
    frameCount: number = 8,
    totalDuration?: number
  ): Promise<Array<{ time: number; base64: string; cleanBase64: string }>> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    const probe = await this.probeMedia(videoPath);
    const dur = totalDuration || probe.duration || 30;
    const step = dur / (frameCount + 1);
    const timestamps = Array.from({ length: frameCount }, (_, i) =>
      Math.round((i + 1) * step * 10) / 10
    );

    const outDir = path.join(path.dirname(videoPath), `frames_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    fs.mkdirSync(outDir, { recursive: true });

    const ffmpeg = this.getFFmpegBinary();
    const frames: Array<{ time: number; base64: string; cleanBase64: string }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const framePath = path.join(outDir, `frame_${i}.jpg`);
      try {
        await execFileAsync(ffmpeg, [
          '-y',
          '-ss', t.toFixed(3),
          '-i', videoPath,
          '-vframes', '1',
          '-vf', 'scale=640:-1',
          '-q:v', '3',
          framePath,
        ]);

        if (fs.existsSync(framePath)) {
          const buf = fs.readFileSync(framePath);
          const cleanBase64 = buf.toString('base64');
          frames.push({
            time: t,
            base64: `data:image/jpeg;base64,${cleanBase64}`,
            cleanBase64,
          });
          try { fs.unlinkSync(framePath); } catch {}
        }
      } catch (err) {
        console.warn(`[FFmpegService] Frame extraction at ${t}s failed:`, err);
      }
    }

    try { fs.rmdirSync(outDir); } catch {}
    return frames;
  }
}

export const ffmpegServiceInstance = new FFmpegService();
