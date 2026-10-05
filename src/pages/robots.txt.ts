import { SITE_URL } from '../site';

export const GET = () => {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap-index.xml\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
