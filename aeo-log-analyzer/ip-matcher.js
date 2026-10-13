// ip-matcher.js — matches log entries against published bot UA + IP list

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
  'Claude-User':      /Claude-User\//i,
  'Claude-SearchBot': /Claude-SearchBot\//i,
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

export const PUBLISHED_IP_BOTS = new Set([
  'Googlebot', 'Googlebot-Image', 'Googlebot-News',
  'Bingbot', 'Applebot',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot'
  // Amazonbot, CCBot, Bytespider, DuckAssistBot, YandexBot remain UA-only.
]);

// ── IP normalization ──
export function ipToBigInt(ip) {
  if (!ip) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.some(p => p < 0 || p > 255)) return null;
    return (BigInt(parts[0]) << 24n) | (BigInt(parts[1]) << 16n) | (BigInt(parts[2]) << 8n) | BigInt(parts[3]);
  }
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

// ── Anonymization detection ──
// Some hosts (Plesk, CloudPanel with GDPR-safe logging, certain cPanel vhosts)
// rewrite the last IPv4 octet to 0 or truncate IPv6 to /48. We can't verify
// the bot against a truncated IP, but we shouldn't call it "unverified" —
// that reads as "spoofed", which it isn't.
export function isAnonymizedIp(ip) {
  if (!ip) return false;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.0$/.test(ip)) return true;
  if (ip.includes(':')) {
    const expanded = expandIPv6(ip);
    if (!expanded) return false;
    const hextets = expanded.split(':');
    if (hextets.length !== 8) return false;
    const tail = hextets.slice(3).every(h => parseInt(h, 16) === 0);
    const head = hextets.slice(0, 3).some(h => parseInt(h, 16) !== 0);
    if (tail && head) return true;
  }
  return false;
}

// ── CIDR check ──
export function ipInCidr(ipBigInt, cidr) {
  if (!cidr) return false;
  const [rangeStr, prefixStr] = cidr.split('/');
  const rangeIp = ipToBigInt(rangeStr);
  if (rangeIp === null || ipBigInt === null) return false;

  const isV6 = rangeStr.includes(':');
  const totalBits = isV6 ? 128 : 32;
  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : totalBits;
  if (isNaN(prefix) || prefix < 0 || prefix > totalBits) return false;

  const hostBits = BigInt(totalBits - prefix);
  const mask = ((1n << BigInt(totalBits)) - 1n) ^ ((1n << hostBits) - 1n);
  return (ipBigInt & mask) === (rangeIp & mask);
}

// ── Bot matching ──
// status is one of:
//   'verified'   — UA claims a bot with published ranges, and IP is in range
//   'anonymized' — UA claims such a bot, but the IP is anonymized (can't verify)
//   'unverified' — UA claims such a bot, IP isn't in range
//   'ua-only'    — UA claims a bot with no published ranges
export function classifyEntry(entry, ipLists) {
  if (!entry || !entry.ua) return { bot: null, status: null, claimed: null };

  for (const [bot, pattern] of Object.entries(BOT_UA_PATTERNS)) {
    if (!pattern.test(entry.ua)) continue;

    if (!PUBLISHED_IP_BOTS.has(bot) || !ipLists?.[bot]?.length) {
      return { bot, status: 'ua-only', claimed: bot };
    }

    const ipBig = ipToBigInt(entry.ip);
    if (ipBig === null) {
      return { bot, status: 'unverified', claimed: bot };
    }

    const verified = ipLists[bot].some(cidr => ipInCidr(ipBig, cidr));
    if (verified) return { bot, status: 'verified', claimed: bot };

    if (isAnonymizedIp(entry.ip)) {
      return { bot, status: 'anonymized', claimed: bot };
    }

    return { bot, status: 'unverified', claimed: bot };
  }

  return { bot: null, status: null, claimed: null };
}

// ── Aggregate ──
export function aggregateByBot(entries, ipLists) {
  const buckets = new Map();

  for (const e of entries) {
    const { bot, status } = classifyEntry(e, ipLists);
    if (!bot) continue;

    if (!buckets.has(bot)) {
      buckets.set(bot, {
        bot,
        hasPublishedIps: PUBLISHED_IP_BOTS.has(bot),
        total: 0,
        verifiedCount: 0,
        unverifiedCount: 0,
        anonymizedCount: 0,
        uaOnlyCount: 0,
        statuses: new Map(),
        statusClasses: { 2: 0, 3: 0, 4: 0, 5: 0 },
        firstSeen: null,
        lastSeen: null,
        topPaths: new Map(),
        topIps: new Map(),
        unverifiedIps: new Map(),
        anonymizedIps: new Map(),
        suspiciousStatuses: { 401: 0, 403: 0, 429: 0, 503: 0 }
      });
    }

    const b = buckets.get(bot);
    b.total++;
    if (status === 'verified')         b.verifiedCount++;
    else if (status === 'anonymized')  b.anonymizedCount++;
    else if (status === 'ua-only')     b.uaOnlyCount++;
    else                               b.unverifiedCount++;

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

    if (e.path) b.topPaths.set(e.path, (b.topPaths.get(e.path) || 0) + 1);

    if (e.ip) {
      b.topIps.set(e.ip, (b.topIps.get(e.ip) || 0) + 1);
      if (status === 'unverified') b.unverifiedIps.set(e.ip, (b.unverifiedIps.get(e.ip) || 0) + 1);
      if (status === 'anonymized') b.anonymizedIps.set(e.ip, (b.anonymizedIps.get(e.ip) || 0) + 1);
    }
  }

  return [...buckets.values()].map(b => ({
    ...b,
    statuses: [...b.statuses.entries()].sort((a, b) => b[1] - a[1]),
    topPaths: [...b.topPaths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    topIps: [...b.topIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    unverifiedIps: [...b.unverifiedIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    anonymizedIps: [...b.anonymizedIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  })).sort((a, b) => b.total - a.total);
}