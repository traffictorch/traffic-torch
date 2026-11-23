// uxid-tool/metrics-incentive.js  —  calibrated for real-world pages
const STRONG_VERBS = ['start','get','claim','unlock','discover','grab','secure'];
const GOOD_VERBS   = ['try','begin','launch','create','download','book','build','boost','join','sign','run','analyze','audit','explore'];
const MODERATE_VERBS = ['learn','see','find','explore','read','view','check'];
const WEAK_VERBS   = ['submit','click','continue','go','next'];
const BENEFIT_WORDS = ['free','instant','immediate','today','now','unlimited','exclusive','easy','fast','quick','no cost','no credit card','no commitment'];
const URGENCY_WORDS = ['now','today','instant','limited','last chance','ends soon','expires'];

const TRUST_PATTERNS = [
  /money[\s-]?back/i, /guarantee/i, /refund/i, /cancel anytime/i,
  /no credit card/i, /secure/i, /\bssl\b/i, /privacy/i, /\bgdpr\b/i,
  /\bsoc\s?2\b/i, /\bhipaa\b/i, /warranty/i, /risk[\s-]?free/i,
  /your data/i, /encrypted/i,
  /privacy[\s-]first/i, /no tracking/i, /no data stored/i, /no data selling/i,
  /transparent/i, /open[\s-]source/i, /no ads/i, /no spam/i,
  /no sign[\s-]?up/i, /no signup/i, /zero paywalls/i, /free forever/i,
  /trusted by/i, /audited/i, /independently/i, /built by/i
];

const RECIPROCITY_PATTERNS = [
  /free tool/i, /free audit/i, /free template/i, /free sample/i,
  /free calculator/i, /free checklist/i, /download free/i, /try free/i,
  /sample download/i, /free guide/i,
  /free plan/i, /free version/i, /free trial/i, /free access/i,
  /free,?\s+no\s+paywall/i, /no\s+paywall/i, /free,?\s+forever/i,
  /free,?\s+no\s+signup/i, /free,?\s+no\s+credit/i,
  /\bfree\b[^.!?]{0,40}(audit|tool|tier|plan|account|access|forever|unlimited)/i,
  /at no cost/i, /no credit card/i, /100%\s*free/i, /zero paywalls/i,
  /free forever/i, /free for/i, /start free/i, /always free/i,
  /free tier/i, /free account/i, /free simulation/i, /free analysis/i,
  /free report/i, /free score/i, /free check/i, /no cost/i, /no charge/i
];

const VALUE_FIRST_PATTERNS = [
  /you get/i, /so you can/i, /helps? (you|businesses|teams|people)/i,
  /you'?ll (get|save|learn|build|find|see)/i,
  /save\s+(time|money|hours|effort)/i, /grow\s+(traffic|revenue|audience)/i,
  /reduce\s+\w+/i, /increase\s+\w+/i,
  /in\s+\d+\s*(min|minutes|days|hours|seconds)/i,
  /in (a few|seconds|minutes)/i,
  /without\s+(having|needing|waiting|any|a)\b/i,
  /no (cost|charge|fee|credit card|sign[\s-]?up)/i,
  /makes? it (easy|simple|fast|clear)/i,
  /combines? .* with/i,
  /get (your|the|a) \w+/i,
  /find (out|your|the)/i, /see (your|how|what)/i,
  /discover (how|what|why|your)/i, /learn (how|what|why)/i,
  /start (your|a|today|now)/i, /audit (your|any)/i,
  /explore (the|your)/i, /run (a|the|your)/i
];

const ACTION_HEADING_VERBS = ['start','discover','get','build','learn','try','see','find','fix','boost','unlock','claim','create','launch','download','book','explore','read','join','sign','grow','save','improve','master','transform','audit','check','measure','run','compare','calculate','track','explore'];
const PASSIVE_HEADINGS = ['about','welcome','our story','company','mission','who we are','what we do','why us','contact','home','overview','introduction'];

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const textOf = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const mainRoot = (doc) => doc.querySelector('main, article, [role="main"]') || doc.body;

function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, function(_, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function(_, d) { return String.fromCharCode(parseInt(d, 10)); });
}

