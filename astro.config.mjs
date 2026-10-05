import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { PRESETS } from './src/data/presets.ts';
import { SITE_URL } from './src/site.ts';

const invalidPublishedPresetSlugs = PRESETS.filter(
  (preset) =>
    preset.published !== false &&
    (!preset.seoTitle ||
      !preset.seoDescription ||
      /TODO|example\.com/i.test(
        `${preset.seoTitle} ${preset.seoDescription} ${preset.description} ${preset.intro}`
      ))
).map((preset) => preset.slug);

if (invalidPublishedPresetSlugs.length > 0) {
  throw new Error(
    `Published preset SEO metadata is incomplete for: ${invalidPublishedPresetSlugs.join(', ')}`
  );
}

const noindexPresetSlugs = new Set(
  PRESETS.filter((preset) => preset.published === false).map((preset) => preset.slug)
);

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/^\/+|\/+$/g, '');
        return !noindexPresetSlugs.has(pathname);
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
