export interface ImagePreset {
  name: string;
  width: number;
  height: number;
  minKB: number;
  maxKB: number;
  /** Optional physical dimensions in cm + DPI for presets defined by physical print size */
  widthCm?: number;
  heightCm?: number;
  dpi?: number;
}

/**
 * Editable list of image resize & file-size presets.
 * Add or modify entries below to customize quick-fill buttons in the UI.
 */
export const PRESETS: ImagePreset[] = [
  {
    name: 'Photo 20-50 KB',
    width: 400,
    height: 500,
    minKB: 20,
    maxKB: 50,
  },
  {
    name: 'Signature 10-20 KB',
    width: 500,
    height: 180,
    minKB: 10,
    maxKB: 20,
  },
  {
    name: 'Passport size 3.5 x 4.5 cm',
    width: 413,
    height: 531,
    minKB: 20,
    maxKB: 100,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
  },
];
