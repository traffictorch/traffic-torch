import puppeteer from '@cloudflare/puppeteer';

const A11Y_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

const WEIGHTS = {
  'Core Web Vitals': 15,
  'Performance Score': 10,
  'Accessibility': 12,
  'Best Practices': 10,
  'SEO On-Page': 10,
  'PWA Readiness': 8,
  'Resource Optimisation': 10,
  'Third-Party Impact': 8,
  'Mobile UX': 10,
  'Agentic Browsing': 7,
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { url, html } = body || {};
    if (!url && !html) return json({ error: 'Provide url or html' }, 400);

    try {
      const result = await runAudit({ url, html }, env);
      return json(result, 200);
    } catch (err) {
      return json({ success: false, error: err.message || 'Audit failed' }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function runAudit({ url, html }, env) {
  let rawHtml = '';
  let renderedHtml = '';
  let finalUrl = url || '';
  const responseHeaders = {};
  let renderSource = 'custom-html';

  const bm = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    cls: 0, lcp: 0, fcp: 0, ttfb: 0, inp: 0, tbt: 0,
    longTasks: 0,
    totalResources: 0,
    totalTransferSize: 0,
    renderBlockingRequests: [],
    resources: [],
    a11yViolations: [],
    a11yViolationCount: 0,
    llmsTxt: '',
    robotsTxt: '',
    capturedAt: null,
  };

  if (!html && url) {
    try {
      const browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();

      await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') bm.consoleErrors.push(msg.text().slice(0, 300));
      });
      page.on('pageerror', (err) => {
        bm.pageErrors.push(String(err.message || err).slice(0, 300));
      });
      page.on('requestfailed', (req) => {
        bm.failedRequests.push({
          url: req.url().slice(0, 200),
          failure: req.failure()?.errorText || 'unknown',
        });
      });

      await page.evaluateOnNewDocument(() => {
        window.__lhMetrics = { cls: 0, lcp: 0, fcp: 0, tbt: 0, longTasks: 0 };
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (!e.hadRecentInput) window.__lhMetrics.cls += e.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch {}
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) window.__lhMetrics.lcp = last.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {}
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.name === 'first-contentful-paint') window.__lhMetrics.fcp = e.startTime;
            }
          }).observe({ type: 'paint', buffered: true });
        } catch {}
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.duration > 50) {
                window.__lhMetrics.tbt += Math.max(0, e.duration - 50);
                window.__lhMetrics.longTasks++;
              }
            }
          }).observe({ type: 'longtask', buffered: true });
        } catch {}
      });

      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      if (response) {
        const h = response.headers();
        if (h) Object.assign(responseHeaders, h);
        finalUrl = response.url() || url;
      }

      await new Promise((r) => setTimeout(r, 3500));

      const pageMetrics = await page.evaluate(() => {
        const m = window.__lhMetrics || {};
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const resources = performance.getEntriesByType('resource') || [];
        return {
          cls: m.cls || 0,
          lcp: m.lcp || 0,
          fcp: m.fcp || 0,
          tbt: m.tbt || 0,
          longTasks: m.longTasks || 0,
          ttfb: nav.responseStart || 0,
          domContentLoaded: nav.domContentLoadedEventEnd || 0,
          loadComplete: nav.loadEventEnd || 0,
          totalResources: resources.length,
          totalTransferSize: resources.reduce((s, r) => s + (r.transferSize || 0), 0),
          renderBlocking: resources
            .filter((r) => r.renderBlockingStatus === 'blocking')
            .slice(0, 15)
            .map((r) => ({ name: r.name.slice(0, 200), type: r.initiatorType })),
          resources: resources.slice(0, 300).map((r) => ({
            name: r.name.slice(0, 200),
            type: r.initiatorType,
            size: r.transferSize || 0,
            duration: r.duration || 0,
          })),
        };
      });
      Object.assign(bm, pageMetrics);

      renderedHtml = await page.content();

      try {
        await page.addScriptTag({ url: A11Y_SCRIPT_URL });
        const axeResult = await page.evaluate(async () => {
          return await window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
            resultTypes: ['violations'],
          });
        });
        const violations = axeResult.violations || [];
        bm.a11yViolations = violations.slice(0, 20).map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.length,
        }));
        bm.a11yViolationCount = violations.length;
      } catch (err) {
        bm.a11yViolations = [];
      }

      bm.capturedAt = new Date().toISOString();
      renderSource = 'puppeteer';

      try {
        const rawRes = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrafficTorchBot/1.0)' },
          redirect: 'follow',
        }, 12000);
        if (rawRes.ok) {
          rawHtml = await rawRes.text();
          for (const [k, v] of rawRes.headers) {
            if (!responseHeaders[k]) responseHeaders[k] = v;
          }
        }
      } catch {}
      if (!rawHtml) rawHtml = renderedHtml;

      await browser.close();

      try {
        const origin = new URL(finalUrl).origin;
        const r = await fetchWithTimeout(`${origin}/llms.txt`, {}, 5000);
        if (r.ok) bm.llmsTxt = (await r.text()).slice(0, 20000);
      } catch {}

      try {
        const origin = new URL(finalUrl).origin;
        const r = await fetchWithTimeout(`${origin}/robots.txt`, {}, 5000);
        if (r.ok) bm.robotsTxt = (await r.text()).slice(0, 20000);
      } catch {}
    } catch (err) {
      try {
        const r = await fetchWithTimeout(url, {}, 15000);
        if (r.ok) {
          renderedHtml = await r.text();
          rawHtml = renderedHtml;
          renderSource = 'raw-fallback';
        }
      } catch {}
      if (!renderedHtml) throw new Error('All render paths failed: ' + err.message);
    }
  } else if (html) {
    rawHtml = html;
    renderedHtml = html;
  }

  const modules = [
    analyzeCoreWebVitals(bm),
    analyzePerformance(bm, renderedHtml),
    analyzeAccessibility(bm, renderedHtml),
    analyzeBestPractices(bm, renderedHtml, responseHeaders, finalUrl),
    analyzeSeoOnPage(renderedHtml, finalUrl),
    analyzePwa(renderedHtml, finalUrl),
    analyzeResources(bm, renderedHtml, finalUrl),
    analyzeThirdParty(bm, finalUrl),
    analyzeMobileUx(renderedHtml, bm),
    analyzeAgentic(renderedHtml, bm, finalUrl),
  ];

  let weightedSum = 0;
  let weightTotal = 0;
  for (const m of modules) {
    const w = WEIGHTS[m.name] ?? 10;
    weightedSum += m.score * w;
    weightTotal += w;
  }
  let overall = Math.round(weightedSum / weightTotal);

  const lowest = Math.min(...modules.map((m) => m.score));
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
    browserMetrics: bm,
    meta: {
      rawHtmlLength: rawHtml.length,
      renderedHtmlLength: renderedHtml.length,
      renderSource,
      headers: sanitizeHeaders(responseHeaders),
      fetchedAt: new Date().toISOString(),
    },
  };
}

