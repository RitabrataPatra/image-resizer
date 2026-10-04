export interface CropRect {
  /** Normalized 0..1 X offset from left of source image */
  x: number;
  /** Normalized 0..1 Y offset from top of source image */
  y: number;
  /** Normalized 0..1 width of crop box */
  width: number;
  /** Normalized 0..1 height of crop box */
  height: number;
}

/**
 * Converts physical length in centimeters at a given DPI into pixels.
 * Formula: pixels = round((cm / 2.54) * dpi)
 */
export function cmToPixels(cm: number, dpi: number): number {
  if (!Number.isFinite(cm) || !Number.isFinite(dpi) || cm <= 0 || dpi <= 0) {
    return 0;
  }
  return Math.max(1, Math.round((cm / 2.54) * dpi));
}

/**
 * Converts pixel length at a given DPI into centimeters (rounded to 2 decimal places).
 */
export function pixelsToCm(px: number, dpi: number): number {
  if (!Number.isFinite(px) || !Number.isFinite(dpi) || px <= 0 || dpi <= 0) {
    return 0;
  }
  return Math.round(((px / dpi) * 2.54) * 100) / 100;
}

/**
 * Computes a centered normalized CropRect (0..1) inside an image of (imageWidth x imageHeight)
 * that matches the requested targetAspect (width / height).
 * If targetAspect is null/undefined or <= 0, returns the full image crop.
 */
export function getCenteredCropForAspect(
  imageWidth: number,
  imageHeight: number,
  targetAspect?: number | null
): CropRect {
  if (
    !targetAspect ||
    !Number.isFinite(targetAspect) ||
    targetAspect <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const imageAspect = imageWidth / imageHeight;

  if (Math.abs(imageAspect - targetAspect) < 0.001) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  if (imageAspect > targetAspect) {
    // Source image is wider than target aspect ratio: full height, centered width
    const normWidth = targetAspect / imageAspect;
    return {
      x: (1 - normWidth) / 2,
      y: 0,
      width: normWidth,
      height: 1,
    };
  } else {
    // Source image is taller than target aspect ratio: full width, centered height
    const normHeight = imageAspect / targetAspect;
    return {
      x: 0,
      y: (1 - normHeight) / 2,
      width: 1,
      height: normHeight,
    };
  }
}

/**
 * Formats byte count into a clean human-readable KB or MB string.
 */
export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB (${Math.round(kb)} KB)`;
  }
  if (kb >= 100) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${kb.toFixed(2)} KB`;
}
