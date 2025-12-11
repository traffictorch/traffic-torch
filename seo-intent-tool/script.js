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
<<<<<<< HEAD
  <div class="max-w-5xl mx-auto space-y-12">

    <!-- Intent Section -->
=======
  <div class="max-w-4xl mx-auto space-y-12">

    <!-- Big Main Score Circle (red-green gradient match to seo-ux-tool) -->
    <div class="flex justify-center my-12">
      <div class="relative">
        <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
          <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
          <circle cx="130" cy="130" r="120" stroke="url(#mainGradient)" stroke-width="18" fill="none"
                  stroke-dasharray="${(overall / 100) * 754} 754"
                  stroke-linecap="round"/>
          <defs>
            <linearGradient id="mainGradient">
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

    <!-- Intent + Detailed What/How/Why -->
>>>>>>> d430b574e0c12bbcb75399ffbf7d44ac47fde888
    <div class="text-center mb-12">
      <p class="text-3xl font-bold mb-6">
        Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
        <span class="text-gray-500">(${confidence}% match)</span>
      </p>
<<<<<<< HEAD
      <div class="max-w-2xl mx-auto space-y-4 p-6 bg-white/10 dark:bg-gray-900/50 rounded-2xl border border-gray-200/20">
=======
      <div class="max-w-2xl mx-auto space-y-4 p-6 bg-gradient-to-r from-blue-500/10 rounded-2xl border border-blue-400/30">
>>>>>>> d430b574e0c12bbcb75399ffbf7d44ac47fde888
        <p><strong>What:</strong> ${intent === 'Informational' ? 'Content that educates or answers questions.' :
          intent === 'Commercial' ? 'Research-focused content for buyers.' :
          intent === 'Local' ? 'Location-specific content.' :
          'Conversion-focused content.'}</p>
        <p><strong>How:</strong> ${intent === 'Informational' ? 'Use headings, lists, images, and FAQs for clarity.' :
          intent === 'Commercial' ? 'Include comparisons, reviews, pros/cons, and pricing.' :
          intent === 'Local' ? 'Add maps, hours, reviews, and contact info.' :
          'Clear CTAs, trust seals, and easy navigation.'}</p>
        <p><strong>Why:</strong> ${intent === 'Informational' ? 'Matches user learning needs, reduces bounce rates.' :
          intent === 'Commercial' ? 'Builds trust during research phase, boosts conversions.' :
          intent === 'Local' ? 'Improves local SEO and Google Maps visibility.' :
          'Drives direct actions like purchases, increasing revenue.'}</p>
      </div>
    </div>

<<<<<<< HEAD
    <!-- E-E-A-T Metrics Side by Side (exact seo-ux-tool match) -->
    <div class="grid md:grid-cols-4 gap-6 my-16">
      ${Object.entries(eeat).map(([key, val], index) => {
        const colors = val >= 80 ? 'text-green-500 border-green-500' : val >= 60 ? 'text-yellow-500 border-yellow-500' : 'text-red-500 border-red-500';
        const dash = (val / 100) * 377;
        return `
          <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border ${colors}">
            <div class="relative mx-auto w-32 h-32">
              <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                <circle cx="64" cy="64" r="56" stroke="${val >= 80 ? '#22c55e' : val >= 60 ? '#eab308' : '#ef4444'}"
                        stroke-width="12" fill="none" stroke-dasharray="${dash} 352" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">${val}</div>
            </div>
            <p class="mt-4 text-lg font-medium">${key}</p>
            <button onclick="document.getElementById('fixes-${index}').classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600">
              Show Fixes
            </button>
            <div id="fixes-${index}" class="hidden mt-6 space-y-4 text-left">
=======
    <!-- E-E-A-T with Circles + Individual What/How/Why -->
    <div class="space-y-12">
      ${Object.entries(eeat).map(([key, val]) => {
        const gradient = val >= 80 ? ['#22c55e', '#16a34a'] : val >= 60 ? ['#eab308', '#ca8a04'] : ['#ef4444', '#dc2626'];
        const dash = (val / 100) * 377;
        return `
          <div class="grid md:grid-cols-2 gap-8 items-center p-8 bg-white/5 rounded-2xl border border-gray-200/20">
            <!-- Circle -->
            <div class="flex justify-center">
              <div class="relative">
                <svg width="180" height="180" viewBox="0 0 180 180" class="transform -rotate-90">
                  <circle cx="90" cy="90" r="80" stroke="#e5e7eb" stroke-width="14" fill="none"/>
                  <circle cx="90" cy="90" r="80" stroke="url(#${key}Gradient)" stroke-width="14" fill="none"
                          stroke-dasharray="${dash} 503" stroke-linecap="round"/>
                  <defs>
                    <linearGradient id="${key}Gradient">
                      <stop offset="0%" stop-color="${gradient[0]}"/>
                      <stop offset="100%" stop-color="${gradient[1]}"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-5xl font-black">${val}</span>
                </div>
              </div>
            </div>

            <!-- What/How/Why -->
            <div class="space-y-4">
              <h4 class="text-2xl font-bold">${key}</h4>
>>>>>>> d430b574e0c12bbcb75399ffbf7d44ac47fde888
              <p><strong>What:</strong> ${key === 'Experience' ? 'First-hand knowledge shown in content.' :
                key === 'Expertise' ? 'Demonstrated skill or knowledge.' :
                key === 'Authoritativeness' ? 'Recognized as a go-to source.' :
                'Reliability and honesty of the site.'}</p>
              <p><strong>How:</strong> ${key === 'Experience' ? 'Use "I/we" stories, case studies, photos.' :
                key === 'Expertise' ? 'Add author bios, credentials, citations.' :
                key === 'Authoritativeness' ? 'Earn backlinks, use schema, show awards.' :
                'HTTPS, privacy policy, contact info, no errors.'}</p>
              <p><strong>Why:</strong> ${key === 'Experience' ? 'Builds reader connection, ranks higher in YMYL.' :
                key === 'Expertise' ? 'Google favors experts, reduces E-A-T flags.' :
                key === 'Authoritativeness' ? 'Boosts domain authority, better SERP positions.' :
                'Increases user trust, lowers bounce rates.'}</p>
            </div>
          </div>`;
      }).join('')}
    </div>

<<<<<<< HEAD
    <!-- Rank Forecast with Show Details Toggle (exact match) -->
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-3xl font-medium opacity-80">Current Ranking Potential</p>
      <p class="text-7xl font-black mt-4">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-6">Implement fixes → <strong>+${Math.round((100-overall)*1.5)}% traffic</strong></p>
      <button onclick="document.getElementById('forecast-details').classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-white/20 rounded-full hover:bg-white/30 text-lg font-medium">
        Show Details
      </button>
      <div id="forecast-details" class="hidden mt-8 space-y-4 text-left max-w-xl mx-auto">
        <p><strong>What:</strong> Estimated SERP position based on E-E-A-T and content strength.</p>
        <p><strong>How:</strong> Apply fixes above, monitor with Google Search Console, resubmit URL.</p>
        <p><strong>Why:</strong> Strong E-E-A-T leads to higher rankings, more clicks, and traffic growth.</p>
      </div>
=======
    <!-- Rank Forecast -->
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-4xl font-black">Current Ranking Potential</p>
      <p class="text-7xl font-black mt-6">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : 'Page 1 Possible'}</p>
      <p class="text-3xl mt-8">Implement fixes → <strong>+${Math.round((100-overall)*1.5)}% traffic</strong></p>
>>>>>>> d430b574e0c12bbcb75399ffbf7d44ac47fde888
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