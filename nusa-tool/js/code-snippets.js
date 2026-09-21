// code-snippets.js — v4
// Only rules whose target elements have physical dimensions get a pin.
// Meta/link/script rules are page-wide → sel: null (fix panel only).

const RULES = [
  /* ── UX — page-wide, no pin ───────────────────────────────── */
  { re: /flesch reading ease/i,       sel: null },
  { re: /flesch-kincaid grade/i,      sel: null },
  { re: /average sentence length/i,   sel: null },
  { re: /paragraph density/i,         sel: null },
  { re: /text scannability/i,         sel: null },
  { re: /link density evaluation/i,   sel: null },
  { re: /menu structure clarity/i,    sel: null },
  { re: /internal linking balance/i,  sel: null },
  { re: /CTA prominence/i,            sel: null },
  { re: /responsive breakpoints/i,    sel: null },
  { re: /wcag compliance/i,           sel: null },
  { re: /color contrast ratios/i,     sel: null },

  // Zero-dimension elements — no pin possible
  { re: /viewport configuration/i,    sel: null },
  { re: /PWA readiness/i,             sel: null },
  { re: /font optimization/i,         sel: null },
  { re: /script optimization/i,       sel: null },
  { re: /script bloat/i,              sel: null },

  /* ── UX — pin-capable (elements have size) ────────────────── */
  { re: /alt text coverage/i,         sel: 'img:not([alt])', limit: 20 },
  { re: /lazy loading media/i,        sel: 'img:not([loading="lazy"])', limit: 20 },
  { re: /image optimization/i,        sel: 'img:not([src$=".webp"]):not([src$=".avif"])', limit: 20 },
  { re: /asset volume/i,              sel: 'img', limit: 20 },
  { re: /semantic html structure/i,   sel: 'main, article, section, nav, header, footer', limit: 20 },
  { re: /touch target size/i,         sel: 'a, button, [role="button"]',
                                      filter: { maxH: 44, maxW: 44 }, limit: 20 },

  /* ── SEO / AEO (existing) ─────────────────────────────────── */
  { re: /image.*missing alt text|images? do not have alt/i, sel: 'img:not([alt])', limit: 3 },
  { re: /no responsive viewport|viewport meta tag/i, sel: 'head', limit: 1, head: true },
  { re: /readability weak|readability score/i,       sel: 'p', limit: 3 },
  { re: /accessibility below|WCAG AA/i,              sel: 'img:not([alt]), [role="presentation"]', limit: 3 },
  { re: /missing semantic landmarks/i,               sel: 'body > *', limit: 4 },
  { re: /render[\s-]?blocking/i,                     sel: 'script[src]:not([async]):not([defer]), link[rel="stylesheet"]:not([media])', limit: 5 },
  { re: /missing page title|no page title/i,         sel: 'title', limit: 1 },
  { re: /title.*\d+\s*chars|title too long/i,        sel: 'title', limit: 1 },
  { re: /missing meta description/i,                 sel: 'meta[name="description"]', limit: 1, head: true },
  { re: /no h1 on page/i,                            sel: 'h1', limit: 1, fallback: 'h2' },
  { re: /h1s? on page/i,                             sel: 'h1', limit: 3 },
  { re: /color[\s-]?contrast/i,                      sel: '[style*="color"], [style*="background"]', fallback: 'p, h1, h2, h3, a, li, span', limit: 5 },
  { re: /canonical/i,                                sel: 'link[rel="canonical"]', limit: 1, head: true },
  { re: /noindex|nofollow/i,                         sel: 'meta[name="robots"]', limit: 1, head: true },
  { re: /image elements do not have explicit width and height/i, sel: 'img:not([width]):not([height])', limit: 5 },
  { re: /links? do not have a discernible name/i,    sel: 'a:not([aria-label]):empty, a:empty', limit: 5 },
  { re: /buttons? do not have an accessible name/i,  sel: 'button:empty, button:not([aria-label]):empty', limit: 5 },
  { re: /form elements do not have associated labels/i, sel: 'input:not([type="hidden"]):not([aria-label]):not([id]), select:not([id]):not([aria-label])', limit: 5 },
  { re: /service worker/i,                           sel: 'body', limit: 1 },
  { re: /manifest/i,                                 sel: 'link[rel="manifest"]', limit: 1, head: true },
  { re: /HTTPS/i,                                    sel: 'head', limit: 1, head: true },
  { re: /viewport/i,                                 sel: 'meta[name="viewport"]', limit: 1, head: true },
  { re: /render fidelity/i,                          sel: 'body', limit: 1 },
  { re: /dom stability/i,                            sel: 'body', limit: 1 },
  { re: /content extractability|semantic html usage|div-soup/i, sel: 'main, article, section', limit: 3 },
  { re: /schema parse|structured data|json-ld/i,     sel: 'script[type="application/ld+json"]', limit: 3 },
  { re: /crawler accessibility/i,                    sel: 'meta[name="robots"]', limit: 1, head: true },
  { re: /text density|text[\s-]?to[\s-]?code|text.*ratio/i, sel: 'p', limit: 3 },
  { re: /semantic structure/i,                       sel: 'main, nav, header, footer, article', limit: 4 },
  { re: /content stability/i,                        sel: 'body', limit: 1 },
  { re: /no noscript/i,                              sel: 'body', limit: 1 },
  { re: /h1 present in raw html/i,                   sel: 'h1', limit: 1 },
  { re: /no visible author byline/i,                 sel: 'body', limit: 1 },
  { re: /no publish\/update date/i,                  sel: 'time, meta[property="article:published_time"]', limit: 1 },
  { re: /no faqpage schema/i,                        sel: 'body', limit: 1 },
  { re: /no llms\.txt/i,                             sel: null },
  { re: /no structured data/i,                       sel: 'script[type="application/ld+json"]', limit: 1, head: true }
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
  document.body.appendChild(back);

  back.querySelector('.cm-close').addEventListener('click', closeCodeModal);
  back.addEventListener('click', e => { if (e.target === back) closeCodeModal(); });
  const onKey = e => { if (e.key === 'Escape') { closeCodeModal(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

export function closeCodeModal() {
  document.querySelectorAll('.cm-backdrop').forEach(b => b.remove());
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
