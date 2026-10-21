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

  const size = statSync(file).size;
  const contentType = mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream';
  response.setHeader('cache-control', 'no-cache');
  response.setHeader('content-type', contentType);
  response.setHeader('accept-ranges', 'bytes');

  // Safari 播放视频/音频要求服务器支持 HTTP Range 分段请求（206）
  const range = request.headers.range;
  const rangeMatch = range && /^bytes=(\d*)-(\d*)$/.exec(range);

  if (rangeMatch && (rangeMatch[1] || rangeMatch[2])) {
    let start = rangeMatch[1] === '' ? 0 : Number(rangeMatch[1]);
    let end = rangeMatch[2] === '' ? size - 1 : Number(rangeMatch[2]);
    if (rangeMatch[1] === '') {
      // 后缀范围：bytes=-N 表示最后 N 字节
      start = Math.max(0, size - Number(rangeMatch[2]));
      end = size - 1;
    }
    if (start >= size || end >= size || start > end || Number.isNaN(start) || Number.isNaN(end)) {
      response.statusCode = 416;
      response.setHeader('content-range', `bytes */${size}`);
      response.end();
      return;
    }
    response.statusCode = 206;
    response.setHeader('content-range', `bytes ${start}-${end}/${size}`);
    response.setHeader('content-length', end - start + 1);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(file, { start, end }).pipe(response);
    return;
  }

  response.statusCode = 200;
  response.setHeader('content-length', size);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`CHESTNUT portfolio: http://127.0.0.1:${port}/`);
});
