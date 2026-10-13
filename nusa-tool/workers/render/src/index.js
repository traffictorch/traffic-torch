// nusa-render v7 — screenshot + highlight selectors + size filters
// v7 changes:
//   1. Forces lazy-loaded images to actually load before the screenshot
//   2. deviceScaleFactor is now honoured from the request body (defaults to 2)
//   3. Screenshot width clamped to viewport — no more giant slivers on overflow pages

const MAX_SHOT_HEIGHT = 6000;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid JSON' }, 400, cors); }
    const {
      url,
      screenshot = false,
      highlightSelectors = [],
      filters = [],
      deviceScaleFactor = 2
    } = body;
    if (!url) return json({ error: 'url required' }, 400, cors);

    try {
      const out = await renderOnce(url, env, { screenshot, highlightSelectors, filters, deviceScaleFactor });
      return json({ success: true, ...out }, 200, cors);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, cors);
    }
  }
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });
}

async function renderOnce(url, env, { screenshot, highlightSelectors, filters, deviceScaleFactor }) {
  const { default: puppeteer } = await import('@cloudflare/puppeteer');

  // 1) HTML via plain fetch — no browser, works for every site
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NUSA/0.7)' } });
  const html = await res.text();
  const out = { html, finalUrl: res.url, renderMs: 0 };

  const safeSels = Array.isArray(highlightSelectors)
    ? highlightSelectors.filter(s => typeof s === 'string' && s).slice(0, 200) : [];
  const safeFilters = Array.isArray(filters)
    ? filters.filter(f => f && typeof f.selector === 'string' && f.selector).slice(0, 100) : [];

  if (!screenshot && !safeSels.length && !safeFilters.length) return out;

  // 2) Browser only for screenshot + highlights
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

    // Inject <base href> so relative URLs resolve against the origin
    const htmlWithBase = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + url + '">');

    const t0 = Date.now();

    // Use setContent — no navigation, no "Target closed" from goto timeout
    await page.setContent(htmlWithBase, { waitUntil: 'domcontentloaded', timeout: 5000 })
      .catch(function (e) { console.log('setContent timeout (ignored):', e.message); });

    // Give the browser time to fetch styles/images and hydrate
    await new Promise(function (r) { setTimeout(r, 4000); });

    out.renderMs = Date.now() - t0;

    await primeImages(page);

    if (safeSels.length || safeFilters.length) {
      out.highlights = await page.evaluate(collectHighlights, { selectors: safeSels, filters: safeFilters });
    }

    if (screenshot) {
      const dims = await page.evaluate(function () {
        return {
          sw: document.documentElement.scrollWidth,
          sh: document.documentElement.scrollHeight,
          vw: window.innerWidth
        };
      });
      const clipW = Math.min(dims.sw, dims.vw);
      const clipH = Math.min(dims.sh, MAX_SHOT_HEIGHT);
      await page.evaluate(function () { window.scrollTo(0, 0); });
      await new Promise(function (r) { setTimeout(r, 200); });

      const base64 = await page.screenshot({
        type: 'jpeg', quality: 70, encoding: 'base64',
        clip: { x: 0, y: 0, width: clipW, height: clipH }
      });
      out.screenshot = { data: base64, mime: 'image/jpeg', w: clipW, h: clipH };
    }

    return out;
  } finally {
    try { await browser.close(); } catch (_) {}
  }
}

async function primeImages(page) {
  // Step 0 — kill smooth scrolling so scrollTo() is synchronous
  await page.evaluate(function () {
    document.documentElement.style.scrollBehavior = 'auto';
  });
  
  // Step 1 — eager-ify + un-stick common lazy-load libs
  await page.evaluate(function () {
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.getAttribute('loading')) img.setAttribute('loading', 'eager');
      var real = img.getAttribute('data-src')
              || img.getAttribute('data-lazy-src')
              || img.getAttribute('data-original');
      if (real && img.getAttribute('src') !== real) img.setAttribute('src', real);
      var realSet = img.getAttribute('data-srcset');
      if (realSet && !img.getAttribute('srcset')) img.setAttribute('srcset', realSet);
    }
  });

  // Step 2 — scroll down the page so lazyload libraries fire
  await page.evaluate(async function () {
    var step = window.innerHeight || 800;
    var total = document.documentElement.scrollHeight;
    for (var y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise(function (r) { setTimeout(r, 120); });
    }
    window.scrollTo(0, 0);
    await new Promise(function (r) {
      function check() { window.scrollY === 0 ? r() : requestAnimationFrame(check); }
      check();
    });
  });

  // Step 3 — wait for each image to load (or error), 5s cap per image
  await page.evaluate(async function () {
    var imgs = Array.prototype.slice.call(document.images);
    var waits = imgs.map(function (img) {
      return new Promise(function (resolve) {
        if (img.complete && img.naturalWidth > 0) { resolve(); return; }
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 5000);
      });
    });
    await Promise.all(waits);
  });

  // Step 4 — let layout settle (srcset swaps, fade-ins, etc.)
  await new Promise(function (r) { setTimeout(r, 300); });
}

function collectHighlights({ selectors, filters }) {
  const bboxOf = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height)
    };
  };
  const visible = (b) => b.w > 0 && b.h > 0;
  const out = {};

  for (const sel of selectors) {
    try {
      const matches = Array.from(document.querySelectorAll(sel))
        .map(bboxOf)
        .filter(visible)
        .slice(0, 20);
      out[sel] = matches;
    } catch (_) { out[sel] = []; }
  }

  for (const f of filters) {
    const key = `${f.selector}|${f.maxH || 0}|${f.maxW || 0}`;
    try {
      const all = Array.from(document.querySelectorAll(f.selector));
      const tooSmall = all
        .map(el => ({ el, b: bboxOf(el) }))
        .filter(({ b }) => visible(b))
        .filter(({ b }) =>
          (f.maxW && b.w < f.maxW) || (f.maxH && b.h < f.maxH)
        )
        .map(({ b }) => b)
        .slice(0, 20);
      out[key] = tooSmall;
    } catch (_) { out[key] = []; }
  }

  return out;
}