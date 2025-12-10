// js/enhanced-analyzer.js – FINAL CLEAN VERSION (Dec 2025)
// Works perfectly with the new CORS proxy + GTmetrix + CrUX

import { runGTmetrixTest } from './apis/gtmetrix.js';
import { parseCrUXFromPSI } from './apis/crux-parser.js';

const PSI_KEY = "AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs";

export async function runFullAnalysis(url) {
  const results = {
    url,
    psi: null,
    crux: null,
    gtmetrix: null,
    finalScore: 0,
    insights: []
  };

  const statusEl = document.getElementById("status");

  // 1. PageSpeed Insights – desktop + mobile (safe with fallback)
  let desktop = null;
  let mobile = null;

  try {
    if (statusEl) statusEl.textContent = "Fetching Google PageSpeed data…";

    [desktop, mobile] = await Promise.all([
      fetchPSI(url, "desktop"),
      fetchPSI(url, "mobile")
    ]);

    results.psi = { desktop, mobile };

    // 2. Real-user CrUX data (from mobile first, then desktop)
    results.crux = parseCrUXFromPSI(mobile) || parseCrUXFromPSI(desktop);

  } catch (e) {
    console.warn("PageSpeed temporarily unavailable:", e.message);
    results.insights.push("Google PageSpeed is taking a break — scores will appear if you retry in a few seconds");
  }

  // 3. GTmetrix visual waterfall – only if mobile performance is poor
  if (mobile?.lighthouseResult?.categories?.performance?.score * 100 < 85) {
    try {
      if (statusEl) statusEl.textContent = "Running visual waterfall test (GTmetrix)…";

      results.gtmetrix = await runGTmetrixTest(url);

      if (statusEl) statusEl.textContent = "Visual test complete!";
    } catch (e) {
      console.log("GTmetrix skipped or failed:", e.message);
      results.insights.push("Deep visual test skipped (site may be too slow or rate-limited)");
    }
  }

  // 4. Generate educational insights
  results.insights.push(...generateInsights(results));

  // Optional: calculate a simple final score
  const perfScore = mobile?.lighthouseResult?.categories?.performance?.score || desktop?.lighthouseResult?.categories?.performance?.score || 0;
  results.finalScore = Math.round(perfScore * 100);

  if (statusEl) statusEl.textContent = "Analysis complete!";

  return results;
}

// ——————————————————————————————————————————————————
// Safe PageSpeed fetch using the clean CORS proxy
async function fetchPSI(url, strategy) {
  const params = new URLSearchParams({
    url: url,
    strategy: strategy,
    key: PSI_KEY,
    category: "performance",
    category: "seo",
    category: "accessibility"
  });

  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

  // Use the safe __url parameter so the proxy never breaks on long URLs
  const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?__url=${encodeURIComponent(psiUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`PageSpeed request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ——————————————————————————————————————————————————
// Generate helpful, educational insights
function generateInsights(data) {
  const insights = [];

  const mobilePerf = data.psi?.mobile?.lighthouseResult?.categories?.performance?.score || 0;
  const desktopPerf = data.psi?.desktop?.lighthouseResult?.categories?.performance?.score || 0;
  const perf = mobilePerf || desktopPerf;

  if (perf < 0.5) {
    insights.push("Urgent: Very slow site — high bounce risk. Compress images & minify JS/CSS.");
  } else if (perf < 0.5 && perf < 0.9) {
    insights.push("Average speed — room to improve. Focus on Largest Contentful Paint (LCP).");
  }

  if (data.crux?.lcp > 4000) {
    insights.push("Real users experience slow load (LCP > 4s) — optimize hero images & fonts");
  }
  if (data.crux?.lcp > 2500 && data.crux?.lcp <= 4000) {
    insights.push("Real-user LCP is okay but can be faster — aim for under 2.5s");
  }

  if (data.gtmetrix?.fullyLoadedTime > 8000) {
    insights.push("Waterfall shows long tail — too many third-party scripts or large assets");
  }

  if (insights.length === 0) {
    insights.push("Looking excellent! Keep up the great work");
  }

  return insights;
}