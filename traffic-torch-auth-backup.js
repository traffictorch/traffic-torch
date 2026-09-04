// ============================================================
// TRAFFIC TORCH – AUTH WORKER (FULL GA4 + REALTIME + CACHE)
// ============================================================
// Env: JWT_SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY,
//      STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID,
//      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ENCRYPTION_KEY
// D1 binding: MY_BINDING

function corsResponse(body, status = 200, headers = {}) {
  const h = new Headers(headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-fingerprint');
  return new Response(body, { status, headers: h });
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signJWT(payload, secret, expiresIn = '7d') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '7d' ? 7 * 86400 : 3600);
  const payloadWithExp = { ...payload, iat: now, exp };
  const encHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encPayload = btoa(JSON.stringify(payloadWithExp)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const data = `${encHeader}.${encPayload}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encSig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${encSig}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sig = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function hashPassword(password) {
  const salt = crypto.randomUUID().slice(0, 16);
  const combined = salt + password;
  const hash = await sha256(combined);
  return `$2a$10$${salt}$${hash}`;
}

async function comparePassword(password, storedHash) {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 4) return false;
    let salt, hash;
    if (parts.length === 5) {
      salt = parts[3];
      hash = parts[4];
    } else if (parts.length === 4) {
      const combined = parts[3];
      salt = combined.slice(0, 16);
      hash = combined.slice(16);
    } else {
      return false;
    }
    const computed = await sha256(salt + password);
    return computed === hash;
  } catch {
    return false;
  }
}

function getTierLimit(tier) {
  switch (tier) {
    case 'enterprise': return 300;
    case 'pro': return 24;
    default: return 3;
  }
}

// ---- GA4 Helpers ----
function encrypt(text) { return btoa(text); }
function decrypt(encoded) { return atob(encoded); }

async function exchangeCodeForTokens(code, env) {
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: 'https://traffic-torch-auth.traffictorch.workers.dev/api/ga4/callback',
    grant_type: 'authorization_code'
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return await res.json();
}

// ---- GSC Helpers ----
async function exchangeCodeForTokensGSC(code, env) {
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: 'https://traffic-torch-auth.traffictorch.workers.dev/api/gsc/callback',
    grant_type: 'authorization_code'
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC token exchange failed: ${err}`);
  }
  return await res.json();
}

// Reuse the same refresh function as GA4 (it's the same endpoint)
// Just call refreshAccessToken(refreshToken, env) – it works for both GA4 and GSC.

async function fetchGSCReport(accessToken, siteUrl, dimensions, startDate, endDate, limit = 25) {
  const body = {
    startDate,
    endDate,
    dimensions,
    rowLimit: limit,
    // aggregateType: 'auto' – not needed for most queries
  };
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC API error: ${err}`);
  }
  return res.json();
}

// ---- GSC Cache Helpers ----
async function getCachedGSCReport(userId, reportType, startDate, endDate, env) {
  try {
    const record = await env.MY_BINDING.prepare(
      'SELECT data FROM gsc_cache WHERE user_id = ? AND report_type = ? AND start_date = ? AND end_date = ?'
    ).bind(userId, reportType, startDate, endDate).first();
    return record ? JSON.parse(record.data) : null;
  } catch (e) {
    console.error('getCachedGSCReport error:', e.message);
    return null;
  }
}

async function setCachedGSCReport(userId, reportType, startDate, endDate, data, env) {
  try {
    await env.MY_BINDING.prepare(
      `INSERT OR REPLACE INTO gsc_cache (user_id, report_type, start_date, end_date, data)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(userId, reportType, startDate, endDate, JSON.stringify(data)).run();
  } catch (e) {
    console.error('setCachedGSCReport error:', e.message);
  }
}

async function refreshAccessToken(refreshToken, env) {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function fetchGA4Report(accessToken, propertyId, dimensions, metrics, days = 7, startDate = null, endDate = null) {
  const body = {
    dimensions: dimensions.map(d => ({ name: d })),
    metrics: metrics.map(m => ({ name: m })),
    dateRanges: [{ startDate: startDate || `${days}daysAgo`, endDate: endDate || 'yesterday' }],
    limit: 100
  };
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error: ${err}`);
  }
  return res.json();
}

async function fetchGA4Realtime(accessToken, propertyId, type = 'overview') {
  let body = {};
  switch (type) {
    case 'overview':
      body = { metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }], limit: 10 };
      break;
    case 'minutes':
      body = {
        dimensions: [{ name: 'minutesAgo' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'minutesAgo' }, desc: false }],
        limit: 30
      };
      break;
    case 'devices':
      body = {
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5
      };
      break;
    case 'events':
      body = {
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10
      };
      break;
    case 'countries':
      body = {
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10
      };
      break;
    default:
      throw new Error('Invalid realtime type');
  }
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 realtime error: ${err}`);
  }
  return res.json();
}

