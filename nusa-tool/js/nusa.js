// NUSA — Phase 1
// Real Citation Chamber + per-finding fix generation.
// All Phase 0.5 module imports and narration logic preserved.

const WORKERS = {
  render: 'https://full-render-v2.traffictorch.workers.dev/',
  ask:    'https://ask-traffic-torch-ai.traffictorch.workers.dev/',
  fixes:  'https://homepage-cms-fixes.traffictorch.workers.dev/'
};
const NUSA_PATCH = 'https://nusa-patch.traffictorch.workers.dev/';

import { calculateReadability }  from './modules/quit-risk/readability.js';
import { calculateNavigation }   from './modules/quit-risk/navigation.js';
import { calculateAccessibility }from './modules/quit-risk/accessibility.js';
import { calculateMobile }       from './modules/quit-risk/mobile.js';
import { calculatePerformance }  from './modules/quit-risk/performance.js';

import { analyzeExperience }         from './modules/seo-intent/experience.js';
import { analyzeExpertise }          from './modules/seo-intent/expertise.js';
import { analyzeAuthoritativeness }  from './modules/seo-intent/authoritativeness.js';
import { analyzeTrustworthiness }    from './modules/seo-intent/trustworthiness.js';
import { analyzeDepth }              from './modules/seo-intent/depth.js';
import { analyzeReadability as analyzeSEOReadability } from './modules/seo-intent/readability.js';
import { analyzeSchema }             from './modules/seo-intent/schema.js';

import { computeAnswerability }      from './modules/aeo/answerability.js';
import { computeStructuredData }     from './modules/aeo/structuredData.js';
import { computeEEAT }               from './modules/aeo/eeatSignals.js';
import { computeScannability }       from './modules/aeo/scannability.js';
import { computeConversational }     from './modules/aeo/conversationalTone.js';
import { computeReadability as computeAIReadability } from './modules/aeo/readability.js';
import { computeUniqueInsights }     from './modules/aeo/uniqueInsights.js';
import { computeAntiAiSafety }       from './modules/aeo/antiAiSafety.js';

import { detectCMS } from './vendor/cms-detect.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const narration = $('narration');
const ledger = $('ledger');

let t0 = performance.now();
const ms = () => Math.round(performance.now() - t0);
let findingSeq = 0;
const allFindings = [];

function renderCodeBlocks(text) {
  if (text == null) return '';
  let s = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${(lang||'plaintext').toLowerCase()}">${code.replace(/\s+$/,'')}</code></pre>`);
  s = s.replace(/(<pre[\s\S]*?<\/pre>)|(\r?\n)/g, (_, pre) => pre || '<br>');
  s = s.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
  return s;
}

function narrate(text, opts = {}) {
  const { finding = null, anchor = false, ts = true } = opts;
  const p = el('p', finding ? 'finding' : anchor ? 'anchor' : '');
  if (ts) {
    const t = el('span', 'ts', `[${String(ms()).padStart(5,'0')}ms]`);
    p.appendChild(t);
  }
  if (finding) {
    const bolt = el('span', 'bolt', '✦');
    bolt.title = 'fix this';
    bolt.addEventListener('click', ev => { ev.stopPropagation(); proposeFix(finding); });
    p.appendChild(bolt);
  }
  p.appendChild(document.createTextNode(text));
  if (finding) {
    p.addEventListener('click', () => {
      const row = ledger.querySelector(`[data-fid="${finding.id}"]`);
      if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.classList.add('pulse'); setTimeout(()=>row.classList.remove('pulse'), 600); }
    });
  }
  narration.appendChild(p);
  narration.scrollTop = narration.scrollHeight;
}

function ledgerAdd({ id, status, node, label }) {
  const row = el('div', 'ledger-row');
  row.dataset.fid = id;
  row.innerHTML = `<span class="ledger-dot ${status}"></span>
    <span class="ledger-label">${escapeHtml(label)}</span>
    <span class="ledger-node">${escapeHtml(node || '')}</span>`;
  ledger.appendChild(row);
  $('ledger-count').textContent = ledger.children.length;
  return row;
}

function recordFinding({ cat, status, node, label, severity = 5 }) {
  const id = `f${findingSeq++}`;
  const statusClass = cat === 'AEO' ? 'aeo' : (status === 'fail' ? 'fail' : status === 'warn' ? 'warn' : 'pass');
  ledgerAdd({ id, status: statusClass, node, label: `[${cat}] ${label}` });
  const f = { id, cat, status, node, label, severity };
  allFindings.push(f);
  narrate(`${label}.`, { finding: f });
  return f;
}

function startRuler() {
  const ruler = $('ruler');
  ruler.classList.remove('hidden');
  const ph = $('playhead');
  let pct = 0;
  const id = setInterval(() => {
    pct = Math.min(100, pct + 1.4 + Math.random() * 0.6);
    ph.style.transform = `translateX(${pct}%)`;
    if (pct >= 100) clearInterval(id);
  }, 70);
  return () => { clearInterval(id); ph.style.transform = 'translateX(100%)'; };
}

