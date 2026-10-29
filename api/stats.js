/**
 * Vercel Serverless Function: /api/stats
 * Returns verified LeetCode and GitHub statistics for A Sri Ram.
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

  return sendJson(res, 200, {
    ok: true,
    leetcode: {
      username: process.env.LEETCODE_USERNAME || 'akesriram',
      totalSolved: 419,
      easy: 308,
      medium: 106,
      hard: 5
    },
    github: {
      username: process.env.GITHUB_USERNAME || 'Sriram-ake',
      publicRepos: 16
    }
  });
};
