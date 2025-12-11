document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();

    results.innerHTML = '<p class="text-center text-2xl py-20">Analyzing page…</p>';
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
  <div class="max-w-4xl mx-auto">

    <!-- Big Main Score Circle -->
    <div class="flex justify-center my-12">
      <div class="relative">
        <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
          <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
          <circle cx="130" cy="130" r="120" stroke="url(#mainGradient)" stroke-width="18" fill="none"
                  stroke-dasharray="${(overall / 100) * 754} 754"
                  stroke-linecap="round"/>
          <defs>
            <linearGradient id="mainGradient">
              <stop offset="0%" stop-color="#fb923c"/>
              <stop offset="100%" stop-color="#ec4899"/>
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

    <!-- Intent + Explanation -->
    <div class="text-center mb-12">
      <p class="text-3xl font-bold mb-4">
        Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
        <span class="text-gray-500">(${confidence}% match)</span>
      </p>
      <div class="max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-500/10 rounded-2xl border border-blue-400/30">
        ${intent === 'Informational' ? 'User wants to learn or understand something. Answer questions clearly with headings, lists, and examples.' :
          intent === 'Commercial' ? 'User is researching before buying. Compare options, show pros/cons, include reviews and pricing.' :
          intent === 'Transactional' ? 'User ready to buy or convert. Make CTAs obvious, show trust signals, simplify checkout.' :
          'User looking for a local business. Show address, phone, map, hours, and Google reviews.'}
      </div>
    </div>

    <!-- E-E-A-T with Individual Score Circles -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 my-16">
      ${Object.entries(eeat).map(([key, val]) => {
        const colors = {
          Experience: ['#10b981', '#059669'],
          Expertise: ['#3b82f6', '#2563eb'],
          Authoritativeness: ['#8b5cf6', '#7c3aed'],
          Trustworthiness: ['#f59e0b', '#d97706']
        };
        const [light, dark] = colors[key] || ['#6b7280', '#4b5563'];
        const dash = (val / 100) * 314;
        return `
          <div class="text-center">
            <div class="relative inline-block">
              <svg width="140" height="140" viewBox="0 0 140 140" class="transform -rotate-90">
                <circle cx="70" cy="70" r="60" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                <circle cx="70" cy="70" r="60" stroke="${val >= 80 ? light : val >= 60 ? '#f59e0b' : '#ef4444'}"
                        stroke-width="12" fill="none" stroke-dasharray="${dash} 314" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-3xl font-black">${val}</span>
              </div>
            </div>
            <p class="mt-4 text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">${key}</p>
          </div>`;
      }).join('')}
    </div>

    <!-- What / How / Why Fixes -->
    <div class="space-y-6 max-w-3xl mx-auto">
      ${!hasAuthor ? `
        <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">👤</div>
            <div>
              <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
              <p class="mt-3"><strong>How:</strong> Visible byline + headshot + credentials + link to author page</p>
              <p class="text-gray-600 mt-2"><strong>Why:</strong> Directly increases Expertise & Trust — Google loves it</p>
            </div>
          </div>
        </div>` : ''}

      ${words < 1500 ? `
        <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">✍️</div>
            <div>
              <h4 class="text-2xl font-bold text-orange-600">Add 1000+ Words of Depth</h4>
              <p class="mt-3"><strong>How:</strong> Add FAQs, examples, stats, images with alt text, comparisons</p>
              <p class="text-gray-600 mt-2"><strong>Why:</strong> #1 ranking factor in 2025 — depth wins</p>
            </div>
          </div>
        </div>` : ''}

      ${schemaTypes.length < 2 ? `
        <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">✨</div>
            <div>
              <h4 class="text-2xl font-bold text-purple-600">Add Article + Person Schema</h4>
              <p class="mt-3"><strong>How:</strong> JSON-LD with @type: Article + Person + author link</p>
              <p class="text-gray-600 mt-2"><strong>Why:</strong> Rich results + huge E-E-A-T boost</p>
            </div>
          </div>
        </div>` : ''}
    </div>

    <!-- Rank Forecast -->
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-4xl font-black">Current Ranking Potential</p>
      <p class="text-7xl font-black mt-6">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-8">Fix the above → <strong>+${Math.round((100-overall)*1.5)}% traffic gain</strong></p>
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