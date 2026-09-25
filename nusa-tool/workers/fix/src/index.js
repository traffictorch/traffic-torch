// nusa-fix v5 — hint-aware prompt

const DEFAULT_MODEL = '@cf/openai/gpt-oss-20b';

// Explicit disambiguation for findings whose label alone is ambiguous.
// The model was picking the wrong axis (format vs lazy, shorten vs lengthen).
const HINTS = {
  'Image Optimization':        'This metric is about image FORMAT (WebP/AVIF conversion). NOT lazy loading. NOT srcset. Add/convert to .webp or .avif.',
  'Lazy Loading Media':        'This metric is about adding loading="lazy" to images. NOT format conversion.',
  'Script Optimization':       'This metric is about reducing render-blocking scripts — add defer/async, move inline scripts external. NOT about removing scripts entirely.',
  'Script Bloat Detection':    'This metric is about total script weight and third-party count. Combine/minify. Remove unused third-party tags.',
  'Asset Volume Flags':        'This metric is about total asset count/size across the page. Compress, deduplicate, combine.',
  'Menu Structure Clarity':    'This metric is about top-level nav item count (ideal 5-7) and label clarity.',
  'Link Density Evaluation':   'This metric is about links-per-100-words. Ideal 2-6. Not total link count.',
  'Internal Linking Balance':  'This metric is about the ratio of internal links vs external links vs word count.',
  'Overall Text Scannability': 'This metric is about heading count, list usage, and bold text — anything that breaks up long prose.',
  'Paragraph Density & Length': 'This metric is about average words per paragraph. Ideal under 80.',
  'Responsive Breakpoints':    'This metric is about media queries for phone/tablet/desktop widths.',
  'Touch Target Size':         'This metric is about clickable elements under 44×44 CSS pixels. Increase padding or min-height.',
  'Color Contrast Ratios':     'This metric is about WCAG AA contrast (4.5:1 normal, 3:1 large text). Change text or background colour.',
  'Overall WCAG Compliance':   'This is a rollup of accessibility checks. Focus on the single most impactful fix — usually contrast or alt text.',
  'PWA Readiness Indicators':  'This metric is about manifest, service worker, and HTTPS. NOT apple-touch-icon sizes.',
  'Font Optimization':         'This metric is about font-display:swap and font family/weight count.',
  'Flesch Reading Ease Score': 'Higher is better. Simplify vocabulary and shorten sentences.',
  'Flesch-Kincaid Grade Level':'Lower is better. Target grade 8 or below.',
  'Average Sentence Length':   'Lower is better. Target under 20 words per sentence.'
};

function lookupHint(label) {
  if (!label) return null;
  for (const [k, v] of Object.entries(HINTS)) {
    if (label.toLowerCase().includes(k.toLowerCase())) return v;
  }
  // Content-shape hints for ratio findings
  if (/text[\s-]?to[\s-]?code/i.test(label)) {
    const m = label.match(/(\d+(?:\.\d+)?)\s*%/);
    const pct = m ? parseFloat(m[1]) : null;
    if (pct !== null && pct < 15) {
      return 'The page has TOO LITTLE visible text relative to markup. The fix is to ADD more prose — do NOT shorten existing paragraphs. Target ratio is 15% or higher.';
    }
    return 'The page has too much text relative to markup — trim wrapper markup, keep prose. Target ratio 15%.';
  }
  return null;
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ success: false, error: 'POST only' }, 405, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ success: false, error: 'invalid JSON' }, 400, cors); }

    const { url, pageTitle, cms, finding, affectedHtml, model } = body || {};
    if (!finding || !finding.label) {
      return json({ success: false, error: 'finding.label required' }, 400, cors);
    }

    try {
      const result = await generateFix(env, { url, pageTitle, cms, finding, affectedHtml, model });
      return json({ success: true, ...result }, 200, cors);
    } catch (e) {
      return json({ success: false, error: e.message || 'fix generation failed' }, 500, cors);
    }
  }
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}

