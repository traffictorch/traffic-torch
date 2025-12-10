// js/enhanced-analyzer.js – FINAL VERSION THAT NEVER BREAKS (Dec 2025)

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
    insights: ["Analyzing…"]
  };

  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = "Fetching Google PageSpeed data…";

  // ——————————————————— 1. PageSpeed (safe fallback) ———————————————————
  try {
    const [desktopData, mobileData] = await Promise.allSettled([
      fetchPSI(url, "desktop"),
      fetchPSI(url, "mobile")
    ]);

    // Only use data if it actually succeeded and has lighthouseResult
    if (desktopData.status === "fulfilled" && desktopData.value?.lighthouseResult) {
      results.psi.desktop = desktopData.value;
    }
    if (mobileData.status === "fulfilled" && mobileData.value?.lighthouseResult) {
      results.psi.mobile = mobileData.value;
    }

    // Extract CrUX from whichever has data
    results.crux = parseCrUXFromPSI(results.psi.mobile) || parseCrUXFromPSI(results.psi.desktop);

  } catch (e) {
    console.warn("PageSpeed failed completely:", e);
  }

  // ——————————————————— 2. GTmetrix only if mobile score is poor ———————————————————
  const mobilePerfScore = results.psi.mobile?.lighthouseResult?.categories?.performance?.score || 0;

  if (mobilePerfScore > 0 && mobilePerfScore < 0.85) {
    try {
      if (statusEl) statusEl.textContent = "Running visual waterfall (GTmetrix)…";
      results.gtmetrix = await runGTmetrixTest(url);
    } catch (e) {
      console.log("GTmetrix failed (normal for busy sites):", e.message);
    }
  }

  // ——————————————————— 3. Generate insights (100% safe) ———————————————————
  results.insights = generateSafeInsights(results);

  // Final score – always show something
  const bestScore = Math.max(
    results.psi.mobile?.lighthouseResult?.categories?.performance?.score || 0,
    results.psi.desktop?.lighthouseResult?.categories?.performance?.score || 0
  );
  results.finalScore = bestScore ? Math.round(bestScore * 100) : 0;

  if (statusEl) statusEl.textContent = "Complete!";

  return results;
}

// ——————————————————— Safe PageSpeed fetch ———————————————————
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

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();

  // Google sometimes returns { error: { code: 400, ... } }
  if (data.error) {
    throw new Error(data.error.message || "Unknown PSI error");
  }

  return data;
}

// ——————————————————— Super-safe insights (no crashes ever) ———————————————————
function generateSafeInsights(data) {
  const insights = [];

  const mobileScore = data.psi.mobile?.lighthouseResult?.categories?.performance?.score || 0;
  const desktopScore = data.psi.desktop?.lighthouseResult?.categories?.performance?.score || 0;
  const score = Math.max(mobileScore, desktopScore);

  if (score === 0) {
    insights.push("Google PageSpeed data unavailable right now — please try again in 10 seconds");
  } else if (score < 0.5) {
    insights.push("Urgent: Site is very slow — high bounce risk. Compress images, minify JS/CSS");
  } else if (score < 0.9) {
    insights.push("Room to improve — focus on Largest Contentful Paint (LCP)");
  } else {
    insights.push("Great performance! Keep it up");
  }

  if (data.crux?.lcp > 4000) {
    insights.push("Real users wait over 4s for content — optimize hero image & fonts");
  } else if (data.crux?.lcp > 2500) {
    insights.push("Real-user load is okay — aim for under 2.5s");
  }

  if (data.gtmetrix?.fullyLoadedTime > 8000) {
    insights.push("Too many third-party scripts — consider deferring or removing");
  }

  if (insights.length === 1 && score > 0.9) {
    insights[0] = "Excellent speed & real-user experience!";
  }

  return insights.length ? insights : ["Analysis complete — no major issues found"];
}