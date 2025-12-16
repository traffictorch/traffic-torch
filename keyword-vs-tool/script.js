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

  const getCircleColor = (score) => score < 60 ? '#ef4444' : score < 80 ? '#fb923c' : '#22c55e';
  const getTextColorClass = (score) => score < 60 ? 'text-red-600 dark:text-red-400' : score < 80 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const yourUrl = yourInput.value.trim();
    const compUrl = compInput.value.trim();
    const phrase = phraseInput.value.trim();
    if (!yourUrl || !compUrl || !phrase) return;

    results.classList.remove('hidden');
    results.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-32 h-32 border-8 border-gray-200 rounded-full"></div>
          <div class="absolute inset-0 w-32 h-32 border-8 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p class="mt-8 text-2xl font-medium text-gray-600 dark:text-gray-300">Analyzing pages for "${phrase}"...</p>
        <div id="progress-modules" class="mt-12 space-y-4 w-full max-w-md"></div>
      </div>
    `;

    const progressModules = document.getElementById('progress-modules');
    const messages = [
      "Fetching your page via secure proxy",
      "Fetching competitor page",
      "Parsing meta title & description",
      "Scanning headings (H1-H6)",
      "Analyzing main content depth & density",
      "Checking image alt texts",
      "Reviewing internal anchor text",
      "Evaluating URL structure & schema markup",
      "Calculating Phrase Power Scores",
      "Generating prioritized gap fixes"
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < messages.length) {
        progressModules.innerHTML += `
          <div class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
            <div class="w-8 h-8 bg-orange-500 rounded-full animate-pulse"></div>
            <p class="text-lg">${messages[idx]}</p>
          </div>
        `;
        idx++;
      } else {
        clearInterval(interval);
      }
    }, Math.random() * 900 + 600);
    results.dataset.interval = interval;

    const [yourDoc, compDoc] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);
    if (results.dataset.interval) clearInterval(results.dataset.interval);

    if (!yourDoc || !compDoc) {
      results.innerHTML = `<p class="text-red-500 dark:text-red-400 text-center text-2xl py-20">Error: One or both pages could not be loaded.</p>`;
      return;
    }

    let yourScore = 0;
    let compScore = 0;
    const data = {};

    // Meta Title & Description
    data.meta = {
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase),
      compMatches: countPhrase(compDoc.querySelector('title')?.textContent + compDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    compScore += data.meta.compMatches > 0 ? 25 : 0;

    // H1 & Headings
    data.headings = {
      yourH1Match: countPhrase(yourDoc.querySelector('h1')?.textContent.trim() || '', phrase),
      compH1Match: countPhrase(compDoc.querySelector('h1')?.textContent.trim() || '', phrase)
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
    data.content = { yourWords, compWords, yourDensity, compDensity };
    yourScore += yourWords > 800 ? 20 : 0;
    compScore += compWords > 800 ? 20 : 0;

    // Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const compImgs = compDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    const compAltPhrase = Array.from(compImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { yourPhrase: yourAltPhrase, compPhrase: compAltPhrase };
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

    const forecastTier = yourScore >= 90 ? 'Top 3 Potential' : yourScore >= 80 ? 'Top 10 Likely' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+';
    const gap = yourScore > compScore ? '+' + (yourScore - compScore) : yourScore < compScore ? (compScore - yourScore) : '±0';

    const fixes = [];
    if (yourScore < compScore) {
      if (data.meta.yourMatches === 0 && data.meta.compMatches > 0) fixes.push("Add phrase to title and meta description.");
      if (yourWords < compWords) fixes.push(`Add ${compWords - yourWords} words of depth.`);
      if (yourAltPhrase === 0 && compAltPhrase > 0) fixes.push("Include phrase in key image alt text.");
    }

    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16 animate-in">
        <!-- Big Score Circles -->
        <div class="grid md:grid-cols-2 gap-12 my-12">
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Your Phrase Power Score</h3>
            <div class="relative mx-auto w-64 h-64">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="${getCircleColor(yourScore)}" stroke-width="20" fill="none"
                        stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-7xl font-black ${getTextColorClass(yourScore)} drop-shadow-2xl">${yourScore}</span>
                <span class="text-2xl text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Competitor Phrase Power Score</h3>
            <div class="relative mx-auto w-64 h-64">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="${getCircleColor(compScore)}" stroke-width="20" fill="none"
                        stroke-dasharray="${(compScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-7xl font-black ${getTextColorClass(compScore)} drop-shadow-2xl">${compScore}</span>
                <span class="text-2xl text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gap Verdict -->
        <div class="text-center mb-12">
          <p class="text-4xl font-black mb-8">
            Competitive Gap: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
              ${yourScore > compScore ? 'You Lead' : yourScore < compScore ? 'Competitor Leads' : 'Neck & Neck'}
            </span>
          </p>
          <p class="text-xl text-gray-400">Target phrase: "${phrase}"</p>
        </div>

			 <!-- Small Metric Cards – Match Other Tools Design (Show Details Button) -->
        <div class="grid md:grid-cols-3 gap-8 my-16">
          ${[
            {
              name: 'Meta Title & Desc',
              you: data.meta.yourMatches > 0 ? 100 : 0,
              comp: data.meta.compMatches > 0 ? 100 : 0,
              border: data.meta.yourMatches > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Checks if your target phrase appears naturally in the page title and meta description.",
                how: "Add the keyword near the start of the title (keep under 60 chars) and include it once in the meta description (under 155 chars).",
                why: "Google uses title and description for rankings and click-through rates — pages with keyword in both see 20-30% higher CTR."
              }
            },
            {
              name: 'H1 & Headings',
              you: data.headings.yourH1Match > 0 ? 100 : 0,
              comp: data.headings.compH1Match > 0 ? 100 : 0,
              border: data.headings.yourH1Match > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Evaluates whether your main H1 heading contains the target phrase.",
                how: "Rewrite the H1 to include the exact or close-variant phrase while keeping it compelling and reader-focused.",
                why: "H1 is the strongest on-page signal for topic relevance and helps Google understand what the page is about."
              }
            },
            {
              name: 'Content Density',
              you: parseFloat(data.content.yourDensity),
              comp: parseFloat(data.content.compDensity),
              border: parseFloat(data.content.yourDensity) >= 1 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Measures how often the target phrase appears relative to total word count (ideal 1-2%).",
                how: "Add the phrase naturally in subheadings, intro, conclusion, and body — aim for 800+ words of in-depth content.",
                why: "Proper density signals relevance without stuffing; longer, keyword-optimized content dominates rankings."
              }
            },
            {
              name: 'Image Alts',
              you: data.alts.yourPhrase > 0 ? 100 : 0,
              comp: data.alts.compPhrase > 0 ? 100 : 0,
              border: data.alts.yourPhrase > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Checks if any image alt text contains the target phrase.",
                how: "Update alt text of key images (hero, featured) to include the phrase descriptively.",
                why: "Improves accessibility, enables image search traffic, and adds extra relevance signals."
              }
            },
            {
              name: 'Anchor Text',
              you: data.anchors.your > 0 ? 100 : 0,
              comp: data.anchors.comp > 0 ? 100 : 0,
              border: data.anchors.your > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Looks for internal links using the target phrase as anchor text.",
                how: "Add or edit internal links to use the phrase naturally where relevant.",
                why: "Strengthens site-wide relevance and improves internal PageRank flow."
              }
            },
            {
              name: 'URL & Schema',
              you: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)),
              comp: Math.min(100, (data.urlSchema.compUrlMatch > 0 ? 50 : 0) + (data.urlSchema.compSchema ? 50 : 0)),
              border: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)) >= 50 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Combines URL keyword inclusion and structured data presence.",
                how: "Include phrase in URL slug if possible; add JSON-LD schema (FAQ, Article, etc.).",
                why: "Descriptive URLs aid crawling; schema unlocks rich snippets and better SERP visibility."
              }
            }
          ].map((m, idx) => `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-l-8 ${m.border}">
              <h4 class="text-xl font-bold text-center mb-6">${m.name}</h4>
              <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="14" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.you)}" stroke-width="14" fill="none"
                              stroke-dasharray="${(m.you / 100) * 352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-4xl font-black ${getTextColorClass(m.you)}">${Math.round(m.you)}</span>
                    </div>
                  </div>
                  <p class="mt-4 text-lg font-medium">You</p>
                </div>
                <div class="text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="14" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.comp)}" stroke-width="14" fill="none"
                              stroke-dasharray="${(m.comp / 100) * 352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-4xl font-black ${getTextColorClass(m.comp)}">${Math.round(m.comp)}</span>
                    </div>
                  </div>
                  <p class="mt-4 text-lg font-medium">Comp</p>
                </div>
              </div>
              <button onclick="this.closest('div').querySelector('.educ-details').classList.toggle('hidden')"
                      class="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow">
                Show Details
              </button>
              <div class="educ-details mt-8 space-y-6">
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">What is it?</p>
                  <p class="mt-2">${m.educ.what}</p>
                </div>
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">How to fix?</p>
                  <p class="mt-2">${m.educ.how}</p>
                </div>
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">Why it matters?</p>
                  <p class="mt-2">${m.educ.why}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Prioritized Gap Fixes -->
        <div class="space-y-8">
          <h3 class="text-4xl font-black text-center mb-8">Prioritized Gap Fixes</h3>
          ${fixes.length ? fixes.map(fix => {
            const education = {
              "Add phrase to title and meta description.": {
                what: "The page title and meta description are primary signals search engines use to understand topic relevance.",
                how: "Include the exact target phrase naturally in both the <title> tag and meta description.",
                why: "Strong meta relevance significantly boosts click-through rate and ranking signals."
              },
              "Include phrase in key image alt text.": {
                what: "Image alt text helps search engines understand visual content and provides an additional relevance signal.",
                how: "Add the target phrase to alt attributes of the most important/relevant images.",
                why: "Improves accessibility and gives extra on-page keyword reinforcement."
              }
            }[fix] || {};
            const depthMatch = fix.match(/Add (\d+) words of depth\./);
            const depthEduc = depthMatch ? {
              what: "Content depth shows topical authority and provides more context for the target phrase.",
              how: "Expand sections with valuable, unique information while naturally incorporating related terms.",
              why: "Longer, comprehensive content tends to rank higher for competitive phrases."
            } : {};
            return `
              <div class="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-l-8 border-orange-500">
                <div class="flex gap-6 items-start">
                  <div class="text-5xl mt-1">🔧</div>
                  <div class="flex-1 space-y-6">
                    <p class="text-2xl font-bold">${fix}</p>
                    ${(education.what || depthEduc.what) ? `<div><p class="font-semibold text-orange-600 dark:text-orange-400">What is it?</p><p class="mt-2">${education.what || depthEduc.what}</p></div>` : ''}
                    ${(education.how || depthEduc.how) ? `<div><p class="font-semibold text-orange-600 dark:text-orange-400">How to fix?</p><p class="mt-2">${education.how || depthEduc.how}</p></div>` : ''}
                    ${(education.why || depthEduc.why) ? `<div><p class="font-semibold text-orange-600 dark:text-orange-400">Why it matters?</p><p class="mt-2">${education.why || depthEduc.why}</p></div>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('') : '<p class="text-center text-green-500 dark:text-green-400 text-3xl font-bold">You are ahead or tied — strong position!</p>'}
        </div>

        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
          <h3 class="text-4xl font-black text-center mb-8">Predictive Rank Forecast</h3>
          <p class="text-center text-6xl font-black mb-8">${forecastTier}</p>
          <div class="grid md:grid-cols-3 gap-8 mb-8">
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Your Score</p>
              <p class="text-5xl font-black mt-2">${yourScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Competitor Score</p>
              <p class="text-5xl font-black mt-2">${compScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Gap</p>
              <p class="text-4xl font-black mt-2">${gap}</p>
            </div>
          </div>
          <p class="text-center text-lg opacity-90 leading-relaxed">
            This on-page phrase power comparison indicates relative relevance strength. Higher scores correlate with better ranking potential for the target phrase, though off-page factors (backlinks, domain authority) also play a major role.
          </p>
        </div>

        <!-- PDF Button -->
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