function unescapeBackslashes(s) {
  if (!s) return '';
  return String(s).split('\\\\"').join('"').split('\\\\/').join('/').split('\\\\\\\\').join('\\\\');
}


function extractLdJsonContent(rawHtml) {
  if (!rawHtml) return '';
  var out = [];
  var re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  var m;
  while ((m = re.exec(rawHtml))) out.push(m[1]);
  if (!out.length) {
    // Fallback: some proxies may escape the tag itself
    var re2 = /&lt;script[^&]+application\/ld\+json[^&]*&gt;([\s\S]*?)&lt;\/script&gt;/gi;
    while ((m = re2.exec(rawHtml))) out.push(m[1]);
  }
  return out.join('\n');
}

function normalizeLdText(s) {
  if (!s) return '';
  var t = String(s);
  t = t.replace(/<!\[CDATA\[|\]\]>/g, '');
  t = t.replace(/&quot;/gi, '"').replace(/&#34;/g, '"')
       .replace(/&#39;/g, "'").replace(/&apos;/gi, "'")
       .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
       .replace(/&#x([0-9a-f]+);/gi, function(_, h){ return String.fromCharCode(parseInt(h,16)); })
       .replace(/&#(\d+);/g, function(_, d){ return String.fromCharCode(parseInt(d,10)); });
  t = t.replace(/\\"/g, '"');
  t = t.replace(/\\\//g, '/');
  t = t.replace(/\\n/g, String.fromCharCode(10));
  t = t.replace(/\\r/g, String.fromCharCode(13));
  t = t.replace(/\\t/g, String.fromCharCode(9));
  t = t.replace(/\\\\/g, String.fromCharCode(92));
  return t;
}

function getSchemaText(doc, rawHtml) {
  var raw = rawHtml || '';
  var ldRaw = extractLdJsonContent(raw);
  var candidates = [
    normalizeLdText(ldRaw),
    normalizeLdText(raw),
    ldRaw,
    raw
  ];
  try {
    var scripts = [].slice.call(doc.querySelectorAll('script[type="application/ld+json"]'));
    var scriptText = scripts.map(function(s){ return s.textContent || ''; }).join('\n');
    if (scriptText) {
      candidates.push(normalizeLdText(scriptText));
      candidates.push(scriptText);
    }
  } catch (e) {}
  for (var i = 0; i < candidates.length; i++) {
    if (/"@type"\s*:/.test(candidates[i])) return candidates[i];
  }
  return candidates[0] || '';
}

function visible(el) {
  if (!el || el.hidden) return false;
  const s = el.getAttribute('style') || '';
  if (/display\s*:\s*none/i.test(s) || /visibility\s*:\s*hidden/i.test(s)) return false;
  return true;
}

function ctaCandidates(doc) {
  return [...doc.querySelectorAll('a, button, input[type="submit"], [role="button"]')]
    .filter(visible)
    .filter(el => {
      if (el.tagName === 'INPUT') return true;
      const t = textOf(el);
      if (t.length < 2 || t.length > 90) return false;
      if (/^skip\s+to/i.test(t)) return false;
      const href = el.getAttribute('href') || '';
      if (href === '#main-content' || (href.startsWith('#') && /skip/i.test(t))) return false;
      // Only filter out empty or root hrefs for <a> tags, not <button> tags
      if (el.tagName === 'A' && (href === '/' || href === '')) return false;
      // Filter signal-card links (descriptive navigation, not CTA)
      if (el.closest('.uxid-signals')) return false;
      // Filter brand/logo links (inside header/nav, short text, no action verb)
      const inHeader = !!el.closest('header, nav, [role="banner"]');
      const words = t.split(/\s+/).filter(Boolean);
      const hasActionVerb = [...STRONG_VERBS, ...GOOD_VERBS, ...MODERATE_VERBS, ...WEAK_VERBS]
        .some(v => words.map(w => w.toLowerCase()).includes(v));
      if (inHeader && !hasActionVerb && words.length <= 3) return false;
      // Filter brand/logo links regardless of location
      if (/^(traffic torch|home|logo)$/i.test(t.trim())) return false;
      if (el.querySelector && el.querySelector('img[src*="logo" i], img[alt*="logo" i], img[alt*="traffic torch" i]')) return false;
      if (/logo/i.test(el.className || '')) return false;
      return true;
    });
}

export function analyzeCTASpecificity(doc) {
  const ctas = ctaCandidates(doc);
  if (!ctas.length) return { score: 0, evidence: ['No visible CTA found'], detail: 'No CTA detected' };
  const scored = ctas.map(el => {
    const t = textOf(el).toLowerCase();
    const words = t.split(/\s+/).filter(Boolean);
    let score = 40; const hits = [];
    if (STRONG_VERBS.some(v => words[0] === v || words.includes(v))) { score += 30; hits.push('strong verb'); }
    else if (GOOD_VERBS.some(v => words.includes(v))) { score += 25; hits.push('good verb'); }
    else if (MODERATE_VERBS.some(v => words.includes(v))) { score += 15; hits.push('moderate verb'); }
    else if (WEAK_VERBS.some(v => words.includes(v))) { score += 5; hits.push('weak verb'); }
    else { score -= 10; hits.push('no verb'); }
    if (BENEFIT_WORDS.some(w => t.includes(w))) { score += 12; hits.push('benefit'); }
    if (/\d/.test(t) || /in\s+\d+\s*(min|minutes|days|hours)/.test(t)) { score += 10; hits.push('specific'); }
    if (URGENCY_WORDS.some(w => t.includes(w))) { score += 8; hits.push('urgency'); }
    if (words.length >= 2 && words.length <= 5) score += 5;
    else if (words.length >= 8) score -= 10;
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || /(^|\s)(btn|button|cta)(\s|$)/i.test(el.className || '')) score += 5;
    return { text: textOf(el).slice(0, 80), score: clamp(score), hits };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return { score: best.score, evidence: [`Best CTA: "${best.text}"`, `Signals: ${best.hits.join(', ')}`], detail: `${ctas.length} CTAs; strongest ${best.score}/100` };
}

export function analyzeCTAVisibility(doc) {
  const ctas = ctaCandidates(doc);
  if (!ctas.length) return { score: 0, evidence: ['No CTA found'], detail: 'No CTA' };
  const main = mainRoot(doc);
  const firstH2 = main.querySelector('h2');
  const firstSection = main.querySelector('section');
  let best = 0, bestText = '';
  for (const el of ctas) {
    let s = 20;
    const t = textOf(el).slice(0, 80);
    // Element is above fold if it's in the first section OR appears BEFORE the first H2
    // (DOCUMENT_POSITION_PRECEDING means the firstH2 comes after this element)
    const isBeforeH2 = firstH2 ? (el.compareDocumentPosition(firstH2) & Node.DOCUMENT_POSITION_PRECEDING) : true;
    const inFirstSection = firstSection && firstSection.contains(el);
    if (inFirstSection || isBeforeH2) s += 35;
    const style = (el.getAttribute('style') || '').toLowerCase();
    const cls = (el.className || '').toString().toLowerCase();
    if (/min-height\s*:\s*(4[4-9]|[5-9]\d)px/.test(style) || /padding\s*:\s*(1[2-9]|[2-9]\d)px/.test(style) || /(btn|button|cta|large)/.test(cls)) s += 30;
    if (!(/text-white/.test(cls) && /bg-white/.test(cls)) && !(/text-black/.test(cls) && /bg-black/.test(cls))) s += 15;
    if (s > best) { best = s; bestText = t; }
  }
  return { score: clamp(best), evidence: [`Most visible CTA: "${bestText}"`], detail: 'Static HTML proxy — rendered above-fold and true contrast require a live browser' };
}

export function analyzeValueFirst(doc) {
  const text = textOf(mainRoot(doc));
  const words = text.split(/\s+/).filter(Boolean).slice(0, 150).join(' ');
  const hits = [];
  for (const p of VALUE_FIRST_PATTERNS) {
    const m = words.match(p);
    if (m) hits.push(m[0].toLowerCase());
  }
  return { score: clamp(hits.length * 12), evidence: hits.length ? [`Benefit phrases: ${[...new Set(hits)].slice(0,6).join(', ')}`] : ['No benefit-first phrasing in first 150 words'], detail: hits.length ? `${hits.length} value-first pattern(s) in opening copy` : 'Opening copy is feature/company-first' };
}

export function analyzeFrictionValue(doc) {
  const fields = [...doc.querySelectorAll('input, select, textarea')].filter(visible).filter(el => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    return type !== 'hidden' && type !== 'search';
  }).length;
  const main = mainRoot(doc);
  const valueProps = [...main.querySelectorAll('li, strong, [class*="benefit"], [class*="feature"], [class*="card"]')]
    .filter(el => { const t = textOf(el); return t.length > 15 && t.length < 220; }).length;
  const ratio = valueProps > 0 ? fields / valueProps : fields > 0 ? 2 : 0.5;
  const score = clamp(100 - Math.round(ratio * 22));
  return { score, evidence: [`${fields} form field(s)`, `${valueProps} value prop(s)`, `ratio ${ratio.toFixed(2)}`], detail: fields === 0 ? 'No form friction detected' : `${fields} field(s) vs ${valueProps} value prop(s)` };
}

export function analyzeCommitmentLadder(doc) {
  const ctas = ctaCandidates(doc);
  const low = /newsletter|subscribe|free guide|download|checklist|template/i;
  const med = /free tool|free audit|trial|calculator|demo|sample|simulation/i;
  const high = /buy|purchase|pricing|contact sales|book a call|upgrade|pro plan|sign up|create account/i;
  const levels = new Set();
  for (const el of ctas) {
    const t = textOf(el);
    if (low.test(t)) levels.add('low');
    if (med.test(t)) levels.add('medium');
    if (high.test(t)) levels.add('high');
  }
  const score = levels.size >= 3 ? 100 : levels.size === 2 ? 70 : levels.size === 1 ? 40 : 0;
  return { score, evidence: [`Levels present: ${[...levels].join(', ') || 'none'}`], detail: `${levels.size} of 3 commitment levels (low → medium → high)` };
}

export function analyzeReciprocity(doc) {
  const text = textOf(mainRoot(doc));
  const hits = [];
  for (const p of RECIPROCITY_PATTERNS) {
    const m = text.match(p);
    if (m) hits.push(m[0].toLowerCase());
  }
  const downloadLinks = [...doc.querySelectorAll('a[download]')].length;
  return { score: clamp(hits.length * 18 + (downloadLinks > 0 ? 15 : 0)), evidence: hits.length ? [`Free-value: ${[...new Set(hits)].slice(0,5).join(', ')}`] : ['No free-value offer detected'], detail: `${hits.length} reciprocity pattern(s)${downloadLinks ? ` + ${downloadLinks} download(s)` : ''}` };
}

export function analyzeSocialProof(doc, rawHtml = '') {
  const main = mainRoot(doc);
  const proofs = [
    ...main.querySelectorAll('blockquote, [class*="testimonial"], [class*="review"], [itemprop="review"], [class*="quote"]'),
    ...main.querySelectorAll('[class*="logo"], img[alt*="logo" i], img[alt*="client" i]'),
    ...main.querySelectorAll('[class*="award"], [class*="mention"], [class*="press"]')
  ];
  const html = getSchemaText(doc, rawHtml);
  const schemaReviews = /"@type"\s*:\s*"(Review|AggregateRating)"/.test(html);
  const sameAs = (html.match(/"sameAs"\s*:/g) || []).length;
  const citation = (html.match(/"citation"\s*:/g) || []).length;
  const hasOrg = /"@type"\s*:\s*"Organization"/.test(html);
  const hasAuthor = /"author"\s*:\s*\{/.test(html);
  const stars = [...main.querySelectorAll('[class*="star"], [aria-label*="star" i], [aria-label*="rating" i]')].length;

  let proximityBonus = 0;
  const ctas = ctaCandidates(doc);
  for (const p of proofs.slice(0, 12)) {
    for (const c of ctas.slice(0, 8)) {
      let a = p.parentElement, depth = 0;
      while (a && depth < 4) {
        if (a.contains(c) && a !== main) { proximityBonus += 12; break; }
        a = a.parentElement; depth++;
      }
    }
  }

  const count = proofs.length + (schemaReviews ? 3 : 0) + Math.min(stars, 3) +
                Math.min(sameAs, 6) + Math.min(citation, 6) +
                (hasOrg ? 2 : 0) + (hasAuthor ? 2 : 0);

  return {
    score: clamp(count * 10 + proximityBonus),
    evidence: [
      `${proofs.length} proof element(s)`,
      schemaReviews ? 'Review/AggregateRating schema' : 'No review schema',
      sameAs > 0 ? `${sameAs} sameAs link(s)` : 'No sameAs',
      citation > 0 ? `${citation} citation(s)` : 'No citations',
      hasOrg ? 'Organization schema' : 'No Organization schema',
      hasAuthor ? 'author attribution' : 'No author'
    ].filter(Boolean),
    detail: `${count} proof signal(s)${proximityBonus ? `; proximity +${proximityBonus}` : ''}`
  };
}

export function analyzeTrustAnchors(doc) {
  const text = textOf(mainRoot(doc));
  const hits = [];
  for (const p of TRUST_PATTERNS) {
    const m = text.match(p);
    if (m) hits.push(m[0].toLowerCase());
  }
  return { score: clamp(hits.length * 14), evidence: hits.length ? [`Trust anchors: ${[...new Set(hits)].slice(0,8).join(', ')}`] : ['No trust anchors detected'], detail: `${hits.length} distinct trust pattern(s)` };
}

export function analyzeUrgency(doc) {
  const text = textOf(mainRoot(doc)).toLowerCase();
  const countdown = !!mainRoot(doc).querySelector('[class*="countdown"], [data-countdown]');
  const deadline = /(ends|expires|last chance|limited time|only \d+ left|today only)/i.test(text);
  const specificDate = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i.test(text);
  if (!countdown && !deadline) return { score: 60, status: 'none', evidence: ['No urgency pattern detected'], detail: 'No urgency — neutral' };
  if (specificDate) return { score: 85, status: 'ethical', evidence: ['Specific date/deadline found'], detail: 'Urgency tied to concrete date' };
  if (deadline && !specificDate) return { score: 50, status: 'review', evidence: ['Generic deadline phrase found'], detail: 'Urgency phrase without specific date' };
  return { score: 30, status: 'flagged', evidence: ['Countdown/scarcity without concrete deadline'], detail: 'Artificial urgency — flag for review' };
}

export function analyzeHeadings(doc) {
  const headings = [...doc.querySelectorAll('h1, h2')].map(textOf).filter(Boolean);
  if (!headings.length) return { score: 0, evidence: ['No H1/H2 found'], detail: 'No headings' };
  const action = headings.filter(h => {
    const first = h.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, '');
    return ACTION_HEADING_VERBS.includes(first) || ACTION_HEADING_VERBS.some(v => h.toLowerCase().includes(` ${v} `));
  });
  const passive = headings.filter(h => PASSIVE_HEADINGS.some(p => h.toLowerCase().startsWith(p)));
  const rawScore = Math.round((action.length / headings.length) * 100);
  let score = rawScore;
  if (headings.length >= 10) score = Math.max(25, score);
  if (headings.length >= 15) score = Math.max(40, score);
  return { score: clamp(score), evidence: [`${action.length} action-oriented`, `${passive.length} passive/about`, headings.length >= 10 ? 'Floor applied (10+ headings)' : ''].filter(Boolean), detail: `${action.length} action vs ${passive.length} passive of ${headings.length}` };
}

export function analyzeListPresence(doc) {
  const lists = mainRoot(doc).querySelectorAll('ul, ol, dl').length;
  return { score: clamp(lists * 15), evidence: [`${lists} list(s) in main content`], detail: `${lists} list(s) — lists correlate with citation-worthiness` };
}

export function analyzeSourcedStats(doc) {
  const html = mainRoot(doc).innerHTML;
  const regex = /\b\d+(?:\.\d+)?%?\b[^<]{0,100}(?:according to|study|report|source|survey|\(|<a\b)/gi;
  const matches = [...html.matchAll(regex)].slice(0, 20);
  return { score: clamp(matches.length * 12), evidence: matches.length ? [`${matches.length} sourced statistic(s)`] : ['No sourced statistics found'], detail: `${matches.length} number(s) with source/citation cue` };
}

export function analyzeDefinitionalClarity(doc, rawHtml = '') {
  const main = mainRoot(doc);
  const paras = [...main.querySelectorAll('p')].slice(0, 5);
  const text = paras.map(p => textOf(p)).join(' ').slice(0, 900).toLowerCase();
  const isDef = /\b(is|are|refers to|means|defined as|stands for)\s+(a|an|the)\b/i.test(text);
  const html = getSchemaText(doc, rawHtml);
  const schemaDesc = /"(description|definition)"\s*:\s*"[^"]{40,}/.test(html);
  const whatIs = [...main.querySelectorAll('h1, h2, h3')].some(h => /what is|what are|definition|overview/i.test(textOf(h)));
  const hasFAQ = /"@type"\s*:\s*"FAQPage"/.test(html);

  let score = 25;
  const evidence = [];
  if (isDef) { score = 100; evidence.push('Definitional statement in opening'); }
  else if (schemaDesc && whatIs) { score = 90; evidence.push('Schema description + what-is heading'); }
  else if (schemaDesc) { score = 70; evidence.push('Schema description serves as definition'); }
  else if (whatIs) { score = 55; evidence.push('What-is heading found'); }
  else if (hasFAQ) { score = 45; evidence.push('FAQ schema provides implicit definition'); }
  else evidence.push('No clear definition found');
  return { score, evidence, detail: score >= 70 ? 'Opening copy defines the subject' : 'Definition not explicit in opening' };
}

export function analyzeFAQ(doc, rawHtml = '') {
  const html = getSchemaText(doc, rawHtml);
  const hasSchema = /"@type"\s*:\s*"FAQPage"/.test(html);
  const faqHeading = [...doc.querySelectorAll('h2, h3')].some(h => /\b(faq|frequently asked|questions|q&a)\b/i.test(textOf(h)));
  const details = doc.querySelectorAll('details').length;
  let score = 20;
  if (hasSchema) score += 40;
  if (faqHeading) score += 30;
  if (details >= 2) score += 20;
  return { score: clamp(score), evidence: [hasSchema ? 'FAQPage schema' : 'No FAQPage schema', faqHeading ? 'FAQ heading' : 'No FAQ heading', `${details} <details> Q&A block(s)`], detail: 'FAQ schema is a signal, not a guarantee — lists and sourced stats matter more' };
}

export function analyzeStructuredData(doc, rawHtml = '') {
  const html = getSchemaText(doc, rawHtml);
  const types = ['Article','WebPage','WebSite','FAQPage','HowTo','DefinedTerm','Organization','Person','Book','SoftwareApplication','Review','AggregateRating','BreadcrumbList','Product'];
  const found = types.filter(t => new RegExp(`"@type"\\s*:\\s*"${t}"`).test(html));
  const hasJsonLd = /<script[^>]+application\/ld\+json/i.test(html);
  const evidence = [`Schema types: ${found.join(', ') || 'none'}`];
  if (found.length > 0) {
    evidence.push('JSON-LD structured data detected');
  } else if (!hasJsonLd) {
    evidence.push('No <script type="application/ld+json"> found');
    evidence.push('⚠️ Proxy may be stripping <script> tags — structured data cannot be verified');
  }
  return { score: clamp(found.length * 15), evidence, detail: `${found.length} schema type(s) detected` };
}

export function analyzeAll(doc, rawHtml = '') {
  const html = getSchemaText(doc, rawHtml);
  return {
    ctaSpecificity: analyzeCTASpecificity(doc),
    ctaVisibility: analyzeCTAVisibility(doc),
    valueFirst: analyzeValueFirst(doc),
    frictionValue: analyzeFrictionValue(doc),
    commitment: analyzeCommitmentLadder(doc),
    reciprocity: analyzeReciprocity(doc),
    socialProof: analyzeSocialProof(doc, html),
    trust: analyzeTrustAnchors(doc),
    urgency: analyzeUrgency(doc),
    headings: analyzeHeadings(doc),
    listPresence: analyzeListPresence(doc),
    sourcedStats: analyzeSourcedStats(doc),
    definitional: analyzeDefinitionalClarity(doc, html),
    faq: analyzeFAQ(doc, html),
    structuredData: analyzeStructuredData(doc, html)
  };
}
