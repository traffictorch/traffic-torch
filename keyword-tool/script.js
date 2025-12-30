// Replace the entire script.js with this updated version
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
        <p id="module-text" class="text-xl text-green-600 dark:text-green-300 font-medium"></p>
      </div>
    `;
    results.classList.remove('hidden');
    document.getElementById('module-text').textContent = progressModules[0];
    currentModuleIndex = 1;
    moduleInterval = setInterval(() => {
      if (currentModuleIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[currentModuleIndex++];
      }
    }, 600);
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

    let fullUrl = yourUrl;
    if (!/^https?:\/\//i.test(yourUrl)) {
      fullUrl = 'https://' + yourUrl;
      pageUrlInput.value = fullUrl;
    }

    startSpinnerLoader();
    const yourDoc = await fetchPage(fullUrl);
    if (!yourDoc) {
      stopSpinnerLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Page not reachable.</p>`;
      return;
    }

    let yourScore = 0;
    const data = {};
    const fixes = [];

    const nextStep = async (stepIndex) => {
      if (stepIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[stepIndex];
      }
      await new Promise(resolve => setTimeout(resolve, 800));
    };

    // Enhanced data collection
    await nextStep(1);
    const titleText = yourDoc.querySelector('title')?.textContent.trim() || '';
    const descText = yourDoc.querySelector('meta[name="description"]')?.content.trim() || '';
    const titleMatch = countPhrase(titleText, phrase);
    const descMatch = countPhrase(descText, phrase);
    data.meta = { titleText, descText, titleMatch, descMatch, yourMatches: titleMatch + descMatch };

    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    if (data.meta.yourMatches === 0) fixes.push({
      issue: 'Add keyword to title and meta description',
      what: 'Your page lacks the target keyword in the title tag or meta description, reducing visibility in search results.',
      how: 'Incorporate the keyword naturally at the beginning of the title (under 60 characters) and once in the meta description (under 155 characters) to make it compelling.',
      why: 'These elements are key for search engines to match queries and encourage clicks, potentially boosting CTR by 20-30% when optimized.'
    });

    await nextStep(2);
    const headings = Array.from(yourDoc.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 5);
    const headingsData = headings.map(h => ({ tag: h.tagName, text: h.textContent.trim(), match: countPhrase(h.textContent, phrase) > 0 }));
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    data.h1 = { match: countPhrase(yourH1, phrase) };
    data.headingsData = headingsData;

    yourScore += data.h1.match > 0 ? 15 : 0;
    if (data.h1.match === 0) fixes.push({
      issue: 'Add keyword to H1',
      what: 'The main H1 heading is missing the target keyword.',
      how: 'Revise the H1 to feature the keyword or a close variant, ensuring it remains engaging and user-focused.',
      why: 'H1 tags help search engines grasp the page topic quickly, serving as a core on-page factor for better rankings.'
    });

    await nextStep(3);
    const cleanContent = getCleanContent(yourDoc);
    const yourWords = getWordCount(yourDoc);
    const yourContentMatches = countPhrase(cleanContent, phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    data.content = { words: yourWords, matches: yourContentMatches, density: yourDensity };

    yourScore += yourWords > 800 ? 20 : 0;
    if (yourWords < 800) fixes.push({
      issue: `Add depth (${800 - yourWords} words recommended)`,
      what: 'Your content is shorter than ideal, limiting its ability to cover the topic comprehensively.',
      how: 'Expand with detailed sections like examples, FAQs, comparisons, or data to reach at least 800 words while maintaining quality.',
      why: 'Longer, in-depth content often ranks higher as it provides more value and signals expertise to search engines.'
    });

    await nextStep(4);
    const yourImgs = yourDoc.querySelectorAll('img');
    const matchingAlts = Array.from(yourImgs)
      .filter(img => countPhrase(img.alt || '', phrase) > 0)
      .slice(0, 5)
      .map(img => img.alt?.trim() || '(empty alt)');
    data.alts = { total: yourImgs.length, phrase: matchingAlts.length, matchingAlts };

    yourScore += matchingAlts.length > 0 ? 15 : 0;
    if (matchingAlts.length === 0 && yourImgs.length > 0) fixes.push({
      issue: 'Add keyword to key image alts',
      what: 'None of your images have the target keyword in alt text.',
      how: 'Add descriptive alt text including the keyword to important images (e.g., hero or feature images) without stuffing.',
      why: 'Alt text improves accessibility, enables image search traffic, and adds relevance signals.'
    });

    await nextStep(5);
    const matchingAnchors = Array.from(yourDoc.querySelectorAll('a'))
      .filter(a => countPhrase(a.textContent || '', phrase) > 0)
      .slice(0, 5)
      .map(a => ({ text: (a.textContent || '').trim(), href: a.href }));
    data.anchors = { count: matchingAnchors.length, matchingAnchors };

    yourScore += matchingAnchors.length > 0 ? 10 : 0;
    if (matchingAnchors.length === 0) fixes.push({
      issue: 'Add keyword to anchor text',
      what: 'No internal links use the target keyword in anchor text.',
      how: 'Link to related pages using the keyword or natural variations as the clickable text.',
      why: 'Keyword-rich anchors help distribute topical authority across your site.'
    });

    await nextStep(6);
    const schemaScript = yourDoc.querySelector('script[type="application/ld+json"]');
    const schemaPresent = !!schemaScript;
    data.urlSchema = {
      urlMatch: countPhrase(fullUrl, phrase),
      schema: schemaPresent ? 1 : 0
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

    await nextStep(7);
    yourScore = Math.min(100, Math.round(yourScore));
    stopSpinnerLoader();

    const truncate = (str, len) => str.length > len ? str.slice(0, len - 3) + '...' : str;

    results.innerHTML = `
<!-- Big Score Circle -->
<div class="flex justify-center my-12 px-4">
  <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
    <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
      <circle cx="130" cy="130" r="120"
              stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
              stroke-width="18" fill="none"
              stroke-dasharray="${(yourScore / 100) * 754} 754"
              stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div class="text-5xl sm:text-6xl md:text-7xl font-black drop-shadow-2xl ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
          ${yourScore}
        </div>
        <div class="text-xl sm:text-2xl text-gray-300 dark:text-gray-600">/100</div>
      </div>
    </div>
  </div>
</div>

<!-- Small Metric Circles -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  ${[
    {name: 'Meta Title & Desc', score: data.meta.yourMatches > 0 ? 100 : 0,
      details: `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.meta.titleMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Title:</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(data.meta.titleText || '(none)', 80)}</span><br>
          ${data.meta.descMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Description:</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(data.meta.descText || '(none)', 80)}</span>
        </div>`,
      fixEdu: data.meta.yourMatches === 0 ? `<p class="text-gray-800 dark:text-gray-200 mb-4">The target keyword is missing from both title and description. Prioritize adding it naturally to the title first for strongest impact.</p>` : '',
      what: 'Checks if your target keyword appears naturally in the page title and meta description.',
      how: 'Add the keyword near the start of the title (keep under 60 chars) and include it once in the meta description (under 155 chars).',
      why: 'Google uses title and description for rankings and click-through rates — pages with keyword in both see 20-30% higher CTR.'},

    {name: 'H1 & Headings', score: data.h1.match > 0 ? 100 : 0,
      details: `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.headingsData.length > 0 ? data.headingsData.map(h => 
            `${h.match ? '✅' : ''} <span class="font-bold">${h.tag}:</span> <span class="text-gray-800 dark:text-gray-200">${truncate(h.text, 60)}</span>`
          ).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">No headings found</span>'}
        </div>`,
      fixEdu: data.h1.match === 0 ? `<p class="text-gray-800 dark:text-gray-200 mb-4">Your H1 is missing the keyword. Only key headings should include it naturally — avoid forcing it into every heading.</p>` : '',
      what: 'Evaluates whether your main H1 heading contains the target keyword.',
      how: 'Rewrite the H1 to include the exact or close-variant keyword while keeping it compelling and reader-focused.',
      why: 'H1 is the strongest on-page signal for topic relevance and helps Google understand what the page is about.'},

    {name: 'Content Density', score: parseFloat(data.content.density),
      details: `
        <div class="mt-4 text-center space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Word count:</span> ${data.content.words}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Keyword mentions:</span> ${data.content.matches}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Density:</span> ${data.content.density}% (ideal 1-2%)</p>
        </div>`,
      fixEdu: data.content.density < 0.5 || data.content.density > 3 || data.content.words < 800 ? 
        `<p class="text-gray-800 dark:text-gray-200 mb-4">
          ${data.content.words < 800 ? 'Low word count — add more depth. ' : ''}
          ${data.content.density < 0.5 ? 'Keyword appears too rarely — include naturally in intro, subheads, body. ' : ''}
          ${data.content.density > 3 ? 'Density too high — reduce repetitions to avoid stuffing penalties. ' : ''}
          Density = (mentions ÷ words) × 100.
        </p>` : '',
      what: 'Measures how often the target keyword appears relative to total word count (ideal 1-2%).',
      how: 'Add the keyword naturally in subheadings, intro, conclusion, and body — aim for 800+ words of in-depth content.',
      why: 'Proper density signals relevance without stuffing; longer, keyword-optimized content dominates rankings.'},

    {name: 'Image Alts', score: data.alts.phrase > 0 ? 100 : 0,
      details: `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200 font-bold">Matching alts (${data.alts.phrase}/${data.alts.total} images):</p>
          ${data.alts.matchingAlts.length > 0 ? data.alts.matchingAlts.map(alt => `✅ <span class="text-gray-800 dark:text-gray-200">${truncate(alt, 60)}</span>`).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">None found</span>'}
        </div>`,
      fixEdu: data.alts.phrase === 0 && data.alts.total > 0 ? `<p class="text-gray-800 dark:text-gray-200 mb-4">Focus on descriptive alt text for key images (hero, product). Include keyword naturally only where relevant.</p>` : '',
      what: 'Scans image alt texts for the presence of your target keyword in at least one relevant image.',
      how: 'Update key images (especially hero/feature images) with descriptive alt text that includes the keyword.',
      why: 'Improves accessibility, enables image search traffic, and adds another relevance signal to the page.'},

    {name: 'Anchor Text', score: data.anchors.count > 0 ? 100 : 0,
      details: `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200 font-bold">Matching anchors (${data.anchors.count} found):</p>
          ${data.anchors.matchingAnchors.length > 0 ? data.anchors.matchingAnchors.map(a => `✅ <span class="text-gray-800 dark:text-gray-200">${truncate(a.text, 50)}</span> → ${truncate(a.href, 40)}`).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">None found</span>'}
        </div>`,
      fixEdu: data.anchors.count === 0 ? `<p class="text-gray-800 dark:text-gray-200 mb-4">Aim for 1-3 natural internal links using the keyword. Avoid over-optimization.</p>` : '',
      what: 'Looks for internal links using the target keyword in their anchor text.',
      how: 'Link to related pages on your site using the keyword or close variations as the clickable text.',
      why: 'Keyword-rich anchors strengthen internal linking structure and pass topical authority across your site.'},

    {name: 'URL & Schema', score: Math.min(100, (data.urlSchema.urlMatch ? 50 : 0) + (data.urlSchema.schema ? 50 : 0)),
      details: `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.urlSchema.urlMatch > 0 ? '✅' : '❌'} <span class="font-bold">Keyword in URL</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(fullUrl, 80)}</span><br>
          ${data.urlSchema.schema ? '✅' : '❌'} <span class="font-bold">Structured Data (Schema)</span>
        </div>`,
      fixEdu: !data.urlSchema.urlMatch || !data.urlSchema.schema ? 
        `<p class="text-gray-800 dark:text-gray-200 mb-4">
          ${!data.urlSchema.urlMatch ? 'Add keyword to URL path for relevance. ' : ''}
          ${!data.urlSchema.schema ? 'Implement JSON-LD schema (Article/FAQ) for rich results. ' : ''}
        </p>` : '',
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
        ${m.details}
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
          More Details
        </button>
        <div class="hidden mt-6 space-y-3 text-left text-sm">
          ${m.fixEdu}
          <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p class="text-gray-800 dark:text-gray-200">${m.what}</p>
          <p class="text-green-600 dark:text-green-400 font-bold mt-2">How to fix?</p><p class="text-gray-800 dark:text-gray-200">${m.how}</p>
          <p class="text-orange-600 dark:text-orange-400 font-bold mt-2">Why it matters?</p><p class="text-gray-800 dark:text-gray-200">${m.why}</p>
        </div>
      </div>
    `;
  }).join('')}
