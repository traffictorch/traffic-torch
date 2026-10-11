// AEO Performance Tool – render diff module
// Word-level diff with paragraph grouping between raw HTML and rendered HTML.

const MAX_PARAS = 150;
const MAX_WORDS_PER_PARA = 400;
const MAX_SAMPLE_WORDS = 25;

export function renderRenderDiffPanel(rawHtml, renderedHtml, meta = {}) {
  const diff = computeRenderDiff(rawHtml, renderedHtml);
  return buildPanelHtml(diff, meta);
}

export function computeRenderDiff(rawHtml, renderedHtml) {
  const identical = String(rawHtml || '') === String(renderedHtml || '');
  if (identical) {
    return {
      identical: true,
      stats: {
        rawWordCount: 0, renderedWordCount: 0,
        injectedCount: 0, removedCount: 0,
        injectedPct: 0, removedPct: 0,
        h1InRaw: false, h1InRendered: false,
        h1RawText: '', h1RenderedText: ''
      },
      samples: { injected: [], removed: [] },
      raw: { paragraphs: [] },
      rendered: { paragraphs: [] }
    };
  }

  const rawParas = extractParagraphs(rawHtml);
  const renderedParas = extractParagraphs(renderedHtml);

  const rawWordSet = new Set();
  const renderedWordSet = new Set();
  for (const p of rawParas) for (const w of wordsOf(p)) rawWordSet.add(w);
  for (const p of renderedParas) for (const w of wordsOf(p)) renderedWordSet.add(w);

  const renderedClassified = renderedParas.map(text => classifyParagraph(text, rawWordSet, 'injected'));
  const rawClassified = rawParas.map(text => classifyParagraph(text, renderedWordSet, 'removed'));

  let injectedCount = 0, removedCount = 0;
  const injectedSample = new Set();
  const removedSample = new Set();

  for (const w of renderedWordSet) {
    if (!rawWordSet.has(w)) {
      injectedCount++;
      if (injectedSample.size < MAX_SAMPLE_WORDS) injectedSample.add(w);
    }
  }
  for (const w of rawWordSet) {
    if (!renderedWordSet.has(w)) {
      removedCount++;
      if (removedSample.size < MAX_SAMPLE_WORDS) removedSample.add(w);
    }
  }

  const h1Raw = extractH1(rawHtml);
  const h1Rendered = extractH1(renderedHtml);

  return {
    identical: false,
    stats: {
      rawWordCount: rawWordSet.size,
      renderedWordCount: renderedWordSet.size,
      injectedCount, removedCount,
      injectedPct: renderedWordSet.size ? injectedCount / renderedWordSet.size : 0,
      removedPct: rawWordSet.size ? removedCount / rawWordSet.size : 0,
      h1InRaw: !!h1Raw, h1InRendered: !!h1Rendered,
      h1RawText: h1Raw, h1RenderedText: h1Rendered
    },
    samples: { injected: [...injectedSample], removed: [...removedSample] },
    raw: { paragraphs: rawClassified },
    rendered: { paragraphs: renderedClassified }
  };
}