// ---- ensureTables with cache ----
async function ensureTables(env) {
  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      subscription_status TEXT DEFAULT 'free',
      pro_since TIMESTAMP,
      stripe_customer_id TEXT,
      tier TEXT DEFAULT 'free',
      ga4_property_id TEXT
    )`
  ).run();
  await env.MY_BINDING.prepare(
  `CREATE TABLE IF NOT EXISTS user_gsc (
    user_id INTEGER PRIMARY KEY,
    refresh_token TEXT NOT NULL,
    site_url TEXT NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`
).run();

await env.MY_BINDING.prepare(
  `CREATE TABLE IF NOT EXISTS gsc_cache (
    user_id INTEGER NOT NULL,
    report_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    data TEXT NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, report_type, start_date, end_date)
  )`
).run();

  try {
    await env.MY_BINDING.prepare(`ALTER TABLE users ADD COLUMN ga4_property_id TEXT`).run();
  } catch (e) {}

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    )`
  ).run();

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL
    )`
  ).run();

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      tool_run_date TEXT,
      run_count INTEGER,
      tool_name TEXT,
      identifier TEXT
    )`
  ).run();
  try {
    await env.MY_BINDING.prepare(`ALTER TABLE usage_logs ADD COLUMN identifier TEXT`).run();
  } catch (e) {}

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS audit_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      score INTEGER,
      timestamp INTEGER NOT NULL
    )`
  ).run();

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS user_ga4 (
      user_id INTEGER PRIMARY KEY,
      refresh_token TEXT NOT NULL,
      property_id TEXT,
      connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ).run();

  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS ga4_cache (
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      days INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      report_date TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, report_type, days, start_date, end_date)
    )`
  ).run();

  // Inside ensureTables(), after existing tables:
await env.MY_BINDING.prepare(
  `CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`
).run();

await env.MY_BINDING.prepare(
  `CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_status INTEGER,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
  )`
).run();
}

async function getCachedReport(userId, reportType, days, startDate, endDate, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await env.MY_BINDING.prepare(
      'SELECT data FROM ga4_cache WHERE user_id = ? AND report_type = ? AND days = ? AND start_date = ? AND end_date = ? AND report_date = ?'
    ).bind(userId, reportType, days, startDate || '', endDate || '', today).first();
    return record ? JSON.parse(record.data) : null;
  } catch (e) {
    console.error('getCachedReport error:', e.message);
    return null; // treat as cache miss
  }
}