</div>

<!-- Prioritized Fixes -->
<div class="space-y-8">
  <h3 class="text-4xl font-bold text-center text-orange-600 mb-8">Prioritized Fixes</h3>
  ${fixes.length ? fixes.map(fix => `
    <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
      <div class="flex gap-6">
        <div class="text-5xl">🔧</div>
        <div class="w-full">
          <h4 class="text-2xl font-bold text-orange-600 mb-4">${fix.issue}</h4>
          <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p class="text-gray-800 dark:text-gray-200">${fix.what}</p>
          <p class="text-green-600 dark:text-green-400 font-bold mt-3">How to fix?</p><p class="text-gray-800 dark:text-gray-200">${fix.how}</p>
          <p class="text-orange-600 dark:text-orange-400 font-bold mt-3">Why it matters?</p><p class="text-gray-800 dark:text-gray-200">${fix.why}</p>
        </div>
      </div>
    </div>
  `).join('') : '<p class="text-center text-green-500 text-2xl font-bold">Strong optimization — keep it up!</p>'}
</div>

<!-- Predictive Rank Forecast -->
<div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
  <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
  <p class="text-center text-4xl font-black">${yourScore >= 90 ? 'Top 3 Potential' : yourScore >= 80 ? 'Top 10' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
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

<!-- PDF Button -->
<div class="text-center my-16">
  <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
          class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
    <span class="flex items-center gap-6">📄 Save Report as PDF</span>
    <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </button>
</div>
    `;
  });
});