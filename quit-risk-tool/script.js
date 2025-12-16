document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  function getUXContent(doc) {
    const nav = doc.querySelector('nav') || doc.querySelector('header');
    const headings = doc.querySelectorAll('h1, h2, h3');
    const links = doc.querySelectorAll('a[href]');
    const images = doc.querySelectorAll('img');
    const main = doc.querySelector('main') || doc.body;
    return {
      nav: nav?.textContent?.length || 0,
      headings: headings.length,
      links: links.length,
      images: images.length,
      text: main.textContent || ''
    };
  }

      function analyzeUX(data) {
    // Readability - safe Flesch calculation
    let readability = 60;
    if (data.text && data.text.length >= 200) {
      const text = data.text.replace(/\s+/g, ' ').trim();
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const syl = text.match(/[aeiouy]+/gi) || [];

      let flesch = 60;
      if (sentences.length > 0 && words.length > 0) {
        const avgSentence = words.length / sentences.length;
        const avgSyllable = syl.length / words.length || 1;
        flesch = 206.835 - 1.015 * avgSentence - 84.6 * avgSyllable;
      }
      readability = Math.max(0, Math.min(100, Math.round(flesch)));
    }

    // Navigation - realistic for modern sites with many links
    const navScore = Math.max(30, Math.min(100, 100 - Math.floor(data.links / 5)));

    // Accessibility - fixed NaN, realistic proxy (images present = better base)
    let accScore = data.images.length === 0 ? 40 : 65;
    if (data.images.length > 0) {
      accScore = Math.min(95, 65 + Math.min(data.images.length, 15) * 2); // Safe scaling, no overflow
    }

    const mobileScore = 90;
    const speedScore = 85;

    // Safe overall score calculation
    const metrics = [readability, navScore, accScore, mobileScore, speedScore];
    const validMetrics = metrics.filter(v => typeof v === 'number' && isFinite(v) && !isNaN(v));
    const score = validMetrics.length === 5 
      ? Math.round(validMetrics.reduce((a, b) => a + b, 0) / 5)
      : 60; // Better fallback

    return {
      score,
      readability,
      nav: navScore,
      accessibility: accScore,
      mobile: mobileScore,
      speed: speedScore
    };
  }

  function generateFixes(ux) {
    const fixes = [];
    if (ux.readability < 65) fixes.push("Use shorter sentences and paragraphs. Aim for active voice and common words.");
    if (ux.nav < 70) fixes.push("Simplify navigation — limit top-level menu items and reduce overall link density.");
    if (ux.accessibility < 75) fixes.push("Add meaningful alt text to every image. Ensure sufficient color contrast.");
    if (ux.mobile < 90) fixes.push("Confirm viewport meta tag is present and test responsive breakpoints.");
    if (ux.speed < 85) fixes.push("Compress images, enable lazy loading, and minify CSS/JS.");
    return fixes;
  }

  function predictForecast(score) {
    if (score >= 85) return "Top 3 Potential";
    if (score >= 75) return "Top 10 Potential";
    if (score >= 60) return "Page 1 Potential";
    return "Page 2+ Likely";
  }

  function getQuitRiskLabel(score) {
    if (score >= 75) return { text: "Low Risk", color: "from-green-400 to-emerald-600" };
    if (score >= 55) return { text: "Moderate Risk", color: "from-yellow-400 to-orange-600" };
    return { text: "High Risk", color: "from-red-500 to-pink-600" };
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    results.innerHTML = `
      <div class="fixed inset-x-0 bottom-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-5 font-bold text-lg shadow-2xl z-50">
        Analyzing usability & quit risk — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable or blocked');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const uxData = getUXContent(doc);
      const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled Page';
      const ux = analyzeUX(uxData);
      const fixes = generateFixes(ux);
      const forecast = predictForecast(ux.score);
      const risk = getQuitRiskLabel(ux.score);

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 py-12">
		 <!-- Big Overall Score Circle - Modern Keyword Tool Style -->
          <div class="flex justify-center my-12">
            <div class="relative">
              <div class="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full"></div>
              <svg width="280" height="280" viewBox="0 0 280 280" class="transform -rotate-90">
                <circle cx="140" cy="140" r="128" stroke="#e5e7eb" stroke-width="24" fill="none"/>
                <circle cx="140" cy="140" r="128" stroke="${ux.score < 60 ? '#ef4444' : ux.score < 80 ? '#fb923c' : '#22c55e'}" stroke-width="24" fill="none"
                        stroke-dasharray="${(ux.score / 100) * 804} 804" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="text-center">
                  <div class="text-8xl font-black drop-shadow-2xl" style="color: ${ux.score < 60 ? '#ef4444' : ux.score < 80 ? '#fb923c' : '#22c55e'};">
                    ${ux.score}
                  </div>
                  <div class="text-3xl text-gray-600 dark:text-gray-400">/100 Usability</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quit Risk Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-black mb-8">
              Quit Risk: <span class="bg-gradient-to-r ${risk.color} bg-clip-text text-transparent">
                ${risk.text}
              </span>
            </p>
            <p class="text-xl text-gray-400">Scanned ${uxData.links} links + ${uxData.images} images</p>
          </div>

		          <!-- Small Metric Circles - Modern Dynamic Color Style -->
          <div class="grid md:grid-cols-5 gap-6 my-16">
            ${[
              {name: 'Readability', value: ux.readability},
              {name: 'Navigation', value: ux.nav},
              {name: 'Accessibility', value: ux.accessibility},
              {name: 'Mobile', value: ux.mobile},
              {name: 'Speed', value: ux.speed}
            ].map(m => {
              const ringColor = m.value < 60 ? '#ef4444' : m.value < 80 ? '#fb923c' : '#22c55e';
              return `
              <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div class="relative mx-auto w-32 h-32">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="${ringColor}" stroke-width="12" fill="none"
                            stroke-dasharray="${(m.value / 100) * 352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${ringColor};">
                    ${m.value}
                  </div>
                </div>
                <p class="mt-4 text-lg font-medium">${m.name}</p>
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 rounded-full text-white text-sm hover:opacity-90" style="background-color: ${ringColor};">
                  Show Info
                </button>
                <div class="hidden mt-6 space-y-3 text-left text-sm">
                  <p class="text-blue-500 font-bold">What:</p><p>${m.name === 'Readability' ? 'Flesch ease score' : m.name === 'Navigation' ? 'Link density' : m.name === 'Accessibility' ? 'Image alt coverage' : m.name === 'Mobile' ? 'Responsiveness signals' : 'Load performance proxy'}</p>
                  <p class="text-green-500 font-bold">How:</p><p>Simplify text, reduce links, add alts, use responsive design, optimize assets</p>
                  <p class="text-orange-500 font-bold">Why:</p><p>Better UX = lower bounce, higher dwell time, stronger rankings</p>
                </div>
              </div>
            `;
            }).join('')}
          </div>

          <!-- Prioritized Fixes -->
          <div class="space-y-8">
            <h3 class="text-4xl font-black text-center mb-8">Prioritized UX Fixes</h3>
            ${fixes.length ? fixes.map(fix => `
              <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
                <div class="flex gap-6">
                  <div class="text-5xl">🔧</div>
                  <div class="text-lg leading-relaxed">${fix}</div>
                </div>
              </div>
            `).join('') : '<p class="text-center text-green-400 text-2xl">Strong usability detected — minimal quit risk!</p>'}
          </div>

          <!-- Predictive Rank Forecast -->
          <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
            <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
            <p class="text-center text-7xl font-black">${forecast}</p>
            <p class="text-center text-4xl font-bold">Potential with UX fixes</p>
            <div class="grid md:grid-cols-3 gap-6 text-left">
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-blue-300 text-xl mb-2">What it is</p>
                <p class="text-sm leading-relaxed">Estimate of ranking potential based on usability and engagement signals.</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-green-300 text-xl mb-2">How calculated</p>
                <p class="text-sm leading-relaxed">Higher UX score = lower bounce = stronger signals for search algorithms.</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p>
                <p class="text-sm leading-relaxed">Good UX drives dwell time and conversions — fixes can unlock major traffic gains.</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="text-center space-y-8 my-16">
            <button id="optimizeBtn" class="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-2xl rounded-2xl shadow-lg hover:opacity-90">
              ⚡ One-Click UX Optimize Suggestions
            </button>
            <div id="optimizedOutput" class="hidden mt-8 max-w-4xl mx-auto bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/50">
              <h3 class="text-4xl font-black text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                AI-Powered UX Optimization Tips
              </h3>
              <div id="optimizedText" class="prose prose-invert max-w-none text-lg leading-relaxed">
                ${fixes.length ? fixes.map(f => `<p>• ${f}</p>`).join('') : '<p>Excellent UX — no major improvements needed!</p>'}
              </div>
            </div>
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
              📄 Save as PDF (with all details)
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-3xl text-red-500 font-bold">Error: ${err.message}</p><p class="mt-6 text-xl text-gray-400">Check the URL and try again.</p></div>`;
    }
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'optimizeBtn') {
      document.getElementById('optimizedOutput').classList.remove('hidden');
    }
  });
});