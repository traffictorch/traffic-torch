// keyword-semantic-audit.worker.js
// Hybrid semantic audit layer for Traffic Torch Keyword Tool.
// GLM-4.7-Flash with enable_thinking:false + retry on garbled response.

const ALLOWED_ORIGINS = [
  'https://traffictorch.net',
  'https://www.traffictorch.net',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500'
];

const MODEL = '@cf/zai-org/glm-4.7-flash';
const CACHE_TTL_SECONDS = 604800;

const SYSTEM_PROMPT = `You are an expert SEO auditor in 2026. You evaluate pages for search-intent alignment, semantic/entity coverage, AEO answerability, and E-E-A-T signals. You never judge keyword density. You never recommend keyword stuffing. You output ONLY valid JSON. No prose. No markdown. No explanation.`;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowOrigin = '*';
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON body' }, 400, cors); }

    const {
      targetKeyword, pageExcerpt, url, pageTitle, metaDescription, h1,
      cms, wordCount, headingTexts, imageAlts, schemaTypes, forceRefresh = false
    } = body;

    if (!targetKeyword || typeof targetKeyword !== 'string' || targetKeyword.trim().length < 2) {
      return json({ error: 'Missing or too-short targetKeyword' }, 400, cors);
    }
    if (!pageExcerpt || typeof pageExcerpt !== 'string' || pageExcerpt.trim().length < 50) {
      return json({ error: 'pageExcerpt too short to audit' }, 400, cors);
    }

    const cacheKey = await sha256(JSON.stringify({
      keyword: targetKeyword.toLowerCase().trim(),
      url: url || '', title: pageTitle || '', meta: metaDescription || '',
      h1: h1 || '', cms: cms || '', words: wordCount || 0,
      headings: Array.isArray(headingTexts) ? headingTexts : [],
      alts: Array.isArray(imageAlts) ? imageAlts : [],
      schema: Array.isArray(schemaTypes) ? schemaTypes : [],
      body: pageExcerpt.slice(0, 3500)
    }));

    if (env.SEMANTIC_CACHE && !forceRefresh) {
      try {
        const cached = await env.SEMANTIC_CACHE.get(cacheKey, 'json');
        if (cached && typeof cached.overallScore === 'number') {
          return json({ ...cached, cached: true }, 200, cors);
        }
      } catch {}
    }

    const userPrompt = buildPrompt({
      targetKeyword: targetKeyword.trim(),
      pageExcerpt: pageExcerpt.slice(0, 3500),
      url, pageTitle, metaDescription, h1, cms, wordCount,
      headingTexts: Array.isArray(headingTexts) ? headingTexts.slice(0, 20) : [],
      imageAlts: Array.isArray(imageAlts) ? imageAlts.slice(0, 15) : [],
      schemaTypes: Array.isArray(schemaTypes) ? schemaTypes.slice(0, 10) : []
    });

    // ── Retry loop: up to 2 attempts ─────────────────────
    let parsed = null;
    let lastRaw = '';
    let lastErr = null;

    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      try {
        const ai = await env.AI.run(MODEL, {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 3000,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          chat_template_kwargs: { enable_thinking: false }
        });

        const raw =
          (typeof ai?.response === 'string' && ai.response.trim()) ||
          (ai?.choices?.[0]?.message?.content && String(ai.choices[0].message.content).trim()) ||
          (ai?.choices?.[0]?.text && String(ai.choices[0].text).trim()) ||
          '';

        if (raw) {
          lastRaw = raw;
          parsed = extractJson(raw);
        }
      } catch (err) {
        lastErr = err;
      }
    }

    if (!parsed) {
      return json({
        error: 'Unparseable AI response after retry',
        raw: String(lastRaw).slice(0, 600),
        lastErr: lastErr ? String(lastErr).slice(0, 200) : null
      }, 502, cors);
    }

    const result = normalize(parsed);

    if (env.SEMANTIC_CACHE) {
      ctx.waitUntil(
        env.SEMANTIC_CACHE.put(cacheKey, JSON.stringify(result), {
          expirationTtl: CACHE_TTL_SECONDS
        })
      );
    }

    return json({ ...result, cached: false }, 200, cors);
  }
};