async function setCachedReport(userId, reportType, days, startDate, endDate, data, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await env.MY_BINDING.prepare(
      `INSERT OR REPLACE INTO ga4_cache (user_id, report_type, days, start_date, end_date, report_date, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(userId, reportType, days, startDate || '', endDate || '', today, JSON.stringify(data)).run();
  } catch (e) {
    console.error('setCachedReport error:', e.message);
    // ignore – data will be fetched fresh next time
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    await ensureTables(env);

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-fingerprint',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // ---- Register ----
      if (url.pathname === '/api/register' && method === 'POST') {
        const { name, email, password } = await request.json().catch(() => ({}));
        if (!email || !password || password.length < 8) {
          return corsResponse(JSON.stringify({ error: 'Valid email and password (min 8 chars) required' }), 400);
        }
        const existing = await env.MY_BINDING.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
          return corsResponse(JSON.stringify({ error: 'Email already registered' }), 409);
        }
        const hash = await hashPassword(password);
        const result = await env.MY_BINDING.prepare(
          `INSERT INTO users (email, password_hash, name, subscription_status, tier)
           VALUES (?, ?, ?, 'free', 'free') RETURNING id`
        ).bind(email, hash, name || email.split('@')[0]).first();
        const token = await signJWT({ id: result.id, status: 'free', tier: 'free' }, env.JWT_SECRET, '7d');
        return corsResponse(JSON.stringify({ token }));
      }

      // ---- Login ----
      if (url.pathname === '/api/login' && method === 'POST') {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) {
          return corsResponse(JSON.stringify({ error: 'Email and password required' }), 400);
        }
        const user = await env.MY_BINDING.prepare(
          'SELECT id, password_hash, subscription_status, tier FROM users WHERE email = ?'
        ).bind(email).first();
        if (!user) {
          return corsResponse(JSON.stringify({ error: 'Invalid email or password' }), 401);
        }
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
          return corsResponse(JSON.stringify({ error: 'Invalid email or password' }), 401);
        }
        const token = await signJWT(
          { id: user.id, status: user.subscription_status || 'free', tier: user.tier || 'free' },
          env.JWT_SECRET,
          '7d'
        );
        return corsResponse(JSON.stringify({ token }));
      }

      // ---- Magic Link (send) ----
      if (url.pathname === '/api/auth/magic-link' && method === 'POST') {
        const { email } = await request.json().catch(() => ({}));
        if (!email || !email.includes('@')) {
          return corsResponse(JSON.stringify({ error: 'Valid email required' }), 400);
        }
        const rawToken = crypto.randomUUID() + crypto.randomUUID();
        const tokenHash = await sha256(rawToken);
        const expiresAt = Math.floor(Date.now() / 1000) + 900;
        await env.MY_BINDING.prepare('DELETE FROM magic_links WHERE email = ? AND used = 0').bind(email).run();
        await env.MY_BINDING.prepare(
          'INSERT INTO magic_links (email, token_hash, expires_at) VALUES (?, ?, ?)'
        ).bind(email, tokenHash, expiresAt).run();
        const link = `https://traffic-torch-auth.traffictorch.workers.dev/api/auth/verify?token=${rawToken}`;
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'support@traffictorch.net',
            to: email,
            subject: 'Your Traffic Torch Magic Link',
            html: `<p>Click <a href="${link}">here</a> to log in (expires in 15 min).</p>`
          })
        });
        if (!resendRes.ok) {
          const err = await resendRes.text();
          console.error(err);
          return corsResponse(JSON.stringify({ error: 'Failed to send email' }), 500);
        }
        return corsResponse(JSON.stringify({ message: 'Magic link sent!' }));
      }

      // ---- Verify Magic Link ----
      if (url.pathname === '/api/auth/verify' && method === 'GET') {
        const rawToken = url.searchParams.get('token');
        if (!rawToken) return new Response('Missing token', { status: 400 });
        const tokenHash = await sha256(rawToken);
        const now = Math.floor(Date.now() / 1000);
        const record = await env.MY_BINDING.prepare(
          'SELECT email, expires_at FROM magic_links WHERE token_hash = ? AND used = 0'
        ).bind(tokenHash).first();
        if (!record) return new Response('Invalid or expired link', { status: 400 });
        if (record.expires_at < now) {
          await env.MY_BINDING.prepare('DELETE FROM magic_links WHERE token_hash = ?').bind(tokenHash).run();
          return new Response('Link expired', { status: 400 });
        }
        await env.MY_BINDING.prepare('UPDATE magic_links SET used = 1 WHERE token_hash = ?').bind(tokenHash).run();
        const email = record.email;
        let user = await env.MY_BINDING.prepare('SELECT id, subscription_status, tier FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          const result = await env.MY_BINDING.prepare(
            `INSERT INTO users (email, name, subscription_status, tier) VALUES (?, ?, 'free', 'free') RETURNING id`
          ).bind(email, email.split('@')[0]).first();
          user = { id: result.id, subscription_status: 'free', tier: 'free' };
        }
        const jwt = await signJWT(
          { id: user.id, status: user.subscription_status, tier: user.tier },
          env.JWT_SECRET, 
          '7d'
        );
        return Response.redirect(`https://traffictorch.net/dashboard/?magic_token=${jwt}`, 302);
      }

      // ---- Forgot Password ----
      if (url.pathname === '/api/forgot-password' && method === 'POST') {
        const { email } = await request.json().catch(() => ({}));
        if (!email || !email.includes('@')) {
          return corsResponse(JSON.stringify({ error: 'Valid email required' }), 400);
        }
        const user = await env.MY_BINDING.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          return corsResponse(JSON.stringify({ message: 'If an account exists, a reset link was sent.' }), 200);
        }
        const rawToken = crypto.randomUUID() + crypto.randomUUID();
        const tokenHash = await sha256(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await env.MY_BINDING.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(user.id).run();
        await env.MY_BINDING.prepare(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
        ).bind(user.id, tokenHash, expiresAt).run();
        const resetLink = `https://traffictorch.net/dashboard/?reset_token=${rawToken}`;
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'support@traffictorch.net',
            to: email,
            subject: 'Reset your Traffic Torch password',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password (expires in 1 hour).</p>`
          })
        });
        if (!resendRes.ok) {
          const err = await resendRes.text();
          console.error(err);
          return corsResponse(JSON.stringify({ error: 'Failed to send email' }), 500);
        }
        return corsResponse(JSON.stringify({ message: 'If an account exists, a reset link was sent.' }), 200);
      }

      // ---- Reset Password ----
      if (url.pathname === '/api/reset-password' && method === 'POST') {
        const { token, password } = await request.json().catch(() => ({}));
        if (!token || !password || password.length < 8) {
          return corsResponse(JSON.stringify({ error: 'Valid token and password (min 8 chars) required' }), 400);
        }
        const tokenHash = await sha256(token);
        const now = new Date();
        const record = await env.MY_BINDING.prepare(
          'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?'
        ).bind(tokenHash).first();
        if (!record) {
          return corsResponse(JSON.stringify({ error: 'Invalid or expired token' }), 400);
        }
        if (new Date(record.expires_at) < now) {
          await env.MY_BINDING.prepare('DELETE FROM password_reset_tokens WHERE token = ?').bind(tokenHash).run();
          return corsResponse(JSON.stringify({ error: 'Token expired' }), 400);
        }
        const newHash = await hashPassword(password);
        await env.MY_BINDING.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, record.user_id).run();
        await env.MY_BINDING.prepare('DELETE FROM password_reset_tokens WHERE token = ?').bind(tokenHash).run();
        return corsResponse(JSON.stringify({ message: 'Password reset successfully' }), 200);
      }

// ---- Account Info ----
if (url.pathname === '/api/account-info' && method === 'GET') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  const user = await env.MY_BINDING.prepare(
    'SELECT email, subscription_status, pro_since, tier, ga4_property_id FROM users WHERE id = ?'
  ).bind(decoded.id).first();
  if (!user) return corsResponse(JSON.stringify({ error: 'User not found' }), 404);
  
  // ---- GSC connection check ----
  const gscInfo = await env.MY_BINDING.prepare(
    'SELECT site_url FROM user_gsc WHERE user_id = ?'
  ).bind(decoded.id).first();
  const gscConnected = !!gscInfo;
  const gscSiteUrl = gscInfo?.site_url || null;

  const isPro = user.subscription_status === 'pro';
  const tier = user.tier || 'free';
  const limit = getTierLimit(tier);
  const today = new Date().toISOString().split('T')[0];
  const log = await env.MY_BINDING.prepare(
    'SELECT MAX(run_count) as run_count FROM usage_logs WHERE identifier = ? AND tool_run_date = ?'
  ).bind(decoded.id.toString(), today).first();
  const used = log?.run_count || 0;
  return corsResponse(JSON.stringify({
    email: user.email,
    isPro,
    proSince: user.pro_since,
    dailyUsed: used,
    dailyLimit: limit,
    dailyRemaining: limit - used,
    tier: tier,
    ga4Connected: !!user.ga4_property_id,
    gscConnected: gscConnected,
    gscSiteUrl: gscSiteUrl
  }));
}

      // ---- Check Rate (for tools) ----
      if (url.pathname === '/api/check-rate' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        let userId = null, isPro = false, tier = 'free';
        if (auth && auth.startsWith('Bearer ')) {
          const token = auth.split(' ')[1];
          try {
            const decoded = await verifyJWT(token, env.JWT_SECRET);
            userId = decoded.id;
            isPro = decoded.status === 'pro';
            tier = decoded.tier || 'free';
          } catch {}
        }
        const limit = getTierLimit(tier);
        const today = new Date().toISOString().split('T')[0];
        const identifier = userId ? userId.toString() : request.headers.get('cf-connecting-ip') || 'anon';
        const log = await env.MY_BINDING.prepare(
          'SELECT MAX(run_count) as run_count FROM usage_logs WHERE identifier = ? AND tool_run_date = ?'
        ).bind(identifier, today).first();
        const used = log?.run_count || 0;
        if (used >= limit) {
          return corsResponse(JSON.stringify({
            allowed: false,
            remaining: 0,
            message: tier === 'free' ? 'Free limit reached – upgrade.' : 'Daily limit reached.'
          }));
        }
        const newCount = used + 1;
        await env.MY_BINDING.prepare('DELETE FROM usage_logs WHERE identifier = ? AND tool_run_date = ?').bind(identifier, today).run();
        await env.MY_BINDING.prepare(
          'INSERT INTO usage_logs (user_id, tool_run_date, run_count, tool_name, identifier) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, today, newCount, 'limit', identifier).run();
        return corsResponse(JSON.stringify({
          allowed: true,
          remaining: limit - newCount
        }));
      }

// ---- Upgrade ----
if (url.pathname === '/api/upgrade' && method === 'POST') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }

  const { plan } = await request.json().catch(() => ({}));

  let priceId;
  switch (plan) {
    case 'pro_6month':
      priceId = env.STRIPE_PRICE_PRO_6MONTH;
      break;
    case 'pro_yearly':
      priceId = env.STRIPE_PRICE_PRO_YEARLY;
      break;
    case 'pro_lifetime':
      priceId = env.STRIPE_PRICE_PRO_LIFETIME;
      break;
    case 'enterprise_monthly':
      priceId = env.STRIPE_PRICE_ENTERPRISE_MONTHLY;
      break;
    case 'enterprise_yearly':
      priceId = env.STRIPE_PRICE_ENTERPRISE_YEARLY;
      break;
    default:
      return corsResponse(JSON.stringify({ error: 'Invalid plan' }), 400);
  }

  if (!priceId) {
    return corsResponse(JSON.stringify({ error: 'Price ID not configured for this plan' }), 500);
  }

  try {
    const isLifetime = plan === 'pro_lifetime';
    const mode = isLifetime ? 'payment' : 'subscription';

    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    const body = new URLSearchParams({
      'ui_mode': 'embedded',
      'mode': mode,
      'payment_method_types[]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'return_url': 'https://traffictorch.net/upgrade/?session_id={CHECKOUT_SESSION_ID}',
      'client_reference_id': decoded.id.toString(),
      'metadata[plan]': plan,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe API error:', data);
      return corsResponse(JSON.stringify({ error: 'Stripe API error: ' + (data.error?.message || 'Unknown') }), 500);
    }

    if (!data.client_secret) {
      return corsResponse(JSON.stringify({ error: 'No client_secret returned' }), 500);
    }

    return corsResponse(JSON.stringify({ clientSecret: data.client_secret }));
  } catch (err) {
    console.error('Upgrade error:', err.message, err.stack);
    return corsResponse(JSON.stringify({ error: 'Upgrade failed: ' + err.message }), 500);
  }
}

      // ---- Session Status ----
      if (url.pathname === '/api/session-status' && method === 'GET') {
        const sessionId = url.searchParams.get('session_id');
        if (!sessionId) return corsResponse(JSON.stringify({ error: 'Missing session_id' }), 400);
        const stripe = new (await import('stripe')).default(env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return corsResponse(JSON.stringify({ status: session.status, customer_email: session.customer_details?.email }));
      }

      // ---- Webhook ----
      if (url.pathname === '/api/webhook' && method === 'POST') {
        const payload = await request.text();
        const sig = request.headers.get('stripe-signature');
        if (!sig) return corsResponse('Missing signature', 400);
        const stripe = new (await import('stripe')).default(env.STRIPE_SECRET_KEY);
        const event = await stripe.webhooks.constructEventAsync(
          payload,
          sig,
          env.STRIPE_WEBHOOK_SECRET,
          { cryptoProvider: (await import('stripe')).default.createSubtleCryptoProvider() }
        );
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const userId = session.client_reference_id;
          await env.MY_BINDING.prepare(
            'UPDATE users SET subscription_status = "pro", pro_since = CURRENT_TIMESTAMP, stripe_customer_id = ?, tier = "pro" WHERE id = ?'
          ).bind(session.customer, userId).run();
        } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const status = subscription.status;
          if (['canceled', 'past_due', 'unpaid', 'incomplete_expired'].includes(status)) {
            await env.MY_BINDING.prepare(
              'UPDATE users SET subscription_status = "free", pro_since = NULL, tier = "free" WHERE stripe_customer_id = ?'
            ).bind(customerId).run();
          }
        }
        return corsResponse('Webhook received', 200);
      }

// ---- Portal ----
if (url.pathname === '/api/portal' && method === 'GET') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  const user = await env.MY_BINDING.prepare(
    'SELECT stripe_customer_id, subscription_status FROM users WHERE id = ?'
  ).bind(decoded.id).first();
  if (!user || !user.stripe_customer_id) {
    return corsResponse(JSON.stringify({ error: 'No active subscription' }), 403);
  }
  // ✅ Allow both pro and enterprise
  if (user.subscription_status !== 'pro' && user.subscription_status !== 'enterprise') {
    return corsResponse(JSON.stringify({ error: 'No active subscription' }), 403);
  }
  const stripe = new (await import('stripe')).default(env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: 'https://traffictorch.net/dashboard/'
  });
  return corsResponse(JSON.stringify({ url: session.url }));
}

      // ---- Refresh Token ----
      if (url.pathname === '/api/refresh-token' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const user = await env.MY_BINDING.prepare(
          'SELECT id, subscription_status, tier FROM users WHERE id = ?'
        ).bind(decoded.id).first();
        if (!user) {
          return corsResponse(JSON.stringify({ error: 'User not found' }), 404);
        }
        const newToken = await signJWT(
          { id: user.id, status: user.subscription_status || 'free', tier: user.tier || 'free' },
          env.JWT_SECRET,
          '7d'
        );
        return corsResponse(JSON.stringify({ token: newToken }));
      }

      // ---- GA4 OAuth endpoints ----
      if (url.pathname === '/api/ga4/auth-url' && method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        try {
          await verifyJWT(auth.split(' ')[1], env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', 'https://traffic-torch-auth.traffictorch.workers.dev/api/ga4/callback');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/analytics.readonly');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        return corsResponse(JSON.stringify({ authUrl: authUrl.toString() }));
      }

      if (url.pathname === '/api/ga4/callback' && method === 'GET') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) return new Response(`Authorization failed: ${error}`, { status: 400 });
        if (!code) return new Response('Missing authorization code', { status: 400 });
        return Response.redirect(`https://traffictorch.net/dashboard/?ga4_code=${code}`, 302);
      }

      if (url.pathname === '/api/ga4/connect' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const { code, propertyId } = await request.json().catch(() => ({}));
        if (!code) return corsResponse(JSON.stringify({ error: 'Authorization code required' }), 400);
        if (!propertyId) return corsResponse(JSON.stringify({ error: 'GA4 Property ID required' }), 400);

        try {
          const tokens = await exchangeCodeForTokens(code, env);
          const encryptedRefresh = encrypt(tokens.refresh_token);
          await env.MY_BINDING.prepare(
            `INSERT OR REPLACE INTO user_ga4 (user_id, refresh_token, property_id)
             VALUES (?, ?, ?)`
          ).bind(decoded.id, encryptedRefresh, propertyId).run();
          await env.MY_BINDING.prepare(
            'UPDATE users SET ga4_property_id = ? WHERE id = ?'
          ).bind(propertyId, decoded.id).run();
          return corsResponse(JSON.stringify({ success: true, message: 'GA4 connected' }));
        } catch (err) {
          return corsResponse(JSON.stringify({ error: err.message }), 500);
        }
      }

      if (url.pathname === '/api/ga4/disconnect' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        await env.MY_BINDING.prepare('DELETE FROM user_ga4 WHERE user_id = ?').bind(decoded.id).run();
        await env.MY_BINDING.prepare('UPDATE users SET ga4_property_id = NULL WHERE id = ?').bind(decoded.id).run();
        await env.MY_BINDING.prepare('DELETE FROM ga4_cache WHERE user_id = ?').bind(decoded.id).run();
        return corsResponse(JSON.stringify({ success: true, message: 'GA4 disconnected' }));
      }

      // ---- GA4 Cached Report Endpoint ----
      if (url.pathname === '/api/ga4/cached-report' && method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }

        const reportType = url.searchParams.get('type') || 'overview';
        let days = parseInt(url.searchParams.get('days')) || 7;
        const startDate = url.searchParams.get('start_date') || null;
        const endDate = url.searchParams.get('end_date') || null;

        const user = await env.MY_BINDING.prepare('SELECT tier, ga4_property_id FROM users WHERE id = ?').bind(decoded.id).first();
        if (!user || !user.ga4_property_id) {
          return corsResponse(JSON.stringify({ error: 'GA4 not connected' }), 400);
        }
        const tier = user.tier || 'free';
        let maxDays = 7;
        if (tier === 'pro') maxDays = 30;
        else if (tier === 'enterprise') maxDays = 365;
        if (days > maxDays) {
          return corsResponse(JSON.stringify({ error: `Date range exceeds your tier limit (max ${maxDays} days)` }), 403);
        }

        let cachedData = await getCachedReport(decoded.id, reportType, days, startDate, endDate, env);
        if (cachedData) {
          return corsResponse(JSON.stringify({ cached: true, reportType, days, data: cachedData, cachedAt: new Date().toISOString() }));
        }

        try {
          const ga4Data = await env.MY_BINDING.prepare(
            'SELECT refresh_token, property_id FROM user_ga4 WHERE user_id = ?'
          ).bind(decoded.id).first();
          if (!ga4Data || !ga4Data.property_id) {
            return corsResponse(JSON.stringify({ error: 'GA4 not connected' }), 400);
          }

          const refreshToken = decrypt(ga4Data.refresh_token);
          const accessToken = await refreshAccessToken(refreshToken, env);

          let dimensions, metrics;
          switch (reportType) {
            case 'overview':
              dimensions = ['date'];
              metrics = ['sessions', 'totalUsers', 'screenPageViews'];
              break;
            case 'top-content':
              dimensions = ['pagePath', 'pageTitle'];
              metrics = ['screenPageViews', 'averageSessionDuration'];
              break;
            case 'traffic-sources':
              dimensions = ['sessionSource', 'sessionMedium'];
              metrics = ['sessions', 'keyEvents'];
              break;
            case 'device-breakdown':
              dimensions = ['deviceCategory'];
              metrics = ['sessions'];
              break;
            case 'countries':
              dimensions = ['country'];
              metrics = ['sessions'];
              break;
            case 'top-converting-pages':
              dimensions = ['pagePath', 'pageTitle'];
              metrics = ['keyEvents', 'sessions'];
              break;
            default:
              dimensions = ['date'];
              metrics = ['sessions'];
          }

          const data = await fetchGA4Report(accessToken, ga4Data.property_id, dimensions, metrics, days, startDate, endDate);
          const rows = data.rows || [];
          const transformed = rows.map(row => ({
            dimensions: row.dimensionValues?.map(d => d.value) || [],
            metrics: row.metricValues?.map(m => parseFloat(m.value) || 0) || []
          }));

          await setCachedReport(decoded.id, reportType, days, startDate, endDate, transformed, env);

          return corsResponse(JSON.stringify({ cached: false, reportType, days, data: transformed, cachedAt: new Date().toISOString() }));
        } catch (err) {
          if (err.message.includes('refresh_token')) {
            await env.MY_BINDING.prepare('DELETE FROM user_ga4 WHERE user_id = ?').bind(decoded.id).run();
            await env.MY_BINDING.prepare('UPDATE users SET ga4_property_id = NULL WHERE id = ?').bind(decoded.id).run();
            return corsResponse(JSON.stringify({ error: 'GA4 connection expired. Please reconnect.', needsReconnect: true }), 401);
          }
          return corsResponse(JSON.stringify({ error: err.message }), 500);
        }
      }

      // ---- API KEYS ----
