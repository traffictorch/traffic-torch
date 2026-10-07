// ofux script js

// ─── Shared constants (matches the other three tools) ────────────────
const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
// Unique quota bucket for the combined audit. Make sure this key
// is registered wherever canRunTool() reads its limits from.
const OFUX_TOOL_KEY = 'ofux-tool';

// AI Search weights — single source of truth (mirror of
// /ai-search-optimization-tool/script.js?v=1.3 WEIGHTS).
const AI_SEARCH_WEIGHTS = {
  answerability: 0.25,
  structuredData: 0.15,
  eeat: 0.15,
  scannability: 0.10,
  conversational: 0.12,
  readability: 0.10,
  uniqueInsights: 0.08,
  antiAiSafety: 0.05
};

const METRIC_LABEL_MAP = {
  personalMedia: 'Author photo or first-hand media shown',
  hasAuthor: 'Author byline visible',
  hasDate: 'Publish/update date shown',
  hasTrustedLinks: 'Trusted outbound links',
  hasHttps: 'Secure HTTPS connection',
  hasInsights: 'First-hand experience markers',
  hasDated: 'Dated/timely results',
  hasInterviews: 'Interviews/quotes included',
  deepContent: 'Deep content (1500+ words)',
};

function labelFor(name) {
  return METRIC_LABEL_MAP[name] || name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

// ─── URL history (localStorage) ──────────────────────────────────────────
const URL_HISTORY_KEY = 'ofux-url-history';
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
  const dl = document.getElementById('ofux-url-history-list');
  if (!dl) return;
  const urls = loadUrlHistory();
  dl.innerHTML = urls.map(u =>
    `<option value="${u.replace(/"/g, '&quot;')}"></option>`
  ).join('');
}

// ─── Imports ─────────────────────────────────────────────────────────
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/ofux-tool/cms-detect.js';
import { saveAudit } from '/audit-history.js';
import { canRunTool } from '/main.js?v=1.2';

// ─── Quit Risk imports ───────────────────────────────────────────────
import { calculateReadability } from '/quit-risk-tool/modules/readability.js';
import { calculateNavigation } from '/quit-risk-tool/modules/navigation.js';
import { calculateAccessibility } from '/quit-risk-tool/modules/accessibility.js';
import { calculateMobile } from '/quit-risk-tool/modules/mobile.js';
import { calculatePerformance } from '/quit-risk-tool/modules/performance.js';
import { mergeMetricsIntoUX } from '/quit-risk-tool/metrics-adapter.js';

// ─── SEO Intent imports ──────────────────────────────────────────────
import { analyzeExperience } from '/seo-intent-tool/modules/experience.js';
import { analyzeExpertise } from '/seo-intent-tool/modules/expertise.js';
import { analyzeAuthoritativeness } from '/seo-intent-tool/modules/authoritativeness.js';
import { analyzeTrustworthiness } from '/seo-intent-tool/modules/trustworthiness.js';
import { analyzeDepth } from '/seo-intent-tool/modules/depth.js';
import { analyzeReadability as analyzeSEOReadability } from '/seo-intent-tool/modules/readability.js';
import { analyzeSchema } from '/seo-intent-tool/modules/schema.js';

// ─── AI Search imports ──────────────────────────────────────────────
import { computeAnswerability } from '/ai-search-optimization-tool/modules/answerability.js';
import { computeStructuredData } from '/ai-search-optimization-tool/modules/structuredData.js';
import { computeEEAT } from '/ai-search-optimization-tool/modules/eeatSignals.js';
import { computeScannability } from '/ai-search-optimization-tool/modules/scannability.js';
import { computeConversational } from '/ai-search-optimization-tool/modules/conversationalTone.js';
import { computeReadability as computeAIReadability } from '/ai-search-optimization-tool/modules/readability.js';
import { computeUniqueInsights } from '/ai-search-optimization-tool/modules/uniqueInsights.js';
import { computeAntiAiSafety } from '/ai-search-optimization-tool/modules/antiAiSafety.js';

// ─── Save audit history (matches Quit Risk / SEO Intent / AI Search) ──
async function saveAuditHistory(url, toolName) {
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
          score: null
        })
      });
      return;
    } catch (e) {
      // fall through to guest storage
    }
  }

  const stored = localStorage.getItem('audit_guest');
  let entries = [];
  if (stored) {
    try { entries = JSON.parse(stored).entries || []; } catch {}
  }
  entries.unshift({
    _localId: Date.now() + '_' + Math.random(),
    url: auditUrl,
    tool: toolName,
    score: null,
    timestamp: Date.now()
  });
  entries = entries.slice(0, 5);
  localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
}

// ─── Code block renderer ─────────────────────────────────────────────
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
    (_m, pre, nl) => (pre ? pre : '<br>')
  );

  escaped = escaped
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>');

  return escaped;
}

