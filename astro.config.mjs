import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { PRESETS } from './src/data/presets.ts';
import { SITE_URL } from './src/site.ts';

const invalidPublishedPresetSlugs = PRESETS.filter((preset) => {
  if (preset.published === false) return false;

  const visibleContent = [
    preset.name,
    preset.title,
    preset.seoTitle,
    preset.seoDescription,
    preset.description,
    preset.h1,
    preset.intro,
    ...preset.faqs.flatMap(({ q, a }) => [q, a]),
  ].join(' ');

  return (
    !preset.seoTitle ||
    !preset.seoDescription ||
    /TODO|example\.com|draft|unverified|verify against/i.test(visibleContent)
  );
}).map((preset) => preset.slug);

if (invalidPublishedPresetSlugs.length > 0) {
  throw new Error(
    `Published preset SEO metadata is incomplete for: ${invalidPublishedPresetSlugs.join(', ')}`
  );
}

const noindexPresetSlugs = new Set(
  PRESETS.filter((preset) => preset.published === false).map((preset) => preset.slug)
);
const noindexPagePaths = new Set(['contact', 'privacy', 'terms', '404.html']);

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/^\/+|\/+$/g, '');
        return (
          !noindexPresetSlugs.has(pathname) &&
          !noindexPagePaths.has(pathname)
        );
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
