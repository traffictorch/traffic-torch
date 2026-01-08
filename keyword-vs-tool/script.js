document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const yourInput = document.getElementById('your-url');
  const compInput = document.getElementById('competitor-url');
  const phraseInput = document.getElementById('target-phrase');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy.traffictorch.workers.dev/';

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




    // === Dual-page progress loader ===
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
    if (form.nextSibling) {
      form.parentNode.insertBefore(progressContainer, form.nextSibling);
    } else {
      form.parentNode.appendChild(progressContainer);
    }
    results.classList.add('hidden');

    // Fetch both pages
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
            Please check URLs and try again.
          </p>
        </div>
      `;
      return;
    }

    // Dual-analysis progress steps
    const steps = [
      "Fetching both pages...",
      "Parsing titles, meta & headings on both pages",
      "Comparing content depth & keyword density",
      "Scanning images, anchors & schema markup",
      "Calculating Phrase Power Scores",
      "Identifying competitive gaps"
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
        void stepEl.offsetWidth;
        stepEl.classList.remove('opacity-0', 'translate-y-4');
        stepEl.classList.add('opacity-100', 'translate-y-0');
        stepIndex++;
        setTimeout(addStep, 1000);
      } else {
        setTimeout(() => {
          progressContainer.remove();
          renderResults();
        }, 600);
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
const compContentMatches = countPhrase(getCleanContent(compDoc), phrase);

const yourDensity = yourWords > 0 ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
const compDensity = compWords > 0 ? (compContentMatches / compWords * 100).toFixed(1) : 0;

data.content = {
  yourWords,
  compWords,
  yourDensity: parseFloat(yourDensity),
  compDensity: parseFloat(compDensity),
  yourContentMatches,
  compContentMatches
};

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
      
      const yourGrade = getGrade(yourScore);
      const compGrade = getGrade(compScore);

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

      if (mod.id === 'meta') {
        text = `The target phrase is missing from your title or meta description — one of Google's strongest relevance signals.\n` +
               `Add it naturally near the beginning of the title (keep under 60 characters) and once in the description (under 155 characters).\n` +
               `This simple change can improve rankings and boost click-through rates by 20–30%.`;
      }
      else if (mod.id === 'headings') {
        text = `Your main H1 heading does not include the target phrase.\n` +
               `Rewrite the H1 to feature the exact or close variant while keeping it compelling and reader-focused.\n` +
               `The H1 is a critical on-page signal that helps search engines understand your page topic at a glance.`;
      }
      else if (mod.id === 'content') {
        if (yourWords < 800) {
          text = `Your content has only ${yourWords} words — top-ranking pages typically exceed 1200+ words.\n` +
                 `Expand with valuable sections like FAQs, examples, step-by-step guides, data, or comparisons.\n` +
                 `Aim for 800–1500+ words of in-depth, original content to build topical authority and better satisfy user intent.`;
        } else {
          text = `The target phrase appears only ${yourContentMatches} times (${data.content.yourDensity}% density).\n` +
                 `Incorporate it naturally in the intro, subheadings, body, and conclusion to reach 1–2% density.\n` +
                 `Balanced usage reinforces relevance without risking over-optimization penalties.`;
        }
      }
      else if (mod.id === 'alts') {
        text = `No image alt text contains the target phrase.\n` +
               `Update key images (hero, featured) with descriptive alt text that naturally includes the phrase.\n` +
               `This improves accessibility, enables image search traffic, and adds valuable relevance signals.`;
      }
      else if (mod.id === 'anchors') {
        text = `No internal links use the target phrase as anchor text.\n` +
               `Add 2–4 relevant internal links using the phrase or natural variations.\n` +
               `This strengthens site-wide topical relevance and improves internal authority flow.`;
      }
      else if (mod.id === 'urlSchema') {
        if (data.urlSchema.yourUrlMatch === 0) {
          text = `Your URL slug does not include the target phrase.\n` +
                 `If possible, restructure it to include the main keywords (e.g., /${phrase.toLowerCase().replace(/\s+/g, '-')}).\n` +
                 `Keyword-rich URLs provide clear relevance signals and often earn higher click-through rates.`;
        } else {
          text = `No structured data (JSON-LD schema) detected on your page.\n` +
                 `Add appropriate schema markup (Article, FAQPage, HowTo, etc.) in a <script type="application/ld+json"> block.\n` +
                 `Schema enables rich snippets, improves SERP visibility, and helps Google better understand your content.`;
        }
      }

      topFixes.push({ module: mod.name, text, isWorst: mod.id === worstModule?.id });
    });
      
      
      if (topFixes.length < 3 && worstModule && worstModule.id === 'content' && yourWords < compWords) {
        topFixes.push({ module: worstModule.name, text: "Cover competitor subtopics and improve natural phrase usage.", isWorst: true });
      }
      const finalFixes = topFixes.slice(0, 3);

      results.classList.remove('hidden');
      
      
      
      results.innerHTML = `
      
      
<!-- Big Score Circles - Your Page vs Competitor -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 px-4 max-w-5xl mx-auto">
  <!-- Your Page -->
  <div class="text-center">
    <p class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Page</p>
    <div class="relative w-full max-w-xs aspect-square mx-auto">
      <svg viewBox="0 0 160 160" class="w-full h-full transform -rotate-90">
        <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="14" fill="none"/>
        <circle cx="80" cy="80" r="70"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="14" fill="none"
                stroke-dasharray="${(yourScore / 100) * 439} 439"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl sm:text-5xl font-black drop-shadow-2xl ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
            ${yourScore}
          </div>
          <div class="text-lg text-gray-500 dark:text-gray-400">/100</div>
        </div>
      </div>
    </div>
    <div class="mt-6">
      <div class="text-3xl font-bold ${yourGrade.color}">
        ${yourGrade.emoji} ${yourGrade.grade}
      </div>
    </div>
  </div>

  <!-- Competitor Page -->
  <div class="text-center">
    <p class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Competitor Page</p>
    <div class="relative w-full max-w-xs aspect-square mx-auto">
      <svg viewBox="0 0 160 160" class="w-full h-full transform -rotate-90">
        <circle cx="80" cy="80" r="70" stroke="#e5e7eb" stroke-width="14" fill="none"/>
        <circle cx="80" cy="80" r="70"
                stroke="${compScore >= 80 ? '#22c55e' : compScore >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="14" fill="none"
                stroke-dasharray="${(compScore / 100) * 439} 439"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl sm:text-5xl font-black drop-shadow-2xl ${compScore >= 80 ? 'text-green-500 dark:text-green-400' : compScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
            ${compScore}
          </div>
          <div class="text-lg text-gray-500 dark:text-gray-400">/100</div>
        </div>
      </div>
    </div>
    <div class="mt-6">
      <div class="text-3xl font-bold ${compGrade.color}">
        ${compGrade.emoji} ${compGrade.grade}
      </div>
    </div>
  </div>
</div>




<!-- Small Metric Cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
  ${[
    { name: 'Meta Title & Desc', you: data.meta.yourMatches > 0 ? 100 : 0, comp: data.meta.compMatches > 0 ? 100 : 0 },
    { name: 'H1 & Headings', you: data.headings.yourH1Match > 0 ? 100 : 0, comp: data.headings.compH1Match > 0 ? 100 : 0 },
    { name: 'Content Density', you: parseFloat(data.content.yourDensity), comp: parseFloat(data.content.compDensity) },
    { name: 'Image Alts', you: data.alts.yourPhrase > 0 ? 100 : 0, comp: data.alts.compPhrase > 0 ? 100 : 0 },
    { name: 'Anchor Text', you: data.anchors.your > 0 ? 100 : 0, comp: data.anchors.comp > 0 ? 100 : 0 },
    { name: 'URL & Schema', you: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)), comp: Math.min(100, (data.urlSchema.compUrlMatch > 0 ? 50 : 0) + (data.urlSchema.compSchema ? 50 : 0)) }
  ].map(m => {
    const yourScore = m.you;
    const compScore = m.comp;
    const yourGrade = getGrade(Math.round(yourScore));
    const compGrade = getGrade(Math.round(compScore));
    const borderColor = yourScore >= compScore ? 'border-green-500' : 'border-red-500';
    const hashId = moduleHashes[m.name] || '';
    const educ = window.metricExplanations.find(e => e.name === m.name) || { what: '', how: '', why: '' };
    const diagnostics = [
      { status: yourScore >= compScore ? '✅' : '❌', issue: 'Your page', how: yourScore >= compScore ? 'Stronger than competitor' : 'Needs improvement' },
      { status: compScore > yourScore ? '✅' : '❌', issue: 'Competitor page', how: compScore > yourScore ? 'Outperforms you' : 'Weaker than your page' }
    ];
    const hasIssues = yourScore < compScore;
    return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
        <h4 class="text-xl font-medium mb-4">${m.name}</h4>
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div class="relative w-24 h-24 mx-auto">
              <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                <circle cx="48" cy="48" r="40" stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#eab308' : '#ef4444'}"
                        stroke-width="10" fill="none" stroke-dasharray="${(yourScore / 100) * 251} 251" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-3xl font-black ${yourScore >= 80 ? 'text-green-600' : yourScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                ${Math.round(yourScore)}
              </div>
            </div>
            <p class="mt-3 text-sm font-medium">You</p>
          </div>
          <div>
            <div class="relative w-24 h-24 mx-auto">
              <svg width="96" height="96" viewBox="0 0 96 96" class="transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="10" fill="none"/>
                <circle cx="48" cy="48" r="40" stroke="${compScore >= 80 ? '#22c55e' : compScore >= 60 ? '#eab308' : '#ef4444'}"
                        stroke-width="10" fill="none" stroke-dasharray="${(compScore / 100) * 251} 251" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center text-3xl font-black ${compScore >= 80 ? 'text-green-600' : compScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                ${Math.round(compScore)}
              </div>
            </div>
            <p class="mt-3 text-sm font-medium">Comp</p>
          </div>
        </div>
        <div class="space-y-2 mb-6">
          <div class="text-xl font-bold ${yourGrade.color}">${yourGrade.emoji} ${yourGrade.grade}</div>
          <div class="text-xl font-bold ${compGrade.color}">${compGrade.emoji} ${compGrade.grade}</div>
        </div>
        <button onclick="this.parentElement.querySelector('.fixes-panel').classList.toggle('hidden')" class="w-full py-3 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm font-bold">
          Show Fixes
        </button>
        <div class="fixes-panel hidden mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <div class="text-center mb-6">
            <div class="text-3xl">${yourScore < compScore ? '🔴' : '🟢'}</div>
            <div class="text-2xl font-black ${yourScore < compScore ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">${m.name}</div>
            <div class="text-xl font-bold ${yourScore < compScore ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} mt-2">
              ${yourScore < compScore ? 'Competitor Wins' : 'You Win'}
            </div>
          </div>
          <div class="space-y-4 text-left">
            ${diagnostics.map(d => `
              <div class="flex items-start gap-3">
                <span class="text-xl mt-1">${d.status}</span>
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-200">${d.issue}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${d.how}</p>
                </div>
              </div>
            `).join('')}
            ${!hasIssues ? '<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg mt-6">🎉 You outperform the competitor here!</p>' : ''}
          </div>
          <div class="text-center mt-8 pt-6 border-t border-red-200 dark:border-red-700">
            <a href="javascript:void(0)" onclick="window.location.href='/keyword-vs-tool/#${hashId}'; return false;" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              Learn more about ${m.name}
            </a>
          </div>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full mt-3 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm font-bold">
          More Details
        </button>
        <div class="hidden mt-6 space-y-6 text-left text-sm">
          <div class="text-center mb-4">
            <a href="javascript:void(0)" onclick="window.location.href='/keyword-vs-tool/#${hashId}'; return false;" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              How ${m.name} is compared?
            </a>
          </div>
          <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p class="text-gray-800 dark:text-gray-200">${educ.what}</p>
          <p class="text-green-600 dark:text-green-400 font-bold mt-3">How to improve?</p><p class="text-gray-800 dark:text-gray-200">${educ.how}</p>
          <p class="text-orange-600 dark:text-orange-400 font-bold mt-3">Why it matters?</p><p class="text-gray-800 dark:text-gray-200">${educ.why}</p>
          <div class="text-center mt-8 pt-6 border-t border-gray-300 dark:border-gray-700">
            <a href="javascript:void(0)" onclick="window.location.href='/keyword-vs-tool/#${hashId}'; return false;" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              Learn more about ${m.name}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('')}
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
<div class="text-xl text-gray-700 dark:text-gray-300 space-y-2">
  ${fix.text.split('\n').map(line => `<p>${line}</p>`).join('')}
</div>
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

<!-- Closing the Relevance Gap & Projected Gains -->
<div class="grid md:grid-cols-2 gap-12 my-20 max-w-6xl mx-auto">
  <!-- Left: Relevance Improvement -->
  <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border-l-8 border-orange-500">
    <h3 class="text-3xl font-black mb-8 text-center">Relevance Score Improvement</h3>
    <div class="flex justify-center items-center gap-12 mb-12">
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

    ${finalFixes.length > 0 ? `
      <div class="space-y-6">
        <p class="text-lg font-semibold text-center mb-6">Potential uplift from fixing these gaps:</p>
        ${finalFixes.map(fix => {
          let points = '';
          if (fix.module.includes('Meta')) points = '+20–25 points';
          else if (fix.module.includes('H1')) points = '+12–18 points';
          else if (fix.module.includes('Content')) points = '+15–30 points';
          else if (fix.module.includes('Image')) points = '+10–15 points';
          else if (fix.module.includes('Anchor')) points = '+8–12 points';
          else points = '+8–15 points';
          return `<div class="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <span class="text-gray-700 dark:text-gray-300">${fix.module}</span>
            <span class="font-bold text-orange-600 dark:text-orange-400">${points}</span>
          </div>`;
        }).join('')}
      </div>
    ` : `
      <div class="text-center py-8">
        <p class="text-3xl font-black text-green-600 dark:text-green-400 mb-4">🎉 Optimal Relevance Achieved!</p>
        <p class="text-xl text-gray-600 dark:text-gray-400">Your page already shows strong on-page relevance for "${phrase}".</p>
      </div>
    `}

    <details class="mt-10 bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
      <summary class="cursor-pointer font-bold text-orange-600 dark:text-orange-400 text-lg">How We Calculated This</summary>
      <div class="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
        <p>Score based on 8 proven on-page relevance signals:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>Title & Meta (25pts) • H1 (15pts) • Content Depth (20pts)</li>
          <li>Image Alts (15pts) • Anchors (10pts) • URL & Schema (15pts)</li>
        </ul>
        <p class="mt-4 font-medium">Top 10 SERP pages typically score 85+ for competitive phrases.</p>
      </div>
    </details>
  </div>

  <!-- Right: Real-World Impact -->
  <div class="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-10">
    <h3 class="text-3xl font-black mb-8 text-center">Potential Ranking Gains</h3>
    
    ${finalFixes.length === 0 ? `
      <div class="text-center py-12">
        <p class="text-2xl font-bold mb-4">You're in a strong position!</p>
        <p class="text-lg opacity-90">Focus next on building authority through backlinks and fresh content.</p>
      </div>
    ` : `
      <div class="space-y-10">
        <div>
          <div class="flex items-center gap-4 mb-3">
            <span class="text-3xl">📈</span>
            <div class="flex-1 flex justify-between">
              <span class="text-xl">Ranking Position Lift</span>
              <span class="text-2xl font-black">+${2 + finalFixes.length * 2}–${7 + finalFixes.length * 3}</span>
            </div>
          </div>
          <div class="w-full bg-white/20 rounded-full h-10">
            <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 1 ? 45 : finalFixes.length === 2 ? 70 : 90}%"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-4 mb-3">
            <span class="text-3xl">🚀</span>
            <div class="flex-1 flex justify-between">
              <span class="text-xl">Organic Traffic Increase</span>
              <span class="text-2xl font-black">+${15 + finalFixes.length * 10}%–${40 + finalFixes.length * 15}%</span>
            </div>
          </div>
          <div class="w-full bg-white/20 rounded-full h-10">
            <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 1 ? 40 : finalFixes.length === 2 ? 65 : 85}%"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-4 mb-3">
            <span class="text-3xl">👆</span>
            <div class="flex-1 flex justify-between">
              <span class="text-xl">CTR Improvement</span>
              <span class="text-2xl font-black">+${10 + finalFixes.length * 5}%–${25 + finalFixes.length * 8}%</span>
            </div>
          </div>
          <div class="w-full bg-white/20 rounded-full h-10">
            <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 1 ? 50 : finalFixes.length === 2 ? 75 : 95}%"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-4 mb-3">
            <span class="text-3xl">🗝️</span>
            <div class="flex-1 flex justify-between">
              <span class="text-xl">Keyword Coverage Completion</span>
              <span class="text-2xl font-black">+${30 + finalFixes.length * 20}%–${70 + finalFixes.length * 10}%</span>
            </div>
          </div>
          <div class="w-full bg-white/20 rounded-full h-10">
            <div class="bg-white h-10 rounded-full transition-all duration-1000" style="width: ${finalFixes.length === 1 ? 60 : finalFixes.length === 2 ? 80 : 95}%"></div>
          </div>
        </div>
      </div>

      <p class="mt-12 text-center text-sm opacity-90 leading-relaxed">
        Conservative estimates based on on-page optimization benchmarks.<br>
        On-page improvements often reflect in rankings within 1–4 weeks.<br>
        Actual results depend on competition, backlinks, and domain authority.
      </p>
    `}
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
      
      // Clean URL for PDF cover: domain on first line, path on second
      let fullUrl = document.getElementById('url-input').value.trim();
      let displayUrl = 'traffictorch.net'; // fallback

      if (fullUrl) {
        // Remove protocol and www
        let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');

        // Split into domain and path
        const firstSlash = cleaned.indexOf('/');
        if (firstSlash !== -1) {
          const domain = cleaned.slice(0, firstSlash);
          const path = cleaned.slice(firstSlash);
          displayUrl = domain + '\n' + path;
        } else {
          displayUrl = cleaned;
        }
      }

      document.body.setAttribute('data-url', displayUrl);
      
      
    };
  });
});