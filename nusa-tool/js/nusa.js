// NUSA v5.5 — ask-ai pair pattern (question at top, no page drop)
// Changes from v5.4: askNarrate → askStart/askFinish. Everything else identical.

const WORKERS = {
  lighthouse: 'https://lighthouse-audit.traffictorch.workers.dev/',
  qrRender:   'https://qr-full-render-worker.traffictorch.workers.dev/',
  aeo:        'https://aeo-audit.traffictorch.workers.dev/',
  ask:        'https://nusa-ask.traffictorch.workers.dev/',
  patch:      'https://nusa-fix.traffictorch.workers.dev/',
  verify:     'https://nusa-verify.traffictorch.workers.dev/',
  render:     'https://nusa-render.traffictorch.workers.dev/'
};

import { calculateReadability }   from '/quit-risk-tool/modules/readability.js';
import { calculateNavigation }    from '/quit-risk-tool/modules/navigation.js';
import { calculateAccessibility } from '/quit-risk-tool/modules/accessibility.js';
import { calculateMobile }        from '/quit-risk-tool/modules/mobile.js';
import { calculatePerformance }   from '/quit-risk-tool/modules/performance.js';
import { mergeMetricsIntoUX }     from '/quit-risk-tool/metrics-adapter.js';

import { renderSummaryCards, collectFindings, evaluateModule } from './summary-cards.js';
import { whyMatters } from './why-matters.js';
import { extractSnippets, openCodeModal, ruleKey } from './code-snippets.js';
import { detectCMS } from './cms-detect.js';
import { initShareModule } from '/share-module.js';
import { saveAudit } from '/audit-history.js';
import { canRunTool } from '/main-v1.1.js';

const $   = id => document.getElementById(id);
const el  = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── URL history ── */
const URL_HISTORY_KEY = 'nusa-url-history';
const URL_HISTORY_MAX = 10;

