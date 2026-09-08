// ai-voice-search-tool/script-v1.1.js

import { computeAIVisibility } from './modules/ai-visibility.js';
import { computeContentQuality } from './modules/content-quality.js';
import { computeSnippetVisibility } from './modules/snippet-visibility.js';
import { computeSentimentQuality } from './modules/sentiment-quality.js';
import { computeTraditionalKeywords } from './modules/traditional-keywords.js';
import { canRunTool } from '/main-v1.1.js';
// Replace old share/feedback imports with the new dashboard
import { initShareModule } from '/share-module.js';

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const urlInput = document.getElementById('url-input');
  const codeInput = document.getElementById('code-input');
  const analyzeCodeBtn = document.getElementById('analyze-code-btn');
  const results = document.getElementById('results');
  
  // === ADD THIS EVENT LISTENER RIGHT AFTER THE VARIABLE DECLARATIONS ===
  analyzeCodeBtn.addEventListener('click', async () => {
    const htmlContent = codeInput.value.trim();
    if (!htmlContent) {
      alert("Please paste HTML code into the textarea first.");
      codeInput.focus();
      return;
    }
    urlInput.value = ''; // clear URL field when using code analysis
    await runAnalysis(htmlContent);
  });
  
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

  // Auto-fill input from shared report deep link (?url=...)
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
    text = text.replace(/\s+/g, ' ').trim();
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

  function getGradeColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  }

  function getOverallEmojiGrade(score) {
    if (score >= 80) return { emoji: '✅', text: 'Strong AI Voice Optimization', color: '#10b981' };
    if (score >= 60) return { emoji: '⚠️', text: 'Moderate – Needs Tuning', color: '#f97316' };
    return { emoji: '❌', text: 'Needs Significant Work', color: '#ef4444' };
  }

  function getModuleGrade(score) {
    if (score >= 80) return { emoji: '✅', text: 'Excellent', color: '#10b981' };
    if (score >= 60) return { emoji: '⚠️', text: 'Good – Improve', color: '#f97316' };
    return { emoji: '❌', text: 'Needs Work', color: '#ef4444' };
  }

  // Unified analysis function used by both URL and Code buttons
  async function runAnalysis(htmlContent, pageUrl = '') {
    analyzedText = '';
    wordCount = 0;
    const canProceed = await canRunTool('limit-audit-id');
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

    // Auto scroll to spinner immediately when any button is clicked
    setTimeout(() => {
      const offset = 240;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
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
    let delay = 600;
    messages.forEach(msg => {
      setTimeout(() => {
        if (progressText) progressText.textContent = msg;
      }, delay);
      delay += 700;
    });

    const minLoadTime = 5500;
    const startTime = Date.now();

    try {
      const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
      const mainElement = getMainContent(doc);
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;

      const analysis = analyzeVoiceContent(text, doc);
      const yourScore = analysis.totalScore;
      const mainGrade = getOverallEmojiGrade(yourScore);
      const mainGradeColor = mainGrade.color;
      const verdict = mainGrade.text;
      const verdictEmoji = mainGrade.emoji;

      const modules = [
        { name: 'AI Visibility', score: analysis.moduleScores[0], id: 'ai-visibility', info: 'Simulates citation/share of voice in AI assistants like Gemini/ChatGPT voice. High score = frequent brand mentions in spoken answers.' },
        { name: 'Content Quality', score: analysis.moduleScores[1], id: 'content-quality', info: 'Evaluates readability, entity richness, conciseness for AI synthesis & voice readout.' },
        { name: 'Snippet & Visibility', score: analysis.moduleScores[2], id: 'snippet-visibility', info: 'Checks formats eligible for featured snippets/AI Overviews used in voice.' },
        { name: 'Sentiment & Quality', score: analysis.moduleScores[3], id: 'sentiment-quality', info: 'Assesses positive tone & hallucination risk for trustworthy AI voice outputs.' },
        { name: 'Keywords', score: analysis.moduleScores[4], id: 'traditional-keywords', info: 'Measures conversational long-tail density & question coverage.' }
      ];

      const scores = modules.map(m => m.score);
      const failingModules = modules.filter(m => m.score < 20).length;
      const boost = failingModules * 15;
      const optimizedScore = Math.min(100, yourScore + boost);

      // ─── Compute top failed sub‑metrics for priority fixes ──────────
      const allFailed = [];
      modules.forEach(m => {
        const detailsKey = m.id.split('-').map((w,i)=>i===0?w:w.charAt(0).toUpperCase()+w.slice(1)).join('');
        const subMetrics = analysis.details?.[detailsKey]?.subMetrics || [];
        subMetrics.forEach(s => {
          if (s.score < 60) {
            allFailed.push({
              moduleName: m.name,
              subName: s.name,
              score: s.score,
              fix: s.fix || 'Improve this metric for better voice SEO performance.',
              impact: s.name.includes('Visibility') || s.name.includes('Snippet') ? 25 : s.name.includes('Content') || s.name.includes('Quality') ? 20 : s.name.includes('Keywords') ? 15 : 10
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
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        results.innerHTML = `
<!-- Overall Score Card -->
<div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
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
<div class="space-y-8 max-w-3xl mx-auto px-4">
  ${(() => {
    const m = modules[0];
    const grade = getModuleGrade(m.score);
    const gradeColor = grade.color;
    const detailsKey = m.id.split('-').map((w,i)=>i===0?w:w.charAt(0).toUpperCase()+w.slice(1)).join('');
    const details = analysis.details?.[detailsKey] || {};
    const subMetrics = details.subMetrics || [];
    const failedCount = Array.isArray(subMetrics) ? subMetrics.filter(s => s.score < 60).length : 0;
    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4 w-full" style="border-left-color: ${gradeColor}">
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
        ${Array.isArray(subMetrics) && subMetrics.length > 0 ? subMetrics.map(s => `
          <p class="font-medium" style="color: ${s.score >= 60 ? '#10b981' : '#ef4444'}">
            ${s.score >= 60 ? '✅' : '❌'} ${s.name} (${s.score})
          </p>
        `).join('') : '<p class="text-gray-500 dark:text-gray-400">Sub-metrics loading...</p>'}
      </div>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
        More Details
      </button>
      <div class="hidden mt-6 space-y-6 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
        <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is:</span> ${m.info || 'Analyzing module...'}</p>
        <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve:</span> Implement suggested fixes below to boost this module.</p>
        <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters:</span> Impacts AI voice visibility, synthesis quality, and rankings.</p>
        <a href="#${m.id}" class="block text-center mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
          Learn more about ${m.name} →
        </a>
      </div>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
        Show Fixes (${failedCount})
      </button>
      <div class="hidden mt-6 space-y-8">
        ${m.score >= 60 && failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All sub-metrics strong! ✅ Optimize further for top voice rankings.</p>` : ''}
        ${m.score < 60 ? `<p class="text-center text-red-600 dark:text-red-400 font-bold text-lg">Low score – apply fixes below to boost voice performance.</p>` : ''}
        ${subMetrics.filter(s => s.score < 60).map(s => `
          <div class="text-center">
            <div class="text-5xl mb-3" style="color: #ef4444">❌</div>
            <p class="font-bold text-xl mb-3" style="color: #ef4444">${s.name}</p>
            <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">
              Fix suggestion: ${s.fix || 'Improve this metric for better voice SEO performance.'}
            </p>
          </div>
        `).join('')}
        <a href="#${m.id}" class="block text-center mt-6 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
          How ${m.name} is tested? →
        </a>
      </div>
    </div>`;
  })()}
  <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
    ${modules.slice(1).map((m, index) => {
      const grade = getModuleGrade(m.score);
      const gradeColor = grade.color;
      const detailsKey = m.id.split('-').map((w,i)=>i===0?w:w.charAt(0).toUpperCase()+w.slice(1)).join('');
      const details = analysis.details?.[detailsKey] || {};
      const subMetrics = details.subMetrics || [];
      const failedCount = Array.isArray(subMetrics) ? subMetrics.filter(s => s.score < 60).length : 0;
      return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4" style="border-left-color: ${gradeColor}">
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
          ${Array.isArray(subMetrics) && subMetrics.length > 0 ? subMetrics.map(s => `
            <p class="font-medium" style="color: ${s.score >= 60 ? '#10b981' : '#ef4444'}">
              ${s.score >= 60 ? '✅' : '❌'} ${s.name} (${s.score})
            </p>
          `).join('') : '<p class="text-gray-500 dark:text-gray-400">Sub-metrics loading...</p>'}
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          More Details
        </button>
        <div class="hidden mt-6 space-y-6 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is:</span> ${m.info || 'Analyzing module...'}</p>
          <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve:</span> Implement suggested fixes below to boost this module.</p>
          <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters:</span> Impacts AI voice visibility, synthesis quality, and rankings.</p>
          <a href="#${m.id}" class="block text-center mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
            Learn more about ${m.name} →
          </a>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          Show Fixes (${failedCount})
        </button>
        <div class="hidden mt-6 space-y-8">
          ${m.score >= 60 && failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All sub-metrics strong! ✅ Optimize further for top voice rankings.</p>` : ''}
          ${m.score < 60 ? `<p class="text-center text-red-600 dark:text-red-400 font-bold text-lg">Low score – apply fixes below to boost voice performance.</p>` : ''}
          ${subMetrics.filter(s => s.score < 60).map(s => `
            <div class="text-center">
              <div class="text-5xl mb-3" style="color: #ef4444">❌</div>
              <p class="font-bold text-xl mb-3" style="color: #ef4444">${s.name}</p>
              <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">
                Fix suggestion: ${s.fix || 'Improve this metric for better voice SEO performance.'}
              </p>
            </div>
          `).join('')}
          <a href="#${m.id}" class="block text-center mt-6 text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium transition">
            How ${m.name} is tested? →
          </a>
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
  <div class="mt-16 px-4 max-w-5xl mx-auto">
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
<div id="ask-ai-section" class="mt-20 max-w-4xl mx-auto px-4">
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
<!-- Share Dashboard Container (replaces old share/feedback buttons) -->
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

        // ─── Remove old initShareReport / initSubmitFeedback ──────────
        // initShareReport(results);   // removed
        // initSubmitFeedback(results); // removed

        // ─── Set data-url ──────────────────────────────────────────────
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

        // ─── Prepare and initialise share dashboard ──────────────────
        const moduleScores = modules.map(m => ({ name: m.name, score: m.score }));

        const passedMetrics = [];
        const failedMetrics = [];
        // Collect sub-metrics pass/fail
        modules.forEach(m => {
          const detailsKey = m.id.split('-').map((w,i)=>i===0?w:w.charAt(0).toUpperCase()+w.slice(1)).join('');
          const subMetrics = analysis.details?.[detailsKey]?.subMetrics || [];
          subMetrics.forEach(s => {
            if (s.score >= 60) {
              passedMetrics.push(s.name);
            } else {
              failedMetrics.push(s.name);
            }
          });
          // Also add module-level pass/fail (score >= 60 as pass)
          if (m.score >= 60) {
            passedMetrics.push(m.name);
          } else {
            failedMetrics.push(m.name);
          }
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
        
                const askBtn = document.getElementById('ask-ai-btn');
        const askInput = document.getElementById('ai-question-input');
        const modelSelect = document.getElementById('ai-model-select');
        const answerContainer = document.getElementById('ai-answer-container');
        const answerContent = document.getElementById('ai-answer-content');

        if (askBtn) {
          const newAskBtn = askBtn.cloneNode(true);
          askBtn.parentNode.replaceChild(newAskBtn, askBtn);

          newAskBtn.addEventListener('click', async () => {
            const canProceed = await canRunTool('limit-audit-id');
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
            answerContent.innerHTML = '⏳ Consulting Traffic Torch AI...';

            try {
              // Build module scores for the payload
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
                    hasHighReadability: analysis.details?.contentQuality?.readabilityScore >= 60 || false
                  },
                  failedItems: failedMetrics.slice(0, 10),
                  priorityFixes: topFailed.map(f => f.subName + ': ' + f.fix)
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

// URL Form Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  codeInput.value = '';
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Show loader BEFORE any async calls or checks
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

  // Auto scroll to spinner immediately
  setTimeout(() => {
    const offset = 240;
    const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }, 50);

  try {
    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) {
      results.innerHTML = `
        <div class="text-center py-20">
          <p class="text-3xl text-red-500 font-bold">Usage limit reached</p>
          <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Please try again later or contact support.</p>
        </div>
      `;
      return;
    }

    const res = await fetch(PROXY + encodeURIComponent(normalizedUrl));
    if (!res.ok) throw new Error('Page not reachable');

    const html = await res.text();
    runAnalysis(html, normalizedUrl);   // Now safe — loader already shown, canRunTool already passed
  } catch (err) {
    results.innerHTML = `
      <div class="text-center py-20">
        <p class="text-3xl text-red-500 font-bold">Error: ${err.message}</p>
        <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Failed to analyze - Whitelist: full-render-v2.traffictorch.workers.dev or use Code Analysis.</p>
      </div>
    `;
  }
});
});