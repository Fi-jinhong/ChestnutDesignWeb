import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = 'https://haoqing6.xyz';
const root = process.cwd();
const projectDir = path.join(root, 'outputs', 'haoqing6-local');
const publicDir = path.join(projectDir, 'public');

const seedRoutes = [
  '/',
  '/projects/ccs',
  '/projects/vehicle-hmi',
  '/projects/wms',
  '/projects/digital-twin',
  '/projects/mes-execution-system',
  '/projects/industrial-simulation',
  '/projects/beidou-security-analysis',
  '/projects/beidou-security-operations',
  '/projects/warehouse-visualization',
  '/projects/software-training',
];

const forcedAssets = [
  '/downloads/portfolio-4801e138ef68-1.bin',
  '/downloads/portfolio-4801e138ef68-2.bin',
  '/downloads/portfolio-4801e138ef68-3.bin',
];

const binaryExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.mp4',
  '.webm',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.bin',
  '.ico',
]);

const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml']);

const seenRoutes = new Set();
const seenAssets = new Set();
const routeQueue = [...seedRoutes];
const assetQueue = [];
const report = [];

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

for (const asset of forcedAssets) {
  enqueueAsset(asset);
}

while (routeQueue.length) {
  const route = normalizeRoute(routeQueue.shift());
  if (!route || seenRoutes.has(route)) continue;
  seenRoutes.add(route);

  const html = await fetchText(route);
  const cleaned = cleanHtml(html);
  await saveRoute(route, cleaned);
  report.push(`route ${route}`);

  for (const url of extractInternalUrls(html)) {
    classifyUrl(url);
  }
}

while (assetQueue.length) {
  const asset = normalizePath(assetQueue.shift());
  if (!asset || seenAssets.has(asset)) continue;
  seenAssets.add(asset);

  try {
    const { bytes, contentType } = await fetchBytes(asset);
    await saveAsset(asset, bytes);
    report.push(`asset ${asset} ${bytes.length}`);

    if (isTextAsset(asset, contentType)) {
      const text = new TextDecoder('utf-8').decode(bytes);
      for (const url of extractInternalUrls(text)) {
        classifyUrl(url);
      }
    }
  } catch (error) {
    report.push(`missing ${asset} ${error.message}`);
  }
}

await writeFile(
  path.join(projectDir, 'crawl-report.txt'),
  [
    `source: ${base}`,
    `routes: ${seenRoutes.size}`,
    `assets: ${seenAssets.size}`,
    '',
    ...report,
    '',
  ].join('\n'),
);

function cleanHtml(html) {
  let out = html;
  const htmlEnd = out.indexOf('</html>');
  if (htmlEnd !== -1) {
    out = out.slice(0, htmlEnd + '</html>'.length);
  }

  out = out
    .replace(/<script>self\.__VINEXT_RSC_PARAMS__[\s\S]*?<\/script>/g, '')
    .replace(/<script>self\.__VINEXT_RSC_NAV__[\s\S]*?<\/script>/g, '')
    .replace(/<script id="_R_">[\s\S]*?<\/script>/g, '')
    .replace(/<script>self\.__VINEXT_RSC_CHUNKS__[\s\S]*?<\/script>/g, '')
    .replace(/<script>self\.__VINEXT_RSC_DONE__[\s\S]*?<\/script>/g, '')
    .replace(/<link rel="modulepreload"[^>]*>/g, '')
    .replace(/ data-rsc-css-href="[^"]*"/g, '')
    .replace(/ data-precedence="[^"]*"/g, '')
    .replace(/ crossorigin=""/g, '');

  out = out.replace(
    /<body([^>]*)><div class="loading-screen"[\s\S]*?<div class="site-shell site-shell--loading" aria-busy="true">/,
    '<body$1><div class="site-shell" aria-busy="false">',
  );

  out = out.replace(
    '</head>',
    '<link rel="stylesheet" href="/local/local-overrides.css"/></head>',
  );
  out = out.replace(
    '</body>',
    '<script defer src="/local/local-app.js"></script></body>',
  );

  return out;
}

function extractInternalUrls(text) {
  const urls = new Set();
  const patterns = [
    /(?:href|src|poster)=["']([^"']+)["']/g,
    /url\(([^)]+)\)/g,
    /import\(["']([^"']+)["']\)/g,
    /["'`]((?:\/[A-Za-z0-9_.~!$&'()*+,;=:@%-]+)+)(?:["'`?#])/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const raw = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) continue;
      if (raw.includes('${') || raw.includes('}')) continue;
      try {
        const url = new URL(raw, base);
        if (url.origin === base) {
          urls.add(url.pathname);
        }
      } catch {
        // Ignore unparsable snippets from minified bundles.
      }
    }
  }

  return [...urls];
}

function classifyUrl(url) {
  const pathname = normalizePath(url);
  if (!pathname || pathname === '/') return;
  if (pathname.startsWith('/projects/') && !path.extname(pathname)) {
    enqueueRoute(pathname);
    return;
  }
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/media/') ||
    pathname.startsWith('/projects/') ||
    pathname.startsWith('/project-details/') ||
    pathname.startsWith('/other-projects/') ||
    pathname.startsWith('/downloads/') ||
    pathname === '/og.png' ||
    pathname === '/resume.pdf'
  ) {
    enqueueAsset(pathname);
  }
}

function enqueueRoute(route) {
  const normalized = normalizeRoute(route);
  if (normalized && !seenRoutes.has(normalized)) {
    routeQueue.push(normalized);
  }
}

function enqueueAsset(asset) {
  const normalized = normalizePath(asset);
  if (normalized && !seenAssets.has(normalized)) {
    assetQueue.push(normalized);
  }
}

function normalizeRoute(route) {
  const pathname = normalizePath(route);
  if (!pathname) return null;
  return pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
}

function normalizePath(input) {
  if (!input) return null;
  let pathname = input.split('#')[0].split('?')[0];
  if (!pathname.startsWith('/')) return null;
  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname.includes('..')) return null;
  return pathname;
}

async function fetchText(pathname) {
  const { bytes } = await fetchBytes(pathname);
  return new TextDecoder('utf-8').decode(bytes);
}

async function fetchBytes(pathname) {
  const url = `${base}${pathname}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Codex local archival fetcher' },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return {
        bytes: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || '',
      };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }
  throw lastError;
}

async function saveRoute(route, html) {
  const file = route === '/'
    ? path.join(publicDir, 'index.html')
    : path.join(publicDir, route.slice(1), 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function saveAsset(asset, bytes) {
  const file = path.join(publicDir, asset.slice(1));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

function isTextAsset(asset, contentType) {
  const ext = path.extname(asset).toLowerCase();
  if (textExtensions.has(ext)) return true;
  if (binaryExtensions.has(ext)) return false;
  return contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('json');
}

