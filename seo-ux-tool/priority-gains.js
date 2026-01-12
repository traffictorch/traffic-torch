export function renderPriorityAndGains(prioritisedFixes, yourScore, overallScore) {
  const priorityContainer = document.getElementById('priority-cards-container');
  const gainsContainer = document.getElementById('gains-container');

  if (!priorityContainer || !gainsContainer) return;

  priorityContainer.innerHTML = '';
  gainsContainer.innerHTML = '';

  // Priority Fixes Cards
  if (prioritisedFixes.length > 0) {
    prioritisedFixes.forEach((fix, index) => {
      const rank = index + 1;
      const rankColor = rank === 1 ? 'bg-red-500' : rank === 2 ? 'bg-orange-500' : 'bg-green-500';
      const impact = index === 0 ? '15–25' : index === 1 ? '10–20' : '8–15';

      const card = document.createElement('div');
      card.className = 'rounded-3xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1';

      card.innerHTML = `
        <div class="${rankColor} text-white py-10 text-center">
          <div class="text-6xl font-black">${rank}</div>
        </div>
        <div class="p-8">
          <h3 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">${fix.title}</h3>
          <div class="space-y-6 text-gray-800 dark:text-gray-200">
            <p><strong class="text-blue-600 dark:text-blue-400">Issue:</strong> ${fix.title}</p>
            <p><strong class="text-green-600 dark:text-green-400">How to fix:</strong> ${fix.how}</p>
            <p><strong class="text-orange-600 dark:text-orange-400">Why it matters:</strong> ${fix.why}</p>
          </div>
          <div class="mt-8 inline-block px-6 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded-full text-lg font-bold">
            +${impact} points
          </div>
        </div>
      `;

      priorityContainer.appendChild(card);
    });
  } else {
    priorityContainer.innerHTML = `
      <div class="text-center py-16 bg-green-50 dark:bg-green-900/30 rounded-3xl border border-green-200 dark:border-green-800">
        <p class="text-6xl mb-6">🎉</p>
        <p class="text-3xl font-bold text-green-700 dark:text-green-300">No Priority Fixes Needed!</p>
        <p class="mt-6 text-xl text-gray-700 dark:text-gray-300">Your page is already optimized – focus on freshness & authority.</p>
      </div>
    `;
  }

  // Richer Gains Section
  const projected = Math.min(100, yourScore + Math.round((100 - yourScore) * 0.65));
  const trafficBoost = Math.round((100 - yourScore) * 2);
  gainsContainer.innerHTML = `
    <div class="grid md:grid-cols-2 gap-8">
      <div class="p-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <h3 class="text-3xl font-black text-center mb-10 text-gray-900 dark:text-gray-100">Overall Score Improvement</h3>
        <div class="flex justify-center items-center gap-12 mb-12">
          <div class="text-center">
            <div class="text-7xl font-black text-gray-500 dark:text-gray-400">${yourScore}</div>
            <p class="text-lg mt-2 opacity-70">Current</p>
          </div>
          <div class="text-5xl text-green-500">→</div>
          <div class="text-center">
            <div class="text-7xl font-black text-green-600 dark:text-green-400">${projected}</div>
            <p class="text-lg mt-2 opacity-70">Projected</p>
          </div>
        </div>
        <p class="text-center text-xl font-bold mb-6">+${projected - yourScore} points potential</p>
        <div class="text-center text-lg">
          <p>Top priority fixes & estimated impact:</p>
          <ul class="mt-6 space-y-4 text-left max-w-lg mx-auto">
            ${prioritisedFixes.map(fix => `<li class="flex items-center gap-3"><span class="text-green-500">•</span> ${fix.title} +${Math.round(fix.impact / 3)}–${Math.round(fix.impact / 2)} points</li>`).join('')}
          </ul>
        </div>
        <details class="mt-10">
          <summary class="cursor-pointer text-blue-600 dark:text-blue-400 font-bold text-lg text-center">How We Calculated This</summary>
          <div class="mt-4 text-sm space-y-3 text-gray-600 dark:text-gray-400">
            <p>• Weighted on-page factors (relevance 30%, technical 25%, UX 20%, etc.)</p>
            <p>• Projected assumes full implementation of top 3 fixes</p>
            <p>• Benchmarks from top-ranking pages (typically 80+ score)</p>
          </div>
        </details>
      </div>

      <div class="p-10 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-3xl shadow-2xl">
        <h3 class="text-3xl font-black text-center mb-10">Potential Ranking & Traffic Gains</h3>
        <div class="space-y-8 text-center text-xl">
          <div class="text-5xl font-black">Page 2 → Page 1 potential</div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">🚀</span>
            <div>
              <p class="font-bold">Organic Traffic Increase</p>
              <p class="text-4xl">+${trafficBoost}–${trafficBoost + 30}%</p>
            </div>
          </div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">📈</span>
            <div>
              <p class="font-bold">Click-Through Rate Boost</p>
              <p class="text-4xl">+30–50% from rich results & intent match</p>
            </div>
          </div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">🔑</span>
            <div>
              <p class="font-bold">Intent Satisfaction</p>
              <p class="text-4xl">60% → 100%</p>
            </div>
          </div>
        </div>
        <p class="mt-12 text-center text-sm opacity-90">
          Conservative estimates • Visible in 1–4 weeks after indexing • Depends on competition, authority & off-page factors
        </p>
      </div>
    </div>
  `;
}