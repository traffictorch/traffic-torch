// NUSA v5.1 — getUXData supplies all keys the modules read

const WORKERS = {
  lighthouse: 'https://lighthouse-audit.traffictorch.workers.dev/',
  aeo:        'https://aeo-audit.traffictorch.workers.dev/',
  ask:        'https://nusa-ask.traffictorch.workers.dev/',
  patch:      'https://nusa-patch.traffictorch.workers.dev/',
  verify:     'https://nusa-verify.traffictorch.workers.dev/',
  render:     'https://nusa-render.traffictorch.workers.dev/'
};

import { calculateReadability }   from './modules/quit-risk/readability.js';
import { calculateNavigation }    from './modules/quit-risk/navigation.js';
import { calculateAccessibility } from './modules/quit-risk/accessibility.js';
import { calculateMobile }        from './modules/quit-risk/mobile.js';
import { calculatePerformance }   from './modules/quit-risk/performance.js';

import { renderSummaryCards, collectFindings } from './summary-cards.js';
import { whyMatters } from './why-matters.js';
import { extractSnippets, openCodeModal, ruleKey } from './code-snippets.js';
import { detectCMS } from './cms-detect.js';

const $   = id => document.getElementById(id);
const el  = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let t0 = performance.now();
const ms = () => Math.round(performance.now() - t0);
let state = null;
let previewShot = null;
const previewPins = new Map();

