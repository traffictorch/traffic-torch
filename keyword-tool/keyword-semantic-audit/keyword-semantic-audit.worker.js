// keyword-semantic-audit.worker.js
// Hybrid semantic worker for Traffic Torch Keyword Tool.
// Two modes:
//   - full (default): existing page-level semantic audit
//   - semantic-variations: per-placement relevance classification
// GLM-4.7-Flash, enable_thinking:false, JSON mode, retry on garbled output.

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

const VARIATIONS_SYSTEM_PROMPT = `You are an SEO placement relevance classifier. You judge whether each placement string matches a target keyword as exact, variant, partial, or absent. You output ONLY valid JSON. No prose. No markdown. No explanation.`;

/* ── Per-placement weights for the Semantic Coverage score ── */
const VERDICT_POINTS = { exact: 100, variant: 80, partial: 30, absent: 0 };
const PLACEMENT_WEIGHTS = {
  title: 3,
  metaDescription: 2,
  h1: 3,
  urlSlug: 2,
  h2: 1,
  imageAlt: 0.5,
  internalAnchor: 0.5
};

export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON body' }, 400, cors); }

    if (body.mode === 'semantic-variations') {
      return handleSemanticVariations(env, ctx, body, cors);
    }
    return handleFullSemanticAudit(env, ctx, body, cors);
  }
};

/* ════════════════════════════════════════════════════════════════
   MODE 1 — Full page semantic audit (existing behaviour)
   ════════════════════════════════════════════════════════════════ */
async function handleFullSemanticAudit(env, ctx, body, cors) {
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

  const cacheKey = 'full::' + await sha256(JSON.stringify({
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

  const userPrompt = buildFullPrompt({
    targetKeyword: targetKeyword.trim(),
    pageExcerpt: pageExcerpt.slice(0, 3500),
    url, pageTitle, metaDescription, h1, cms, wordCount,
    headingTexts: Array.isArray(headingTexts) ? headingTexts.slice(0, 20) : [],
    imageAlts: Array.isArray(imageAlts) ? imageAlts.slice(0, 15) : [],
    schemaTypes: Array.isArray(schemaTypes) ? schemaTypes.slice(0, 10) : []
  });

  const parsed = await runAIWithRetry(env, SYSTEM_PROMPT, userPrompt, 3000);
  if (parsed.error) return json(parsed, 502, cors);

  const result = normalizeFullAudit(parsed.data);

  if (env.SEMANTIC_CACHE) {
    ctx.waitUntil(env.SEMANTIC_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL_SECONDS
    }));
  }

  return json({ ...result, cached: false }, 200, cors);
}

/* ════════════════════════════════════════════════════════════════
   MODE 2 — Semantic variations (per-placement relevance)
   ════════════════════════════════════════════════════════════════ */
async function handleSemanticVariations(env, ctx, body, cors) {
  const { targetKeyword, placements, forceRefresh = false } = body;

  if (!targetKeyword || typeof targetKeyword !== 'string' || targetKeyword.trim().length < 2) {
    return json({ error: 'Missing or too-short targetKeyword' }, 400, cors);
  }
  if (!placements || typeof placements !== 'object') {
    return json({ error: 'Missing placements object' }, 400, cors);
  }

  const p = {
    title: String(placements.title || ''),
    metaDescription: String(placements.metaDescription || ''),
    h1: String(placements.h1 || ''),
    h2s: Array.isArray(placements.h2s) ? placements.h2s.slice(0, 5).map(String) : [],
    imageAlts: Array.isArray(placements.imageAlts) ? placements.imageAlts.slice(0, 5).map(String) : [],
    internalAnchors: Array.isArray(placements.internalAnchors) ? placements.internalAnchors.slice(0, 5).map(String) : [],
    urlSlug: String(placements.urlSlug || '')
  };

  const cacheKey = 'sv3::' + await sha256(JSON.stringify({
    keyword: targetKeyword.toLowerCase().trim(),
    placements: p
  }));

  if (env.SEMANTIC_CACHE && !forceRefresh) {
    try {
      const cached = await env.SEMANTIC_CACHE.get(cacheKey, 'json');
      if (cached && typeof cached.overallScore === 'number') {
        return json({ ...cached, cached: true }, 200, cors);
      }
    } catch {}
  }

  const userPrompt = buildVariationsPrompt({ targetKeyword: targetKeyword.trim(), placements: p });

  const parsed = await runAIWithRetry(env, VARIATIONS_SYSTEM_PROMPT, userPrompt, 2500, 0.25);
  if (parsed.error) return json(parsed, 502, cors);

  const result = normalizeVariations(parsed.data, p);

  if (env.SEMANTIC_CACHE) {
    ctx.waitUntil(env.SEMANTIC_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL_SECONDS
    }));
  }

  return json({ ...result, cached: false }, 200, cors);
}

/* ════════════════════════════════════════════════════════════════
   Shared AI runner
   ════════════════════════════════════════════════════════════════ */
