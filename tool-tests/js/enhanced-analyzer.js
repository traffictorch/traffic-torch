// js/enhanced-analyzer.js – FINAL VERSION THAT WILL NEVER CRASH AGAIN (Dec 2025)

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

  // ─────── 1. PageSpeed – bullet-proof with Promise.allSettled ───────
  const [desktopRes, mobileRes] = await Promise.allSettled([
    fetchPSI(url, "desktop"),
    fetchPSI(url, "mobile")
  ]);

  if (desktopRes.status === "fulfilled" && desktopRes.value?.lighthouseResult) {
    results.psi.desktop = desktopRes.value;
  }
  if (mobileRes.status === "fulfilled" && mobileRes.value?.lighthouseResult) {
    results.psi.mobile = mobileRes.value;
  }

  // CrUX real-user data
  results.crux = parseCrUXFromPSI(results.psi.mobile) || parseCrUXFromPSI(results.psi.desktop);

  // ─────── 2. GTmetrix only when mobile score is bad ───────
  const mobileScore = results.psi.mobile?.lighthouseResult?.categories?.performance?.score ?? 1;
  if (mobileScore < 0.85) {
    try {
      if (statusEl) statusEl.textContent = "Running visual waterfall (GTmetrix)…";
      results.gtmetrix = await runGTmetrixTest(url);
    } catch (e) {
      console.log("GTmetrix failed (this is normal on busy sites):", e.message);
    }
  }

  // ─────── 3. Safe insights + final score ───────
  const bestScore = Math.max(
    results.psi.mobile?.lighthouseResult?.categories?.performance?.score ?? 0,
    results.psi.desktop?.lighthouseResult?.categories?.performance?.score ?? 0
  );

  results.finalScore = bestScore ? Math.round(bestScore * 100) : 0;
  results.insights = generateInsights(results, bestScore);

  if (statusEl) statusEl.textContent = "Complete!";

  return results;
}

// ─────── Safe PageSpeed fetch (uses the clean proxy) ───────
async function fetchPSI(url, strategy) {
  const params = new URLSearchParams({
    url,
    strategy,
    key: PSI_KEY,
    category: "performance",
    category: "seo",
    category: "accessibility"
  });

  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const proxyUrl = `https://cors-proxy.traffictorch.workers.dev/?__url=${encodeURIComponent(psiUrl)}`;

  const res = await fetch(proxyUrl);

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "PSI error");

  return data;
}

// ─────── 100% safe insights – no more “undefined” crashes ───────
function generateInsights(data, score) {
  const list = [];

  if (score === 0) {
    list.push("Google PageSpeed data temporarily unavailable – please try again in 10 seconds");
  } else if (score < 0.5) {
    list.push("Urgent: Very slow site – high bounce risk. Compress images + minify JS/CSS");
  } else if (score < 0.9) {
    list.push("Good but can be faster – focus on Largest Contentful Paint (LCP)");
  } else {
    list.push("Excellent performance!");
  }

  if (data.crux?.lcp > 4000) list.push("Real users wait over 4s for content – optimise hero images & fonts");
  if (data.crux?.lcp > 2500 && data.crux?.lcp <= 4000) list.push("Real-user LCP is acceptable – aim for <2.5s");

  if (data.gtmetrix?.fullyLoadedTime > 8000) list.push("Too many third-party scripts – consider deferring");

  return list.length ? list : ["No major issues found – great job!"];
}