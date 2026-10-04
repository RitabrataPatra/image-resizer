import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Lock,
  Unlock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Crop as CropIcon,
  Check,
  Download,
} from 'lucide-react';
import { CropRect } from '../utils/dimensions';
import {
  LoadedImageInfo,
  ProcessedImageOutput,
} from '../utils/imageProcessor';

interface CropWorkspaceProps {
  image: LoadedImageInfo;
  /** The effective crop in normalized 0..1 source-image coordinates */
  crop: CropRect;
  rotationDeg: number;
  targetWidth: number | null;
  targetHeight: number | null;
  targetAspect: number | null;
  activePresetName: string | null;
  aspectLocked: boolean;
  processedOutput: ProcessedImageOutput | null;
  isProcessing: boolean;
  onChangeCrop: (nextCrop: CropRect) => void;
  onToggleAspectLock: (nextLocked?: boolean) => void;
  onRotate: () => void;
}

type HandleMode =
  | 'pan'
  | 'move-box'
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | null;

export const CropWorkspace: React.FC<CropWorkspaceProps> = ({
  image,
  rotationDeg,
  targetWidth,
  targetHeight,
  targetAspect,
  activePresetName,
  aspectLocked,
  processedOutput,
  isProcessing,
  onChangeCrop,
  onToggleAspectLock,
  onRotate,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const isRotated90 = rotationDeg % 180 !== 0;
  const effectiveImgW = isRotated90 ? image.height : image.width;
  const effectiveImgH = isRotated90 ? image.width : image.height;
  const effectiveImgAspect = effectiveImgW / effectiveImgH;

  // Custom aspect ratio used when user switches to "Free Window Shape" and drags window edges
  const [freeWindowAspect, setFreeWindowAspect] = useState<number>(
    targetAspect ?? effectiveImgAspect
  );

  // Inner adjustable crop box (normalized 0..1 inside the target window) when "Crop Tool" is active
  const [isCropBoxMode, setIsCropBoxMode] = useState<boolean>(false);
  const [innerBox, setInnerBox] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const [cropSavedFeedback, setCropSavedFeedback] = useState<boolean>(false);

  // Sync freeWindowAspect when targetAspect changes
  useEffect(() => {
    if (targetAspect && targetAspect > 0) {
      setFreeWindowAspect(targetAspect);
    }
  }, [targetAspect]);

  // The active aspect ratio of the export window
  const windowAspect =
    aspectLocked && targetAspect && targetAspect > 0
      ? targetAspect
      : freeWindowAspect > 0
        ? freeWindowAspect
        : effectiveImgAspect;

  // Zoom level (1.0 = image covers the target window; up to 5.0 = 500% zoom)
  const [zoom, setZoom] = useState<number>(1);

  // Center of the visible crop window in normalized 0..1 source-image coordinates
  const [center, setCenter] = useState<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5,
  });

  // Oriented image preview URL for 90/180/270 deg rotations
  const [orientedUrl, setOrientedUrl] = useState<string>(image.objectUrl);

  useEffect(() => {
    const normRot = ((rotationDeg % 360) + 360) % 360;
    if (normRot === 0) {
      setOrientedUrl(image.objectUrl);
      return;
    }

    const canvas = document.createElement('canvas');
    if (normRot === 90 || normRot === 270) {
      canvas.width = image.height;
      canvas.height = image.width;
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setOrientedUrl(image.objectUrl);
      return;
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.drawImage(image.element, -image.width / 2, -image.height / 2);

    let active = true;
    let createdUrl: string | null = null;
    canvas.toBlob((blob) => {
      if (!blob || !active) return;
      createdUrl = URL.createObjectURL(blob);
      setOrientedUrl(createdUrl);
    }, 'image/jpeg', 0.95);

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [image, rotationDeg]);

  // Reset center and zoom when source image changes
  useEffect(() => {
    setZoom(1);
    setCenter({ x: 0.5, y: 0.5 });
    setInnerBox({ x: 0, y: 0, width: 1, height: 1 });
  }, [image.objectUrl, rotationDeg]);

  // Compute the normalized slice (width & height in 0..1 of source image) visible inside the window
  const sliceSize = useMemo(() => {
    let baseW: number;
    let baseH: number;
    if (effectiveImgAspect > windowAspect) {
      baseH = 1;
      baseW = windowAspect / effectiveImgAspect;
    } else {
      baseW = 1;
      baseH = effectiveImgAspect / windowAspect;
    }

    return {
      width: Math.min(1, baseW / zoom),
      height: Math.min(1, baseH / zoom),
    };
  }, [effectiveImgAspect, windowAspect, zoom]);

  // Clamp center so the image always fills the target window without empty gaps
  const clampedCenter = useMemo(() => {
    const halfW = sliceSize.width / 2;
    const halfH = sliceSize.height / 2;
    return {
      x: Math.max(halfW, Math.min(1 - halfW, center.x)),
      y: Math.max(halfH, Math.min(1 - halfH, center.y)),
    };
  }, [center.x, center.y, sliceSize.width, sliceSize.height]);

  // Window-level crop in 0..1 source-image coordinates
  const windowCrop: CropRect = useMemo(() => {
    const x = Math.max(
      0,
      Math.min(1 - sliceSize.width, clampedCenter.x - sliceSize.width / 2)
    );
    const y = Math.max(
      0,
      Math.min(1 - sliceSize.height, clampedCenter.y - sliceSize.height / 2)
    );
    return {
      x,
      y,
      width: sliceSize.width,
      height: sliceSize.height,
    };
  }, [clampedCenter.x, clampedCenter.y, sliceSize.width, sliceSize.height]);

  // Effective crop combining windowCrop + innerBox (if user adjusted the crop box)
  const effectiveCrop: CropRect = useMemo(() => {
    return {
      x: windowCrop.x + innerBox.x * windowCrop.width,
      y: windowCrop.y + innerBox.y * windowCrop.height,
      width: windowCrop.width * innerBox.width,
      height: windowCrop.height * innerBox.height,
    };
  }, [windowCrop, innerBox]);

  // Emit effectiveCrop to parent whenever it changes
  useEffect(() => {
    onChangeCrop(effectiveCrop);
  }, [
    effectiveCrop.x,
    effectiveCrop.y,
    effectiveCrop.width,
    effectiveCrop.height,
  ]);

  // Calculate exact pixel dimensions of the target window inside the stage
  const windowPixelSize = useMemo(() => {
    const maxW = 260;
    const maxH = 240;
    let w = maxW;
    let h = w / windowAspect;
    if (h > maxH) {
      h = maxH;
      w = h * windowAspect;
    }
    return {
      width: Math.max(80, Math.round(w)),
      height: Math.max(60, Math.round(h)),
    };
  }, [windowAspect]);

  // Pointer drag state for panning the image or resizing the crop box/window
  const [activeHandle, setActiveHandle] = useState<HandleMode>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startCenter: { x: number; y: number };
    startWinW: number;
    startWinH: number;
    startInnerBox: CropRect;
  } | null>(null);

  // Multi-touch pinch-to-zoom tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );
  const pinchStartRef = useRef<{
    distance: number;
    startZoom: number;
  } | null>(null);

  const applyZoom = (nextZoomRaw: number) => {
    const nextZoom = Math.max(1, Math.min(5, Number(nextZoomRaw.toFixed(2))));
    setZoom(nextZoom);
  };

  // Apply the inner crop box into the main zoom/center view
  const handleApplyCrop = () => {
    if (
      innerBox.x !== 0 ||
      innerBox.y !== 0 ||
      innerBox.width !== 1 ||
      innerBox.height !== 1
    ) {
      const newCenterX =
        windowCrop.x + (innerBox.x + innerBox.width / 2) * windowCrop.width;
      const newCenterY =
        windowCrop.y + (innerBox.y + innerBox.height / 2) * windowCrop.height;

      // Update free aspect if unlocked, and zoom in to fit the cropped box
      if (!aspectLocked) {
        const boxAspect =
          (windowPixelSize.width * innerBox.width) /
          Math.max(1, windowPixelSize.height * innerBox.height);
        setFreeWindowAspect(boxAspect);
      }
      const zoomFactor = 1 / Math.max(innerBox.width, innerBox.height);
      setZoom((prev) => Math.min(5, Number((prev * zoomFactor).toFixed(2))));
      setCenter({ x: newCenterX, y: newCenterY });
      setInnerBox({ x: 0, y: 0, width: 1, height: 1 });
    }
    setIsCropBoxMode(false);
    setCropSavedFeedback(true);
    window.setTimeout(() => setCropSavedFeedback(false), 1800);
  };

  const handlePointerDown = (e: React.PointerEvent, mode: HandleMode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRef.current = {
        distance: Math.max(10, dist),
        startZoom: zoom,
      };
      setActiveHandle(null);
      return;
    }

    setActiveHandle(mode);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCenter: { ...clampedCenter },
      startWinW: windowPixelSize.width,
      startWinH: windowPixelSize.height,
      startInnerBox: { ...innerBox },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
    }

    // 2-finger pinch zoom
    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const scale = dist / pinchStartRef.current.distance;
      applyZoom(pinchStartRef.current.startZoom * scale);
      return;
    }

    if (!activeHandle || !dragStartRef.current || !windowRef.current) return;

    const dxPx = e.clientX - dragStartRef.current.clientX;
    const dyPx = e.clientY - dragStartRef.current.clientY;
    const winRect = windowRef.current.getBoundingClientRect();
    if (winRect.width === 0 || winRect.height === 0) return;

    if (activeHandle === 'pan') {
      // 1:1 finger/cursor tracking: dragging right moves image right (center moves left)
      const dxNormWindow = dxPx / winRect.width;
      const dyNormWindow = dyPx / winRect.height;

      const nextX =
        dragStartRef.current.startCenter.x - dxNormWindow * sliceSize.width;
      const nextY =
        dragStartRef.current.startCenter.y - dyNormWindow * sliceSize.height;

      const halfW = sliceSize.width / 2;
      const halfH = sliceSize.height / 2;

      setCenter({
        x: Math.max(halfW, Math.min(1 - halfW, nextX)),
        y: Math.max(halfH, Math.min(1 - halfH, nextY)),
      });
      return;
    }

    // If Crop Box mode is active, handles adjust the inner crop box within the window
    if (isCropBoxMode) {
      const dxNorm = dxPx / winRect.width;
      const dyNorm = dyPx / winRect.height;
      const sb = dragStartRef.current.startInnerBox;
      const minSize = 0.15;

      if (activeHandle === 'move-box') {
        setInnerBox({
          ...sb,
          x: Math.max(0, Math.min(1 - sb.width, sb.x + dxNorm)),
          y: Math.max(0, Math.min(1 - sb.height, sb.y + dyNorm)),
        });
        return;
      }

      let nx = sb.x;
      let ny = sb.y;
      let nw = sb.width;
      let nh = sb.height;
      const right = sb.x + sb.width;
      const bottom = sb.y + sb.height;

      if (activeHandle.includes('e')) {
        nw = Math.max(minSize, Math.min(1 - sb.x, sb.width + dxNorm));
      }
      if (activeHandle.includes('w')) {
        nw = Math.max(minSize, Math.min(right, sb.width - dxNorm));
        nx = right - nw;
      }
      if (activeHandle.includes('s')) {
        nh = Math.max(minSize, Math.min(1 - sb.y, sb.height + dyNorm));
      }
      if (activeHandle.includes('n')) {
        nh = Math.max(minSize, Math.min(bottom, sb.height - dyNorm));
        ny = bottom - nh;
      }

      if (aspectLocked && targetAspect) {
        // Maintain target window aspect ratio (which is 1:1 in normalized innerBox coords)
        const lockedSize = Math.min(nw, nh, 1 - nx, 1 - ny);
        nw = Math.max(minSize, lockedSize);
        nh = Math.max(minSize, lockedSize);
      }

      setInnerBox({
        x: Math.max(0, Math.min(1 - nw, nx)),
        y: Math.max(0, Math.min(1 - nh, ny)),
        width: nw,
        height: nh,
      });
      return;
    }

    // Otherwise, in Free Window Shape mode, handles reshape the window aspect ratio
    if (aspectLocked) {
      onToggleAspectLock(false);
    }

    let nextW = dragStartRef.current.startWinW;
    let nextH = dragStartRef.current.startWinH;

    if (activeHandle.includes('e')) nextW += dxPx * 1.5;
    if (activeHandle.includes('w')) nextW -= dxPx * 1.5;
    if (activeHandle.includes('s')) nextH += dyPx * 1.5;
    if (activeHandle.includes('n')) nextH -= dyPx * 1.5;

    nextW = Math.max(60, Math.min(400, nextW));
    nextH = Math.max(50, Math.min(340, nextH));

    setFreeWindowAspect(nextW / nextH);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    setActiveHandle(null);
    dragStartRef.current = null;
  };

  // Mouse wheel zoom directly on the stage
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    applyZoom(zoom + delta);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter({ x: 0.5, y: 0.5 });
    setInnerBox({ x: 0, y: 0, width: 1, height: 1 });
    setIsCropBoxMode(false);
    if (targetAspect && targetAspect > 0) {
      setFreeWindowAspect(targetAspect);
    }
  };

  const handleQuickDownload = () => {
    if (!processedOutput) return;
    const link = document.createElement('a');
    link.href = processedOutput.previewUrl;
    link.download = processedOutput.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exact CSS positioning of the image relative to the target window
  const imgWidthPercent = (1 / windowCrop.width) * 100;
  const imgHeightPercent = (1 / windowCrop.height) * 100;
  const imgLeftPercent = -(windowCrop.x / windowCrop.width) * 100;
  const imgTopPercent = -(windowCrop.y / windowCrop.height) * 100;

  const displayExportW =
    aspectLocked && targetWidth
      ? targetWidth
      : Math.max(1, Math.round(effectiveCrop.width * effectiveImgW));
  const displayExportH =
    aspectLocked && targetHeight
      ? targetHeight
      : Math.max(1, Math.round(effectiveCrop.height * effectiveImgH));

  return (
    <section aria-labelledby="crop-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="crop-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          03. Zoom, Crop &amp; Live Output Preview
        </h2>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <span>
            Target: {displayExportW} × {displayExportH} px
          </span>
          <span aria-hidden="true">·</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
        {/* Top Toolbar: Target Window Lock, Free Shape, Crop Option, Rotate, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex flex-wrap items-center rounded-xl bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                onToggleAspectLock(true);
                if (targetAspect) setFreeWindowAspect(targetAspect);
              }}
              disabled={!targetAspect}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                aspectLocked && targetAspect
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
              }`}
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Match Target</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleAspectLock(false)}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                !aspectLocked
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Unlock className="h-3.5 w-3.5 shrink-0" />
              <span>Free Shape</span>
            </button>

            {/* Explicit Crop Option Button */}
            <button
              type="button"
              onClick={() => setIsCropBoxMode((prev) => !prev)}
              className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                isCropBoxMode
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <CropIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{isCropBoxMode ? 'Editing Crop Box' : 'Crop Option'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {(isCropBoxMode || cropSavedFeedback) && (
              <button
                type="button"
                onClick={handleApplyCrop}
                className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{cropSavedFeedback ? 'Cropped' : 'Apply Crop'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRotate}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              title="Rotate image 90 degrees clockwise"
            >
              <RotateCw className="h-3.5 w-3.5 shrink-0" />
              <span>Rotate</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              title="Reset zoom and center image"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side (or Stacked on Mobile): Target Window + Live Output Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {/* LEFT / TOP: Interactive Target Window Stage */}
          <div
            ref={stageRef}
            onWheel={handleWheel}
            onPointerDown={(e) => handlePointerDown(e, 'pan')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative flex min-h-[310px] flex-col items-center justify-between overflow-hidden rounded-xl bg-slate-950 p-4 select-none touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Active Window Spec Label Above Frame */}
            <div className="z-20 flex items-center gap-1.5 text-[11px] font-mono text-white/90 pointer-events-none">
              <span className="truncate max-w-[160px]">
                {activePresetName && aspectLocked
                  ? activePresetName
                  : aspectLocked
                    ? 'Target Window'
                    : 'Free Window'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {displayExportW}×{displayExportH}
              </span>
            </div>

            {/* The Export Window — shaped to the exact chosen export dimensions */}
            <div
              ref={windowRef}
              style={{
                width: `${windowPixelSize.width}px`,
                height: `${windowPixelSize.height}px`,
                boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.72)',
              }}
              className="relative z-10 my-2 border-2 border-white shadow-lg"
            >
              {/* Image positioned under the window */}
              <img
                src={orientedUrl}
                alt="Drag to reposition inside target window"
                referrerPolicy="no-referrer"
                draggable={false}
                style={{
                  position: 'absolute',
                  width: `${imgWidthPercent}%`,
                  height: `${imgHeightPercent}%`,
                  left: `${imgLeftPercent}%`,
                  top: `${imgTopPercent}%`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="pointer-events-none select-none"
              />

              {/* Rule-of-thirds alignment grid inside the export window */}
              {!isCropBoxMode && (
                <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/35" />
                  <div className="border-r border-b border-white/35" />
                  <div className="border-b border-white/35" />
                  <div className="border-r border-b border-white/35" />
                  <div className="border-r border-b border-white/35" />
                  <div className="border-b border-white/35" />
                  <div className="border-r border-white/35" />
                  <div className="border-r border-white/35" />
                  <div />
                </div>
              )}

              {/* Interactive Crop Box Overlay when "Crop Option" is enabled */}
              {isCropBoxMode && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'move-box')}
                  style={{
                    left: `${innerBox.x * 100}%`,
                    top: `${innerBox.y * 100}%`,
                    width: `${innerBox.width * 100}%`,
                    height: `${innerBox.height * 100}%`,
                    boxShadow: '0 0 0 999px rgba(15, 23, 42, 0.55)',
                  }}
                  className="absolute z-20 border-2 border-amber-400 cursor-move touch-none"
                >
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-amber-300/40" />
                    <div className="border-r border-b border-amber-300/40" />
                    <div className="border-b border-amber-300/40" />
                    <div className="border-r border-b border-amber-300/40" />
                    <div className="border-r border-b border-amber-300/40" />
                    <div className="border-b border-amber-300/40" />
                    <div className="border-r border-amber-300/40" />
                    <div className="border-r border-amber-300/40" />
                    <div />
                  </div>

                  {/* 8 Handles on the Crop Box */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -left-3 -top-3 flex h-8 w-8 cursor-nwse-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 bg-amber-400" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -right-3 -top-3 flex h-8 w-8 cursor-nesw-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 bg-amber-400" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-3 -left-3 flex h-8 w-8 cursor-nesw-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 bg-amber-400" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-3 -right-3 flex h-8 w-8 cursor-nwse-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 bg-amber-400" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                    className="absolute left-1/2 -top-3 -translate-x-1/2 flex h-6 w-10 cursor-ns-resize items-center justify-center touch-none"
                  >
                    <span className="h-1.5 w-5 rounded-full bg-amber-400 border border-slate-950" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                    className="absolute left-1/2 -bottom-3 -translate-x-1/2 flex h-6 w-10 cursor-ns-resize items-center justify-center touch-none"
                  >
                    <span className="h-1.5 w-5 rounded-full bg-amber-400 border border-slate-950" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                    className="absolute top-1/2 -left-3 -translate-y-1/2 flex h-10 w-6 cursor-ew-resize items-center justify-center touch-none"
                  >
                    <span className="h-5 w-1.5 rounded-full bg-amber-400 border border-slate-950" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                    className="absolute top-1/2 -right-3 -translate-y-1/2 flex h-10 w-6 cursor-ew-resize items-center justify-center touch-none"
                  >
                    <span className="h-5 w-1.5 rounded-full bg-amber-400 border border-slate-950" />
                  </div>
                </div>
              )}

              {/* Free Window Shape handles when not in inner crop box mode */}
              {!aspectLocked && !isCropBoxMode && (
                <>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -left-3.5 -top-3.5 z-20 flex h-9 w-9 cursor-nwse-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 rounded-xs border-2 border-slate-900 bg-white shadow" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -right-3.5 -top-3.5 z-20 flex h-9 w-9 cursor-nesw-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 rounded-xs border-2 border-slate-900 bg-white shadow" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-3.5 -left-3.5 z-20 flex h-9 w-9 cursor-nesw-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 rounded-xs border-2 border-slate-900 bg-white shadow" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-3.5 -right-3.5 z-20 flex h-9 w-9 cursor-nwse-resize items-center justify-center touch-none"
                  >
                    <span className="h-3.5 w-3.5 rounded-xs border-2 border-slate-900 bg-white shadow" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                    className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-7 cursor-ew-resize items-center justify-center touch-none"
                  >
                    <span className="h-5 w-1.5 rounded-full border border-slate-900 bg-white shadow" />
                  </div>
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                    className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex h-7 w-10 cursor-ns-resize items-center justify-center touch-none"
                  >
                    <span className="h-1.5 w-5 rounded-full border border-slate-900 bg-white shadow" />
                  </div>
                </>
              )}
            </div>

            {/* Drag Instruction Overlay */}
            <div className="z-20 flex items-center gap-1.5 text-[11px] text-slate-300 pointer-events-none text-center">
              <Move className="h-3 w-3 text-white/80 shrink-0" />
              <span>
                {isCropBoxMode
                  ? 'Drag yellow handles to crop · Tap Apply Crop'
                  : 'Drag image to move · Scroll or pinch to zoom'}
              </span>
            </div>
          </div>

          {/* RIGHT / BELOW: Live Output Preview Right Beside/Below Target Window */}
          <div className="flex min-h-[310px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Live Output Preview
              </span>
              {processedOutput && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    processedOutput.inRange
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {processedOutput.sizeKB} KB ·{' '}
                  {processedOutput.width}×{processedOutput.height} px
                </span>
              )}
            </div>

            <div className="my-2 flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-white p-3">
              {processedOutput ? (
                <img
                  src={processedOutput.previewUrl}
                  alt="Live cropped and compressed output preview"
                  referrerPolicy="no-referrer"
                  style={{
                    maxWidth: `${windowPixelSize.width}px`,
                    maxHeight: `${windowPixelSize.height}px`,
                  }}
                  className="h-auto w-auto rounded-xs border border-slate-200 object-contain shadow-xs"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-xs text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 mb-2" />
                  <span>Rendering preview…</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-500 truncate">
                {isProcessing
                  ? 'Updating JPG…'
                  : processedOutput
                    ? `JPG · Quality ${Math.round(processedOutput.quality * 100)}%`
                    : ''}
              </span>

              {processedOutput && (
                <button
                  type="button"
                  onClick={handleQuickDownload}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>Download JPG</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zoom Slider & Quick Zoom Buttons */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => applyZoom(zoom - 0.25)}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="image-zoom-slider"
                  className="font-medium text-slate-700"
                >
                  Zoom Image
                </label>
                <span className="font-mono text-slate-600">
                  {zoom.toFixed(2)}× ({Math.round(zoom * 100)}%)
                </span>
              </div>
              <input
                id="image-zoom-slider"
                type="range"
                min={100}
                max={500}
                step={5}
                value={Math.round(zoom * 100)}
                onChange={(e) => applyZoom(Number(e.target.value) / 100)}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={() => applyZoom(zoom + 0.25)}
              disabled={zoom >= 5}
              aria-label="Zoom in"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              {[1, 1.5, 2, 3, 4].map((presetZoom) => (
                <button
                  key={presetZoom}
                  type="button"
                  onClick={() => applyZoom(presetZoom)}
                  className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-colors whitespace-nowrap ${
                    Math.abs(zoom - presetZoom) < 0.08
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {presetZoom}×
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCropBoxMode((prev) => !prev)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <CropIcon className="h-3.5 w-3.5" />
                <span>{isCropBoxMode ? 'Hide Crop Handles' : 'Crop'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCenter({ x: 0.5, y: 0.5 })}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Center Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
