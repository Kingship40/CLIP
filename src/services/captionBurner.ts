/**
 * Permanent Hardcoded / Burned-in Caption Renderer.
 * Renders synchronized subtitles with customizable presets, smart face avoidance,
 * word-level highlighting, and ASS (Advanced SubStation Alpha) generation for FFmpeg.
 */

import { CaptionSettings, SubtitleSegment } from '../types';

export interface FaceBoundingRegion {
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  width: number;
  height: number;
}

/**
 * Draws hardcoded, burned-in subtitles directly onto the HTML5 Canvas context.
 * Used during video clipping export so captions are permanently etched into video frames.
 */
export function renderCaptionToCanvas(
  ctx: CanvasRenderingContext2D,
  subtitles: SubtitleSegment[],
  settings: CaptionSettings,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  faceRegion?: FaceBoundingRegion | null,
  clipStartTime: number = 0
): void {
  if (!settings || !settings.enabled || !subtitles || subtitles.length === 0) return;

  // 1. Draw Opening Hook Title (First 3.2 seconds)
  const elapsedInClip = currentTime >= clipStartTime ? (currentTime - clipStartTime) : currentTime;
  const isOpening = elapsedInClip >= 0 && elapsedInClip <= 3.2;
  if (settings.showOpeningTitle && settings.openingTitle && isOpening) {
    drawOpeningHookTitle(ctx, settings.openingTitle, canvasWidth, canvasHeight);
  }

  // 2. Find currently active subtitle line (support both absolute video timestamps and relative clip timestamps)
  const absTime = currentTime + clipStartTime;
  const activeSub = subtitles.find(
    (s) => (currentTime >= s.start && currentTime <= s.end) ||
           (elapsedInClip >= s.start && elapsedInClip <= s.end) ||
           (absTime >= s.start && absTime <= s.end)
  );
  if (!activeSub || !activeSub.text.trim()) return;

  // 3. Determine base font size scaled to canvas dimensions
  const scaleRatio = canvasHeight / 1280.0;
  const baseSizePx = getFontSizePx(settings.fontSize, scaleRatio);

  ctx.save();
  ctx.font = `900 ${baseSizePx}px "Inter", "Segoe UI", system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 4. Wrap text into lines fitting within 86% of canvas width
  const maxLineWidth = canvasWidth * 0.86;
  const rawWords = activeSub.text.trim().split(/\s+/);
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentLineWidth = 0;

  const spaceWidth = ctx.measureText(' ').width;

  for (const word of rawWords) {
    const wordWidth = ctx.measureText(word).width;
    if (currentLineWidth + wordWidth > maxLineWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [word];
      currentLineWidth = wordWidth + spaceWidth;
    } else {
      currentLine.push(word);
      currentLineWidth += wordWidth + spaceWidth;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // 5. Calculate vertical baseline with Smart Face Avoidance
  const lineHeight = baseSizePx * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  let targetCenterY = canvasHeight * 0.82; // Default bottom

  if (settings.position === 'top') {
    targetCenterY = canvasHeight * 0.12;
  } else if (settings.position === 'middle') {
    targetCenterY = canvasHeight * 0.50;
  } else {
    targetCenterY = canvasHeight * 0.82;
  }

  // Smart Face Avoidance Check
  if (faceRegion && faceRegion.width > 5) {
    const faceTopPx = (faceRegion.y / 100) * canvasHeight - (faceRegion.height / 200) * canvasHeight;
    const faceBottomPx = (faceRegion.y / 100) * canvasHeight + (faceRegion.height / 200) * canvasHeight;
    const captionTop = targetCenterY - totalTextHeight / 2;
    const captionBottom = targetCenterY + totalTextHeight / 2;

    // Check vertical overlap
    const overlaps = captionTop < faceBottomPx && captionBottom > faceTopPx;
    if (overlaps) {
      if (faceTopPx > canvasHeight * 0.4) {
        // Face is middle-to-bottom: Shift caption up
        targetCenterY = Math.max(canvasHeight * 0.15, faceTopPx - totalTextHeight / 2 - 20);
      } else {
        // Face is near top: Shift caption down safely below chin
        targetCenterY = Math.min(canvasHeight * 0.88, faceBottomPx + totalTextHeight / 2 + 25);
      }
    }
  }

  // 6. Render according to preset style
  const highlightWords = (activeSub.highlightWords || []).map((w) => w.toLowerCase().replace(/[^\w]/g, ''));
  const highlightColor = settings.highlightColor || '#FACC15';
  const textColor = settings.textColor || '#FFFFFF';

  const startY = targetCenterY - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((lineWords, lineIdx) => {
    const lineY = startY + lineIdx * lineHeight;
    const fullLineStr = lineWords.join(' ');
    const lineMetric = ctx.measureText(fullLineStr);
    const lineW = lineMetric.width;

    // A. Draw Preset-specific Backdrop
    drawPresetBackdrop(ctx, settings.preset, lineW, baseSizePx, canvasWidth / 2, lineY);

    // B. Draw Words with Highlight coloring and Outlines
    let currentX = canvasWidth / 2 - lineW / 2;

    for (const word of lineWords) {
      const clean = word.toLowerCase().replace(/[^\w]/g, '');
      const isHighlighted = highlightWords.some((hw) => clean.includes(hw));
      const wordMetrics = ctx.measureText(word);
      const wordW = wordMetrics.width;
      const wordCenterX = currentX + wordW / 2;

      ctx.save();

      if (settings.preset === 'karaoke') {
        // Neon karaoke stroke outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(4, Math.round(baseSizePx * 0.16));
        ctx.lineJoin = 'round';
        ctx.strokeText(word, wordCenterX, lineY);

        if (isHighlighted) {
          ctx.shadowColor = highlightColor;
          ctx.shadowBlur = 14;
        }
        ctx.fillStyle = isHighlighted ? highlightColor : textColor;
        ctx.fillText(word, wordCenterX, lineY);
      } else if (settings.preset === 'hormozi') {
        // High-energy Hormozi bold typography
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = Math.max(3, Math.round(baseSizePx * 0.12));
        ctx.lineJoin = 'round';
        ctx.strokeText(word, wordCenterX, lineY);

        if (isHighlighted) {
          ctx.fillStyle = highlightColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowOffsetY = 3;
        } else {
          ctx.fillStyle = textColor;
        }
        ctx.fillText(word, wordCenterX, lineY);
      } else if (settings.preset === 'neon') {
        // Futuristic Cyber Neon
        ctx.strokeStyle = '#2e1065';
        ctx.lineWidth = Math.max(3, Math.round(baseSizePx * 0.1));
        ctx.strokeText(word, wordCenterX, lineY);

        ctx.shadowColor = isHighlighted ? highlightColor : '#c084fc';
        ctx.shadowBlur = isHighlighted ? 16 : 8;
        ctx.fillStyle = isHighlighted ? highlightColor : '#f3e8ff';
        ctx.fillText(word, wordCenterX, lineY);
      } else {
        // Cinematic / Minimalist Clean
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = Math.max(2, Math.round(baseSizePx * 0.08));
        ctx.strokeText(word, wordCenterX, lineY);

        ctx.fillStyle = isHighlighted ? highlightColor : textColor;
        ctx.fillText(word, wordCenterX, lineY);
      }

      ctx.restore();
      currentX += wordW + spaceWidth;
    }
  });

  ctx.restore();
}

/**
 * Draws backdrop pill/container according to preset.
 */
function drawPresetBackdrop(
  ctx: CanvasRenderingContext2D,
  preset: string,
  lineWidth: number,
  fontSize: number,
  centerX: number,
  centerY: number
): void {
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.28;
  const boxW = lineWidth + padX * 2;
  const boxH = fontSize * 1.35 + padY * 2;
  const x = centerX - boxW / 2;
  const y = centerY - boxH / 2;
  const radius = Math.round(boxH * 0.25);

  ctx.save();

  if (preset === 'hormozi') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, x, y, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
  } else if (preset === 'neon') {
    ctx.fillStyle = 'rgba(15, 7, 35, 0.9)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x, y, boxW, boxH, radius);
    ctx.fill();
    ctx.stroke();
  } else if (preset === 'cinematic') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    drawRoundedRect(ctx, x, y, boxW, boxH, 4);
    ctx.fill();
  } else if (preset === 'minimal') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    drawRoundedRect(ctx, x, y, boxW, boxH, radius);
    ctx.fill();
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws the opening hook title banner in the top portion of the frame.
 */
function drawOpeningHookTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();
  const fontSize = Math.max(16, Math.round(canvasHeight * 0.024));
  ctx.font = `900 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textMetrics = ctx.measureText(title.toUpperCase());
  const boxW = textMetrics.width + fontSize * 1.6;
  const boxH = fontSize * 2.0;
  const x = canvasWidth / 2 - boxW / 2;
  const y = canvasHeight * 0.08;

  // Gradient Pill
  const grad = ctx.createLinearGradient(x, y, x + boxW, y);
  grad.addColorStop(0, '#f97316'); // Vibrant orange
  grad.addColorStop(0.5, '#ef4444'); // Red
  grad.addColorStop(1, '#8b5cf6'); // Purple

  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  drawRoundedRect(ctx, x, y, boxW, boxH, boxH / 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(title.toUpperCase(), canvasWidth / 2, y + boxH / 2);
  ctx.restore();
}

function getFontSizePx(size: 'sm' | 'md' | 'lg' | 'xl', scaleRatio: number): number {
  let base = 32;
  switch (size) {
    case 'sm': base = 26; break;
    case 'md': base = 34; break;
    case 'lg': base = 42; break;
    case 'xl': base = 50; break;
  }
  return Math.round(base * Math.max(0.6, scaleRatio));
}

/**
 * Converts hexadecimal color string (#RRGGBB) to ASS color format (&H00BBGGRR).
 */
export function hexToAssColor(hex: string, alpha = '00'): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = clean.slice(0, 2);
    const g = clean.slice(2, 4);
    const b = clean.slice(4, 6);
    return `&H${alpha}${b}${g}${r}&`;
  }
  return `&H${alpha}FFFFFF&`;
}

