// script-v1.0.js — Topical Authority Audit Tool (refactored from entity extractor)
// Single-file version — modules inlined/minimized; heavy logic in Worker AI
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

const ANALYZE_ENDPOINT = 'https://topical-authority-ai-worker.traffictorch.workers.dev/';


function getGrade(score) {
  if (score >= 85) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { text: 'Good', emoji: '👍', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 50) return { text: 'Fair', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authority-form');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');

  if (!form || !loading || !results) {
    console.error('Form, loading, or results container missing');
    return;
  }

  // Removed old checkbox toggle logic — now using radio buttons via name="analyze-mode"

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

  //const canProceed = await canRunTool('limit-audit-id');
  //if (!canProceed) return;

  const urlInput = document.getElementById('url-input');
  const inputValue = urlInput?.value.trim();
  if (!inputValue) {
    alert('Please enter a URL');
    return;
  }
  const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;
  loading.classList.remove('hidden');
  results.classList.add('hidden');
  const progressText = loading.querySelector('p');
  if (progressText) progressText.textContent = 'Analyzing Topics...';
  const heavyTimeout = setTimeout(() => {
    if (progressText) progressText.textContent = 'Still processing — may take longer for large sites...';
  }, 45000);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const isSiteWide = true; // Forced site-wide only
    const res = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, deep: true }), // always site-wide
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
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    const {
      overallScore = 0,
      pageTitle = '',
      mainTopic = 'Your Main Topic',
      coveragePercent = 0,
      clusters = [],
      missingSubtopics = [],
      weakContent = [],
      suggestions = [],
      predictedRankLift = ''
    } = data || {};
    const displayTitle = pageTitle.trim()
      ? pageTitle
      : inputValue.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const grade = getGrade(overallScore);
    results.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
        <!-- Mode Indicator (educational) -->
        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6 italic">
          Site-Wide Analysis: Main page + supporting internal pages scanned — full topical authority check
        </p>
        <!-- Overall Score Card -->
        <div class="flex justify-center my-12">
          <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 w-full max-w-lg border-4 ${overallScore >= 85 ? 'border-green-500' : overallScore >= 70 ? 'border-emerald-500' : overallScore >= 50 ? 'border-orange-500' : 'border-red-500'}">
            <p class="text-center text-2xl font-medium mb-6">Topical Authority Score</p>
            <div class="relative aspect-square w-full max-w-[300px] mx-auto">
              <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none" class="dark:stroke-gray-700"/>
                <circle cx="100" cy="100" r="90"
                        stroke="${overallScore >= 85 ? '#22c55e' : overallScore >= 70 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444'}"
                        stroke-width="16" fill="none"
                        stroke-dasharray="${(overallScore / 100) * 565} 565" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <div class="text-7xl font-black" style="color: ${overallScore >= 85 ? '#22c55e' : '#ef4444'};">${overallScore}</div>
                  <div class="text-2xl opacity-90">/100</div>
                </div>
              </div>
            </div>
            <p class="mt-6 text-xl md:text-2xl font-semibold text-center text-gray-700 dark:text-gray-300 break-words line-clamp-2">
              ${displayTitle || 'Analyzed Page'}
            </p>
            <p class="mt-4 text-5xl font-bold text-center ${grade.color}">${grade.emoji} ${grade.text}</p>
            ${predictedRankLift ? `<p class="mt-4 text-center text-xl text-gray-700 dark:text-gray-300">Predicted lift: ${predictedRankLift}</p>` : ''}
          </div>
        </div>
        <!-- Detected Topics & Subtopics -->
        <div class="space-y-12">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-200">Detected Topics & Subtopics</h2>
          <p class="text-center text-lg mb-12 text-gray-700 dark:text-gray-300">
            Overall Topical Coverage: <strong class="text-orange-600 dark:text-orange-400">${coveragePercent || 'N/A'}%</strong><br>
            ${clusters.length > 0 ? `Found ${clusters.length} main topics with detailed subtopics extracted` : 'Analysis limited – site content may be thin'}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            ${clusters.length > 0
              ? clusters.map((cluster, idx) => {
                  const color = cluster.coverage >= 85 ? 'green' : cluster.coverage >= 70 ? 'emerald' : 'orange';
                  return `
                    <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border-2 border-gray-300 dark:border-gray-700 border-${color}-500 hover:shadow-3xl transition-all duration-300">
                      <div class="flex items-center gap-5 mb-6">
                        <div class="flex-shrink-0 w-20 h-20 bg-${color}-100 dark:bg-${color}-900 rounded-2xl flex items-center justify-center text-5xl shadow-md">
                          ${idx === 0 ? '🌌' : idx === 1 ? '🧠' : idx === 2 ? '❤️' : idx === 3 ? '📜' : '🔍'}
                        </div>
                        <div class="flex-grow">
                          <h3 class="text-2xl md:text-3xl font-bold text-${color}-700 dark:text-${color}-300 mb-2">${cluster.pillar || 'Topic ' + (idx+1)}</h3>
                          <p class="text-xl font-semibold text-${color}-600 dark:text-${color}-400">${Math.round(cluster.coverage || 0)}% coverage</p>
                        </div>
                      </div>
                      <div class="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-4">Detected Subtopics</div>
                      <div class="flex flex-wrap gap-3">
${cluster.subtopics && cluster.subtopics.length > 0
  ? cluster.subtopics.slice(0, 20).map(sub => // show up to 20
      `<span class="px-4 py-2 bg-${color}-50 dark:bg-${color}-950 text-${color}-700 dark:text-${color}-300 rounded-xl text-sm font-medium border border-${color}-200 dark:border-${color}-700 shadow-sm">${sub.trim()}</span>`
    ).join('')
  : '<span class="text-gray-500 dark:text-gray-400 italic text-base">Limited subtopics detected – site content is focused</span>'
}
                      </div>
                    </div>
                  `;
                }).join('')
              : '<p class="text-center col-span-full text-xl text-gray-600 dark:text-gray-400 italic py-12">Limited topics detected – site may be product-heavy or thin. Consider adding educational supporting pages.</p>'
            }
          </div>
          <!-- Suggested Subtopics -->
          <div class="mt-12">
            <h3 class="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Suggested Subtopics to Strengthen Authority</h3>
            <p class="text-center text-lg mb-10 text-gray-700 dark:text-gray-300">
              These subtopics could be added to existing pages or new content to deepen coverage and boost topical authority.
            </p>
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-orange-300 dark:border-orange-600">
              <ul class="space-y-4 text-base text-gray-800 dark:text-gray-200">
                ${suggestions && suggestions.length > 0
                  ? suggestions.map(s => `
                      <li class="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-2xl border border-orange-200 dark:border-orange-700">
                        <span class="flex-shrink-0 text-2xl">➕</span>
                        <div>
                          <p class="font-semibold text-lg">${s.topic || 'Suggested subtopic'}</p>
                          ${s.why ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${s.why}</p>` : ''}
                          ${s.estimatedImpact ? `<p class="text-sm font-medium text-orange-600 dark:text-orange-400 mt-2">Potential impact: ${s.estimatedImpact}</p>` : ''}
                        </div>
                      </li>
                    `).join('')
                  : '<li class="text-center text-gray-600 dark:text-gray-400 italic py-6">No suggestions available yet – site may need more supporting content</li>'
                }
              </ul>
            </div>
          </div>
          <!-- Educational summary -->
          <div class="text-center mt-12 p-6 bg-orange-50 dark:bg-orange-950 rounded-3xl border border-orange-200 dark:border-orange-800">
            <p class="text-lg text-gray-700 dark:text-gray-300">
              These modules show how well your content covers key topics and subtopics.<br>
              Higher coverage and more detailed subtopics = stronger topical authority in search.
            </p>
          </div>
        </div>
        <!-- Action Buttons -->
        <div class="text-center my-16 px-4">
          <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
            <button id="share-report-btn" class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
              Share Report ↗️
            </button>
            <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
                    class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
              Save Report 📥
            </button>
            <button id="feedback-btn" class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
              Submit Feedback 💬
            </button>
          </div>
          <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>
          <div id="share-form-container" class="hidden max-w-2xl mx-auto mt-8"></div>
          <div id="feedback-form-container" class="hidden max-w-2xl mx-auto mt-8"></div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Audit error:', err);
    clearTimeout(heavyTimeout);
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    results.innerHTML = `
      <div class="text-center py-12 px-6">
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Audit could not complete</p>
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 break-words">
          ${err.message || 'Unexpected error — check browser console or try a different URL'}
        </p>
        <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl">
          Try Again
        </button>
      </div>
    `;
  }
});

  // Initialize share & feedback modules if they exist (uncommented)
  initShareReport?.();
  initSubmitFeedback?.();
});