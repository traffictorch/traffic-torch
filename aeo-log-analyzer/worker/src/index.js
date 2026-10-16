// aeo-bot-ips.traffictorch.workers.dev — v2
// Versioned snapshots, bot registry, reverse DNS verification.

const SOURCES = {
  Googlebot:          'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'Googlebot-Image':  'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'Googlebot-News':   'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  GPTBot:             'https://openai.com/gptbot.json',
  'OAI-SearchBot':    'https://openai.com/searchbot.json',
  'ChatGPT-User':     'https://openai.com/chatgpt-user.json',
  Bingbot:            'https://www.bing.com/toolbox/bingbot.json',
  Applebot:           'https://search.developer.apple.com/applebot.json',
  PerplexityBot:      'https://www.perplexity.com/perplexitybot.json',
  'Perplexity-User':  'https://www.perplexity.com/perplexity-user.json',
  ClaudeBot:          'https://claude.com/crawling/bots.json',
  'Claude-User':      'https://claude.com/crawling/bots.json',
  'Claude-SearchBot': 'https://claude.com/crawling/bots.json',
};

const REGISTRY = [
  { id: 'Googlebot',        ua: 'Googlebot\\/',        group: 'Google',        displayName: 'Googlebot',        hasPublishedIps: true,  rdns: ['googlebot.com', 'google.com'] },
  { id: 'Googlebot-Image',  ua: 'Googlebot-Image\\/',  group: 'Google',        displayName: 'Googlebot-Image',  hasPublishedIps: true,  rdns: ['googlebot.com', 'google.com'] },
  { id: 'Googlebot-News',   ua: 'Googlebot-News',      group: 'Google',        displayName: 'Googlebot-News',   hasPublishedIps: true,  rdns: ['googlebot.com', 'google.com'] },
  { id: 'Bingbot',          ua: 'bingbot\\/',          group: 'Microsoft',     displayName: 'Bingbot',          hasPublishedIps: true,  rdns: ['search.msn.com'] },
  { id: 'Applebot',         ua: 'Applebot\\/',         group: 'Apple',         displayName: 'Applebot',         hasPublishedIps: true },
  { id: 'GPTBot',           ua: 'GPTBot\\/',           group: 'OpenAI',        displayName: 'GPTBot',           hasPublishedIps: true },
  { id: 'OAI-SearchBot',    ua: 'OAI-SearchBot\\/',    group: 'OpenAI',        displayName: 'OAI-SearchBot',    hasPublishedIps: true },
  { id: 'ChatGPT-User',     ua: 'ChatGPT-User\\/',     group: 'OpenAI',        displayName: 'ChatGPT-User',     hasPublishedIps: true },
  { id: 'ClaudeBot',        ua: 'ClaudeBot\\/',        group: 'Anthropic',     displayName: 'ClaudeBot',        hasPublishedIps: true },
  { id: 'Claude-User',      ua: 'Claude-User\\/',      group: 'Anthropic',     displayName: 'Claude-User',      hasPublishedIps: true },
  { id: 'Claude-SearchBot', ua: 'Claude-SearchBot\\/', group: 'Anthropic',     displayName: 'Claude-SearchBot', hasPublishedIps: true },
  { id: 'Claude-Web',       ua: 'Claude-Web\\/',       group: 'Anthropic',     displayName: 'Claude-Web',       hasPublishedIps: false },
  { id: 'anthropic-ai',     ua: 'anthropic-ai',        group: 'Anthropic',     displayName: 'anthropic-ai',     hasPublishedIps: false },
  { id: 'PerplexityBot',    ua: 'PerplexityBot\\/',    group: 'Perplexity',    displayName: 'PerplexityBot',    hasPublishedIps: true },
  { id: 'Perplexity-User',  ua: 'Perplexity-User\\/',  group: 'Perplexity',    displayName: 'Perplexity-User',  hasPublishedIps: true },
  { id: 'CCBot',            ua: 'CCBot\\/',            group: 'Common Crawl',  displayName: 'CCBot',            hasPublishedIps: false },
  { id: 'Bytespider',       ua: 'Bytespider',          group: 'ByteDance',     displayName: 'Bytespider',       hasPublishedIps: false },
  { id: 'Amazonbot',        ua: 'Amazonbot\\/',        group: 'Amazon',        displayName: 'Amazonbot',        hasPublishedIps: false },
  { id: 'DuckAssistBot',    ua: 'DuckAssistBot\\/',    group: 'DuckDuckGo',    displayName: 'DuckAssistBot',    hasPublishedIps: false },
  { id: 'YandexBot',        ua: 'YandexBot\\/',        group: 'Yandex',        displayName: 'YandexBot',        hasPublishedIps: false },
];

