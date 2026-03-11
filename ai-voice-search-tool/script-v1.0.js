// ai-voice-search-tool/script-v1.0.js
// New client-side metric computers (create these files in /modules/ or inline simple functions)
import { computeAIVisibility } from './modules/ai-visibility.js';
import { computeContentQuality } from './modules/content-quality.js';
import { computeSnippetVisibility } from './modules/snippet-visibility.js';
import { computeSentimentQuality } from './modules/sentiment-quality.js';
import { computeTraditionalKeywords } from './modules/traditional-keywords.js';
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';
const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
 
  // Quick debug: check if compromise loaded (runs on page load)
  setTimeout(() => {
    if (typeof window.nlp === 'function') {
      console.log('compromise.js loaded successfully');
    } else {
      console.error('compromise.js failed to load – check CDN in index.html');
    }
  }, 2000);
 
     // Auto-fill input from shared report deep link (?url=...)
     const urlParams = new URLSearchParams(window.location.search);
     const sharedUrl = urlParams.get('url');
     if (sharedUrl && input) {
       input.value = decodeURIComponent(sharedUrl);
       // Auto-submit form to run analysis immediately on shared link load
       setTimeout(() => {
         form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
       }, 300);
     }
  const PROXY = 'https://rendered-proxy-basic.traffictorch.workers.dev/?url=';
  let analyzedText = '';
  let wordCount = 0;
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
function analyzeVoiceContent(text, doc) { // pass doc for schema/snippet parsing
  if (!text || text.length < 300) {
    return { moduleScores: [20,20,20,20,20], totalScore: 50, details: {} };
  }
  text = text.replace(/\s+/g, ' ').trim();
  // ... keep word/sentence prep
  const aiVisibility = computeAIVisibility(text, doc);
  const contentQuality = computeContentQuality(text);
  const snippetVisibility = computeSnippetVisibility(doc);
  const sentimentQuality = computeSentimentQuality(text);
  const traditionalKeywords = computeTraditionalKeywords(text);
  const moduleScores = [
    aiVisibility.score, // /100
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
      // ... etc
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
  form.addEventListener('submit', async (e) => {
  e.preventDefault();
  //const canProceed = await canRunTool('limit-audit-id');
  //if (!canProceed) return;
  const url = input.value.trim();
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    const urlToFetch = normalizedUrl;
    if (!url) return;
    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">Fetching page...</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Analyzing content for AI patterns – please wait</p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progressText');
    const messages = [
      "Fetching page...",
      "Extracting main content",
      "Analyzing predictability",
      "Measuring variation & rhythm",
      "Checking repetition patterns",
      "Evaluating structure & depth",
      "Assessing vocabulary richness",
      "Calculating final score..."
    ];
    let delay = 800;
    messages.forEach(msg => {
      setTimeout(() => {
        if (progressText) progressText.textContent = msg;
      }, delay);
      delay += 800;
    });
    const minLoadTime = 5500;
    const startTime = Date.now();
    try {
      const res = await fetch(PROXY + encodeURIComponent(urlToFetch));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
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
      // Define the 5 core AI Voice Search modules with correct scores
const modules = [
  { name: 'AI Visibility', score: analysis.moduleScores[0], id: 'ai-visibility', info: 'Simulates citation/share of voice in AI assistants like Gemini/ChatGPT voice. High score = frequent brand mentions in spoken answers.', /* details, fixes */ },
  { name: 'Content Quality', score: analysis.moduleScores[1], id: 'content-quality', info: 'Evaluates readability, entity richness, conciseness for AI synthesis & voice readout.', /* ... */ },
  { name: 'Snippet & Visibility', score: analysis.moduleScores[2], id: 'snippet-visibility', info: 'Checks formats eligible for featured snippets/AI Overviews used in voice.', /* ... */ },
  { name: 'Sentiment & Quality', score: analysis.moduleScores[3], id: 'sentiment-quality', info: 'Assesses positive tone & hallucination risk for trustworthy AI voice outputs.', /* ... */ },
  { name: 'Keyword Performance', score: analysis.moduleScores[4], id: 'traditional-keywords', info: 'Measures conversational long-tail density & question coverage.', /* ... */ }
];
      const scores = modules.map(m => m.score); // for radar chart
      const failingModules = modules.filter(m => m.score < 20).length;
      const boost = failingModules * 15;
      const optimizedScore = Math.min(100, yourScore + boost);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        // Scroll to results
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
<!-- Metrics Layout – 5 AI Voice Search Modules -->
<div class="space-y-8 max-w-5xl mx-auto px-4">
  ${modules.map((m, index) => {
    const grade = getModuleGrade(m.score);
    const gradeColor = grade.color;
    // Use details if available, fallback to empty
    const details = analysis.details?.[m.id.replace(/-/g, '')] || {};
    // Example sub-metrics – customize per module once details are populated
    const subMetrics = details.subMetrics || []; // array of {name, score}
    const failedCount = subMetrics.filter(s => s.score < 60).length;
    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4" style="border-left-color: ${gradeColor}">
      <div class="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 160 160" class="-rotate-90">
          <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="16" fill="none"/>
          <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none"
                  stroke-dasharray="${m.score * 2.2} 440" stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-5xl font-bold" style="color: ${gradeColor}">${m.score}</div>
          <div class="text-lg text-gray-500 dark:text-gray-400">/100</div>
        </div>
      </div>
      <p class="mt-6 text-2xl font-bold" style="color: ${gradeColor}">${m.name}</p>
      <p class="mt-2 text-xl flex items-center justify-center gap-2" style="color: ${gradeColor}">${grade.text} ${grade.emoji}</p>
      <!-- Sub-metrics (will show real values once details are structured) -->
      <div class="mt-4 space-y-3 text-base">
        ${subMetrics.length > 0 ? subMetrics.map(s => `
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
      </div>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
        Show Fixes (${failedCount})
      </button>
      <div class="hidden mt-6 space-y-8">
        ${failedCount === 0 ? `<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">All sub-metrics passed! ✅</p>` : ''}
        ${subMetrics.filter(s => s.score < 60).map(s => `
          <div class="text-center">
            <div class="text-5xl mb-3" style="color: #ef4444">❌</div>
            <p class="font-bold text-xl mb-3" style="color: #ef4444">${s.name}</p>
            <p class="text-gray-700 dark:text-gray-300 max-w-lg mx-auto">
              Fix suggestion: ${s.fix || 'Improve this metric for better voice SEO performance.'}
            </p>
          </div>
        `).join('')}
      </div>
    </div>`;
  }).join('')}
</div>
<!-- Keep existing buttons and forms unchanged -->
<div class="text-center my-16 px-4">
  <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
    <button id="share-report-btn"
            class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Share Report ↗️
    </button>
    <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
            class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Save Report 📥
    </button>
    <button id="feedback-btn"
            class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
     Submit Feedback 💬
    </button>
  </div>
  <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>
  <div id="share-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <!-- ... your existing share form code ... -->
  </div>
  <div id="feedback-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <!-- ... your existing feedback form code ... -->
  </div>
</div>
`;
        // RADAR CHART
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
                        return `${context.dataset.label}: ${rawScore}/100`;
                      }
                    }
                  }
                }
              }
            });
          } catch (e) {
            console.error('Radar chart failed', e);
          }
        }, 150);
       
        initShareReport(results);
        initSubmitFeedback(results);
        // Clean URL for PDF/print
        let fullUrl = document.getElementById('url-input').value.trim();
        let displayUrl = 'traffictorch.net';
        if (fullUrl) {
          let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
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
      }, remaining);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }, remaining);
    }
  });
});