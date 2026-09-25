// nusa-ask — merged v2
// Rich audit context + format rules + markdown post-processing + model fallback.

const MODELS = [
  '@cf/openai/gpt-oss-20b',
  '@cf/deepseek-ai/deepseek-v4-flash-0731',
  '@cf/qwen/qwen3.8-27b',
  '@cf/meta/llama-4-scout-17b-16e-instruct'
];

const SYSTEM = `You are NUSA — a blunt, precise web-audit consultant.

INPUT
You receive a specific page audit that includes: page URL, title, CMS, scores, ALL findings (fail/warn/pass), affected HTML snippets, and module metrics.

RULES
- Answer questions about this specific audit using ONLY the audit data provided.
- Reference real values by name and number. Say "your page has 106 links" not "consider reducing links".
- When asked about a specific finding, reference the matching snippet verbatim. Do not invent markup that is not in the snippets.
- If auditData.cms.name is "Custom / Unknown", give code-level or hosting-level advice only. Never say "if you're using WordPress" or name a CMS you can't confirm.
- If auditData.cms.name is a known platform, give instructions for that platform's real admin UI. Never hedge.
- Never use placeholder values like "example.com", "Your Name", "image.jpg". Use realistic paths based on the page's existing structure, or describe what to add instead.
- If the data does not contain the answer, say so in one line and stop. Do not invent.

FORMAT
- Keep answers under 200 words unless the user explicitly asks for detail.
- Default to plain text. No markdown headings, no bold or italic markers.
- Every code fix, property, tag, or config goes in a fenced code block with a language tag.
- Structure multi-step fixes with numbers: "1. 2. 3."
- Use hyphens for sub-points under a numbered fix.
- No greeting. No sign-off. No filler. Australian bluntness welcome.`;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400, cors);
    }

    const { question, auditData = {} } = body;
    if (!question) return json({ error: 'question required' }, 400, cors);

    const contextBlock = buildContext(auditData);
    const userMsg = `${contextBlock}\n\nQUESTION\n${question}`;

    let lastError = null;
    for (const model of MODELS) {
      try {
        const aiRes = await Promise.race([
          env.AI.run(model, {
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: userMsg }
            ],
            max_tokens: 2000,
            temperature: 0.3
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
        ]);

        let answer = unwrap(aiRes);
        if (!answer) {
          lastError = new Error(`${model} returned empty`);
          continue;
        }

        answer = stripMarkdown(answer);
        return json({ success: true, answer, model }, 200, cors);
      } catch (e) {
        lastError = e;
        console.warn(`model ${model} failed:`, e.message);
      }
    }

    return json({ success: false, error: 'All models unavailable', details: lastError?.message }, 503, cors);
  }
};

function buildContext(auditData) {
  return [
    'AUDIT CONTEXT',
    `url: ${auditData.url || 'n/a'}`,
    `pageTitle: ${auditData.pageTitle || 'n/a'}`,
    auditData.cms
      ? `cms: ${auditData.cms.name || 'Unknown'}${auditData.cms.version ? ' ' + auditData.cms.version : ''}`
      : '',
    auditData.scores ? `scores: ${JSON.stringify(auditData.scores)}` : '',

    Array.isArray(auditData.findings) && auditData.findings.length
      ? 'ALL FINDINGS:\n' +
        auditData.findings.map(f => `  [${f.cat}][${f.status}] ${f.label}`).join('\n')
      : '',

    auditData.snippets && Object.keys(auditData.snippets).length
      ? 'AFFECTED HTML SNIPPETS:\n' +
        Object.entries(auditData.snippets)
          .map(([label, arr]) => `  ▼ ${label}\n` + arr.map(s => `    ${s}`).join('\n'))
          .join('\n')
      : '',

    auditData.metrics
      ? 'MODULE METRICS:\n' +
        ['ux', 'seo', 'aeo']
          .map(cat => {
            const mods = auditData.metrics[cat] || [];
            if (!mods.length) return '';
            return (
              `  ${cat.toUpperCase()}:\n` +
              mods
                .map(m =>
                  `    ${m.name} (${m.score}): ` +
                  (m.details && typeof m.details === 'object'
                    ? Object.entries(m.details)
                        .slice(0, 6)
                        .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 80)}`)
                        .join(' · ')
                    : JSON.stringify(m.details || '').slice(0, 200))
                )
                .join('\n')
            );
          })
          .filter(Boolean)
          .join('\n')
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

function unwrap(aiRes) {
  if (aiRes == null) return '';
  let r = aiRes;

  // Legacy shapes
  if (typeof r === 'object' && 'response' in r) r = r.response;
  else if (typeof r === 'object' && 'result' in r) r = r.result;

  // OpenAI chat completion shape
  if (typeof r === 'object' && Array.isArray(r.choices) && r.choices.length) {
    const c = r.choices[0];
    if (c?.message?.content) r = c.message.content;
    else if (c?.delta?.content) r = c.delta.content;
    else if (typeof c?.text === 'string') r = c.text;
  }

  if (typeof r === 'string') return r;
  if (typeof r === 'object') {
    try {
      return JSON.stringify(r);
    } catch {
      return '';
    }
  }
  return String(r);
}

function stripMarkdown(answer) {
  if (!answer) return '';

  // Protect fenced code blocks with placeholders
  const blocks = [];
  let out = answer.replace(/```[\s\S]*?```/g, m => {
    blocks.push(m);
    return `\u0000BLOCK${blocks.length - 1}\u0000`;
  });

  out = out
    .replace(/^#{1,6}\s+/gm, '')                        // # headings
    .replace(/\*\*(.*?)\*\*/g, '$1')                    // **bold**
    .replace(/__(.*?)__/g, '$1')                        // __bold__
    .replace(/(^|[^*])\*(?!\s)(.*?)(?<!\s)\*/g, '$1$2') // *italic*
    .replace(/(^|[^_])_(?!\s)(.*?)(?<!\s)_/g, '$1$2')   // _italic_
    .replace(/`([^`]+)`/g, '$1')                        // `inline code`
    .replace(/^\s*[-*+]\s+/gm, '- ')                    // normalize bullets
    .replace(/\n{3,}/g, '\n\n')                         // collapse blank lines
    .trim();

  // Restore fenced code blocks
  out = out.replace(/\u0000BLOCK(\d+)\u0000/g, (_, i) => blocks[+i]);
  return out;
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}