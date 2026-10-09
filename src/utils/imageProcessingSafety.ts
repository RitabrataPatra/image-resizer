import type { CropRect } from './dimensions';

// RGBA storage is about 4 bytes per pixel; caps keep individual canvas allocations bounded.
export const MAX_SOURCE_IMAGE_PIXELS = 16_000_000;
export const MAX_OUTPUT_IMAGE_PIXELS = 12_000_000;
// Also reserves space for repeated encoder work and retained size-search candidates.
export const MAX_WORKING_CANVAS_PIXELS = 48_000_000;

export class ImageProcessingLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingLimitError';
  }
}

export function validateSourceImageDimensions(
  width: number,
  height: number
): void {
  validatePixelDimensions(
    width,
    height,
    MAX_SOURCE_IMAGE_PIXELS,
    'This image is too large to process safely. Choose an image with at most 16 megapixels.'
  );
}

export function validateCanvasDimensions(
  width: number,
  height: number
): void {
  validatePixelDimensions(
    width,
    height,
    MAX_SOURCE_IMAGE_PIXELS,
    'The browser could not prepare this image safely. Try a smaller image or smaller dimensions.'
  );
}

export function validateProcessingDimensions(input: {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  crop: CropRect;
  rotationDeg: number;
}): void {
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, crop, rotationDeg } =
    input;

  validateSourceImageDimensions(sourceWidth, sourceHeight);

  const outputWidth = Math.round(targetWidth);
  const outputHeight = Math.round(targetHeight);
  validatePixelDimensions(
    outputWidth,
    outputHeight,
    MAX_OUTPUT_IMAGE_PIXELS,
    'The requested output dimensions are too large to process safely. Choose smaller width, height, or physical size/DPI values.'
  );

  if (
    ![crop.x, crop.y, crop.width, crop.height, rotationDeg].every(Number.isFinite) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width <= 0 ||
    crop.height <= 0 ||
    crop.x + crop.width > 1.000001 ||
    crop.y + crop.height > 1.000001
  ) {
    throw new ImageProcessingLimitError(
      'The selected crop is not valid. Reset the crop and try again.'
    );
  }

  const normalizedRotation = ((rotationDeg % 360) + 360) % 360;
  const rotated = normalizedRotation !== 0;
  const orientedWidth =
    normalizedRotation === 90 || normalizedRotation === 270
      ? sourceHeight
      : sourceWidth;
  const orientedHeight =
    normalizedRotation === 90 || normalizedRotation === 270
      ? sourceWidth
      : sourceHeight;
  const cropWidth = Math.max(1, Math.round(crop.width * orientedWidth));
  const cropHeight = Math.max(1, Math.round(crop.height * orientedHeight));
  const cropPixels = cropWidth * cropHeight;
  const outputPixels = outputWidth * outputHeight;
  const encodingWorkspacePixels = outputPixels * 2;
  const needsProgressiveResize =
    cropWidth > outputWidth * 2.2 || cropHeight > outputHeight * 2.2;

  let progressiveCanvasPixels = 0;
  if (needsProgressiveResize) {
    const firstStepWidth = Math.max(outputWidth, Math.floor(cropWidth * 0.5));
    const firstStepHeight = Math.max(outputHeight, Math.floor(cropHeight * 0.5));
    progressiveCanvasPixels = firstStepWidth * firstStepHeight * 2;
  }

  const estimatedWorkingPixels =
    sourceWidth * sourceHeight +
    (rotated ? sourceWidth * sourceHeight * 2 : 0) +
    progressiveCanvasPixels +
    outputPixels +
    encodingWorkspacePixels;

  if (
    !Number.isSafeInteger(cropPixels) ||
    !Number.isSafeInteger(estimatedWorkingPixels) ||
    estimatedWorkingPixels > MAX_WORKING_CANVAS_PIXELS
  ) {
    throw new ImageProcessingLimitError(
      'This resize would use too much memory. Try a smaller output size or crop a smaller area.'
    );
  }
}

function validatePixelDimensions(
  width: number,
  height: number,
  maxPixels: number,
  message: string
): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isSafeInteger(width * height) ||
    width * height > maxPixels
  ) {
    throw new ImageProcessingLimitError(message);
  }
}
