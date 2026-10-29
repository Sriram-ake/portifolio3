/**
 * Contact Form API Handler
 * Handles contact form submissions directly through the Brevo Transactional Email API.
 * Compatible with both Vercel serverless functions and Render (node server.js).
 * Never exposes API keys or internal errors to client-side responses.
 */

const fs = require('fs');
const path = require('path');

// Ensure .env is read if environment variables are not pre-injected
function ensureEnv() {
  if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) return;
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = val;
      }
    }
  } catch (_) {}
}

ensureEnv();

// In-memory rate limiting map
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendJson(res, statusCode, data) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(body);
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 65536) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  ensureEnv();

  // Common CORS and caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(204).end();
    }
    res.writeHead(204);
    return res.end();
  }

  // GET: Health / configuration check
  if (req.method === 'GET') {
    const hasApiKey = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
    const hasSender = Boolean(process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_EMAIL.trim());
    const hasReceiver = Boolean(process.env.CONTACT_RECEIVER_EMAIL || 'akesurekha@gmail.com');

    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(hasApiKey && hasSender && hasReceiver),
      hasApiKey,
      hasSenderEmail: hasSender,
      hasReceiverEmail: hasReceiver,
      message: 'A Sri Ram Portfolio Contact API is online.'
    });
  }

  // POST: Contact form dispatch
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

    // 1. Honeypot check (anti-bot)
    if (body.website) {
      return sendJson(res, 200, { ok: true, message: 'Message sent successfully.' });
    }

    // 2. Rate limit check
    if (!checkRateLimit(clientIp)) {
      return sendJson(res, 429, {
        ok: false,
        error: 'Too many messages sent. Please wait a little while before trying again.'
      });
    }

    // 3. Validation
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (name.length < 1 || name.length > 100) {
      return sendJson(res, 422, { ok: false, error: 'Please provide your name (1 to 100 characters).' });
    }
    if (email.length < 3 || email.length > 254 || !EMAIL_RE.test(email)) {
      return sendJson(res, 422, { ok: false, error: 'Please provide a valid email address.' });
    }
    if (message.length < 10 || message.length > 2000) {
      return sendJson(res, 422, { ok: false, error: 'Message must be between 10 and 2000 characters.' });
    }

    // 4. Server-side Brevo credentials verification at runtime
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
    const senderName = (process.env.BREVO_SENDER_NAME || 'A Sri Ram Portfolio Contact Form').trim();
    const receiverEmail = (process.env.CONTACT_RECEIVER_EMAIL || '').trim() || 'akesurekha@gmail.com';

    if (!apiKey) {
      console.error('>> [Contact API Error] BREVO_API_KEY environment variable is not configured on the server.');
      return sendJson(res, 503, {
        ok: false,
        error: 'The contact service is temporarily unavailable. Please try again later or email directly at akesurekha@gmail.com.'
      });
    }
    if (!senderEmail) {
      console.error('>> [Contact API Error] BREVO_SENDER_EMAIL environment variable is not configured on the server.');
      return sendJson(res, 503, {
        ok: false,
        error: 'The contact service is temporarily unavailable. Please try again later or email directly at akesurekha@gmail.com.'
      });
    }

    // 5. Build Brevo Transactional Email payload
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: receiverEmail,
          name: 'A Sri Ram'
        }
      ],
      replyTo: {
        email: email,
        name: name
      },
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
      const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'A-Sri-Ram-Portfolio/1.0'
        },
        body: JSON.stringify(payload)
      });

      const bodyText = await brevoResp.text().catch(() => '');

      if ([200, 201, 202].includes(brevoResp.status)) {
        let messageId = '';
        try {
          const parsed = JSON.parse(bodyText);
          messageId = parsed.messageId || '';
        } catch (_) {}
        console.log(`>> [Brevo] Email dispatched successfully to ${receiverEmail}. Message ID: ${messageId || 'accepted'}`);
        return sendJson(res, 200, { ok: true, message: 'Message sent successfully!' });
      }

      console.error(`>> [Brevo API Error] HTTP ${brevoResp.status}:`, bodyText.slice(0, 500));
      return sendJson(res, 502, {
        ok: false,
        error: 'Unable to send message right now. Please try again or email akesurekha@gmail.com directly.'
      });
    } catch (err) {
      console.error('>> [Brevo Transport Error]:', err.message);
      return sendJson(res, 502, {
        ok: false,
        error: 'Unable to send message right now. Please try again or email akesurekha@gmail.com directly.'
      });
    }
  }

  return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
};
