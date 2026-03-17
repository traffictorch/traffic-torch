// script-v1.0.js

import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

// ── Module imports ──────────────────────────────────────────────
import { analyzeCoverage } from './modules/coverage.js';
import { analyzeSalience } from './modules/salience.js';
import { analyzeRelationships } from './modules/relationships.js';
import { analyzePractices } from './modules/practices.js';
import { analyzeReadiness } from './modules/readiness.js';
// ─────────────────────────────────────────────────────────────────

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';
const ANALYZE_ENDPOINT = 'https://traffic-torch-entity-proxy.traffictorch.workers.dev/entity-analyze';

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

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-2 min-h-[60vh]">
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
          Large pages can take up to 2 mins.
        </p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

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

    const heavyTimeout = setTimeout(() => {
      progressText.textContent = "Still working — heavy page or slow server detected...";
      progressText.classList.remove('text-green-600', 'dark:text-green-400');
      progressText.classList.add('text-yellow-600', 'dark:text-yellow-400');
    }, 75000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let res;
      try {
        res = await fetch(ANALYZE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') throw new Error('Request timed out after 90 seconds. Page may be too large or server slow.');
        throw new Error(`Network/fetch error: ${fetchErr.message}`);
      }

      clearTimeout(timeoutId);
      clearTimeout(heavyTimeout);
      clearInterval(interval);

      progressText.textContent = "Processing response...";

      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData.error || errData.message || `Server error ${res.status} ${res.statusText}`);
      }

      let data;
      try {
        data = await res.json();
        console.log('[DEBUG] Server response data:', data);
      } catch (parseErr) {
        console.error('JSON parse failed:', parseErr);
        throw new Error('Invalid response format from server (not valid JSON)');
      }

      const extracted = data.extracted || [];

      const coverage = analyzeCoverage(extracted);
      const salience = analyzeSalience(extracted);
      const relationships = analyzeRelationships(extracted);
      const practices = analyzePractices(extracted);
      const readiness = analyzeReadiness(coverage.score, salience.score, relationships.score, practices.score);

      const modules = [
        { name: 'Coverage', result: coverage, color: '#10b981', desc: 'How many & diverse entities are recognized (topical breadth)' },
        { name: 'Salience', result: salience, color: '#f59e0b', desc: 'How prominent/important the entities are (authority strength)' },
        { name: 'Relationships', result: relationships, color: '#8b5cf6', desc: 'How well entities connect & form clusters' },
        { name: 'Practices', result: practices, color: '#ec4899', desc: 'On-page SEO & semantic best practices compliance' },
        { name: 'Readiness', result: readiness, color: '#3b82f6', desc: 'Overall preparedness for semantic search & ranking' }
      ];

      const overallScore = readiness.score;
      const grade = getGrade(overallScore);

      const typeCounts = extracted.reduce((acc, e) => {
        const t = e.type || 'OTHER';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});

      const diversitySummary = `${extracted.length} entities detected (${Object.entries(typeCounts).map(([t,c]) => `${c} ${t}`).join(', ')})`;

      const entitiesHTML = extracted.length > 0
        ? extracted.map(entity => `
            <div class="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
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

      results.innerHTML = `
<div class="max-w-5xl mx-auto px-4 py-8">
  <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
    Scores are adaptive.
  </p>
  <!-- Big Overall Readiness Score Card -->
  <div class="flex justify-center my-10 px-4">
    <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-lg border-4 ${readiness.score >= 85 ? 'border-green-500' : readiness.score >= 70 ? 'border-emerald-400' : readiness.score >= 50 ? 'border-orange-500' : 'border-red-500'}">
      <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall Semantic Readiness</p>
      <div class="relative aspect-square w-full max-w-[280px] mx-auto">
        <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
          <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none" class="dark:stroke-gray-700"/>
          <circle cx="100" cy="100" r="90"
                  stroke="${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'}"
                  stroke-width="16" fill="none"
                  stroke-dasharray="${(readiness.score / 100) * 565} 565"
                  stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl md:text-7xl font-black drop-shadow-lg"
                 style="color: ${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'};">
              ${readiness.score}
            </div>
            <div class="text-xl md:text-2xl opacity-90 -mt-2"
                 style="color: ${readiness.score >= 85 ? '#22c55e' : readiness.score >= 70 ? '#10b981' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'};">
              /100
            </div>
          </div>
        </div>
      </div>
      ${(() => {
        const g = getGrade(readiness.score);
        return `<p class="mt-8 text-4xl md:text-5xl font-bold text-center ${g.color} drop-shadow-lg">${g.emoji} ${g.text}</p>`;
      })()}
      ${(() => {
        const pageTitle = data?.title || urlInput?.value.trim() || 'Analyzed Page';
        const truncated = pageTitle.length > 80 ? pageTitle.substring(0, 77) + '...' : pageTitle;
        return `
          <p class="mt-6 text-center text-base md:text-lg text-gray-700 dark:text-gray-300 px-4 leading-relaxed break-words">
            ${truncated}
          </p>
        `;
      })()}
      <p class="mt-6 text-center text-lg text-gray-600 dark:text-gray-300 px-4 leading-relaxed">
        ${readiness.metrics[0].text.split(' – ')[1] || 'Semantic foundation analysis complete'}
      </p>
    </div>
  </div>

  <!-- Extracted Entities -->
  <div class="mb-16">
    <h3 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Extracted Entities</h3>
    <div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 text-center md:text-left">
      <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
        ${diversitySummary}
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
      ${entitiesHTML}
    </div>
  </div>

  <!-- Radar Chart -->
  <div class="mb-16">
    <h3 class="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">Semantic Health Radar</h3>
    <div class="w-full max-w-2xl mx-auto aspect-square">
      <canvas id="health-radar"></canvas>
    </div>
  </div>
  
<!-- Coverage + Salience -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12 items-start">
  ${modules.slice(0, 2).map(mod => {
    const { score, metrics = [], failed = [] } = mod.result;
    const cardGrade = getGrade(score);
    let borderColorClass = 'border-gray-400 dark:border-gray-600'; // safe fallback visible in dev
    const grade = cardGrade.text.trim().toLowerCase();
    if (grade.includes('excellent')) {
      borderColorClass = 'border-green-500 dark:border-green-400';
    } else if (grade.includes('good')) {
      borderColorClass = 'border-emerald-500 dark:border-emerald-400';
    } else if (grade.includes('fair')) {
      borderColorClass = 'border-orange-500 dark:border-orange-400';
    } else if (grade.includes('needs') || grade.includes('work') || grade === '') {
      borderColorClass = 'border-red-600 dark:border-red-500';
    } else {
      console.warn(`Unexpected grade for ${mod.name}: "${cardGrade.text}" (using red fallback)`);
      borderColorClass = 'border-red-600 dark:border-red-500';
    }
    const arcColor = score >= 85 ? '#22c55e' :
                     score >= 70 ? '#10b981' :
                     score >= 50 ? '#f59e0b' : '#ef4444';
    return `
    <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-4 ${borderColorClass} flex flex-col min-h-[520px] md:min-h-[580px]">
      <div class="flex justify-center mb-6">
        <div class="relative w-32 h-32 mx-auto">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none" class="dark:stroke-gray-700"/>
            <circle cx="64" cy="64" r="56"
                    stroke="${arcColor}"
                    stroke-width="12" fill="none"
                    stroke-dasharray="${(score / 100) * 352} 352"
                    stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-4xl font-black" style="color: ${arcColor};">${score}</div>
          </div>
        </div>
      </div>
      <p class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">${mod.name}</p>
      ${(() => {
        const g = getGrade(score);
        return `<p class="text-center text-xl font-bold ${g.color} mb-4">${g.emoji} ${g.text}</p>`;
      })()}
      <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">${mod.desc}</p>
      <button class="details-toggle w-full py-2 px-4 mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition flex justify-between items-center">
        <span>More Details</span>
        <span class="details-arrow transition-transform duration-200">▼</span>
      </button>
      <div class="details-panel mt-3 pt-3 pb-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
        <p class="mb-3"><strong>What it measures:</strong> ${getModuleExplanation(mod.name).what}</p>
        <p class="mb-4"><strong>Why it matters:</strong> ${getModuleExplanation(mod.name).why}</p>
        <p class="text-center mt-6">
          <a href="#${mod.name.toLowerCase()}"
             class="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            How ${mod.name} is tested? →
          </a>
        </p>
      </div>
      <ul class="text-sm space-y-3 mt-4 mb-4 flex-grow">
        ${metrics.map(m => {
          let emoji = '❌', color = 'text-red-600 dark:text-red-400';
          if (m.grade === 'good') { emoji = '✅'; color = 'text-green-600 dark:text-green-400'; }
          else if (m.grade === 'warning') { emoji = '⚠️'; color = 'text-orange-500 dark:text-orange-400'; }
          return `<li class="${color} flex items-start gap-3">${emoji} <span>${m.text}</span></li>`;
        }).join('')}
      </ul>
      <button class="fixes-toggle w-full py-3 px-5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition flex justify-between items-center mt-auto">
        <span>Show Fixes ${failed.length > 0 ? `(${failed.length} items)` : ''}</span>
        <span class="arrow transition-transform duration-200">▼</span>
      </button>
      <div class="fixes-panel mt-5 pt-5 pb-6 border-t border-gray-200 dark:border-gray-700">
        ${failed.length > 0 ? `
          <ul class="space-y-4 text-sm">
            ${failed.map(f => {
              let emoji = f.grade === 'bad' ? '❌' : '⚠️';
              let color = f.grade === 'bad'
                ? 'text-red-700 dark:text-red-300'
                : 'text-orange-600 dark:text-orange-400';
              return `<li class="${color} flex items-start gap-3">${emoji} <span>${f.text}</span></li>`;
            }).join('')}
          </ul>
        ` : `
          <p class="text-center text-green-600 dark:text-green-400 font-medium py-3">✅ All major signals strong – only minor tweaks may help.</p>
        `}
        <p class="text-center mt-6">
          <a href="#${mod.name.toLowerCase()}"
             class="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Learn more about ${mod.name}? →
          </a>
        </p>
      </div>
    </div>
    `;
  }).join('')}
</div>

<!-- Relationships + Practices + Readiness -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  ${modules.slice(2).map(mod => {
    const { score, metrics = [], failed = [] } = mod.result;
    const cardGrade = getGrade(score);
    let borderColorClass = 'border-gray-400 dark:border-gray-600'; // safe fallback visible in dev
    const grade = cardGrade.text.trim().toLowerCase();
    if (grade.includes('excellent')) {
      borderColorClass = 'border-green-500 dark:border-green-400';
    } else if (grade.includes('good')) {
      borderColorClass = 'border-emerald-500 dark:border-emerald-400';
    } else if (grade.includes('fair')) {
      borderColorClass = 'border-orange-500 dark:border-orange-400';
    } else if (grade.includes('needs') || grade.includes('work') || grade === '') {
      borderColorClass = 'border-red-600 dark:border-red-500';
    } else {
      console.warn(`Unexpected grade for ${mod.name}: "${cardGrade.text}" (using red fallback)`);
      borderColorClass = 'border-red-600 dark:border-red-500';
    }
    const arcColor = score >= 85 ? '#22c55e' :
                     score >= 70 ? '#10b981' :
                     score >= 50 ? '#f59e0b' : '#ef4444';
    return `
    <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-4 ${borderColorClass} flex flex-col min-h-[540px]">
      <div class="flex justify-center mb-6">
        <div class="relative w-32 h-32 mx-auto">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none" class="dark:stroke-gray-700"/>
            <circle cx="64" cy="64" r="56"
                    stroke="${arcColor}"
                    stroke-width="12" fill="none"
                    stroke-dasharray="${(score / 100) * 352} 352"
                    stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-4xl font-black" style="color: ${arcColor};">${score}</div>
          </div>
        </div>
      </div>
      <p class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">${mod.name}</p>
      ${(() => {
        const g = getGrade(score);
        return `<p class="text-center text-xl font-bold ${g.color} mb-4">${g.emoji} ${g.text}</p>`;
      })()}
      <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">${mod.desc}</p>
      <button class="details-toggle w-full py-2 px-4 mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition flex justify-between items-center">
        <span>More Details</span>
        <span class="details-arrow transition-transform duration-200">▼</span>
      </button>
      <div class="details-panel mt-3 pt-3 pb-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
        <p class="mb-3"><strong>What it measures:</strong> ${getModuleExplanation(mod.name).what}</p>
        <p class="mb-4"><strong>Why it matters:</strong> ${getModuleExplanation(mod.name).why}</p>
        <p class="text-center mt-6">
          <a href="#${mod.name.toLowerCase()}"
             class="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            How ${mod.name} is tested? →
          </a>
        </p>
      </div>
      <ul class="text-sm space-y-3 mt-4 mb-4 flex-grow">
        ${metrics.map(m => {
          let emoji = '❌', color = 'text-red-600 dark:text-red-400';
          if (m.grade === 'good') { emoji = '✅'; color = 'text-green-600 dark:text-green-400'; }
          else if (m.grade === 'warning') { emoji = '⚠️'; color = 'text-orange-500 dark:text-orange-400'; }
          return `<li class="${color} flex items-start gap-3">${emoji} <span>${m.text}</span></li>`;
        }).join('')}
      </ul>
      <button class="fixes-toggle w-full py-3 px-5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition flex justify-between items-center mt-auto">
        <span>Show Fixes ${failed.length > 0 ? `(${failed.length} items)` : ''}</span>
        <span class="arrow transition-transform duration-200">▼</span>
      </button>
      <div class="fixes-panel mt-5 pt-5 pb-6 border-t border-gray-200 dark:border-gray-700">
        ${failed.length > 0 ? `
          <ul class="space-y-4 text-sm">
            ${failed.map(f => {
              let emoji = f.grade === 'bad' ? '❌' : '⚠️';
              let color = f.grade === 'bad'
                ? 'text-red-700 dark:text-red-300'
                : 'text-orange-600 dark:text-orange-400';
              return `<li class="${color} flex items-start gap-3">${emoji} <span>${f.text}</span></li>`;
            }).join('')}
          </ul>
        ` : `
          <p class="text-center text-green-600 dark:text-green-400 font-medium py-3">✅ All major signals strong – only minor tweaks may help.</p>
        `}
        <p class="text-center mt-6">
          <a href="#${mod.name.toLowerCase()}"
             class="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Learn more about ${mod.name}? →
          </a>
        </p>
      </div>
    </div>
    `;
  }).join('')}
</div>

<!-- PDF Share Feedback Buttons -->
<div class="text-center my-16 px-4">
  <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
    <!-- Share Report - Green - first -->
    <button id="share-report-btn"
            class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Share Report ↗️
    </button>
    <!-- Save Report - Orange - second -->
    <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
            class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Save Report 📥
    </button>
    <!-- Submit Feedback - Blue - third -->
    <button id="feedback-btn"
            class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
     Submit Feedback 💬
    </button>
  </div>

  <!-- Share message - placed directly below buttons, always visible when triggered -->
  <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>

  <!-- Share Report Form (still hidden/expandable) -->
  <div id="share-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <form id="share-form" class="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-orange-500/30">
      <div>
        <label for="share-name" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Name</label>
        <input id="share-name" type="text" required placeholder="Your name" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-sender-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Email (for replies)</label>
        <input id="share-sender-email" type="email" required placeholder="your@email.com" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Recipient Email</label>
        <input id="share-email" type="email" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-title" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Email Title</label>
        <input id="share-title" type="text" required placeholder="Traffic Torch SEO Intent Report" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-body" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Message</label>
        <textarea id="share-body" required rows="5" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-3xl px-6 py-4 focus:outline-none focus:border-orange-500"></textarea>
      </div>
      <button type="submit" class="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-4 rounded-2xl transition shadow-lg">Send Report →</button>
    </form>
  </div>

  <!-- Feedback Form (unchanged) -->
  <div id="feedback-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-blue-500/30">
      <p class="text-lg font-medium mb-6 text-gray-800 dark:text-gray-200">
        Feedback for SEO Intent Tool on <strong>${document.body.getAttribute('data-url') || 'the analyzed page'}</strong>
      </p>
      <form id="feedback-form" class="space-y-6">
        <div>
          <label for="feedback-rating" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Rating (optional)</label>
          <div class="flex gap-3 text-3xl justify-center sm:justify-start">
            <button type="button" data-rating="1" class="hover:scale-125 transition">😞</button>
            <button type="button" data-rating="2" class="hover:scale-125 transition">🙁</button>
            <button type="button" data-rating="3" class="hover:scale-125 transition">😐</button>
            <button type="button" data-rating="4" class="hover:scale-125 transition">🙂</button>
            <button type="button" data-rating="5" class="hover:scale-125 transition">😍</button>
          </div>
          <input type="hidden" id="feedback-rating" name="rating">
        </div>
        <div>
          <label class="flex items-center gap-2 justify-center sm:justify-start">
            <input type="checkbox" id="reply-requested" class="w-5 h-5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Request reply</span>
          </label>
        </div>
        <div id="email-group" class="hidden">
          <label for="feedback-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Email</label>
          <input id="feedback-email" type="email" name="email" placeholder="your@email.com" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label for="feedback-text" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Feedback</label>
          <textarea id="feedback-text" name="message" required rows="5" maxlength="1000" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-500"></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">
            <span id="char-count">0</span>/1000 characters
          </p>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg">Send Feedback</button>
      </form>
      <div id="feedback-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium"></div>
    </div>
  </div>
</div>
</div>
      `;


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

if (!document.body.dataset.toggleListenersAttached) {
  document.body.addEventListener('click', function(e) {
    const button = e.target.closest('.fixes-toggle, .details-toggle');
    if (!button) return;

    e.preventDefault();
    e.stopPropagation();

    const panel = button.nextElementSibling;
    const arrow = button.querySelector('.arrow, .details-arrow');

    if (!panel || !arrow) return;

const isExpanded = panel.classList.contains('expanded');

if (isExpanded) {
  panel.classList.remove('expanded');
  panel.style.maxHeight = '0px';
  arrow.classList.remove('rotate-180');
  arrow.textContent = '▼';
} else {
  panel.classList.add('expanded');
  panel.style.maxHeight = panel.scrollHeight + 'px';
  arrow.classList.add('rotate-180');
  arrow.textContent = '▲';
}
  });

  document.body.dataset.toggleListenersAttached = 'true';
}

    } catch (err) {
      console.error('Analysis error:', err);
      clearInterval(interval);
      clearTimeout(heavyTimeout);
      results.innerHTML = `
        <div class="text-center py-12 px-6">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis could not complete</p>
          <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
            ${err.message.includes('timeout') || err.message.includes('fetch')
              ? 'The page is very large or took too long to load. Try a smaller page or check your internet connection.'
              : err.message || 'An unexpected error occurred. Please check the console for details.'}
          </p>
          <button onclick="location.reload()" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl">
            Try Again
          </button>
        </div>
      `;
    }
  });
});