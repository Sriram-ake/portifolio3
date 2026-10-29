/**
 * Contact Status API Handler
 * Returns boolean status of Brevo email service configuration without leaking secrets.
 * Compatible with both Vercel serverless functions and Render (node server.js).
 */

const fs = require('fs');
const path = require('path');

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

module.exports = async function handler(req, res) {
  ensureEnv();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  const hasApiKey = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
  const hasSender = Boolean(process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_EMAIL.trim());
  const hasReceiver = Boolean(process.env.CONTACT_RECEIVER_EMAIL || 'akesurekha@gmail.com');

  return sendJson(res, 200, {
    ok: true,
    configured: Boolean(hasApiKey && hasSender && hasReceiver),
    hasApiKey,
    hasSenderEmail: hasSender,
    hasReceiverEmail: hasReceiver,
    message: 'A Sri Ram Portfolio Contact Service Status'
  });
};
