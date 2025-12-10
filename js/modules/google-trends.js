async function fetchGoogleTrends(keywords, timeframe, geo, retries = 3) {
  try {
    // Step 1: Get fresh token with retry
    let token;
    for (let i = 0; i < retries; i++) {
      try {
        const tokenUrl = 'https://trends.google.com/trends/explore?q=seo&geo=';
        const tokenPage = await fetch(`${PROXY}?url=${encodeURIComponent(tokenUrl)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        if (tokenPage.status === 429) {
          console.warn(`Rate limit hit (attempt ${i+1}). Waiting 30s...`);
          await new Promise(r => setTimeout(r, 30000 * Math.pow(1.5, i))); // Exponential: 30s, 45s, 67s
          continue;
        }
    const tokenText = await tokenPage.text();
	// Grab last TOKEN (ignores any warning scripts)
	const tokenMatches = [...tokenText.matchAll(/"TOKEN":"([^"]+)"/g)];
	const token = tokenMatches[tokenMatches.length - 1]?.[1] || '';
	if (!token) throw new Error('TOKEN missing – retry in incognito (unsupported browser fix applied)');

    // Step 2: Build & fetch widgets
    const req = { comparisonItem: keywords.map(k => ({ keyword: k, time: timeframe, geo: geo || '' })), category: 0, property: '' };
    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
    const widgetRes = await fetch(`${PROXY}?url=${encodeURIComponent(exploreUrl)}`);
    if (widgetRes.status === 429) throw new Error('Rate limit on explore – wait 60s');
    const widgetJson = await widgetRes.text();
    const cleanJson = widgetJson.substring(5); // Strip )]}'\n
    const { widgets } = JSON.parse(cleanJson);

    // Step 3: Fetch widget data with per-widget delay (2s) to avoid burst
    const results = { iot: [], regions: [], related: [] };
    for (const w of widgets) {
      if (w.id === 'TIMESERIES' || w.title?.includes('Interest over time')) {
        await new Promise(r => setTimeout(r, 2000)); // 2s delay
        const dataUrl = `${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
        const res = await fetch(`${PROXY}?url=${encodeURIComponent(dataUrl)}`);
        if (res.status === 429) throw new Error('Rate limit on data – wait 60s');
        const txt = await res.text();
        results.iot = JSON.parse(txt.substring(5)).default.timelineData;
      }
      if (w.id === 'GEO_MAP' || w.title?.includes('Interest by region')) {
        await new Promise(r => setTimeout(r, 2000));
        const dataUrl = `${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
        const res = await fetch(`${PROXY}?url=${encodeURIComponent(dataUrl)}`);
        if (res.status === 429) throw new Error('Rate limit on regions – wait 60s');
        const txt = await res.text();
        results.regions = JSON.parse(txt.substring(5)).default.geoMapData;
      }
      if (w.id === 'RELATED_QUERIES' || w.title?.includes('Related queries')) {
        await new Promise(r => setTimeout(r, 2000));
        const dataUrl = `${w.requestUrl}?${new URLSearchParams(w.request)}&token=${w.token}&tz=-480`;
        const res = await fetch(`${PROXY}?url=${encodeURIComponent(dataUrl)}`);
        if (res.status === 429) throw new Error('Rate limit on related – wait 60s');
        const txt = await res.text();
        const parsed = JSON.parse(txt.substring(5)).default;
        results.related = { top: parsed.rankedList?.[0]?.rankedKeyword || [], rising: parsed.rankedList?.[1]?.rankedKeyword || [] };
      }
    }
    return results;
  } catch (err) {
    if (retries > 0) return fetchGoogleTrends(keywords, timeframe, geo, retries - 1);
    throw err;
  }
}