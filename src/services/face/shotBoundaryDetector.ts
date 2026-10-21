/**
 * Shot Boundary / Scene Cut Detector.
 * Compares RGB luminance and chromaticity histograms between consecutive frames.
 * Prevents dragging stale face tracks and camera positions across video scene cuts.
 */

export class ShotBoundaryDetector {
  private prevHistogram: Float32Array | null = null;
  private prevLuminance: number = 0;
  private threshold: number;

  constructor(threshold: number = 0.38) {
    this.threshold = threshold;
  }

  public reset(): void {
    this.prevHistogram = null;
    this.prevLuminance = 0;
  }

  /**
   * Analyzes an image canvas or video frame for abrupt cut transitions.
   * Returns true if a scene cut was detected.
   */
  public isSceneCut(canvasOrVideo: HTMLCanvasElement | HTMLVideoElement): boolean {
    let ctx: CanvasRenderingContext2D | null = null;
    let canvas: HTMLCanvasElement;

    if ('getContext' in canvasOrVideo) {
      canvas = canvasOrVideo as HTMLCanvasElement;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    } else {
      // Downsampled thumbnail canvas for fast 60fps shot boundary check
      canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 36;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(canvasOrVideo, 0, 0, 64, 36);
      }
    }

    if (!ctx) return false;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const totalPixels = canvas.width * canvas.height;

    // 16 bins for Red, Green, Blue (48 bins total)
    const hist = new Float32Array(48);
    let totalLum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const rBin = Math.min(15, Math.floor(data[i] / 16));
      const gBin = Math.min(15, Math.floor(data[i + 1] / 16));
      const bBin = Math.min(15, Math.floor(data[i + 2] / 16));

      hist[rBin]++;
      hist[16 + gBin]++;
      hist[32 + bBin]++;

      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Normalize histogram
    for (let i = 0; i < 48; i++) {
      hist[i] /= totalPixels;
    }

    const currentLum = totalLum / totalPixels;

    // If first frame, save baseline
    if (!this.prevHistogram) {
      this.prevHistogram = hist;
      this.prevLuminance = currentLum;
      return false;
    }

    // Compute Manhattan histogram distance
    let histDiff = 0;
    for (let i = 0; i < 48; i++) {
      histDiff += Math.abs(hist[i] - this.prevHistogram[i]);
    }
    histDiff /= 3.0; // Normalized between 0 and 1

    const lumDiff = Math.abs(currentLum - this.prevLuminance) / 255.0;
    const combinedScore = 0.75 * histDiff + 0.25 * lumDiff;

    this.prevHistogram = hist;
    this.prevLuminance = currentLum;

    return combinedScore >= this.threshold;
  }
}