if (url.pathname === '/api/keys' && method === 'GET') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  const token = auth.split(' ')[1];
  let decoded;
  try { decoded = await verifyJWT(token, env.JWT_SECRET); } catch { return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401); }
  const keys = await env.MY_BINDING.prepare(
    'SELECT id, key_prefix, name, created_at FROM api_keys WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC'
  ).bind(decoded.id).all();
  return corsResponse(JSON.stringify({ keys: keys.results }));
}

if (url.pathname === '/api/keys/generate' && method === 'POST') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  const token = auth.split(' ')[1];
  let decoded;
  try { decoded = await verifyJWT(token, env.JWT_SECRET); } catch { return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401); }
  const { name } = await request.json().catch(() => ({}));
  const rawKey = 'tt_' + crypto.randomUUID().replace(/-/g, '').substring(0, 32);
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.substring(0, 8);
  const result = await env.MY_BINDING.prepare(
    'INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(decoded.id, keyHash, keyPrefix, name || null).first();
  return corsResponse(JSON.stringify({ key: rawKey, id: result.id }));
}

if (url.pathname.startsWith('/api/keys/revoke/') && method === 'DELETE') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  const token = auth.split(' ')[1];
  let decoded;
  try { decoded = await verifyJWT(token, env.JWT_SECRET); } catch { return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401); }
  const id = parseInt(url.pathname.split('/').pop());
  if (isNaN(id)) return corsResponse(JSON.stringify({ error: 'Invalid ID' }), 400);
  const key = await env.MY_BINDING.prepare('SELECT user_id FROM api_keys WHERE id = ?').bind(id).first();
  if (!key) return corsResponse(JSON.stringify({ error: 'Key not found' }), 404);
  if (key.user_id !== decoded.id) return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403);
  await env.MY_BINDING.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').bind(id).run();
  return corsResponse(JSON.stringify({ success: true }));
}

