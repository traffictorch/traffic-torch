// script-v1.0.js
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

// ── Module imports ──────────────────────────────────────────────
import { analyzeCoverage }    from './modules/coverage.js';
import { analyzeSalience }    from './modules/salience.js';
import { analyzeRelationships } from './modules/relationships.js';
import { analyzePractices }   from './modules/practices.js';
import { analyzeReadiness }   from './modules/readiness.js';
// ─────────────────────────────────────────────────────────────────

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const ANALYZE_ENDPOINT = 'https://traffic-torch-entity-proxy.traffictorch.workers.dev/entity-analyze';

// Helper to detect short/thin content pages
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

    const urlInput = document.getElementById('url-input');
    const inputValue = urlInput?.value.trim();
    if (!inputValue) {
      alert('Please enter a URL');
      return;
    }

    const url = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;

    // Show loading UI
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
          Large pages can take up to 90 seconds.
        </p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

    // Progress messages
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
        progressText.textContent = "Finalizing your report...";
        progressText.classList.add('text-green-600', 'dark:text-green-400');
      }
    }, 4500);

    // Safety timeout message
    const heavyTimeout = setTimeout(() => {
      progressText.textContent = "Still working — heavy page or slow server. Please wait...";
      progressText.classList.remove('text-green-600', 'dark:text-green-400');
      progressText.classList.add('text-yellow-600', 'dark:text-yellow-400');
    }, 75000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds max

      let res;
      try {
        res = await fetch(ANALYZE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal
        });
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 90 seconds. The page may be too large or the server is slow.');
        }
        throw new Error(`Network error: ${fetchErr.message}`);
      } finally {
        clearTimeout(timeoutId);
      }

      clearTimeout(heavyTimeout);
      clearInterval(interval);
      progressText.textContent = "Processing response...";
      progressText.classList.add('text-green-600', 'dark:text-green-400');

      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData.error || errData.message || `Server error ${res.status} ${res.statusText}`);
      }

      let data;
      try {
        data = await res.json();
        console.log('[DEBUG] Raw server response:', data); // ← very useful for debugging
      } catch (parseErr) {
        console.error('JSON parse failed:', parseErr);
        throw new Error('Server returned invalid data (not valid JSON). Please try again later.');
      }

      const extracted = Array.isArray(data?.extracted) ? data.extracted : [];

      // Analyze
      const coverage     = analyzeCoverage(extracted);
      const salience     = analyzeSalience(extracted);
      const relationships = analyzeRelationships(extracted);
      const practices    = analyzePractices(extracted);
      const readiness    = analyzeReadiness(coverage.score, salience.score, relationships.score, practices.score);

      const modules = [
        { name: 'Coverage',     result: coverage,    color: '#10b981', desc: 'How many & diverse entities are recognized (topical breadth)' },
        { name: 'Salience',     result: salience,    color: '#f59e0b', desc: 'How prominent/important the entities are (authority strength)' },
        { name: 'Relationships', result: relationships, color: '#8b5cf6', desc: 'How well entities connect & form clusters' },
        { name: 'Practices',    result: practices,   color: '#ec4899', desc: 'On-page SEO & semantic best practices compliance' },
        { name: 'Readiness',    result: readiness,   color: '#3b82f6', desc: 'Overall preparedness for semantic search & ranking' }
      ];

      // ────────────────────────────────────────────────────────────────
      //  ↓↓↓  PASTE YOUR FULL REPORT RENDERING CODE HERE  ↓↓↓
      // (everything after const modules = [...] in your original file)
      // Including: overallScore, grade, typeCounts, diversitySummary,
      // entitiesHTML, results.innerHTML = `...`, radar chart, init calls,
      // toggle listener, panel reset, etc.
      // ────────────────────────────────────────────────────────────────

      // Example placeholder — replace with your real rendering code
      results.innerHTML = `<div class="text-center py-12 text-xl font-bold text-green-600">Report ready! (add your full HTML here)</div>`;

      // Your existing chart + init + toggle code goes here...

      initShareReport(results);
      initSubmitFeedback(results);

      // Your delegated toggle listener...
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

      // Reset panels (your existing code)
      setTimeout(() => {
        const panels = results.querySelectorAll('.fixes-panel, .details-panel');
        const arrows = results.querySelectorAll('.arrow, .details-arrow');
        panels.forEach(p => {
          p.classList.add('hidden');
          p.style.display = 'none';
          p.style.height = '0';
          p.style.padding = '0';
          p.style.marginTop = '0';
        });
        arrows.forEach(a => {
          a.classList.remove('rotate-180');
          a.textContent = '▼';
        });
      }, 100);

    } catch (err) {
      console.error('Analysis failed:', err);

      clearInterval(interval);
      clearTimeout(heavyTimeout);

      results.innerHTML = `
        <div class="text-center py-12 px-6">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis could not complete</p>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            ${err.message || 'An unexpected error occurred. Please check the console or try again later.'}
          </p>
          <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition">
            Try Again
          </button>
        </div>
      `;
    }
  });
});