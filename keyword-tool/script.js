document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const targetKeywordInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const progressMessages = [
    "Fetching page...",
    "Analyzing meta...",
    "Analyzing headings...",
    "Analyzing content...",
    "Analyzing image alts...",
    "Analyzing anchors...",
    "Analyzing URL & schema...",
    "Finalizing score..."
  ];

  let messageIndex = 0;
  let interval;

  function startLoader() {
    results.innerHTML = `
      <div class="fixed inset-x-0 bottom-0 z-50">
        <div id="progress-bar" class="h-12 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 opacity-50 animate-pulse"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span id="progress-text" class="text-white font-bold text-xl drop-shadow-lg">Fetching page...</span>
          </div>
        </div>
      </div>
    `;
    results.classList.remove('hidden');
    messageIndex = 1;
    interval = setInterval(() => {
      if (messageIndex < progressMessages.length) {
        document.getElementById('progress-text').textContent = progressMessages[messageIndex++];
      }
    }, 1200);
  }

  function stopLoader() {
    clearInterval(interval);
    document.querySelector('#progress-bar')?.parentElement.remove();
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

    startLoader();

    const yourDoc = await fetchPage(yourUrl);
    if (!yourDoc) {
      stopLoader();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Page not reachable.</p>`;
      return;
    }

    let yourScore = 0;
    const data = {};
    const fixes = [];

    // Module 1: Meta Title & Desc
    data.meta = {
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    const metaScore = data.meta.yourMatches > 0 ? 100 : 0;
    yourScore += metaScore / 100 * 25;
    if (metaScore < 100) fixes.push({
      issue: 'Add keyword to title and meta description',
      what: 'No keyword in meta',
      how: 'Include in <title> and meta description tag',
      why: 'Boosts CTR 20-30%'
    });

    // Module 2: H1 & Headings
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    data.headings = {
      match: countPhrase(yourH1, phrase),
      total: yourDoc.querySelectorAll('h1,h2,h3,h4,h5,h6').length
    };
    const headingsScore = data.headings.match > 0 ? 100 : 0;
    yourScore += headingsScore / 100 * 15;
    if (headingsScore < 100) fixes.push({
      issue: 'Add keyword to H1',
      what: 'H1 missing keyword',
      how: 'Update main heading',
      why: 'Strongest relevance signal'
    });

    // Module 3: Content Density
    const yourWords = getWordCount(yourDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    data.content = { words: yourWords, density: yourDensity };
    const contentScore = yourDensity >= 1 ? 100 : (yourDensity / 1 * 100);
    yourScore += contentScore / 100 * 20;
    if (contentScore < 100) fixes.push({
      issue: `Improve density to 1-2.5% (currently ${yourDensity}%)`,
      what: 'Keyword not used enough in content',
      how: 'Add keyword 3-5 times naturally',
      why: 'Balances relevance without stuffing'
    });

    // Module 4: Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { total: yourImgs.length, phrase: yourAltPhrase };
    const altsScore = yourAltPhrase > 0 ? 100 : 0;
    yourScore += altsScore / 100 * 15;
    if (altsScore < 100) fixes.push({
      issue: 'Add keyword to image alts',
      what: 'No keyword in alts',
      how: 'Use descriptive alts with keyword',
      why: 'Image SEO + accessibility'
    });

    // Module 5: Anchor Text
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { count: yourAnchors };
    const anchorsScore = yourAnchors > 0 ? 100 : 0;
    yourScore += anchorsScore / 100 * 10;
    if (anchorsScore < 100) fixes.push({
      issue: 'Add keyword to anchor text',
      what: 'No links with keyword',
      how: 'Link internally with keyword',
      why: 'Boosts internal relevance'
    });

    // Module 6: URL & Schema
    data.urlSchema = {
      urlMatch: countPhrase(yourUrl, phrase),
      schema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    const urlSchemaScore = (data.urlSchema.urlMatch > 0 ? 50 : 0) + (data.urlSchema.schema > 0 ? 50 : 0);
    yourScore += urlSchemaScore / 100 * 10;
    if (data.urlSchema.urlMatch === 0) fixes.push({
      issue: 'Include keyword in URL',
      what: 'URL missing keyword',
      how: 'Use hyphens: your-keyword-page',
      why: 'Strong relevance signal'
    });
    if (data.urlSchema.schema === 0) fixes.push({
      issue: 'Add structured data',
      what: 'No schema markup',
      how: 'Add JSON-LD Article/FAQ',
      why: 'Rich results + E-E-A-T boost'
    });

    yourScore = Math.min(100, Math.round(yourScore));

    stopLoader();

    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16">
        <!-- Big Score Circle (Red to Green) -->
        <div class="flex justify-center my-12">
          <div class="relative">
            <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
              <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
              <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                      stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round"/>
              <defs>
                <linearGradient id="bigGradient">
                  <stop offset="0%" stop-color="#ef4444"/> 
                  <stop offset="50%" stop-color="#fb923c"/>
                  <stop offset="100%" stop-color="#22c55e"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl font-black text-white drop-shadow-2xl">${yourScore}</div>
                <div class="text-2xl text-white/90">/100</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Small Metric Circles -->
        <div class="grid md:grid-cols-3 gap-8 my-16">
          ${[
            {name: 'Meta Title & Desc', score: metaScore, what: 'Phrase in title/desc', how: 'Edit <title> and meta tag', why: 'CTR boost 20%'},
            {name: 'H1 & Headings', score: headingsScore, what: 'Keyword in H1/headings', how: 'Update H1', why: 'Relevance signal'},
            {name: 'Content Density', score: contentScore, what: 'Keyword usage in body', how: 'Add 3-5 times', why: 'Balances relevance'},
            {name: 'Image Alts', score: altsScore, what: 'Keyword in alt text', how: 'Describe images with keyword', why: 'Image SEO'},
            {name: 'Anchor Text', score: anchorsScore, what: 'Keyword in links', how: 'Internal links with keyword', why: 'Internal authority'},
            {name: 'URL & Schema', score: urlSchemaScore, what: 'Keyword in URL/schema', how: 'Hyphenated URL + JSON-LD', why: 'Rich results'}
          ].map(m => {
            const borderColor = m.score >= 80 ? 'border-green-500' : m.score >= 60 ? 'border-yellow-500' : 'border-red-500';
            return `
              <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
                <h4 class="text-xl font-medium mb-4">${m.name}</h4>
                <div class="relative w-24 h-24 mx-auto">
                  <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                    <circle cx="48" cy="48" r="40" stroke="${m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#eab308' : '#ef4444'}" stroke-width="10" fill="none" stroke-dasharray="${(m.score / 100) * 251} 251" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-3xl font-black">${Math.round(m.score)}</div>
                </div>
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
                  Show Fixes
                </button>
                <div class="hidden mt-6 space-y-3 text-left text-sm">
                  <p class="text-blue-500 font-bold">What:</p><p>${m.what}</p>
                  <p class="text-green-500 font-bold">How:</p><p>${m.how}</p>
                  <p class="text-orange-500 font-bold">Why:</p><p>${m.why}</p>
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
                  <p class="text-blue-500 font-bold">What:</p><p>${fix.what}</p>
                  <p class="text-green-500 font-bold mt-2">How:</p><p>${fix.how}</p>
                  <p class="text-orange-500 font-bold mt-2">Why:</p><p>${fix.why}</p>
                </div>
              </div>
            </div>
          `).join('') : '<p class="text-center text-green-400 text-2xl">Strong optimization — keep it up!</p>'}
        </div>
        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
          <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
          <p class="text-center text-7xl font-black">${yourScore >= 80 ? 'Top 10' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
          <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mx-auto block px-10 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 text-xl font-bold">
            Show Info
          </button>
          <div class="hidden space-y-6 text-left max-w-3xl mx-auto text-lg">
            <p class="font-bold text-blue-300">What:</p><p>SERP position estimate based on on-page optimization vs 2025 ranking factors.</p>
            <p class="font-bold text-green-300">How:</p><p>Fix all prioritized gaps → monitor GSC → expect movement in 7–30 days.</p>
            <p class="font-bold text-orange-300">Why:</p><p>Pages scoring 80+ consistently rank Top 10. 90+ = Top 3 potential.</p>
          </div>
        </div>
        <!-- PDF -->
        <div class="text-center my-16">
          <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                  class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
            📄 Save as PDF (with all details)
          </button>
        </div>
      </div>
    `;
  });
});