// ---- TOOL API (proxy to existing tool logic) ----
if (url.pathname.startsWith('/api/tools/') && method === 'POST') {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) return corsResponse(JSON.stringify({ error: 'Missing X-API-Key header' }), 401);
  const keyHash = await sha256(apiKey);
  const keyRecord = await env.MY_BINDING.prepare(
    'SELECT id, user_id FROM api_keys WHERE key_hash = ? AND is_active = 1'
  ).bind(keyHash).first();
  if (!keyRecord) return corsResponse(JSON.stringify({ error: 'Invalid or revoked API key' }), 401);

  // Get user tier
  const user = await env.MY_BINDING.prepare('SELECT tier FROM users WHERE id = ?').bind(keyRecord.user_id).first();
  const tier = user?.tier || 'free';
  const limit = getTierLimit(tier);
  // Check daily usage for this key
  const today = new Date().toISOString().split('T')[0];
  const usage = await env.MY_BINDING.prepare(
    'SELECT COUNT(*) as count FROM api_usage WHERE api_key_id = ? AND DATE(request_at) = ?'
  ).bind(keyRecord.id, today).first();
  const used = usage?.count || 0;
  if (used >= limit) {
    return corsResponse(JSON.stringify({ error: 'Daily rate limit exceeded' }), 429);
  }

  // Extract tool from path
  const tool = url.pathname.split('/').pop();
  // Map tool name to the actual audit logic (reuse existing functions)
  // For now, we'll return a placeholder – you need to plug your audit functions here.
  // Example: const result = await runAudit(tool, { url: body.url });
  const body = await request.json().catch(() => ({}));
  // Replace this with actual audit logic.
  const result = { message: `Audit for ${tool} with URL ${body.url} – not fully implemented yet` };

  // Log usage
  await env.MY_BINDING.prepare(
    'INSERT INTO api_usage (api_key_id, endpoint, response_status) VALUES (?, ?, ?)'
  ).bind(keyRecord.id, url.pathname, 200).run();

  return corsResponse(JSON.stringify({ success: true, data: result }));
}

      // ---- GA4 Realtime (Pro/Enterprise only) ----
      if (url.pathname === '/api/ga4/realtime' && method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }

        const user = await env.MY_BINDING.prepare('SELECT tier, ga4_property_id FROM users WHERE id = ?').bind(decoded.id).first();
        if (!user || !user.ga4_property_id) {
          return corsResponse(JSON.stringify({ error: 'GA4 not connected' }), 400);
        }
        const tier = user.tier || 'free';
        if (tier === 'free') {
          return corsResponse(JSON.stringify({ error: 'Realtime requires Pro or Enterprise' }), 403);
        }

        const type = url.searchParams.get('type') || 'overview';
        try {
          const ga4Data = await env.MY_BINDING.prepare(
            'SELECT refresh_token, property_id FROM user_ga4 WHERE user_id = ?'
          ).bind(decoded.id).first();
          if (!ga4Data || !ga4Data.property_id) {
            return corsResponse(JSON.stringify({ error: 'GA4 not connected' }), 400);
          }
          const refreshToken = decrypt(ga4Data.refresh_token);
          const accessToken = await refreshAccessToken(refreshToken, env);
          const data = await fetchGA4Realtime(accessToken, ga4Data.property_id, type);
          return corsResponse(JSON.stringify(data));
        } catch (err) {
          return corsResponse(JSON.stringify({ error: err.message }), 500);
        }
      }

      // ---- AUDIT HISTORY endpoints ----
      if (url.pathname === '/api/audit-history' && method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const userId = decoded.id;
        const rows = await env.MY_BINDING.prepare(
          'SELECT id, url, tool_name, score, timestamp FROM audit_history WHERE user_id = ? ORDER BY timestamp DESC'
        ).bind(userId).all();
        return corsResponse(JSON.stringify({ audits: rows.results }));
      }

      if (url.pathname === '/api/audit-history' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const userId = decoded.id;
        const body = await request.json().catch(() => ({}));
        const { url, tool_name, score } = body;
        if (!url || !tool_name) {
          return corsResponse(JSON.stringify({ error: 'url and tool_name required' }), 400);
        }
        const user = await env.MY_BINDING.prepare('SELECT tier FROM users WHERE id = ?').bind(userId).first();
        const tier = user?.tier || 'free';
        const limit = getTierLimit(tier);
        const countResult = await env.MY_BINDING.prepare(
          'SELECT COUNT(*) as count FROM audit_history WHERE user_id = ?'
        ).bind(userId).first();
        const currentCount = countResult?.count || 0;
        const now = Math.floor(Date.now() / 1000);
        if (currentCount >= limit) {
          await env.MY_BINDING.prepare(
            'DELETE FROM audit_history WHERE user_id = ? AND id = (SELECT id FROM audit_history WHERE user_id = ? ORDER BY timestamp ASC LIMIT 1)'
          ).bind(userId, userId).run();
        }
        const result = await env.MY_BINDING.prepare(
          'INSERT INTO audit_history (user_id, url, tool_name, score, timestamp) VALUES (?, ?, ?, ?, ?) RETURNING id'
        ).bind(userId, url, tool_name, score !== undefined ? score : null, now).first();
        return corsResponse(JSON.stringify({ id: result.id }));
      }

      if (url.pathname.startsWith('/api/audit-history/') && method === 'DELETE') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
        }
        const token = auth.split(' ')[1];
        let decoded;
        try {
          decoded = await verifyJWT(token, env.JWT_SECRET);
        } catch {
          return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
        }
        const userId = decoded.id;
        const id = url.pathname.split('/').pop();
        if (!id || isNaN(id)) {
          return corsResponse(JSON.stringify({ error: 'Invalid id' }), 400);
        }
        const audit = await env.MY_BINDING.prepare(
          'SELECT user_id FROM audit_history WHERE id = ?'
        ).bind(parseInt(id)).first();
        if (!audit) return corsResponse(JSON.stringify({ error: 'Audit not found' }), 404);
        if (audit.user_id !== userId) return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403);
        await env.MY_BINDING.prepare('DELETE FROM audit_history WHERE id = ?').bind(parseInt(id)).run();
        return corsResponse(JSON.stringify({ success: true }));
      }

      // ---- GSC OAuth endpoints ----
