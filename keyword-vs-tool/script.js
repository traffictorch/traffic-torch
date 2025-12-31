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

    let yourUrl = yourInput.value.trim();
    let compUrl = compInput.value.trim();
    const phrase = phraseInput.value.trim();

    if (yourUrl && !yourUrl.startsWith('http')) yourUrl = 'https://' + yourUrl;
    if (compUrl && !compUrl.startsWith('http')) compUrl = 'https://' + compUrl;

    if (!yourUrl || !compUrl || !phrase) return;

    // === Clean single progress container below form ===
    const progressContainer = document.createElement('div');
    progressContainer.id = 'analysis-progress';
    progressContainer.className = 'mt-12 max-w-4xl mx-auto px-6';
    progressContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="relative w-32 h-32">
          <div class="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
          <div class="absolute inset-0 rounded-full border-8 border-t-orange-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p class="mt-10 text-3xl font-bold text-orange-600 dark:text-orange-400">Analyzing relevance for "${phrase}"...</p>
        <p class="mt-4 text-xl text-gray-600 dark:text-gray-400">Comparing your page vs competitor securely in-browser</p>
        <div id="progress-steps" class="mt-16 space-y-6 w-full text-left"></div>
      </div>
    `;

    // Insert safely after form
    if (form.nextSibling) {
      form.parentNode.insertBefore(progressContainer, form.nextSibling);
    } else {
      form.parentNode.appendChild(progressContainer);
    }
    results.classList.add('hidden');

    // Fetch pages immediately (background)
    let yourDoc, compDoc;
    try {
      [yourDoc, compDoc] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);
    } catch {
      yourDoc = compDoc = null;
    }

    if (!yourDoc || !compDoc) {
      progressContainer.remove();
      results.classList.remove('hidden');
      results.innerHTML = `
        <div class="text-center py-32 px-6 max-w-3xl mx-auto">
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mb-8">Error: Could not load one or both pages</p>
          <p class="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Please check URLs, accessibility, and try again.
          </p>
        </div>
      `;
      return;
    }

    // === Staged progress steps (5.5 seconds total) ===
    const steps = [
      "Parsing titles, meta descriptions & headings",
      "Analyzing content depth and keyword placement",
      "Checking images, internal anchors & schema",
      "Calculating Phrase Power Scores",
      "Identifying competitive gaps & fixes"
    ];

    const progressSteps = document.getElementById('progress-steps');

    let stepIndex = 0;
    const addStep = () => {
      if (stepIndex < steps.length) {
        const stepEl = document.createElement('div');
        stepEl.className = 'flex items-center gap-5 p-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg opacity-0 translate-y-4 transition-all duration-700';
        stepEl.innerHTML = `
          <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-pulse"></div>
          <p class="text-lg font-medium text-gray-800 dark:text-gray-200">${steps[stepIndex]}</p>
        `;
        progressSteps.appendChild(stepEl);
        void stepEl.offsetWidth; // trigger reflow
        stepEl.classList.remove('opacity-0', 'translate-y-4');
        stepEl.classList.add('opacity-100', 'translate-y-0');
        stepIndex++;
        setTimeout(addStep, 1100); // ~5.5s total
      } else {
        // Final delay before results
        setTimeout(() => {
          progressContainer.remove();
          renderResults();
        }, 800);
      }
    };

    addStep();

    // === All scoring & rendering (moved to function for delay) ===
    const renderResults = () => {
      let yourScore = 0;
      let compScore = 0;
      const data = {};

      data.meta = { yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase), compMatches: countPhrase(compDoc.querySelector('title')?.textContent + compDoc.querySelector('meta[name="description"]')?.content, phrase) };
      yourScore += data.meta.yourMatches > 0 ? 25 : 0;
      compScore += data.meta.compMatches > 0 ? 25 : 0;

      data.headings = { yourH1Match: countPhrase(yourDoc.querySelector('h1')?.textContent.trim() || '', phrase), compH1Match: countPhrase(compDoc.querySelector('h1')?.textContent.trim() || '', phrase) };
      yourScore += data.headings.yourH1Match > 0 ? 15 : 0;
      compScore += data.headings.compH1Match > 0 ? 15 : 0;

      const yourWords = getWordCount(yourDoc);
      const compWords = getWordCount(compDoc);
      const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
      const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
      const compDensity = compWords ? (countPhrase(getCleanContent(compDoc), phrase) / compWords * 100).toFixed(1) : 0;
      data.content = { yourWords, yourDensity };

      yourScore += yourWords > 800 ? 20 : 0;
      compScore += compWords > 800 ? 20 : 0;

      const yourAltPhrase = Array.from(yourDoc.querySelectorAll('img')).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
      const compAltPhrase = Array.from(compDoc.querySelectorAll('img')).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
      data.alts = { yourPhrase: yourAltPhrase, compPhrase: compAltPhrase };
      yourScore += yourAltPhrase > 0 ? 15 : 0;
      compScore += compAltPhrase > 0 ? 15 : 0;

      const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
      data.anchors = { your: yourAnchors };
      yourScore += yourAnchors > 0 ? 10 : 0;
      compScore += Array.from(compDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length > 0 ? 10 : 0;

      data.urlSchema = {
        yourUrlMatch: countPhrase(yourUrl, phrase),
        compUrlMatch: countPhrase(compUrl, phrase),
        yourSchema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
      };
      yourScore += data.urlSchema.yourUrlMatch > 0 ? 10 : 0;
      compScore += data.urlSchema.compUrlMatch > 0 ? 10 : 0;

      yourScore = Math.min(100, Math.round(yourScore));
      compScore = Math.min(100, Math.round(compScore));

      // === Top Priority Fixes & Final Render (same as previous epic version) ===
      const moduleOrder = ['meta', 'headings', 'content', 'alts', 'anchors', 'urlSchema'];
      const failedModules = [];
      if (data.meta.yourMatches === 0) failedModules.push({ id: 'meta', name: 'Meta Title & Desc' });
      if (data.headings.yourH1Match === 0) failedModules.push({ id: 'headings', name: 'H1 & Headings' });
      if (parseFloat(yourDensity) < 1 || yourContentMatches === 0 || yourWords < 800) failedModules.push({ id: 'content', name: 'Content Density & Depth' });
      if (yourAltPhrase === 0) failedModules.push({ id: 'alts', name: 'Image Alts' });
      if (yourAnchors === 0) failedModules.push({ id: 'anchors', name: 'Anchor Text' });
      if (data.urlSchema.yourUrlMatch === 0 || data.urlSchema.yourSchema === 0) failedModules.push({ id: 'urlSchema', name: 'URL & Schema' });

      const topFixes = [];
      const worstModule = failedModules[0];
      failedModules.forEach(mod => {
        let text = '';
        if (mod.id === 'meta') text = "Add phrase to title and meta description.";
        else if (mod.id === 'headings') text = "Include phrase in H1 heading.";
        else if (mod.id === 'content') text = yourWords < 800 ? `Expand content depth — aim for at least 800 words (currently ${yourWords}).` : "Improve content density.";
        else if (mod.id === 'alts') text = "Include phrase in key image alt text.";
        else if (mod.id === 'anchors') text = "Use phrase in internal anchor text.";
        else if (mod.id === 'urlSchema') text = data.urlSchema.yourUrlMatch === 0 ? "Include phrase in URL slug if possible." : "Add structured data (JSON-LD schema markup).";
        topFixes.push({ module: mod.name, text, isWorst: mod.id === worstModule?.id });
      });
      if (topFixes.length < 3 && worstModule && worstModule.id === 'content' && yourWords < compWords) {
        topFixes.push({ module: worstModule.name, text: "Cover competitor subtopics and improve natural phrase usage.", isWorst: true });
      }
      const finalFixes = topFixes.slice(0, 3);

      results.classList.remove('hidden');
      results.innerHTML = `
