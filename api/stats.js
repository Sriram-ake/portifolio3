/**
 * Vercel Serverless Function: /api/stats
 * Returns verified LeetCode, Codolio, and GitHub statistics for A Sri Ram.
 */

const CODOLIO_USERNAME = process.env.CODOLIO_USERNAME || 'sriram1108';
const CODOLIO_PROFILE_URL = `https://codolio.com/profile/${CODOLIO_USERNAME}`;

const VERIFIED_CODOLIO_SNAPSHOT = {
  username: CODOLIO_USERNAME,
  profileUrl: CODOLIO_PROFILE_URL,
  totalSolved: 694,
  platformsCount: 5,
  platforms: {
    geeksforgeeks: 25,
    leetcode: 349,
    codechef: 204,
    codeforces: 1,
    hackerrank: 115
  }
};

async function fetchCodolioStats(username) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
  try {
    const res = await fetch(`https://api.codolio.com/profile?userKey=${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'A-Sri-Ram-Portfolio-Vercel/1.0'
      },
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return VERIFIED_CODOLIO_SNAPSHOT;
    const json = await res.json();
    if (!json || !json.data || !json.data.platformProfiles || !Array.isArray(json.data.platformProfiles.platformProfiles)) {
      return VERIFIED_CODOLIO_SNAPSHOT;
    }

    const platformProfiles = json.data.platformProfiles.platformProfiles;
    let totalSolved = 0;
    const platforms = {};
    for (const p of platformProfiles) {
      const pName = p.platform || 'unknown';
      const count = (p.totalQuestionStats && typeof p.totalQuestionStats.totalQuestionCounts === 'number')
        ? p.totalQuestionStats.totalQuestionCounts
        : 0;
      platforms[pName] = count;
      totalSolved += count;
    }

    return {
      username,
      profileUrl: CODOLIO_PROFILE_URL,
      totalSolved: totalSolved || VERIFIED_CODOLIO_SNAPSHOT.totalSolved,
      platformsCount: platformProfiles.length || VERIFIED_CODOLIO_SNAPSHOT.platformsCount,
      platforms
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return VERIFIED_CODOLIO_SNAPSHOT;
  }
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  const codolioData = await fetchCodolioStats(CODOLIO_USERNAME);

  return sendJson(res, 200, {
    ok: true,
    leetcode: {
      username: process.env.LEETCODE_USERNAME || 'akesriram',
      totalSolved: 419,
      easy: 308,
      medium: 106,
      hard: 5
    },
    codolio: codolioData,
    github: {
      username: process.env.GITHUB_USERNAME || 'Sriram-ake',
      publicRepos: 16
    }
  });
};
