// script.js — AEO Log Analyzer controller
import { streamLogFile, FORMATS } from './log-parser.js';
import { aggregateByBot, setRegistry, applyRdnsFallback } from './ip-matcher.js';
import { renderReport } from './report-renderer.js';
import { renderContributions } from './contributions.js?v=1.0';
import { canRunTool } from '/main.js?v=1.2';
import { initShareModule } from '/share-module.js';

const IP_API = 'https://aeo-bot-ips.traffictorch.workers.dev/';
const API_BASE      = 'https://traffic-torch-auth.traffictorch.workers.dev';
const IP_CACHE_KEY = 'aeo_bot_ips_cache_v3';
const IP_CACHE_TTL = 24 * 60 * 60 * 1000;

// ── Save log analysis to history (auth user → API, guest → localStorage) ──
async function saveAuditHistory(filename, toolName) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
  const auditUrl = filename || 'Access log analysis';

  if (token) {
    try {
      await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: auditUrl, tool_name: toolName, score: null })
      });
      return;
    } catch (e) { /* fall through to guest */ }
  }

  const stored = localStorage.getItem('audit_guest');
  let entries = [];
  if (stored) { try { entries = JSON.parse(stored).entries || []; } catch {} }
  entries.unshift({
    _localId: Date.now() + '_' + Math.random(),
    url: auditUrl, tool: toolName, score: null, timestamp: Date.now()
  });
  entries = entries.slice(0, 5);
  localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
}

// ── AI Access Score (0–100) ─────────────────────────────────────
// Honest, self-contained: measures only things the site owner controls.
const SEARCH_CRAWLERS = new Set([
  'Googlebot', 'Googlebot-Image', 'Googlebot-News',
  'Bingbot', 'Applebot',
  'OAI-SearchBot', 'ChatGPT-User',
  'PerplexityBot', 'Perplexity-User',
  'Claude-User', 'Claude-SearchBot'
]);

function computeAiAccessScore(buckets) {
  // Only consider bots with published IP ranges when measuring spoofing / rate limits.
  // Bots marked "UA only" (Amazonbot, CCBot, etc.) have no published ranges, so
  // their hits can never be classified as verified OR spoofed — they are simply
  // unverifiable and must not penalise the score.
  const verifiable = buckets.filter(b => b.hasPublishedIps);

  const checks = [
    { key: 'noRateLimit', points: 30, label: 'No verified crawler rate-limited or blocked',
      pass: verifiable.every(b => !(b.verifiedCount > 0 && (
        (b.suspiciousStatuses[401] || 0) + (b.suspiciousStatuses[403] || 0) +
        (b.suspiciousStatuses[429] || 0) + (b.suspiciousStatuses[503] || 0) > 0))) },
    { key: 'noServerErrors', points: 20, label: 'No verified crawler hit 5xx errors',
      pass: verifiable.every(b => !(b.verifiedCount > 0 && (b.statusClasses[5] || 0) > 0)) },
    { key: 'searchCrawlerSeen', points: 20, label: 'At least one verified search-crawler present',
      pass: buckets.some(b => b.verifiedCount > 0 && SEARCH_CRAWLERS.has(b.bot)) },
    { key: 'highVerification', points: 15, label: 'Verification rate ≥ 80%',
      pass: (() => {
        const v = verifiable.reduce((s, b) => s + (b.verifiedCount || 0), 0);
        const u = verifiable.reduce((s, b) => s + (b.unverifiedCount || 0), 0);
        const t = v + u;
        return t === 0 ? false : (v / t) >= 0.8;
      })() },
    { key: 'noHeavySpoof', points: 15, label: 'No UA spoof exceeds 50% of its own claims',
      pass: verifiable.every(b => {
        const t = (b.verifiedCount || 0) + (b.unverifiedCount || 0);
        return t === 0 || (b.unverifiedCount / t) <= 0.5;
      }) }
  ];
  const score = checks.reduce((s, c) => s + (c.pass ? c.points : 0), 0);
  return { score, checks };
}

function aiScoreColor(s) {
  return s >= 80 ? '#22c55e' : s >= 60 ? '#f97316' : '#ef4444';
}

