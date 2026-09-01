// ============================================================
// TRAFFIC TORCH – AUTH WORKER (ONE WORKER)
// ============================================================
// Env: JWT_SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY,
//      STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
// D1 binding: MY_BINDING

import bcrypt from 'bcryptjs';

function corsResponse(body, status = 200, headers = {}) {
  const h = new Headers(headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
  if (storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, storedHash);
  }
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

async function ensureTables(env) {
  await env.MY_BINDING.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      subscription_status TEXT DEFAULT 'free',
      pro_since TIMESTAMP,
      stripe_customer_id TEXT
    )`
  ).run();
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
          `INSERT INTO users (email, password_hash, name, subscription_status)
           VALUES (?, ?, ?, 'free') RETURNING id`
        ).bind(email, hash, name || email.split('@')[0]).first();
        const token = await signJWT({ id: result.id, status: 'free' }, env.JWT_SECRET, '7d');
        return corsResponse(JSON.stringify({ token }));
      }

      // ---- Login ----
      if (url.pathname === '/api/login' && method === 'POST') {
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) {
          return corsResponse(JSON.stringify({ error: 'Email and password required' }), 400);
        }
        const user = await env.MY_BINDING.prepare(
          'SELECT id, password_hash, subscription_status FROM users WHERE email = ?'
        ).bind(email).first();
        if (!user) {
          return corsResponse(JSON.stringify({ error: 'Invalid email or password' }), 401);
        }
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
          return corsResponse(JSON.stringify({ error: 'Invalid email or password' }), 401);
        }
        const token = await signJWT(
          { id: user.id, status: user.subscription_status || 'free' },
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
        let user = await env.MY_BINDING.prepare('SELECT id, subscription_status FROM users WHERE email = ?').bind(email).first();
        if (!user) {
          const result = await env.MY_BINDING.prepare(
            `INSERT INTO users (email, name, subscription_status) VALUES (?, ?, 'free') RETURNING id`
          ).bind(email, email.split('@')[0]).first();
          user = { id: result.id, subscription_status: 'free' };
        }
        const jwt = await signJWT({ id: user.id, status: user.subscription_status }, env.JWT_SECRET, '7d');
        return Response.redirect(`https://traffictorch.net/pro/?magic_token=${jwt}`, 302);
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
        const resetLink = `https://traffictorch.net/pro/?reset_token=${rawToken}`;
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
          'SELECT email, subscription_status, pro_since FROM users WHERE id = ?'
        ).bind(decoded.id).first();
        if (!user) return corsResponse(JSON.stringify({ error: 'User not found' }), 404);
        const isPro = user.subscription_status === 'pro';
        const limit = isPro ? 25 : 3;
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
          dailyRemaining: limit - used
        }));
      }

      // ---- Check Rate ----
      if (url.pathname === '/api/check-rate' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        let userId = null, isPro = false;
        if (auth && auth.startsWith('Bearer ')) {
          const token = auth.split(' ')[1];
          try {
            const decoded = await verifyJWT(token, env.JWT_SECRET);
            userId = decoded.id;
            isPro = decoded.status === 'pro';
          } catch {}
        }
        const limit = isPro ? 25 : 3;
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
            message: isPro ? 'Daily limit reached.' : 'Free limit reached – upgrade.'
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
        const stripe = new (await import('stripe')).default(env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
          return_url: 'https://traffictorch.net/pro/confirm?session_id={CHECKOUT_SESSION_ID}',
          client_reference_id: decoded.id.toString()
        });
        return corsResponse(JSON.stringify({ clientSecret: session.client_secret }));
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
            'UPDATE users SET subscription_status = "pro", pro_since = CURRENT_TIMESTAMP, stripe_customer_id = ? WHERE id = ?'
          ).bind(session.customer, userId).run();
        } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const status = subscription.status;
          if (['canceled', 'past_due', 'unpaid', 'incomplete_expired'].includes(status)) {
            await env.MY_BINDING.prepare(
              'UPDATE users SET subscription_status = "free", pro_since = NULL WHERE stripe_customer_id = ?'
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
        if (!user || user.subscription_status !== 'pro' || !user.stripe_customer_id) {
          return corsResponse(JSON.stringify({ error: 'No active subscription' }), 403);
        }
        const stripe = new (await import('stripe')).default(env.STRIPE_SECRET_KEY);
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripe_customer_id,
          return_url: 'https://traffictorch.net/pro/'
        });
        return corsResponse(JSON.stringify({ url: session.url }));
      }

      // ---- 404 ----
      return corsResponse('Not found', 404);
    } catch (err) {
      console.error(err);
      return corsResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  }
};