function buildPrompt(d) {
  return `Audit this page against the target keyword.

TARGET KEYWORD: ${d.targetKeyword}
URL: ${d.url || '(pasted HTML)'}
PAGE TITLE: ${d.pageTitle || '(none)'}
META DESCRIPTION: ${d.metaDescription || '(none)'}
H1: ${d.h1 || '(none)'}
CMS: ${d.cms || 'Unknown'}
WORD COUNT: ${d.wordCount || 0}

H1-H3 HEADINGS:
${d.headingTexts.length ? d.headingTexts.map(h => '- ' + h).join('\n') : '(none)'}

IMAGE ALTS:
${d.imageAlts.length ? d.imageAlts.map(a => '- ' + a).join('\n') : '(none)'}

SCHEMA TYPES DETECTED: ${d.schemaTypes.length ? d.schemaTypes.join(', ') : '(none)'}

CONTENT EXCERPT (first 3500 chars):
"""
${d.pageExcerpt}
"""

Return ONLY this exact JSON structure:
{
  "intent": {
    "predicted": "informational",
    "pageMatchesIntent": true,
    "reason": "one short sentence"
  },
  "entities": {
    "expected": ["5 to 10 entities a top-ranking page would cover"],
    "present": ["which of those appear on this page"],
    "missing": ["which do not"],
    "coverageScore": 0
  },
  "questions": {
    "expected": ["3 to 5 questions this page should answer"],
    "answered": ["which are answered"],
    "unanswered": ["which are not"]
  },
  "aeoAnswerability": 0,
  "eeat": {
    "authorSignals": 0,
    "citationSignals": 0,
    "experienceSignals": 0,
    "trustSignals": 0,
    "notes": "one short sentence"
  },
  "semanticCoverage": {
    "score": 0,
    "summary": "one sentence"
  },
  "topGaps": ["up to 3 short, actionable gaps"],
  "overallScore": 0
}

Rules:
- intent.predicted must be one of: informational, commercial, transactional, navigational.
- All numeric fields are integers 0-100.
- overallScore = intent 25% + entity coverage 30% + AEO answerability 20% + E-E-A-T average 25%.
- Never mention keyword density, keyword count or exact-match requirements.
- Do not invent facts about the page that are not visible in the excerpt.
- Keep every string under 240 characters.`;
}

function extractJson(text) {
  if (!text) return null;
  const str = String(text);
  const fenced = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : str;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = candidate.slice(start, end + 1);
  try { return JSON.parse(slice); }
  catch {
    try { return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1')); }
    catch { return null; }
  }
}

function normalize(p) {
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const strArr = (a, max) => Array.isArray(a)
    ? a.filter(x => typeof x === 'string' && x.trim()).slice(0, max).map(s => String(s).slice(0, 220))
    : [];
  const intentRaw = String(p?.intent?.predicted || 'informational').toLowerCase();
  const allowedIntent = ['informational', 'commercial', 'transactional', 'navigational'];
  const predicted = allowedIntent.includes(intentRaw) ? intentRaw : 'informational';

  return {
    intent: {
      predicted,
      pageMatchesIntent: !!p?.intent?.pageMatchesIntent,
      reason: String(p?.intent?.reason || '').slice(0, 240)
    },
    entities: {
      expected: strArr(p?.entities?.expected, 10),
      present: strArr(p?.entities?.present, 10),
      missing: strArr(p?.entities?.missing, 10),
      coverageScore: clamp(p?.entities?.coverageScore)
    },
    questions: {
      expected: strArr(p?.questions?.expected, 5),
      answered: strArr(p?.questions?.answered, 5),
      unanswered: strArr(p?.questions?.unanswered, 5)
    },
    aeoAnswerability: clamp(p?.aeoAnswerability),
    eeat: {
      authorSignals: clamp(p?.eeat?.authorSignals),
      citationSignals: clamp(p?.eeat?.citationSignals),
      experienceSignals: clamp(p?.eeat?.experienceSignals),
      trustSignals: clamp(p?.eeat?.trustSignals),
      notes: String(p?.eeat?.notes || '').slice(0, 240)
    },
    semanticCoverage: {
      score: clamp(p?.semanticCoverage?.score),
      summary: String(p?.semanticCoverage?.summary || '').slice(0, 300)
    },
    topGaps: strArr(p?.topGaps, 3),
    overallScore: clamp(p?.overallScore),
    model: MODEL,
    generatedAt: new Date().toISOString()
  };
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
