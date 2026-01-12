// seo-ux-tool/priority-gains.js
export function renderPriorityAndGains(prioritisedFixes, yourScore, overallScore) {
  const container = document.getElementById('priority-gains-container');
  if (!container) return;

  const priorityCards = document.getElementById('priority-cards');
  const gainsCard = document.getElementById('gains-card');

  // Clear previous content
  priorityCards.innerHTML = '';
  gainsCard.innerHTML = '';

  // === Priority Cards ===
  if (prioritisedFixes.length > 0) {
    priorityCards.innerHTML = '<h2 class="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">Top Priority Fixes</h2>';

    prioritisedFixes.forEach((fix, index) => {
      const rank = index + 1;
      const rankColor = rank === 1 ? 'bg-red-500' : rank === 2 ? 'bg-orange-500' : 'bg-green-500';

      const card = document.createElement('div');
      card.className = 'rounded-2xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden';

      card.innerHTML = `
        <div class="${rankColor} text-white py-6 text-center">
          <div class="text-5xl font-black">${rank}</div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">${fix.title}</h3>
          <div class="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
            <p><strong class="text-blue-600 dark:text-blue-400">What:</strong> ${fix.what}</p>
            <p><strong class="text-green-600 dark:text-green-400">How:</strong> ${fix.how}</p>
            <p><strong class="text-orange-600 dark:text-orange-400">Why:</strong> ${fix.why}</p>
          </div>
          <div class="mt-6 inline-block px-4 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded-full text-sm font-semibold">
            +${index === 0 ? '15–25' : index === 1 ? '10–20' : '8–15'} points
          </div>
        </div>
      `;

      priorityCards.appendChild(card);
    });
  } else {
    priorityCards.innerHTML = `
      <div class="text-center py-12 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-200 dark:border-green-800">
        <p class="text-4xl mb-4">🎉</p>
        <p class="text-xl font-bold text-green-700 dark:text-green-300">No Priority Fixes Needed</p>
      </div>
    `;
  }

  // === Ranking Gains Card ===
  const projected = Math.min(100, yourScore + Math.round((100 - yourScore) * 0.65));
  gainsCard.innerHTML = `
    <div class="rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-purple-700 text-white p-8">
      <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
      <div class="text-center mb-10">
        <div class="text-6xl font-black">${projected}</div>
        <p class="text-xl mt-2 opacity-90">Projected AI Search Score</p>
      </div>
      <div class="space-y-6 text-center text-lg">
        <div>📈 Ranking Position: Page 2 → Page 1 potential</div>
        <div>🚀 Organic Traffic: +${Math.round((100 - yourScore) * 1.8)}–${Math.round((100 - yourScore) * 2.8)}%</div>
        <div>👆 Rich Results Boost: +30–50% CTR potential</div>
      </div>
      <p class="mt-10 text-center text-sm opacity-80">
        Conservative estimates • Visible in 1–4 weeks • Depends on competition & authority
      </p>
    </div>
  `;
}