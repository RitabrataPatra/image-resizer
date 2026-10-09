import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PUBLISHED_PRESETS, PRESETS, type ImagePreset } from './data/presets';
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
  OutputFormat,
  processImageToTargetSpec,
} from './utils/imageProcessor';
import { ImageProcessingLimitError } from './utils/imageProcessingSafety';
import { UploadZone } from './components/UploadZone';
import { RequirementsForm, TargetSpecs } from './components/RequirementsForm';
import { CropWorkspace } from './components/CropWorkspace';
import { ResultCard } from './components/ResultCard';

const DEFAULT_PRESET = PUBLISHED_PRESETS[0] ?? PRESETS[0];

const getPresetBySlug = (presetSlug?: string) =>
  PRESETS.find((preset) => preset.slug === presetSlug) ?? DEFAULT_PRESET;

export function Resizer({ initialPresetSlug }: { initialPresetSlug?: string }) {
  const preset = getPresetBySlug(initialPresetSlug);

  const [specs, setSpecs] = useState<TargetSpecs>(() => ({
    minKB: String(preset.minKB),
    maxKB: String(preset.maxKB),
    widthPx: preset.width !== undefined ? String(preset.width) : '',
    heightPx: preset.height !== undefined ? String(preset.height) : '',
    widthCm: preset.widthCm !== undefined ? String(preset.widthCm) : '',
    heightCm: preset.heightCm !== undefined ? String(preset.heightCm) : '',
    dpi:
      preset.widthCm !== undefined && preset.heightCm !== undefined
        ? String(preset.dpi ?? 300)
        : '',
    activePresetName: preset.name,
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
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pngRangeWarning, setPngRangeWarning] = useState<{
    sizeKB: number;
    minKB: number;
    maxKB: number;
  } | null>(null);

  const prevPreviewUrlRef = useRef<string | null>(null);
  const prevSourceUrlRef = useRef<string | null>(null);
  const lastPngWarningKeyRef = useRef<string | null>(null);
  const pngRangeWarningRef = useRef<HTMLDivElement>(null);
  const failedProcessingRequestRef = useRef<{
    key: string;
    message: string;
  } | null>(null);

  const parsedSpecs = useMemo(() => {
    const minKB = Math.max(1, parseFloat(specs.minKB) || 10);
    const maxKB = Math.max(1, parseFloat(specs.maxKB) || 50);

    const wPx = parseInt(specs.widthPx, 10);
    const hPx = parseInt(specs.heightPx, 10);

    const wCm = parseFloat(specs.widthCm);
    const hCm = parseFloat(specs.heightCm);
    const dpi = parseFloat(specs.dpi) || 300;

    let targetW: number | null = Number.isFinite(wPx) && wPx > 0 ? wPx : null;
    let targetH: number | null = Number.isFinite(hPx) && hPx > 0 ? hPx : null;

    if (!targetW && Number.isFinite(wCm) && wCm > 0) {
      targetW = cmToPixels(wCm, dpi);
    }
    if (!targetH && Number.isFinite(hCm) && hCm > 0) {
      targetH = cmToPixels(hCm, dpi);
    }

    const targetAspect =
      targetW && targetH && targetW > 0 && targetH > 0 ? targetW / targetH : null;

    return {
      minKB: Math.min(minKB, maxKB),
      maxKB: Math.max(minKB, maxKB),
      targetW,
      targetH,
      targetAspect,
    };
  }, [specs]);

  const handleApplyPreset = (nextPreset: ImagePreset) => {
    const hasPrintSize =
      nextPreset.widthCm !== undefined && nextPreset.heightCm !== undefined;

    setSpecs({
      minKB: String(nextPreset.minKB),
      maxKB: String(nextPreset.maxKB),
      widthPx: nextPreset.width !== undefined ? String(nextPreset.width) : '',
      heightPx: nextPreset.height !== undefined ? String(nextPreset.height) : '',
      widthCm: nextPreset.widthCm !== undefined ? String(nextPreset.widthCm) : '',
      heightCm: nextPreset.heightCm !== undefined ? String(nextPreset.heightCm) : '',
      dpi: hasPrintSize ? String(nextPreset.dpi ?? 300) : '',
      activePresetName: nextPreset.name,
    });
    setAspectLocked(true);

    if (loadedImage && nextPreset.width && nextPreset.height) {
      const isRot90 = rotationDeg % 180 !== 0;
      const effW = isRot90 ? loadedImage.height : loadedImage.width;
      const effH = isRot90 ? loadedImage.width : loadedImage.height;
      setCrop(
        getCenteredCropForAspect(effW, effH, nextPreset.width / nextPreset.height)
      );
    }
  };

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

  const handleLoadSample = async (kind: 'portrait' | 'signature') => {
    setIsLoadingFile(true);
    setUploadError(null);
    try {
      const samplePreset =
        kind === 'signature'
          ? PUBLISHED_PRESETS.find((item) => item.type === 'signature') ??
            PUBLISHED_PRESETS[0] ??
            PRESETS[0]
          : PUBLISHED_PRESETS.find((item) => item.type === 'photo') ??
            PUBLISHED_PRESETS[0] ??
            PRESETS[0];

      if (samplePreset) {
        handleApplyPreset(samplePreset);
      }
      const file = await createSampleImageFile(kind);
      await handleSelectFile(file);
    } finally {
      setIsLoadingFile(false);
    }
  };

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

  useEffect(() => {
    if (!loadedImage) {
      setProcessedOutput(null);
      return;
    }

    const isRot90 = rotationDeg % 180 !== 0;
    const effW = isRot90 ? loadedImage.height : loadedImage.width;
    const effH = isRot90 ? loadedImage.width : loadedImage.height;
    const croppedW = Math.max(1, Math.round(crop.width * effW));
    const croppedH = Math.max(1, Math.round(crop.height * effH));
    const outWidth =
      aspectLocked && parsedSpecs.targetW ? parsedSpecs.targetW : croppedW;
    const outHeight =
      aspectLocked && parsedSpecs.targetH ? parsedSpecs.targetH : croppedH;
    const requestKey = [
      loadedImage.objectUrl,
      outWidth,
      outHeight,
      crop.width,
      crop.height,
      rotationDeg,
    ].join(':');

    if (failedProcessingRequestRef.current?.key === requestKey) {
      setProcessedOutput(null);
      setUploadError(failedProcessingRequestRef.current.message);
      return;
    }

    setUploadError(null);
    let cancelled = false;
    setIsProcessing(true);

    const timer = window.setTimeout(async () => {
      try {
        const output = await processImageToTargetSpec({
          source: loadedImage,
          crop,
          targetWidth: outWidth,
          targetHeight: outHeight,
          minKB: parsedSpecs.minKB,
          maxKB: parsedSpecs.maxKB,
          format: outputFormat,
          rotationDeg,
        });

        if (cancelled) {
          URL.revokeObjectURL(output.previewUrl);
          return;
        }

        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current);
        }
        failedProcessingRequestRef.current = null;
        prevPreviewUrlRef.current = output.previewUrl;
        setProcessedOutput(output);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to process image in browser.';
          if (err instanceof ImageProcessingLimitError) {
            failedProcessingRequestRef.current = {
              key: requestKey,
              message,
            };
          }
          if (prevPreviewUrlRef.current) {
            URL.revokeObjectURL(prevPreviewUrlRef.current);
            prevPreviewUrlRef.current = null;
          }
          setProcessedOutput(null);
          setUploadError(
            message
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
    outputFormat,
  ]);

  useEffect(() => {
    if (isProcessing) return;

    if (
      !processedOutput ||
      processedOutput.format !== 'png' ||
      processedOutput.inRange ||
      !loadedImage
    ) {
      lastPngWarningKeyRef.current = null;
      return;
    }

    const warningKey = `${loadedImage.objectUrl}:${parsedSpecs.minKB}:${parsedSpecs.maxKB}`;
    if (lastPngWarningKeyRef.current === warningKey) return;

    lastPngWarningKeyRef.current = warningKey;
    setPngRangeWarning({
      sizeKB: processedOutput.sizeKB,
      minKB: parsedSpecs.minKB,
      maxKB: parsedSpecs.maxKB,
    });
  }, [
    isProcessing,
    loadedImage,
    parsedSpecs.maxKB,
    parsedSpecs.minKB,
    processedOutput,
  ]);

  useEffect(() => {
    if (!pngRangeWarning) return;

    const dismissOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !pngRangeWarningRef.current?.contains(event.target)
      ) {
        setPngRangeWarning(null);
      }
    };

    document.addEventListener('pointerdown', dismissOnOutsideClick);
    return () =>
      document.removeEventListener('pointerdown', dismissOnOutsideClick);
  }, [pngRangeWarning]);

  const handleAutoScaleDimensions = () => {
    if (!processedOutput) return;
    const currentW = processedOutput.width;
    const currentH = processedOutput.height;
    const targetMidKB = (parsedSpecs.minKB + parsedSpecs.maxKB) / 2;
    const currentKB = Math.max(0.5, processedOutput.sizeKB);

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
    <div className="flex flex-col bg-slate-50 text-slate-900">
      {pngRangeWarning && (
        <div
          ref={pngRangeWarningRef}
          role="alert"
          aria-live="assertive"
          className="fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border-2 border-amber-500 bg-amber-100 px-5 py-4 pr-14 text-amber-950 shadow-xl sm:px-6 sm:pr-16"
        >
          <button
            type="button"
            onClick={() => setPngRangeWarning(null)}
            aria-label="Close image size warning"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-950 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="text-base font-bold tracking-tight sm:text-lg">
            This image may not meet the size you need
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed sm:text-base">
            It is {pngRangeWarning.sizeKB} KB, but your limit is {pngRangeWarning.minKB}–{pngRangeWarning.maxKB} KB. Check that this size is okay before using it.
          </p>
          <p className="mt-2 text-sm leading-relaxed sm:text-base">
            Try JPG if you need to meet a file-size limit. You can also change the image dimensions and check the new file size.
          </p>
        </div>
      )}
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 items-start">
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
              outputFormat={outputFormat}
              onChangeOutputFormat={setOutputFormat}
            />
          </div>

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
                  outputFormat={outputFormat}
                  onChangeCrop={setCrop}
                  onToggleAspectLock={(nextLocked) =>
                    setAspectLocked((prev) =>
                      typeof nextLocked === 'boolean' ? nextLocked : !prev
                    )
                  }
                  onRotate={() => setRotationDeg((prev) => (prev + 90) % 360)}
                />

                <ResultCard
                  original={loadedImage}
                  result={processedOutput}
                  isProcessing={isProcessing}
                  minKB={parsedSpecs.minKB}
                  maxKB={parsedSpecs.maxKB}
                  outputFormat={outputFormat}
                  onAutoScaleDimensions={handleAutoScaleDimensions}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-4">
                <p className="text-base font-semibold text-slate-900">
                  Ready to Crop &amp; Compress
                </p>
                <p className="mx-auto max-w-sm text-lg sm:text-lg text-slate-600 leading-relaxed">
                  Upload a JPG or PNG first and you will see a live preview of the cropped and optimized image here. You can adjust the crop, zoom, and framing to get the exact look you want.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('portrait')}
                    className="min-h-[44px] rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    Load Sample Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('signature')}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Load Sample Signature
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Resizer;
