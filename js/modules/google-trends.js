async function fetchGoogleTrends(keywords, timeframe, geo, retries = 3) {
  const rotate = true; // Enable rotation
  let token;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const tokenUrl = `https://trends.google.com/trends/explore?q=seo&geo=`;
      const proxyUrl = `${PROXY}?url=${encodeURIComponent(tokenUrl)}${rotate ? '&rotate=1' : ''}`;
      const tokenPage = await fetch(proxyUrl);
      if (tokenPage.status === 429) {
        console.warn('429 – Rotating proxy & waiting 60s...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }
      const tokenText = await tokenPage.text();
      const tokenMatches = [...tokenText.matchAll(/"TOKEN":"([^"]+)"/g)];
      token = tokenMatches[tokenMatches.length - 1]?.[1];
      if (token) break;
    } catch (e) { await new Promise(r => setTimeout(r, 60000)); }
  }
  if (!token) throw new Error('TOKEN fail after retries – try VPN + wait 2hrs');

  // Similar for widgets & data fetches: Add &rotate=1 to proxyUrl, check status === 429 → 60s wait
  const req = { comparisonItem: keywords.map(k => ({ keyword: k, time: timeframe, geo: geo || '' })), category: 0, property: '' };
  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}&token=${token}`;
  const widgetProxy = `${PROXY}?url=${encodeURIComponent(exploreUrl)}&rotate=1`;
  const widgetRes = await fetch(widgetProxy);
  if (widgetRes.status === 429) { await new Promise(r => setTimeout(r, 60000)); /* retry */ }
  // ... parse & fetch widgets with same pattern (60s on 429)

  return results;
}