// nusa-ask — merged v4
// Tighter prompt. Three deterministic gates: invented plugins, CMS leaks on custom,
// invented third-party scripts.

const MODELS = [
  '@cf/openai/gpt-oss-20b',
  '@cf/deepseek-ai/deepseek-v4-flash-0731',
  '@cf/qwen/qwen3.8-27b',
  '@cf/meta/llama-4-scout-17b-16e-instruct'
];

const KNOWN_PLUGINS = [
  'yoast', 'rank math', 'seopress',
  'perfmatters', 'wp rocket', 'autoptimize', 'litespeed',
  'really simple ssl',
  'wpcode', 'code snippets',
  'smush', 'shortpixel', 'tinyimg',
  'superpwa', 'pwa for wp',
  'equalize digital', 'wp accessibility'
];

// Terms that only make sense when a CMS is detected. If cms is Custom and the
// answer uses one of these, the answer is rejected.
const CMS_TERMS = [
  'theme\u2019s style.css', "theme's style.css",
  'child theme', 'child-theme',
  'gutenberg', 'block editor', 'customizer',
  'wp-content', 'wp-admin', 'wp_head',
  'wp rocket', 'perfmatters', 'yoast', 'rank math', 'seopress',
  'functions.php', 'header.php', 'footer.php',
  'plugins \u2192', 'plugins →',
  'appearance \u2192', 'appearance →',
  'settings \u2192', 'settings →'
];

// Domains that are safe to reference in a script tag. Anything else gets rejected
// unless the audit data itself mentioned it.
const KNOWN_SCRIPT_DOMAINS = [
  'googletagmanager.com', 'google-analytics.com', 'gstatic.com',
  'googletagservices.com', 'doubleclick.net', 'facebook.net',
  'cloudflare.com', 'cloudflareinsights.com', 'jsdelivr.net',
  'unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com',
  'fonts.gstatic.com', 'hotjar.com', 'clarity.ms', 'segment.com'
];

const SYSTEM = `You are NUSA — a web-audit consultant. Answer in plain prose.

WHAT YOU GET
A page audit: URL, title, CMS, scores, findings (fail/warn/pass), HTML snippets, metrics.

HOW TO ANSWER
- Use only the audit data. If a value isn't there, say so in one line and stop.
- Match the question to its category (SEO / UX / AEO / all three).
- Reference real numbers and names: "147 links", "the h2 at line 4".
- Quote snippets verbatim when relevant. Never invent markup.
- Give the fix in the general area, not a fake exact path. "In your performance plugin's script settings" — not "Perfmatters → Scripts → row 3".
- If cms is Custom / Unknown: neutral language only. "Your stylesheet", "your template", "your layout file". No theme, plugin, or CMS admin.
- If cms is known: name the general admin area (the Customizer, the block editor, the SEO plugin settings). Do not invent menu paths, button labels, or checkbox names.
- Plugins: only from Yoast, Rank Math, SEOPress, Perfmatters, WP Rocket, Autoptimize, LiteSpeed, Really Simple SSL, WPCode, Code Snippets, Smush, ShortPixel, TinyIMG, SuperPWA, PWA for WP, Equalize Digital, WP Accessibility. Otherwise describe the category ("an SEO plugin").
- Never invent file paths, hex colours, config values, CDN URLs, or script tags. If you don't know the exact value, describe what to change.
- Never invent business facts. When suggesting content, describe the topic ("a paragraph describing the property type and amenities") — do not write the paragraph.
- Informational findings (status pass, or labelled informational): explain what they mean and stop. Do not suggest changes.

FORMAT
- Under 200 words.
- Plain text. No markdown headings, no bold or italic.
- Code/tags in fenced blocks with a language. Six lines max. Abbreviate URLs to .../filename.ext.
- Multi-step fixes numbered. Sub-points with hyphens.
- No greeting. No sign-off.`;

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

    const isCustom = !auditData.cms || /custom|unknown/i.test(auditData.cms.name || '');

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

        // ── Gate 1: invented plugin names ──────────────────────
        const badPlugin = checkInventedPlugins(answer);
        if (badPlugin) {
          lastError = new Error(`${model} invented plugin: ${badPlugin}`);
          console.warn(`[${model}] invented plugin: ${badPlugin}`);
          continue;
        }

        // ── Gate 2: CMS-specific terms on a custom stack ───────
        if (isCustom) {
          const leak = checkCMSLeak(answer);
          if (leak) {
            lastError = new Error(`${model} leaked CMS term on custom stack: ${leak}`);
            console.warn(`[${model}] CMS leak: ${leak}`);
            continue;
          }
        }

        // ── Gate 3: invented third-party scripts ───────────────
        const fake = checkInventedScripts(answer, auditData);
        if (fake) {
          lastError = new Error(`${model} invented script URL: ${fake}`);
          console.warn(`[${model}] invented script: ${fake}`);
          continue;
        }

        return json({ success: true, answer, model }, 200, cors);
      } catch (e) {
        lastError = e;
        console.warn(`model ${model} failed:`, e.message);
      }
    }

    return json({ success: false, error: 'All models unavailable', details: lastError?.message }, 503, cors);
  }
};

