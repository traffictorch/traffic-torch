document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageInput = document.getElementById('page-url');
  const phraseInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = pageInput.value.trim();
    const phrase = phraseInput.value.trim().toLowerCase();
    if (!url || !phrase) return;

    results.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing keyword optimization — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent || '';
      const metaDesc = doc.querySelector('meta[name="description"]')?.content || '';
      const h1 = doc.querySelector('h1')?.textContent || '';
      const content = doc.body?.textContent || '';
      const words = content.toLowerCase().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const matches = (content.toLowerCase().match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const density = wordCount ? (matches / wordCount * 100).toFixed(1) : 0;
      const images = [...doc.querySelectorAll('img')];
      const goodAlts = images.filter(img => img.alt?.toLowerCase().includes(phrase)).length;
      const altPercent = images.length ? Math.round(goodAlts / images.length * 100) : 0;
      const internalLinks = [...doc.querySelectorAll('a[href^="/"], a[href^="' + new URL(url).origin + '"]')];
      const goodAnchors = internalLinks.filter(a => a.textContent?.toLowerCase().includes(phrase)).length;
      const anchorPercent = internalLinks.length ? Math.round(goodAnchors / internalLinks.length * 100) : 0;

      let score = 0;
      if (title.toLowerCase().includes(phrase)) score += title.length >= 50 && title.length <= 60 ? 25 : 15;
      if (metaDesc.toLowerCase().includes(phrase)) score += metaDesc.length >= 150 && metaDesc.length <= 160 ? 17 : 10;
      if (h1.toLowerCase().includes(phrase)) score += 15;
      if (wordCount >= 800) score += 10;
      if (density >= 1 && density <= 2.5) score += 10;
      if (words.slice(0,100).join(' ').includes(phrase)) score += 8;
      if (altPercent >= 50) score += 10;
      if (anchorPercent >= 30) score += 10;
      if (new URL(url).pathname.toLowerCase().includes(phrase.replace(/ /g,'-'))) score += 10;
      if (doc.querySelector('script[type="application/ld+json"]')) score += 10;
      if (wordCount >= 1200) score += 10;
      score = Math.min(100, Math.round(score));

      const forecast = score >= 95 ? 'Top 3 Domination' : score >= 85 ? 'Top 10 Locked' : score >= 70 ? 'Page 1 Possible' : 'Needs Work';

      const fixes = [];
      if (!title.toLowerCase().includes(phrase)) fixes.push("Add target keyword to title (ideally 50–60 chars).");
      if (!metaDesc.toLowerCase().includes(phrase)) fixes.push("Include keyword in meta description (150–160 chars).");
      if (!h1.toLowerCase().includes(phrase)) fixes.push("Use keyword in main H1.");
      if (density < 1 || density > 2.5) fixes.push("Aim for 1–2.5% keyword density.");
      if (altPercent < 50) fixes.push("Add keyword to alt text of key images.");
      if (anchorPercent < 30) fixes.push("Use keyword in internal link anchor text.");

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 animate-in">
          <!-- Big Overall Score Circle -->
          <div class="flex justify-center my-12">
            <div class="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                        stroke-dasharray="${(score / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="bigGradient">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-7xl font-black text-white drop-shadow-2xl glow">${score}</div>
                  <div class="text-2xl text-white/90">/100 Keyword Score</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-black mb-8">
              Optimization: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                ${forecast}
              </span>
            </p>
            <p class="text-xl text-gray-400">Target phrase: "${phraseInput.value}"</p>
          </div>

          <!-- Small Metric Circles -->
          <div class="grid md:grid-cols-6 gap-6 my-16">
            ${[
              {name: 'Title', value: title.toLowerCase().includes(phrase) ? 100 : 0},
              {name: 'Description', value: metaDesc.toLowerCase().includes(phrase) ? 100 : 0},
              {name: 'H1', value: h1.toLowerCase().includes(phrase) ? 100 : 0},
              {name: 'Density', value: Math.round(density * 10)},
              {name: 'Alt Text', value: altPercent},
              {name: 'Anchors', value: anchorPercent}
            ].map(m => `
              <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div class="relative mx-auto w-32 h-32">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="#fb923c" stroke-width="12" fill="none"
                            stroke-dasharray="${(m.value / 100) * 352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">
                    ${m.value}%
                  </div>
                </div>
                <p class="mt-4 text-lg font-medium">${m.name}</p>
              </div>
            `).join('')}
          </div>

          <!-- Prioritized Fixes -->
          <div class="space-y-8">
            <h3 class="text-4xl font-black text-center mb-8">Prioritized Keyword Fixes</h3>
            ${fixes.length ? fixes.map(fix => `
              <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
                <div class="flex gap-6">
                  <div class="text-5xl">🔧</div>
                  <div class="text-lg leading-relaxed">${fix}</div>
                </div>
              </div>
            `).join('') : '<p class="text-center text-green-400 text-2xl">Perfect on-page optimization!</p>'}
          </div>

          <!-- Predictive Rank Forecast -->
          <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
            <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
            <p class="text-center text-7xl font-black">${forecast}</p>
            <p class="text-center text-4xl font-bold">With current optimization</p>
            <div class="grid md:grid-cols-3 gap-6 text-left">
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-blue-300 text-xl mb-2">What it is</p>
                <p class="text-sm leading-relaxed">Estimate of SERP potential for "${phraseInput.value}".</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-green-300 text-xl mb-2">How calculated</p>
                <p class="text-sm leading-relaxed">On-page factors: title, meta, H1, density, alts, anchors, depth.</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p>
                <p class="text-sm leading-relaxed">Perfect on-page = strong foundation for ranking in 2025.</p>
              </div>
            </div>
          </div>

          <!-- PDF -->
          <div class="text-center my-16">
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
});