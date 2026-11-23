const ROAST_SYSTEM = `You are "The Roastmaster" — a brutally honest, hilarious, but fundamentally constructive critic (Simon Cowell energy, minus the cruelty). Your job is to roast the user's idea or website with sharp wit but end with genuinely useful advice.

RULES:
- CRITICAL: Your FIRST sentence must BE the punchy roast line itself. It will become the post title. Make it land.
- Do NOT open with a summary, a description of the page, or a section header like "Design Aesthetic:", "Overview:", "Summary:", "Core Pillars:", or "Target Use Cases:".
- Do NOT paraphrase or quote the website's own description back at the reader. Assume they already know what the page is.
- 2-3 short paragraphs of cutting but fair critique. Be specific — name exact weaknesses.
- Keep it funny, not mean. Punch at the idea/page, never the person.
- End with "🔧 3 things to fix:" followed by exactly 3 bullet points with concrete, actionable fixes. (This is the ONLY section header you may use.)
- No greeting. No "here's my roast". No meta-commentary. Just the roast.
- 
- CRITICAL: Output ONLY your critique. Do NOT paste the user's input text or the title at the start of your response. Start immediately with your roast/toast line. Do NOT write 'Traffic Torch AI:'.
- Use markdown (bold, bullets). Max 220 words.`;

const TOAST_SYSTEM = `You are "The Hypeman" — a genuinely enthusiastic, credible champion of the user's idea or website. You highlight real strengths and explain why they matter, then offer one actionable next-level nudge.

RULES:
- CRITICAL: Your FIRST sentence must BE the punchy hype line itself. It will become the post title. Make it specific and compelling.
- Do NOT open with a summary, a description of the page, or a section header like "Design Aesthetic:", "Overview:", "Summary:", "Core Pillars:", or "Target Use Cases:".
- Do NOT paraphrase or quote the website's own description back at the reader. Assume they already know what the page is.
- 2 short paragraphs naming 2-3 concrete strengths with reasons.
- One short paragraph: "🚀 Next level:" followed by ONE specific, achievable upgrade. (This is the ONLY section header you may use.)
- Keep it credible — no empty hype, no "revolutionary". Be specific.
- No greeting. No meta-commentary. Just the toast.
- 
- CRITICAL: Output ONLY your critique. Do NOT paste the user's input text or the title at the start of your response. Start immediately with your roast/toast line. Do NOT write 'Traffic Torch AI:'.
- Use markdown (bold, bullets). Max 180 words.`;

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function extractUrl(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)|(?:^|\s)((?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  const match = text.match(urlRegex);
  if (!match) return null;
  let url = match[1] || match[2];
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  try { new URL(url); return url; } catch { return null; }
}

async function scrapeOg(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrafficTorchBot/1.0; +https://traffictorch.net/)' },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    const html = (await res.text()).slice(0, 200000);
    const pick = (re) => { const m = html.match(re); return m ? m[1].trim().slice(0, 500) : null; };
    let title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
             || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
             || pick(/<title[^>]*>([^<]+)<\/title>/i);
    const description = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
             || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
             || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    let image = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
             || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const site_name = pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, url).href; } catch {}
    }
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    return { url, title, description, image, site_name, hostname, favicon };
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin') || '*';
    const cors = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST' || !new URL(request.url).pathname.endsWith('/api/roast-toast')) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404, headers: cors });
    }

    try {
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: cors });
      }

      const mode = body.mode === 'toast' ? 'toast' : 'roast';
      const rawInput = String(body.input || '').trim().slice(0, 2000);
      
      if (rawInput.length < 3) {
        return new Response(JSON.stringify({ ok: false, error: 'Give me at least a sentence or a URL.' }), { status: 400, headers: cors });
      }

      const extractedUrl = extractUrl(rawInput);
      let og = null;
      let userPrompt;

      if (extractedUrl) {
        og = await scrapeOg(extractedUrl);
        userPrompt = [
          `Original Input: ${rawInput}`,
          `---`,
          og ? `Website Data (from ${extractedUrl}):` : `URL detected: ${extractedUrl} (could not fetch metadata)`,
          og ? `Title: ${og.title || 'N/A'}` : '',
          og ? `Description: ${og.description || 'N/A'}` : '',
          '',
          `Task: ${mode === 'roast' ? 'Roast' : 'Toast'} this idea/website.`
        ].filter(Boolean).join('\n');
      } else {
        userPrompt = `Idea: ${rawInput}\n\n${mode === 'roast' ? 'Roast this idea.' : 'Toast this idea.'}`;
      }

      const systemPrompt = mode === 'roast' ? ROAST_SYSTEM : TOAST_SYSTEM;
      let assessment = '';
      try {
        const ai = await env.AI.run(MODEL, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: mode === 'roast' ? 700 : 550,
          temperature: mode === 'roast' ? 0.85 : 0.75
        });
        assessment = String(ai.response || '').trim();
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'AI inference failed: ' + (e.message || 'unknown'), model: MODEL }), { status: 503, headers: cors });
      }

      if (!assessment) {
        return new Response(JSON.stringify({ ok: false, error: 'AI returned empty response' }), { status: 500, headers: cors });
      }

      return new Response(JSON.stringify({
        ok: true,
        mode,
        input_type: extractedUrl ? 'url' : 'text',
        input: rawInput,
        og,
        assessment_md: assessment,
        model: MODEL
      }), { status: 200, headers: cors });

    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message || 'Roast/Toast failed' }), { status: 500, headers: cors });
    }
  }
};
