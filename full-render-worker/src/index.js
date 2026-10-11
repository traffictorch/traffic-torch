import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === 'OPTIONS') {
        return corsResponse(null, { status: 204 });
      }

      if (!env.browser) {
        return corsResponse(
          JSON.stringify({ error: 'Browser binding missing' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (request.method === 'POST') {
        const htmlContent = await request.text();
        if (!htmlContent || htmlContent.trim().length < 10) {
          return corsResponse('Empty or invalid HTML', { status: 400 });
        }
        const rendered = await renderPage(env, { html: htmlContent });
        return corsResponse(rendered, {
          status: 200,
          headers: { 'Content-Type': 'text/html;charset=utf-8', 'X-Source': 'direct-html' }
        });
      }

      const targetUrl = url.searchParams.get('url') || url.searchParams.get('_url');
      if (!targetUrl) {
        return corsResponse('Missing ?url= parameter', { status: 400 });
      }

      const rendered = await renderPage(env, { url: targetUrl });
      return corsResponse(rendered, {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'X-Source': 'live-url' }
      });

    } catch (err) {
      return corsResponse(`Worker error: ${err.message}`, { status: 503 });
    }
  }
};

async function renderPage(env, payload) {
  // LAUNCH the browser using puppeteer
  const browser = await puppeteer.launch(env.browser);
  const page = await browser.newPage();

  try {
    if (payload.url) {
      await page.goto(payload.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } else if (payload.html) {
      await page.setContent(payload.html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } else {
      throw new Error('No URL or HTML provided');
    }

    await page.waitForTimeout(3000);

    await page.waitForSelector('script[type="application/ld+json"]', {
      timeout: 5000,
    }).catch(() => {});

    const content = await page.content();
    return content;

  } finally {
    await page.close();
    await browser.close();
  }
}

function corsResponse(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');
  headers.set('Access-Control-Expose-Headers', '*');
  return new Response(body, { ...init, headers });
}