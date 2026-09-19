// nusa-verify — Second Pass verifier
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid JSON' }, 400, cors); }
    const { url, patchScript, label } = body;
    if (!url) return json({ error: 'url required' }, 400, cors);

    try {
      const result = await runVerification(url, patchScript, label, env);
      return json({ success: true, ...result }, 200, cors);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, cors);
    }
  }
};

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

async function runVerification(url, patchScript, label, env) {
  const { default: puppeteer } = await import('@cloudflare/puppeteer');
  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 NUSA/0.1');

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => new Promise(r => {
    if (document.readyState === 'complete') return r();
    window.addEventListener('load', r, { once: true });
  }));

  const baseline = await captureMetrics(page);

  let patchApplied = false;
  let patchError = null;
  if (patchScript && typeof patchScript === 'string' && patchScript.trim()) {
    try {
      await page.evaluate(patchScript);
      patchApplied = true;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      patchError = e.message;
    }
  }

  const patched = await captureMetrics(page);
  await browser.close();

  return {
    url,
    label: label || null,
    patchApplied,
    patchError,
    baseline,
    patched,
    diff: computeDiff(baseline, patched)
  };
}

async function captureMetrics(page) {
  return await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let missingAlt = 0;
    imgs.forEach(i => { const a = i.getAttribute('alt'); if (a === null || a.trim() === '') missingAlt++; });

    const renderBlocking = document.querySelectorAll(
      'script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])'
    ).length;

    const h1s = document.querySelectorAll('h1').length;
    const title = document.title || '';
    const desc = document.querySelector('meta[name="description"]')?.content || '';
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
    const hasAuthor = !!document.querySelector('[rel="author"],[itemprop="author"],meta[name="author"],.author,.byline');
    const hasDate = !!document.querySelector('time[datetime],meta[property="article:published_time"],meta[property="article:modified_time"]');
    const hasViewport = !!(document.querySelector('meta[name="viewport"]')?.content || '').match(/width\s*=\s*device-width/i);

    return {
      titleLen: title.length,
      descLen: desc.length,
      h1s,
      missingAlt,
      totalImgs: imgs.length,
      totalLinks: document.querySelectorAll('a[href]').length,
      totalNodes: document.querySelectorAll('*').length,
      headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      renderBlocking,
      jsonLd,
      hasAuthor,
      hasDate,
      hasViewport,
      capturedAt: new Date().toISOString()
    };
  });
}

function computeDiff(a, b) {
  const keys = ['titleLen','descLen','h1s','missingAlt','renderBlocking','jsonLd','headings','totalNodes'];
  const deltas = {};
  for (const k of keys) {
    if (a[k] !== b[k]) deltas[k] = { before: a[k], after: b[k], delta: b[k] - a[k] };
  }
  const flags = {
    hasAuthor:   { before: a.hasAuthor, after: b.hasAuthor, changed: a.hasAuthor !== b.hasAuthor },
    hasDate:     { before: a.hasDate, after: b.hasDate, changed: a.hasDate !== b.hasDate },
    hasViewport: { before: a.hasViewport, after: b.hasViewport, changed: a.hasViewport !== b.hasViewport }
  };
  return { deltas, flags };
}