function looksLikeRealFix(prose) {
  if (prose == null || typeof prose !== 'string') return false;
  const t = prose.trim();
  if (t.length < 40) return false;
  if (/^after changes[:\s]/i.test(t) && t.length < 100) return false;
  const hasSteps = /(?:^|\n)\s*(?:\d+[.)]\s|[-*•]\s)\S/.test(t);
  const hasCode  = /```/.test(t);
  return hasSteps || hasCode;
}

function narrate(text, opts = {}) {
  const p = el('p', opts.anchor ? 'anchor' : '');
  if (opts.ts !== false) p.appendChild(el('span', 'ts', `[${String(ms()).padStart(5,'0')}ms]`));
  p.appendChild(document.createTextNode(text));
  const n = $('narration');
  if (n) { n.appendChild(p); n.scrollTop = n.scrollHeight; }
  return p;
}

function narrateFinding(f) {
  const p = el('p', 'finding');
  if (f.infoOnly) p.classList.add('info-only');
  p.appendChild(el('span', 'ts', `[${String(ms()).padStart(5,'0')}ms]`));
  const bolt = el('span', 'bolt-fix', '◆ fix this →');
  bolt.addEventListener('click', ev => { ev.stopPropagation(); openFixPanel(f); });
  p.appendChild(bolt);
  p.appendChild(document.createTextNode(' ' + f.label));
  p.dataset.findingId = f.id;
  p.addEventListener('click', e => {
    if (e.target.closest('.bolt-fix')) return;
    document.dispatchEvent(new CustomEvent('nusa:focus-finding', { detail: { findingId: f.id } }));
  });
  const n = $('narration');
  if (n) { n.appendChild(p); n.scrollTop = n.scrollHeight; }
}

function setProgress(text, opts = {}) {
  const s = $('status');
  if (s) s.textContent = text;
  const head = document.querySelector('.narration-col .col-head');
  if (!head) return;
  let dot = head.querySelector('.work-dot');
  if (opts.busy === false) {
    if (dot) dot.remove();
    head.classList.remove('working');
    return;
  }
  if (!dot) head.appendChild(el('span', 'work-dot'));
  head.classList.add('working');
}

let rulerStop = null;
function startRuler() {
  const r = $('ruler');
  if (!r) return;
  r.classList.remove('hidden');
  const ph = $('playhead');
  let pct = 0;
  const id = setInterval(() => {
    pct = Math.min(100, pct + 1.4 + Math.random() * 0.6);
    if (ph) ph.style.transform = `translateX(${pct}%)`;
    if (pct >= 100) clearInterval(id);
  }, 70);
  rulerStop = () => clearInterval(id);
}
function stopRuler() { if (rulerStop) rulerStop(); }

function getUXData(doc) {
  const textElements = doc.querySelectorAll('p, li, article, section, main, div');
  let fullText = '', paragraphTexts = [], boldCount = 0, listItemCount = 0;
  textElements.forEach(node => {
    const t = node.textContent.trim();
    if (t.length > 15) {
      fullText += t + ' ';
      if (node.tagName === 'P') paragraphTexts.push(t);
    }
    boldCount += node.querySelectorAll('b, strong').length;
    if (node.tagName === 'UL' || node.tagName === 'OL') listItemCount += node.querySelectorAll('li').length;
  });
  const imgs = doc.querySelectorAll('img');
  let missing = 0, decorative = 0, meaningful = 0;
  imgs.forEach(img => {
    const alt = img.getAttribute('alt');
    const isDecorative = img.classList.contains('decorative') ||
                         img.getAttribute('role') === 'presentation' ||
                         (alt !== null && alt.trim() === '' && !img.hasAttribute('title'));
    if (isDecorative) decorative++;
    else { meaningful++; if (alt === null || alt.trim() === '') missing++; }
  });

  // Links — internal vs external
  const allLinks = Array.from(doc.querySelectorAll('a[href]'));
  const linkCount = allLinks.length;
  let externalLinkCount = 0;
  try {
    const host = new URL(doc.baseURI || 'https://x').hostname;
    for (const a of allLinks) {
      const href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        try {
          const h = new URL(href).hostname;
          if (h && h !== host) externalLinkCount++;
        } catch (_) {}
      }
    }
  } catch (_) {}

  // Main nav presence
  const mainNav = !!doc.querySelector('nav, [role="navigation"], header nav, .nav, .navbar, #nav');

  // Media queries / responsive hints
  const htmlStr  = doc.documentElement.outerHTML || '';
  const styleStr = Array.from(doc.querySelectorAll('style')).map(s => s.textContent || '').join(' ');
  const hasMediaQueries = /@media[^{]*\((?:max|min)-width/i.test(htmlStr) ||
                          /@media[^{]*\((?:max|min)-width/i.test(styleStr);

  // Touch-friendly hint: any 44px+ sized clickable class or role
  const hasTouchFriendly =
    !!doc.querySelector('[class*="touch"], [class*="btn-lg"], button, [role="button"], a.button') &&
    /min-height\s*:\s*(?:4[4-9]|[5-9]\d)px|height\s*:\s*4[4-9]px/i.test(htmlStr + styleStr);

  // HTTPS
  const isHttps = /^https:/i.test(doc.baseURI || '');

  const countWords = t => t.trim().split(/\s+/).filter(w => w.length > 0).length;
  return {
    fullText, wordCount: countWords(fullText),
    linkCount,
    externalLinkCount,
    mainNav,
    hasMediaQueries,
    hasTouchFriendly,
    isHttps,
    rawHtml: htmlStr,
    imageCount: imgs.length,
    altData: { missingCount: missing, meaningfulCount: meaningful, decorativeCount: decorative, totalImages: imgs.length },
    headingCount: doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
    hasViewport: !!(doc.querySelector('meta[name="viewport"]')?.content || '').match(/width\s*=\s*device-width/i),
    hasMain: !!doc.querySelector('main'),
    hasArticleOrSection: !!doc.querySelector('article, section'),
    paragraphTexts, boldCount, listItemCount,
    hasBreadcrumb: !!doc.querySelector('[aria-label*="breadcrumb"], .breadcrumb'),
    hasLandmarks: !!doc.querySelector('header, footer, aside, [role="banner"], [role="contentinfo"]'),
    hasAriaLabels: !!doc.querySelector('[aria-label], [aria-labelledby]'),
    hasManifest: !!doc.querySelector('link[rel="manifest"]'),
    hasServiceWorkerHint: /serviceWorker|\.register\(/.test(doc.body.innerHTML),
    hasAppleTouchIcon: !!doc.querySelector('link[rel*="apple-touch-icon"]'),
    hasLazyLoading: (() => {
      const all = doc.querySelectorAll('img[src]');
      const lazy = doc.querySelectorAll('img[loading="lazy"]');
      return all.length > 0 && lazy.length >= 2 && (lazy.length / all.length) * 100 >= 40;
    })(),
    externalScripts: doc.querySelectorAll('script[src^="http"]').length,
    hasRenderBlocking: doc.querySelectorAll('script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])').length,
    fontCount: doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').length,
    hasFontDisplaySwap: /font-display\s*:\s*swap/.test(doc.head.innerHTML),
    hasWebpOrAvif: !!doc.querySelector('img[src$=".webp"], img[src$=".avif"], source[type="image/webp"]'),
    potentialCTAs: doc.querySelectorAll('a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="buy"], button, [role="button"], .btn').length,
    viewportContent: doc.querySelector('meta[name="viewport"]')?.content || '',
    hasDropdowns: !!doc.querySelector('nav li ul, .dropdown, [aria-haspopup="true"]'),
    topLevelItems: doc.querySelectorAll('nav > ul > li, header nav > ul > li').length || 0
  };
}

async function runAudit(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;

  const n = $('narration'); if (n) n.innerHTML = '';
  state = null;
  previewShot = null;
  previewPins.clear();
  t0 = performance.now();
  $('stage')?.classList.remove('hidden');
  $('chamber')?.classList.add('hidden');
  $('summary-cards')?.classList.add('hidden');

  const pv = $('preview');
  if (pv) pv.innerHTML = '<div class="preview-empty">rendering preview…</div>';
  const pm = $('preview-meta');
  if (pm) pm.textContent = '·';

  startRuler();
  narrate(`Opening ${url} — running three audits in parallel.`, { anchor: true });
  setProgress('rendering…');

  let lh, aeo;
  try {
    const [lhRes, aeoRes] = await Promise.all([
      fetch(WORKERS.lighthouse, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) }),
      fetch(WORKERS.aeo,        { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) })
    ]);
    if (!lhRes.ok)  throw new Error(`lighthouse worker ${lhRes.status}`);
    if (!aeoRes.ok) throw new Error(`aeo worker ${aeoRes.status}`);
    lh  = await lhRes.json();
    aeo = await aeoRes.json();
    if (!lh.success)  throw new Error(lh.error  || 'lighthouse audit failed');
    if (!aeo.success) throw new Error(aeo.error || 'aeo audit failed');
  } catch (e) {
    narrate(`Could not complete the audit — ${e.message}.`, { anchor: true });
    setProgress('error', { busy: false });
    stopRuler();
    return;
  }

  narrate(`Rendered + scored. Parsing DOM for the UX pass.`);
  setProgress('running UX pass…');
  await sleep(80);

  const html = lh.renderedHtml || lh.rawHtml || '';
  const doc  = new DOMParser().parseFromString(html, 'text/html');
  // Give DOMParser doc a baseURI equivalent so URL parsing has something to work with
  try {
    Object.defineProperty(doc, 'baseURI', { value: url, configurable: true });
  } catch (_) {}
  const uxData = getUXData(doc);

  const r    = calculateReadability(uxData);
  const nav  = calculateNavigation(uxData);
  const ax   = calculateAccessibility(uxData);
  const mob  = calculateMobile(uxData);
  const perf = calculatePerformance(uxData);

  const uxModules = [
    { name: 'Readability',   score: r.score,    details: r.details,    raw: r.raw },
    { name: 'Navigation',    score: nav.score,  details: nav.details,  raw: nav.raw },
    { name: 'Accessibility', score: ax.score,   details: ax.details,   raw: ax.raw },
    { name: 'Mobile',        score: mob.score,  details: mob.details,  raw: mob.raw },
    { name: 'Performance',   score: perf.score, details: perf.details, raw: perf.raw }
  ];
  const uxScore = Math.round(uxModules.reduce((s, m) => s + m.score, 0) / uxModules.length);

  let cms = null;
  try { cms = detectCMS(html, { url }); } catch (_) { cms = null; }

  state = {
    url,
    urlDisplay: url.replace(/^https?:\/\//,'').replace(/\/$/,''),
    doc, html, cms,
    ux:  { score: uxScore, modules: uxModules },
    seo: { score: Math.round(lh.overall  || 0), modules: (lh.modules  || []) },
    aeo: { score: Math.round(aeo.overall || 0), modules: (aeo.modules || []) },
    raw: { lh, aeo }
  };
  state.findings = collectFindings(state);
  window._nusa = state;

  if (cms && cms.id !== 'unknown') {
    const rel = (cms.related || []).map(x => x.name).join(' · ');
    narrate(`Platform detected: ${cms.name}${cms.version ? ' ' + cms.version : ''}${rel ? ' — ' + rel : ''}`);
  }

  narrate(`DOM parsed. ${state.findings.length} finding${state.findings.length === 1 ? '' : 's'} queued.`);
  setProgress('streaming findings…');

  const order = { fail: 0, warn: 1, pass: 2 };
  state.findings.sort((a, b) => (order[a.status] - order[b.status]) || (b.severity - a.severity));
  for (const f of state.findings) {
    narrateFinding(f);
    await sleep(90 + Math.random() * 120);
  }

  narrate(`Audit settled. ${state.findings.length} finding${state.findings.length === 1 ? '' : 's'}.`, { anchor: true });
  setProgress('settled', { busy: false });
  stopRuler();
  $('chamber')?.classList.remove('hidden');

  renderSummaryCards(state);
  renderPreview();
}

async function openFixPanel(f) {
  const prev = document.querySelector(`.fix-panel[data-fid="${f.id}"]`);
  if (prev) { prev.remove(); return; }

  const panel = el('div', 'fix-panel');
  panel.dataset.fid = f.id;

  const shortLabel = f.label.length > 55 ? f.label.slice(0, 53) + '…' : f.label;
  const why = whyMatters(f.label);
  panel.innerHTML = `
    <div class="fp-head">◆ ${esc(f.cat)} · ${esc(shortLabel)}</div>
    <div class="fp-body">
      <div class="fp-section fp-why collapsed">
        <button class="fp-toggle" type="button">▸ why this matters</button>
        <div class="fp-content">${why ? esc(why) : '(no entry in why-matters.js for this label)'}</div>
      </div>
      <div class="fp-section fp-fix">
        <button class="fp-toggle" type="button">▾ the fix</button>
        <div class="fp-content fp-fix-content"><em>generating fix…</em></div>
      </div>
    </div>`;
  const para = document.querySelector(`p.finding[data-finding-id="${f.id}"]`);
  if (para && para.parentNode) para.insertAdjacentElement('afterend', panel);
  else $('narration')?.appendChild(panel);

  panel.querySelectorAll('.fp-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.closest('.fp-section');
      sec.classList.toggle('collapsed');
      btn.textContent = (sec.classList.contains('collapsed') ? '▸ ' : '▾ ') + btn.textContent.slice(2);
    });
  });

  pinFinding(f);

  const fixTarget = panel.querySelector('.fp-fix-content');
  const { snippets } = extractSnippets(state?.html || '', f.label);
  const affectedHtml = snippets.length ? snippets.map(s => s.html).join('\n\n') : null;

  const cmsPayload = state?.cms && state.cms.id !== 'unknown'
    ? { id: state.cms.id, name: state.cms.name, version: state.cms.version, related: state.cms.related, confidence: state.cms.confidence }
    : { name: 'Custom / Unknown' };

  try {
    const res = await fetch(WORKERS.patch, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: state?.url,
        pageTitle: state?.doc?.title || null,
        cms: cmsPayload,
        finding: { cat: f.cat, label: f.label, node: f.node || '', severity: f.severity || 5, module: f.module || '' },
        affectedHtml
      })
    });
    const data = await res.json();

    if (data && data.success && looksLikeRealFix(data.prose)) {
      f.patchScript = data.patchScript || null;
      f.applicable  = !!data.applicable;
      f.patchReason = data.reason || null;
      fixTarget.innerHTML = renderCodeBlocks(data.prose);
      appendFixActions(fixTarget, f, data);
    } else {
      fixTarget.innerHTML = '<em>(no fix generated — try again)</em>';
      const retry = el('button', 'verify-btn', '▸ retry');
      retry.addEventListener('click', () => { panel.remove(); openFixPanel(f); });
      fixTarget.appendChild(retry);
      if (data && data.reason) fixTarget.appendChild(el('div', 'verify-note', '▸ ' + data.reason));
    }
  } catch (e) {
    fixTarget.innerHTML = `<em>fix failed: ${esc(e.message)}</em>`;
  }
}

function appendFixActions(container, f, data) {
  const viewBtn = el('button', 'view-code-btn', '▸ view the code');
  viewBtn.addEventListener('click', () => {
    const { snippets, rule } = extractSnippets(state?.html || '', f.label);
    openCodeModal(
      f.label,
      snippets.length ? snippets : [{ selector: rule?.sel || '—', html: '(no matching element found on the page)' }]
    );
  });
  container.appendChild(viewBtn);

  if (data.patchScript) {
    const vb = el('button', 'verify-btn', '▸ verify in live browser');
    vb.addEventListener('click', () => runVerify(vb, f, data.patchScript, container.closest('.fix-panel')));
    container.appendChild(vb);
  } else if (data.reason) {
    container.appendChild(el('div', 'verify-note', '▸ ' + data.reason));
  }
}

function renderCodeBlocks(text) {
  if (text == null) return '';
  let s = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${(lang||'plaintext').toLowerCase()}">${code.replace(/\s+$/,'')}</code></pre>`);
  s = s.replace(/(<pre[\s\S]*?<\/pre>)|(\r?\n)/g, (_, pre) => pre || '<br>');
  return s;
}

