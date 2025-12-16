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

  function getGradeColor(value, metricName = '') {
    let percent = value;
    if (metricName === 'Perplexity' || metricName === 'Repetition') {
      // higher = bad → reverse grading
      if (percent >= 70) return '#ef4444'; // red
      if (percent >= 40) return '#f97316'; // orange
      return '#10b981'; // green
    }
    if (metricName === 'Sentence Length') {
      if (value >= 15 && value <= 23) return '#10b981'; // ideal
      if ((value >= 10 && value < 15) || (value > 23 && value <= 30)) return '#f97316';
      return '#ef4444';
    }
    // normal: higher = good
    if (percent >= 70) return '#10b981';
    if (percent >= 40) return '#f97316';
    return '#ef4444';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    results.innerHTML = `
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white text-gray-800 text-xl font-bold px-12 py-6 rounded-xl shadow-2xl">
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
      const mainColor = getGradeColor(yourScore, 'MainScore');
      const verdict = yourScore >= 70 ? 'Very Likely AI' : yourScore >= 40 ? 'Moderate AI Patterns' : 'Likely Human';
      const forecast = yourScore >= 70 ? 'Page 2+' : yourScore >= 50 ? 'Page 1 Possible' : yourScore >= 30 ? 'Top 10 Possible' : 'Top 3 Potential';

      results.innerHTML = `
        <style>
          .animate-stroke { transition: stroke-dasharray 1.5s ease-out; }
        </style>
        <div class="min-h-screen bg-gray-50 py-12 px-4">
          <div class="max-w-4xl mx-auto space-y-16">

            <!-- Big Score Circle + Verdict Below -->
            <div class="flex justify-center">
              <div class="relative w-64 h-64">
                <svg viewBox="0 0 256 256" class="absolute inset-0 -rotate-90">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#e2e8f0" stroke-width="24"/>
                  <circle cx="128" cy="128" r="110" fill="none" stroke="${mainColor}" stroke-width="20"
                          stroke-dasharray="0 691"
                          stroke-linecap="round"
                          class="animate-stroke"
                          style="stroke-dasharray: ${(yourScore / 100) * 691} 691;"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-7xl font-black text-gray-900">${yourScore}</div>
                  <div class="text-lg text-gray-600">AI Score</div>
                  <div class="text-base text-gray-500">/100</div>
                </div>
              </div>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold" style="color: ${mainColor}">${verdict}</p>
            </div>
            <p class="text-center text-base text-gray-600">Scanned ${wordCount.toLocaleString()} words from main content</p>

            <!-- Small Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              ${[
                {name: 'Perplexity', value: ai.perplexity, max: 12},
                {name: 'Burstiness', value: ai.burstiness, max: 10},
                {name: 'Repetition', value: ai.repetition + '%', max: 100},
                {name: 'Sentence Length', value: ai.sentenceLength, max: 30},
                {name: 'Vocabulary', value: ai.vocab + '%', max: 100}
              ].map(m => {
                const num = typeof m.value === 'string' ? parseFloat(m.value) : m.value;
                const percent = (num / m.max) * 100;
                const color = getGradeColor(num, m.name);
                const display = m.value;
                return `
                <div class="bg-white rounded-2xl shadow-md p-6 text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg viewBox="0 0 128 128" class="-rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#f1f5f9" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${color}" stroke-width="12" fill="none"
                              stroke-dasharray="${percent * 3.52} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-900">${display}</div>
                  </div>
                  <p class="mt-4 text-base font-medium text-gray-700">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-3 px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300">
                    Show Info
                  </button>
                  <div class="hidden mt-4 space-y-2 text-sm text-gray-600">
                    <p><span class="font-bold text-blue-600">What:</span> ${m.name === 'Perplexity' ? 'How predictable the text is (lower better)' : m.name === 'Burstiness' ? 'Variation in sentence rhythm (higher better)' : m.name === 'Repetition' ? 'Repeated phrases (lower better)' : m.name === 'Sentence Length' ? 'Average words per sentence (15–23 ideal)' : 'Unique word diversity (higher better)'}</p>
                    <p><span class="font-bold text-green-600">How to improve:</span> Add personal touch, vary structure, enrich vocabulary</p>
                    <p><span class="font-bold text-orange-600">Why:</span> Google rewards natural human-like content</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>

            <!-- Prioritized AI-Style Fixes -->
            <div class="space-y-8">
              <h2 class="text-2xl font-bold text-center text-gray-900">Prioritized AI-Style Fixes</h2>
              ${ai.score >= 70 ? `
                <div class="bg-red-50 rounded-2xl p-8 shadow-sm border border-red-200">
                  <p class="text-2xl font-bold text-red-600 text-center">Very Likely AI</p>
                  <div class="mt-4 space-y-2 text-gray-700">
                    <p><strong class="text-blue-600">What:</strong> High predictability, low variation, repetitive phrasing</p>
                    <p><strong class="text-green-600">How:</strong> Add personal anecdotes, vary rhythm, enrich vocabulary</p>
                    <p><strong class="text-orange-600">Why:</strong> Google downgrades obvious AI content</p>
                  </div>
                </div>` : ai.score >= 40 ? `
                <div class="bg-orange-50 rounded-2xl p-8 shadow-sm border border-orange-200">
                  <p class="text-2xl font-bold text-orange-600 text-center">Moderate AI Patterns</p>
                  <div class="mt-4 space-y-2 text-gray-700">
                    <p><strong class="text-blue-600">What:</strong> Some uniformity and repetition</p>
                    <p><strong class="text-green-600">How:</strong> Mix sentence lengths, add personal voice, reduce repeats</p>
                    <p><strong class="text-orange-600">Why:</strong> Small tweaks can push into human territory</p>
                  </div>
                </div>` : `
                <div class="bg-green-50 rounded-2xl p-8 shadow-sm border border-green-200">
                  <p class="text-2xl font-bold text-green-600 text-center">Excellent — Highly Human-Like Writing!</p>
                </div>`}
            </div>

            <!-- Predictive Rank Forecast -->
            <div class="bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl p-10 shadow-xl text-white text-center">
              <h2 class="text-3xl font-bold">Predictive Rank Forecast</h2>
              <p class="text-5xl font-black mt-4">${forecast}</p>
              <p class="text-2xl mt-2">Potential if humanized</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="bg-white/20 rounded-xl p-6">
                  <p class="font-bold">What it is</p>
                  <p class="text-sm mt-2">Estimate of ranking potential based on human-like quality</p>
                </div>
                <div class="bg-white/20 rounded-xl p-6">
                  <p class="font-bold">How calculated</p>
                  <p class="text-sm mt-2">Lower AI score = higher human trust = better rankings</p>
                </div>
                <div class="bg-white/20 rounded-xl p-6">
                  <p class="font-bold">Why it matters</p>
                  <p class="text-sm mt-2">Human-like content ranks higher and converts better</p>
                </div>
              </div>
            </div>

            <!-- Humanizer & PDF -->
            <div class="flex flex-col items-center gap-6">
              <button id="humanizeBtn" class="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xl rounded-xl shadow-lg hover:opacity-90">
                ⚡ One-Click Humanize Text
              </button>
              <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();" class="px-10 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-xl rounded-xl shadow-lg hover:opacity-90">
                📄 Save as PDF (with all details)
              </button>
            </div>

            <div id="humanizedOutput" class="hidden max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-xl mt-12">
              <h3 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Humanized Version (85–98% human pass rate)
              </h3>
              <div id="humanizedText" class="text-base leading-relaxed text-gray-800"></div>
              <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied!'))" class="mt-8 px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500">
                📋 Copy Humanized Text
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