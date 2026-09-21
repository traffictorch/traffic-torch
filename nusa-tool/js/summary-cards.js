// summary-cards.js — v6
// Modules return 0-100 detail scores. Card just tiers them.
// OVERALL count == findings array, single source of truth.

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shorten = (s, n) => { s = String(s||''); return s.length > n ? s.slice(0, n-1) + '…' : s; };

const ACCORDION_CATS = new Set(['SEO']);
const VISIBLE_MODULES = 5;

// ── tier helpers ─────────────────────────────────────────────────
// score (0-100) → 'pass' | 'warn' | 'fail'
const tier = v => v >= 80 ? 'pass' : v >= 55 ? 'warn' : 'fail';
const iconFor = s => s === 'pass' ? '✓' : s === 'warn' ? '⚠' : '✕';
const scoreClass = s => s >= 80 ? 'good' : s >= 60 ? 'mid' : 'bad';
const statusLabel = s => s === 'pass' ? 'Good' : s === 'warn' ? 'Needs work' : 'Critical';

// ── friendly names for UX module detail keys ────────────────────
const UX_LABELS = {
  Readability: {
    fleschEase:   'Flesch Reading Ease Score',
    kincaidGrade: 'Flesch-Kincaid Grade Level',
    avgSentence:  'Average Sentence Length',
    avgParagraph: 'Paragraph Density & Length',
    scannability: 'Overall Text Scannability'
  },
  Navigation: {
    linkDensity:     'Link Density Evaluation',
    menuClarity:     'Menu Structure Clarity',
    internalBalance: 'Internal Linking Balance',
    ctaStrength:     'CTA Prominence & Visibility'
  },
  Accessibility: {
    altCoverage:      'Alt Text Coverage',
    contrastProxy:    'Color Contrast Ratios',
    semanticStrength: 'Semantic HTML Structure',
    wcagCompliance:   'Overall WCAG Compliance'
  },
  Mobile: {
    viewportQuality: 'Viewport Configuration',
    responsiveProxy: 'Responsive Breakpoints',
    touchFriendly:   'Touch Target Size',
    pwaReadiness:    'PWA Readiness Indicators'
  },
  Performance: {
    assetVolume:      'Asset Volume Flags',
    scriptBloat:      'Script Bloat Detection',
    fontOptimization: 'Font Optimization',
    lazyLoading:      'Lazy Loading Media',
    imageFormat:      'Image Optimization',
    renderBlocking:   'Script Optimization'
  }
};

// ── module evaluation → { name, score, status } ─────────────────
export function evaluateModule(cat, module) {
  const out = [];
  if (cat === 'UX') {
    const labels = UX_LABELS[module.name] || {};
    const details = module.details || {};
    for (const [key, label] of Object.entries(labels)) {
      const v = Number(details[key]);
      const s = Number.isFinite(v) ? v : 0;
      out.push({ name: label, score: s, status: tier(s) });
    }
  } else {
    for (const sig of (module.signals || [])) {
      if (sig.informational) continue;
      const s = sig.pass === true ? 90 : 40;
      out.push({ name: sig.label, score: s, status: s >= 80 ? 'pass' : 'fail' });
    }
  }
  return out;
}

// ── single source of truth for findings ──────────────────────────
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
            cat, module: m.name,
            label: s.name,
            status: s.status,
            severity: s.status === 'fail' ? 6 : 3
          });
        }
      }

      for (const failed of (m.failed || [])) {
        if (coversSignal(failed, signalLabels)) continue;
        out.push({
          id: `f${seq++}`,
          cat, module: m.name,
          label: failed,
          status: 'fail',
          severity: 7,
          infoOnly: true
        });
      }
    }
  }

  return out;
}

// ── rendering ────────────────────────────────────────────────────
export function renderSummaryCards(state) {
  const container = $('summary-cards');
  if (!container || !state) return;

  const uxScore  = Math.round(state.ux?.score  || 0);
  const seoScore = Math.round(state.seo?.score || 0);
  const aeoScore = Math.round(state.aeo?.score || 0);
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
    const catScore = Math.round(data.score || 0);
    const modules  = data.modules || [];

    const blocks = modules.map((m, i) => {
      const s = Math.round(m.score || 0);
      const status = s >= 80 ? 'pass' : s >= 60 ? 'warn' : 'fail';
      const subs = evaluateModule(cat, m);

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
          <span class="sum-module-status ${status}">${s} · ${statusLabel(status)}</span>
        </div>
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
        <span class="sum-overall-score ${scoreClass(catScore)}" style="font-size:22px">${catScore}</span>
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