async function runVerify(btn, f, patchScript, panel) {
  btn.disabled = true; btn.textContent = '▸ opening live session…';
  try {
    const res = await fetch(WORKERS.verify, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: state?.url, patchScript, label: f.label })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'verify failed');
    const { deltas, flags } = data.diff || { deltas: {}, flags: {} };
    const wrap = el('div', 'verify-diff');
    const rows = [];
    const LBL = { titleLen:'title length', descLen:'meta description length', h1s:'H1 count', missingAlt:'images missing alt', renderBlocking:'render-blocking resources', jsonLd:'JSON-LD blocks', headings:'heading count', totalNodes:'DOM nodes' };
    const GOOD = { titleLen:0, descLen:0, h1s:0, missingAlt:-1, renderBlocking:-1, jsonLd:1, headings:0, totalNodes:0 };
    for (const [k, v] of Object.entries(deltas)) {
      const g = GOOD[k] || 0;
      const ok = g === 0 ? false : (v.delta * g > 0);
      rows.push(`<div class="vrow ${ok?'good':'bad'}"><span class="vk">${LBL[k]||k}</span><span class="vb">${v.before}</span><span class="varrow">→</span><span class="va">${v.after}</span><span class="vd">${v.delta>0?'+':''}${v.delta}</span></div>`);
    }
    const FL = { hasAuthor:'author byline', hasDate:'publish/update date', hasViewport:'responsive viewport' };
    for (const [k, v] of Object.entries(flags)) {
      if (!v.changed) continue;
      rows.push(`<div class="vrow ${v.after?'good':'bad'}"><span class="vk">${FL[k]||k}</span><span class="vb">${v.before}</span><span class="varrow">→</span><span class="va">${v.after}</span></div>`);
    }
    if (!rows.length) rows.push('<div class="vrow flat">no measurable change detected</div>');
    wrap.innerHTML = rows.join('');
    panel?.querySelector('.fp-fix-content')?.appendChild(wrap);
    btn.textContent = data.patchApplied ? '✓ verified' : '⚠ patch failed';
    btn.classList.add(data.patchApplied ? 'verified' : 'failed');
  } catch (e) {
    btn.textContent = `✗ ${e.message}`;
    btn.classList.add('failed');
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('nusa:focus-finding', e => {
  const fid = e.detail?.findingId;
  if (!fid) return;
  const para = document.querySelector(`p.finding[data-finding-id="${fid}"]`);
  if (para) {
    para.scrollIntoView({ behavior: 'smooth', block: 'center' });
    para.classList.add('focus-flash');
    setTimeout(() => para.classList.remove('focus-flash'), 1400);
  }
});

$('url-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const v = $('url-input').value.trim();
  if (v) runAudit(v);
});

