// nusa-ask — dedicated Ask + Citation Chamber backend for NUSA.
// POST { question, auditData }  → { success, answer }

const MODEL = '@cf/openai/gpt-oss-20b';

const SYSTEM = `You are NUSA — a blunt, precise web-audit consultant.
You answer questions about a specific page audit using ONLY the audit data provided.
No hedging. No filler. No greeting. No sign-off. Australian bluntness is welcome.
If the data does not contain the answer, say so in one line and stop.
Keep answers under 180 words unless the user explicitly asks for detail.
When suggesting fixes, number them 1. 2. 3. — no bullet symbols.`;

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
    const { question, auditData = {} } = body;
    if (!question) return json({ error: 'question required' }, 400, cors);

    const contextBlock = [
      'AUDIT CONTEXT',
      `url: ${auditData.url || 'n/a'}`,
      `pageTitle: ${auditData.pageTitle || 'n/a'}`,
      auditData.cms ? `cms: ${auditData.cms.name || 'Unknown'}${auditData.cms.version ? ' ' + auditData.cms.version : ''}` : '',
      auditData.scores ? `scores: ${JSON.stringify(auditData.scores)}` : '',
      Array.isArray(auditData.failedItems) && auditData.failedItems.length
        ? 'failed findings:\n' + auditData.failedItems.map(x => '  - ' + x).join('\n')
        : 'failed findings: none recorded',
      auditData.pageExcerpt ? `page excerpt: ${String(auditData.pageExcerpt).slice(0, 600)}` : ''
    ].filter(Boolean).join('\n');

    const userMsg = `${contextBlock}\n\nQUESTION\n${question}`;

    let raw = '';
    try {
      const aiRes = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 900,
        temperature: 0.3
      });
      raw = unwrap(aiRes);
    } catch (e) {
      return json({ success: false, error: 'AI call failed: ' + e.message, model: MODEL }, 500, cors);
    }

    return json({ success: true, answer: String(raw || '').trim(), model: MODEL }, 200, cors);
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
