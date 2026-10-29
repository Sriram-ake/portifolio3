/**
 * Vercel Serverless Function: /api/contact/status
 * Returns boolean status of Brevo email service configuration without leaking secrets.
 */

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
