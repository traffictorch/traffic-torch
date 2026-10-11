// aeo-bot-ips.traffictorch.workers.dev
// Fetches published AI crawler IP ranges, caches in KV, serves with CORS.

const SOURCES = {
  Googlebot:          'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'Googlebot-Image':  'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'Googlebot-News':   'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
  'GPTBot':           'https://openai.com/gptbot.json',
  'OAI-SearchBot':    'https://openai.com/searchbot.json',
  'ChatGPT-User':     'https://openai.com/chatgpt-user.json',
  Bingbot:            'https://www.bing.com/toolbox/bingbot.json',
  Applebot:           'https://search.developer.apple.com/applebot.json',
  PerplexityBot:      'https://perplexity.ai/perplexitybot.json',
  'Perplexity-User':  'https://perplexity.ai/perplexity-user.json',
  ClaudeBot:          'https://claude.com/crawling/bots.json',
  'Claude-User':      'https://claude.com/crawling/bots.json',
  'Claude-SearchBot': 'https://claude.com/crawling/bots.json'
};

const CACHE_KEY = 'bot_ips_v1';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return cors(null, 204);

    const url = new URL(request.url);

    // Manual refresh — requires secret via ?token=...
    if (url.pathname === '/refresh') {
      const token = url.searchParams.get('token');
      if (!env.REFRESH_TOKEN || token !== env.REFRESH_TOKEN) {
        return cors(JSON.stringify({ error: 'Forbidden' }), 403, 'application/json');
      }
      const result = await refresh(env);
      return cors(JSON.stringify(result), 200, 'application/json');
    }

    // Normal read
    let cached = await env.BOT_IPS.get(CACHE_KEY, { type: 'json' });
    if (!cached) {
      // Cold start — fetch synchronously and return
      const fetched = await buildLists();
      ctx.waitUntil(env.BOT_IPS.put(CACHE_KEY, JSON.stringify(fetched), { expirationTtl: 172800 }));
      cached = fetched;
    }

    return cors(JSON.stringify(cached), 200, 'application/json');
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
  }
};

async function refresh(env) {
  const data = await buildLists();
  await env.BOT_IPS.put(CACHE_KEY, JSON.stringify(data), { expirationTtl: 172800 });
  return { ok: true, version: data.version, listCount: Object.keys(data.lists).length };
}

async function buildLists() {
  const lists = {};
  const errors = {};

  await Promise.all(Object.entries(SOURCES).map(async ([bot, url]) => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TrafficTorch-BotIPs/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const prefixes = json.prefixes || json.prefix || json;
      if (!Array.isArray(prefixes)) throw new Error('Unexpected shape');
      const cidrs = prefixes
        .map(p => p.ipv4Prefix || p.ipv6Prefix || (typeof p === 'string' ? p : null))
        .filter(Boolean);
      // Merge into existing list for shared sources (Googlebot* share one file)
      lists[bot] = [...new Set([...(lists[bot] || []), ...cidrs])];
    } catch (e) {
      errors[bot] = String(e.message || e);
    }
  }));

  return {
    version: new Date().toISOString(),
    lists,
    errors: Object.keys(errors).length ? errors : undefined
  };
}

function cors(body, status = 200, contentType = null) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Cache-Control', 'public, max-age=3600');
  if (contentType) headers.set('Content-Type', contentType);
  return new Response(body, { status, headers });
}
