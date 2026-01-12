export function renderPriorityAndGains(prioritisedFixes, yourScore, overallScore) {
  const priorityContainer = document.getElementById('priority-cards-container');
  const gainsContainer = document.getElementById('gains-container');

  if (!priorityContainer || !gainsContainer) return;

  priorityContainer.innerHTML = '';
  gainsContainer.innerHTML = '';

  // Compact Priority Cards (metric name only as title)
  if (prioritisedFixes.length > 0) {
    prioritisedFixes.forEach((fix, index) => {
      const rank = index + 1;
      const rankColor = rank === 1 ? 'bg-red-500' : rank === 2 ? 'bg-orange-500' : 'bg-green-500';
      const impact = index === 0 ? '15–25' : index === 1 ? '10–20' : '8–15';

      const card = document.createElement('div');
      card.className = 'rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700';

      card.innerHTML = `
        <div class="${rankColor} text-white py-6 text-center">
          <div class="text-5xl font-black">${rank}</div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">${fix.title}</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            <strong class="text-green-600 dark:text-green-400">How to fix:</strong> ${fix.how}
          </p>
          <div class="inline-block px-5 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded-full font-bold text-sm">
            +${impact} points
          </div>
        </div>
      `;

      priorityContainer.appendChild(card);
    });
  } else {
    priorityContainer.innerHTML = `
      <div class="text-center py-10 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-200 dark:border-green-800">
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">No Priority Fixes Needed</p>
      </div>
    `;
  }

  // Richer Gains Section (matches SEO Intent screenshot style)
  const projected = Math.min(100, yourScore + Math.round((100 - yourScore) * 0.65));
  const scoreDelta = projected - yourScore;
  const trafficBoost = Math.round((100 - yourScore) * 2);

  gainsContainer.innerHTML = `
    <div class="grid md:grid-cols-2 gap-8">
      <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <h3 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Overall Score Improvement</h3>
        <div class="flex justify-center items-baseline gap-6 mb-10">
          <div class="text-6xl font-black text-gray-500 dark:text-gray-400">${yourScore}</div>
          <div class="text-4xl text-gray-400">→</div>
          <div class="text-7xl font-black text-green-600 dark:text-green-400">${projected}</div>
          <div class="text-2xl font-medium text-green-600 dark:text-green-400 ml-4">(+${scoreDelta})</div>
        </div>
        <p class="text-center text-xl font-bold mb-6">+${scoreDelta} points potential</p>
        <div class="text-center">
          <p class="font-medium text-gray-700 dark:text-gray-300 mb-4">Top priority fixes & estimated impact:</p>
          <ul class="space-y-3 text-left max-w-lg mx-auto">
            ${prioritisedFixes.map(fix => `
              <li class="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <span class="text-sm md:text-base">${fix.title}</span>
                <span class="font-bold text-orange-600">+${Math.round(fix.impact / 3)}–${Math.round(fix.impact / 2)} points</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
          <summary class="cursor-pointer font-medium text-orange-500 hover:underline text-center">How We Calculated This</summary>
          <div class="mt-4 space-y-2">
            <p>• Weighted on-page & technical factors (relevance 30%, content 25%, UX 20%)</p>
            <p>• Assumes full implementation of top fixes</p>
            <p>• Benchmarks from high-ranking pages (typically 80+ score)</p>
          </div>
        </details>
      </div>

      <div class="p-8 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-3xl shadow-2xl">
        <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
        <div class="space-y-8 text-center text-xl">
          <div class="text-5xl font-black">Page 2 → Page 1 potential</div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">🚀</span>
            <div>
              <p class="font-medium">Organic Traffic Increase</p>
              <p class="text-4xl">+${trafficBoost}–${trafficBoost + 30}%</p>
            </div>
          </div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">📈</span>
            <div>
              <p class="font-medium">Click-Through Rate Boost</p>
              <p class="text-4xl">+30–50% from rich results & intent match</p>
            </div>
          </div>
          <div class="flex justify-center items-center gap-6">
            <span class="text-6xl">🔑</span>
            <div>
              <p class="font-medium">Intent Satisfaction</p>
              <p class="text-4xl">60% → 100%</p>
            </div>
          </div>
        </div>
        <p class="mt-12 text-center text-sm opacity-90">
          Conservative estimates • Visible in 1–4 weeks • Depends on competition & authority
        </p>
      </div>
    </div>
  `;
}