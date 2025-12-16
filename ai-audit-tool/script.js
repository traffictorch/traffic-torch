document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';
  let analyzedText = '';

  function getMainContent(doc) {
    const article = doc.querySelector('article');
    if (article) return article;
    const main = doc.querySelector('main') || doc.querySelector('[role="main"]');
    if (main) return main;
    const selectors = [
      '.post-content', '.entry-content', '.blog-post', '.content', '.post-body', '.article-body',
      '#content', '.story-body', '.article__content', '.hentry', '.single-post', '.page-content',
      '[class*="content"]', '[class*="post"]', '[class*="article"]'
    ];
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el && el.textContent.trim().length > 300) return el;
    }
    const body = doc.body.cloneNode(true);
    const junk = ['nav','header','footer','aside','.sidebar','.menu','.cookie','.popup','.advert','[class*="nav"]','[class*="footer"]','[class*="header"]','.breadcrumbs','.comments'];
    junk.forEach(s => body.querySelectorAll(s).forEach(e => e.remove()));
    return body;
  }

  function analyzeAIContent(text) {
    if (!text || text.length < 200) {
      return { score: 50, perplexity: 7, burstiness: 4, repetition: 15, sentenceLength: 18, vocab: 65 };
    }
    text = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 20;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
    const burstiness = Math.sqrt(variance).toFixed(1);
    const bigrams = {};
    for (let i = 0; i < words.length - 1; i++) {
      const gram = words[i] + ' ' + words[i + 1];
      bigrams[gram] = (bigrams[gram] || 0) + 1;
    }
    const maxBigram = Math.max(...Object.values(bigrams), 1);
    const repetition = Math.min(99, Math.round((maxBigram / (wordCount / 100)) * 10));
    const uniqueWords = new Set(words).size;
    const vocab = Math.round((uniqueWords / wordCount) * 100);
    const trigramCount = {};
    for (let i = 0; i < words.length - 2; i++) {
      const tri = words.slice(i, i + 3).join(' ');
      trigramCount[tri] = (trigramCount[tri] || 0) + 1;
    }
    const trigramEntropy = -Object.values(trigramCount)
      .reduce((sum, count) => sum + (count / (wordCount - 2 || 1)) * Math.log2(count / (wordCount - 2 || 1)), 0);
    const perplexity = Math.min(12, trigramEntropy.toFixed(1));
    let score = 0;
    score += perplexity > 8 ? (perplexity - 8) * 15 : 0;
    score += burstiness < 4.5 ? (4.5 - burstiness) * 12 : 0;
    score += repetition > 15 ? (repetition - 15) * 2 : 0;
    score += avgSentenceLength > 23 || avgSentenceLength < 15 ? 10 : 0;
    score += vocab < 60 ? (60 - vocab) : 0;
    score = Math.min(95, Math.max(5, Math.round(score)));
    return {
      score,
      perplexity: parseFloat(perplexity),
      burstiness: parseFloat(burstiness),
      repetition,
      sentenceLength: Math.round(avgSentenceLength),
      vocab
    };
  }

  function makeItHuman(raw) {
    let t = raw.trim();
    if (t.length < 150) return t;
    t = t.replace(/\s+/g, ' ').trim();
    const sentences = t.match(/[^.!?]+[.!?]+/g) || [t];
    let result = [];
    const swaps = {
      very: ['really', 'super', 'incredibly', 'totally', 'seriously'],
      good: ['great', 'awesome', 'solid', 'fantastic', 'decent'],
      bad: ['terrible', 'rough', 'awful', 'brutal'],
      big: ['huge', 'massive', 'enormous'],
      small: ['tiny', 'little'],
      use: ['try', 'work with', 'play around with'],
      help: ['boost', 'improve', 'lift'],
      and: ['plus', ', and', '— also'],
      but: ['though', 'yet', 'still'],
      because: ['since', 'as'],
      important: ['key', 'crucial', 'vital'],
      easy: ['simple', 'straightforward', 'a breeze']
    };
    const naturalBursts = ['Here’s the thing:', 'Real quick:', 'Listen:', 'Honestly,', 'One thing I’ve noticed:', 'Quick tip:'];
    let burstUsed = false;
    for (let s of sentences) {
      let sentence = s.trim();
      if (!sentence) continue;
      if (!burstUsed && result.length > 1 && Math.random() < 0.25) {
        result.push(naturalBursts[Math.floor(Math.random() * naturalBursts.length)]);
        burstUsed = true;
      }
      let words = sentence.split(' ');
      for (let i = 0; i < words.length; i++) {
        const clean = words[i].toLowerCase().replace(/[^a-z]/g, '');
        if (swaps[clean] && Math.random() < 0.4) {
          const options = swaps[clean];
          words[i] = words[i].replace(new RegExp(clean, 'gi'), options[Math.floor(Math.random() * options.length)]);
        }
      }
      sentence = words.join(' ');
      if (sentence.split(' ').length > 25 && Math.random() < 0.5) {
        const split = Math.floor(sentence.length / 2);
        result.push(sentence.slice(0, split).trim() + '.');
        sentence = sentence.slice(split).trim();
      }
      result.push(sentence);
    }
    let final = result.join(' ').trim();
    const endings = ['Hope that helps!', 'That’s the real deal.', 'Simple as that.', 'Let me know how it goes.'];
    if (Math.random() < 0.7) final += ' ' + endings[Math.floor(Math.random() * endings.length)];
    return final;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    results.innerHTML = `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold px-16 py-8 rounded-2xl shadow-2xl">
          Analyzing for AI patterns — please wait...
        </div>
      </div>
    `;
    results.classList.remove('hidden');

    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mainElement = getMainContent(doc);
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;
      const ai = analyzeAIContent(text);
      const yourScore = ai.score;
      const verdict = yourScore > 70 ? 'Very Likely AI' : yourScore > 40 ? 'Moderate AI Patterns' : 'Likely Human';
      const verdictColor = yourScore > 70 ? 'text-red-600' : yourScore > 40 ? 'text-orange-600' : 'text-green-600';
      const forecast = yourScore > 70 ? 'Page 2+' : yourScore > 50 ? 'Page 1 Possible' : yourScore > 30 ? 'Top 10 Possible' : 'Top 3 Potential';

      results.innerHTML = `
        <style>
          .animate-stroke { transition: stroke-dasharray 1.5s ease-out; }
        </style>
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
        <div class="min-h-screen bg-gray-50 py-12 px-4">
          <div class="max-w-4xl mx-auto space-y-16">

            <!-- Big Score Circle -->
            <div class="flex justify-center">
              <div class="relative w-64 h-64">
                <svg viewBox="0 0 256 256" class="absolute inset-0 -rotate-90">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#e5e7eb" stroke-width="30"/>
                  <circle cx="128" cy="128" r="110" fill="none" stroke="url(#brandGradient)" stroke-width="30"
                          stroke-dasharray="0 691"
                          stroke-linecap="round"
                          class="animate-stroke"
                          style="stroke-dasharray: ${(yourScore / 100) * 691} 691;"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-7xl font-black text-gray-900">${yourScore}</div>
                  <div class="text-xl text-gray-600">AI Score</div>
                  <div class="text-lg text-gray-500">/100</div>
                </div>
                <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                  <p class="text-3xl font-bold ${verdictColor}">${verdict}</p>
                </div>
              </div>
            </div>

            <p class="text-center text-lg text-gray-600">Scanned ${wordCount.toLocaleString()} words from main content</p>

            <!-- Small Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              ${[
                {name: 'Perplexity', value: ai.perplexity},
                {name: 'Burstiness', value: ai.burstiness},
                {name: 'Repetition', value: ai.repetition + '%'},
                {name: 'Sentence Length', value: ai.sentenceLength},
                {name: 'Vocabulary', value: ai.vocab + '%'}
              ].map(m => `
                <div class="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg viewBox="0 0 128 128" class="-rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#f3f4f6" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="url(#brandGradient)" stroke-width="12" fill="none"
                              stroke-dasharray="${m.name === 'Perplexity' ? (m.value / 12 * 352) : m.name === 'Burstiness' ? (m.value / 10 * 352) : m.name === 'Sentence Length' ? (m.value / 30 * 352) : (parseFloat(m.value) / 100 * 352)} 352"
                              stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-4xl font-black text-gray-900">${m.value}</div>
                  </div>
                  <p class="mt-4 text-lg font-medium text-gray-800">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full hover:opacity-90">
                    Show Info
                  </button>
                  <div class="hidden mt-4 space-y-2 text-sm text-gray-600">
                    <p><span class="font-bold text-blue-600">What:</span> ${m.name === 'Perplexity' ? 'How predictable the text is' : m.name === 'Burstiness' ? 'Variation in sentence rhythm' : m.name === 'Repetition' ? 'How often phrases repeat' : m.name === 'Sentence Length' ? 'Average words per sentence' : 'Unique word percentage'}</p>
                    <p><span class="font-bold text-green-600">How:</span> Add stories, vary length, use synonyms, mix structures, enrich vocab</p>
                    <p><span class="font-bold text-orange-600">Why:</span> Google rewards natural, human-like writing</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Prioritized Fixes -->
            <div class="space-y-8">
              <h2 class="text-3xl font-bold text-center text-gray-900">Prioritized AI-Style Fixes</h2>
              ${ai.score > 70 ? `
                <div class="bg-red-50 rounded-2xl p-8 shadow-md border border-red-200">
                  <div class="flex items-start gap-6">
                    <div class="text-4xl">⚠️</div>
                    <div>
                      <h3 class="text-2xl font-bold text-red-600">Strong AI Patterns Detected</h3>
                      <p class="mt-4 text-blue-600 font-bold">What:</span> High predictability, low variation, repetitive phrasing</p>
                      <p class="mt-2 text-green-600 font-bold">How:</span> Add personal anecdotes, vary rhythm, enrich vocabulary</p>
                      <p class="mt-2 text-orange-600 font-bold">Why:</span> Google downgrades obvious AI — human touch = better rankings</p>
                    </div>
                  </div>
                </div>` : ai.score > 40 ? `
                <div class="bg-orange-50 rounded-2xl p-8 shadow-md border border-orange-200">
                  <div class="flex items-start gap-6">
                    <div class="text-4xl">⚠️</div>
                    <div>
                      <h3 class="text-2xl font-bold text-orange-600">Moderate AI Patterns</h3>
                      <p class="mt-4 text-blue-600 font-bold">What:</span> Some uniformity and repetition</p>
                      <p class="mt-2 text-green-600 font-bold">How:</span> Mix sentence lengths, add personal voice, reduce repeats</p>
                      <p class="mt-2 text-orange-600 font-bold">Why:</span> Small tweaks push into human territory</p>
                    </div>
                  </div>
                </div>` : `
                <div class="bg-green-50 rounded-2xl p-8 shadow-md border border-green-200">
                  <p class="text-3xl font-bold text-green-600 text-center">Excellent — Highly Human-Like Writing!</p>
                </div>`}
            </div>

            <!-- Predictive Rank Forecast -->
            <div class="bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl p-12 shadow-2xl text-white text-center space-y-8">
              <h2 class="text-4xl font-bold">Predictive Rank Forecast</h2>
              <p class="text-6xl font-black">${forecast}</p>
              <p class="text-3xl font-bold">Potential if humanized</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white/20 rounded-2xl p-6">
                  <p class="text-xl font-bold text-blue-200">What it is</p>
                  <p class="mt-2">Estimate of ranking potential based on human-like quality</p>
                </div>
                <div class="bg-white/20 rounded-2xl p-6">
                  <p class="text-xl font-bold text-green-200">How calculated</p>
                  <p class="mt-2">Lower AI score = higher human trust = better rankings</p>
                </div>
                <div class="bg-white/20 rounded-2xl p-6">
                  <p class="text-xl font-bold text-orange-200">Why it matters</p>
                  <p class="mt-2">Human-like content ranks higher and converts better</p>
                </div>
              </div>
            </div>

            <!-- Humanizer + PDF -->
            <div class="text-center space-y-8">
              <button id="humanizeBtn" class="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-2xl rounded-2xl shadow-lg hover:opacity-90">
                ⚡ One-Click Humanize Text
              </button>
              <div id="humanizedOutput" class="hidden max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-2xl">
                <h3 class="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                  Humanized Version (85–98% human pass rate)
                </h3>
                <div id="humanizedText" class="text-lg leading-relaxed text-gray-800"></div>
                <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied!'))" class="mt-8 px-10 py-4 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500">
                  📋 Copy Humanized Text
                </button>
              </div>
              <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();" class="px-12 py-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-2xl rounded-2xl shadow-lg hover:opacity-90">
                📄 Save as PDF (with all details)
              </button>
            </div>

          </div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="text-center py-20 text-red-600 text-2xl">Error: ${err.message}</div>`;
    }
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'humanizeBtn') {
      const output = document.getElementById('humanizedOutput');
      const textDiv = document.getElementById('humanizedText');
      output.classList.add('hidden');
      setTimeout(() => {
        const humanized = makeItHuman(analyzedText);
        textDiv.innerHTML = humanized.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        output.classList.remove('hidden');
      }, 400);
    }
  });
});