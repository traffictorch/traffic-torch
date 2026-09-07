// script-v1.1.js — Topical Authority Audit Tool (refactored from entity extractor)
// Single-file version — modules inlined/minimized; heavy logic in Worker AI
import { canRunTool } from '/main-v1.1.js';
import { initShareModule } from '/share-module.js';  // <-- new import

const API_BASE = 'https://traffic-torch-auth.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const ANALYZE_ENDPOINT = 'https://topical-authority-ai.traffictorch.workers.dev/';

function getGrade(score) {
  if (score >= 70) return { text: 'Good', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
  if (score >= 40) return { text: 'Average', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Bad', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authority-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');

  const urlAnalyzeBtn = document.getElementById('url-analyze-btn');
  const codeAnalyzeBtn = document.getElementById('code-analyze-btn');
  const urlInput = document.getElementById('url-input');
  const codeInput = document.getElementById('code-input');

  if (!form || !loading || !results || !urlAnalyzeBtn || !codeAnalyzeBtn) {
    return;
  }

  // === AUTO-FILL + AUTO-RUN FROM ?input= QUERY PARAM ===
  function autoFillAndRunFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const inputData = params.get('input');
    if (!inputData) return;

    const textarea = document.getElementById('code-input');
    if (!textarea) return;

    textarea.value = decodeURIComponent(inputData);

    const urlInputEl = document.getElementById('url-input');
    if (urlInputEl) urlInputEl.value = '';

    const analyzeBtn = document.getElementById('code-analyze-btn') || 
                       document.getElementById('analyze-code-btn');

    if (analyzeBtn) {
      setTimeout(() => {
        analyzeBtn.click();
      }, 300);
    }
  }

  setTimeout(autoFillAndRunFromUrl, 150);

  // Auto-fill from shared link ?url=
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url');
  let sharedDecodedUrl = '';
  if (sharedUrl) {
    sharedDecodedUrl = decodeURIComponent(sharedUrl);
  }

  let hasCheckedLimit = false;

if (urlAnalyzeBtn) {
  urlAnalyzeBtn.addEventListener('click', async () => {
    if (hasCheckedLimit) return;
    hasCheckedLimit = true;
    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) {
      hasCheckedLimit = false;
      return;
    }

    if (codeInput) codeInput.value = '';

    let inputValue = urlInput?.value.trim();
    if (!inputValue && sharedDecodedUrl) {
      inputValue = sharedDecodedUrl;
      if (urlInput) urlInput.value = sharedDecodedUrl;
    }
    if (!inputValue) {
      alert('Please enter a URL');
      hasCheckedLimit = false;
      return;
    }

    const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;
    runAnalysis({ url, inputType: 'url', rawCode: null });
    hasCheckedLimit = false;
  });
}

