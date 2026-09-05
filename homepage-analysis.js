// homepage-analysis.js
// Orchestrates the three tools on the homepage.

// Share Dashboard
import { initShareModule } from '/share-module.js';

// ─── Quit Risk imports ────────────────────────────────────────────────────
import { calculateReadability } from '/quit-risk-tool/modules/readability.js';
import { calculateNavigation } from '/quit-risk-tool/modules/navigation.js';
import { calculateAccessibility } from '/quit-risk-tool/modules/accessibility.js';
import { calculateMobile } from '/quit-risk-tool/modules/mobile.js';
import { calculatePerformance } from '/quit-risk-tool/modules/performance.js';

// ─── SEO Intent imports ──────────────────────────────────────────────────
import { analyzeExperience } from '/seo-intent-tool/modules/experience.js';
import { analyzeExpertise } from '/seo-intent-tool/modules/expertise.js';
import { analyzeAuthoritativeness } from '/seo-intent-tool/modules/authoritativeness.js';
import { analyzeTrustworthiness } from '/seo-intent-tool/modules/trustworthiness.js';
import { analyzeDepth } from '/seo-intent-tool/modules/depth.js';
import { analyzeReadability as analyzeSEOReadability } from '/seo-intent-tool/modules/readability.js';
import { analyzeSchema } from '/seo-intent-tool/modules/schema.js';

// ─── AI Search imports ──────────────────────────────────────────────────
import { computeAnswerability } from '/ai-search-optimization-tool/modules/answerability.js';
import { computeStructuredData } from '/ai-search-optimization-tool/modules/structuredData.js';
import { computeEEAT } from '/ai-search-optimization-tool/modules/eeatSignals.js';
import { computeScannability } from '/ai-search-optimization-tool/modules/scannability.js';
import { computeConversational } from '/ai-search-optimization-tool/modules/conversationalTone.js';
import { computeReadability as computeAIReadability } from '/ai-search-optimization-tool/modules/readability.js';
import { computeUniqueInsights } from '/ai-search-optimization-tool/modules/uniqueInsights.js';
import { computeAntiAiSafety } from '/ai-search-optimization-tool/modules/antiAiSafety.js';

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