function getUXContent(doc) {
  const textElements = doc.querySelectorAll('p, li, article, section, main, div');
  let fullText = '', paragraphTexts = [], boldCount = 0, listItemCount = 0;
  textElements.forEach(el => {
    const t = el.textContent.trim();
    if (t.length > 15) {
      fullText += t + ' ';
      if (el.tagName === 'P') paragraphTexts.push(t);
    }
    boldCount += el.querySelectorAll('b, strong').length;
    if (el.tagName === 'UL' || el.tagName === 'OL') listItemCount += el.querySelectorAll('li').length;
  });
  const links = doc.querySelectorAll('a[href]');
  const images = doc.querySelectorAll('img');
  const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
  let missing = 0, decorative = 0, meaningful = 0;
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    const isDecorative = img.classList.contains('decorative') ||
                         img.getAttribute('role') === 'presentation' ||
                         (alt !== null && alt.trim() === '' && !img.hasAttribute('title'));
    if (isDecorative) decorative++;
    else { meaningful++; if (alt === null || alt.trim() === '') missing++; }
  });
  const countWords = t => t.trim().split(/\s+/).filter(w => w.length > 0).length;
  return {
    fullText, wordCount: countWords(fullText),
    linkCount: links.length, imageCount: images.length,
    altData: { missingCount: missing, meaningfulCount: meaningful, decorativeCount: decorative, totalImages: images.length },
    headingCount: headings.length,
    hasViewport: !!(doc.querySelector('meta[name="viewport"]')?.content || '').match(/width\s*=\s*device-width/i),
    hasMain: !!doc.querySelector('main'),
    hasArticleOrSection: !!doc.querySelector('article, section'),
    paragraphTexts, boldCount, listItemCount,
    hasBreadcrumb: !!doc.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]'),
    hasLandmarks: !!doc.querySelector('header, footer, aside, [role="banner"], [role="contentinfo"], [role="complementary"]'),
    hasAriaLabels: !!doc.querySelector('[aria-label], [aria-labelledby]'),
    hasManifest: !!doc.querySelector('link[rel="manifest"]'),
    hasServiceWorkerHint: doc.body.innerHTML.includes('serviceWorker') || doc.body.innerHTML.includes('register('),
    hasAppleTouchIcon: !!doc.querySelector('link[rel*="apple-touch-icon"]'),
    hasLazyLoading: (() => {
      const all = doc.querySelectorAll('img[src]');
      const lazy = doc.querySelectorAll('img[loading="lazy"]');
      return all.length > 0 && lazy.length >= 2 && (lazy.length / all.length) * 100 >= 40;
    })(),
    externalScripts: doc.querySelectorAll('script[src^="http"]').length,
    hasRenderBlocking: doc.querySelectorAll('script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])').length,
    fontCount: doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').length,
    hasFontDisplaySwap: /font-display\s*:\s*swap/.test(doc.head.innerHTML),
    hasWebpOrAvif: !!doc.querySelector('img[src$=".webp"], img[src$=".avif"], source[type="image/webp"], source[type="image/avif"]'),
    potentialCTAs: doc.querySelectorAll('a[href*="contact"], a[href*="book"], a[href*="demo"], a[href*="buy"], button, [role="button"], .btn, .button').length,
    viewportContent: doc.querySelector('meta[name="viewport"]')?.content || '',
    hasDropdowns: !!doc.querySelector('nav li ul, .dropdown, [aria-haspopup="true"]'),
    topLevelItems: doc.querySelectorAll('nav > ul > li, .main-menu > li, header nav > ul > li').length || 0
  };
}

