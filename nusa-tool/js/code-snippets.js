// code-snippets.js — v8
// Category-aware rule → DOM-node mapping.
//
// Categories:
//   page     — whole-document/derived metric; no DOM node exists
//   head     — document metadata in <head> (title, meta, link)
//   body     — a specific visible DOM element in the rendered body
//   count    — aggregate/count over many elements (selector is a sample set)
//   resource — network/HTTP header/file/timing issue; not a DOM snippet
//   code     — inline <script>/<style>/<script type="application/ld+json">

const RULES = [
  /* ── UX (page-wide → cat: 'page') ──────────────────────────── */
  { re: /flesch reading ease/i,                     cat: 'page' },
  { re: /flesch[\s-]?kincaid|kincaid grade/i,       cat: 'page' },
  { re: /average sentence length/i,                 cat: 'page' },
  { re: /paragraph density/i,                       cat: 'page' },
  { re: /text scannability/i,                       cat: 'page' },
  { re: /link density evaluation/i,                 cat: 'page' },
  { re: /menu structure clarity/i,                  cat: 'page' },
  { re: /internal linking balance/i,                cat: 'page' },
  { re: /cta prominence/i,                          cat: 'page' },
  { re: /responsive breakpoints/i,                  cat: 'page' },
  { re: /wcag compliance/i,                         cat: 'page' },
  { re: /color contrast ratios/i,                   cat: 'page' },

  /* ── UX (head metadata) ───────────────────────────────────── */
  { re: /viewport configuration/i,                  cat: 'head', sel: 'meta[name="viewport"]', limit: 1,
                                                     expected: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
  { re: /pwa readiness/i,                           cat: 'head', sel: 'link[rel="manifest"]', limit: 3,
                                                     expected: '<link rel="manifest" href="/manifest.json">' },
  { re: /font optimization/i,                       cat: 'head', sel: 'link[href*="fonts"]', limit: 6 },

  /* ── UX (counts) ──────────────────────────────────────────── */
  { re: /alt text coverage/i,                       cat: 'count', sel: 'img:not([alt])', limit: 10 },
  { re: /lazy loading media/i,                      cat: 'count', sel: 'img:not([loading="lazy"])', limit: 20 },
  { re: /image optimization/i,                      cat: 'count', sel: 'img:not([src$=".webp"]):not([src$=".avif"])', limit: 20 },
  { re: /asset volume/i,                            cat: 'count', sel: 'img', limit: 10 },
  { re: /semantic html structure/i,                 cat: 'count', sel: 'div', limit: 10 },
  { re: /script optimization/i,                     cat: 'count', sel: 'script[src]:not([async]):not([defer])', limit: 10 },
  { re: /script bloat/i,                            cat: 'count', sel: 'script[src]', limit: 10 },
  { re: /touch target size/i,                       cat: 'count', sel: 'a, button, [role="button"]',
                                                     filter: { maxH: 44, maxW: 44 }, limit: 6 },

  /* ── SEO/AEO worker (axe-style labels) ───────────────────── */
  { re: /color[\s-]?contrast/i,                     cat: 'body',
                                                     sel: '[style*="color"], [style*="background"]',
                                                     fallback: 'p, h1, h2, h3, a, li, span', limit: 5 },
  { re: /label.*form elements must have labels|form elements must have labels/i,
                                                     cat: 'body',
                                                     sel: 'input:not([type="hidden"]):not([aria-label]):not([id]), select:not([id]):not([aria-label])',
                                                     candidates: 'input:not([type="hidden"]), select, textarea',
                                                     limit: 5 },
  { re: /form elements do not have associated labels/i,
                                                     cat: 'body',
                                                     sel: 'input:not([type="hidden"]):not([aria-label]):not([id]), select:not([id]):not([aria-label])',
                                                     candidates: 'input:not([type="hidden"]), select, textarea',
                                                     limit: 5 },
  { re: /link-name|links must have discernible|links? do not have a discernible/i,
                                                     cat: 'body',
                                                     sel: 'a:empty, a:not([aria-label]):empty',
                                                     candidates: 'a',
                                                     limit: 5 },
  { re: /link[\s-]?in[\s-]?text[\s-]?block/i,       cat: 'body', sel: 'p a, li a', limit: 5 },
  { re: /button-name|buttons must have discernible|buttons? do not have an accessible name/i,
                                                     cat: 'body',
                                                     sel: 'button:empty, button:not([aria-label]):empty',
                                                     candidates: 'button',
                                                     limit: 5 },
  { re: /meta-viewport|zooming and scaling must not be disabled/i,
                                                     cat: 'head', sel: 'meta[name="viewport"]', limit: 1,
                                                     expected: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
  { re: /user-scalable=no|maximum-scale=1/i,        cat: 'head', sel: 'meta[name="viewport"]', limit: 1,
                                                     expected: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
  { re: /aria-required-children/i,                  cat: 'page' },
  { re: /aria-valid-attr-value/i,                   cat: 'page' },
  { re: /image.*missing width.*height|images? without explicit width|image elements do not have explicit/i,
                                                     cat: 'body',
                                                     sel: 'img:not([width]):not([height])', limit: 6 },
  { re: /missing page title|no page title|title too long|title.*\d+.*chars/i,
                                                     cat: 'head', sel: 'title', limit: 1,
                                                     expected: '<title>Page title — 50–60 characters</title>' },
  { re: /missing meta description|meta description (short|.*\d+.*chars)/i,
                                                     cat: 'head', sel: 'meta[name="description"]', limit: 1,
                                                     expected: '<meta name="description" content="120–160 character summary of the page.">' },
  { re: /no h1|missing h1/i,                        cat: 'body', sel: 'h1', limit: 1, fallback: 'h2' },
  { re: /h1s? on page/i,                            cat: 'count', sel: 'h1', limit: 3 },
  { re: /canonical/i,                               cat: 'head', sel: 'link[rel="canonical"]', limit: 1,
                                                     expected: '<link rel="canonical" href="https://example.com/this-page">' },
  { re: /noindex|nofollow/i,                        cat: 'head', sel: 'meta[name="robots"]', limit: 1,
                                                     expected: '<meta name="robots" content="index, follow">' },
  { re: /failed network request/i,                  cat: 'resource' },
  { re: /service worker/i,                          cat: 'resource' },
  { re: /web app manifest|manifest link|no web app manifest/i,
                                                     cat: 'head', sel: 'link[rel="manifest"]', limit: 1,
                                                     expected: '<link rel="manifest" href="/manifest.json">' },
  { re: /theme-color meta|missing theme-color/i,    cat: 'head', sel: 'meta[name="theme-color"]', limit: 1,
                                                     expected: '<meta name="theme-color" content="#ffffff">' },
  { re: /apple-mobile-web-app-capable/i,            cat: 'head',
                                                     sel: 'meta[name="apple-mobile-web-app-capable"]', limit: 1,
                                                     expected: '<meta name="apple-mobile-web-app-capable" content="yes">' },
  { re: /apple-touch-icon/i,                        cat: 'head', sel: 'link[rel*="apple-touch-icon"]', limit: 3,
                                                     expected: '<link rel="apple-touch-icon" sizes="180x180" href="/logo-180.webp">' },
  { re: /mask-icon/i,                               cat: 'head', sel: 'link[rel="mask-icon"]', limit: 1,
                                                     expected: '<link rel="mask-icon" href="/mask-icon.svg" color="#f97316">' },
  { re: /HSTS header/i,                             cat: 'resource' },
  { re: /large inline style block/i,                cat: 'code', sel: 'style', limit: 6 },
  { re: /large inline script/i,                     cat: 'code', sel: 'script:not([src])', limit: 6 },
  { re: /image.*over 200KB|large image/i,           cat: 'count', sel: 'img', limit: 3 },
  { re: /no webp|avif|modern formats/i,             cat: 'count',
                                                     sel: 'img:not([src$=".webp"]):not([src$=".avif"])', limit: 10 },
  { re: /css total|purge unused css/i,              cat: 'resource' },
  { re: /web fonts without font-display|font-display: swap/i,
                                                     cat: 'resource' },
  { re: /heavyweights detected/i,                   cat: 'count',
                                                     sel: 'script[src*="googletagmanager"], script[src*="google-analytics"]',
                                                     limit: 5 },
  { re: /safe-area insets/i,                        cat: 'page' },
  { re: /skip-to-content link/i,                    cat: 'body',
                                                     sel: 'a[href^="#main"], a.skip-link, a[href^="#content"]', limit: 3 },
  { re: /webmcp/i,                                  cat: 'page' },
  { re: /ttfb|time to first byte/i,                 cat: 'resource' },
  { re: /fcp.*slow|first contentful/i,              cat: 'page' },
  { re: /cls[:.]|layout shift/i,                    cat: 'page' },
  { re: /live dom mutations|dom mutations/i,        cat: 'page' },
  { re: /nodes added\/removed/i,                    cat: 'page' },
  { re: /high div count/i,                          cat: 'count', sel: 'div', limit: 6 },
  { re: /heading order violation/i,                 cat: 'body',
                                                     sel: 'h1, h2, h3, h4, h5, h6', limit: 8, seq: true },
  { re: /low semantic html usage|div-soup/i,        cat: 'count', sel: 'div', limit: 6 },
  { re: /text[\s-]?to[\s-]?code|text density|very low text/i, cat: 'page' },
  { re: /semantic html ratio/i,                     cat: 'count', sel: 'div, main, article, section', limit: 6 },
  { re: /paragraph tags/i,                          cat: 'count', sel: 'p', limit: 5 },
  { re: /json-ld block|schema type/i,               cat: 'code',
                                                     sel: 'script[type="application/ld+json"]', limit: 3,
                                                     expected: '<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebPage", ... }</script>' },
  { re: /crawler blocking|ai crawler/i,             cat: 'resource' },
  { re: /list\(s\)|heading order valid/i,           cat: 'count', sel: 'ul, ol', limit: 5 },
  { re: /avg paragraph/i,                           cat: 'page' },
  { re: /exactly one h1/i,                          cat: 'count', sel: 'h1', limit: 1 },
  { re: /content mostly present/i,                  cat: 'page' },
  { re: /no js errors/i,                            cat: 'page' },
  { re: /h1 present in raw html/i,                  cat: 'body', sel: 'h1', limit: 1 },
  { re: /noscript/i,                                cat: 'body', sel: 'noscript', limit: 1 },
  { re: /render fidelity/i,                         cat: 'page' },
  { re: /dom stability/i,                           cat: 'page' },
  { re: /render blocking performance/i,             cat: 'page' },
  { re: /content stability/i,                       cat: 'page' },
  { re: /no llms\.txt/i,                            cat: 'resource' },
  { re: /no structured data/i,                      cat: 'code',
                                                     sel: 'script[type="application/ld+json"]', limit: 1,
                                                     expected: '<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "Article", ... }</script>' },
  { re: /no visible author byline/i,                cat: 'body', sel: 'body', limit: 1 },
  { re: /no publish\/update date/i,                 cat: 'body',
                                                     sel: 'time, meta[property="article:published_time"]', limit: 1 }
];

export function deriveRule(label) {
  if (!label) return null;
  for (const r of RULES) if (r.re.test(label)) {
    if (!r.cat) r.cat = r.sel ? 'body' : 'page';
    return r;
  }
  return null;
}

export function ruleKey(rule) {
  if (!rule || !rule.sel) return null;
  if (rule.cat === 'page' || rule.cat === 'resource') return null;
  if (rule.filter) return `${rule.sel}|${rule.filter.maxH || 0}|${rule.filter.maxW || 0}`;
  return rule.sel;
}

/* ───────────────────── helpers ───────────────────────── */

const MAX_SNIPPET = 900;
const MAX_CODE_SNIPPET = 400;
const truncate = s => s.length > MAX_SNIPPET ? s.slice(0, MAX_SNIPPET) + '\n… (truncated)' : s;

function openingTagOnly(html) {
  const m = String(html || '').match(/^<[^>]+>/);
  return m ? m[0] : html;
}

function parseLabelMeta(label) {
  if (!label) return { severity: null, count: null };
  const s = String(label);
  const axe = s.match(/\((\w+),\s*(\d+)\s*node\(s\)\)/i);
  if (axe) return { severity: axe[1].toLowerCase(), count: parseInt(axe[2], 10) };
  // Leading counts like "1 image(s)…", "3 heading order violation(s)…", "955 live DOM mutations…"
  const lead = s.match(/^(\d+)\s+(?:image|heading|violation|mutation|request|block|element|issue|finding|node|item|link|button|form|div|paragraph|list)/i);
  if (lead) return { severity: null, count: parseInt(lead[1], 10) };
  return { severity: null, count: null };
}

/* ───────────────────── extractor ───────────────────────── */

export function extractSnippets(html, label) {
  const empty = {
    rule: null, category: null, snippets: [], count: 0,
    reportedCount: null, note: null, expected: null, headExcerpt: null
  };
  if (!html) return empty;
  const rule = deriveRule(label);
  if (!rule) return empty;

  const { count: reportedCount } = parseLabelMeta(label);
  const category = rule.cat;
  const limit = rule.limit || 3;

  // ── PAGE ────────────────────────────────────────────────────
  if (category === 'page') {
    return {
      rule, category, snippets: [], count: 0, reportedCount,
      expected: null, headExcerpt: null,
      note: 'Page-level metric — calculated from the whole document. No single DOM element represents this finding.'
    };
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // ── RESOURCE ────────────────────────────────────────────────
  if (category === 'resource') {
    const snippets = [];
    if (rule.sel) {
      try {
        const nodes = Array.from(doc.querySelectorAll(rule.sel)).slice(0, limit);
        for (const n of nodes) snippets.push({ selector: rule.sel, html: truncate(n.outerHTML || '') });
      } catch (_) {}
    }
    return {
      rule, category, snippets, count: snippets.length, reportedCount,
      expected: null, headExcerpt: null,
      note: 'Resource / HTTP-header finding. No DOM snippet — the fix happens at the server or asset level.'
    };
  }

  const scope = category === 'head' ? (doc.head || doc.documentElement) : doc;
  let nodes = [];
  try { nodes = Array.from(scope.querySelectorAll(rule.sel)); } catch (_) {}

  // ── COUNT ───────────────────────────────────────────────────
  if (category === 'count') {
    const total = reportedCount != null ? reportedCount : nodes.length;
    const sample = nodes.slice(0, limit).map(n => ({
      selector: rule.sel,
      html: truncate(openingTagOnly(n.outerHTML || ''))
    }));
    let note;
    if (reportedCount != null && reportedCount !== nodes.length && nodes.length > 0) {
      note = `${reportedCount} element(s) flagged by the audit — showing first ${sample.length} of ${nodes.length} candidate(s).`;
    } else if (total === 0) {
      note = 'Count metric — 0 matching elements on the page.';
    } else {
      note = `Count metric — ${total} matching element${total === 1 ? '' : 's'}; showing first ${sample.length}.`;
    }
    return { rule, category, snippets: sample, count: total, reportedCount,
             expected: null, headExcerpt: null, note };
  }

  // ── HEAD / BODY / CODE ──────────────────────────────────────
  if (!nodes.length && rule.fallback) {
    try { nodes = Array.from(scope.querySelectorAll(rule.fallback)); } catch (_) {}
  }

  // Option A: engine reported nodes but our selector missed → try candidate selector
  if (!nodes.length && reportedCount && reportedCount > 0 && rule.candidates) {
    try { nodes = Array.from(scope.querySelectorAll(rule.candidates)); } catch (_) {}
    if (nodes.length) {
      const sample = nodes.slice(0, limit).map(n => ({
        selector: rule.candidates,
        html: truncate(n.outerHTML || '')
      }));
      return {
        rule, category, snippets: sample, count: reportedCount, reportedCount,
        expected: null, headExcerpt: null,
        note: `${reportedCount} element(s) flagged by the audit engine. Exact nodes could not be re-selected — showing likely candidates.`
      };
    }
  }

  const snippets = nodes.slice(0, limit).map(n => ({
    selector: rule.sel,
    html: truncate(n.outerHTML || '')
  }));

  if (snippets.length) {
    let note = null;
    if (rule.seq && reportedCount && reportedCount > 0) {
      note = `${reportedCount} heading order violation(s) in this sequence — headings shown in document order so you can spot where the order breaks.`;
    }
    return { rule, category, snippets, count: snippets.length, reportedCount,
             expected: null, headExcerpt: null, note };
  }

  // HEAD missing
  if (category === 'head') {
    const headHtml = (doc.head && doc.head.innerHTML) ? doc.head.innerHTML.trim() : '';
    return {
      rule, category, snippets: [], count: 0, reportedCount,
      expected: rule.expected || rule.sel,
      headExcerpt: headHtml ? truncate(headHtml) : null,
      note: 'Not found in <head>.'
    };
  }

  // CODE missing
  if (category === 'code') {
    return {
      rule, category, snippets: [], count: 0, reportedCount,
      expected: rule.expected || null, headExcerpt: null,
      note: 'No matching inline code block found on the page.'
    };
  }

  // BODY missing — never say "not present" when the engine reported nodes
  if (reportedCount && reportedCount > 0) {
    return {
      rule, category, snippets: [], count: reportedCount, reportedCount,
      expected: null, headExcerpt: null,
      note: `${reportedCount} element(s) flagged by the audit engine. Exact nodes could not be re-selected in the rendered DOM.`
    };
  }

  return {
    rule, category, snippets: [], count: 0, reportedCount,
    expected: null, headExcerpt: null,
    note: 'Not present in the rendered body.'
  };
}

/* ───────────────────────── Modal ─────────────────────────── */

let stylesInjected = false;
function injectModalStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    .cm-note { padding: 10px 12px; margin: 0 0 12px; font-size: 13px; line-height: 1.5;
               color: #cbd5e1; background: rgba(148,163,184,0.10); border-radius: 8px;
               border-left: 3px solid #64748b; }
    .cm-cat { margin-left: 10px; padding: 2px 8px; font-size: 10px; letter-spacing: 0.08em;
              text-transform: uppercase; color: #94a3b8; background: rgba(148,163,184,0.15);
              border-radius: 999px; }
    .cm-head { display: flex; align-items: center; }
    .cm-head .cm-title { flex: 1; }
  `;
  document.head.appendChild(s);
}

export function openCodeModal(title, payload) {
  closeCodeModal();
  injectModalStyles();

  // Backward compat: allow array of snippets
  const data = Array.isArray(payload)
    ? { category: 'body', snippets: payload, count: payload.length, reportedCount: null,
        note: null, expected: null, headExcerpt: null }
    : (payload || { category: 'body', snippets: [], count: 0, reportedCount: null,
                    note: null, expected: null, headExcerpt: null });

  const back = document.createElement('div');
  back.className = 'cm-backdrop';
  back.innerHTML = `
    <div class="cm-modal" role="dialog" aria-label="Affected code">
      <div class="cm-head">
        <span class="cm-title">${escapeHtml(title || 'Affected code')}</span>
        <span class="cm-cat">${escapeHtml(data.category || 'body')}</span>
        <button class="cm-close" aria-label="Close">×</button>
      </div>
      <div class="cm-body">${renderModalBody(data)}</div>
    </div>`;
  document.documentElement.appendChild(back);
  document.documentElement.style.overflow = 'hidden';

  back.querySelector('.cm-close').addEventListener('click', closeCodeModal);
  back.addEventListener('click', e => { if (e.target === back) closeCodeModal(); });
  const onKey = e => {
    if (e.key === 'Escape') { closeCodeModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

function renderModalBody(data) {
  const { category, snippets, note, expected, headExcerpt, reportedCount } = data;

  if (category === 'page') {
    return `<div class="cm-note">${escapeHtml(note || 'Page-level metric.')}</div>`;
  }

  if (category === 'resource') {
    return `<div class="cm-note">${escapeHtml(note || 'Resource-level finding.')}</div>`
      + renderSnippets(snippets);
  }

  if (category === 'head' && !snippets.length) {
    let html = `<div class="cm-note">${escapeHtml(note || 'Not found in <head>.')}</div>`;
    if (expected)    html += renderItem('expected', expected);
    if (headExcerpt) html += renderItem('&lt;head&gt; (current contents)', headExcerpt);
    return html;
  }

  if (category === 'code' && !snippets.length) {
    let html = `<div class="cm-note">${escapeHtml(note || 'No matching code block found.')}</div>`;
    if (expected) html += renderItem('suggested template', expected);
    return html;
  }

  if (category === 'count') {
    return `<div class="cm-note">${escapeHtml(note || '')}</div>` + renderSnippets(snippets);
  }

  if (!snippets.length) {
    const prefix = reportedCount ? '⚠ ' : '';
    return `<div class="cm-note">${prefix}${escapeHtml(note || 'Not present in the rendered page.')}</div>`;
  }

  return (note ? `<div class="cm-note">${escapeHtml(note)}</div>` : '') + renderSnippets(snippets);
}

function renderSnippets(snippets) {
  if (!snippets.length) return '';
  return snippets.map(s => renderItem(s.selector, s.html)).join('');
}

function renderItem(selector, html) {
  return `<div class="cm-item">
    <div class="cm-item-selector">${escapeHtml(selector)}</div>
    <pre><code>${escapeHtml(html || '')}</code></pre>
  </div>`;
}

export function closeCodeModal() {
  document.querySelectorAll('.cm-backdrop').forEach(b => b.remove());
  document.documentElement.style.overflow = '';
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}