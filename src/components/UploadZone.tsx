import React, { useRef, useState } from 'react';
import { Upload, Camera, AlertCircle, FileImage, Sparkles } from 'lucide-react';
import { LoadedImageInfo } from '../utils/imageProcessor';
import { formatFileSize } from '../utils/dimensions';

interface UploadZoneProps {
  loadedImage: LoadedImageInfo | null;
  error: string | null;
  isLoading: boolean;
  onSelectFile: (file: File) => void;
  onLoadSample: (kind: 'portrait' | 'signature') => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  loadedImage,
  error,
  isLoading,
  onSelectFile,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  return (
    <section aria-labelledby="upload-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="upload-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          01. Source Photo or Signature
        </h2>
        <span className="text-xs text-red-700">
          JPG and PNG only · Up to 30 MB
        </span>
      </div>

      {/* Hidden file inputs for gallery/files and direct mobile camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose JPG or PNG photo from device"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take photo with camera"
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="space-y-1">
            <p className="font-semibold text-red-950">Cannot load image</p>
            <p className="text-red-800 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {!loadedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-5 sm:p-7 transition-colors ${
            isDragging
              ? 'border-slate-900 bg-slate-100/80'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-900">
              Select a JPG or PNG photo or signature image
            </p>
            <p className="mt-1 max-w-md text-lg sm:text-lg text-slate-500">
              Drag and drop a JPG or PNG file here, or choose from your phone’s camera roll. Everything stays on your device.
            </p>
            <br/>
            <p className="text-md font-bold text-slate-900">
             Fully Private by design · Your images never leave your device. They are not uploaded to any server.
            </p>

            <div className="mt-5 grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.99] hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
              >
                <FileImage className="h-4 w-4 shrink-0" />
                <span>Choose JPG / PNG</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => cameraInputRef.current?.click()}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 whitespace-nowrap"
              >
                <Camera className="h-4 w-4 shrink-0" />
                <span>Take Camera Photo</span>
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                Try a sample:
              </span>
              <button
                type="button"
                onClick={() => onLoadSample('portrait')}
                className="min-h-[36px] rounded-lg px-2.5 py-1.5 font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-900 whitespace-nowrap"
              >
                Sample Portrait Photo
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onLoadSample('signature')}
                className="min-h-[36px] rounded-lg px-2.5 py-1.5 font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-900 whitespace-nowrap"
              >
                Sample Ink Signature
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={loadedImage.objectUrl}
              alt={loadedImage.name}
              referrerPolicy="no-referrer"
              className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover bg-slate-100"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {loadedImage.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-mono">
                <span>{formatFileSize(loadedImage.sizeBytes)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {loadedImage.width} × {loadedImage.height} px
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {loadedImage.type.replace('image/', '').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Change Image</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
