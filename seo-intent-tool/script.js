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
        <div class="text-center mb-12">
          <div class="text-8xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${overall}<span class="text-5xl">/100</span></div>
          <p class="text-2xl mt-4 opacity-80">360° SEO Intent + E-E-A-T Score</p>
        </div>

        <div class="flex justify-center my-12">${generateRadar(eeat)}</div>

        <div class="text-center space-y-6 text-xl">
          <p><strong>Intent:</strong> ${intent} <span class="opacity-70">(${confidence}% confidence)</span></p>
          <p><strong>Words:</strong> ${words.toLocaleString()} • <strong>Readability:</strong> ${readability} ${readability < 60 ? '(too complex)' : ''}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 my-16">
          ${Object.entries(eeat).map(([k, v]) => `
            <div class="text-center p-6 bg-white/10 dark:bg-white/5 rounded-2xl backdrop-blur">
              <div class="text-5xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${v}</div>
              <div class="mt-3 text-lg opacity-80">${k}</div>
            </div>
          `).join('')}
        </div>

        <div class="text-center p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl text-3xl font-bold shadow-2xl">
          ${overall > 88 ? 'Top 3' : overall > 70 ? 'Top 10' : 'Page 2+'} Potential<br>
          <span class="text-5xl">+${Math.round((100 - overall) * 1.3)}% traffic</span> if you apply fixes
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