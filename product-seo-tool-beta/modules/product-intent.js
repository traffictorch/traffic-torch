//product-intent.js
export async function analyzeProductIntent(cleanedText, url) {
  const AI_PROXY = 'https://product-seo.traffictorch.workers.dev/';
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
    const card = data.productIntentCard || null;
    if (!card) {
      return `<div class="max-w-5xl mx-auto my-16 px-4">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <p class="text-orange-500">No product intent analysis available.</p>
        </div>
      </div>`;
    }
   return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Semantic Product Intent Analysis</h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Detected Intent -->
          <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">1. Detected Search Intent</h4>
            <div class="text-base font-medium text-orange-600 dark:text-orange-400 mb-2">${card.detectedIntent || 'Not detected'}</div>
          </div>

          <!-- Commercial Match -->
          <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">2. Commercial Intent Match</h4>
            <div class="text-base text-gray-700 dark:text-gray-300">${card.commercialMatch || 'Match level not available'}</div>
          </div>
        </div>

        <!-- Improvement Advice -->
        <div class="mt-8 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">3. Advice to Improve Commercial Alignment</h4>
          <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${card.improvementAdvice || 'No advice available'}</div>
        </div>

        <!-- Suggested Elements -->
        <div class="mt-8 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 class="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">4. Suggested Title & Meta Description for Converting Queries</h4>
          <div class="space-y-6">
            <div>
              <div class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Recommended Meta Title</div>
              <div class="font-mono text-sm bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">${card.suggestedElements?.metaTitle || 'No title suggestion'}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Recommended Meta Description</div>
              <div class="font-mono text-sm bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">${card.suggestedElements?.metaDescription || 'No description suggestion'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  } catch (err) {
    console.error('AI Intent module failed:', err.message);
    return `<div class="max-w-5xl mx-auto my-16 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-red-300 dark:border-red-800">
        <p class="text-red-600 dark:text-red-400">AI product intent analysis temporarily unavailable.</p>
      </div>
    </div>`;
  }
}