const LATEST_KEY = 'bot_ips_v1';
const SNAPSHOT_PREFIX = 'snapshot:';
const SNAPSHOT_TTL = 60 * 60 * 24 * 400;

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    const url = new URL(request.url);

    if (url.pathname === '/refresh') {
      const token = url.searchParams.get('token');
      if (!env.REFRESH_TOKEN || token !== env.REFRESH_TOKEN) {
        return cors(JSON.stringify({ error: 'Forbidden' }), 403, 'application/json');
      }
      const result = await refresh(env, ctx);
      return cors(JSON.stringify(result), 200, 'application/json');
    }

    if (url.pathname === '/registry') {
      return cors(JSON.stringify({ version: 1, bots: REGISTRY }), 200, 'application/json');
    }

    if (url.pathname === '/rdns') {
      if (request.method !== 'POST') return cors(JSON.stringify({ error: 'POST' }), 405, 'application/json');
      let body;
      try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'invalid JSON' }), 400, 'application/json'); }
      const ips = Array.isArray(body?.ips) ? body.ips.slice(0, 60) : [];
      const results = {};
      await Promise.all(ips.map(async (ip) => {
        results[ip] = await rdnsVerify(ip).catch(() => null);
      }));
      return cors(JSON.stringify({ results }), 200, 'application/json');
    }

    if (url.pathname === '/snapshot') {
      const date = normalizeDate(url.searchParams.get('date'));
      const snap = await getSnapshot(env, ctx, date);
      return cors(JSON.stringify(snap), 200, 'application/json');
    }

    let cached = await env.BOT_IPS.get(LATEST_KEY, { type: 'json' });
    if (!cached) {
      const fetched = await buildLists();
      ctx.waitUntil(env.BOT_IPS.put(LATEST_KEY, JSON.stringify(fetched), { expirationTtl: 172800 }));
      cached = fetched;
    }
    return cors(JSON.stringify(cached), 200, 'application/json');
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env, ctx));
  },
};

function normalizeDate(s) {
  if (!s) return new Date().toISOString().slice(0, 10);
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : new Date().toISOString().slice(0, 10);
}

async function getSnapshot(env, ctx, requestedDate) {
  const exact = await env.BOT_IPS.get(SNAPSHOT_PREFIX + requestedDate, { type: 'json' });
  if (exact) return { ...exact, exact: true };

  const listed = await env.BOT_IPS.list({ prefix: SNAPSHOT_PREFIX, limit: 400 });
  const keys = listed.keys
    .map(k => k.name.slice(SNAPSHOT_PREFIX.length))
    .filter(d => d <= requestedDate)
    .sort()
    .reverse();
  if (keys.length) {
    const nearest = keys[0];
    const ageMs = Date.parse(requestedDate) - Date.parse(nearest);
    if (ageMs <= 14 * 86400000) {
      const snap = await env.BOT_IPS.get(SNAPSHOT_PREFIX + nearest, { type: 'json' });
      if (snap) return { ...snap, requestedDate, nearestPrior: nearest, exact: false };
    }
  }

  const wb = await buildListsFromWayback(requestedDate);
  if (wb && Object.keys(wb.lists).length) {
    ctx.waitUntil(env.BOT_IPS.put(SNAPSHOT_PREFIX + requestedDate, JSON.stringify(wb), { expirationTtl: SNAPSHOT_TTL }));
    return { ...wb, requestedDate, source: 'wayback', exact: true };
  }

  let current = await env.BOT_IPS.get(LATEST_KEY, { type: 'json' });
  if (!current) {
    current = await buildLists();
    ctx.waitUntil(env.BOT_IPS.put(LATEST_KEY, JSON.stringify(current), { expirationTtl: 172800 }));
  }
  return {
    ...current,
    requestedDate,
    source: 'current',
    approximate: true,
    note: 'No archived list for this date. Verified against the current published ranges — some genuine hits from this period may be flagged as unverified.'
  };
}

