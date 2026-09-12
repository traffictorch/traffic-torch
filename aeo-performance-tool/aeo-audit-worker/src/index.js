// aeo-audit.traffictorch.workers.dev — Phase 3 (Puppeteer / Browser Run binding)
import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Use POST' }), 405, 'application/json');

    let body;
    try { body = await request.json(); }
    catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400, 'application/json'); }

    const { url, html } = body || {};
    if (!url && !html) return cors(JSON.stringify({ error: 'Provide url or html' }), 400, 'application/json');

    try {
      const result = await runAudit({ url, html }, env);
      return cors(JSON.stringify(result), 200, 'application/json');
    } catch (err) {
      return cors(JSON.stringify({ success: false, error: err.message }), 500, 'application/json');
    }
  }
};

async function runAudit({ url, html }, env) {
  let rawHtml = '';
  let renderedHtml = '';
  let finalUrl = url || '';
  let robotsTxt = '';
  let responseHeaders = {};
  let renderSource = 'custom-html';

  let browserMetrics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    mutations: 0,
    mutationNodes: 0,
    cls: 0,
    lcp: 0,
    fcp: 0,
    ttfb: 0,
    longTasks: 0,
    totalResources: 0,
    renderBlockingRequests: [],
    capturedAt: null
  };

  if (!html && url) {
    try {
      const browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') browserMetrics.consoleErrors.push(msg.text().slice(0, 300));
      });
      page.on('pageerror', err => {
        browserMetrics.pageErrors.push(String(err.message || err).slice(0, 300));
      });
      page.on('requestfailed', req => {
        browserMetrics.failedRequests.push({
          url: req.url().slice(0, 200),
          failure: req.failure()?.errorText || 'unknown'
        });
      });

      // Inject observers BEFORE any page script runs.
      // Polls for documentElement because it may be null at this point.
      await page.evaluateOnNewDocument(() => {
        window.__aeoMetrics = {
          cls: 0, lcp: 0, fcp: 0, longTasks: 0,
          mutations: 0, mutationNodes: 0
        };

        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) window.__aeoMetrics.cls += entry.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (_) {}

        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) window.__aeoMetrics.lcp = last.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_) {}

        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') window.__aeoMetrics.fcp = entry.startTime;
            }
          }).observe({ type: 'paint', buffered: true });
        } catch (_) {}

        try {
          new PerformanceObserver((list) => {
            window.__aeoMetrics.longTasks += list.getEntries().length;
          }).observe({ type: 'longtask', buffered: true });
        } catch (_) {}

        // Attach MutationObserver once documentElement exists.
        const attach = () => {
          if (!document.documentElement) return setTimeout(attach, 10);
          try {
            const obs = new MutationObserver((records) => {
              window.__aeoMetrics.mutations += records.length;
              for (const r of records) {
                window.__aeoMetrics.mutationNodes += r.addedNodes.length + r.removedNodes.length;
              }
            });
            obs.observe(document.documentElement, {
              childList: true, subtree: true, attributes: true, characterData: true
            });
          } catch (_) {}
        };
        attach();
      });

      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      if (response) {
        const h = response.headers();
        if (h) Object.assign(responseHeaders, h);
        finalUrl = response.url() || url;
      }

      await new Promise(r => setTimeout(r, 2500));

      const pageMetrics = await page.evaluate(() => {
        const m = window.__aeoMetrics || {};
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const resources = performance.getEntriesByType('resource') || [];
        return {
          cls: m.cls || 0,
          lcp: m.lcp || 0,
          fcp: m.fcp || 0,
          longTasks: m.longTasks || 0,
          mutations: m.mutations || 0,
          mutationNodes: m.mutationNodes || 0,
          ttfb: nav.responseStart || 0,
          domContentLoaded: nav.domContentLoadedEventEnd || 0,
          loadComplete: nav.loadEventEnd || 0,
          totalResources: resources.length,
          renderBlocking: resources
            .filter(r => r.renderBlockingStatus === 'blocking')
            .slice(0, 10)
            .map(r => ({ name: r.name.slice(0, 200), type: r.initiatorType }))
        };
      });

      Object.assign(browserMetrics, pageMetrics);
      browserMetrics.capturedAt = new Date().toISOString();

      renderedHtml = await page.content();
      renderSource = 'puppeteer';

      try {
        const rawRes = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrafficTorchBot/1.0)' },
          redirect: 'follow'
        }, 12000);
        if (rawRes.ok) rawHtml = await rawRes.text();
      } catch (_) {}
      if (!rawHtml) rawHtml = renderedHtml;

      await browser.close();

      try {
        const origin = new URL(finalUrl || url).origin;
        const r = await fetchWithTimeout(`${origin}/robots.txt`, {}, 8000);
        if (r.ok) robotsTxt = await r.text();
      } catch (_) {}

    } catch (err) {
      // Fallback to raw fetch only
      try {
        const r = await fetchWithTimeout(url, {}, 12000);
        if (r.ok) { renderedHtml = await r.text(); rawHtml = renderedHtml; renderSource = 'raw-fallback'; }
      } catch (_) {}
      if (!renderedHtml) throw new Error('All render paths failed: ' + err.message);
    }
  } else if (html) {
    rawHtml = html;
    renderedHtml = html;
  }

  const modules = [
    analyzeRenderFidelity(rawHtml, renderedHtml, browserMetrics),
    analyzeDomStability(renderedHtml, browserMetrics),
    analyzeContentExtractability(rawHtml),
    analyzeSchemaParse(renderedHtml),
    analyzeCrawlerAccessibility(renderedHtml, robotsTxt, finalUrl),
    analyzeTextDensity(rawHtml),
    analyzeSemanticStructure(renderedHtml),
    analyzeRenderBlocking(renderedHtml, browserMetrics),
    analyzeContentStability(renderedHtml, browserMetrics)
  ];

  const AEO_WEIGHTS = {
    'Render Fidelity': 14, 'DOM Stability': 10, 'Content Extractability': 14,
    'Schema Parse Performance': 12, 'Crawler Accessibility': 14,
    'Text Density Performance': 10, 'Semantic Structure Integrity': 10,
    'Render Blocking Performance': 8, 'Content Stability Performance': 8
  };

  let weightedSum = 0, weightTotal = 0;
  for (const m of modules) { const w = AEO_WEIGHTS[m.name] ?? 10; weightedSum += m.score * w; weightTotal += w; }
  let overall = Math.round(weightedSum / weightTotal);
  const lowest = Math.min(...modules.map(m => m.score));
  if (lowest < 25) overall = Math.min(overall, 60);
  else if (lowest < 40) overall = Math.min(overall, 72);
  else if (lowest < 60) overall = Math.min(overall, 85);

  return {
    success: true,
    url: finalUrl || 'Custom HTML',
    pageTitle: extractTitle(renderedHtml),
    overall,
    grade: gradeFromScore(overall),
    modules,
    priorityFixes: buildPriorityFixes(modules),
    rawHtml,
    renderedHtml,
    browserMetrics,
    meta: {
      rawHtmlLength: rawHtml.length,
      renderedHtmlLength: renderedHtml.length,
      renderSource,
      robotsFound: robotsTxt.length > 0,
      headers: sanitizeHeaders(responseHeaders),
      fetchedAt: new Date().toISOString()
    }
  };
}

