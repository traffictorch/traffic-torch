// script-v1.0.js

import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

// ── New module imports ──────────────────────────────────────────────
import { analyzeCoverage }   from './coverage.js';
import { analyzeSalience }    from './salience.js';
import { analyzeRelationships } from './relationships.js';
import { analyzePractices }   from './practices.js';
import { analyzeReadiness }   from './readiness.js';
// ─────────────────────────────────────────────────────────────────────

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

// Helper to detect short/thin content pages (homepages, landing pages)
function isShortContent(wordCount) {
  return wordCount < 400;
}

function getGrade(score) {
  if (score >= 85) return { text: 'Excellent', emoji: '✅', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { text: 'Good', emoji: '👍', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 50) return { text: 'Fair', emoji: '⚠️', color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Needs Work', emoji: '❌', color: 'text-red-600 dark:text-red-400' };
}

function getModuleExplanation(moduleName) {
  const explanations = {
    'Coverage': {
      what: 'Counts total recognized entities and evaluates their type diversity and density relative to content length.',
      why: 'Strong coverage builds topical breadth and authority, helping search engines understand the page’s full subject scope and improving relevance in entity-driven rankings.'
    },
    'Salience': {
      what: 'Measures how prominently and importantly each entity appears (based on position, repetition, and context weighting).',
      why: 'High salience signals the main topics clearly, boosting the page’s ability to rank for core queries and appear in featured snippets or AI overviews.'
    },
    'Relationships': {
      what: 'Analyzes co-occurrence, type synergy, and clustering among entities to detect meaningful topical connections.',
      why: 'Strong relationships create semantic clusters, improving topical depth and helping search engines associate the page with related concepts, entities, and user intent.'
    },
    'Practices': {
      what: 'Evaluates on-page semantic optimizations: schema readiness, heading usage of entities, and name consistency.',
      why: 'Good practices make entities machine-readable, enhance crawlability, and increase chances of rich results, Knowledge Graph inclusion, and better UX signals.'
    },
    'Readiness': {
      what: 'Combines weighted scores from all modules into an overall semantic health and ranking preparedness index.',
      why: 'High readiness indicates the page is well-optimized for modern entity-based and semantic search, predicting stronger performance in competitive SERPs and AI features.'
    }
  };
  return explanations[moduleName] || { what: 'No explanation available.', why: '' };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entity-form');
  const results = document.getElementById('results');
  if (!form || !results) {
    console.error('Form or results container missing');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // const canProceed = await canRunTool('limit-audit-id');
    // if (!canProceed) return;

    const urlInput = document.getElementById('url-input');
    const inputValue = urlInput?.value.trim();
    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }

    const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-16 min-h-[60vh]">
        <div class="relative w-28 h-28 mb-10">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="10" stroke-opacity="0.25"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="10"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 text-center max-w-2xl px-6 leading-tight">
          Fetching page content...
        </p>
        <p class="mt-5 text-lg text-gray-700 dark:text-gray-300 text-center max-w-2xl px-6">
          Large pages can take up to 1 min.
        </p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

    const updateProgress = () => {
      let current = 0;
      const messages = [
        "Fetching page content...",
        "Extracting named entities...",
        "Analyzing coverage & density...",
        "Evaluating salience & prominence...",
        "Checking relationships & clusters...",
        "Reviewing on-page practices...",
        "Calculating overall readiness...",
        "Finalizing semantic health report..."
      ];
      const interval = setInterval(() => {
        if (current < messages.length) {
          progressText.textContent = messages[current];
          current++;
        } else {
          clearInterval(interval);
          progressText.textContent = "Finalizing your report...";
          progressText.classList.add('text-green-600', 'dark:text-green-400');
        }
      }, 4500);

      setTimeout(() => {
        if (current < messages.length) {
          progressText.textContent = "Still working — heavy page detected. Just a moment longer...";
          progressText.classList.add('text-yellow-600', 'dark:text-yellow-400');
        }
      }, 75000);
    };

    updateProgress();

    try {
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

      // ── Use the imported module functions ───────────────────────────────
      const coverage    = analyzeCoverage(extracted);
      const salience    = analyzeSalience(extracted);
      const relationships = analyzeRelationships(extracted);
      const practices   = analyzePractices(extracted);
      const readiness   = analyzeReadiness(coverage.score, salience.score, relationships.score, practices.score);
      // ────────────────────────────────────────────────────────────────────

      // The rest remains exactly the same
      const modules = [
        { name: 'Coverage',     result: coverage,    color: '#10b981', desc: 'How many & diverse entities are recognized (topical breadth)' },
        { name: 'Salience',     result: salience,    color: '#f59e0b', desc: 'How prominent/important the entities are (authority strength)' },
        { name: 'Relationships', result: relationships, color: '#8b5cf6', desc: 'How well entities connect & form clusters' },
        { name: 'Practices',    result: practices,   color: '#ec4899', desc: 'On-page SEO & semantic best practices compliance' },
        { name: 'Readiness',    result: readiness,   color: '#3b82f6', desc: 'Overall preparedness for semantic search & ranking' }
      ];

      // ……… everything from here down stays unchanged ………
      // (overallScore, grade, typeCounts, diversitySummary, entitiesHTML, results.innerHTML = `...`, radar chart, initShareReport, initSubmitFeedback, event delegation, error handling)

      // Aggressive panel reset after every report render
      setTimeout(() => {
        const panels = results.querySelectorAll('.fixes-panel, .details-panel');
        const arrows = results.querySelectorAll('.arrow, .details-arrow');
        panels.forEach(panel => {
          panel.classList.add('hidden');
          panel.style.display = 'none';
          panel.style.height = '0';
          panel.style.padding = '0';
          panel.style.marginTop = '0';
        });
        arrows.forEach(arrow => {
          arrow.classList.remove('rotate-180');
          arrow.textContent = '▼';
        });
        console.log('Panels/arrows reset after render – count:', panels.length);
      }, 100);

      // Radar chart
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (window.myRadarChart) window.myRadarChart.destroy();

        window.myRadarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: modules.map(m => m.name),
            datasets: [{
              label: 'Semantic Health',
              data: modules.map(m => m.result.score),
              backgroundColor: 'rgba(251, 146, 60, 0.18)',
              borderColor: '#fb923c',
              borderWidth: 3,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#fb923c',
              pointRadius: 5,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, color: '#9ca3af', backdropColor: 'transparent' },
                grid: { color: 'rgba(156,163,175,0.4)' },
                angleLines: { color: 'rgba(156,163,175,0.4)' },
                pointLabels: { color: '#9ca3af', font: { size: 14, weight: '600' } }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }, 400);

      initShareReport(results);
      initSubmitFeedback(results);

      // Attach ONE delegated listener for toggles
      if (!results.dataset.toggleListenerAdded) {
        results.addEventListener('click', function(e) {
          const button = e.target.closest('.fixes-toggle, .details-toggle');
          if (!button) return;
          e.preventDefault();
          e.stopPropagation();
          const panel = button.nextElementSibling;
          const arrow = button.querySelector('.arrow, .details-arrow');
          if (!panel || !arrow) return;

          const isNowHidden = panel.classList.toggle('hidden');
          arrow.classList.toggle('rotate-180', !isNowHidden);
          arrow.textContent = isNowHidden ? '▼' : '▲';
        });
        results.dataset.toggleListenerAdded = 'true';
      }

    } catch (err) {
      console.error('Analysis error:', err);
      results.innerHTML = `
        <div class="text-center py-12 px-6">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis could not complete</p>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
            ${err.message.includes('timeout') || err.message.includes('fetch')
              ? 'The page is very large or took too long to load. Try a smaller page or check your internet connection.'
              : err.message || 'An unexpected error occurred. Please try again or check the console for details.'}
          </p>
          <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl">
            Try Again
          </button>
        </div>
      `;
    }
  });
});