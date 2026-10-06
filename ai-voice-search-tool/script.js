// ai-voice-search-tool/script.js?v=1.1

import { computeAIVisibility } from './modules/ai-visibility.js';
import { computeContentQuality } from './modules/content-quality.js';
import { computeSnippetVisibility } from './modules/snippet-visibility.js';
import { computeSentimentQuality } from './modules/sentiment-quality.js';
import { computeTraditionalKeywords } from './modules/traditional-keywords.js';
import { canRunTool } from '/main.js?v=1.1';
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/cms-detect.js';
import {
  initCodeSnippetModal,
  showCodeForFailure,
  deriveSelectorsForFailure,
  extractSnippets,
  escapeHtml
} from './code-snippet.js?v=1.0';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

function renderCodeBlocks(text) {
  if (text === null || text === undefined) return '';
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(
    /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g,
    (_m, lang, code) => {
      const language = (lang || 'plaintext').toLowerCase();
      return `<pre class="code-block"><code class="language-${language}">${code.replace(/\s+$/, '')}</code></pre>`;
    }
  );

  escaped = escaped.replace(
    /(<pre[\s\S]*?<\/pre>)|(\r?\n)/g,
    (_m, pre, nl) => (pre ? pre : '<br>')
  );

  return escaped;
}

function buildHeadSnapshot(doc) {
  if (!doc || !doc.head) return '';
  const head = doc.head;
  const lines = [];

  const sheets = [...head.querySelectorAll('link[rel="stylesheet"]')].slice(0, 15);
  if (sheets.length) {
    lines.push('Stylesheets in <head>:');
    for (const l of sheets) {
      const href = l.getAttribute('href') || '';
      const media = l.getAttribute('media');
      lines.push(`- ${href}${media ? ` (media=${media})` : ''}`);
    }
  }

  const headScripts = [...head.querySelectorAll('script[src]')].slice(0, 15);
  if (headScripts.length) {
    lines.push('Scripts in <head>:');
    for (const s of headScripts) {
      const src = s.getAttribute('src') || '';
      const attrs = ['async','defer','type','crossorigin','fetchpriority']
        .filter(a => s.hasAttribute(a))
        .map(a => `${a}="${s.getAttribute(a) || ''}"`)
        .join(' ');
      lines.push(`- ${src}${attrs ? ' ' + attrs : ''}`);
    }
  }

  const inlineStyles = [...head.querySelectorAll('style')].slice(0, 15);
  if (inlineStyles.length) {
    lines.push(`Inline <style> blocks in <head>: ${inlineStyles.length}`);
    for (const s of inlineStyles) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
  }

  const inlineScripts = [...head.querySelectorAll('script:not([src])')].slice(0, 15);
  if (inlineScripts.length) {
    lines.push(`Inline <script> blocks in <head>: ${inlineScripts.length}`);
    for (const s of inlineScripts) {
      const id = s.id ? `#${s.id}` : '(no id)';
      const bytes = (s.textContent || '').length;
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      lines.push(`- ${id} — ${bytes} bytes — "${preview}…"`);
    }
  }

  const metaTags = [...head.querySelectorAll('meta[name], meta[property]')].slice(0, 20);
  if (metaTags.length) {
    lines.push('Meta tags in <head>:');
    for (const m of metaTags) {
      const key = m.getAttribute('name') || m.getAttribute('property') || '';
      const val = (m.getAttribute('content') || '').slice(0, 120);
      lines.push(`- ${key}="${val}"`);
    }
  }

  const jsonLd = [...head.querySelectorAll('script[type="application/ld+json"]')].slice(0, 5);
  if (jsonLd.length) {
    lines.push(`JSON-LD schema blocks in <head>: ${jsonLd.length}`);
    for (const s of jsonLd) {
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
      lines.push(`- "${preview}…"`);
    }
  }

  return lines.join('\n');
}

