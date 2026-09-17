// ai-audit-tool/script-v1.3.js

import { computePerplexity } from './modules/perplexity.js';
import { computeBurstiness } from './modules/burstiness.js';
import { computeRepetition } from './modules/repetition.js';
import { computeSentenceLength } from './modules/sentenceLength.js';
import { computeVocabulary } from './modules/vocabulary.js';
import { canRunTool } from '/main-v1.1.js';
// Replace old share/feedback imports with the new dashboard
import { initShareModule } from '/share-module.js';
import { detectCMS } from '/cms-detect.js';
import { fixFor } from './module-explanations-v1.2.js';
import {
  initCodeSnippetModal,
  showCodeForFailure,
  deriveSelectorsForFailure,
  escapeHtml
} from './code-snippet-v1.0.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const PROXY = 'https://full-render-v2.traffictorch.workers.dev/?url=';

// ── Save audit to history (auth user → API, guest → localStorage) ──
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

  // Guest fallback – same key the dashboard uses
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
  const urlForm = document.getElementById('audit-form');
  const urlInput = document.getElementById('url-input');
  const codeForm = document.getElementById('code-form');
  const codeInput = document.getElementById('code-input');
  const results = document.getElementById('results');

  let analyzedText = '';
  let wordCount = 0;

  // One-time bootstrap for the "Show the code" modal
  initCodeSnippetModal();

  // Auto-fill HTML from ?input= query parameter (for VS Code extension + direct links)
  function autoFillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const inputData = params.get('input');

    if (inputData) {
      const textarea = document.getElementById('code-input');
      if (textarea) {
        textarea.value = decodeURIComponent(inputData);

        // Optional: Auto-click the Analyze button after a tiny delay
        const analyzeBtn = document.getElementById('analyze-code-btn');
        if (analyzeBtn) {
          setTimeout(() => {
            analyzeBtn.click();
          }, 800);   // Give the page time to render
        }
      }
    }
  }

  // Run when page loads
  window.addEventListener('load', autoFillFromUrl);

  // Auto-fill from shared report deep link
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  if (sharedUrl && urlInput) {
    urlInput.value = decodeURIComponent(sharedUrl);
    setTimeout(() => {
      urlForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 300);
  }

  function getMainContent(doc) {
    const main = doc.querySelector('main, [role="main"], article, .main-content, .site-content, .content-area');
    if (main && main.textContent.trim().length > 600) return main;

    const candidates = doc.querySelectorAll('div, section, article');
    let best = null;
    let bestScore = 0;
    candidates.forEach(el => {
      if (el.closest('header, nav, footer, aside, .menu, .sidebar')) return;
      const paragraphs = el.querySelectorAll('p');
      const textLength = el.textContent.trim().length;
      const pCount = paragraphs.length;
      const score = pCount * 100 + textLength;
      if (score > bestScore && textLength > 600 && textLength < 20000) {
        bestScore = score;
        best = el;
      }
    });
    if (best) return best;

    const body = doc.body.cloneNode(true);
    const removeSelectors = 'header, nav, footer, aside, .menu, .navbar, .sidebar, .cookie-banner, .popup, .social-links, .breadcrumbs';
    body.querySelectorAll(removeSelectors).forEach(e => e.remove());
    return body;
  }

  function analyzeAIContent(text) {
    if (!text || text.length < 200) {
      // Not enough text to score reliably. Return a fully-formed neutral
      // analysis so downstream renderers can safely read analysis.details.*
      // without throwing (previously this returned no `details`, which crashed
      // the report template with "Cannot read properties of undefined").
      return {
        moduleScores: [10, 10, 10, 10, 10],
        totalScore: 50,
        details: {
          perplexity:     { trigram: '0.0', bigram: '0.0',
                            scores: { trigram: 10, bigram: 10 } },
          burstiness:     { sentence: '0.0', word: '0.0',
                            scores: { sentence: 10, word: 10 } },
          repetition:     { bigram: 0, trigram: 0,
                            scores: { bigram: 10, trigram: 10 } },
          sentenceLength: { avg: 0, complexity: '0.0',
                            scores: { avg: 10, complexity: 10 } },
          vocabulary:     { diversity: '0.0', rare: '0.0',
                            scores: { diversity: 10, rare: 10 } }
        }
      };
    }
    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordCount = words.length;

    const perplexity = computePerplexity(words);
    const burstiness = computeBurstiness(sentences, words);
    const repetition = computeRepetition(words);
    const sentenceLength = computeSentenceLength(sentences);
    const vocabulary = computeVocabulary(words, wordCount);

    const moduleScores = [
      perplexity.moduleScore,
      burstiness.moduleScore,
      repetition.moduleScore,
      sentenceLength.moduleScore,
      vocabulary.moduleScore
    ];
    const totalScore = moduleScores.reduce((a, b) => a + b, 0);

    return {
      moduleScores,
      totalScore,
      details: {
        perplexity: perplexity.details,
        burstiness: burstiness.details,
        repetition: repetition.details,
        sentenceLength: sentenceLength.details,
        vocabulary: vocabulary.details
      }
    };
  }

  function getModuleGrade(score) {
    if (score === 20) return { emoji: '✅', text: 'Excellent', color: '#10b981' };
    if (score === 10) return { emoji: '⚠️', text: 'Good', color: '#f97316' };
    return { emoji: '❌', text: 'Needs Work', color: '#ef4444' };
  }

  function getSubEmoji(score) {
    return score === 10 ? '✅' : '❌';
  }

  function getSubColor(score) {
    return score === 10 ? '#10b981' : '#ef4444';
  }

  // ==================== UNIFIED ANALYSIS + FULL REPORT (ONE SOURCE OF TRUTH) ====================
  async function runAnalysis(isUrlMode) {
    const canProceed = await canRunTool('ai-audit-tool');
    if (!canProceed) return;

    // Clear opposite input and reset state
    if (isUrlMode) {
      codeInput.value = '';
    } else {
      urlInput.value = '';
    }
    analyzedText = '';
    wordCount = 0;

    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">${isUrlMode ? 'Fetching page...' : 'Analyzing pasted HTML...'}</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Analyzing content for AI patterns – please wait</p>
      </div>
    `;
    results.classList.remove('hidden');
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const progressText = document.getElementById('progressText');
    const messages = isUrlMode ? [
      "Fetching page...", "Extracting main content", "Analyzing predictability",
      "Measuring variation & rhythm", "Checking repetition patterns",
      "Evaluating structure & depth", "Assessing vocabulary richness", "Calculating final score..."
    ] : [
      "Parsing HTML code...", "Extracting main content", "Analyzing predictability",
      "Measuring variation & rhythm", "Checking repetition patterns",
      "Evaluating structure & depth", "Assessing vocabulary richness", "Calculating final score..."
    ];

    let delay = 300;
    messages.forEach(msg => {
      setTimeout(() => { if (progressText) progressText.textContent = msg; }, delay);
      delay += 300;
    });

    const minLoadTime = 600;
    const startTime = Date.now();

    let rawPageHtml = '';   // captured for "Show the code" feature
    let auditSaveUrl = '';  // captured for audit-history save

    try {
      let doc;
      if (isUrlMode) {
        const url = urlInput.value.trim();
        if (!url) return;
        let normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
        const res = await fetch(PROXY + encodeURIComponent(normalizedUrl));
        if (!res.ok) throw new Error('Page not reachable');
        const html = await res.text();
        rawPageHtml = html;
        auditSaveUrl = normalizedUrl;
        doc = new DOMParser().parseFromString(html, 'text/html');
      } else {
        const htmlCode = codeInput.value.trim();
        if (!htmlCode) return;
        rawPageHtml = htmlCode;
        auditSaveUrl = 'Pasted HTML code';
        doc = new DOMParser().parseFromString(htmlCode, 'text/html');
      }

      const mainElement = getMainContent(doc);
      const cmsInfo = detectCMS({ doc, url: isUrlMode ? urlInput.value.trim() : '' });
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;

      const analysis = analyzeAIContent(text);
      const yourScore = analysis.totalScore;

      // 👇 Save the audit to history so it shows in the dashboard
      await saveAuditHistory(auditSaveUrl, 'AI Content Audit');

      const modules = [
        { name: 'Perplexity', score: analysis.moduleScores[0] },
        { name: 'Burstiness', score: analysis.moduleScores[1] },
        { name: 'Repetition', score: analysis.moduleScores[2] },
        { name: 'Sentence Length', score: analysis.moduleScores[3] },
        { name: 'Vocabulary', score: analysis.moduleScores[4] }
      ];
      const failingModules = modules.filter(m => m.score < 20).length;
      const boost = failingModules * 15;

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        const offset = 240;
        const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

        // FULL COMPLETE REPORT - identical for both URL and HTML input
        results.dataset.renderedHtml = rawPageHtml || '';
        results.innerHTML = `
<!-- Overall Score Card (AI Audit) -->
<div class="flex justify-center my-8 sm:my-12 px-2 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AI Audit Score</p>
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90" stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'}" stroke-width="16" fill="none" stroke-dasharray="${(yourScore / 100) * 565} 565" stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg" style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">${yourScore}</div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1" style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">/100</div>
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

<!-- On-Page Health Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">On-Page Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">Radar chart available on desktop/tablet</p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">Visual overview of your page performance across 5 key SEO Intent factors</p>
  </div>
</div>

<!-- Metrics Layout -->
<div class="space-y-8">
  <!-- Perplexity - Full width -->
  <div class="max-w-2xl mx-auto">
    ${(() => {
      const m = {
        name: 'Perplexity',
        id: 'perplexity',
        score: analysis.moduleScores[0],
        details: analysis.details.perplexity,
      };
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const sub1Score = m.details.scores.trigram;
      const sub2Score = m.details.scores.bigram;
      const failedItems = [];
      if (sub1Score < 10) failedItems.push({ name: 'Trigram Entropy', fix: fixFor('Trigram Entropy') });
      if (sub2Score < 10) failedItems.push({ name: 'Bigram Entropy',  fix: fixFor('Bigram Entropy') });
      const failedCount = failedItems.length;
      const failedNames = failedItems.map(f => f.name).join(', ') || 'none';
      const cmsName = (typeof cmsInfo !== 'undefined' && cmsInfo?.name) ? cmsInfo.name : 'Unknown';
      return `
      <div class="score-card bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4 flex flex-col" style="border-left-color: ${gradeColor}">
        <div class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 160 160" class="-rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="16" fill="none"/>
            <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none" stroke-dasharray="${m.score * 22} 440" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold" style="color: ${gradeColor}">${m.score}</div>
            <div class="text-lg text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-6 text-2xl font-bold" style="color: ${gradeColor}">${m.name}</p>
        <p class="mt-2 text-xl flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
        <div class="mt-4 space-y-3 text-base">
          <p class="font-medium" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)} Trigram Entropy</p>
          <p class="font-medium" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)} Bigram Entropy</p>
        </div>

        <p class="mt-4 text-sm">
          <a href="/blog/posts/ai-content-detection-guide/#perplexity" class="text-orange-500 font-bold hover:underline">How Perplexity is tested? →</a>
        </p>

        <div class="mt-auto pt-5">
          <button type="button" class="fixes-toggle w-full mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition" data-failed-count="${failedCount}">
            Show Fixes (${failedCount})
          </button>
        </div>

        <div class="fixes-panel hidden mt-6 space-y-6 text-left">
          ${failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold">All tests passed! ✅</p>` : ''}
          ${failedItems.map((f, i) => {
            const rule = deriveSelectorsForFailure(f.name);
            return `
            <div class="${i > 0 ? 'pt-4 border-t border-gray-200 dark:border-gray-700' : ''}">
              <p class="font-bold text-red-600 dark:text-red-400 mb-2 leading-snug">❌ ${escapeHtml(f.name)}</p>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(f.fix)}</p>
              ${rule ? `
                <button type="button"
                        class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        data-failure="${escapeHtml(f.name)}">
                  🔍 Show the code
                </button>
              ` : ''}
            </div>
          `;
          }).join('')}

          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <a href="#ask-ai-section" class="ask-ai-link block text-purple-600 dark:text-purple-400 font-bold hover:underline"
               data-ai-question="How do I improve my Perplexity score? Failed checks: ${failedNames}. Detected CMS: ${cmsName}. Module score: ${m.score}/20. Please give me ${cmsName}-specific fixes.">
              🤖 Ask AI about this module →
            </a>
            <a href="/blog/posts/ai-content-detection-guide/#perplexity" class="block text-orange-500 font-bold hover:underline">
              📖 Read the full Perplexity guide →
            </a>
          </div>
        </div>
      </div>`;
    })()}
  </div>

  <!-- Remaining 4 metrics -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
    ${[
      {name: 'Burstiness', id: 'burstiness', score: analysis.moduleScores[1], details: analysis.details.burstiness, subNames: ['Sentence Length Variation', 'Word Length Burstiness'], subKeys: ['sentence', 'word']},
      {name: 'Repetition', id: 'repetition', score: analysis.moduleScores[2], details: analysis.details.repetition, subNames: ['Bigram Repetition', 'Trigram Repetition'], subKeys: ['bigram', 'trigram']},
      {name: 'Sentence Length', id: 'sentence-length', score: analysis.moduleScores[3], details: analysis.details.sentenceLength, subNames: ['Average Length', 'Sentence Complexity'], subKeys: ['avg', 'complexity']},
      {name: 'Vocabulary', id: 'vocabulary', score: analysis.moduleScores[4], details: analysis.details.vocabulary, subNames: ['Diversity', 'Rare Word Frequency'], subKeys: ['diversity', 'rare']}
    ].map(m => {
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const sub1Score = m.details.scores[m.subKeys[0]];
      const sub2Score = m.details.scores[m.subKeys[1]];
      const failedItems = [];
      if (sub1Score < 10) failedItems.push({ name: m.subNames[0], fix: fixFor(m.subNames[0]) });
      if (sub2Score < 10) failedItems.push({ name: m.subNames[1], fix: fixFor(m.subNames[1]) });
      const failedCount = failedItems.length;
      const failedNames = failedItems.map(f => f.name).join(', ') || 'none';
      const cmsName = (typeof cmsInfo !== 'undefined' && cmsInfo?.name) ? cmsInfo.name : 'Unknown';
      return `
      <div class="score-card bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center border-l-4 flex flex-col" style="border-left-color: ${gradeColor}">
        <div class="relative w-32 h-32 mx-auto">
          <svg viewBox="0 0 128 128" class="-rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${gradeColor}" stroke-width="12" fill="none" stroke-dasharray="${m.score * 17.6} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold" style="color: ${gradeColor}">${m.score}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-4 text-xl font-bold" style="color: ${gradeColor}">${m.name}</p>
        <p class="mt-1 text-lg flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
        <div class="mt-3 space-y-2 text-sm">
          <p class="font-medium" style="color: ${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)} ${m.subNames[0]}</p>
          <p class="font-medium" style="color: ${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)} ${m.subNames[1]}</p>
        </div>

        <p class="mt-3 text-sm">
          <a href="/blog/posts/ai-content-detection-guide/#${m.id}" class="text-orange-500 font-bold hover:underline">How ${m.name} is tested? →</a>
        </p>

        <div class="mt-auto pt-5">
          <button type="button" class="fixes-toggle w-full mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition" data-failed-count="${failedCount}">
            Show Fixes (${failedCount})
          </button>
        </div>

        <div class="fixes-panel hidden mt-4 space-y-4 text-left">
          ${failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold">All tests passed! ✅</p>` : ''}
          ${failedItems.map((f, i) => {
            const rule = deriveSelectorsForFailure(f.name);
            return `
            <div class="${i > 0 ? 'pt-4 border-t border-gray-200 dark:border-gray-700' : ''}">
              <p class="font-bold text-red-600 dark:text-red-400 mb-2 leading-snug">❌ ${escapeHtml(f.name)}</p>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${escapeHtml(f.fix)}</p>
              ${rule ? `
                <button type="button"
                        class="show-code-btn mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        data-failure="${escapeHtml(f.name)}">
                  🔍 Show the code
                </button>
              ` : ''}
            </div>
          `;
          }).join('')}

          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <a href="#ask-ai-section" class="ask-ai-link block text-purple-600 dark:text-purple-400 font-bold hover:underline"
               data-ai-question="How do I improve my ${m.name} score? Failed checks: ${failedNames}. Detected CMS: ${cmsName}. Module score: ${m.score}/20. Please give me ${cmsName}-specific fixes.">
              🤖 Ask AI about this module →
            </a>
            <a href="/blog/posts/ai-content-detection-guide/#${m.id}" class="block text-orange-500 font-bold hover:underline">
              📖 Read the full ${m.name} guide →
            </a>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>
</div>

<!-- Top Priority Fixes -->
<div class="mt-20 space-y-8">
  <h2 class="text-4xl md:text-5xl font-black text-center text-gray-500 dark:text-gray-100">Top Priority Fixes</h2>
  ${(() => {
    const priorityModules = [
      {
        name: 'Perplexity',
        score: analysis.moduleScores[0],
        details: analysis.details.perplexity,
        fixes: [
          analysis.details.perplexity.scores.trigram < 10 ? 'To improve trigram entropy, deliberately introduce unexpected word combinations and personal anecdotes that don’t follow common patterns. This breaks predictable flows and makes your writing feel more spontaneous and human. Avoid sticking to safe, formulaic phrasing—edit specifically for surprise in every few sentences.' : '',
          analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy by actively swapping overused two-word pairs with creative alternatives or rephrased expressions. Incorporate transitional phrases that aren’t common and sprinkle in idiomatic expressions unique to your voice. These small changes create a less robotic rhythm and significantly increase overall unpredictability.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Burstiness',
        score: analysis.moduleScores[1],
        details: analysis.details.burstiness,
        fixes: [
          analysis.details.burstiness.scores.sentence < 10 ? 'To increase sentence burstiness, consciously alternate between short, punchy sentences and longer, more detailed ones throughout your paragraphs. This variation mimics natural human speech rhythm and keeps readers engaged. Go through your text and intentionally split or combine sentences to eliminate uniform length patterns.' : '',
          analysis.details.burstiness.scores.word < 10 ? 'Improve word length burstiness by mixing very short, simple words with longer, descriptive ones to avoid monotony. Use everyday terms alongside occasional specialized or evocative vocabulary where it fits naturally. This creates subtle emphasis and makes the content feel more authentic and less mechanically generated.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Repetition',
        score: analysis.moduleScores[2],
        details: analysis.details.repetition,
        fixes: [
          analysis.details.repetition.scores.bigram < 10 ? 'Reduce bigram repetition by identifying the most common two-word phrases in your text and replacing them with synonyms or fully restructured sentences. Use a thesaurus strategically and ensure no single phrase dominates the content. This simple edit makes your writing far more dynamic and less predictable to both readers and search engines.' : '',
          analysis.details.repetition.scores.trigram < 10 ? 'To fix trigram repetition, scan for any three-word sequences that appear multiple times and rewrite them with fresh vocabulary or different sentence structure. Introduce new transitional ideas to break recurring patterns. Consistent variation here dramatically improves the natural flow and reduces obvious AI-like flags.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Sentence Length',
        score: analysis.moduleScores[3],
        details: analysis.details.sentenceLength,
        fixes: [
          analysis.details.sentenceLength.scores.avg < 10 ? 'Bring your average sentence length into the ideal 15–23 word range by breaking up overly long run-on sentences and combining short, choppy ones where appropriate. This balance significantly improves readability and flow for all readers. Make it a habit to count words per sentence during final edits to maintain optimal rhythm.' : '',
          analysis.details.sentenceLength.scores.complexity < 10 ? 'Increase sentence complexity by adding subordinate clauses using commas, semicolons, or conjunctions to layer related ideas naturally. This adds depth and sophistication without overwhelming the reader. Aim for 1–2 clauses in key sentences to better reflect complex human thought processes.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Vocabulary',
        score: analysis.moduleScores[4],
        details: analysis.details.vocabulary,
        fixes: [
          analysis.details.vocabulary.scores.diversity < 10 ? 'Boost vocabulary diversity by actively using synonyms and avoiding repetition of the same words throughout your content. Draw from broader themes, analogies, or related concepts to naturally introduce new terms. Higher unique word usage signals expertise and depth to both readers and search engines.' : '',
          analysis.details.vocabulary.scores.rare < 10 ? 'Enhance rare word frequency by incorporating context-specific or niche terms that appear only once or twice in the text. Research specialized vocabulary relevant to your topic and weave it in thoughtfully. These unique words create an authentic, authoritative tone that stands out as genuinely human-written.' : ''
        ].filter(f => f).join('<br><br>')
      }
    ];
    const priority = priorityModules
      .filter(m => m.score < 20 && m.fixes)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
    if (priority.length === 0) {
      return `
        <div class="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-green-500">
          <h3 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-6 text-center">No Major Fixes Needed!</h3>
          <p class="text-lg text-center text-gray-800 dark:text-gray-200">All modules scored 20/20. Your content is highly human-like and optimized.</p>
        </div>`;
    }
    return priority.map((m, i) => {
      const sub1Score = m.name === 'Perplexity' ? m.details.scores.trigram : m.name === 'Burstiness' ? m.details.scores.sentence : m.name === 'Repetition' ? m.details.scores.bigram : m.name === 'Sentence Length' ? m.details.scores.avg : m.details.scores.diversity;
      const sub2Score = m.name === 'Perplexity' ? m.details.scores.bigram : m.name === 'Burstiness' ? m.details.scores.word : m.name === 'Repetition' ? m.details.scores.trigram : m.name === 'Sentence Length' ? m.details.scores.complexity : m.details.scores.rare;
      const sub1Name = m.name === 'Perplexity' ? 'Trigram Entropy' : m.name === 'Burstiness' ? 'Sentence Length Variation' : m.name === 'Repetition' ? 'Bigram Repetition' : m.name === 'Sentence Length' ? 'Average Length' : 'Diversity';
      const sub2Name = m.name === 'Perplexity' ? 'Bigram Entropy' : m.name === 'Burstiness' ? 'Word Length Burstiness' : m.name === 'Repetition' ? 'Trigram Repetition' : m.name === 'Sentence Length' ? 'Sentence Complexity' : 'Rare Word Frequency';
      return `
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-8 md:p-10 shadow-lg border-l-8 border-orange-500">
          <div class="flex items-center mb-4">
            <div class="text-5xl font-black text-orange-600 dark:text-orange-400 mr-6">${i + 1}</div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">${m.name} – ${m.score}/20</h3>
              <div class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span style="color:${getSubColor(sub1Score)}">${getSubEmoji(sub1Score)}</span> ${sub1Name}</p>
                <p><span style="color:${getSubColor(sub2Score)}">${getSubEmoji(sub2Score)}</span> ${sub2Name}</p>
              </div>
            </div>
          </div>
          <p class="text-lg text-gray-800 dark:text-gray-200 mt-6"><span class="font-bold text-orange-600 dark:text-orange-400">Recommended Fix:</span><br><br>${m.fixes || 'Focus on improving variation and authenticity in this area.'}</p>
        </div>`;
    }).join('');
  })()}
</div>

<!-- Human Score & Potential Gains -->
<div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
    <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Human Score Improvement</h3>
    <div class="flex justify-center items-baseline gap-4 mb-8">
      <div class="text-5xl font-black text-gray-500">${yourScore}</div>
      <div class="text-4xl text-gray-400">→</div>
      <div class="text-6xl font-black text-green-500">${Math.min(100, yourScore + boost)}</div>
      <div class="text-2xl text-green-600 font-medium">(${boost > 0 ? '+' + boost : 'Optimal'})</div>
    </div>
    ${failingModules === 0 ? `
      <div class="text-center py-8">
        <p class="text-4xl mb-4">🎉 Optimal Human Score Achieved!</p>
        <p class="text-lg text-gray-600 dark:text-gray-400">Your content shows excellent human-like patterns. Focus on building authority with quality backlinks.</p>
      </div>
    ` : `
      <div class="space-y-4">
        <p class="font-medium text-gray-700 dark:text-gray-300 text-center mb-4">Top priority fixes & estimated impact:</p>
        ${[
          {name: 'Perplexity', score: analysis.moduleScores[0], impact: '15–25 points'},
          {name: 'Burstiness', score: analysis.moduleScores[1], impact: '10–20 points'},
          {name: 'Repetition', score: analysis.moduleScores[2], impact: '10–20 points'},
          {name: 'Sentence Length', score: analysis.moduleScores[3], impact: '10–20 points'},
          {name: 'Vocabulary', score: analysis.moduleScores[4], impact: '15–25 points'}
        ].filter(m => m.score < 20)
         .sort((a, b) => a.score - b.score)
         .slice(0, 3)
         .map(m => `
          <div class="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <span class="text-sm md:text-base">${m.name}</span>
            <span class="font-bold text-orange-600">${m.impact}</span>
          </div>
        `).join('')}
      </div>
    `}
    <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
      <summary class="cursor-pointer font-medium text-orange-500 hover:underline">How We Calculated This</summary>
      <div class="mt-4 space-y-2">
        <p>• Perplexity & Vocabulary: High weight (up to 25 points each) – critical for authenticity</p>
        <p>• Burstiness & Sentence Length: Medium weight (up to 20 points) – improves natural rhythm</p>
        <p>• Repetition: Medium weight (up to 20 points) – reduces pattern detection</p>
        <p>• Top-ranking pages typically achieve 85+ human scores</p>
        <p class="italic">Conservative estimates — actual gains may vary</p>
      </div>
    </details>
  </div>
  <div class="p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
    ${failingModules === 0 ? `
      <div class="text-center py-12">
        <p class="text-4xl mb-4">🌟 Elite Human-Like Performance</p>
        <p class="text-xl">Your page demonstrates strong human patterns. Next step: build topical authority with backlinks and fresh content.</p>
      </div>
    ` : `
      <div class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="text-4xl">📈</div>
          <div class="flex-1">
            <p class="font-medium">Ranking Position Lift</p>
            <p class="text-2xl font-bold">5–20 positions potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🚀</div>
          <div class="flex-1">
            <p class="font-medium">Organic Traffic Increase</p>
            <p class="text-2xl font-bold">+15–40% potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">👥</div>
          <div class="flex-1">
            <p class="font-medium">User Engagement Boost</p>
            <p class="text-2xl font-bold">Higher dwell time & lower bounce</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🔍</div>
          <div class="flex-1">
            <p class="font-medium">Search Visibility Enhancement</p>
            <p class="text-2xl font-bold">Stronger presence in queries</p>
          </div>
        </div>
      </div>
    `}
    <div class="mt-10 text-sm space-y-2 opacity-90">
      <p>Conservative estimates based on on-page human pattern benchmarks.</p>
      <p>Improvements typically visible within 1–4 weeks after re-crawl.</p>
      <p>Actual results depend on competition, domain authority, and off-page factors.</p>
    </div>
  </div>
</div>
<!-- CMS Fixes -->
<div id="cms-fixes-section" class="mt-20 max-w-4xl mx-auto px-2">
  <h2 class="text-3xl font-black text-center mb-2">🛠️ Generate CMS Fixes</h2>
  <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
    Get step-by-step humanization fix instructions tailored to your CMS.
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
      No fixes needed — your content is highly human-like. 🎉
    </p>
  </div>

  <div id="cms-fixes-answer-container" class="mt-6 hidden">
    <div id="cms-fixes-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
  </div>
</div>
<div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-2">
            <h2 class="text-3xl font-black text-center mb-2">🤖 Ask Traffic Torch AI About AI Content</h2>
            <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
              Get tailored answers about AI detection metrics, perplexity, burstiness, repetition, and specific improvement steps.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
<textarea id="ai-question-input" placeholder="e.g., Why is my Perplexity low? How do I improve Burstiness?" rows="3" class="flex-1 p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y min-h-[60px]"></textarea>
              <button id="ask-ai-btn" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg whitespace-nowrap">Ask AI</button>
            </div>
            <div id="ai-answer-container" class="mt-6 hidden">
              <div id="ai-answer-content" class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-700"></div>
            </div>
          </div>

<!-- Share Dashboard Container (replaces old share/feedback buttons) -->
<div id="share-dashboard-container" class="mt-16"></div>
        `;

        // Radar chart
        setTimeout(() => {
          const canvas = document.getElementById('health-radar');
          if (canvas) {
            try {
              const ctx = canvas.getContext('2d');
              const labelColor = '#9ca3af';
              const gridColor = 'rgba(156, 163, 175, 0.3)';
              const borderColor = '#fb923c';
              const fillColor = 'rgba(251, 146, 60, 0.15)';
              const normalizedScores = modules.map(m => m.score * 5);
              window.myChart = new Chart(ctx, {
                type: 'radar',
                data: {
                  labels: modules.map(m => m.name),
                  datasets: [{
                    label: 'Human-Like Score',
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
                          return `${context.dataset.label}: ${rawScore}/20 (${context.parsed.r}/100)`;
                        }
                      }
                    }
                  }
                }
              });
            } catch (e) {}
          }
        }, 150);

        // ─── Remove old initShareReport / initSubmitFeedback ──────────
        // initShareReport(results);   // removed
        // initSubmitFeedback(results); // removed

        // ─── Set data-url ──────────────────────────────────────────────
        let displayUrl = 'traffictorch.net';
        if (isUrlMode) {
          let fullUrl = urlInput.value.trim();
          if (fullUrl) {
            let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
            const firstSlash = cleaned.indexOf('/');
            displayUrl = firstSlash !== -1 ? cleaned.slice(0, firstSlash) + '\n' + cleaned.slice(firstSlash) : cleaned;
          }
        }
        document.body.setAttribute('data-url', displayUrl);

        // ─── Prepare and initialise share dashboard ──────────────────
        const moduleScores = modules.map(m => ({ name: m.name, score: m.score }));

        const passedMetrics = [];
        const failedMetrics = [];
        // Collect sub-metrics pass/fail (score >= 10 is pass)
        const subMetricsMap = {
          'Perplexity': ['Trigram Entropy', 'Bigram Entropy'],
          'Burstiness': ['Sentence Length Variation', 'Word Length Burstiness'],
          'Repetition': ['Bigram Repetition', 'Trigram Repetition'],
          'Sentence Length': ['Average Length', 'Sentence Complexity'],
          'Vocabulary': ['Diversity', 'Rare Word Frequency']
        };
        const subScoresMap = {
          'Perplexity': [analysis.details.perplexity.scores.trigram, analysis.details.perplexity.scores.bigram],
          'Burstiness': [analysis.details.burstiness.scores.sentence, analysis.details.burstiness.scores.word],
          'Repetition': [analysis.details.repetition.scores.bigram, analysis.details.repetition.scores.trigram],
          'Sentence Length': [analysis.details.sentenceLength.scores.avg, analysis.details.sentenceLength.scores.complexity],
          'Vocabulary': [analysis.details.vocabulary.scores.diversity, analysis.details.vocabulary.scores.rare]
        };
        modules.forEach(m => {
          const subs = subMetricsMap[m.name] || [];
          const scores = subScoresMap[m.name] || [];
          subs.forEach((name, idx) => {
            const score = scores[idx] || 0;
            if (score >= 10) {
              passedMetrics.push(name);
            } else {
              failedMetrics.push(name);
            }
          });
          // Also add module-level pass/fail (score >= 20 as pass)
          if (m.score >= 20) {
            passedMetrics.push(m.name);
          } else {
            failedMetrics.push(m.name);
          }
        });

        // Build aiFixes from top priority fixes (the same 'priority' array)
        const priorityModules = [
          {
            name: 'Perplexity',
            score: analysis.moduleScores[0],
            details: analysis.details.perplexity,
            fixes: [
              analysis.details.perplexity.scores.trigram < 10 ? 'Improve trigram entropy with unexpected word combinations.' : '',
              analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy with creative phrase variations.' : ''
            ].filter(f => f).join('; ')
          },
          {
            name: 'Burstiness',
            score: analysis.moduleScores[1],
            details: analysis.details.burstiness,
            fixes: [
              analysis.details.burstiness.scores.sentence < 10 ? 'Alternate short and long sentences for rhythm.' : '',
              analysis.details.burstiness.scores.word < 10 ? 'Mix short and long words for variety.' : ''
            ].filter(f => f).join('; ')
          },
          {
            name: 'Repetition',
            score: analysis.moduleScores[2],
            details: analysis.details.repetition,
            fixes: [
              analysis.details.repetition.scores.bigram < 10 ? 'Replace common two-word phrases with synonyms.' : '',
              analysis.details.repetition.scores.trigram < 10 ? 'Rewrite recurring three-word sequences.' : ''
            ].filter(f => f).join('; ')
          },
          {
            name: 'Sentence Length',
            score: analysis.moduleScores[3],
            details: analysis.details.sentenceLength,
            fixes: [
              analysis.details.sentenceLength.scores.avg < 10 ? 'Balance average sentence length (15–23 words).' : '',
              analysis.details.sentenceLength.scores.complexity < 10 ? 'Add clauses for sentence complexity.' : ''
            ].filter(f => f).join('; ')
          },
          {
            name: 'Vocabulary',
            score: analysis.moduleScores[4],
            details: analysis.details.vocabulary,
            fixes: [
              analysis.details.vocabulary.scores.diversity < 10 ? 'Use synonyms to boost vocabulary diversity.' : '',
              analysis.details.vocabulary.scores.rare < 10 ? 'Add niche-specific rare words.' : ''
            ].filter(f => f).join('; ')
          }
        ];
        const priority = priorityModules
          .filter(m => m.score < 20 && m.fixes)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3);
        const aiFixes = priority.map(m => m.name + ': ' + m.fixes);

        const shareUrl = isUrlMode ? urlInput.value.trim() : '';
        const shareData = {
          toolName: 'AI Audit Tool',
          url: shareUrl || displayUrl,
          pageTitle: doc?.title || 'AI Audit Page',
          overallScore: yourScore,
          moduleScores: moduleScores,
          passedMetrics: passedMetrics,
          failedMetrics: failedMetrics,
          aiFixes: aiFixes,
          rawData: { modules, analysis, priority },
          shareLink: shareUrl ? `${window.location.origin}/ai-audit-tool/?url=${encodeURIComponent(shareUrl)}` : ''
        };

        const shareContainer = document.getElementById('share-dashboard-container');
        if (shareContainer) {
          if (shareUrl) {
            initShareModule(shareContainer, shareData);
          } else {
            shareContainer.innerHTML = `
              <div class="text-center text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-600 rounded-xl">
                <p>Sharing is available for live URLs only. Please run the analysis with a URL to share this report.</p>
              </div>
            `;
          }
        }

        const askBtn = document.getElementById('ask-ai-btn');
        const askInput = document.getElementById('ai-question-input');
        const modelSelect = document.getElementById('ai-model-select');
        const answerContainer = document.getElementById('ai-answer-container');
        const answerContent = document.getElementById('ai-answer-content');

        if (askBtn) {
          const newAskBtn = askBtn.cloneNode(true);
          askBtn.parentNode.replaceChild(newAskBtn, askBtn);

          newAskBtn.addEventListener('click', async () => {
            const canProceed = await canRunTool('ai-audit-tool');
            if (!canProceed) return;

            const question = askInput?.value?.trim();
            if (!question) {
              alert('Please enter a question.');
              return;
            }

            const selectedModel = modelSelect?.value || '@cf/deepseek-ai/deepseek-v4-flash-0731';

            newAskBtn.disabled = true;
            newAskBtn.textContent = 'Thinking...';
            answerContainer.classList.remove('hidden');
            answerContent.innerHTML = '⏳ Traffic Torching...';

            try {
              // Build module scores for the payload
              const moduleScoresMap = {};
              modules.forEach(m => {
                const key = m.name.toLowerCase().replace(/\s+/g, '');
                moduleScoresMap[key] = m.score;
              });

              const auditPayload = {
                question: question,
                auditData: {
                  url: isUrlMode ? urlInput.value.trim() : '',
                  pageTitle: doc?.title || 'AI Audit Page',
                  overallScore: yourScore,
                  scores: {
                    perplexity: moduleScoresMap.perplexity || 0,
                    burstiness: moduleScoresMap.burstiness || 0,
                    repetition: moduleScoresMap.repetition || 0,
                    sentenceLength: moduleScoresMap.sentencelength || 0,
                    vocabulary: moduleScoresMap.vocabulary || 0
                  },
                  flags: {
                    trigramEntropy: analysis.details.perplexity.scores.trigram >= 10,
                    bigramEntropy: analysis.details.perplexity.scores.bigram >= 10,
                    sentenceBurstiness: analysis.details.burstiness.scores.sentence >= 10,
                    wordBurstiness: analysis.details.burstiness.scores.word >= 10,
                    bigramRepetition: analysis.details.repetition.scores.bigram >= 10,
                    trigramRepetition: analysis.details.repetition.scores.trigram >= 10,
                    avgSentenceLength: analysis.details.sentenceLength.scores.avg >= 10,
                    sentenceComplexity: analysis.details.sentenceLength.scores.complexity >= 10,
                    vocabularyDiversity: analysis.details.vocabulary.scores.diversity >= 10,
                    rareWordFrequency: analysis.details.vocabulary.scores.rare >= 10
                  },
                  failedItems: failedMetrics.slice(0, 10),
                  priorityFixes: priority.map(m => m.name + ': ' + m.fixes)
                }
              };

              const response = await fetch('https://ai-audit-ai.traffictorch.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(auditPayload)
              });

              if (!response.ok) throw new Error(`Server error (${response.status})`);

              const data = await response.json();

              if (data.success) {
                answerContent.innerHTML = `🧠 <strong>Traffic Torch AI</strong><br><br>${data.answer}`;
              } else {
                answerContent.innerHTML = `❌ Error: ${data.error || 'Unknown error'}`;
              }

            } catch (err) {
              answerContent.innerHTML = `❌ Failed to get AI response. Please try again later. (${err.message})`;
            } finally {
              newAskBtn.disabled = false;
              newAskBtn.textContent = 'Ask AI';
            }
          });
        }

        // ─── CMS Fixes Logic ──────────────────────────────────────────
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

        if (priority.length === 0) {
          if (cmsFixesBtn) {
            cmsFixesBtn.disabled = true;
            cmsFixesBtn.classList.add('opacity-50', 'cursor-not-allowed');
          }
          cmsNoFixes?.classList.remove('hidden');
        }

        cmsFixesBtn?.addEventListener('click', async () => {
          if (priority.length === 0) return;

          const canProceed = await canRunTool('ai-audit-tool');
          if (!canProceed) return;

          const selectedCms     = cmsOverrideSelect?.value?.trim() || cmsInfo.name || 'Custom / Unknown';
          const selectedVersion = cmsOverrideVersion?.value?.trim() || cmsInfo.version || null;

          cmsFixesBtn.disabled = true;
          const originalLabel = cmsFixesBtn.textContent;
          cmsFixesBtn.textContent = 'Generating...';
          cmsAnswerContainer?.classList.remove('hidden');
          if (cmsAnswerContent) cmsAnswerContent.textContent = '⏳ Traffic Torching...';

          try {
            const payload = {
              cms: selectedCms,
              cmsVersion: selectedVersion,
              cmsConfidence: cmsInfo.confidence,
              cmsSignals: cmsInfo.signals,
              url: isUrlMode ? urlInput.value.trim() : null,
              pageTitle: doc?.title || null,
              overallScore: yourScore,
              scores: {
                perplexity: analysis.moduleScores[0],
                burstiness: analysis.moduleScores[1],
                repetition: analysis.moduleScores[2],
                sentenceLength: analysis.moduleScores[3],
                vocabulary: analysis.moduleScores[4]
              },
              priorityFixes: priority.slice(0, 3).map(f => ({
                module: f.name,
                name: f.name,
                howToFix: f.fixes
              })),
              mode: isUrlMode ? 'live-url' : 'pasted-code'
            };

            const response = await fetch('https://ai-audit-cms-fixes.traffictorch.workers.dev/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Server error (${response.status})`);

            const data = await response.json();

            if (data.success && cmsAnswerContent) {
              cmsAnswerContent.textContent = '';

              const header = document.createElement('div');
              header.style.fontWeight = 'bold';
              header.style.marginBottom = '0.75rem';
              header.textContent = '🛠️ CMS Fixes for ' +
                (data.cms || selectedCms) +
                (data.cmsVersion ? ' ' + data.cmsVersion : '');

              const body = document.createElement('div');
              body.textContent = data.answer || '';

              cmsAnswerContent.appendChild(header);
              cmsAnswerContent.appendChild(body);
            } else if (cmsAnswerContent) {
              cmsAnswerContent.textContent = '❌ Error: ' + (data.error || 'Unknown error');
            }

          } catch (err) {
            if (cmsAnswerContent) {
              cmsAnswerContent.textContent = '❌ Failed to generate CMS fixes. Please try again. (' + err.message + ')';
            }
          } finally {
            cmsFixesBtn.disabled = false;
            cmsFixesBtn.textContent = originalLabel;
          }
        });

      }, remaining);

    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Whitelist: full-render-v2.traffictorch.workers.dev or use Code Analysis.</p>
          </div>
        `;
      }, remaining);
    }
  }

  // Attach both forms to the unified handler
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runAnalysis(true);
  });

  codeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runAnalysis(false);
  });

  // ── Delegated handler for score-card toggles + Ask-AI links + Show-the-code ──
  document.addEventListener('click', (e) => {
    // Fixes toggle
    const toggle = e.target.closest('.fixes-toggle');
    if (toggle) {
      const card = toggle.closest('.score-card');
      const panel = card?.querySelector('.fixes-panel');
      if (panel) {
        const isHidden = panel.classList.contains('hidden');
        panel.classList.toggle('hidden');
        const failedCount = toggle.dataset.failedCount || '0';
        toggle.textContent = isHidden
          ? `Hide Fixes (${failedCount})`
          : `Show Fixes (${failedCount})`;
      }
      return;
    }

    // Show the code for a failure
    const showCodeBtn = e.target.closest('.show-code-btn');
    if (showCodeBtn) {
      e.preventDefault();
      const failureText = showCodeBtn.dataset.failure || '';
      const html = results.dataset.renderedHtml || '';
      showCodeForFailure(failureText, html, { title: 'Affected code' });
      return;
    }

    // Ask AI about this module
    const askLink = e.target.closest('.ask-ai-link');
    if (askLink) {
      e.preventDefault();
      const section = document.getElementById('ask-ai-section');
      const textarea = document.getElementById('ai-question-input');
      if (section && textarea) {
        textarea.value = askLink.dataset.aiQuestion || '';
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => textarea.focus(), 700);
      }
      return;
    }
  });
});