document.addEventListener('DOMContentLoaded', () => {
  // === STEP 1: CENTRAL CONFIG OBJECT + PARSING VARIABLES ===
  const defaultConfig = {
    // Simplify for entities; add if needed for custom selectors
  };
  let config = { ...defaultConfig };
  const urlParams = new URLSearchParams(window.location.search);
  // ── Auto-fill URL from share link ?url=
  const sharedUrlParam = urlParams.get('url');
  if (sharedUrlParam) {
    try {
      const decoded = decodeURIComponent(sharedUrlParam);
      const input = document.getElementById('url-input');
      if (input) {
        input.value = decoded;
        setTimeout(() => {
          if (input.value.trim()) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }, 500);
      }
    } catch (e) {
      console.warn('Invalid shared URL parameter', e);
    }
  }
  const configParam = urlParams.get('config');
  if (configParam) {
    try {
      const override = JSON.parse(decodeURIComponent(configParam));
      config = deepMerge(config, override);
    } catch (e) {
      console.warn('Invalid config URL parameter');
    }
  }
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
  const form = document.getElementById('entity-form'); // Update ID if changed in HTML
  const results = document.getElementById('results');
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const parts = trimmed.split('/', 1);
    const host = parts[0];
    const path = trimmed.slice(host.length);
    return 'https://' + host + path;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // const canProceed = await canRunTool('limit-audit-id'); // Keep if rate limiting needed
    // if (!canProceed) return;
    const inputValue = document.getElementById('url-input').value;
    const url = cleanUrl(inputValue);
    const topEntities = parseInt(document.getElementById('top-entities').value) || 3; // Default to 3
    if (!url) return;
    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-2 mt-2">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500"></p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progress-text');
    try {
      progressText.textContent = "Fetching page...";
      // Send to Worker instead of local parsing
      const res = await fetch("https://rendered-proxy-basic.traffictorch.workers.dev/entity-analyze", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, topEntities })
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      const extracted = data.extracted; // Array [{text, type, salience}]
      const audit = data.audit; // {overall: num, coverage: num, salience: num, relationships: num, practices: num, readiness: str, suggestions: []}
      progressText.textContent = "Generating Report";
      await sleep(600);
      // Calculate overall (reuse logic, adapt to entities)
      const overall = audit.overall;
      const projectedScore = overall < 80 ? Math.min(100, overall + (audit.suggestions.length * 5)) : overall;
      const scoreDelta = projectedScore - overall;
      const isOptimal = scoreDelta <= 5;
      const priorityFixes = audit.suggestions.slice(0, 3).map(s => ({text: s, impact: '+5-10 points'}));
      // Modules for radar (adapt to entity metrics)
      const modules = [
        { name: 'Coverage', score: audit.coverage },
        { name: 'Salience', score: audit.salience },
        { name: 'Relationships', score: audit.relationships },
        { name: 'Best Practices', score: audit.practices }
      ];
      const scores = modules.map(m => m.score);
      // Scroll to results (keep)
      const offset = 240;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      // Render results (reuse layout, adapt to entities)
      results.innerHTML = `
        <!-- Overall Score Card -->
        <div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${overall >= 80 ? 'border-green-500' : overall >= 60 ? 'border-orange-400' : 'border-red-500'}">
            <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall Semantic Health</p>
            <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
              <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
                <circle cx="100" cy="100" r="90"
                        stroke="${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}"
                        stroke-width="16" fill="none"
                        stroke-dasharray="${(overall / 100) * 565} 565"
                        stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
                       style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
                    ${overall}
                  </div>
                  <div class="text-lg sm:text-xl opacity-80 -mt-1"
                       style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
                    /100
                  </div>
                </div>
              </div>
            </div>
            <p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">Analyzed Page</p>
            <p class="${getGrade(overall).color} text-4xl sm:text-5xl font-bold text-center mt-4 sm:mt-6 drop-shadow-lg">${getGrade(overall).emoji} ${getGrade(overall).text}</p>
          </div>
        </div>
        <!-- Radar Chart -->
        <div class="max-w-5xl mx-auto my-16 px-4">
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
            <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Entity Health Radar</h3>
            <div class="hidden md:block w-full">
              <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
            </div>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">Radar chart available on desktop/tablet</p>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">Visual overview of entity performance</p>
          </div>
        </div>
        <!-- Extracted Entities Grid -->
        <div class="grid md:grid-cols-3 gap-6 my-16">
          ${extracted.map(entity => `
            <div class="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg text-gray-800 dark:text-gray-200">
              <p class="font-bold">${entity.text} (${entity.type})</p>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${entity.salience * 100}%"></div>
              </div>
              <p title="Salience: How central this entity is (aim >0.6 for main topics)">Salience: ${entity.salience}</p>
            </div>
          `).join('')}
        </div>
        <!-- Audit Breakdown -->
        <div class="grid md:grid-cols-4 gap-6 my-16">
          ${['Coverage', 'Salience', 'Relationships', 'Best Practices'].map(key => {
            const score = audit[key.toLowerCase()];
            const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444';
            const border = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-orange-400' : 'border-red-500';
            return `
            <div class="score-card text-center p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${border}">
              <div class="relative mx-auto w-32 h-32">
                <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                  <circle cx="64" cy="64" r="56"
                          stroke="${color}"
                          stroke-width="12" fill="none"
                          stroke-dasharray="${(score/100)*352} 352"
                          stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${color};">
                  ${score}
                </div>
              </div>
              <p class="${getGrade(score).color} text-xl font-bold mt-4">${getGrade(score).emoji} ${getGrade(score).text}</p>
              <p class="mt-3 text-lg font-medium text-gray-800 dark:text-gray-200">${key}</p>
              <button class="fixes-toggle mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Details</button>
              <div class="fixes-panel hidden mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <p class="font-bold text-gray-800 dark:text-gray-200">How to improve:</p>
                <p>Explanation for ${key} (educational content here).</p>
              </div>
            </div>`;
          }).join('')}
        </div>
        <!-- Priority Fixes (adapt) -->
        <div class="mt-20 space-y-8">
          <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Top Priority Fixes</h2>
          ${priorityFixes.map((fix, i) => `
            <div class="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div class="relative flex items-start gap-6">
                <div class="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                  ${i + 1}
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">${fix.text}</h3>
                  <div class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-full shadow-lg">
                    ${fix.impact}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <!-- Score Improvement (adapt) -->
        <div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
          <!-- Similar to original, update text to entity-focused -->
        </div>
        <!-- Buttons (keep share/save/feedback) -->
        <div class="text-center my-16 px-4">
          <!-- Reuse button HTML, update IDs -->
        </div>
      `;
      // Radar init (keep, update colors)
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'radar',
            data: { labels: modules.map(m => m.name), datasets: [{ label: 'Entity Score', data: scores, /* styles */ }] },
            options: { /* keep */ }
          });
        }
      }, 150);
      // Init share/feedback (inline or keep functions)
      initShareReport(results); // Inline if removed imports
      initSubmitFeedback(results);
      // Event delegation (keep)
      results.addEventListener('click', (e) => {
        if (e.target.matches('.fixes-toggle')) {
          e.target.nextElementSibling.classList.toggle('hidden');
        }
      });
    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
    // Data-url for PDF (keep)
    document.body.setAttribute('data-url', cleanUrl(inputValue));
  });
  // Grade function (keep, adapt if needed)
  function getGrade(score, type = 'default') {
    // Reuse logic
  }
});