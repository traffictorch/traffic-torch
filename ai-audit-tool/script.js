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
      return { moduleScores: [10,10,10,10,10], totalScore: 50 };
    }
    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    wordCount = words.length;

    function entropy(counts, total) {
      return -Object.values(counts).reduce((sum, c) => {
        const p = c / total;
        return sum + (p > 0 ? p * Math.log2(p) : 0);
      }, 0);
    }

    // Perplexity
    const bigrams = {};
    for (let i = 0; i < words.length - 1; i++) {
      const gram = words[i] + ' ' + words[i + 1];
      bigrams[gram] = (bigrams[gram] || 0) + 1;
    }
    const bigramEntropy = words.length > 1 ? entropy(bigrams, words.length - 1) : 6;

    const trigrams = {};
    for (let i = 0; i < words.length - 2; i++) {
      const gram = words.slice(i, i + 3).join(' ');
      trigrams[gram] = (trigrams[gram] || 0) + 1;
    }
    const trigramEntropy = words.length > 2 ? entropy(trigrams, words.length - 2) : 6;

    const perplexityScore1 = trigramEntropy >= 7.5 ? 10 : 0;
    const perplexityScore2 = bigramEntropy >= 7.0 ? 10 : 0;
    const perplexityModule = perplexityScore1 + perplexityScore2;

    // Burstiness
    const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
    const avgSentLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
    const sentVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentLen, 2), 0) / sentenceLengths.length;
    const sentBurstiness = Math.sqrt(sentVariance);

    const wordLengths = words.map(w => w.length);
    const avgWordLen = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length || 6;
    const wordVariance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgWordLen, 2), 0) / wordLengths.length;
    const wordBurstiness = Math.sqrt(wordVariance);

    const burstinessScore1 = sentBurstiness >= 4.5 ? 10 : 0;
    const burstinessScore2 = wordBurstiness >= 2.0 ? 10 : 0;
    const burstinessModule = burstinessScore1 + burstinessScore2;

    // Repetition
    const maxBigram = Math.max(...Object.values(bigrams || {1:1}), 1);
    const maxTrigram = Math.max(...Object.values(trigrams || {1:1}), 1);

    const repetitionScore1 = maxBigram <= 3 ? 10 : 0;
    const repetitionScore2 = maxTrigram <= 2 ? 10 : 0;
    const repetitionModule = repetitionScore1 + repetitionScore2;

    // Sentence Length
    const sentLenInRange = avgSentLen >= 15 && avgSentLen <= 23;
    const sentLenScore = sentLenInRange ? 10 : 0;

    const commaCounts = sentences.map(s => (s.match(/,/g) || []).length);
    const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length || 0;
    const complexityScore = avgCommas >= 1.0 ? 10 : 0;

    const sentenceLengthModule = sentLenScore + complexityScore;

    // Vocabulary
    const uniqueWords = new Set(words).size;
    const vocabDiversity = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 50;

    const wordFreq = {};
    words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
    const hapax = Object.values(wordFreq).filter(c => c === 1).length;
    const rareWordRatio = wordCount > 0 ? (hapax / wordCount) * 100 : 10;

    const vocabScore = vocabDiversity >= 65 ? 10 : 0;
    const rareScore = rareWordRatio >= 15 ? 10 : 0;
    const vocabularyModule = vocabScore + rareScore;

    const moduleScores = [perplexityModule, burstinessModule, repetitionModule, sentenceLengthModule, vocabularyModule];
    const totalScore = moduleScores.reduce((a, b) => a + b, 0);

    return {
      moduleScores,
      totalScore,
      details: {
        perplexity: { trigram: trigramEntropy.toFixed(1), bigram: bigramEntropy.toFixed(1), scores: {trigram: perplexityScore1, bigram: perplexityScore2} },
        burstiness: { sentence: sentBurstiness.toFixed(1), word: wordBurstiness.toFixed(1), scores: {sentence: burstinessScore1, word: burstinessScore2} },
        repetition: { bigram: maxBigram, trigram: maxTrigram, scores: {bigram: repetitionScore1, trigram: repetitionScore2} },
        sentenceLength: { avg: Math.round(avgSentLen), complexity: avgCommas.toFixed(1), scores: {avg: sentLenScore, complexity: complexityScore} },
        vocabulary: { diversity: vocabDiversity.toFixed(1), rare: rareWordRatio.toFixed(1), scores: {diversity: vocabScore, rare: rareScore} }
      }
    };
  }

  function getGradeColor(humanNormalized10) {
    if (humanNormalized10 >= 8.0) return '#10b981'; // green
    if (humanNormalized10 >= 5.0) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  function getPassFail(score) {
    return score === 10 ? '✅' : '❌';
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
      "Calculating final score..."
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
      const mainGradeColor = getGradeColor(yourScore / 10);
      const verdict = yourScore >= 80 ? 'Likely Human' : yourScore >= 50 ? 'Moderate AI Patterns' : 'Very Likely AI';
      const forecast = yourScore >= 80 ? 'Top 3 Potential' : yourScore >= 60 ? 'Top 10 Possible' : yourScore >= 40 ? 'Page 1 Possible' : 'Page 2+';

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
                  <div class="text-lg text-gray-600 dark:text-gray-400">Human Score</div>
                  <div class="text-base text-gray-500 dark:text-gray-500">/100</div>
                </div>
              </div>
            </div>
            <div class="text-center mt-4">
              <p class="text-3xl font-bold" style="color: ${mainGradeColor}">${verdict}</p>
            </div>
            <p class="text-center text-base text-gray-600 dark:text-gray-400">Scanned ${wordCount.toLocaleString()} words from main content</p>





<!-- Metrics Layout -->
<div class="space-y-8">
  <!-- Perplexity - Full width on top -->
  <div class="max-w-2xl mx-auto">
    ${[
      {name: 'Perplexity', score: analysis.moduleScores[0], details: analysis.details.perplexity, info: 'Measures how unpredictable your text is through bigram and trigram entropy calculations. High entropy indicates varied and surprising word sequences, which are hallmarks of human writing. AI-generated text often has lower entropy due to its reliance on common patterns.', fixes: {trigram: analysis.details.perplexity.scores.trigram < 10 ? 'To improve trigram entropy, deliberately introduce unexpected word combinations and personal anecdotes that don’t follow common patterns. This breaks predictable flows and makes your writing feel more spontaneous and human. Avoid sticking to safe, formulaic phrasing—edit specifically for surprise in every few sentences.' : '', bigram: analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy by actively swapping overused two-word pairs with creative alternatives or rephrased expressions. Incorporate transitional phrases that aren’t common and sprinkle in idiomatic expressions unique to your voice. These small changes create a less robotic rhythm and significantly increase overall unpredictability.' : ''}}
    ].map(m => {
      const gradeColor = getGradeColor(m.score / 2);
      const displayScore = m.score;
      const failedFixes = Object.values(m.fixes).filter(f => f).join('<br><br>');
      const sub1Score = m.details.scores.trigram;
      const sub2Score = m.details.scores.bigram;
      return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 md:p-8 text-center border-l-4" style="border-left-color: ${gradeColor}">
        <div class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 160 160" class="-rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#f1f5f9 dark:#374151" stroke-width="16" fill="none"/>
            <circle cx="80" cy="80" r="70" stroke="${gradeColor}" stroke-width="16" fill="none"
                    stroke-dasharray="${m.score * 22} 440" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-5xl font-bold" style="color: ${gradeColor}">${displayScore}</div>
            <div class="text-lg text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-6 text-2xl font-bold text-gray-800 dark:text-gray-200">${m.name}</p>
        <div class="mt-4 space-y-2 text-base text-gray-700 dark:text-gray-300">
          <p>${getPassFail(sub1Score)} Trigram Entropy</p>
          <p>${getPassFail(sub2Score)} Bigram Entropy</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          More Details
        </button>
        <div class="hidden mt-6 space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          ${failedFixes ? `<p><span class="font-bold text-red-600 dark:text-red-400">How to Fix Failed Tests:</span><br><br>${failedFixes}</p>` : ''}
          <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is:</span> ${m.info}</p>
          <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve Overall:</span> Use varied phrasing, personal anecdotes, and unexpected ideas to boost scores. Mix short and long elements for rhythm, and incorporate synonyms or rarer words. Always edit with readability in mind to align with human patterns.</p>
          <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters:</span> Search engines prioritize human-like content for higher rankings and user trust. Strong scores here reduce AI penalties and improve engagement metrics. Ultimately, this leads to better organic traffic and authority signals.</p>
        </div>
      </div>
      `;
    }).join('')}
  </div>

  <!-- Remaining 4 metrics - 2x2 on desktop -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
    ${[
      {name: 'Burstiness', score: analysis.moduleScores[1], details: analysis.details.burstiness, info: 'Evaluates the variation in sentence and word lengths to ensure natural rhythm in your content. Human writing typically mixes short, punchy sentences with longer, descriptive ones for engagement. Consistent lengths can signal AI generation, as it often prioritizes uniformity over dynamic flow.', fixes: {sentence: analysis.details.burstiness.scores.sentence < 10 ? 'To address low sentence burstiness, alternate between short, impactful sentences and longer, explanatory ones throughout your text. This creates a more engaging rhythm that mimics human speech patterns. Review paragraphs for uniformity and split or combine sentences to add variety.' : '', word: analysis.details.burstiness.scores.word < 10 ? 'Fix word length burstiness by mixing short, simple words with longer, more descriptive ones to avoid monotony. Incorporate varied vocabulary that includes both everyday terms and specialized jargon where appropriate. This enhances readability and makes the content feel more authentic and less machine-like.' : ''}},
      {name: 'Repetition', score: analysis.moduleScores[2], details: analysis.details.repetition, info: 'Detects overuse of bigram and trigram phrases, which can make text feel redundant and AI-like. Human writers naturally vary expressions to maintain interest and flow. High repetition scores indicate a need for more diverse phrasing to improve originality and engagement.', fixes: {bigram: analysis.details.repetition.scores.bigram < 10 ? 'Reduce bigram repetition by identifying common two-word phrases and replacing them with synonyms or restructured sentences. Use a thesaurus to find fresh alternatives and ensure no phrase dominates. This will make your writing more dynamic and less predictable.' : '', trigram: analysis.details.repetition.scores.trigram < 10 ? 'To fix trigram repetition, scan for recurring three-word sequences and rewrite them with varied structures or vocabulary. Introduce new ideas or transitions to break patterns. Editing for diversity here will elevate the text’s natural feel and reduce AI flags.' : ''}},
      {name: 'Sentence Length', score: analysis.moduleScores[3], details: analysis.details.sentenceLength, info: 'Combines average sentence length with complexity measures like comma usage to assess structural depth. Ideal human writing balances lengths between 15-23 words while incorporating clauses for nuance. Deviations can suggest overly simplistic or convoluted AI output, impacting readability.', fixes: {avg: analysis.details.sentenceLength.scores.avg < 10 ? 'Adjust average sentence length by breaking up long run-ons or combining short fragments to hit the 15-23 word sweet spot. This improves flow and readability for users. Regularly count words per sentence during edits to achieve balance.' : '', complexity: analysis.details.sentenceLength.scores.complexity < 10 ? 'Increase sentence complexity by adding clauses with commas, semicolons, or conjunctions to layer ideas. This adds depth without overwhelming the reader. Aim for 1-2 clauses per sentence in key sections to mimic human thought processes.' : ''}},
      {name: 'Vocabulary', score: analysis.moduleScores[4], details: analysis.details.vocabulary, info: 'Assesses unique word diversity and the frequency of rare words to gauge lexical richness. Human content often includes a broad, context-specific vocabulary with unique terms. Low scores here point to limited word choice, common in AI for efficiency, reducing perceived expertise.', fixes: {diversity: analysis.details.vocabulary.scores.diversity < 10 ? 'Boost vocabulary diversity by incorporating synonyms and avoiding word repetition through active editing. Draw from broader themes or analogies to introduce new terms. This enriches the text and signals deeper knowledge to search engines.' : '', rare: analysis.details.vocabulary.scores.rare < 10 ? 'Enhance rare word frequency by adding unique, context-specific terms that appear only once or twice. Research niche vocabulary related to your topic and weave it in naturally. This creates a more authentic, expert tone and improves SEO signals.' : ''}}
    ].map(m => {
      const gradeColor = getGradeColor(m.score / 2);
      const displayScore = m.score;
      const failedFixes = Object.values(m.fixes).filter(f => f).join('<br><br>');
      const sub1Score = m.name === 'Burstiness' ? m.details.scores.sentence : m.name === 'Repetition' ? m.details.scores.bigram : m.name === 'Sentence Length' ? m.details.scores.avg : m.details.scores.diversity;
      const sub2Score = m.name === 'Burstiness' ? m.details.scores.word : m.name === 'Repetition' ? m.details.scores.trigram : m.name === 'Sentence Length' ? m.details.scores.complexity : m.details.scores.rare;
      const sub1Name = m.name === 'Burstiness' ? 'Sentence Length Variation' : m.name === 'Repetition' ? 'Bigram Repetition' : m.name === 'Sentence Length' ? 'Average Length' : 'Diversity';
      const sub2Name = m.name === 'Burstiness' ? 'Word Length Burstiness' : m.name === 'Repetition' ? 'Trigram Repetition' : m.name === 'Sentence Length' ? 'Sentence Complexity' : 'Rare Word Frequency';
      return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center border-l-4" style="border-left-color: ${gradeColor}">
        <div class="relative w-32 h-32 mx-auto">
          <svg viewBox="0 0 128 128" class="-rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#f1f5f9 dark:#374151" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="${gradeColor}" stroke-width="12" fill="none"
                    stroke-dasharray="${m.score * 17.6} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-3xl font-bold" style="color: ${gradeColor}">${displayScore}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">/20</div>
          </div>
        </div>
        <p class="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">${m.name}</p>
        <div class="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p>${getPassFail(sub1Score)} ${sub1Name}</p>
          <p>${getPassFail(sub2Score)} ${sub2Name}</p>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-md transition">
          More Details
        </button>
        <div class="hidden mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          ${failedFixes ? `<p><span class="font-bold text-red-600 dark:text-red-400">How to Fix Failed Tests:</span><br><br>${failedFixes}</p>` : ''}
          <p><span class="font-bold text-blue-600 dark:text-blue-400">What it is:</span> ${m.info}</p>
          <p><span class="font-bold text-green-600 dark:text-green-400">How to Improve Overall:</span> Use varied phrasing, personal anecdotes, and unexpected ideas to boost scores. Mix short and long elements for rhythm, and incorporate synonyms or rarer words. Always edit with readability in mind to align with human patterns.</p>
          <p><span class="font-bold text-orange-600 dark:text-orange-400">Why it matters:</span> Search engines prioritize human-like content for higher rankings and user trust. Strong scores here reduce AI penalties and improve engagement metrics. Ultimately, this leads to better organic traffic and authority signals.</p>
        </div>
      </div>
      `;
    }).join('')}
  </div>
</div>
            
            
            

<div class="mt-20 space-y-8">
  <h2 class="text-4xl md:text-5xl font-black text-center text-gray-900 dark:text-gray-100">Top 3 Priority Fixes</h2>
  ${(() => {
    const modules = [
      {
        name: 'Perplexity',
        score: analysis.moduleScores[0],
        details: analysis.details.perplexity,
        fixes: [
          analysis.details.perplexity.scores.trigram < 10 ? 'To improve trigram entropy, deliberately introduce unexpected word combinations and personal anecdotes that don’t follow common patterns. This breaks predictable flows and makes your writing feel more spontaneous and human. Avoid sticking to safe, formulaic phrasing—edit specifically for surprise in every few sentences.' : '',
          analysis.details.perplexity.scores.bigram < 10 ? 'Boost bigram entropy by actively swapping overused two-word pairs with creative alternatives or rephrased expressions. Incorporate transitional phrases that aren’t common and sprinkle in idiomatic expressions unique to your voice. These small changes create a less robotic rhythm and significantly increase overall unpredictability.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Burstiness',
        score: analysis.moduleScores[1],
        details: analysis.details.burstiness,
        fixes: [
          analysis.details.burstiness.scores.sentence < 10 ? 'To increase sentence burstiness, consciously alternate between short, punchy sentences and longer, more detailed ones throughout your paragraphs. This variation mimics natural human speech rhythm and keeps readers engaged. Go through your text and intentionally split or combine sentences to eliminate uniform length patterns.' : '',
          analysis.details.burstiness.scores.word < 10 ? 'Improve word length burstiness by mixing very short, simple words with longer, descriptive ones to avoid monotony. Use everyday terms alongside occasional specialized or evocative vocabulary where it fits naturally. This creates subtle emphasis and makes the content feel more authentic and less mechanically generated.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Repetition',
        score: analysis.moduleScores[2],
        details: analysis.details.repetition,
        fixes: [
          analysis.details.repetition.scores.bigram < 10 ? 'Reduce bigram repetition by identifying the most common two-word phrases in your text and replacing them with synonyms or fully restructured sentences. Use a thesaurus strategically and ensure no single phrase dominates the content. This simple edit makes your writing far more dynamic and less predictable to both readers and search engines.' : '',
          analysis.details.repetition.scores.trigram < 10 ? 'To fix trigram repetition, scan for any three-word sequences that appear multiple times and rewrite them with fresh vocabulary or different sentence structure. Introduce new transitional ideas to break recurring patterns. Consistent variation here dramatically improves the natural flow and reduces obvious AI-like flags.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Sentence Length',
        score: analysis.moduleScores[3],
        details: analysis.details.sentenceLength,
        fixes: [
          analysis.details.sentenceLength.scores.avg < 10 ? 'Bring your average sentence length into the ideal 15–23 word range by breaking up overly long run-on sentences and combining short, choppy ones where appropriate. This balance significantly improves readability and flow for all readers. Make it a habit to count words per sentence during final edits to maintain optimal rhythm.' : '',
          analysis.details.sentenceLength.scores.complexity < 10 ? 'Increase sentence complexity by adding subordinate clauses using commas, semicolons, or conjunctions to layer related ideas naturally. This adds depth and sophistication without overwhelming the reader. Aim for 1–2 clauses in key sentences to better reflect complex human thought processes.' : ''
        ].filter(f => f).join('<br><br>')
      },
      {
        name: 'Vocabulary',
        score: analysis.moduleScores[4],
        details: analysis.details.vocabulary,
        fixes: [
          analysis.details.vocabulary.scores.diversity < 10 ? 'Boost vocabulary diversity by actively using synonyms and avoiding repetition of the same words throughout your content. Draw from broader themes, analogies, or related concepts to naturally introduce new terms. Higher unique word usage signals expertise and depth to both readers and search engines.' : '',
          analysis.details.vocabulary.scores.rare < 10 ? 'Enhance rare word frequency by incorporating context-specific or niche terms that appear only once or twice in the text. Research specialized vocabulary relevant to your topic and weave it in thoughtfully. These unique words create an authentic, authoritative tone that stands out as genuinely human-written.' : ''
        ].filter(f => f).join('<br><br>')
      }
    ];

    const priority = modules
      .filter(m => m.score < 20 && m.fixes)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    if (priority.length === 0) {
      return `
        <div class="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-green-500">
          <h3 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-6 text-center">No Major Fixes Needed!</h3>
          <p class="text-lg text-center text-gray-800 dark:text-gray-200">All modules scored 20/20. Your content is highly human-like and optimized.</p>
        </div>`;
    }

    return priority.map((m, i) => {
      const sub1Score = m.name === 'Perplexity' ? m.details.scores.trigram : m.name === 'Burstiness' ? m.details.scores.sentence : m.name === 'Repetition' ? m.details.scores.bigram : m.name === 'Sentence Length' ? m.details.scores.avg : m.details.scores.diversity;
      const sub2Score = m.name === 'Perplexity' ? m.details.scores.bigram : m.name === 'Burstiness' ? m.details.scores.word : m.name === 'Repetition' ? m.details.scores.trigram : m.name === 'Sentence Length' ? m.details.scores.complexity : m.details.scores.rare;
      const sub1Name = m.name === 'Perplexity' ? 'Trigram Entropy' : m.name === 'Burstiness' ? 'Sentence Length Variation' : m.name === 'Repetition' ? 'Bigram Repetition' : m.name === 'Sentence Length' ? 'Average Length' : 'Diversity';
      const sub2Name = m.name === 'Perplexity' ? 'Bigram Entropy' : m.name === 'Burstiness' ? 'Word Length Burstiness' : m.name === 'Repetition' ? 'Trigram Repetition' : m.name === 'Sentence Length' ? 'Sentence Complexity' : 'Rare Word Frequency';
      return `
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-8 md:p-10 shadow-lg border-l-8 border-orange-500">
          <div class="flex items-center mb-4">
            <div class="text-5xl font-black text-orange-600 dark:text-orange-400 mr-6">${i + 1}</div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">${m.name} – ${m.score}/20</h3>
              <div class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>${getPassFail(sub1Score)} ${sub1Name}</p>
                <p>${getPassFail(sub2Score)} ${sub2Name}</p>
              </div>
            </div>
          </div>
          <p class="text-lg text-gray-800 dark:text-gray-200 mt-6"><span class="font-bold text-orange-600 dark:text-orange-400">Recommended Fix:</span><br><br>${m.fixes || 'Focus on improving variation and authenticity in this area.'}</p>
        </div>`;
    }).join('');
  })()}
</div>




<div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
    <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Human Score Improvement</h3>
    <div class="flex justify-center items-baseline gap-4 mb-8">
      <div class="text-5xl font-black text-gray-500">${yourScore}</div>
      <div class="text-4xl text-gray-400">→</div>
      <div class="text-6xl font-black text-green-500">${Math.min(100, yourScore + boost)}</div>
      <div class="text-2xl text-green-600 font-medium">(${boost > 0 ? '+' + boost : 'Optimal'})</div>
    </div>
    ${failingModules === 0 ? `
      <div class="text-center py-8">
        <p class="text-4xl mb-4">🎉 Optimal Human Score Achieved!</p>
        <p class="text-lg text-gray-600 dark:text-gray-400">Your content shows excellent human-like patterns. Focus on building authority with quality backlinks.</p>
      </div>
    ` : `
      <div class="space-y-4">
        <p class="font-medium text-gray-700 dark:text-gray-300 text-center mb-4">Top priority fixes & estimated impact:</p>
        ${[
          {name: 'Perplexity', score: analysis.moduleScores[0], impact: '15–25 points'},
          {name: 'Burstiness', score: analysis.moduleScores[1], impact: '10–20 points'},
          {name: 'Repetition', score: analysis.moduleScores[2], impact: '10–20 points'},
          {name: 'Sentence Length', score: analysis.moduleScores[3], impact: '10–20 points'},
          {name: 'Vocabulary', score: analysis.moduleScores[4], impact: '15–25 points'}
        ].filter(m => m.score < 20)
         .sort((a, b) => a.score - b.score)
         .slice(0, 3)
         .map(m => `
          <div class="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <span class="text-sm md:text-base">${m.name}</span>
            <span class="font-bold text-orange-600">${m.impact}</span>
          </div>
        `).join('')}
      </div>
    `}
    <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
      <summary class="cursor-pointer font-medium text-orange-500 hover:underline">How We Calculated This</summary>
      <div class="mt-4 space-y-2">
        <p>• Perplexity & Vocabulary: High weight (up to 25 points each) – critical for authenticity</p>
        <p>• Burstiness & Sentence Length: Medium weight (up to 20 points) – improves natural rhythm</p>
        <p>• Repetition: Medium weight (up to 20 points) – reduces pattern detection</p>
        <p>• Top-ranking pages typically achieve 85+ human scores</p>
        <p class="italic">Conservative estimates — actual gains may vary</p>
      </div>
    </details>
  </div>
  <div class="p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
    ${failingModules === 0 ? `
      <div class="text-center py-12">
        <p class="text-4xl mb-4">🌟 Elite Human-Like Performance</p>
        <p class="text-xl">Your page demonstrates strong human patterns. Next step: build topical authority with backlinks and fresh content.</p>
      </div>
    ` : `
      <div class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="text-4xl">📈</div>
          <div class="flex-1">
            <p class="font-medium">Ranking Position Lift</p>
            <p class="text-2xl font-bold">5–20 positions potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🚀</div>
          <div class="flex-1">
            <p class="font-medium">Organic Traffic Increase</p>
            <p class="text-2xl font-bold">+15–40% potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">👥</div>
          <div class="flex-1">
            <p class="font-medium">User Engagement Boost</p>
            <p class="text-2xl font-bold">Higher dwell time & lower bounce</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🔍</div>
          <div class="flex-1">
            <p class="font-medium">Search Visibility Enhancement</p>
            <p class="text-2xl font-bold">Stronger presence in queries</p>
          </div>
        </div>
      </div>
    `}
    <div class="mt-10 text-sm space-y-2 opacity-90">
      <p>Conservative estimates based on on-page human pattern benchmarks.</p>
      <p>Improvements typically visible within 1–4 weeks after re-crawl.</p>
      <p>Actual results depend on competition, domain authority, and off-page factors.</p>
    </div>
  </div>
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
        
        
        
      }, remaining);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      setTimeout(() => {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-500 dark:text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }, remaining);
    }
  });
});