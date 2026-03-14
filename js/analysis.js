// Enhanced fetch with heuristic fallback (fast first, accurate for SPAs)
async function fetchPageHtml(url) {
  // Step 1: Fast basic proxy (instant for static/simple sites)
  let fetchUrl = `https://cors-proxy.traffictorch.workers.dev/?url=${encodeURIComponent(url)}`;
  let resp = await fetch(fetchUrl);
  if (!resp.ok) throw new Error('Proxy failed');
  let html = await resp.text();

  // Step 2: Parse & heuristic detect JS-heavy/SPA
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bodyLength = doc.body.innerHTML.trim().length;
  const hasSPA = html.toLowerCase().includes('react') || 
                 html.includes('__NEXT_DATA__') || 
                 html.includes('vite') || 
                 doc.querySelector('script[type="module"]') || 
                 doc.querySelector('[data-reactroot]');

  // Fallback to rendering if needed (educate user in UI: "Advanced rendering for JS site – more accurate")
  if (bodyLength < 2000 || hasSPA) {  // Tune thresholds (2000 = short pre-render body)
    fetchUrl = `https://cors-proxy.traffictorch.workers.dev/render?url=${encodeURIComponent(url)}`;
    resp = await fetch(fetchUrl);
    if (resp.ok) {
      html = await resp.text();
      console.log('Used advanced rendering for better accuracy');
      // Optional: UI toast "JS-heavy site detected – full render applied"
    }
  }

  return { html, doc: parser.parseFromString(html, 'text/html') };  // Return both for your modules
}

// Usage in your 360° analysis / AI Search Optimization Tool
async function analyzeSite(targetUrl) {
  const { html, doc } = await fetchPageHtml(targetUrl);
  
  // Your existing deep-dive: health score, competitive gaps, AI fixes, predictive forecasting
  const score = calculate360Score(doc);
  const gaps = findCompetitiveGaps(doc);
  const fixes = generateAIFixes(doc);
  const forecast = predictRankChanges(doc);
  
  displayReport(score, gaps, fixes, forecast);  // Mobile-friendly education UI
}