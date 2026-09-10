// Minimal static file server for tests/e2e against the built `dist/`
// output. Exists only because `astro preview` (Astro 7) now always
// daemonizes itself (forks into a background process and the invoking
// command exits immediately) - Playwright's `webServer` expects the
// command it runs to stay attached in the foreground so it can manage
// that process's lifecycle directly, and treats the immediate exit as a
// startup failure ("Process from config.webServer exited early"). No new
// dependency needed for something this small - Node's built-in `http`
// and `fs` cover it.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 4321);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

async function resolveFile(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = safePath.endsWith('/')
    ? [join(DIST_DIR, safePath, 'index.html')]
    : [join(DIST_DIR, safePath), join(DIST_DIR, safePath, 'index.html'), join(DIST_DIR, `${safePath}.html`)];

  for (const candidate of candidates) {
    try {
      const stats = await stat(candidate);
      if (stats.isFile()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
  const filePath = await resolveFile(urlPath);

  if (!filePath) {
    const notFoundPath = join(DIST_DIR, '404.html');
    try {
      const body = await readFile(notFoundPath);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
    return;
  }

  const body = await readFile(filePath);
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Static preview server serving dist/ at http://localhost:${PORT}`);
});
