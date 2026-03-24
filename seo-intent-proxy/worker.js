import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const urlParam = new URL(request.url).searchParams.get("url");
    if (!urlParam) {
      return new Response("?url= parameter is required", { status: 400 });
    }

    try {
      const browser = await puppeteer.launch(env.BROWSER_RENDERING);
      const page = await browser.newPage();

      await page.goto(urlParam, { 
        waitUntil: "networkidle2",
        timeout: 30000 
      });

      const html = await page.content();
      await browser.close();

      return new Response(html, {
        headers: { 
          "content-type": "text/html;charset=UTF-8",
          "x-rendered-by": "cloudflare-browser-rendering"
        },
      });
    } catch (err) {
      console.error("Browser render error:", err);
      return new Response("Render error: " + err.message, { status: 500 });
    }
  },
};