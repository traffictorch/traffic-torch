document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();

    // Show sexy bottom loading bar
    results.innerHTML = `
      <div id="loading-bar" class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing page — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    try {
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
      let intent = 'Informational';
      let confidence = 60;
      if (/buy|best|review|price|deal|shop/.test(title)) { intent = 'Commercial'; confidence = 88; }
      else if (/how|what|guide|tutorial|step|learn/.test(title)) { intent = 'Informational'; confidence = 92; }
      else if (/near me|location|store|local|city/.test(title)) { intent = 'Local'; confidence = 82; }
      else if (/sign ?up|login|buy now|purchase/.test(title)) { intent = 'Transactional'; confidence = 85; }

      const eeat = {
        Experience: (text.match(/\b(I|we|my|our|I've|we've|me|us)\b/gi) || []).length > 12 ? 92 : 45,
        Expertise: hasAuthor ? 90 : 32,
        Authoritativeness: schemaTypes.length > 0 ? 94 : 40,
        Trustworthiness: url.startsWith('https') ? 96 : 60
      };

      const eeatAvg = Math.round(Object.values(eeat).reduce((a, b) => a + b) / 4);
      const depthScore = words > 2000 ? 95 : words > 1200 ? 82 : words > 700 ? 65 : 35;
      const readScore = readability > 70 ? 90 : readability > 50 ? 75 : 45;
      const overall = Math.round((depthScore + readScore + eeatAvg + confidence + schemaTypes.length * 8) / 5);

      // Remove loading bar
      document.getElementById('loading-bar')?.remove();

      // FINAL RESULTS — beautiful, working, no errors
	results.innerHTML = `
  <div class="max-w-5xl mx-auto space-y-12">

    <!-- Big Main Score Circle -->
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

    <!-- Intent + What/How/Why -->
    <div class="text-center mb-12">
      <p class="text-3xl font-bold mb-6">
        Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
        <span class="text-gray-500">(${confidence}% match)</span>
      </p>
      <div class="max-w-2xl mx-auto p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20 space-y-4">
        <div><span class="text-blue-500 font-bold">What it is?</span><p class="mt-2">${intent === 'Informational' ? 'User wants to learn or understand something.' : intent === 'Commercial' ? 'User is researching before buying.' : intent === 'Local' ? 'User is looking for a local business.' : 'User is ready to buy or convert.'}</p></div>
        <div><span class="text-green-500 font-bold">How to Fix:</span><p class="mt-2">${intent === 'Informational' ? 'Use headings, lists, images, FAQs for clarity.' : intent === 'Commercial' ? 'Include comparisons, reviews, pros/cons, pricing.' : intent === 'Local' ? 'Add maps, hours, reviews, contact info.' : 'Clear CTAs, trust seals, easy navigation.'}</p></div>
        <div><span class="text-orange-500 font-bold">Why it Matters?</span><p class="mt-2">${intent === 'Informational' ? 'Matches user needs, reduces bounce rates.' : intent === 'Commercial' ? 'Builds trust, boosts conversions.' : intent === 'Local' ? 'Improves local SEO visibility.' : 'Drives direct actions like purchases.'}</p></div>
      </div>
    </div>

    <!-- Content Depth + Readability -->
    <div class="grid md:grid-cols-2 gap-6 my-12">
      <div class="p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20 text-center">
        <p class="text-3xl font-bold mb-4">Content Depth</p>
        <p class="text-xl">${words.toLocaleString()} words</p>
        <p class="text-gray-500 mt-2">(${depthScore >= 80 ? 'Excellent' : depthScore >= 60 ? 'Good' : 'Needs improvement'})</p>
        <p class="mt-4 text-sm">What: Content length and detail. How: Add examples, sections, data. Why: Deeper content ranks higher in 2025.</p>
      </div>
      <div class="p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20 text-center">
        <p class="text-3xl font-bold mb-4">Readability</p>
        <p class="text-xl">${readability}</p>
        <p class="text-gray-500 mt-2">(Aim 60-70 for easy reading)</p>
        <p class="mt-4 text-sm">What: Flesch score for clarity. How: Shorter sentences, simple words. Why: Better UX, lower bounce.</p>
      </div>
    </div>

    <!-- Schema Detected -->
    <div class="p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20 text-center">
      <p class="text-3xl font-bold mb-4">Schema Detected</p>
      ${schemaTypes.length ? `
        <select class="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
          ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
        </select>
        <p class="mt-4 text-sm">What: Structured data for search engines. How: Add JSON-LD for Article/Person. Why: Rich snippets, better visibility.</p>
      ` : '<p class="text-xl text-red-500">None detected</p><p class="mt-4 text-sm">Add schema to boost E-E-A-T and rich results.</p>'}
    </div>

    <!-- E-E-A-T Cards -->
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
            <p class="text-blue-500 font-bold">What it is?</p><p>${key === 'Experience' ? 'First-hand knowledge.' : key === 'Expertise' ? 'Proven skill.' : key === 'Authoritativeness' ? 'Recognized authority.' : 'Site reliability.'}</p>
            <p class="text-green-500 font-bold">How to Fix:</p><p>${key === 'Experience' ? '"I/we" stories, photos.' : key === 'Expertise' ? 'Author bio + credentials.' : key === 'Authoritativeness' ? 'Backlinks, schema.' : 'HTTPS, contact page.'}</p>
            <p class="text-orange-500 font-bold">Why it Matters?</p><p>${key === 'Experience' ? 'Builds connection.' : key === 'Expertise' ? 'Google favors experts.' : key === 'Authoritativeness' ? 'Higher rankings.' : 'Increases trust.'}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Competitive Gap Table -->
    <div class="overflow-x-auto my-12">
      <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-left text-sm">
        <thead>
          <tr class="bg-gray-200 dark:bg-gray-700">
            <th class="p-4">Metric</th>
            <th class="p-4">Current</th>
            <th class="p-4">Ideal (2025)</th>
            <th class="p-4">Gap</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="p-4">Word Count</td><td class="p-4">${words}</td><td class="p-4">>1500</td><td class="p-4">${words < 1500 ? 'Add ' + (1500 - words) + ' words' : 'Good'}</td></tr>
          <tr><td class="p-4">Readability</td><td class="p-4">${readability}</td><td class="p-4">60-70</td><td class="p-4">${readability < 60 ? 'Simplify sentences' : 'Good'}</td></tr>
          <tr><td class="p-4">Schema Types</td><td class="p-4">${schemaTypes.length}</td><td class="p-4">≥2</td><td class="p-4">${schemaTypes.length < 2 ? 'Add schema' : 'Good'}</td></tr>
          <tr><td class="p-4">Author Bio</td><td class="p-4">${hasAuthor ? 'Yes' : 'No'}</td><td class="p-4">Yes</td><td class="p-4">${!hasAuthor ? 'Add bio' : 'Good'}</td></tr>
        </tbody>
      </table>
      <p class="text-center italic text-gray-500 mt-4">Compare to 2025 best practices – fix gaps for +20% score.</p>
    </div>

    <!-- Prioritised Fixes -->
    <div class="space-y-6 max-w-3xl mx-auto">
      <h3 class="text-3xl font-bold text-center mb-8">Prioritised AI-Style Fixes</h3>
      ${!hasAuthor ? `
        <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">👤</div>
            <div>
              <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
              <p class="mt-3 text-blue-500 font-bold">What:</p><p>Visible byline with credentials</p>
              <p class="mt-2 text-green-500 font-bold">How:</p><p>Add section with headshot, bio, links</p>
              <p class="mt-2 text-orange-500 font-bold">Why:</p><p>Boosts E-E-A-T by 30-40 points</p>
            </div>
          </div>
        </div>` : ''}
      ${words < 1500 ? `
        <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">✍️</div>
            <div>
              <h4 class="text-2xl font-bold text-orange-600">Add 1000+ Words of Depth</h4>
              <p class="mt-3 text-blue-500 font-bold">What:</p><p>Expand content length and detail</p>
              <p class="mt-2 text-green-500 font-bold">How:</p><p>Include examples, FAQs, data, images</p>
              <p class="mt-2 text-orange-500 font-bold">Why:</p><p>#1 ranking factor in 2025</p>
            </div>
          </div>
        </div>` : ''}
      ${schemaTypes.length < 2 ? `
        <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
          <div class="flex gap-5">
            <div class="text-5xl">✨</div>
            <div>
              <h4 class="text-2xl font-bold text-purple-600">Add Article + Person Schema</h4>
              <p class="mt-3 text-blue-500 font-bold">What:</p><p>Structured data for search engines</p>
              <p class="mt-2 text-green-500 font-bold">How:</p><p>Use JSON-LD with @type Article/Person</p>
              <p class="mt-2 text-orange-500 font-bold">Why:</p><p>Rich results + authority boost</p>
            </div>
          </div>
        </div>` : ''}
    </div>

    <!-- Predictive Rank Forecast -->
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-3xl font-medium opacity-80">Predictive Rank Forecast</p>
      <p class="text-7xl font-black mt-4">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-6">Implement fixes → <strong>+${Math.round((100-overall)*1.5)}% traffic</strong></p>
      <p class="mt-4 text-sm italic">Heuristic-based forecast; real results vary by competition and algorithm updates.</p>
    </div>

  </div>
`;

    } catch (err) {
      document.getElementById('loading-bar')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});