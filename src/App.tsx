import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PRESETS, ImagePreset } from './presets';
import {
  CropRect,
  cmToPixels,
  getCenteredCropForAspect,
  pixelsToCm,
} from './utils/dimensions';
import {
  LoadedImageInfo,
  ProcessedImageOutput,
  createSampleImageFile,
  loadImageFromFile,
  processImageToTargetSpec,
} from './utils/imageProcessor';
import { UploadZone } from './components/UploadZone';
import { RequirementsForm, TargetSpecs } from './components/RequirementsForm';
import { CropWorkspace } from './components/CropWorkspace';
import { ResultCard } from './components/ResultCard';

const DEFAULT_PRESET = PRESETS[0];

export default function App() {
  const [specs, setSpecs] = useState<TargetSpecs>(() => ({
    minKB: String(DEFAULT_PRESET.minKB),
    maxKB: String(DEFAULT_PRESET.maxKB),
    widthPx: String(DEFAULT_PRESET.width),
    heightPx: String(DEFAULT_PRESET.height),
    widthCm: DEFAULT_PRESET.widthCm
      ? String(DEFAULT_PRESET.widthCm)
      : String(pixelsToCm(DEFAULT_PRESET.width, DEFAULT_PRESET.dpi ?? 300)),
    heightCm: DEFAULT_PRESET.heightCm
      ? String(DEFAULT_PRESET.heightCm)
      : String(pixelsToCm(DEFAULT_PRESET.height, DEFAULT_PRESET.dpi ?? 300)),
    dpi: String(DEFAULT_PRESET.dpi ?? 300),
    activePresetName: DEFAULT_PRESET.name,
  }));

  const [loadedImage, setLoadedImage] = useState<LoadedImageInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const [rotationDeg, setRotationDeg] = useState(0);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [crop, setCrop] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  const [processedOutput, setProcessedOutput] =
    useState<ProcessedImageOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const prevPreviewUrlRef = useRef<string | null>(null);
  const prevSourceUrlRef = useRef<string | null>(null);

  // Compute effective target width, height, and aspect ratio from specs
  const parsedSpecs = useMemo(() => {
    const minKB = Math.max(1, parseFloat(specs.minKB) || 10);
    const maxKB = Math.max(1, parseFloat(specs.maxKB) || 50);

    const wPx = parseInt(specs.widthPx, 10);
    const hPx = parseInt(specs.heightPx, 10);

    const wCm = parseFloat(specs.widthCm);
    const hCm = parseFloat(specs.heightCm);
    const dpi = parseFloat(specs.dpi) || 300;

    let targetW: number | null =
      Number.isFinite(wPx) && wPx > 0 ? wPx : null;
    let targetH: number | null =
      Number.isFinite(hPx) && hPx > 0 ? hPx : null;

    if (!targetW && Number.isFinite(wCm) && wCm > 0) {
      targetW = cmToPixels(wCm, dpi);
    }
    if (!targetH && Number.isFinite(hCm) && hCm > 0) {
      targetH = cmToPixels(hCm, dpi);
    }

    const targetAspect =
      targetW && targetH && targetW > 0 && targetH > 0
        ? targetW / targetH
        : null;

    return {
      minKB: Math.min(minKB, maxKB),
      maxKB: Math.max(minKB, maxKB),
      targetW,
      targetH,
      targetAspect,
    };
  }, [specs]);

  // Apply a preset from presets.ts
  const handleApplyPreset = (preset: ImagePreset) => {
    const dpi = preset.dpi ?? 300;
    const widthCm =
      preset.widthCm !== undefined
        ? String(preset.widthCm)
        : String(pixelsToCm(preset.width, dpi));
    const heightCm =
      preset.heightCm !== undefined
        ? String(preset.heightCm)
        : String(pixelsToCm(preset.height, dpi));

    setSpecs({
      minKB: String(preset.minKB),
      maxKB: String(preset.maxKB),
      widthPx: String(preset.width),
      heightPx: String(preset.height),
      widthCm,
      heightCm,
      dpi: String(dpi),
      activePresetName: preset.name,
    });
    setAspectLocked(true);

    if (loadedImage) {
      const isRot90 = rotationDeg % 180 !== 0;
      const effW = isRot90 ? loadedImage.height : loadedImage.width;
      const effH = isRot90 ? loadedImage.width : loadedImage.height;
      setCrop(
        getCenteredCropForAspect(effW, effH, preset.width / preset.height)
      );
    }
  };

  // Load a user-selected File
  const handleSelectFile = async (file: File) => {
    setUploadError(null);
    setIsLoadingFile(true);
    try {
      const info = await loadImageFromFile(file);
      if (prevSourceUrlRef.current) {
        URL.revokeObjectURL(prevSourceUrlRef.current);
      }
      prevSourceUrlRef.current = info.objectUrl;
      setRotationDeg(0);
      setLoadedImage(info);

      const initialCrop = getCenteredCropForAspect(
        info.width,
        info.height,
        aspectLocked ? parsedSpecs.targetAspect : null
      );
      setCrop(initialCrop);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Could not load image file. Please select a valid JPG or PNG.'
      );
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load a synthetic sample image for quick testing
  const handleLoadSample = async (kind: 'portrait' | 'signature') => {
    setIsLoadingFile(true);
    setUploadError(null);
    try {
      const samplePreset =
        kind === 'signature'
          ? PRESETS.find((p) => p.name.toLowerCase().includes('signature')) ??
            PRESETS[1]
          : PRESETS[0];

      if (samplePreset) {
        handleApplyPreset(samplePreset);
      }
      const file = await createSampleImageFile(kind);
      await handleSelectFile(file);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // When user edits specs in RequirementsForm, if they set target width/height, keep window locked to target dimensions
  const handleChangeSpecs = (next: TargetSpecs) => {
    const prevDimensionsChanged =
      next.widthPx !== specs.widthPx ||
      next.heightPx !== specs.heightPx ||
      next.widthCm !== specs.widthCm ||
      next.heightCm !== specs.heightCm;
    if (prevDimensionsChanged && (next.widthPx || next.heightPx)) {
      setAspectLocked(true);
    }
    setSpecs(next);
  };

  // Run canvas resize + binary-search JPEG quality whenever image, crop, or specs change
  useEffect(() => {
    if (!loadedImage) {
      setProcessedOutput(null);
      return;
    }

    let cancelled = false;
    setIsProcessing(true);

    const timer = window.setTimeout(async () => {
      try {
        const isRot90 = rotationDeg % 180 !== 0;
        const effW = isRot90 ? loadedImage.height : loadedImage.width;
        const effH = isRot90 ? loadedImage.width : loadedImage.height;

        const croppedW = Math.max(1, Math.round(crop.width * effW));
        const croppedH = Math.max(1, Math.round(crop.height * effH));

        // When Aspect Ratio is locked, resize to exact targetW x targetH.
        // When in Free Crop mode (!aspectLocked), preserve the user's exact custom crop shape.
        const outWidth =
          aspectLocked && parsedSpecs.targetW ? parsedSpecs.targetW : croppedW;
        const outHeight =
          aspectLocked && parsedSpecs.targetH ? parsedSpecs.targetH : croppedH;

        const output = await processImageToTargetSpec({
          source: loadedImage,
          crop,
          targetWidth: outWidth,
          targetHeight: outHeight,
          minKB: parsedSpecs.minKB,
          maxKB: parsedSpecs.maxKB,
          rotationDeg,
        });

        if (cancelled) {
          URL.revokeObjectURL(output.previewUrl);
          return;
        }

        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current);
        }
        prevPreviewUrlRef.current = output.previewUrl;
        setProcessedOutput(output);
      } catch (err) {
        if (!cancelled) {
          setUploadError(
            err instanceof Error
              ? err.message
              : 'Failed to process image in browser.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    loadedImage,
    crop,
    rotationDeg,
    parsedSpecs.targetW,
    parsedSpecs.targetH,
    parsedSpecs.minKB,
    parsedSpecs.maxKB,
  ]);

  // Optional one-tap dimension scaling when target KB cannot be reached at current pixel dimensions
  const handleAutoScaleDimensions = () => {
    if (!processedOutput) return;
    const currentW = processedOutput.width;
    const currentH = processedOutput.height;
    const targetMidKB = (parsedSpecs.minKB + parsedSpecs.maxKB) / 2;
    const currentKB = Math.max(0.5, processedOutput.sizeKB);

    // File size scales roughly with area, so linear dimension scale ~ sqrt(targetMidKB / currentKB)
    const rawScale = Math.sqrt(targetMidKB / currentKB);
    const clampedScale =
      processedOutput.status === 'below_min'
        ? Math.max(1.25, Math.min(3.5, rawScale * 1.15))
        : Math.max(0.25, Math.min(0.85, rawScale * 0.9));

    const nextW = Math.max(20, Math.round(currentW * clampedScale));
    const nextH = Math.max(20, Math.round(currentH * clampedScale));
    const dpiVal = parseFloat(specs.dpi) || 300;

    setSpecs({
      ...specs,
      widthPx: String(nextW),
      heightPx: String(nextH),
      widthCm: String(pixelsToCm(nextW, dpiVal)),
      heightCm: String(pixelsToCm(nextH, dpiVal)),
      activePresetName: null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Nav links) - Zone 3 (Action) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-8 backdrop-blur-md">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          ExactSpec
        </a>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <a
            href="#upload-heading"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Source Image
          </a>
          <a
            href="#specs-heading"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Presets &amp; Specs
          </a>
          <a
            href="#crop-heading"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Crop &amp; Align
          </a>
          <a
            href="#result-heading"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            JPG Output
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('portrait')}
            className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Load Sample Photo
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        id="top"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8"
      >
        {/* Hero Intro */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Freedom Image Resizer
          </h1>
          <p className="mt-1.5 max-w-2xl text-xl text-red-600 font-bold leading-relaxed">
            Upload any image, crop it , zoom it  and export in your desired format and size.
          </p>
        </div>

        {/* Responsive Mobile-First Stack -> 2-Column Studio Grid on Desktop */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 items-start">
          {/* Left Column: Inputs (Upload + Requirements/Presets) */}
          <div className="lg:col-span-6 space-y-6">
            <UploadZone
              loadedImage={loadedImage}
              error={uploadError}
              isLoading={isLoadingFile}
              onSelectFile={handleSelectFile}
              onLoadSample={handleLoadSample}
            />

            <RequirementsForm
              specs={specs}
              onChangeSpecs={handleChangeSpecs}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          {/* Right Column: Interactive Crop & Output Result */}
          <div className="lg:col-span-6 space-y-6">
            {loadedImage ? (
              <>
                <CropWorkspace
                  image={loadedImage}
                  crop={crop}
                  rotationDeg={rotationDeg}
                  targetWidth={parsedSpecs.targetW}
                  targetHeight={parsedSpecs.targetH}
                  targetAspect={parsedSpecs.targetAspect}
                  activePresetName={specs.activePresetName}
                  aspectLocked={aspectLocked}
                  processedOutput={processedOutput}
                  isProcessing={isProcessing}
                  onChangeCrop={setCrop}
                  onToggleAspectLock={(nextLocked) =>
                    setAspectLocked((prev) =>
                      typeof nextLocked === 'boolean' ? nextLocked : !prev
                    )
                  }
                  onRotate={() =>
                    setRotationDeg((prev) => (prev + 90) % 360)
                  }
                />

                <ResultCard
                  original={loadedImage}
                  result={processedOutput}
                  isProcessing={isProcessing}
                  minKB={parsedSpecs.minKB}
                  maxKB={parsedSpecs.maxKB}
                  onAutoScaleDimensions={handleAutoScaleDimensions}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-4">
                <p className="text-base font-semibold text-slate-900">
                  Ready to Crop &amp; Compress
                </p>
                <p className="mx-auto max-w-sm text-lg sm:text-lg text-slate-600 leading-relaxed">
                 Upload an image first and you will see a live preview of the cropped and optimized image here. You can adjust the crop, zoom, and rotation to get the exact framing you want.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('portrait')}
                    className="min-h-[44px] rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    Try Sample Portrait (20–50 KB)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('signature')}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Try Sample Signature (10–20 KB)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white py-5 px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            ExactSpec · Local Browser Canvas &amp; Binary-Search JPEG Optimizer
          </span>
          <span>
            Private by design · Images never leave your device
          </span>
        </div>
      </footer>
    </div>
  );
}