/* ─────────── MODULES ─────────── */

function analyzeCoreWebVitals(bm) {
  const failed = [], signals = [];
  let score = 100;

  const lcp = bm.lcp || 0, tbt = bm.tbt || 0, cls = bm.cls || 0;
  const fcp = bm.fcp || 0, ttfb = bm.ttfb || 0;

  if (lcp > 4000) { failed.push(`LCP ${Math.round(lcp)}ms — poor (target < 2500ms)`); score -= 25; }
  else if (lcp > 2500) { failed.push(`LCP ${Math.round(lcp)}ms — needs improvement (target < 2500ms)`); score -= 15; }
  else if (lcp > 0) signals.push({ label: `LCP ${Math.round(lcp)}ms — good`, pass: true });
  else { failed.push('LCP not captured'); score -= 10; }

  const inp = bm.inp || Math.min(tbt, 500);
  if (inp > 500) { failed.push(`INP ${Math.round(inp)}ms (TBT proxy) — poor (target < 200ms)`); score -= 20; }
  else if (inp > 200) { failed.push(`INP ${Math.round(inp)}ms (TBT proxy) — needs improvement`); score -= 12; }
  else if (inp > 0) signals.push({ label: `INP ${Math.round(inp)}ms (TBT proxy) — good`, pass: true });

  if (cls > 0.25) { failed.push(`CLS ${cls.toFixed(3)} — poor (target < 0.1)`); score -= 25; }
  else if (cls > 0.1) { failed.push(`CLS ${cls.toFixed(3)} — needs improvement`); score -= 15; }
  else signals.push({ label: `CLS ${cls.toFixed(3)} — good`, pass: true });

  if (fcp > 3000) { failed.push(`FCP ${Math.round(fcp)}ms — poor (target < 1800ms)`); score -= 15; }
  else if (fcp > 1800) { failed.push(`FCP ${Math.round(fcp)}ms — needs improvement`); score -= 8; }
  else if (fcp > 0) signals.push({ label: `FCP ${Math.round(fcp)}ms — good`, pass: true });

  if (ttfb > 1800) { failed.push(`TTFB ${Math.round(ttfb)}ms — poor (target < 800ms)`); score -= 12; }
  else if (ttfb > 800) { failed.push(`TTFB ${Math.round(ttfb)}ms — needs improvement`); score -= 6; }
  else if (ttfb > 0) signals.push({ label: `TTFB ${Math.round(ttfb)}ms — good`, pass: true });

  return mod('Core Web Vitals', score, { lcp, tbt, cls, fcp, ttfb }, signals, failed);
}