function loadUrlHistory() {
  try {
    const raw = localStorage.getItem(URL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUrlToHistory(url) {
  if (!url || typeof url !== 'string') return;
  const clean = url.trim();
  if (!clean) return;
  const list = loadUrlHistory().filter(u => u !== clean);
  list.unshift(clean);
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(list.slice(0, URL_HISTORY_MAX)));
}

function populateUrlDatalist() {
  const dl = document.getElementById('url-history-list');
  if (!dl) return;
  const urls = loadUrlHistory();
  dl.innerHTML = urls.map(u =>
    `<option value="${u.replace(/"/g, '&quot;')}"></option>`
  ).join('');
}

let t0 = performance.now();
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

/* ── narration ─────────────────────────────────────────────── */
function narrate(text, opts = {}) {
  const p = el('p', opts.anchor ? 'anchor' : '');
  p.appendChild(document.createTextNode(text));
  const n = $('narration');
  if (n) {
    n.appendChild(p);
    n.scrollTop = n.scrollHeight;
  }
  return p;
}

function narrateFinding(f) {
  const p = el('p', 'finding');
  if (f.infoOnly) p.classList.add('info-only');

  const bolt = el('button', 'bolt-fix', '◆ fix this →');
  bolt.type = 'button';
  bolt.addEventListener('click', ev => { ev.stopPropagation(); openFixPanel(f); });
  p.appendChild(bolt);

  const labelSpan = el('span', 'finding-label', f.label);
  p.appendChild(labelSpan);

  p.dataset.findingId = f.id;
  p.addEventListener('click', e => {
    if (e.target.closest('.bolt-fix')) return;
    document.dispatchEvent(new CustomEvent('nusa:focus-finding', { detail: { findingId: f.id } }));
  });

  const n = $('narration');
  if (n) {
    n.appendChild(p);
    n.scrollTop = n.scrollHeight;
  }
}

/* Ask AI — create a question+answer pair at the top of the container */
function askStart(question) {
  const host = $('ask-answers');
  if (!host) return null;

  const pair = el('div', 'ask-pair');

  const q = el('div', 'ask-msg ask-q');
  q.innerHTML = renderRich('you: ' + question);
  pair.appendChild(q);

  const a = el('div', 'ask-msg ask-a');
  a.innerHTML = '<em>thinking…</em>';
  pair.appendChild(a);

  host.prepend(pair);
  host.scrollTop = 0;
  return a;
}

/* Ask AI — fill the answer into the pair that askStart created */
function askFinish(answerEl, text) {
  if (!answerEl) return;
  answerEl.innerHTML = renderRich(text);
  const host = $('ask-answers');
  if (host) host.scrollTop = 0;
}

function renderRich(text) {
  if (text == null) return '';
  let s = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const blocks = [];
  s = s.replace(/```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(
      `<pre><code class="lang-${(lang || 'plaintext').toLowerCase()}">${code.replace(/\s+$/, '')}</code></pre>`
    );
    return `\u0000B${blocks.length - 1}\u0000`;
  });

  const paras = s.split(/\n{2,}/).map(block => {
    if (/^\u0000B\d+\u0000$/.test(block.trim())) return block;
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
  });

  s = paras.join('');
  s = s.replace(/\u0000B(\d+)\u0000/g, (_, i) => blocks[+i]);
  return s;
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

/* ═══════════════════════════════════════════════════════════════
   UX extraction
   ═══════════════════════════════════════════════════════════════ */
function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
function countExternalLinks(links, baseUrl) {
  let baseHost;
  try { baseHost = new URL(baseUrl || window.location.href).host; }
  catch { baseHost = window.location.host; }
  return Array.from(links).filter(a => {
    const raw = a.getAttribute('href');
    if (!raw) return false;
    if (/^(#|mailto:|tel:|javascript:|data:)/i.test(raw)) return false;
    try { return new URL(raw, baseUrl || window.location.href).host !== baseHost; }
    catch { return false; }
  }).length;
}
function hasViewportMeta(doc) {
  const meta = doc.querySelector('meta[name="viewport"]');
  return meta && /width\s*=\s*device-width/i.test(meta.content);
}
function hasSemanticMain(doc) { return !!doc.querySelector('main'); }
function hasSemanticArticleOrSection(doc) { return !!doc.querySelector('article, section'); }
function countMissingAlt(doc) {
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
  return { missingCount: missing, meaningfulCount: meaningful, decorativeCount: decorative, totalImages: imgs.length };
}
function pickPrimaryNav(doc) {
  const candidates = ['header nav','nav[aria-label*="main" i]','nav[aria-label*="primary" i]','nav[role="navigation"]','nav'];
  for (const sel of candidates) {
    const el = doc.querySelector(sel);
    if (el) return el;
  }
  return null;
}
function extractVisibleTextFromDoc(doc) {
  const root = doc.body || doc.documentElement;
  if (!root) return '';
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script, style, svg, noscript, template')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let text = '';
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (t) text += t + ' ';
  }
  return text;
}
function getUXContent(doc, metrics, auditedUrl) {
  const fullText = extractVisibleTextFromDoc(doc);
  const paragraphTexts = [];
  doc.querySelectorAll('p, li').forEach(el => {
    if (el.closest('script, style, svg, noscript')) return;
    const t = (el.textContent || '').trim();
    if (t.length > 15) paragraphTexts.push(t);
  });
  const boldCount = doc.querySelectorAll('b, strong').length;
  const listItemCount = doc.querySelectorAll('li').length;
  const links = doc.querySelectorAll('a[href]');
  const images = doc.querySelectorAll('img');
  const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
  const primaryNav = pickPrimaryNav(doc);
  const topLevelItems = primaryNav ? primaryNav.querySelectorAll(':scope > ul > li, :scope > li').length : 0;

  return {
    fullText, wordCount: countWords(fullText),
    linkCount: links.length,
    externalLinkCount: countExternalLinks(links, auditedUrl),
    imageCount: images.length,
    altData: countMissingAlt(doc),
    headingCount: headings.length,
    hasViewport: hasViewportMeta(doc),
    hasMain: hasSemanticMain(doc),
    hasArticleOrSection: hasSemanticArticleOrSection(doc),
    paragraphTexts, boldCount, listItemCount,
    mainNav: primaryNav,
    hasDropdowns: !!doc.querySelector('nav li ul, .dropdown, [aria-haspopup="true"]'),
    topLevelItems,
    hasBreadcrumb: !!doc.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]'),
    hasLandmarks: !!doc.querySelector('header, footer, aside, [role="banner"], [role="contentinfo"], [role="complementary"]'),
    hasAriaLabels: !!doc.querySelector('[aria-label], [aria-labelledby]'),
    viewportContent: (() => {
      const meta = doc.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') || '' : '';
    })(),
    hasMediaQueries: !!doc.querySelector('style, link[rel="stylesheet"][href*="css"]'),
    hasTouchFriendly: (() => {
      const links2 = doc.querySelectorAll('a, button, [role="button"]');
      let smallCount = 0;
      links2.forEach(el => {
        const rect = el.getBoundingClientRect?.() || { width: 0, height: 0 };
        if (rect.width < 44 || rect.height < 44) smallCount++;
      });
      return smallCount < 5;
    })(),
    hasManifest: !!doc.querySelector('link[rel="manifest"]'),
    hasServiceWorkerHint: doc.body.innerHTML.includes('serviceWorker') || doc.body.innerHTML.includes('register('),
    hasAppleTouchIcon: !!doc.querySelector('link[rel*="apple-touch-icon"]'),
    isHttps: /^https:/i.test(auditedUrl || ''),
    hasLazyLoading: (() => {
      const allImgs = doc.querySelectorAll('img[src]');
      const lazyImgs = doc.querySelectorAll('img[loading="lazy"]');
      const total = allImgs.length;
      const lazyCount = lazyImgs.length;
      if (total === 0) return false;
      return lazyCount >= 2 && (lazyCount / total) * 100 >= 40;
    })(),
    externalScripts: doc.querySelectorAll('script[src^="http"]').length,
    hasRenderBlocking: (() => {
      const head = doc.head || doc.querySelector('head');
      if (!head) return 0;
      function isBlockingScript(s) {
        const type = (s.getAttribute('type') || '').toLowerCase();
        if (s.src) {
          if (s.defer || s.async) return false;
          if (type === 'module') return false;
          return true;
        }
        if (!type) return true;
        if (type === 'text/javascript') return true;
        if (type === 'application/javascript') return true;
        return false;
      }
      function isBlockingStyle(l) {
        const rel = (l.getAttribute('rel') || '').toLowerCase();
        if (rel !== 'stylesheet') return false;
        if (l.hasAttribute('media')) return false;
        if (l.hasAttribute('disabled')) return false;
        if (l.getAttribute('rel') === 'preload') return false;
        return true;
      }
      const bs = Array.from(head.querySelectorAll('script')).filter(isBlockingScript);
      const bl = Array.from(head.querySelectorAll('link')).filter(isBlockingStyle);
      return bs.length + bl.length;
    })(),
    fontCount: doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"], link[rel="stylesheet"][href*="typekit"], link[rel="stylesheet"][href*="cloud.typography"]').length || 0,
    hasFontDisplaySwap: doc.body.innerHTML.includes('font-display: swap') ||
                       doc.body.innerHTML.includes('font-display:swap') ||
                       doc.head.innerHTML.includes('font-display: swap') ||
                       doc.head.innerHTML.includes('font-display:swap'),
    hasWebpOrAvif: !!doc.querySelector('img[src$=".webp"], img[src$=".avif"], source[type="image/webp"], source[type="image/avif"]'),
    potentialCTAs: doc.querySelectorAll(
      'a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="trial"], a[href*="buy"], ' +
      'a[href*="get"], a[href*="start"], button, [role="button"], .btn, .button, ' +
      '[class*="cta"], [id*="cta"], [class*="button"], [class*="CallToAction"]'
    ).length
  };
}

async function runAudit(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;

  saveUrlToHistory(url);

  const n = $('narration'); if (n) n.innerHTML = '';
  state = null;
  previewShot = null;
  previewPins.clear();
  t0 = performance.now();
  $('stage')?.classList.remove('hidden');
  const pmEl = $('preview-meta'); if (pmEl) pmEl.textContent = 'rendering…';
  const pvEl = $('preview');
  if (pvEl) pvEl.innerHTML = '<div class="preview-empty">rendering preview…</div>';
  $('chamber')?.classList.add('hidden');
  $('summary-cards')?.classList.add('hidden');
  $('ask-block')?.classList.remove('hidden');
  $('share-module')?.classList.add('hidden');
  const aa = $('ask-answers'); if (aa) aa.innerHTML = '';

  const pv = $('preview');
  if (pv) pv.innerHTML = '<div class="preview-empty">rendering preview…</div>';
  const pm = $('preview-meta');
  if (pm) pm.textContent = '·';

  startRuler();
  narrate(`Opening ${url} — running UX, SEO & AEO audits in parallel.`, { anchor: true });
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

  let uxHtml = lh.renderedHtml || lh.rawHtml || '';
  let uxMetrics = null;
  let uxLoadTime = null;
  try {
    const qr = await fetch(WORKERS.qrRender + '?url=' + encodeURIComponent(url));
    if (qr.ok) {
      const p = await qr.json();
      if (p && p.success !== false && p.html) {
        uxHtml = p.html;
        uxMetrics = p.metrics || null;
        uxLoadTime = p.loadTime ?? null;
      }
    }
  } catch (_) {}

  const html = uxHtml;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let uxData = getUXContent(doc, uxMetrics, url);
  if (uxMetrics) uxData = mergeMetricsIntoUX(uxData, uxMetrics);
  uxData.renderedLoadTime = uxLoadTime;
  if (uxData.renderedWordCount && uxData.renderedWordCount > 50) {
    uxData.wordCount = uxData.renderedWordCount;
  }

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

  await sleep(250);
  const narr = $('narration');
  if (narr) narr.scrollTo({ top: 0, behavior: 'smooth' });
  $('summary-cards')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('chamber')?.classList.remove('hidden');

  renderSummaryCards(state);
  renderPreview();
  renderShareModule();

  document.body.setAttribute('data-url', url);

  try {
    const overallScore = Math.round(
      (state.ux.score + state.seo.score + state.aeo.score) / 3
    );
    await saveAudit({ url, tool: 'NUSA', score: overallScore });
  } catch (e) {
    console.warn('NUSA audit save failed:', e);
  }
}

function renderShareModule() {
  const host = $('share-module');
  if (!host || !state) return;

  const allChecks = [];
  for (const cat of ['UX', 'SEO', 'AEO']) {
    const data = state[cat.toLowerCase()];
    if (!data) continue;
    for (const m of (data.modules || [])) {
      const subs = evaluateModule(cat, m);
      for (const s of subs) {
        allChecks.push({ cat, module: m.name, label: s.name, status: s.status });
      }
      for (const failed of (m.failed || [])) {
        const already = subs.some(s => s.name === failed);
        if (!already) {
          allChecks.push({ cat, module: m.name, label: failed, status: 'fail' });
        }
      }
    }
  }

  const moduleScores = [
    { name: 'UX',  score: state.ux.score  },
    { name: 'SEO', score: state.seo.score },
    { name: 'AEO', score: state.aeo.score }
  ];

  const overallScore = Math.round(
    (state.ux.score + state.seo.score + state.aeo.score) / 3
  );

  const dedupe = arr => Array.from(new Set(arr));

  const passedMetrics = dedupe(allChecks.filter(c => c.status === 'pass').map(c => c.label));
  const warnMetrics   = dedupe(allChecks.filter(c => c.status === 'warn').map(c => c.label));
  const failMetrics   = dedupe(allChecks.filter(c => c.status === 'fail').map(c => c.label));

  const failedMetrics = [...failMetrics, ...warnMetrics];

  const aiFixes = [...failMetrics, ...warnMetrics].slice(0, 5);

  host.innerHTML = '';
  host.classList.remove('hidden');

  initShareModule(host, {
    toolName: 'NUSA',
    url: state.url,
    pageTitle: state.doc?.title || 'Untitled page',
    overallScore,
    moduleScores,
    passedMetrics,
    failedMetrics,
    aiFixes,
    shareLink: `https://traffictorch.net/?url=${encodeURIComponent(state.url)}`,
    rawData: {
      scores: { ux: state.ux.score, seo: state.seo.score, aeo: state.aeo.score },
      url: state.url,
      cms: state.cms,
      checks: allChecks
    }
  });
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
  const extracted = extractSnippets(state?.html || '', f.label);
  const { rule, category } = extracted;

  if (rule && category !== 'page' && (rule.sel || rule.expected)) {
    const viewBtn = el('button', 'view-code-btn', '▸ view the code');
    viewBtn.addEventListener('click', () => {
      openCodeModal(f.label, extracted);
    });
    container.appendChild(viewBtn);
  }

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

$('url-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const v = $('url-input').value.trim();
  if (!v) return;

  const canProceed = await canRunTool('limit-audit-id');
  if (!canProceed) {
    document.getElementById('upgradeModal')?.classList.remove('hidden');
    return;
  }
  runAudit(v);
});

$('ask-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('ask-input').value.trim();
  if (!q) return;
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn?.textContent || '↵';
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  $('ask-input').value = '';

  // Question appears instantly at the top of the container; answer slot shows "thinking…"
  const answerEl = askStart(q);
  if (!answerEl) return;

  // 1. All findings (not just fails) — with category, status, severity
  const allFindings = (state?.findings || []).map(f => ({
    cat: f.cat, label: f.label, status: f.status, severity: f.severity || 0
  }));

  // 2. HTML snippets for findings that have selectors — cap at 5 to keep payload sane
  const snippetMap = {};
  for (const f of (state?.findings || []).slice(0, 40)) {
    const { snippets } = extractSnippets(state?.html || '', f.label);
    if (snippets.length) {
      snippetMap[f.label] = snippets.slice(0, 2).map(s =>
        s.html.length > 500 ? s.html.slice(0, 500) + '…' : s.html
      );
    }
  }

  // 3. Module-level metrics (raw details from scorers)
  const uxModules   = (state?.ux?.modules  || []).map(m => ({ name: m.name, score: m.score, details: m.details }));
  const seoModules  = (state?.seo?.modules || []).map(m => ({ name: m.name, score: m.score, details: m.details }));
  const aeoModules  = (state?.aeo?.modules || []).map(m => ({ name: m.name, score: m.score, details: m.details }));

  try {
    const res = await fetch(WORKERS.ask, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        auditData: {
          url: state?.url || '',
          pageTitle: state?.doc?.title || '',
          cms: state?.cms ? { id: state.cms.id, name: state.cms.name, version: state.cms.version } : { name: 'Custom / Unknown' },
          scores: state ? { ux: state.ux.score, seo: state.seo.score, aeo: state.aeo.score } : {},
          findings: allFindings,
          snippets: snippetMap,
          metrics: { ux: uxModules, seo: seoModules, aeo: aeoModules }
        }
      })
    });
    const data = await res.json();
    askFinish(answerEl, 'nusa: ' + (data.answer || data.error || 'no response'));
  } catch (err) {
    askFinish(answerEl, 'nusa: request failed — ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
});

