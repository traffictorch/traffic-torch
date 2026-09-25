// code-snippets.js — v6
// Rules match BOTH internal UX labels and the SEO/AEO worker labels.
// SEO labels look like: "label (critical, 1 node(s)): Form elements must have labels"

const RULES = [
  /* ── UX (page-wide → sel: null) ──────────────────────────── */
  { re: /flesch reading ease/i,       sel: null },
  { re: /flesch[\s-]?kincaid|kincaid grade/i, sel: null },
  { re: /average sentence length/i,   sel: null },
  { re: /paragraph density/i,         sel: null },
  { re: /text scannability/i,         sel: null },
  { re: /link density evaluation/i,   sel: null },
  { re: /menu structure clarity/i,    sel: null },
  { re: /internal linking balance/i,  sel: null },
  { re: /cta prominence/i,            sel: null },
  { re: /responsive breakpoints/i,    sel: null },
  { re: /wcag compliance/i,           sel: null },
  { re: /color contrast ratios/i,     sel: null },

  /* ── UX (real elements) ──────────────────────────────────── */
  { re: /alt text coverage/i,         sel: 'img:not([alt])', limit: 10 },
  { re: /viewport configuration/i,    sel: 'meta[name="viewport"]', limit: 1 },
  { re: /pwa readiness/i,             sel: 'link[rel="manifest"]', limit: 3 },
  { re: /font optimization/i,         sel: 'link[href*="fonts"]', limit: 6 },
  { re: /script optimization/i,       sel: 'script[src]:not([async]):not([defer])', limit: 10 },
  { re: /script bloat/i,              sel: 'script[src]', limit: 10 },
  { re: /lazy loading media/i,        sel: 'img:not([loading="lazy"])', limit: 20 },
  { re: /image optimization/i,        sel: 'img:not([src$=".webp"]):not([src$=".avif"])', limit: 20 },
  { re: /asset volume/i,              sel: 'img', limit: 10 },
  { re: /semantic html structure/i,   sel: 'div', limit: 10 },
  { re: /touch target size/i,         sel: 'a, button, [role="button"]',
                                      filter: { maxH: 44, maxW: 44 }, limit: 6 },

  /* ── SEO/AEO worker (axe-style labels) ───────────────────── */
  { re: /color[\s-]?contrast/i,       sel: '[style*="color"], [style*="background"]',
                                      fallback: 'p, h1, h2, h3, a, li, span', limit: 5 },
  { re: /label.*form elements must have labels|form elements must have labels/i,
                                      sel: 'input:not([type="hidden"]):not([aria-label]):not([id]), select:not([id]):not([aria-label])', limit: 5 },
  { re: /form elements do not have associated labels/i,
                                      sel: 'input:not([type="hidden"]):not([aria-label]):not([id]), select:not([id]):not([aria-label])', limit: 5 },
  { re: /link-name|links must have discernible|links? do not have a discernible/i,
                                      sel: 'a:empty, a:not([aria-label]):empty', limit: 5 },
  { re: /link[\s-]?in[\s-]?text[\s-]?block/i,
                                      sel: 'p a, li a', limit: 5 },
  { re: /button-name|buttons must have discernible|buttons? do not have an accessible name/i,
                                      sel: 'button:empty, button:not([aria-label]):empty', limit: 5 },
  { re: /meta-viewport|zooming and scaling must not be disabled/i,
                                      sel: 'meta[name="viewport"]', limit: 1 },
  { re: /user-scalable=no|maximum-scale=1/i,
                                      sel: 'meta[name="viewport"]', limit: 1 },
  { re: /aria-required-children/i,    sel: null },
  { re: /aria-valid-attr-value/i,     sel: null },
  { re: /image.*missing width.*height|images? without explicit width|image elements do not have explicit/i,
                                      sel: 'img:not([width]):not([height])', limit: 6 },
  { re: /missing page title|no page title|title too long|title.*\d+.*chars/i,
                                      sel: 'title', limit: 1 },
  { re: /missing meta description|meta description (short|.*\d+.*chars)/i,
                                      sel: 'meta[name="description"]', limit: 1 },
  { re: /no h1|missing h1/i,          sel: 'h1', limit: 1, fallback: 'h2' },
  { re: /h1s? on page/i,              sel: 'h1', limit: 3 },
  { re: /canonical/i,                 sel: 'link[rel="canonical"]', limit: 1 },
  { re: /noindex|nofollow/i,          sel: 'meta[name="robots"]', limit: 1 },
  { re: /failed network request/i,    sel: null },
  { re: /service worker/i,            sel: null },
  { re: /web app manifest|manifest link|no web app manifest/i,
                                      sel: 'link[rel="manifest"]', limit: 1 },
  { re: /theme-color meta|missing theme-color/i,
                                      sel: 'meta[name="theme-color"]', limit: 1 },
  { re: /apple-mobile-web-app-capable/i, sel: null },
  { re: /apple-touch-icon/i,          sel: 'link[rel*="apple-touch-icon"]', limit: 3 },
  { re: /mask-icon/i,                 sel: 'link[rel="mask-icon"]', limit: 1 },
  { re: /HSTS header/i,               sel: null },
  { re: /large inline style block/i,  sel: 'style', limit: 6 },
  { re: /large inline script/i,       sel: 'script:not([src])', limit: 6 },
  { re: /image.*over 200KB|large image/i, sel: 'img', limit: 3 },
  { re: /no webp|avif|modern formats/i,
                                      sel: 'img:not([src$=".webp"]):not([src$=".avif"])', limit: 10 },
  { re: /css total|purge unused css/i, sel: 'link[rel="stylesheet"]', limit: 10 },
  { re: /web fonts without font-display|font-display: swap/i,
                                      sel: 'link[href*="fonts"]', limit: 6 },
  { re: /heavyweights detected/i,     sel: 'script[src*="googletagmanager"], script[src*="google-analytics"]', limit: 5 },
  { re: /safe-area insets/i,          sel: null },
  { re: /skip-to-content link/i,      sel: null },
  { re: /webmcp/i,                    sel: null },
  { re: /ttfb|time to first byte/i,   sel: null },
  { re: /fcp.*slow|first contentful/i, sel: null },
  { re: /cls[:.]|layout shift/i,      sel: null },
  { re: /live dom mutations|dom mutations/i, sel: null },
  { re: /nodes added\/removed/i,      sel: null },
  { re: /high div count/i,            sel: 'div', limit: 6 },
  { re: /heading order violation/i,   sel: 'h1, h2, h3, h4, h5, h6', limit: 6 },
  { re: /low semantic html usage|div-soup/i, sel: 'div', limit: 6 },
  { re: /text[\s-]?to[\s-]?code|text density|very low text/i, sel: 'p', limit: 5 },
  { re: /semantic html ratio/i,       sel: 'div, main, article, section', limit: 6 },
  { re: /paragraph tags/i,            sel: 'p', limit: 5 },
  { re: /json-ld block|schema type/i, sel: 'script[type="application/ld+json"]', limit: 3 },
  { re: /crawler blocking|ai crawler/i, sel: null },
  { re: /list\(s\)|heading order valid/i, sel: 'ul, ol', limit: 5 },
  { re: /avg paragraph/i,             sel: 'p', limit: 3 },
  { re: /exactly one h1/i,            sel: 'h1', limit: 1 },
  { re: /content mostly present/i,    sel: null },
  { re: /no js errors/i,              sel: null },
  { re: /h1 present in raw html/i,    sel: 'h1', limit: 1 },
  { re: /noscript/i,                  sel: 'noscript', limit: 1 },
  { re: /render fidelity/i,           sel: null },
  { re: /dom stability/i,             sel: null },
  { re: /render blocking performance/i, sel: null },
  { re: /content stability/i,         sel: null },
  { re: /no llms\.txt/i,              sel: null },
  { re: /no structured data/i,        sel: 'script[type="application/ld+json"]', limit: 1 },
  { re: /no visible author byline/i,  sel: 'body', limit: 1 },
  { re: /no publish\/update date/i,   sel: 'time, meta[property="article:published_time"]', limit: 1 }
];

