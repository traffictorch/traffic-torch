// code-snippet-v1.0.js
const SNIPPET_MAX = 800;
const HEAD_MAX    = 2000;

const RULES = [
{ test: /Too many blocking scripts/i,
  selectors: ['head script[src]:not([defer]):not([async]):not([type="module"])'],
  limit: 10,
  note: 'These are the synchronous <script src> tags in <head> that block first paint.' },

{ test: /H1 count incorrect/i,
  selectors: ['h1'],
  limit: 10,
  note: 'All <h1> elements found on the rendered page.' },

{ test: /Low text density/i,
  selectors: ['body'],
  limit: 1,
  maxLen: 4000,
  note: 'Showing the <body> — compare visible text against markup weight.' },
  { test: /render-blocking script/i,
    selectors: ['head script[src]:not([defer]):not([async]):not([type="module"])'] },
  { test: /stylesheets/i, selectors: ['link[rel="stylesheet"]'], limit: 10 },
  { test: /large inline scripts/i, selectors: ['script:not([src])'] },
  { test: /large inline style/i, selectors: ['style'] },
  { test: /image\(s\) missing width\/height/i,
    selectors: ['img:not([width])', 'img:not([height])'] },
  { test: /without lazy loading/i,
    selectors: ['img:not([loading="lazy"]):not([fetchpriority="high"])'] },
  { test: /\bimage-alt\b/i, selectors: ['img:not([alt])'] },
  { test: /\blabel\b/i,
    selectors: [
      'input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])',
      'select:not([aria-label]):not([aria-labelledby])',
      'textarea:not([aria-label]):not([aria-labelledby])'
    ] },
  { test: /\blink-name\b/i,   selectors: ['a:not([aria-label]):empty'] },
  { test: /\bbutton-name\b/i, selectors: ['button:not([aria-label]):empty'] },
  { test: /\bheading-order\b|\bpage-has-heading-one\b/i,
    selectors: ['h1, h2, h3, h4, h5, h6'], limit: 12 },
  { test: /\blandmark-one-main\b|\bregion\b/i, selectors: ['main, [role="main"]'] },
  { test: /\bhtml-has-lang\b/i,   selectors: ['html'] },
  { test: /\bdocument-title\b/i,  selectors: ['title'] },
  { test: /image\(s\) without alt/i, selectors: ['img:not([alt])'] },
  { test: /form field\(s\) may lack labels/i,
    selectors: [
      'input:not([type="hidden"]):not([id]):not([aria-label])',
      'select:not([id]):not([aria-label])',
      'textarea:not([id]):not([aria-label])'
    ] },
  { test: /deprecated API/i,
    rawSearch: [
      { pattern: /document\.write\s*\(/g,   label: 'document.write()' },
      { pattern: /\.attachEvent\s*\(/g,     label: '.attachEvent()' },
      { pattern: /new\s+ActiveXObject\s*\(/g, label: 'new ActiveXObject()' },
      { pattern: /\bdocument\.all\b/g,      label: 'document.all' }
    ] },
  { test: /distorted aspect ratio/i, selectors: ['img[width][height]'], limit: 10 },
  { test: /Missing <title> tag/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX },
  { test: /Title too short|Title too long/i, selectors: ['title'] },
  { test: /Missing meta description/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX,
    note: 'No <meta name="description"> found — this is your <head> where it belongs.' },
  { test: /Meta description short|Meta description long/i,
    selectors: ['meta[name="description"]'] },
  { test: /Missing canonical link/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX,
    note: 'No <link rel="canonical"> found — this is your <head> where it belongs.' },
  { test: /noindex|nofollow/i, selectors: ['meta[name="robots"]'] },
  { test: /No H1 on page/i,
    selectors: ['h1', 'h2'], limit: 1,
    note: 'No <h1> found. Showing the first heading on the page for context.' },
  { test: /\bH1 tags\b/i, selectors: ['h1'] },
  { test: /Missing viewport meta/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX },
  { test: /No web app manifest/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX,
    note: 'No <link rel="manifest"> found — this is your <head> where it belongs.' },
  { test: /Missing theme-color meta/i,
    selectors: ['head'], limit: 1, maxLen: HEAD_MAX },
  { test: /No WebP\/AVIF/i,
    selectors: ['img[src$=".jpg"]', 'img[src$=".jpeg"]', 'img[src$=".png"]'], limit: 8 },
  { test: /Script total/i, selectors: ['script[src]'], limit: 10 },
  { test: /CSS total/i,    selectors: ['link[rel="stylesheet"]'], limit: 10 },
  { test: /font-display/i,
    selectors: ['link[rel="preload"][as="font"]', 'link[href*="font"]'] },
  { test: /Viewport missing width=device-width|user-scalable=no|maximum-scale=1/i,
    selectors: ['meta[name="viewport"]'] },
  { test: /font sizes under 14px/i, selectors: ['[style*="font-size"]'], limit: 10 },
  { test: /clickable element\(s\) under 44px/i,
    selectors: ['button[style]', 'a[style]'], limit: 10 },
  { test: /Horizontal scroll container/i,
    selectors: ['[style*="overflow-x"]'], limit: 8 },
  { test: /safe-area/i, selectors: ['meta[name="viewport"]'] },
  { test: /semantic landmarks/i,
    selectors: ['main', 'nav', 'header', 'footer', 'article', 'aside'], limit: 12 },
  { test: /form field\(s\) without labels/i,
    selectors: [
      'input:not([type="hidden"]):not([id]):not([aria-label])',
      'select:not([id]):not([aria-label])',
      'textarea:not([id]):not([aria-label])'
    ] },
  { test: /skip-to-content link/i,
    selectors: ['a[href^="#main"]', 'a[href^="#content"]', 'a[href^="#skip"]'] },
  { test: /modal\/dialog elements/i, selectors: ['[role="dialog"]', '.modal'] }
];

export function deriveSelectorsForFailure(text) {
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule;
  }
  return null;
}

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

export function extractSnippets(html, selectors, options = {}) {
  const { limit = 5, maxLen = SNIPPET_MAX } = options;
  if (!html || !selectors?.length) return [];
  const doc = getDoc(html);
  if (!doc) return [];
  const out = [];
  for (const sel of selectors) {
    if (out.length >= limit) break;
    let nodes;
    try { nodes = doc.querySelectorAll(sel); } catch { continue; }
    for (const n of nodes) {
      if (out.length >= limit) break;
      const raw = n.outerHTML || '';
      out.push({
        selector: sel,
        html: raw.length > maxLen ? raw.slice(0, maxLen) + '\n… (truncated)' : raw
      });
    }
  }
  return out;
}

function searchRawHtml(html, patterns) {
  if (!html || !patterns?.length) return [];
  const out = [];
  for (const { pattern, label } of patterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let match, count = 0;
    while ((match = re.exec(html)) !== null && count < 3) {
      const start = Math.max(0, match.index - 60);
      const end   = Math.min(html.length, match.index + match[0].length + 60);
      out.push({ selector: label, html: '…' + html.slice(start, end) + '…' });
      count++;
    }
  }
  return out;
}

// ─── Modal (native <dialog> — always centers on screen) ───
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
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });
  document.body.appendChild(dialog);
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
      max-width: 760px;
      width: 92vw;
      max-height: 82vh;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.4);
    }
    .cs-dialog::backdrop {
      background: rgba(15,23,42,.7);
    }
    .dark .cs-dialog {
      background: #0f172a;
      color: #e5e7eb;
    }
    .cs-dialog__title {
      margin: 0 0 14px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .01em;
      text-transform: uppercase;
      color: #ea580c;
    }
    .cs-dialog__close {
      position: absolute;
      top: 10px; right: 12px;
      width: 30px; height: 30px;
      border: none; background: transparent;
      font-size: 22px; line-height: 1;
      cursor: pointer; color: #6b7280;
      border-radius: 6px;
    }
    .cs-dialog__close:hover { background: #f3f4f6; color: #111827; }
    .dark .cs-dialog__close:hover { background: #1e293b; color: #f9fafb; }
    .cs-dialog__body {
      overflow-y: auto;
      max-height: calc(82vh - 70px);
    }
    .cs-item { margin-bottom: 14px; }
    .cs-item__selector {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
      word-break: break-all;
    }
    .dark .cs-item__selector { color: #94a3b8; }
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
    .cs-empty {
      font-style: italic;
      color: #6b7280;
      padding: 14px 0;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function renderSnippets(snippets, note) {
  if (!snippets.length) {
    return `<p class="cs-empty">${escapeHtml(note || 'No matching elements found on the rendered page.')}</p>`;
  }
  return snippets.map(s => `
    <div class="cs-item">
      <div class="cs-item__selector">${escapeHtml(s.selector)}</div>
      <pre class="cs-item__pre"><code>${escapeHtml(s.html)}</code></pre>
    </div>
  `).join('');
}

export function openCodeSnippetModal({ title = 'Affected code', snippets = [], note = '' } = {}) {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) return;
  dialog.querySelector('.cs-dialog__title').textContent = title;
  dialog.querySelector('.cs-dialog__body').innerHTML = renderSnippets(snippets, note);
  if (typeof dialog.showModal === 'function') {
    if (dialog.open) dialog.close();
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
  document.body.style.overflow = 'hidden';
}

export function closeCodeSnippetModal() {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  document.body.style.overflow = '';
}

export function showCodeForFailure(failureText, html, { title } = {}) {
  const rule = deriveSelectorsForFailure(failureText);
  let snippets = [];
  if (rule?.selectors?.length) {
    snippets = extractSnippets(html, rule.selectors, { limit: rule.limit, maxLen: rule.maxLen });
  } else if (rule?.rawSearch) {
    snippets = searchRawHtml(html, rule.rawSearch);
  }
  openCodeSnippetModal({
    title: title || failureText || 'Affected code',
    snippets,
    note: rule?.note || ''
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}