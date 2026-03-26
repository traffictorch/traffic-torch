// ai-local-seo.js
export async function analyzeLocalIntent(doc, city, fullUrl, cleanedContent) {
  const API_URL = 'https://local-seo.traffictorch.workers.dev/';

  let aiData = {
    localIntentType: "Local Store Intent",
    localSearchIntent: ["local business near me"],
    fixSuggestions: ["Add clearer local intent signals to improve detection."]
  };

  try {
    const contentForAI = cleanedContent || doc.body?.textContent?.replace(/\s+/g, ' ').trim() || '';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cleanedText: contentForAI,
        url: fullUrl
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.localIntentType) {
        aiData = data;
      }
    }
  } catch (error) {
    console.warn('[AI Local Intent] Worker call failed', error);
  }

  // Generate HTML for the card
  const primary = aiData.localIntentType || "Local Store Intent";
  const searchIntentsHTML = (aiData.localSearchIntent || []).map(q => 
    `<div class="px-5 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-700 dark:text-gray-300 text-sm">${q}</div>`
  ).join('');

  const suggestionsHTML = (aiData.fixSuggestions || []).map(s => `
    <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${s}</p>
    </div>
  `).join('');

  window.aiModuleHTML = `
    <div class="max-w-5xl mx-auto my-12 px-4">
      <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl p-8 border border-orange-200 dark:border-orange-800">
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-6">AI Detected Local Search Intent</h3>
        
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <div class="px-6 py-3 bg-orange-100 dark:bg-orange-950 rounded-2xl font-semibold text-orange-700 dark:text-orange-300">
            Primary: <span class="font-bold">${primary}</span>
          </div>
        </div>

        <div class="mb-8">
          <div class="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 text-center">Local Search Intents</div>
          <div class="flex flex-wrap justify-center gap-3">
            ${searchIntentsHTML || '<div class="text-gray-500 dark:text-gray-400">No search intents detected</div>'}
          </div>
        </div>

        <div class="space-y-6">
          ${suggestionsHTML || '<p class="text-gray-500 dark:text-gray-400 text-center">No suggestions available yet.</p>'}
        </div>
      </div>
    </div>
  `;

  return {
    data: aiData,
    score: 0,
    maxRaw: 100,
    fixes: []
  };
}