export function deriveRule(label) {
  if (!label) return null;
  for (const r of RULES) if (r.re.test(label)) return r;
  return null;
}

export function ruleKey(rule) {
  if (!rule || !rule.sel) return null;
  if (rule.filter) return `${rule.sel}|${rule.filter.maxH || 0}|${rule.filter.maxW || 0}`;
  return rule.sel;
}

export function extractSnippets(html, label) {
  if (!html) return { rule: null, snippets: [] };
  const rule = deriveRule(label);
  if (!rule || !rule.sel) return { rule, snippets: [] };

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const snippets = [];
  const limit = rule.limit || 3;

  try {
    let nodes = Array.from(doc.querySelectorAll(rule.sel)).slice(0, limit);
    if (!nodes.length && rule.fallback) {
      nodes = Array.from(doc.querySelectorAll(rule.fallback)).slice(0, limit);
    }
    for (const n of nodes) {
      let s = n.outerHTML || '';
      if (s.length > 900) s = s.slice(0, 900) + '\n… (truncated)';
      snippets.push({ selector: rule.sel, html: s });
    }
  } catch (_) {}

  return { rule, snippets };
}

export function openCodeModal(title, snippets) {
  closeCodeModal();
  const back = document.createElement('div');
  back.className = 'cm-backdrop';
  back.innerHTML = `
    <div class="cm-modal" role="dialog" aria-label="Affected code">
      <div class="cm-head">
        <span class="cm-title">${escapeHtml(title || 'Affected code')}</span>
        <button class="cm-close" aria-label="Close">×</button>
      </div>
      <div class="cm-body">
        ${snippets.length
          ? snippets.map(s => `
              <div class="cm-item">
                <div class="cm-item-selector">${escapeHtml(s.selector)}</div>
                <pre><code>${escapeHtml(s.html)}</code></pre>
              </div>`).join('')
          : '<div class="cm-empty">No matching elements found on the rendered page.</div>'}
      </div>
    </div>`;
  document.documentElement.appendChild(back);
  document.documentElement.style.overflow = 'hidden';

  back.querySelector('.cm-close').addEventListener('click', closeCodeModal);
  back.addEventListener('click', e => { if (e.target === back) closeCodeModal(); });
  const onKey = e => { if (e.key === 'Escape') { closeCodeModal(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

export function closeCodeModal() {
  document.querySelectorAll('.cm-backdrop').forEach(b => b.remove());
  document.documentElement.style.overflow = '';
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