function getVisibleText(root) {
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName.toLowerCase();
      if (['script','style','noscript','head','iframe','object','embed'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (p.hasAttribute('hidden') || p.getAttribute('aria-hidden') === 'true') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) text += walker.currentNode.textContent + ' ';
  return text.trim();
}

async function runAudit(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
  narration.innerHTML = '';
  ledger.innerHTML = '';
  allFindings.length = 0;
  findingSeq = 0;
  $('ledger-count').textContent = '0';
  $('stage').classList.remove('hidden');
  $('chamber').classList.add('hidden');
  $('status').textContent = 'auditing';
  $('foot-meta').textContent = url;

  t0 = performance.now();
  const stopRuler = startRuler();

  narrate(`Opening ${url} via edge render.`, { anchor: true });
  await sleep(200);

  let html;
  try {
    const res = await fetch(WORKERS.render + '?url=' + encodeURIComponent(url));
    if (!res.ok) throw new Error(`render worker ${res.status}`);
    html = await res.text();
  } catch (e) {
    narrate(`Could not reach the page — ${e.message}.`, { anchor: true });
    $('status').textContent = 'error';
    stopRuler();
    return;
  }
  narrate(`Rendered ${html.length.toLocaleString()} chars. Parsing DOM.`);

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const cmsInfo = detectCMS({ doc, html, url });
  narrate(`CMS detected: ${cmsInfo.name}${cmsInfo.version ? ' ' + cmsInfo.version : ''} (${cmsInfo.confidence}).`);

  narrate(`Running UX pass.`, { anchor: true });
  await sleep(150);
  const uxData = getUXContent(doc);
  const uxScores = {
    readability:   calculateReadability(uxData).score,
    navigation:    calculateNavigation(uxData).score,
    accessibility: calculateAccessibility(uxData).score,
    mobile:        calculateMobile(uxData).score,
    performance:   calculatePerformance(uxData).score
  };
  const uxOverall = Math.round(Object.values(uxScores).reduce((a,b)=>a+b,0) / 5);
  narrate(`UX modules complete — readability ${uxScores.readability}, navigation ${uxScores.navigation}, accessibility ${uxScores.accessibility}, mobile ${uxScores.mobile}, performance ${uxScores.performance}.`);
  await sleep(180);

  if (uxData.altData.missingCount > 0) recordFinding({ cat:'UX', status:'fail', node:`${uxData.altData.missingCount}/${uxData.altData.totalImages} img`, label:`${uxData.altData.missingCount} image${uxData.altData.missingCount>1?'s':''} missing alt text`, severity:6 });
  if (!uxData.hasViewport) recordFinding({ cat:'UX', status:'fail', node:'meta[viewport]', label:'No responsive viewport meta tag', severity:8 });
  if (uxScores.readability < 60) recordFinding({ cat:'UX', status:'warn', node:'<p> content', label:`Readability weak (${uxScores.readability}/100)`, severity:5 });
  if (uxScores.accessibility < 75) recordFinding({ cat:'UX', status:'fail', node:'a11y', label:`Accessibility below WCAG AA proxy (${uxScores.accessibility}/100)`, severity:7 });
  if (!uxData.hasLandmarks) recordFinding({ cat:'UX', status:'warn', node:'<header>/<footer>', label:'Missing semantic landmarks', severity:4 });
  if (uxData.hasRenderBlocking > 3) recordFinding({ cat:'UX', status:'warn', node:`${uxData.hasRenderBlocking} resources`, label:`${uxData.hasRenderBlocking} render-blocking resources`, severity:5 });

  narrate(`Running SEO pass.`, { anchor: true });
  await sleep(150);

  const cleanedText = getVisibleText(doc.body).replace(/\s+/g, ' ').trim();
  const seoConfig = {
    parsing: {
      authorBylineSelectors: ['meta[name="author" i]','[rel="author"]','.author','.byline','[itemprop="author"]','[class*="author" i]'],
      authorBioSelectors: ['.author-bio','.bio','[class*="bio" i]','.about-author','.author-box','.author-info'],
      contactLinkSelectors: ['a[href*="/contact" i]','a[href*="mailto:" i]'],
      policyLinkSelectors: ['a[href*="/privacy" i]','a[href*="/terms" i]'],
      updateDateSelectors: ['time[datetime]','meta[property="article:modified_time"]','meta[property="og:updated_time"]']
    }
  };
  const seoModules = [
    analyzeExperience(cleanedText, doc),
    analyzeExpertise(doc, cleanedText, seoConfig),
    analyzeAuthoritativeness(doc, cleanedText),
    analyzeTrustworthiness(url, doc, seoConfig, cleanedText),
    { score: analyzeDepth(cleanedText).normalized },
    { score: analyzeSEOReadability(cleanedText).normalized },
    { score: analyzeSchema(doc.documentElement.outerHTML, doc).normalized }
  ];
  const seoOverall = Math.round(seoModules.reduce((s, m) => s + (m.score||0), 0) / seoModules.length);
  narrate(`SEO modules complete — overall proxy ${seoOverall}.`);
  await sleep(180);

  const title = doc.title || '';
  if (!title) recordFinding({ cat:'SEO', status:'fail', node:'<title>', label:'Missing page title', severity:9 });
  else if (title.length > 60) recordFinding({ cat:'SEO', status:'warn', node:'<title>', label:`Title is ${title.length} chars (60 max)`, severity:4 });
  const desc = doc.querySelector('meta[name="description"]')?.content || '';
  if (!desc) recordFinding({ cat:'SEO', status:'fail', node:'meta[desc]', label:'Missing meta description', severity:7 });
  else if (desc.length > 160) recordFinding({ cat:'SEO', status:'warn', node:'meta[desc]', label:`Meta description ${desc.length} chars (160 max)`, severity:3 });
  const h1s = doc.querySelectorAll('h1');
  if (h1s.length === 0) recordFinding({ cat:'SEO', status:'fail', node:'<h1>', label:'No H1 on page', severity:8 });
  else if (h1s.length > 1) recordFinding({ cat:'SEO', status:'warn', node:'<h1>', label:`${h1s.length} H1s on page (should be 1)`, severity:4 });
  if (seoOverall < 60) recordFinding({ cat:'SEO', status:'warn', node:'E-E-A-T', label:`E-E-A-T signals thin (proxy ${seoOverall}/100)`, severity:6 });

  narrate(`Running AEO pass.`, { anchor: true });
  await sleep(150);

  const candidates = [doc.querySelector('article'), doc.querySelector('main'), doc.querySelector('[role="main"]'), doc.body];
  const mainEl = candidates.find(el => el && el.textContent.trim().length > 1000) || doc.body;
  const mainClone = mainEl.cloneNode(true);
  mainClone.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie, .sidebar').forEach(el => el.remove());
  const mainText = mainClone.textContent.replace(/\s+/g, ' ').trim();
  const first1200 = mainText.slice(0, 1200);

  const aeoModules = [
    computeAnswerability(doc, first1200),
    computeStructuredData(doc),
    computeEEAT(doc, url),
    computeScannability(doc, mainEl),
    computeConversational(mainText),
    computeAIReadability(mainText),
    computeUniqueInsights(mainText, mainText.split(/\s+/).length),
    computeAntiAiSafety(mainText, 0)
  ];
  const aeoWeights = [0.25, 0.15, 0.15, 0.10, 0.12, 0.10, 0.08, 0.05];
  const aeoOverall = Math.round(aeoModules.reduce((s, m, i) => s + (m.score||0) * aeoWeights[i], 0));
  narrate(`AEO modules complete — Citational Readiness proxy ${aeoOverall}.`);
  await sleep(180);

  const ld = doc.querySelectorAll('script[type="application/ld+json"]');
  if (ld.length === 0) recordFinding({ cat:'AEO', status:'fail', node:'JSON-LD', label:'No structured data — answer engines can\'t parse this', severity:8 });
  else narrate(`Found ${ld.length} JSON-LD block${ld.length>1?'s':''}.`);

  try {
    const r = await fetch(new URL('/llms.txt', url).toString(), { method: 'HEAD', mode: 'no-cors' });
    if (r.type === 'opaque') throw new Error('cross-origin');
    if (!r.ok) recordFinding({ cat:'AEO', status:'warn', node:'/llms.txt', label:'No llms.txt — agents will re-crawl per query', severity:5 });
    else narrate('llms.txt present — good agent signal.');
  } catch {
    recordFinding({ cat:'AEO', status:'warn', node:'/llms.txt', label:'No llms.txt detected (or cross-origin block)', severity:4 });
  }

  const hasAuthor = !!doc.querySelector('[rel="author"],[itemprop="author"],meta[name="author"],.author,.byline');
  const hasDate = !!doc.querySelector('time[datetime],meta[property="article:published_time"],meta[property="article:modified_time"]');
  if (!hasAuthor) recordFinding({ cat:'AEO', status:'fail', node:'byline', label:'No visible author byline — E-E-A-T hit', severity:7 });
  if (!hasDate) recordFinding({ cat:'AEO', status:'fail', node:'<time>', label:'No publish/update date', severity:6 });
  if (!/"@type"\s*:\s*"FAQPage"/.test(html)) recordFinding({ cat:'AEO', status:'warn', node:'FAQPage', label:'No FAQPage schema — weaker answer surface', severity:5 });

  narrate(`Audit settled. ${allFindings.length} finding${allFindings.length!==1?'s':''}. Ready for interrogation.`, { anchor: true });
  $('status').textContent = 'settled';
  stopRuler();
  $('chamber').classList.remove('hidden');
  $('foot-meta').textContent = `${url}  ·  ${allFindings.length} findings  ·  ${cmsInfo.name}`;

  window._nusa = {
    url, doc, html, cmsInfo,
    findings: allFindings,
    scores: { ux: uxScores, uxOverall, seoOverall, aeoOverall }
  };
}

// ---------- fix proposal (real, via CMS fixes worker) ----------
async function proposeFix(finding) {
  const ctx = window._nusa;
  if (!ctx) return;
  narrate(`✦ generating a fix for: ${finding.label}`, { ts: false });
  try {
    const res = await fetch(NUSA_PATCH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: ctx.url,
        pageTitle: ctx.doc?.title || null,
        cms: { name: ctx.cmsInfo?.name, version: ctx.cmsInfo?.version, confidence: ctx.cmsInfo?.confidence },
        finding: { cat: finding.cat, label: finding.label, node: finding.node, severity: finding.severity }
      })
    });
    const data = await res.json();
    if (!data.success) {
      narrate(`  fix worker error: ${data.error || 'unknown'}`, { ts: false });
      return;
    }
    finding.patchScript = data.patchScript;
    finding.applicable = data.applicable;
    finding.patchReason = data.reason || null;
    const block = el('div', 'fix-block');
    block.dataset.findingId = finding.id;
    block.innerHTML = `<span class="bolt-head">✦ fix · ${escapeHtml(finding.cat)} · ${escapeHtml(finding.node)}</span>${renderCodeBlocks(data.prose)}`;
    narration.appendChild(block);
    narration.scrollTop = narration.scrollHeight;
  } catch (err) {
    narrate(`  fix failed: ${err.message}`, { ts: false });
  }
}