/* ───────────────────────── gates ───────────────────────── */

function checkInventedPlugins(answer) {
  if (!answer) return null;
  const re = /\b(?:plugin|app|extension)\s+(?:called\s+|named\s+)?["']?([A-Z][A-Za-z0-9 .'-]{2,30})["']?/g;
  let m;
  while ((m = re.exec(answer))) {
    const raw = m[1].replace(/["']$/, '').trim();
    const name = raw.toLowerCase();
    if (/^(the|a|an)\s/i.test(raw)) continue;
    if (/^(performance|image|seo|accessibility|security|optimisation|optimization|caching|cache|snippet)\s+(plugin|app|extension)/i.test(raw)) continue;
    if (KNOWN_PLUGINS.some(k => name.includes(k) || k.includes(name))) continue;
    return raw;
  }
  return null;
}

function checkCMSLeak(answer) {
  if (!answer) return null;
  const lower = answer.toLowerCase();
  for (const term of CMS_TERMS) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  return null;
}

function checkInventedScripts(answer, auditData) {
  if (!answer) return null;
  // Extract src="..." from <script> tags in fenced blocks
  const srcRe = /<script[^>]+src=["']([^"']+)["']/gi;
  // Also catch bare URLs in script-ish contexts
  const urlRe = /https?:\/\/([a-z0-9.-]+)\/[^\s"'<>]*\.js\b/gi;

  const sourceBlob = JSON.stringify(auditData).toLowerCase();

  let m;
  while ((m = srcRe.exec(answer))) {
    const host = extractHost(m[1]);
    if (!host) continue;
    if (KNOWN_SCRIPT_DOMAINS.some(d => host.endsWith(d))) continue;
    if (sourceBlob.includes(host)) continue; // audit already mentions it
    return m[1];
  }
  while ((m = urlRe.exec(answer))) {
    const host = m[1].toLowerCase();
    if (KNOWN_SCRIPT_DOMAINS.some(d => host.endsWith(d))) continue;
    if (sourceBlob.includes(host)) continue;
    return m[0];
  }
  return null;
}

function extractHost(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/* ───────────────────────── context ───────────────────────── */

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

/* ───────────────────────── response parsing ───────────────────────── */

function unwrap(aiRes) {
  if (aiRes == null) return '';
  let r = aiRes;

  if (typeof r === 'object' && 'response' in r) r = r.response;
  else if (typeof r === 'object' && 'result' in r) r = r.result;

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

  const blocks = [];
  let out = answer.replace(/```[\s\S]*?```/g, m => {
    blocks.push(m);
    return `\u0000BLOCK${blocks.length - 1}\u0000`;
  });

  out = out
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\s)(.*?)(?<!\s)\*/g, '$1$2')
    .replace(/(^|[^_])_(?!\s)(.*?)(?<!\s)_/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  out = out.replace(/\u0000BLOCK(\d+)\u0000/g, (_, i) => blocks[+i]);
  return out;
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}