function renderAiAccessScoreCard({ score, checks }) {
  const color = aiScoreColor(score);
  return `
    <div style="max-width:22rem; margin:2rem auto; padding:0 0.5rem;">
      <div style="background:#fff; border-radius:1.25rem; padding:1.5rem 1.25rem 1.25rem; border:3px solid ${color}; box-shadow:0 10px 30px -12px rgba(0,0,0,0.18);">
        <p style="text-align:center; font-size:0.9rem; font-weight:600; color:#6b7280; margin:0 0 0.9rem; letter-spacing:0.02em;">AI Access Score</p>
        <div style="position:relative; width:130px; height:130px; margin:0 auto;">
          <svg viewBox="0 0 200 200" style="width:100%; height:100%; transform:rotate(-90deg);">
            <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
            <circle cx="100" cy="100" r="90" stroke="${color}" stroke-width="16" fill="none"
                    stroke-dasharray="${(score / 100) * 565} 565" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
            <div style="text-align:center;">
              <div style="font-size:2.4rem; font-weight:900; line-height:1; color:${color};">${score}</div>
              <div style="font-size:0.8rem; color:${color}; opacity:0.75; margin-top:2px;">/100</div>
            </div>
          </div>
        </div>
        <p style="text-align:center; font-size:0.78rem; color:#6b7280; margin:1rem 0 0; line-height:1.5;">How well your site treats verified AI crawlers — nothing about volume or popularity.</p>
        <div style="margin-top:0.9rem; font-size:0.78rem; border-top:1px solid #e5e7eb; padding-top:0.75rem;">
          ${checks.map(c => `
            <div style="display:flex; align-items:flex-start; gap:0.5rem; padding:0.25rem 0;">
              <span style="color:${c.pass ? '#22c55e' : '#ef4444'}; font-weight:700; flex-shrink:0;">${c.pass ? '\u2713' : '\u2717'}</span>
              <span style="color:#374151; flex:1; line-height:1.4;">${c.label}</span>
              <span style="color:#9ca3af; font-size:0.7rem; flex-shrink:0;">+${c.points}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput   = document.getElementById('log-file');
  const dropZone    = document.getElementById('drop-zone');
  const loading     = document.getElementById('loading');
  const progress    = document.getElementById('progress-text');
  const results     = document.getElementById('results');
  const errorBox    = document.getElementById('error-box');

  renderContributions();

  // ── iOS-safe sample log download ──
  // iOS PWA can trap an <a download> click in an in-app webview with no back button.
  // Fix: pre-fetch the file at load, then hand it to navigator.share() on click,
  // which opens the iOS share sheet ("Save to Files"). Fall back to native download.
  (function initSampleLogShare() {
    const link = document.getElementById('sample-log-link');
    if (!link) return;

    let cachedFile = null;
    let ready = false;

    (async () => {
      try {
        const res = await fetch(link.href);
        if (!res.ok) return;
        const blob = await res.blob();
        cachedFile = new File([blob], 'sample.log', { type: 'text/plain' });
        ready = true;
      } catch { /* leave ready=false → native fallback */ }
    })();

    link.addEventListener('click', (e) => {
      if (!ready || !cachedFile) return;                      // still loading → native download
      if (!navigator.canShare || !navigator.share) return;    // desktop Firefox etc. → native
      if (!navigator.canShare({ files: [cachedFile] })) return; // browser can't share files → native

      e.preventDefault();
      navigator.share({
        files: [cachedFile],
        title: 'Traffic Torch sample access log',
      }).catch((err) => {
        if (err && err.name === 'AbortError') return;         // user cancelled — fine
        // Any other failure: fall back to a plain download
        const url = URL.createObjectURL(cachedFile);
        const a = document.createElement('a');
        a.href = url; a.download = 'sample.log';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    });
  })();

  if (!fileInput) return;

  fileInput.addEventListener('change', async () => {
    if (!fileInput.files[0]) return;
    if (!(await canRunTool('aeo-log-analyzer'))) { fileInput.value = ''; return; }
    handleFile(fileInput.files[0]);
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  });
  dropZone.addEventListener('drop', async e => {
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (!(await canRunTool('aeo-log-analyzer'))) return;
    handleFile(f);
  });

  async function handleFile(file) {
    errorBox.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');
    progress.textContent = 'Reading file…';

    try {
      // 1. Fetch registry once per session
      progress.textContent = 'Loading bot registry…';
      const bots = await getRegistry();
      setRegistry(bots);

      // 2. Parse log
      progress.textContent = 'Parsing log file…';
      const { entries, format, totalLines, parsed, parsedWithUa, firstLine } = await streamLogFile(file, {
        onProgress: ({ line, total, parsed }) => {
          progress.textContent = `Parsing… ${Math.floor((line / total) * 100)}% · ${parsed.toLocaleString()} entries`;
        }
      });

      if (format === FORMATS.UNKNOWN) {
        throw new Error(
          `Couldn't recognise this log format.\n\n` +
          `First non-empty line of your file:\n${firstLine}\n\n` +
          `Supported: Apache combined, Nginx combined, Apache vhost_combined, Nginx JSON, Cloudflare CSV.`
        );
      }
      if (entries.length === 0) {
        throw new Error(
          `No lines in this file parsed as access-log entries.\n\n` +
          `First non-empty line of your file:\n${firstLine}`
        );
      }
      if (parsedWithUa === 0) {
        throw new Error(
          `Parsed ${parsed.toLocaleString()} lines but couldn't find a user-agent field in any of them.\n\n` +
          `First non-empty line of your file:\n${firstLine}\n\n` +
          `Bot detection needs the UA. Check the format includes a quoted UA field.`
        );
      }

      // 3. Fetch snapshot for this log's date range
      progress.textContent = 'Loading IP snapshot for log date…';
      const snapshot = await getSnapshot(entries.length ? entries[0].time : null);
      const ipLists = snapshot.lists;

      // 4. Aggregate
      progress.textContent = 'Matching against bot IP lists…';
      const buckets = aggregateByBot(entries, ipLists, {
        snapshotDate: snapshot.version || null,
        snapshotSource: snapshot.source || 'live',
        approximate: !!snapshot.approximate,
      });

      // 4b. Reverse-DNS fallback for Google/Bing spoofs
      progress.textContent = 'Reverse-DNS check on unverified IPs…';
      try {
        const rdns = await applyRdnsFallback(buckets, IP_API);
        if (rdns.matched > 0) {
          console.info(`[aeo-log] rDNS resolved ${rdns.matched} of ${rdns.checked} unverified IPs`);
        }
      } catch (e) {
        console.warn('[aeo-log] rDNS pass failed:', e.message);
      }

      if (buckets.length === 0) {
        throw new Error(`Parsed ${parsed.toLocaleString()} lines with user agents. No known crawler user agents matched.`);
      }

      // 4. Render
      progress.textContent = 'Rendering report…';
      const reportHtml = renderReport({
        buckets,
        meta: {
          filename: file.name,
          format: formatLabel(format),
          totalLines,
          parsedEntries: parsed,
          snapshotDate: snapshot.version || null,
          snapshotSource: snapshot.source || 'live',
          approximate: !!snapshot.approximate,
          snapshotNote: snapshot.note || null,
        }
      });

      // Compute AI Access Score
      const { score: aiScore, checks: aiChecks } = computeAiAccessScore(buckets);
      const scoreCardHtml = renderAiAccessScoreCard({ score: aiScore, checks: aiChecks });

      results.innerHTML = scoreCardHtml + reportHtml;
      results.classList.remove('hidden');
      loading.classList.add('hidden');

      // Auto-scroll to results (same behaviour as other Traffic Torch tools)
      const offset = 100;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });

      // Save to audit history (auth user → API, guest → localStorage)
      saveAuditHistory(file.name, 'AEO Log Analyzer').catch(() => {});

      // ── Share module ──────────────────────────────────────────
      const verifiedTotal = buckets.reduce((s, b) => s + (b.verifiedCount || 0), 0);
      const unverifiedTotal = buckets.reduce((s, b) => s + (b.unverifiedCount || 0), 0);
      const botModuleScores = buckets
        .filter(b => b.verifiedCount > 0)
        .slice(0, 12)
        .map(b => {
          const total = (b.verifiedCount || 0) + (b.unverifiedCount || 0);
          const pct = total > 0 ? Math.round((b.verifiedCount / total) * 100) : 0;
          return { name: b.bot, score: pct };
        });

      const shareEl = document.getElementById('share-dashboard-container');
      if (shareEl && typeof initShareModule === 'function') {
        initShareModule(shareEl, {
          toolName: 'AEO Log Analyzer',
          url: '',
          pageTitle: file.name,
          overallScore: aiScore,
          moduleScores: botModuleScores,
          passedMetrics: aiChecks.filter(c => c.pass).map(c => c.label),
          failedMetrics: aiChecks.filter(c => !c.pass).map(c => c.label),
          aiFixes: aiChecks.filter(c => !c.pass).map(c => c.label),
          shareLink: `${window.location.origin}/aeo-log-analyzer/`,
          rawData: { totalLines, parsedEntries: parsed, verifiedTotal, unverifiedTotal, buckets }
        });
      }

      // ── Leaderboard submit ────────────────────────────────────
      if (window.TrafficTorchLeaderboard && window.TrafficTorchLeaderboard.injectButton) {
        const lbHost = document.getElementById('share-dashboard-container') ||
                       document.getElementById('results') ||
                       document.querySelector('main');
        if (lbHost) {
          window.TrafficTorchLeaderboard.injectButton(lbHost, {
            tool: 'aeo-log-analyzer',
            url: file.name,
            title: file.name.slice(0, 200),
            score: aiScore,
            moduleScores: botModuleScores
          });
        }
      }

      // Wire export buttons
      document.getElementById('export-json')?.addEventListener('click', () => exportJson(buckets));
      document.getElementById('export-csv')?.addEventListener('click', () => exportCsv(buckets));
      document.getElementById('analyze-another')?.addEventListener('click', () => {
        results.classList.add('hidden');
        fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      loading.classList.add('hidden');
      errorBox.textContent = err.message || 'Unknown error';
      errorBox.classList.remove('hidden');
    }
  }

  function formatLabel(f) {
    return {
      'apache-combined': 'Apache combined',
      'nginx-combined': 'Nginx combined',
      'nginx-json': 'Nginx JSON',
      'cloudflare-csv': 'Cloudflare CSV',
      'unknown': 'Unknown'
    }[f] || f;
  }

  async function getSnapshot(date) {
    const key = 'aeo_snapshot_' + (date || 'latest');
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (cached && (Date.now() - cached._cachedAt) < 6 * 60 * 60 * 1000) {
        return cached;
      }
    } catch {}
    const endpoint = date ? `${IP_API}snapshot?date=${encodeURIComponent(date)}` : IP_API;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`IP service returned ${res.status}`);
    const data = await res.json();
    if (!data.lists) throw new Error('IP service returned malformed data');
    data._cachedAt = Date.now();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    return data;
  }

  async function getRegistry() {
    const key = 'aeo_bot_registry';
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (cached && (Date.now() - cached._cachedAt) < 24 * 60 * 60 * 1000) {
        return cached.bots;
      }
    } catch {}
    const res = await fetch(`${IP_API}registry`);
    if (!res.ok) throw new Error(`Registry returned ${res.status}`);
    const data = await res.json();
    try { localStorage.setItem(key, JSON.stringify({ ...data, _cachedAt: Date.now() })); } catch {}
    return data.bots;
  }

  function exportJson(buckets) {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), buckets }, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `aeo-log-analyzer-${Date.now()}.json`);
  }

  function exportCsv(buckets) {
    const lines = ['bot,total,verified,unverified,status_2xx,status_3xx,status_4xx,status_5xx,status_401,status_403,status_429,status_503,first_seen,last_seen'];
    for (const b of buckets) {
      lines.push([
        b.bot, b.total, b.verifiedCount, b.unverifiedCount,
        b.statusClasses[2], b.statusClasses[3], b.statusClasses[4], b.statusClasses[5],
        b.suspiciousStatuses[401] || 0, b.suspiciousStatuses[403] || 0,
        b.suspiciousStatuses[429] || 0, b.suspiciousStatuses[503] || 0,
        csvEscape(b.firstSeen || ''), csvEscape(b.lastSeen || '')
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `aeo-log-analyzer-${Date.now()}.csv`);
  }

  function csvEscape(v) {
    v = String(v);
    if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  // iOS-safe export: try navigator.share({files}) first (opens iOS share sheet
  // with "Save to Files"), fall back to native <a download> on desktop.
  async function downloadBlob(blob, filename) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user cancelled
        // fall through to native download
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