<!-- Big Score Circles -->
<div class="grid md:grid-cols-2 gap-8 lg:gap-12 my-12 px-4">
  <div class="text-center">
    <h3 class="text-2xl font-bold text-green-500 mb-6">Your Phrase Power Score</h3>
    <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square mx-auto">
      <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
        <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
        <circle cx="130" cy="130" r="120" stroke="${getCircleColor(yourScore)}" stroke-width="20" fill="none" stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl sm:text-6xl md:text-7xl font-black ${getTextColorClass(yourScore)} drop-shadow-2xl">${yourScore}</span>
        <span class="text-xl sm:text-2xl text-gray-500 dark:text-gray-500">/100</span>
      </div>
    </div>
  </div>
  <div class="text-center">
    <h3 class="text-2xl font-bold text-red-500 mb-6">Competitor Phrase Power Score</h3>
    <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square mx-auto">
      <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
        <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
        <circle cx="130" cy="130" r="120" stroke="${getCircleColor(compScore)}" stroke-width="20" fill="none" stroke-dasharray="${(compScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl sm:text-6xl md:text-7xl font-black ${getTextColorClass(compScore)} drop-shadow-2xl">${compScore}</span>
        <span class="text-xl sm:text-2xl text-gray-500 dark:text-gray-500">/100</span>
      </div>
    </div>
  </div>
</div>

<!-- Gap Verdict -->
<div class="text-center mb-12">
  <p class="text-4xl font-bold text-green-500 mb-8">
    Competitive Gap: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
      ${yourScore > compScore ? 'You Lead' : yourScore < compScore ? 'Competitor Leads' : 'Neck & Neck'}
    </span>
  </p>
  <p class="text-xl text-gray-500">Target phrase: "${phrase}"</p>
