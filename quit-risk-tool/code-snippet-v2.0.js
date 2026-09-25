// code-snippet-v2.0.js
// Data-driven "Show the code" for the Quit Risk Tool.
// Displays the ACTUAL failing HTML element wherever possible.
// For content checks (Flesch, scannability) it shows the offending
// text or the numbers, because there is no code to display.

// ─────────────────────────────────────────────────────────────
// Dispatch: failure name → renderer
// ─────────────────────────────────────────────────────────────
const RENDERERS = {
  'Flesch Reading Ease Score': renderComplexSentences,
  'Flesch-Kincaid Grade Level': renderComplexSentences,
  'Average Sentence Length': renderComplexSentences,
  'Paragraph Density & Length': renderDenseParagraphs,
  'Overall Text Scannability': renderScannabilitySummary,

  'Link Density Evaluation': renderLinkDensity,
  'Menu Structure Clarity': renderMenuStructure,
  'Internal Linking Balance': renderInternalLinks,
  'CTA Prominence & Visibility': renderCTAs,

  'Alt Text Coverage': renderAltMissing,
  'Color Contrast Ratios': renderContrast,
  'Semantic HTML Structure': renderSemantics,
  'Overall WCAG Compliance': renderWCAG,

  'Viewport Configuration': renderViewport,
  'Responsive Breakpoints': renderResponsive,
  'Touch Target Size': renderTouchTargets,
  'PWA Readiness Indicators': renderPWA,
  'PWA Readiness': renderPWA,

  'Asset Volume Flags': renderAssetVolume,
  'Asset Volume & Script Bloat': renderAssetVolume,
  'Script Bloat Detection': renderScriptBloat,
  'Font Optimization': renderFonts,
  'Lazy Loading Media': renderLazyLoading,
  'Image Optimization': renderImageFormat,
  'Script Optimization': renderBlockingScripts,
  'Script Minification & Deferral': renderBlockingScripts,
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
let _cachedDoc = null;
let _cachedHtmlRef = null;

function getDoc(html) {
  if (!html) return null;
  if (_cachedDoc && _cachedHtmlRef === html) return _cachedDoc;
  try {
    _cachedDoc = new DOMParser().parseFromString(html, 'text/html');
    _cachedHtmlRef = html;
    return _cachedDoc;
  } catch {
    _cachedDoc = null;
    _cachedHtmlRef = null;
    return null;
  }
}

function codeBlock(html, maxLen = 800) {
  const s = String(html == null ? '' : html);
  const cut = s.length > maxLen ? s.slice(0, maxLen) + '\n… (truncated)' : s;
  return `<pre class="cs-item__pre"><code>${escapeHtml(cut)}</code></pre>`;
}

function metaRow(parts) {
  return `<div class="cs-item__meta">${parts.filter(Boolean).join(' · ')}</div>`;
}

function empty(msg) {
  return `<p class="cs-empty">${escapeHtml(msg)}</p>`;
}

// ─────────────────────────────────────────────────────────────
// READABILITY — content, not code. Show the offending text.
// ─────────────────────────────────────────────────────────────
function renderComplexSentences(uxData) {
  const list = uxData.complexSentences || [];
  if (!list.length) return empty('No sentences long enough to flag.');
  return `
    <p class="cs-intro">The five longest sentences on this page. Long sentences raise both Flesch scores.</p>
    ${list.map((s, i) => `
      <div class="cs-item">
        ${metaRow([`<span class="cs-badge">#${i + 1}</span>`, `${s.wordCount} words`])}
        <div class="cs-item__text">"${escapeHtml(s.text)}${s.text.length >= 200 ? '…' : ''}"</div>
      </div>`).join('')}
  `;
}

function renderDenseParagraphs(uxData, html) {
  const doc = getDoc(html);
  const paras = (uxData.paragraphTexts || [])
    .map(text => ({ text, words: text.trim().split(/\s+/).filter(Boolean).length }))
    .filter(p => p.words >= 20)
    .sort((a, b) => b.words - a.words)
    .slice(0, 5);
  if (!paras.length) return empty('No dense paragraphs found.');
  return `
    <p class="cs-intro">The five longest paragraphs. Aim for 3–5 sentences (roughly 40–80 words).</p>
    ${paras.map(p => {
      let outerHTML = null;
      if (doc) {
        for (const el of doc.querySelectorAll('p, li')) {
          if ((el.textContent || '').trim() === p.text) {
            outerHTML = el.outerHTML;
            break;
          }
        }
      }
      return `
        <div class="cs-item">
          ${metaRow([`<span class="cs-badge ${p.words > 80 ? 'cs-badge--red' : ''}">${p.words} words</span>`])}
          ${outerHTML ? codeBlock(outerHTML, 700) : `<div class="cs-item__text">${escapeHtml(p.text.slice(0, 300))}…</div>`}
        </div>`;
    }).join('')}
  `;
}

function renderScannabilitySummary(uxData) {
  const words = uxData.wordCount || 0;
  const rows = [
    { label: 'Bold / strong runs',   value: uxData.boldCount || 0,      target: '≥ 5 per 100 words',  pass: words ? ((uxData.boldCount || 0) / words) * 100 >= 5 : false },
    { label: 'List items',           value: uxData.listItemCount || 0,  target: '≥ 3 per 100 words',  pass: words ? ((uxData.listItemCount || 0) / words) * 100 >= 3 : false },
    { label: 'Headings',             value: uxData.headingCount || 0,   target: '≥ 1 per 100 words',  pass: words ? ((uxData.headingCount || 0) / words) * 100 >= 1 : false },
  ];
  return `
    <p class="cs-intro">Scannability counts visual structure. Readers scan before they read.</p>
    <div class="cs-stack">
      ${rows.map(r => `
        <div class="cs-kv">
          <div class="cs-kv__k">${r.label}</div>
          <div class="cs-kv__v"><strong>${r.value}</strong> <span class="cs-kv__target">· ${r.target}</span> <span class="${r.pass ? 'cs-ok' : 'cs-fail'}">${r.pass ? '✓' : '✗'}</span></div>
        </div>`).join('')}
    </div>
    <p class="cs-intro">Page total: <strong>${words.toLocaleString()}</strong> visible words.</p>
  `;
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────
function renderLinkDensity(uxData) {
  const links = uxData.linkCount || 0;
  const words = Math.max(1, uxData.wordCount || 0);
  const per100 = Math.round((links / words) * 100 * 10) / 10;
  const ok = per100 >= 1 && per100 <= 8;
  return `
    <p class="cs-intro">Standard definition: links per 100 words of visible text.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Total links</div><div class="cs-kv__v"><strong>${links}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Visible words</div><div class="cs-kv__v"><strong>${words.toLocaleString()}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Links / 100 words</div><div class="cs-kv__v"><strong>${per100}</strong> <span class="cs-kv__target">· ideal 1–8</span> <span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓' : '✗'}</span></div></div>
    </div>
  `;
}

function renderMenuStructure(uxData, html) {
  const top = uxData.topLevelItems || 0;
  const ok = top >= 4 && top <= 7;
  const doc = getDoc(html);
  let navHTML = null;
  if (doc) {
    const nav =
      doc.querySelector('header nav') ||
      doc.querySelector('nav[aria-label*="main" i]') ||
      doc.querySelector('nav');
    if (nav) navHTML = nav.outerHTML.slice(0, 900);
  }
  return `
    <p class="cs-intro">Primary navigation top-level items only. Ideal is 4–7.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Top-level items</div><div class="cs-kv__v"><strong>${top}</strong> <span class="cs-kv__target">· ideal 4–7</span> <span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓' : '✗'}</span></div></div>
    </div>
    ${navHTML ? `<p class="cs-intro">Detected primary navigation:</p>${codeBlock(navHTML, 900)}` : ''}
  `;
}

function renderInternalLinks(uxData) {
  const total = uxData.linkCount || 0;
  const external = uxData.externalLinkCount || 0;
  const internal = Math.max(0, total - external);
  const ratio = total ? external / total : 0;
  const ok = ratio <= 0.30;
  return `
    <p class="cs-intro">Internal links keep readers on-site; too many external links leak authority.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Internal</div><div class="cs-kv__v"><strong>${internal}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">External</div><div class="cs-kv__v"><strong>${external}</strong> <span class="cs-kv__target">· ≤ 30%</span> <span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓' : '✗'}</span></div></div>
      <div class="cs-kv"><div class="cs-kv__k">External ratio</div><div class="cs-kv__v"><strong>${Math.round(ratio * 100)}%</strong></div></div>
    </div>
  `;
}

function renderCTAs(uxData, html) {
  const count = uxData.potentialCTAs || 0;
  const doc = getDoc(html);
  const samples = [];
  if (doc) {
    for (const el of doc.querySelectorAll(
      'a[href*="contact"], a[href*="book"], a[href*="buy"], a[href*="trial"], a[href*="demo"], ' +
      'a[href*="get"], a[href*="start"], button, .btn, .button, [class*="cta"]'
    )) {
      if (samples.length >= 8) break;
      const t = (el.textContent || '').trim();
      if (!t) continue;
      samples.push(el.outerHTML.slice(0, 400));
    }
  }
  return `
    <p class="cs-intro">Detected call-to-action candidates (target ≥ 2).</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Total CTAs</div><div class="cs-kv__v"><strong>${count}</strong> <span class="${count >= 2 ? 'cs-ok' : 'cs-fail'}">${count >= 2 ? '✓' : '✗'}</span></div></div>
    </div>
    ${samples.length ? samples.map(s => `<div class="cs-item">${codeBlock(s, 400)}</div>`).join('') : ''}
  `;
}

// ─────────────────────────────────────────────────────────────
// ACCESSIBILITY
// ─────────────────────────────────────────────────────────────
function renderAltMissing(uxData) {
  const missing = uxData.altMissingList || [];
  if (!missing.length) return empty('No images are missing alt text on this page.');
  return `
    <p class="cs-intro">${missing.length} meaningful image${missing.length === 1 ? '' : 's'} missing <code>alt</code>.</p>
    ${missing.map(m => `
      <div class="cs-item">
        ${metaRow([`<span class="cs-badge">${m.width || '?'} × ${m.height || '?'}</span>`])}
        ${codeBlock(m.outerHTML || `<img src="${m.src}">`, 500)}
      </div>`).join('')}
  `;
}

function renderContrast(uxData) {
  const fails = (uxData.contrastSamples || [])
    .filter(s => !s.passesAA)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 8);
  if (!fails.length) return empty('All sampled text passes WCAG AA contrast.');
  return `
    <p class="cs-intro">Text whose foreground/background ratio falls below WCAG AA. Sorted worst first. The HTML below is the exact failing element.</p>
    ${fails.map(s => `
      <div class="cs-item">
        ${metaRow([
          `<span class="cs-badge cs-badge--red">${s.ratio}:1</span>`,
          `needs ${s.isLarge ? '3:1' : '4.5:1'}`,
          `&lt;${escapeHtml(s.tag)}&gt;`
        ])}
        ${codeBlock(s.outerHTML || '(element HTML not captured by worker)', 500)}
      </div>`).join('')}
  `;
}

function renderSemantics(uxData) {
  const rows = [
    { label: '<main> landmark',         pass: !!uxData.hasMain },
    { label: '<article> or <section>',  pass: !!uxData.hasArticleOrSection },
    { label: 'Header / footer / aside', pass: !!uxData.hasLandmarks },
    { label: 'ARIA labels present',     pass: !!uxData.hasAriaLabels },
    { label: 'Three or more headings',  pass: (uxData.headingCount || 0) >= 3 },
  ];
  return `
    <p class="cs-intro">Semantic HTML gives assistive tech and search engines a document outline.</p>
    <div class="cs-stack">
      ${rows.map(r => `
        <div class="cs-kv">
          <div class="cs-kv__k">${r.label}</div>
          <div class="cs-kv__v"><span class="${r.pass ? 'cs-ok' : 'cs-fail'}">${r.pass ? '✓ present' : '✗ missing'}</span></div>
        </div>`).join('')}
    </div>
  `;
}

function renderWCAG(uxData) {
  const rows = [
    { label: 'Alt text coverage',  pass: !(uxData.altMissingList || []).length },
    { label: 'Colour contrast',    pass: (uxData.contrastCoverage || 1) >= 0.9, note: `coverage ${Math.round((uxData.contrastCoverage || 0) * 100)}%` },
    { label: 'Semantic structure', pass: !!uxData.hasMain || !!uxData.hasArticleOrSection },
  ];
  return `
    <p class="cs-intro">WCAG 2.2 AA — automated checks this tool performs.</p>
    <div class="cs-stack">
      ${rows.map(r => `
        <div class="cs-kv">
          <div class="cs-kv__k">${r.label}</div>
          <div class="cs-kv__v"><span class="${r.pass ? 'cs-ok' : 'cs-fail'}">${r.pass ? '✓ pass' : '✗ fail'}</span>${r.note ? ` <span class="cs-kv__target">${r.note}</span>` : ''}</div>
        </div>`).join('')}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// MOBILE
// ─────────────────────────────────────────────────────────────
function renderViewport(uxData) {
  const vp = uxData.viewportContent || '';
  const ok = /width\s*=\s*device-width/i.test(vp) && /initial-scale\s*=\s*1/i.test(vp);
  return `
    <p class="cs-intro">The <code>viewport</code> meta tag controls how mobile browsers scale the page.</p>
    ${vp
      ? codeBlock(`<meta name="viewport" content="${vp}">`, 400)
      : empty('No <meta name="viewport"> tag found in <head>.')}
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Verdict</div><div class="cs-kv__v"><span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓ correct' : '✗ needs width=device-width, initial-scale=1'}</span></div></div>
    </div>
  `;
}

function renderResponsive(uxData) {
  const vp = uxData.renderedViewport || {};
  return `
    <p class="cs-intro">Responsive layout indicators found on the rendered page.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Media queries / stylesheets</div><div class="cs-kv__v"><span class="${uxData.hasMediaQueries ? 'cs-ok' : 'cs-fail'}">${uxData.hasMediaQueries ? '✓ present' : '✗ none found'}</span></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Viewport at render</div><div class="cs-kv__v">${vp.width || '?'} × ${vp.height || '?'} px</div></div>
      <div class="cs-kv"><div class="cs-kv__k">Pixel ratio</div><div class="cs-kv__v">${vp.dpr || 1}</div></div>
    </div>
  `;
}

function renderTouchTargets(uxData) {
  const fails = (uxData.touchSamples || []).filter(s => !s.passes).slice(0, 12);
  const total = uxData.touchTotal || 0;
  const small = uxData.touchSmall || 0;
  if (!fails.length) return empty(`All ${total} interactive elements measure at least 44×44 px.`);
  return `
    <p class="cs-intro">${small} of ${total} interactive elements fall below 44×44 px. Each block below is the actual element with its measured size.</p>
    ${fails.map(s => `
      <div class="cs-item">
        ${metaRow([`<span class="cs-badge cs-badge--red">${s.width} × ${s.height} px</span>`, `&lt;${escapeHtml(s.tag)}&gt;`])}
        ${codeBlock(s.outerHTML || '(element HTML not captured by worker)', 500)}
      </div>`).join('')}
  `;
}

function renderPWA(uxData) {
  const rows = [
    { label: 'Web app manifest', pass: !!uxData.hasManifest },
    { label: 'Service worker',   pass: !!uxData.hasServiceWorkerHint },
    { label: 'Apple touch icon', pass: !!uxData.hasAppleTouchIcon },
    { label: 'HTTPS',            pass: !!uxData.isHttps },
  ];
  return `
    <p class="cs-intro">PWA features enable install prompts, offline access and push notifications. Missing items are the biggest gaps.</p>
    <div class="cs-stack">
      ${rows.map(r => `
        <div class="cs-kv">
          <div class="cs-kv__k">${r.label}</div>
          <div class="cs-kv__v"><span class="${r.pass ? 'cs-ok' : 'cs-fail'}">${r.pass ? '✓ present' : '✗ missing'}</span></div>
        </div>`).join('')}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// SPEED
// ─────────────────────────────────────────────────────────────
function renderAssetVolume(uxData) {
  const kb = (n) => Math.round((n || 0) / 1024);
  const other = kb((uxData.totalTransferSize || 0) - (uxData.scriptTransferSize || 0) - (uxData.imageTransferSize || 0) - (uxData.fontTransferSize || 0));
  const rows = [
    { label: 'HTML + other', value: Math.max(0, other) },
    { label: 'Scripts',      value: kb(uxData.scriptTransferSize) },
    { label: 'Images',       value: kb(uxData.imageTransferSize) },
    { label: 'Fonts',        value: kb(uxData.fontTransferSize) },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  return `
    <p class="cs-intro">Real transfer sizes from the browser's resource timing API.</p>
    <div class="cs-stack">
      ${rows.map(r => `<div class="cs-kv"><div class="cs-kv__k">${r.label}</div><div class="cs-kv__v"><strong>${r.value} KB</strong></div></div>`).join('')}
      <div class="cs-kv"><div class="cs-kv__k">Total</div><div class="cs-kv__v"><strong>${total} KB</strong> <span class="cs-kv__target">· aim ≤ 1500 KB</span></div></div>
    </div>
  `;
}

function renderScriptBloat(uxData) {
  return `
    <p class="cs-intro">Script weight is the biggest cause of slow interactivity on most sites.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">External scripts</div><div class="cs-kv__v"><strong>${uxData.externalScripts || 0}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Total script bytes</div><div class="cs-kv__v"><strong>${Math.round((uxData.scriptTransferSize || 0) / 1024)} KB</strong> <span class="cs-kv__target">· aim ≤ 350 KB</span></div></div>
    </div>
  `;
}

function renderFonts(uxData) {
  const families = uxData.fontFamilies || [];
  return `
    <p class="cs-intro">Each unique font family adds a network request and slows first render.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Unique families</div><div class="cs-kv__v"><strong>${families.length}</strong> <span class="cs-kv__target">· aim ≤ 2–3</span></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Font bytes</div><div class="cs-kv__v"><strong>${Math.round((uxData.fontTransferSize || 0) / 1024)} KB</strong></div></div>
    </div>
    ${families.map(f => `<div class="cs-item">${codeBlock(`font-family: ${f};`, 200)}</div>`).join('')}
  `;
}

function renderLazyLoading(uxData, html) {
  const li = uxData.lazyDetails || {};
  const total = li.total || 0;
  const anyLazy = Math.max(li.lazyAttr || 0, li.lazyData || 0, li.lazyClass || 0);
  const ok = total > 0 && anyLazy / total >= 0.4;

  const doc = getDoc(html);
  const candidates = [];
  if (doc && !ok) {
    for (const img of doc.querySelectorAll('img')) {
      if (candidates.length >= 6) break;
      if (img.loading === 'lazy' || img.dataset.src || img.classList.contains('lazy')) continue;
      candidates.push(img.outerHTML.slice(0, 400));
    }
  }

  return `
    <p class="cs-intro">Offscreen images should be lazy-loaded so the browser waits until they scroll into view.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Images on page</div><div class="cs-kv__v"><strong>${total}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Native loading="lazy"</div><div class="cs-kv__v"><strong>${li.lazyAttr || 0}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">data-src / data-lazy</div><div class="cs-kv__v"><strong>${li.lazyData || 0}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">class="lazy"</div><div class="cs-kv__v"><strong>${li.lazyClass || 0}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Total lazy</div><div class="cs-kv__v"><strong>${anyLazy}</strong> of ${total} <span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓' : '✗'}</span></div></div>
    </div>
    ${candidates.length ? `
      <p class="cs-intro">Sample of images without lazy loading:</p>
      ${candidates.map(c => `<div class="cs-item">${codeBlock(c, 400)}</div>`).join('')}
    ` : ''}
  `;
}

function renderImageFormat(uxData, html) {
  const modern = uxData.modernImageCount || 0;
  const total = uxData.totalRenderedImages || 0;
  const ratio = total ? modern / total : 0;
  const ok = ratio >= 0.4;

  const doc = getDoc(html);
  const candidates = [];
  if (doc && !ok) {
    for (const img of doc.querySelectorAll('img[src$=".jpg"], img[src$=".jpeg"], img[src$=".png"]')) {
      if (candidates.length >= 8) break;
      candidates.push(img.outerHTML.slice(0, 400));
    }
  }

  return `
    <p class="cs-intro">WebP/AVIF images are 25–50% smaller than JPEG/PNG. Modern format detected by real MIME type served.</p>
    <div class="cs-stack">
      <div class="cs-kv"><div class="cs-kv__k">Total rendered images</div><div class="cs-kv__v"><strong>${total}</strong></div></div>
      <div class="cs-kv"><div class="cs-kv__k">Modern format</div><div class="cs-kv__v"><strong>${modern}</strong> <span class="cs-kv__target">· ≥ 40%</span> <span class="${ok ? 'cs-ok' : 'cs-fail'}">${ok ? '✓' : '✗'}</span></div></div>
    </div>
    ${candidates.length ? `
      <p class="cs-intro">Sample of images still served as JPEG/PNG:</p>
      ${candidates.map(c => `<div class="cs-item">${codeBlock(c, 400)}</div>`).join('')}
    ` : ''}
  `;
}

function renderBlockingScripts(uxData, html) {
  const list = uxData.blockingResources || [];
  if (!list.length) return empty('No render-blocking resources detected in <head>.');
  const doc = getDoc(html);
  return `
    <p class="cs-intro">Resources that delay first paint. Confirmed with the browser's <code>renderBlockingStatus</code> API — async CSS and ES modules are correctly excluded. Goal: ≤ 2–3 items.</p>
    ${list.map(r => {
      let code = null;
      if (doc) {
        if (r.url === 'inline') {
          const inlineScripts = Array.from(doc.querySelectorAll('head script:not([src])'));
          if (inlineScripts.length) code = inlineScripts[0].outerHTML.slice(0, 400);
        } else {
          const sel = r.type === 'script'
            ? `script[src="${r.url}"]`
            : `link[href="${r.url}"]`;
          const el = doc.querySelector(sel);
          if (el) code = el.outerHTML.slice(0, 500);
        }
      }
      if (!code) {
        code = r.type === 'script'
          ? `<script src="${r.url}"></script>`
          : `<link rel="stylesheet" href="${r.url}">`;
      }
      return `
        <div class="cs-item">
          ${metaRow([`<span class="cs-badge">${escapeHtml(r.type)}</span>`])}
          ${codeBlock(code, 500)}
        </div>`;
    }).join('')}
  `;
}

// ─────────────────────────────────────────────────────────────
// Public: does this failure have a Show-the-code button?
// ─────────────────────────────────────────────────────────────
export function deriveSelectorsForFailure(text) {
  if (!text) return null;
  if (RENDERERS[text]) return { renderer: text };
  for (const name of Object.keys(RENDERERS)) {
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(text)) return { renderer: name };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────
export function showCodeForFailure(failureText, html, { title, uxData } = {}) {
  let bodyHtml = null;
  if (uxData) {
    const name = findRendererName(failureText);
    const fn = name ? RENDERERS[name] : null;
    if (fn) {
      try { bodyHtml = fn(uxData, html); } catch (e) { bodyHtml = null; }
    }
  }
  if (!bodyHtml) {
    bodyHtml = empty('Detailed inspection is not available for this check yet.');
  }
  openCodeSnippetModal({ title: title || failureText || 'Affected code', bodyHtml });
}

function findRendererName(text) {
  if (!text) return null;
  if (RENDERERS[text]) return text;
  for (const name of Object.keys(RENDERERS)) {
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(text)) return name;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Modal (native <dialog>)
// ─────────────────────────────────────────────────────────────
const MODAL_ID = 'code-snippet-modal';

export function initCodeSnippetModal() {
  if (document.getElementById(MODAL_ID)) return;
  injectStyles();
  const dialog = document.createElement('dialog');
  dialog.id = MODAL_ID;
  dialog.className = 'cs-dialog';
  dialog.innerHTML = `
    <button type="button" class="cs-dialog__close" data-close aria-label="Close">×</button>
    <h3 class="cs-dialog__title">Affected code</h3>
    <div class="cs-dialog__body"></div>
  `;
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  document.body.appendChild(dialog);
}

function openCodeSnippetModal({ title = 'Affected code', bodyHtml = '' } = {}) {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) return;
  dialog.querySelector('.cs-dialog__title').textContent = title;
  dialog.querySelector('.cs-dialog__body').innerHTML = bodyHtml;
  if (typeof dialog.showModal === 'function') {
    if (dialog.open) dialog.close();
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
  document.body.style.overflow = 'hidden';
}

function injectStyles() {
  if (document.getElementById('cs-dialog-styles')) return;
  const style = document.createElement('style');
  style.id = 'cs-dialog-styles';
  style.textContent = `
    .cs-dialog {
      margin: auto;
      padding: 22px;
      border: none;
      border-radius: 12px;
      background: #fff;
      color: #111827;
      max-width: 820px;
      width: 92vw;
      max-height: 84vh;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.4);
    }
    .cs-dialog::backdrop { background: rgba(15,23,42,.7); }
    .dark .cs-dialog { background: #0f172a; color: #e5e7eb; }
    .cs-dialog__title {
      margin: 0 0 14px;
      font-size: 15px; font-weight: 700; letter-spacing: .01em;
      text-transform: uppercase; color: #ea580c;
    }
    .cs-dialog__close {
      position: absolute; top: 10px; right: 12px;
      width: 30px; height: 30px; border: none; background: transparent;
      font-size: 22px; line-height: 1; cursor: pointer;
      color: #6b7280; border-radius: 6px;
    }
    .cs-dialog__close:hover { background: #f3f4f6; color: #111827; }
    .dark .cs-dialog__close:hover { background: #1e293b; color: #f9fafb; }
    .cs-dialog__body {
      overflow-y: auto;
      max-height: calc(84vh - 70px);
      font-size: 14px;
      line-height: 1.55;
    }
    .cs-intro {
      margin: 0 0 12px;
      color: #4b5563;
      font-size: 13.5px;
    }
    .dark .cs-intro { color: #94a3b8; }
    .cs-intro code {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 12px;
      background: #f3f4f6; padding: 1px 5px; border-radius: 4px;
    }
    .dark .cs-intro code { background: #1e293b; color: #cbd5e1; }
    .cs-stack { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .cs-item { margin-bottom: 14px; }
    .cs-item__meta {
      font-size: 11.5px;
      color: #6b7280;
      margin-bottom: 5px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .dark .cs-item__meta { color: #94a3b8; }
    .cs-item__text {
      font-size: 13.5px;
      color: #1f2937;
      padding: 10px 12px;
      background: #fafafa;
      border-left: 3px solid #fb923c;
      border-radius: 6px;
      line-height: 1.6;
      word-break: break-word;
    }
    .dark .cs-item__text { background: #1e293b; color: #e2e8f0; }
    .cs-item__pre {
      margin: 0;
      padding: 12px 14px;
      border-radius: 8px;
      background: #1e293b;
      color: #e2e8f0;
      font-family: ui-monospace, Menlo, monospace;
      font-size: 12.5px;
      line-height: 1.55;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 260px;
      overflow-y: auto;
    }
    .cs-badge {
      display: inline-block; padding: 2px 8px;
      border-radius: 999px;
      background: #e0e7ff; color: #3730a3;
      font-size: 11px; font-weight: 700;
    }
    .cs-badge--red { background: #fee2e2; color: #991b1b; }
    .dark .cs-badge { background: #312e81; color: #c7d2fe; }
    .dark .cs-badge--red { background: #7f1d1d; color: #fecaca; }
    .cs-kv {
      display: flex; justify-content: space-between;
      align-items: baseline; gap: 12px;
      padding: 6px 10px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13.5px;
    }
    .cs-kv:last-child { border-bottom: none; }
    .dark .cs-kv { border-bottom-color: #334155; }
    .cs-kv__k { color: #6b7280; }
    .dark .cs-kv__k { color: #94a3b8; }
    .cs-kv__v { color: #111827; text-align: right; }
    .dark .cs-kv__v { color: #e5e7eb; }
    .cs-kv__target { color: #9ca3af; font-size: 12px; margin-left: 4px; }
    .cs-ok { color: #16a34a; font-weight: 700; margin-left: 6px; }
    .cs-fail { color: #dc2626; font-weight: 700; margin-left: 6px; }
    .cs-empty {
      font-style: italic; color: #6b7280;
      padding: 14px 0; text-align: center;
    }
  `;
  document.head.appendChild(style);
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}