$('chamber-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('chamber-input').value.trim();
  if (!q || !state) return;
  const out = $('chamber-out');
  if (!out) return;
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn?.textContent || 'run simulation';
  if (btn) { btn.disabled = true; btn.textContent = 'simulating…'; }
  out.innerHTML = '';
  const pageText = (state.doc?.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  const engines = [
    {
      name: 'ChatGPT',
      instr: 'The user asked a specific question about the page. Search the PAGE CONTENT below and reply with the 1–3 sentences that best answer it. Quote them verbatim — do not paraphrase, do not invent, do not summarise. If the page contains a directly relevant answer, output only those sentences. If nothing on the page is relevant to the question, output exactly: CANNOT ANSWER'
    },
    {
      name: 'Perplexity',
      instr: 'The user asked a specific question. Find sentences in the PAGE CONTENT that could be cited as a source for that question. Be generous — anything topical, related, or providing context counts as citable. Format your reply as: a one-line answer, then a new line starting with "Citations:" followed by each cited sentence from the page on its own line. Only output exactly CANNOT CITE if the page contains zero sentences on the topic.'
    },
    {
      name: 'AI Overview',
      instr: 'You have been given the PAGE CONTENT below. Use ONLY that content to answer the user\'s question in 1–3 sentences. Do not ask for extra data, do not say "I don\'t have the results", do not reference audit scores. If the page does not cover the topic, output: CANNOT ANSWER. Otherwise end your reply with a new line reading exactly one of: Confidence: high / Confidence: medium / Confidence: low'
    }
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
      const wordCount = answer.split(/\s+/).filter(Boolean).length;
      const tooShort = wordCount < 15 && !/^\d+\./.test(answer);
      const isFail = /CANNOT (ANSWER|CITE)/i.test(answer)
                  || /not in extractable/i.test(answer)
                  || tooShort;
      const isWarn = /confidence:\s*low/i.test(answer);
      const v = isFail ? 'fail' : isWarn ? 'warn' : 'pass';
      row.querySelector('.verdict').className = 'verdict ' + v;
      row.querySelector('.verdict').textContent = v === 'pass' ? '✓' : v === 'warn' ? '~' : '✗';
      row.querySelector('.body').textContent = answer.slice(0, 1200) || '(empty)';
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
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
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
  if (btn) { btn.disabled = false; btn.textContent = originalText; }
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
    if (rule.cat === 'page' || rule.cat === 'resource') continue;
    if (rule.filter) filters.push({ selector: rule.sel, ...rule.filter });
    else selSet.add(rule.sel);
  }

  try {
    const res = await fetch(WORKERS.render, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: state.url,
        screenshot: true,
        highlightSelectors: [...selSet],
        filters,
        deviceScaleFactor: 2
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
  for (const [key, entry] of previewPins) drawPin(entry.findingId, entry.bbox, key);
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
    openCodeModal(found.label, extractSnippets(state?.html || '', found.label));
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

/* ── DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  populateUrlDatalist();
  const input = document.getElementById('url-input');
  if (input) input.addEventListener('focus', populateUrlDatalist);
});

/* ── Auto-run from ?url= ── */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (!urlParam) return;
  const input = document.getElementById('url-input');
  if (!input) return;
  let cleanUrl = decodeURIComponent(urlParam.trim());
  if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
  input.value = cleanUrl;
  setTimeout(() => runAudit(cleanUrl), 500);
});