// Keyword VS Tool Script v1.1
// Hybrid: 70 deterministic + 30 AI semantic per page, side-by-side comparison.

import { canRunTool } from '/main.js?v=1.1';
import { initShareModule } from '/share-module.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const SEMANTIC_VS_WORKER = 'https://keyword-vs-semantic-audit.traffictorch.workers.dev/';
const TOKEN_KEY = 'traffic_torch_jwt';

const DETERMINISTIC_MAX = 70;
const AI_MAX = 30;

/* ────────────────────────────────────────────────────────────────
   Shared: code-block renderer for AI responses
   ──────────────────────────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────────────────
   Head snapshot for AI payload
   ──────────────────────────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────────────────
   Safe phrase counter (word-boundary, no double counting)
   ──────────────────────────────────────────────────────────────── */
function countPhrase(text = '', phrase = '', isUrl = false) {
  if (!text || !phrase) return 0;
  const lower = String(text).toLowerCase();
  const p = String(phrase).toLowerCase().trim();
  if (!p) return 0;

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (isUrl) {
    const urlWords = lower
      .replace(/https?:\/\//gi, '')
      .replace(/[^a-z0-9]+/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const phraseWords = p.split(/\s+/).filter(Boolean);
    if (!phraseWords.length || !urlWords.length) return 0;
    const matched = phraseWords.filter(w => urlWords.includes(w)).length;
    return matched / phraseWords.length >= 0.6 ? 1 : 0;
  }

  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(p)}(?![\\p{L}\\p{N}])`, 'giu');
  const m = lower.match(re);
  return m ? m.length : 0;
}

/* ────────────────────────────────────────────────────────────────
   Content extraction (keeps <header>, removes only noise)
   ──────────────────────────────────────────────────────────────── */
function getCleanContent(doc) {
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
}

const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;

/* ────────────────────────────────────────────────────────────────
   CMS detection
   ──────────────────────────────────────────────────────────────── */
function detectCMS(doc) {
  if (!doc?.documentElement) return 'unknown';
  const html = doc.documentElement.outerHTML.toLowerCase();
  if (html.includes('wp-content') || html.includes('wp-includes')) return 'WordPress';
  if (html.includes('cdn.shopify.com')) return 'Shopify';
  if (html.includes('wixstatic')) return 'Wix';
  if (html.includes('squarespace')) return 'Squarespace';
  if (html.includes('webflow')) return 'Webflow';
  if (html.includes('framerusercontent')) return 'Framer';
  if (html.includes('joomla')) return 'Joomla';
  if (html.includes('drupal')) return 'Drupal';
  if (html.includes('ghost.io')) return 'Ghost';
  if (html.includes('hubspot')) return 'HubSpot';
  if (html.includes('/_next/')) return 'Next.js';
  if (html.includes('nuxt')) return 'Nuxt';
  if (html.includes('gatsby')) return 'Gatsby';
  return 'unknown';
}

/* ────────────────────────────────────────────────────────────────
   Grade helpers
   ──────────────────────────────────────────────────────────────── */
const getGrade = (score) => {
  if (score >= 90) return { grade: 'Excellent',  emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { grade: 'Strong',     emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 50) return { grade: 'Average',    emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
  return               { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
};

/* ────────────────────────────────────────────────────────────────
   Deterministic scoring (70 pts) — works for one page
   ──────────────────────────────────────────────────────────────── */
function computeDeterministicScore({ doc, phrase, url, analysisType }) {
  const fixes = [];
  const modules = [];
  let total = 0;

  const safeUrl = url || '';
  const wordCount = getWordCount(doc);
  const cleanContent = getCleanContent(doc);

  /* 1. Meta Title & Desc — 14 pts */
  const titleText = doc.querySelector('title')?.textContent.trim() || '';
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

  const descText = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
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

  /* 2. H1 & Headings — 8 pts */
  const h1s = doc.querySelectorAll('h1');
  const h2s = doc.querySelectorAll('h2');
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

  /* 3. Content & Readability — 14 pts */
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
  const paraCount = doc.querySelectorAll('p').length;
  if (paraCount >= 5) readScore += 2;
  if (avgSentenceLen > 0 && avgSentenceLen <= 20) readScore += 2;
  if (h2s.length >= 3) readScore += 2;
  total += contentScore + readScore;
  modules.push({ name: 'Content & Readability', score: Math.round(((contentScore + readScore) / 14) * 100) });

  /* 4. Image Alts — 6 pts */
  const imgs = doc.querySelectorAll('img');
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

  /* 5. Anchor Text — 6 pts */
  const baseHost = (() => { try { return new URL(safeUrl).hostname; } catch { return null; } })();
  const internalLinks = Array.from(doc.querySelectorAll('a[href]')).filter(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
    if (!baseHost) return href.startsWith('/');
    try { return new URL(href, safeUrl).hostname === baseHost; } catch { return false; }
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

  /* 6. URL & Schema — 14 pts */
  let urlScore = 0;
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  if (canonical) urlScore += 2;
  else fixes.push({ module: 'URL & Schema', issue: 'Missing canonical link', how: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.' });

  if (analysisType === 'url' && safeUrl) {
    if (countPhrase(safeUrl, phrase, true) > 0) urlScore += 2;
    else fixes.push({ module: 'URL & Schema', issue: 'Keyword not in URL', how: 'Use a clean, hyphenated URL that includes the target keyword.' });
    const clean = !/[A-Z]/.test(safeUrl) && !/_/.test(safeUrl) && !safeUrl.includes('?');
    if (clean) urlScore += 2;
    else fixes.push({ module: 'URL & Schema', issue: 'URL not clean', how: 'Use lowercase, hyphen-separated URLs without query parameters.' });
  } else {
    urlScore += 2;
  }

  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
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

  /* 7. Technical — 8 pts */
  let techScore = 0;
  const lang = doc.documentElement.getAttribute('lang') || '';
  if (lang) techScore += 2;
  else fixes.push({ module: 'Technical', issue: 'Missing html lang attribute', how: 'Add lang="en" (or your language) to the <html> tag.' });

  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  if (viewport.includes('width=device-width')) techScore += 2;
  else fixes.push({ module: 'Technical', issue: 'Missing/invalid viewport meta', how: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });

  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
  if (!/noindex/i.test(robots)) techScore += 2;
  else fixes.push({ module: 'Technical', issue: 'Page has noindex directive', how: 'Remove noindex if this page should rank.' });

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  if (ogTitle && ogDesc) techScore += 2;
  else fixes.push({ module: 'Technical', issue: 'Missing Open Graph tags', how: 'Add og:title and og:description for better social sharing.' });

  total += techScore;
  modules.push({ name: 'Technical', score: Math.round((techScore / 8) * 100) });

  const capped = Math.min(DETERMINISTIC_MAX, total);

  return {
    score: capped,
    max: DETERMINISTIC_MAX,
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

/* ────────────────────────────────────────────────────────────────
   AI semantic layer (30 pts) — via keyword-vs-semantic-audit worker
   ──────────────────────────────────────────────────────────────── */
async function fetchAISemanticVs(payload, { forceRefresh = false } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(SEMANTIC_VS_WORKER, {
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

/* ────────────────────────────────────────────────────────────────
   Main DOM ready
   ──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const yourInput = document.getElementById('your-url');
  const compInput = document.getElementById('competitor-url');
  const phraseInput = document.getElementById('target-phrase');
  const results = document.getElementById('results');

  const urlParams = new URLSearchParams(window.location.search);

  const sharedYourUrl = urlParams.get('your-url');
  if (sharedYourUrl) {
    try {
      let decoded = decodeURIComponent(sharedYourUrl);
      if (!/^https?:\/\//i.test(decoded)) decoded = 'https://' + decoded;
      yourInput.value = decoded;
    } catch {}
  }
  const sharedCompUrl = urlParams.get('comp-url');
  if (sharedCompUrl) {
    try {
      let decoded = decodeURIComponent(sharedCompUrl);
      if (!/^https?:\/\//i.test(decoded)) decoded = 'https://' + decoded;
      compInput.value = decoded;
    } catch {}
  }
  const sharedKeyword = urlParams.get('keyword');
  if (sharedKeyword) {
    try {
      const decoded = decodeURIComponent(sharedKeyword).trim();
      if (decoded) phraseInput.value = decoded;
    } catch {}
  }
  if (sharedYourUrl && sharedCompUrl && sharedKeyword) {
    setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 400);
  }

  const PROXY = 'https://full-render-v2.traffictorch.workers.dev/';

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

  const moduleHashes = {
    'Meta Title & Desc': 'meta-title-desc',
    'H1 & Headings': 'h1-headings',
    'Content & Readability': 'content-density',
    'Image Alts': 'image-alts',
    'Anchor Text': 'anchor-text',
    'URL & Schema': 'url-schema',
    'Technical': 'url-schema',
    'AI Semantic Audit': 'url-schema'
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) return;

    let yourUrl = yourInput.value.trim();
    let compUrl = compInput.value.trim();
    const phrase = phraseInput.value.trim();
    if (yourUrl && !/^https?:\/\//i.test(yourUrl)) yourUrl = 'https://' + yourUrl;
    if (compUrl && !/^https?:\/\//i.test(compUrl)) compUrl = 'https://' + compUrl;
    if (!yourUrl || !compUrl || !phrase) return;

    const progressContainer = document.createElement('div');
    progressContainer.id = 'analysis-progress';
    progressContainer.className = 'mt-12 max-w-4xl mx-auto px-6';
    progressContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="relative w-32 h-32">
          <div class="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
          <div class="absolute inset-0 rounded-full border-8 border-t-orange-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p class="mt-10 text-3xl font-bold text-orange-600 dark:text-orange-400">Analyzing "${phrase}"...</p>
        <p class="mt-4 text-xl text-gray-600 dark:text-gray-400">Comparing your page vs competitor</p>
        <div id="progress-steps" class="mt-16 space-y-6 w-full text-left"></div>
      </div>
    `;
    if (form.nextSibling) form.parentNode.insertBefore(progressContainer, form.nextSibling);
    else form.parentNode.appendChild(progressContainer);
    results.classList.add('hidden');

    let yourFetched, compFetched;
    try {
      [yourFetched, compFetched] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);
    } catch {
      yourFetched = compFetched = null;
    }
    if (!yourFetched || !compFetched) {
      progressContainer.remove();
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-center py-32 px-6 max-w-3xl mx-auto">
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mb-8">Error: Could not load one or both pages</p>
          <p class="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">Whitelist: full-render-v2.traffictorch.workers.dev and try again.</p>
        </div>
      `;
      return;
    }

    const yourDoc = yourFetched.doc;
    const compDoc = compFetched.doc;

    /* ── Deterministic scoring for both pages ── */
    const yourDet = computeDeterministicScore({ doc: yourDoc, phrase, url: yourUrl, analysisType: 'url' });
    const compDet = computeDeterministicScore({ doc: compDoc, phrase, url: compUrl, analysisType: 'url' });

    const yourClean = getCleanContent(yourDoc);
    const compClean = getCleanContent(compDoc);
    const yourWords = getWordCount(yourDoc);
    const compWords = getWordCount(compDoc);

    const yourCMS = detectCMS(yourDoc);
    const compCMS = detectCMS(compDoc);

    /* ── AI semantic layer for both pages (parallel) ── */
    let aiVs = null;
    let yourAiContribution = 0;
    let compAiContribution = 0;
    let aiError = null;

    const steps = [
      "Fetching both pages...",
      "Parsing titles, meta & headings",
      "Comparing content depth & readability",
      "Scanning images, anchors, schema",
      "Running AI semantic audit on both pages",
      "Calculating Phrase Power Scores",
      "Identifying competitive gaps"
    ];
    const progressSteps = document.getElementById('progress-steps');
    let stepIndex = 0;
    const addStep = () => {
      if (stepIndex < steps.length) {
        const stepEl = document.createElement('div');
        stepEl.className = 'flex items-center gap-5 p-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg opacity-0 translate-y-4 transition-all duration-700';
        stepEl.innerHTML = `
          <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-pulse"></div>
          <p class="text-lg font-medium text-gray-800 dark:text-gray-200">${steps[stepIndex]}</p>
        `;
        progressSteps.appendChild(stepEl);
        void stepEl.offsetWidth;
        stepEl.classList.remove('opacity-0', 'translate-y-4');
        stepEl.classList.add('opacity-100', 'translate-y-0');
        stepIndex++;
        setTimeout(addStep, 700);
      } else {
        setTimeout(() => {
          progressContainer.remove();
          renderResults();
        }, 500);
      }
    };

    try {
      aiVs = await fetchAISemanticVs({
        targetKeyword: phrase,
        yourPage: {
          url: yourUrl,
          pageTitle: yourDet.details.titleText,
          metaDescription: yourDet.details.descText,
          h1: yourDet.details.h1Text,
          pageExcerpt: yourClean.slice(0, 3500),
          cms: yourCMS,
          wordCount: yourWords,
          headingTexts: Array.from(yourDoc.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(Boolean).slice(0, 20),
          imageAlts: Array.from(yourDoc.querySelectorAll('img[alt]')).map(i => i.getAttribute('alt')).filter(Boolean).slice(0, 15),
          schemaTypes: yourDet.details.schemaTypes
        },
        competitorPage: {
          url: compUrl,
          pageTitle: compDet.details.titleText,
          metaDescription: compDet.details.descText,
          h1: compDet.details.h1Text,
          pageExcerpt: compClean.slice(0, 3500),
          cms: compCMS,
          wordCount: compWords,
          headingTexts: Array.from(compDoc.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(Boolean).slice(0, 20),
          imageAlts: Array.from(compDoc.querySelectorAll('img[alt]')).map(i => i.getAttribute('alt')).filter(Boolean).slice(0, 15),
          schemaTypes: compDet.details.schemaTypes
        }
      });

      if (aiVs?.yourPage && typeof aiVs.yourPage.overallScore === 'number') {
        yourAiContribution = Math.round((aiVs.yourPage.overallScore / 100) * AI_MAX);
      }
      if (aiVs?.competitorPage && typeof aiVs.competitorPage.overallScore === 'number') {
        compAiContribution = Math.round((aiVs.competitorPage.overallScore / 100) * AI_MAX);
      }
    } catch (err) {
      aiError = String(err.message || err);
      console.warn('AI semantic layer unavailable:', aiError);
    }

    addStep();

    const yourTotal = Math.min(100, yourDet.score + yourAiContribution);
    const compTotal = Math.min(100, compDet.score + compAiContribution);

    const yourGrade = getGrade(yourTotal);
    const compGrade = getGrade(compTotal);

    const winner =
      yourTotal >= compTotal + 5 ? 'your' :
      compTotal >= yourTotal + 5 ? 'comp' :
      'tie';

    const renderResults = () => {
      /* ── Build all-fixes merged list (your page only) ── */
      const allFixes = [...yourDet.fixes];
      if (aiVs?.yourPage?.topGaps) {
        aiVs.yourPage.topGaps.forEach((gap, i) => {
          allFixes.push({
            module: 'AI Semantic Audit',
            issue: `Semantic gap ${i + 1}: ${gap}`,
            how: 'Expand content to cover this subtopic, entity, or question to improve topical authority and AI search visibility.'
          });
        });
      }

      const moduleOrder = [
        'Meta Title & Desc', 'H1 & Headings', 'Content & Readability',
        'URL & Schema', 'Image Alts', 'Anchor Text', 'Technical', 'AI Semantic Audit'
      ];
      const moduleIssues = {};
      allFixes.forEach(f => {
        if (!moduleIssues[f.module]) moduleIssues[f.module] = [];
        moduleIssues[f.module].push(f);
      });
      const topPriorityFixes = [];
      moduleOrder.forEach(mod => {
        if (moduleIssues[mod]?.[0]) topPriorityFixes.push(moduleIssues[mod][0]);
      });
      topPriorityFixes.length = Math.min(3, topPriorityFixes.length);

      results.classList.remove('hidden');
      const offset = 320;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });

      /* ── Module list (7 deterministic + 1 AI) ── */
      const modules = yourDet.modules.map((m, i) => ({
        name: m.name,
        yourScore: m.score,
        compScore: compDet.modules[i]?.score || 0,
        kind: 'deterministic'
      }));

      const yourAiScore = aiVs?.yourPage && typeof aiVs.yourPage.overallScore === 'number' ? aiVs.yourPage.overallScore : 0;
      const compAiScore = aiVs?.competitorPage && typeof aiVs.competitorPage.overallScore === 'number' ? aiVs.competitorPage.overallScore : 0;
      modules.push({
        name: 'AI Semantic Audit',
        yourScore: yourAiScore,
        compScore: compAiScore,
        kind: 'ai'
      });

      const yourScores = modules.map(m => m.yourScore);
      const compScores = modules.map(m => m.compScore);

      const winnerText =
        winner === 'your' ? 'You Lead' :
        winner === 'comp' ? 'Competitor Leads' :
        'Neck & Neck';

      results.innerHTML = `
<!-- Winner verdict -->
<div class="text-center my-8">
  <p class="text-2xl text-gray-600 dark:text-gray-400 mb-4">Competitive gap for "${phrase}"</p>
  <p class="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent mb-4">
    ${winnerText}
  </p>
  ${aiError ? `<p class="text-sm text-orange-600 dark:text-orange-400 max-w-xl mx-auto mt-4">⚠️ AI semantic layer unavailable (${aiError.slice(0, 100)})</p>` : ''}
</div>

<!-- Big Score Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 px-2 max-w-5xl mx-auto">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full mx-auto border-4 ${yourTotal >= 80 ? 'border-green-500' : yourTotal >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Your Page</p>
    <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourTotal >= 80 ? '#22c55e' : yourTotal >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourTotal / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl md:text-6xl font-black drop-shadow-lg"
               style="color: ${yourTotal >= 80 ? '#22c55e' : yourTotal >= 60 ? '#fb923c' : '#ef4444'};">
            ${yourTotal}
          </div>
          <div class="text-base md:text-lg opacity-80 -mt-1"
               style="color: ${yourTotal >= 80 ? '#22c55e' : yourTotal >= 60 ? '#fb923c' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
      Deterministic ${yourDet.score}/70 + AI ${yourAiContribution}/30
    </p>
    <div class="mt-6 text-center">
      <p class="text-3xl md:text-4xl font-bold ${yourGrade.color}">
        ${yourGrade.emoji} ${yourGrade.grade}
      </p>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full mx-auto border-4 ${compTotal >= 80 ? 'border-green-500' : compTotal >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Competitor Page</p>
    <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${compTotal >= 80 ? '#22c55e' : compTotal >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(compTotal / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl md:text-6xl font-black drop-shadow-lg"
               style="color: ${compTotal >= 80 ? '#22c55e' : compTotal >= 60 ? '#fb923c' : '#ef4444'};">
            ${compTotal}
          </div>
          <div class="text-base md:text-lg opacity-80 -mt-1"
               style="color: ${compTotal >= 80 ? '#22c55e' : compTotal >= 60 ? '#fb923c' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
      Deterministic ${compDet.score}/70 + AI ${compAiContribution}/30
    </p>
    <div class="mt-6 text-center">
      <p class="text-3xl md:text-4xl font-bold ${compGrade.color}">
        ${compGrade.emoji} ${compGrade.grade}
      </p>
    </div>
  </div>
</div>

<!-- Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Side-by-Side Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar-vs" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">Radar chart available on desktop/tablet</p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
      Both pages across ${modules.length} modules (7 deterministic + 1 AI semantic)
    </p>
  </div>
</div>

<!-- Module Cards -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 my-16">
  ${modules.map(m => {
    const yScore = m.yourScore;
    const cScore = m.compScore;
    const leading = yScore > cScore ? 'you' : yScore < cScore ? 'comp' : 'tie';
    const borderColor = leading === 'you' ? 'border-green-500' : leading === 'comp' ? 'border-red-500' : 'border-yellow-500';
    const hashId = moduleHashes[m.name] || '';
    const yRounded = Math.round(yScore);
    const cRounded = Math.round(cScore);

    /* Build status list from detail where possible */
    let yDetails = [];
    let cDetails = [];

    if (m.name === 'Meta Title & Desc') {
      yDetails = [
        { pass: yourDet.details.titleMatch > 0, text: yourDet.details.titleMatch > 0 ? 'Keyword in title' : 'Keyword missing from title' },
        { pass: yourDet.details.titleLen >= 30 && yourDet.details.titleLen <= 60, text: `Title ${yourDet.details.titleLen} chars` },
        { pass: yourDet.details.descMatch > 0, text: yourDet.details.descMatch > 0 ? 'Keyword in description' : 'Keyword missing from description' },
        { pass: yourDet.details.descLen >= 120 && yourDet.details.descLen <= 160, text: `Desc ${yourDet.details.descLen} chars` }
      ];
      cDetails = [
        { pass: compDet.details.titleMatch > 0, text: compDet.details.titleMatch > 0 ? 'Keyword in title' : 'Keyword missing from title' },
        { pass: compDet.details.titleLen >= 30 && compDet.details.titleLen <= 60, text: `Title ${compDet.details.titleLen} chars` },
        { pass: compDet.details.descMatch > 0, text: compDet.details.descMatch > 0 ? 'Keyword in description' : 'Keyword missing from description' },
        { pass: compDet.details.descLen >= 120 && compDet.details.descLen <= 160, text: `Desc ${compDet.details.descLen} chars` }
      ];
    } else if (m.name === 'H1 & Headings') {
      yDetails = [
        { pass: yourDet.details.h1Count === 1, text: yourDet.details.h1Count === 1 ? 'Single H1' : `${yourDet.details.h1Count} H1 tags` },
        { pass: yourDet.details.h1Match > 0, text: yourDet.details.h1Match > 0 ? 'Keyword in H1' : 'Keyword missing from H1' }
      ];
      cDetails = [
        { pass: compDet.details.h1Count === 1, text: compDet.details.h1Count === 1 ? 'Single H1' : `${compDet.details.h1Count} H1 tags` },
        { pass: compDet.details.h1Match > 0, text: compDet.details.h1Match > 0 ? 'Keyword in H1' : 'Keyword missing from H1' }
      ];
    } else if (m.name === 'Content & Readability') {
      yDetails = [
        { pass: yourDet.details.wordCount >= 800, text: `${yourDet.details.wordCount} words` },
        { pass: yourDet.details.avgSentenceLen > 0 && yourDet.details.avgSentenceLen <= 25, text: `Avg sentence ${yourDet.details.avgSentenceLen.toFixed(0)} words` }
      ];
      cDetails = [
        { pass: compDet.details.wordCount >= 800, text: `${compDet.details.wordCount} words` },
        { pass: compDet.details.avgSentenceLen > 0 && compDet.details.avgSentenceLen <= 25, text: `Avg sentence ${compDet.details.avgSentenceLen.toFixed(0)} words` }
      ];
    } else if (m.name === 'Image Alts') {
      yDetails = [
        { pass: yourDet.details.imgsWithKeyword > 0, text: `${yourDet.details.imgsWithKeyword}/${yourDet.details.totalImgs} with keyword alt` },
        { pass: yourDet.details.imgsWithAlt === yourDet.details.totalImgs, text: `${yourDet.details.imgsWithAlt}/${yourDet.details.totalImgs} have alt` }
      ];
      cDetails = [
        { pass: compDet.details.imgsWithKeyword > 0, text: `${compDet.details.imgsWithKeyword}/${compDet.details.totalImgs} with keyword alt` },
        { pass: compDet.details.imgsWithAlt === compDet.details.totalImgs, text: `${compDet.details.imgsWithAlt}/${compDet.details.totalImgs} have alt` }
      ];
    } else if (m.name === 'Anchor Text') {
      yDetails = [
        { pass: yourDet.details.internalLinks > 0, text: `${yourDet.details.internalLinks} internal links` },
        { pass: yourDet.details.internalWithKeyword > 0, text: `${yourDet.details.internalWithKeyword} with keyword anchor` }
      ];
      cDetails = [
        { pass: compDet.details.internalLinks > 0, text: `${compDet.details.internalLinks} internal links` },
        { pass: compDet.details.internalWithKeyword > 0, text: `${compDet.details.internalWithKeyword} with keyword anchor` }
      ];
    } else if (m.name === 'URL & Schema') {
      yDetails = [
        { pass: !!yourDet.details.canonical, text: yourDet.details.canonical ? 'Canonical present' : 'No canonical' },
        { pass: yourDet.details.schemaValid, text: yourDet.details.schemaValid ? `Schema: ${yourDet.details.schemaTypes.slice(0, 2).join(', ')}` : 'No valid schema' }
      ];
      cDetails = [
        { pass: !!compDet.details.canonical, text: compDet.details.canonical ? 'Canonical present' : 'No canonical' },
        { pass: compDet.details.schemaValid, text: compDet.details.schemaValid ? `Schema: ${compDet.details.schemaTypes.slice(0, 2).join(', ')}` : 'No valid schema' }
      ];
    } else if (m.name === 'Technical') {
      yDetails = [
        { pass: !!yourDet.details.lang, text: yourDet.details.lang ? 'html lang set' : 'Missing lang' },
        { pass: yourDet.details.viewport?.includes('width=device-width'), text: 'Viewport' },
        { pass: !/noindex/i.test(yourDet.details.robots), text: 'Indexable' },
        { pass: !!yourDet.details.ogTitle && !!yourDet.details.ogDesc, text: 'Open Graph' }
      ];
      cDetails = [
        { pass: !!compDet.details.lang, text: compDet.details.lang ? 'html lang set' : 'Missing lang' },
        { pass: compDet.details.viewport?.includes('width=device-width'), text: 'Viewport' },
        { pass: !/noindex/i.test(compDet.details.robots), text: 'Indexable' },
        { pass: !!compDet.details.ogTitle && !!compDet.details.ogDesc, text: 'Open Graph' }
      ];
    } else if (m.name === 'AI Semantic Audit') {
      const yAi = aiVs?.yourPage;
      const cAi = aiVs?.competitorPage;
      yDetails = yAi ? [
        { pass: yAi.intent?.pageMatchesIntent, text: `Intent: ${yAi.intent?.predicted || '?'}` },
        { pass: (yAi.entities?.coverageScore || 0) >= 70, text: `Entities ${yAi.entities?.coverageScore || 0}%` },
        { pass: (yAi.aeoAnswerability || 0) >= 70, text: `AEO ${yAi.aeoAnswerability || 0}%` }
      ] : [{ pass: false, text: 'AI unavailable' }];
      cDetails = cAi ? [
        { pass: cAi.intent?.pageMatchesIntent, text: `Intent: ${cAi.intent?.predicted || '?'}` },
        { pass: (cAi.entities?.coverageScore || 0) >= 70, text: `Entities ${cAi.entities?.coverageScore || 0}%` },
        { pass: (cAi.aeoAnswerability || 0) >= 70, text: `AEO ${cAi.aeoAnswerability || 0}%` }
      ] : [{ pass: false, text: 'AI unavailable' }];
    }

    const renderStatus = (list) => list.map(d =>
      `<p class="${d.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm text-left">${d.pass ? '✅' : '❌'} ${d.text}</p>`
    ).join('');

    return `
      <div class="score-card flex flex-col text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
        <h4 class="text-xl font-medium mb-6">${m.name}</h4>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div class="relative w-20 h-20 mx-auto">
              <svg width="80" height="80" viewBox="0 0 80 80" class="transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                <circle cx="40" cy="40" r="34" stroke="${yScore >= 80 ? '#22c55e' : yScore >= 60 ? '#eab308' : '#ef4444'}"
                        stroke-width="8" fill="none" stroke-dasharray="${(yScore / 100) * 214} 214" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-2xl font-black ${yScore >= 80 ? 'text-green-600' : yScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">${yRounded}</div>
            </div>
            <p class="mt-2 text-sm font-medium">You</p>
          </div>
          <div>
            <div class="relative w-20 h-20 mx-auto">
              <svg width="80" height="80" viewBox="0 0 80 80" class="transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                <circle cx="40" cy="40" r="34" stroke="${cScore >= 80 ? '#22c55e' : cScore >= 60 ? '#eab308' : '#ef4444'}"
                        stroke-width="8" fill="none" stroke-dasharray="${(cScore / 100) * 214} 214" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-2xl font-black ${cScore >= 80 ? 'text-green-600' : cScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">${cRounded}</div>
            </div>
            <p class="mt-2 text-sm font-medium">Comp</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>${renderStatus(yDetails)}</div>
          <div>${renderStatus(cDetails)}</div>
        </div>
        <div class="mt-auto pt-5">
          <a href="#ask-ai-section"
             class="ask-ai-link block text-purple-600 dark:text-purple-400 font-bold hover:underline text-sm"
             data-ai-question="${`How do I improve my ${m.name} score to beat my competitor? My score: ${yRounded}. Competitor score: ${cRounded}. Target keyword: &quot;${phrase}&quot;. Please give specific, actionable advice.`.replace(/"/g, '&quot;')}">
            🤖 Ask AI about this module →
          </a>
          <a href="/blog/posts/seo-keyword-competition-help-guide/#${hashId}"
             class="block mt-2 text-orange-600 dark:text-orange-400 font-bold hover:underline text-sm">
            📖 Read the ${m.name} guide →
          </a>
        </div>
      </div>
    `;
  }).join('')}
</div>

<!-- Top Priority Fixes -->
<div class="my-20 max-w-6xl mx-auto px-2">
  <h3 class="text-4xl font-black text-center mb-12 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
    Top Priority Fixes for Your Page
  </h3>
  ${topPriorityFixes.length ? `
    <div class="space-y-8">
      ${topPriorityFixes.map((fix, i) => `
        <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border-l-8 border-orange-500 flex gap-8">
          <div class="text-6xl font-black text-orange-600 dark:text-orange-400">${i + 1}</div>
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-4">
              <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">${fix.module}</span>
            </div>
            <h4 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">${fix.issue}</h4>
            <p class="text-gray-800 dark:text-gray-200">${fix.how}</p>
          </div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl shadow-2xl p-16 text-center">
      <p class="text-4xl font-black mb-6">🎉 Strong Position!</p>
      <p class="text-2xl">Your page shows superior or equal optimization across all signals.</p>
    </div>
  `}
</div>

<!-- Ranking Potential -->
<div class="max-w-6xl mx-auto my-20 grid md:grid-cols-2 gap-8 px-2">
  ${(() => {
    /* ── Compute honest projections from the real gap ── */
    const gap = compTotal - yourTotal;           // positive = competitor leads
    const fixesCount = topPriorityFixes.length;
    const upliftPerFix = [8, 6, 4];              // diminishing returns
    let projectedUplift = 0;
    for (let i = 0; i < Math.min(fixesCount, 3); i++) projectedUplift += upliftPerFix[i];
    const projectedScore = Math.min(90, yourTotal + projectedUplift);

    /* Scale gains by competitive situation */
    let positionLift, trafficLift, ctrLift, coverageLift, situation;
    if (gap <= -30) {
      situation = 'You trail significantly';
      positionLift  = `${10 + fixesCount * 2}–${18 + fixesCount * 3}`;
      trafficLift   = `${50 + fixesCount * 10}–${85 + fixesCount * 12}`;
      ctrLift       = `${30 + fixesCount * 5}–${48 + fixesCount * 8}`;
      coverageLift  = `${70 + fixesCount * 5}–${90 + fixesCount * 3}`;
    } else if (gap <= -5) {
      situation = 'You trail by a moderate margin';
      positionLift  = `${5 + fixesCount}–${10 + fixesCount * 2}`;
      trafficLift   = `${25 + fixesCount * 8}–${45 + fixesCount * 10}`;
      ctrLift       = `${15 + fixesCount * 3}–${30 + fixesCount * 5}`;
      coverageLift  = `${50 + fixesCount * 8}–${75 + fixesCount * 6}`;
    } else if (gap <= 5) {
      situation = 'Neck and neck';
      positionLift  = `${2 + fixesCount}–${5 + fixesCount}`;
      trafficLift   = `${10 + fixesCount * 5}–${25 + fixesCount * 8}`;
      ctrLift       = `${8 + fixesCount * 2}–${18 + fixesCount * 4}`;
      coverageLift  = `${30 + fixesCount * 5}–${55 + fixesCount * 5}`;
    } else {
      situation = `You lead by ${gap} points`;
      positionLift  = `0–${2 + fixesCount}`;
      trafficLift   = `${5 + fixesCount * 2}–${15 + fixesCount * 4}`;
      ctrLift       = `${3 + fixesCount}–${10 + fixesCount * 2}`;
      coverageLift  = `${15 + fixesCount * 3}–${30 + fixesCount * 4}`;
    }

    return `
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-4 border-orange-500/20">
    <h3 class="text-3xl font-black text-center mb-8 text-orange-600 dark:text-orange-400">Score Improvement Potential</h3>

    <div class="flex justify-center items-center gap-8 mb-6">
      <div class="text-center">
        <div class="text-6xl font-black ${yourGrade.color}">${yourTotal}</div>
        <p class="text-xs mt-2 text-gray-600 dark:text-gray-400 uppercase tracking-wider font-semibold">Current</p>
      </div>
      <span class="text-4xl text-orange-500">→</span>
      <div class="text-center">
        <div class="text-6xl font-black text-green-500">${projectedScore}</div>
        <p class="text-xs mt-2 text-green-600 dark:text-green-400 uppercase tracking-wider font-semibold">Realistic</p>
      </div>
    </div>

    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
      A ceiling of 90 is a strong target — no page hits a perfect 100 after 3 fixes.
      ${gap > 0 ? 'Projection assumes your competitor also keeps optimising.' : 'Competitor projection not factored.'}
    </p>

    ${fixesCount > 0 ? `
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center uppercase tracking-wide">How the projection breaks down</p>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-700 dark:text-gray-300">Starting score</span>
            <span class="font-bold text-gray-900 dark:text-gray-100">${yourTotal} / 100</span>
          </div>
          ${topPriorityFixes.map((fix, i) => `
            <div class="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-800">
              <span class="text-gray-700 dark:text-gray-300 truncate pr-2">${fix.module}</span>
              <span class="font-bold text-green-600 dark:text-green-400 whitespace-nowrap">+${upliftPerFix[i]} pts</span>
            </div>
          `).join('')}
          <div class="flex justify-between items-center py-2 border-t-2 border-orange-300 dark:border-orange-700 mt-2 pt-3">
            <span class="font-bold text-gray-900 dark:text-gray-100">Realistic outcome</span>
            <span class="font-black text-green-600 dark:text-green-400 text-lg">${projectedScore} / 100</span>
          </div>
        </div>
      </div>
    ` : `
      <div class="text-center py-6">
        <p class="text-lg font-bold text-green-600 dark:text-green-400 mb-2">🎉 You're in strong shape</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Focus next on ${gap > 0 ? 'defending your lead with content refreshes and backlink building' : 'closing the remaining gap with new entity coverage in the AI Semantic Audit module'}.</p>
      </div>
    `}
  </div>

  <div class="p-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-3xl font-black text-center mb-6">Expected Ranking Gains</h3>

    <div class="text-center mb-8 pb-6 border-b border-white/20">
      <p class="text-xs uppercase tracking-widest opacity-80 mb-2 font-semibold">Competitive Situation</p>
      <p class="text-2xl font-black leading-tight">${situation}</p>
    </div>

    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <span class="text-4xl flex-shrink-0">📈</span>
        <div class="flex-1">
          <p class="text-sm opacity-90">Ranking Position</p>
          <p class="text-2xl font-black">+${positionLift} spots</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-4xl flex-shrink-0">🚀</span>
        <div class="flex-1">
          <p class="text-sm opacity-90">Organic Traffic</p>
          <p class="text-2xl font-black">+${trafficLift}%</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-4xl flex-shrink-0">👆</span>
        <div class="flex-1">
          <p class="text-sm opacity-90">CTR Improvement</p>
          <p class="text-2xl font-black">+${ctrLift}%</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-4xl flex-shrink-0">🗝️</span>
        <div class="flex-1">
          <p class="text-sm opacity-90">Keyword Coverage</p>
          <p class="text-2xl font-black">+${coverageLift}%</p>
        </div>
      </div>
    </div>

    <p class="mt-8 text-xs opacity-80 text-center leading-relaxed">
      Estimates scale with your actual competitive gap. Conservative and directional.<br>
      On-page improvements typically reflect within 1–4 weeks.<br>
      Actual results depend on competition, backlinks, and domain authority.
    </p>
  </div>
    `;
  })()}
</div>

<!-- Ask AI -->
<div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🤖 Ask Traffic Torch AI About Keyword Competition</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get tailored answers about competitive gaps, keyword placement, and specific improvement steps to outrank your competitor.
  </p>
  <div class="flex flex-col sm:flex-row gap-4">
    <textarea id="ai-question-input" placeholder="e.g., Why am I losing on entity coverage? How do I close the meta gap?" rows="3" class="flex-1 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y min-h-[60px]"></textarea>
    <button id="ask-ai-btn" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">Ask Traffic Torch AI</button>
  </div>
  <div id="ai-answer-container" class="mt-6 hidden">
    <div id="ai-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>

<div id="share-dashboard-container" class="mt-16"></div>
      `;
      
            /* ── Set body data-url for the print cover page ── */
      (() => {
        let displayUrl = 'traffictorch.net';
        if (yourUrl) {
          let cleaned = yourUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
          const firstSlash = cleaned.indexOf('/');
          displayUrl = firstSlash !== -1 ? cleaned.slice(0, firstSlash) + '\n' + cleaned.slice(firstSlash) : cleaned;
        }
        document.body.setAttribute('data-url', displayUrl);
      })();

      /* ── Radar chart with two datasets ── */
      setTimeout(() => {
        const canvas = document.getElementById('health-radar-vs');
        if (!canvas || typeof Chart === 'undefined') return;
        try {
          const ctx = canvas.getContext('2d');
          const labelColor = '#9ca3af';
          const gridColor = 'rgba(156, 163, 175, 0.3)';
          new Chart(ctx, {
            type: 'radar',
            data: {
              labels: modules.map(m => m.name),
              datasets: [
                {
                  label: 'Your Page',
                  data: yourScores,
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  borderColor: '#22c55e',
                  borderWidth: 3,
                  pointRadius: 6,
                  pointBackgroundColor: '#22c55e',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Competitor',
                  data: compScores,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: '#ef4444',
                  borderWidth: 3,
                  pointRadius: 6,
                  pointBackgroundColor: '#ef4444',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true, min: 0, max: 100,
                  ticks: { stepSize: 20, color: labelColor },
                  grid: { color: gridColor },
                  angleLines: { color: gridColor },
                  pointLabels: { color: labelColor, font: { size: 12, weight: '600' } }
                }
              },
              plugins: { legend: { display: true, position: 'bottom' } }
            }
          });
        } catch (e) {}
      }, 200);

      /* ── Share module ── */
      const shareContainer = document.getElementById('share-dashboard-container');
      if (shareContainer && typeof initShareModule === 'function') {
        const yourModuleScores = modules.map(m => ({ name: m.name, score: m.yourScore }));
        const compModuleScores = modules.map(m => ({ name: m.name, score: m.compScore }));
        const passed = modules.filter(m => m.yourScore >= 70).map(m => m.name);
        const failed = modules.filter(m => m.yourScore < 70).map(m => m.name);
        const aiFixes = topPriorityFixes.map(f => `${f.module}: ${f.issue}`);

        initShareModule(shareContainer, {
          toolName: 'Keyword VS Tool',
          url: yourUrl,
          pageTitle: yourDet.details.titleText || 'Your Page',
          overallScore: yourTotal,
          moduleScores: yourModuleScores,
          passedMetrics: passed,
          failedMetrics: failed,
          aiFixes,
          rawData: { yourDet, compDet, aiVs, winner, yourTotal, compTotal },
          shareLink: `${window.location.origin}/keyword-vs-tool/?your-url=${encodeURIComponent(yourUrl)}&comp-url=${encodeURIComponent(compUrl)}&keyword=${encodeURIComponent(phrase)}`
        });
      }

      /* ── Ask AI handler ── */
      const askBtn = document.getElementById('ask-ai-btn');
      const askInput = document.getElementById('ai-question-input');
      const answerContainer = document.getElementById('ai-answer-container');
      const answerContent = document.getElementById('ai-answer-content');

      if (askBtn) {
        const newAskBtn = askBtn.cloneNode(true);
        askBtn.parentNode.replaceChild(newAskBtn, askBtn);

        newAskBtn.addEventListener('click', async () => {
          const canProceed = await canRunTool('limit-audit-id');
          if (!canProceed) return;

          const question = askInput?.value?.trim();
          if (!question) { alert('Please enter a question.'); return; }

          newAskBtn.disabled = true;
          newAskBtn.textContent = 'Thinking...';
          answerContainer.classList.remove('hidden');
          answerContent.innerHTML = '⏳ Traffic Torching...';

          try {
            const auditPayload = {
              question: question,
              auditData: {
                yourUrl,
                competitorUrl: compUrl,
                targetKeyword: phrase,
                yourCMS,
                competitorCMS: compCMS,
                yourScore: yourTotal,
                competitorScore: compTotal,
                winner,
                yourDeterministic: yourDet.details,
                compDeterministic: compDet.details,
                yourAiSemantic: aiVs?.yourPage || null,
                compAiSemantic: aiVs?.competitorPage || null,
                priorityFixes: topPriorityFixes.map(f => ({
                  name: f.issue, module: f.module, howToFix: f.how
                }))
              }
            };

            const response = await fetch('https://keyword-competition-ai.traffictorch.workers.dev/', {
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
              answerContent.innerHTML = `❌ Error: ${renderCodeBlocks(aiResponse.error || 'Unknown error')}`;
            }
          } catch (err) {
            answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${renderCodeBlocks(err.message)})`;
          } finally {
            newAskBtn.disabled = false;
            newAskBtn.textContent = 'Ask Traffic Torch AI';
          }
        });
      }
    };
  });

  /* ── Global click delegation ── */
  document.addEventListener('click', (e) => {
    const aiLink = e.target.closest('.ask-ai-link');
    if (aiLink) {
      e.preventDefault();
      const section = document.getElementById('ask-ai-section');
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const textarea = document.getElementById('ai-question-input');
      if (textarea) {
        textarea.value = aiLink.dataset.aiQuestion || '';
        setTimeout(() => textarea.focus(), 700);
      }
    }
  });
});