export async function analyzeAiIntent(cleanedText, url) {
  const AI_PROXY = 'https://seo-intent.traffictorch.workers.dev/';
  try {
    const res = await fetch(AI_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanedText, url })
    });
    if (!res.ok) {
      throw new Error(`AI proxy failed with status ${res.status}`);
    }
    const data = await res.json();
    const intents = data.intents || [];
    if (intents.length === 0 || !Array.isArray(intents)) {
      return `<div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <p class="text-orange-500">No search intents detected.</p>
        </div>
      </div>`;
    }
   return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Detected Search Intents</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${intents.slice(0, 2).map((item, i) => `
            <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col">
              <div class="flex items-center gap-3 mb-4">
                <span class="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg">${i + 1}</span>
                <span class="text-lg font-semibold text-gray-800 dark:text-gray-200">${item.searchIntent || 'Untitled Intent'}</span>
              </div>
              <div class="text-sm text-orange-600 dark:text-orange-400 mb-3">${item.type || ''}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-4">${item.coverage || ''}</div>
              <div class="text-sm text-gray-700 dark:text-gray-300 flex-1">${item.fixSuggestions || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
  } catch (err) {
    // AI Intent module failed - gracefully show fallback UI in production
    return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-red-300 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400">AI search intent detection temporarily unavailable.</p>
      </div>
    </div>`;
  }
}