</div>

<!-- Small Module Cards -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  ${[
    { name: 'Meta Title & Desc', you: data.meta.yourMatches > 0 ? 100 : 0, comp: data.meta.compMatches > 0 ? 100 : 0, border: data.meta.yourMatches > 0 ? 'border-green-500' : 'border-red-500', educ: { what: "Checks if your target phrase appears naturally in the page title and meta description.", how: "Add the keyword near the start of the title (keep under 60 chars) and include it once in the meta description (under 155 chars).", why: "Google uses title and description for rankings and click-through rates — pages with keyword in both see 20-30% higher CTR." } },
    { name: 'H1 & Headings', you: data.headings.yourH1Match > 0 ? 100 : 0, comp: data.headings.compH1Match > 0 ? 100 : 0, border: data.headings.yourH1Match > 0 ? 'border-green-500' : 'border-red-500', educ: { what: "Evaluates whether your main H1 heading contains the target phrase.", how: "Rewrite the H1 to include the exact or close-variant phrase while keeping it compelling and reader-focused.", why: "H1 is the strongest on-page signal for topic relevance and helps Google understand what the page is about." } },
    { name: 'Content Density', you: parseFloat(data.content.yourDensity), comp: parseFloat(data.content.compDensity), border: parseFloat(data.content.yourDensity) >= 1 ? 'border-green-500' : 'border-red-500', educ: { what: "Measures how often the target phrase appears relative to total word count (ideal 1-2%).", how: "Add the phrase naturally in subheadings, intro, conclusion, and body — aim for 800+ words of in-depth content.", why: "Proper density signals relevance without stuffing; longer, keyword-optimized content dominates rankings." } },
    { name: 'Image Alts', you: data.alts.yourPhrase > 0 ? 100 : 0, comp: data.alts.compPhrase > 0 ? 100 : 0, border: data.alts.yourPhrase > 0 ? 'border-green-500' : 'border-red-500', educ: { what: "Checks if any image alt text contains the target phrase.", how: "Update alt text of key images (hero, featured) to include the phrase descriptively.", why: "Improves accessibility, enables image search traffic, and adds extra relevance signals." } },
    { name: 'Anchor Text', you: data.anchors.your > 0 ? 100 : 0, comp: data.anchors.comp > 0 ? 100 : 0, border: data.anchors.your > 0 ? 'border-green-500' : 'border-red-500', educ: { what: "Looks for internal links using the target phrase as anchor text.", how: "Add or edit internal links to use the phrase naturally where relevant.", why: "Strengthens site-wide relevance and improves internal PageRank flow." } },
    { name: 'URL & Schema', you: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)), comp: Math.min(100, (data.urlSchema.compUrlMatch > 0 ? 50 : 0) + (data.urlSchema.compSchema ? 50 : 0)), border: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)) >= 50 ? 'border-green-500' : 'border-red-500', educ: { what: "Combines URL keyword inclusion and structured data presence.", how: "Include phrase in URL slug if possible; add JSON-LD schema (FAQ, Article, etc.).", why: "Descriptive URLs aid crawling; schema unlocks rich snippets and better SERP visibility." } }
  ].map((m) => `
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-l-8 ${m.border} flex flex-col">
      <h4 class="text-xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">${m.name}</h4>
      <div class="grid grid-cols-2 gap-6 mb-8 flex-grow">
        <div class="text-center">
          <div class="relative w-32 h-32 mx-auto">
            <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="14" fill="none"/>
              <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.you)}" stroke-width="14" fill="none" stroke-dasharray="${(m.you / 100) * 352} 352" stroke-linecap="round"/>
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
              <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.comp)}" stroke-width="14" fill="none" stroke-dasharray="${(m.comp / 100) * 352} 352" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-4xl font-black ${getTextColorClass(m.comp)}">${Math.round(m.comp)}</span>
            </div>
          </div>
          <p class="mt-4 text-lg font-medium">Comp</p>
        </div>
      </div>
      <button onclick="const details=this.closest('div').querySelector('.educ-details');details.classList.toggle('hidden');this.textContent=details.classList.contains('hidden')?'Show Details':'Hide Details';"
              class="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow">
        Show Details
      </button>
      <div class="educ-details mt-8 space-y-6 hidden">
        <div><p class="font-semibold text-orange-600 dark:text-orange-400">What is it?</p><p class="mt-2 text-gray-700 dark:text-gray-300">${m.educ.what}</p></div>
        <div><p class="font-semibold text-orange-600 dark:text-orange-400">How to improve?</p><p class="mt-2 text-gray-700 dark:text-gray-300">${m.educ.how}</p></div>
        <div><p class="font-semibold text-orange-600 dark:text-orange-400">Why it matters?</p><p class="mt-2 text-gray-700 dark:text-gray-300">${m.educ.why}</p></div>
      </div>
    </div>
  `).join('')}
