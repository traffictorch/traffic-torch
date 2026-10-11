// report-renderer.js — build the HTML for the report

const STATUS_CLASS_COLORS = {
  2: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', text: '#16a34a', label: '2xx Success' },
  3: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', text: '#2563eb', label: '3xx Redirect' },
  4: { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)', text: '#ea580c', label: '4xx Client Error' },
  5: { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  text: '#dc2626', label: '5xx Server Error' }
};

export function renderReport({ buckets, meta }) {
  const totalHits = buckets.reduce((s, b) => s + b.total, 0);
  const uniqueBots = buckets.length;
  const verifiedHits = buckets.reduce((s, b) => s + b.verifiedCount, 0);
  const unverifiedHits = buckets.reduce((s, b) => s + b.unverifiedCount, 0);
  const suspicious = buckets.reduce((s, b) =>
    s + Object.values(b.suspiciousStatuses).reduce((a, c) => a + c, 0), 0);

  return `
    <div class="max-w-6xl mx-auto my-8 px-2">
      <div class="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div class="bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-6 text-white">
          <h2 class="text-2xl md:text-3xl font-black">Log Analysis Report</h2>
          <p class="text-sm md:text-base opacity-90 mt-1">
            ${escapeHtml(meta.filename)} · ${meta.totalLines.toLocaleString()} lines · format ${meta.format}
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          ${statCard('Total Bot Hits', totalHits.toLocaleString(), 'gray')}
          ${statCard('Unique Bots', uniqueBots, 'orange')}
          ${statCard('Verified Hits', verifiedHits.toLocaleString(), 'green')}
          ${statCard('Unverified Claims', unverifiedHits.toLocaleString(), unverifiedHits > 0 ? 'red' : 'gray')}
        </div>

        ${suspicious > 0 ? `
          <div class="mx-6 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p class="font-bold text-red-700 dark:text-red-300">⚠️ ${suspicious.toLocaleString()} suspicious status codes detected</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">
              These include 401 / 403 / 429 / 503 responses. If a verified bot is receiving these, it may have been rate-limited or blocked.
            </p>
          </div>
        ` : ''}

        <div class="px-6 pb-6 space-y-4">
          ${buckets.map(renderBotCard).join('')}
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
        Log analysis runs entirely in your browser. No log content, IP addresses, or URL paths were uploaded or stored. Bot IP list is fetched from
        <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">aeo-bot-ips.traffictorch.workers.dev</code> — a public cache of the operators' published ranges.
      </p>
    </div>
  `;
}

function statCard(label, value, tone) {
  const tones = {
    gray: 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
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

  const verifyBadge = b.hasPublishedIps
    ? (b.unverifiedCount === 0
        ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">✅ ${b.verifiedCount} verified</span>`
        : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">⚠️ ${b.unverifiedCount} unverified</span>`)
    : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">UA only · no published IPs</span>`;

  return `
    <details class="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/40">
      <summary class="px-4 py-3 cursor-pointer flex items-center gap-3 list-none hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <span class="text-lg font-black text-gray-800 dark:text-gray-200 flex-1 truncate">${escapeHtml(b.bot)}</span>
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

        <div class="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
          ${b.firstSeen ? `<span><strong>First seen:</strong> ${escapeHtml(b.firstSeen)}</span>` : ''}
          ${b.lastSeen ? `<span><strong>Last seen:</strong> ${escapeHtml(b.lastSeen)}</span>` : ''}
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
            <div class="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">Unverified source IPs (UA claimed but IP not in published range)</div>
            <ul class="text-xs space-y-1 font-mono text-red-700 dark:text-red-300">
              ${b.unverifiedIps.slice(0, 5).map(([ip, c]) => `<li><span class="font-bold">${c}×</span> ${escapeHtml(ip)}</li>`).join('')}
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