function analyzePerformance(bm, html) {
  const failed = [], signals = [];
  let score = 100;

  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const headScripts = head.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || [];
  const blocking = headScripts.filter((s) => !/\b(defer|async|type=["']module["'])\b/i.test(s));
  if (blocking.length) { failed.push(`${blocking.length} render-blocking script(s) in <head>`); score -= Math.min(blocking.length * 8, 30); }
  else signals.push({ label: 'No blocking scripts in head', pass: true });

  const stylesheets = (html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
  if (stylesheets > 8) { failed.push(`${stylesheets} stylesheets — reduce for faster paint`); score -= Math.min((stylesheets - 8) * 3, 15); }

  const inlineScript = (html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]{500,}?<\/script>/gi) || []).length;
  if (inlineScript > 3) { failed.push(`${inlineScript} large inline scripts — consider external + defer`); score -= 10; }

  const inlineStyle = (html.match(/<style[^>]*>[\s\S]{2000,}?<\/style>/gi) || []).length;
  if (inlineStyle > 0) { failed.push(`${inlineStyle} large inline style block(s) — inline critical only`); score -= 5; }

  const imgs = (html.match(/<img\b[^>]*>/gi) || []);
  let noDim = 0, noLazy = 0;
  for (const img of imgs) {
    if (!/\bwidth=/.test(img) || !/\bheight=/.test(img)) noDim++;
    if (!/\bloading=["']lazy["']/.test(img) && !/\bfetchpriority=["']high["']/.test(img)) noLazy++;
  }
  if (noDim > 3) { failed.push(`${noDim} image(s) missing width/height — cause layout shift`); score -= Math.min(noDim * 2, 12); }
  if (noLazy > 5) { failed.push(`${noLazy} image(s) without lazy loading or high fetchpriority`); score -= Math.min(noLazy, 8); }

  if (bm.tbt > 600) { failed.push(`Total Blocking Time ${Math.round(bm.tbt)}ms — main thread busy`); score -= 12; }
  else if (bm.tbt > 300) { failed.push(`Total Blocking Time ${Math.round(bm.tbt)}ms`); score -= 6; }
  else signals.push({ label: `TBT ${Math.round(bm.tbt)}ms — good`, pass: true });

  if (bm.longTasks > 5) { failed.push(`${bm.longTasks} long tasks (>50ms) — split up JS`); score -= Math.min(bm.longTasks, 15); }

  return mod('Performance Score', score, { blocking, stylesheets, imgs: imgs.length, tbt: bm.tbt, longTasks: bm.longTasks }, signals, failed);
}

function analyzeAccessibility(bm, html) {
  const failed = [], signals = [];
  let score = 100;

  const v = bm.a11yViolations || [];
  if (v.length === 0) {
    signals.push({ label: 'No axe-core violations detected', pass: true });
  } else {
    for (const vio of v.slice(0, 8)) {
      const impact = vio.impact || 'minor';
      const penalty = impact === 'critical' ? 12 : impact === 'serious' ? 8 : impact === 'moderate' ? 4 : 2;
      failed.push(`${vio.id} (${impact}, ${vio.nodes} node(s)): ${vio.help}`);
      score -= penalty;
    }
  }

  // Basic HTML checks (fall back when axe wasn't available)
  if (!bm.a11yViolationCount) {
    const imgs = html.match(/<img\b[^>]*>/gi) || [];
    const noAlt = imgs.filter((i) => !/\balt=/.test(i)).length;
    if (noAlt > 0) { failed.push(`${noAlt} image(s) without alt attribute`); score -= Math.min(noAlt * 3, 15); }
    else if (imgs.length) signals.push({ label: 'All images have alt', pass: true });

    const inputs = html.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
    const unlabeled = inputs.filter((i) => !/\bid=/.test(i) && !/\baria-label/.test(i)).length;
    if (unlabeled > 2) { failed.push(`${unlabeled} form field(s) may lack labels`); score -= Math.min(unlabeled * 2, 10); }

    if (/tabindex=["']-1["']/.test(html)) { signals.push({ label: 'Uses tabindex=-1 (verify focus order)', pass: false }); }
  }

  return mod('Accessibility', score, {
    axeViolations: bm.a11yViolationCount || v.length,
    topIssues: v.slice(0, 5).map((x) => x.id),
  }, signals, failed);
}

function analyzeBestPractices(bm, html, headers, url) {
  const failed = [], signals = [];
  let score = 100;

  // HTTPS
  if (url && url.startsWith('http://')) { failed.push('Page served over HTTP — not HTTPS'); score -= 25; }
  else if (url && url.startsWith('https://')) signals.push({ label: 'HTTPS in use', pass: true });

  // Console + page errors
  const errs = (bm.consoleErrors?.length || 0) + (bm.pageErrors?.length || 0);
  if (errs > 0) { failed.push(`${errs} console error(s) during load`); score -= Math.min(errs * 5, 25); }
  else if (bm.capturedAt) signals.push({ label: 'No console errors', pass: true });

  // Failed requests
  if (bm.failedRequests?.length) { failed.push(`${bm.failedRequests.length} failed network request(s)`); score -= Math.min(bm.failedRequests.length * 3, 15); }

  // Deprecated APIs
  const deprecated = [
    /document\.write\s*\(/g,
    /\.attachEvent\s*\(/g,
    /new\s+ActiveXObject\s*\(/g,
    /\bdocument\.all\b/g,
  ];
  let deprecatedCount = 0;
  for (const re of deprecated) deprecatedCount += (html.match(re) || []).length;
  if (deprecatedCount > 0) { failed.push(`${deprecatedCount} deprecated API usage(s)`); score -= Math.min(deprecatedCount * 4, 15); }

  // Image aspect ratio
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const badAspect = imgs.filter((i) => {
    const w = i.match(/\bwidth=["']?(\d+)/);
    const h = i.match(/\bheight=["']?(\d+)/);
    if (!w || !h) return false;
    const ratio = parseInt(w[1]) / parseInt(h[1]);
    return ratio > 3 || ratio < 0.33;
  }).length;
  if (badAspect > 0) { failed.push(`${badAspect} image(s) with distorted aspect ratio`); score -= Math.min(badAspect * 3, 12); }

  // Security headers
  const h = headers || {};
  if (!h['strict-transport-security']) signals.push({ label: 'No HSTS header', pass: false });
  if (!h['x-content-type-options']) signals.push({ label: 'No X-Content-Type-Options', pass: false });
  if (h['x-powered-by']) signals.push({ label: `X-Powered-By exposes: ${h['x-powered-by']}`, pass: false });

  return mod('Best Practices', score, { https: url?.startsWith('https://'), errors: errs, deprecatedCount, badAspect }, signals, failed);
}

function analyzeSeoOnPage(html, url) {
  const failed = [], signals = [];
  let score = 100;

  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const titleLen = title.trim().length;
  if (!title) { failed.push('Missing <title> tag'); score -= 20; }
  else if (titleLen < 20) { failed.push(`Title too short (${titleLen} chars) — target 50-60`); score -= 8; }
  else if (titleLen > 65) { failed.push(`Title too long (${titleLen} chars) — target 50-60`); score -= 6; }
  else signals.push({ label: `Title length ${titleLen} — good`, pass: true });

  const metaDesc = (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  const descLen = metaDesc.length;
  if (!metaDesc) { failed.push('Missing meta description'); score -= 10; }
  else if (descLen < 70) { failed.push(`Meta description short (${descLen} chars) — target 120-160`); score -= 5; }
  else if (descLen > 165) { failed.push(`Meta description long (${descLen} chars)`); score -= 4; }
  else signals.push({ label: `Meta description ${descLen} chars — good`, pass: true });

  const canonical = (html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  if (!canonical) { failed.push('Missing canonical link'); score -= 10; }
  else signals.push({ label: 'Canonical present', pass: true });

  const hreflang = (html.match(/<link[^>]*hreflang=/gi) || []).length;
  if (hreflang === 0) signals.push({ label: 'No hreflang tags (single-locale is fine)', pass: true });
  else signals.push({ label: `${hreflang} hreflang tag(s)`, pass: true });

  const metaRobots = (html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  if (/noindex/i.test(metaRobots)) { failed.push('Meta robots contains noindex — page will not be indexed'); score -= 30; }
  else if (/nofollow/i.test(metaRobots)) { failed.push('Meta robots contains nofollow'); score -= 10; }
  else signals.push({ label: 'Indexable (no noindex)', pass: true });

  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (h1s === 0) { failed.push('No H1 on page'); score -= 12; }
  else if (h1s > 1) { failed.push(`${h1s} H1 tags — use exactly one`); score -= 6; }
  else signals.push({ label: 'Exactly one H1', pass: true });

  const viewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  if (!viewport) { failed.push('Missing viewport meta'); score -= 10; }

  return mod('SEO On-Page', score, { titleLen, descLen, canonical, h1s, viewport }, signals, failed);
}

function analyzePwa(html, url) {
  const failed = [], signals = [];
  let score = 100;

  const manifest = (html.match(/<link[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  if (!manifest) { failed.push('No web app manifest link'); score -= 25; }
  else signals.push({ label: 'Manifest linked', pass: true });

  const sw = /serviceWorker\.register|navigator\.serviceWorker/i.test(html);
  if (!sw) { failed.push('No service worker registration detected'); score -= 25; }
  else signals.push({ label: 'Service worker registered', pass: true });

  const themeColor = /<meta[^>]*name=["']theme-color["']/i.test(html);
  if (!themeColor) { failed.push('Missing theme-color meta'); score -= 8; }

  const appleCapable = /<meta[^>]*name=["']apple-mobile-web-app-capable["']/i.test(html);
  if (!appleCapable) signals.push({ label: 'No apple-mobile-web-app-capable', pass: false });

  const appleIcons = (html.match(/<link[^>]*rel=["']apple-touch-icon["']/gi) || []).length;
  if (appleIcons === 0) signals.push({ label: 'No apple-touch-icon', pass: false });
  else signals.push({ label: `${appleIcons} apple-touch-icon(s)`, pass: true });

  const maskIcon = /<link[^>]*rel=["']mask-icon["']/i.test(html);
  if (!maskIcon) signals.push({ label: 'No mask-icon', pass: false });

  const isHttps = url?.startsWith('https://');
  if (!isHttps && url) { failed.push('PWA requires HTTPS'); score -= 25; }

  return mod('PWA Readiness', score, { manifest: !!manifest, serviceWorker: sw, themeColor }, signals, failed);
}

function analyzeResources(bm, html, url) {
  const failed = [], signals = [];
  let score = 100;

  const res = bm.resources || [];
  const origin = url ? new URL(url).origin : '';

  const images = res.filter((r) => r.type === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(r.name));
  const largeImages = images.filter((r) => r.size > 200 * 1024);
  if (largeImages.length) { failed.push(`${largeImages.length} image(s) over 200KB`); score -= Math.min(largeImages.length * 4, 20); }
  else if (images.length) signals.push({ label: `${images.length} images, none over 200KB`, pass: true });

  const modernImages = images.filter((r) => /\.(webp|avif)(\?|$)/i.test(r.name)).length;
  if (images.length > 3 && modernImages === 0) { failed.push('No WebP/AVIF images detected — modern formats save 30-60%'); score -= 12; }

  const scripts = res.filter((r) => r.type === 'script');
  const totalScriptSize = scripts.reduce((s, r) => s + r.size, 0);
  if (totalScriptSize > 800 * 1024) { failed.push(`Script total ${Math.round(totalScriptSize / 1024)}KB — reduce for mobile`); score -= 15; }
  else if (scripts.length) signals.push({ label: `${scripts.length} scripts, ${Math.round(totalScriptSize / 1024)}KB total`, pass: true });

  const styles = res.filter((r) => r.type === 'css' || r.type === 'link');
  const totalCssSize = styles.reduce((s, r) => s + r.size, 0);
  if (totalCssSize > 150 * 1024) { failed.push(`CSS total ${Math.round(totalCssSize / 1024)}KB — consider purging unused CSS`); score -= 10; }

  const fonts = res.filter((r) => /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.name));
  const hasFontDisplay = /font-display\s*:\s*(swap|optional|fallback)/i.test(html);
  if (fonts.length > 0 && !hasFontDisplay) { failed.push('Web fonts without font-display: swap'); score -= 10; }
  else if (fonts.length) signals.push({ label: `${fonts.length} font(s) with font-display`, pass: true });

  const totalTransfer = bm.totalTransferSize || 0;
  if (totalTransfer > 3 * 1024 * 1024) { failed.push(`Total transfer ${(totalTransfer / 1024 / 1024).toFixed(1)}MB — heavy page`); score -= 12; }
  else if (totalTransfer > 0) signals.push({ label: `Total transfer ${(totalTransfer / 1024).toFixed(0)}KB`, pass: true });

  return mod('Resource Optimisation', score, {
    imageCount: images.length,
    largeImages: largeImages.length,
    scriptCount: scripts.length,
    scriptSizeKB: Math.round(totalScriptSize / 1024),
    cssSizeKB: Math.round(totalCssSize / 1024),
    fontCount: fonts.length,
    totalKB: Math.round(totalTransfer / 1024),
  }, signals, failed);
}

function analyzeThirdParty(bm, url) {
  const failed = [], signals = [];
  let score = 100;

  const origin = url ? new URL(url).origin : '';
  const res = bm.resources || [];
  const thirdPartyDomains = new Set();
  let thirdPartySize = 0;
  let thirdPartyScriptSize = 0;

  for (const r of res) {
    try {
      const u = new URL(r.name);
      if (origin && u.origin !== origin) {
        thirdPartyDomains.add(u.hostname);
        thirdPartySize += r.size || 0;
        if (r.type === 'script') thirdPartyScriptSize += r.size || 0;
      }
    } catch {}
  }

  const domainCount = thirdPartyDomains.size;
  if (domainCount > 12) { failed.push(`${domainCount} third-party domains — each adds CPU + network cost`); score -= 30; }
  else if (domainCount > 6) { failed.push(`${domainCount} third-party domains`); score -= 18; }
  else if (domainCount > 3) { failed.push(`${domainCount} third-party domains`); score -= 8; }
  else signals.push({ label: `${domainCount} third-party domain(s) — lean`, pass: true });

  if (thirdPartyScriptSize > 500 * 1024) { failed.push(`Third-party scripts ${Math.round(thirdPartyScriptSize / 1024)}KB`); score -= 15; }

  // Common heavy weights by domain
  const heavyweights = ['googletagmanager.com', 'google-analytics.com', 'facebook.net', 'hotjar.com', 'clarity.ms', 'doubleclick.net', 'youtube.com', 'intercom.io', 'hubspot.com'];
  const found = [...thirdPartyDomains].filter((d) => heavyweights.some((h) => d.includes(h)));
  if (found.length > 0) signals.push({ label: `Heavyweights detected: ${found.slice(0, 4).join(', ')}`, pass: false });

  return mod('Third-Party Impact', score, {
    thirdPartyDomains: domainCount,
    topDomains: [...thirdPartyDomains].slice(0, 10),
    thirdPartyKB: Math.round(thirdPartySize / 1024),
    thirdPartyScriptKB: Math.round(thirdPartyScriptSize / 1024),
  }, signals, failed);
}

function analyzeMobileUx(html, bm) {
  const failed = [], signals = [];
  let score = 100;

  const viewport = (html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i) || [])[1] || '';
  if (!viewport) { failed.push('Missing viewport meta'); score -= 25; }
  else if (!/width=device-width/i.test(viewport)) { failed.push('Viewport missing width=device-width'); score -= 15; }
  else signals.push({ label: 'Viewport correct', pass: true });

  if (/user-scalable=no/i.test(viewport)) { failed.push('user-scalable=no blocks pinch-zoom (WCAG)'); score -= 15; }
  if (/maximum-scale=1(\.0)?\b/i.test(viewport)) { failed.push('maximum-scale=1 blocks user zoom'); score -= 10; }

  const smallFont = (html.match(/font-size\s*:\s*(\d+)px/gi) || [])
    .map((m) => parseInt(m.match(/(\d+)px/i)[1]))
    .filter((n) => n < 14).length;
  if (smallFont > 3) { failed.push(`${smallFont} font sizes under 14px — hurts readability`); score -= Math.min(smallFont, 10); }

  // Tap target heuristic: small fixed widths/heights on clickable elements
  const smallButtons = (html.match(/<(button|a)\b[^>]*style=["'][^"']*(width|height)\s*:\s*(\d+)px/gi) || [])
    .filter((s) => {
      const m = s.match(/(\d+)px/);
      return m && parseInt(m[1]) < 44;
    }).length;
  if (smallButtons > 2) { failed.push(`${smallButtons} clickable element(s) under 44px — hard to tap`); score -= Math.min(smallButtons * 3, 12); }

  const hasHorizontalScrollBlock = /overflow-x\s*:\s*hidden/i.test(html);
  const hasHorizontalScrollAuto = /overflow-x\s*:\s*(auto|scroll)/i.test(html);
  if (hasHorizontalScrollAuto && !hasHorizontalScrollBlock) signals.push({ label: 'Horizontal scroll container detected', pass: false });

  if (/env\(safe-area-inset/i.test(html) || /viewport-fit=cover/i.test(viewport)) {
    signals.push({ label: 'Safe-area insets handled', pass: true });
  } else {
    signals.push({ label: 'No safe-area insets for notched devices', pass: false });
  }

  if (bm && bm.cls > 0.15) { failed.push(`CLS ${bm.cls.toFixed(3)} — mobile users notice layout shift`); score -= 12; }

  return mod('Mobile UX', score, { viewport: viewport.slice(0, 100), smallFonts: smallFont, smallButtons }, signals, failed);
}

function analyzeAgentic(html, bm, url) {
  const failed = [], signals = [];
  let score = 100;

  // llms.txt
  if (bm.llmsTxt) signals.push({ label: 'llms.txt found', pass: true });
  else signals.push({ label: 'No llms.txt (optional, helps agents)', pass: false });

  // robots.txt AI bots
  const robots = bm.robotsTxt || '';
  if (robots) {
    const aiBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'];
    const blocked = aiBots.filter((bot) => new RegExp(`User-agent:\\s*${bot}[\\s\\S]{0,200}?Disallow:\\s*\\/\\s*(?:\\n|$)`, 'i').test(robots));
    if (blocked.length > 0) { failed.push(`robots.txt blocks AI agents: ${blocked.join(', ')}`); score -= blocked.length * 8; }
    else signals.push({ label: 'AI agents not blocked in robots.txt', pass: true });
  }

  // Semantic landmarks
  const landmarks = ['<main', '<nav', '<header', '<footer', '<article', '<aside'];
  const foundLandmarks = landmarks.filter((l) => new RegExp(l, 'i').test(html)).length;
  if (foundLandmarks < 3) { failed.push(`Only ${foundLandmarks}/6 semantic landmarks — agents need structure`); score -= 15; }
  else signals.push({ label: `${foundLandmarks} semantic landmarks found`, pass: true });

  // Form labels
  const inputs = html.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
  const labeled = inputs.filter((i) => /\bid=/.test(i) || /\baria-label/.test(i) || /\baria-labelledby/.test(i)).length;
  if (inputs.length > 3 && labeled / inputs.length < 0.7) {
    failed.push(`${inputs.length - labeled} form field(s) without labels — agents cannot fill forms`);
    score -= 12;
  }

  // Skip link (focus order)
  if (/<a\b[^>]*href=["']#(main|content|skip)/i.test(html)) signals.push({ label: 'Skip link present', pass: true });
  else signals.push({ label: 'No skip-to-content link', pass: false });

  // Overlay traps
  const modals = (html.match(/role=["']dialog["']/gi) || []).length + (html.match(/class=["'][^"']*modal[^"']*["']/gi) || []).length;
  if (modals > 3) signals.push({ label: `${modals} modal/dialog elements — verify no overlay traps`, pass: false });

  // WebMCP detection
  if (/window\.__webmcp|webmcp|navigator\.modelContext/i.test(html)) {
    signals.push({ label: 'WebMCP markers detected', pass: true });
  } else {
    signals.push({ label: 'No WebMCP integration detected (beta)', pass: false });
  }

  // Stable DOM
  if (bm.capturedAt && bm.mutations === 0) signals.push({ label: 'DOM stable during audit', pass: true });

  return mod('Agentic Browsing', score, {
    llmsTxt: !!bm.llmsTxt,
    landmarks: foundLandmarks,
    formFields: inputs.length,
    labeledFields: labeled,
    hasSkipLink: /<a\b[^>]*href=["']#(main|content|skip)/i.test(html),
    hasWebMcp: /window\.__webmcp|webmcp|navigator\.modelContext/i.test(html),
  }, signals, failed);
}

/* ─────────── HELPERS ─────────── */

function mod(name, score, metrics, signals, failed) {
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { name, score, grade: gradeFromScore(score), metrics, signals, failed };
}

function gradeFromScore(score) {
  return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).slice(0, 200) : '';
}

function buildPriorityFixes(modules) {
  return modules
    .filter((m) => m.score < 80)
    .map((m) => {
      const gap = 80 - m.score;
      return {
        name: m.failed[0] || `Improve ${m.name}`,
        module: m.name,
        score: m.score,
        impact: `+${Math.max(2, Math.round(gap * 0.35))}–${Math.min(40, Math.round(gap * 0.75))} points`,
        desc: m.failed.length > 0 ? m.failed.join('. ') : `Improve ${m.name}`,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}

function sanitizeHeaders(h) {
  const out = {};
  const keep = ['content-type', 'content-encoding', 'cache-control', 'server', 'x-powered-by', 'content-length', 'strict-transport-security', 'x-content-type-options'];
  for (const k of keep) if (h[k]) out[k] = String(h[k]).slice(0, 200);
  return out;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
