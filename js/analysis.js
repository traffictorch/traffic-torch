// Add/replace in your analyzePage or fetch function
async function fetchRenderedHtml(url) {
  // Try fast basic proxy first
  let endpoint = '/?url=';  // Your existing proxy (fast/static)
  let resp = await fetch(`https://cors-proxy.traffictorch.workers.dev${endpoint}${encodeURIComponent(url)}`);
  let html = await resp.text();

  // Heuristic detection for JS-heavy/SPA (short body = pre-render only, or known markers)
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const bodyLength = doc.body.innerHTML.trim().length;
  const hasReact = html.includes('react') || html.includes('__NEXT_DATA__') || doc.querySelector('script[src*="react"]');

  if (bodyLength < 1000 || hasReact) {  // Tune thresholds as needed
    // Fallback to full rendering for accuracy
    endpoint = '/render?url=';
    resp = await fetch(`https://cors-proxy.traffictorch.workers.dev${endpoint}${encodeURIComponent(url)}`);
    if (resp.ok) html = await resp.text();
  }

  return html;  // Full/clean DOM for your scoring/gaps/fixes modules
}

// Usage in deep-dive/360° analysis
async function runAnalysis(targetUrl) {
  const html = await fetchRenderedHtml(targetUrl);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Your existing SEO/UX health score, competitive gaps, AI-generated fixes, predictive forecasting here...
  displayReport(calculateScore(doc), generateEducation(doc));
}