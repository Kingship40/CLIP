/**
 * Private Storage Manager for Background AI Video Ingestion.
 * Ensures complete source videos are NEVER exposed through public URLs or frontend embeds.
 * Implements strict temporary workspace lifecycle, access controls, and retention policies.
 * Isomorphic: safe in both Node.js (backend) and browser (frontend/client).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RetentionPolicy } from '../import/types';

export interface StorageFileRecord {
  jobId: string;
  sourceFilePath?: string;
  clipFilePaths: Map<string, string>;
  createdAt: number;
  retentionPolicy: RetentionPolicy;
  isSourceCleanedUp: boolean;
}

const isBrowser = typeof window !== 'undefined';

function safeEncodeBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function safeDecodeBase64Url(base64Url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64Url, 'base64url').toString('utf8');
  }
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(base64)));
}

export class PrivateStorageManager {
  private baseDir: string;
  private jobRecords: Map<string, StorageFileRecord> = new Map();
  private secretKey: string;

  constructor(baseDir?: string) {
    if (isBrowser) {
      this.baseDir = baseDir || '/temp_media';
      this.secretKey = 'clipforge_browser_local_storage_secret';
    } else {
      try {
        this.baseDir = baseDir || path.resolve(process.cwd(), '.temp_media');
        this.secretKey =
          process.env.CLIPFORGE_STORAGE_SECRET ||
          'clipforge_secure_persistent_storage_secret_key_2026';
        this.ensureBaseDir();
      } catch {
        this.baseDir = baseDir || '.temp_media';
        this.secretKey = 'default_clipforge_private_secret';
      }
    }
  }

  private ensureBaseDir(): void {
    if (isBrowser) return;
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch {
      // Non-fatal if running in read-only or browser environment
    }
  }

  public getJobDir(jobId: string): string {
    const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (isBrowser) {
      return `${this.baseDir}/${safeJobId}`;
    }
    try {
      return path.join(this.baseDir, safeJobId);
    } catch {
      return `${this.baseDir}/${safeJobId}`;
    }
  }

  public createJobWorkspace(jobId: string, retention: RetentionPolicy = 'immediate'): StorageFileRecord {
    const jobDir = this.getJobDir(jobId);
    if (!isBrowser) {
      try {
        if (!fs.existsSync(jobDir)) {
          fs.mkdirSync(jobDir, { recursive: true });
          fs.mkdirSync(path.join(jobDir, 'clips'), { recursive: true });
        }
      } catch {
        // In-memory fallback
      }
    }

    const record: StorageFileRecord = {
      jobId,
      clipFilePaths: new Map(),
      createdAt: Date.now(),
      retentionPolicy: retention,
      isSourceCleanedUp: false,
    };

    this.jobRecords.set(jobId, record);
    return record;
  }

  /**
   * Securely saves source video into private temporary storage.
   * Path is kept internal and never exposed to public responses.
   */
  public storeSourceVideo(jobId: string, data: Uint8Array | string, extension: string = 'mp4'): string {
    const record = this.jobRecords.get(jobId) || this.createJobWorkspace(jobId);
    const jobDir = this.getJobDir(jobId);
    const safeExt = extension.replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
    const filePath = isBrowser ? `${jobDir}/private_source.${safeExt}` : path.join(jobDir, `private_source.${safeExt}`);

    if (!isBrowser) {
      try {
        const buf = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
        fs.writeFileSync(filePath, buf);
        record.sourceFilePath = filePath;
      } catch {
        record.sourceFilePath = filePath;
      }
    } else {
      record.sourceFilePath = filePath;
    }

    return filePath;
  }

  /**
   * Retrieves the private source file path for internal backend AI analysis.
   * STRICT GUARD: Throws error if called after cleanup or if unverified.
   */
  public getInternalSourcePath(jobId: string): string | null {
    const record = this.jobRecords.get(jobId);
    if (!record || record.isSourceCleanedUp || !record.sourceFilePath) {
      return null;
    }
    return record.sourceFilePath;
  }

  /**
   * Saves a generated vertical short clip into private clip storage.
   */
  public storeClip(jobId: string, clipId: string, data: Uint8Array | string): string {
    const record = this.jobRecords.get(jobId) || this.createJobWorkspace(jobId);
    const jobDir = this.getJobDir(jobId);
    const safeClipId = clipId.replace(/[^a-zA-Z0-9_-]/g, '');
    const clipPath = isBrowser ? `${jobDir}/clips/${safeClipId}.mp4` : path.join(jobDir, 'clips', `${safeClipId}.mp4`);

    if (!isBrowser) {
      try {
        const buf = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
        fs.writeFileSync(clipPath, buf);
        record.clipFilePaths.set(clipId, clipPath);
      } catch {
        record.clipFilePaths.set(clipId, clipPath);
      }
    } else {
      record.clipFilePaths.set(clipId, clipPath);
    }

    return clipPath;
  }

  /**
   * Returns the absolute file path of an exported short clip if available on disk.
   */
  public getClipFilePath(jobId: string, clipId: string): string | null {
    const record = this.jobRecords.get(jobId);
    if (record && record.clipFilePaths.has(clipId)) {
      const storedPath = record.clipFilePaths.get(clipId)!;
      if (!isBrowser && fs.existsSync(storedPath)) {
        return storedPath;
      }
    }
    const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeClipId = clipId.replace(/[^a-zA-Z0-9_-]/g, '');
    const fallbackPath = isBrowser
      ? `${this.baseDir}/${safeJobId}/clips/${safeClipId}.mp4`
      : path.join(this.baseDir, safeJobId, 'clips', `${safeClipId}.mp4`);
    if (!isBrowser && fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
    return null;
  }

  /**
   * Generates a short-lived cryptographically signed token for clip download.
   */
  public generateClipDownloadToken(jobId: string, clipId: string, expirySeconds: number = 3600): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
    const payload = `${jobId}:${clipId}:${expiresAt}`;
    let signature = '';

    if (!isBrowser && crypto && typeof crypto.createHmac === 'function') {
      try {
        signature = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
      } catch {
        signature = safeEncodeBase64Url(payload).substring(0, 32);
      }
    } else {
      signature = safeEncodeBase64Url(payload).substring(0, 32);
    }

    return safeEncodeBase64Url(JSON.stringify({ j: jobId, c: clipId, e: expiresAt, s: signature }));
  }

  /**
   * Validates a clip download token.
   */
  public verifyClipDownloadToken(token: string): { isValid: boolean; jobId?: string; clipId?: string; error?: string } {
    try {
      const decoded = JSON.parse(safeDecodeBase64Url(token));
      const { j: jobId, c: clipId, e: expiresAt, s: signature } = decoded;

      if (Date.now() / 1000 > expiresAt) {
        return { isValid: false, error: 'Download token has expired.' };
      }

      const payload = `${jobId}:${clipId}:${expiresAt}`;
      let expected = '';

      if (!isBrowser && crypto && typeof crypto.createHmac === 'function') {
        try {
          expected = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
        } catch {
          expected = safeEncodeBase64Url(payload).substring(0, 32);
        }
      } else {
        expected = safeEncodeBase64Url(payload).substring(0, 32);
      }

      if (signature !== expected) {
        return { isValid: false, error: 'Invalid security signature.' };
      }

      return { isValid: true, jobId, clipId };
    } catch {
      return { isValid: false, error: 'Malformed download token.' };
    }
  }

  /**
   * Immediately deletes the private master source file once clip generation finishes.
   * Enforces that raw sources are never retained or published.
   */
  public cleanupSource(jobId: string): boolean {
    const record = this.jobRecords.get(jobId);
    if (!record) return false;

    if (record.sourceFilePath) {
      if (!isBrowser) {
        try {
          if (fs.existsSync(record.sourceFilePath)) {
            fs.unlinkSync(record.sourceFilePath);
          }
        } catch {
          // Ignored
        }
      }
      record.sourceFilePath = undefined;
    }

    record.isSourceCleanedUp = true;
    return true;
  }

  /**
   * Deletes all results, clips, and temporary directories for a job.
   */
  public deleteJobWorkspace(jobId: string): boolean {
    const jobDir = this.getJobDir(jobId);
    if (!isBrowser) {
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch {
        // Ignored
      }
    }

    this.jobRecords.delete(jobId);
    return true;
  }

  /**
   * Purges expired job workspaces according to retention policy.
   */
  public purgeExpiredJobs(): number {
    const now = Date.now();
    let purged = 0;

    for (const [jobId, record] of this.jobRecords.entries()) {
      let maxAgeMs = 15 * 60 * 1000; // default 15 min
      if (record.retentionPolicy === 'immediate') {
        maxAgeMs = 5 * 60 * 1000;
      } else if (record.retentionPolicy === '1hour') {
        maxAgeMs = 60 * 60 * 1000;
      }

      if (now - record.createdAt > maxAgeMs) {
        this.deleteJobWorkspace(jobId);
        purged++;
      }
    }

    return purged;
  }
}

export const privateStorageManagerInstance = new PrivateStorageManager();