async function buildListsFromWayback(date) {
  const ts = date.replace(/-/g, '');
  const lists = {};
  const errors = {};
  await Promise.all(Object.entries(SOURCES).map(async ([bot, url]) => {
    try {
      const cdx = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${ts}`;
      const av = await fetch(cdx, { headers: { 'User-Agent': 'TrafficTorch-BotIPs/2.0' } });
      if (!av.ok) throw new Error(`wayback lookup ${av.status}`);
      const aj = await av.json();
      const snapUrl = aj?.archived_snapshots?.closest?.url;
      if (!snapUrl) throw new Error('no wayback capture');
      const res = await fetch(snapUrl, { headers: { 'User-Agent': 'TrafficTorch-BotIPs/2.0' } });
      if (!res.ok) throw new Error(`wayback fetch ${res.status}`);
      const json = await res.json();
      const prefixes = json.prefixes || json.prefix || json;
      if (!Array.isArray(prefixes)) throw new Error('Unexpected shape');
      const cidrs = prefixes
        .map(p => p.ipv4Prefix || p.ipv6Prefix || (typeof p === 'string' ? p : null))
        .filter(Boolean);
      lists[bot] = [...new Set([...(lists[bot] || []), ...cidrs])];
    } catch (e) {
      errors[bot] = String(e.message || e);
    }
  }));
  return { version: new Date().toISOString(), source: 'wayback', date, lists, errors: Object.keys(errors).length ? errors : undefined };
}

async function refresh(env, ctx) {
  const data = await buildLists();
  const today = new Date().toISOString().slice(0, 10);
  await Promise.all([
    env.BOT_IPS.put(LATEST_KEY, JSON.stringify(data), { expirationTtl: 172800 }),
    env.BOT_IPS.put(SNAPSHOT_PREFIX + today, JSON.stringify(data), { expirationTtl: SNAPSHOT_TTL }),
  ]);
  return { ok: true, version: data.version, snapshotDate: today, listCount: Object.keys(data.lists).length };
}

async function buildLists() {
  const lists = {};
  const errors = {};
  await Promise.all(Object.entries(SOURCES).map(async ([bot, url]) => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TrafficTorch-BotIPs/2.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const prefixes = json.prefixes || json.prefix || json;
      if (!Array.isArray(prefixes)) throw new Error('Unexpected shape');
      const cidrs = prefixes
        .map(p => p.ipv4Prefix || p.ipv6Prefix || (typeof p === 'string' ? p : null))
        .filter(Boolean);
      lists[bot] = [...new Set([...(lists[bot] || []), ...cidrs])];
    } catch (e) {
      errors[bot] = String(e.message || e);
    }
  }));
  return { version: new Date().toISOString(), source: 'live', lists, errors: Object.keys(errors).length ? errors : undefined };
}

async function rdnsVerify(ip) {
  const arpa = toArpa(ip);
  if (!arpa) return null;
  const ptrRes = await dohQuery(arpa, 'PTR');
  const ptr = (ptrRes || []).find(a => a.type === 12)?.data;
  if (!ptr) return null;
  const fwdRes = await dohQuery(ptr, 'A');
  const ips = (fwdRes || []).filter(a => a.type === 1).map(a => a.data);
  if (!ips.includes(ip)) return null;
  return { ptr, verified: true };
}

function toArpa(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  if (ip.includes(':')) {
    const expanded = expandV6(ip);
    if (!expanded) return null;
    return expanded.replace(/:/g, '').split('').reverse().join('.') + '.ip6.arpa';
  }
  return null;
}

function expandV6(ip) {
  ip = ip.split('%')[0];
  const [head, tail] = ip.split('::');
  const h = head ? head.split(':').filter(Boolean) : [];
  const t = tail !== undefined ? (tail ? tail.split(':').filter(Boolean) : []) : null;
  if (t === null) return h.length === 8 ? h.map(p => p.padStart(4, '0')).join('') : null;
  const missing = 8 - h.length - t.length;
  if (missing < 0) return null;
  return [...h, ...Array(missing).fill('0'), ...t].map(p => p.padStart(4, '0')).join('');
}

async function dohQuery(name, type) {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(4000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.Answer || [];
}

function cors(body, status = 200, contentType = null) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Cache-Control', 'public, max-age=3600');
  if (contentType) headers.set('Content-Type', contentType);
  return new Response(body, { status, headers });
}
