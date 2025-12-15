document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const yourInput = document.getElementById('page-url'); // Updated ID
  const compInput = document.getElementById('competitor-url'); // If you have competitor input, add it; otherwise remove
  const phraseInput = document.getElementById('target-keyword'); // Updated ID
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
    const phrase = phraseInput.value.trim();
    if (!yourUrl || !phrase) return;
    results.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing "${phrase}" — please wait...
      </div>
    `;
    results.classList.remove('hidden');
    const yourDoc = await fetchPage(yourUrl);
    if (!yourDoc) {
      results.innerHTML = `<p class="text-red-500 text-center text-2xl py-20">Error: Page could not be loaded.</p>`;
      return;
    }
    let yourScore = 0;
    const data = {};
    data.meta = {
      yourTitle: yourDoc.querySelector('title')?.textContent.trim() || '',
      yourDesc: yourDoc.querySelector('meta[name="description"]')?.content.trim() || '',
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
    data.headings = {
      yourH1Match: countPhrase(yourH1, phrase),
      yourTotal: yourDoc.querySelectorAll('h1,h2,h3,h4,h5,h6').length
    };
    yourScore += data.headings.yourH1Match > 0 ? 15 : 0;
    const yourWords = getWordCount(yourDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    data.content = { yourWords, yourDensity, yourContentMatches };
    yourScore += yourWords > 800 ? 20 : 0;
    const yourImgs = yourDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { yourTotal: yourImgs.length, yourPhrase: yourAltPhrase };
    yourScore += yourAltPhrase > 0 ? 15 : 0;
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { your: yourAnchors };
    yourScore += yourAnchors > 0 ? 10 : 0;
    data.urlSchema = {
      yourUrlMatch: countPhrase(yourUrl, phrase),
      yourSchema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    yourScore += data.urlSchema.yourUrlMatch > 0 ? 10 : 0;
    yourScore = Math.min(100, Math.round(yourScore));
    const fixes = [];
    if (data.meta.yourMatches === 0) fixes.push("Add phrase to title and meta description.");
    if (yourWords < 800) fixes.push(`Add ${800 - yourWords} words of depth.`);
    if (yourAltPhrase === 0 && yourImgs.length > 0) fixes.push("Include phrase in key image alt text.");
    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16">
        <!-- Big Score -->
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
        <!-- Fixes -->
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
        <!-- PDF -->
        <div class="text-center my-16">
          <button onclick="window.print();" class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
            📄 Save as PDF
          </button>
        </div>
      </div>
    `;
  });
});