if (codeAnalyzeBtn) {
  codeAnalyzeBtn.addEventListener('click', async () => {
    if (hasCheckedLimit) return;
    hasCheckedLimit = true;
    const canProceed = await canRunTool('limit-audit-id');
    if (!canProceed) {
      hasCheckedLimit = false;
      return;
    }

    if (urlInput) urlInput.value = '';

    const rawCode = codeInput?.value.trim();
    if (!rawCode) {
      alert('Please paste HTML code');
      hasCheckedLimit = false;
      return;
    }

    runAnalysis({ url: null, inputType: 'code', rawCode });
    hasCheckedLimit = false;
  });
}

  // Shared analysis runner
  async function runAnalysis(params) {
    const { url, inputType, rawCode } = params;
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    if (!loading || !results) return;

    loading.classList.remove('hidden');
    loading.style.display = 'flex';
    loading.style.visibility = 'visible';
    loading.style.opacity = '1';

    results.classList.add('hidden');

    setTimeout(() => {
      loading.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);

    const progressText = loading.querySelector('p');
    if (progressText) progressText.textContent = inputType === 'code'
      ? 'Analyzing pasted HTML code...'
      : 'Analyzing Topics...';

    const heavyTimeout = setTimeout(() => {
      if (progressText) progressText.textContent = 'Still processing - may take longer for large sites...';
    }, 45000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          code: rawCode,
          deep: true,
          inputType
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeout(heavyTimeout);
      
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Invalid response from server (not JSON): ${parseErr.message}`);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Empty or invalid response from analysis server');
      }

      loading.classList.add('hidden');
      loading.style.display = 'none';
      results.classList.remove('hidden');

      setTimeout(() => {
        results.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        const offset = 100;
        setTimeout(() => {
          window.scrollBy({
            top: -offset,
            behavior: 'smooth'
          });
        }, 300);
      }, 150);

      const {
        overallScore = 20,
        pageTitle = '',
        coveragePercent = 25,
        clusters = [],
        suggestions = [],
        predictedRankLift = ''
      } = data;

      const displayTitle = pageTitle?.trim()
        ? pageTitle.trim()
        : (url
            ? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
            : 'Analyzed from Code');

      const displayTitleShort = displayTitle.length > 60
        ? displayTitle.substring(0, 57) + '...'
        : displayTitle;

      const grade = getGrade(overallScore);

      // --- Build the results HTML, now with share dashboard container ---
      results.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-2 text-gray-900 dark:text-gray-100">
          <!-- Overall Score Card -->
          <div class="flex justify-center my-12">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-2 w-full max-w-lg border-4 border-transparent ${overallScore >= 70 ? 'border-green-500 dark:border-green-400' : overallScore >= 40 ? 'border-orange-500 dark:border-orange-400' : 'border-red-500 dark:border-red-400'} shadow-lg dark:shadow-gray-800/50">
              <p class="text-center text-2xl font-medium mb-6 text-gray-800 dark:text-gray-200">Topical Authority Score</p>
              <div class="relative aspect-square w-full max-w-[300px] mx-auto">
                <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                  <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none" class="dark:stroke-gray-700"/>
                  <circle cx="100" cy="100" r="90"
                          stroke="${overallScore >= 70 ? '#22c55e' : overallScore >= 40 ? '#f59e0b' : '#ef4444'}"
                          stroke-width="16" fill="none"
                          stroke-dasharray="${(overallScore / 100) * 565} 565" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <div class="text-7xl font-black ${overallScore >= 70 ? 'text-green-600 dark:text-green-400' : overallScore >= 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">${overallScore}</div>
                    <div class="text-2xl opacity-90 text-gray-600 dark:text-gray-400">/100</div>
                  </div>
                </div>
              </div>
              <p class="mt-6 text-xl md:text-2xl font-semibold text-center text-gray-700 dark:text-gray-300 break-words line-clamp-2 score-card-title">
                ${displayTitleShort || 'Analyzed Page'}
              </p>
              <p class="mt-4 text-5xl font-bold text-center ${grade.color}">${grade.emoji} ${grade.text}</p>
              ${predictedRankLift ? `<p class="mt-4 text-center text-xl text-gray-700 dark:text-gray-300">Predicted lift: ${predictedRankLift}</p>` : ''}
            </div>
          </div>
          <!-- Detected Topics & Subtopics -->
          <div class="space-y-12">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">Detected Topics & Subtopics</h2>
            <p class="text-center text-lg mb-12 text-gray-800 dark:text-gray-200">
              Overall Topical Coverage: <strong class="text-orange-600 dark:text-orange-400">${coveragePercent || 'N/A'}%</strong><br>
              ${clusters.length > 0 ? `Found ${clusters.length} main topics with detailed subtopics extracted` : 'Analysis limited – site content may be thin'}
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
${clusters.length > 0
  ? clusters
      .slice()
      .sort((a, b) => (b.coverage || 0) - (a.coverage || 0))
      .map((cluster, idx) => {
        const grade = getGrade(cluster.coverage || 0);
        const color = grade.color.includes('green') ? 'green'
                    : grade.color.includes('orange') ? 'orange'
                    : 'red';
        return `
          <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-2 border-4 border-${color}-500 dark:border-${color}-400 hover:border-${color}-600 dark:hover:border-${color}-300 hover:shadow-3xl transition-all duration-300">
            <div class="flex items-center gap-4 mb-6">
              <div class="flex-shrink-0 w-10 h-10 bg-${color}-100 dark:bg-${color}-900 rounded-2xl flex items-center justify-center text-4xl shadow-md">
                ${idx === 0 ? '🌌' : idx === 1 ? '🧠' : idx === 2 ? '❤️' : idx === 3 ? '📜' : '🔍'}
              </div>
              <div class="flex-grow">
                <h3 class="text-2xl md:text-3xl font-bold text-${color}-700 dark:text-${color}-200 mb-2">${cluster.pillar || 'Topic ' + (idx+1)}</h3>
                <p class="text-xl font-semibold ${grade.color}">${Math.round(cluster.coverage || 0)}% coverage ${grade.emoji}</p>
              </div>
            </div>
            <div class="text-sm uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-4">Detected Subtopics</div>
            <div class="flex flex-wrap gap-3">
${cluster.subtopics && cluster.subtopics.length > 0
  ? cluster.subtopics.slice(0, 40).map(sub =>
      `<span class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 shadow-sm whitespace-normal break-words max-w-full inline-block mb-2 mr-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">${sub.trim()}</span>`
    ).join('')
  : '<span class="text-gray-600 dark:text-gray-300 italic text-base">Limited distinct subtopics – site content is focused or repetitive</span>'
}
            </div>
          </div>
        `;
      }).join('')
  : '<p class="text-center col-span-full text-xl text-gray-700 dark:text-gray-300 italic py-12">Limited topics detected – site may be product-heavy or thin. Consider adding educational supporting pages.</p>'
}
            </div>
            <!-- Suggested Subtopics -->
            <div class="mt-12">
              <h3 class="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Suggested Subtopics to Strengthen Authority</h3>
              <p class="text-center text-lg mb-10 text-gray-800 dark:text-gray-200">
                These subtopics could be added to existing pages or new content to deepen coverage and boost topical authority.
              </p>
              <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-orange-300 dark:border-orange-600">
                <ul class="space-y-4 text-base text-gray-900 dark:text-gray-100">
                  ${suggestions && suggestions.length > 0
                    ? suggestions.map(s => `
                        <li class="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-2xl border border-orange-200 dark:border-orange-700">
                          <span class="flex-shrink-0 text-2xl">➕</span>
                          <div>
                            <p class="font-semibold text-lg text-gray-900 dark:text-white">${s.topic || 'Suggested subtopic'}</p>
                            ${s.why ? `<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${s.why}</p>` : ''}
                            ${s.estimatedImpact ? `<p class="text-sm font-medium text-orange-600 dark:text-orange-400 mt-2">Potential impact: ${s.estimatedImpact}</p>` : ''}
                          </div>
                        </li>
                      `).join('')
                    : '<li class="text-center text-gray-700 dark:text-gray-200 italic py-6">No suggestions available yet – site may need more supporting content</li>'
                  }
                </ul>
              </div>
            </div>
            <!-- Educational summary -->
            <div class="text-center mt-12 p-6 bg-orange-50 dark:bg-orange-950 rounded-3xl border border-orange-200 dark:border-orange-800">
              <p class="text-lg text-gray-800 dark:text-gray-200">
                These modules show how well your content covers key topics and subtopics.<br>
                Higher coverage and more detailed subtopics = stronger topical authority in search.
              </p>
            </div>
          </div>
          <!-- Share Dashboard Container (replaces old share/feedback buttons) -->
          <div id="share-dashboard-container" class="mt-16"></div>
        </div>
      `;

      // Set print-friendly title and data-url
      const printTitleEl = document.querySelector('#results .mt-6.text-xl.md\\:text-2xl.font-semibold.text-center');
      let printTitle = printTitleEl
        ? printTitleEl.textContent.trim()
        : (displayTitleShort || 'Analyzed Page');
      printTitle = printTitle
        .replace(/Topical Authority Audit Tool.*Traffic Torch/gi, '')
        .replace(/Traffic Torch/gi, '')
        .replace(/[\|\-–_]+/g, ' ')
        .trim() || 'Analyzed Page';
      document.body.setAttribute('data-print-title', printTitle);
   
      // Set data-url for the page being audited
      const analyzedUrl = url || document.getElementById('url-input')?.value?.trim() || 'Code Analysis';
      document.body.setAttribute('data-url', analyzedUrl);

      // ─── Prepare and initialise the share dashboard ────────────────
      // Build module scores, passed/failed metrics from clusters
      const moduleScores = clusters.map(cluster => ({
        name: cluster.pillar || 'Topic',
        score: Math.round(cluster.coverage || 0)
      }));

      // For this tool, we define "passed" as coverage >= 50% (example threshold)
      const passedMetrics = [];
      const failedMetrics = [];
      clusters.forEach(cluster => {
        const score = Math.round(cluster.coverage || 0);
        if (score >= 50) {
          passedMetrics.push(cluster.pillar || 'Topic');
        } else {
          failedMetrics.push(cluster.pillar || 'Topic');
        }
      });

      // If no clusters, treat overall score as single metric
      if (clusters.length === 0) {
        if (overallScore >= 50) {
          passedMetrics.push('Overall Authority');
        } else {
          failedMetrics.push('Overall Authority');
        }
        moduleScores.push({ name: 'Overall Authority', score: overallScore });
      }

      const shareData = {
        toolName: 'Topical Authority Tool',
        url: analyzedUrl,
        pageTitle: pageTitle || displayTitle || 'Analyzed Page',
        overallScore: overallScore,
        moduleScores: moduleScores,
        passedMetrics: passedMetrics,
        failedMetrics: failedMetrics,
        aiFixes: suggestions ? suggestions.map(s => s.topic + (s.why ? ': ' + s.why : '')) : [],
        rawData: { clusters, suggestions, coveragePercent, predictedRankLift },
        // Custom share link pointing back to this tool with the audited URL
        shareLink: `${window.location.origin}/topical-authority-tool/?url=${encodeURIComponent(analyzedUrl)}`
      };

      const shareContainer = document.getElementById('share-dashboard-container');
      if (shareContainer) {
        initShareModule(shareContainer, shareData);
      }

    } catch (err) {
      clearTimeout(heavyTimeout);
      loading.classList.add('hidden');
      loading.style.display = 'none';
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-center py-12 px-6">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Audit could not complete</p>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 break-words">
            ${err.message || 'Failed to analyze - Whitelist: topical-authority-ai.traffictorch.workers.dev or use Code Analysis.'}
          </p>
          <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // Initial auto-submit if we opened a shared link (URL only)
  if (sharedDecodedUrl) {
    const urlInputEl = document.getElementById('url-input');
    if (urlInputEl) {
      urlInputEl.value = sharedDecodedUrl;
      setTimeout(() => {
        if (urlAnalyzeBtn) urlAnalyzeBtn.click();
      }, 300);
    }
  }
});