import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  LoadedImageInfo,
  ProcessedImageOutput,
} from '../utils/imageProcessor';
import { formatFileSize } from '../utils/dimensions';

interface ResultCardProps {
  original: LoadedImageInfo;
  result: ProcessedImageOutput | null;
  isProcessing: boolean;
  minKB: number;
  maxKB: number;
  onAutoScaleDimensions?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  original,
  result,
  isProcessing,
  minKB,
  maxKB,
  onAutoScaleDimensions,
}) => {
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section aria-labelledby="result-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="result-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          04. Final Output Image &amp; Download
        </h2>
        {result && (
          <span className="text-xs font-mono text-slate-500">
            JPEG Quality: {Math.round(result.quality * 100)}%
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-5">
        {isProcessing && !result ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Optimizing JPEG quality to match {minKB}–{maxKB} KB…
            </p>
          </div>
        ) : result ? (
          <>
            {/* Status & Plain-Language Explanation Banner */}
            <div
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
                result.inRange
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                  : 'border-amber-200 bg-amber-50/80 text-amber-950'
              }`}
            >
              {result.inRange ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              )}

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {result.inRange
                      ? 'Exact requirement matched'
                      : 'Closest possible JPEG result'}
                  </p>
                  <span className="text-xs font-mono">
                    Target: {minKB}–{maxKB} KB
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {result.explanation}
                </p>

                {!result.inRange &&
                  (result.status === 'below_min' ||
                    result.status === 'above_max') &&
                  onAutoScaleDimensions && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onAutoScaleDimensions}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-2xs hover:bg-amber-100/50 transition-colors whitespace-nowrap"
                      >
                        <Sliders className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {result.status === 'below_min'
                            ? 'Scale up pixel dimensions to reach Min KB'
                            : 'Scale down pixel dimensions to fit Max KB'}
                        </span>
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Original vs New Comparison Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <p className="text-xs font-medium text-slate-500">
                  Original Image
                </p>
                <p className="mt-1 text-lg font-bold font-mono text-slate-800">
                  {formatFileSize(original.sizeBytes)}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-slate-600">
                  <span>
                    {original.width} × {original.height} px
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {original.type.replace('image/', '').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-900/15 bg-slate-900/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900">
                    New Output (JPG)
                  </p>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                </div>
                <p className="mt-1 text-lg font-bold font-mono text-slate-900">
                  {result.sizeKB} KB{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({result.sizeBytes.toLocaleString()} bytes)
                  </span>
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-slate-700">
                  <span>
                    {result.width} × {result.height} px
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>JPG</span>
                  <span aria-hidden="true">·</span>
                  <span>Quality {Math.round(result.quality * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Output Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Actual Output Preview</span>
                <span className="font-mono">{result.fileName}</span>
              </div>

              <div className="flex min-h-[180px] max-h-[340px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100/70 p-4">
                <img
                  src={result.previewUrl}
                  alt={`Resized output preview (${result.width}x${result.height}px, ${result.sizeKB} KB)`}
                  referrerPolicy="no-referrer"
                  className="max-h-[300px] max-w-full rounded border border-slate-300/80 bg-white object-contain shadow-xs"
                />
              </div>
            </div>

            {/* Primary Download CTA */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>
                Download JPG ({result.sizeKB} KB · {result.width}×{result.height})
              </span>
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
};