$('ask-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('ask-input').value.trim();
  if (!q) return;
  $('ask-input').value = '';
  narrate(`you: ${q}`, { ts: false });
  try {
    const res = await fetch(WORKERS.ask, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        auditData: {
          url: state?.url || '',
          pageTitle: state?.doc?.title || '',
          cms: state?.cms ? { id: state.cms.id, name: state.cms.name } : { name: 'Custom / Unknown' },
          failedItems: (state?.findings || []).filter(f => f.status === 'fail').map(f => `[${f.cat}] ${f.label}`),
          scores: state ? { ux: state.ux.score, seo: state.seo.score, aeo: state.aeo.score } : {}
        }
      })
    });
    const data = await res.json();
    narrate(`nusa: ${data.answer || data.error || 'no response'}`, { ts: false });
  } catch (err) {
    narrate(`nusa: request failed — ${err.message}`, { ts: false });
  }
});

$('chamber-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('chamber-input').value.trim();
  if (!q || !state) return;
  const out = $('chamber-out');
  if (!out) return;
  out.innerHTML = '';
  const pageText = (state.doc?.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  const engines = [
    { name: 'ChatGPT',     instr: 'Strict extractor mode. Answer the question using ONLY sentences that appear verbatim in the page content. If the answer is not present verbatim, respond exactly: CANNOT ANSWER: not in extractable text.' },
    { name: 'Perplexity',  instr: 'Citation retrieval mode. Answer and list the exact sentences you would cite. If nothing is citable, respond exactly: CANNOT CITE: no extractable sentences.' },
    { name: 'AI Overview', instr: 'Summariser mode. Give a short summary answer. End with: Confidence: high | medium | low' }
  ];
  const results = [];
  for (const engine of engines) {
    const row = el('div', 'engine');
    row.innerHTML = `<span class="name">${engine.name}</span><span class="verdict warn">…</span><span class="body">simulating</span>`;
    out.appendChild(row);
    const wrapped = `[SIMULATION: ${engine.name}]\n\n${engine.instr}\n\n--- PAGE CONTENT ---\n${pageText}\n--- END ---\n\nQuestion: ${q}`;
    try {
      const res = await fetch(WORKERS.ask, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: wrapped, auditData: { url: state.url, pageTitle: state.doc?.title || '' } })
      });
      const data = await res.json();
      const answer = (data.answer || '').trim();
      const isFail = /CANNOT (ANSWER|CITE)/i.test(answer) || /not in extractable/i.test(answer);
      const isWarn = /confidence:\s*low/i.test(answer);
      const v = isFail ? 'fail' : isWarn ? 'warn' : 'pass';
      row.querySelector('.verdict').className = 'verdict ' + v;
      row.querySelector('.verdict').textContent = v === 'pass' ? '✓' : v === 'warn' ? '~' : '✗';
      row.querySelector('.body').textContent = answer.slice(0, 280) || '(empty)';
      results.push({ name: engine.name, verdict: v, answer });
    } catch (err) {
      row.querySelector('.verdict').className = 'verdict fail';
      row.querySelector('.verdict').textContent = '✗';
      row.querySelector('.body').textContent = `error: ${err.message}`;
      results.push({ name: engine.name, verdict: 'fail', answer: err.message });
    }
  }
  const gap = el('div', 'gap');
  out.appendChild(gap);
  if (!results.some(r => r.verdict === 'fail')) {
    gap.innerHTML = `<span class="label">Citation ready</span>All three engines can answer this from the page.`;
    return;
  }
  gap.innerHTML = `<span class="label">Citation gap</span><em>analysing…</em>`;
  try {
    const gapQ = `A page cannot answer: "${q}". Write ONE factual sentence the page should add so all three engines cite it. Output only the sentence.`;
    const res = await fetch(WORKERS.ask, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: gapQ, auditData: { url: state.url, pageExcerpt: pageText.slice(0, 1000) } })
    });
    const data = await res.json();
    const sentence = (data.answer || '').trim().replace(/^["']|["']$/g, '').slice(0, 500);
    gap.innerHTML = `<span class="label">Citation gap</span>${esc(sentence)}`;
  } catch (err) {
    gap.innerHTML = `<span class="label">Citation gap</span>could not generate: ${esc(err.message)}`;
  }
});

