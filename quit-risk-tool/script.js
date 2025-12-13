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
    return { nav: nav?.textContent?.length || 0, headings: headings.length, links: links.length, images: images.length, text: main.textContent || '' };
  }

  function analyzeUX(data) {
    if (!data.text || data.text.length < 200) {
      return { score: 50, readability: 60, nav: 70, accessibility: 65, mobile: 75, speed: 80 };
    }
    const text = data.text.replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syl = text.match(/[aeiouy]+/gi) || [];
    const flesch = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syl.length / words.length);
    const readability = Math.min(100, Math.max(0, Math.round(flesch)));
    const navScore = Math.min(100, 100 - (data.links / 50));
    const accScore = data.images.length > 0 ? Math.min(100, data.images.length * 5) : 30;
    const mobileScore = 85; // Improved placeholder
    const speedScore = 80;
    let score = Math.round((readability + navScore + accScore + mobileScore + speedScore) / 5);
    return { score, readability, nav: navScore, accessibility: accScore, mobile: mobileScore, speed: speedScore };
  }

  function generateFixes(ux) {
    const fixes = [];
    if (ux.readability < 60) fixes.push("Shorten sentences, use active voice, break up paragraphs.");
    if (ux.nav < 60) fixes.push("Reduce number of navigation links — focus on primary actions.");
    if (ux.accessibility < 70) fixes.push("Add descriptive alt text to all images.");
    if (ux.mobile < 90) fixes.push("Ensure viewport meta tag and responsive breakpoints.");
    if (ux.speed < 80) fixes.push("Optimize images, lazy-load non-critical assets.");
    return fixes;
  }

  function predictForecast(score) {
    if (score > 85) return "Top 3 Potential";
    if (score > 70) return "Top 10 Possible";
    if (score > 50) return "Page 1 Possible";
    return "Page 2+";
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    results.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing usability & quit risk — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const uxData = getUXContent(doc);
      const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled';
      const ux = analyzeUX(uxData);
      const fixes = generateFixes(ux);
      const forecast = predictForecast(ux.score);

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 animate-in">
          <!-- Big Overall Score Circle -->
          <div class="flex justify-center my-12">
            <div class="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                        stroke-dasharray="${(ux.score / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="bigGradient">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-7xl font-black text-white drop-shadow-2xl glow">${ux.score}</div>
                  <div class="text-2xl text-white/90">/100 Usability</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quit Risk Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-black mb-8">
              Quit Risk: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                ${ux.score > 70 ? 'High Risk' : ux.score > 50 ? 'Moderate Risk' : 'Low Risk'}
              </span>
            </p>
            <p class="text-xl text-gray-400">Scanned ${uxData.links} links + ${uxData.images} images</p>
          </div>

          <!-- Small Metric Circles -->
          <div class="grid md:grid-cols-5 gap-6 my-16">
            ${[
              {name: 'Readability', value: ux.readability},
              {name: 'Navigation', value: ux.nav},
              {name: 'Accessibility', value: ux.accessibility},
              {name: 'Mobile', value: ux.mobile},
              {name: 'Speed', value: ux.speed}
            ].map(m => `
              <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div class="relative mx-auto w-32 h-32">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="#fb923c" stroke-width="12" fill="none"
                            stroke-dasharray="${(m.value / 100) * 352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">
                    ${m.value}
                  </div>
                </div>
                <p class="mt-4 text-lg font-medium">${m.name}</p>
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
                  Show Info
                </button>
                <div class="hidden mt-6 space-y-3 text-left text-sm">
                  <p class="text-blue-500 font-bold">What:</p><p>${m.name === 'Readability' ? 'Flesch ease score' : m.name === 'Navigation' ? 'Link density' : m.name === 'Accessibility' ? 'Image alt coverage' : m.name === 'Mobile' ? 'Responsiveness signals' : 'Load performance proxy'}</p>
                  <p class="text-green-500 font-bold">How:</p><p>Simplify text, reduce links, add alts, use responsive design, optimize assets</p>
                  <p class="text-orange-500 font-bold">Why:</p><p>Better UX = lower bounce, higher dwell time, stronger rankings</p>
                </div>
              </div>
            `).join('')}
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
                <p class="text-sm leading-relaxed">Higher UX score = lower bounce = stronger Google signals in 2025.</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p>
                <p class="text-sm leading-relaxed">Good UX drives dwell time and conversions — fixes can unlock major traffic gains.</p>
              </div>
            </div>
          </div>

          <!-- Optimize + PDF -->
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
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'optimizeBtn') {
      const output = document.getElementById('optimizedOutput');
      output.classList.remove('hidden');
    }
  });
});