export function renderPriorityAndGains(prioritisedFixes, yourScore, overallScore) {
  console.log('[PriorityGains] Render called - fixes:', prioritisedFixes.length);
  console.log('[PriorityGains] yourScore:', yourScore, 'overallScore:', overallScore);

  const priorityContainer = document.getElementById('priority-cards-container');
  const gainsContainer = document.getElementById('gains-container');

  if (!priorityContainer) {
    console.error('[PriorityGains] ERROR: #priority-cards-container NOT FOUND in DOM');
    return;
  }
  if (!gainsContainer) {
    console.error('[PriorityGains] ERROR: #gains-container NOT FOUND in DOM');
    return;
  }

  // Clear loading text
  priorityContainer.innerHTML = '';
  gainsContainer.innerHTML = '';

  console.log('[PriorityGains] Containers found - clearing loading text');

  // Priority cards
  if (prioritisedFixes.length > 0) {
    console.log('[PriorityGains] Rendering ' + prioritisedFixes.length + ' priority cards');
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
            <p><strong class="text-blue-600 dark:text-blue-400">Issue:</strong> ${fix.title}</p>
            <p><strong class="text-green-600 dark:text-green-400">How to fix:</strong> ${fix.how || 'Apply recommended fix'}</p>
            <p><strong class="text-orange-600 dark:text-orange-400">Impact:</strong> Improves relevance/UX/technical health</p>
          </div>
          <div class="mt-6 inline-block px-4 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded-full text-sm font-semibold">
            +${index === 0 ? '15–25' : index === 1 ? '10–20' : '8–15'} points
          </div>
        </div>
      `;

      priorityContainer.appendChild(card);
      console.log('[PriorityGains] Added card #' + rank + ':', fix.title);
    });
  } else {
    priorityContainer.innerHTML = '<p class="text-center text-xl text-green-600 dark:text-green-400 py-12">No priority fixes needed!</p>';
  }

  // Gains card
  const projected = Math.min(100, yourScore + Math.round((100 - yourScore) * 0.6));
  gainsContainer.innerHTML = `
    <div class="p-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-3xl shadow-2xl">
      <h3 class="text-3xl font-bold text-center mb-8">Potential Gains</h3>
      <div class="text-center">
        <div class="text-6xl font-black">${projected}</div>
        <p class="text-xl mt-2 opacity-90">Projected AI Score</p>
      </div>
      <p class="text-center mt-8 text-lg">+${Math.round((100 - yourScore) * 1.5)}–${Math.round((100 - yourScore) * 2.5)}% Traffic Potential</p>
    </div>
  `;
  console.log('[PriorityGains] Gains card rendered');
}