document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();

    results.innerHTML = `
  <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
    Analyzing page...
  </div>
`;
    results.classList.remove('hidden');

    try {
      // Correct proxy call — works perfectly with your Cloudflare worker
      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));

      if (!res.ok) throw new Error('Page not reachable – check URL');

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const text = doc.body?.textContent || '';
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = (text.match(/[.!?]+/g) || []).length || 1;
      const syllables = text.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const readability = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const schemaTypes = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
          schemaTypes.push(...types.filter(Boolean));
        } catch {}
      });

      const title = (doc.title || '').toLowerCase();
      let intent = 'Informational', confidence = 60;
      if (/buy|best|review|price|deal/.test(title)) { intent = 'Commercial'; confidence = 88; }
      else if (/how|what|guide|tutorial|step/.test(title)) { intent = 'Informational'; confidence = 92; }
      else if (/near me|location|store/.test(title)) { intent = 'Local'; confidence = 82; }

      const eeat = {
        Experience: (text.match(/\b(I|we|my|our|I've|we've)\b/gi) || []).length > 12 ? 92 : 45,
        Expertise: hasAuthor ? 90 : 32,
        Authoritativeness: schemaTypes.length > 0 ? 94 : 40,
        Trustworthiness: url.startsWith('https') ? 96 : 60
      };

      const eeatAvg = Math.round(Object.values(eeat).reduce((a,b) => a + b) / 4);
      const depthScore = words > 2000 ? 95 : words > 1200 ? 82 : words > 700 ? 65 : 35;
      const readScore = readability > 70 ? 90 : readability > 50 ? 75 : 45;
      const overall = Math.round((depthScore + readScore + eeatAvg + confidence + schemaTypes.length * 8) / 5);




      // ONE SINGLE SAFE RENDER — no more null errors ever
	results.innerHTML = `
  <div class="max-w-5xl mx-auto space-y-12">

    <!-- Big Main Score Circle
    <div class="flex justify-center my-12">
      <div class="relative">
        <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
          <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
          <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                  stroke-dasharray="${(overall / 100) * 754} 754" stroke-linecap="round"/>
          <defs>
            <linearGradient id="bigGradient">
              <stop offset="0%" stop-color="#ef4444"/>
              <stop offset="100%" stop-color="#22c55e"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-7xl font-black text-white drop-shadow-2xl">${overall}</div>
            <div class="text-2xl text-white/90 -mt-2">/100</div>
          </div>
        </div>
      </div>
    </div>

    Intent Section – now correct confidence + proper colours
    <div class="text-center mb-12">
      <p class="text-3xl font-bold mb-6">
        Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
        <span class="text-gray-500">(${confidence}% match)</span>
      </p>
      <div class="max-w-2xl mx-auto p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20">
        <p class="text-blue-500 font-bold text-xl">What it is?</p>
        <p class="mt-2">${intent === 'Informational' ? 'User wants to learn or understand something.' : intent === 'Commercial' ? 'User is researching before buying.' : intent === 'Local' ? 'User is looking for a local business.' : 'User is ready to buy or convert.'}</p>

        <p class="text-green-500 font-bold text-xl mt-6">How to Fix:</p>
        <p class="mt-2">${intent === 'Informational' ? 'Use clear headings, bullet lists, images, FAQs, step-by-steps.' : intent === 'Commercial' ? 'Add comparison tables, reviews, pricing, pros/cons.' : intent === 'Local' ? 'Show address, map, hours, phone, Google reviews.' : 'Add strong CTAs, trust badges, easy checkout.'}</p>

        <p class="text-orange-500 font-bold text-xl mt-6">Why it Matters?</p>
        <p class="mt-2">${intent === 'Informational' ? 'Matches searcher need → lower bounce, longer time-on-page.' : intent === 'Commercial' ? 'Builds trust → higher conversion rate.' : intent === 'Local' ? 'Improves local pack & map rankings.' : 'Directly drives sales/revenue.'}</p>
      </div>
    </div>

    4 E-E-A-T Cards – exact match to your other tools
    <div class="grid md:grid-cols-4 gap-6 my-16">
      ${Object.entries(eeat).map(([key, val], i) => `
        <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border ${val >= 80 ? 'border-green-500' : val >= 60 ? 'border-yellow-500' : 'border-red-500'}">
          <div class="relative mx-auto w-32 h-32">
            <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
              <circle cx="64" cy="64" r="56" stroke="${val >= 80 ? '#22c55e' : val >= 60 ? '#eab308' : '#ef4444'}"
                      stroke-width="12" fill="none" stroke-dasharray="${(val/100)*352} 352" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">${val}</div>
          </div>
          <p class="mt-4 text-lg font-medium">${key}</p>
          <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
            Show Fixes
          </button>
          <div class="hidden mt-6 space-y-3 text-left text-sm">
            <p class="text-blue-500 font-bold">What it is?</p>
            <p>${key === 'Experience' ? 'First-hand knowledge shown.' : key === 'Expertise' ? 'Proven skill/knowledge.' : key === 'Authoritativeness' ? 'Recognized authority.' : 'Site reliability.'}</p>
            <p class="text-green-500 font-bold mt-4">How to Fix:</p>
            <p>${key === 'Experience' ? '"I/we" stories, photos, case studies.' : key === 'Expertise' ? 'Author bio + credentials.' : key === 'Authoritativeness' ? 'Backlinks, schema, awards.' : 'HTTPS, contact page, privacy policy.'}</p>
            <p class="text-orange-500 font-bold mt-4">Why it Matters?</p>
            <p>${key === 'Experience' ? 'Builds connection, ranks higher in YMYL.' : key === 'Expertise' ? 'Google favors experts.' : key === 'Authoritativeness' ? 'Higher domain authority.' : 'Increases trust, lowers bounce.'}</p>
          </div>
        </div>
      `).join('')}
    </div>

    Rank Forecast
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-3xl font-medium opacity-80">Current Ranking Potential</p>
      <p class="text-7xl font-black mt-4">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-6">Implement fixes → <strong>+${Math.round((100-overall)*1.5)}% traffic</strong></p>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-white/20 rounded-full hover:bg-white/30 text-lg">
        Show Details
      </button>
      <div class="hidden mt-8 space-y-4 text-left max-w-xl mx-auto text-lg">
        <p class="text-blue-400 font-bold">What:</p><p>Estimated SERP position based on E-E-A-T + depth</p>
        <p class="text-green-400 font-bold mt-4">How:</p><p>Apply fixes → monitor GSC → resubmit URL</p>
        <p class="text-orange-400 font-bold mt-4">Why:</p><p>Strong E-E-A-T = higher rankings = more traffic</p>
      </div>
    </div>

  </div>
`;




    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });

  function generateRadar(data) {
    const size = 380, c = size / 2;
    let points = '';
    const labels = ['Experience', 'Expertise', 'Authoritativeness', 'Trustworthiness'];
    labels.forEach((label, i) => {
      const val = data[label] / 100;
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const x = c + val * (c - 60) * Math.cos(angle);
      const y = c + val * (c - 60) * Math.sin(angle);
      points += `${x},${y} `;
    });
    return `<svg viewBox="0 0 ${size} ${size}" class="drop-shadow-2xl">
      <polygon points="${points}" fill="#f9731660" stroke="#f97316" stroke-width="5"/>
      <circle cx="${c}" cy="${c}" r="${c-60}" fill="none" stroke="#fff3" stroke-dasharray="8"/>
    </svg>`;
  }
});