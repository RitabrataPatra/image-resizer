# ExactSpec

ExactSpec is a browser-based tool for preparing photos and signatures for online forms. It crops and resizes JPG and PNG images to specified dimensions and JPEG file-size ranges, then lets users preview and download the result without uploading their images to an application server.

## Features

- Load JPG or PNG images from a device, by drag and drop, or through the camera input where supported. Files over 30 MB are rejected.
- Crop, reposition, zoom, and rotate an image before export.
- Set a minimum and maximum output size in KB, with optional pixel dimensions or physical dimensions in centimetres and DPI.
- Start from one of three published photo and signature presets, or enter custom targets.
- Preview the JPG's dimensions, file size, and JPEG quality before downloading. Generated portrait and signature samples are available for trying the workflow.

Presets are starting points, not universal requirements. Check the destination's instructions and review the output before submitting it.

## Demo

[https://www.exactspec.app/](https://www.exactspec.app/)

## Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript |
| Framework and rendering | Astro 7 with static output; React integration for the interactive resizer |
| Styling | Tailwind CSS 4 through `@tailwindcss/vite` |
| Image processing | Browser File and Image APIs, HTML Canvas, and JPEG encoding with `canvas.toBlob()` |
| Icons | Lucide React |
| Testing | Node.js built-in test runner, executed with `tsx` |
| Build and SEO | Astro check/build, `@astrojs/sitemap`, and a Node.js canonical URL validation script |
| Package management | npm with `package-lock.json` |

## How It Works

1. Select or drop a JPG/PNG image, use a supported device camera, or load a generated sample.
2. Choose a published preset or set a KB range and optional output dimensions. Centimetres and DPI are converted to pixels.
3. Crop, position, zoom, or rotate the image. The browser draws the result to a canvas at the requested dimensions.
4. ExactSpec searches JPEG quality values for an output in the requested file-size range. If it cannot reach the range, it reports the closest result or explains why.
5. Review the preview and output details, then download the JPG.

## Project Structure

```text
.
├── astro.config.mjs
├── package.json
├── scripts/
│   └── check-canonicals.mjs
├── public/
│   ├── favicon.svg
│   ├── social-preview.png
│   └── social-preview.svg
└── src/
    ├── App.tsx
    ├── components/
    ├── data/
    │   └── presets.ts
    ├── layouts/
    │   └── Layout.astro
    ├── pages/
    └── utils/
        ├── dimensions.ts
        ├── imageProcessor.ts
        ├── sizeTargeting.ts
        └── sizeTargeting.test.ts
```

- `src/App.tsx` coordinates resizer state; `src/components/` contains the upload, requirements, crop, and result UI.
- `src/data/presets.ts` holds preset settings. The dynamic `[slug].astro` route and all-sizes page use published entries only.
- `src/pages/` contains the homepage, preset and guide routes, informational pages, 404, and `robots.txt`.
- `src/layouts/Layout.astro` provides shared metadata and navigation. `src/components/StructuredData.astro` renders JSON-LD.
- `src/utils/` contains image processing, dimension conversion, file-size targeting, and tests.
- `scripts/check-canonicals.mjs` checks canonical and Open Graph URLs in generated HTML. Astro writes the static site to `dist/`; `.astro/` is generated state.

Pages include `/`, `/about/`, `/affiliate-disclosure/`, `/all-sizes/`, `/contact/`, `/privacy/`, `/terms/`, and `/guides/reduce-image-file-size/`. Published preset routes are `/photo-50-kb/`, `/passport-size-photo-35x45-mm/`, and `/signature-10-kb/`. Astro generates the not-found page as `404.html`.

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+.
- npm.

### Setup

```bash
git clone https://github.com/RitabrataPatra/image-resizer.git
cd image-resizer
npm ci
npm run dev
```

The development server listens on port `3000` and binds to `0.0.0.0`. Use `npm run build` to generate the production site and `npm run preview` to serve it locally on port `4321`.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro development server on port 3000. |
| `npm run build` | Run `astro check`, generate the static site, then validate canonical and Open Graph URLs. |
| `npm run preview` | Preview the built site locally on port 4321. Run the build first. |
| `npm run lint` | Run `tsc --noEmit` for a TypeScript check. |
| `npm test` | Run the utility tests with `tsx --test`. |
| `npm run clean` | Remove `dist` and `.astro` generated output. The script uses `rm -rf`, so shell compatibility may vary. |

## Testing

The suite uses Node.js's built-in `node:test` and strict assertions, run through `tsx`. It covers JPEG quality search outcomes, file-size range distance, centimetre/DPI conversion, crop aspect calculations, and quick-preset configuration.

## SEO & Performance

- Astro statically generates the site; `astro.config.mjs` sets `output: 'static'`.
- The shared layout supplies page titles and descriptions, canonical URLs (the 404 page opts out), Open Graph tags, Twitter card tags, and the SVG favicon. The canonical origin is configured in `src/site.ts`.
- The sitemap integration filters out Contact, Privacy, Terms, the 404 output, and unpublished preset routes. `src/pages/robots.txt.ts` allows crawling and points to the generated sitemap index.
- The homepage includes `WebSite` and `WebApplication` JSON-LD. Published preset pages include `BreadcrumbList` JSON-LD.
- Contact, Privacy, Terms, and 404 pages are marked `noindex`.
- The build runs a canonical and Open Graph URL check against generated HTML.

## Privacy

Image selection, decoding, cropping, resizing, preview generation, and JPEG encoding use browser APIs and local object URLs/canvas. The application code does not upload image files to an application server. The source image and generated output remain in the browser during use; the downloaded JPG is saved through the browser's download behavior.

## Deployment

The project is configured for static output and the production site uses the custom domain [www.exactspec.app](https://www.exactspec.app). To deploy on Vercel, connect the repository and use:

- **Build command:** `npm run build`
- **Output directory:** `dist`

No Vercel-specific configuration file is present; the build settings are defined by the npm script and Astro configuration.

## Development Notes

- Astro renders the page content and routes as static HTML. The interactive resizer is a React island hydrated with `client:load` on the homepage and published preset pages.

## Future Improvements

- Add browser-level tests for upload, crop, and download, and expand utility coverage for validation and canvas edge cases.
- Review preset source requirements periodically and publish draft presets only after verification.

## License

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
