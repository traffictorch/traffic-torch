// ai-local-seo.js
export async function analyzeLocalIntent(doc, city, fullUrl, cleanedContent) {
  const API_URL = 'https://local-seo.traffictorch.workers.dev/';

  let aiData = {
    primary: "Local Business",
    secondary: null,
    confidence: "average",
    geoScore: 0.6
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
      if (data && data.intents && Array.isArray(data.intents) && data.intents.length > 0) {
        const top = data.intents[0];
        aiData = {
          primary: top.searchIntent || "Local Business",
          secondary: data.intents[1] ? data.intents[1].searchIntent : null,
          confidence: top.coverage && top.coverage.includes("Strong") ? "strong" : 
                     (top.coverage && top.coverage.includes("Partial") ? "average" : "weak"),
          geoScore: 0.7
        };
      }
    }
  } catch (error) {
    console.warn('[AI Local Intent] Worker call failed', error);
  }

  return {
    data: aiData,
    score: 65,
    maxRaw: 100,
    fixes: []
  };
}