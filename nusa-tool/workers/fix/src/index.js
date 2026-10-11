// nusa-fix v16 — generic, honest, short
//
// The model's job: describe what needs to change, name the general area to fix it on
// the user's platform, and give one plain example. No exact plugin names invented,
// no fake code, no file paths the worker can't verify.

const DEFAULT_MODEL = '@cf/openai/gpt-oss-20b';

/* ───────────────────────── platform ───────────────────────── */

function platform(cms) {
  const n = (cms?.name || '').toLowerCase();
  if (/wordpress|woocommerce/.test(n)) return 'WordPress';
  if (/shopify/.test(n))               return 'Shopify';
  if (/squarespace/.test(n))           return 'Squarespace';
  if (/wix/.test(n))                   return 'Wix';
  if (/webflow/.test(n))               return 'Webflow';
  if (/drupal/.test(n))                return 'Drupal';
  if (/joomla/.test(n))                return 'Joomla';
  if (/magento/.test(n))               return 'Magento';
  return 'Custom';
}

/* ───────────────────────── category ───────────────────────── */

function category(label) {
  const l = (label || '').toLowerCase();
  if (/flesch|kincaid|reading ease|sentence length|paragraph density|scannab|text-to-code|text density|content depth|author byline|publish date/i.test(l))
    return 'content';
  if (/heading order|semantic html|div-soup|h1|landmark|skip-to-content|aria|alt text|label|link-name|button-name|accessible name/i.test(l))
    return 'structure';
  if (/contrast|touch target|wcag/i.test(l))
    return 'styling';
  if (/lazy|image|webp|avif|script|css|font|inline|cls|lcp|inp|ttfb|fcp|render blocking|asset|heavyweight|over \d+\s*kb/i.test(l))
    return 'performance';
  if (/title|meta description|canonical|manifest|theme-color|viewport|apple-|noindex|nofollow|hreflang|schema|json-ld|structured data/i.test(l))
    return 'metadata';
  if (/hsts|x-frame|permissions-policy|referrer-policy|robots\.txt|llms\.txt/i.test(l))
    return 'server';
  return 'general';
}

/* ───────────────────────── platform-specific surfaces ───────────────────────── */

const SURFACES = {
  WordPress: {
    content:     'the WordPress page or post editor',
    structure:   'the WordPress block editor, or a child-theme template if the markup is hard-coded',
    styling:     'Appearance → Customize → Additional CSS, or a CSS snippet plugin',
    performance: 'a performance plugin such as Perfmatters, WP Rocket, or Autoptimize, or the theme itself',
    metadata:    'an SEO plugin such as Yoast or Rank Math, or the site header',
    server:      'the server configuration or a security plugin',
    general:     'the WordPress admin or the active theme'
  },
  Shopify: {
    content:     'the Shopify admin → Pages or Products',
    structure:   'the theme editor (Online Store → Themes → Edit code)',
    styling:     'the theme editor → Assets → theme.css',
    performance: 'an image-optimisation app or the theme settings',
    metadata:    'the page’s SEO fields in the Shopify admin',
    server:      'the domain settings or Cloudflare',
    general:     'the Shopify admin or the theme editor'
  },
  Squarespace: {
    content:     'the Squarespace page editor',
    structure:   'the page editor or a Code Block',
    styling:     'Design → Custom CSS',
    performance: 'the site’s Speed settings or an Extension',
    metadata:    'the page settings → SEO tab',
    server:      'the DNS host or Cloudflare',
    general:     'the Squarespace settings panel'
  },
  Wix: {
    content:     'the Wix Editor',
    structure:   'the Wix Editor or an HTML embed',
    styling:     'Settings → Custom Code, wrapped in a style block',
    performance: 'the site’s Performance settings or a Wix App',
    metadata:    'the page’s SEO panel',
    server:      'the DNS host or Cloudflare',
    general:     'the Wix Editor or site settings'
  },
  Webflow: {
    content:     'the Webflow Designer',
    structure:   'the Webflow Designer',
    styling:     'Project Settings → Custom Code → Head',
    performance: 'Webflow Site Settings → Performance',
    metadata:    'the page settings → SEO fields',
    server:      'the DNS host or Cloudflare',
    general:     'the Webflow Designer or Project Settings'
  },
  Custom: {
    content:     'your content files',
    structure:   'your HTML templates or partials',
    styling:     'your site stylesheet',
    performance: 'your build pipeline, CDN, or template',
    metadata:    'your layout’s head section',
    server:      'your server config (nginx/Apache) or CDN',
    general:     'your source code'
  }
};