async function runAIWithRetry(env, systemPrompt, userPrompt, maxTokens, temperature = 0.1) {
  let parsed = null;
  let lastRaw = '';
  let lastErr = null;

  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      const ai = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: maxTokens,
        temperature,
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
    return {
      error: 'Unparseable AI response after retry',
      raw: String(lastRaw).slice(0, 600),
      lastErr: lastErr ? String(lastErr).slice(0, 200) : null
    };
  }

  return { data: parsed };
}

/* ════════════════════════════════════════════════════════════════
   Prompts
   ════════════════════════════════════════════════════════════════ */
function buildFullPrompt(d) {
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
  "intent": { "predicted": "informational", "pageMatchesIntent": true, "reason": "one short sentence" },
  "entities": { "expected": [], "present": [], "missing": [], "coverageScore": 0 },
  "questions": { "expected": [], "answered": [], "unanswered": [] },
  "aeoAnswerability": 0,
  "eeat": { "authorSignals": 0, "citationSignals": 0, "experienceSignals": 0, "trustSignals": 0, "notes": "" },
  "semanticCoverage": { "score": 0, "summary": "" },
  "topGaps": [],
  "overallScore": 0
}

Rules:
- intent.predicted must be one of: informational, commercial, transactional, navigational.
- All numeric fields are integers 0-100.
- overallScore = intent 25% + entity coverage 30% + AEO answerability 20% + E-E-A-T average 25%.
- Never mention keyword density, keyword count or exact-match requirements.
- Keep every string under 240 characters.`;
}

function buildVariationsPrompt(d) {
  const lines = [];
  lines.push(`You are classifying whether each placement on a page matches the INTENT and TOPIC of a target keyword.`);
  lines.push(`You are NOT looking for exact string matches only — you are judging whether the placement expresses the same service, topic, or intent, even with different words.`);
  lines.push('');
  lines.push(`TARGET KEYWORD: "${d.targetKeyword}"`);
  lines.push('');
  lines.push('Classify each placement as ONE of:');
  lines.push('');
  lines.push('- "exact": the keyword appears verbatim (case-insensitive, ignoring punctuation).');
  lines.push('- "variant": different words, SAME service/topic/intent. Use this whenever the placement expresses the same underlying offer, even if the wording is different.');
  lines.push('- "partial": some word overlap or an adjacent concept, but the placement does NOT express the same service/topic.');
  lines.push('- "absent": no meaningful connection to the keyword at all.');
  lines.push('');
  lines.push('Worked examples across different industries — study these before classifying:');
  lines.push('');
  lines.push('  Keyword: "plumber sydney"');
  lines.push('    "Syd Plumbing Services"       → variant (same service, different words)');
  lines.push('    "Emergency Pipe Repairs NSW"  → variant (related plumbing service)');
  lines.push('    "Sydney"                       → partial (location only, no service)');
  lines.push('    "Contact Us"                   → absent (no relation)');
  lines.push('');
  lines.push('  Keyword: "vegan cafe melbourne"');
  lines.push('    "Plant-Based Eatery Melbourne" → variant (same topic, different words)');
  lines.push('    "Breakfast & Brunch Menu"      → variant (same food-service category)');
  lines.push('    "Melbourne CBD"                → partial (location only)');
  lines.push('    "Home"                         → absent (no relation)');
  lines.push('');
  lines.push('  Keyword: "yoga classes london"');
  lines.push('    "Vinyasa & Hatha Studio London" → variant (specific yoga disciplines, same service)');
  lines.push('    "Mindfulness & Breathwork"      → variant (adjacent wellness service)');
  lines.push('    "Our Teachers"                  → partial (contextually related, no direct service)');
  lines.push('    "Privacy Policy"                → absent (no relation)');
  lines.push('');
  lines.push('Key principles:');
  lines.push('- A placement expresses the SAME service or topic → "variant", even if none of the exact words overlap.');
  lines.push('- Location name alone (no service context) → "partial".');
  lines.push('- Location name PLUS a related service word → "variant".');
  lines.push('- Generic UI text ("Home", "Contact", "Service Icon", "Read more") → "absent".');
  lines.push('- Adjacent services in the same industry → "variant" (e.g. "logo design" for a "web design" keyword).');
  lines.push('');
  lines.push('IMPORTANT: A page that is genuinely about the keyword will have MANY variants. If you find yourself returning "absent" for every placement on a page whose topic clearly overlaps the keyword, re-check your reasoning — that is almost always wrong.');
  lines.push('');
  lines.push('PLACEMENTS:');
  lines.push(`title: ${JSON.stringify(d.placements.title)}`);
  lines.push(`metaDescription: ${JSON.stringify(d.placements.metaDescription)}`);
  lines.push(`h1: ${JSON.stringify(d.placements.h1)}`);
  if (d.placements.h2s.length) {
    lines.push('h2s:');
    d.placements.h2s.forEach((t, i) => lines.push(`  [${i}] ${JSON.stringify(t)}`));
  } else {
    lines.push('h2s: []');
  }
  if (d.placements.imageAlts.length) {
    lines.push('imageAlts:');
    d.placements.imageAlts.forEach((t, i) => lines.push(`  [${i}] ${JSON.stringify(t)}`));
  } else {
    lines.push('imageAlts: []');
  }
  if (d.placements.internalAnchors.length) {
    lines.push('internalAnchors:');
    d.placements.internalAnchors.forEach((t, i) => lines.push(`  [${i}] ${JSON.stringify(t)}`));
  } else {
    lines.push('internalAnchors: []');
  }
  lines.push(`urlSlug: ${JSON.stringify(d.placements.urlSlug)}`);
  lines.push('');
  lines.push('Return ONLY this JSON (one entry per input placement, same order):');
  lines.push('{');
  lines.push('  "title": { "verdict": "absent", "matched": null, "reason": "one short sentence explaining why" },');
  lines.push('  "metaDescription": { "verdict": "absent", "matched": null, "reason": "" },');
  lines.push('  "h1": { "verdict": "absent", "matched": null, "reason": "" },');
  lines.push('  "h2s": [ { "verdict": "absent", "matched": null, "reason": "" } ],');
  lines.push('  "imageAlts": [ { "verdict": "absent", "matched": null, "reason": "" } ],');
  lines.push('  "internalAnchors": [ { "verdict": "absent", "matched": null, "reason": "" } ],');
  lines.push('  "urlSlug": { "verdict": "absent", "matched": null, "reason": "" }');
  lines.push('}');
  lines.push('');
  lines.push('Rules:');
  lines.push('- Return exactly one entry per item in each array, in the same order.');
  lines.push('- "matched" is the substring from the placement that matched, or null if truly absent.');
  lines.push('- "reason" is REQUIRED — always give a 5–15 word explanation. Never leave it empty.');
  return lines.join('\n');
}

/* ════════════════════════════════════════════════════════════════
   Normalisers
   ════════════════════════════════════════════════════════════════ */
function normalizeFullAudit(p) {
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

function normalizeVariations(parsed, placements) {
  const allowed = ['exact', 'variant', 'partial', 'absent'];
  const cleanVerdict = (v) => {
    const s = String(v?.verdict || '').toLowerCase().trim();
    return allowed.includes(s) ? s : 'absent';
  };
  const cleanEntry = (v) => ({
    verdict: cleanVerdict(v),
    matched: v?.matched ? String(v.matched).slice(0, 120) : null,
    reason: v?.reason ? String(v.reason).slice(0, 140) : ''
  });

  const judgments = {
    title: cleanEntry(parsed?.title || {}),
    metaDescription: cleanEntry(parsed?.metaDescription || {}),
    h1: cleanEntry(parsed?.h1 || {}),
    h2s: (placements.h2s || []).map((_, i) => cleanEntry(parsed?.h2s?.[i] || {})),
    imageAlts: (placements.imageAlts || []).map((_, i) => cleanEntry(parsed?.imageAlts?.[i] || {})),
    internalAnchors: (placements.internalAnchors || []).map((_, i) => cleanEntry(parsed?.internalAnchors?.[i] || {})),
    urlSlug: cleanEntry(parsed?.urlSlug || {})
  };

  let weightedSum = 0;
  let weightTotal = 0;
  const addWeighted = (verdict, weight) => {
    weightedSum += VERDICT_POINTS[verdict] * weight;
    weightTotal += weight;
  };

  if (placements.title) addWeighted(judgments.title.verdict, PLACEMENT_WEIGHTS.title);
  if (placements.metaDescription) addWeighted(judgments.metaDescription.verdict, PLACEMENT_WEIGHTS.metaDescription);
  if (placements.h1) addWeighted(judgments.h1.verdict, PLACEMENT_WEIGHTS.h1);
  if (placements.urlSlug) addWeighted(judgments.urlSlug.verdict, PLACEMENT_WEIGHTS.urlSlug);
  judgments.h2s.forEach((j, i) => { if (placements.h2s[i]) addWeighted(j.verdict, PLACEMENT_WEIGHTS.h2); });
  judgments.imageAlts.forEach((j, i) => { if (placements.imageAlts[i]) addWeighted(j.verdict, PLACEMENT_WEIGHTS.imageAlt); });
  judgments.internalAnchors.forEach((j, i) => { if (placements.internalAnchors[i]) addWeighted(j.verdict, PLACEMENT_WEIGHTS.internalAnchor); });

  const overallScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  const summary = { exact: 0, variant: 0, partial: 0, absent: 0 };
  const tally = (v) => { summary[v] = (summary[v] || 0) + 1; };
  tally(judgments.title.verdict);
  tally(judgments.metaDescription.verdict);
  tally(judgments.h1.verdict);
  tally(judgments.urlSlug.verdict);
  judgments.h2s.forEach(j => tally(j.verdict));
  judgments.imageAlts.forEach(j => tally(j.verdict));
  judgments.internalAnchors.forEach(j => tally(j.verdict));

  return {
    judgments,
    verdictSummary: summary,
    overallScore,
    model: MODEL,
    generatedAt: new Date().toISOString()
  };
}

/* ════════════════════════════════════════════════════════════════
   Utilities
   ════════════════════════════════════════════════════════════════ */
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