// ─── Head snapshot builder (shared with every other Traffic Torch tool) ─
function buildHeadSnapshot(doc) {
  if (!doc || !doc.head) return '';
  const head = doc.head;
  const lines = [];

  const sheets = [...head.querySelectorAll('link[rel="stylesheet"]')].slice(0, 15);
  if (sheets.length) {
    lines.push('Stylesheets in <head>:');
    for (const l of sheets) {
      const href = l.getAttribute('href') || '';
      const media = l.getAttribute('media');
      lines.push(`- ${href}${media ? ` (media=${media})` : ''}`);
    }
  }

  const headScripts = [...head.querySelectorAll('script[src]')].slice(0, 15);
  if (headScripts.length) {
    lines.push('Scripts in <head>:');
    for (const s of headScripts) {
      const src = s.getAttribute('src') || '';
      const attrs = ['async','defer','type','crossorigin','fetchpriority']
        .filter(a => s.hasAttribute(a))
        .map(a => `${a}="${s.getAttribute(a) || ''}"`)
        .join(' ');
      lines.push(`- ${src}${attrs ? ' ' + attrs : ''}`);
    }
  }

  const inlineStyles = [...head.querySelectorAll('style')].slice(0, 15);
  if (inlineStyles.length) {
    lines.push(`Inline <style> blocks in <head>: ${inlineStyles.length}`);
    for (const s of inlineStyles) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
  }

  const inlineScripts = [...head.querySelectorAll('script:not([src])')].slice(0, 15);
  if (inlineScripts.length) {
    lines.push(`Inline <script> blocks in <head>: ${inlineScripts.length}`);
    for (const s of inlineScripts) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
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
  if (jsonLd.length) {
    lines.push(`JSON-LD schema blocks in <head>: ${jsonLd.length}`);
    for (const s of jsonLd) {
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
      lines.push(`- "${preview}…"`);
    }
  }

  return lines.join('\n');
}

// ─── Helper to count pass/average/fail from modules ─────────────────────
function countStatuses(modules) {
  let passed = 0, avg = 0, failed = 0;
  modules.forEach(mod => {
    mod.metrics.forEach(m => {
      if (m.status === 'pass') passed++;
      else if (m.status === 'average') avg++;
      else if (m.status === 'fail') failed++;
    });
  });
  return { passed, average: avg, failed };
}

// ─── Visible-text extractor (FIX 1 from SEO Intent) ─────────────────────
// Rejects nav/header/footer/aside/form/template/svg, [hidden],
// aria-hidden="true", inline display:none, and ancestors carrying
// sr-only / visually-hidden / menu-slideout / drawer / modal classes.
function getVisibleText(root) {
  if (!root) return '';
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      const tag = parent.tagName.toLowerCase();
      if ([
        'script', 'style', 'noscript', 'head', 'iframe', 'object', 'embed',
        'nav', 'header', 'footer', 'aside', 'form', 'template', 'svg'
      ].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.hasAttribute('hidden') || parent.getAttribute('aria-hidden') === 'true') {
        return NodeFilter.FILTER_REJECT;
      }

      const inline = parent.getAttribute('style') || '';
      if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(inline)) {
        return NodeFilter.FILTER_REJECT;
      }

      let el = parent;
      while (el && el !== root) {
        if (el.classList && el.classList.length > 0) {
          if (el.classList.contains('hidden')      ||
              el.classList.contains('sr-only')     ||
              el.classList.contains('invisible')   ||
              el.classList.contains('offscreen')   ||
              el.classList.contains('visually-hidden')) {
            return NodeFilter.FILTER_REJECT;
          }
          const cls = (typeof el.className === 'string') ? el.className : '';
          if (cls && /\b(menu-slideout|drawer-container|drawer-backdrop|modal-backdrop|modal-wrapper)\b/.test(cls)) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        el = el.parentElement;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) {
    text += walker.currentNode.textContent + ' ';
  }
  return text.trim();
}

// ─── Shared DOM extraction for Quit Risk (aligns with the QR tool) ─────
function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
function countExternalLinks(links, baseUrl) {
  let baseHost;
  try {
    baseHost = new URL(baseUrl || window.location.href).host;
  } catch {
    baseHost = window.location.host;
  }
  return Array.from(links).filter(a => {
    const raw = a.getAttribute('href');
    if (!raw) return false;
    if (/^(#|mailto:|tel:|javascript:|data:)/i.test(raw)) return false;
    try {
      return new URL(raw, baseUrl || window.location.href).host !== baseHost;
    } catch {
      return false;
    }
  }).length;
}
function hasViewportMeta(doc) {
  const meta = doc.querySelector('meta[name="viewport"]');
  return meta && /width\s*=\s*device-width/i.test(meta.content);
}
function hasSemanticMain(doc) {
  return !!doc.querySelector('main');
}
function hasSemanticArticleOrSection(doc) {
  return !!doc.querySelector('article, section');
}
function countMissingAlt(doc) {
  const imgs = doc.querySelectorAll('img');
  let missing = 0, decorative = 0, meaningful = 0;
  imgs.forEach(img => {
    const alt = img.getAttribute('alt');
    const isDecorative = img.classList.contains('decorative') ||
                        img.getAttribute('role') === 'presentation' ||
                        (alt !== null && alt.trim() === '' && !img.hasAttribute('title'));
    if (isDecorative) decorative++;
    else {
      meaningful++;
      if (alt === null || alt.trim() === '') missing++;
    }
  });
  return { missingCount: missing, meaningfulCount: meaningful, decorativeCount: decorative, totalImages: imgs.length };
}
function pickPrimaryNav(doc) {
  const candidates = [
    'header nav',
    'nav[aria-label*="main" i]',
    'nav[aria-label*="primary" i]',
    'nav[role="navigation"]',
    'nav',
  ];
  for (const sel of candidates) {
    const el = doc.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function getUXContent(doc, metrics, auditedUrl) {
  const textElements = doc.querySelectorAll('p, li, article, section, main, div');
  let fullText = '', paragraphTexts = [], boldCount = 0, listItemCount = 0;
  textElements.forEach(el => {
    const t = el.textContent.trim();
    if (t.length > 15) {
      fullText += t + ' ';
      if (el.tagName === 'P') paragraphTexts.push(t);
    }
    boldCount += el.querySelectorAll('b, strong').length;
    if (el.tagName === 'UL' || el.tagName === 'OL') listItemCount += el.querySelectorAll('li').length;
  });

  const links = doc.querySelectorAll('a[href]');
  const images = doc.querySelectorAll('img');
  const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');

  const primaryNav = pickPrimaryNav(doc);
  const topLevelItems = primaryNav
    ? primaryNav.querySelectorAll(':scope > ul > li, :scope > li').length
    : 0;

  return {
    fullText,
    wordCount: countWords(fullText),
    linkCount: links.length,
    externalLinkCount: countExternalLinks(links, auditedUrl),
    imageCount: images.length,
    altData: countMissingAlt(doc),
    headingCount: headings.length,
    hasViewport: hasViewportMeta(doc),
    hasMain: hasSemanticMain(doc),
    hasArticleOrSection: hasSemanticArticleOrSection(doc),
    paragraphTexts,
    boldCount,
    listItemCount,
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
      const els = doc.querySelectorAll('a, button, [role="button"]');
      let smallCount = 0;
      els.forEach(el => {
        const rect = el.getBoundingClientRect?.() || { width: 0, height: 0 };
        if (rect.width < 44 || rect.height < 44) smallCount++;
      });
      return smallCount < 5;
    })(),
    hasManifest: !!doc.querySelector('link[rel="manifest"]'),
    hasServiceWorkerHint: doc.body.innerHTML.includes('serviceWorker') || doc.body.innerHTML.includes('register('),
    hasAppleTouchIcon: !!doc.querySelector('link[rel*="apple-touch-icon"]'),
    isHttps: window.location.protocol === 'https:',
    hasLazyLoading: (() => {
      const allImgs = doc.querySelectorAll('img[src]');
      const lazyImgs = doc.querySelectorAll('img[loading="lazy"]');
      const total = allImgs.length;
      const lazyCount = lazyImgs.length;
      if (total === 0) return false;
      return lazyCount >= 2 && (lazyCount / total) * 100 >= 40;
    })(),
    externalScripts: doc.querySelectorAll('script[src^="http"]').length,
    hasRenderBlocking: doc.querySelectorAll('script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])').length,
    fontCount: doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"], link[rel="stylesheet"][href*="typekit"], link[rel="stylesheet"][href*="cloud.typography"]').length || 0,
    hasFontDisplaySwap: doc.body.innerHTML.includes('font-display: swap') || doc.head.innerHTML.includes('font-display: swap'),
    hasWebpOrAvif: !!doc.querySelector('img[src$=".webp"], img[src$=".avif"], source[type="image/webp"], source[type="image/avif"]'),
    potentialCTAs: doc.querySelectorAll(
      'a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="trial"], a[href*="buy"], ' +
      'a[href*="get"], a[href*="start"], button, [role="button"], .btn, .button, ' +
      '[class*="cta"], [id*="cta"], [class*="button"], [class*="CallToAction"]'
    ).length,
    doc,
    title: doc.title || '',
    renderedLoadTime: null,
    renderedMetrics: metrics || null
  };
}

// ─── Quit Risk Summary ─────────────────────────────────────────────────
function getQuitRiskSummary(data) {
  const r = calculateReadability(data);
  const n = calculateNavigation(data);
  const a = calculateAccessibility(data);
  const m = calculateMobile(data);
  const p = calculatePerformance(data);

  const modules = [r, n, a, m, p];
  const score = Math.round(modules.reduce((sum, mod) => sum + mod.score, 0) / modules.length);

  const factorDefs = {
    readability: {
      name: 'Readability',
      score: r.score,
      factors: [
        { name: "Flesch Reading Ease Score", threshold: 65 },
        { name: "Flesch-Kincaid Grade Level", threshold: 65 },
        { name: "Average Sentence Length", threshold: 70 },
        { name: "Paragraph Density & Length", threshold: 70 },
        { name: "Overall Text Scannability", threshold: 70 }
      ]
    },
    navigation: {
      name: 'Navigation',
      score: n.score,
      factors: [
        { name: "Link Density Evaluation", threshold: 78 },
        { name: "Menu Structure Clarity", threshold: 80 },
        { name: "Internal Linking Balance", threshold: 72 },
        { name: "CTA Prominence & Visibility", threshold: 82 }
      ]
    },
    accessibility: {
      name: 'Accessibility',
      score: a.score,
      factors: [
        { name: "Alt Text Coverage", threshold: 85 },
        { name: "Color Contrast Ratios", threshold: 80 },
        { name: "Semantic HTML Structure", threshold: 82 },
        { name: "Overall WCAG Compliance", threshold: 78 }
      ]
    },
    mobile: {
      name: 'Mobile & PWA',
      score: m.score,
      factors: [
        { name: "Viewport Configuration", threshold: 90 },
        { name: "Responsive Breakpoints", threshold: 85 },
        { name: "Touch Target Size", threshold: 85 },
        { name: "PWA Readiness Indicators", threshold: 80 }
      ]
    },
    performance: {
      name: 'Performance',
      score: p.score,
      factors: [
        { name: "Asset Volume Flags", threshold: 82 },
        { name: "Script Bloat Detection", threshold: 85 },
        { name: "Font Optimization", threshold: 82 },
        { name: "Lazy Loading Media", threshold: 80 },
        { name: "Image Optimization", threshold: 82 },
        { name: "Script Optimization", threshold: 80 }
      ]
    }
  };

  const moduleScores = { readability: r, navigation: n, accessibility: a, mobile: m, performance: p };
  const moduleData = [];

  Object.keys(moduleScores).forEach(key => {
    const mod = moduleScores[key];
    const def = factorDefs[key];
    if (!def) return;

    const metrics = [];
    def.factors.forEach(f => {
      let passed = mod.score >= f.threshold;
      let status = 'fail';
      if (mod.details) {
        const fs = mod.details;
        if (key === 'readability') {
          if (f.name === "Flesch Reading Ease Score") passed = fs.fleschEase >= 60;
          else if (f.name === "Flesch-Kincaid Grade Level") passed = fs.kincaidGrade <= 10;
          else if (f.name === "Average Sentence Length") passed = fs.avgSentence <= 20;
          else if (f.name === "Paragraph Density & Length") passed = fs.avgParagraph <= 80;
          else if (f.name === "Overall Text Scannability") passed = fs.scannability >= 70;
        } else if (key === 'navigation') {
          if (f.name === "Link Density Evaluation") passed = fs.linkDensity <= 8;
          else if (f.name === "Menu Structure Clarity") passed = fs.menuClarity >= 70;
          else if (f.name === "Internal Linking Balance") passed = fs.internalBalance >= 50;
          else if (f.name === "CTA Prominence & Visibility") passed = fs.ctaStrength >= 70;
        } else if (key === 'accessibility') {
          if (f.name === "Alt Text Coverage") passed = fs.altCoverage >= 85;
          else if (f.name === "Color Contrast Ratios") passed = fs.contrastProxy >= 80;
          else if (f.name === "Semantic HTML Structure") passed = fs.semanticStrength >= 70;
          else if (f.name === "Overall WCAG Compliance") passed = (fs.altCoverage + fs.contrastProxy + fs.semanticStrength) / 3 >= 75;
        } else if (key === 'mobile') {
          if (f.name === "Viewport Configuration") passed = fs.viewportQuality >= 85;
          else if (f.name === "Responsive Breakpoints") passed = fs.responsiveProxy >= 75;
          else if (f.name === "Touch Target Size") passed = fs.touchFriendly >= 70;
          else if (f.name === "PWA Readiness Indicators") passed = fs.pwaReadiness >= 60;
        } else if (key === 'performance') {
          if (f.name === "Asset Volume Flags") passed = fs.assetVolume >= 70;
          else if (f.name === "Script Bloat Detection") passed = fs.scriptBloat >= 70;
          else if (f.name === "Font Optimization") passed = fs.fontOptimization >= 70;
          else if (f.name === "Lazy Loading Media") passed = fs.lazyLoading >= 70;
          else if (f.name === "Image Optimization") passed = fs.imageFormat >= 70;
          else if (f.name === "Script Optimization") passed = fs.renderBlocking >= 70;
        }
      }
      if (passed) status = 'pass';
      else {
        const threshold = f.threshold;
        const modScore = mod.score;
        status = (modScore >= threshold - 10) ? 'average' : 'fail';
      }
      metrics.push({ name: f.name, status });
    });

    moduleData.push({ name: def.name, score: mod.score, metrics });
  });

  const passed = [];
  const failed = [];
  moduleData.forEach(mod => {
    mod.metrics.forEach(m => {
      if (m.status === 'pass') passed.push(m.name);
      else failed.push(m.name);
    });
  });

  return { score, passed, failed, modules: moduleData };
}

// ─── SEO Intent Summary (aligned with SEO Intent tool) ─────────────────
function getSEOSummary(doc, analyzedUrl) {
  // Narrowed selectors — identical to SEO Intent's defaultConfig
  const config = {
    parsing: {
      authorBylineSelectors: [
        'meta[name="author" i]', 'meta[property="article:author"]', '[rel="author"]',
        '.author', '.byline', '.written-by', '[class*="author" i]', '[itemprop="author"]',
        '[class*="byline" i]', '.post-author', '.entry-author', '.writer-name',
        '.blog-author', '.h-card .p-name', '.author-name'
      ],
      authorBioSelectors: [
        '.author-bio', '.about-author', '.author-description',
        '.author-box', '.author-info', '.author-details', '.writer-bio',
        '.contributor-bio', '.author-profile', '.about-the-author',
        '[itemprop="description"]'
      ],
      contactLinkSelectors: [
        'a[href*="/contact" i]', 'a[href*="mailto:" i]', 'a[href*="tel:" i]'
      ],
      policyLinkSelectors: [
        'a[href*="/privacy" i]', 'a[href*="/terms" i]', 'a[href*="/legal" i]'
      ],
      updateDateSelectors: [
        'time[datetime]',
        '.updated', '.last-modified', '.date-updated', '.modified-date', '.publish-date',
        'meta[property="article:modified_time"]',
        'meta[property="og:updated_time"]',
        'meta[name="last-modified" i]',
        'meta[name="date" i]',
        '[itemprop="dateModified"]',
        '[itemprop="datePublished"]'
      ]
    }
  };

  // Prefer main/article/[role=main] as extraction root, like the SEO tool
  const contentRoot = doc.querySelector('main, article, [role="main"]') || doc.body;
  const rawText = getVisibleText(contentRoot) || '';
  const cleanedText = rawText.replace(/\s+/g, ' ').trim();

  const exp = analyzeExperience(cleanedText, doc);
  const ext = analyzeExpertise(doc, cleanedText, config);
  const auth = analyzeAuthoritativeness(doc, cleanedText);
  const trust = analyzeTrustworthiness(analyzedUrl, doc, config, cleanedText);
  const depth = analyzeDepth(cleanedText);
  const read = analyzeSEOReadability(cleanedText);
  const schema = analyzeSchema(doc.documentElement.outerHTML, doc);

  // SEO Intent formula: E-E-A-T averaged, then a 4-way flat average
  const eeatAvg = Math.round((exp.score + ext.score + auth.score + trust.score) / 4);
  const overallScore = Math.round(
    (depth.normalized + read.normalized + eeatAvg + schema.normalized) / 4
  );

  function getStatus(val) {
    if (val >= 80) return 'pass';
    if (val >= 60) return 'average';
    return 'fail';
  }

  const moduleData = [
    {
      name: 'Experience',
      score: exp.score,
      metrics: Object.keys(exp.metrics || {}).map(key => ({ name: key, status: getStatus(exp.metrics[key]) }))
    },
    {
      name: 'Expertise',
      score: ext.score,
      metrics: Object.keys(ext.metrics || {}).map(key => ({ name: key, status: getStatus(ext.metrics[key]) }))
    },
    {
      name: 'Authoritativeness',
      score: auth.score,
      metrics: Object.keys(auth.metrics || {}).map(key => ({ name: key, status: getStatus(auth.metrics[key]) }))
    },
    {
      name: 'Trustworthiness',
      score: trust.score,
      metrics: Object.keys(trust.metrics || {}).map(key => ({ name: key, status: getStatus(trust.metrics[key]) }))
    },
    {
      name: 'Content Depth',
      score: depth.normalized,
      metrics: [{ name: 'Content Depth', status: getStatus(depth.normalized) }]
    },
    {
      name: 'Readability',
      score: read.normalized,
      metrics: [{ name: 'Readability', status: getStatus(read.normalized) }]
    },
    {
      name: 'Schema Markup',
      score: schema.normalized,
      metrics: [{ name: 'Schema Markup', status: getStatus(schema.normalized) }]
    }
  ];

  const passed = [];
  const failed = [];
  moduleData.forEach(mod => {
    mod.metrics.forEach(m => {
      if (m.status === 'pass') passed.push(m.name);
      else failed.push(m.name);
    });
  });

  return { score: overallScore, passed, failed, modules: moduleData };
}

// ─── AI Search Summary (aligned with AI Search tool) ───────────────────
function getAISearchSummary(doc, analyzedUrl) {
  // Clone so we never mutate the caller's doc — matches the effective
  // state of the standalone AI Search tool when it calls the modules.
  const workingDoc = doc.cloneNode(true);

  const candidates = [
    workingDoc.querySelector('article'),
    workingDoc.querySelector('main'),
    workingDoc.querySelector('[role="main"]'),
    workingDoc.body
  ];
  const mainEl = candidates.find(el => el && el.textContent.trim().length > 1000) || workingDoc.body;
  mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie, .sidebar').forEach(el => el.remove());

  const mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();
  const first300 = mainText.slice(0, 1200);
  const first300Html = mainEl.innerHTML.slice(0, 1200);

  // NOTE: third argument required for the current answerability module
  const ans = computeAnswerability(workingDoc, first300, first300Html);
  const struct = computeStructuredData(workingDoc);
  const eeat = computeEEAT(workingDoc, analyzedUrl);
  const scan = computeScannability(workingDoc, mainEl);
  const conv = computeConversational(mainText);
  const read = computeAIReadability(mainText);
  const unique = computeUniqueInsights(mainText, read.words || 0);
  const anti = computeAntiAiSafety(mainText, read.variationScore || 0);

  const moduleScores = [
    ans.score, struct.score, eeat.score, scan.score,
    conv.score, read.score, unique.score, anti.score
  ];
  const weights = [
    AI_SEARCH_WEIGHTS.answerability,
    AI_SEARCH_WEIGHTS.structuredData,
    AI_SEARCH_WEIGHTS.eeat,
    AI_SEARCH_WEIGHTS.scannability,
    AI_SEARCH_WEIGHTS.conversational,
    AI_SEARCH_WEIGHTS.readability,
    AI_SEARCH_WEIGHTS.uniqueInsights,
    AI_SEARCH_WEIGHTS.antiAiSafety
  ];
  const overallScore = Math.round(
    moduleScores.reduce((sum, score, i) => sum + score * weights[i], 0)
  );

  const ansFlags = ans.flags || {};
  const structFlags = struct.flags || {};
  const eeatFlags = eeat.flags || {};
  const scanFlags = scan.flags || {};
  const convFlags = conv.flags || {};
  const readFlags = read.flags || {};
  const uniqueFlags = unique.flags || {};
  const antiFlags = anti.flags || {};

  const borderlineMetrics = [
    'JSON-LD structured data',
    'Publish/update date shown',
    'Trusted outbound links',
    'Data tables present'
  ];

  function getStatus(metricName, flag) {
    if (flag) return 'pass';
    if (borderlineMetrics.includes(metricName)) return 'average';
    return 'fail';
  }

  const moduleData = [
    {
      name: 'Answerability',
      score: ans.score,
      metrics: [
        { name: 'Bold/strong formatting in opening', status: getStatus('Bold/strong formatting in opening', ansFlags.hasBoldInFirst) },
        { name: 'Clear definition pattern', status: getStatus('Clear definition pattern', ansFlags.hasDefinition) },
        { name: 'FAQPage schema', status: getStatus('FAQPage schema', ansFlags.hasFAQSchema) },
        { name: 'Question-style H2 headings', status: getStatus('Question-style H2 headings', ansFlags.hasQuestionH2) },
        { name: 'Step-by-step language', status: getStatus('Step-by-step language', ansFlags.hasSteps) },
        { name: 'Strong opening section', status: getStatus('Strong opening section', ansFlags.strongOpening) }
      ]
    },
    {
      name: 'Structured Data',
      score: struct.score,
      metrics: [
        { name: 'JSON-LD structured data', status: getStatus('JSON-LD structured data', structFlags.hasValidJsonLd) },
        { name: 'Article/BlogPosting schema', status: getStatus('Article/BlogPosting schema', structFlags.hasArticle) },
        { name: 'FAQPage/HowTo schema', status: getStatus('FAQPage/HowTo schema', structFlags.hasFaqHowto) },
        { name: 'Person schema for author', status: getStatus('Person schema for author', structFlags.hasPerson) }
      ]
    },
    {
      name: 'EEAT Signals',
      score: eeat.score,
      metrics: [
        { name: 'Author byline visible', status: getStatus('Author byline visible', eeatFlags.hasAuthor) },
        { name: 'Publish/update date shown', status: getStatus('Publish/update date shown', eeatFlags.hasDate) },
        { name: 'Trusted outbound links', status: getStatus('Trusted outbound links', eeatFlags.hasTrustedLinks) },
        { name: 'Secure HTTPS connection', status: getStatus('Secure HTTPS connection', eeatFlags.hasHttps) }
      ]
    },
    {
      name: 'Scannability',
      score: scan.score,
      metrics: [
        { name: 'Sufficient headings', status: getStatus('Sufficient headings', scanFlags.sufficientHeadings) },
        { name: 'Bullet/numbered lists', status: getStatus('Bullet/numbered lists', scanFlags.listsUsed) },
        { name: 'Data tables present', status: getStatus('Data tables present', scanFlags.tablesPresent) },
        { name: 'Short paragraphs', status: getStatus('Short paragraphs', scanFlags.shortParas) },
        { name: 'Excellent heading density', status: getStatus('Excellent heading density', scanFlags.excellentHeadings) }
      ]
    },
    {
      name: 'Conversational Tone',
      score: conv.score,
      metrics: [
        { name: 'Direct "you" address', status: getStatus('Direct "you" address', convFlags.directYou) },
        { name: 'Personal "I/we" sharing', status: getStatus('Personal "I/we" sharing', convFlags.personalIWe) },
        { name: 'Engaging questions asked', status: getStatus('Engaging questions asked', convFlags.engagingQuestions) },
        { name: 'Reader pain points acknowledged', status: getStatus('Reader pain points acknowledged', convFlags.painPoints) }
      ]
    },
    {
      name: 'Readability',
      score: read.score,
      metrics: [
        { name: 'Good Flesch score', status: getStatus('Good Flesch score', readFlags.goodFlesch) },
        { name: 'Natural sentence variation', status: getStatus('Natural sentence variation', readFlags.naturalVariation) },
        { name: 'Low passive voice', status: getStatus('Low passive voice', readFlags.lowPassive) },
        { name: 'Low complex words', status: getStatus('Low complex words', readFlags.lowComplex) }
      ]
    },
    {
      name: 'Unique Insights',
      score: unique.score,
      metrics: [
        { name: 'First-hand experience markers', status: getStatus('First-hand experience markers', uniqueFlags.hasInsights) },
        { name: 'Dated/timely results', status: getStatus('Dated/timely results', uniqueFlags.hasDated) },
        { name: 'Interviews/quotes included', status: getStatus('Interviews/quotes included', uniqueFlags.hasInterviews) },
        { name: 'Deep content (1500+ words)', status: getStatus('Deep content (1500+ words)', uniqueFlags.deepContent) }
      ]
    },
    {
      name: 'Anti-AI Safety',
      score: anti.score,
      metrics: [
        { name: 'Low word repetition', status: getStatus('Low word repetition', antiFlags.lowRepetition) },
        { name: 'No predictable sentence starts', status: getStatus('No predictable sentence starts', antiFlags.noPredictable) }
      ]
    }
  ];

  const passed = [];
  const failed = [];
  moduleData.forEach(mod => {
    mod.metrics.forEach(m => {
      if (m.status === 'pass') passed.push(m.name);
      else failed.push(m.name);
    });
  });

  return { score: overallScore, passed, failed, modules: moduleData };
}

// ─── Build top-3 priority fixes across all summaries ──────────
function buildHomepagePriorityFixes(summaries) {
  const toolOrder = [...summaries].sort((a, b) => a.score - b.score);
  const fixes = [];
  const seen = new Set();

  const pushFix = (summary, modName, metricName) => {
    if (fixes.length >= 3) return;
    if (seen.has(metricName)) return;
    seen.add(metricName);
    fixes.push({
      module: `${summary.toolName} · ${modName}`,
      name: labelFor(metricName),
      metricName,
      toolName: summary.toolName,
      howToFix: `Failing check from the ${summary.toolName} audit (module: ${modName}). Apply the CMS-specific fix to pass this metric.`
    });
  };

  toolOrder.forEach(summary => {
    if (fixes.length >= 3) return;
    const firstFail = (summary.modules || [])
      .flatMap(mod => (mod.metrics || []).map(m => ({ ...m, moduleName: mod.name })))
      .find(m => m.status === 'fail');
    if (firstFail) pushFix(summary, firstFail.moduleName, firstFail.name);
  });

  if (fixes.length < 3) {
    toolOrder.forEach(summary => {
      if (fixes.length >= 3) return;
      (summary.modules || []).forEach(mod => {
        (mod.metrics || []).forEach(metric => {
          if (metric.status === 'fail') pushFix(summary, mod.name, metric.name);
        });
      });
    });
  }

  if (fixes.length < 3) {
    toolOrder.forEach(summary => {
      if (fixes.length >= 3) return;
      (summary.modules || []).forEach(mod => {
        (mod.metrics || []).forEach(metric => {
          if (metric.status === 'average') pushFix(summary, mod.name, metric.name);
        });
      });
    });
  }

  return fixes.slice(0, 3);
}

// ─── Fetch page (QR worker for UX parity, fall back to full-render-v2) ─
async function fetchPageForAnalysis(url) {
  // Primary: QR render worker → returns { html, metrics, loadTime }
  try {
    const res = await fetch('https://qr-full-render-worker.traffictorch.workers.dev/?url=' + encodeURIComponent(url));
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.success !== false && payload.html) {
        return {
          html: payload.html,
          metrics: payload.metrics || null,
          loadTime: payload.loadTime ?? null
        };
      }
    }
  } catch (_) { /* fall through */ }

  // Fallback: full-render-v2 → plain HTML only
  const res = await fetch('https://full-render-v2.traffictorch.workers.dev/?url=' + encodeURIComponent(url));
  if (!res.ok) throw new Error('Page not reachable');
  const html = await res.text();
  return { html, metrics: null, loadTime: null };
}

// ─── Render CMS Fixes section below the share dashboard ────────────────
function renderHomepageCmsFixes(anchor, cmsInfo, priorityFixes, doc, url, overallScore, toolScores) {
  try {
    if (!anchor) return;

    const existing = document.getElementById('cms-fixes-section');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'cms-fixes-section';
    section.className = 'mt-16 max-w-4xl mx-auto px-4';
    section.innerHTML = `
      <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
        Get step-by-step CMS instructions for the top failing metrics across UX, SEO &amp; AEO.
      </p>

      <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
        <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
        <span id="cms-detected-badge" class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
          <span id="cms-badge-dot" class="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span>
          <span id="cms-badge-name">Custom / Unknown</span>
        </span>
        <button id="cms-override-toggle" class="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline bg-transparent border-none cursor-pointer">
          Change
        </button>
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
        <button id="cms-fixes-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">
          Generate CMS Fixes
        </button>
        <p id="cms-fixes-no-fixes" class="hidden mt-4 text-lg text-green-600 dark:text-green-400 font-medium">
          No fixes needed — your homepage is well-optimized. 🎉
        </p>
      </div>

      <div id="cms-fixes-answer-container" class="mt-6 hidden">
        <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
      </div>
    `;
    anchor.insertAdjacentElement('afterend', section);

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
      if (cmsInfo.confidence === 'high')        dotClass = 'bg-green-500';
      else if (cmsInfo.confidence === 'medium') dotClass = 'bg-yellow-500';
      else if (cmsInfo.confidence === 'low')    dotClass = 'bg-orange-500';
      cmsBadgeDot.className = 'inline-block w-2.5 h-2.5 rounded-full mr-2 ' + dotClass;
    }

    if (cmsOverrideSelect) {
      const known = Array.from(cmsOverrideSelect.options).map(o => o.value);
      cmsOverrideSelect.value = known.includes(cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
    }
    if (cmsOverrideVersion && cmsInfo.version) {
      cmsOverrideVersion.value = cmsInfo.version;
    }

    cmsOverrideToggle?.addEventListener('click', () => {
      cmsOverridePanel?.classList.toggle('hidden');
    });

    if (priorityFixes.length === 0) {
      if (cmsFixesBtn) {
        cmsFixesBtn.disabled = true;
        cmsFixesBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      cmsNoFixes?.classList.remove('hidden');
    }

    cmsFixesBtn?.addEventListener('click', async () => {
      if (priorityFixes.length === 0) return;

      // ── FIX: use the dedicated OFUX quota bucket ──
      const canProceed = await canRunTool(OFUX_TOOL_KEY);
      if (!canProceed) return;

      const selectedCms     = cmsOverrideSelect?.value?.trim() || cmsInfo.name || 'Custom / Unknown';
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
          url: url || null,
          pageTitle: doc?.title || null,
          overallScore: overallScore,
          scores: toolScores,
          priorityFixes: priorityFixes.map(f => ({
            module: f.module,
            name: f.name,
            howToFix: f.howToFix
          })),
          mode: 'live-url'
        };

        const response = await fetch('https://homepage-cms-fixes.traffictorch.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Server error (${response.status})`);

        const data = await response.json();

        if (data.success && cmsAnswerContent) {
          const headerHtml = `<div style="font-weight:bold; margin-bottom:0.75rem;">🛠️ CMS Fixes for ${data.cms || selectedCms}${data.cmsVersion ? ' ' + data.cmsVersion : ''}</div>`;
          const bodyHtml = `<div>${renderCodeBlocks(data.answer || '')}</div>`;
          let warningHtml = '';
          if (Array.isArray(data.warnings) && data.warnings.length) {
            warningHtml = `<div style="margin-top:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${data.warnings.join(' ')}</div>`;
          }
          cmsAnswerContent.innerHTML = headerHtml + bodyHtml + warningHtml;
        } else if (cmsAnswerContent) {
          cmsAnswerContent.innerHTML = '❌ Error: ' + renderCodeBlocks(data.error || 'Unknown error');
        }

      } catch (err) {
        if (cmsAnswerContent) {
          cmsAnswerContent.innerHTML = '❌ Failed to generate CMS fixes. Please try again. (' + renderCodeBlocks(err.message) + ')';
        }
      } finally {
        cmsFixesBtn.disabled = false;
        cmsFixesBtn.textContent = originalLabel;
      }
    });

  } catch (err) {
    console.warn('CMS fixes section skipped:', err);
  }
}

// ─── Main Orchestration ──────────────────────────────────────────────────
export async function runOfuxAnalysis(rawUrl, containerId, aiContainerId) {
  // Accept scheme-less input like "example.com" and normalise to https://
  const url = /^https?:\/\//i.test(rawUrl || '') ? rawUrl.trim() : 'https://' + (rawUrl || '').trim();

  saveUrlToHistory(url);

  const container = document.getElementById(containerId);
  if (!container) return;

  // ── Rate limit check FIRST — dedicated OFUX bucket ──
  const canProceed = await canRunTool(OFUX_TOOL_KEY);
  if (!canProceed) {
    container.innerHTML = `
      <div class="text-center py-12 text-orange-600 dark:text-orange-400">
        <p class="text-2xl font-bold">Usage limit reached</p>
        <p class="text-lg mt-2">Please try again later or contact support.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="w-20 h-20 rounded-full border-8 border-gray-300/50 dark:border-gray-700/50 border-t-orange-500 border-r-pink-500 border-b-purple-500 animate-spin"></div>
      <p class="mt-6 text-xl font-medium text-orange-500 dark:text-orange-400">Analyzing UX SEO AEO..</p>
    </div>
  `;

  try {
    // Fetch page (QR worker for UX parity, fallback to full-render-v2)
    const { html, metrics, loadTime } = await fetchPageForAnalysis(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const cmsInfo = detectCMS({ doc, url });

    // ─── Cache raw HTML + head snapshot for the Ask AI handler ───
    window._homepageRawHtml = html || '';
    window._homepageHeadSnapshot = buildHeadSnapshot(doc);
    window._homepageCmsInfo = cmsInfo;

    // ─── Extract rich page context for the AI worker ───
    const excerptDoc = doc.cloneNode(true);
    excerptDoc.querySelectorAll('nav, header, footer, aside, script, style, .sidebar, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());

    const contentRoot = excerptDoc.querySelector('main, article, [role="main"]') || excerptDoc.body;

    const paragraphs = Array.from(contentRoot?.querySelectorAll('p') || [])
      .map(p => p.textContent.replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 60 && !t.includes('Initializing'));

    const pageExcerpt = (paragraphs[0] || contentRoot?.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    window._homepagePageContext = {
      pageTitle: doc.title || '',
      metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '',
      h1: doc.querySelector('h1')?.textContent?.trim() || '',
      pageExcerpt,
      langAttribute: doc.documentElement?.getAttribute('lang') || '',
      viewportContent: doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      linkCount: doc.querySelectorAll('a[href]').length,
      imageCount: doc.querySelectorAll('img').length,
      headingCount: doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      ctaCount: doc.querySelectorAll(
        'a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="buy"], button, [role="button"], .btn, .button'
      ).length,
      wordCount: (doc.body?.textContent || '').trim().split(/\s+/).filter(Boolean).length,
      hasBreadcrumb: !!doc.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]'),
      hasManifest: !!doc.querySelector('link[rel="manifest"]'),
      hasServiceWorker: doc.body.innerHTML.includes('serviceWorker') || doc.body.innerHTML.includes('register('),
      hasJsonLd: !!doc.querySelector('script[type="application/ld+json"]'),
      hasArticle: !!doc.querySelector('article'),
      hasMain: !!doc.querySelector('main'),
      hasAuthorByline: !!doc.querySelector('[rel="author"], .author, .byline, [itemprop="author"]'),
      hasPublishDate: !!doc.querySelector('time[datetime], meta[property="article:published_time"]'),
    };

    // ─── UX / Quit Risk summary (with browser metrics merged) ───
    let uxData = getUXContent(doc, metrics, url);
    if (typeof mergeMetricsIntoUX === 'function') {
      uxData = mergeMetricsIntoUX(uxData, metrics);
    }
    uxData.renderedLoadTime = loadTime;
    if (uxData.renderedWordCount && uxData.renderedWordCount > 50) {
      uxData.wordCount = uxData.renderedWordCount;
    }
    const uxSummary = getQuitRiskSummary(uxData);

    const seoSummary = getSEOSummary(doc, url);
    const aiSummary = getAISearchSummary(doc, url);

    const summaries = [
      { toolName: 'UX Health', ...uxSummary },
      { toolName: 'SEO Intent', ...seoSummary },
      { toolName: 'AI Search', ...aiSummary }
    ];

    renderCards(container, summaries, url);

    const overallScoreForSave = Math.round(
      (uxSummary.score + seoSummary.score + aiSummary.score) / 3
    );

    // ─── Save to history (both paths, matching every other tool) ───
    try {
      await saveAudit({ url, tool: 'OFUX', score: overallScoreForSave });
    } catch (e) {
      console.warn('Failed to save OFUX audit:', e);
    }
    try {
      await saveAuditHistory(url, 'OFUX Audit');
    } catch (e) {
      console.warn('Failed to save OFUX history:', e);
    }

    window._homepageSummaries = summaries;
    window._homepageUrl = url;
    document.body.setAttribute('data-url', url);

    const uxCounts = countStatuses(uxSummary.modules);
    const seoCounts = countStatuses(seoSummary.modules);
    const aiCounts = countStatuses(aiSummary.modules);

    const shareContainer = document.createElement('div');
    shareContainer.id = 'share-module-container';
    container.insertAdjacentElement('afterend', shareContainer);

    const overall = Math.round((uxSummary.score + seoSummary.score + aiSummary.score) / 3);
    const shareResults = {
      toolName: 'Report',
      url: url,
      pageTitle: doc.title || url,
      overallScore: overall,
      moduleScores: [
        { name: 'UX Health', score: uxSummary.score },
        { name: 'SEO Intent', score: seoSummary.score },
        { name: 'AI Search', score: aiSummary.score }
      ],
      passedMetrics: [...uxSummary.passed, ...seoSummary.passed, ...aiSummary.passed],
      failedMetrics: [...uxSummary.failed, ...seoSummary.failed, ...aiSummary.failed],
      aiFixes: [],
      rawData: { ux: uxSummary, seo: seoSummary, ai: aiSummary },
      moduleDetails: [
        { name: 'UX Health', ...uxCounts },
        { name: 'SEO Intent', ...seoCounts },
        { name: 'AI Search', ...aiCounts }
      ]
    };
    const aiContainer = document.getElementById('ai-answer-container');
    if (!aiContainer) {
      const fallback = document.createElement('div');
      fallback.id = 'ai-answer-container';
      document.body.appendChild(fallback);
    }
    initShareModule(shareContainer, shareResults, aiContainer);

    // ─── Priority Fixes + CMS Fixes ──────────────────────────────────
    const homepagePriorityFixes = buildHomepagePriorityFixes(summaries);
    const overallHomepage = Math.round((uxSummary.score + seoSummary.score + aiSummary.score) / 3);

    if (homepagePriorityFixes.length > 0) {
      const existingPrio = document.getElementById('homepage-priority-fixes');
      if (existingPrio) existingPrio.remove();

      const prioSection = document.createElement('div');
      prioSection.id = 'homepage-priority-fixes';
      prioSection.className = 'mt-16 max-w-4xl mx-auto px-4';
      prioSection.innerHTML = `
        <h2 class="text-3xl font-black text-center mb-2 text-gray-800 dark:text-gray-200">Top Priority Fixes</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
          The three highest-impact failures across UX Health, SEO Intent, and AI Search.
        </p>
        <div class="space-y-6">
          ${homepagePriorityFixes.map((fix, i) => `
            <div class="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-l-8 border-orange-500 flex gap-5">
              <div class="text-4xl font-black text-orange-600 shrink-0">${i + 1}</div>
              <div class="flex-1">
                <p class="text-sm font-bold text-orange-600 dark:text-orange-400 mb-1">${fix.module}</p>
                <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">${fix.name}</h3>
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${fix.howToFix}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      shareContainer.insertAdjacentElement('afterend', prioSection);
    }

    renderHomepageCmsFixes(
      document.getElementById('homepage-priority-fixes') || shareContainer,
      cmsInfo,
      homepagePriorityFixes,
      doc,
      url,
      overallHomepage,
      {
        uxHealth: uxSummary.score,
        seoIntent: seoSummary.score,
        aiSearch: aiSummary.score
      }
    );

    // 🏆 Leaderboard submission button — below the CMS Fixes section
    if (window.TrafficTorchLeaderboard && url) {
      const cmsSection = document.getElementById('cms-fixes-section');
      if (cmsSection) {
        window.TrafficTorchLeaderboard.injectButton(cmsSection, {
          tool: 'ofux-tool',
          url,
          title: (doc?.title || '').trim().slice(0, 200) || 'Untitled page',
          score: overall,
          moduleScores: shareResults.moduleScores
        });
      }
    }

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <p class="text-2xl font-bold">Error: ${err.message}</p>
        <p class="text-lg mt-2">Please check the URL and try again.</p>
      </div>
    `;
  }
}

// ─── Card Renderer ────────────────────────────────────────────────────────
function renderCards(container, summaries, url) {
  const prefixMap = {
    'UX Health': 'UX',
    'SEO Intent': 'SEO',
    'AI Search': 'AEO'
  };

  const cards = summaries.map((summary) => {
    const score = summary.score;
    const modules = summary.modules || [];
    const prefix = prefixMap[summary.toolName] || '';

    const ringColor = score >= 80 ? '#22c55e' : score >= 60 ? '#fb923c' : '#ef4444';
    const borderClass = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-orange-400' : 'border-red-500';
    const gradeEmoji = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
    const gradeText = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';

    const isAI = summary.toolName === 'AI Search';
    const gridCols = isAI ? 'md:grid-cols-2' : 'grid-cols-1';

    const modulesHTML = modules.map(mod => {
      const modScore = mod.score;
      const modRing = modScore >= 80 ? '#22c55e' : modScore >= 60 ? '#fb923c' : '#ef4444';
      const displayName = prefix ? `${prefix} ${mod.name}` : mod.name;

      const metricsHTML = mod.metrics.map(m => {
        const icon = m.status === 'pass' ? '✅' : m.status === 'average' ? '⚠️' : '❌';
        const color = m.status === 'pass' ? 'text-green-600 dark:text-green-400' :
                      m.status === 'average' ? 'text-orange-500 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400';
        return `
          <div class="flex items-center gap-2 text-sm py-0.5">
            <span style="display:inline-block; width:auto; height:auto; min-width:1.8rem; padding:0 0.1rem; font-size:1.2rem; line-height:1.4; text-align:center;">${icon}</span>
            <span class="${color} break-words">${m.name}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 first:border-t-0 first:pt-0">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">${displayName}</span>
            <span class="text-sm font-bold" style="color: ${modRing}">${modScore}</span>
          </div>
          <div class="grid ${gridCols} gap-0.5 pl-2">
            ${metricsHTML}
          </div>
        </div>
      `;
    }).join('');

    let toolPath = '/quit-risk-tool/';
    if (summary.toolName === 'SEO Intent') toolPath = '/seo-intent-tool/';
    else if (summary.toolName === 'AI Search') toolPath = '/ai-search-optimization-tool/';

    return `
      <div class="module-card bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-4 ${borderClass} p-6 flex flex-col overflow-visible">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${ringColor}" stroke-width="12" fill="none"
                    stroke-dasharray="${(score / 100) * 352} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
            ${score}
          </div>
        </div>
        <p class="mt-4 text-2xl font-bold text-center text-gray-800 dark:text-gray-200">${summary.toolName}</p>
        <div class="text-center mt-2 flex flex-col items-center">
          <span style="display:inline-block; width:auto; height:auto; min-width:2.8rem; padding:0 0.2rem; font-size:2.2rem; line-height:1.4; text-align:center;">${gradeEmoji}</span>
          <span class="text-lg font-medium text-gray-600 dark:text-gray-400">${gradeText}</span>
        </div>
        <div class="mt-4 max-h-80 overflow-y-auto overflow-x-visible">
          ${modulesHTML}
        </div>
        <a href="${toolPath}?url=${encodeURIComponent(url)}" 
           class="mt-6 block w-full px-4 py-3 text-center bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition">
          Full Results →
        </a>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
      ${cards[0]}
      ${cards[1]}
    </div>
    <div class="mt-6 grid grid-cols-1 overflow-visible">
      ${cards[2]}
    </div>
  `;
}

// ─── Ask AI Listener ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const askBtn = document.getElementById('ask-ai-btn');
  const askInput = document.getElementById('ai-question-input');
  const answerContainer = document.getElementById('ai-answer-container');
  const answerContent = document.getElementById('ai-answer-content');

  if (!askBtn) return;

  // Clone + replace so we never stack duplicate listeners across re-renders.
  const newAskBtn = askBtn.cloneNode(true);
  askBtn.parentNode.replaceChild(newAskBtn, askBtn);

  newAskBtn.addEventListener('click', async () => {
    // ── FIX: dedicated OFUX quota bucket ──
    const canProceed = await canRunTool(OFUX_TOOL_KEY);
    if (!canProceed) {
      const upgradeModal = document.getElementById('upgradeModal');
      if (upgradeModal) upgradeModal.classList.remove('hidden');
      return;
    }

    const question = askInput?.value?.trim();
    if (!question) {
      alert('Please enter a question.');
      return;
    }

    newAskBtn.disabled = true;
    newAskBtn.textContent = 'Thinking...';
    answerContainer.classList.remove('hidden');
    answerContent.innerHTML = '⏳ Traffic Torching...';

    try {
      const summaries = window._homepageSummaries || [];

      let uxData = { score: 0, modules: [] };
      let seoData = { score: 0, modules: [] };
      let aiData = { score: 0, modules: [] };

      summaries.forEach(s => {
        if (s.toolName === 'UX Health') uxData = { score: s.score, modules: s.modules };
        else if (s.toolName === 'SEO Intent') seoData = { score: s.score, modules: s.modules };
        else if (s.toolName === 'AI Search') aiData = { score: s.score, modules: s.modules };
      });

      const failedMetrics = [];
      summaries.forEach(s => {
        (s.modules || []).forEach(mod => {
          (mod.metrics || []).forEach(m => {
            if (m.status === 'fail') failedMetrics.push(`${s.toolName}: ${m.name}`);
          });
        });
      });

      const cms = window._homepageCmsInfo || { name: 'Custom / Unknown', version: null, confidence: 'unknown' };
      const pageContext = window._homepagePageContext || {};
      const headSnapshot = window._homepageHeadSnapshot || '';

      const priorityFixes = buildHomepagePriorityFixes(summaries).map(f => ({
        name: f.name,
        module: f.module,
        score: 0,
        impact: '',
        desc: f.howToFix
      }));

      const auditPayload = {
        question: question,
        auditData: {
          url: window._homepageUrl || '',
          ...pageContext,
          headSnapshot: headSnapshot,
          cms: {
            name: cms.name,
            version: cms.version,
            confidence: cms.confidence,
          },
          overallScore: Math.round((uxData.score + seoData.score + aiData.score) / 3),
          ux: { score: uxData.score, modules: uxData.modules },
          seo: { score: seoData.score, modules: seoData.modules },
          aeo: { score: aiData.score, modules: aiData.modules },
          failedItems: failedMetrics.slice(0, 15),
          priorityFixes: priorityFixes,
          snippets: {},
          browserMetrics: null
        },
      };

      const response = await fetch('https://ask-traffic-torch-ai.traffictorch.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditPayload),
      });

      if (!response.ok) throw new Error(`Server error (${response.status})`);

      const data = await response.json();

      if (data.success) {
        let html = `🧠 <strong>Traffic Torch AI</strong><br><br>${renderCodeBlocks(data.answer)}`;
        if (Array.isArray(data.warnings) && data.warnings.length) {
          const warningText = data.warnings.join(' ');
          html = `<div style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${warningText}</div>` + html;
        }
        answerContent.innerHTML = html;
      } else {
        answerContent.innerHTML = `❌ Error: ${renderCodeBlocks(data.error || 'Unknown error')}`;
      }
    } catch (err) {
      answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${renderCodeBlocks(err.message)})`;
    } finally {
      newAskBtn.disabled = false;
      newAskBtn.textContent = 'Ask Traffic Torch AI';
    }
  });
});

/* ── URL history: populate datalist on load + focus ── */
document.addEventListener('DOMContentLoaded', () => {
  populateUrlDatalist();
  const input = document.getElementById('ofux-url-input');
  if (input) input.addEventListener('focus', populateUrlDatalist);
});