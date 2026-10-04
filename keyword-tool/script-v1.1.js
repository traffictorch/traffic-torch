// Keyword Placement Tool script-v1.1.js
// Hybrid: Deterministic 55 pts + AI Semantic 15 pts + Semantic Coverage 30 pts

import { renderPluginSolutions } from './plugin-solutions-v1.0.js';
import { canRunTool } from '/main-v1.1.js';
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/cms-detect.js';
import { fixFor } from './module-explanations-v1.0.js';
import {
  initCodeSnippetModal,
  showCodeForFailure,
  deriveSelectorsForFailure,
  extractSnippets,
  escapeHtml
} from './code-snippet-v1.0.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const SEMANTIC_WORKER = 'https://keyword-semantic-audit.traffictorch.workers.dev/';
const TOKEN_KEY = 'traffic_torch_jwt';

const DETERMINISTIC_MAX = 55;
const AI_MAX = 15;
const VARIATIONS_MAX = 30;

function renderCodeBlocks(text) {
  if (text === null || text === undefined) return '';
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(
    /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g,
    (_m, lang, code) => {
      const language = (lang || 'plaintext').toLowerCase();
      return `<pre class="code-block"><code class="language-${language}">${code.replace(/\s+$/, '')}</code></pre>`;
    }
  );

  escaped = escaped.replace(
    /(<pre[\s\S]*?<\/pre>)|(\r?\n)/g,
    (_m, pre) => (pre ? pre : '<br>')
  );

  return escaped;
}

function buildHeadSnapshot(doc) {
  if (!doc || !doc.head) return '';
  const head = doc.head;
  const lines = [];

  const sheets = [...head.querySelectorAll('link[rel="stylesheet"]')].slice(0, 15);
  if (sheets.length) {
    lines.push('Stylesheets in <head>:');
    for (const l of sheets) lines.push(`- ${l.getAttribute('href') || ''}`);
  }

  const headScripts = [...head.querySelectorAll('script[src]')].slice(0, 15);
  if (headScripts.length) {
    lines.push('Scripts in <head>:');
    for (const s of headScripts) lines.push(`- ${s.getAttribute('src') || ''}`);
  }

  const metaTags = [...head.querySelectorAll('meta[name], meta[property]')].slice(0, 20);
  if (metaTags.length) {
    lines.push('Meta tags in <head>:');
    for (const m of metaTags) {
      const key = m.getAttribute('name') || m.getAttribute('property') || '';
      const val = (m.getAttribute('content') || '').slice(0, 120);
      lines.push(`- ${key}="${val}"`);
    }
  }

  const jsonLd = [...head.querySelectorAll('script[type="application/ld+json"]')].slice(0, 5);
  if (jsonLd.length) lines.push(`JSON-LD schema blocks in <head>: ${jsonLd.length}`);

  return lines.join('\n');
}

async function saveAuditHistory(url, toolName, score = null) {
  const token = localStorage.getItem('authToken') || localStorage.getItem(TOKEN_KEY);
  const auditUrl = url || 'Pasted HTML code';

  if (token) {
    try {
      await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: auditUrl,
          tool_name: toolName,
          score: typeof score === 'number' ? score : null
        })
      });
      return;
    } catch {}
  }

  const stored = localStorage.getItem('audit_guest');
  let entries = [];
  if (stored) { try { entries = JSON.parse(stored).entries || []; } catch {} }
  entries.unshift({
    _localId: Date.now() + '_' + Math.random(),
    url: auditUrl,
    tool: toolName,
    score: typeof score === 'number' ? score : null,
    timestamp: Date.now()
  });
  entries = entries.slice(0, 5);
  localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
}

