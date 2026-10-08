import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const allowedVus = [10, 50, 100, 250, 500, 1000];
const vus = Number(__ENV.VUS || '10');
const duration = __ENV.DURATION || '5m';
const baseUrl = __ENV.BASE_URL || 'http://localhost:4321';
const baseUrlMatch = baseUrl.match(
  /^http:\/\/(localhost|127\.0\.0\.1)(?::(\d{1,5}))?\/?$/i
);

if (
  !baseUrlMatch ||
  (baseUrlMatch[2] &&
    (Number(baseUrlMatch[2]) < 1 || Number(baseUrlMatch[2]) > 65535))
) {
  throw new Error(
    'BASE_URL must be a local HTTP origin such as http://127.0.0.1:4321. Public hosts are refused.'
  );
}

if (!allowedVus.includes(vus)) {
  throw new Error(`VUS must be one of: ${allowedVus.join(', ')}.`);
}

if (vus === 1000 && __ENV.ALLOW_1000 !== 'YES') {
  throw new Error(
    'The 1,000-VU stage requires an explicit -e ALLOW_1000=YES.'
  );
}

if (!/^\d+(?:\.\d+)?(?:ms|s|m|h)$/.test(duration)) {
  throw new Error('DURATION must be a k6 duration such as 30s, 5m, or 1h.');
}

const origin = `http://${baseUrlMatch[1].toLowerCase()}${
  baseUrlMatch[2] ? `:${baseUrlMatch[2]}` : ''
}`;
const routes = [
  '/',
  '/all-sizes/',
  '/photo-50-kb/',
  '/passport-size-photo-35x45-mm/',
  '/signature-10-kb/',
];
const localAssetPattern = /\.(?:m?js|css|svg|png|jpe?g|webp|avif|woff2?)(?:[?#]|$)/i;
const requestFailures = new Counter('request_failures');
const requestFailureRate = new Rate('request_failure_rate');

http.setResponseCallback(http.expectedStatuses(200));

export const options = {
  scenarios: {
    local_static_site: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: Math.ceil(vus * 0.25), duration: '30s' },
        { target: Math.ceil(vus * 0.5), duration: '30s' },
        { target: Math.ceil(vus * 0.75), duration: '30s' },
        { target: vus, duration: '30s' },
        { target: vus, duration },
        { target: 0, duration: '30s' },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
    request_failure_rate: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Each k6 VU has its own JS runtime and cookie jar; cookies persist across its requests.
const cachedAssets = new Set();

function recordResponse(response, kind, url) {
  const ok = response.status === 200;
  check(response, {
    [`${kind} returns 200`]: () => ok,
  });
  requestFailureRate.add(!ok, { kind });

  if (!ok) {
    requestFailures.add(1, { kind, url });
  }

  return ok;
}

function getLocalAssetPaths(html) {
  const assetPaths = new Set();
  const attributePattern = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = attributePattern.exec(html)) !== null) {
    const candidate = match[1];
    if (
      !candidate.startsWith('/') ||
      candidate.startsWith('//') ||
      !localAssetPattern.test(candidate)
    ) {
      continue;
    }

    const assetUrl = `${origin}${candidate}`;
    if (!cachedAssets.has(assetUrl)) {
      assetPaths.add(assetUrl);
    }
  }

  return [...assetPaths];
}

export default function () {
  const route = routes[(__VU - 1 + __ITER) % routes.length];
  const pageUrl = `${origin}${route}`;
  const page = http.get(pageUrl, {
    redirects: 0,
    tags: { kind: 'document', name: `GET ${route}` },
  });

  if (!recordResponse(page, 'document', route)) {
    sleep(1);
    return;
  }

  const assetUrls = getLocalAssetPaths(page.body);
  if (assetUrls.length > 0) {
    const responses = http.batch(
      assetUrls.map((url) => ({
        method: 'GET',
        url,
        params: {
          redirects: 0,
          tags: { kind: 'asset', name: 'GET local asset' },
        },
      }))
    );

    responses.forEach((response, index) => {
      if (recordResponse(response, 'asset', assetUrls[index])) {
        cachedAssets.add(assetUrls[index]);
      }
    });
  }

  sleep(1);
}
