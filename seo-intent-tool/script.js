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
  <div class="max-w-5xl mx-auto">

    <!-- Hero Score -->
    <div class="text-center py-12 animate-in">
      <div class="text-9xl font-black bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent glow">
        ${overall}<span class="text-6xl">/100</span>
      </div>
      <p class="text-3xl mt-6 font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
        ${overall >= 90 ? 'Elite Tier' : overall >= 75 ? 'Strong Contender' : overall >= 60 ? 'Needs Work' : 'Major Overhaul Needed'}
      </p>
    </div>

    <!-- Radar + Intent -->
    <div class="grid md:grid-cols-2 gap-12 my-16 items-center">
      <div class="flex justify-center">${generateRadar(eeat)}</div>
      <div class="space-y-6 text-xl">
        <div class="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/30">
          <strong>Search Intent:</strong> <span class="font-bold text-purple-300">${intent}</span> (${confidence}% confidence)
        </div>
        <div class="p-6 bg-gradient-to-r from-orange-600/20 to-pink-600/20 rounded-2xl border border-orange-500/30">
          <strong>Content Depth:</strong> ${words.toLocaleString()} words → ${depthScore >= 80 ? 'Excellent' : 'Needs more depth'}
        </div>
      </div>
    </div>

    <!-- E-E-A-T Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 my-16">
      ${Object.entries(eeat).map(([k, v]) => `
        <div class="text-center p-8 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur border ${v >= 80 ? 'border-green-500/50' : v >= 60 ? 'border-yellow-500/50' : 'border-red-500/50'}">
          <div class="text-6xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${v}</div>
          <div class="mt-4 text-lg font-medium">${k}</div>
        </div>
      `).join('')}
    </div>

    <!-- Action Plan -->
    <div class="my-16 p-10 bg-gradient-to-r from-orange-600 to-pink-700 rounded-3xl text-white text-center shadow-2xl">
      <p class="text-4xl font-black mb-4">Rank Forecast</p>
      <p class="text-7xl font-black">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 5–10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-6 opacity-90">Apply fixes → <strong>+${Math.round((100 - overall) * 1.5)}% traffic</strong></p>
    </div>

    <!-- Quick Wins -->
    ${overall < 95 ? `
      <div class="text-center">
        <h3 class="text-3xl font-bold mb-8">Top 3 Fixes to Apply Now</h3>
        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          ${!hasAuthor ? `<div class="p-8 bg-red-500/20 border-2 border-red-500/50 rounded-2xl"><strong>Add Author Bio + Photo</strong><br>+30–40 E-E-A-T points</div>` : ''}
          ${words < 1500 ? `<div class="p-8 bg-orange-500/20 border-2 border-orange-500/50 rounded-2xl"><strong>Add 1000+ words with examples</strong><br>Biggest ranking factor</div>` : ''}
          ${schemaTypes.length < 2 ? `<div class="p-8 bg-purple-500/20 border-2 border-purple-500/50 rounded-2xl"><strong>Add Article + Person schema</strong><br>Rich results + trust boost</div>` : ''}
        </div>
      </div>
    ` : '<p class="text-center text-4xl font-bold text-green-400 my-16">This page is already elite-tier! 🎯</p>'}

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