import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || process.argv[2] || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.ico': 'image/x-icon',
};

const server = createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const cleanPath = requestPath.replace(/^\/+/, '');
  const candidates = [
    path.join(root, cleanPath),
    path.join(root, cleanPath, 'index.html'),
    path.join(root, cleanPath + '.html'),
  ];
  const file = candidates.find((candidate) => {
    if (!candidate.startsWith(root)) return false;
    return existsSync(candidate) && statSync(candidate).isFile();
  });

  if (!file) {
    response.statusCode = 404;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.end('Not Found');
    return;
  }

  response.statusCode = 200;
  response.setHeader('cache-control', 'no-cache');
  response.setHeader('content-type', mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream');
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`haoqing6 local mirror: http://127.0.0.1:${port}/`);
});
