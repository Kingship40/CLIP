/**
 * Production Full-Stack Server for ClipForge AI.
 * Serves the compiled frontend SPA from `dist/` and mounts all backend API routes
 * (/api/import/*, /api/jobs/*, /api/media/*) with native FFmpeg processing.
 *
 * Compatible with Render, Railway, Fly.io, Heroku, AWS, and DigitalOcean.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRoute } from './src/services/backend/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=UTF-8',
  '.srt': 'text/plain; charset=UTF-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  // 1. Route API requests to backend handlers
  if (req.url && req.url.startsWith('/api/')) {
    try {
      const handled = await handleApiRoute(req, res);
      if (handled) return;
    } catch (err) {
      console.error('API Error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
      return;
    }
  }

  // 2. Serve static files from dist/
  const reqUrl = req.url ? req.url.split('?')[0] : '/';
  let safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(DIST_DIR, safePath);

  // If path is a directory or file doesn't exist, fallback to index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>404 Not Found</h1><p>Please build the project first: <code>npm run build</code></p>');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ClipForge AI Production Server listening on http://0.0.0.0:${PORT}`);
});
