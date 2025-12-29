document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Define cleanUrl inside DOMContentLoaded, before use (exact match to home page tool)
	function cleanUrl(u) {
  const trimmed = u.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Add https:// only to the host part if path is present (avoids // in path)
  const parts = trimmed.split('/', 1);
  const host = parts[0];
  const path = trimmed.slice(host.length);
  return 'https://' + host + path;
}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const inputValue = document.getElementById('url-input').value;
    const url = cleanUrl(inputValue);

    // Debug: Open console (F12) to see this log — confirms if cleanUrl ran and what URL is sent
    console.log('Input:', inputValue);
    console.log('Cleaned URL sent to proxy:', url);

    if (!url) return;

    // Clear previous results and show centered spinner + progress text
	results.innerHTML = `
  <div id="analysis-progress" class="flex flex-col items-center justify-center py-2 mt-2">
    <div class="relative w-20 h-20">
      <svg class="animate-spin" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
      </svg>
    </div>
    <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500"></p> <!-- optional: mt-6 for closer text -->
  </div>
`;
results.classList.remove('hidden');

    const progressText = document.getElementById('progress-text');

    try {
      // Step 1: Fetch page
      progressText.textContent = "Analyzing Content Depth...";
      await sleep(800);

      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable – check URL');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Step 2: Content Depth
      progressText.textContent = "Analyzing Readability...";
      await sleep(800);

      const text = doc.body?.textContent || '';
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = (text.match(/[.!?]+/g) || []).length || 1;
      const syllables = text.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const readability = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));

      // Step 3: E-E-A-T Signals
      progressText.textContent = "Analyzing E-E-A-T Signals...";
      await sleep(800);

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const schemaTypes = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
          schemaTypes.push(...types.filter(Boolean));
        } catch {}
      });

      // Step 4: Intent
      progressText.textContent = "Analyzing Search Intent...";
      await sleep(800);

      const titleLower = (doc.title || '').toLowerCase();
      let intent = 'Informational';
      let confidence = 60;
      if (/buy|best|review|price|deal|shop|discount|vs|comparison/i.test(titleLower)) { intent = 'Commercial'; confidence = 90; }
      else if (/how|what|why|guide|tutorial|step|learn|explain|best way/i.test(titleLower)) { intent = 'Informational'; confidence = 94; }
      else if (/near me|location|store|city|local|hours|map|address/i.test(titleLower)) { intent = 'Local'; confidence = 87; }
      else if (/sign up|login|purchase|buy now|order|checkout|book/i.test(titleLower)) { intent = 'Transactional'; confidence = 91; }

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

      // Final step
      progressText.textContent = "Generating Report...";
      await sleep(600);

      // === FULL REPORT OUTPUT (unchanged from your original) ===
      results.innerHTML = `
<!-- Big Score Circle - Mobile-Fixed Version -->
<div class="flex justify-center my-12 px-4">
  <div class="relative" style="width: min(90vw, 320px); aspect-ratio: 1/1;">
    <svg viewBox="0 0 260 260" class="transform -rotate-90 w-full h-full">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
      <circle cx="130" cy="130" r="120"
              stroke="${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}"
              stroke-width="18" fill="none"
              stroke-dasharray="${(overall / 100) * 754} 754"
              stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center">
        <div class="font-black drop-shadow-2xl text-6xl leading-none"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}; font-size: clamp(3.5rem, 14vw, 6rem);">
          ${overall}
        </div>
        <div class="opacity-80 -mt-2"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}; font-size: clamp(1.25rem, 5vw, 2rem);">
          /100
        </div>
      </div>
    </div>
  </div>
</div>

			<!-- Intent -->
<div class="text-center mb-12">
  <p class="text-4xl font-bold text-gray-500 mb-8">
    Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
    <span class="text-2xl text-gray-500">— ${confidence}% match</span>
  </p>
  <div class="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
      <p class="font-bold text-blue-500">What it is</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">The core motivation driving a user's search query — whether they're seeking information, researching options, ready to purchase, or looking for a local service. Understanding this ensures your content delivers exactly what searchers expect.</p>
    </div>
    <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl">
      <p class="font-bold text-green-500">How to satisfy it</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Craft your title, H1, meta description, and body content to directly address the user's specific need. Use matching language, structure (e.g., lists for comparisons, steps for how-tos), and calls-to-action — eliminate fluff, assumptions, or mismatched elements to create a seamless experience.</p>
    </div>
    <div class="p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
      <p class="font-bold text-orange-500">Why it matters</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Search engines prioritize pages that best align with user intent, as it leads to higher satisfaction, longer engagement, and lower bounces. Mismatched intent results in quick exits, poor signals, and lost rankings — while strong alignment drives traffic and conversions.</p>
    </div>
  </div>
</div>
          
			<!-- E-E-A-T Breakdown -->
<div class="grid md:grid-cols-4 gap-6 my-16">
  ${Object.entries(eeat).map(([key, val]) => `
    <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${val >= 80 ? 'border-green-500' : val >= 60 ? 'border-orange-500' : 'border-red-500'}">
      <div class="relative mx-auto w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
          <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
          <circle cx="64" cy="64" r="56" 
                  stroke="${val >= 80 ? '#22c55e' : val >= 60 ? '#f97316' : '#ef4444'}"
                  stroke-width="12" fill="none" 
                  stroke-dasharray="${(val/100)*352} 352" 
                  stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-4xl font-black"
             style="color: ${val >= 80 ? '#22c55e' : val >= 60 ? '#f97316' : '#ef4444'};">
          ${val}
        </div>
      </div>
      <p class="mt-4 text-lg font-medium">${key}</p>
      <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
        Show Fixes
      </button>
      <div class="hidden mt-6 space-y-3 text-left text-sm">
        <p class="text-blue-500 font-bold">What it is?</p>
        <p>${key === 'Experience' ? 'Proof that the content creator has first-hand involvement in the topic, such as personal anecdotes, real-world applications, or direct participation, making the advice more relatable and credible.' 
          : key === 'Expertise' ? 'Demonstrated deep knowledge and skill in the subject area, backed by qualifications, achievements, or specialized training, showing the author is a reliable source.' 
          : key === 'Authoritativeness' ? 'Recognition of the site or author as a leading voice in the niche, often through citations, references from reputable sources, or industry accolades.' 
          : 'Indicators that the site and content are reliable, secure, and transparent, fostering user confidence through clear policies and ethical practices.'}</p>
        <p class="text-green-500 font-bold">How to improve?</p>
        <p>${key === 'Experience' ? 'Incorporate first-person language like “I” or “we,” add personal photos or videos, include detailed case studies with outcomes, mention specific dates or timelines, and share lessons learned from your own trials and errors to make it authentic.' 
          : key === 'Expertise' ? 'Add an author bio box with a professional photo, detailed biography highlighting relevant education or experience, list certifications, degrees, or publications, and link to other works or speaking engagements to build proof.' 
          : key === 'Authoritativeness' ? 'Earn high-quality backlinks from trusted sites, get featured in press or media mentions, implement relevant schema markup like Organization or Person, display awards or endorsements, and contribute to industry forums or publications.' 
          : 'Switch to HTTPS if not already, create a dedicated contact page with real details, add a privacy policy and terms of service, include content update dates, and ensure no misleading claims or ads to maintain transparency.'}</p>
        <p class="text-orange-500 font-bold">Why it matters?</p>
        <p>${key === 'Experience' ? 'Search engines favor content with genuine experience because it reduces misinformation, improves user satisfaction, and leads to longer dwell times, all of which boost rankings and traffic.' 
          : key === 'Expertise' ? 'Proven expertise helps search engines identify high-quality content, reducing the risk of penalties and increasing visibility, as users trust and engage more with authoritative sources.' 
          : key === 'Authoritativeness' ? 'It establishes your site as a go-to resource, enhancing link-building opportunities and search engine trust, which directly impacts long-term visibility and competitive edge.' 
          : 'High trustworthiness signals prevent user bounces, build loyalty, and align with search engine guidelines, avoiding downgrades and ensuring steady organic traffic growth.'}</p>
      </div>
    </div>
  `).join('')}
</div>


			<!-- Content Depth + Readability + Schema Detected -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  <!-- Content Depth -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Content Depth</h3>
    <p class="text-5xl font-black mb-2">${words.toLocaleString()}</p>
    <p class="text-gray-500 mb-4">words</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>Comprehensive coverage that fully answers the user's query while going deeper with related questions, examples, and supporting details to provide the most complete resource possible.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Add real-world examples, statistics and data sources, screenshots or visuals, step-by-step guides, comparisons, templates or downloadable resources, FAQs addressing common follow-ups, and expert insights to expand value without fluff.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Depth is the strongest on-page ranking factor — search engines reward pages that fully satisfy user intent with the most helpful, thorough answer, leading to higher positions, longer dwell time, and more organic traffic.</p>
    </div>
  </div>
  <!-- Readability -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Readability</h3>
    <p class="text-5xl font-black mb-2">${readability}</p>
    <p class="text-gray-500 mb-4">Flesch score</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>How easily users can read and understand your content — measured by sentence length, word complexity, and overall flow.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Use short sentences (under 20 words), simple everyday words, active voice, clear subheadings (H2/H3), bullet points and numbered lists, short paragraphs (3–4 lines max), bold key phrases, and transitional words to guide the reader smoothly.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Search engines track user behavior — highly readable content reduces bounce rates, increases time on page, and improves satisfaction signals, all of which directly boost rankings and conversions.</p>
    </div>
  </div>
  <!-- Schema Detected -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Schema Detected</h3>
    ${schemaTypes.length ? `
      <select class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
        ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
      </select>
      <p class="mt-4 text-green-500 font-bold">${schemaTypes.length} type${schemaTypes.length > 1 ? 's' : ''} found</p>
    ` : '<p class="text-2xl text-red-500 mt-4">No schema detected</p>'}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>Structured data (JSON-LD) that explicitly tells search engines what your page content represents — such as Article, FAQ, HowTo, Product, Person, Organization, etc.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Add JSON-LD script blocks in the <head> for relevant types (e.g., Article + author Person link, FAQPage for questions, HowTo for tutorials, BreadcrumbList for navigation). Validate using official structured data testing tools and implement the most relevant types for your content.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Schema enables rich snippets (stars, FAQs, carousels), increases click-through rates significantly, strengthens E-E-A-T signals, and helps search engines understand and feature your content more prominently in results.</p>
    </div>
  </div>
</div>


          <!-- Competitive Gap Table -->
          <div class="overflow-x-auto my-12">
            <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-left">
              <thead>
                <tr class="bg-gray-200 dark:bg-gray-700">
                  <th class="p-4 font-bold">Metric</th>
                  <th class="p-4 font-bold">Current</th>
                  <th class="p-4 font-bold">Ideal</th>
                  <th class="p-4 font-bold">Gap</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b"><td class="p-4 text-gray-500">Word Count</td><td class="p-4 text-gray-500">${words}</td><td class="p-4 text-gray-500">>1,500</td><td class="p-4 ${words<1500?'text-red-500':'text-green-500'}">${words<1500?'Add '+(1500-words)+' words':'Good'}</td></tr>
                <tr class="border-b"><td class="p-4 text-gray-500">Readability</td><td class="p-4 text-gray-500">${readability}</td><td class="p-4 text-gray-500">60-70</td><td class="p-4 ${readability<60||readability>70?'text-orange-500':'text-green-500'}">${readability<60||readability>70?'Adjust':'Good'}</td></tr>
                <tr class="border-b"><td class="p-4 text-gray-500">Schema Types</td><td class="p-4 text-gray-500">${schemaTypes.length}</td><td class="p-4 text-gray-500">≥2</td><td class="p-4 ${schemaTypes.length<2?'text-red-500':'text-green-500'}">${schemaTypes.length<2?'Add':'Good'}</td></tr>
                <tr><td class="p-4 text-gray-500">Author Bio</td><td class="p-4 text-gray-500">${hasAuthor?'Yes':'No'}</td><td class="p-4 text-gray-500">Yes</td><td class="p-4 ${!hasAuthor?'text-red-500':'text-green-500'}">${!hasAuthor?'Add':'Good'}</td></tr>
              </tbody>
            </table>
          </div>
          
          
			<!-- Prioritised AI-Style Fixes -->
<div class="space-y-8">
  <h3 class="text-4xl font-bold text-green-400 text-center mb-8">Prioritised AI-Style Fixes</h3>
	${!hasAuthor ? `
  <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">👤</div>
      <div>
        <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">A visible author byline with name, photo, and credentials that proves a real expert created the content.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Add a detailed author box with professional headshot, full bio highlighting relevant experience/qualifications, links to social profiles or other work, and clear connection to the topic (e.g., “Written by [Name], 10+ years in [niche]”).</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Search engines heavily weigh proven authorship for E-E-A-T — pages with strong author signals rank higher, build trust faster, and reduce bounce rates significantly.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
