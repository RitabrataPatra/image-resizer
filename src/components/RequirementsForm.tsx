import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  PUBLISHED_PRESETS,
  QUICK_PRESETS,
  type ImagePreset,
} from '../data/presets';
import { OutputFormat } from '../utils/imageProcessor';
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
  outputFormat: OutputFormat;
  onChangeOutputFormat: (format: OutputFormat) => void;
}

export const RequirementsForm: React.FC<RequirementsFormProps> = ({
  specs,
  onChangeSpecs,
  onApplyPreset,
  outputFormat,
  onChangeOutputFormat,
}) => {
  const quickPresets = QUICK_PRESETS;
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [dimensionUnit, setDimensionUnit] = useState<'px' | 'cm'>(
    specs.widthCm || specs.heightCm ? 'cm' : 'px'
  );

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

  const applyPreset = (preset: ImagePreset) => {
    const hasPrintSize =
      preset.widthCm !== undefined && preset.heightCm !== undefined;
    setDimensionUnit(hasPrintSize ? 'cm' : 'px');
    setDimensionsOpen(false);
    onApplyPreset(preset);
  };

  const handleUnitTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let nextUnit: 'px' | 'cm' | null = null;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      nextUnit = dimensionUnit === 'px' ? 'cm' : 'px';
    } else if (event.key === 'Home') {
      nextUnit = 'px';
    } else if (event.key === 'End') {
      nextUnit = 'cm';
    }

    if (nextUnit) {
      event.preventDefault();
      event.currentTarget
        .querySelector<HTMLButtonElement>(
          nextUnit === 'px' ? '#pixels-tab' : '#centimeters-tab'
        )
        ?.focus();
      setDimensionUnit(nextUnit);
    }
  };

  const rawMinKB = specs.minKB.trim();
  const minNum = rawMinKB === '' ? null : Number(rawMinKB);
  const maxNum = Number(specs.maxKB);
  const hasInvalidMin =
    rawMinKB !== '' &&
    (!Number.isFinite(minNum) || (minNum !== null && minNum < 0));
  const hasInvalidMax = !Number.isFinite(maxNum) || maxNum <= 0;
  const hasRangeWarning =
    !hasInvalidMin &&
    !hasInvalidMax &&
    minNum !== null &&
    minNum > maxNum;

  return (
    <section aria-labelledby="specs-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="specs-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          02. Upload Requirements & Presets
        </h2>
        <label
          htmlFor="output-format"
          className="flex items-center gap-2 text-xs text-slate-600"
        >
          Output format
          <select
            id="output-format"
            value={outputFormat}
            onChange={(event) =>
              onChangeOutputFormat(event.target.value === 'png' ? 'png' : 'jpg')
            }
            className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-5">
        {/* Quick Presets from presets.ts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-slate-700">
              Quick Presets
            </label>
            <a
              href="/all-sizes/"
              className="shrink-0 text-[11px] font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              More presets →
            </a>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {quickPresets.map((preset) => {
              const isSelected = specs.activePresetName === preset.name;
              const hasPublishedPage = PUBLISHED_PRESETS.some(
                (publishedPreset) => publishedPreset.slug === preset.slug
              );
              const className = `flex min-h-[48px] flex-col items-start justify-center rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-slate-100/80'
              } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900`;

              return (
                hasPublishedPage ? (
                  <a key={preset.name} href={`/${preset.slug}/`} className={className}>
                    <span className="w-full break-words text-xs font-semibold">
                      {preset.name}
                    </span>
                    <span
                      className={`mt-0.5 text-[11px] font-mono ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {preset.width !== undefined && preset.height !== undefined
                        ? `${preset.width}×${preset.height} px · `
                        : ''}
                      {preset.minKB}–{preset.maxKB} KB
                    </span>
                  </a>
                ) : (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={className}
                  >
                    <span className="w-full break-words text-xs font-semibold">
                      {preset.name}
                    </span>
                    <span
                      className={`mt-0.5 text-[11px] font-mono ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {preset.width !== undefined && preset.height !== undefined
                        ? `${preset.width}×${preset.height} px · `
                        : ''}
                      {preset.minKB}–{preset.maxKB} KB
                    </span>
                  </button>
                )
              );
            })}
          </div>
        </div>

        <section
          aria-labelledby="file-size-heading"
          className="border-t border-slate-100 pt-4 space-y-2.5"
        >
          <div className="flex items-baseline justify-between">
            <h3
              id="file-size-heading"
              className="text-xs font-semibold text-slate-700"
            >
              File size
            </h3>
            <span className="text-xs text-slate-500">Max size required</span>
          </div>

          <p className="text-xs text-slate-500">
            Set a maximum output size in KB. Add a minimum only if your
            destination requires a size range.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="min-kb-input"
                className="block text-xs text-slate-600 mb-1"
              >
                Min Size (KB), optional
              </label>
              <div className="relative">
                <input
                  id="min-kb-input"
                  type="number"
                  inputMode="decimal"
                  min={0}
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
                  placeholder="Optional"
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
                  required
                  aria-required="true"
                  min={0}
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

          {hasInvalidMin && (
            <p role="alert" className="text-xs text-amber-700">
              Enter a valid minimum size of 0 KB or more, or leave it blank.
            </p>
          )}

          {hasInvalidMax && (
            <p role="alert" className="text-xs text-amber-700">
              Enter a maximum size greater than 0 KB.
            </p>
          )}

          {hasRangeWarning && (
            <p role="alert" className="text-xs text-amber-700">
              Min KB cannot be greater than Max KB.
            </p>
          )}
        </section>

        <section
          aria-labelledby="dimensions-section-heading"
          className="border-t border-slate-100 pt-4 space-y-3"
        >
          <h3
            id="dimensions-section-heading"
            className="text-xs font-semibold text-slate-700"
          >
            Dimensions (optional)
          </h3>
          <div className="flex items-center justify-between gap-3">
            <button
              id="dimensions-heading"
              type="button"
              aria-expanded={dimensionsOpen}
              aria-controls="dimensions-panel"
              onClick={() => setDimensionsOpen((open) => !open)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg text-left text-xs font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <span>Set exact dimensions (optional)</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                  dimensionsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {(specs.widthPx || specs.heightPx) && (
              <button
                type="button"
                onClick={clearDimensions}
                className="min-h-[40px] text-xs font-medium text-slate-500 underline hover:text-slate-900 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Clear dimensions
              </button>
            )}
          </div>

          <div
            id="dimensions-panel"
            hidden={!dimensionsOpen}
            className={dimensionsOpen ? 'space-y-4' : ''}
          >
            <div
              role="tablist"
              aria-label="Dimension units"
              onKeyDown={handleUnitTabKeyDown}
              className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
            >
              <button
                id="pixels-tab"
                type="button"
                role="tab"
                aria-selected={dimensionUnit === 'px'}
                aria-controls="pixel-dimensions"
                tabIndex={dimensionUnit === 'px' ? 0 : -1}
                onClick={() => setDimensionUnit('px')}
                className={`min-h-[40px] rounded-lg px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                  dimensionUnit === 'px'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pixels
              </button>
              <button
                id="centimeters-tab"
                type="button"
                role="tab"
                aria-selected={dimensionUnit === 'cm'}
                aria-controls="centimeter-dimensions"
                tabIndex={dimensionUnit === 'cm' ? 0 : -1}
                onClick={() => setDimensionUnit('cm')}
                className={`min-h-[40px] rounded-lg px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                  dimensionUnit === 'cm'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Centimeters
              </button>
            </div>

            <div
              id="pixel-dimensions"
              role="tabpanel"
              aria-labelledby="pixels-tab"
              hidden={dimensionUnit !== 'px'}
              className={
                dimensionUnit === 'px' ? 'grid grid-cols-2 gap-3' : 'hidden'
              }
            >
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
                    onChange={(e) =>
                      handlePixelChange('widthPx', e.target.value)
                    }
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

            <div
              id="centimeter-dimensions"
              role="tabpanel"
              aria-labelledby="centimeters-tab"
              hidden={dimensionUnit !== 'cm'}
              className={dimensionUnit === 'cm' ? 'space-y-3' : 'hidden'}
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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

                <div className="col-span-2 sm:col-span-1">
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
                      onChange={(e) =>
                        handleCmOrDpiChange('dpi', e.target.value)
                      }
                      placeholder="300"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                      DPI
                    </span>
                  </div>
                </div>
              </div>

              <p
                aria-live="polite"
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
              >
                {specs.widthPx && specs.heightPx
                  ? `= ${specs.widthPx} × ${specs.heightPx} px`
                  : 'Enter both dimensions and a DPI value to preview pixels.'}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              Your image will be cropped and resized to these dimensions first,
              then compressed to fit your file size limit.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
};