function surfaceFor(platformName, cat) {
  return (SURFACES[platformName] && SURFACES[platformName][cat]) || SURFACES[platformName].general;
}

/* ───────────────────────── worker entry ───────────────────────── */

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

/* ───────────────────────── prompt ───────────────────────── */

function buildPrompt({ url, pageTitle, cms, finding, affectedHtml }) {
  const pName = platform(cms);
  const pLine = cms?.version ? `${pName} ${cms.version}` : pName;
  const cat = category(finding.label);
  const surface = surfaceFor(pName, cat);

  // Abbreviate any URL in the failing HTML so the model can't paste long paths.
  const safeHtml = affectedHtml && String(affectedHtml).trim().length > 20
    ? String(affectedHtml).replace(/https?:\/\/[^\s"'<>]+/g, u => {
        const last = u.split('?')[0].split('/').pop() || '';
        return last ? '.../' + last : u;
      }).slice(0, 500)
    : null;

  const htmlBlock = safeHtml ? `\n\nFailing HTML (URLs abbreviated):\n\`\`\`html\n${safeHtml}\n\`\`\`` : '';
  const catLine = finding.cat + (finding.module ? ' · ' + finding.module : '');

  return `Describe an audit fix in 2 sentences, then give 2-3 example steps.

Platform: ${pLine}
General area to fix this on this platform: ${surface}

Context:
- Page: ${url || 'unknown'}${pageTitle ? ' — "' + pageTitle + '"' : ''}
- Category: ${catLine}
- Finding: ${finding.label}${htmlBlock}

Output format (exactly this shape):

Line 1 — a plain 2-sentence paragraph, 40 words or fewer. Sentence 1: what needs to change. Sentence 2: where to fix it, using the general area named above.

Then a blank line, then the literal word: Example:

Then 2 or 3 short numbered steps showing a typical way to make this fix on ${pName}. Generic steps are fine — a user can adapt them.

Rules:
- Never invent plugin names. If you mention a plugin, use only well-known ones (Yoast, Rank Math, Perfmatters, WP Rocket, Autoptimize, Really Simple SSL). Otherwise describe the category ("an SEO plugin", "a performance plugin").
- Never write a full URL. Use .../filename.ext.
- One short code block is allowed only if the fix is a CSS rule, a meta tag, or an HTML pattern. 5 lines maximum. Do not paste the failing HTML back.
- No markdown bold, italic, or inline code in prose.
- No greetings. No sign-offs. No verification step. Start directly with the prose.
- Custom-platform rule: when cms is "Custom / Unknown", never mention a theme, plugin, CMS admin screen, or CMS-specific path. Use neutral language: "your stylesheet", "your template", "your layout file", "your server config". Never say "theme's style.css", "WP Rocket", "Gutenberg", "child theme", or any product name that only exists on a CMS.
- No invented third-party scripts: never produce a CDN URL, a script tag, an API call, or a config object for a product you cannot verify exists in the audit data or in the known-plugin list. If the finding names a technology you cannot confirm (e.g. WebMCP), say: "This is an informational signal — no action required unless you're actively integrating with a specific provider."`;
}

/* ───────────────────────── generateFix ───────────────────────── */