${words < 1500 ? `
  <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">✍️</div>
      <div>
        <h4 class="text-2xl font-bold text-orange-600">Expand Content Depth</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">Thorough, comprehensive coverage that fully answers the main query plus all related follow-up questions users typically have.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Add in-depth examples, data-backed statistics, step-by-step breakdowns, comparisons, visuals/screenshots, templates or tools, expert quotes, case studies, and expanded FAQs — aim for the most complete resource on the topic.</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Depth remains the strongest on-page ranking factor — search engines consistently reward the most helpful, exhaustive pages with top positions and sustained traffic growth.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
${schemaTypes.length < 2 ? `
  <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">✨</div>
      <div>
        <h4 class="text-2xl font-bold text-purple-600">Add Relevant Schema Markup</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">Structured data (JSON-LD) that explicitly defines your page type and key entities to search engines.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Implement at least two relevant types: Article (with author Person link), plus FAQPage, HowTo, Product, or BreadcrumbList as appropriate. Validate with official testing tools before publishing.</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Proper schema unlocks rich results, boosts click-through rates dramatically, strengthens E-E-A-T signals, and helps search engines feature your content more prominently.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
</div>
          
          
<!-- Predictive Rank Forecast -->
<div class="text-center mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
  <p class="text-3xl font-medium opacity-80">Predictive Rank Forecast</p>
  <p class="text-8xl font-black mt-6">${overall > 88 ? 'Top 3' : overall > 75 ? 'Top 10' : overall > 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
  <p class="text-4xl mt-8 font-bold">+${Math.round((100-overall)*1.5)}% traffic potential</p>
  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-10 px-10 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 text-xl font-bold">
    Show Expert Analysis
  </button>
  <div class="hidden mt-10 space-y-6 text-left max-w-3xl mx-auto text-lg">
    <p class="font-bold text-blue-300">What it is?</p>
    <p>An estimate of your likely SERP position based on current E-E-A-T strength, content depth, readability, intent match, and schema signals compared to typical top-ranking pages in competitive niches.</p>
    
    <p class="font-bold text-green-300">How to improve?</p>
    <p>Address every red and orange gap identified in this report (author bio, depth, schema, etc.), monitor performance in Search Console, request indexing after major updates, and track ranking movement over 7–30 days as search engines re-evaluate your improved signals.</p>
    
    <p class="font-bold text-orange-300">Why it matters?</p>
    <p>Pages consistently scoring 85+ secure Page 1 visibility, while 90+ often lock Top 3 positions. Closing your ${100-overall}-point gap directly translates to substantial organic traffic gains and long-term ranking stability.</p>
  </div>
</div>


          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                 class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
              📄 Save as PDF
            </button>
          </div>
        </div>
      `;



  
  
  
} catch (err) {
  results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
}
  });
});