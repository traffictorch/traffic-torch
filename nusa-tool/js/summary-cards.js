// summary-cards.js — v13
// UX scoring: quit-risk-tool factor tiers (copied verbatim)
// SEO scoring: lighthouse-plus-tool/script-v1.0.js (copied verbatim:
//              MODULE_WEIGHTS, applyIssueCap, recomputeOverall, gradeFromScore)
// AEO scoring: raw worker overall + module.score (aeo-performance-tool does the same)
// Informational signals: rendered as ⚠️ like the standalone tools do.
// Accessibility: "N/M checks passed" summary line, same as lighthouse-plus-tool.

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shorten = (s, n) => { s = String(s||''); return s.length > n ? s.slice(0, n-1) + '…' : s; };

const ACCORDION_CATS = new Set(['SEO']);
const VISIBLE_MODULES = 5;

const iconFor    = s => s === 'pass' ? '✓' : s === 'warn' ? '⚠' : '✕';
const scoreClass = s => s >= 80 ? 'good' : s >= 60 ? 'mid' : 'bad';
const TIER_SCORE = { pass: 100, warn: 55, fail: 15 };

/* ═════════════════════════════════════════════════════════════════
   VERBATIM COPY — lighthouse-plus-tool/script-v1.0.js
   ═════════════════════════════════════════════════════════════════ */
const MODULE_WEIGHTS = {
  'Core Web Vitals': 15,
  'Performance Score': 10,
  'Accessibility': 12,
  'Best Practices': 10,
  'SEO On-Page': 10,
  'PWA Readiness': 8,
  'Resource Optimisation': 10,
  'Third-Party Impact': 8,
  'Mobile UX': 10,
  'Agentic Browsing': 7,
};

function applyIssueCap(mod) {
  const failedCount  = (mod.failed  || []).length;
  const warningCount = (mod.signals || []).filter((s) => !s.pass && !s.informational).length;
  const issues = failedCount + warningCount;

  let capped = mod.score;
  if (issues >= 5)      capped = Math.min(capped, 40);
  else if (issues >= 4) capped = Math.min(capped, 50);
  else if (issues >= 3) capped = Math.min(capped, 65);
  else if (issues >= 2) capped = Math.min(capped, 80);

  return capped;
}

function recomputeOverall(mods) {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const m of mods) {
    const w = MODULE_WEIGHTS[m.name] ?? 10;
    weightedSum += m.score * w;
    weightTotal += w;
  }
  let overall = Math.round(weightedSum / weightTotal);

  const lowest = Math.min(...mods.map((m) => m.score));
  if (lowest < 25)      overall = Math.min(overall, 60);
  else if (lowest < 40) overall = Math.min(overall, 72);
  else if (lowest < 60) overall = Math.min(overall, 85);

  return overall;
}

function gradeFromScore(score) {
  return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
}
/* ── end of Lighthouse Plus verbatim copy ── */

/* ═════════════════════════════════════════════════════════════════
   UX factor tiers — copied from quit-risk-tool/script-v1.3.js
   ═════════════════════════════════════════════════════════════════ */