if (url.pathname === '/api/gsc/auth-url' && method === 'GET') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  try {
    await verifyJWT(auth.split(' ')[1], env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', 'https://traffic-torch-auth.traffictorch.workers.dev/api/gsc/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  return corsResponse(JSON.stringify({ authUrl: authUrl.toString() }));
}

if (url.pathname === '/api/gsc/callback' && method === 'GET') {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) return new Response(`Authorization failed: ${error}`, { status: 400 });
  if (!code) return new Response('Missing authorization code', { status: 400 });
  return Response.redirect(`https://traffictorch.net/dashboard/?gsc_code=${code}`, 302);
}

if (url.pathname === '/api/gsc/connect' && method === 'POST') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  const { code, siteUrl } = await request.json().catch(() => ({}));
  if (!code) return corsResponse(JSON.stringify({ error: 'Authorization code required' }), 400);
  if (!siteUrl) return corsResponse(JSON.stringify({ error: 'Site URL required (e.g., sc-domain:example.com)' }), 400);

  try {
    const tokens = await exchangeCodeForTokensGSC(code, env);
    const encryptedRefresh = encrypt(tokens.refresh_token);
    await env.MY_BINDING.prepare(
      `INSERT OR REPLACE INTO user_gsc (user_id, refresh_token, site_url)
       VALUES (?, ?, ?)`
    ).bind(decoded.id, encryptedRefresh, siteUrl).run();
    return corsResponse(JSON.stringify({ success: true, message: 'GSC connected' }));
  } catch (err) {
    return corsResponse(JSON.stringify({ error: err.message }), 500);
  }
}