async function generateFix(env, payload) {
  const model = payload.model || DEFAULT_MODEL;
  const prompt = buildPrompt(payload);

  const aiRes = await env.AI.run(model, {
    messages: [
      {
        role: 'system',
        content: 'You describe website audit fixes in 2 short sentences, then give 2-3 generic example steps. No greetings. No sign-offs. No markdown emphasis. Never invent plugin names or file paths.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1200,
    temperature: 0.3,
    reasoning_effort: 'low'
  });

  const { prose, source } = extractText(aiRes);

  if (!prose || prose.length < 40) {
    return {
      applicable: false, prose: '',
      reason: 'model returned no usable fix',
      debug: { responseShape: describeShape(aiRes), contentField: source, raw: safeStringify(aiRes).slice(0, 300) }
    };
  }

  const cleaned = stripInlineMarkdown(stripWrapper(prose));

  // Basic shape check
  const hasExample = /(^|\n)\s*Example:\s*(\n|$)/i.test(cleaned);
  const hasSteps   = /(?:^|\n)\s*\d+[.)]\s+\S/.test(cleaned);
  if (!hasExample || !hasSteps) {
    return { applicable: false, prose: '', reason: 'model did not follow the format', debug: { proseHead: cleaned.slice(0, 200) } };
  }

  // Reject invented plugins that don't exist on well-known lists
  const KNOWN_PLUGINS = ['yoast','rank math','seopress','perfmatters','wp rocket','autoptimize','litespeed','really simple ssl','wpcode','code snippets','smush','shortpixel','tinyimg','crush.pics','superpwa','pwa for wp','wp accessibility','equalize digital'];
  const pluginMentions = cleaned.match(/\b(?:plugin|app|extension)\s+(?:called\s+|named\s+)?["']?([A-Z][A-Za-z0-9 .'-]{2,30})["']?/g) || [];
  const invented = pluginMentions.find(m => {
    const name = m.replace(/^(?:plugin|app|extension)\s+(?:called\s+|named\s+)?["']?/i, '').replace(/["']$/, '').toLowerCase();
    return name.length > 3 && !KNOWN_PLUGINS.some(k => name.includes(k) || k.includes(name));
  });
  if (invented) {
    return { applicable: false, prose: '', reason: `model invented a plugin name: ${invented}`, debug: { proseHead: cleaned.slice(0, 200) } };
  }

  // Reject long URLs in code blocks
  const blocks = cleaned.match(/```[\s\S]*?```/g) || [];
  if (blocks.some(b => /https?:\/\/[^\s"'<>]{50,}/.test(b))) {
    return { applicable: false, prose: '', reason: 'code block contains a full URL', debug: { proseHead: cleaned.slice(0, 200) } };
  }

  // Prose word cap
  const intro = cleaned.split(/\n\s*Example:/i)[0] || '';
  const words = intro.trim().split(/\s+/).filter(Boolean).length;
  if (words > 60) {
    return { applicable: false, prose: '', reason: 'intro paragraph too long', debug: { words } };
  }

  return { applicable: true, prose: cleaned, patchScript: null, model };
}

/* ───────────────────────── helpers ───────────────────────── */

function stripInlineMarkdown(text) {
  if (!text) return text;
  const parts = String(text).split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
      .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1$2')
      .replace(/`([^`\n]+)`/g, '$1');
  }).join('');
}

function extractText(aiRes) {
  if (!aiRes) return { prose: '', source: 'null' };
  if (typeof aiRes === 'string') return { prose: aiRes.trim(), source: 'string' };
  if (Array.isArray(aiRes.choices) && aiRes.choices.length) {
    const c = aiRes.choices[0];
    const m = c.message || c.delta || {};
    if (typeof m.content === 'string' && m.content.trim()) return { prose: m.content.trim(), source: 'choices[0].message.content' };
    if (typeof c.text === 'string' && c.text.trim()) return { prose: c.text.trim(), source: 'choices[0].text' };
  }
  if (typeof aiRes.response === 'string') return { prose: aiRes.response.trim(), source: 'response' };
  if (aiRes.response && typeof aiRes.response.content === 'string') return { prose: aiRes.response.content.trim(), source: 'response.content' };
  if (typeof aiRes.result === 'string') return { prose: aiRes.result.trim(), source: 'result' };
  if (typeof aiRes.output_text === 'string') return { prose: aiRes.output_text.trim(), source: 'output_text' };
  return { prose: '', source: 'unknown' };
}

function describeShape(x) {
  if (x == null) return 'null';
  if (typeof x !== 'object') return typeof x;
  return '{' + Object.keys(x).join(', ') + '}';
}
function safeStringify(x) { try { return JSON.stringify(x, null, 2); } catch { return '[unserializable]'; } }
function stripWrapper(s) { return String(s).replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim(); }