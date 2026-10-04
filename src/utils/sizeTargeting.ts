export type SizeTargetStatus =
  | 'in_range'
  | 'below_min'
  | 'above_max'
  | 'closest_discrete_step';

export interface SizeTargetResult<T extends { size: number }> {
  blob: T;
  sizeBytes: number;
  sizeKB: number;
  quality: number;
  inRange: boolean;
  status: SizeTargetStatus;
  iterations: number;
  explanation: string;
}

export interface SizeTargetOptions {
  minQuality?: number;
  maxQuality?: number;
  maxIterations?: number;
}

/**
 * Computes distance in bytes from a value to the interval [minBytes, maxBytes].
 * Returns 0 if value is inside the interval.
 */
export function distanceToRange(
  value: number,
  minBytes: number,
  maxBytes: number
): number {
  if (value < minBytes) return minBytes - value;
  if (value > maxBytes) return value - maxBytes;
  return 0;
}

/**
 * Binary-searches JPEG quality in [minQuality, maxQuality] so the encoded output
 * lands inside [minKB, maxKB].
 *
 * If the range cannot be hit, returns the closest result and explains why in plain language.
 */
export async function findJpegQualityForSizeRange<T extends { size: number }>(
  encodeAtQuality: (quality: number) => Promise<T>,
  minKB: number,
  maxKB: number,
  options: SizeTargetOptions = {}
): Promise<SizeTargetResult<T>> {
  const minQuality = options.minQuality ?? 0.01;
  const maxQuality = options.maxQuality ?? 1.0;
  const maxIterations = options.maxIterations ?? 10;

  const normalizedMinKB = Math.max(0, Math.min(minKB, maxKB));
  const normalizedMaxKB = Math.max(normalizedMinKB, Math.max(minKB, maxKB));

  const minBytes = normalizedMinKB * 1024;
  const maxBytes = normalizedMaxKB * 1024;

  let iterations = 0;

  // 1. Test maximum quality (1.0) first
  iterations += 1;
  const maxBlob = await encodeAtQuality(maxQuality);
  const maxBlobKB = Number((maxBlob.size / 1024).toFixed(2));

  if (maxBlob.size >= minBytes && maxBlob.size <= maxBytes) {
    return {
      blob: maxBlob,
      sizeBytes: maxBlob.size,
      sizeKB: maxBlobKB,
      quality: maxQuality,
      inRange: true,
      status: 'in_range',
      iterations,
      explanation: `Target met at 100% JPEG quality (${maxBlobKB} KB is within ${normalizedMinKB}–${normalizedMaxKB} KB).`,
    };
  }

  if (maxBlob.size < minBytes) {
    return {
      blob: maxBlob,
      sizeBytes: maxBlob.size,
      sizeKB: maxBlobKB,
      quality: maxQuality,
      inRange: false,
      status: 'below_min',
      iterations,
      explanation: `Even at 100% maximum JPEG quality, this image is ${maxBlobKB} KB, which is smaller than your ${normalizedMinKB} KB minimum. Images with small dimensions or large flat areas (like signatures on white paper) compress into very few bytes. To make the file size larger, increase the target width/height or DPI.`,
    };
  }

  // 2. Test minimum quality (0.01) to verify if the target is reachable
  iterations += 1;
  const minBlob = await encodeAtQuality(minQuality);
  const minBlobKB = Number((minBlob.size / 1024).toFixed(2));

  if (minBlob.size > maxBytes) {
    return {
      blob: minBlob,
      sizeBytes: minBlob.size,
      sizeKB: minBlobKB,
      quality: minQuality,
      inRange: false,
      status: 'above_max',
      iterations,
      explanation: `Even at the lowest JPEG quality (${Math.round(minQuality * 100)}%), the file is ${minBlobKB} KB, which is above your ${normalizedMaxKB} KB limit. The pixel dimensions are too large to compress down to ${normalizedMaxKB} KB. Try lowering the pixel width and height or reducing the DPI.`,
    };
  }

  // Track best in-range candidate (preferring highest quality inside the range)
  let bestInRange: { blob: T; quality: number } | null =
    minBlob.size >= minBytes && minBlob.size <= maxBytes
      ? { blob: minBlob, quality: minQuality }
      : null;

  // Track closest out-of-range candidate in case of discrete quantization jumps
  let closestCandidate: { blob: T; quality: number; distance: number } = {
    blob:
      distanceToRange(minBlob.size, minBytes, maxBytes) <=
      distanceToRange(maxBlob.size, minBytes, maxBytes)
        ? minBlob
        : maxBlob,
    quality:
      distanceToRange(minBlob.size, minBytes, maxBytes) <=
      distanceToRange(maxBlob.size, minBytes, maxBytes)
        ? minQuality
        : maxQuality,
    distance: Math.min(
      distanceToRange(minBlob.size, minBytes, maxBytes),
      distanceToRange(maxBlob.size, minBytes, maxBytes)
    ),
  };

  let low = minQuality;
  let high = maxQuality;

  for (let step = 0; step < maxIterations; step++) {
    const mid = Number(((low + high) / 2).toFixed(4));
    if (mid <= low || mid >= high) {
      break;
    }

    iterations += 1;
    const candidateBlob = await encodeAtQuality(mid);
    const dist = distanceToRange(candidateBlob.size, minBytes, maxBytes);

    if (dist < closestCandidate.distance) {
      closestCandidate = {
        blob: candidateBlob,
        quality: mid,
        distance: dist,
      };
    }

    if (candidateBlob.size >= minBytes && candidateBlob.size <= maxBytes) {
      bestInRange = { blob: candidateBlob, quality: mid };
      // Search upper half to maximize visual quality while staying <= maxBytes
      low = mid;
    } else if (candidateBlob.size > maxBytes) {
      // File is too big; reduce quality
      high = mid;
    } else {
      // File is smaller than minBytes; increase quality
      low = mid;
    }
  }

  if (bestInRange) {
    const finalKB = Number((bestInRange.blob.size / 1024).toFixed(2));
    return {
      blob: bestInRange.blob,
      sizeBytes: bestInRange.blob.size,
      sizeKB: finalKB,
      quality: bestInRange.quality,
      inRange: true,
      status: 'in_range',
      iterations,
      explanation: `Sized to ${finalKB} KB at ${Math.round(bestInRange.quality * 100)}% JPEG quality (within ${normalizedMinKB}–${normalizedMaxKB} KB).`,
    };
  }

  const closestKB = Number((closestCandidate.blob.size / 1024).toFixed(2));
  return {
    blob: closestCandidate.blob,
    sizeBytes: closestCandidate.blob.size,
    sizeKB: closestKB,
    quality: closestCandidate.quality,
    inRange: false,
    status: 'closest_discrete_step',
    iterations,
    explanation: `The target range (${normalizedMinKB}–${normalizedMaxKB} KB) is very narrow, and JPEG compression jumped past it between quality steps. Showing the closest possible result (${closestKB} KB at ${Math.round(closestCandidate.quality * 100)}% quality).`,
  };
}