if (url.pathname === '/api/gsc/disconnect' && method === 'POST') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  await env.MY_BINDING.prepare('DELETE FROM user_gsc WHERE user_id = ?').bind(decoded.id).run();
  await env.MY_BINDING.prepare('DELETE FROM gsc_cache WHERE user_id = ?').bind(decoded.id).run();
  return corsResponse(JSON.stringify({ success: true, message: 'GSC disconnected' }));
}

if (url.pathname === '/api/gsc/cached-report' && method === 'GET') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }

  const reportType = url.searchParams.get('type') || 'overview';
  let startDate = url.searchParams.get('start_date');
  let endDate = url.searchParams.get('end_date');
  let limit = parseInt(url.searchParams.get('limit')) || 10;

  if (!startDate || !endDate) {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date();
    start.setDate(start.getDate() - 7);
    endDate = end.toISOString().split('T')[0];
    startDate = start.toISOString().split('T')[0];
  }

  const user = await env.MY_BINDING.prepare('SELECT tier FROM users WHERE id = ?').bind(decoded.id).first();
  if (!user) return corsResponse(JSON.stringify({ error: 'User not found' }), 404);
  const tier = user.tier || 'free';

  let maxDays = 7, maxLimit = 5;
  if (tier === 'pro') { maxDays = 28; maxLimit = 10; }
  else if (tier === 'enterprise') { maxDays = 365; maxLimit = 50; }

  const start = new Date(startDate);
  const end = new Date(endDate);
