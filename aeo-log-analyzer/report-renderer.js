// report-renderer.js — v2
// Grouped by operator, shows firstSeen vs firstVerified, snapshot provenance.

const STATUS_CLASS_COLORS = {
  2: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', text: '#16a34a', label: '2xx Success' },
  3: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', text: '#2563eb', label: '3xx Redirect' },
  4: { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)', text: '#ea580c', label: '4xx Client Error' },
  5: { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  text: '#dc2626', label: '5xx Server Error' },
};

const GROUP_ORDER = ['Google', 'Microsoft', 'Apple', 'OpenAI', 'Anthropic', 'Perplexity', 'Common Crawl', 'ByteDance', 'Amazon', 'DuckDuckGo', 'Yandex', 'Other'];

export function renderReport({ buckets, meta }) {
  const totalHits = buckets.reduce((s, b) => s + b.total, 0);
  const uniqueBots = buckets.length;
  const verifiedHits = buckets.reduce((s, b) => s + b.verifiedCount + (b.rdnsVerifiedCount || 0), 0);
  const spoofedHits = buckets.reduce((s, b) => b.hasPublishedIps ? s + b.unverifiedCount : s, 0);
  const anonymizedHits = buckets.reduce((s, b) => s + (b.anonymizedCount || 0), 0);
  const uaOnlyHits = buckets.reduce((s, b) => b.hasPublishedIps ? s : s + b.total, 0);
  const suspicious = buckets.reduce((s, b) => s + Object.values(b.suspiciousStatuses).reduce((a, c) => a + c, 0), 0);

  const grouped = groupBuckets(buckets);

  return `
    <div class="max-w-6xl mx-auto my-8 px-2">
      <div class="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div class="bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-6 text-white">
          <h2 class="text-2xl md:text-3xl font-black">Log Analysis Report</h2>
          <p class="text-sm md:text-base opacity-90 mt-1">
            ${escapeHtml(meta.filename)} · ${meta.totalLines.toLocaleString()} lines · format ${meta.format}
          </p>
          ${meta.snapshotDate ? `
            <p class="text-xs md:text-sm opacity-80 mt-2">
              IP snapshot: <span class="font-mono">${escapeHtml(meta.snapshotDate.slice(0, 10))}</span>
              (${escapeHtml(meta.snapshotSource || 'live')}${meta.approximate ? ' · approximate' : ''})
            </p>
          ` : ''}
        </div>

        ${meta.approximate && meta.snapshotNote ? `
          <div class="mx-6 mt-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">${escapeHtml(meta.snapshotNote)}</p>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 p-6">
          ${statCard('Total Bot Hits', totalHits.toLocaleString(), 'gray')}
          ${statCard('Unique Bots', uniqueBots, 'orange')}
          ${statCard('Verified Hits', verifiedHits.toLocaleString(), 'green')}
          ${statCard('Unverified Claims', spoofedHits.toLocaleString(), spoofedHits > 0 ? 'red' : 'gray')}
          ${anonymizedHits > 0 ? statCard('Anonymized IPs', anonymizedHits.toLocaleString(), 'gray') : ''}
        </div>

        ${uaOnlyHits > 0 ? `
          <div class="mx-6 mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Plus ${uaOnlyHits} hit${uaOnlyHits === 1 ? '' : 's'} from bots with no published IP ranges (UA-only, unverifiable).
          </div>
        ` : ''}

        ${suspicious > 0 ? `
          <div class="mx-6 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p class="font-bold text-red-700 dark:text-red-300">⚠️ ${suspicious.toLocaleString()} suspicious status codes detected</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">
              These include 401 / 403 / 429 / 503 responses. If a verified bot is receiving these, it may have been rate-limited or blocked.
            </p>
          </div>
        ` : ''}

        <div class="px-6 pb-6 space-y-8">
          ${GROUP_ORDER.filter(g => grouped[g]?.length).map(g => `
            <div>
              <h3 class="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 font-bold">${escapeHtml(g)}</h3>
              <div class="space-y-4">
                ${grouped[g].map(renderBotCard).join('')}
              </div>
            </div>
          `).join('')}
          ${Object.keys(grouped).filter(g => !GROUP_ORDER.includes(g)).map(g => `
            <div>
              <h3 class="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 font-bold">${escapeHtml(g)}</h3>
              <div class="space-y-4">
                ${grouped[g].map(renderBotCard).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="px-6 pb-6">
          <div class="flex flex-wrap gap-3 justify-end">
            <button type="button" id="export-json" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold text-sm">Export JSON</button>
            <button type="button" id="export-csv" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-semibold text-sm">Export CSV</button>
            <button type="button" id="analyze-another" class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold text-sm">Analyze Another File</button>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 max-w-2xl mx-auto">
        Log analysis runs entirely in your browser. No log content, IP addresses, or URL paths were uploaded or stored. Bot IP lists and registry are fetched from
        <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">aeo-bot-ips.traffictorch.workers.dev</code> — a public cache of the operators' published ranges, snapshotted weekly.
      </p>
    </div>
  `;
}

function groupBuckets(buckets) {
  const out = {};
  for (const b of buckets) {
    const g = b.group || 'Other';
    if (!out[g]) out[g] = [];
    out[g].push(b);
  }
  return out;
}

function statCard(label, value, tone) {
  const tones = {
    gray: 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };
  return `
    <div class="p-4 rounded-2xl ${tones[tone] || tones.gray} text-center">
      <div class="text-xs uppercase tracking-wider opacity-70 mb-1">${label}</div>
      <div class="text-2xl md:text-3xl font-black">${value}</div>
    </div>
  `;
}

function renderBotCard(b) {
  const classList = [2, 3, 4, 5].filter(c => b.statusClasses[c] > 0);
  const warningBadges = Object.entries(b.suspiciousStatuses)
    .filter(([, v]) => v > 0)
    .map(([code, v]) => `<span class="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 mr-1 mb-1">${code}: ${v}</span>`)
    .join('');

  const verifiedTotal = b.verifiedCount + (b.rdnsVerifiedCount || 0);
  let verifyBadge;
  if (!b.hasPublishedIps) {
    verifyBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">UA only · no published IPs</span>`;
  } else if (b.unverifiedCount === 0 && verifiedTotal > 0) {
    verifyBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">✅ ${verifiedTotal} verified</span>`;
  } else if (verifiedTotal > 0) {
    verifyBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">⚠️ ${verifiedTotal} verified · ${b.unverifiedCount} unverified</span>`;
  } else {
    verifyBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">⚠️ ${b.unverifiedCount} unverified</span>`;
  }

  return `
    <details class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/40">
      <summary class="px-4 py-3 cursor-pointer flex items-center gap-3 list-none hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <span class="text-lg font-black text-gray-800 dark:text-gray-200 flex-1 truncate">${escapeHtml(b.displayName || b.bot)}</span>
        ${verifyBadge}
        <span class="text-sm font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">${b.total} hits</span>
        <span class="text-orange-500 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div class="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
        ${warningBadges ? `<div class="pt-2">${warningBadges}</div>` : ''}

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${classList.map(c => {
            const t = STATUS_CLASS_COLORS[c];
            return `<div class="p-3 rounded-xl text-center" style="background:${t.bg};border:1px solid ${t.border}">
              <div class="text-xs uppercase tracking-wider mb-1" style="color:${t.text}">${t.label}</div>
              <div class="text-xl font-black" style="color:${t.text}">${b.statusClasses[c]}</div>
            </div>`;
          }).join('')}
        </div>

        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          ${b.firstSeen ? `<div><strong>First seen (any):</strong> <span class="font-mono">${escapeHtml(b.firstSeen)}</span></div>` : ''}
          ${b.firstVerified
            ? `<div class="text-green-700 dark:text-green-400"><strong>First verified visit:</strong> <span class="font-mono">${escapeHtml(b.firstVerified)}</span></div>`
            : (b.hasPublishedIps && b.total > 0 ? `<div class="text-red-700 dark:text-red-400"><strong>First verified visit:</strong> never — all hits unverified</div>` : '')}
          ${b.lastSeen ? `<div><strong>Last seen:</strong> <span class="font-mono">${escapeHtml(b.lastSeen)}</span></div>` : ''}
        </div>

        ${b.statuses.length ? `
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Status code breakdown</div>
            <div class="flex flex-wrap gap-2">
              ${b.statuses.map(([code, count]) => `
                <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${code >= 400 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}">
                  ${code}: ${count}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${b.topPaths.length ? `
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Top requested paths</div>
            <ul class="text-xs space-y-1 font-mono text-gray-700 dark:text-gray-300">
              ${b.topPaths.slice(0, 5).map(([p, c]) => `<li class="truncate"><span class="text-orange-500 font-bold">${c}×</span> ${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${b.unverifiedCount > 0 && b.unverifiedIps.length ? `
          <div>
            <div class="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">Unverified source IPs (UA claimed but IP not in published range, and reverse-DNS did not match)</div>
            <ul class="text-xs space-y-1 font-mono text-red-700 dark:text-red-300">
              ${b.unverifiedIps.slice(0, 5).map(([ip, c]) => `<li><span class="font-bold">${c}×</span> ${escapeHtml(ip)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${b.anonymizedIps?.length ? `
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Anonymized source IPs (host strips the last octet — cannot verify)</div>
            <ul class="text-xs space-y-1 font-mono text-gray-600 dark:text-gray-400">
              ${b.anonymizedIps.slice(0, 5).map(([ip, c]) => `<li><span class="font-bold">${c}×</span> ${escapeHtml(ip)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </details>
  `;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
