// quit-risk-tool/qr-full-render-worker/src/index.js
// Dedicated full-render worker for the Quit Risk Tool.
// HTML is fetched via plain fetch() so we never depend on page.goto.
// Browser is only used to render the injected HTML and compute metrics.

import puppeteer from '@cloudflare/puppeteer';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function normalizeUrl(input) {
  if (!input) return null;
  let url = String(input).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch { return null; }
}

const OVERALL_TIMEOUT_MS = 32000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise(function (_, rej) {
      setTimeout(function () { rej(new Error(label + ' timeout')); }, ms);
    }),
  ]);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const reqUrl = new URL(request.url);
    const target = normalizeUrl(reqUrl.searchParams.get('url'));

    if (!target) {
      return jsonResponse({ success: false, error: 'Missing or invalid ?url= parameter' }, 400);
    }

    let browser;
    try {
      browser = await puppeteer.launch(env.BROWSER);
    } catch (err) {
      return jsonResponse({ success: false, error: 'Browser launch failed: ' + err.message }, 500);
    }

    const startTime = Date.now();

    const capture = (async function () {
      let page;
      try {
        page = await withTimeout(browser.newPage(), 5000, 'newPage');
      } catch (_) {
        return { html: '', metrics: null, loadTime: Date.now() - startTime };
      }

      try {
        await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
      } catch (_) {}

      // 1) Fetch HTML via plain fetch — always succeeds, no browser involved
      let html = '';
      try {
        const res = await fetch(target, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NUSA/0.7)' }
        });
        html = await res.text();
      } catch (_) {}

      // 2) Inject HTML into the browser with a <base href> so relative URLs resolve
      try {
        const htmlWithBase = html.replace(
          /<head([^>]*)>/i,
          '<head$1><base href="' + target + '">'
        );
        await withTimeout(
          page.setContent(htmlWithBase, { waitUntil: 'domcontentloaded', timeout: 4000 }),
          5000, 'setContent'
        );
      } catch (_) {}

      // 3) Let the DOM settle and any deferred scripts run
      await new Promise(function (r) { setTimeout(r, 2500); });

      // 4) Scroll to trigger lazy content
      try {
        await withTimeout(
          page.evaluate(function () {
            return new Promise(function (resolve) {
              var y = 0;
              var step = 500;
              var total = document.body ? (document.body.scrollHeight || 0) : 0;
              var timer = setInterval(function () {
                window.scrollBy(0, step);
                y += step;
                if (y >= total) {
                  clearInterval(timer);
                  window.scrollTo(0, 0);
                  resolve();
                }
              }, 60);
              setTimeout(function () { clearInterval(timer); resolve(); }, 3000);
            });
          }),
          4000, 'scroll'
        );
      } catch (_) {}

      await new Promise(function (r) { setTimeout(r, 800); });

      // 5) Metrics — computed from the injected DOM
      let metrics = null;
      try {
        metrics = await withTimeout(
          page.evaluate(function () {
            // ---------- colour helpers ----------
            var parseColor = function (str) {
              if (!str) return null;
              var m = str.match(/rgba?\(([^)]+)\)/);
              if (!m) return null;
              var p = m[1].split(',').map(function (s) { return parseFloat(s.trim()); });
              return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] };
            };
            var lum = function (c) {
              var a = [c.r, c.g, c.b].map(function (v) {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            };
            var contrast = function (c1, c2) {
              var l1 = lum(c1), l2 = lum(c2);
              var hi = l1 > l2 ? l1 : l2;
              var lo = l1 > l2 ? l2 : l1;
              return (hi + 0.05) / (lo + 0.05);
            };
            var effBg = function (el) {
              var cur = el;
              while (cur && cur !== document.documentElement) {
                var bg = parseColor(getComputedStyle(cur).backgroundColor);
                if (bg && bg.a > 0.05) return bg;
                cur = cur.parentElement;
              }
              return { r: 255, g: 255, b: 255, a: 1 };
            };

            // ---------- contrast ----------
            var contrastSamples = [];
            var seen = new Set();
            var textEls = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, a, button, label, td, th, span');
            for (var i = 0; i < textEls.length; i++) {
              var el = textEls[i];
              if (contrastSamples.length >= 60) break;
              if (el.querySelector('style, script, svg')) continue;
              var text = (el.textContent || '').trim();
              if (!text || text.length < 3) continue;
              if (el.querySelector('p, h1, h2, h3, h4, h5, h6, li, div')) continue;
              var style = getComputedStyle(el);
              if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) continue;
              var rect = el.getBoundingClientRect();
              if (rect.width < 4 || rect.height < 4) continue;
              var fg = parseColor(style.color);
              if (!fg || fg.a < 0.5) continue;
              var bg = effBg(el);
              var ratio = contrast(fg, bg);
              var fontSize = parseFloat(style.fontSize);
              var fontWeight = parseInt(style.fontWeight, 10) || 400;
              var isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
              var passesAA = ratio >= (isLarge ? 3 : 4.5);
              var key = style.color + '|' + bg.r + ',' + bg.g + ',' + bg.b;
              if (seen.has(key)) continue;
              seen.add(key);
              contrastSamples.push({
                tag: el.tagName.toLowerCase(),
                text: text.slice(0, 40),
                ratio: Math.round(ratio * 100) / 100,
                fontSize: fontSize,
                isLarge: isLarge,
                passesAA: passesAA,
                outerHTML: (el.outerHTML || '').slice(0, 500),
              });
            }
            var totalContrast = contrastSamples.length;
            var passingAA = contrastSamples.filter(function (s) { return s.passesAA; }).length;

            // ---------- touch targets ----------
            var touchEls = document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]');
            var totalTargets = 0, smallTargets = 0;
            var touchSamples = [];
            for (var j = 0; j < touchEls.length; j++) {
              var tel = touchEls[j];
              var r2 = tel.getBoundingClientRect();
              if (r2.width === 0 || r2.height === 0) continue;
              var s2 = getComputedStyle(tel);
              if (s2.display === 'none' || s2.visibility === 'hidden') continue;
              totalTargets++;
              var passes = r2.width >= 44 && r2.height >= 44;
              if (!passes) smallTargets++;
              if (touchSamples.length < 30) {
                touchSamples.push({
                  tag: tel.tagName.toLowerCase(),
                  width: Math.round(r2.width),
                  height: Math.round(r2.height),
                  passes: passes,
                  outerHTML: (tel.outerHTML || '').slice(0, 500),
                });
              }
            }

            // ---------- resources ----------
            var resources = performance.getEntriesByType('resource').map(function (r) {
              return { url: r.name, type: r.initiatorType, transferSize: r.transferSize || 0, duration: Math.round(r.duration) };
            });
            var isScript = function (r) { return r.type === 'script' || /\.js(\?|$)/i.test(r.url); };
            var isStyle  = function (r) { return r.type === 'link' || r.type === 'css' || /\.css(\?|$)/i.test(r.url); };
            var isImage  = function (r) { return r.type === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(r.url); };
            var isFont   = function (r) { return /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.url); };
            var scripts = resources.filter(isScript);
            var styles  = resources.filter(isStyle);
            var images  = resources.filter(isImage);
            var fonts   = resources.filter(isFont);
            var modernImages = images.filter(function (r) { return /\.(webp|avif)(\?|$)/i.test(r.url); }).length;

            // ---------- lazy images ----------
            var imgs = document.querySelectorAll('img');
            var lazyAttr = 0, lazyData = 0, lazyClass = 0, loadedImgs = 0;
            imgs.forEach(function (img) {
              if (img.loading === 'lazy') lazyAttr++;
              if (img.dataset.src || img.dataset.lazy || img.dataset.srcset) lazyData++;
              if (img.classList.contains('lazy') || img.classList.contains('lazyload')) lazyClass++;
              if (img.complete && img.naturalWidth > 0) loadedImgs++;
            });

            // ---------- fonts ----------
            var fontFamilies = new Set();
            document.querySelectorAll('body *').forEach(function (e) {
              var ff = getComputedStyle(e).fontFamily;
              if (ff) fontFamilies.add(ff.split(',')[0].trim().replace(/['"]/g, ''));
            });

            // ---------- alt-missing ----------
            var altMissingList = [];
            document.querySelectorAll('img').forEach(function (img) {
              var alt = img.getAttribute('alt');
              var isDecorative = img.getAttribute('role') === 'presentation' || (alt !== null && alt.trim() === '');
              if (!isDecorative && (alt === null || alt.trim() === '')) {
                if (altMissingList.length < 15) {
                  altMissingList.push({
                    src: (img.currentSrc || img.src || '').slice(0, 200),
                    width: img.naturalWidth || 0,
                    height: img.naturalHeight || 0,
                    outerHTML: (img.outerHTML || '').slice(0, 500),
                  });
                }
              }
            });

            // ---------- blocking resources ----------
            var blockingResources = [];
            var resourceEntries = performance.getEntriesByType('resource');
            var blockingURLs = new Set();
            var haveRenderBlockingAPI = false;
            for (var k = 0; k < resourceEntries.length; k++) {
              var rr = resourceEntries[k];
              if (typeof rr.renderBlockingStatus === 'string') {
                haveRenderBlockingAPI = true;
                if (rr.renderBlockingStatus === 'blocking') blockingURLs.add(rr.name);
              }
            }
            document.querySelectorAll('head script, head link').forEach(function (el) {
              var tag = el.tagName.toLowerCase();
              if (tag === 'script') {
                var src = el.src || '';
                var type = (el.getAttribute('type') || '').toLowerCase();
                var looksBlocking = src ? (!el.defer && !el.async && type !== 'module') : (!type || type === 'text/javascript' || type === 'application/javascript');
                if (!looksBlocking) return;
                if (haveRenderBlockingAPI && src && !blockingURLs.has(src)) return;
                blockingResources.push({ type: 'script', url: src ? src.slice(0, 200) : 'inline', sizeKB: 0 });
              } else {
                var rel = (el.getAttribute('rel') || '').toLowerCase();
                if (rel !== 'stylesheet') return;
                if (el.hasAttribute('disabled')) return;
                var media = el.getAttribute('media');
                if (media && media !== 'all') return;
                var href = el.href || '';
                if (haveRenderBlockingAPI && href && !blockingURLs.has(href)) return;
                blockingResources.push({ type: 'style', url: href.slice(0, 200), sizeKB: 0 });
              }
            });

            // ---------- top 5 longest sentences ----------
            var raw = (document.body.innerText || '').trim();
            var complexSentences = raw
              .split(/(?<=[.!?])\s+|\n+/)
              .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
              .filter(function (s) { return s.length > 30; })
              .filter(function (s) { return s.split(/\s+/).length <= 90; })
              .map(function (s) { return { text: s.slice(0, 200), wordCount: s.split(/\s+/).filter(function (w) { return w; }).length }; })
              .sort(function (a, b) { return b.wordCount - a.wordCount; })
              .slice(0, 5);

            var visibleText = document.body.innerText || '';

            // ---------- navigation structure ----------
            var navRoot =
              document.querySelector('#desktop-menu-placeholder nav') ||
              document.querySelector('#mobile-menu-placeholder nav') ||
              document.querySelector('header nav') ||
              document.querySelector('aside nav') ||
              document.querySelector('nav');
            var topLevelItems = 0;
            var hasMainNav = false;
            var hasDropdowns = false;
            if (navRoot) {
              hasMainNav = true;
              var categoryButtons = navRoot.querySelectorAll('button[data-category]');
              if (categoryButtons.length > 0) topLevelItems = categoryButtons.length;
              else topLevelItems = navRoot.querySelectorAll(':scope > ul > li, :scope > li, :scope > a').length;
              hasDropdowns = !!navRoot.querySelector('[aria-expanded], [aria-haspopup]');
            }

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
              contrast: { samples: contrastSamples.slice(0, 50), total: totalContrast, passingAA: passingAA, coverage: totalContrast > 0 ? passingAA / totalContrast : 1 },
              touch: { total: totalTargets, small: smallTargets, samples: touchSamples },
              resources: {
                total: resources.length,
                scripts: scripts.length,
                styles: styles.length,
                images: images.length,
                fonts: fonts.length,
                totalTransferSize: resources.reduce(function (s, r) { return s + r.transferSize; }, 0),
                scriptTransferSize: scripts.reduce(function (s, r) { return s + r.transferSize; }, 0),
                imageTransferSize: images.reduce(function (s, r) { return s + r.transferSize; }, 0),
                fontTransferSize: fonts.reduce(function (s, r) { return s + r.transferSize; }, 0),
              },
              lazyImages: { total: imgs.length, lazyAttr: lazyAttr, lazyData: lazyData, lazyClass: lazyClass, loaded: loadedImgs },
              imageFormat: { total: images.length, modern: modernImages },
              fonts: { uniqueFamilies: fontFamilies.size, families: Array.from(fontFamilies).slice(0, 10) },
              structure: {
                h1Count: document.querySelectorAll('h1').length,
                headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                topLevelItems: topLevelItems,
                hasMainNav: hasMainNav,
                hasDropdowns: hasDropdowns,
              },
              url: location.href,
              wordCount: visibleText.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length,
              visibleTextLength: visibleText.length,
              altMissingList: altMissingList,
              blockingResources: blockingResources,
              complexSentences: complexSentences,
            };
          }),
          6000, 'metrics'
        );
      } catch (_) {}

      return { html: html, metrics: metrics, loadTime: Date.now() - startTime };
    })();

    let result;
    try {
      result = await Promise.race([
        capture,
        new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error('overall timeout')); }, OVERALL_TIMEOUT_MS);
        }),
      ]);
    } catch (err) {
      try { await browser.close(); } catch (_) {}
      return jsonResponse({ success: false, error: err.message || 'Render failed' }, 500);
    }

    try { await browser.close(); } catch (_) {}

    return jsonResponse({
      success: true,
      url: target,
      loadTime: result.loadTime,
      html: result.html,
      metrics: result.metrics,
    });
  },
};