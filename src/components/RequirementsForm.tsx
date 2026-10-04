import React from 'react';
import { PRESETS, ImagePreset } from '../presets';
import { cmToPixels, pixelsToCm } from '../utils/dimensions';

export interface TargetSpecs {
  minKB: string;
  maxKB: string;
  widthPx: string;
  heightPx: string;
  widthCm: string;
  heightCm: string;
  dpi: string;
  activePresetName: string | null;
}

interface RequirementsFormProps {
  specs: TargetSpecs;
  onChangeSpecs: (next: TargetSpecs) => void;
  onApplyPreset: (preset: ImagePreset) => void;
}

export const RequirementsForm: React.FC<RequirementsFormProps> = ({
  specs,
  onChangeSpecs,
  onApplyPreset,
}) => {
  const handlePixelChange = (field: 'widthPx' | 'heightPx', rawValue: string) => {
    const next = {
      ...specs,
      [field]: rawValue,
      activePresetName: null,
    };

    const pxVal = parseFloat(rawValue);
    const dpiVal = parseFloat(specs.dpi) || 300;

    if (Number.isFinite(pxVal) && pxVal > 0) {
      const cmVal = String(pixelsToCm(pxVal, dpiVal));
      if (field === 'widthPx') {
        next.widthCm = cmVal;
      } else {
        next.heightCm = cmVal;
      }
    } else {
      if (field === 'widthPx') next.widthCm = '';
      else next.heightCm = '';
    }

    onChangeSpecs(next);
  };

  const handleCmOrDpiChange = (
    field: 'widthCm' | 'heightCm' | 'dpi',
    rawValue: string
  ) => {
    const next = {
      ...specs,
      [field]: rawValue,
      activePresetName: null,
    };

    const wCm = parseFloat(field === 'widthCm' ? rawValue : specs.widthCm);
    const hCm = parseFloat(field === 'heightCm' ? rawValue : specs.heightCm);
    const dpi = parseFloat(field === 'dpi' ? rawValue : specs.dpi);

    if (Number.isFinite(dpi) && dpi > 0) {
      if (Number.isFinite(wCm) && wCm > 0) {
        next.widthPx = String(cmToPixels(wCm, dpi));
      } else if (field === 'widthCm' && rawValue.trim() === '') {
        next.widthPx = '';
      }

      if (Number.isFinite(hCm) && hCm > 0) {
        next.heightPx = String(cmToPixels(hCm, dpi));
      } else if (field === 'heightCm' && rawValue.trim() === '') {
        next.heightPx = '';
      }
    }

    onChangeSpecs(next);
  };

  const clearDimensions = () => {
    onChangeSpecs({
      ...specs,
      widthPx: '',
      heightPx: '',
      widthCm: '',
      heightCm: '',
      activePresetName: null,
    });
  };

  const minNum = parseFloat(specs.minKB);
  const maxNum = parseFloat(specs.maxKB);
  const hasRangeWarning =
    Number.isFinite(minNum) &&
    Number.isFinite(maxNum) &&
    minNum > maxNum;

  return (
    <section aria-labelledby="specs-heading" className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2
          id="specs-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          02. Upload Requirements & Presets
        </h2>
        <span className="text-xs text-red-500">Output format · JPG</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-5">
        {/* Quick Presets from presets.ts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Quick Presets
            </label>
            <span className="text-xs text-slate-500">
              Tap to fill target specs
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = specs.activePresetName === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  className={`flex min-h-[48px] flex-col items-start justify-center rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="text-xs font-semibold whitespace-nowrap truncate w-full">
                    {preset.name}
                  </span>
                  <span
                    className={`mt-0.5 text-[11px] font-mono ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {preset.width}×{preset.height} px · {preset.minKB}–{preset.maxKB} KB
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target File Size Range (Min KB & Max KB) */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Target File Size Range (KB) [<span className="text-xs text-blue-400">Set the minimum and maximum file sizes here</span>]
            </label>
            <span className="text-xs text-slate-500">Required</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="min-kb-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Min Size (KB)
              </label>
              <div className="relative">
                <input
                  id="min-kb-input"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={10000}
                  step="any"
                  value={specs.minKB}
                  onChange={(e) =>
                    onChangeSpecs({
                      ...specs,
                      minKB: e.target.value,
                      activePresetName: null,
                    })
                  }
                  placeholder="20"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-10 text-sm font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  KB
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="max-kb-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Max Size (KB)
              </label>
              <div className="relative">
                <input
                  id="max-kb-input"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={10000}
                  step="any"
                  value={specs.maxKB}
                  onChange={(e) =>
                    onChangeSpecs({
                      ...specs,
                      maxKB: e.target.value,
                      activePresetName: null,
                    })
                  }
                  placeholder="50"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-10 text-sm font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  KB
                </span>
              </div>
            </div>
          </div>

          {hasRangeWarning && (
            <p className="text-xs text-amber-700">
              Note: Min KB is greater than Max KB. We will automatically use{' '}
              {maxNum}–{minNum} KB.
            </p>
          )}
        </div>

        {/* Optional Exact Pixel Dimensions */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Exact Pixel Dimensions (Optional)
            </label>
            {(specs.widthPx || specs.heightPx) && (
              <button
                type="button"
                onClick={clearDimensions}
                className="text-xs font-medium text-slate-500 underline hover:text-slate-900 whitespace-nowrap"
              >
                Clear dimensions
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="width-px-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Width (px)
              </label>
              <div className="relative">
                <input
                  id="width-px-input"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={8000}
                  value={specs.widthPx}
                  onChange={(e) => handlePixelChange('widthPx', e.target.value)}
                  placeholder="Auto from crop"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  px
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="height-px-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Height (px)
              </label>
              <div className="relative">
                <input
                  id="height-px-input"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={8000}
                  value={specs.heightPx}
                  onChange={(e) =>
                    handlePixelChange('heightPx', e.target.value)
                  }
                  placeholder="Auto from crop"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-9 text-sm font-mono text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  px
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Physical Size in cm + DPI */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Physical Size in cm &amp; DPI (Optional)
            </label>
            <span className="text-xs text-slate-500">
              Auto-calculates pixels
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label
                htmlFor="width-cm-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Width (cm)
              </label>
              <div className="relative">
                <input
                  id="width-cm-input"
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  max={100}
                  step="0.1"
                  value={specs.widthCm}
                  onChange={(e) =>
                    handleCmOrDpiChange('widthCm', e.target.value)
                  }
                  placeholder="3.5"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="height-cm-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Height (cm)
              </label>
              <div className="relative">
                <input
                  id="height-cm-input"
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  max={100}
                  step="0.1"
                  value={specs.heightCm}
                  onChange={(e) =>
                    handleCmOrDpiChange('heightCm', e.target.value)
                  }
                  placeholder="4.5"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="dpi-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Resolution (DPI)
              </label>
              <div className="relative">
                <input
                  id="dpi-input"
                  type="number"
                  inputMode="numeric"
                  min={72}
                  max={1200}
                  step="1"
                  value={specs.dpi}
                  onChange={(e) => handleCmOrDpiChange('dpi', e.target.value)}
                  placeholder="300"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                  DPI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
