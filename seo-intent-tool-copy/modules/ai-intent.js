export async function analyzeAiIntent(cleanedText, url) {
  const AI_PROXY = 'https://seo-intent.traffictorch.workers.dev/';
  console.log('AI Intent module called with text length:', cleanedText.length, 'URL:', url);

  try {
    const res = await fetch(AI_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanedText, url })
    });

    console.log('AI proxy response status:', res.status);

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
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">AI Detected Search Intents</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${intents.slice(0, 6).map((intent, i) => `
            <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3 mb-4">
                <span class="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg">${i + 1}</span>
                <span class="text-lg font-semibold text-gray-800 dark:text-gray-200">${intent}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
  } catch (err) {
    console.error('AI Intent module failed:', err.message);
    return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-red-300 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400">AI search intent detection temporarily unavailable.</p>
      </div>
    </div>`;
  }
}