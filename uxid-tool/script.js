// uxid-tool/script.js
import { analyzeAll } from './metrics-incentive.js';
import { MODES, computeWeightedScore } from './uxid-mode.js';
import { canRunTool } from '/main.js?v=1.2';
import { initShareModule } from '/share-module.js';
import { renderContributions } from './contributions.js';
import { metricExplanations } from './metric-explanations.js';

const PROXY = 'https://qr-full-render-worker.traffictorch.workers.dev/';
const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';

let currentMode = 'both';
let currentMetrics = null;
let currentUrl = '';
const $ = (id) => document.getElementById(id);

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('#uxid-mode button').forEach(b => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  if (currentMetrics) render(currentMetrics, currentUrl);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function scoreColor(score) {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 51) return '#f97316'; // orange
  return '#ef4444'; // red
}

function pillStyle(score) {
  if (score == null || score === undefined || isNaN(score)) return 'background:#e5e7eb; color:#374151;';
  if (score >= 80) return 'background:#dcfce7; color:#166534;';
  if (score >= 51) return 'background:#ffedd5; color:#9a3412;';
  return 'background:#fee2e2; color:#991b1b;';
}

function normalizeUrl(input) {
  if (!input) return '';
  let u = String(input).trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { new URL(u); return u; } catch { return ''; }
}

function scoreRing(score, accent) {
  const r = 54, c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return `<svg class="uxid-ring" viewBox="0 0 140 140" role="img" aria-label="UXID score ${score} out of 100">
      <circle cx="70" cy="70" r="${r}" class="uxid-ring-bg"/>
      <circle cx="70" cy="70" r="${r}" class="uxid-ring-fg" stroke="${accent}" stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 70 70)"/>
      <text x="70" y="66" text-anchor="middle" class="uxid-ring-score">${score}</text>
      <text x="70" y="88" text-anchor="middle" class="uxid-ring-label">UXID</text>
    </svg>`;
}

function stackBar(breakdown) {
  const max = Math.max(...breakdown.map(b => b.contribution), 1);
  return breakdown.map(b => `<div class="uxid-stack-row">
      <span class="uxid-stack-label">${escapeHtml(LABELS[b.key] || b.key)}</span>
      <div class="uxid-stack-track"><div class="uxid-stack-fill" style="width:${Math.round((b.contribution / max) * 100)}%"></div></div>
      <span class="uxid-stack-val">${b.score}</span>
    </div>`).join('');
}

function metricCard(label, m, key) {
  if (!m) return '';
  const urgencyBadge = key === 'urgency' ? `<span class="uxid-badge uxid-badge-${m.status}">${m.status}</span>` : '';
  return `<article class="uxid-card" data-metric="${key}">
      <header class="uxid-card-head"><h3>${escapeHtml(label)}</h3><span class="uxid-score-pill" style="${pillStyle(m.score)}">${m.score ?? '—'}</span></header>
      ${urgencyBadge}
      <p class="uxid-detail">${escapeHtml(m.detail || '')}</p>
      <ul class="uxid-evidence">${(m.evidence || []).map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
      <div class="mt-3 text-right">
        <a href="#card-${key}" class="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1" onclick="event.preventDefault(); const el = document.getElementById('card-${key}'); if(el){ const det = el.querySelector('details'); if(det) det.open = true; setTimeout(() => el.scrollIntoView({behavior:'smooth', block:'center'}), 50); }">
          Learn more ↓
        </a>
      </div>
    </article>`;
}

const LABELS = {
  ctaSpecificity: '🎯 CTA specificity', ctaVisibility: '👁️ CTA visibility',
  valueFirst: '💎 Value-first framing', frictionValue: '⚖️ Friction-to-value',
  commitment: '🪜 Micro-commitment ladder', reciprocity: '🤝 Reciprocity',
  socialProof: '👥 Social proof placement', trust: '🛡️ Trust anchors',
  urgency: '⏰ Ethical urgency', headings: '📢 Action-oriented headings',
  listPresence: '📋 List presence (AEO)', sourcedStats: '📊 Sourced statistics (AEO)',
  definitional: '📖 Definitional clarity (AEO)', faq: '❓ FAQ structure (AEO)',
  structuredData: '🏗️ Structured data (AEO)'
};