const UX_FACTORS = {
  Readability: [
    { name: "Flesch Reading Ease Score",  threshold: 65, test: d => (Number(d.fleschEase)   || -999) >= 60 },
    { name: "Flesch-Kincaid Grade Level", threshold: 65, test: d => (Number(d.kincaidGrade) ||  999) <= 10 },
    { name: "Average Sentence Length",    threshold: 70, test: d => (Number(d.avgSentence)  ||  999) <= 20 },
    { name: "Paragraph Density & Length", threshold: 70, test: d => (Number(d.avgParagraph) ||  999) <= 80 },
    { name: "Overall Text Scannability",  threshold: 70, test: d => (Number(d.scannability) ||    0) >= 70 }
  ],
  Navigation: [
    { name: "Link Density Evaluation",     threshold: 78, test: d => (Number(d.linkDensity)     || 999) <= 8  },
    { name: "Menu Structure Clarity",      threshold: 80, test: d => (Number(d.menuClarity)     ||   0) >= 70 },
    { name: "Internal Linking Balance",    threshold: 72, test: d => (Number(d.internalBalance) ||   0) >= 50 },
    { name: "CTA Prominence & Visibility", threshold: 82, test: d => (Number(d.ctaStrength)     ||   0) >= 70 }
  ],
  Accessibility: [
    { name: "Alt Text Coverage",       threshold: 85, test: d => (Number(d.altCoverage)      || 0) >= 85 },
    { name: "Color Contrast Ratios",   threshold: 80, test: d => (Number(d.contrastProxy)    || 0) >= 80 },
    { name: "Semantic HTML Structure", threshold: 82, test: d => (Number(d.semanticStrength) || 0) >= 70 },
    { name: "Overall WCAG Compliance", threshold: 78, test: d => {
        const avg = ((Number(d.altCoverage)||0) + (Number(d.contrastProxy)||0) + (Number(d.semanticStrength)||0)) / 3;
        return avg >= 75;
      } }
  ],
  Mobile: [
    { name: "Viewport Configuration",   threshold: 90, test: d => (Number(d.viewportQuality) || 0) >= 85 },
    { name: "Responsive Breakpoints",   threshold: 85, test: d => (Number(d.responsiveProxy) || 0) >= 75 },
    { name: "Touch Target Size",        threshold: 85, test: d => (Number(d.touchFriendly)   || 0) >= 70 },
    { name: "PWA Readiness Indicators", threshold: 80, test: d => (Number(d.pwaReadiness)    || 0) >= 60 }
  ],
  Performance: [
    { name: "Asset Volume Flags",     threshold: 82, test: d => (Number(d.assetVolume)      || 0) >= 70 },
    { name: "Script Bloat Detection", threshold: 85, test: d => (Number(d.scriptBloat)      || 0) >= 70 },
    { name: "Font Optimization",      threshold: 82, test: d => (Number(d.fontOptimization) || 0) >= 70 },
    { name: "Lazy Loading Media",     threshold: 80, test: d => (Number(d.lazyLoading)      || 0) >= 70 },
    { name: "Image Optimization",     threshold: 82, test: d => (Number(d.imageFormat)      || 0) >= 70 },
    { name: "Script Optimization",    threshold: 80, test: d => (Number(d.renderBlocking)   || 0) >= 70 }
  ]
};

// ── sub-metric rows for SEO/AEO — same set the standalone tools render ──
// failed[]   → ❌
// !pass sig  → ⚠️  (informational or not — matches lighthouse-plus-tool)
//  pass sig  → ✅
function evaluateWorkerModule(mod) {
  const out = [];
  for (const f of (mod.failed || [])) {
    out.push({ name: f, status: 'fail', score: TIER_SCORE.fail });
  }
  for (const sig of (mod.signals || [])) {
    const status = sig.pass === true ? 'pass' : 'warn';
    out.push({ name: sig.label, status, score: TIER_SCORE[status] });
  }
  return out;
}

export function evaluateModule(cat, module) {
  if (cat === 'UX') {
    const factors = UX_FACTORS[module.name] || [];
    const details = module.details || {};
    const moduleScore = Number(module.score) || 0;
    return factors.map(f => {
      const passed = f.test(details);
      const isWarning = !passed && moduleScore >= (f.threshold - 10);
      const status = passed ? 'pass' : isWarning ? 'warn' : 'fail';
      return { name: f.name, status, score: TIER_SCORE[status] };
    });
  }
  return evaluateWorkerModule(module);
}

// ── what to display as the module's big number ──
function moduleDisplayScore(cat, m) {
  if (cat === 'UX') return Math.round(Number(m.score) || 0);
  if (cat === 'SEO') return applyIssueCap(m);        // cap from Lighthouse Plus
  return Math.round(Number(m.score) || 0);            // AEO: raw worker score
}

