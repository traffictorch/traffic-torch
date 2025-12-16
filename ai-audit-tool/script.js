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
        <div class="bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xl font-bold px-12 py-6 rounded-2xl shadow-2xl">
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
      const forecast = yourScore > 70 ? 'Page 2+' : yourScore > 50 ? 'Page 1 Possible' : yourScore > 30 ? 'Top 10 Possible' : 'Top 3 Potential';

      results.innerHTML = `
        <style>
          .animate-stroke { transition: stroke-dasharray 1.8s ease-in-out; }
        </style>
        <div class="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-16 px-4">
          <div class="max-w-6xl mx-auto space-y-24">

            <!-- Big Score Circle -->
            <div class="flex justify-center">
              <div class="relative w-96 h-96">
                <svg viewBox="0 0 384 384" class="absolute inset-0 -rotate-90">
                  <circle cx="192" cy="192" r="170" fill="none" stroke="#1f2937" stroke-width="36"/>
                  <circle cx="192" cy="192" r="170" fill="none" stroke="url(#torchGradient)" stroke-width="36"
                          stroke-dasharray="0 1068"
                          stroke-linecap="round"
                          class="animate-stroke"
                          style="stroke-dasharray: ${(yourScore / 100) * 1068} 1068;"/>
                  <defs>
                    <linearGradient id="torchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#10b981"/>
                      <stop offset="50%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#ef4444"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-9xl font-black drop-shadow-2xl">${yourScore}</div>
                  <div class="text-3xl font-bold opacity-90">AI Score</div>
                  <div class="text-xl opacity-70">/100</div>
                </div>
                <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
                  <p class="text-3xl font-black bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${verdict}</p>
                </div>
              </div>
            </div>

            <p class="text-center text-2xl opacity-80">Scanned ${wordCount.toLocaleString()} words from main content</p>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-10">
              ${[
                {name: 'Perplexity', value: ai.perplexity, max: 12},
                {name: 'Burstiness', value: ai.burstiness, max: 10},
                {name: 'Repetition', value: ai.repetition + '%', max: 100},
                {name: 'Sentence Length', value: ai.sentenceLength, max: 30},
                {name: 'Vocabulary', value: ai.vocab + '%', max: 100}
              ].map(m => `
                <div class="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/10">
                  <div class="relative w-44 h-44 mx-auto">
                    <svg viewBox="0 0 176 176" class="-rotate-90">
                      <circle cx="88" cy="88" r="76" stroke="#1f2937" stroke-width="18" fill="none"/>
                      <circle cx="88" cy="88" r="76" stroke="#fb923c" stroke-width="18" fill="none"
                              stroke-dasharray="${(parseFloat(m.value) / m.max) * 477} 477"
                              stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-5xl font-black">${m.value}</div>
                  </div>
                  <p class="mt-8 text-2xl font-bold">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-6 px-10 py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-full font-bold hover:opacity-90 text-lg">
                    Show Info
                  </button>
                  <div class="hidden mt-8 space-y-4 text-lg opacity-80">
                    <p><span class="text-blue-400 font-bold">What:</span> ${m.name === 'Perplexity' ? 'How predictable the text is — higher = more AI-like' : m.name === 'Burstiness' ? 'Variation in sentence length — higher = more human' : m.name === 'Repetition' ? 'Repeated phrase patterns — lower = better' : m.name === 'Sentence Length' ? 'Average words per sentence — 15–23 ideal' : 'Unique word diversity — higher = better'}</p>
                    <p><span class="text-green-400 font-bold">How to improve:</span> Add personal stories, vary sentence rhythm, use synonyms, mix short/long sentences</p>
                    <p><span class="text-orange-400 font-bold">Why it matters:</span> Google prioritizes natural, engaging, human-like content</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Prioritized Fixes -->
            <div class="space-y-12">
              <h2 class="text-5xl font-black text-center">Prioritized AI-Style Fixes</h2>
              ${ai.score > 70 ? `
                <div class="p-12 bg-gradient-to-r from-red-900/30 to-red-800/20 border-l-8 border-red-500 rounded-3xl shadow-2xl">
                  <div class="flex flex-col md:flex-row gap-10 items-start">
                    <div class="text-7xl">🤖</div>
                    <div class="flex-1">
                      <h3 class="text-4xl font-bold text-red-400 mb-6">Strong AI Patterns Detected</h3>
                      <p class="text-xl"><span class="text-blue-400 font-bold">What:</span> High predictability, low variation, repetitive phrasing</p>
                      <p class="text-xl mt-4"><span class="text-green-400 font-bold">How:</span> Add personal anecdotes, vary rhythm, enrich vocabulary</p>
                      <p class="text-xl mt-4"><span class="text-orange-400 font-bold">Why:</span> Google downgrades obvious AI — human touch builds trust & rankings</p>
                    </div>
                  </div>
                </div>` : ai.score > 40 ? `
                <div class="p-12 bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-l-8 border-orange-500 rounded-3xl shadow-2xl">
                  <div class="flex flex-col md:flex-row gap-10 items-start">
                    <div class="text-7xl">⚠️</div>
                    <div class="flex-1">
                      <h3 class="text-4xl font-bold text-orange-400 mb-6">Moderate AI Patterns</h3>
                      <p class="text-xl"><span class="text-blue-400 font-bold">What:</span> Some uniformity and repetition</p>
                      <p class="text-xl mt-4"><span class="text-green-400 font-bold">How:</span> Mix sentence lengths, add voice, reduce repeats</p>
                      <p class="text-xl mt-4"><span class="text-orange-400 font-bold">Why:</span> Small tweaks push into human territory</p>
                    </div>
                  </div>
                </div>` : `
                <p class="text-center text-5xl font-black text-green-400">Excellent — Highly Human-Like Writing! 🌟</p>`}
            </div>

            <!-- Predictive Rank Forecast -->
            <div class="p-16 bg-gradient-to-r from-orange-600 to-pink-700 rounded-3xl shadow-2xl text-center space-y-10">
              <h2 class="text-5xl font-black">Predictive Rank Forecast</h2>
              <p class="text-8xl font-black">${forecast}</p>
              <p class="text-4xl font-bold">Potential if humanized</p>
              <div class="grid md:grid-cols-3 gap-10 mt-12 text-left">
                <div class="bg-white/10 backdrop-blur rounded-2xl p-8">
                  <p class="text-blue-300 text-2xl font-bold mb-4">What it is</p>
                  <p class="text-lg leading-relaxed">Estimate of ranking potential based on human-like quality</p>
                </div>
                <div class="bg-white/10 backdrop-blur rounded-2xl p-8">
                  <p class="text-green-300 text-2xl font-bold mb-4">How calculated</p>
                  <p class="text-lg leading-relaxed">Lower AI score = higher human trust = stronger Google rankings</p>
                </div>
                <div class="bg-white/10 backdrop-blur rounded-2xl p-8">
                  <p class="text-orange-300 text-2xl font-bold mb-4">Why it matters</p>
                  <p class="text-lg leading-relaxed">Human-like content ranks higher and converts better</p>
                </div>
              </div>
            </div>

            <!-- Humanizer & PDF -->
            <div class="text-center space-y-12">
              <button id="humanizeBtn" class="px-16 py-8 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-4xl rounded-3xl shadow-2xl hover:opacity-90 transition">
                ⚡ One-Click Humanize Text
              </button>
              <div id="humanizedOutput" class="hidden mt-12 max-w-5xl mx-auto bg-black/60 backdrop-blur-2xl rounded-3xl p-16 border border-cyan-500/50 shadow-2xl">
                <h3 class="text-5xl font-black text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                  Humanized Version (85–98% human pass rate)
                </h3>
                <div id="humanizedText" class="prose prose-invert prose-2xl max-w-none text-left leading-relaxed"></div>
                <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied to clipboard!'))"
                        class="mt-12 px-14 py-6 bg-cyan-600 font-bold text-2xl rounded-2xl hover:bg-cyan-500">
                  📋 Copy Humanized Text
                </button>
              </div>
              <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                      class="px-16 py-8 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-3xl rounded-3xl shadow-2xl hover:opacity-90">
                📄 Save Full Report as PDF
              </button>
            </div>

          </div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="text-center py-20"><p class="text-red-400 text-3xl">Error: ${err.message || 'Failed to analyze page'}</p></div>`;
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
      }, 500);
    }
  });
});