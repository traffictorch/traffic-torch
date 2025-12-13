document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const yourInput = document.getElementById('your-url');
  const compInput = document.getElementById('competitor-url');
  const phraseInput = document.getElementById('target-phrase');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

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
    const yourUrl = yourInput.value.trim();
    const compUrl = compInput.value.trim();
    const phrase = phraseInput.value.trim();
    if (!yourUrl || !compUrl || !phrase) return;

    results.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing competition for "${phrase}" — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    const [yourDoc, compDoc] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);

    if (!yourDoc || !compDoc) {
      results.innerHTML = `<p class="text-red-500 text-center text-2xl py-20">Error: One or both pages could not be loaded.</p>`;
      return;
    }

    let yourScore = 0;
    let compScore = 0;

    // Module data collection
    const data = {};

    // Meta Title & Description
    data.meta = {
      yourTitle: yourDoc.querySelector('title')?.textContent.trim() || '',
      compTitle: compDoc.querySelector('title')?.textContent.trim() || '',
      yourDesc: yourDoc.querySelector('meta[name="description"]')?.content.trim() || '',
      compDesc: compDoc.querySelector('meta[name="description"]')?.content.trim() || '',
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase),
      compMatches: countPhrase(compDoc.querySelector('title')?.textContent + compDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    compScore += data.meta.compMatches > 0 ? 25 : 0;

    // H1 & Headings
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    const compH1 = compDoc.querySelector('h1')?.textContent.trim() || '';
    data.headings = {
      yourH1Match: countPhrase(yourH1, phrase),
      compH1Match: countPhrase(compH1, phrase),
      yourTotal: yourDoc.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      compTotal: compDoc.querySelectorAll('h1,h2,h3,h4,h5,h6').length
    };
    yourScore += data.headings.yourH1Match > 0 ? 15 : 0;
    compScore += data.headings.compH1Match > 0 ? 15 : 0;

    // Content Density
    const yourWords = getWordCount(yourDoc);
    const compWords = getWordCount(compDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const compContentMatches = countPhrase(getCleanContent(compDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    const compDensity = compWords ? (compContentMatches / compWords * 100).toFixed(1) : 0;
    data.content = { yourWords, compWords, yourDensity, compDensity, yourContentMatches, compContentMatches };
    yourScore += yourWords > 800 ? 20 : 0;
    compScore += compWords > 800 ? 20 : 0;

    // Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const compImgs = compDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    const compAltPhrase = Array.from(compImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { yourTotal: yourImgs.length, compTotal: compImgs.length, yourPhrase: yourAltPhrase, compPhrase: compAltPhrase };
    yourScore += yourAltPhrase > 0 ? 15 : 0;
    compScore += compAltPhrase > 0 ? 15 : 0;

    // Anchors
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    const compAnchors = Array.from(compDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { your: yourAnchors, comp: compAnchors };
    yourScore += yourAnchors > 0 ? 10 : 0;
    compScore += compAnchors > 0 ? 10 : 0;

    // URL & Schema
    data.urlSchema = {
      yourUrlMatch: countPhrase(yourUrl, phrase),
      compUrlMatch: countPhrase(compUrl, phrase),
      yourSchema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0,
      compSchema: compDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    yourScore += data.urlSchema.yourUrlMatch > 0 ? 10 : 0;
    compScore += data.urlSchema.compUrlMatch > 0 ? 10 : 0;

    yourScore = Math.min(100, Math.round(yourScore));
    compScore = Math.min(100, Math.round(compScore));

    const forecast = yourScore > compScore ? 'You Win – Higher Potential' : yourScore < compScore ? 'Competitor Leads' : 'Neck & Neck';

    const fixes = [];
    if (yourScore < compScore) {
      if (data.meta.yourMatches < data.meta.compMatches) fixes.push("Add phrase to title and meta description.");
      if (yourWords < compWords) fixes.push(`Add ${compWords - yourWords} words of depth.`);
      if (yourAltPhrase < compAltPhrase) fixes.push("Include phrase in key image alt text.");
    }

    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16 animate-in">
        <!-- Big Phrase Power Score Circles (Side by Side) -->
        <div class="grid md:grid-cols-2 gap-12 my-12">
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Your Phrase Power Score</h3>
            <div class="relative mx-auto">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#gradYou)" stroke-width="18" fill="none"
                        stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradYou">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-7xl font-black text-white drop-shadow-2xl glow">${yourScore}</div>
              </div>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Competitor Phrase Power Score</h3>
            <div class="relative mx-auto">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#gradComp)" stroke-width="18" fill="none"
                        stroke-dasharray="${(compScore / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradComp">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-7xl font-black text-white drop-shadow-2xl glow">${compScore}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gap Verdict -->
        <div class="text-center mb-12">
          <p class="text-4xl font-black mb-8">
            Competitive Gap: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${forecast}</span>
          </p>
          <p class="text-xl text-gray-400">Target phrase: "${phrase}"</p>
        </div>

        <!-- Small Metric Circles (6 metrics) -->
        <div class="grid md:grid-cols-3 gap-8 my-16">
          ${[
            {name: 'Meta Title & Desc', you: data.meta.yourMatches > 0 ? 100 : 0, comp: data.meta.compMatches > 0 ? 100 : 0},
            {name: 'H1 & Headings', you: data.headings.yourH1Match > 0 ? 100 : 0, comp: data.headings.compH1Match > 0 ? 100 : 0},
            {name: 'Content Density', you: parseFloat(data.content.yourDensity), comp: parseFloat(data.content.compDensity)},
            {name: 'Image Alts', you: data.alts.yourPhrase > 0 ? 100 : 0, comp: data.alts.compPhrase > 0 ? 100 : 0},
            {name: 'Anchor Text', you: data.anchors.your > 0 ? 100 : 0, comp: data.anchors.comp > 0 ? 100 : 0},
            {name: 'URL & Schema', you: data.urlSchema.yourUrlMatch + data.urlSchema.yourSchema > 0 ? 100 : 0, comp: data.urlSchema.compUrlMatch + data.urlSchema.compSchema > 0 ? 100 : 0}
          ].map(m => `
            <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
              <h4 class="text-xl font-medium mb-4">${m.name}</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="relative w-24 h-24 mx-auto">
                    <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                      <circle cx="48" cy="48" r="40" stroke="#fb923c" stroke-width="10" fill="none"
                              stroke-dasharray="${(m.you / 100) * 251} 251" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-3xl font-black">You<br>${m.you}%</div>
                  </div>
                </div>
                <div>
                  <div class="relative w-24 h-24 mx-auto">
                    <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                      <circle cx="48" cy="48" r="40" stroke="#fb923c" stroke-width="10" fill="none"
                              stroke-dasharray="${(m.comp / 100) * 251} 251" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-3xl font-black">Comp<br>${m.comp}%</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Prioritized Fixes -->
        <div class="space-y-8">
          <h3 class="text-4xl font-black text-center mb-8">Prioritized Gap Fixes</h3>
          ${fixes.length ? fixes.map(fix => `
            <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
              <div class="flex gap-6">
                <div class="text-5xl">🔧</div>
                <div class="text-lg leading-relaxed">${fix}</div>
              </div>
            </div>
          `).join('') : '<p class="text-center text-green-400 text-2xl">You are ahead or tied — strong position!</p>'}
        </div>

        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
          <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
          <p class="text-center text-7xl font-black">${forecast}</p>
          <div class="grid md:grid-cols-3 gap-6 text-left">
            <div class="p-6 bg-white/10 rounded-2xl">
              <p class="font-bold text-blue-300 text-xl mb-2">Your Score</p>
              <p class="text-4xl font-black">${yourScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl">
              <p class="font-bold text-green-300 text-xl mb-2">Competitor Score</p>
              <p class="text-4xl font-black">${compScore}/100</p>
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