function render(metrics, url) {
  const mode = MODES[currentMode];
  const { score, breakdown } = computeWeightedScore(metrics, currentMode);
  const results = $('uxid-results');
  results.hidden = false;

  const cards = Object.keys(LABELS)
    .filter(k => metrics[k])
    .map(k => metricCard(LABELS[k], metrics[k], k))
    .join('');

  const shareUrl = location.origin + '/uxid-tool/?url=' + encodeURIComponent(url);

  document.body.setAttribute('data-url', url || 'Custom HTML');

  results.innerHTML = `
    <div class="uxid-hero-card">
      ${scoreRing(score, scoreColor(score))}
      <div class="uxid-hero-copy">
        <h2>${mode.label} incentive score: ${score}/100</h2>
        <p>${escapeHtml(url)}</p>
        <p class="uxid-note">Static HTML signals only. Rendered visibility and true contrast require a live browser.</p>
      </div>
    </div>
    <section class="uxid-stack"><h3>Incentive stack</h3>${stackBar(breakdown)}</section>
    <section class="uxid-cards">${cards}</section>
    <div class="uxid-ai-cta">
      <p style="margin:0 0 .75rem;font-weight:600;">Want AI-generated fixes?</p>
      <p style="margin:0 0 1rem;color:var(--uxid-muted);font-size:.85rem;">Ask the model for specific, mode-aware improvements based on this audit.</p>
      <button id="uxid-ai-fix" class="uxid-btn-primary">Generate AI fixes →</button>
    </div>
    <div id="uxid-ai-panel" class="uxid-ai-panel" hidden></div>
    <div id="share-dashboard-container" class="mt-8"></div>`;

  const aiBtn = $('uxid-ai-fix');
  if (aiBtn) aiBtn.addEventListener('click', () => requestFixes(metrics, url));

  // ── Initialize Share Dashboard ──
  const shareContainer = document.getElementById('share-dashboard-container');
  if (shareContainer) {
    const analyzedUrl = currentUrl || url;
    const shareData = {
      toolName: 'UXID Tool',
      url: analyzedUrl,
      pageTitle: document.title.replace(' | Traffic Torch', '').trim() || 'Untitled page',
      overallScore: score,
      moduleScores: breakdown.map(b => ({ name: LABELS[b.key] || b.key, score: b.score })),
      passedMetrics: breakdown.filter(b => b.score >= 80).map(b => LABELS[b.key] || b.key),
      failedMetrics: breakdown.filter(b => b.score < 50).map(b => LABELS[b.key] || b.key),
      aiFixes: [],
      rawData: { metrics },
      shareLink: `${window.location.origin}/uxid-tool/?url=${encodeURIComponent(analyzedUrl)}`
    };
    initShareModule(shareContainer, shareData);

    if (window.TrafficTorchLeaderboard && typeof window.TrafficTorchLeaderboard.injectButton === 'function') {
      window.TrafficTorchLeaderboard.injectButton(shareContainer, {
        tool: 'uxid-tool',
        url: analyzedUrl,
        title: document.title.replace(' | Traffic Torch', '').trim() || 'Untitled page',
        score: score,
        moduleScores: shareData.moduleScores
      });
    }
  }

    
}

const SPINNER_STEPS = [
  'Fetching page HTML…',
  'Extracting 15 incentive signals…',
  'Scoring CTA specificity…',
  'Checking trust and social proof…',
  'Analysing AEO structure…',
  'Calculating weighted score…',
  'Rendering results…'
];

async function runAudit(rawInput) {
  const url = normalizeUrl(rawInput);
  if (!url) {
    alert('Please enter a valid URL.');
    return;
  }
  $('uxid-url').value = url;

  const results = $('uxid-results');
  const loading = $('loading');
  const progressText = $('progressText');
  const submitBtn = $('uxid-form').querySelector('button[type="submit"]');

  results.hidden = true;
  results.innerHTML = '';
  if (loading) loading.classList.remove('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
    submitBtn.textContent = 'Analysing…';
  }

  let stepIdx = 0;
  if (progressText) progressText.textContent = SPINNER_STEPS[0];
  const stepTimer = setInterval(() => {
    stepIdx = Math.min(stepIdx + 1, SPINNER_STEPS.length - 1);
    if (progressText) progressText.textContent = SPINNER_STEPS[stepIdx];
  }, 420);

  const startedAt = Date.now();

  try {
    const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    const html = await res.text();
    if (!html || html.length < 200) throw new Error('Empty or blocked response');

    const doc = new DOMParser().parseFromString(html, 'text/html');
    currentMetrics = analyzeAll(doc, html);
    currentUrl = url;

    // Localhost-only diagnostic (helps dev, silent in production)
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const ldTag = /<script[^>]*application\/ld\+json/i.test(html);
      const rawType = /"@type"\s*:/.test(html);
      const decoded = /"@type"\s*:/.test(html.replace(/&quot;/gi, '"').replace(/\\"/g, '"'));
      console.log('[UXID] raw', html.length, '| LD tag:', ldTag, '| raw @type:', rawType, '| decoded @type:', decoded);
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < 1400) await new Promise(r => setTimeout(r, 1400 - elapsed));

    clearInterval(stepTimer);
    if (loading) loading.classList.add('hidden');
    render(currentMetrics, url);
    saveAuditHistory(url);
  } catch (err) {
    clearInterval(stepTimer);
    if (loading) loading.classList.add('hidden');
    results.hidden = false;
    results.innerHTML = `<div class="uxid-error-box">
      <p class="uxid-error">Could not audit this URL: ${escapeHtml(err.message)}</p>
      <p class="uxid-hint">Try a public page — some sites block automated fetches.</p>
    </div>`;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'Run UXID audit';
    }
  }
}

