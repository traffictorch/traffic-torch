// js/enhanced-analyzer.js – BULLETPROOF VERSION WITH DEBUG & RATE LIMIT FIX (Dec 2025)

import { runGTmetrixTest } from './apis/gtmetrix.js';
import { parseCrUXFromPSI } from './apis/crux-parser.js';

const PSI_KEY = "AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs";

export async function runFullAnalysis(url) {
  const results = {
    url,
    psi: { desktop: null, mobile: null },
    crux: null,
    gtmetrix: null,
    finalScore: 0,
    insights: []
  };

  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = "Fetching Google PageSpeed data…";

  // ─────── 1. PageSpeed – sequential calls to avoid rate limits + debug ───────
  try {
    // First desktop (usually faster, less rate-limited)
    results.psi.desktop = await fetchPSI(url, "desktop");
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay to avoid rate limit

    // Then mobile
    results.psi.mobile = await fetchPSI(url, "mobile");
  } catch (e) {
    console.error("PSI full error:", e); // Debug: Check console for exact issue
    results.insights.push(`API Error: ${e.message} – Try a different URL or wait 1 min`);
  }

  // Fallback: If mobile failed, use desktop for everything
  if (!results.psi.mobile && results.psi.desktop) {
    results.psi.mobile = results.psi.desktop;
    results.insights.push("Mobile test failed – using desktop data as fallback");
  }

  // CrUX from available data
  results.crux = parseCrUXFromPSI(results.psi.mobile) || parseCrUXFromPSI(results.psi.desktop);

  // ─────── 2. GTmetrix if score <85 ───────
  const mobileScore = results.psi.mobile?.lighthouseResult?.categories?.performance?.score ?? 1;
  if (mobileScore < 0.85) {
    try {
      if (statusEl) statusEl.textContent = "Running visual waterfall (GTmetrix)…";
      results.gtmetrix = await runGTmetrixTest(url);
    } catch (e) {
      console.log("GTmetrix failed:", e.message);
    }
  }

  // ─────── 3. Safe score & insights ───────
  const bestScore = Math.max(
    results.psi.mobile?.lighthouseResult?.categories?.performance?.score ?? 0,
    results.psi.desktop?.lighthouseResult?.categories?.performance?.score ?? 0
  );
  results.finalScore = bestScore ? Math.round(bestScore * 100) : 0;
  results.insights = generateInsights(results, bestScore);

  if (statusEl) statusEl.textContent = "Complete!";

  return results;
}

// ─────── FIXED PageSpeed fetch (no captcha_token, added debug headers) ───────
async function fetchPSI(url, strategy) {
  const params = new URLSearchParams({
    url,
    strategy,
    key: PSI_KEY,
    category: "performance",
    category: "seo",
    category: "accessibility",
    locale: "en"  // Helps with regional rate limits
  });

  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?__url=${encodeURIComponent(psiUrl)}`;

  const res = await fetch(proxyUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
    }
  });

  console.log(`PSI ${strategy} status:`, res.status); // Debug: Check Network tab

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`PSI ${strategy} error body:`, errorText); // Debug: See exact Google error
    throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log(`PSI ${strategy} data keys:`, Object.keys(data)); // Debug: Confirm structure

  if (data.error) {
    console.error("PSI error object:", data.error); // Debug: Rate limit or key issue?
    throw new Error(`Google Error: ${data.error.message || 'Unknown'}`);
  }

  if (!data.lighthouseResult) {
    console.error("No lighthouseResult in PSI data"); // Debug: Incomplete response
    throw new Error("Incomplete PSI response – no Lighthouse data");
  }

  return data;
}

// ─────── Safe insights ───────
function generateInsights(data, score) {
  const list = [];

  if (score === 0) {
    list.push("No score data – check console for API error (likely rate limit). Wait 1 min and retry.");
  } else if (score < 0.5) {
    list.push("Urgent: Very slow – high bounce risk. Compress images + minify JS/CSS.");
  } else if (score < 0.9) {
    list.push("Good but faster is better – focus on LCP.");
  } else {
    list.push("Excellent performance!");
  }

  if (data.crux?.lcp > 4000) list.push("Real users wait >4s – optimize hero images.");
  if (data.gtmetrix?.fullyLoadedTime > 8000) list.push("Long load tail – defer third-party scripts.");

  return list.length ? list : ["Analysis complete – solid site!"];
}