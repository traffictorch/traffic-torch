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
      if (el && el.textContent.length > 300) return el;
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
      .reduce((sum, count) => sum + (count / (wordCount - 2)) * Math.log2(count / (wordCount - 2)), 0);
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

  function generateFixes(ai) {
    const fixes = [];
    if (ai.perplexity > 8) fixes.push("Add personal stories, humor, and unexpected turns to reduce predictability.");
    if (ai.burstiness < 4.5) fixes.push("Mix short punchy sentences with longer ones for natural rhythm.");
    if (ai.repetition > 15) fixes.push("Use synonyms and restructure sentences to reduce repetition.");
    if (ai.sentenceLength < 15 || ai.sentenceLength > 25) fixes.push("Aim for average sentence length of 15–25 words.");
    if (ai.vocab < 60) fixes.push("Incorporate metaphors, idioms, and niche terminology.");
    return fixes;
  }

  function predictForecast(aiScore) {
    const potential = 100 - aiScore;
    if (potential > 60) return "Top 3 Potential";
    if (potential > 40) return "Top 10 Possible";
    if (potential > 20) return "Page 1 Possible";
    return "Page 2+";
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    results.innerHTML = `
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-2xl z-50">
        Analyzing for AI patterns — please wait...
      </div>
    `;
    results.classList.remove('hidden');

    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mainElement = getMainContent(doc);
      const title = doc.querySelector('title')?.textContent?.trim() || 'Untitled';
      const cleanElement = mainElement.cloneNode(true);
      cleanElement.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      let text = cleanElement.textContent || '';
      text = text.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ' ').trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
      analyzedText = text;
      const ai = analyzeAIContent(text);
      const fixes = generateFixes(ai);
      const forecast = predictForecast(ai.score);

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 animate-in">
          <!-- Big Overall Score Circle -->
          <div class="flex justify-center my-12">
            <div class="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                        stroke-dasharray="${(ai.score / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="bigGradient">
                    <stop offset="0%" stop-color="#22c55e"/>
                    <stop offset="100%" stop-color="#ef4444"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-7xl font-black text-white drop-shadow-2xl glow">${ai.score}</div>
                  <div class="text-2xl text-white/90">/100 AI Score</div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Detection Verdict -->
          <div class="text-center mb-12">
            <p class="text-4xl font-black mb-4">
              Detection: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                ${ai.score > 70 ? 'Very Likely AI' : ai.score > 40 ? 'Moderate AI Patterns' : 'Likely Human'}
              </span>
            </p>
            <p class="text-xl text-gray-400">Scanned ${wordCount.toLocaleString()} words from main content</p>
          </div>

          <!-- Small Module Circles -->
          <div class="grid md:grid-cols-5 gap-6 my-16">
            ${[
              {name: 'Perplexity', value: ai.perplexity},
              {name: 'Burstiness', value: ai.burstiness},
              {name: 'Repetition', value: ai.repetition + '%'},
              {name: 'Sentence Length', value: ai.sentenceLength},
              {name: 'Vocabulary', value: ai.vocab + '%'}
            ].map(m => `
              <div class="text-center">
                <div class="relative mx-auto w-32 h-32">
                  <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                    <circle cx="64" cy="64" r="56" stroke="#fb923c" stroke-width="12" fill="none"
                            stroke-dasharray="${(parseFloat(m.value) / 100) * 352} 352" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-3xl font-black text-white drop-shadow-lg">
                    ${m.value}
                  </div>
                </div>
                <p class="mt-4 text-lg font-medium">${m.name}</p>
              </div>
            `).join('')}
          </div>

          <!-- Prioritized Fixes -->
          <div class="space-y-8">
            <h3 class="text-4xl font-black text-center mb-8">Prioritized AI-Style Fixes</h3>
            ${fixes.length ? fixes.map(fix => `
              <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
                <div class="flex gap-6">
                  <div class="text-5xl">🔧</div>
                  <div class="text-lg leading-relaxed">${fix}</div>
                </div>
              </div>
            `).join('') : '<p class="text-center text-green-400 text-2xl">No major AI patterns detected — excellent human-like writing!</p>'}
          </div>

          <!-- Predictive Rank Forecast -->
          <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
            <h3 class="text-4xl font-black text-center">Predictive Rank Forecast</h3>
            <p class="text-center text-7xl font-black mt-6">${forecast}</p>
            <p class="text-center text-2xl mt-4">Potential if humanized</p>
            <p class="text-center text-lg italic opacity-80 mt-6">
              Higher human-like score = better Google trust and ranking potential
            </p>
          </div>

          <!-- Humanize + PDF -->
          <div class="text-center space-y-8 my-16">
            <button id="humanizeBtn" class="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-2xl rounded-2xl shadow-lg hover:opacity-90">
              ⚡ One-Click Humanize Text
            </button>
            <div id="humanizedOutput" class="hidden mt-8 max-w-4xl mx-auto bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/50">
              <h3 class="text-4xl font-black text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Humanized Version
              </h3>
              <div id="humanizedText" class="prose prose-invert max-w-none text-lg leading-relaxed"></div>
              <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied!'))"
                      class="mt-8 px-10 py-4 bg-cyan-600 font-bold rounded-xl hover:bg-cyan-500">
                📋 Copy Text
              </button>
            </div>
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
              📄 Save as PDF (with all details)
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.matches('#humanizeBtn')) return;
    const output = document.getElementById('humanizedOutput');
    const textDiv = document.getElementById('humanizedText');
    output.classList.add('hidden');
    setTimeout(() => {
      const humanized = makeItHuman(analyzedText);
      textDiv.innerHTML = humanized.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
      output.classList.remove('hidden');
    }, 400);
  });
});