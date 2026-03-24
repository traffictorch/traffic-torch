import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url || !url.startsWith("http")) {
      return new Response("❌ Add ?url=https://example.com", { status: 400 });
    }

    try {
      const browser = await puppeteer.launch(env.MYBROWSER);
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

      await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });

      const html = await page.content();
      await browser.close();

      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "X-Traffic-Torch-Proxy": "browser-rendering-success"
        }
      });
    } catch (e) {
      return new Response("Browser Rendering Error: " + e.message, { 
        status: 500, 
        headers: { "content-type": "text/plain" } 
      });
    }
  }
};