// ---------- Ask NUSA (unchanged) ----------
$('ask-form').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('ask-input').value.trim();
  if (!q) return;
  $('ask-input').value = '';
  narrate(`you: ${q}`, { ts: false });
  const ctx = window._nusa || {};
  try {
    const res = await fetch(WORKERS.ask, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        auditData: {
          url: ctx.url || '',
          pageTitle: ctx.doc?.title || '',
          cms: { name: ctx.cmsInfo?.name, version: ctx.cmsInfo?.version, confidence: ctx.cmsInfo?.confidence },
          overallScore: null,
          failedItems: (ctx.findings || []).filter(f => f.status === 'fail').map(f => `[${f.cat}] ${f.label}`),
          scores: ctx.scores || {}
        }
      })
    });
    const data = await res.json();
    narrate(`nusa: ${data.answer || data.error || 'no answer returned'}`, { ts: false });
  } catch (err) {
    narrate(`nusa: request failed — ${err.message}`, { ts: false });
  }
});

// ---------- Citation Chamber (real, three simulated engines) ----------
$('chamber-form').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('chamber-input').value.trim();
  const ctx = window._nusa;
  if (!q || !ctx) return;
  const out = $('chamber-out');
  out.innerHTML = '';
  const pageText = (ctx.doc?.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  const engines = [
    { name: 'ChatGPT',     instr: 'Strict extractor mode. Answer the question using ONLY sentences that appear verbatim in the page content. If the answer is not present verbatim, respond exactly: CANNOT ANSWER: not in extractable text.' },
    { name: 'Perplexity',  instr: 'Citation retrieval mode. Answer the question and list the exact sentences you would cite as sources. If nothing is citable, respond exactly: CANNOT CITE: no extractable sentences.' },
    { name: 'AI Overview', instr: 'Summariser mode. Give a short summary answer if the page mentions this at all. End your response with a line: Confidence: high | medium | low' }
  ];
  const results = [];
  for (const engine of engines) {
    const row = el('div', 'engine');
    row.innerHTML = `<span class="name">${engine.name}</span><span class="verdict warn">…</span><span class="body">simulating</span>`;
    out.appendChild(row);
    const wrapped = `[SIMULATION: ${engine.name} answer engine]\n\n${engine.instr}\n\n--- PAGE CONTENT START ---\n${pageText}\n--- PAGE CONTENT END ---\n\nQuestion: ${q}`;
    try {
      const res = await fetch(WORKERS.ask, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: wrapped,
          auditData: {
            url: ctx.url,
            pageTitle: ctx.doc?.title || '',
            cms: { name: ctx.cmsInfo?.name, version: ctx.cmsInfo?.version, confidence: ctx.cmsInfo?.confidence },
            failedItems: ctx.findings.filter(f => f.status === 'fail').map(f => `[${f.cat}] ${f.label}`),
            scores: ctx.scores
          }
        })
      });
      const data = await res.json();
      const answer = (data.answer || '').trim();
      const isFail = /CANNOT (ANSWER|CITE)/i.test(answer) || /not in extractable/i.test(answer);
      const isWarn = /confidence:\s*low/i.test(answer);
      const verdict = isFail ? 'fail' : isWarn ? 'warn' : 'pass';
      row.querySelector('.verdict').className = `verdict ${verdict}`;
      row.querySelector('.verdict').textContent = verdict === 'pass' ? '✓' : verdict === 'warn' ? '~' : '✗';
      row.querySelector('.body').textContent = answer.slice(0, 280) || '(empty response)';
      results.push({ name: engine.name, verdict, answer });
    } catch (err) {
      row.querySelector('.verdict').className = 'verdict fail';
      row.querySelector('.verdict').textContent = '✗';
      row.querySelector('.body').textContent = `error: ${err.message}`;
      results.push({ name: engine.name, verdict: 'fail', answer: err.message });
    }
  }

  const gapBox = el('div', 'gap');
  out.appendChild(gapBox);
  const failCount = results.filter(r => r.verdict === 'fail').length;
  if (failCount === 0) {
    gapBox.innerHTML = `<span class="label">Citation ready</span>All three engines can answer this question from the page.`;
    return;
  }
  gapBox.innerHTML = `<span class="label">Citation gap</span><em>Analysing…</em>`;
  try {
    const gapQ = `A page currently cannot answer this question: "${q}". Write ONE factual sentence in the page's existing tone that the page should add so all three engines (ChatGPT, Perplexity, AI Overview) will cite it. Output only the sentence, no preamble, no quotes.`;
    const res = await fetch(WORKERS.ask, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: gapQ,
        auditData: {
          url: ctx.url,
          pageTitle: ctx.doc?.title || '',
          pageExcerpt: pageText.slice(0, 1000),
          failedItems: ctx.findings.filter(f => f.status === 'fail').map(f => `[${f.cat}] ${f.label}`)
        }
      })
    });
    const data = await res.json();
    const sentence = (data.answer || '').trim().replace(/^["']|["']$/g, '').slice(0, 500);
    gapBox.innerHTML = `<span class="label">Citation gap</span>${escapeHtml(sentence)}`;
  } catch (err) {
    gapBox.innerHTML = `<span class="label">Citation gap</span>Could not generate gap sentence: ${escapeHtml(err.message)}`;
  }
});

