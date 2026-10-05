import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = join(projectRoot, 'dist');
const siteConfig = readFileSync(join(projectRoot, 'src', 'site.ts'), 'utf8');
const siteUrlMatch = siteConfig.match(
  /export\s+const\s+SITE_URL\s*=\s*['"]([^'"]+)['"]/
);

if (!siteUrlMatch) {
  throw new Error('Could not read SITE_URL from src/site.ts');
}

const siteUrl = new URL(siteUrlMatch[1]);

function findHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory()
      ? findHtmlFiles(entryPath)
      : entry.isFile() && entry.name.endsWith('.html')
        ? [entryPath]
        : [];
  });
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match?.[1];
}

function expectedUrlForFile(filePath) {
  const relativePath = relative(outputDirectory, filePath)
    .split(sep)
    .join('/');
  let pathname;

  if (relativePath === 'index.html') {
    pathname = '/';
  } else if (relativePath.endsWith('/index.html')) {
    pathname = `/${relativePath.slice(0, -'index.html'.length)}`;
  } else if (relativePath.endsWith('.html')) {
    pathname = `/${relativePath.slice(0, -'.html'.length)}/`;
  } else {
    throw new Error(`Cannot map built HTML file to a page URL: ${relativePath}`);
  }

  return new URL(pathname, siteUrl).toString();
}

const failures = [];
const prohibitedTextPatterns = [
  /TODO/gi,
  /example\.com/gi,
  /verify against the official notification/gi,
  /\[YOUR EMAIL/gi,
  /\[Currently[^\]]*\]/gi,
];

for (const filePath of findHtmlFiles(outputDirectory)) {
  const html = readFileSync(filePath, 'utf8');
  const relativePath = relative(outputDirectory, filePath);
  const expectedUrl = expectedUrlForFile(filePath);
  const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => getAttribute(tag, 'rel')?.toLowerCase() === 'canonical');
  const openGraphUrlTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => getAttribute(tag, 'property')?.toLowerCase() === 'og:url');
  const canonical = canonicalTags.length === 1
    ? getAttribute(canonicalTags[0], 'href')
    : undefined;
  const openGraphUrl = openGraphUrlTags.length === 1
    ? getAttribute(openGraphUrlTags[0], 'content')
    : undefined;

  if (canonical !== expectedUrl || openGraphUrl !== expectedUrl) {
    failures.push(
      `${relativePath}: expected canonical and og:url ` +
        `${expectedUrl}; received canonical ${canonical ?? 'missing/duplicate'} ` +
        `and og:url ${openGraphUrl ?? 'missing/duplicate'}`
    );
  }

  const robotsTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => getAttribute(tag, 'name')?.toLowerCase() === 'robots');
  const isNoindex = robotsTags.some((tag) =>
    getAttribute(tag, 'content')
      ?.split(',')
      .some((directive) => directive.trim().toLowerCase() === 'noindex')
  );

  if (!isNoindex) {
    for (const pattern of prohibitedTextPatterns) {
      for (const match of html.matchAll(pattern)) {
        failures.push(
          `${relativePath}: prohibited text "${match[0]}" found on an indexable page`
        );
      }
    }
  }
}

const presetSource = readFileSync(
  join(projectRoot, 'src', 'data', 'presets.ts'),
  'utf8'
);
for (const match of presetSource.matchAll(
  /sourceUrl\s*:\s*['"]https?:\/\/(?:www\.)?exactspec\.app(?:[/?#][^'"]*)?['"]/gi
)) {
  failures.push(`src/data/presets.ts: sourceUrl points to ExactSpec: ${match[0]}`);
}

if (failures.length > 0) {
  throw new Error(`Canonical URL check failed:\n${failures.join('\n')}`);
}

console.log(`Canonical URL check passed for ${findHtmlFiles(outputDirectory).length} built pages.`);
