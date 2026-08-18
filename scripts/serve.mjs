/**
 * serve.mjs - Servidor HTTP estático de desenvolvimento.
 *
 * Sobe um servidor local simples (sem dependências externas) para servir
 * os arquivos do OrigamiECJ. Uso:
 *   npm run serve        (porta padrão 3000)
 *   PORT=8080 npm start  (porta personalizada)
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function contentType(path) {
  return MIME[extname(path).toLowerCase()] || 'application/octet-stream';
}

async function servePath(res, path) {
  try {
    const data = await readFile(path);
    res.writeHead(200, {
      'Content-Type': contentType(path),
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = normalize(join(root, pathname));
  const isInsideRoot = filePath === root || filePath.startsWith(`${root}${sep}`);
  if (!isInsideRoot) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  await servePath(res, filePath);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`OrigamiECJ servindo em http://localhost:${PORT}`);
});