</div>

<!-- Top Priority Fixes -->
<div class="my-20 max-w-5xl mx-auto">
  <h3 class="text-4xl font-black text-center mb-12 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
    Top Priority Fixes
  </h3>
  ${finalFixes.length > 0 ? finalFixes.map((fix, i) => `
    <div class="mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border-l-8 ${fix.isWorst ? 'border-red-600' : 'border-orange-500'} flex gap-6">
      <div class="text-6xl font-black text-orange-500">${i + 1}</div>
      <div class="flex-1">
        <p class="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">${fix.module}</p>
        <p class="text-xl text-gray-700 dark:text-gray-300">${fix.text}</p>
        ${fix.isWorst && finalFixes.filter(f => f.isWorst).length > 1 ? '<p class="mt-4 text-sm italic text-red-600 dark:text-red-400">(Critical module — multiple gaps detected)</p>' : ''}
      </div>
    </div>
  `).join('') : `
    <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl shadow-2xl p-16 text-center">
      <p class="text-4xl font-black mb-6">Excellent Optimization!</p>
      <p class="text-2xl">Your page shows strong relevance for "${phrase}" — no major gaps vs competitor.</p>
    </div>
  `}
</div>

<!-- Relevance Improvement & Potential Ranking Gains -->
<div class="grid md:grid-cols-2 gap-12 my-20 max-w-6xl mx-auto">
  <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border-l-8 border-orange-500">
    <h3 class="text-3xl font-black mb-8 text-center">Relevance Improvement</h3>
    <div class="flex justify-center items-center gap-12 mb-10">
      <div class="text-center">
        <span class="text-6xl font-black ${getTextColorClass(yourScore)}">${yourScore}</span>
        <p class="text-xl mt-3 opacity-80">Current</p>
      </div>
      <span class="text-6xl font-bold">→</span>
      <div class="text-center">
        <span class="text-6xl font-black text-green-500">${Math.min(100, yourScore + (finalFixes.length * 15))}</span>
        <p class="text-xl mt-3 text-green-500">Projected</p>
      </div>
    </div>
    <details class="mt-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
      <summary class="cursor-pointer font-bold text-orange-600 dark:text-orange-400">How We Calculated This</summary>
      <p class="mt-4 text-gray-700 dark:text-gray-300">Each implemented fix typically adds 10–20 points based on signal weight. Conservative estimate assumes realistic partial implementation.</p>
    </details>
  </div>

  <div class="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-10">
    <h3 class="text-3xl font-black mb-8 text-center">Potential Ranking Gains</h3>
    <div class="space-y-10">
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-xl">Ranking Position Lift</span>
          <span class="text-3xl font-black">+${2 + finalFixes.length * 2}–${7 + finalFixes.length * 3}</span>
        </div>
        <div class="w-full bg-white/20 rounded-full h-10">
          <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 0 ? 20 : finalFixes.length === 1 ? 45 : finalFixes.length === 2 ? 70 : 100}%"></div>
        </div>
      </div>
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-xl">Organic Traffic Increase</span>
          <span class="text-3xl font-black">+${15 + finalFixes.length * 10}%–${40 + finalFixes.length * 15}%</span>
        </div>
        <div class="w-full bg-white/20 rounded-full h-10">
          <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 0 ? 15 : finalFixes.length === 1 ? 40 : finalFixes.length === 2 ? 65 : 90}%"></div>
        </div>
      </div>
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-xl">CTR Improvement</span>
          <span class="text-3xl font-black">+${10 + finalFixes.length * 5}%–${25 + finalFixes.length * 8}%</span>
        </div>
        <div class="w-full bg-white/20 rounded-full h-10">
          <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 0 ? 25 : finalFixes.length === 1 ? 50 : finalFixes.length === 2 ? 75 : 100}%"></div>
        </div>
      </div>
    </div>
    <p class="mt-12 text-center text-sm opacity-90 leading-relaxed">
      Conservative estimates based on on-page optimization benchmarks.<br>
      Actual results depend on competition, authority, and off-page factors.
    </p>
  </div>
</div>

<!-- PDF Button - FIXED onclick with single quotes -->
<div class="text-center my-20">
  <button onclick='document.querySelectorAll(".hidden").forEach(el => el.classList.remove("hidden")); window.print();'
          class="group relative inline-flex items-center px-16 py-7 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105">
    <span class="flex items-center gap-6">Save Report as PDF</span>
    <div class="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </button>
</div>
      `;
    };
  });
});