async function saveAuditHistory(url, toolName) {
  const token = localStorage.getItem('authToken') || localStorage.getItem('traffic_torch_jwt');
  const auditUrl = url || 'Pasted HTML code';

  if (token) {
    try {
      await fetch(`${API_BASE}/api/audit-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: auditUrl,
          tool_name: toolName,
          score: null
        })
      });
      return;
    } catch (e) {
      // fall through to guest storage
    }
  }

  const stored = localStorage.getItem('audit_guest');
  let entries = [];
  if (stored) {
    try { entries = JSON.parse(stored).entries || []; } catch {}
  }
  entries.unshift({
    _localId: Date.now() + '_' + Math.random(),
    url: auditUrl,
    tool: toolName,
    score: null,
    timestamp: Date.now()
  });
  entries = entries.slice(0, 5);
  localStorage.setItem('audit_guest', JSON.stringify({ savedAt: Date.now(), entries }));
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const urlInput = document.getElementById('url-input');
  const codeInput = document.getElementById('code-input');
  const analyzeCodeBtn = document.getElementById('analyze-code-btn');
  const results = document.getElementById('results');

  initCodeSnippetModal();

  analyzeCodeBtn.addEventListener('click', async () => {
    const htmlContent = codeInput.value.trim();
    if (!htmlContent) {
      alert("Please paste HTML code into the textarea first.");
      codeInput.focus();
      return;
    }
    urlInput.value = '';
    await runAnalysis(htmlContent);
  });

  function autoFillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const inputData = params.get('input');

    if (inputData) {
      const textarea = document.getElementById('code-input');
      if (textarea) {
        textarea.value = decodeURIComponent(inputData);
        const analyzeBtn = document.getElementById('analyze-code-btn');
        if (analyzeBtn) {
          setTimeout(() => { analyzeBtn.click(); }, 800);
        }
      }
    }
  }

  window.addEventListener('load', autoFillFromUrl);

  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl && urlInput) {
    urlInput.value = decodeURIComponent(sharedUrl);
    setTimeout(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 300);
  }

  const PROXY = 'https://full-render-v2.traffictorch.workers.dev/?url=';
  let analyzedText = '';
  let wordCount = 0;

  function getMainContent(doc) {
    const main = doc.querySelector('main, [role="main"], article, .main-content, .site-content, .content-area');
    if (main && main.textContent.trim().length > 100) return main;
    const candidates = doc.querySelectorAll('div, section, article');
    let best = null;
    let bestScore = 0;
    candidates.forEach(el => {
      if (el.closest('header, nav, footer, aside, .menu, .navbar, .sidebar')) return;
      const paragraphs = el.querySelectorAll('p');
      const textLength = el.textContent.trim().length;
      const pCount = paragraphs.length;
      const score = pCount * 100 + textLength;
      if (score > bestScore && textLength > 100 && textLength < 20000) {
        bestScore = score;
        best = el;
      }
    });
    if (best) return best;
    const body = doc.body.cloneNode(true);
    const removeSelectors = 'header, nav, footer, aside, .menu, .navbar, .sidebar, .cookie-banner, .popup, .social-links, .breadcrumbs, script, style, noscript';
    body.querySelectorAll(removeSelectors).forEach(e => e.remove());
    return body;
  }

  function analyzeVoiceContent(text, doc) {
    const aiVisibility = computeAIVisibility(text, doc);
    const contentQuality = computeContentQuality(text);
    const snippetVisibility = computeSnippetVisibility(text, doc);
    const sentimentQuality = computeSentimentQuality(text);
    const traditionalKeywords = computeTraditionalKeywords(text);
    const moduleScores = [
      aiVisibility.score,
      contentQuality.score,
      snippetVisibility.score,
      sentimentQuality.score,
      traditionalKeywords.score
    ];
    const totalScore = moduleScores.reduce((a,b)=>a+b,0) / 5;
    return {
      moduleScores,
      totalScore: Math.round(totalScore),
      details: {
        aiVisibility: aiVisibility.details,
        contentQuality: contentQuality.details,
        snippetVisibility: snippetVisibility.details,
        sentimentQuality: sentimentQuality.details,
        traditionalKeywords: traditionalKeywords.details
      }
    };
  }

  const DETAILS_KEY = {
    'ai-visibility': 'aiVisibility',
    'content-quality': 'contentQuality',
    'snippet-visibility': 'snippetVisibility',
    'sentiment-quality': 'sentimentQuality',
    'traditional-keywords': 'traditionalKeywords'
  };

  function getModuleGrade(score) {
    if (score >= 80) return { emoji: '✅', text: 'Excellent', color: '#10b981' };
    if (score >= 60) return { emoji: '⚠️', text: 'Good – Improve', color: '#f97316' };
    return { emoji: '❌', text: 'Needs Work', color: '#ef4444' };
  }

  async function runAnalysis(htmlContent, pageUrl = '') {
    analyzedText = '';
    wordCount = 0;
    const canProceed = await canRunTool('ai-voice-search-tool');
    if (!canProceed) return;

    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">Analyzing content...</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Please wait while we process for AI voice search</p>
      </div>
    `;
    results.classList.remove('hidden');

    setTimeout(() => {
      const offset = 240;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }, 50);

    const progressText = document.getElementById('progressText');
    const messages = [
      "Analyzing content...",
      "Extracting main content",
      "Analyzing AI Visibility",
      "Measuring Content Quality",
      "Checking Snippet Visibility",
      "Evaluating Sentiment Quality",
      "Assessing Traditional Keywords",
      "Calculating final score..."
    ];
    let delay = 300;
    messages.forEach(msg => {
      setTimeout(() => {
        if (progressText) progressText.textContent = msg;
      }, delay);
      delay += 300;
    });

    const minLoadTime = 500;
    const startTime = Date.now();

    try {
      const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
      const cmsInfo = detectCMS({ doc, url: pageUrl || '' });

      results.dataset.renderedHtml = htmlContent || '';
      results.dataset.headSnapshot = buildHeadSnapshot(doc);
      document.body.setAttribute('data-cms-name', cmsInfo?.name || 'Custom / Unknown');
      document.body.setAttribute('data-cms-version', cmsInfo?.version || '');
      document.body.setAttribute('data-cms-confidence', cmsInfo?.confidence || 'unknown');

      const mainElement = getMainContent(doc);
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());

// ── Build text preserving paragraph boundaries ──
const blockTags = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, summary, figcaption, dt, dd';
const allBlocks = Array.from(cleanElement.querySelectorAll(blockTags));

// Also include <div> elements that contain only direct text (no nested block elements).
// This catches Elementor / Gutenberg / Tailwind "text wrapper" divs.
const leafDivs = Array.from(cleanElement.querySelectorAll('div')).filter(d => {
  // No nested block elements
  if (d.querySelector('p, div, ul, ol, table, blockquote, h1, h2, h3, h4, h5, h6, li, section, article')) return false;
  const t = (d.textContent || '').trim();
  return t.length > 40;
});

const allCandidates = [...allBlocks, ...leafDivs];

// Keep only top-level (no ancestor that also matches blockTags)
const topBlocks = allCandidates.filter(el => {
  let parent = el.parentElement;
  while (parent && parent !== cleanElement) {
    if (parent.matches(blockTags)) return false;
    parent = parent.parentElement;
  }
  return true;
});

const textParts = [];
const seenText = new Set();
topBlocks.forEach(el => {
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (t.length > 20 && !seenText.has(t)) {
    seenText.add(t);
    textParts.push(t);
  }
});

let text;
if (textParts.length >= 3) {
  text = textParts.join('\n\n');
} else {
  text = (cleanElement.textContent || '').replace(/\s+/g, ' ').trim();
}

      wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;

      const analysis = analyzeVoiceContent(text, doc);
      const yourScore = analysis.totalScore;

      const auditSaveUrl = pageUrl ? pageUrl : 'Pasted HTML code';
      await saveAuditHistory(auditSaveUrl, 'Voice Search');

      const modules = [
        { name: 'AI Visibility', score: analysis.moduleScores[0], id: 'ai-visibility', info: 'Simulates citation potential for AI assistants like Gemini/ChatGPT voice. High score = frequent brand mentions in spoken answers.' },
        { name: 'Content Quality', score: analysis.moduleScores[1], id: 'content-quality', info: 'Evaluates readability, entity richness, conciseness for AI synthesis & voice readout.' },
        { name: 'Snippet & Visibility', score: analysis.moduleScores[2], id: 'snippet-visibility', info: 'Checks formats eligible for featured snippets/AI Overviews used in voice.' },
        { name: 'Sentiment & Quality', score: analysis.moduleScores[3], id: 'sentiment-quality', info: 'Assesses tone & factual consistency for trustworthy AI voice outputs.' },
        { name: 'Keywords', score: analysis.moduleScores[4], id: 'traditional-keywords', info: 'Measures question coverage & long-tail phrase usage.' }
      ];

      const allFailed = [];
      modules.forEach(m => {
        const detailsKey = DETAILS_KEY[m.id];
        const subMetrics = analysis.details?.[detailsKey]?.subMetrics || [];
        subMetrics.forEach(s => {
          if (s.score < 60) {
            allFailed.push({
              moduleName: m.name,
              subName: s.name,
              score: s.score,
              fix: s.fix || 'Improve this metric for better voice SEO performance.',
              impact: s.name.includes('Potential') || s.name.includes('Snippet') || s.name.includes('Overview') ? 25
                    : s.name.includes('Content') || s.name.includes('Quality') || s.name.includes('Readability') ? 20
                    : s.name.includes('Question') || s.name.includes('Long-Tail') ? 15
                    : 10
            });
          }
        });
      });
      const topFailed = allFailed.sort((a, b) => b.impact - a.impact || b.score - a.score).slice(0, 3);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        const offset = 240;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

        results.innerHTML = `
<!-- Overall Score Card -->
<div class="flex justify-center my-8 sm:my-12 px-2 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AI Voice Search Score</p>
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourScore / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            ${yourScore}
          </div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    ${(() => {
      const title = (doc?.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) : title;
      return `<p id="analyzed-page-title" class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
    })()}
    ${(() => {
      const gradeText = yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Needs Improvement' : 'Needs Work';
      const gradeEmoji = yourScore >= 80 ? '✅' : yourScore >= 60 ? '⚠️' : '❌';
      const gradeColor = yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
      return `<p class="${gradeColor} text-4xl sm:text-5xl font-bold text-center mt-4 sm:mt-6 drop-shadow-lg">${gradeEmoji} ${gradeText}</p>`;
    })()}
  </div>
</div>
<!-- Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Voice SEO Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
      Radar chart available on desktop/tablet
    </p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
      Visual overview across 5 key AI Voice Search factors
    </p>
  </div>
</div>
<!-- Metrics Layout -->
<div class="space-y-8 max-w-3xl mx-auto px-2">
  ${(() => {
    const m = modules[0];
    const grade = getModuleGrade(m.score);
    const gradeColor = grade.color;
    const detailsKey = DETAILS_KEY[m.id];
    const details = analysis.details?.[detailsKey] || {};
    const subMetrics = details.subMetrics || [];
    const sortedSubMetrics = Array.isArray(subMetrics) ? [...subMetrics].sort((a, b) => a.score - b.score) : [];
    const fixable = sortedSubMetrics.filter(s => s.score < 80);
    const failedCount = fixable.length;
    const failedList = fixable.map(s => s.name).join(', ');
    const cmsName = (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const aiQuestion = escAttr(`How do I improve my ${m.name} score on ${cmsName}? Failed checks: ${failedList || 'none'}`);
    return `
    <div class="score-card bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4 w-full flex flex-col" style="border-left-color: ${gradeColor}">
      <div class="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 160 160" class="-rotate-90">
          <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="16" fill="none"/>
          <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none"
                  stroke-dasharray="${m.score * 4.4} 440" stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-5xl font-bold" style="color: ${gradeColor}">${m.score}</div>
          <div class="text-lg text-gray-500 dark:text-gray-400">/100</div>
        </div>
      </div>
      <p class="mt-6 text-2xl font-bold" style="color: ${gradeColor}">${m.name}</p>
      <p class="mt-2 text-xl flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
      <div class="mt-4 space-y-3 text-base">
        ${sortedSubMetrics.length > 0 ? sortedSubMetrics.map(s => `
          <p class="font-medium" style="color: ${s.score >= 80 ? '#10b981' : s.score >= 60 ? '#f97316' : '#ef4444'}">
            ${s.score >= 80 ? '✅' : s.score >= 60 ? '⚠️' : '❌'} ${s.name} (${s.score})
          </p>
        `).join('') : '<p class="text-gray-500 dark:text-gray-400">Sub-metrics loading...</p>'}
      </div>
      <div class="mt-auto pt-5">
        <button class="fixes-toggle mt-2 w-full px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition" data-failed-count="${failedCount}">
          Show Fixes (${failedCount})
        </button>
        <div class="fixes-panel hidden mt-6 space-y-8">
          ${m.score >= 80 && failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All sub-metrics strong! ✅ Optimize further for top voice rankings.</p>` : ''}
          ${fixable.map((s, idx) => {
            const rule = deriveSelectorsForFailure(s.name);
            return `
            <div class="text-center ${idx > 0 ? 'border-t border-gray-200 dark:border-gray-700 pt-6' : ''}">
              <div class="text-5xl mb-3" style="color: ${s.score >= 60 ? '#f97316' : '#ef4444'}">${s.score >= 60 ? '⚠️' : '❌'}</div>
              <p class="font-bold text-xl mb-3" style="color: ${s.score >= 60 ? '#f97316' : '#ef4444'}">${s.name}</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">
                ${s.fix || 'Improve this metric for better voice SEO performance.'}
              </p>
              ${rule ? `
                <button type="button"
                        class="show-code-btn mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        data-failure="${escapeHtml(s.name)}">
                  🔍 Show the code
                </button>
              ` : ''}
            </div>
          `;
          }).join('')}
          <div class="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <a href="#" class="ask-ai-link block text-center text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-medium transition"
               data-ai-question="${aiQuestion}">
              🤖 Ask AI about this module →
            </a>
            <a href="https://traffictorch.net/blog/posts/ai-voice-search-help-guide/#${m.id}" class="block text-center text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
              📖 Read the full ${m.name} guide →
            </a>
          </div>
        </div>
      </div>
    </div>`;
  })()}
  <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
    ${modules.slice(1).map((m, index) => {
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const detailsKey = DETAILS_KEY[m.id];
      const details = analysis.details?.[detailsKey] || {};
      const subMetrics = details.subMetrics || [];
      const sortedSubMetrics = Array.isArray(subMetrics) ? [...subMetrics].sort((a, b) => a.score - b.score) : [];
      const fixable = sortedSubMetrics.filter(s => s.score < 80);
      const failedCount = fixable.length;
      const failedList = fixable.map(s => s.name).join(', ');
      const cmsName = (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
      const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const aiQuestion = escAttr(`How do I improve my ${m.name} score on ${cmsName}? Failed checks: ${failedList || 'none'}`);
      return `
      <div class="score-card bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4 flex flex-col" style="border-left-color: ${gradeColor}">
        <div class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 160 160" class="-rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="16" fill="none"/>
            <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none"
                    stroke-dasharray="${m.score * 4.4} 440" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold" style="color: ${gradeColor}">${m.score}</div>
            <div class="text-lg text-gray-500 dark:text-gray-400">/100</div>
          </div>
        </div>
        <p class="mt-6 text-2xl font-bold" style="color: ${gradeColor}">${m.name}</p>
        <p class="mt-2 text-xl flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
        <div class="mt-4 space-y-3 text-base">
          ${sortedSubMetrics.length > 0 ? sortedSubMetrics.map(s => `
            <p class="font-medium" style="color: ${s.score >= 80 ? '#10b981' : s.score >= 60 ? '#f97316' : '#ef4444'}">
              ${s.score >= 80 ? '✅' : s.score >= 60 ? '⚠️' : '❌'} ${s.name} (${s.score})
            </p>
          `).join('') : '<p class="text-gray-500 dark:text-gray-400">Sub-metrics loading...</p>'}
        </div>
        <div class="mt-auto pt-5">
          <button class="fixes-toggle mt-2 w-full px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition" data-failed-count="${failedCount}">
            Show Fixes (${failedCount})
          </button>
          <div class="fixes-panel hidden mt-6 space-y-8">
            ${m.score >= 80 && failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All sub-metrics strong! ✅ Optimize further for top voice rankings.</p>` : ''}
            ${fixable.map((s, idx) => {
              const rule = deriveSelectorsForFailure(s.name);
              return `
              <div class="text-center ${idx > 0 ? 'border-t border-gray-200 dark:border-gray-700 pt-6' : ''}">
                <div class="text-5xl mb-3" style="color: ${s.score >= 60 ? '#f97316' : '#ef4444'}">${s.score >= 60 ? '⚠️' : '❌'}</div>
                <p class="font-bold text-xl mb-3" style="color: ${s.score >= 60 ? '#f97316' : '#ef4444'}">${s.name}</p>
                <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">
                  ${s.fix || 'Improve this metric for better voice SEO performance.'}
                </p>
                ${rule ? `
                  <button type="button"
                          class="show-code-btn mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          data-failure="${escapeHtml(s.name)}">
                    🔍 Show the code
                  </button>
                ` : ''}
              </div>
            `;
            }).join('')}
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <a href="#" class="ask-ai-link block text-center text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-medium transition"
                 data-ai-question="${aiQuestion}">
                🤖 Ask AI about this module →
              </a>
              <a href="https://traffictorch.net/blog/posts/ai-voice-search-help-guide/#${m.id}" class="block text-center text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
                📖 Read the full ${m.name} guide →
              </a>
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>
</div>
<!-- Top Priority Fixes -->
${topFailed.length === 0 ? `
  <div class="mt-12 text-center">
    <p class="text-2xl font-bold text-green-600 dark:text-green-400">All sub-metrics strong! ✅</p>
    <p class="mt-4 text-lg text-gray-700 dark:text-gray-300">Your page is well-optimized for AI voice search.</p>
  </div>
` : `
  <div class="mt-16 px-2 max-w-5xl mx-auto">
    <h2 class="text-3xl md:text-4xl font-black text-center mb-10 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
      Top Priority Fixes
    </h2>
    <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
      ${topFailed.map((f, idx) => `
        <div class="bg-gradient-to-br from-orange-500/10 to-pink-500/10 dark:from-orange-900/20 dark:to-pink-900/20 rounded-2xl p-6 md:p-8 border border-orange-500/30 shadow-lg hover:shadow-xl transition-all">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              ${idx + 1}
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">${f.subName}</h3>
          </div>
          <p class="text-gray-800 dark:text-gray-200 mb-4">
            <span class="font-semibold">${f.moduleName}</span> – Score ${f.score}/100
          </p>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
            ${f.fix}
          </p>
          <div class="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-bold rounded-full">
            +${f.impact}–${f.impact + 10} points
          </div>
        </div>
      `).join('')}
    </div>
  </div>
`}
<!-- CMS Fixes -->
<div id="cms-fixes-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get step-by-step AI voice search fix instructions tailored to your CMS.
  </p>

  <div class="flex items-center justify-center gap-3 mb-4 flex-wrap">
    <span class="text-sm text-gray-600 dark:text-gray-400">Detected:</span>
    <span id="cms-detected-badge" class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-300 dark:border-gray-700">
      <span id="cms-badge-dot" class="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span>
      <span id="cms-badge-name">Custom / Unknown</span>
    </span>
    <button id="cms-override-toggle" class="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline bg-transparent border-none cursor-pointer">
      Change
    </button>
  </div>

  <div id="cms-override-panel" class="hidden max-w-md mx-auto mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CMS</label>
    <select id="cms-override-select" class="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
      <option value="Custom / Unknown">Custom / Unknown</option>
      <option value="WordPress">WordPress</option>
      <option value="Shopify">Shopify</option>
      <option value="Wix">Wix</option>
      <option value="Squarespace">Squarespace</option>
      <option value="Webflow">Webflow</option>
      <option value="Drupal">Drupal</option>
      <option value="Joomla">Joomla</option>
      <option value="Ghost">Ghost</option>
      <option value="HubSpot CMS">HubSpot CMS</option>
      <option value="Magento">Magento</option>
      <option value="BigCommerce">BigCommerce</option>
      <option value="PrestaShop">PrestaShop</option>
    </select>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version (optional)</label>
    <input id="cms-override-version" type="text" placeholder="e.g. 6.4.2" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
  </div>

  <div class="text-center">
    <button id="cms-fixes-btn" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">
      Generate CMS Fixes
    </button>
    <p id="cms-fixes-no-fixes" class="hidden mt-4 text-lg text-green-600 dark:text-green-400 font-medium">
      No fixes needed — your page is voice-search ready. 🎉
    </p>
  </div>

  <div id="cms-fixes-answer-container" class="mt-6 hidden">
    <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>
<div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🤖 Ask Traffic Torch AI About AI Voice Search</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get tailored answers about AI voice search optimization, content quality, snippet visibility, and specific improvement steps.
  </p>
  <div class="flex flex-col sm:flex-row gap-4">
    <textarea id="ai-question-input" placeholder="e.g., Why is my AI Visibility low? How do I improve voice snippet potential?" rows="3" class="flex-1 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y min-h-[60px]"></textarea>
    <button id="ask-ai-btn" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">Ask AI</button>
  </div>
  <div id="ai-answer-container" class="mt-6 hidden">
    <div id="ai-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>
<!-- Share Dashboard Container -->
<div id="share-dashboard-container" class="mt-16"></div>
        `;

        setTimeout(() => {
          const canvas = document.getElementById('health-radar');
          if (!canvas) return;
          try {
            const ctx = canvas.getContext('2d');
            const labelColor = '#9ca3af';
            const gridColor = 'rgba(156, 163, 175, 0.3)';
            const borderColor = '#fb923c';
            const fillColor = 'rgba(251, 146, 60, 0.15)';
            const normalizedScores = modules.map(m => m.score);
            window.myChart = new Chart(ctx, {
              type: 'radar',
              data: {
                labels: modules.map(m => m.name),
                datasets: [{
                  label: 'Voice SEO Score',
                  data: normalizedScores,
                  backgroundColor: fillColor,
                  borderColor: borderColor,
                  borderWidth: 4,
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  pointBackgroundColor: normalizedScores.map(s => s >= 80 ? '#22c55e' : s >= 50 ? '#fb923c' : '#ef4444'),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 3
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: labelColor },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 15, weight: '600' } }
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const rawScore = modules[context.dataIndex].score;
                        return `${context.dataset.label}: ${rawScore}/100`;
                      }
                    }
                  }
                }
              }
            });
          } catch (e) {}
        }, 150);

        let displayUrl = 'traffictorch.net';
        if (pageUrl) {
          let cleaned = pageUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
          const firstSlash = cleaned.indexOf('/');
          if (firstSlash !== -1) {
            const domain = cleaned.slice(0, firstSlash);
            const path = cleaned.slice(firstSlash);
            displayUrl = domain + '\n' + path;
          } else {
            displayUrl = cleaned;
          }
        }
        document.body.setAttribute('data-url', displayUrl);

        const moduleScores = modules.map(m => ({ name: m.name, score: m.score }));

        const passedMetrics = [];
        const failedMetrics = [];
        modules.forEach(m => {
          const detailsKey = DETAILS_KEY[m.id];
          const subMetrics = analysis.details?.[detailsKey]?.subMetrics || [];
          subMetrics.forEach(s => {
            if (s.score >= 60) passedMetrics.push(s.name);
            else failedMetrics.push(s.name);
          });
          if (m.score >= 60) passedMetrics.push(m.name);
          else failedMetrics.push(m.name);
        });

        const shareData = {
          toolName: 'AI Voice Search Tool',
          url: pageUrl || displayUrl,
          pageTitle: doc?.title || 'AI Voice Page',
          overallScore: yourScore,
          moduleScores: moduleScores,
          passedMetrics: passedMetrics,
          failedMetrics: failedMetrics,
          aiFixes: topFailed.map(f => f.subName + ': ' + f.fix),
          rawData: { modules, analysis, topFailed },
          shareLink: pageUrl ? `${window.location.origin}/ai-voice-search-tool/?url=${encodeURIComponent(pageUrl)}` : ''
        };

        const shareContainer = document.getElementById('share-dashboard-container');
        if (shareContainer) {
          if (pageUrl) {
            initShareModule(shareContainer, shareData);
          } else {
            shareContainer.innerHTML = `
              <div class="text-center text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-600 rounded-xl">
                <p>Sharing is available for live URLs only. Please run the analysis with a URL to share this report.</p>
              </div>
            `;
          }
        }

        const metaDescription = (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').replace(/\s+/g, ' ').trim();
        const h1Text = (doc.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim();
        const langAttribute = doc.documentElement?.getAttribute('lang') || '';
        const viewportContent = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
        const linkCount = doc.querySelectorAll('a[href]').length;
        const imageCount = doc.querySelectorAll('img').length;
        const headingCount = doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        const ctaCount = doc.querySelectorAll('a[class*="cta" i], a[class*="button" i], button, input[type="submit"]').length;

        const excerptDoc = doc.cloneNode(true);
        excerptDoc.querySelectorAll('nav, header, footer, aside, script, style, .sidebar, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());
        const contentRoot = excerptDoc.querySelector('main, article, [role="main"]') || excerptDoc.body;
        const paragraphs = Array.from(contentRoot?.querySelectorAll('p') || [])
          .map(p => p.textContent.replace(/\s+/g, ' ').trim())
          .filter(t => t.length > 60);
        const pageExcerpt = (paragraphs[0] || contentRoot?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);

        const headSnapshot = results.dataset.headSnapshot || '';

        const affectedSnippets = {};
        const rawHtmlForSnips = results.dataset.renderedHtml || '';
        if (rawHtmlForSnips) {
          const snippetSources = topFailed.map(f => f.subName);
          failedMetrics.forEach(m => { if (!snippetSources.includes(m)) snippetSources.push(m); });
          for (const item of snippetSources.slice(0, 5)) {
            try {
              const rule = deriveSelectorsForFailure(item);
              if (rule?.selectors?.length) {
                const snips = extractSnippets(rawHtmlForSnips, rule.selectors, { limit: 2, maxLen: 400 });
                if (snips.length) affectedSnippets[item] = snips.map(s => s.html);
              }
            } catch {}
          }
        }

        const askBtn = document.getElementById('ask-ai-btn');
        const askInput = document.getElementById('ai-question-input');
        const answerContainer = document.getElementById('ai-answer-container');
        const answerContent = document.getElementById('ai-answer-content');

        if (askBtn) {
          const newAskBtn = askBtn.cloneNode(true);
          askBtn.parentNode.replaceChild(newAskBtn, askBtn);

          newAskBtn.addEventListener('click', async () => {
            const canProceed = await canRunTool('ai-voice-search-tool');
            if (!canProceed) return;

            const question = askInput?.value?.trim();
            if (!question) {
              alert('Please enter a question.');
              return;
            }

            newAskBtn.disabled = true;
            newAskBtn.textContent = 'Thinking...';
            answerContainer.classList.remove('hidden');
            answerContent.innerHTML = '⏳ Traffic Torching...';

            try {
              const moduleScoresMap = {};
              modules.forEach(m => {
                const key = m.id.replace(/-/g, '');
                moduleScoresMap[key] = m.score;
              });

              const auditPayload = {
                question: question,
                auditData: {
                  url: pageUrl || '',
                  pageTitle: doc?.title || 'AI Voice Page',
                  metaDescription,
                  h1: h1Text,
                  pageExcerpt,
                  headSnapshot: headSnapshot,
                  langAttribute: langAttribute,
                  viewportContent: viewportContent,
                  linkCount,
                  imageCount,
                  headingCount,
                  ctaCount,
                  wordCount,
                  overallScore: yourScore,
                  scores: {
                    aiVisibility: moduleScoresMap.aivisibility || 0,
                    contentQuality: moduleScoresMap.contentquality || 0,
                    snippetVisibility: moduleScoresMap.snippetvisibility || 0,
                    sentimentQuality: moduleScoresMap.sentimentquality || 0,
                    traditionalKeywords: moduleScoresMap.traditionalkeywords || 0
                  },
                  flags: {
                    hasFeaturedSnippet: analysis.details?.snippetVisibility?.hasFeaturedSnippet || false,
                    hasFAQSchema: analysis.details?.snippetVisibility?.hasFAQSchema || false,
                    hasQuestionHeadings: analysis.details?.snippetVisibility?.hasQuestionHeadings || false,
                    hasHighReadability: analysis.details?.contentQuality?.readability >= 60 || false
                  },
                  failedItems: failedMetrics.slice(0, 10),
                  priorityFixes: topFailed.map(f => ({
                    name: f.subName,
                    module: f.moduleName,
                    score: f.score ?? 0,
                    impact: `+${f.impact}`,
                    desc: f.fix || ''
                  })),
                  snippets: affectedSnippets,
                  cms: {
                    name: (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown',
                    version: (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.version) ? cmsInfo.version : null,
                    confidence: (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.confidence) ? cmsInfo.confidence : null,
                    signals: (typeof cmsInfo !== 'undefined' && cmsInfo && cmsInfo.signals) ? cmsInfo.signals : null
                  },
                  browserMetrics: null
                }
              };

              const response = await fetch('https://ai-voice-search-ai.traffictorch.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(auditPayload)
              });

              if (!response.ok) throw new Error(`Server error (${response.status})`);

              const data = await response.json();

              if (data.success) {
                let html2 = `🧠 <strong>Traffic Torch AI</strong><br><br>${renderCodeBlocks(data.answer)}`;
                if (Array.isArray(data.warnings) && data.warnings.length) {
                  const warningText = data.warnings.join(' ');
                  html2 = `<div style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:#fef3c7;color:#92400e;font-size:0.85rem;">${warningText}</div>` + html2;
                }
                answerContent.innerHTML = html2;
              } else {
                answerContent.innerHTML = renderCodeBlocks(`❌ Error: ${data.error || 'Unknown error'}`);
              }

            } catch (err) {
              answerContent.innerHTML = renderCodeBlocks(`❌ Failed to get AI response. Please try again later. (${err.message})`);
            } finally {
              newAskBtn.disabled = false;
              newAskBtn.textContent = 'Ask AI';
            }
          });
        }

        const cmsFixesBtn        = document.getElementById('cms-fixes-btn');
        const cmsBadgeDot        = document.getElementById('cms-badge-dot');
        const cmsBadgeName       = document.getElementById('cms-badge-name');
        const cmsOverrideToggle  = document.getElementById('cms-override-toggle');
        const cmsOverridePanel   = document.getElementById('cms-override-panel');
        const cmsOverrideSelect  = document.getElementById('cms-override-select');
        const cmsOverrideVersion = document.getElementById('cms-override-version');
        const cmsNoFixes         = document.getElementById('cms-fixes-no-fixes');
        const cmsAnswerContainer = document.getElementById('cms-fixes-answer-container');
        const cmsAnswerContent   = document.getElementById('cms-fixes-answer-content');

        if (cmsBadgeName) {
          let label = cmsInfo.name || 'Custom / Unknown';
          if (cmsInfo.version) label += ' ' + cmsInfo.version;
          cmsBadgeName.textContent = label;
        }
        if (cmsBadgeDot) {
          let dotClass = 'bg-gray-400';
          if (cmsInfo.confidence === 'high')        dotClass = 'bg-green-500';
          else if (cmsInfo.confidence === 'medium') dotClass = 'bg-yellow-500';
          else if (cmsInfo.confidence === 'low')    dotClass = 'bg-orange-500';
          cmsBadgeDot.className = 'inline-block w-2.5 h-2.5 rounded-full mr-2 ' + dotClass;
        }

        if (cmsOverrideSelect) {
          const known = Array.from(cmsOverrideSelect.options).map(o => o.value);
          cmsOverrideSelect.value = known.includes(cmsInfo.name) ? cmsInfo.name : 'Custom / Unknown';
        }
        if (cmsOverrideVersion && cmsInfo.version) {
          cmsOverrideVersion.value = cmsInfo.version;
        }

        cmsOverrideToggle?.addEventListener('click', () => {
          cmsOverridePanel?.classList.toggle('hidden');
        });

        if (topFailed.length === 0) {
          if (cmsFixesBtn) {
            cmsFixesBtn.disabled = true;
            cmsFixesBtn.classList.add('opacity-50', 'cursor-not-allowed');
          }
          cmsNoFixes?.classList.remove('hidden');
        }

        cmsFixesBtn?.addEventListener('click', async () => {
          if (topFailed.length === 0) return;

          const canProceed = await canRunTool('ai-voice-search-tool');
          if (!canProceed) return;

          const selectedCms     = cmsOverrideSelect?.value?.trim() || cmsInfo.name || 'Custom / Unknown';
          const selectedVersion = cmsOverrideVersion?.value?.trim() || cmsInfo.version || null;

          cmsFixesBtn.disabled = true;
          const originalLabel = cmsFixesBtn.textContent;
          cmsFixesBtn.textContent = 'Generating...';
          cmsAnswerContainer?.classList.remove('hidden');
          if (cmsAnswerContent) cmsAnswerContent.innerHTML = '⏳ Traffic Torching...';

          try {
            const payload = {
              cms: selectedCms,
              cmsVersion: selectedVersion,
              cmsConfidence: cmsInfo.confidence,
              cmsSignals: cmsInfo.signals,
              url: pageUrl || null,
              pageTitle: doc?.title || null,
              overallScore: yourScore,
              scores: {
                aiVisibility: modules[0].score,
                contentQuality: modules[1].score,
                snippetVisibility: modules[2].score,
                sentimentQuality: modules[3].score,
                traditionalKeywords: modules[4].score
              },
              priorityFixes: topFailed.slice(0, 3).map(f => ({
                module: f.moduleName,
                name: f.subName,
                howToFix: f.fix
              })),
              mode: pageUrl ? 'live-url' : 'pasted-code'
            };

            const response = await fetch('https://ai-voice-search-cms-fixes.traffictorch.workers.dev/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Server error (${response.status})`);

            const data = await response.json();

            if (data.success && cmsAnswerContent) {
              cmsAnswerContent.innerHTML = '';

              const header = document.createElement('div');
              header.style.fontWeight = 'bold';
              header.style.marginBottom = '0.75rem';
              header.textContent = '🛠️ CMS Fixes for ' +
                (data.cms || selectedCms) +
                (data.cmsVersion ? ' ' + data.cmsVersion : '');

              const body = document.createElement('div');
              body.innerHTML = renderCodeBlocks(data.answer || '');

              let warningEl = null;
              if (Array.isArray(data.warnings) && data.warnings.length) {
                warningEl = document.createElement('div');
                warningEl.style.marginTop = '0.75rem';
                warningEl.style.padding = '0.5rem 0.75rem';
                warningEl.style.borderRadius = '0.5rem';
                warningEl.style.background = '#fef3c7';
                warningEl.style.color = '#92400e';
                warningEl.style.fontSize = '0.85rem';
                warningEl.textContent = data.warnings.join(' ');
              }

              cmsAnswerContent.appendChild(header);
              cmsAnswerContent.appendChild(body);
              if (warningEl) cmsAnswerContent.appendChild(warningEl);
            } else if (cmsAnswerContent) {
              cmsAnswerContent.innerHTML = renderCodeBlocks('❌ Error: ' + (data.error || 'Unknown error'));
            }

          } catch (err) {
            if (cmsAnswerContent) {
              cmsAnswerContent.innerHTML = renderCodeBlocks('❌ Failed to generate CMS fixes. Please try again. (' + err.message + ')');
            }
          } finally {
            cmsFixesBtn.disabled = false;
            cmsFixesBtn.textContent = originalLabel;
          }
        });

        // 🏆 Leaderboard submit button — final step, results are in DOM
        if (pageUrl && window.TrafficTorchLeaderboard) {
          const lbHost =
            document.getElementById('share-dashboard-container') ||
            document.getElementById('share-module') ||
            document.getElementById('results') ||
            document.querySelector('main');
          if (lbHost) {
            window.TrafficTorchLeaderboard.injectButton(lbHost, {
              tool: 'ai-voice-search-tool',
              url: pageUrl,
              title: (doc?.title || '').trim().slice(0, 200) || 'Untitled page',
              score: yourScore,
              moduleScores: modules.map(m => ({ name: m.name, score: Math.round(m.score) }))
            });
          }
        }

      }, remaining);

    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Please check the input and try again.</p>
          </div>
        `;
      }, remaining);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    codeInput.value = '';
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">Fetching page…</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Please wait while we retrieve the URL content</p>
      </div>
    `;
    results.classList.remove('hidden');

    setTimeout(() => {
      const offset = 240;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }, 50);

    try {
      const res = await fetch(PROXY + encodeURIComponent(normalizedUrl));
      if (!res.ok) throw new Error('Page not reachable');

      const html = await res.text();
      runAnalysis(html, normalizedUrl);
    } catch (err) {
      results.innerHTML = `
        <div class="text-center py-20">
          <p class="text-3xl text-red-500 font-bold">Error: ${err.message}</p>
          <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Failed to analyze - Whitelist: full-render-v2.traffictorch.workers.dev or use Code Analysis.</p>
        </div>
      `;
    }
  });

  document.addEventListener('click', (e) => {
    const showCodeBtn = e.target.closest('.show-code-btn');
    if (showCodeBtn) {
      e.preventDefault();
      const failureText = showCodeBtn.dataset.failure || '';
      const html = results.dataset.renderedHtml || '';
      showCodeForFailure(failureText, html, { title: 'Affected code' });
      return;
    }

    const toggle = e.target.closest('.fixes-toggle');
    if (toggle) {
      e.preventDefault();
      const card = toggle.closest('.score-card');
      const panel = card?.querySelector('.fixes-panel');
      if (panel) panel.classList.toggle('hidden');
      const count = toggle.dataset.failedCount || '0';
      const isOpen = panel && !panel.classList.contains('hidden');
      toggle.textContent = isOpen ? `Hide Fixes (${count})` : `Show Fixes (${count})`;
      return;
    }

    const askLink = e.target.closest('.ask-ai-link');
    if (askLink) {
      e.preventDefault();
      const section = document.getElementById('ask-ai-section');
      const input = document.getElementById('ai-question-input');
      if (input && askLink.dataset.aiQuestion) {
        input.value = askLink.dataset.aiQuestion;
      }
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (input) {
        setTimeout(() => input.focus(), 700);
      }
    }
  });
});