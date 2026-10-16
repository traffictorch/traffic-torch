// ip-matcher.js — v2
// Registry-driven. Tracks firstSeen vs firstVerified separately.

export let BOT_REGISTRY = null;

export function setRegistry(bots) {
  BOT_REGISTRY = bots;
}

function botFor(entry) {
  if (!entry?.ua || !BOT_REGISTRY) return null;
  for (const b of BOT_REGISTRY) {
    try {
      if (new RegExp(b.ua, 'i').test(entry.ua)) return b;
    } catch {}
  }
  return null;
}

function hasPublishedIps(botId) {
  const b = BOT_REGISTRY?.find(x => x.id === botId);
  return !!b?.hasPublishedIps;
}

function groupFor(botId) {
  const b = BOT_REGISTRY?.find(x => x.id === botId);
  return b?.group || 'Other';
}

function displayNameFor(botId) {
  const b = BOT_REGISTRY?.find(x => x.id === botId);
  return b?.displayName || botId;
}

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
      for (const h of hextets) out = (out << 16n) | BigInt(parseInt(h, 16));
      return out;
    } catch { return null; }
  }
  return null;
}

function expandIPv6(ip) {
  ip = ip.split('%')[0];
  const [head, tail] = ip.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail !== undefined ? (tail ? tail.split(':').filter(Boolean) : []) : null;
  if (tailParts === null) {
    if (headParts.length !== 8) return null;
    return headParts.map(p => p.padStart(4, '0')).join(':');
  }
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0) return null;
  return [...headParts, ...Array(missing).fill('0'), ...tailParts].map(p => p.padStart(4, '0')).join(':');
}

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

export function classifyEntry(entry, ipLists) {
  const bot = botFor(entry);
  if (!bot) return { bot: null, status: null, group: null };

  if (!bot.hasPublishedIps || !ipLists?.[bot.id]?.length) {
    return { bot: bot.id, status: 'ua-only', group: bot.group };
  }

  const ipBig = ipToBigInt(entry.ip);
  if (ipBig === null) return { bot: bot.id, status: 'unverified', group: bot.group };

  const verified = ipLists[bot.id].some(cidr => ipInCidr(ipBig, cidr));
  if (verified) return { bot: bot.id, status: 'verified', group: bot.group };

  if (isAnonymizedIp(entry.ip)) return { bot: bot.id, status: 'anonymized', group: bot.group };

  return { bot: bot.id, status: 'unverified', group: bot.group };
}

export function aggregateByBot(entries, ipLists, opts = {}) {
  const { snapshotDate = null, snapshotSource = null, approximate = false } = opts;
  const buckets = new Map();

  for (const e of entries) {
    const { bot, status, group } = classifyEntry(e, ipLists);
    if (!bot) continue;

    if (!buckets.has(bot)) {
      buckets.set(bot, {
        bot,
        displayName: displayNameFor(bot),
        group: group || groupFor(bot),
        hasPublishedIps: hasPublishedIps(bot),
        total: 0,
        verifiedCount: 0,
        rdnsVerifiedCount: 0,
        unverifiedCount: 0,
        anonymizedCount: 0,
        uaOnlyCount: 0,
        statuses: new Map(),
        statusClasses: { 2: 0, 3: 0, 4: 0, 5: 0 },
        firstSeen: null,
        firstVerified: null,
        lastSeen: null,
        topPaths: new Map(),
        topIps: new Map(),
        unverifiedIps: new Map(),
        anonymizedIps: new Map(),
        suspiciousStatuses: { 401: 0, 403: 0, 429: 0, 503: 0 },
      });
    }

    const b = buckets.get(bot);
    b.total++;
    if (status === 'verified')           b.verifiedCount++;
    else if (status === 'rdns-verified') b.rdnsVerifiedCount++;
    else if (status === 'anonymized')    b.anonymizedCount++;
    else if (status === 'ua-only')       b.uaOnlyCount++;
    else                                 b.unverifiedCount++;

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
      const isVerified = status === 'verified' || status === 'rdns-verified';
      if (isVerified && (!b.firstVerified || e.time < b.firstVerified)) {
        b.firstVerified = e.time;
      }
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
    snapshotDate,
    snapshotSource,
    approximate,
    statuses: [...b.statuses.entries()].sort((a, b) => b[1] - a[1]),
    topPaths: [...b.topPaths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    topIps: [...b.topIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    unverifiedIps: [...b.unverifiedIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    anonymizedIps: [...b.anonymizedIps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
  })).sort((a, b) => b.total - a.total);
}

export async function applyRdnsFallback(buckets, workerUrl) {
  const eligible = buckets.filter(b =>
    b.hasPublishedIps && b.unverifiedCount > 0 && b.unverifiedIps.length > 0
  );
  if (!eligible.length) return { checked: 0, matched: 0 };

  const allIps = new Set();
  for (const b of eligible) for (const [ip] of b.unverifiedIps) allIps.add(ip);
  const ips = [...allIps].slice(0, 60);
  if (!ips.length) return { checked: 0, matched: 0 };

  let results = {};
  try {
    const res = await fetch(`${workerUrl}rdns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips }),
    });
    if (res.ok) {
      const data = await res.json();
      results = data.results || {};
    }
  } catch { return { checked: 0, matched: 0 }; }

  let matched = 0;
  for (const b of eligible) {
    for (const [ip, count] of b.unverifiedIps) {
      const hit = results[ip];
      if (!hit?.verified || !hit.ptr) continue;
      const reg = BOT_REGISTRY?.find(x => x.id === b.bot);
      if (!reg?.rdns || !reg.rdns.some(d => hit.ptr.endsWith(d))) continue;
      b.rdnsVerifiedCount += count;
      b.unverifiedCount = Math.max(0, b.unverifiedCount - count);
      matched += count;
    }
  }

  return { checked: ips.length, matched };
}
