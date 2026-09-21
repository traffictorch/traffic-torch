// nusa-render v6 — screenshot + highlight selectors + size filters

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
      filters = []
    } = body;
    if (!url) return json({ error: 'url required' }, 400, cors);

    try {
      const out = await renderOnce(url, env, { screenshot, highlightSelectors, filters });
      return json({ success: true, ...out }, 200, cors);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, cors);
    }
  }
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });
}

async function renderOnce(url, env, { screenshot, highlightSelectors, filters }) {
  const { default: puppeteer } = await import('@cloudflare/puppeteer');
  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 NUSA/0.6');

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => new Promise(r => {
    if (document.readyState === 'complete') return r();
    window.addEventListener('load', r, { once: true });
  }));
  const renderMs = Date.now() - t0;

  const html = await page.content();
  const finalUrl = page.url();
  const out = { html, finalUrl, renderMs };

  const safeSels = Array.isArray(highlightSelectors)
    ? highlightSelectors.filter(s => typeof s === 'string' && s).slice(0, 200)
    : [];
  const safeFilters = Array.isArray(filters)
    ? filters.filter(f => f && typeof f.selector === 'string' && f.selector).slice(0, 100)
    : [];

  if (safeSels.length || safeFilters.length) {
    out.highlights = await page.evaluate(collectHighlights, { selectors: safeSels, filters: safeFilters });
  }

  if (screenshot) {
    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      sh: document.documentElement.scrollHeight
    }));
    const clipH = Math.min(dims.sh, MAX_SHOT_HEIGHT);
    const base64 = await page.screenshot({
      type: 'jpeg',
      quality: 70,
      encoding: 'base64',
      clip: { x: 0, y: 0, width: dims.sw, height: clipH }
    });
    out.screenshot = { data: base64, mime: 'image/jpeg', w: dims.sw, h: clipH };
  }

  await browser.close();
  return out;
}

// Runs in the browser. Returns { [key]: [{x,y,w,h}, ...] }
//  - Raw selectors → key = selector string
//  - Filtered rules → key = `${selector}|${maxH}|${maxW}`
//    Only keeps elements where rect.w < maxW OR rect.h < maxH (too small).
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