function buildPrompt({ url, pageTitle, cms, finding, affectedHtml }) {
  const cmsName = cms?.name || 'Custom / Unknown';
  const cmsLine = cms?.version ? `${cmsName} ${cms.version}` : cmsName;
  const catLine = finding.cat + (finding.module ? ' · ' + finding.module : '');
  const hasHtml = affectedHtml && String(affectedHtml).trim().length > 20;
  const hint = lookupHint(finding.label);

  const htmlBlock = hasHtml
    ? '\n\nActual failing HTML:\n```html\n' + String(affectedHtml).slice(0, 1200) + '\n```'
    : '\n\n(Page-wide metric — no specific element.)';

  const hintBlock = hint ? `\n\nCRITICAL — what this metric actually means:\n${hint}` : '';

  const rules = hasHtml
    ? `Output exactly four numbered steps, nothing else:

1. One sentence — the fix.
2. Code change. Fenced \`\`\` block with the real replacement snippet. Use the actual values from the failing HTML.
3. Where to apply it (file path / CMS location for ${cmsName}).
4. How to verify it worked.

At least one step must contain a \`\`\` code block. No greetings. No sign-off. Start directly with "1."`
    : `Output exactly four numbered steps, nothing else:

1. What needs to change.
2. The specific action (content edit, restructure, or rule to apply). No code block needed.
3. Where to apply it (CMS editor / template / content type for ${cmsName}).
4. How to verify it worked.

Be specific to this page, not generic advice. No greetings. No sign-off. Start directly with "1."`;

  return `Fix generator for a website audit tool. Start directly with "1." Output four numbered steps only.

Context:
- Page: ${url || 'unknown'}${pageTitle ? ' — "' + pageTitle + '"' : ''}
- Platform: ${cmsLine}
- Category: ${catLine}
- Finding: ${finding.label}${htmlBlock}${hintBlock}

${rules}`;
}

async function generateFix(env, payload) {
  const model = payload.model || DEFAULT_MODEL;
  const hasHtml = payload.affectedHtml && String(payload.affectedHtml).trim().length > 20;
  const prompt = buildPrompt(payload);

  const aiRes = await env.AI.run(model, {
    messages: [
      {
        role: 'system',
        content: 'You output numbered fix steps only. Start directly with "1." No greetings, no sign-offs, no questions, no markdown headings. Follow any CRITICAL metric-semantics instruction exactly.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 3000,
    temperature: 0.3,
    reasoning_effort: 'low'
  });

  const { prose, source } = extractText(aiRes);

  if (!prose || prose.length < 80) {
    return {
      applicable: false, prose: '',
      reason: 'model returned no usable fix',
      debug: { responseShape: describeShape(aiRes), contentField: source, raw: safeStringify(aiRes).slice(0, 400) }
    };
  }

  const hasSteps = /(?:^|\n)\s*\d+[.)]\s+\S/.test(prose);
  const hasCode  = /```/.test(prose);
  const looksLikeSignoff = /^after changes[:\s]/i.test(prose) && prose.length < 120;

  if (looksLikeSignoff || !hasSteps) {
    return { applicable: false, prose: '', reason: 'model returned a non-actionable response', debug: { proseHead: prose.slice(0, 300) } };
  }
  if (hasHtml && !hasCode) {
    return { applicable: false, prose: '', reason: 'model did not include a code snippet', debug: { proseHead: prose.slice(0, 300) } };
  }

  return { applicable: true, prose: stripWrapper(prose), patchScript: null, model };
}

function extractText(aiRes) {
  if (!aiRes) return { prose: '', source: 'null' };
  if (typeof aiRes === 'string') return { prose: aiRes.trim(), source: 'string' };

  if (Array.isArray(aiRes.choices) && aiRes.choices.length) {
    const c = aiRes.choices[0];
    const m = c.message || c.delta || {};
    if (typeof m.content === 'string' && m.content.trim().length > 0) return { prose: m.content.trim(), source: 'choices[0].message.content' };
    if (typeof m.refusal === 'string' && m.refusal.trim().length > 0) return { prose: m.refusal.trim(), source: 'choices[0].message.refusal' };
    if (typeof m.reasoning_content === 'string' && m.reasoning_content.trim().length > 0) return { prose: m.reasoning_content.trim(), source: 'choices[0].message.reasoning_content' };
    if (typeof c.text === 'string' && c.text.trim().length > 0) return { prose: c.text.trim(), source: 'choices[0].text' };
  }

  if (typeof aiRes.response === 'string') return { prose: aiRes.response.trim(), source: 'response' };
  if (aiRes.response && typeof aiRes.response === 'object') {
    const r = aiRes.response;
    if (typeof r.content === 'string' && r.content.trim()) return { prose: r.content.trim(), source: 'response.content' };
    if (typeof r.text === 'string' && r.text.trim()) return { prose: r.text.trim(), source: 'response.text' };
  }
  if (typeof aiRes.result === 'string') return { prose: aiRes.result.trim(), source: 'result' };
  if (typeof aiRes.output_text === 'string') return { prose: aiRes.output_text.trim(), source: 'output_text' };
  return { prose: '', source: 'unknown' };
}

function describeShape(x) {
  if (x == null) return 'null';
  if (typeof x !== 'object') return typeof x;
  const keys = Object.keys(x);
  return keys.length ? '{' + keys.join(', ') + '}' : '{}';
}
function safeStringify(x) { try { return JSON.stringify(x, null, 2); } catch { return '[unserializable]'; } }
function stripWrapper(s) { return String(s).replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim(); }