// ── category scores ──
function categoryScore(cat, data) {
  const mods = data?.modules || [];
  if (cat === 'UX') {
    if (!mods.length) return Math.round(data?.score || 0);
    return Math.round(mods.reduce((s, m) => s + (Number(m.score) || 0), 0) / mods.length);
  }
  if (cat === 'SEO') {
    if (!mods.length) return Math.round(data?.score || 0);
    const capped = mods.map(m => ({ ...m, score: applyIssueCap(m) }));
    return recomputeOverall(capped);
  }
  return Math.round(data?.score || 0);               // AEO: raw worker overall
}

/* ═════════════════════════════════════════════════════════════════
   findings
   ═════════════════════════════════════════════════════════════════ */
function coversSignal(failedText, signalLabels) {
  const fl = String(failedText || '').toLowerCase();
  for (const sl of signalLabels) {
    const tokens = sl.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    if (!tokens.length) continue;
    const hits = tokens.filter(t => fl.includes(t)).length;
    if (hits >= Math.min(2, tokens.length)) return true;
  }
  return false;
}

export function collectFindings(state) {
  const out = [];
  let seq = 0;
  for (const cat of ['UX', 'SEO', 'AEO']) {
    const data = state[cat.toLowerCase()];
    if (!data) continue;
    for (const m of (data.modules || [])) {
      const subs = evaluateModule(cat, m);
      const signalLabels = subs.map(s => s.name);
      for (const s of subs) {
        if (s.status === 'fail' || s.status === 'warn') {
          out.push({
            id: `f${seq++}`,
            cat, module: m.name, label: s.name, status: s.status,
            severity: s.status === 'fail' ? 6 : 3
          });
        }
      }
      for (const failed of (m.failed || [])) {
        if (coversSignal(failed, signalLabels)) continue;
        out.push({
          id: `f${seq++}`,
          cat, module: m.name, label: failed,
          status: 'fail', severity: 7, infoOnly: true
        });
      }
    }
  }
  return out;
}

/* ═════════════════════════════════════════════════════════════════
   rendering
   ═════════════════════════════════════════════════════════════════ */
