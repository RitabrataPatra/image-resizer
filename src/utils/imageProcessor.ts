import { CropRect } from './dimensions';
import {
  findJpegQualityForSizeRange,
  SizeTargetResult,
} from './sizeTargeting';

export const MAX_UPLOAD_MB = 30;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export interface LoadedImageInfo {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKB: number;
  name: string;
  type: string;
  element: HTMLImageElement;
}

export interface ProcessedImageOutput extends SizeTargetResult<Blob> {
  previewUrl: string;
  width: number;
  height: number;
  fileName: string;
}

/**
 * Validates that an uploaded file is a JPG or PNG within the allowed size limit.
 * Returns null if valid, or a clear user-facing error message string.
 */
export function validateImageFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
  const isAllowedExt = ['jpg', 'jpeg', 'png'].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    const detected = file.type || (ext ? `.${ext}` : 'unknown format');
    return `Unsupported file type (${detected}). Please select a JPG or PNG image.`;
  }

  if (file.size === 0) {
    return 'The selected file is empty (0 KB). Please choose a valid JPG or PNG photo.';
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File is too large (${fileMB} MB). Please choose a photo under ${MAX_UPLOAD_MB} MB.`;
  }

  return null;
}

/**
 * Decodes an image file in the browser using an Object URL (memory-efficient for 10 MB+ phone photos).
 */
export function loadImageFromFile(file: File): Promise<LoadedImageInfo> {
  return new Promise((resolve, reject) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read image dimensions. The file may be corrupted.'));
        return;
      }

      resolve({
        file,
        objectUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeBytes: file.size,
        sizeKB: Number((file.size / 1024).toFixed(2)),
        name: file.name,
        type: file.type || 'image/jpeg',
        element: img,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          'Unable to decode this image. Please make sure it is a valid JPG or PNG file.'
        )
      );
    };

    img.src = objectUrl;
  });
}

/**
 * Encodes an HTMLCanvasElement to a JPEG Blob at the specified quality (0.01 - 1.0).
 */
export function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Browser failed to encode JPEG image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Crops the source image using normalized CropRect (0..1) and resizes cleanly
 * to (targetWidth x targetHeight) using stepped downsampling for large 10MB+ phone photos.
 */
export function renderCroppedCanvas(
  sourceImg: HTMLImageElement,
  crop: CropRect,
  targetWidth: number,
  targetHeight: number,
  rotationDeg: number = 0
): HTMLCanvasElement {
  const naturalW = sourceImg.naturalWidth;
  const naturalH = sourceImg.naturalHeight;

  // First, if rotated by 90/180/270 degrees, orient onto a working canvas
  let orientedSource: CanvasImageSource = sourceImg;
  let orientedW = naturalW;
  let orientedH = naturalH;

  const normRot = ((rotationDeg % 360) + 360) % 360;
  if (normRot !== 0) {
    const rotCanvas = document.createElement('canvas');
    if (normRot === 90 || normRot === 270) {
      rotCanvas.width = naturalH;
      rotCanvas.height = naturalW;
    } else {
      rotCanvas.width = naturalW;
      rotCanvas.height = naturalH;
    }
    const rCtx = rotCanvas.getContext('2d');
    if (rCtx) {
      rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rCtx.rotate((normRot * Math.PI) / 180);
      rCtx.drawImage(sourceImg, -naturalW / 2, -naturalH / 2);
      orientedSource = rotCanvas;
      orientedW = rotCanvas.width;
      orientedH = rotCanvas.height;
    }
  }

  const sx = Math.max(0, Math.round(crop.x * orientedW));
  const sy = Math.max(0, Math.round(crop.y * orientedH));
  const sw = Math.max(1, Math.min(orientedW - sx, Math.round(crop.width * orientedW)));
  const sh = Math.max(1, Math.min(orientedH - sy, Math.round(crop.height * orientedH)));

  const outW = Math.max(1, Math.round(targetWidth));
  const outH = Math.max(1, Math.round(targetHeight));

  // Progressive half-stepping when downscaling by more than 2x (prevents aliasing on 12MP phone photos)
  let curCanvas = document.createElement('canvas');
  let curW = sw;
  let curH = sh;

  if (curW > outW * 2.2 || curH > outH * 2.2) {
    curW = Math.max(outW, Math.floor(curW * 0.5));
    curH = Math.max(outH, Math.floor(curH * 0.5));
    curCanvas.width = curW;
    curCanvas.height = curH;
    const stepCtx = curCanvas.getContext('2d');
    if (stepCtx) {
      stepCtx.fillStyle = '#FFFFFF';
      stepCtx.fillRect(0, 0, curW, curH);
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(orientedSource, sx, sy, sw, sh, 0, 0, curW, curH);
    }

    while (curW > outW * 2.2 || curH > outH * 2.2) {
      const nextW = Math.max(outW, Math.floor(curW * 0.5));
      const nextH = Math.max(outH, Math.floor(curH * 0.5));
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextW;
      nextCanvas.height = nextH;
      const nCtx = nextCanvas.getContext('2d');
      if (nCtx) {
        nCtx.imageSmoothingEnabled = true;
        nCtx.imageSmoothingQuality = 'high';
        nCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);
      }
      curCanvas = nextCanvas;
      curW = nextW;
      curH = nextH;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outW;
    finalCanvas.height = outH;
    const fCtx = finalCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#FFFFFF';
      fCtx.fillRect(0, 0, outW, outH);
      fCtx.imageSmoothingEnabled = true;
      fCtx.imageSmoothingQuality = 'high';
      fCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, outW, outH);
    }
    return finalCanvas;
  }

  // Single-step draw when scale ratio is <= 2.2x
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = outW;
  finalCanvas.height = outH;
  const ctx = finalCanvas.getContext('2d');
  if (ctx) {
    // Fill solid white background so transparent PNGs become clean white-background JPEGs
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(orientedSource, sx, sy, sw, sh, 0, 0, outW, outH);
  }
  return finalCanvas;
}

/**
 * Full pipeline: crops, resizes on canvas, and binary-searches JPEG quality
 * to hit [minKB, maxKB].
 */
export async function processImageToTargetSpec(params: {
  source: LoadedImageInfo;
  crop: CropRect;
  targetWidth: number;
  targetHeight: number;
  minKB: number;
  maxKB: number;
  rotationDeg?: number;
}): Promise<ProcessedImageOutput> {
  const {
    source,
    crop,
    targetWidth,
    targetHeight,
    minKB,
    maxKB,
    rotationDeg = 0,
  } = params;

  const canvas = renderCroppedCanvas(
    source.element,
    crop,
    targetWidth,
    targetHeight,
    rotationDeg
  );

  const result = await findJpegQualityForSizeRange(
    (q) => canvasToJpegBlob(canvas, q),
    minKB,
    maxKB
  );

  const baseName = source.name.replace(/\.[^.]+$/, '') || 'resized-image';
  const fileName = `${baseName}-${canvas.width}x${canvas.height}-${Math.round(result.sizeKB)}kb.jpg`;
  const previewUrl = URL.createObjectURL(result.blob);

  return {
    ...result,
    previewUrl,
    width: canvas.width,
    height: canvas.height,
    fileName,
  };
}

/**
 * Generates a realistic sample portrait or signature File in-browser for instant testing.
 */
export async function createSampleImageFile(
  kind: 'portrait' | 'signature'
): Promise<File> {
  const canvas = document.createElement('canvas');
  if (kind === 'portrait') {
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d')!;

    // Studio backdrop gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1500);
    bgGrad.addColorStop(0, '#dbeafe');
    bgGrad.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 1500);

    // Subtle photographic grain / texture so JPEG compression behaves like a real camera photo
    for (let i = 0; i < 18000; i++) {
      const x = (i * 7919) % 1200;
      const y = (i * 6271) % 1500;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(15,23,42,0.035)' : 'rgba(255,255,255,0.045)';
      ctx.fillRect(x, y, 4, 4);
    }

    // Shoulders / Suit jacket
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(600, 1420, 440, 340, 0, Math.PI, 0, false);
    ctx.fill();

    // Shirt collar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(490, 1120);
    ctx.lineTo(600, 1340);
    ctx.lineTo(710, 1120);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#d9a074';
    ctx.fillRect(525, 930, 150, 210);

    // Head
    ctx.fillStyle = '#e6b187';
    ctx.beginPath();
    ctx.ellipse(600, 680, 235, 305, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(600, 460, 245, 145, 0, Math.PI, 0, false);
    ctx.fill();

    // Eyes & eyebrows
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(510, 650, 20, 0, Math.PI * 2);
    ctx.arc(690, 650, 20, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(600, 770, 65, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Add realistic natural camera sensor luminance grain so JPEG compression behaves like a real photo
    const imgData = ctx.getImageData(0, 0, 1200, 1500);
    const data = imgData.data;
    let seed = 1337;
    for (let i = 0; i < data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = ((seed & 0xff) - 128) * 0.08;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const blob = await canvasToJpegBlob(canvas, 0.94);
    return new File([blob], 'sample-passport-photo.jpg', { type: 'image/jpeg' });
  } else {
    canvas.width = 1000;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    // Paper texture background
    ctx.fillStyle = '#fcfaf5';
    ctx.fillRect(0, 0, 1000, 360);

    // Handwritten signature strokes in dark blue fountain pen ink
    ctx.strokeStyle = '#0f296b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(120, 230);
    ctx.bezierCurveTo(160, 80, 240, 90, 220, 220);
    ctx.bezierCurveTo(210, 260, 290, 140, 340, 205);
    ctx.bezierCurveTo(390, 245, 430, 130, 480, 200);
    ctx.bezierCurveTo(520, 240, 600, 100, 650, 210);
    ctx.bezierCurveTo(700, 250, 770, 165, 860, 190);
    ctx.stroke();

    // Signature flourish underline
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(170, 270);
    ctx.quadraticCurveTo(510, 235, 840, 255);
    ctx.stroke();

    // Subtle paper fiber grain so JPEG quality range spans 5 KB - 35 KB realistically
    const imgData = ctx.getImageData(0, 0, 1000, 360);
    const data = imgData.data;
    let seed = 4242;
    for (let i = 0; i < data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = ((seed & 0xff) - 128) * 0.09;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const blob = await canvasToJpegBlob(canvas, 0.92);
    return new File([blob], 'sample-signature.jpg', { type: 'image/jpeg' });
  }
}
