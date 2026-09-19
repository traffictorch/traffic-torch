// nusa-patch — prose fix + live-runnable patchScript
// Model: Llama 4 Scout (instruct, no reasoning leak)

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

const SYSTEM = `You output ONLY valid JSON. No markdown fences. No commentary.

Schema:
{
  "applicable": boolean,
  "prose": string,
  "patchScript": string | null,
  "reason": string | null
}

"prose" — numbered fix, 3-6 steps, separated by literal \\n. Terse, direct. No emoji, no intro, no greeting. MUST contain at least 3 numbered steps.

"patchScript" — a self-contained JS string, a single IIFE: "(() => { ... })();"
  • Side effects only. Idempotent. No network, no storage, no window.location.
  • DOM-patchable: missing alt, missing/duplicate H1, title too long, missing meta description, missing author meta, missing publish date meta, missing viewport, missing JSON-LD, missing lang, missing canonical, missing og tags.
  • NOT DOM-patchable → patchScript null, applicable false, fill reason.
  • Not DOM-patchable: llms.txt, robots.txt, HTTP headers, HTTPS, render-blocking resources, TTFB, CLS from third-party JS, font loading, DNS, redirects.

Example (author byline):
{"applicable":true,"prose":"1. Open the homepage template.\\n2. Add a visible byline above the H1.\\n3. Link the name with rel=\\"author\\".\\n4. Add a matching author page at /about/.","patchScript":"(() => { if (document.querySelector('meta[name=\\"author\\"]')) return; const m = document.createElement('meta'); m.name = 'author'; m.content = 'Author Name'; document.head.appendChild(m); })();","reason":null}

Example (llms.txt):
{"applicable":false,"prose":"1. Create /llms.txt at the site root.\\n2. Add a # title line, a summary paragraph, and a Markdown link list.\\n3. Deploy with Content-Type: text/plain.\\n4. Confirm it is not blocked by robots.txt.","patchScript":null,"reason":"requires server-side change"}

Return the JSON object only.`;

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

    const { finding, cms, url, pageTitle } = body;
    if (!finding || !finding.label) return json({ error: 'finding.label required' }, 400, cors);

    const userMsg = `FINDING
category: ${finding.cat || 'unknown'}
label:    ${finding.label}
node:     ${finding.node || 'n/a'}
severity: ${finding.severity || 'n/a'}

CONTEXT
url:       ${url || 'n/a'}
pageTitle: ${pageTitle || 'n/a'}
cms:       ${cms?.name || 'Custom / Unknown'}${cms?.version ? ' ' + cms.version : ''}

Return the JSON object now.`;

    let raw = '';
    try {
      const aiRes = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 1400,
        temperature: 0.15,
        response_format: { type: 'json_object' }
      });
      raw = unwrap(aiRes);
    } catch (e) {
      return json({ success: false, error: 'AI call failed: ' + e.message, model: MODEL }, 500, cors);
    }

    const parsed = extractJson(raw);
    if (!parsed) {
      return json({
        success: false, error: 'Model returned non-JSON', model: MODEL,
        rawType: typeof raw, rawHead: String(raw).slice(0, 600), rawLen: String(raw).length
      }, 502, cors);
    }

    if (parsed.patchScript != null && typeof parsed.patchScript !== 'string') {
      parsed.patchScript = null;
      parsed.applicable = false;
      parsed.reason = parsed.reason || 'model returned non-string patchScript';
    }

    let prose = String(parsed.prose || '').trim();

    // guard: if prose is missing numbered content, do not pretend it succeeded
    const hasSteps = /\d+\./.test(prose) && prose.replace(/\s/g,'').length > 30;
    if (!hasSteps) {
      prose = prose || '(no prose returned by model — try again)';
    }

    return json({
      success: true,
      applicable: !!parsed.applicable,
      prose,
      patchScript: parsed.patchScript || null,
      reason: parsed.reason || null,
      model: MODEL
    }, 200, cors);
  }
};

function unwrap(aiRes) {
  if (aiRes == null) return '';
  let r = aiRes;
  if (typeof r === 'object' && 'response' in r) r = r.response;
  else if (typeof r === 'object' && 'result' in r) r = r.result;
  if (typeof r === 'string') return r;
  if (typeof r === 'object') { try { return JSON.stringify(r); } catch { return ''; } }
  return String(r);
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}

function extractJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(s); } catch {}
  const first = s.indexOf('{'); const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const slice = s.slice(first, last + 1);
    try { return JSON.parse(slice); } catch {}
    const repaired = slice.replace(/[\u0000-\u001F]+/g, m => (m === '\n' || m === '\r') ? '\\n' : '');
    try { return JSON.parse(repaired); } catch {}
  }
  return null;
}
