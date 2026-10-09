import assert from 'node:assert/strict';
import test from 'node:test';
import { cmToPixels } from './dimensions';
import {
  ImageProcessingLimitError,
  validateProcessingDimensions,
  validateSourceImageDimensions,
} from './imageProcessingSafety';

const fullImageCrop = { x: 0, y: 0, width: 1, height: 1 };

test('allows ordinary image dimensions and output requests', () => {
  assert.doesNotThrow(() =>
    validateProcessingDimensions({
      sourceWidth: 4000,
      sourceHeight: 3000,
      targetWidth: 4000,
      targetHeight: 3000,
      crop: fullImageCrop,
      rotationDeg: 0,
    })
  );
});

test('rejects a decoded source image above the source pixel limit', () => {
  assert.throws(
    () => validateSourceImageDimensions(5000, 4000),
    ImageProcessingLimitError
  );
});

test('rejects requested output dimensions above the output pixel limit', () => {
  assert.throws(
    () =>
      validateProcessingDimensions({
        sourceWidth: 4000,
        sourceHeight: 3000,
        targetWidth: 8000,
        targetHeight: 8000,
        crop: fullImageCrop,
        rotationDeg: 0,
      }),
    /requested output dimensions are too large/
  );
});

test('rejects excessive dimensions calculated from physical size and DPI', () => {
  const width = cmToPixels(100, 1200);
  const height = cmToPixels(100, 1200);

  assert.throws(
    () =>
      validateProcessingDimensions({
        sourceWidth: 4000,
        sourceHeight: 3000,
        targetWidth: width,
        targetHeight: height,
        crop: fullImageCrop,
        rotationDeg: 0,
      }),
    /requested output dimensions are too large/
  );
});

test('accounts for rotated source and progressive crop canvases', () => {
  const request = {
    sourceWidth: 4000,
    sourceHeight: 4000,
    targetWidth: 2000,
    targetHeight: 2000,
    crop: fullImageCrop,
  };

  assert.doesNotThrow(() =>
    validateProcessingDimensions({ ...request, rotationDeg: 0 })
  );
  assert.throws(
    () =>
      validateProcessingDimensions({
        ...request,
        rotationDeg: 90,
      }),
    /would use too much memory/
  );
});

test('allows recovery when an oversized output request is reduced', () => {
  assert.throws(
    () =>
      validateProcessingDimensions({
        sourceWidth: 4000,
        sourceHeight: 3000,
        targetWidth: 8000,
        targetHeight: 8000,
        crop: fullImageCrop,
        rotationDeg: 0,
      }),
    ImageProcessingLimitError
  );

  assert.doesNotThrow(() =>
    validateProcessingDimensions({
      sourceWidth: 4000,
      sourceHeight: 3000,
      targetWidth: 1600,
      targetHeight: 1200,
      crop: fullImageCrop,
      rotationDeg: 0,
    })
  );
});
