// quit-risk-tool/qr-full-render-worker/src/index.js
// Dedicated full-render worker for the Quit Risk Tool.
// Renders a URL in Cloudflare Browser Rendering and returns
// { success, url, loadTime, html, metrics }.

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
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
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
  } catch {
    return null;
  }
}

const OVERALL_TIMEOUT_MS = 40000;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const reqUrl = new URL(request.url);
    const target = normalizeUrl(reqUrl.searchParams.get('url'));

    if (!target) {
      return jsonResponse(
        { success: false, error: 'Missing or invalid ?url= parameter' },
        400
      );
    }

    let browser;
    try {
      browser = await puppeteer.launch(env.BROWSER);
    } catch (err) {
      return jsonResponse(
        { success: false, error: 'Browser launch failed: ' + err.message },
        500
      );
    }

    const startTime = Date.now();

    // Master race: whatever happens, we return SOMETHING before Cloudflare kills us.
    const capture = (async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });
      await page.setDefaultTimeout(12000);
      await page.setDefaultNavigationTimeout(12000);

      try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const u = req.url();
          if (/googletagmanager|google-analytics|doubleclick|facebook\.net|hotjar|segment\.io|mixpanel|fullstory|clarity\.ms/i.test(u)) {
            req.abort();
          } else {
            req.continue();
          }
        });
      } catch (_) {}

      // Navigate — never throw, just continue with whatever loaded.
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 12000 });
      } catch (_) {}

      // Let dynamic content settle.
      await new Promise((r) => setTimeout(r, 2500));

      // Scroll to trigger lazy content (guarded).
      try {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let y = 0;
            const step = 500;
            const total = document.body ? (document.body.scrollHeight || 0) : 0;
            const timer = setInterval(() => {
              window.scrollBy(0, step);
              y += step;
              if (y >= total) {
                clearInterval(timer);
                window.scrollTo(0, 0);
                resolve();
              }
            }, 60);
            setTimeout(() => { clearInterval(timer); resolve(); }, 4000);
          });
        });
      } catch (_) {}

      await new Promise((r) => setTimeout(r, 800));

      // Capture HTML and metrics — both guarded.
      let html = '';
      try { html = await page.content(); } catch (_) {}

      let metrics = null;
      try {
        metrics = await page.evaluate(() => {
          // ---------- colour helpers ----------
          const parseColor = (str) => {
            if (!str) return null;
            const m = str.match(/rgba?\(([^)]+)\)/);
            if (!m) return null;
            const p = m[1].split(',').map((s) => parseFloat(s.trim()));
            return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
          };
          const lum = ({ r, g, b }) => {
            const a = [r, g, b].map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
          };
          const contrast = (c1, c2) => {
            const l1 = lum(c1), l2 = lum(c2);
            const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
            return (hi + 0.05) / (lo + 0.05);
          };
          const effBg = (el) => {
            let cur = el;
            while (cur && cur !== document.documentElement) {
              const bg = parseColor(getComputedStyle(cur).backgroundColor);
              if (bg && bg.a > 0.05) return bg;
              cur = cur.parentElement;
            }
            return { r: 255, g: 255, b: 255, a: 1 };
          };

          // ---------- contrast ----------
          const contrastSamples = [];
          const seen = new Set();
          const textEls = document.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, a, button, label, td, th, span'
          );
          for (const el of textEls) {
            if (contrastSamples.length >= 60) break;
            if (el.querySelector('style, script, svg')) continue;
            const text = (el.textContent || '').trim();
            if (!text || text.length < 3) continue;
            if (el.querySelector('p, h1, h2, h3, h4, h5, h6, li, div')) continue;
            const style = getComputedStyle(el);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              parseFloat(style.opacity) < 0.1
            )
              continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) continue;
            const fg = parseColor(style.color);
            if (!fg || fg.a < 0.5) continue;
            const bg = effBg(el);
            const ratio = contrast(fg, bg);
            const fontSize = parseFloat(style.fontSize);
            const fontWeight = parseInt(style.fontWeight, 10) || 400;
            const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
            const passesAA = ratio >= (isLarge ? 3 : 4.5);
            const key = style.color + '|' + bg.r + ',' + bg.g + ',' + bg.b;
            if (seen.has(key)) continue;
            seen.add(key);
            contrastSamples.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 40),
              ratio: Math.round(ratio * 100) / 100,
              fontSize,
              isLarge,
              passesAA,
              outerHTML: (el.outerHTML || '').slice(0, 500),
            });
          }
          const totalContrast = contrastSamples.length;
          const passingAA = contrastSamples.filter((s) => s.passesAA).length;

          // ---------- touch targets ----------
          const touchEls = document.querySelectorAll(
            'a, button, [role="button"], input[type="submit"], input[type="button"]'
          );
          let totalTargets = 0, smallTargets = 0;
          const touchSamples = [];
          for (const el of touchEls) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            totalTargets++;
            const passes = rect.width >= 44 && rect.height >= 44;
            if (!passes) smallTargets++;
            if (touchSamples.length < 30) {
              touchSamples.push({
                tag: el.tagName.toLowerCase(),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                passes,
                outerHTML: (el.outerHTML || '').slice(0, 500),
              });
            }
          }

          // ---------- resources ----------
          const resources = performance.getEntriesByType('resource').map((r) => ({
            url: r.name,
            type: r.initiatorType,
            transferSize: r.transferSize || 0,
            duration: Math.round(r.duration),
          }));
          const isScript = (r) => r.type === 'script' || /\.js(\?|$)/i.test(r.url);
          const isStyle  = (r) => r.type === 'link' || r.type === 'css' || /\.css(\?|$)/i.test(r.url);
          const isImage  = (r) => r.type === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(r.url);
          const isFont   = (r) => /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.url);

          const scripts = resources.filter(isScript);
          const styles  = resources.filter(isStyle);
          const images  = resources.filter(isImage);
          const fonts   = resources.filter(isFont);
          const modernImages = images.filter((r) => /\.(webp|avif)(\?|$)/i.test(r.url)).length;

          // ---------- lazy images ----------
          const imgs = document.querySelectorAll('img');
          let lazyAttr = 0, lazyData = 0, lazyClass = 0, loadedImgs = 0;
          imgs.forEach((img) => {
            if (img.loading === 'lazy') lazyAttr++;
            if (img.dataset.src || img.dataset.lazy || img.dataset.srcset) lazyData++;
            if (img.classList.contains('lazy') || img.classList.contains('lazyload')) lazyClass++;
            if (img.complete && img.naturalWidth > 0) loadedImgs++;
          });

          // ---------- fonts ----------
          const fontFamilies = new Set();
          document.querySelectorAll('body *').forEach((el) => {
            const ff = getComputedStyle(el).fontFamily;
            if (ff) fontFamilies.add(ff.split(',')[0].trim().replace(/['"]/g, ''));
          });

          // ---------- alt-missing image list ----------
          const altMissingList = [];
          document.querySelectorAll('img').forEach((img) => {
            const alt = img.getAttribute('alt');
            const isDecorative =
              img.getAttribute('role') === 'presentation' ||
              (alt !== null && alt.trim() === '');
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

          // ---------- blocking resources in <head> ----------
          const blockingResources = [];
          const resourceEntries = performance.getEntriesByType('resource');
          const blockingURLs = new Set();
          let haveRenderBlockingAPI = false;
          for (const r of resourceEntries) {
            if (typeof r.renderBlockingStatus === 'string') {
              haveRenderBlockingAPI = true;
              if (r.renderBlockingStatus === 'blocking') {
                blockingURLs.add(r.name);
              }
            }
          }

          document.querySelectorAll('head script, head link').forEach((el) => {
            const tag = el.tagName.toLowerCase();

            if (tag === 'script') {
              const src = el.src || '';
              const type = (el.getAttribute('type') || '').toLowerCase();
              const looksBlocking = src
                ? (!el.defer && !el.async && type !== 'module')
                : (!type || type === 'text/javascript' || type === 'application/javascript');
              if (!looksBlocking) return;
              if (haveRenderBlockingAPI && src) {
                if (!blockingURLs.has(src)) return;
              }
              blockingResources.push({
                type: 'script',
                url: src ? src.slice(0, 200) : 'inline',
                sizeKB: 0,
              });
            } else {
              const rel = (el.getAttribute('rel') || '').toLowerCase();
              if (rel !== 'stylesheet') return;
              if (el.hasAttribute('disabled')) return;
              const media = el.getAttribute('media');
              if (media && media !== 'all') return;
              const href = el.href || '';
              if (haveRenderBlockingAPI && href) {
                if (!blockingURLs.has(href)) return;
              }
              blockingResources.push({
                type: 'style',
                url: href.slice(0, 200),
                sizeKB: 0,
              });
            }
          });

          // ---------- top 5 longest sentences ----------
          const complexSentences = (() => {
            const raw = (document.body.innerText || '').trim();
            return raw
              .split(/(?<=[.!?])\s+|\n+/)
              .map((s) => s.replace(/\s+/g, ' ').trim())
              .filter((s) => s.length > 30)
              .filter((s) => s.split(/\s+/).length <= 90)
              .map((s) => ({
                text: s.slice(0, 200),
                wordCount: s.split(/\s+/).filter((w) => w).length,
              }))
              .sort((a, b) => b.wordCount - a.wordCount)
              .slice(0, 5);
          })();

          // ---------- visible text ----------
          const visibleText = document.body.innerText || "";

          // ---------- navigation structure ----------
          const navRoot =
            document.querySelector('#desktop-menu-placeholder nav') ||
            document.querySelector('#mobile-menu-placeholder nav') ||
            document.querySelector('header nav') ||
            document.querySelector('aside nav') ||
            document.querySelector('nav');

          let topLevelItems = 0;
          let hasMainNav = false;
          let hasDropdowns = false;

          if (navRoot) {
            hasMainNav = true;
            const categoryButtons = navRoot.querySelectorAll('button[data-category]');
            if (categoryButtons.length > 0) {
              topLevelItems = categoryButtons.length;
            } else {
              topLevelItems = navRoot.querySelectorAll(
                ':scope > ul > li, :scope > li, :scope > a'
              ).length;
            }
            hasDropdowns = !!navRoot.querySelector('[aria-expanded], [aria-haspopup]');
          }

          return {
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              dpr: window.devicePixelRatio,
            },
            contrast: {
              samples: contrastSamples.slice(0, 50),
              total: totalContrast,
              passingAA,
              coverage: totalContrast > 0 ? passingAA / totalContrast : 1,
            },
            touch: { total: totalTargets, small: smallTargets, samples: touchSamples },
            resources: {
              total: resources.length,
              scripts: scripts.length,
              styles: styles.length,
              images: images.length,
              fonts: fonts.length,
              totalTransferSize: resources.reduce((s, r) => s + r.transferSize, 0),
              scriptTransferSize: scripts.reduce((s, r) => s + r.transferSize, 0),
              imageTransferSize: images.reduce((s, r) => s + r.transferSize, 0),
              fontTransferSize: fonts.reduce((s, r) => s + r.transferSize, 0),
            },
            lazyImages: { total: imgs.length, lazyAttr, lazyData, lazyClass, loaded: loadedImgs },
            imageFormat: { total: images.length, modern: modernImages },
            fonts: { uniqueFamilies: fontFamilies.size, families: Array.from(fontFamilies).slice(0, 10) },
            structure: {
              h1Count: document.querySelectorAll("h1").length,
              headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
              topLevelItems,
              hasMainNav,
              hasDropdowns,
            },
            url: location.href,
            wordCount: visibleText.trim().split(/\s+/).filter((w) => w.length > 0).length,
            visibleTextLength: visibleText.length,
            altMissingList,
            blockingResources,
            complexSentences,
          };
        });
      } catch (_) {}

      return { html, metrics, loadTime: Date.now() - startTime };
    })();

    let result;
    try {
      result = await Promise.race([
        capture,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('overall timeout')), OVERALL_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      try { await browser.close(); } catch {}
      return jsonResponse(
        { success: false, error: err.message || 'Render failed' },
        500
      );
    }

    try { await browser.close(); } catch {}

    return jsonResponse({
      success: true,
      url: target,
      loadTime: result.loadTime,
      html: result.html,
      metrics: result.metrics,
    });
  },
};