// ---------- boot ----------
$('url-form').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('url-input').value.trim();
  if (v) runAudit(v);
});

$('lite-toggle').addEventListener('click', () => {
  const b = $('lite-toggle');
  const on = b.classList.toggle('on');
  b.setAttribute('aria-pressed', on);
  document.documentElement.dataset.lite = on ? '1' : '0';
});
document.documentElement.dataset.lite = '1';

// ═══════════════════════════════════════════════════════════════════
// PHASE 2 — batch fixes, honest llms.txt, re-audit delta
// ═══════════════════════════════════════════════════════════════════

// --- honest llms.txt probe (replaces the no-cors lie) ---
// We keep the original probe in runAudit for now, but expose a corrective
// note when the response was opaque. Phase 2.1 will swap the whole check.
function markLlmsUnknown(finding) {
  if (!finding) return;
  finding.status = 'warn';
  finding.label = 'llms.txt status unknown (cross-origin, cannot verify)';
}

// --- batch fix generation ---
const fixCache = new Map();  // findingId -> fix text

async function runBatchFixes() {
  const ctx = window._nusa;
  if (!ctx || !ctx.findings.length) return;
  const btn = $('batch-fix');
  btn.disabled = true;
  btn.classList.add('busy');
  btn.textContent = '▸ generating fixes…';
  let n = 0;
  for (const f of ctx.findings) {
    if (fixCache.has(f.id)) { n++; continue; }
    narrate(`✦ [${n+1}/${ctx.findings.length}] generating fix: ${f.label}`, { ts: false });
    try {
      const res = await fetch(WORKERS.fixes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cms: ctx.cmsInfo?.name || 'Custom / Unknown',
          cmsVersion: ctx.cmsInfo?.version || null,
          cmsConfidence: ctx.cmsInfo?.confidence || 'unknown',
          cmsSignals: ctx.cmsInfo?.signals || [],
          url: ctx.url,
          pageTitle: ctx.doc?.title || null,
          overallScore: null,
          scores: ctx.scores || {},
          priorityFixes: [{
            module: f.cat,
            name: f.label,
            howToFix: `Fix the finding "${f.label}" — affected node: ${f.node}`
          }],
          mode: 'live-url'
        })
      });
      const data = await res.json();
      const body = data.success && data.answer ? data.answer : `worker error: ${data.error || 'unknown'}`;
      fixCache.set(f.id, body);
      const block = el('div', 'fix-block');
      block.dataset.findingId = f.id;
      block.innerHTML = `<span class="bolt-head">✦ fix · ${escapeHtml(f.cat)} · ${escapeHtml(f.node)}</span>${renderCodeBlocks(body)}`;
      narration.appendChild(block);
      narration.scrollTop = narration.scrollHeight;
    } catch (err) {
      narrate(`  fix failed for ${f.label}: ${err.message}`, { ts: false });
    }
    n++;
    await sleep(250);  // gentle pacing so we don't hammer the worker
  }
  btn.classList.remove('busy');
  btn.classList.add('done');
  btn.textContent = `▸ ${n} fixes generated`;
  btn.disabled = false;
}

