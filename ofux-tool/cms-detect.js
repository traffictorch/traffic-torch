/* /cms-detect.js
 * Shared CMS / framework detector for all Traffic Torch tools.
 *
 * Zero dependencies. Browser-first; also runs in Workers if you pass raw HTML.
 * Guarantees: never throws, always returns the same shape, deterministic output.
 *
 * Usage
 *   import { detectCMS } from '/cms-detect.js';
 *   detectCMS(document);                             // from a parsed Document
 *   detectCMS({ doc, html, url });                   // full context
 *   detectCMS(rawHtmlString, { url: 'https://x' });  // string only
 *
 * Result
 *   {
 *     id: 'wordpress' | 'shopify' | ... | 'unknown',
 *     name: 'WordPress' | 'Custom / Unknown',
 *     version: '6.4.2' | null,
 *     confidence: 'high' | 'medium' | 'low' | 'unknown',
 *     score: 28,
 *     signals: ['/wp-content/ asset path', 'w.org API link'],
 *     related: [{ id: 'elementor', name: 'Elementor' }],
 *     alternates: [{ id, name, score }],   // close runners-up
 *     mode: 'doc' | 'html' | 'empty'
 *   }
 */

const MAX_HTML_SCAN = 400_000;   // 400 KB — perf guard, keeps regex cost bounded
const MIN_REPORT_SCORE = 3;      // below this → 'unknown'
const TIE_MARGIN = 2;            // alternates within this delta are surfaced

const CONFIDENCE_TIERS = [
  { min: 15, level: 'high'   },
  { min: 7,  level: 'medium' },
  { min: 3,  level: 'low'    }
];

/* ──────────────────────────────────────────────────────────────────────────
 * Signatures
 *   weight guidance:  10-12 = unique/strong,  6-9 = corroborating,  3-5 = weak
 *   kinds: 'html' (regex on raw html), 'meta' (regex on meta[name=generator]),
 *          'selector' (CSS query), 'url' (regex on final URL), 'text' (regex on visible text)
 * ────────────────────────────────────────────────────────────────────────── */
