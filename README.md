# ExactSpec — Photo & Signature Size Targeter

**ExactSpec** is a mobile-first, 100% client-side web application that crops, resizes, and compresses photos and signature images to meet strict portal upload requirements (exact KB file-size ranges, pixel dimensions, or physical print dimensions in centimeters + DPI).

All image decoding, cropping, stepped canvas downsampling, and binary-search JPEG compression happen **entirely inside the user's browser**—no files are ever uploaded to a server.

---

## Key Features

- **100% Local & Private**: Uses browser `URL.createObjectURL`, HTML5 `<canvas>`, and `canvas.toBlob` to process images on-device with zero network uploads.
- **Mobile-First Upload & Camera Support**:
  - Drag-and-drop or file picker for `JPG` and `PNG` images.
  - Direct mobile camera capture (`capture="environment"`) and phone camera-roll support.
  - Memory-efficient handling of large **10 MB+ smartphone photos** (up to 30 MB) with clear validation messages for unsupported file types or oversized files.
  - Built-in synthetic **Sample Portrait** and **Sample Ink Signature** generators for one-tap testing.
- **Editable Presets (`src/presets.ts`)**:
  - One-tap presets to populate target KB bounds, pixel dimensions, and physical cm/DPI settings:
    - **Photo 20-50 KB** (`400 × 500 px`, `20–50 KB`)
    - **Signature 10-20 KB** (`500 × 180 px`, `10–20 KB`)
    - **Passport size 3.5 x 4.5 cm** (`3.5 × 4.5 cm` at `300 DPI` → `413 × 531 px`, `20–100 KB`)
- **Pixel & Physical Dimension Synchronization**:
  - Enter exact pixel dimensions (`Width × Height px`) or physical print dimensions (`Width × Height cm` + `DPI`).
  - Automatic bidirectional conversion using standard print math:
    $$\text{Pixels} = \text{round}\left(\frac{\text{cm}}{2.54} \times \text{DPI}\right)$$
- **Target-Window Zoom, Pan & 8-Handle Crop Workspace**:
  - **Target-Dimension Window**: The interactive viewport window automatically matches the aspect ratio of the user's chosen export dimensions (e.g., `3.5 : 4.5` for Passport or `500 : 180` for Signature).
  - **1:1 Image Panning & Slider Zoom (`1×` to `5×`)**: Drag the image directly inside the target window to position faces or signatures, and use the zoom slider, `+` / `-` buttons, or quick zoom presets (`1×`, `1.5×`, `2×`, `3×`, `4×`).
  - **Explicit Crop Option (`Crop Option` / `Apply Crop`) & Free Window Shape**: Toggle an 8-handle interactive crop box (4 corners + 4 edges) or unlock the window shape to crop any custom region freely.
  - **Live Side-by-Side Output Preview**: View the actual rendered JPG output, file size in KB, pixel dimensions, and JPEG quality right beside (or directly below on mobile) the target window.
- **Binary-Search JPEG Quality Targeting**:
  - Automatically binary-searches JPEG quality (`1%` to `100%`) so the final output file size lands inside `[minKB, maxKB]` while maximizing visual clarity.
  - If the target KB range is physically unreachable at the current pixel dimensions (e.g., a small flat-color image is below `minKB` even at `100%` quality, or a huge dimension exceeds `maxKB` even at `1%` quality), the tool returns the **closest possible result**, explains why in plain language, and offers a one-tap button to scale pixel dimensions proportionally.

---

## Project Structure

The codebase is organized into small, focused, easy-to-edit files:

```text
├── presets.ts                       # Root re-export of editable presets
├── src/
│   ├── presets.ts                   # Editable list of presets (name, width, height, minKB, maxKB, cm, dpi)
│   ├── App.tsx                      # Main application state & layout orchestration
│   ├── main.tsx                     # React DOM entry point
│   ├── index.css                    # Tailwind CSS & typography rules
│   ├── components/
│   │   ├── UploadZone.tsx           # Drag-and-drop, file picker, mobile camera input & sample loader
│   │   ├── RequirementsForm.tsx     # Presets bar, Min/Max KB inputs, Pixel & cm/DPI inputs
│   │   ├── CropWorkspace.tsx        # Target-window zoom/pan stage, 8-handle crop option & live preview
│   │   └── ResultCard.tsx           # Original vs. New comparison metrics, status explanation & download
│   └── utils/
│       ├── dimensions.ts            # cm <-> px conversions, aspect-locked crop math & file size formatting
│       ├── sizeTargeting.ts         # Pure binary-search JPEG quality algorithm & plain-language status
│       ├── sizeTargeting.test.ts    # Unit tests for binary-search size targeting & dimension utilities
│       └── imageProcessor.ts        # File validation, stepped canvas downsampling & JPEG Blob encoding
└── package.json                     # Scripts and dependencies
```

---

## Customizing Presets

To add, remove, or modify presets, open **`src/presets.ts`**:

```ts
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
```

Any item added to `PRESETS` automatically renders as a quick-fill button in the UI.

---

## How the Image Processing Pipeline Works

1. **Stepped Canvas Downsampling (`renderCroppedCanvas`)**:
   - Directly scaling a 12 MP (`4000 × 3000 px`) smartphone photo down to a small passport thumbnail (`400 × 500 px`) in a single canvas draw call can cause jagged aliasing artifacts.
   - ExactSpec progressively halves dimensions (`0.5×` steps) with `imageSmoothingQuality = 'high'` until close to the target dimensions, and fills a clean `#FFFFFF` background so transparent PNGs export cleanly to JPEG.
2. **Binary-Search JPEG Quality (`findJpegQualityForSizeRange`)**:
   - First checks `quality = 1.0` (`100%`). If it already fits within `[minKB, maxKB]`, returns immediately at maximum quality. If it is smaller than `minKB`, returns the `100%` result with a `below_min` explanation.
   - Next checks `quality = 0.01` (`1%`). If it still exceeds `maxKB`, returns the `1%` result with an `above_max` explanation.
   - Otherwise, performs a binary search over `[0.01, 1.0]` (up to 10 iterations) to find the **highest JPEG quality** whose encoded byte size lands inside `[minKB * 1024, maxKB * 1024]`.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### 3. Run Unit Tests

Unit tests for the binary-search JPEG quality algorithm and dimension conversion utilities are located in `src/utils/sizeTargeting.test.ts` and use Node's built-in test runner via `tsx`:

```bash
npm test
```

### 4. Type-Check & Build for Production

```bash
npm run lint
npm run build
```