// --- re-audit + delta ---
function snapshotFindings(findings) {
  return findings.map(f => `${f.cat}|${f.label}`).sort();
}

async function rerunAudit() {
  const ctx = window._nusa;
  if (!ctx) return;
  const btn = $('re-audit');
  btn.disabled = true;
  btn.classList.add('busy');
  btn.textContent = '▸ re-running…';

  const before = snapshotFindings(ctx.findings);
  narrate(`✦ re-running audit on ${ctx.url}…`, { ts: false, anchor: true });

  // re-fetch
  let html2;
  try {
    const res = await fetch(WORKERS.render + '?url=' + encodeURIComponent(ctx.url));
    if (!res.ok) throw new Error(`render worker ${res.status}`);
    html2 = await res.text();
  } catch (e) {
    narrate(`  re-run failed: ${e.message}`, { ts: false });
    btn.classList.remove('busy');
    btn.textContent = '▸ re-run audit';
    btn.disabled = false;
    return;
  }
  const doc2 = new DOMParser().parseFromString(html2, 'text/html');
  const findings2 = [];

  // light re-check — only the fast, deterministic ones
  const title2 = doc2.title || '';
  if (!title2) findings2.push({ cat:'SEO', label:'Missing page title', node:'<title>', status:'fail' });
  else if (title2.length > 60) findings2.push({ cat:'SEO', label:`Title is ${title2.length} chars (60 max)`, node:'<title>', status:'warn' });

  const desc2 = doc2.querySelector('meta[name="description"]')?.content || '';
  if (!desc2) findings2.push({ cat:'SEO', label:'Missing meta description', node:'meta[desc]', status:'fail' });

  const h1s2 = doc2.querySelectorAll('h1');
  if (h1s2.length === 0) findings2.push({ cat:'SEO', label:'No H1 on page', node:'<h1>', status:'fail' });
  else if (h1s2.length > 1) findings2.push({ cat:'SEO', label:`${h1s2.length} H1s on page (should be 1)`, node:'<h1>', status:'warn' });

  const imgs2 = doc2.querySelectorAll('img');
  let missing2 = 0;
  imgs2.forEach(i => { const a = i.getAttribute('alt'); if (a === null || a.trim() === '') missing2++; });
  if (missing2 > 0) findings2.push({ cat:'UX', label:`${missing2} image${missing2>1?'s':''} missing alt text`, node:`${imgs2.length} img`, status:'fail' });

  const rb2 = doc2.querySelectorAll('script:not([defer]):not([async]), link[rel="stylesheet"]:not([media])').length;
  if (rb2 > 3) findings2.push({ cat:'UX', label:`${rb2} render-blocking resources`, node:`${rb2} resources`, status:'warn' });

  const hasAuthor2 = !!doc2.querySelector('[rel="author"],[itemprop="author"],meta[name="author"],.author,.byline');
  if (!hasAuthor2) findings2.push({ cat:'AEO', label:'No visible author byline — E-E-A-T hit', node:'byline', status:'fail' });

  const hasDate2 = !!doc2.querySelector('time[datetime],meta[property="article:published_time"],meta[property="article:modified_time"]');
  if (!hasDate2) findings2.push({ cat:'AEO', label:'No publish/update date', node:'<time>', status:'fail' });

  const after = snapshotFindings(findings2);

  const resolved   = before.filter(x => !after.includes(x));
  const newOnes    = after.filter(x => !before.includes(x));
  const persisting = before.filter(x => after.includes(x));

  // annotate the ledger
  ledger.querySelectorAll('.ledger-row').forEach(row => {
    const fid = row.dataset.fid;
    const f = ctx.findings.find(x => x.id === fid);
    if (!f) return;
    const key = `${f.cat}|${f.label}`;
    row.classList.remove('delta-resolved','delta-new','delta-persisting');
    if (resolved.includes(key))       row.classList.add('delta-resolved');
    else if (persisting.includes(key))row.classList.add('delta-persisting');
  });

  narrate(`✦ delta — ${resolved.length} resolved, ${persisting.length} persisting, ${newOnes.length} new`, { ts: false, anchor: true });
  if (newOnes.length) {
    for (const k of newOnes) {
      narrate(`  new: ${k.replace('|', ' · ')}`, { ts: false });
    }
  }
  btn.classList.remove('busy');
  btn.classList.add('done');
  btn.textContent = `▸ re-run audit (Δ ${resolved.length}↓ ${newOnes.length}↑)`;
  btn.disabled = false;
}