/* ─── Module 1: Render Fidelity ─── */
function analyzeRenderFidelity(rawHtml, renderedHtml, bm) {
  const failed = [], signals = [];
  let score = 100;

  const rawText = stripTags(rawHtml);
  const renderedText = stripTags(renderedHtml);
  const rawWords = new Set(rawText.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const renderedWords = new Set(renderedText.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  let injected = 0, removed = 0;
  for (const w of renderedWords) if (!rawWords.has(w)) injected++;
  for (const w of rawWords) if (!renderedWords.has(w)) removed++;
  const injectedPct = renderedWords.size ? injected / renderedWords.size : 0;
  const removedPct = rawWords.size ? removed / rawWords.size : 0;

  if (injectedPct > 0.5)       { failed.push(`${Math.round(injectedPct * 100)}% of rendered words are JS-injected`); score -= 40; }
  else if (injectedPct > 0.30) { failed.push(`${Math.round(injectedPct * 100)}% of rendered words are JS-injected`); score -= 25; }
  else if (injectedPct > 0.15) { failed.push(`${Math.round(injectedPct * 100)}% of rendered words are JS-injected`); score -= 15; }
  else if (injectedPct > 0.05) score -= 5;
  else signals.push({ label: 'Content mostly present in raw HTML', pass: true });

  if (removedPct > 0.40)      { failed.push(`${Math.round(removedPct * 100)}% of raw words removed after render`); score -= 20; }
  else if (removedPct > 0.20) score -= 10;

  if (bm) {
    const totalErrors = (bm.consoleErrors?.length || 0) + (bm.pageErrors?.length || 0);
    if (totalErrors > 0) {
      failed.push(`${totalErrors} JavaScript error(s) during render`);
      score -= Math.min(totalErrors * 5, 30);
      signals.push({ label: `${totalErrors} console/page error(s)`, pass: false });
    } else {
      signals.push({ label: 'No JS errors during render', pass: true });
    }
  }

  const rawH1 = (rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const renderedH1 = (renderedHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  if (!rawH1 && renderedH1) { failed.push('H1 injected by JS — primary topic missing from raw HTML'); score -= 15; }
  else if (rawH1 && renderedH1) signals.push({ label: 'H1 present in raw HTML', pass: true });

  const hasNoscript = /<noscript[\s\S]*?<\/noscript>/i.test(rawHtml);
  if (!hasNoscript && injectedPct > 0.15) { failed.push('No <noscript> fallback and significant JS-injected content'); score -= 10; }
  else if (hasNoscript) signals.push({ label: '<noscript> fallback present', pass: true });

  return mod('Render Fidelity', score, {
    injectedWordPct: +injectedPct.toFixed(3),
    removedWordPct: +removedPct.toFixed(3),
    consoleErrors: bm?.consoleErrors?.length || 0,
    pageErrors: bm?.pageErrors?.length || 0,
    renderSource: bm?.capturedAt ? 'puppeteer' : 'html-only'
  }, signals, failed);
}

/* ─── Module 2: DOM Stability ─── */
function analyzeDomStability(html, bm) {
  const failed = [], signals = [];
  let score = 100;

  const docWrite = (html.match(/document\.write(?:ln)?\s*\(/g) || []).length;
  const shadowDom = (html.match(/attachShadow|shadowrootmode=/g) || []).length;
  if (docWrite > 0) { failed.push(`${docWrite} document.write() call(s)`); score -= 25; }
  if (shadowDom > 0) { failed.push(`${shadowDom} shadow DOM root(s)`); score -= 15; }

  if (bm && bm.capturedAt) {
    const live = bm.mutations || 0;
    const nodes = bm.mutationNodes || 0;
    if (live > 500)      { failed.push(`${live} live DOM mutations during load — very unstable`); score -= 35; }
    else if (live > 200) { failed.push(`${live} live DOM mutations during load`); score -= 22; }
    else if (live > 50)  { failed.push(`${live} live DOM mutations during load`); score -= 12; }
    else if (live > 10)  score -= 4;
    else signals.push({ label: `Low live mutation count (${live})`, pass: true });

    if (nodes > 1000) { failed.push(`${nodes} nodes added/removed during load`); score -= 15; }
    else if (nodes > 300) score -= 8;
  } else {
    const appendChild = (html.match(/\.appendChild\s*\(/g) || []).length;
    const innerHTML = (html.match(/\.innerHTML\s*=/g) || []).length;
    const total = appendChild + innerHTML;
    if (total > 50)      { failed.push(`High static mutation API usage (${total})`); score -= 20; }
    else if (total > 25) { failed.push(`Elevated static mutation API usage (${total})`); score -= 12; }
  }

  const frameworks = [];
  if (/__NEXT_DATA__/.test(html)) frameworks.push('Next.js');
  if (/__NUXT__/.test(html)) frameworks.push('Nuxt');
  if (/data-reactroot|react-dom/.test(html)) frameworks.push('React');
  if (/data-v-[a-f0-9]{6,}/.test(html)) frameworks.push('Vue');
  if (frameworks.length > 0) { signals.push({ label: `SPA: ${frameworks.join(', ')}`, pass: false }); score -= 8; }

  return mod('DOM Stability', score, {
    liveMutations: bm?.mutations ?? null,
    liveMutationNodes: bm?.mutationNodes ?? null,
    documentWrite: docWrite,
    shadowDom: shadowDom,
    frameworks
  }, signals, failed);
}

/* ─── Module 3: Content Extractability ─── */
function analyzeContentExtractability(html) {
  const failed = [], signals = [];
  let score;

  const semanticTags = ['article', 'section', 'header', 'main', 'nav', 'aside', 'footer', 'figure', 'figcaption'];
  let semanticCount = 0;
  for (const tag of semanticTags) semanticCount += (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
  const divCount = (html.match(/<div\b/gi) || []).length;
  const pCount = (html.match(/<p\b/gi) || []).length;
  const liCount = (html.match(/<li\b/gi) || []).length;
  const totalBlocks = divCount + semanticCount + pCount + liCount;
  const semanticRatio = totalBlocks > 0 ? semanticCount / totalBlocks : 0;

  if (semanticRatio >= 0.20)      score = 100;
  else if (semanticRatio >= 0.15) score = 85;
  else if (semanticRatio >= 0.10) score = 70;
  else if (semanticRatio >= 0.05) score = 55;
  else                            score = 35;

  signals.push({ label: `Semantic HTML ratio: ${(semanticRatio * 100).toFixed(1)}%`, pass: semanticRatio >= 0.15 });
  if (semanticRatio < 0.10) failed.push(`Low semantic HTML usage (${(semanticRatio * 100).toFixed(1)}%) — div-soup hurts AI extraction`);

  if (divCount > 300)      { failed.push(`Extreme div count (${divCount})`); score -= 15; }
  else if (divCount > 200) { failed.push(`High div count (${divCount})`); score -= 8; }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count === 0)    { failed.push('No H1 found'); score -= 15; }
  else if (h1Count > 1) { failed.push(`Multiple H1 tags (${h1Count})`); score -= 8; }
  else signals.push({ label: 'Exactly one H1', pass: true });

  if (pCount < 3)       { failed.push(`Only ${pCount} <p> tags`); score -= 10; }
  else if (pCount >= 10) signals.push({ label: `${pCount} paragraph tags`, pass: true });

  const bigInline = (html.match(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>[\s\S]{500,}?<\/script>/gi) || []).length;
  if (bigInline > 3) { failed.push(`${bigInline} large inline scripts may hide content`); score -= 10; }

  return mod('Content Extractability', score, { semanticRatio: +semanticRatio.toFixed(4), divCount, h1Count, pCount, semanticCount }, signals, failed);
}

/* ─── Module 4: Schema Parse ─── */
function analyzeSchemaParse(html) {
  const failed = [], signals = [];
  let score = 100;
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const types = new Set();
  let parseErrors = 0, parseWarnings = 0, maxDepth = 0;

  for (const block of blocks) {
    const m = block.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) continue;
    try {
      const parsed = JSON.parse(m[1].trim());
      extractSchemaTypes(parsed).forEach(t => types.add(t));
      maxDepth = Math.max(maxDepth, objectDepth(parsed));
      if (!parsed['@context']) parseWarnings++;
    } catch { parseErrors++; }
  }

  if (blocks.length === 0) { failed.push('No JSON-LD structured data found'); score -= 40; }
  else signals.push({ label: `${blocks.length} JSON-LD block(s) found`, pass: true });

  if (parseErrors > 0)   { failed.push(`${parseErrors} schema block(s) failed to parse`); score -= Math.min(parseErrors * 15, 30); }
  if (parseWarnings > 0) { failed.push(`${parseWarnings} schema block(s) missing @context`); score -= Math.min(parseWarnings * 5, 15); }

  if (types.size === 0 && blocks.length > 0) { failed.push('No @type extracted'); score -= 10; }
  else if (types.size === 1) { signals.push({ label: `Only 1 schema type`, pass: false }); score -= 5; }
  else if (types.size >= 2) signals.push({ label: `${types.size} schema types detected`, pass: true });

  if (maxDepth > 6) { failed.push(`Deeply nested schema (depth ${maxDepth})`); score -= 8; }

  return mod('Schema Parse Performance', score, { blockCount: blocks.length, types: [...types], parseErrors, parseWarnings, maxDepth }, signals, failed);
}

/* ─── Module 5: Crawler Accessibility ─── */
function analyzeCrawlerAccessibility(html, robotsTxt, url) {
  const failed = [], signals = [];
  let score = 100;

  if (!robotsTxt || robotsTxt.trim().length === 0) {
    failed.push('No robots.txt found');
    score -= 10;
  } else {
    const aiBots = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'CCBot', 'Google-Extended', 'Bytespider'];
    const blocked = [];
    for (const bot of aiBots) {
      const re = new RegExp(`User-agent:\\s*${bot}[\\s\\S]{0,200}?Disallow:\\s*\\/\\s*(?:\\n|$)`, 'i');
      if (re.test(robotsTxt)) blocked.push(bot);
    }
    if (blocked.length > 0) { failed.push(`robots.txt blocks AI crawlers: ${blocked.join(', ')}`); score -= Math.min(blocked.length * 12, 40); }
    else signals.push({ label: 'No AI crawler blocking in robots.txt', pass: true });

    if (/User-agent:\s*\*[\s\S]{0,200}?Disallow:\s*\/\s*(?:\n|$)/i.test(robotsTxt)) {
      failed.push('robots.txt blocks all crawlers at root'); score -= 40;
    }
  }

  const metaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (metaRobots) {
    const c = metaRobots[1].toLowerCase();
    if (c.includes('noindex'))  { failed.push('Meta robots has "noindex"'); score -= 40; }
    if (c.includes('nofollow')) { failed.push('Meta robots has "nofollow"'); score -= 15; }
  }

  const noscriptCount = (html.match(/<noscript[\s\S]*?<\/noscript>/gi) || []).length;
  const textLength = stripTags(html).length;
  if (textLength < 500 && noscriptCount === 0) { failed.push('Very little text and no <noscript> fallback'); score -= 20; }

  if (/cookie-?consent|cookie-?banner|onetrust|osano|cookiebot|cookieyes|gdpr-?consent|consent-?manager/i.test(html)) {
    signals.push({ label: 'Cookie consent UI detected', pass: false }); score -= 5;
  }

  if (/infinite-?scroll|infiniteScroll|IntersectionObserver[\s\S]{0,200}?fetch|window\.addEventListener\(['"]scroll/i.test(html)) {
    failed.push('Possible infinite scroll — ensure pagination fallback'); score -= 10;
  }

  const hashRouting = /window\.location\.hash|hashchange/i.test(html);
  const pushStateRouting = /history\.(pushState|replaceState)/i.test(html);
  if (hashRouting && !pushStateRouting) { failed.push('Hash-based routing detected'); score -= 10; }

  return mod('Crawler Accessibility', score, { hasRobots: robotsTxt.length > 0, robotsLength: robotsTxt.length, noscriptCount, textLength }, signals, failed);
}

/* ─── Module 6: Text Density ─── */
function analyzeTextDensity(html) {
  const failed = [], signals = [];
  let score;

  const totalLength = html.length;
  const textLength = stripTags(html).length;
  const scriptLength = (html.match(/<script[\s\S]*?<\/script>/gi) || []).join('').length;
  const styleLength = (html.match(/<style[\s\S]*?<\/style>/gi) || []).join('').length;
  const adMarkers = (html.match(/class=["'][^"']*?\b(?:ad|ads|advert|advertisement|sponsor|sponsored|promo|promotion|banner-ad|sidebar-widget)\b[^"']*?["']/gi) || []).length;

  const textToCode = totalLength > 0 ? textLength / totalLength : 0;
  if (textToCode >= 0.30)      score = 100;
  else if (textToCode >= 0.22) score = 90;
  else if (textToCode >= 0.15) score = 75;
  else if (textToCode >= 0.10) score = 60;
  else if (textToCode >= 0.05) score = 40;
  else                         score = 20;

  signals.push({ label: `Text-to-code: ${(textToCode * 100).toFixed(1)}%`, pass: textToCode >= 0.15 });
  if (textToCode < 0.10) failed.push(`Very low text-to-code ratio (${(textToCode * 100).toFixed(1)}%) — page is mostly markup`);
  else if (textToCode < 0.15) failed.push(`Text-to-code ratio is ${(textToCode * 100).toFixed(1)}% — target is 15% or higher. Reduce wrapper markup or increase visible content.`);

  if (scriptLength > textLength * 3 && textLength > 0) { failed.push('Scripts far exceed text'); score -= 20; }
  if (adMarkers > 30)      { failed.push(`${adMarkers} ad/sponsor/promo markers — noise very high`); score -= 30; }
  else if (adMarkers > 15) { failed.push(`${adMarkers} ad/sponsor/promo markers`); score -= 18; }
  else if (adMarkers > 5)  { failed.push(`${adMarkers} ad/sponsor/promo markers`); score -= 8; }

  if (textLength < 300)      { failed.push(`Very little extractable text (${textLength} chars)`); score -= 25; }
  else if (textLength < 800) score -= 10;

  return mod('Text Density Performance', score, {
    textToCode: +textToCode.toFixed(3),
    textToScripts: +(textLength / Math.max(scriptLength, 1)).toFixed(3),
    textToStyle: +(textLength / Math.max(styleLength, 1)).toFixed(3),
    textLength, htmlLength: totalLength, adMarkers
  }, signals, failed);
}

/* ─── Module 7: Semantic Structure ─── */
function analyzeSemanticStructure(html) {
  const failed = [], signals = [];
  let score = 100;

  const headings = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) headings.push({ level: +m[1], text: stripTags(m[2]).slice(0, 100) });

  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0)    { failed.push('No H1 heading'); score -= 15; }
  else if (h1Count > 1) { failed.push(`${h1Count} H1 headings`); score -= 10; }
  else signals.push({ label: 'Exactly one H1', pass: true });

  let orderViolations = 0, prev = 0;
  for (const h of headings) { if (prev > 0 && h.level > prev + 1) orderViolations++; prev = h.level; }
  if (orderViolations > 0) { failed.push(`${orderViolations} heading order violation(s)`); score -= Math.min(orderViolations * 5, 15); }
  else if (headings.length > 0) signals.push({ label: 'Heading order valid', pass: true });

  const ulCount = (html.match(/<ul\b/gi) || []).length;
  const olCount = (html.match(/<ol\b/gi) || []).length;
  if (ulCount + olCount > 0) signals.push({ label: `${ulCount + olCount} list(s)`, pass: true });

  const tableCount = (html.match(/<table\b/gi) || []).length;
  const thCount = (html.match(/<th\b/gi) || []).length;
  if (tableCount > 0 && thCount === 0) { failed.push('Tables without <th> headers'); score -= 10; }

  const paragraphs = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const pTexts = paragraphs.map(p => stripTags(p)).filter(t => t.length > 20);
  if (pTexts.length > 0) {
    const avgWords = pTexts.reduce((s, t) => s + t.split(/\s+/).length, 0) / pTexts.length;
    if (avgWords > 120)     { failed.push(`Average paragraph ${Math.round(avgWords)} words`); score -= 8; }
    else if (avgWords < 10) score -= 5;
    else signals.push({ label: `Avg paragraph: ${Math.round(avgWords)} words`, pass: true });
  }

  return mod('Semantic Structure Integrity', score, {
    h1Count, headingCount: headings.length, orderViolations,
    listCount: ulCount + olCount, tableCount, paragraphCount: pTexts.length
  }, signals, failed);
}

/* ─── Module 8: Render Blocking ─── */
function analyzeRenderBlocking(html, bm) {
  const failed = [], signals = [];
  let score = 100;

  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const headScripts = head.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || [];
  const blocking = headScripts.filter(s => !/\b(defer|async|type=["']module["'])\b/i.test(s));
  if (blocking.length > 0) { failed.push(`${blocking.length} render-blocking script(s) in <head>`); score -= Math.min(blocking.length * 8, 30); }
  else signals.push({ label: 'No blocking scripts in head', pass: true });

  const stylesheets = (html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
  if (stylesheets > 8) { failed.push(`${stylesheets} stylesheets`); score -= Math.min((stylesheets - 8) * 3, 15); }

  if (bm && bm.capturedAt) {
    const rb = bm.renderBlockingRequests?.length || 0;
    if (rb > 5)      { failed.push(`${rb} render-blocking requests observed live`); score -= 20; }
    else if (rb > 2) { failed.push(`${rb} render-blocking requests observed live`); score -= 10; }
    else signals.push({ label: 'Few render-blocking requests', pass: true });

    if (bm.fcp > 3000)      { failed.push(`FCP: ${Math.round(bm.fcp)}ms`); score -= 15; }
    else if (bm.fcp > 1800) { failed.push(`FCP slow: ${Math.round(bm.fcp)}ms`); score -= 8; }
    else if (bm.fcp > 0)    signals.push({ label: `FCP: ${Math.round(bm.fcp)}ms`, pass: true });
  }

  const fontFace = (html.match(/@font-face/gi) || []).length;
  const fontDisplay = (html.match(/font-display\s*:\s*(swap|optional|fallback)/gi) || []).length;
  if (fontFace > 0 && fontDisplay === 0) { failed.push('Web fonts without font-display: swap'); score -= 10; }

  const scriptSrcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]);
  const domains = new Set();
  let selfHost = '';
  const canonical = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  if (canonical) { try { selfHost = new URL(canonical).hostname; } catch {} }
  for (const src of scriptSrcs) {
    try {
      const u = new URL(src, 'https://example.com');
      if (!selfHost || u.hostname !== selfHost) domains.add(u.hostname);
    } catch {}
  }
  if (domains.size > 5) { failed.push(`${domains.size} third-party script domains`); score -= Math.min(domains.size * 3, 20); }

  return mod('Render Blocking Performance', score, {
    blockingHeadScripts: blocking.length,
    stylesheets,
    liveRenderBlockingCount: bm?.renderBlockingRequests?.length ?? null,
    fcp: bm?.fcp ?? null,
    ttfb: bm?.ttfb ?? null,
    longTasks: bm?.longTasks ?? null,
    totalResources: bm?.totalResources ?? null,
    thirdPartyDomains: domains.size
  }, signals, failed);
}

/* ─── Module 9: Content Stability ─── */
function analyzeContentStability(html, bm) {
  const failed = [], signals = [];
  let score = 100;

  const frameworks = [];
  if (/__NEXT_DATA__/.test(html)) frameworks.push('Next.js');
  if (/__NUXT__/.test(html)) frameworks.push('Nuxt');
  if (/data-reactroot|react-dom/.test(html)) frameworks.push('React');
  if (frameworks.length > 0) { signals.push({ label: `SPA: ${frameworks.join(', ')}`, pass: false }); score -= 10; }

  if (bm && bm.capturedAt) {
    const cls = bm.cls || 0;
    if (cls > 0.25)      { failed.push(`CLS: ${cls.toFixed(3)} — poor`); score -= 30; }
    else if (cls > 0.10) { failed.push(`CLS: ${cls.toFixed(3)} — needs improvement`); score -= 18; }
    else if (cls > 0.05) { failed.push(`CLS: ${cls.toFixed(3)} — borderline`); score -= 8; }
    else signals.push({ label: `CLS: ${cls.toFixed(3)} — good`, pass: true });

    if (bm.lcp > 4000)      { failed.push(`LCP: ${Math.round(bm.lcp)}ms`); score -= 20; }
    else if (bm.lcp > 2500) { failed.push(`LCP: ${Math.round(bm.lcp)}ms`); score -= 10; }
    else if (bm.lcp > 0)    signals.push({ label: `LCP: ${Math.round(bm.lcp)}ms`, pass: true });

    if (bm.longTasks > 5) { failed.push(`${bm.longTasks} long task(s)`); score -= 15; }
  }

  const pushState = (html.match(/history\.(pushState|replaceState)/g) || []).length;
  if (pushState > 3) { failed.push(`${pushState} client-side routing calls`); score -= 10; }

  const fetchCalls = (html.match(/\bfetch\s*\(\s*["'`]/g) || []).length;
  const asyncCalls = fetchCalls;
  if (asyncCalls > 15)      { failed.push(`${asyncCalls} async fetch calls`); score -= 20; }
  else if (asyncCalls > 8)  { failed.push(`${asyncCalls} async fetch calls`); score -= 12; }

  const innerHTML = (html.match(/\.innerHTML\s*=/g) || []).length;
  if (innerHTML > 5) { failed.push(`${innerHTML} innerHTML assignments`); score -= Math.min(innerHTML * 3, 15); }

  const swRegister = (html.match(/serviceWorker\.register/gi) || []).length;
  if (swRegister > 0) { signals.push({ label: 'Service worker registered', pass: false }); score -= 5; }

  return mod('Content Stability Performance', score, {
    frameworks,
    cls: bm?.cls ?? null,
    lcp: bm?.lcp ?? null,
    longTasks: bm?.longTasks ?? null,
    pushState, asyncCalls, innerHTMLUsage: innerHTML, swRegister
  }, signals, failed);
}

/* ─── Helpers ─── */
function mod(name, score, metrics, signals, failed) {
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { name, score, grade: gradeFromScore(score), metrics, signals, failed };
}
function gradeFromScore(score) { return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'; }
function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ').trim();
}
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).slice(0, 200) : '';
}
function extractSchemaTypes(obj) {
  const out = [];
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { obj.forEach(i => out.push(...extractSchemaTypes(i))); return out; }
  if (obj['@type']) { Array.isArray(obj['@type']) ? out.push(...obj['@type']) : out.push(obj['@type']); }
  if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(i => out.push(...extractSchemaTypes(i)));
  for (const k of Object.keys(obj)) if (k !== '@type' && typeof obj[k] === 'object') out.push(...extractSchemaTypes(obj[k]));
  return out;
}
function objectDepth(obj, d = 0) {
  if (!obj || typeof obj !== 'object') return d;
  let max = d;
  for (const k of Object.keys(obj)) if (typeof obj[k] === 'object' && obj[k] !== null) max = Math.max(max, objectDepth(obj[k], d + 1));
  return max;
}
function buildPriorityFixes(modules) {
  return modules.filter(m => m.score < 80)
    .map(m => {
      const gap = 80 - m.score;
      return {
        name: m.failed[0] || `Improve ${m.name}`,
        module: m.name, score: m.score,
        impact: `+${Math.max(2, Math.round(gap * 0.35))}–${Math.min(40, Math.round(gap * 0.75))} points`,
        desc: m.failed.length > 0 ? m.failed.join('. ') : `Improve ${m.name}`
      };
    })
    .sort((a, b) => a.score - b.score).slice(0, 5);
}
function sanitizeHeaders(h) {
  const out = {}; const keep = ['content-type', 'content-encoding', 'cache-control', 'server', 'x-powered-by', 'content-length'];
  for (const k of keep) if (h[k]) out[k] = String(h[k]).slice(0, 200);
  return out;
}
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(id); }
}
function cors(body, status = 200, contentType = null) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  return new Response(body, { status, headers });
}