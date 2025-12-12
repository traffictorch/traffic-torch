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
  <div class="max-w-5xl mx-auto space-y-16">

    <!-- Big Score Circle -->
    <div class="flex justify-center my-12">
      <div class="relative">
        <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
          <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
          <circle cx="130" cy="130" r="120" stroke="url(#big)" stroke-width="18" fill="none"
                  stroke-dasharray="${(overall/100)*754} 754" stroke-linecap="round"/>
          <defs><linearGradient id="big"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#22c55e"/></linearGradient></defs>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-7xl font-black text-white drop-shadow-2xl">${overall}</div>
            <div class="text-2xl text-white/90 -mt-2">/100</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Intent with correct confidence -->
    <div class="text-center mb-12">
      <p class="text-3xl font-bold mb-6">
        Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
        <span class="text-gray-500">(${confidence}% match)</span>
      </p>
      <div class="max-w-2xl mx-auto p-6 bg-white/10 dark:bg-gray-900/60 rounded-2xl border border-gray-200/20 space-y-6">
        <div><span class="text-blue-500 font-bold text-xl">What it is?</span><p class="mt-2">${intent === 'Informational' ? 'User wants to learn or understand something.' : intent === 'Commercial' ? 'User is researching before buying.' : intent === 'Local' ? 'User looking for a local business.' : 'User ready to convert.'}</p></div>
        <div><span class="text-green-500 font-bold text-xl">How to Fix:</span><p class="mt-2">${intent === 'Informational' ? 'Use headings, lists, images, FAQs.' : intent === 'Commercial' ? 'Add comparisons, reviews, pricing.' : intent === 'Local' ? 'Show map, hours, reviews.' : 'Strong CTAs, trust badges.'}</p></div>
        <div><span class="text-orange-500 font-bold text-xl">Why it Matters?</span><p class="mt-2">${intent === 'Informational' ? 'Lower bounce, longer time-on-page.' : intent === 'Commercial' ? 'Higher conversion rate.' : intent === 'Local' ? 'Better local pack ranking.' : 'Direct revenue increase.'}</p></div>
      </div>
    </div>

    <!-- 4 E-E-A-T Cards -->
    <div class="grid md:grid-cols-4 gap-6 my-16">
      ${Object.entries(eeat).map(([key, val]) => `
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
            <p class="text-blue-500 font-bold">What:</p><p>${key === 'Experience' ? 'First-hand knowledge.' : key === 'Expertise' ? 'Proven skill.' : key === 'Authoritativeness' ? 'Recognized authority.' : 'Site reliability.'}</p>
            <p class="text-green-500 font-bold">How:</p><p>${key === 'Experience' ? '"I/we" stories, photos.' : key === 'Expertise' ? 'Author bio + credentials.' : key === 'Authoritativeness' ? 'Backlinks, schema.' : 'HTTPS, contact page.'}</p>
            <p class="text-orange-500 font-bold">Why:</p><p>${key === 'Experience' ? 'Builds connection.' : key === 'Expertise' ? 'Google favors experts.' : key === 'Authoritativeness' ? 'Higher rankings.' : 'Increases trust.'}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- NEW SECTIONS BELOW E-E-A-T (exact style match) -->

    <!-- Content Depth + Readability -->
    <div class="grid md:grid-cols-2 gap-6">
      <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700">
        <h3 class="text-2xl font-bold mb-4 text-center">Content Depth</h3>
        <p class="text-5xl font-black text-center mb-2">${words.toLocaleString()}</p>
        <p class="text-center text-gray-500">words</p>
        <p class="text-center mt-4 text-sm italic">Ideal: >1,500 words for competitive topics</p>
      </div>
      <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700">
        <h3 class="text-2xl font-bold mb-4 text-center">Readability</h3>
        <p class="text-5xl font-black text-center mb-2">${readability}</p>
        <p class="text-center text-gray-500">Flesch score</p>
        <p class="text-center mt-4 text-sm italic">Ideal: 60–70 (easy to read)</p>
      </div>
    </div>

    <!-- Schema Detected -->
    <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
      <h3 class="text-2xl font-bold mb-6">Schema Detected</h3>
      ${schemaTypes.length ? `
        <div class="inline-block">
          <select class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-lg">
            ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
          </select>
          <p class="mt-4 text-green-500 font-bold">Great! Schema found</p>
        </div>
      ` : '<p class="text-2xl text-red-500">No schema detected</p><p class="mt-4 text-sm italic">Add Article + Person JSON-LD for rich results</p>'}
    </div>

    <!-- Competitive Gap Table -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead class="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th class="p-4 font-bold">Metric</th>
            <th class="p-4 font-bold">Current</th>
            <th class="p-4 font-bold">Ideal (2025)</th>
            <th class="p-4 font-bold text-right">Gap</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900">
          <tr class="border-b dark:border-gray-700"><td class="p-4">Word Count</td><td class="p-4">${words}</td><td class="p-4">>1,500</td><td class="p-4 text-right ${words < 1500 ? 'text-red-500' : 'text-green-500'}">${words < 1500 ? '−' + (1500-words) : '✓'}</td></tr>
          <tr class="border-b dark:border-gray-700"><td class="p-4">Readability</td><td class="p-4">${readability}</td><td class="p-4">60–70</td><td class="p-4 text-right ${readability < 60 || readability > 70 ? 'text-orange-500' : 'text-green-500'}">${readability < 60 || readability > 70 ? 'Adjust' : '✓'}</td></tr>
          <tr class="border-b dark:border-gray-700"><td class="p-4">Schema Types</td><td class="p-4">${schemaTypes.length}</td><td class="p-4">≥2</td><td class="p-4 text-right ${schemaTypes.length < 2 ? 'text-red-500' : 'text-green-500'}">${schemaTypes.length < 2 ? 'Add' : '✓'}</td></tr>
          <tr><td class="p-4">Author Bio</td><td class="p-4">${hasAuthor ? 'Yes' : 'No'}</td><td class="p-4">Yes</td><td class="p-4 text-right ${!hasAuthor ? 'text-red-500' : 'text-green-500'}">${!hasAuthor ? 'Add' : '✓'}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Prioritised AI-Style Fixes -->
    <div class="space-y-8">
      <h3 class="text-4xl font-black text-center mb-8">Prioritised AI-Style Fixes</h3>
      ${!hasAuthor ? `
        <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
          <div class="flex gap-6">
            <div class="text-5xl">👤</div>
            <div>
              <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
              <p class="mt-4 text-blue-500 font-bold">What:</p><p>Visible byline with credentials and photo</p>
              <p class="mt-3 text-green-500 font-bold">How:</p><p>Add author box with headshot, bio, social links</p>
              <p class="mt-3 text-orange-500 font-bold">Why:</p><p>Boosts Expertise & Trust by 30–40 points — Google loves it</p>
            </div>
          </div>
        </div>` : ''}
      ${words < 1500 ? `
        <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
          <div class="flex gap-6">
            <div class="text-5xl">✍️</div>
            <div>
              <h4 class="text-2xl font-bold text-orange-600">Add 1000+ Words of Depth</h4>
              <p class="mt-4 text-blue-500 font-bold">What:</p><p>Expand content with detail and value</p>
              <p class="mt-3 text-green-500 font-bold">How:</p><p>Add examples, FAQs, data, images, comparisons</p>
              <p class="mt-3 text-orange-500 font-bold">Why:</p><p>#1 ranking factor in 2025 — depth wins</p>
            </div>
          </div>
        </div>` : ''}
      ${schemaTypes.length < 2 ? `
        <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
          <div class="flex gap-6">
            <div class="text-5xl">✨</div>
            <div>
              <h4 class="text-2xl font-bold text-purple-600">Add Article + Person Schema</h4>
              <p class="mt-4 text-blue-500 font-bold">What:</p><p>Structured data for Google</p>
              <p class="mt-3 text-green-500 font-bold">How:</p><p>JSON-LD with @type: Article + Person</p>
              <p class="mt-3 text-orange-500 font-bold">Why:</p><p>Rich results + major E-E-A-T boost</p>
            </div>
          </div>
        </div>` : ''}
    </div>

    <!-- Predictive Rank Forecast with Expand -->
    <div class="text-center mt-16 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
      <p class="text-3xl font-medium opacity-80">Predictive Rank Forecast</p>
      <p class="text-7xl font-black mt-4">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
      <p class="text-3xl mt-6">Implement fixes → <strong>+${Math.round((100-overall)*1.5)}% traffic</strong></p>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-8 px-10 py-4 bg-white/20 rounded-full hover:bg-white/30 text-xl font-medium">
        Show Details
      </button>
      <div class="hidden mt-8 space-y-6 text-left max-w-2xl mx-auto text-lg">
        <div><span class="text-blue-300 font-bold">What:</span> Estimated SERP position based on E-E-A-T, depth, and intent match</div>
        <div><span class="text-green-300 font-bold">How:</span> Apply all fixes above → monitor GSC → resubmit URL for re-crawl</div>
        <div><span class="text-orange-300 font-bold">Why:</span> Strong E-E-A-T + depth = higher rankings = more traffic</div>
      </div>
    </div>

  </div>
`;




    } catch (err) {
      document.getElementById('loading-bar')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});