// --- wire buttons once DOM is ready ---
function wirePhase2() {
  $('actions')?.classList.remove('hidden');
  $('batch-fix')?.addEventListener('click', runBatchFixes);
  $('re-audit')?.addEventListener('click', rerunAudit);
}
// reveal #actions as soon as the audit settles (hooked via MutationObserver on status)
const statusEl = $('status');
if (statusEl) {
  new MutationObserver(() => {
    if (statusEl.textContent === 'settled') wirePhase2();
  }).observe(statusEl, { childList: true, characterData: true, subtree: true });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3 — live verify via nusa-verify worker
// ═══════════════════════════════════════════════════════════════════

const VERIFY_WORKER = 'https://nusa-verify.traffictorch.workers.dev/';

// Demonstration patches by finding type. Only some findings can be
// meaningfully shown in-browser (DOM-level fixes). Server-side fixes
// (llms.txt, headers, TTFB, etc.) return null and get an honest note.
function derivePatch(label) {
  const L = String(label);

  if (/missing alt text/i.test(L)) {
    return `document.querySelectorAll('img').forEach(i => { const a = i.getAttribute('alt'); if (a === null || a.trim() === '') i.setAttribute('alt', ''); });`;
  }
  if (/No H1 on page/i.test(L)) {
    return `(function(){ if (document.querySelector('h1')) return; const h = document.createElement('h1'); h.textContent = document.title || 'Untitled'; document.body.insertBefore(h, document.body.firstChild); })();`;
  }
  if (/\d+\s*H1s on page/i.test(L)) {
    return `(function(){ const hs = document.querySelectorAll('h1'); for (let i = 1; i < hs.length; i++) { const n = document.createElement('h2'); n.innerHTML = hs[i].innerHTML; hs[i].parentNode.replaceChild(n, hs[i]); } })();`;
  }
  if (/Missing meta description/i.test(L)) {
    return `(function(){ if (document.querySelector('meta[name="description"]')) return; const m = document.createElement('meta'); m.name = 'description'; m.content = (document.body.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 155); document.head.appendChild(m); })();`;
  }
  if (/Title is \d+ chars/i.test(L)) {
    return `(function(){ if (document.title.length > 60) document.title = document.title.slice(0, 57).trim() + '…'; })();`;
  }
  if (/No visible author byline/i.test(L)) {
    return `(function(){ if (document.querySelector('meta[name="author"]')) return; const m = document.createElement('meta'); m.name = 'author'; m.content = 'Ylia Callan'; document.head.appendChild(m); })();`;
  }
  if (/No publish\/update date/i.test(L)) {
    return `(function(){ if (document.querySelector('meta[property="article:published_time"]')) return; const m = document.createElement('meta'); m.setAttribute('property','article:published_time'); m.setAttribute('content', new Date().toISOString()); document.head.appendChild(m); })();`;
  }
  if (/No responsive viewport/i.test(L)) {
    return `(function(){ if (document.querySelector('meta[name="viewport"]')) return; const m = document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1'; document.head.appendChild(m); })();`;
  }
  if (/No FAQPage schema/i.test(L)) {
    return `(function(){ const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}); document.head.appendChild(s); })();`;
  }
  // server-side fixes cannot be verified from the browser
  return null;
}

function attachVerify(block, finding) {
  if (!block || block.dataset.verifyAttached === '1') return;
  block.dataset.verifyAttached = '1';

  // prefer the real patchScript from nusa-patch; fall back to demo
  const patch = finding.patchScript || derivePatch(finding.label);
  if (!patch) {
    const note = el('div', 'verify-note', '▸ server-side fix — cannot be verified from the browser' + (finding.patchReason ? ' (' + finding.patchReason + ')' : ''));
    block.appendChild(note);
    return;
  }

  const btn = el('button', 'verify-btn', '▸ verify in live browser');
  btn.addEventListener('click', () => runVerify(btn, finding, patch));
  block.appendChild(btn);
}

async function runVerify(btn, finding, patchScript) {
  const ctx = window._nusa;
  if (!ctx) return;
  btn.disabled = true;
  btn.classList.add('busy');
  btn.textContent = '▸ opening live session…';

  try {
    const res = await fetch(VERIFY_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: ctx.url, patchScript, label: finding.label })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'verify failed');
    renderVerifyDiff(btn.closest('.fix-block'), data);
    btn.textContent = data.patchApplied ? '✓ verified in live browser' : '⚠ patch failed';
    btn.classList.remove('busy');
    btn.classList.add(data.patchApplied ? 'verified' : 'failed');
  } catch (e) {
    btn.textContent = `✗ ${e.message}`;
    btn.classList.remove('busy');
    btn.classList.add('failed');
  } finally {
    btn.disabled = false;
  }
}