async function renderPreview() {
  const host = $('preview');
  if (!host || !state) return;
  if (previewShot) return;

  host.innerHTML = '<div class="preview-empty">rendering preview…</div>';

  const selSet = new Set();
  const filters = [];
  for (const f of (state.findings || [])) {
    const { rule } = extractSnippets(state.html || '', f.label);
    if (!rule?.sel) continue;
    if (rule.filter) {
      filters.push({ selector: rule.sel, ...rule.filter });
    } else {
      selSet.add(rule.sel);
    }
  }

  try {
    const res = await fetch(WORKERS.render, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: state.url,
        screenshot: true,
        highlightSelectors: [...selSet],
        filters
      })
    });
    const data = await res.json();
    if (!data.success || !data.screenshot) throw new Error(data.error || 'preview failed');
    previewShot = data.screenshot;
    state.highlights = data.highlights || {};
    drawPreview();
  } catch (e) {
    host.innerHTML = `<div class="preview-empty">preview unavailable — ${esc(e.message)}</div>`;
  }
}

function drawPreview() {
  const host = $('preview');
  if (!host || !previewShot) return;
  const { data, mime, w, h } = previewShot;

  host.innerHTML = `
    <div class="preview-canvas">
      <img class="preview-img" src="data:${mime};base64,${data}" alt="">
      <div class="preview-pins" id="preview-pins"></div>
    </div>`;

  const pm = $('preview-meta');
  if (pm) pm.textContent = `${w} × ${h}`;

  drawAllPins();
}

