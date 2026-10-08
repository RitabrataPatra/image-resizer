import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findJpegQualityForSizeRange,
  distanceToRange,
} from './sizeTargeting.ts';
import { cmToPixels, getCenteredCropForAspect } from './dimensions.ts';
import {
  QUICK_PRESETS,
  PRESETS,
  PUBLISHED_PRESETS,
} from '../data/presets';

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
    assert.equal(result.sizeBytes, result.blob.size);
    assert.equal(result.sizeKB, Number((result.blob.size / 1024).toFixed(2)));
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

  it('keeps quick presets limited to published button presets', () => {
    const unpublishedButtonPresets = PRESETS.filter(
      (preset) => preset.published === false && preset.showAsButton === true
    );
    const visibleButtonPresets = PRESETS.filter(
      (preset) => preset.published !== false && preset.showAsButton === true
    );

    assert.deepEqual(
      unpublishedButtonPresets.map((preset) => preset.slug),
      [],
      'Unpublished presets should not be configured as quick-preset buttons'
    );
    assert.ok(
      QUICK_PRESETS.length <= 4,
      `Expected at most 4 quick presets, received ${QUICK_PRESETS.length}`
    );
    assert.deepEqual(
      QUICK_PRESETS.map((preset) => preset.slug),
      visibleButtonPresets.slice(0, 4).map((preset) => preset.slug),
      'Quick preset order should follow the showAsButton flags without publishing draft routes'
    );
  });

  it('publishes unique preset routes for each requested supported preset', () => {
    const slugs = PRESETS.map((preset) => preset.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'Preset slugs must be unique');

    const publishedSlugs = new Set(
      PUBLISHED_PRESETS.map((preset) => preset.slug)
    );
    for (const slug of [
      'photo-20-kb',
      'photo-50-kb',
      'photo-100-kb',
      'photo-200-kb',
      'passport-size-photo-35x45-mm',
      'facebook-profile-photo-square',
    ]) {
      assert.ok(publishedSlugs.has(slug), `Expected published route /${slug}/`);
    }

    assert.ok(!publishedSlugs.has('pan-card-photo-35x45-mm'));
  });

  it('keeps photo file-size preset targets in the existing KB ranges', () => {
    const expectedRanges: Record<string, [number, number]> = {
      'photo-20-kb': [15, 20],
      'photo-50-kb': [30, 50],
      'photo-100-kb': [80, 100],
      'photo-200-kb': [160, 200],
    };

    for (const [slug, [minKB, maxKB]] of Object.entries(expectedRanges)) {
      const preset = PRESETS.find((item) => item.slug === slug);
      assert.ok(preset, `Expected preset ${slug}`);
      assert.equal(preset.minKB, minKB);
      assert.equal(preset.maxKB, maxKB);
    }
  });

  it('configures the Facebook profile preset as a square ExactSpec starting point', () => {
    const preset = PRESETS.find(
      (item) => item.slug === 'facebook-profile-photo-square'
    );
    assert.ok(preset);
    assert.equal(preset.width, 320);
    assert.equal(preset.height, 320);
    assert.equal(preset.width / preset.height, 1);
    assert.equal(preset.minKB, 30);
    assert.equal(preset.maxKB, 300);
    assert.match(preset.limitations ?? '', /not a guarantee of acceptance/i);
  });

  it('keeps pixel dimensions only for presets that define them', () => {
    const fileSizeOnlySlugs = [
      'photo-50-kb',
      'photo-20-kb',
      'photo-100-kb',
      'photo-200-kb',
      'government-exam-photo-50-kb',
      'background-verification-photo-50-kb',
      'college-admission-photo-50-kb',
      'signature-10-kb',
      'signature-20-kb',
    ];

    for (const slug of fileSizeOnlySlugs) {
      const preset = PRESETS.find((item) => item.slug === slug);
      assert.ok(preset, `Expected preset ${slug}`);
      assert.equal(preset.width, undefined);
      assert.equal(preset.height, undefined);
      assert.equal(preset.widthCm, undefined);
      assert.equal(preset.heightCm, undefined);
      assert.equal(preset.dpi, undefined);
      assert.equal(preset.sourceUrl, undefined);
      assert.equal(preset.lastVerified, undefined);
    }

    const passportPreset = PRESETS.find(
      (item) => item.slug === 'passport-size-photo-35x45-mm'
    );
    assert.ok(passportPreset);
    assert.equal(passportPreset.width, 413);
    assert.equal(passportPreset.height, 531);
    assert.equal(passportPreset.widthCm, 3.5);
    assert.equal(passportPreset.heightCm, 4.5);
    assert.equal(passportPreset.dpi, 300);
  });
});
