document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/?url=';
  let analyzedText = '';
  let wordCount = 0;

  function getMainContent(doc) {
    const main = doc.querySelector('main, [role="main"], article, .main-content, .site-content, .content-area');
    if (main && main.textContent.trim().length > 600) return main;

    const candidates = doc.querySelectorAll('div, section, article');
    let best = null;
    let bestScore = 0;
    candidates.forEach(el => {
      if (el.closest('header, nav, footer, aside, .menu, .sidebar')) return;
      const paragraphs = el.querySelectorAll('p');
      const textLength = el.textContent.trim().length;
      const pCount = paragraphs.length;
      const score = pCount * 100 + textLength;
      if (score > bestScore && textLength > 600 && textLength < 20000) {
        bestScore = score;
        best = el;
      }
    });
    if (best) return best;

    const body = doc.body.cloneNode(true);
    const removeSelectors = 'header, nav, footer, aside, .menu, .navbar, .sidebar, .cookie-banner, .popup, .social-links, .breadcrumbs';
    body.querySelectorAll(removeSelectors).forEach(e => e.remove());
    return body;
  }

  function analyzeAIContent(text) {
    if (!text || text.length < 200) {
      return { moduleScores: [5,5,5,5,5], totalScore: 50 };
    }
    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordCount = words.length;

    // Helper: entropy calculation
    function entropy(counts, total) {
      return -Object.values(counts).reduce((sum, c) => {
        const p = c / total;
        return sum + p * Math.log2(p);
      }, 0);
    }

    // 1. Perplexity module
    const bigrams = {};
    for (let i = 0; i < words.length - 1; i++) {
      const gram = words[i] + ' ' + words[i + 1];
      bigrams[gram] = (bigrams[gram] || 0) + 1;
    }
    const bigramEntropy = words.length > 1 ? entropy(bigrams, words.length - 1) : 5;

    const trigrams = {};
    for (let i = 0; i < words.length - 2; i++) {
      const gram = words.slice(i, i + 3).join(' ');
      trigrams[gram] = (trigrams[gram] || 0) + 1;
    }
    const trigramEntropy = words.length > 2 ? entropy(trigrams, words.length - 2) : 5;

    const perplexityScore1 = Math.min(10, Math.max(0, (trigramEntropy - 4) / 0.8)); // higher = more human
    const perplexityScore2 = Math.min(10, Math.max(0, (bigramEntropy - 4) / 0.8));
    const perplexityModule = (perplexityScore1 + perplexityScore2) / 2;

    // 2. Burstiness module
    const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
    const avgSentLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
    const sentVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentLen, 2), 0) / sentenceLengths.length;
    const sentBurstiness = Math.sqrt(sentVariance);

    const wordLengths = words.map(w => w.length);
    const avgWordLen = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const wordVariance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgWordLen, 2), 0) / wordLengths.length;
    const wordBurstiness = Math.sqrt(wordVariance);

    const burstinessScore1 = Math.min(10, sentBurstiness);
    const burstinessScore2 = Math.min(10, wordBurstiness * 2); // scale to similar range
    const burstinessModule = (burstinessScore1 + burstinessScore2) / 2;

    // 3. Repetition module
    const maxBigram = Math.max(...Object.values(bigrams), 1);
    const bigramRep = Math.min(10, (maxBigram / (wordCount / 100)) * 1);

    const maxTrigram = Math.max(...Object.values(trigrams), 1);
    const trigramRep = Math.min(10, (maxTrigram / (wordCount / 100)) * 2);

    const repetitionScore1 = 10 - bigramRep;
    const repetitionScore2 = 10 - trigramRep;
    const repetitionModule = (repetitionScore1 + repetitionScore2) / 2;

    // 4. Sentence Length module
    const avgSentenceLength = avgSentLen;
    const sentLenScore = Math.max(0, 10 - Math.abs(avgSentenceLength - 19) * 0.5);

    const commaCounts = sentences.map(s => (s.match(/,/g) || []).length);
    const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length || 0;
    const complexityScore = Math.min(10, avgCommas * 2.5); // higher complexity = more human

    const sentenceLengthModule = (sentLenScore + complexityScore) / 2;

    // 5. Vocabulary module
    const uniqueWords = new Set(words).size;
    const vocabDiversity = (uniqueWords / wordCount) * 100;
    const vocabScore = vocabDiversity / 10;

    const wordFreq = {};
    words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
    const hapax = Object.values(wordFreq).filter(c => c === 1).length;
    const rareWordRatio = (hapax / wordCount) * 100;
    const rareScore = Math.min(10, rareWordRatio * 0.5); // scale appropriately

    const vocabularyModule = (vocabScore + rareScore) / 2;

    const moduleScores = [
      perplexityModule,
      burstinessModule,
      repetitionModule,
      sentenceLengthModule,
      vocabularyModule
    ];

    const totalModuleSum = moduleScores.reduce((a, b) => a + b, 0);
    const totalScore = Math.round(totalModuleSum * 2); // out of 100

    return {
      moduleScores,
      totalScore,
      details: {
        perplexity: { trigram: trigramEntropy.toFixed(1), bigram: bigramEntropy.toFixed(1) },
        burstiness: { sentence: sentBurstiness.toFixed(1), word: wordBurstiness.toFixed(1) },
        repetition: { bigram: bigramRep.toFixed(1), trigram: trigramRep.toFixed(1) },
        sentenceLength: { avg: Math.round(avgSentenceLength), complexity: avgCommas.toFixed(1) },
        vocabulary: { diversity: vocabDiversity.toFixed(1), rare: rareWordRatio.toFixed(1) }
      }
    };
  }

  function getGradeColor(normalized10) {
    if (normalized10 >= 8.0) return '#10b981';
    if (normalized10 >= 6.0) return '#f97316';
    return '#ef4444';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    const urlToFetch = normalizedUrl;
    if (!url) return;

    results.innerHTML = `
      <div class="py-0 text-center">
        <div class="inline-block w-16 h-16 mb-8">
          <svg viewBox="0 0 100 100" class="animate-spin text-orange-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
          </svg>
        </div>
        <p id="progressText" class="text-2xl font-bold text-orange-600 dark:text-orange-400">Fetching page...</p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">Analyzing content for AI patterns – please wait</p>
      </div>
    `;
    results.classList.remove('hidden');

    const progressText = document.getElementById('progressText');
    const messages = [
      "Fetching page...",
      "Extracting main content...",
      "Analyzing predictability...",
      "Measuring variation & rhythm...",
      "Checking repetition patterns...",
      "Evaluating structure & depth...",
      "Assessing vocabulary richness...",
      "Calculating final AI score..."
    ];
    let delay = 800;
    messages.forEach(msg => {
      setTimeout(() => {
        if (progressText) progressText.textContent = msg;
      }, delay);
      delay += 800;
    });

    const minLoadTime = 5500;
    const startTime = Date.now();

    try {
      const res = await fetch(PROXY + encodeURIComponent(urlToFetch));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mainElement = getMainContent(doc);
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;

      const analysis = analyzeAIContent(text);
      const yourScore = analysis.totalScore;
      const humanScore = 100 - yourScore;
      const mainGradeColor = getGradeColor(humanScore / 10);
      const verdict = yourScore >= 70 ? 'Very Likely AI' : yourScore >= 40 ? 'Moderate AI Patterns' : 'Likely Human';
      const forecast = yourScore >= 70 ? 'Page 2+' : yourScore >= 50 ? 'Page 1 Possible' : yourScore >= 30 ? 'Top 10 Possible' : 'Top 3 Potential';

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        results.innerHTML = `
        <style>
          .animate-stroke { transition: stroke-dasharray 1.5s ease-out; }
        </style>
        <div class="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
          <div class="max-w-4xl mx-auto space-y-16">
            <div class="flex justify-center">
              <div class="relative w-64 h-64">
                <svg viewBox="0 0 256 256" class="absolute inset-0 -rotate-90">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#e2e8f0" stroke-width="24"/>
                  <circle cx="128" cy="128" r="110" fill="none" stroke="${mainGradeColor}" stroke-width="20"
                          stroke-dasharray="0 691"
                          stroke-linecap="round"
                          class="animate-stroke"
                          style="stroke-dasharray: ${(yourScore / 100) * 691} 691;"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-7xl font-black" style="color: ${mainGradeColor}">${yourScore}</div>
                  <div class="text-lg text-gray-600">AI Score</div>
                  <div class="text-base text-gray-500">/100</div>
                </div>
              </div>
            </div>
            <div class="text-center mt-4">
              <p class="text-3xl font-bold" style="color: ${mainGradeColor}">${verdict}</p>
            </div>
            <p class="text-center text-base text-gray-600">Scanned ${wordCount.toLocaleString()} words from main content</p>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              ${[
                {name: 'Perplexity', score: analysis.moduleScores[0], details: analysis.details.perplexity, info: 'Measures text unpredictability using bigram and trigram entropy.'},
                {name: 'Burstiness', score: analysis.moduleScores[1], details: analysis.details.burstiness, info: 'Evaluates variation in sentence and word lengths for natural rhythm.'},
                {name: 'Repetition', score: analysis.moduleScores[2], details: analysis.details.repetition, info: 'Detects overuse of bigram and trigram phrases.'},
                {name: 'Sentence Length', score: analysis.moduleScores[3], details: analysis.details.sentenceLength, info: 'Combines average length with structural complexity (commas/clauses).'},
                {name: 'Vocabulary', score: analysis.moduleScores[4], details: analysis.details.vocabulary, info: 'Assesses unique word diversity and rare word usage.'}
              ].map(m => {
                const gradeColor = getGradeColor(m.score);
                const displayScore = m.score.toFixed(1);
                return `
                <div class="bg-white rounded-2xl shadow-md p-6 text-center border-l-4" style="border-left-color: ${gradeColor}">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg viewBox="0 0 128 128" class="-rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#f1f5f9" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${gradeColor}" stroke-width="12" fill="none"
                              stroke-dasharray="${m.score * 35.2} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <div class="text-3xl font-bold" style="color: ${gradeColor}">${displayScore}</div>
                      <div class="text-sm text-gray-500">/10</div>
                    </div>
                  </div>
                  <p class="mt-4 text-base font-medium text-gray-700">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-3 px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300">
                    Show Details
                  </button>
                  <div class="hidden mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>${m.info}</p>
                    <p><strong>Sub-metrics:</strong> ${Object.entries(m.details).map(([k,v]) => `${k}: ${v}`).join(' | ')}</p>
                    <p><span class="font-bold text-green-600">How to improve:</span> Increase variation, use personal voice, mix structures, and incorporate rarer vocabulary.</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>

            <div class="mt-20 space-y-8">
              <h2 class="text-4xl md:text-5xl font-black text-center text-gray-900">Prioritized AI-Style Fixes</h2>
              ${yourScore >= 70 ? `
                <div class="bg-red-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-red-500">
                  <h3 class="text-3xl font-bold text-red-600 mb-6">Very Likely AI Detected</h3>
                  <p class="text-lg"><span class="font-bold text-blue-600">What:</span> Multiple modules show strong AI patterns</p>
                  <p class="text-lg mt-4"><span class="font-bold text-green-600">How to improve:</span> Add personal anecdotes, vary rhythm dramatically, reduce repetition, deepen sentence structure</p>
                </div>` : yourScore >= 40 ? `
                <div class="bg-orange-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-orange-500">
                  <h3 class="text-3xl font-bold text-orange-600 mb-6">Moderate AI Patterns</h3>
                  <p class="text-lg"><span class="font-bold text-blue-600">What:</span> Some uniformity detected across metrics</p>
                  <p class="text-lg mt-4"><span class="font-bold text-green-600">How to improve:</span> Focus on weak modules shown above</p>
                </div>` : `
                <div class="bg-green-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-green-500">
                  <h3 class="text-3xl font-bold text-green-600 mb-6">Excellent — Highly Human-Like!</h3>
                  <p class="text-lg text-center">Strong performance across all modules. Keep writing naturally!</p>
                </div>`}
            </div>

            <div class="mt-20 p-10 md:p-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl shadow-2xl text-white text-center space-y-8">
              <h2 class="text-4xl md:text-4xl font-black">Predictive Rank Forecast</h2>
              <p class="text-4xl md:text-4xl font-black" style="color: ${mainGradeColor}">${forecast}</p>
              <p class="text-2xl md:text-3xl font-bold">Potential if optimized further</p>
            </div>

            <div class="text-center my-16">
              <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
                      class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
                📄 Save as PDF
              </button>
            </div>
          </div>
        </div>
        `;
      }, remaining);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500">Please check the URL and try again.</p>
          </div>
        `;
      }, remaining);
    }
  });
});