function buildPanelHtml(diff, meta) {
  const renderSource = meta?.renderSource || 'unknown';
  const isRawFallback = renderSource === 'raw-fallback';
  const isCustomHtml = renderSource === 'custom-html';

  // Case: raw === rendered
  if (diff.identical) {
    let headline, sub;
    if (isCustomHtml) {
      headline = '📋 Custom HTML — diff not available';
      sub = 'You pasted HTML directly, so there is no live render to compare against. Run a URL audit to see the raw vs. rendered diff.';
    } else if (isRawFallback) {
      headline = '⚠️ Headless render failed';
      sub = 'The tool fell back to a raw fetch, so no diff can be computed. Try the audit again — if it keeps failing, check that the URL is publicly reachable.';
    } else {
      headline = '✅ Raw HTML and rendered DOM are identical';
      sub = 'Both JavaScript-executing bots (Googlebot, Applebot) and non-executing AI crawlers (ChatGPT-User, PerplexityBot) see exactly the same content. Nothing is JS-gated.';
    }
    const tone = isCustomHtml || isRawFallback ? 'yellow' : 'green';
    return `
      <div class="max-w-5xl mx-auto my-16 px-4 no-print">
        <details class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <summary class="px-6 py-5 cursor-pointer list-none flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200">🔍 What AI Crawlers Actually See</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Raw HTML vs. rendered DOM</p>
            </div>
            <span class="text-orange-500 text-2xl">▾</span>
          </summary>
          <div class="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div class="bg-${tone}-50 dark:bg-${tone}-900/20 p-6 rounded-xl text-center">
              <p class="text-${tone}-700 dark:text-${tone}-300 font-medium text-lg">${headline}</p>
              <p class="text-${tone}-600 dark:text-${tone}-400 text-sm mt-2">${sub}</p>
            </div>
          </div>
        </details>
      </div>`;
  }

  const { stats, raw, rendered, samples } = diff;
  const injectedPct = (stats.injectedPct * 100).toFixed(1);
  const removedPct = (stats.removedPct * 100).toFixed(1);

  const injectedColor = stats.injectedPct < 0.05 ? 'text-green-600 dark:text-green-400'
    : stats.injectedPct < 0.15 ? 'text-orange-500'
    : 'text-red-600 dark:text-red-400';
  const removedColor = stats.removedPct < 0.05 ? 'text-green-600 dark:text-green-400'
    : stats.removedPct < 0.20 ? 'text-orange-500'
    : 'text-red-600 dark:text-red-400';

  const fallbackWarning = isRawFallback ? `
    <div class="mb-4 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm">
      ⚠️ Headless render failed — this diff was computed from a raw fetch only. Results may be incomplete.
    </div>` : '';

  return `
    <div class="max-w-6xl mx-auto my-16 px-4 no-print">
      <details open class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <summary class="px-6 py-5 cursor-pointer list-none flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-pink-600/10">
          <div>
            <h3 class="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">🔍 What AI Crawlers Actually See</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Raw HTML (non-JS AI bots) vs. rendered DOM (Googlebot, Applebot)</p>
          </div>
          <span class="text-orange-500 text-2xl">▾</span>
        </summary>

        <div class="px-4 md:px-6 pb-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
          ${fallbackWarning}

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">Raw HTML words</p>
              <p class="text-2xl font-black text-gray-800 dark:text-gray-200">${stats.rawWordCount.toLocaleString()}</p>
              <p class="text-xs text-gray-500 mt-1">non-JS bots see</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
              <p class="text-xs uppercase tracking-wider text-gray-500 mb-1">Rendered words</p>
              <p class="text-2xl font-black text-gray-800 dark:text-gray-200">${stats.renderedWordCount.toLocaleString()}</p>
              <p class="text-xs text-gray-500 mt-1">Googlebot sees</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p class="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">JS-injected</p>
              <p class="text-2xl font-black ${injectedColor}">${injectedPct}%</p>
              <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">invisible to non-JS bots</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
              <p class="text-xs uppercase tracking-wider text-red-700 dark:text-red-300 mb-1">Removed after render</p>
              <p class="text-2xl font-black ${removedColor}">${removedPct}%</p>
              <p class="text-xs text-red-700 dark:text-red-300 mt-1">hydration mismatch</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl ${stats.h1InRaw ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}">
              <p class="text-sm font-semibold ${stats.h1InRaw ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
                ${stats.h1InRaw ? '✅ H1 present in raw HTML' : '❌ H1 missing from raw HTML'}
              </p>
              ${stats.h1RawText ? `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">"${escapeHtml(stats.h1RawText)}"</p>` : ''}
            </div>
            <div class="p-4 rounded-xl ${stats.h1InRendered ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}">
              <p class="text-sm font-semibold ${stats.h1InRendered ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
                ${stats.h1InRendered ? '✅ H1 present in rendered DOM' : '❌ H1 missing from rendered DOM'}
              </p>
              ${stats.h1RenderedText ? `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">"${escapeHtml(stats.h1RenderedText)}"</p>` : ''}
            </div>
          </div>

          <div class="flex flex-wrap gap-4 text-sm justify-center py-2">
            <span class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800"></span> Shared — visible to all bots</span>
            <span class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800"></span> JS-injected — only Googlebot sees</span>
            <span class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800"></span> Removed — lost after hydration</span>
          </div>

<div class="render-diff-columns">
  <details class="render-diff-col">
    <summary class="render-diff-col-head">
      <div class="render-diff-col-meta">
        <span class="render-diff-col-title">📄 Raw HTML</span>
        <span class="render-diff-col-sub">ChatGPT-User, PerplexityBot, GPTBot see</span>
      </div>
      <span class="render-diff-col-badge">${stats.rawWordCount.toLocaleString()} words</span>
      <span class="render-diff-col-chevron" aria-hidden="true">▾</span>
    </summary>
    <div class="render-diff-col-body">
      ${raw.paragraphs.length === 0
        ? '<p class="text-gray-500 italic">No extractable paragraphs found in raw HTML.</p>'
        : raw.paragraphs.slice(0, MAX_PARAS).map(p => renderParagraph(p)).join('')}
    </div>
  </details>

  <details class="render-diff-col">
    <summary class="render-diff-col-head">
      <div class="render-diff-col-meta">
        <span class="render-diff-col-title">🖥️ Rendered DOM</span>
        <span class="render-diff-col-sub">Googlebot, Applebot see after JS runs</span>
      </div>
      <span class="render-diff-col-badge">${stats.renderedWordCount.toLocaleString()} words</span>
      <span class="render-diff-col-chevron" aria-hidden="true">▾</span>
    </summary>
    <div class="render-diff-col-body">
      ${rendered.paragraphs.length === 0
        ? '<p class="text-gray-500 italic">No extractable paragraphs found in rendered DOM.</p>'
        : rendered.paragraphs.slice(0, MAX_PARAS).map(p => renderParagraph(p)).join('')}
    </div>
  </details>
</div>

          ${stats.injectedCount > 0 ? `
            <div class="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p class="font-bold text-blue-800 dark:text-blue-200 mb-2">🔵 Sample JS-injected words (not in raw HTML)</p>
              <p class="text-sm text-blue-700 dark:text-blue-300">${samples.injected.map(w => escapeHtml(w)).join(', ')}${stats.injectedCount > MAX_SAMPLE_WORDS ? ' …' : ''}</p>
            </div>` : ''}
          ${stats.removedCount > 0 ? `
            <div class="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p class="font-bold text-red-800 dark:text-red-200 mb-2">🔴 Sample removed words (lost after hydration)</p>
              <p class="text-sm text-red-700 dark:text-red-300">${samples.removed.map(w => escapeHtml(w)).join(', ')}${stats.removedCount > MAX_SAMPLE_WORDS ? ' …' : ''}</p>
            </div>` : ''}
        </div>
      </details>
    </div>`;
}

function renderParagraph(para) {
  if (!para || !para.tokens) return '';
  const html = para.tokens.map(t => {
    if (t.type === 'space') return escapeHtml(t.text);
    const cls = t.status === 'injected' ? 'diff-injected'
      : t.status === 'removed' ? 'diff-removed'
      : 'diff-shared';
    return `<span class="${cls}">${escapeHtml(t.text)}</span>`;
  }).join('');
  return `<p class="text-gray-800 dark:text-gray-200">${html}</p>`;
}

function classifyParagraph(text, otherWordSet, side) {
  const tokens = [];
  const parts = String(text).split(/(\s+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ type: 'space', text: part, status: 'space' });
      continue;
    }
    const clean = part.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
    let status;
    if (!clean || clean.length < 2) status = 'shared';
    else status = otherWordSet.has(clean) ? 'shared' : side;
    tokens.push({ type: 'word', text: part, clean, status });
    if (tokens.length >= MAX_WORDS_PER_PARA * 2) break;
  }
  return { text, tokens };
}

function extractParagraphs(html) {
  if (!html) return [];
  let doc;
  try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch { return []; }
  if (!doc || !doc.body) return [];

  const scope = doc.querySelector('main, article, [role="main"]') || doc.body;
  const out = [];
  const seen = new Set();

  const selector = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';
  scope.querySelectorAll(selector).forEach(el => {
    if (el.closest('nav, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]')) return;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 8) return;
    const key = text.slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
    if (out.length >= MAX_PARAS) return;
  });

  return out;
}

function wordsOf(text) {
  const out = [];
  const parts = String(text).split(/(\s+)/);
  for (const part of parts) {
    if (!part || /^\s+$/.test(part)) continue;
    const clean = part.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
    if (clean && clean.length >= 2) out.push(clean);
  }
  return out;
}

function extractH1(html) {
  if (!html) return '';
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildAIDiffPayload(rawHtml, renderedHtml) {
  const diff = computeRenderDiff(rawHtml, renderedHtml);
  if (diff.identical) {
    return {
      identical: true,
      rawWordCount: diff.stats.rawWordCount,
      renderedWordCount: diff.stats.renderedWordCount
    };
  }
  return {
    identical: false,
    rawWordCount: diff.stats.rawWordCount,
    renderedWordCount: diff.stats.renderedWordCount,
    injectedWordPct: +diff.stats.injectedPct.toFixed(3),
    removedWordPct: +diff.stats.removedPct.toFixed(3),
    injectedWordCount: diff.stats.injectedCount,
    removedWordCount: diff.stats.removedCount,
    h1InRaw: diff.stats.h1InRaw,
    h1InRendered: diff.stats.h1InRendered,
    sampleInjected: diff.samples.injected,
    sampleRemoved: diff.samples.removed
  };
}