export function renderSummaryCards(state) {
  const container = $('summary-cards');
  if (!container || !state) return;

  const uxScore  = categoryScore('UX',  state.ux  || {});
  const seoScore = categoryScore('SEO', state.seo || {});
  const aeoScore = categoryScore('AEO', state.aeo || {});
  const overall  = Math.round((uxScore + seoScore + aeoScore) / 3);

  const findings = state.findings || [];
  const blocking = findings.filter(f => f.status === 'fail' && !f.infoOnly).length;
  const warnings = findings.filter(f => f.status === 'warn' && !f.infoOnly).length;

  const idByKey = new Map();
  for (const f of findings) idByKey.set(`${f.cat}::${f.label}`, f.id);

  function overallCard() {
    return `
      <div class="sum-card sum-overall" data-cat="overall">
        <div class="sum-head"><span class="sum-title">OVERALL</span></div>
        <div class="sum-overall-score ${scoreClass(overall)}">${overall}</div>
        <div class="sum-overall-label">/100 combined</div>
        <div class="sum-overall-subs">
          <span>UX <b>${uxScore}</b></span>
          <span>SEO <b>${seoScore}</b></span>
          <span>AEO <b>${aeoScore}</b></span>
        </div>
        <div class="sum-counts">
          <span class="sum-count-fail">${blocking}</span> blocking ·
          <span class="sum-count-warn">${warnings}</span> warn
        </div>
      </div>`;
  }

  function categoryCard(cat, data) {
    const catScoreVal = cat === 'UX' ? uxScore : cat === 'SEO' ? seoScore : aeoScore;
    const modules  = data.modules || [];

    const blocks = modules.map((m, i) => {
      const moduleScore = moduleDisplayScore(cat, m);
      const status = moduleScore >= 80 ? 'pass' : moduleScore >= 60 ? 'warn' : 'fail';
      const subs = evaluateModule(cat, m);

      // Accessibility summary line — mirrors lighthouse-plus-tool
      // "✅ 28/35 checks passed"
      const isA11y = cat === 'SEO' && m.name === 'Accessibility';
      let summaryLine = '';
      if (isA11y) {
        const signalPasses   = (m.signals || []).filter(s => s.pass).length;
        const signalWarnings = (m.signals || []).filter(s => !s.pass).length;
        const failCount      = (m.failed  || []).length;
        const passes = Number.isFinite(m.passes) ? m.passes : signalPasses;
        const total  = passes + signalWarnings + failCount;
        if (total >= 3) {
          summaryLine = `<div class="sum-module-summary">✅ ${passes}/${total} checks passed</div>`;
        }
      }

      const subsHtml = subs.length
        ? `<div class="sum-submetrics">
            ${subs.map(sig => {
              const fid = idByKey.get(`${cat}::${sig.name}`);
              const attr = fid ? ` data-fid="${fid}"` : '';
              const cls  = fid ? ' clickable' : '';
              return `<div class="sum-submetric ${sig.status}${cls}"${attr}>
                <span class="icon">${iconFor(sig.status)}</span>
                <span class="text">${esc(shorten(sig.name, 64))}</span>
              </div>`;
            }).join('')}
          </div>`
        : '';

      return `<div class="sum-module-block" data-module-index="${i}">
        <div class="sum-module-head">
          <span class="sum-module-name">${esc(m.name)}</span>
          <span class="sum-module-status ${status}">${moduleScore} · ${gradeFromScore(moduleScore)}</span>
        </div>
        ${summaryLine}
        ${subsHtml}
      </div>`;
    });

    let bodyHtml = blocks.join('');
    if (ACCORDION_CATS.has(cat) && blocks.length > VISIBLE_MODULES) {
      const visible = blocks.slice(0, VISIBLE_MODULES).join('');
      const hidden  = blocks.slice(VISIBLE_MODULES).join('');
      const count   = blocks.length - VISIBLE_MODULES;
      bodyHtml = `${visible}
        <div class="sum-hidden-modules hidden">${hidden}</div>
        <button class="sum-more-btn" data-count="${count}" type="button">▸ show ${count} more module${count > 1 ? 's' : ''}</button>`;
    }

    return `<div class="sum-card" data-cat="${cat}">
      <div class="sum-head"><span class="sum-title">${cat}</span></div>
      <div class="sum-counts">
        <span class="sum-overall-score ${scoreClass(catScoreVal)}" style="font-size:22px">${catScoreVal}</span>
        <span class="sum-overall-label" style="margin-left:6px">/100</span>
      </div>
      <div class="sum-pass-list">${bodyHtml}</div>
    </div>`;
  }

  container.innerHTML = `<div class="sum-row">
    ${overallCard()}
    ${categoryCard('UX',  state.ux  || {})}
    ${categoryCard('SEO', state.seo || {})}
    ${categoryCard('AEO', state.aeo || {})}
  </div>`;
  container.classList.remove('hidden');

  container.querySelectorAll('.sum-more-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.sum-card');
      const wrap = card.querySelector('.sum-hidden-modules');
      const wasHidden = wrap.classList.contains('hidden');
      wrap.classList.toggle('hidden', !wasHidden);
      btn.textContent = wasHidden
        ? '▾ show less'
        : `▸ show ${btn.dataset.count} more module${Number(btn.dataset.count) > 1 ? 's' : ''}`;
    });
  });

  container.querySelectorAll('.sum-submetric[data-fid]').forEach(row => {
    row.addEventListener('click', e => {
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('nusa:focus-finding', { detail: { findingId: row.dataset.fid } }));
    });
  });
}