const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
if (diffDays > maxDays) {
  return corsResponse(JSON.stringify({ error: `Date range exceeds your tier limit (max ${maxDays} days)` }), 403);
}

if (limit > maxLimit) limit = maxLimit;   // apply cap first

// For overview, we need all days, but cap at 100 to avoid abuse
if (reportType === 'overview') {
  limit = Math.min(diffDays, 100);
}

  // Check cache
  const cached = await getCachedGSCReport(decoded.id, reportType, startDate, endDate, env);
  if (cached) {
    return corsResponse(JSON.stringify({
      cached: true,
      type: reportType,
      startDate,
      endDate,
      data: cached,
      cachedAt: new Date().toISOString()
    }));
  }

  try {
    const gscData = await env.MY_BINDING.prepare(
      'SELECT refresh_token, site_url FROM user_gsc WHERE user_id = ?'
    ).bind(decoded.id).first();
    if (!gscData || !gscData.site_url) {
      return corsResponse(JSON.stringify({ error: 'GSC not connected' }), 400);
    }

    const refreshToken = decrypt(gscData.refresh_token);
    let accessToken;
    try {
      accessToken = await refreshAccessToken(refreshToken, env);
    } catch (err) {
      // If refresh fails, force reconnection
      await env.MY_BINDING.prepare('DELETE FROM user_gsc WHERE user_id = ?').bind(decoded.id).run();
      await env.MY_BINDING.prepare('DELETE FROM gsc_cache WHERE user_id = ?').bind(decoded.id).run();
      return corsResponse(JSON.stringify({ error: 'GSC session expired. Please reconnect.', needsReconnect: true }), 401);
    }

    let dimensions;
    switch (reportType) {
      case 'overview': dimensions = ['date']; break;
      case 'queries': dimensions = ['query']; break;
      case 'pages': dimensions = ['page']; break;
      case 'countries': dimensions = ['country']; break;
      case 'devices': dimensions = ['device']; break;
      default: dimensions = ['date'];
    }

    const data = await fetchGSCReport(accessToken, gscData.site_url, dimensions, startDate, endDate, limit);
    const rows = data.rows || [];
    const transformed = rows.map(row => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }));

    await setCachedGSCReport(decoded.id, reportType, startDate, endDate, transformed, env);

    return corsResponse(JSON.stringify({
      cached: false,
      type: reportType,
      startDate,
      endDate,
      data: transformed,
      cachedAt: new Date().toISOString()
    }));
  } catch (err) {
    // Return the full error message to the frontend
    return corsResponse(JSON.stringify({
      error: err.message,
      stack: err.stack,
      type: reportType,
      startDate,
      endDate
    }), 500);
  }
}

// ---- DELETE ACCOUNT ----
if (url.pathname === '/api/user' && method === 'DELETE') {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);
  }
  const token = auth.split(' ')[1];
  let decoded;
  try {
    decoded = await verifyJWT(token, env.JWT_SECRET);
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid token' }), 401);
  }
  const userId = decoded.id;

  // Ensure the user exists
  const user = await env.MY_BINDING.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!user) {
    return corsResponse(JSON.stringify({ error: 'User not found' }), 404);
  }

  // Delete all related records (cascade manually, as D1 does not support foreign key cascades automatically in some contexts)
  // Order doesn't matter, but we delete from child tables first (for clarity)
  await env.MY_BINDING.prepare('DELETE FROM user_ga4 WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM user_gsc WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM ga4_cache WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM gsc_cache WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM audit_history WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM magic_links WHERE email IN (SELECT email FROM users WHERE id = ?)').bind(userId).run();
  await env.MY_BINDING.prepare('DELETE FROM usage_logs WHERE user_id = ?').bind(userId).run();

  // Finally, delete the user record
  await env.MY_BINDING.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return corsResponse(JSON.stringify({ success: true, message: 'Account permanently deleted' }));
}

      // ---- 404 ----
      return corsResponse('Not found', 404);
    } catch (err) {
      console.error(err);
      return corsResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  }
};