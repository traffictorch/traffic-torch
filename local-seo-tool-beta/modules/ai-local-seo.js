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

return {
    data: aiData,
    score: 0,      // kept only for compatibility with script-v1.2.js, has no effect
    maxRaw: 100,
    fixes: []
  };
}