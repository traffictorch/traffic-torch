import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

import { analyzeCoverage }     from './modules/coverage.js';
import { analyzeSalience }     from './modules/salience.js';
import { analyzeRelationships } from './modules/relationships.js';
import { analyzePractices }    from './modules/practices.js';
import { analyzeReadiness }    from './modules/readiness.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entity-form');
  const results = document.getElementById('results');
  if (!form || !results) {
    console.error('Form or results container missing');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const urlInput = document.getElementById('url-input');
    const inputValue = urlInput?.value.trim();
    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }

    const url = cleanUrl(inputValue);
    if (!url) return;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-8">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500">Analyzing entities...</p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

    try {
      progressText.textContent = "Fetching & analyzing page...";
      const res = await fetch("https://traffic-torch-entity-proxy.traffictorch.workers.dev/entity-analyze", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const extracted = data.extracted || [];

      // Create a simple cleaned text approximation from Worker content (if available) or fallback
      const cleanedText = data.content || ''; // Worker should ideally return cleanedText too; for now approximate

      // Run the 5 aggregate modules
      const coverage     = analyzeCoverage(extracted, cleanedText);
      const salience     = analyzeSalience(extracted);
      const relationships = analyzeRelationships(extracted, document); // limited DOM access here; improve later
      const practices    = analyzePractices(extracted, document);
      const readiness    = analyzeReadiness(coverage.score, salience.score, relationships.score, practices.score);

      const modules = [
        { name: 'Coverage',     result: coverage,     color: '#10b981' },
        { name: 'Salience',     result: salience,     color: '#f59e0b' },
        { name: 'Relationships', result: relationships, color: '#8b5cf6' },
        { name: 'Practices',    result: practices,    color: '#ec4899' },
        { name: 'Readiness',    result: readiness,    color: '#3b82f6' }
      ];

      const overallScore = readiness.score; // Use readiness as primary overall
      const grade = getGrade(overallScore);

      // Entity diversity summary
      const typeCounts = extracted.reduce((acc, e) => {
        const t = e.type || 'OTHER';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const diversitySummary = `${extracted.length} entities detected (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`;

      // Build entities HTML
      const entitiesHTML = extracted.length > 0
        ? extracted.map(entity => `
            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <p class="font-bold text-gray-800 dark:text-gray-200">${entity.text || 'Unknown'}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">${entity.type || 'Unknown'}</p>
              <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.round((entity.salience || 0) * 100)}%"></div>
              </div>
              <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Salience: ${(entity.salience || 0).toFixed(2)}
              </p>
            </div>
          `).join('')
        : '<p class="text-gray-600 dark:text-gray-400 text-center py-6">No entities detected.</p>';

      // Build module cards HTML
      const moduleCardsHTML = modules.map(mod => {
        const { score, metrics, failed } = mod.result;
        const cardGrade = getGrade(score);
        return `
          <div class="score-card bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">${mod.name}</h3>
              <div class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                   style="background: conic-gradient(${mod.color} ${score}%, #e5e7eb ${score}%)">
                ${score}
              </div>
            </div>
            <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              ${metrics.map(m => `<li>${m}</li>`).join('')}
            </ul>
            <button class="fixes-toggle text-orange-500 hover:text-orange-600 font-medium">
              Show Fixes ${failed.length > 0 ? `(${failed.length})` : ''}
            </button>
            <div class="fixes-panel hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              ${failed.length > 0
                ? `<ul class="list-disc pl-5 space-y-2 text-sm text-red-700 dark:text-red-300">
                     ${failed.map(f => `<li>${f}</li>`).join('')}
                   </ul>`
                : '<p class="text-green-600 dark:text-green-400">No major issues – excellent!</p>'}
            </div>
          </div>
        `;
      }).join('');

      // Priority fixes (top 3–4 from all failed across modules)
      const allFailed = [
        ...coverage.failed, ...salience.failed, ...relationships.failed,
        ...practices.failed, ...readiness.failed
      ].slice(0, 4);

      results.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-8">
          <div class="text-center mb-10">
            <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-200">Entity Analysis Report</h2>
            <p class="mt-3 text-xl text-gray-600 dark:text-gray-400">
              Overall Semantic Health: <span class="${grade.color} font-bold">${overallScore}/100 ${grade.emoji} ${grade.text}</span>
            </p>
            <p class="mt-2 text-lg text-gray-500 dark:text-gray-400">${diversitySummary}</p>
          </div>

          <!-- Extracted Entities -->
          <div class="mb-16">
            <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Extracted Entities</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
              ${entitiesHTML}
            </div>
          </div>

          <!-- Audit & Recommendations (basic from Worker + module summaries) -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-16">
            <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Audit & Recommendations</h3>
            <ul class="list-disc pl-6 space-y-3 text-gray-700 dark:text-gray-300">
              ${data.audit?.suggestions?.map(s => `<li>${s}</li>`).join('') || '<li>Review module details below for targeted improvements.</li>'}
            </ul>
          </div>

          <!-- Radar Chart -->
          <div class="mb-16">
            <h3 class="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">Semantic Health Radar</h3>
            <canvas id="health-radar" class="w-full h-80 md:h-96 mx-auto"></canvas>
          </div>

          <!-- Module Score Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            ${moduleCardsHTML}
          </div>

          <!-- Top Priority Fixes -->
          <div class="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 border border-orange-200 dark:border-orange-700/50">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Top Priority Fixes</h3>
            ${allFailed.length > 0
              ? `<ul class="list-decimal pl-6 space-y-4 text-gray-700 dark:text-gray-300">
                   ${allFailed.map((fix, i) => `<li class="text-lg">${fix}</li>`).join('')}
                 </ul>`
              : '<p class="text-center text-green-600 dark:text-green-400 text-lg">Strong semantic foundation – minimal fixes needed!</p>'}
          </div>

          <!-- Share / Save / Feedback Buttons -->
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
          </div>
        </div>
      `;

      // Initialize Chart.js radar
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
          type: 'radar',
          data: {
            labels: modules.map(m => m.name),
            datasets: [{
              label: 'Score',
              data: modules.map(m => m.result.score),
              backgroundColor: 'rgba(251, 146, 60, 0.2)',
              borderColor: '#fb923c',
              borderWidth: 3,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#fb923c',
              pointRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, color: '#9ca3af' },
                grid: { color: 'rgba(156,163,175,0.3)' },
                angleLines: { color: 'rgba(156,163,175,0.3)' },
                pointLabels: { color: '#9ca3af', font: { size: 14 } }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }, 300);

      // Initialize share & feedback
      initShareReport(results);
      initSubmitFeedback(results);

      // Toggle handlers
      results.addEventListener('click', (e) => {
        if (e.target.matches('.fixes-toggle')) {
          const panel = e.target.nextElementSibling;
          panel?.classList.toggle('hidden');
        }
      });

    } catch (err) {
      console.error('Analysis error:', err);
      results.innerHTML = `
        <div class="text-center py-12 text-red-600 dark:text-red-400">
          <p class="text-xl font-bold">Error during analysis</p>
          <p class="mt-4">${err.message || 'Unknown error – check console'}</p>
        </div>
      `;
    }
  });

  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function getGrade(score) {
    if (score >= 85) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { text: 'Good', emoji: '👍', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 50) return { text: 'Fair', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
    return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
  }
});