function drawAllPins() {
  const pins = $('preview-pins');
  if (!pins) return;
  pins.innerHTML = '';
  for (const [key, entry] of previewPins) {
    drawPin(entry.findingId, entry.bbox, key);
  }
}

function drawPin(findingId, bbox, key) {
  const pins = $('preview-pins');
  if (!pins || !bbox || !previewShot) return;

  const f = (state?.findings || []).find(x => x.id === findingId);
  const { w: sw, h: sh } = previewShot;
  const pad = 4;

  const pin = document.createElement('div');
  pin.className = 'preview-pin' + (f?.cat === 'AEO' ? ' aeo' : (f?.status === 'fail' ? '' : ' warn'));
  pin.dataset.fid = key;
  pin.style.left   = ((bbox.x - pad) / sw * 100) + '%';
  pin.style.top    = ((bbox.y - pad) / sh * 100) + '%';
  pin.style.width  = ((bbox.w + pad * 2) / sw * 100) + '%';
  pin.style.height = ((bbox.h + pad * 2) / sh * 100) + '%';
  pin.title = f?.label || '';

  pin.addEventListener('click', () => {
    const found = (state?.findings || []).find(x => x.id === findingId);
    if (!found) return;
    const { snippets, rule } = extractSnippets(state?.html || '', found.label);
    openCodeModal(
      found.label,
      snippets.length ? snippets : [{ selector: rule?.sel || '—', html: '(no matching element found on the page)' }]
    );
  });

  pins.appendChild(pin);
}

function pinFinding(finding) {
  if (!state || !previewShot) return;

  const { rule } = extractSnippets(state.html || '', finding.label);
  if (!rule || !rule.sel) return;

  const key = ruleKey(rule);
  if (!key) return;

  const bboxes = state.highlights?.[key] || [];
  if (!bboxes.length) return;

  bboxes.forEach((bbox, i) => {
    previewPins.set(`${finding.id}:${i}`, { findingId: finding.id, bbox });
  });
  drawAllPins();

  const firstPin = document.querySelector(`.preview-pin[data-fid^="${finding.id}:"]`);
  if (firstPin) firstPin.scrollIntoView({ behavior: 'smooth', block: 'center' });
}