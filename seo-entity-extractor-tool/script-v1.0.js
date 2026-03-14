export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '86400');
      return new Response(null, { status: 204, headers });
    }

    // Entity Analyzer Endpoint
    if (pathname === '/entity-analyze' && request.method === 'POST') {
      try {
        const body = await request.json();
        const targetUrl = body.url;
        if (!targetUrl || typeof targetUrl !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid "url"' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const res = await fetch(targetUrl, {
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrafficTorch/1.0)' }
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        let content = await res.text();
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 3000);

        const ai = env.AI;
        if (!ai) throw new Error('AI binding not available');

        const extractPrompt = `
Extract named entities from this page content relevant to SEO, search engines, marketing, or the main topic. Include people, organizations, locations, products, technologies, concepts.

Rules:
- Return ONLY a valid JSON array of objects. No other text, no markdown, no code blocks.
- If no entities found, return empty array [].
- Format exactly:
[{"text": "Entity Name", "type": "PERSON|ORGANIZATION|LOCATION|PRODUCT|CONCEPT|OTHER", "salience": 0.0-1.0}]

Example:
[{"text": "Google", "type": "ORGANIZATION", "salience": 0.95}, {"text": "SEO", "type": "CONCEPT", "salience": 0.90}]

Page content:
${content}
        `;

        const extractOutput = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { prompt: extractPrompt });

        let extracted = [];
        try {
          let raw = (extractOutput.response || extractOutput || '').trim();
          raw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').replace(/^`+/, '').replace(/`+$/, '');
          extracted = JSON.parse(raw);
          extracted = Array.isArray(extracted) ? extracted : [];
          extracted = extracted
            .filter(e => e && e.text && e.type && typeof e.salience === 'number')
            .sort((a, b) => b.salience - a.salience);
        } catch (e) {
          console.error('Extraction parse failed:', e.message, 'Raw output:', (extractOutput.response || extractOutput || '').substring(0, 300));
          extracted = [];
        }

        let audit = {
          overall: extracted.length > 0 ? 50 + Math.min(50, extracted.length * 4) : 30,
          coverage: extracted.length > 5 ? 70 : extracted.length * 10,
          salience: extracted.length > 0 ? 60 : 30,
          relationships: 50,
          practices: 50,
          readiness: extracted.length > 0 ? "Fair" : "Poor",
          suggestions: extracted.length === 0
            ? ["No entities detected – page may be thin or JS-heavy. Try a text-rich URL like Wikipedia."]
            : ["Add more descriptive context and relationships for main entities.", "Use headings and early mentions to increase salience.", "Implement schema markup for key entities to boost practices score."]
        };

        return new Response(JSON.stringify({ extracted, audit }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        console.error('Entity analysis error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Simple proxy (?url=)
    const targetUrl = url.searchParams.get('url') || url.searchParams.get('_url');
    if (!targetUrl) {
      return new Response('Missing ?url=', { status: 400 });
    }
    try {
      const res = await fetch(targetUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrafficTorch/1.0)' }
      });
      const headers = new Headers(res.headers);
      headers.set('Content-Type', res.headers.get('content-type') || 'text/html;charset=utf-8');
      return new Response(res.body, {
        status: res.status,
        headers: { ...Object.fromEntries(headers), 'Access-Control-Allow-Origin': '*' }
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 503 });
    }
  }
};