/**
 * A Sri Ram Developer Portfolio — Full-Stack Server
 * Features:
 *  - Direct Brevo Transactional Email Integration (/api/contact)
 *  - Contact Service Health & Configuration Check (/api/contact/status)
 *  - Coding & Platform Statistics (/api/stats)
 *  - Static Asset Delivery with Strict MIME Types & SPA Fallback
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '5173', 10);
const BASE_DIR = __dirname;

// Simple .env parser
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
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn('Warning: Failed to read .env:', err.message);
  }
}

loadEnv();

// In-memory rate limiter
const rateLimits = new Map();
const RATE_LIMIT_MAX = parseInt(process.env.CONTACT_RATE_LIMIT || '5', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.CONTACT_RATE_WINDOW || '3600', 10) * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  let timestamps = rateLimits.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimits.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  return true;
}

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendBrevoEmail(name, email, message) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || 'A Sri Ram Portfolio Contact Form').trim();
  const receiverEmail = (process.env.CONTACT_RECEIVER_EMAIL || '').trim() || 'akesurekha@gmail.com';

  if (!apiKey) {
    return { ok: false, status: 503, message: 'Brevo API key is not configured on the server. Please configure BREVO_API_KEY in .env.' };
  }
  if (!senderEmail) {
    return { ok: false, status: 503, message: 'Brevo sender email is not configured on the server. Please configure BREVO_SENDER_EMAIL in .env.' };
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: receiverEmail, name: 'A Sri Ram' }],
    replyTo: { email, name },
    subject: `[Portfolio Contact] Message from ${name}`,
    htmlContent: `
      <h3>New Contact Form Message</h3>
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Reply-To:</strong> ${escapeHtml(email)}</p>
      <hr/>
      <p style="white-space: pre-wrap; font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
        ${escapeHtml(message)}
      </p>
      <hr/>
      <p style="font-size: 12px; color: #888;">Sent from A Sri Ram Developer Portfolio via Brevo Transactional API.</p>
    `,
    textContent: `New Contact Form Message\n\nFrom: ${name} <${email}>\nReply-To: ${email}\n\nMessage:\n${message}\n\n--\nSent from A Sri Ram Developer Portfolio via Brevo`
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'A-Sri-Ram-Portfolio/1.0'
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await res.text().catch(() => '');
    if ([200, 201, 202].includes(res.status)) {
      console.log(`>> [Brevo] Email accepted (status ${res.status})`);
      return { ok: true, status: 200, message: 'Message sent successfully!' };
    }

    console.error(`>> [Brevo] HTTP ${res.status}:`, bodyText.slice(0, 300));
    let errDetail = 'Failed to dispatch email via provider.';
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.message) errDetail = parsed.message;
    } catch (_) {}
    return { ok: false, status: 502, message: errDetail };
  } catch (err) {
    console.error('>> [Brevo] Transport error:', err.message);
    return { ok: false, status: 502, message: 'Failed to connect to email provider. Please try again later.' };
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  // Common CORS and caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const sendJson = (status, data) => {
    const body = Buffer.from(JSON.stringify(data), 'utf8');
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(body);
  };

  // ---------------- API ENDPOINTS ----------------

  // POST /api/contact
  if (req.method === 'POST' && pathname === '/api/contact') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 65536) req.destroy();
    });

    req.on('end', async () => {
      let data = {};
      try {
        data = JSON.parse(bodyData);
      } catch (_) {
        return sendJson(400, { ok: false, error: 'Invalid JSON payload.' });
      }

      const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

      // Honeypot check
      if (data.website) {
        console.log(`>> Honeypot triggered from ${clientIp}`);
        return sendJson(200, { ok: true, message: 'Message sent successfully.' });
      }

      // Rate limit check
      if (!checkRateLimit(clientIp)) {
        return sendJson(429, { ok: false, error: 'Too many messages sent. Please wait a little while before trying again.' });
      }

      const name = String(data.name || '').trim();
      const email = String(data.email || '').trim();
      const message = String(data.message || '').trim();

      if (name.length < 1 || name.length > 100) {
        return sendJson(422, { ok: false, error: 'Please provide your name (1 to 100 characters).' });
      }
      if (email.length < 3 || email.length > 254 || !EMAIL_RE.test(email)) {
        return sendJson(422, { ok: false, error: 'Please provide a valid email address.' });
      }
      if (message.length < 10 || message.length > 2000) {
        return sendJson(422, { ok: false, error: 'Message must be between 10 and 2000 characters.' });
      }

      const result = await sendBrevoEmail(name, email, message);
      return sendJson(result.status, { ok: result.ok, message: result.ok ? result.message : undefined, error: !result.ok ? result.message : undefined });
    });
    return;
  }

  // GET /api/contact/status
  if (req.method === 'GET' && pathname === '/api/contact/status') {
    const hasApiKey = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
    const hasSender = Boolean(process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_EMAIL.trim());
    const hasReceiver = Boolean(process.env.CONTACT_RECEIVER_EMAIL || 'akesurekha@gmail.com');
    return sendJson(200, {
      ok: true,
      configured: Boolean(hasApiKey && hasSender && hasReceiver),
      hasApiKey,
      hasSenderEmail: hasSender,
      hasReceiverEmail: hasReceiver
    });
  }

  // GET /api/stats
  if (req.method === 'GET' && pathname === '/api/stats') {
    return sendJson(200, {
      ok: true,
      leetcode: {
        username: 'akesriram',
        totalSolved: 419,
        easy: 308,
        medium: 106,
        hard: 5
      },
      github: {
        username: 'Sriram-ake',
        publicRepos: 16
      }
    });
  }

  // ---------------- STATIC FILE & SPA SERVING ----------------
  if (req.method === 'GET') {
    let cleanRel = pathname.replace(/^\/+/, '');
    let localFile = path.join(BASE_DIR, cleanRel);

    if (cleanRel && fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(localFile).pipe(res);
      return;
    }

    // SPA fallback: index.html
    const indexPath = path.join(BASE_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  sendJson(404, { ok: false, error: 'Endpoint not found.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`>> Developer portfolio running at http://localhost:${PORT}/`);
  console.log(`>> Brevo configured: ${Boolean(process.env.BREVO_API_KEY)}`);
});
