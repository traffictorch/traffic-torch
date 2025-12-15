document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const targetKeywordInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const progressMessages = [
    "Fetching page...",
    "Analyzing meta & headings...",
    "Checking content density...",
    "Scanning image alts...",
    "Evaluating anchors...",
    "Checking URL & schema...",
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
      yourTitle: yourDoc.querySelector('title')?.textContent.trim() || '',
      yourDesc: yourDoc.querySelector('meta[name="description"]')?.content.trim() || '',
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    if (data.meta.yourMatches === 0) fixes.push('Add keyword to title and meta description');

    // Module 2: H1 & Headings
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    data.headings = {
      yourH1Match: countPhrase(yourH1, phrase),
      yourTotal: yourDoc.querySelectorAll('h1,h2,h3,h4,h5,h6').length
    };
    yourScore += data.headings.yourH1Match > 0 ? 15 : 0;
    if (data.headings.yourH1Match === 0) fixes.push('Add keyword to H1');

    // Module 3: Content Density
    const yourWords = getWordCount(yourDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    data.content = { yourWords, yourDensity, yourContentMatches };
    yourScore += yourWords > 800 ? 20 : 0;
    if (yourWords < 800) fixes.push(`Add more depth (${800 - yourWords} words recommended)`);

    // Module 4: Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { yourTotal: yourImgs.length, yourPhrase: yourAltPhrase };
    yourScore += yourAltPhrase > 0 ? 15 : 0;
    if (yourAltPhrase === 0 && yourImgs.length > 0) fixes.push('Add keyword to key image alts');

    // Module 5: Anchor Text
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { your: yourAnchors };
    yourScore += yourAnchors > 0 ? 10 : 0;
    if (yourAnchors === 0) fixes.push('Add keyword to anchor text links');

    // Module 6: URL & Schema
    data.urlSchema = {
      yourUrlMatch: countPhrase(yourUrl, phrase),
      yourSchema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    yourScore += data.urlSchema.yourUrlMatch > 0 ? 10 : 0;
    if (data.urlSchema.yourUrlMatch === 0) fixes.push('Include keyword in URL slug');
    if (data.urlSchema.yourSchema === 0) fixes.push('Add structured data schema');

    yourScore = Math.min(100, Math.round(yourScore));

    stopLoader();

    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16">
        <!-- Big Score Circle -->
        <div class="flex justify-center my-12">
          <div class="relative">
            <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
              <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
              <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                      stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round"/>
              <defs>
                <linearGradient id="bigGradient">
                  <stop offset="0%" stop-color="#ef4444"/>
                  <stop offset="100%" stop-color="#22c55e"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-7xl font-black text-white drop-shadow-2xl">${yourScore}</div>
                <div class="text-2xl text-white/90">/100</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Small Metric Circles -->
        <div class="grid md:grid-cols-3 gap-8 my-16">
          ${[
            {name: 'Meta Title & Desc', you: data.meta.yourMatches > 0 ? 100 : 0},
            {name: 'H1 & Headings', you: data.headings.yourH1Match > 0 ? 100 : 0},
            {name: 'Content Density', you: parseFloat(data.content.yourDensity)},
            {name: 'Image Alts', you: data.alts.yourPhrase > 0 ? 100 : 0},
            {name: 'Anchor Text', you: data.anchors.your > 0 ? 100 : 0},
            {name: 'URL & Schema', you: data.urlSchema.yourUrlMatch + data.urlSchema.yourSchema > 0 ? 100 : 0}
          ].map(m => `
            <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
              <h4 class="text-xl font-medium mb-4">${m.name}</h4>
              <div class="relative w-24 h-24 mx-auto">
                <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                  <circle cx="48" cy="48" r="40" stroke="#fb923c" stroke-width="10" fill="none"
                          stroke-dasharray="${(m.you / 100) * 251} 251" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-3xl font-black">${m.you}%</div>
              </div>
            </div>
          `).join('')}
        </div>
        <!-- Prioritized Fixes -->
        <div class="space-y-8">
          <h3 class="text-4xl font-black text-center mb-8">Prioritized Fixes</h3>
          ${fixes.length ? fixes.map(fix => `
            <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
              <div class="flex gap-6">
                <div class="text-5xl">🔧</div>
                <div class="text-lg leading-relaxed">${fix}</div>
              </div>
            </div>
          `).join('') : '<p class="text-center text-green-400 text-2xl">Strong optimization — keep it up!</p>'}
        </div>
        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
          <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
          <p class="text-center text-7xl font-black">${yourScore >= 80 ? 'Top 10' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+'}</p>
          <div class="grid md:grid-cols-3 gap-6 text-left">
            <div class="p-6 bg-white/10 rounded-2xl">
              <p class="font-bold text-blue-300 text-xl mb-2">Your Score</p>
              <p class="text-4xl font-black">${yourScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl">
              <p class="font-bold text-green-300 text-xl mb-2">Ideal Score</p>
              <p class="text-4xl font-black">80+/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl">
              <p class="font-bold text-orange-300 text-xl mb-2">Gap Insight</p>
              <p class="text-lg">Higher phrase power = stronger relevance signals in 2025</p>
            </div>
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