async function fetchAISemanticAudit(payload, { forceRefresh = false } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(SEMANTIC_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, forceRefresh }),
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AI worker ${res.status}: ${text.slice(0, 150)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSemanticVariations(payload, { forceRefresh = false } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(SEMANTIC_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'semantic-variations', ...payload, forceRefresh }),
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AI worker ${res.status}: ${text.slice(0, 150)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const targetKeywordInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const codeInput = document.getElementById('code-input');
  const urlAnalyzeBtn = document.getElementById('url-analyze-btn');
  const codeAnalyzeBtn = document.getElementById('code-analyze-btn');

  initCodeSnippetModal();

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.fixes-toggle');
    if (toggle) {
      const card = toggle.closest('.score-card');
      if (!card) return;
      const panel = card.querySelector('.fixes-panel');
      if (!panel) return;
      const nowHidden = panel.classList.toggle('hidden');
      const failedCount = toggle.dataset.failedCount || '0';
      toggle.textContent = nowHidden
        ? `Show Fixes (${failedCount})`
        : `Hide Fixes (${failedCount})`;
      return;
    }

    const showCodeBtn = e.target.closest('.show-code-btn');
    if (showCodeBtn) {
      e.preventDefault();
      const failureText = showCodeBtn.dataset.failure || '';
      const html = results.dataset.renderedHtml || '';
      showCodeForFailure(failureText, html, { title: 'Affected code' });
      return;
    }

    const aiLink = e.target.closest('.ask-ai-link');
    if (aiLink) {
      e.preventDefault();
      const textarea = document.getElementById('ai-question-input');
      if (textarea && aiLink.dataset.aiQuestion) {
        textarea.value = aiLink.dataset.aiQuestion;
      }
      const section = document.getElementById('ask-ai-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { textarea?.focus(); }, 700);
    }
  });

  function autoFillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const inputData = params.get('input');
    if (inputData) {
      const textarea = document.getElementById('code-input');
      if (textarea) {
        textarea.value = decodeURIComponent(inputData);
        setTimeout(() => document.getElementById('code-analyze-btn')?.click(), 800);
      }
    }
  }
  window.addEventListener('load', autoFillFromUrl);

  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl) {
    try {
      let decodedUrl = decodeURIComponent(sharedUrl);
      if (!/^https?:\/\//i.test(decodedUrl)) decodedUrl = 'https://' + decodedUrl;
      pageUrlInput.value = decodedUrl;
    } catch {}
  }
  const sharedKeyword = urlParams.get('keyword');
  if (sharedKeyword) {
    try {
      const decodedKeyword = decodeURIComponent(sharedKeyword).trim();
      if (decodedKeyword) targetKeywordInput.value = decodedKeyword;
    } catch {}
  }
  if (sharedUrl && sharedKeyword) {
    setTimeout(() => urlAnalyzeBtn.click(), 400);
  }

  const PROXY = 'https://full-render-v2.traffictorch.workers.dev/';

  const progressModules = [
    'Fetching page...',
    'Analyzing metadata',
    'Content depth & readability',
    'Scanning image alts',
    'Testing internal anchors',
    'Checking URL, schema, technical',
    'Running AI semantic audit',
    'Classifying semantic variations',
    'Generating report'
  ];
  let currentModuleIndex = 0;
  let moduleInterval;

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'Excellent',  emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { grade: 'Strong',     emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Average',    emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    return               { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  };

  const moduleHashes = {
    'Meta Title & Desc': 'meta-title-desc',
    'H1 & Headings': 'h1-headings',
    'Content & Readability': 'content-density',
    'Image Alts': 'image-alts',
    'Anchor Text': 'anchor-text',
    'URL & Schema': 'url-schema',
    'Technical': 'url-schema',
    'AI Semantic Audit': 'url-schema',
    'Semantic Coverage': 'url-schema'
  };

  const countPhrase = (text = '', phrase = '', isUrl = false) => {
    if (!text || !phrase) return 0;
    const lower = String(text).toLowerCase();
    const p = String(phrase).toLowerCase().trim();
    if (!p) return 0;
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (isUrl) {
      const urlWords = lower
        .replace(/https?:\/\//gi, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .split(/\s+/).filter(Boolean);
      const phraseWords = p.split(/\s+/).filter(Boolean);
      if (!phraseWords.length || !urlWords.length) return 0;
      const matched = phraseWords.filter(w => urlWords.includes(w)).length;
      return matched / phraseWords.length >= 0.6 ? 1 : 0;
    }

    const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(p)}(?![\\p{L}\\p{N}])`, 'giu');
    const m = lower.match(re);
    return m ? m.length : 0;
  };

  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    const strip = [
      'nav', 'footer', 'aside', 'script', 'style', 'noscript', 'iframe',
      '[role="navigation"]', '[role="contentinfo"]', '[role="complementary"]',
      '.menu', '.nav', '.navbar', '.footer', '.cookie', '.popup',
      '.sidebar', '.advert', '.newsletter'
    ];
    clone.querySelectorAll(strip.join(',')).forEach(el => el.remove());
    const main = clone.querySelector('main, article, [role="main"]') || clone;
    return main.textContent.replace(/\s+/g, ' ').trim();
  };

  const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;

  function computeDeterministicScore({ yourDoc, phrase, fullUrl, analysisType, yourWords, cleanContent }) {
    const fixes = [];
    const modules = [];
    let total = 0;

    const titleText = yourDoc.querySelector('title')?.textContent.trim() || '';
    const titleMatch = countPhrase(titleText, phrase);
    const titleLen = titleText.length;
    let titleScore = 0;
    if (!titleText) {
      fixes.push({ module: 'Meta Title & Desc', issue: 'Missing <title> tag', how: 'Add a descriptive title containing your target keyword.' });
    } else {
      if (titleMatch > 0) titleScore += 4;
      else fixes.push({ module: 'Meta Title & Desc', issue: 'Keyword missing from meta title', how: 'Place the keyword near the start of the title, under 60 characters.' });
      if (titleLen >= 30 && titleLen <= 60) titleScore += 3;
      else fixes.push({ module: 'Meta Title & Desc', issue: `Meta title is ${titleLen} chars (aim 30–60)`, how: 'Trim or expand the title to 30–60 characters.' });
      if (titleMatch > 0 && titleText.toLowerCase().indexOf(phrase.toLowerCase()) <= 60) titleScore += 1;
    }

    const descText = yourDoc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const descMatch = countPhrase(descText, phrase);
    const descLen = descText.length;
    let descScore = 0;
    if (!descText) {
      fixes.push({ module: 'Meta Title & Desc', issue: 'Missing meta description', how: 'Add a 120–160 character description with the keyword and a clear benefit.' });
    } else {
      if (descMatch > 0) descScore += 3;
      else fixes.push({ module: 'Meta Title & Desc', issue: 'Keyword missing from meta description', how: 'Include the keyword once naturally near the start.' });
      if (descLen >= 120 && descLen <= 160) descScore += 2;
      else fixes.push({ module: 'Meta Title & Desc', issue: `Meta description is ${descLen} chars (aim 120–160)`, how: 'Trim or expand the description to 120–160 characters.' });
      if (/\b(learn|discover|get|try|see|explore|start|boost|improve|check|find|read)\b/i.test(descText)) descScore += 1;
    }
    total += titleScore + descScore;
    modules.push({ name: 'Meta Title & Desc', score: Math.round(((titleScore + descScore) / 14) * 100) });

    const h1s = yourDoc.querySelectorAll('h1');
    const h2s = yourDoc.querySelectorAll('h2');
    const h1Text = h1s[0]?.textContent.trim() || '';
    const h1Match = countPhrase(h1Text, phrase);
    let h1Score = 0;
    if (h1s.length === 0) {
      fixes.push({ module: 'H1 & Headings', issue: 'No H1 found', how: 'Add a single H1 containing your target keyword.' });
    } else if (h1s.length > 1) {
      fixes.push({ module: 'H1 & Headings', issue: `Multiple H1 tags (${h1s.length})`, how: 'Consolidate to one H1 per page.' });
      h1Score += 1;
    } else h1Score += 2;

    if (h1Match > 0) h1Score += 4;
    else if (h1Text) fixes.push({ module: 'H1 & Headings', issue: 'Keyword missing from H1', how: 'Rewrite the H1 to include the target keyword naturally.' });

    const h2WithKeyword = Array.from(h2s).filter(h => countPhrase(h.textContent, phrase) > 0).length;
    if (h2s.length > 0 && h2WithKeyword === 0) {
      fixes.push({ module: 'H1 & Headings', issue: 'No H2 contains the keyword or variant', how: 'Include the keyword or a close variant in at least one H2.' });
    } else if (h2s.length > 0) h1Score += 2;
    total += h1Score;
    modules.push({ name: 'H1 & Headings', score: Math.round((h1Score / 8) * 100) });

    const wordCount = yourWords;
    let contentScore = 0;
    if (wordCount >= 1500) contentScore += 6;
    else if (wordCount >= 800) contentScore += 5;
    else if (wordCount >= 500) contentScore += 3;
    else if (wordCount >= 300) contentScore += 2;
    else if (wordCount > 0) contentScore += 1;
    if (wordCount < 300) fixes.push({ module: 'Content & Readability', issue: `Thin content (${wordCount} words)`, how: 'Expand to 800+ words with examples and depth that matches intent.' });

    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLen = sentences.length ? (wordCount / sentences.length) : 0;
    if (avgSentenceLen > 0 && avgSentenceLen <= 25) contentScore += 2;
    else if (avgSentenceLen > 25) fixes.push({ module: 'Content & Readability', issue: `Long sentences (avg ${avgSentenceLen.toFixed(0)} words)`, how: 'Break up long sentences for readability.' });

    let readScore = 0;
    const paraCount = yourDoc.querySelectorAll('p').length;
    if (paraCount >= 5) readScore += 2;
    if (avgSentenceLen > 0 && avgSentenceLen <= 20) readScore += 2;
    if (h2s.length >= 3) readScore += 2;

    total += contentScore + readScore;
    modules.push({ name: 'Content & Readability', score: Math.round(((contentScore + readScore) / 14) * 100) });

    const imgs = yourDoc.querySelectorAll('img');
    const totalImgs = imgs.length;
    let imgsWithAlt = 0, imgsWithKeyword = 0;
    imgs.forEach(img => {
      const alt = (img.getAttribute('alt') || '').trim();
      if (alt) imgsWithAlt++;
      if (alt && countPhrase(alt, phrase) > 0) imgsWithKeyword++;
    });
    let imgScore = 0;
    if (totalImgs === 0) imgScore = 3;
    else {
      const altRatio = imgsWithAlt / totalImgs;
      imgScore += Math.round(altRatio * 4);
      if (imgsWithKeyword > 0) imgScore += 2;
      else fixes.push({ module: 'Image Alts', issue: 'No image alt text contains the keyword', how: 'Add descriptive alt text with the keyword to 1–2 key images.' });
      if (altRatio < 1) fixes.push({ module: 'Image Alts', issue: `${totalImgs - imgsWithAlt} image(s) missing alt`, how: 'Add descriptive alt text, or alt="" for decorative images.' });
    }
    total += imgScore;
    modules.push({ name: 'Image Alts', score: totalImgs === 0 ? 50 : Math.round((imgScore / 6) * 100) });

    const baseHost = (() => { try { return new URL(fullUrl).hostname; } catch { return null; } })();
    const internalLinks = Array.from(yourDoc.querySelectorAll('a[href]')).filter(a => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
      if (!baseHost) return href.startsWith('/');
      try { return new URL(href, fullUrl).hostname === baseHost; } catch { return false; }
    });
    const internalWithKeyword = internalLinks.filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    let linkScore = 0;
    if (internalLinks.length === 0) {
      fixes.push({ module: 'Anchor Text', issue: 'No internal links found', how: 'Link to related pages from this page using descriptive anchor text.' });
    } else {
      linkScore += Math.min(3, Math.round(internalLinks.length / 3));
      if (internalWithKeyword > 0) linkScore += 3;
      else fixes.push({ module: 'Anchor Text', issue: 'No internal anchors contain the keyword', how: 'Use the keyword (or a close variant) as anchor text for at least one internal link.' });
    }
    total += linkScore;
    modules.push({ name: 'Anchor Text', score: Math.round((linkScore / 6) * 100) });

    let urlScore = 0;
    const canonical = yourDoc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    if (canonical) urlScore += 2;
    else fixes.push({ module: 'URL & Schema', issue: 'Missing canonical link', how: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.' });

    if (analysisType === 'url' && fullUrl) {
      if (countPhrase(fullUrl, phrase, true) > 0) urlScore += 2;
      else fixes.push({ module: 'URL & Schema', issue: 'Keyword not in URL', how: 'Use a clean, hyphenated URL that includes the target keyword.' });
      const clean = !/[A-Z]/.test(fullUrl) && !/_/.test(fullUrl) && !fullUrl.includes('?');
      if (clean) urlScore += 2;
      else fixes.push({ module: 'URL & Schema', issue: 'URL not clean', how: 'Use lowercase, hyphen-separated URLs without query parameters.' });
    } else {
      urlScore += 2;
    }

    const schemaScripts = yourDoc.querySelectorAll('script[type="application/ld+json"]');
    let schemaScore = 0, schemaTypes = [], schemaValid = false;
    schemaScripts.forEach(s => {
      try {
        const parsed = JSON.parse(s.textContent);
        const collect = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          if (Array.isArray(obj)) { obj.forEach(collect); return; }
          if (obj['@type']) schemaTypes.push(obj['@type']);
          if (obj['@graph']) collect(obj['@graph']);
        };
        collect(parsed);
        schemaValid = true;
      } catch {}
    });
    if (schemaValid) schemaScore += 4;
    else if (schemaScripts.length === 0) fixes.push({ module: 'URL & Schema', issue: 'No structured data detected', how: 'Add JSON-LD schema (Article, FAQ, Product) inside the <head>.' });
    else fixes.push({ module: 'URL & Schema', issue: 'Invalid JSON-LD (parse error)', how: 'Fix the JSON syntax in your schema block.' });

    const known = ['Article', 'BlogPosting', 'WebPage', 'FAQPage', 'HowTo', 'Product', 'Organization', 'BreadcrumbList'];
    if (schemaTypes.some(t => known.includes(t))) schemaScore += 2;
    if (schemaTypes.length >= 2) schemaScore += 2;

    total += urlScore + schemaScore;
    modules.push({ name: 'URL & Schema', score: Math.round(((urlScore + schemaScore) / 14) * 100) });

    let techScore = 0;
    const lang = yourDoc.documentElement.getAttribute('lang') || '';
    if (lang) techScore += 2;
    else fixes.push({ module: 'Technical', issue: 'Missing html lang attribute', how: 'Add lang="en" (or your language) to the <html> tag.' });

    const viewport = yourDoc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    if (viewport.includes('width=device-width')) techScore += 2;
    else fixes.push({ module: 'Technical', issue: 'Missing/invalid viewport meta', how: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });

    const robots = yourDoc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    if (!/noindex/i.test(robots)) techScore += 2;
    else fixes.push({ module: 'Technical', issue: 'Page has noindex directive', how: 'Remove noindex if this page should rank.' });

    const ogTitle = yourDoc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDesc = yourDoc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    if (ogTitle && ogDesc) techScore += 2;
    else fixes.push({ module: 'Technical', issue: 'Missing Open Graph tags', how: 'Add og:title and og:description for better social sharing.' });

    total += techScore;
    modules.push({ name: 'Technical', score: Math.round((techScore / 8) * 100) });

    const capped = Math.min(70, total);

    return {
      score: capped,
      max: 70,
      modules,
      fixes,
      details: {
        titleText, titleMatch, titleLen,
        descText, descMatch, descLen,
        h1Text, h1Match, h1Count: h1s.length,
        wordCount, totalImgs, imgsWithAlt, imgsWithKeyword,
        internalLinks: internalLinks.length, internalWithKeyword,
        canonical, schemaValid, schemaTypes,
        lang, viewport, robots, ogTitle, ogDesc,
        avgSentenceLen, paraCount
      }
    };
  }

  function startSpinnerLoader() {
    results.innerHTML = `
      <div id="loader" class="flex flex-col items-center justify-center space-y-4 mt-8">
        <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p id="module-text" class="text-xl text-green-600 dark:text-green-300 font-medium"></p>
      </div>
    `;
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.getElementById('module-text').textContent = progressModules[0];
    currentModuleIndex = 1;
    moduleInterval = setInterval(() => {
      if (currentModuleIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[currentModuleIndex++];
      }
    }, 700);
  }

  function stopSpinnerLoader() {
    clearInterval(moduleInterval);
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }

  const fetchPage = async (url) => {
    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) return null;
      const html = await res.text();
      return { doc: new DOMParser().parseFromString(html, 'text/html'), html };
    } catch {
      return null;
    }
  };

  urlAnalyzeBtn.addEventListener('click', async () => {
    const yourUrl = pageUrlInput.value.trim();
    const phrase = targetKeywordInput.value.trim();

    if (!yourUrl) { alert('Please enter a page URL'); pageUrlInput.focus(); return; }
    if (!phrase)  { alert('Please enter a target keyword'); targetKeywordInput.focus(); return; }

    codeInput.value = '';
    let fullUrl = yourUrl;
    if (!/^https?:\/\//i.test(yourUrl)) {
      fullUrl = 'https://' + yourUrl;
      pageUrlInput.value = fullUrl;
    }

    startSpinnerLoader();
    const fetched = await fetchPage(fullUrl);
    if (!fetched) {
      stopSpinnerLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Failed to analyze - Whitelist: full-render-v2.traffictorch.workers.dev or use Code Analysis.</p>`;
      return;
    }
    await runAnalysis(fetched.doc, phrase, fullUrl, 'url', fetched.html);
  });

  codeAnalyzeBtn.addEventListener('click', async () => {
    const phrase = targetKeywordInput.value.trim();
    const rawCode = codeInput.value.trim();

    if (!phrase)  { alert('Please enter a target keyword'); targetKeywordInput.focus(); return; }
    if (!rawCode) { alert('Please paste the full HTML code'); codeInput.focus(); return; }

    pageUrlInput.value = '';
    startSpinnerLoader();

    let yourDoc;
    try {
      yourDoc = new DOMParser().parseFromString(rawCode, 'text/html');
    } catch {
      stopSpinnerLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Invalid HTML code.</p>`;
      return;
    }

    const displayUrl = 'https://code-analysis.traffictorch.net';
    await runAnalysis(yourDoc, phrase, displayUrl, 'code', rawCode);
  });

  const getModuleDiagnostics = (moduleName, d, phrase, fullUrl, aiSemantic, variations) => {
    const diags = [];

    if (moduleName === 'Meta Title & Desc') {
      if (!d.titleText) diags.push({ status: '❌', issue: 'Missing title tag' });
      else if (d.titleMatch === 0) diags.push({ status: '❌', issue: 'Keyword missing from meta title' });
      else diags.push({ status: '✅', issue: 'Keyword in meta title' });

      if (d.titleText && d.titleLen < 30) diags.push({ status: '❌', issue: `Title too short (${d.titleLen} chars)` });
      else if (d.titleText && d.titleLen > 60) diags.push({ status: '❌', issue: `Title too long (${d.titleLen} chars)` });
      else if (d.titleText) diags.push({ status: '✅', issue: `Title length ok (${d.titleLen} chars)` });

      if (!d.descText) diags.push({ status: '❌', issue: 'Missing meta description' });
      else if (d.descMatch === 0) diags.push({ status: '❌', issue: 'Keyword missing from meta description' });
      else diags.push({ status: '✅', issue: 'Keyword in meta description' });

      if (d.descText && d.descLen < 120) diags.push({ status: '❌', issue: `Meta description too short (${d.descLen} chars)` });
      else if (d.descText && d.descLen > 160) diags.push({ status: '❌', issue: `Meta description too long (${d.descLen} chars)` });
      else if (d.descText) diags.push({ status: '✅', issue: `Meta description length ok (${d.descLen} chars)` });
    }

    else if (moduleName === 'H1 & Headings') {
      if (d.h1Count === 0) diags.push({ status: '❌', issue: 'No H1 found' });
      else if (d.h1Count > 1) diags.push({ status: '❌', issue: `Multiple H1 tags (${d.h1Count})` });
      else diags.push({ status: '✅', issue: 'Single H1 present' });

      if (d.h1Match === 0) diags.push({ status: '❌', issue: 'Keyword missing from H1' });
      else diags.push({ status: '✅', issue: 'Keyword in H1' });
    }

    else if (moduleName === 'Content & Readability') {
      if (d.wordCount < 300) diags.push({ status: '❌', issue: `Thin content (${d.wordCount} words)` });
      else if (d.wordCount < 800) diags.push({ status: '⚠️', issue: `Moderate depth (${d.wordCount} words)` });
      else diags.push({ status: '✅', issue: `Good depth (${d.wordCount} words)` });

      if (d.avgSentenceLen > 25) diags.push({ status: '❌', issue: `Long sentences (avg ${d.avgSentenceLen.toFixed(0)} words)` });
      else if (d.avgSentenceLen > 0) diags.push({ status: '✅', issue: `Readable sentence length (avg ${d.avgSentenceLen.toFixed(0)} words)` });

      if (d.paraCount < 5) diags.push({ status: '⚠️', issue: `Few paragraphs (${d.paraCount})` });
      else diags.push({ status: '✅', issue: `${d.paraCount} paragraphs` });
    }

    else if (moduleName === 'Image Alts') {
      if (d.totalImgs === 0) diags.push({ status: '⚠️', issue: 'No images on page' });
      else {
        if (d.imgsWithAlt < d.totalImgs) diags.push({ status: '❌', issue: `${d.totalImgs - d.imgsWithAlt} image(s) missing alt` });
        else diags.push({ status: '✅', issue: 'All images have alt text' });
        if (d.imgsWithKeyword > 0) diags.push({ status: '✅', issue: 'Keyword in image alt text' });
        else diags.push({ status: '❌', issue: 'No image alt text contains the keyword' });
      }
    }

    else if (moduleName === 'Anchor Text') {
      if (d.internalLinks === 0) diags.push({ status: '❌', issue: 'No internal links found' });
      else diags.push({ status: '✅', issue: `${d.internalLinks} internal links` });

      if (d.internalWithKeyword > 0) diags.push({ status: '✅', issue: 'Keyword in internal anchor text' });
      else diags.push({ status: '❌', issue: 'No internal anchors contain the keyword' });
    }

    else if (moduleName === 'URL & Schema') {
      if (d.canonical) diags.push({ status: '✅', issue: 'Canonical link present' });
      else diags.push({ status: '❌', issue: 'Missing canonical link' });

      if (d.schemaValid) diags.push({ status: '✅', issue: 'Valid JSON-LD schema' });
      else if (d.schemaTypes.length === 0) diags.push({ status: '❌', issue: 'No structured data detected' });
      else diags.push({ status: '❌', issue: 'Invalid JSON-LD' });
    }

    else if (moduleName === 'Technical') {
      if (d.lang) diags.push({ status: '✅', issue: 'html lang set' });
      else diags.push({ status: '❌', issue: 'Missing html lang' });

      if (d.viewport && d.viewport.includes('width=device-width')) diags.push({ status: '✅', issue: 'Viewport set' });
      else diags.push({ status: '❌', issue: 'Missing or invalid viewport' });

      if (!/noindex/i.test(d.robots)) diags.push({ status: '✅', issue: 'Indexable' });
      else diags.push({ status: '❌', issue: 'noindex directive present' });

      if (d.ogTitle && d.ogDesc) diags.push({ status: '✅', issue: 'Open Graph tags present' });
      else diags.push({ status: '❌', issue: 'Missing Open Graph tags' });
    }

    else if (moduleName === 'AI Semantic Audit') {
      if (!aiSemantic) {
        diags.push({ status: '❌', issue: 'AI semantic audit unavailable' });
      } else {
        diags.push({
          status: aiSemantic.intent?.pageMatchesIntent ? '✅' : '❌',
          issue: `Intent: ${aiSemantic.intent?.predicted || 'unknown'} (page ${aiSemantic.intent?.pageMatchesIntent ? 'matches' : 'may not match'})`
        });
        diags.push({
          status: (aiSemantic.entities?.coverageScore || 0) >= 70 ? '✅' : '❌',
          issue: `Entity coverage: ${aiSemantic.entities?.coverageScore || 0}%`
        });
        diags.push({
          status: (aiSemantic.aeoAnswerability || 0) >= 70 ? '✅' : '❌',
          issue: `AEO answerability: ${aiSemantic.aeoAnswerability || 0}%`
        });
        diags.push({
          status: (aiSemantic.semanticCoverage?.score || 0) >= 70 ? '✅' : '❌',
          issue: `Semantic coverage: ${aiSemantic.semanticCoverage?.score || 0}%`
        });
      }
    }

    else if (moduleName === 'Semantic Coverage') {
      if (!variations) {
        diags.push({ status: '❌', issue: 'Semantic variations audit unavailable' });
      } else {
        const s = variations.verdictSummary || {};
        diags.push({
          status: (s.exact || 0) > 0 ? '✅' : '❌',
          issue: `${s.exact || 0} placement(s) with exact keyword`
        });
        diags.push({
          status: (s.variant || 0) > 0 ? '✅' : '❌',
          issue: `${s.variant || 0} placement(s) with a variant`
        });
        const weak = (s.partial || 0) + (s.absent || 0);
        diags.push({
          status: weak > 0 ? '⚠️' : '✅',
          issue: `${weak} placement(s) partial or absent`
        });
      }
    }

    return diags;
  };

  async function runAnalysis(yourDoc, phrase, fullUrl, analysisType, rawHtml = '') {
    const canProceed = await canRunTool('keyword-tool');
    if (!canProceed) { stopSpinnerLoader(); return; }

    const cmsInfo = detectCMS({ doc: yourDoc, url: analysisType === 'url' ? fullUrl : '' });

    results.dataset.renderedHtml = rawHtml || '';
    results.dataset.headSnapshot = buildHeadSnapshot(yourDoc);
    document.body.setAttribute('data-cms-name', cmsInfo?.name || 'Custom / Unknown');
    document.body.setAttribute('data-cms-version', cmsInfo?.version || '');
    document.body.setAttribute('data-cms-confidence', cmsInfo?.confidence || 'unknown');

    const cleanContent = getCleanContent(yourDoc);
    const yourWords = getWordCount(yourDoc);

    const deterministic = computeDeterministicScore({
      yourDoc, phrase, fullUrl, analysisType, yourWords, cleanContent
    });
    const d = deterministic.details;

    let aiSemantic = null;
    let aiContribution = 0;
    let aiError = null;

    try {
      aiSemantic = await fetchAISemanticAudit({
        targetKeyword: phrase,
        url: analysisType === 'url' ? fullUrl : null,
        pageTitle: d.titleText,
        metaDescription: d.descText,
        h1: d.h1Text,
        pageExcerpt: cleanContent.slice(0, 3500),
        cms: cmsInfo?.name || 'Unknown',
        wordCount: yourWords,
        headingTexts: Array.from(yourDoc.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent.trim()).filter(Boolean).slice(0, 20),
        imageAlts: Array.from(yourDoc.querySelectorAll('img[alt]'))
          .map(i => i.getAttribute('alt')).filter(Boolean).slice(0, 15),
        schemaTypes: d.schemaTypes
      });

      if (aiSemantic && typeof aiSemantic.overallScore === 'number') {
        aiContribution = Math.round((aiSemantic.overallScore / 100) * AI_MAX);
      }
    } catch (e) {
      aiError = String(e.message || e);
      console.warn('AI semantic layer unavailable:', aiError);
    }

    const h2Texts = Array.from(yourDoc.querySelectorAll('h2'))
      .map(h => h.textContent.trim()).filter(Boolean).slice(0, 5);

    const altTexts = Array.from(yourDoc.querySelectorAll('img[alt]'))
      .map(i => i.getAttribute('alt')).filter(a => a && a.trim()).slice(0, 5);

    const baseHostSV = (() => { try { return new URL(fullUrl).hostname; } catch { return null; } })();
    const anchorTexts = Array.from(yourDoc.querySelectorAll('a[href]'))
      .filter(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
        if (!baseHostSV) return href.startsWith('/');
        try { return new URL(href, fullUrl).hostname === baseHostSV; } catch { return false; }
      })
      .map(a => (a.textContent || '').trim())
      .filter(Boolean)
      .slice(0, 5);

    const urlSlug = (() => {
      if (analysisType !== 'url') return '';
      try { return new URL(fullUrl).pathname; } catch { return ''; }
    })();

    const placements = {
      title: d.titleText,
      metaDescription: d.descText,
      h1: d.h1Text,
      h2s: h2Texts,
      imageAlts: altTexts,
      internalAnchors: anchorTexts,
      urlSlug
    };

    let variations = null;
    let variationsError = null;

    try {
      variations = await fetchSemanticVariations({
        targetKeyword: phrase,
        placements
      });
    } catch (e) {
      variationsError = String(e.message || e);
      console.warn('Semantic variations unavailable:', variationsError);
    }

    const deterministicContribution = Math.round((deterministic.score / 70) * DETERMINISTIC_MAX);
    const variationsContribution = variations && typeof variations.overallScore === 'number'
      ? Math.round((variations.overallScore / 100) * VARIATIONS_MAX)
      : 0;

    const yourScore = Math.min(100, deterministicContribution + aiContribution + variationsContribution);
    const allFixes = [...deterministic.fixes];

    if (aiSemantic && Array.isArray(aiSemantic.topGaps)) {
      aiSemantic.topGaps.forEach((gap, i) => {
        allFixes.push({
          module: 'AI Semantic Audit',
          issue: `Semantic gap ${i + 1}: ${gap}`,
          how: 'Expand content to cover this subtopic, entity, or question to improve topical authority and AI search visibility.'
        });
      });
    }

    if (variations && variations.judgments) {
      const j = variations.judgments;
      const pl = placements;
      const gaps = [];
      if (j.title?.verdict === 'absent' || j.title?.verdict === 'partial') gaps.push({ target: 'title', text: pl.title });
      if (j.h1?.verdict === 'absent' || j.h1?.verdict === 'partial') gaps.push({ target: 'H1', text: pl.h1 });
      if (j.metaDescription?.verdict === 'absent' || j.metaDescription?.verdict === 'partial') gaps.push({ target: 'meta description', text: pl.metaDescription });
      if (j.urlSlug?.verdict === 'absent' || j.urlSlug?.verdict === 'partial') gaps.push({ target: 'URL slug', text: pl.urlSlug });
      if (gaps.length) {
        gaps.slice(0, 2).forEach(g => {
          allFixes.push({
            module: 'Semantic Coverage',
            issue: `Add keyword or a semantic variant to the ${g.target}`,
            how: `Currently: "${(g.text || '').slice(0, 80)}" — rewrite to include the target keyword or a close variant while keeping it natural.`
          });
        });
      }
    }

    const auditSaveUrl = analysisType === 'code' ? 'Pasted HTML code' : fullUrl;
    await saveAuditHistory(auditSaveUrl, 'Keyword Placement', yourScore);

    await new Promise(resolve => setTimeout(resolve, 800));
    stopSpinnerLoader();

    const moduleOrder = [
      'Meta Title & Desc', 'H1 & Headings', 'Content & Readability',
      'URL & Schema', 'Image Alts', 'Anchor Text', 'Technical',
      'AI Semantic Audit', 'Semantic Coverage'
    ];
    const moduleIssues = {};
    allFixes.forEach(f => {
      if (!moduleIssues[f.module]) moduleIssues[f.module] = [];
      moduleIssues[f.module].push(f);
    });
    const topPriorityFixes = [];
    moduleOrder.forEach(mod => {
      if (moduleIssues[mod] && moduleIssues[mod].length > 0) {
        topPriorityFixes.push(moduleIssues[mod][0]);
      }
    });
    topPriorityFixes.length = Math.min(3, topPriorityFixes.length);

    const levels = ['Page 2+', 'Page 1 Possible', 'Top 10', 'Top 3 Potential'];
    const currentLevel = yourScore >= 90 ? 3 : yourScore >= 80 ? 2 : yourScore >= 60 ? 1 : 0;
    const projectedLevel = Math.min(3, currentLevel + (topPriorityFixes.length >= 2 ? 2 : topPriorityFixes.length));
    const hasMetaOrContent = topPriorityFixes.some(f => f.module === 'Meta Title & Desc' || f.module === 'Content & Readability');
    const bigGrade = getGrade(yourScore);

    const modules = deterministic.modules.map(m => ({ ...m }));

    const aiScore100 = aiSemantic && typeof aiSemantic.overallScore === 'number'
      ? aiSemantic.overallScore
      : 0;

    modules.push({
      name: 'AI Semantic Audit',
      score: aiScore100,
      aiSemantic,
      aiError
    });

    modules.push({
      name: 'Semantic Coverage',
      score: variations && typeof variations.overallScore === 'number' ? variations.overallScore : 0,
      variations,
      variationsError,
      placements
    });

    const scores = modules.map(m => m.score);

    const offset = 280;
    const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });

    results.innerHTML = `
<!-- Overall Score Card -->
<div class="flex justify-center my-8 sm:my-12 px-2 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Your Page</p>
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourScore / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
            ${yourScore}
          </div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
      Deterministic ${deterministicContribution}/${DETERMINISTIC_MAX} · AI Semantic ${aiContribution}/${AI_MAX} · Variations ${variationsContribution}/${VARIATIONS_MAX}
    </p>
    ${(() => {
      const title = (yourDoc?.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) + '...' : title;
      return `<p id="analyzed-page-title" class="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${escapeHtml(truncated)}</p>`;
    })()}
    <div class="mt-6 text-center">
      <p class="text-5xl sm:text-6xl font-bold ${bigGrade.color} drop-shadow-lg">
        ${bigGrade.emoji} ${bigGrade.grade}
      </p>
    </div>
  </div>
</div>

<!-- Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">On-Page Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
      Radar chart available on desktop/tablet
    </p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
      Visual overview across ${modules.length} modules (7 deterministic + 2 AI)
    </p>
  </div>
</div>

<!-- Module Score Cards -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 my-16">
  ${modules.map((m) => {
    const score = m.score;
    const borderColor = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-yellow-500' : 'border-red-500';
    const textColor   = score >= 80 ? 'text-green-600'   : score >= 60 ? 'text-yellow-600'   : 'text-red-600';
    const grade       = getGrade(Math.round(score));
    const diagnostics = getModuleDiagnostics(m.name, d, phrase, fullUrl, m.aiSemantic, m.variations);
    const hashId      = moduleHashes[m.name] || '';
    const roundedScore = Math.round(score);

    const failItems = diagnostics.filter(x => x.status === '❌');
    const passItems = diagnostics.filter(x => x.status === '✅');
    const warnItems = diagnostics.filter(x => x.status === '⚠️');
    const failedCount = failItems.length;

    const signalsHtml = [
      ...failItems.map(x => `<li class="flex items-start gap-2 text-red-600 dark:text-red-400"><span class="flex-shrink-0">❌</span><span>${escapeHtml(x.issue)}</span></li>`),
      ...warnItems.map(x => `<li class="flex items-start gap-2 text-orange-600 dark:text-orange-400"><span class="flex-shrink-0">⚠️</span><span>${escapeHtml(x.issue)}</span></li>`),
      ...passItems.map(x => `<li class="flex items-start gap-2 text-green-600 dark:text-green-400"><span class="flex-shrink-0">✅</span><span>${escapeHtml(x.issue)}</span></li>`)
    ].join('');

    const cmsLabel = cmsInfo?.name
      ? `${cmsInfo.name}${cmsInfo.version ? ' ' + cmsInfo.version : ''}`
      : 'Unknown';

    const failedList = failItems.map(x => x.issue).join('; ');
    const aiQuestion = `How do I improve my ${m.name} score? Failed checks: ${failedList || 'none'}. Detected CMS: ${cmsLabel}. Target keyword: "${phrase}". Please give CMS-specific answers using the exact keyword.`;

    let fixesHtml;
    if (failedCount > 0) {
      fixesHtml = failItems.map((x, idx) => {
        const failureText = x.issue;
        const fixText     = x.how || fixFor(failureText);
        const rule        = deriveSelectorsForFailure(failureText);
        return `
          ${idx > 0 ? '<div class="mt-6 pt-6 border-t border-red-200 dark:border-red-700"></div>' : ''}
          <p class="font-bold text-red-600 dark:text-red-400 mb-2 leading-snug">❌ ${escapeHtml(failureText)}</p>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(fixText)}</p>
          ${rule ? `
            <button type="button"
                    class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    data-failure="${escapeHtml(failureText)}">
              🔍 Show the code
            </button>
          ` : ''}
        `;
      }).join('');
    } else if (roundedScore < 80) {
      fixesHtml = `
        <p class="font-bold text-orange-600 dark:text-orange-400 mb-2 leading-snug">Module scored average (${roundedScore}/100)</p>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">Review the checklist items and optimize the weakest sub-metric first. Re-run the audit after changes to confirm improvement.</p>
      `;
    } else {
      fixesHtml = '<p class="text-center text-green-600 dark:text-green-400 font-bold py-4">🎉 This module is fully optimized!</p>';
    }

    let details = '';
    if (m.name === 'Meta Title & Desc') {
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${d.titleMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Title:</span><br>
          <span class="text-gray-800 dark:text-gray-200 break-words">${escapeHtml(d.titleText || '(none)')}</span><br>
          ${d.descMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Description:</span><br>
          <span class="text-gray-800 dark:text-gray-200 break-words">${escapeHtml(d.descText || '(none)')}</span>
        </div>`;
    } else if (m.name === 'H1 & Headings') {
      const headingsList = Array.from(yourDoc.querySelectorAll('h1, h2, h3'))
        .slice(0, 10)
        .map(h => `${countPhrase(h.textContent, phrase) > 0 ? '✅' : ''} <span class="font-bold">${h.tagName}:</span> <span class="text-gray-800 dark:text-gray-200 break-words">${escapeHtml(h.textContent.trim())}</span>`)
        .join('<br>');
      details = `<div class="mt-4 text-left space-y-2 text-sm">${headingsList || '<span>No headings found</span>'}</div>`;
    } else if (m.name === 'Content & Readability') {
      details = `
        <div class="mt-4 text-center space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Word count:</span> ${d.wordCount}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Paragraphs:</span> ${d.paraCount}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Avg sentence:</span> ${d.avgSentenceLen.toFixed(1)} words</p>
        </div>`;
    } else if (m.name === 'Image Alts') {
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200 font-bold">${d.imgsWithKeyword}/${d.totalImgs} images have keyword in alt</p>
          <p class="text-gray-800 dark:text-gray-200">${d.imgsWithAlt}/${d.totalImgs} images have alt text</p>
        </div>`;
    } else if (m.name === 'Anchor Text') {
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Internal links:</span> ${d.internalLinks}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">With keyword anchor:</span> ${d.internalWithKeyword}</p>
        </div>`;
    } else if (m.name === 'URL & Schema') {
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${d.canonical ? '✅' : '❌'} <span class="font-bold">Canonical</span><br>
          <span class="text-gray-800 dark:text-gray-200 break-all">${escapeHtml(d.canonical || '(none)')}</span><br>
          ${d.schemaValid ? '✅' : '❌'} <span class="font-bold">Schema types:</span>
          <span class="text-gray-800 dark:text-gray-200">${escapeHtml((d.schemaTypes || []).join(', ') || '(none)')}</span>
        </div>`;
    } else if (m.name === 'Technical') {
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p>${d.lang ? '✅' : '❌'} <span class="font-bold">html lang:</span> ${escapeHtml(d.lang || '(none)')}</p>
          <p>${d.viewport && d.viewport.includes('width=device-width') ? '✅' : '❌'} <span class="font-bold">Viewport:</span> ${escapeHtml((d.viewport || '(none)').slice(0, 60))}</p>
          <p>${!/noindex/i.test(d.robots) ? '✅' : '❌'} <span class="font-bold">Robots:</span> ${escapeHtml(d.robots || '(not set)')}</p>
          <p>${d.ogTitle && d.ogDesc ? '✅' : '❌'} <span class="font-bold">Open Graph:</span> ${d.ogTitle ? 'title present' : 'missing'}</p>
        </div>`;
    } else if (m.name === 'AI Semantic Audit') {
      if (!m.aiSemantic) {
        details = `<p class="mt-4 text-sm text-red-600 dark:text-red-400">AI semantic audit unavailable${m.aiError ? ': ' + escapeHtml(m.aiError.slice(0, 120)) : ''}</p>`;
      } else {
        const ai = m.aiSemantic;
        details = `
          <div class="mt-4 text-left space-y-3 text-sm">
            <div>
              <p class="font-bold text-gray-800 dark:text-gray-200">Intent: <span class="capitalize">${escapeHtml(ai.intent?.predicted || 'unknown')}</span></p>
              <p class="text-gray-700 dark:text-gray-300 text-xs italic">${escapeHtml(ai.intent?.reason || '')}</p>
            </div>
            <div>
              <p class="font-bold text-gray-800 dark:text-gray-200">Entity coverage: ${ai.entities?.coverageScore || 0}%</p>
              ${ai.entities?.missing?.length ? `<p class="text-gray-700 dark:text-gray-300 text-xs">Missing: ${escapeHtml(ai.entities.missing.slice(0, 5).join(', '))}</p>` : ''}
            </div>
            <div>
              <p class="font-bold text-gray-800 dark:text-gray-200">AEO answerability: ${ai.aeoAnswerability || 0}%</p>
              ${ai.questions?.unanswered?.length ? `<p class="text-gray-700 dark:text-gray-300 text-xs">Unanswered: ${escapeHtml(ai.questions.unanswered.slice(0, 3).join(' | '))}</p>` : ''}
            </div>
            <div>
              <p class="font-bold text-gray-800 dark:text-gray-200">E-E-A-T signals:</p>
              <p class="text-gray-700 dark:text-gray-300 text-xs">
                Author ${ai.eeat?.authorSignals || 0} · Citation ${ai.eeat?.citationSignals || 0} · Experience ${ai.eeat?.experienceSignals || 0} · Trust ${ai.eeat?.trustSignals || 0}
              </p>
            </div>
          </div>`;
      }
    } else if (m.name === 'Semantic Coverage') {
      if (!m.variations) {
        details = `<p class="mt-4 text-sm text-red-600 dark:text-red-400">Semantic coverage audit unavailable${m.variationsError ? ': ' + escapeHtml(m.variationsError.slice(0, 120)) : ''}</p>`;
      } else {
        const v = m.variations;
        const j = v.judgments || {};
        const pl = m.placements || {};

        /* Verdict styles */
        const verdictStyles = {
          exact:   { cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',   label: '✅ Exact' },
          variant: { cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',       label: '🔵 Variant' },
          partial: { cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', label: '🟡 Partial' },
          absent:  { cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',           label: '❌ Absent' }
        };
        const badgeHtml = (verdict) => {
          const s = verdictStyles[verdict] || verdictStyles.absent;
          return `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls} whitespace-nowrap">${s.label}</span>`;
        };

        /* Stacked row: label + text on top, badge below */
        const stackedRow = (label, text, verdict) => {
          const truncated = text && text.length > 90 ? text.slice(0, 90) + '…' : (text || '(empty)');
          return `
            <div class="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 text-left">
              <p class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">${escapeHtml(label)}</p>
              <p class="text-[11px] text-gray-800 dark:text-gray-200 break-words mb-2">${escapeHtml(truncated)}</p>
              <div>${badgeHtml(verdict)}</div>
            </div>
          `;
        };

        /* Compact row for use inside collapsible sections */
        const compactRow = (label, text, verdict) => {
          const truncated = text && text.length > 70 ? text.slice(0, 70) + '…' : (text || '(empty)');
          return `
            <div class="py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 text-left">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${escapeHtml(label)}</span>
                ${badgeHtml(verdict)}
              </div>
              <p class="text-[10px] text-gray-700 dark:text-gray-300 break-words leading-snug">${escapeHtml(truncated)}</p>
            </div>
          `;
        };

        /* Collapsible section */
        const collapsibleSection = (title, entries) => {
          if (!entries.length) return '';
          const counts = entries.reduce((acc, e) => {
            acc[e.verdict] = (acc[e.verdict] || 0) + 1;
            return acc;
          }, {});
          const summaryBadges = Object.entries(counts).map(([verdict, count]) => {
            const s = verdictStyles[verdict];
            return `<span class="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${s.cls}">${count}</span>`;
          }).join(' ');
          return `
            <details class="mb-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <summary class="flex items-center justify-between gap-2 p-2.5 cursor-pointer list-none hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">${escapeHtml(title)}</span>
                <span class="flex items-center gap-1 flex-wrap">${summaryBadges}<span class="text-xs text-gray-500 dark:text-gray-400 ml-1">▾</span></span>
              </summary>
              <div class="px-2.5 pb-2 bg-white dark:bg-gray-900/40">
                ${entries.map(e => compactRow(e.label, e.text, e.verdict)).join('')}
              </div>
            </details>
          `;
        };

        /* Primary placements — always visible */
        const primaryHtml = [];
        if (pl.title)           primaryHtml.push(stackedRow('Title', pl.title, j.title?.verdict));
        if (pl.metaDescription) primaryHtml.push(stackedRow('Meta', pl.metaDescription, j.metaDescription?.verdict));
        if (pl.h1)              primaryHtml.push(stackedRow('H1', pl.h1, j.h1?.verdict));
        if (pl.urlSlug)         primaryHtml.push(stackedRow('URL', pl.urlSlug, j.urlSlug?.verdict));

        /* Secondary placements — collapsible */
        const headingEntries = (pl.h2s || []).map((text, i) => ({
          label: `H2 #${i + 1}`,
          text,
          verdict: j.h2s?.[i]?.verdict || 'absent'
        }));
        const altEntries = (pl.imageAlts || []).map((text, i) => ({
          label: `Alt #${i + 1}`,
          text,
          verdict: j.imageAlts?.[i]?.verdict || 'absent'
        }));
        const anchorEntries = (pl.internalAnchors || []).map((text, i) => ({
          label: `Anchor #${i + 1}`,
          text,
          verdict: j.internalAnchors?.[i]?.verdict || 'absent'
        }));

        const s = v.verdictSummary || {};
        details = `
          <div class="mt-4 text-left">
            <div class="grid grid-cols-4 gap-1.5 mb-3 text-center">
              <div class="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-lg font-black text-green-600 dark:text-green-400">${s.exact || 0}</div>
                <div class="text-[8px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Exact</div>
              </div>
              <div class="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div class="text-lg font-black text-blue-600 dark:text-blue-400">${s.variant || 0}</div>
                <div class="text-[8px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Variant</div>
              </div>
              <div class="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div class="text-lg font-black text-yellow-600 dark:text-yellow-400">${s.partial || 0}</div>
                <div class="text-[8px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Partial</div>
              </div>
              <div class="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div class="text-lg font-black text-red-600 dark:text-red-400">${s.absent || 0}</div>
                <div class="text-[8px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Absent</div>
              </div>
            </div>

            <p class="text-[9px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 mb-2">Primary placements</p>
            <div>${primaryHtml.join('')}</div>

            ${collapsibleSection('Headings', headingEntries)}
            ${collapsibleSection('Image alts', altEntries)}
            ${collapsibleSection('Internal anchors', anchorEntries)}
          </div>
        `;
      }
    }

    return `
      <div class="score-card flex flex-col text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
        <h4 class="text-xl font-medium mb-4">${escapeHtml(m.name)}</h4>
        <div class="relative w-28 h-28 mx-auto">
          <svg width="112" height="112" viewBox="0 0 112 112" class="transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="56" cy="56" r="48" stroke="${score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}"
                    stroke-width="12" fill="none" stroke-dasharray="${(score / 100) * 301} 301" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-4xl font-black ${textColor}">${roundedScore}</div>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold ${grade.color}">
            ${grade.emoji} ${grade.grade}
          </div>
        </div>
        <ul class="mt-4 text-left text-sm space-y-2">
          ${signalsHtml}
        </ul>
        ${details}
        <div class="mt-auto pt-5">
          <button
            class="fixes-toggle w-full mt-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold transition"
            data-failed-count="${failedCount}">
            Show Fixes (${failedCount})
          </button>
        </div>
        <div class="fixes-panel hidden mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 text-left">
          ${fixesHtml}
          <div class="mt-6 pt-6 border-t border-red-200 dark:border-red-700 space-y-3">
            <a href="#ask-ai-section"
               class="ask-ai-link block text-purple-600 dark:text-purple-400 font-bold hover:underline"
               data-ai-question="${escapeHtml(aiQuestion)}">
              🤖 Ask AI about this module
            </a>
            <a href="/blog/posts/seo-keyword-help-guide/#${hashId}"
               class="block text-orange-600 dark:text-orange-400 font-bold hover:underline">
              📖 Read the full ${escapeHtml(m.name)} guide
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('')}
</div>

<!-- Top Priority Fixes -->
<div class="my-16">
  <h3 class="text-4xl font-bold text-center text-orange-600 mb-8">Top Priority Fixes</h3>
  ${topPriorityFixes.length ? `
    <div class="space-y-8 max-w-4xl mx-auto">
      ${topPriorityFixes.map((fix, i) => `
        <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-l-8 border-orange-500 flex gap-6">
          <div class="text-5xl font-black text-orange-600">${i + 1}</div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">${escapeHtml(fix.module)}</span>
            </div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">${escapeHtml(fix.issue)}</h4>
            <p class="text-gray-800 dark:text-gray-200">${escapeHtml(fix.how)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '<p class="text-center text-green-500 text-2xl font-bold">Strong optimization — keep it up!</p>'}
</div>

<!-- Ranking Potential + Expected Gains -->
<div class="max-w-6xl mx-auto my-20 grid md:grid-cols-2 gap-8">
  <div class="p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-4 border-orange-500/20">
    <h3 class="text-4xl font-black text-center mb-10 text-orange-600 dark:text-orange-400">Ranking Potential</h3>
    <div class="flex justify-center items-baseline gap-8 mb-10">
      <div class="text-center">
        <div class="px-4 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-2xl font-bold text-gray-600 dark:text-gray-400">
          ${levels[currentLevel]}
        </div>
        <p class="text-lg mt-3 text-gray-600 dark:text-gray-400">Current</p>
      </div>
      <div class="text-5xl text-orange-500">→</div>
      <div class="text-center">
        <div class="px-4 py-4 bg-green-100 dark:bg-green-900/30 rounded-2xl text-2xl font-bold text-green-700 dark:text-green-300">
          ${levels[projectedLevel]}
        </div>
        <p class="text-lg mt-3 text-gray-600 dark:text-gray-400">Projected</p>
      </div>
    </div>
    ${topPriorityFixes.length ? `
      <div class="space-y-4">
        <p class="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">Top priority fixes & impact:</p>
        ${topPriorityFixes.map((fix, i) => `
          <div class="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 text-xl font-bold text-orange-700 dark:text-orange-300">${i + 1}</div>
              <div class="flex-1 min-w-0">
                <p class="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                  <span class="font-bold text-orange-700 dark:text-orange-300">${escapeHtml(fix.issue)}</span><br>
                  ${escapeHtml(fix.how)}
                </p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="text-center py-10">
        <p class="text-4xl mb-4">🎉 Excellent Optimization!</p>
        <p class="text-xl text-gray-600 dark:text-gray-400">Your on-page SEO is strong.</p>
      </div>
    `}
  </div>
  <div class="p-4 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-4xl font-black text-center mb-10">Expected Gains</h3>
    <div class="space-y-8">
      <div class="flex items-center gap-6">
        <div class="text-5xl">🖱️</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Click-Through Rate (CTR)</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg"
                 style="width: ${hasMetaOrContent ? 75 : 50}%; background-color: ${hasMetaOrContent ? '#86efac' : '#fca5a5'};">
              +${hasMetaOrContent ? '25–40' : '15–30'}%
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-5xl">📈</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Impressions</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg"
                 style="width: ${topPriorityFixes.length * 20}%; background-color: ${topPriorityFixes.length >= 2 ? '#86efac' : topPriorityFixes.length === 1 ? '#fdba74' : '#fca5a5'};">
              +${topPriorityFixes.length * 15}–${topPriorityFixes.length * 30}%
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-5xl">🚀</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Organic Traffic</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg"
                 style="width: ${topPriorityFixes.length * 25}%; background-color: ${topPriorityFixes.length >= 2 ? '#86efac' : topPriorityFixes.length === 1 ? '#fdba74' : '#fca5a5'};">
              +${topPriorityFixes.length * 20}–${topPriorityFixes.length * 45}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- CMS Fixes -->
<div id="cms-fixes-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get step-by-step keyword placement fix instructions tailored to your CMS.
  </p>
  <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
    <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
    <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
      <span id="cms-badge-dot" class="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span>
      <span id="cms-badge-name">Custom / Unknown</span>
    </span>
    <button id="cms-override-toggle" class="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline bg-transparent border-none cursor-pointer">Change</button>
  </div>
  <div id="cms-override-panel" class="hidden max-w-md mx-auto mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CMS</label>
    <select id="cms-override-select" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
      <option value="Custom / Unknown">Custom / Unknown</option>
      <option value="WordPress">WordPress</option>
      <option value="Shopify">Shopify</option>
      <option value="Wix">Wix</option>
      <option value="Squarespace">Squarespace</option>
      <option value="Webflow">Webflow</option>
      <option value="Drupal">Drupal</option>
      <option value="Joomla">Joomla</option>
      <option value="Ghost">Ghost</option>
      <option value="HubSpot CMS">HubSpot CMS</option>
      <option value="Magento">Magento</option>
      <option value="BigCommerce">BigCommerce</option>
      <option value="PrestaShop">PrestaShop</option>
    </select>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version (optional)</label>
    <input id="cms-override-version" type="text" placeholder="e.g. 6.4.2" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
  </div>
  <div class="text-center">
    <button id="cms-fixes-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">Generate CMS Fixes</button>
    <p id="cms-fixes-no-fixes" class="hidden mt-4 text-lg text-green-600 dark:text-green-400 font-medium">No fixes needed — your keyword placement is solid. 🎉</p>
  </div>
  <div id="cms-fixes-answer-container" class="mt-6 hidden">
    <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>

<!-- Ask AI -->
<div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🤖 Ask Traffic Torch AI</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get tailored answers about keyword placement, semantic coverage, meta tags and content depth.
  </p>
  <div class="flex flex-col sm:flex-row gap-4">
    <textarea id="ai-question-input" placeholder="e.g., Why is my meta title missing the keyword? How do I improve entity coverage?" rows="3" class="flex-1 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y min-h-[60px]"></textarea>
    <button id="ask-ai-btn" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">Ask Traffic Torch AI</button>
  </div>
  <div id="ai-answer-container" class="mt-6 hidden">
    <div id="ai-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>

<!-- Share Dashboard -->
<div id="share-dashboard-container" class="mt-16"></div>
    `;

    const pluginSection = document.createElement('div');
    pluginSection.id = 'plugin-solutions-section';
    pluginSection.className = 'mt-20';
    results.appendChild(pluginSection);

    const failedMetrics = [];
    if (d.titleMatch === 0 || !d.titleText) {
      failedMetrics.push({ name: 'Meta Title', grade: { text: 'Needs Work', color: 'text-red-600', emoji: '❌' } });
    }
    if (d.descMatch === 0 || !d.descText) {
      failedMetrics.push({ name: 'Meta Description', grade: { text: 'Needs Work', color: 'text-red-600', emoji: '❌' } });
    }
    if (!d.schemaValid) {
      failedMetrics.push({ name: 'Structured Data (Schema)', grade: { text: 'Needs Work', color: 'text-red-600', emoji: '❌' } });
    }
    if (d.imgsWithKeyword === 0 && d.totalImgs > 0) {
      failedMetrics.push({ name: 'Image Alts', grade: { text: 'Needs Work', color: 'text-red-600', emoji: '❌' } });
    }
    if (failedMetrics.length > 0) {
      renderPluginSolutions(failedMetrics);
    }

    setTimeout(() => {
      const canvas = document.getElementById('health-radar');
      if (!canvas) return;
      try {
        const ctx = canvas.getContext('2d');
        const labelColor = '#9ca3af';
        const gridColor = 'rgba(156, 163, 175, 0.3)';
        const borderColor = '#fb923c';
        const fillColor = 'rgba(251, 146, 60, 0.15)';
        window.myChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: modules.map(m => m.name),
            datasets: [{
              label: 'Health Score',
              data: scores,
              backgroundColor: fillColor,
              borderColor: borderColor,
              borderWidth: 4,
              pointRadius: 8,
              pointHoverRadius: 12,
              pointBackgroundColor: scores.map(s => s >= 80 ? '#22c55e' : s >= 60 ? '#fb923c' : '#ef4444'),
              pointBorderColor: '#fff',
              pointBorderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                beginAtZero: true,
                min: 0,
                max: 100,
                ticks: { stepSize: 20, color: labelColor },
                grid: { color: gridColor },
                angleLines: { color: gridColor },
                pointLabels: { color: labelColor, font: { size: 11, weight: '600' } }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      } catch (e) {}
    }, 150);

    let displayUrl = 'traffictorch.net';
    if (analysisType === 'url' && fullUrl) {
      let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
      const firstSlash = cleaned.indexOf('/');
      displayUrl = firstSlash !== -1 ? cleaned.slice(0, firstSlash) + '\n' + cleaned.slice(firstSlash) : cleaned;
    } else if (analysisType === 'code') {
      displayUrl = 'Pasted HTML Code';
    }
    document.body.setAttribute('data-url', displayUrl);

    const moduleScores = modules.map(m => ({ name: m.name, score: m.score }));

    const passedMetrics = [];
    const failedMetricsShare = [];
    modules.forEach(m => {
      if (m.score >= 70) passedMetrics.push(m.name);
      else failedMetricsShare.push(m.name);
    });
    moduleOrder.forEach(mod => {
      const diags = getModuleDiagnostics(mod, d, phrase, fullUrl, aiSemantic, variations);
      diags.forEach(x => {
        if (x.status === '✅') passedMetrics.push(x.issue);
        else if (x.status === '❌') failedMetricsShare.push(x.issue);
      });
    });

    const aiFixes = topPriorityFixes.map(f => f.issue + ': ' + f.how);

    const shareLink = analysisType === 'url' && fullUrl
      ? `${window.location.origin}/keyword-tool/?url=${encodeURIComponent(fullUrl)}&keyword=${encodeURIComponent(phrase)}`
      : '';

    const shareData = {
      toolName: 'Keyword Placement Tool',
      url: analysisType === 'url' ? fullUrl : 'Pasted HTML',
      pageTitle: yourDoc?.title || 'Keyword Analysis',
      overallScore: yourScore,
      moduleScores: moduleScores,
      passedMetrics: passedMetrics,
      failedMetrics: failedMetricsShare,
      aiFixes: aiFixes,
      rawData: { deterministic: deterministic.details, modules, topPriorityFixes, aiSemantic, variations },
      shareLink: shareLink
    };

    const shareContainer = document.getElementById('share-dashboard-container');
    if (shareContainer) {
      if (analysisType === 'url' && fullUrl) {
        initShareModule(shareContainer, shareData);
      } else {
        shareContainer.innerHTML = `
          <div class="text-center text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-600 rounded-xl">
            <p>Sharing is available for live URLs only. Please run the analysis with a URL to share this report.</p>
          </div>`;
      }
    }
    
    // 🏆 Leaderboard submission button
if (window.TrafficTorchLeaderboard && analysisType === 'url' && fullUrl) {
  const submitHost = document.getElementById('share-dashboard-container')?.parentElement || results;
  const moduleScoresForBoard = modules
    .filter(m => ['Meta Title & Desc','H1 & Headings','Content & Readability',
                  'Image Alts','Anchor Text','URL & Schema','Technical',
                  'AI Semantic Audit','Semantic Coverage'].includes(m.name))
    .map(m => ({ name: m.name, score: Math.round(m.score || 0) }));

  window.TrafficTorchLeaderboard.injectButton(submitHost, {
    tool: 'keyword-tool',
    url: fullUrl,
    title: (yourDoc?.title || '').trim().slice(0, 200) || 'Untitled page',
    score: yourScore,
    moduleScores: moduleScoresForBoard
  });
}

// 🗣️ Post to Community button
if (analysisType === 'url' && fullUrl) {
  const postHost = document.getElementById('share-dashboard-container')?.parentElement || results;
  injectPostToCommunity(postHost, {
    url: fullUrl,
    title: (yourDoc?.title || '').trim().slice(0, 200) || 'Untitled page',
    score: yourScore,
    tool: 'Keyword Placement',
    moduleScores: modules.map(m => ({ name: m.name, score: Math.round(m.score || 0) }))
  });
}

    const askBtn = document.getElementById('ask-ai-btn');
    const askInput = document.getElementById('ai-question-input');
    const answerContainer = document.getElementById('ai-answer-container');
    const answerContent = document.getElementById('ai-answer-content');

    if (askBtn) {
      const newAskBtn = askBtn.cloneNode(true);
      askBtn.parentNode.replaceChild(newAskBtn, askBtn);

      newAskBtn.addEventListener('click', async () => {
        const canProceed = await canRunTool('keyword-tool');
        if (!canProceed) return;

        const question = askInput?.value?.trim();
        if (!question) { alert('Please enter a question.'); return; }

        newAskBtn.disabled = true;
        newAskBtn.textContent = 'Thinking...';
        answerContainer.classList.remove('hidden');
        answerContent.innerHTML = '⏳ Traffic Torching...';

        try {
          const moduleScoresMap = {};
          modules.forEach(m => {
            const key = m.name.toLowerCase().replace(/[&\s]+/g, '');
            moduleScoresMap[key] = m.score;
          });

          const excerptDoc = yourDoc.cloneNode(true);
          excerptDoc.querySelectorAll('nav, footer, aside, script, style, .sidebar, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());
          const contentRoot = excerptDoc.querySelector('main, article, [role="main"]') || excerptDoc.body;
          const paragraphs = Array.from(contentRoot?.querySelectorAll('p') || [])
            .map(p => p.textContent.replace(/\s+/g, ' ').trim())
            .filter(t => t.length > 60);
          const pageExcerpt = (paragraphs[0] || contentRoot?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400);

          const auditPayload = {
            question,
            auditData: {
              url: analysisType === 'url' ? fullUrl : 'Pasted HTML',
              pageTitle: d.titleText || 'Keyword Analysis',
              metaDescription: d.descText,
              h1: d.h1Text,
              pageExcerpt,
              headSnapshot: results.dataset.headSnapshot || '',
              langAttribute: d.lang,
              viewportContent: d.viewport,
              linkCount: yourDoc.querySelectorAll('a').length,
              imageCount: yourDoc.querySelectorAll('img').length,
              headingCount: yourDoc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
              ctaCount: yourDoc.querySelectorAll('button, [role="button"], input[type="submit"], a[href*="contact"], a[href*="signup"], a[href*="demo"], a[href*="pricing"]').length,
              wordCount: d.wordCount,
              cms: {
                name: cmsInfo?.name || 'Custom / Unknown',
                version: cmsInfo?.version || null,
                confidence: cmsInfo?.confidence || 'low'
              },
              targetKeyword: phrase,
              overallScore: yourScore,
              deterministicScore: deterministicContribution,
              aiContribution,
              variationsContribution,
              scores: moduleScoresMap,
              flags: {
                titleMatch: d.titleMatch > 0,
                descMatch: d.descMatch > 0,
                h1Match: d.h1Match > 0,
                hasCanonical: !!d.canonical,
                hasSchema: d.schemaValid,
                hasKeywordInAlts: d.imgsWithKeyword > 0,
                hasKeywordInAnchors: d.internalWithKeyword > 0
              },
              metrics: {
                wordCount: d.wordCount,
                totalImages: d.totalImgs,
                imagesWithAlt: d.imgsWithAlt,
                imagesWithKeyword: d.imgsWithKeyword,
                internalLinks: d.internalLinks,
                internalWithKeyword: d.internalWithKeyword
              },
              failedItems: failedMetricsShare.slice(0, 10),
              priorityFixes: topPriorityFixes.map(f => ({
                name: f.issue, module: f.module, score: 0, impact: '', desc: f.how || ''
              })),
              aiSemantic: aiSemantic || null,
              semanticVariations: variations || null,
              browserMetrics: null
            }
          };

          const response = await fetch('https://keyword-placement-ai.traffictorch.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditPayload)
          });

          if (!response.ok) throw new Error(`Server error (${response.status})`);
          const aiResponse = await response.json();

          if (aiResponse.success) {
            let html = `🧠 <strong>Traffic Torch AI</strong><br><br>${renderCodeBlocks(aiResponse.answer)}`;
            if (Array.isArray(aiResponse.warnings) && aiResponse.warnings.length) {
              const warningText = aiResponse.warnings.join(' ');
              html = `<div style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${warningText}</div>` + html;
            }
            answerContent.innerHTML = html;
          } else {
            answerContent.innerHTML = `❌ Error: ${escapeHtml(aiResponse.error || 'Unknown error')}`;
          }
        } catch (err) {
          answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${escapeHtml(err.message)})`;
        } finally {
          newAskBtn.disabled = false;
          newAskBtn.textContent = 'Ask Traffic Torch AI';
        }
      });
    }

    const cmsFixesBtn        = document.getElementById('cms-fixes-btn');
    const cmsBadgeDot        = document.getElementById('cms-badge-dot');
    const cmsBadgeName       = document.getElementById('cms-badge-name');
    const cmsOverrideToggle  = document.getElementById('cms-override-toggle');
    const cmsOverridePanel   = document.getElementById('cms-override-panel');
    const cmsOverrideSelect  = document.getElementById('cms-override-select');
    const cmsOverrideVersion = document.getElementById('cms-override-version');
    const cmsNoFixes         = document.getElementById('cms-fixes-no-fixes');
    const cmsAnswerContainer = document.getElementById('cms-fixes-answer-container');
    const cmsAnswerContent   = document.getElementById('cms-fixes-answer-content');

    if (cmsBadgeName) {
      let label = cmsInfo.name || 'Custom / Unknown';
      if (cmsInfo.version) label += ' ' + cmsInfo.version;
      cmsBadgeName.textContent = label;
    }
    if (cmsBadgeDot) {
      let dotClass = 'bg-gray-400';
      if (cmsInfo.confidence === 'high') dotClass = 'bg-green-500';
      else if (cmsInfo.confidence === 'medium') dotClass = 'bg-yellow-500';
      else if (cmsInfo.confidence === 'low') dotClass = 'bg-orange-500';
      cmsBadgeDot.className = 'inline-block w-2.5 h-2.5 rounded-full mr-2 ' + dotClass;
    }

    if (cmsOverrideSelect) {
      const known = Array.from(cmsOverrideSelect.options).map(o => o.value);
      cmsOverrideSelect.value = known.includes(cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
    }
    if (cmsOverrideVersion && cmsInfo.version) cmsOverrideVersion.value = cmsInfo.version;

    cmsOverrideToggle?.addEventListener('click', () => {
      cmsOverridePanel?.classList.toggle('hidden');
    });

    if (topPriorityFixes.length === 0) {
      if (cmsFixesBtn) {
        cmsFixesBtn.disabled = true;
        cmsFixesBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      cmsNoFixes?.classList.remove('hidden');
    }

    cmsFixesBtn?.addEventListener('click', async () => {
      if (topPriorityFixes.length === 0) return;
      const canProceed = await canRunTool('keyword-tool');
      if (!canProceed) return;

      const selectedCms = cmsOverrideSelect?.value?.trim() || cmsInfo.name || 'Custom / Unknown';
      const selectedVersion = cmsOverrideVersion?.value?.trim() || cmsInfo.version || null;

      cmsFixesBtn.disabled = true;
      const originalLabel = cmsFixesBtn.textContent;
      cmsFixesBtn.textContent = 'Generating...';
      cmsAnswerContainer?.classList.remove('hidden');
      if (cmsAnswerContent) cmsAnswerContent.textContent = '⏳ Traffic Torching...';

      try {
        const payload = {
          cms: selectedCms,
          cmsVersion: selectedVersion,
          cmsConfidence: cmsInfo.confidence,
          cmsSignals: cmsInfo.signals,
          url: analysisType === 'url' ? fullUrl : null,
          pageTitle: yourDoc?.title || null,
          overallScore: yourScore,
          scores: {
            metaTitleDesc: modules.find(m => m.name === 'Meta Title & Desc')?.score || 0,
            h1Headings: modules.find(m => m.name === 'H1 & Headings')?.score || 0,
            contentReadability: modules.find(m => m.name === 'Content & Readability')?.score || 0,
            imageAlts: modules.find(m => m.name === 'Image Alts')?.score || 0,
            anchorText: modules.find(m => m.name === 'Anchor Text')?.score || 0,
            urlSchema: modules.find(m => m.name === 'URL & Schema')?.score || 0,
            technical: modules.find(m => m.name === 'Technical')?.score || 0,
            aiSemantic: modules.find(m => m.name === 'AI Semantic Audit')?.score || 0,
            semanticCoverage: modules.find(m => m.name === 'Semantic Coverage')?.score || 0
          },
          priorityFixes: topPriorityFixes.slice(0, 3).map(f => ({
            module: f.module, name: f.issue, howToFix: f.how
          })),
          mode: analysisType === 'code' ? 'pasted-code' : 'live-url',
          targetKeyword: phrase || null
        };

        const response = await fetch('https://keyword-placement-cms-fixes.traffictorch.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Server error (${response.status})`);
        const data = await response.json();

        if (data.success && cmsAnswerContent) {
          cmsAnswerContent.innerHTML = '';
          const header = document.createElement('div');
          header.style.fontWeight = 'bold';
          header.style.marginBottom = '0.75rem';
          header.textContent = '🛠️ CMS Fixes for ' +
            (data.cms || selectedCms) + (data.cmsVersion ? ' ' + data.cmsVersion : '');
          const body = document.createElement('div');
          body.innerHTML = renderCodeBlocks(data.answer || '');
          let warningEl = null;
          if (Array.isArray(data.warnings) && data.warnings.length) {
            warningEl = document.createElement('div');
            warningEl.style.marginTop = '0.75rem';
            warningEl.style.padding = '0.5rem 0.75rem';
            warningEl.style.borderRadius = '0.5rem';
            warningEl.style.background = '#fef3c7';
            warningEl.style.color = '#92400e';
            warningEl.style.fontSize = '0.85rem';
            warningEl.textContent = data.warnings.join(' ');
          }
          cmsAnswerContent.appendChild(header);
          cmsAnswerContent.appendChild(body);
          if (warningEl) cmsAnswerContent.appendChild(warningEl);
        } else if (cmsAnswerContent) {
          cmsAnswerContent.innerHTML = '❌ Error: ' + escapeHtml(data.error || 'Unknown error');
        }
      } catch (err) {
        if (cmsAnswerContent) {
          cmsAnswerContent.innerHTML = '❌ Failed to generate CMS fixes. Please try again. (' + escapeHtml(err.message) + ')';
        }
      } finally {
        cmsFixesBtn.disabled = false;
        cmsFixesBtn.textContent = originalLabel;
      }
    });
  }
});

function injectPostToCommunity(container, payload) {
  if (!container || container.querySelector('.tt-post-community-wrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'tt-post-community-wrap';
  wrap.style.cssText = 'margin-top:1.5rem;padding:1.25rem;border-radius:1rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)';
  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <strong style="font-size:1.05rem">🗣️ Share to Network Feed</strong>
        <p style="font-size:0.85rem;color:#9ca3af;margin-top:0.35rem">Post this audit to the UX / SEO / AEO feed. Add a short note (360 chars).</p>
      </div>
      <button type="button" class="tt-post-community-toggle" style="padding:0.6rem 1.4rem;border-radius:0.75rem;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-weight:700;border:none;cursor:pointer;white-space:nowrap">Post to Community</button>
    </div>
    <div class="tt-post-community-panel" style="display:none;margin-top:1rem">
      <div style="display:flex;gap:0.75rem;margin-bottom:0.75rem;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:0.35rem;font-size:0.85rem"><input type="radio" name="tt-pc-cat" value="ux"> UX</label>
        <label style="display:flex;align-items:center;gap:0.35rem;font-size:0.85rem"><input type="radio" name="tt-pc-cat" value="seo" checked> SEO</label>
        <label style="display:flex;align-items:center;gap:0.35rem;font-size:0.85rem"><input type="radio" name="tt-pc-cat" value="aeo"> AEO</label>
      </div>
      <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
        <select class="tt-pc-domain-mode" style="padding:0.4rem 0.6rem;border-radius:0.5rem;background:#1f2937;color:#fff;border:1px solid #374151;font-size:0.85rem">
          <option value="domain">Show domain only</option>
          <option value="hidden">Hide URL</option>
          <option value="full">Show full URL</option>
        </select>
        <input type="text" class="tt-pc-label" placeholder="Optional label if hidden" maxlength="60" style="flex:1;padding:0.4rem 0.6rem;border-radius:0.5rem;background:#1f2937;color:#fff;border:1px solid #374151;font-size:0.85rem">
      </div>
      <textarea class="tt-pc-note" maxlength="360" rows="3" placeholder="What did you learn? (360 chars max)" style="width:100%;padding:0.6rem;border-radius:0.5rem;background:#1f2937;color:#fff;border:1px solid #374151;font-size:0.9rem;resize:vertical"></textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem">
        <span class="tt-pc-count" style="font-size:0.75rem;color:#9ca3af">0 / 360</span>
        <div style="display:flex;gap:0.5rem">
          <button type="button" class="tt-pc-cancel" style="padding:0.5rem 1rem;border-radius:0.5rem;background:transparent;color:#9ca3af;border:1px solid #4b5563;cursor:pointer;font-size:0.85rem">Cancel</button>
          <button type="button" class="tt-pc-submit" style="padding:0.5rem 1.2rem;border-radius:0.5rem;background:#f97316;color:#fff;border:none;font-weight:700;cursor:pointer;font-size:0.85rem">Publish</button>
        </div>
      </div>
      <p class="tt-pc-status" style="font-size:0.85rem;margin-top:0.5rem"></p>
    </div>
  `;
  container.appendChild(wrap);

  const toggle = wrap.querySelector('.tt-post-community-toggle');
  const panel  = wrap.querySelector('.tt-post-community-panel');
  const note   = wrap.querySelector('.tt-pc-note');
  const count  = wrap.querySelector('.tt-pc-count');
  const status = wrap.querySelector('.tt-pc-status');
  const submit = wrap.querySelector('.tt-pc-submit');
  const cancel = wrap.querySelector('.tt-pc-cancel');
  const label  = wrap.querySelector('.tt-pc-label');
  const domain = wrap.querySelector('.tt-pc-domain-mode');

  toggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    toggle.textContent = panel.style.display === 'none' ? 'Post to Community' : 'Close';
  });

  note.addEventListener('input', () => {
    count.textContent = `${note.value.length} / 360`;
  });

  cancel.addEventListener('click', () => {
    panel.style.display = 'none';
    toggle.textContent = 'Post to Community';
    status.textContent = '';
  });

  submit.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      status.textContent = '❌ Please log in first.';
      status.style.color = '#ef4444';
      return;
    }
    const category = wrap.querySelector('input[name="tt-pc-cat"]:checked')?.value || 'seo';
    submit.disabled = true;
    submit.textContent = 'Publishing…';
    try {
      const res = await fetch('https://traffic-torch-auth.traffictorch.workers.dev/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          note: note.value.trim(),
          tool: payload.tool,
          url: payload.url,
          page_title: payload.title,
          score: payload.score,
          domain_mode: domain.value,
          domain_label: label.value.trim() || null,
          module_scores: payload.moduleScores
        })
      });
      const data = await res.json();
      if (data.success) {
        status.textContent = '✅ Posted to the feed!';
        status.style.color = '#22c55e';
        submit.textContent = 'Posted ✓';
        setTimeout(() => {
          panel.style.display = 'none';
          toggle.textContent = 'Post to Community';
          submit.disabled = false;
          submit.textContent = 'Publish';
          note.value = '';
          count.textContent = '0 / 360';
        }, 2000);
      } else {
        status.textContent = '❌ ' + (data.error || 'Failed');
        status.style.color = '#ef4444';
        submit.disabled = false;
        submit.textContent = 'Publish';
      }
    } catch (e) {
      status.textContent = '❌ ' + e.message;
      status.style.color = '#ef4444';
      submit.disabled = false;
      submit.textContent = 'Publish';
    }
  });
}