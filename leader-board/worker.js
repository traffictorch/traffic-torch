// Traffic Torch — Leaderboard Worker
// GET  /api/high-scores?tool=<name>&limit=12
// POST /api/high-scores/submit   { tool, url, title, overall_score, module_scores }

const ALLOWED_TOOLS = [
  'keyword-tool',
  'seo-intent-tool',
  'ai-search-optimization-tool',
  'local-seo-tool',
  'product-seo-tool',
  'topical-authority-audit-tool'
];
const MAX_LIMIT = 12;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-fingerprint'
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra }
  });
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return String(url).slice(0, 120); }
}

function normaliseUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    u.search = '';
    u.hostname = u.hostname.replace(/^www\./i, '');
    let path = u.pathname.replace(/\/+$/, '');
    if (!path) path = '/';
    u.pathname = path;
    return u.toString();
  } catch {
    return raw;
  }
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/api/high-scores') {
      if (request.method === 'GET') return getScores(url, env);
    }
    if (url.pathname === '/api/high-scores/submit' && request.method === 'POST') {
      return submitScore(request, env);
    }
    return json({ error: 'Not found' }, 404);
  }
};

async function getScores(url, env) {
  const tool  = url.searchParams.get('tool') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10) || 12, MAX_LIMIT);

  const baseSql = `SELECT id, url, domain, title, overall_score, module_scores, submitted_at
                     FROM high_scores
                    WHERE is_hidden = 0`;
  const orderSql = ` ORDER BY overall_score DESC, submitted_at ASC LIMIT ?`;

  const sql  = tool ? `${baseSql} AND tool_name = ?${orderSql}` : `${baseSql}${orderSql}`;
  const args = tool ? [tool, limit] : [limit];

  try {
    const { results } = await env.DB.prepare(sql).bind(...args).all();
    return json(
      { results, count: results.length, tool: tool || 'all' },
      200,
      { 'Cache-Control': 'no-store' }
    );
  } catch (err) {
    return json({ error: 'DB error', details: String(err) }, 500);
  }
}

async function submitScore(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { tool, url, title, overall_score, module_scores } = body || {};

  if (!tool || typeof tool !== 'string' || tool.length > 64 || !ALLOWED_TOOLS.includes(tool)) {
    return json({ error: 'Tool not allowed' }, 400);
  }
  if (!url || !isValidUrl(url)) {
    return json({ error: 'Invalid URL — must be http(s)' }, 400);
  }
  if (typeof overall_score !== 'number' || overall_score < 0 || overall_score > 100) {
    return json({ error: 'overall_score must be 0–100' }, 400);
  }

  const canonicalUrl = normaliseUrl(url);
  const domain       = getDomain(canonicalUrl);
  const fp           = request.headers.get('x-fingerprint') || '';
  const now          = Date.now();
  const titleClean   = String(title || '').slice(0, 200);
  const modulesClean = module_scores ? JSON.stringify(module_scores).slice(0, 2000) : null;
  const rounded      = Math.round(overall_score);

  try {
    const existing = await env.DB.prepare(
      'SELECT id, overall_score FROM high_scores WHERE tool_name = ? AND url = ? LIMIT 1'
    ).bind(tool, canonicalUrl).first();

    if (existing) {
      if (rounded > existing.overall_score) {
        await env.DB.prepare(
          `UPDATE high_scores
              SET overall_score = ?, module_scores = ?, title = ?, submitted_at = ?
            WHERE id = ?`
        ).bind(rounded, modulesClean, titleClean, now, existing.id).run();
        return json({ success: true, updated: true, message: 'New high score saved!' });
      }
      return json({
        success: true, updated: false,
        message: `A higher score already exists for this URL (${existing.overall_score}/100).`
      });
    }

    await env.DB.prepare(
      `INSERT INTO high_scores
        (tool_name, url, domain, title, overall_score, module_scores, submitted_at, fingerprint)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(tool, canonicalUrl, domain, titleClean, rounded, modulesClean, now, fp).run();

    return json({ success: true, inserted: true, message: 'Added to the leaderboard!' });
  } catch (err) {
    return json({ error: 'DB error', details: String(err) }, 500);
  }
}