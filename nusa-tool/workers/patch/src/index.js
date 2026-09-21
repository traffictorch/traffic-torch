// nusa-patch v2 — gpt-oss-20b + affected HTML context

const MODEL = '@cf/openai/gpt-oss-20b';

const SYSTEM = `You output ONLY valid JSON. No markdown fences. No commentary.

Schema:
{
  "applicable": boolean,
  "prose": string,
  "patchScript": string | null,
  "reason": string | null
}

"prose" — numbered fix steps. 2-6 steps. Terse. Specific. Reference ACTUAL values you see in the affected HTML (colors, selectors, attribute names, lengths). Never say "use a tool" or "check with an analyzer" — compute the answer yourself from what is provided.

"patchScript" — a self-contained JS string, single IIFE: "(() => { ... })();"
  • Side effects only. Idempotent. No network, storage, or window.location.
  • DOM-patchable: missing alt, H1, title length, meta description, meta tags, viewport, JSON-LD, lang, canonical, og, FAQPage schema.
  • NOT DOM-patchable → null, applicable false, fill reason.
  • Not DOM-patchable: llms.txt, robots.txt, HTTP headers, HTTPS, render-blocking resources, TTFB, CLS from third-party JS, font loading, DNS, redirects.

When the finding is about COLOR CONTRAST, you MUST state the actual failing colors and the WCAG-compliant replacement. Read them from affectedHtml inline styles. If not present, say so explicitly in prose step 1.

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
    const { finding, cms, url, pageTitle, affectedHtml } = body;
    if (!finding || !finding.label) return json({ error: 'finding.label required' }, 400, cors);

    const userMsg = buildUserMessage({ finding, cms, url, pageTitle, affectedHtml });

    let raw = '';
    try {
      const aiRes = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 1800,
        temperature: 0.15,
        response_format: { type: 'json_object' }
      });
      raw = unwrap(aiRes);
    } catch (e) {
      return json({ success: false, error: 'AI call failed: ' + e.message, model: MODEL }, 500, cors);
    }

    const parsed = extractJson(raw);
    if (!parsed) {
      return json({ success: false, error: 'non-JSON', model: MODEL, rawHead: String(raw).slice(0, 400) }, 502, cors);
    }

    let prose = String(parsed.prose || '').trim();
    if (!/have an ePic day/i.test(prose)) {
      prose = prose.replace(/\s+$/, '') + '\n\nAfter changes: have an ePic day (or night).';
    }

    if (parsed.patchScript != null && typeof parsed.patchScript !== 'string') {
      parsed.patchScript = null;
      parsed.applicable = false;
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

function buildUserMessage({ finding, cms, url, pageTitle, affectedHtml }) {
  const lines = [
    'FINDING',
    `category: ${finding.cat || 'unknown'}`,
    `label:    ${finding.label}`,
    `node:     ${finding.node || 'n/a'}`,
    `severity: ${finding.severity || 'n/a'}`,
    '',
    'CONTEXT',
    `url:       ${url || 'n/a'}`,
    `pageTitle: ${pageTitle || 'n/a'}`,
    `cms:       ${cms?.name || 'Custom / Unknown'}${cms?.version ? ' ' + cms.version : ''}`
  ];
  if (affectedHtml) {
    lines.push('', 'AFFECTED HTML (the actual failing element from the rendered page):', '```html');
    lines.push(String(affectedHtml).slice(0, 2000));
    lines.push('```');
  } else {
    lines.push('', 'AFFECTED HTML: not available (server-side or structural finding).');
  }
  lines.push('', 'Return the JSON object now.');
  return lines.join('\n');
}

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
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });
}

function extractJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(s); } catch {}
  const first = s.indexOf('{'); const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const slice = s.slice(first, last + 1);
    try { return JSON.parse(slice); } catch {}
  }
  return null;
}
