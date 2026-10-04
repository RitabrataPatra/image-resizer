import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findJpegQualityForSizeRange,
  distanceToRange,
} from './sizeTargeting.ts';
import { cmToPixels, getCenteredCropForAspect } from './dimensions.ts';

interface MockBlob {
  size: number;
  quality: number;
}

/**
 * Simulates a realistic monotonic JPEG encoder where size increases from
 * minSizeKB (at quality = 0) to maxSizeKB (at quality = 1).
 */
function createMockEncoder(minSizeKB: number, maxSizeKB: number) {
  return async (quality: number): Promise<MockBlob> => {
    // Non-linear curve typical of JPEG quantization (steeper near quality 1.0)
    const normalized = Math.pow(quality, 1.4);
    const kb = minSizeKB + (maxSizeKB - minSizeKB) * normalized;
    return {
      size: Math.round(kb * 1024),
      quality,
    };
  };
}

describe('findJpegQualityForSizeRange', () => {
  it('hits the target KB range and maximizes quality within [minKB, maxKB]', async () => {
    const encode = createMockEncoder(5, 120);
    const result = await findJpegQualityForSizeRange(encode, 20, 50);

    assert.equal(result.inRange, true);
    assert.equal(result.status, 'in_range');
    assert.ok(
      result.sizeKB >= 20 && result.sizeKB <= 50,
      `Expected sizeKB ${result.sizeKB} to be between 20 and 50`
    );
    // Should pick a high quality near the upper part of the 20-50 KB range
    assert.ok(result.sizeKB > 35, `Expected sizeKB ${result.sizeKB} to be near top of range`);
  });

  it('returns immediately if 100% quality already fits inside the range', async () => {
    const encode = createMockEncoder(8, 38);
    const result = await findJpegQualityForSizeRange(encode, 20, 50);

    assert.equal(result.inRange, true);
    assert.equal(result.status, 'in_range');
    assert.equal(result.quality, 1.0);
    assert.equal(result.iterations, 1);
    assert.equal(result.sizeKB, 38);
  });

  it('explains in plain language when even 100% quality is below minKB', async () => {
    const encode = createMockEncoder(3, 12);
    const result = await findJpegQualityForSizeRange(encode, 20, 50);

    assert.equal(result.inRange, false);
    assert.equal(result.status, 'below_min');
    assert.equal(result.quality, 1.0);
    assert.equal(result.sizeKB, 12);
    assert.match(result.explanation, /smaller than your 20 KB minimum/i);
  });

  it('explains in plain language when even 1% quality exceeds maxKB', async () => {
    const encode = createMockEncoder(65, 400);
    const result = await findJpegQualityForSizeRange(encode, 10, 20);

    assert.equal(result.inRange, false);
    assert.equal(result.status, 'above_max');
    assert.equal(result.quality, 0.01);
    assert.ok(result.sizeKB > 20);
    assert.match(result.explanation, /above your 20 KB limit/i);
  });

  it('returns the closest discrete step when quantization jumps over a tiny range', async () => {
    // Encoder with coarse discrete steps: <0.5 => 18 KB, >=0.5 => 25 KB
    const coarseEncoder = async (quality: number): Promise<MockBlob> => ({
      size: (quality < 0.5 ? 18 : 25) * 1024,
      quality,
    });

    const result = await findJpegQualityForSizeRange(coarseEncoder, 20, 21);

    assert.equal(result.inRange, false);
    assert.equal(result.status, 'closest_discrete_step');
    // 18 KB is 2 KB away from [20, 21]; 25 KB is 4 KB away -> closest is 18 KB
    assert.equal(result.sizeKB, 18);
    assert.match(result.explanation, /closest possible result/i);
  });

  it('handles reversed minKB and maxKB gracefully', async () => {
    const encode = createMockEncoder(5, 80);
    const result = await findJpegQualityForSizeRange(encode, 40, 20);

    assert.equal(result.inRange, true);
    assert.ok(result.sizeKB >= 20 && result.sizeKB <= 40);
  });
});

describe('dimension & range utilities', () => {
  it('converts cm and DPI to exact pixels (3.5 x 4.5 cm at 300 DPI -> 413 x 531 px)', () => {
    assert.equal(cmToPixels(3.5, 300), 413);
    assert.equal(cmToPixels(4.5, 300), 531);
  });

  it('calculates distanceToRange accurately', () => {
    assert.equal(distanceToRange(150, 100, 200), 0);
    assert.equal(distanceToRange(80, 100, 200), 20);
    assert.equal(distanceToRange(250, 100, 200), 50);
  });

  it('computes centered aspect-locked crop rect', () => {
    const crop = getCenteredCropForAspect(1000, 500, 1); // 2:1 image cropped to 1:1 square
    assert.equal(crop.width, 0.5);
    assert.equal(crop.height, 1);
    assert.equal(crop.x, 0.25);
    assert.equal(crop.y, 0);
  });
});