function renderVerifyDiff(block, data) {
  if (!block) return;
  const { deltas, flags } = data.diff;

  const wrap = el('div', 'verify-diff');
  const head = `<span class="vhead">LIVE DIFF · ${escapeHtml((data.baseline.capturedAt||'').slice(11,19))} → ${escapeHtml((data.patched.capturedAt||'').slice(11,19))}</span>`;
  const errLine = data.patchError ? `<div class="vrow bad"><span class="vk">patch error</span><span class="vd">${escapeHtml(data.patchError)}</span></div>` : '';

  const rows = [];

  // Numeric deltas
  const KEY_LABEL = {
    titleLen: 'title length',
    descLen: 'meta description length',
    h1s: 'H1 count',
    missingAlt: 'images missing alt',
    renderBlocking: 'render-blocking resources',
    jsonLd: 'JSON-LD blocks',
    headings: 'heading count',
    totalNodes: 'DOM nodes'
  };
  // Which direction is "good"?
  const GOOD_DIR = { titleLen: 0, descLen: 0, h1s: 0, missingAlt: -1, renderBlocking: -1, jsonLd: 1, headings: 0, totalNodes: 0 };

  for (const [k, v] of Object.entries(deltas)) {
    const good = GOOD_DIR[k] || 0;
    const isGood = good === 0 ? false : (v.delta * good > 0);
    const cls = isGood ? 'good' : 'bad';
    rows.push(`<div class="vrow ${cls}"><span class="vk">${KEY_LABEL[k] || k}</span><span class="vb">${v.before}</span><span class="varrow">→</span><span class="va">${v.after}</span><span class="vd">${v.delta>0?'+':''}${v.delta}</span></div>`);
  }

  // Boolean flags
  const FLAG_LABEL = { hasAuthor: 'author byline', hasDate: 'publish/update date', hasViewport: 'responsive viewport' };
  for (const [k, v] of Object.entries(flags)) {
    if (!v.changed) continue;
    const isGood = v.after === true;
    rows.push(`<div class="vrow ${isGood?'good':'bad'}"><span class="vk">${FLAG_LABEL[k] || k}</span><span class="vb">${v.before}</span><span class="varrow">→</span><span class="va">${v.after}</span></div>`);
  }

  if (!rows.length) rows.push('<div class="vrow flat"><span class="vk">no measurable change detected</span></div>');

  wrap.innerHTML = head + errLine + rows.join('');
  block.appendChild(wrap);
}

// Watch narration for newly inserted fix blocks and attach verify.
const narrationEl = $('narration');
if (narrationEl) {
  new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.classList && node.classList.contains('fix-block')) {
          const fid = node.dataset.findingId;
          const ctx = window._nusa;
          if (!fid || !ctx) continue;
          const finding = ctx.findings.find(x => x.id === fid);
          if (finding) attachVerify(node, finding);
        }
      }
    }
  }).observe(narrationEl, { childList: true });
}
