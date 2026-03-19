// script.js — Topical Authority Audit Tool (refactored from entity extractor)
// Single-file version — modules inlined/minimized; heavy logic in Worker AI

import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!(await canRunTool())) {
      alert('Rate limit reached or authentication issue. Please try again later.');
      return;
    }

    const urlInput = document.getElementById('url-input');
    const sitemapInput = document.getElementById('sitemap-input');
    const inputValue = urlInput?.value.trim();

    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }

    const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;
    const sitemap = sitemapInput?.value.trim() || '';

    // Show loading, hide results
    loading.classList.remove('hidden');
    results.classList.add('hidden');

    const progressText = loading.querySelector('p'); // the text element inside loading
    if (progressText) {
      progressText.textContent = 'Analyzing Topics...';
    }

    const heavyTimeout = setTimeout(() => {
      if (progressText) progressText.textContent = 'Still processing — may take longer for large sites...';
    }, 45000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sitemap }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeout(heavyTimeout);

      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch {}
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Invalid response from server (not JSON): ${parseErr.message}`);
      }

      // Hide loading, show results
      loading.classList.add('hidden');
      results.classList.remove('hidden');

      const {
        overallScore = 0,
        coveragePercent = 0,
        clusters = [],
        missingSubtopics = [],
        weakContent = [],
        suggestions = [],
        predictedRankLift = ''
      } = data || {};

      const grade = getGrade(overallScore);

      const clusterSummary = clusters.length > 0
        ? clusters.map(c => `${c.pillar || 'Core'} (${Math.round(c.coverage || 0)}% — ${c.subtopics?.length || 0} subtopics)`).join(' • ')
        : 'No clusters detected yet';

      results.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
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
              <p class="mt-8 text-5xl font-bold text-center ${grade.color}">${grade.emoji} ${grade.text}</p>
              ${predictedRankLift ? `<p class="mt-4 text-center text-xl text-gray-700 dark:text-gray-300">Predicted lift: ${predictedRankLift}</p>` : ''}
            </div>
          </div>

          <!-- Coverage & Cluster Viz -->
          <div class="mb-16">
            <h2 class="text-3xl font-bold text-center mb-6">Topic Cluster Coverage</h2>
            <p class="text-center text-lg mb-6">Overall coverage: <strong>${coveragePercent}%</strong> • ${clusterSummary}</p>
            <div class="w-full max-w-3xl mx-auto aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <canvas id="cluster-viz"></canvas>
            </div>
          </div>

          <!-- Key Insights Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-2xl font-semibold mb-4">Missing Subtopics</h3>
              ${missingSubtopics.length > 0 ? `<ul class="space-y-3 text-sm">${missingSubtopics.map(m => `<li class="flex items-start gap-2 text-orange-600 dark:text-orange-400">⚠️ ${m}</li>`).join('')}</ul>` : '<p class="text-green-600 dark:text-green-400">✅ Strong coverage — few gaps detected</p>'}
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-2xl font-semibold mb-4">Weak Supporting Content</h3>
              ${weakContent.length > 0 ? `<ul class="space-y-3 text-sm">${weakContent.map(w => `<li class="flex items-start gap-2 text-red-600 dark:text-red-400">❌ ${w.pageUrl || w.page || 'Page'} – ${w.reason || 'Low depth'}</li>`).join('')}</ul>` : '<p class="text-green-600 dark:text-green-400">✅ Solid supporting pages</p>'}
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-2xl font-semibold mb-4">Build Authority: Suggested Topics</h3>
              ${suggestions.length > 0 ? `<ul class="space-y-3 text-sm">${suggestions.map(s => `<li class="flex items-start gap-2 text-blue-600 dark:text-blue-400">➕ ${s.topic} (${s.estimatedImpact || s.impact || 'Medium'})</li>`).join('')}</ul>` : '<p class="text-gray-600 dark:text-gray-400">No suggestions available yet</p>'}
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

   // Share & feedback initialization temporarily disabled (missing form elements in current report HTML)
   // initShareReport(results);
   // initSubmitFeedback(results);

   // Render placeholder chart
   setTimeout(() => {
     const canvas = document.getElementById('cluster-viz');
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     new Chart(ctx, {
       type: 'doughnut',
       data: {
         labels: clusters.map(c => c.pillar || 'Unknown'),
         datasets: [{
           data: clusters.map(c => c.coverage || 0),
           backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'],
         }]
       },
       options: {
         responsive: true,
         plugins: { legend: { position: 'bottom' } }
       }
     });
   }, 300);

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
});