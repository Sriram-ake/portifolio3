/**
 * A Sri Ram Developer Portfolio — Production & Development Server
 * 
 * Used for deployment on Render (and local development).
 * Dispatches API requests directly to modular handlers in the api/ directory
 * and serves static assets and SPA fallback with high performance.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const contactHandler = require('./api/contact');
const contactStatusHandler = require('./api/contact/status');
const statsHandler = require('./api/stats');

const PORT = parseInt(process.env.PORT || '5173', 10);
const BASE_DIR = __dirname;

// Simple .env parser for local dev
function loadEnv() {
  const envPath = path.join(BASE_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn('Warning: Failed to read .env:', err.message);
  }
}

loadEnv();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.json': 'application/json'
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname.replace(/\/+$/, '') || '/';

  // 1. Delegate /api/contact to the serverless function handler
  if (pathname === '/api/contact') {
    return contactHandler(req, res);
  }

  // 2. Delegate /api/contact/status
  if (pathname === '/api/contact/status') {
    return contactStatusHandler(req, res);
  }

  // 3. Delegate /api/stats
  if (pathname === '/api/stats') {
    return statsHandler(req, res);
  }

  // 4. Static file delivery
  if (req.method === 'GET' || req.method === 'HEAD') {
    let cleanRel = pathname.replace(/^\/+/, '');
    let localFile = path.join(BASE_DIR, cleanRel);

    if (cleanRel && fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(localFile).pipe(res);
    }

    // 5. SPA Fallback: index.html
    const indexPath = path.join(BASE_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Endpoint not found.' }));
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`>> Local development server running at http://localhost:${PORT}/`);
    console.log(`>> Brevo configured: ${Boolean(process.env.BREVO_API_KEY)}`);
  });
}

module.exports = server;
