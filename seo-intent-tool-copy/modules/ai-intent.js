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

    if (intents.length === 0) {
      return `<div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <p class="text-orange-500">No additional search intents detected by AI.</p>
        </div>
      </div>`;
    }

    return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">AI Detected Search Intents</h3>
        <div class="space-y-8">
          ${intents.map((intent, i) => `
            <div class="flex flex-col md:flex-row gap-6 border-l-4 border-orange-400 pl-6">
              <div class="flex-1">
                <div class="flex items-baseline gap-3">
                  <span class="text-3xl font-black text-orange-500">${i + 1}</span>
                  <span class="text-xl font-semibold text-gray-800 dark:text-gray-200">${intent.type}</span>
                  <span class="text-sm bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-3xl">${intent.confidence}% confidence</span>
                </div>
                <p class="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${intent.howToImprove}</p>
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
        <p class="text-red-600 dark:text-red-400">AI Intent analysis temporarily unavailable (Error: ${err.message})</p>
        <p class="text-xs text-gray-500 mt-2">The AI worker returned a server error. Check worker logs.</p>
      </div>
    </div>`;
  }
}