async function saveAuditHistory(url) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
  if (token) {
    try {
      await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tool_name: 'UXID', score: null })
      });
      return;
    } catch (e) { /* fall through */ }
  }
  try {
    const stored = localStorage.getItem('audit_guest');
    let entries = [];
    if (stored) entries = JSON.parse(stored).entries || [];
    entries.unshift({ _localId: Date.now() + '_' + Math.random(), url, tool: 'UXID', score: null, timestamp: Date.now() });
    entries = entries.slice(0, 5);
    localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
  } catch {}
}

async function requestFixes(metrics, url) {
  const panel = $('uxid-ai-panel');
  if (!panel) return;
  panel.hidden = false;
  panel.innerHTML = '<p class="uxid-loading">Generating mode-specific fixes…</p>';
  const payload = {
    system: 'uxid-fix',
    mode: currentMode,
    payload: {
      url,
      metrics: Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, { score: v.score, detail: v.detail, evidence: v.evidence }])),
      score: computeWeightedScore(metrics, currentMode).score
    }
  };
  try {
    const res = await fetch(`https://uxid-ai.traffictorch.workers.dev/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Server returned ${res.status}`);
    }
    const fixes = data.fixes || data.summary || [];
    if (Array.isArray(fixes) && fixes.length === 0) {
      panel.innerHTML = `<p class="uxid-error">AI returned 0 fixes. The model may have timed out or refused the prompt. Try again.</p>`;
      return;
    }
    panel.innerHTML = `<h3>AI fixes — ${MODES[currentMode].label}</h3><div class="uxid-ai-body">${formatFixes(fixes)}</div>`;
  } catch (err) {
    panel.innerHTML = `<p class="uxid-error">AI fix panel unavailable: ${escapeHtml(err.message)}</p>`;
  }
}

function formatFixes(fixes) {
  if (typeof fixes === 'string') return `<p>${escapeHtml(fixes).replace(/\n/g, '<br>')}</p>`;
  if (fixes && typeof fixes === 'object' && !Array.isArray(fixes) && fixes.what) {
    return `<article class="uxid-fix">
      <h4>${escapeHtml(fixes.title || 'Fix')}</h4>
      <p><strong>What:</strong> ${escapeHtml(fixes.what || '')}</p>
      <p><strong>Why:</strong> ${escapeHtml(fixes.why || '')}</p>
      <p><strong>Impact:</strong> ${escapeHtml(fixes.impact || '')}</p>
    </article>`;
  }
  if (Array.isArray(fixes)) {
    return fixes.map(f => `<article class="uxid-fix">
        <h4>${escapeHtml(f.title || 'Fix')}</h4>
        <p><strong>What:</strong> ${escapeHtml(f.what || '')}</p>
        <p><strong>Why:</strong> ${escapeHtml(f.why || '')}</p>
        <p><strong>Impact:</strong> ${escapeHtml(f.impact || '')}</p>
      </article>`).join('');
  }
  return `<pre>${escapeHtml(JSON.stringify(fixes, null, 2))}</pre>`;
}


function renderSignalCards() {
  const container = document.getElementById('signal-cards-container');
  if (!container) return;
  
  let html = '';
  Object.entries(metricExplanations).forEach(([key, data]) => {
    html += `
      <div id="card-${key}" class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden text-left hover:border-orange-400 transition">
        <details class="group">
          <summary class="px-5 py-4 cursor-pointer list-none flex justify-between items-center gap-4">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                <span class="text-xl">${data.emoji}</span> ${data.name}
              </h3>
            </div>
            <span class="text-2xl text-orange-500 group-open:rotate-180 transition-transform" aria-hidden="true">↓</span>
          </summary>
          <div class="px-5 pb-5 pt-2 text-sm text-gray-700 dark:text-gray-300 space-y-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <strong class="text-orange-600 dark:text-orange-400 block mb-1">What is it?</strong>
              <p>${data.what}</p>
            </div>
            <div>
              <strong class="text-orange-600 dark:text-orange-400 block mb-1">How is it tested?</strong>
              <p>${data.how}</p>
            </div>
            <div>
              <strong class="text-orange-600 dark:text-orange-400 block mb-1">Why does it matter?</strong>
              <p>${data.why}</p>
            </div>
            <div class="pt-2">
              <a href="${data.link}" class="inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Read full guide for ${data.name} →
              </a>
            </div>
          </div>
        </details>
      </div>
    `;
  });
  container.innerHTML = html;
}


document.addEventListener('DOMContentLoaded', () => {
  renderContributions('contributions-section');
  renderSignalCards();
  $('uxid-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = $('uxid-url').value.trim();
    if (!raw) return;
    const canProceed = await canRunTool('uxid-tool');
    if (!canProceed) return;
    runAudit(raw);
  });

  document.querySelectorAll('#uxid-mode button').forEach(b => {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  });

  const shared = new URLSearchParams(location.search).get('url');
  if (shared) {
    const clean = normalizeUrl(decodeURIComponent(shared));
    if (clean) {
      $('uxid-url').value = clean;
      setTimeout(() => $('uxid-form').requestSubmit(), 400);
    }
  }
});
