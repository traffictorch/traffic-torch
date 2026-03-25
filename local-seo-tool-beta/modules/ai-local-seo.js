// ai-local-seo.js
export async function analyzeLocalIntent(doc, city, fullUrl, cleanedContent) {
  const API_URL = 'https://local-seo.traffictorch.workers.dev/';

  let aiData = {
    primary: "local_research_intent",
    secondary: null,
    confidence: "average",
    geoScore: 0.65,
    suggestions: []
  };

  try {
    const htmlSnippet = doc.documentElement.outerHTML.substring(0, 12000);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlSnippet,
        cleanedContent: cleanedContent || '',
        city: city
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.primary) aiData = data;
    }
  } catch (error) {
    console.warn('[AI Local Intent] Worker call failed', error);
  }

  const confidenceScore = aiData.confidence === 'strong' ? 88 : aiData.confidence === 'average' ? 65 : 42;
  const score = Math.round(confidenceScore * (0.5 + (aiData.geoScore || 0.65) * 0.5));

  const fixes = (aiData.suggestions || []).map(s => ({
    module: 'AI Local Intent',
    sub: s.title || 'Intent Optimization',
    issue: s.title || 'Improve local intent signals',
    how: s.how || '',
    priority: 'high'
  }));

  return {
    data: aiData,
    score: Math.min(100, Math.max(0, score)),
    maxRaw: 100,
    fixes: fixes
  };
}