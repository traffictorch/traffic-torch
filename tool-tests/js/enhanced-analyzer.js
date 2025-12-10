// js/enhanced-analyzer.js
import { runGTmetrixTest } from './apis/gtmetrix.js';
import { parseCrUXFromPSI } from './apis/crux-parser.js';

const PSI_KEY = "AIzaSyB1qaV1POBJnvFlekjZ0hMNbncW9EZVyPs";

export async function runFullAnalysis(url, keyword = "") {
  const results = {
    url,
    psi: null,
    crux: null,
    gtmetrix: null,
    finalScore: 0,
    insights: []
  };

  // 1. PageSpeed (desktop + mobile)
  const [desktop, mobile] = await Promise.all([
    fetchPSI(url, "desktop"),
    fetchPSI(url, "mobile")
  ]);
  results.psi = { desktop, mobile };

  // 2. CrUX real-user data
  results.crux = parseCrUXFromPSI(mobile) || parseCrUXFromPSI(desktop);

  // 3. GTmetrix – only if PSI mobile < 85
  if (mobile?.lighthouseResult?.categories?.performance?.score < 0.85) {
    try {
      const statusEl = document.getElementById("status");
		if (statusEl) statusEl.textContent = "";  // Clear status when done
      results.gtmetrix = await runGTmetrixTest(url);
    } catch (e) {
      console.log("GTmetrix skipped:", e.message);
    }
  }


  // Final insights
  results.insights = generateInsights(results);
  return results;
}

async function fetchPSI(url, strategy) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${PSI_KEY}&category=performance&category=seo&category=accessibility`;
  const res = await fetch(`https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(apiUrl)}`);
  return await res.json();
}

function generateInsights(data) {
  const list = [];
  const perf = data.psi.mobile?.lighthouseResult?.categories?.performance?.score || 0;

  if (perf < 0.5) list.push("Urgent: Very slow – high bounce risk");
  if (data.crux?.lcp > 4000) list.push("Real users see slow load (LCP >4s)");
  if (data.gtmetrix?.fullyLoadedTime > 8000) list.push("Waterfall shows long tail – optimize images/JS");

  return list.length ? list : ["Looking good overall!"];
}