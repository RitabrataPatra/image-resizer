# ExactSpec — Photo & Signature Size Targeter

ExactSpec is a static Astro site that keeps the existing browser-based image resizer intact while presenting a clean tool-first experience. The app runs entirely in the browser and does not upload files to any backend.

## Run locally

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000.

## Build and test

```bash
npm test
npm run build
```

The production build is fully static and ready to deploy to Vercel.

## Published preset model

Preset pages are generated only from published entries in `src/data/presets.ts`. Draft entries can exist for testing or future verification, but they remain unpublished and are excluded from the sitemap and route generation.

Example:

```ts
{
  slug: 'photo-50-kb',
  type: 'photo',
  name: 'Photo 50 KB',
  minKB: 30,
  maxKB: 50,
  published: true,
  showAsButton: true,
  seoTitle: 'Resize Photo to 50 KB: Free, No Upload',
  seoDescription: 'Reduce your photo to under 50 KB, free, right in your browser. Nothing is uploaded.',
  h1: 'Resize Photo to 50 KB',
  intro: 'Many online forms limit photo uploads to about 50 KB. Upload your JPG or PNG, and this tool adjusts the image until the file lands between 30 and 50 KB.',
}
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repository.
3. Keep the default build settings:
   - Framework Preset: Astro
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

## Project structure

```text
src/
  App.tsx                       # React resizer component used as an Astro island
  data/presets.ts               # published and draft preset metadata
  layouts/Layout.astro          # shared site shell and navigation
  pages/
    index.astro                # tool-first home page
    [slug].astro               # published preset detail pages
    all-sizes.astro            # grouped published preset links
    about.astro                # about page
    contact.astro              # contact page
    privacy.astro              # browser-only privacy statement
    terms.astro                # terms page
    affiliate-disclosure.astro # disclosure page
  utils/
    dimensions.ts
    imageProcessor.ts
    sizeTargeting.ts
    sizeTargeting.test.ts
astro.config.mjs               # Astro, React, sitemap, and Tailwind config
public/
  favicon.svg
  social-preview.png
```

## Privacy note

All image processing remains in the browser. No file is uploaded to a backend during crop, resize, or export steps.
