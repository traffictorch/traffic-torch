document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const targetKeywordInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';
  const progressModules = [
    "Fetching page...",
    "Analyzing meta & headings...",
    "Checking content density...",
    "Scanning image alts...",
    "Evaluating anchors...",
    "Checking URL & schema...",
    "Finalizing score..."
  ];
  let currentModuleIndex = 0;
  let moduleInterval;
  function startSpinnerLoader() {
    results.innerHTML = `
      <div id="loader" class="flex flex-col items-center justify-center space-y-4 mt-8">
        <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p id="module-text" class="text-xl text-gray-600 dark:text-gray-300 font-medium"></p>
      </div>
    `;
    results.classList.remove('hidden');
    document.getElementById('module-text').textContent = progressModules[0];
    currentModuleIndex = 1;
    moduleInterval = setInterval(() => {
      if (currentModuleIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[currentModuleIndex++];
      }
    }, 600); // Quicker interval to show all faster
  }
  
  
  
  
  
  function stopSpinnerLoader() {
    clearInterval(moduleInterval);
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }
  const fetchPage = async (url) => {
    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) return null;
      const html = await res.text();
      return new DOMParser().parseFromString(html, 'text/html');
    } catch {
      return null;
    }
  };
  const countPhrase = (text = '', phrase = '') => {
    if (!text || !phrase) return 0;
    const lower = text.toLowerCase();
    const p = phrase.toLowerCase().trim();
    let matches = (lower.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const cleanP = p.replace(/\b(in|the|a|an|of|at|on|for|and|&|near|best|top|great)\b/gi, '').trim();
    if (cleanP.length > 4) matches += (lower.match(new RegExp(cleanP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    return matches;
  };
  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, script, style, noscript, .menu, .nav, .navbar, .footer, .cookie, .popup').forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };
  const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    
    const yourUrl = pageUrlInput.value.trim();
    const phrase = targetKeywordInput.value.trim();
    if (!yourUrl || !phrase) return;

    // Auto-prepend https:// if no protocol provided (allows input like "example.com/path")
    let fullUrl = yourUrl;
    if (!/^https?:\/\//i.test(yourUrl)) {
      fullUrl = 'https://' + yourUrl;
      pageUrlInput.value = fullUrl; // Update input so user sees the full URL
    }

    startSpinnerLoader();
    const yourDoc = await fetchPage(fullUrl);

    // ... (keep all existing code between here unchanged) ...

    // URL & Schema - uses fullUrl for accurate keyword matching
    data.urlSchema = {
      urlMatch: countPhrase(fullUrl, phrase),
      schema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    
    
    
    startSpinnerLoader();
    const yourDoc = await fetchPage(yourUrl);
    if (!yourDoc) {
      stopSpinnerLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Page not reachable.</p>`;
      return;
    }
    let yourScore = 0;
    const data = {};
    const fixes = [];
    // Meta
    data.meta = {
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    if (data.meta.yourMatches === 0) fixes.push({
      issue: 'Add keyword to title and meta description',
      what: 'Your page lacks the target keyword in the title tag or meta description, reducing visibility in search results.',
      how: 'Incorporate the keyword naturally at the beginning of the title (under 60 characters) and once in the meta description (under 155 characters) to make it compelling.',
      why: 'These elements are key for search engines to match queries and encourage clicks, potentially boosting CTR by 20-30% when optimized.'
    });
    // H1
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    data.h1 = { match: countPhrase(yourH1, phrase) };
    yourScore += data.h1.match > 0 ? 15 : 0;
    if (data.h1.match === 0) fixes.push({
      issue: 'Add keyword to H1',
      what: 'The main H1 heading is missing the target keyword.',
      how: 'Revise the H1 to feature the keyword or a close variant, ensuring it remains engaging and user-focused.',
      why: 'H1 tags help search engines grasp the page topic quickly, serving as a core on-page factor for better rankings.'
    });
    // Content
    const yourWords = getWordCount(yourDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    data.content = { words: yourWords, density: yourDensity };
    yourScore += yourWords > 800 ? 20 : 0;
    if (yourWords < 800) fixes.push({
      issue: `Add depth (${800 - yourWords} words recommended)`,
      what: 'Your content is shorter than ideal, limiting its ability to cover the topic comprehensively.',
      how: 'Expand with detailed sections like examples, FAQs, comparisons, or data to reach at least 800 words while maintaining quality.',
      why: 'Longer, in-depth content often ranks higher as it provides more value and signals expertise to search engines.'
    });
    // Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { total: yourImgs.length, phrase: yourAltPhrase };
    yourScore += yourAltPhrase > 0 ? 15 : 0;
    if (yourAltPhrase === 0 && yourImgs.length > 0) fixes.push({
      issue: 'Add keyword to key image alts',
      what: 'None of your images have the target keyword in alt text.',
      how: 'Add descriptive alt text including the keyword to important images (e.g., hero or feature images) without stuffing.',
      why: 'Alt text improves accessibility, enables image search traffic, and adds relevance signals.'
    });
    // Anchors
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { count: yourAnchors };
    yourScore += yourAnchors > 0 ? 10 : 0;
    if (yourAnchors === 0) fixes.push({
      issue: 'Add keyword to anchor text',
      what: 'No internal links use the target keyword in anchor text.',
      how: 'Link to related pages using the keyword or natural variations as the clickable text.',
      why: 'Keyword-rich anchors help distribute topical authority across your site.'
    });
    // URL & Schema
    data.urlSchema = {
      urlMatch: countPhrase(yourUrl, phrase),
      schema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    yourScore += data.urlSchema.urlMatch > 0 ? 10 : 0;
    if (data.urlSchema.urlMatch === 0) fixes.push({
      issue: 'Include keyword in URL',
      what: 'The page URL does not contain the target keyword.',
      how: 'Use a clean, hyphenated URL with the keyword (e.g., /your-keyword-guide) and set up redirects if changing.',
      why: 'Keyword in URL provides a clear relevance signal to users and search engines.'
    });
    if (data.urlSchema.schema === 0) fixes.push({
      issue: 'Add structured data',
      what: 'No structured data (schema markup) is detected.',
      how: 'Add JSON-LD for Article, FAQ, or relevant schema type in the <head>.',
      why: 'Schema enables rich results in search, increasing visibility and click-through rates.'
    });
    yourScore = Math.min(100, Math.round(yourScore));
    stopSpinnerLoader();
    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16">
        <!-- Big Score Circle -->
        <div class="flex justify-center my-12">
          <div class="relative">
            <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
              <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
              <circle cx="130" cy="130" r="120" stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
                      stroke-width="18" fill="none"
                      stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl font-black drop-shadow-2xl ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">${yourScore}</div>
                <div class="text-2xl text-gray-300 dark:text-gray-600">/100</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Small Metric Circles with Color Borders -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  ${[
    {name: 'Meta Title & Desc', score: data.meta.yourMatches > 0 ? 100 : 0,
      what: 'Checks if your target keyword appears naturally in the page title and meta description.',
      how: 'Add the keyword near the start of the title (keep under 60 chars) and include it once in the meta description (under 155 chars).',
      why: 'Google uses title and description for rankings and click-through rates — pages with keyword in both see 20-30% higher CTR.'},
    {name: 'H1 & Headings', score: data.h1.match > 0 ? 100 : 0,
      what: 'Evaluates whether your main H1 heading contains the target keyword.',
      how: 'Rewrite the H1 to include the exact or close-variant keyword while keeping it compelling and reader-focused.',
      why: 'H1 is the strongest on-page signal for topic relevance and helps Google understand what the page is about.'},
    {name: 'Content Density', score: parseFloat(data.content.density),
      what: 'Measures how often the target keyword appears relative to total word count (ideal 1-2%).',
      how: 'Add the keyword naturally in subheadings, intro, conclusion, and body — aim for 800+ words of in-depth content.',
      why: 'Proper density signals relevance without stuffing; longer, keyword-optimized content dominates rankings.'},
    {name: 'Image Alts', score: data.alts.phrase > 0 ? 100 : 0,
      what: 'Scans image alt texts for the presence of your target keyword in at least one relevant image.',
      how: 'Update key images (especially hero/feature images) with descriptive alt text that includes the keyword.',
      why: 'Improves accessibility, enables image search traffic, and adds another relevance signal to the page.'},
    {name: 'Anchor Text', score: data.anchors.count > 0 ? 100 : 0,
      what: 'Looks for internal links using the target keyword in their anchor text.',
      how: 'Link to related pages on your site using the keyword or close variations as the clickable text.',
      why: 'Keyword-rich anchors strengthen internal linking structure and pass topical authority across your site.'},
    {name: 'URL & Schema', score: Math.min(100, (data.urlSchema.urlMatch ? 50 : 0) + (data.urlSchema.schema ? 50 : 0)),
      what: 'Checks if the keyword is in the URL and if structured data (JSON-LD) is present.',
      how: 'Use a clean, hyphenated URL containing the keyword; add Article or FAQ schema via JSON-LD in the head.',
      why: 'Keyword in URL is a direct relevance signal; schema enables rich snippets and boosts E-E-A-T perception.'}
  ].map(m => {
    const borderColor = m.score >= 80 ? 'border-green-500' : m.score >= 60 ? 'border-yellow-500' : 'border-red-500';
    const textColor = m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-yellow-600' : 'text-red-600';
    return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
        <h4 class="text-xl font-medium mb-4">${m.name}</h4>
        <div class="relative w-24 h-24 mx-auto">
          <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
            <circle cx="48" cy="48" r="40" stroke="${m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#eab308' : '#ef4444'}"
                    stroke-width="10" fill="none" stroke-dasharray="${(m.score / 100) * 251} 251" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-3xl font-black ${textColor}">${Math.round(m.score)}</div>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
          Show Details
        </button>
        <div class="hidden mt-6 space-y-3 text-left text-sm">
          <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p>${m.what}</p>
          <p class="text-green-600 dark:text-green-400 font-bold mt-2">How to fix?</p><p>${m.how}</p>
          <p class="text-orange-600 dark:text-orange-400 font-bold mt-2">Why it matters?</p><p>${m.why}</p>
        </div>
      </div>
    `;
  }).join('')}
</div>
        <!-- Prioritized Fixes -->
        <div class="space-y-8">
          <h3 class="text-4xl font-black text-center mb-8">Prioritized Fixes</h3>
          ${fixes.length ? fixes.map(fix => `
            <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
              <div class="flex gap-6">
                <div class="text-5xl">🔧</div>
                <div>
                  <h4 class="text-2xl font-bold text-orange-600 mb-4">${fix.issue}</h4>
                  <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p>${fix.what}</p>
                  <p class="text-green-600 dark:text-green-400 font-bold mt-3">How to fix?</p><p>${fix.how}</p>
                  <p class="text-orange-600 dark:text-orange-400 font-bold mt-3">Why it matters?</p><p>${fix.why}</p>
                </div>
              </div>
            </div>
          `).join('') : '<p class="text-center text-green-400 text-2xl">Strong optimization — keep it up!</p>'}
        </div>
        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
          <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
          <p class="text-center text-7xl font-black">${yourScore >= 90 ? 'Top 3 Potential' : yourScore >= 80 ? 'Top 10' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
          <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mx-auto block px-10 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 text-xl font-bold">
            Show Info
          </button>
          <div class="hidden space-y-6 text-left max-w-3xl mx-auto text-lg">
            <p class="font-bold text-blue-300">What is it?</p><p>An estimate of SERP position potential based on on-page optimization strength. It focuses on factors you control directly (keyword placement, content depth, etc.).</p>
            <p class="font-bold text-green-300">How to improve?</p><p>Implement all prioritized fixes. Monitor Google Search Console for indexing and performance changes — expect movement within 7–30 days.</p>
            <p class="font-bold text-orange-300">Why it matters?</p><p>Pages scoring 80+ frequently reach top positions when on-page is strong. Higher scores (90+) indicate Top 3 potential with good off-page support (backlinks, authority).</p>
            <p class="text-sm italic mt-4">Note: Actual rankings depend on competition, backlinks, and user signals — this is an on-page health indicator only.</p>
          </div>
        </div>
        <!-- PDF -->
        <div class="text-center my-16">
          <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                  class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
            📄 Save as PDF
          </button>
        </div>
      </div>
    `;
  });
});