/**
 * Generates an Advanced SubStation Alpha (.ass) subtitle file string with hardcoded styling for FFmpeg.
 */
export function generateAssSubtitleFile(
  subtitles: SubtitleSegment[],
  settings: CaptionSettings,
  videoWidth = 720,
  videoHeight = 1280
): string {
  function formatAssTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  // Alignment: 2 = Bottom-Center, 5 = Middle-Center, 8 = Top-Center
  let alignment = 2;
  let marginV = Math.round(videoHeight * 0.12);
  if (settings.position === 'top') {
    alignment = 8;
    marginV = Math.round(videoHeight * 0.08);
  } else if (settings.position === 'middle') {
    alignment = 5;
    marginV = 0;
  }

  const primaryColor = hexToAssColor(settings.textColor || '#FFFFFF');
  const highlightColor = hexToAssColor(settings.highlightColor || '#FACC15');
  const outlineColor = '&H00000000&';
  const backColor = '&H80000000&';
  const fontSize = Math.round((videoHeight / 1280) * (settings.fontSize === 'xl' ? 48 : settings.fontSize === 'lg' ? 40 : 34));

  let ass = `[Script Info]
Title: Hardcoded Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,${fontSize},${primaryColor},${primaryColor},${outlineColor},${backColor},-1,0,0,0,100,100,1,0,1,3,2,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  subtitles.forEach((s) => {
    const startStr = formatAssTime(s.start);
    const endStr = formatAssTime(s.end);
    let text = s.text.replace(/\r?\n/g, '\\N');

    // Highlight keywords with ASS color override tag
    if (s.highlightWords && s.highlightWords.length > 0) {
      for (const hw of s.highlightWords) {
        const regex = new RegExp(`\\b(${hw})\\b`, 'gi');
        text = text.replace(regex, `{\\c${highlightColor}}$1{\\c${primaryColor}}`);
      }
    }

    ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${text}\n`;
  });

  return ass;
}