// ─── Shared DOM extraction for Quit Risk ────────────────────────────────
function getUXContent(doc) {
  function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }
  function countExternalLinks(links) {
    const currentHost = window.location.host;
    return Array.from(links).filter(a => {
      try {
        return new URL(a.href, window.location.href).host !== currentHost;
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

  return {
    fullText,
    wordCount: countWords(fullText),
    linkCount: links.length,
    externalLinkCount: countExternalLinks(links),
    imageCount: images.length,
    altData: countMissingAlt(doc),
    headingCount: headings.length,
    hasViewport: hasViewportMeta(doc),
    hasMain: hasSemanticMain(doc),
    hasArticleOrSection: hasSemanticArticleOrSection(doc),
    paragraphTexts,
    boldCount,
    listItemCount,
    mainNav: doc.querySelector('nav, [role="navigation"], header nav, .main-menu, #main-menu, .navbar, .navigation'),
    hasDropdowns: !!doc.querySelector('nav li ul, .dropdown, [aria-haspopup="true"]'),
    topLevelItems: doc.querySelectorAll('nav > ul > li, .main-menu > li, header nav > ul > li').length || 0,
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
    title: doc.title || ''
  };
}

// ─── Text extraction for SEO ─────────────────────────────────────────────
function getVisibleText(root) {
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'head', 'iframe', 'object', 'embed'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (parent.hasAttribute('hidden') || parent.getAttribute('aria-hidden') === 'true') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) {
    text += walker.currentNode.textContent + ' ';
  }
  return text.trim();
}

// ─── Quit Risk Summary ─────────────────────────────────────────────────────
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

// ─── SEO Intent Summary ────────────────────────────────────────────────────
function getSEOSummary(doc, analyzedUrl) {
  const rawText = getVisibleText(doc.body) || '';
  const cleanedText = rawText.replace(/\s+/g, ' ').trim();

  const config = {
    parsing: {
      authorBylineSelectors: [
        'meta[name="author" i]', 'meta[property="article:author"]', '[rel="author"]',
        '.author', '.byline', '.written-by', '[class*="author" i]', '[itemprop="author"]',
        '[class*="byline" i]', '.post-author', '.entry-author', '.writer-name',
        '.blog-author', '.h-card .p-name', '.author-name'
      ],
      authorBioSelectors: [
        '.author-bio', '.bio', '[class*="bio" i]', '.about-author', '.author-description',
        '.author-box', '.author-info', '.author-details', '.writer-bio', '.contributor-bio',
        '.author-profile', '.about-the-author'
      ],
      contactLinkSelectors: [
        'a[href*="/contact" i]', 'a[href*="mailto:" i]', 'a[href*="tel:" i]'
      ],
      policyLinkSelectors: [
        'a[href*="/privacy" i]', 'a[href*="/terms" i]', 'a[href*="/legal" i]'
      ],
      updateDateSelectors: [
        'time[datetime]', '.updated', '.last-modified', '.date-updated', '.published',
        '.post-date', '.entry-date', 'meta[name="date" i]', 'meta[name="last-modified" i]',
        'meta[property="article:modified_time"]', 'meta[property="og:updated_time"]',
        'meta[name="revised"]', '[class*="update" i]', '[class*="date" i]',
        '.modified-date', '.publish-date'
      ]
    }
  };

  const exp = analyzeExperience(cleanedText, doc);
  const ext = analyzeExpertise(doc, cleanedText, config);
  const auth = analyzeAuthoritativeness(doc, cleanedText);
  const trust = analyzeTrustworthiness(analyzedUrl, doc, config, cleanedText);
  const depth = analyzeDepth(cleanedText);
  const read = analyzeSEOReadability(cleanedText);
  const schema = analyzeSchema(doc.documentElement.outerHTML, doc);

  const scores = [exp.score, ext.score, auth.score, trust.score, depth.normalized, read.normalized, schema.normalized];
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

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

// ─── AI Search Summary ────────────────────────────────────────────────────
function getAISearchSummary(doc, analyzedUrl) {
  // ─── Use the exact same main text extraction as the original AI Search tool ───
  const candidates = [doc.querySelector('article'), doc.querySelector('main'), doc.querySelector('[role="main"]'), doc.body];
  const mainEl = candidates.find(el => el && el.textContent.trim().length > 1000) || doc.body;
  mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie, .sidebar').forEach(el => el.remove());
  const mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();
  const first300 = mainText.slice(0, 1200); // original uses 1200 chars

  const ans = computeAnswerability(doc, first300);
  const struct = computeStructuredData(doc);
  const eeat = computeEEAT(doc, analyzedUrl);
  const scan = computeScannability(doc, mainEl);
  const conv = computeConversational(mainText);
  const read = computeAIReadability(mainText);
  const unique = computeUniqueInsights(mainText, read.words || 0);
  const anti = computeAntiAiSafety(mainText, read.variationScore || 0);

  const moduleScores = [ans.score, struct.score, eeat.score, scan.score, conv.score, read.score, unique.score, anti.score];
const weights = [0.25, 0.15, 0.15, 0.10, 0.12, 0.10, 0.08, 0.05];
const overallScore = Math.round(moduleScores.reduce((sum, score, i) => sum + score * weights[i], 0));

  const ansFlags = ans.flags || {};
  const structFlags = struct.flags || {};
  const eeatFlags = eeat.flags || {};
  const scanFlags = scan.flags || {};
  const convFlags = conv.flags || {};
  const readFlags = read.flags || {};
  const uniqueFlags = unique.flags || {};
  const antiFlags = anti.flags || {};

  // ─── Helper: set status for each metric ──────────────────────────────
  // For borderline metrics, use 'average' if the flag is false.
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

// ─── Top‑3 Failure Selection ────────────────────────────────────────────
function selectTopFailures(summaries) {
  const result = [];
  const remainingFailures = [];

  summaries.forEach(summary => {
    if (summary.failed.length > 0) {
      result.push({ tool: summary.toolName, metric: summary.failed[0] });
      summary.failed.slice(1).forEach(m => remainingFailures.push({ tool: summary.toolName, metric: m }));
    }
  });

  while (result.length < 3 && remainingFailures.length > 0) {
    result.push(remainingFailures.shift());
  }

  if (result.length === 0) return { status: 'congrats', failures: [] };
  return { status: 'has_failures', failures: result };
}

// ─── Main Orchestration ──────────────────────────────────────────────────
export async function runHomepageAnalysis(url, containerId, aiContainerId) {
  const container = document.getElementById(containerId);
  const aiContainer = document.getElementById(aiContainerId);
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="w-20 h-20 rounded-full border-8 border-gray-300/50 dark:border-gray-700/50 border-t-orange-500 border-r-pink-500 border-b-purple-500 animate-spin"></div>
      <p class="mt-6 text-xl font-medium text-orange-500 dark:text-orange-400">Analyzing UX SEO AEO..</p>
    </div>
  `;

  try {
    const proxy = 'https://full-render.traffictorch.workers.dev/';
    const res = await fetch(proxy + '?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error('Page not reachable');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const uxData = getUXContent(doc);
    const uxSummary = getQuitRiskSummary(uxData);

    const seoSummary = getSEOSummary(doc, url);
    const aiSummary = getAISearchSummary(doc, url);

    const summaries = [
      { toolName: 'UX Health', ...uxSummary },
      { toolName: 'SEO Intent', ...seoSummary },
      { toolName: 'AI Search', ...aiSummary }
    ];

    renderCards(container, summaries, url);

    window._homepageSummaries = summaries;
    window._homepageUrl = url;

    aiContainer.innerHTML = `
      <div class="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-purple-500/30 text-center">
        <h3 class="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">AI-Generated Fixes</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Get specific recommendations based on your top failures.</p>
        <button id="generate-ai-fixes" class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl hover:opacity-90 transition">
          Generate AI Fixes 🔮
        </button>
        <div id="ai-results" class="mt-6"></div>
      </div>
    `;
    
    // ─── Compute module details for charts ──────────────────────────
    const uxCounts = countStatuses(uxSummary.modules);
    const seoCounts = countStatuses(seoSummary.modules);
    const aiCounts = countStatuses(aiSummary.modules);

    // ─── Initialise Share Module ──────────────────────────────────────
    const shareContainer = document.createElement('div');
    shareContainer.id = 'share-module-container';
    // Use after() – inserts as next sibling, more reliable
    if (aiContainer.parentNode) {
      aiContainer.after(shareContainer);
      console.log('✅ Share container inserted, sibling check:', document.getElementById('share-module-container'));
    } else {
      console.error('❌ aiContainer has no parent – cannot insert share module');
    }

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
    initShareModule(shareContainer, shareResults);
    console.log('✅ Share module initialised, container exists now?', document.getElementById('share-module-container'));

    document.getElementById('generate-ai-fixes').addEventListener('click', async () => {
      const btn = document.getElementById('generate-ai-fixes');
      const resultsContainer = document.getElementById('ai-results');
      btn.textContent = 'Generating...';
      btn.disabled = true;

      const topResult = selectTopFailures(window._homepageSummaries);
      if (topResult.status === 'congrats') {
        resultsContainer.innerHTML = `
          <div class="p-4 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-2xl border border-green-500/50 text-center">
            <p class="text-5xl mb-2">🎉</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">All metrics passed!</p>
            <p class="text-gray-700 dark:text-gray-300">No AI fixes needed.</p>
          </div>
        `;
        btn.textContent = '✅ Done';
        btn.disabled = false;
        return;
      }

      try {
        const workerUrl = 'https://ai-cms.traffictorch.workers.dev/';
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: window._homepageUrl, failures: topResult.failures })
        });
        const workerData = await response.json();

        resultsContainer.innerHTML = `
          <div class="text-left">
            <p class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-4">
              ${workerData.cms ? `CMS Detected: ${workerData.cms}` : 'CMS Unknown'}
            </p>
            <div class="space-y-4">
              ${workerData.recommendations && workerData.recommendations.length > 0 ? workerData.recommendations.map((rec, i) => `
                <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
                  <p class="font-bold text-gray-800 dark:text-gray-200">${i+1}. ${rec.title || rec}</p>
                  <p class="text-gray-700 dark:text-gray-300 mt-1">${rec.description || rec}</p>
                </div>
              `).join('') : `<p class="text-gray-600 dark:text-gray-400">No recommendations available.</p>`}
            </div>
          </div>
        `;
      } catch (err) {
        resultsContainer.innerHTML = `
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-500 text-center">
            <p class="text-red-600 dark:text-red-400 font-bold">Error: ${err.message}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Check worker is deployed and CORS is enabled.</p>
          </div>
        `;
      }

      btn.textContent = 'Regenerate 🔮';
      btn.disabled = false;
    });

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
  // Map tool names to display prefixes
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

      // Prefix the module name if we have a prefix
      const displayName = prefix ? `${prefix} ${mod.name}` : mod.name;

      const metricsHTML = mod.metrics.map(m => {
        const icon = m.status === 'pass' ? '✅' : m.status === 'average' ? '⚠️' : '❌';
        const color = m.status === 'pass' ? 'text-green-600 dark:text-green-400' :
                      m.status === 'average' ? 'text-orange-500 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400';
        return `
          <div class="flex items-center gap-2 text-sm py-0.5">
            <span class="text-base flex-shrink-0">${icon}</span>
            <span class="${color} truncate">${m.name}</span>
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
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-4 ${borderClass} p-6 flex flex-col">
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
        <div class="text-center mt-2">
          <span class="text-2xl">${gradeEmoji}</span>
          <span class="text-lg font-medium text-gray-600 dark:text-gray-400">${gradeText}</span>
        </div>
        <div class="mt-4 max-h-80 overflow-y-auto">
          ${modulesHTML}
        </div>
        <a href="${toolPath}?url=${encodeURIComponent(url)}" 
           class="mt-6 block w-full px-4 py-3 text-center bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition">
          Full Results →
        </a>
      </div>
    `;
  });

  // ─── Layout: UX and SEO side‑by‑side on desktop; AI full‑width below ──
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${cards[0]}
      ${cards[1]}
    </div>
    <div class="mt-6 grid grid-cols-1">
      ${cards[2]}
    </div>
  `;
}

// Auto-run from ?url= parameter (like other tools)
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    const form = document.getElementById('homepage-audit-form');
    const input = document.getElementById('homepage-url-input');
    if (form && input) {
      let cleanUrl = decodeURIComponent(urlParam.trim());
      if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;
      input.value = cleanUrl;
      setTimeout(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }, 500);
    }
  }
});