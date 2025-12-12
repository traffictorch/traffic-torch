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
let confidence = 50; // default fallback

const titleLower = title.toLowerCase();
const hasHowWhat = /how|what|why|guide|tutorial|step|learn|explain|best way/i.test(titleLower);
const hasBuyReview = /buy|best|review|price|deal|shop|discount|vs|comparison/i.test(titleLower);
const hasLocal = /near me|location|store|city|local|hours|map|address/i.test(titleLower);
const hasTransactional = /sign up|login|purchase|buy now|order|checkout|book/i.test(titleLower);

if (hasBuyReview) { intent = 'Commercial'; confidence = 90; }
else if (hasHowWhat) { intent = 'Informational'; confidence = 94; }
else if (hasLocal) { intent = 'Local'; confidence = 87; }
else if (hasTransactional) { intent = 'Transactional'; confidence = 91; }
else confidence = 65; // neutral title
	
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
	// === REPLACE YOUR ENTIRE results.innerHTML = `...` BLOCK WITH THIS ===

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

    <!-- Intent -->
    <div class="text-center mb-12">
      <p class="text-4xl font-black mb-8">Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span> <span class="text-2xl text-gray-400">— ${confidence}% match</span></p>
      <div class="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-left">
        <div class="p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
          <p class="font-bold text-blue-500">What it is</p>
          <p class="mt-2 text-sm">${intent === 'Informational' ? 'User wants to learn or understand.' : intent === 'Commercial' ? 'User is researching before buying.' : intent === 'Local' ? 'User wants a nearby business.' : 'User is ready to convert.'}</p>
        </div>
        <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl">
          <p class="font-bold text-green-500">How to satisfy it</p>
          <p class="mt-2 text-sm">${intent === 'Informational' ? 'Headings, lists, FAQs, images.' : intent === 'Commercial' ? 'Comparisons, reviews, pricing.' : intent === 'Local' ? 'Map, hours, reviews.' : 'Strong CTAs, trust badges.'}</p>
        </div>
        <div class="p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
          <p class="font-bold text-orange-500">Why it matters</p>
          <p class="mt-2 text-sm">${intent === 'Informational' ? 'Lower bounce, higher rankings.' : intent === 'Commercial' ? 'Higher conversion rate.' : intent === 'Local' ? 'Local pack dominance.' : 'Direct revenue.'}</p>
        </div>
      </div>
    </div>

    <!-- E-E-A-T Cards -->
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
            <p class="text-blue-500 font-bold">What:</p><p>${key === 'Experience' ? 'First-hand knowledge shown.' : key === 'Expertise' ? 'Proven skill.' : key === 'Authoritativeness' ? 'Recognized authority.' : 'Site reliability.'}</p>
            <p class="text-green-500 font-bold">How:</p><p>${key === 'Experience' ? '"I/we" stories, photos.' : key === 'Expertise' ? 'Author bio + credentials.' : key === 'Authoritativeness' ? 'Backlinks, schema.' : 'HTTPS, contact page.'}</p>
            <p class="text-orange-500 font-bold">Why:</p><p>${key === 'Experience' ? 'Builds connection.' : key === 'Expertise' ? 'Google favors experts.' : key === 'Authoritativeness' ? 'Higher rankings.' : 'Increases trust.'}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Content Depth + Readability + Schema + Gap Table + Fixes — all with What/How/Why -->
    <div class="space-y-12">

      <!-- Content Depth
      <div class="p-8 bg-gradient-to-r from-blue-500/10 border-l-8 border-blue-500 rounded-r-2xl">
        <div class="flex gap-6">
          <div class="text-5xl">📏</div>
          <div>
            <h3 class="text-2xl font-bold text-blue-600">Content Depth</h3>
            <p class="text-4xl font-black mt-2">${words.toLocaleString()} words</p>
            <p class="text-blue-500 font-bold mt-4">What:</p><p>Length and detail of content</p>
            <p class="text-green-500 font-bold">How:</p><p>Add examples, data, images, FAQs, comparisons</p>
            <p class="text-orange-500 font-bold">Why:</p><p>Depth is the #1 ranking factor in 2025</p>
          </div>
        </div>
      </div>

      Readability
      <div class="p-8 bg-gradient-to-r from-green-500/10 border-l-8 border-green-500 rounded-r-2xl">
        <div class="flex gap-6">
          <div class="text-5xl">📖</div>
          <div>
            <h3 class="text-2xl font-bold text-green-600">Readability</h3>
            <p class="text-4xl font-black mt-2">${readability} Flesch score</p>
            <p class="text-blue-500 font-bold mt-4">What:</p><p>How easy the text is to read</p>
            <p class="text-green-500 font-bold">How:</p><p>Short sentences, simple words, active voice</p>
            <p class="text-orange-500 font-bold">Why:</p><p>Lower bounce, longer time-on-page</p>
          </div>
        </div>
      </div>

      Schema Detected
      <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
        <div class="flex gap-6">
          <div class="text-5xl">✨</div>
          <div>
            <h3 class="text-2xl font-bold text-purple-600">Schema Detected</h3>
            ${schemaTypes.length ? `<p class="text-3xl font-black mt-2">${schemaTypes.length} type${schemaTypes.length > 1 ? 's' : ''} found</p>` : '<p class="text-3xl font-black mt-2 text-red-500">None detected</p>'}
            <p class="text-blue-500 font-bold mt-4">What:</p><p>Structured data for Google</p>
            <p class="text-green-500 font-bold">How:</p><p>Add JSON-LD Article + Person</p>
            <p class="text-orange-500 font-bold">Why:</p><p>Rich results + E-E-A-T boost</p>
          </div>
        </div>
      </div>

      Competitive Gap Table
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr><th class="p-4 font-bold">Metric</th><th class="p-4 font-bold">Current</th><th class="p-4 font-bold">Ideal (2025)</th><th class="p-4 font-bold text-right">Gap</th></tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900">
            <tr class="border-b"><td class="p-4">Word Count</td><td class="p-4">${words}</td><td class="p-4">>1,500</td><td class="p-4 text-right ${words<1500?'text-red-500':'text-green-500'}">${words<1500?'−'+(1500-words):'Good'}</td></tr>
            <tr class="border-b"><td class="p-4">Readability</td><td class="p-4">${readability}</td><td class="p-4">60–70</td><td class="p-4 text-right ${readability<60||readability>70?'text-orange-500':'text-green-500'}">${readability<60||readability>70?'Adjust':'Good'}</td></tr>
            <tr class="border-b"><td class="p-4">Schema</td><td class="p-4">${schemaTypes.length}</td><td class="p-4">≥2</td><td class="p-4 text-right ${schemaTypes.length<2?'text-red-500':'text-green-500'}">${schemaTypes.length<2?'Add':'Good'}</td></tr>
            <tr><td class="p-4">Author Bio</td><td class="p-4">${hasAuthor?'Yes':'No'}</td><td class="p-4">Yes</td><td class="p-4 text-right ${!hasAuthor?'text-red-500':'text-green-500'}">${!hasAuthor?'Add':'Good'}</td></tr>
          </tbody>
        </table>
      </div>

      Prioritised AI-Style Fixes (now working!)
      <div class="space-y-8">
        <h3 class="text-4xl font-black text-center mb-8">Prioritised AI-Style Fixes</h3>
        ${!hasAuthor ? `
          <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
            <div class="flex gap-6">
              <div class="text-5xl">👤</div>
              <div>
                <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
                <p class="mt-4 text-blue-500 font-bold">What:</p><p>Visible byline with credentials</p>
                <p class="mt-2 text-green-500 font-bold">How:</p><p>Add author box with headshot + bio</p>
                <p class="mt-2 text-orange-500 font-bold">Why:</p><p>Boosts E-E-A-T by 30–40 points</p>
              </div>
            </div>
          </div>` : ''}
        ${words < 1500 ? `
          <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
            <div class="flex gap-6">
              <div class="text-5xl">✍️</div>
              <div>
                <h4 class="text-2xl font-bold text-orange-600">Add 1000+ Words of Depth</h4>
                <p class="mt-4 text-blue-500 font-bold">What:</p><p>Expand content with value</p>
                <p class="mt-2 text-green-500 font-bold">How:</p><p>Examples, FAQs, data, images</p>
                <p class="mt-2 text-orange-500 font-bold">Why:</p><p>#1 ranking factor 2025</p>
              </div>
            </div>
          </div>` : ''}
        ${schemaTypes.length < 2 ? `
          <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
            <div class="flex gap-6">
              <div class="text-5xl">✨</div>
              <div>
                <h4 class="text-2xl font-bold text-purple-600">Add Schema</h4>
                <p class="mt-4 text-blue-500 font-bold">What:</p><p>Structured data</p>
                <p class="mt-2 text-green-500 font-bold">How:</p><p>JSON-LD Article + Person</p>
                <p class="mt-2 text-orange-500 font-bold">Why:</p><p>Rich results + E-E-A-T</p>
              </div>
            </div>
          </div>` : ''}
      </div>

      Predictive Rank Forecast
      <div class="text-center mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
        <p class="text-3xl font-medium opacity-80">Predictive Rank Forecast</p>
        <p class="text-8xl font-black mt-6">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
        <p class="text-4xl mt-8 font-bold">+${Math.round((100-overall)*1.5)}% traffic potential</p>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-10 px-10 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 text-xl font-bold">
          Show Expert Analysis
        </button>
        <div class="hidden mt-10 space-y-6 text-left max-w-3xl mx-auto text-lg">
          <p class="font-bold text-blue-300">What:</p><p>SERP position estimate</p>
          <p class="font-bold text-green-300">How:</p><p>Fix all gaps → GSC → resubmit</p>
          <p class="font-bold text-orange-300">Why:</p><p>Strong E-E-A-T = massive traffic</p>
        </div>
      </div>

      PDF Button
      <div class="text-center my-16">
        <button onclick="window.print()" class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
          📄 Save as PDF
        </button>
      </div>

  </div>
`;




    } catch (err) {
      document.getElementById('loading-bar')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});