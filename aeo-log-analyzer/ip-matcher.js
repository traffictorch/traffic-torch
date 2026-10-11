// ip-matcher.js — matches log entries against published bot UA + IP list

// UA patterns for each bot family. Case-insensitive substring match.
export const BOT_UA_PATTERNS = {
  'Googlebot':        /Googlebot\//i,
  'Googlebot-Image':  /Googlebot-Image\//i,
  'Googlebot-News':   /Googlebot-News/i,
  'Bingbot':          /bingbot\//i,
  'Applebot':         /Applebot\//i,
  'GPTBot':           /GPTBot\//i,
  'OAI-SearchBot':    /OAI-SearchBot\//i,
  'ChatGPT-User':     /ChatGPT-User\//i,
  'ClaudeBot':        /ClaudeBot\//i,
  'Claude-Web':       /Claude-Web\//i,
  'anthropic-ai':     /anthropic-ai/i,
  'PerplexityBot':    /PerplexityBot\//i,
  'Perplexity-User':  /Perplexity-User\//i,
  'CCBot':            /CCBot\//i,
  'Bytespider':       /Bytespider/i,
  'Amazonbot':        /Amazonbot\//i,
  'DuckAssistBot':    /DuckAssistBot\//i,
  'YandexBot':        /YandexBot\//i
};

// Which bots have published IP ranges (from the worker)
export const PUBLISHED_IP_BOTS = new Set([
  'Googlebot', 'Googlebot-Image', 'Googlebot-News',
  'Bingbot', 'Applebot',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'Amazonbot'
]);

// ── IP normalization ──
export function ipToBigInt(ip) {
  if (!ip) return null;
  // IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.some(p => p < 0 || p > 255)) return null;
    return (BigInt(parts[0]) << 24n) | (BigInt(parts[1]) << 16n) | (BigInt(parts[2]) << 8n) | BigInt(parts[3]);
  }
  // IPv6 — expand shorthand
  if (ip.includes(':')) {
    try {
      const expanded = expandIPv6(ip);
      if (!expanded) return null;
      const hextets = expanded.split(':');
      let out = 0n;
      for (const h of hextets) {
        out = (out << 16n) | BigInt(parseInt(h, 16));
      }
      return out;
    } catch { return null; }
  }
  return null;
}

function expandIPv6(ip) {
  // Strip zone id
  ip = ip.split('%')[0];
  let [head, tail] = ip.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail !== undefined ? (tail ? tail.split(':').filter(Boolean) : []) : null;
  if (tailParts === null) {
    if (headParts.length !== 8) return null;
    return headParts.map(p => p.padStart(4, '0')).join(':');
  }
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0) return null;
  const all = [...headParts, ...Array(missing).fill('0'), ...tailParts];
  return all.map(p => p.padStart(4, '0')).join(':');
}

// ── CIDR check ──
// Returns true if ipBigInt falls within cidr. cidr can be "1.2.3.0/24" or "2001:db8::/32" or a single IP.
export function ipInCidr(ipBigInt, cidr) {
  if (!cidr) return false;
  const [rangeStr, prefixStr] = cidr.split('/');
  const rangeIp = ipToBigInt(rangeStr);
  if (rangeIp === null || ipBigInt === null) return false;

  // Determine bit width from whether rangeIp has IPv6 range
  const isV6 = rangeStr.includes(':');
  const totalBits = isV6 ? 128 : 32;
  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : totalBits;
  if (isNaN(prefix) || prefix < 0 || prefix > totalBits) return false;

  // Mask both to prefix length
  const hostBits = BigInt(totalBits - prefix);
  const mask = ((1n << BigInt(totalBits)) - 1n) ^ ((1n << hostBits) - 1n);
  return (ipBigInt & mask) === (rangeIp & mask);
}

// ── Bot matching ──
// For each entry: check UA → identify bot; if bot has published IPs, verify IP is in range.
export function classifyEntry(entry, ipLists) {
  if (!entry || !entry.ua) return { bot: null, verified: false, claimed: null };

  for (const [bot, pattern] of Object.entries(BOT_UA_PATTERNS)) {
    if (!pattern.test(entry.ua)) continue;

    // Claimed to be this bot. If it has published ranges, verify.
    if (PUBLISHED_IP_BOTS.has(bot) && ipLists?.[bot]?.length) {
      const ipBig = ipToBigInt(entry.ip);
      if (ipBig === null) return { bot, verified: false, claimed: bot };
      const verified = ipLists[bot].some(cidr => ipInCidr(ipBig, cidr));
      return { bot, verified, claimed: bot };
    }

    // No published ranges → UA-only claim
    return { bot, verified: false, claimed: bot };
  }

  return { bot: null, verified: false, claimed: null };
}

// ── Aggregate ──
export function aggregateByBot(entries, ipLists) {
  const buckets = new Map();

  for (const e of entries) {
    const { bot, verified, claimed } = classifyEntry(e, ipLists);
    if (!bot) continue;

    const key = bot;
    if (!buckets.has(key)) {
      buckets.set(key, {
        bot,
        hasPublishedIps: PUBLISHED_IP_BOTS.has(bot),
        total: 0,
        verifiedCount: 0,
        unverifiedCount: 0,
        statuses: new Map(),
        statusClasses: { 2: 0, 3: 0, 4: 0, 5: 0 },
        firstSeen: null,
        lastSeen: null,
        topPaths: new Map(),
        topIps: new Map(),
        unverifiedIps: new Map(),
        suspiciousStatuses: { 401: 0, 403: 0, 429: 0, 503: 0 }
      });
    }

    const b = buckets.get(key);
    b.total++;
    if (verified) b.verifiedCount++; else b.unverifiedCount++;

    if (!b.statuses.has(e.status)) b.statuses.set(e.status, 0);
    b.statuses.set(e.status, b.statuses.get(e.status) + 1);

    const cls = Math.floor(e.status / 100);
    if (cls >= 2 && cls <= 5) b.statusClasses[cls]++;

    if (e.status === 401 || e.status === 403 || e.status === 429 || e.status === 503) {
      b.suspiciousStatuses[e.status]++;
    }

    if (e.time) {
      if (!b.firstSeen || e.time < b.firstSeen) b.firstSeen = e.time;
      if (!b.lastSeen || e.time > b.lastSeen) b.lastSeen = e.time;
    }

    if (e.path) {
      b.topPaths.set(e.path, (b.topPaths.get(e.path) || 0) + 1);
    }

    b.topIps.set(e.ip, (b.topIps.get(e.ip) || 0) + 1);
    if (!verified && e.ip) {
      b.unverifiedIps.set(e.ip, (b.unverifiedIps.get(e.ip) || 0) + 1);
    }
  }

  // Convert to sorted arrays
  return [...buckets.values()].map(b => ({
    ...b,
    statuses: [...b.statuses.entries()].sort((a, b) => b[1] - a[1]),
    topPaths: [...b.topPaths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    topIps: [...b.topIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    unverifiedIps: [...b.unverifiedIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  })).sort((a, b) => b.total - a.total);
}