const SIGNATURES = [
  {
    id: 'wordpress', name: 'WordPress',
    version: [
      { kind: 'meta', re: /WordPress\s+([\d.]+)/i },
      { kind: 'html', re: /wp-includes\/[^"']*?\?ver=([\d.]+)/i }
    ],
    signals: [
      { w: 12, kind: 'meta',     re: /WordPress/i,                             label: 'meta generator' },
      { w: 10, kind: 'html',     re: /\/wp-content\//i,                        label: '/wp-content/ asset path' },
      { w: 10, kind: 'html',     re: /\/wp-includes\//i,                       label: '/wp-includes/ asset path' },
      { w:  8, kind: 'html',     re: /\/wp-json(\/|["'?])/i,                   label: '/wp-json REST route' },
      { w:  8, kind: 'selector', sel: 'link[rel="https://api.w.org/"]',        label: 'w.org API link' },
      { w:  6, kind: 'html',     re: /\bwp-block-[a-z0-9-]+/i,                 label: 'Gutenberg block classes' },
      { w:  4, kind: 'html',     re: /wp-emoji|wp-embed(?!der)/i,              label: 'core wp scripts' },
      { w:  3, kind: 'html',     re: /\bwpApiSettings\b|\bwp\.customize\b/i,   label: 'wp JS globals' }
    ]
  },
  {
    id: 'shopify', name: 'Shopify',
    version: [ { kind: 'html', re: /Shopify\.theme\s*=\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/i } ],
    signals: [
      { w: 12, kind: 'html',     re: /cdn\.shopify\.com/i,                     label: 'cdn.shopify.com assets' },
      { w: 10, kind: 'html',     re: /Shopify\.theme\s*=|shopify-section/i,    label: 'Shopify.theme / section wrapper' },
      { w:  8, kind: 'html',     re: /\/cdn\/shop\//i,                         label: '/cdn/shop/ path' },
      { w:  6, kind: 'selector', sel: 'script[src*="shopify"]',                label: 'Shopify runtime script' },
      { w:  5, kind: 'url',      re: /\.myshopify\.com/i,                      label: 'myshopify.com hostname' },
      { w:  4, kind: 'html',     re: /shopify-payment-button|shopify-buy/i,    label: 'Shopify buy/payment UI' }
    ]
  },
  {
    id: 'wix', name: 'Wix',
    version: [ { kind: 'html', re: /wixstatic\.com\/[^"']*?\/([\d.]+)\//i } ],
    signals: [
      { w: 12, kind: 'html',     re: /static\.parastorage\.com|wixstatic\.com/i, label: 'Wix CDN host' },
      { w: 10, kind: 'html',     re: /wix-image|data-wix-/i,                    label: 'Wix image/data attrs' },
      { w:  8, kind: 'selector', sel: 'meta[name="generator"][content*="Wix"]', label: 'Wix generator meta' },
      { w:  6, kind: 'html',     re: /wixCode|wixBiSession/i,                   label: 'Wix JS globals' },
      { w:  4, kind: 'url',      re: /wixsite\.com|wix\.com/i,                  label: 'wix*.com hostname' }
    ]
  },
  {
    id: 'squarespace', name: 'Squarespace',
    version: [ { kind: 'html', re: /squarespace[^"']*?v=([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'html',     re: /static1?\.squarespace\.com/i,            label: 'Squarespace CDN host' },
      { w: 10, kind: 'html',     re: /data-squarespace|sqs-block/i,            label: 'Squarespace block attrs' },
      { w:  8, kind: 'selector', sel: 'meta[name="generator"][content*="Squarespace"]', label: 'Squarespace generator meta' },
      { w:  6, kind: 'html',     re: /Static\.SQUARESPACE_CONTEXT/i,           label: 'Squarespace JS context' },
      { w:  4, kind: 'url',      re: /squarespace\.com/i,                      label: 'squarespace.com hostname' }
    ]
  },
  {
    id: 'webflow', name: 'Webflow',
    version: [ { kind: 'selector', sel: 'html[data-wf-site]', attr: 'data-wf-site' } ],
    signals: [
      { w: 12, kind: 'html',     re: /assets(?:-global)?\.website-files\.com/i, label: 'Webflow asset host' },
      { w: 10, kind: 'html',     re: /data-wf-(?:site|page|domain|id)/i,        label: 'Webflow data attrs' },
      { w:  8, kind: 'selector', sel: 'meta[name="generator"][content*="Webflow"]', label: 'Webflow generator meta' },
      { w:  6, kind: 'html',     re: /\bw-nav\b|\bw-container\b|\bw-slider\b/i, label: 'Webflow component classes' }
    ]
  },
  {
    id: 'drupal', name: 'Drupal',
    version: [ { kind: 'meta', re: /Drupal\s+([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'meta',     re: /Drupal/i,                                label: 'meta generator' },
      { w: 10, kind: 'html',     re: /\/sites\/(?:default|all)\/files\//i,     label: '/sites/default/files path' },
      { w:  8, kind: 'html',     re: /drupalSettings|Drupal\.behaviors/i,      label: 'drupalSettings JS' },
      { w:  6, kind: 'html',     re: /\/core\/misc\/drupal\.js/i,              label: 'Drupal core script' },
      { w:  5, kind: 'selector', sel: 'link[rel="shortlink"]',                 label: 'shortlink rel' }
    ]
  },
  {
    id: 'joomla', name: 'Joomla',
    version: [ { kind: 'meta', re: /Joomla!?\s+([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'meta',     re: /Joomla/i,                                label: 'meta generator' },
      { w: 10, kind: 'html',     re: /\/components\/com_[a-z0-9_]+\//i,        label: '/components/com_* path' },
      { w:  8, kind: 'html',     re: /\/modules\/mod_[a-z0-9_]+\//i,           label: '/modules/mod_* path' },
      { w:  6, kind: 'html',     re: /Joomla\.getOptions|joomla-script-options/i, label: 'Joomla JS globals' }
    ]
  },
  {
    id: 'ghost', name: 'Ghost',
    version: [ { kind: 'meta', re: /Ghost\s+([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'meta',     re: /Ghost/i,                                 label: 'meta generator' },
      { w: 10, kind: 'html',     re: /\/content\/images\//i,                   label: '/content/images path' },
      { w:  8, kind: 'html',     re: /cdn\.ghost\.org|ghost(?:-|\.)url/i,      label: 'Ghost CDN / global' },
    ]
  },
  {
    id: 'hubspot', name: 'HubSpot CMS',
    version: [ { kind: 'html', re: /hs-scripts[^"']*?v=([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'html',     re: /hs-scripts\.com|hubspot\.com\/hs/i,      label: 'HubSpot script host' },
      { w: 10, kind: 'html',     re: /hs-analytics|hsforms\.net|hs-cta/i,      label: 'HubSpot analytics/forms' },
      { w:  6, kind: 'selector', sel: 'meta[name="generator"][content*="HubSpot"]', label: 'HubSpot generator meta' },
      { w:  4, kind: 'html',     re: /\bhbspt\b|\b_hsq\b/i,                    label: 'HubSpot JS queue' }
    ]
  },
  {
    id: 'magento', name: 'Magento',
    version: [ { kind: 'html', re: /static\/version\d*\/([\d.]+)\//i } ],
    signals: [
      { w: 12, kind: 'html',     re: /\/skin\/frontend\/|mage\/cookies/i,      label: 'Magento skin/mage paths' },
      { w: 10, kind: 'html',     re: /Magento_|mage-init|Magento\\/i,          label: 'Magento JS modules' },
      { w:  8, kind: 'html',     re: /static\/version\d+\//i,                  label: 'static/version path' },
      { w:  6, kind: 'selector', sel: 'script[type="text/x-magento-init"]',    label: 'x-magento-init block' }
    ]
  },
  {
    id: 'bigcommerce', name: 'BigCommerce',
    version: [ { kind: 'html', re: /bigcommerce[^"']*?v=([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'html',     re: /cdn\d*\.bigcommerce\.com/i,              label: 'BigCommerce CDN host' },
      { w:  8, kind: 'html',     re: /bigcommerce\.com\/s-/i,                  label: 'BigCommerce storefront path' },
      { w:  6, kind: 'selector', sel: 'meta[name="generator"][content*="BigCommerce"]', label: 'BigCommerce generator meta' }
    ]
  },
  {
    id: 'prestashop', name: 'PrestaShop',
    version: [ { kind: 'meta', re: /PrestaShop\s+([\d.]+)/i } ],
    signals: [
      { w: 12, kind: 'meta',     re: /PrestaShop/i,                            label: 'meta generator' },
      { w: 10, kind: 'html',     re: /\/themes\/[a-z0-9_-]+\/assets\//i,       label: 'PrestaShop theme assets' },
      { w:  8, kind: 'html',     re: /prestashop|presta[-_]?shop/i,            label: 'PrestaShop global' }
    ]
  },

  /* ── Frameworks (usually reported as `related`, not as the CMS itself) ── */
  {
    id: 'nextjs', name: 'Next.js', framework: true,
    signals: [
      { w: 10, kind: 'selector', sel: 'script#__NEXT_DATA__',                  label: '__NEXT_DATA__ script' },
      { w:  8, kind: 'html',     re: /\/_next\/static\//i,                     label: '/_next/static path' },
      { w:  6, kind: 'html',     re: /\b__NEXT_DATA__\b|\bnext\/router\b/i,    label: 'Next.js runtime' }
    ]
  },
  {
    id: 'nuxt', name: 'Nuxt', framework: true,
    signals: [
      { w: 10, kind: 'html',     re: /\/_nuxt\//i,                             label: '/_nuxt/ path' },
      { w:  8, kind: 'html',     re: /\b__NUXT__\b|\bnuxt(?:App|Config)\b/i,   label: 'Nuxt runtime' }
    ]
  },
  {
    id: 'gatsby', name: 'Gatsby', framework: true,
    signals: [
      { w: 10, kind: 'html',     re: /\b___gatsby\b|\bgatsby-focus-wrapper\b/i, label: 'Gatsby wrapper' },
      { w:  6, kind: 'html',     re: /\/page-data\//i,                          label: '/page-data path' }
    ]
  },
  {
    id: 'astro', name: 'Astro', framework: true,
    signals: [
      { w: 10, kind: 'selector', sel: 'meta[name="generator"][content*="Astro"]', label: 'Astro generator meta' },
      { w:  8, kind: 'html',     re: /data-astro-(?:cid|source|is:)/i,          label: 'Astro data attrs' }
    ]
  },

  /* ── WordPress builders (reported as `related` when WordPress is detected) ── */
  {
    id: 'elementor', name: 'Elementor', builderFor: 'wordpress',
    signals: [
      { w: 8, kind: 'html', re: /\/elementor\/assets\/|elementor-widget-/i, label: 'Elementor assets' },
      { w: 6, kind: 'html', re: /data-elementor-(?:type|id)/i,              label: 'Elementor data attrs' }
    ]
  },
  {
    id: 'divi', name: 'Divi', builderFor: 'wordpress',
    signals: [
      { w: 8, kind: 'html', re: /\/et_pb_|\bet_pb_section\b/i, label: 'Divi assets' },
      { w: 6, kind: 'html', re: /\bet_divi\b|et-core-common/i, label: 'Divi theme files' }
    ]
  },
  {
    id: 'wpbakery', name: 'WPBakery', builderFor: 'wordpress',
    signals: [
      { w: 8, kind: 'html', re: /js_composer|wpb_vc_|vc_row/i, label: 'WPBakery assets' }
    ]
  },
  {
    id: 'woocommerce', name: 'WooCommerce', builderFor: 'wordpress',
    signals: [
      { w: 8, kind: 'html', re: /\/woocommerce(?:-assets|\/)/i,       label: 'WooCommerce assets' },
      { w: 6, kind: 'html', re: /\bwc-ajax\b|\bwoocommerce-page\b/i,  label: 'WooCommerce body/JS' }
    ]
  }
];

/* ──────────────────────────────────────────────────────────────────────────
 * Input normalization
 * ────────────────────────────────────────────────────────────────────────── */

function isDocument(x) {
  return !!x && typeof x === 'object' && x.nodeType === 9 && typeof x.querySelector === 'function';
}

function normalizeInput(input, options) {
  const out = {
    doc: null,
    html: '',
    url: (options && options.url) || '',
    mode: 'empty'
  };

  try {
    if (typeof input === 'string') {
      out.html = input;
      out.mode = input.trim() ? 'html' : 'empty';
      return out;
    }
    if (isDocument(input)) {
      out.doc = input;
      out.html = safeOuterHTML(input);
      out.mode = out.html ? 'doc' : 'empty';
      if (!out.url && typeof input.location !== 'undefined' && input.location && input.location.href) {
        out.url = input.location.href;
      }
      return out;
    }
    if (input && typeof input === 'object') {
      if (isDocument(input.doc)) out.doc = input.doc;
      if (typeof input.html === 'string') out.html = input.html;
      if (!out.html && out.doc) out.html = safeOuterHTML(out.doc);
      if (typeof input.url === 'string' && !out.url) out.url = input.url;
      out.mode = out.doc ? 'doc' : (out.html ? 'html' : 'empty');
      return out;
    }
  } catch (_) {
    /* fall through to empty */
  }
  return out;
}

function safeOuterHTML(doc) {
  try {
    if (doc.documentElement && typeof doc.documentElement.outerHTML === 'string') {
      return doc.documentElement.outerHTML;
    }
  } catch (_) {}
  return '';
}

function safeMetaGenerator(doc) {
  if (!doc) return '';
  try {
    const metas = doc.querySelectorAll('meta');
    let out = '';
    for (const m of metas) {
      const name = (m.getAttribute && m.getAttribute('name')) || '';
      if (name && name.toLowerCase() === 'generator') {
        out += ((m.getAttribute('content') || '') + '\n');
      }
    }
    return out;
  } catch (_) {
    return '';
  }
}

function safeQuerySelector(doc, sel) {
  if (!doc) return null;
  try { return doc.querySelector(sel); } catch (_) { return null; }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Evidence collection & scoring
 * ────────────────────────────────────────────────────────────────────────── */

function scoreOne(sig, ctx) {
  let score = 0;
  const hits = [];

  for (const s of (sig.signals || [])) {
    let matched = false;
    try {
      if (s.kind === 'html' && ctx.html) {
        matched = s.re.test(ctx.html);
      } else if (s.kind === 'meta' && ctx.meta) {
        matched = s.re.test(ctx.meta);
      } else if (s.kind === 'url' && ctx.url) {
        matched = s.re.test(ctx.url);
      } else if (s.kind === 'selector' && ctx.doc) {
        matched = !!safeQuerySelector(ctx.doc, s.sel);
      } else if (s.kind === 'text' && ctx.text) {
        matched = s.re.test(ctx.text);
      }
    } catch (_) {
      matched = false;   // a broken regex must never kill detection
    }
    if (matched) {
      score += s.w;
      hits.push(s.label || s.kind);
    }
  }

  return { score, hits };
}

function extractVersion(sig, ctx) {
  if (!sig.version || !sig.version.length) return null;
  for (const v of sig.version) {
    try {
      let source = '';
      if (v.kind === 'html') source = ctx.html;
      else if (v.kind === 'meta') source = ctx.meta;
      else if (v.kind === 'url') source = ctx.url;

      if (v.kind === 'selector' && ctx.doc) {
        const el = safeQuerySelector(ctx.doc, v.sel);
        if (el && v.attr) {
          const val = el.getAttribute(v.attr);
          if (val) return String(val).slice(0, 40);
        }
        continue;
      }
      if (source && v.re) {
        const m = source.match(v.re);
        if (m && m[1]) return String(m[1]).slice(0, 40);
      }
    } catch (_) { /* skip this version probe */ }
  }
  return null;
}

function confidenceFor(score) {
  for (const tier of CONFIDENCE_TIERS) {
    if (score >= tier.min) return tier.level;
  }
  return 'unknown';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────────────────── */

export function detectCMS(input, options = {}) {
  const unknownResult = (mode) => ({
    id: 'unknown',
    name: 'Custom / Unknown',
    version: null,
    confidence: 'unknown',
    score: 0,
    signals: [],
    related: [],
    alternates: [],
    mode: mode || 'empty'
  });

  try {
    const ctx = normalizeInput(input, options);

    if (!ctx.html && !ctx.doc) return unknownResult('empty');

    // Bound the HTML scan — huge pages can otherwise make regexes expensive.
    if (ctx.html && ctx.html.length > MAX_HTML_SCAN) {
      ctx.html = ctx.html.slice(0, MAX_HTML_SCAN);
    }

    ctx.meta = safeMetaGenerator(ctx.doc);

    // Score every signature (CMS + framework + builder in one pass).
    const scored = [];
    for (const sig of SIGNATURES) {
      const { score, hits } = scoreOne(sig, ctx);
      if (score > 0) scored.push({ sig, score, hits });
    }

    if (!scored.length) return unknownResult(ctx.mode);

    // Stable sort: primary = score desc, secondary = id asc (deterministic ties).
    scored.sort((a, b) => (b.score - a.score) || (a.sig.id < b.sig.id ? -1 : 1));

    // Pick the top scoring non-framework, non-builder entry as the CMS.
    const primary = scored.find(e => !e.sig.framework && !e.sig.builderFor);

    if (!primary || primary.score < MIN_REPORT_SCORE) {
      // No clear CMS, but maybe a framework was detected.
      const fw = scored.find(e => e.sig.framework);
      if (fw) {
        return {
          id: 'unknown',
          name: 'Custom / Unknown',
          version: null,
          confidence: 'low',
          score: fw.score,
          signals: fw.hits,
          related: [{ id: fw.sig.id, name: fw.sig.name }],
          alternates: [],
          mode: ctx.mode
        };
      }
      return unknownResult(ctx.mode);
    }

    // Related: builders for this CMS + any framework signals.
    const related = [];
    for (const e of scored) {
      if (e === primary) continue;
      if (e.sig.builderFor && e.sig.builderFor === primary.sig.id && e.score >= 6) {
        related.push({ id: e.sig.id, name: e.sig.name });
      } else if (e.sig.framework && e.score >= 6) {
        related.push({ id: e.sig.id, name: e.sig.name });
      }
    }

    // Alternates: other CMSes whose score is within TIE_MARGIN of the winner.
    const alternates = [];
    for (const e of scored) {
      if (e === primary) continue;
      if (e.sig.framework || e.sig.builderFor) continue;
      if (e.score >= MIN_REPORT_SCORE && (primary.score - e.score) <= TIE_MARGIN) {
        alternates.push({ id: e.sig.id, name: e.sig.name, score: e.score });
      }
    }

    const result = {
      id: primary.sig.id,
      name: primary.sig.name,
      version: extractVersion(primary.sig, ctx),
      confidence: confidenceFor(primary.score),
      score: primary.score,
      signals: primary.hits,
      related,
      alternates,
      mode: ctx.mode
    };

    if (options.debug) {
      result._debug = scored.map(e => ({
        id: e.sig.id, score: e.score, hits: e.hits
      }));
    }

    return result;

  } catch (_) {
    // Absolute last line of defence — never let detection break a tool.
    return unknownResult('empty');
  }
}

/* Optional: attach to window so non-module scripts can use it too. */
if (typeof window !== 'undefined') {
  window.TrafficTorch = window.TrafficTorch || {};
  window.TrafficTorch.detectCMS = detectCMS;
}