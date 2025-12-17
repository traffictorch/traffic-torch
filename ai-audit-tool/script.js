document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const input = document.getElementById('url-input');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';
  let analyzedText = '';

       function getMainContent(doc) {
    // 1. Try explicit main content containers
    const main = doc.querySelector('main, [role="main"], article, .main-content, .site-content, .content-area');
    if (main && main.textContent.trim().length > 600) {
      return main;
    }

    // 2. Find the element with the most paragraph-like content
    const candidates = doc.querySelectorAll('div, section, article');
    let best = null;
    let bestScore = 0;

    candidates.forEach(el => {
      if (el.closest('header, nav, footer, aside, .menu, .sidebar')) return;

      const paragraphs = el.querySelectorAll('p');
      const textLength = el.textContent.trim().length;
      const pCount = paragraphs.length;

      // Score: favor lots of <p> tags and decent length
      const score = pCount * 100 + textLength;
      if (score > bestScore && textLength > 600 && textLength < 20000) {
        bestScore = score;
        best = el;
      }
    });

    if (best) return best;

    // 3. Fallback: body with aggressive removal
    const body = doc.body.cloneNode(true);
    const removeSelectors = 'header, nav, footer, aside, .menu, .navbar, .sidebar, .cookie-banner, .popup, .social-links, .breadcrumbs';
    body.querySelectorAll(removeSelectors).forEach(e => e.remove());

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
    if (t.length < 250) return t;

    // General cleanup
    t = t.replace(/Skip to (main )?content/gi, '')
         .replace(/\b(Home|About|Services|Contact|Blog|Shop|Cart|Login|Signup|Reserve|Book|Explore|Discover|View|Learn|Get Started|Sign Up)\b/gi, '')
         .replace(/\s+/g, ' ')
         .trim();

    const sentences = t.match(/[^.!?]+[.!?]+/g) || [t];
    let result = [];

    const swaps = {
      very: ['truly', 'genuinely', 'highly'],
      good: ['excellent', 'strong', 'solid'],
      best: ['finest', 'leading', 'top'],
      big: ['vast', 'extensive', 'significant'],
      small: ['limited', 'compact', 'minor'],
      use: ['try', 'apply', 'work with', 'utilize'],
      help: ['assist', 'support', 'boost', 'enhance'],
      important: ['key', 'essential', 'critical'],
      easy: ['simple', 'straightforward', 'clear']
    };

    const subtleIntroducers = [
      'Notably,',
      'In particular,',
      'Especially,',
      'One key aspect is'
    ];

    let introducerUsed = false;

    for (let s of sentences) {
      let sentence = s.trim();
      if (!sentence || sentence.length < 30) continue;

      if (!introducerUsed && result.length > 2 && Math.random() < 0.15) {
        result.push(subtleIntroducers[Math.floor(Math.random() * subtleIntroducers.length)]);
        introducerUsed = true;
      }

      let words = sentence.split(' ');
      for (let i = 0; i < words.length; i++) {
        const clean = words[i].toLowerCase().replace(/[^a-z]/g, '');
        if (swaps[clean] && Math.random() < 0.35) {
          const options = swaps[clean];
          words[i] = words[i].replace(new RegExp(clean, 'gi'), options[Math.floor(Math.random() * options.length)]);
        }
      }

      sentence = words.join(' ');

      if (sentence.split(' ').length > 25 && Math.random() < 0.5) {
        const mid = Math.floor(sentence.length / 2);
        const breakPoint = sentence.lastIndexOf([',', ';', '—', ':'][Math.floor(Math.random() * 4)], mid);
        if (breakPoint > mid - 30 && breakPoint > 15) {
          result.push(sentence.slice(0, breakPoint + 1).trim());
          sentence = sentence.slice(breakPoint + 1).trim();
        }
      }

      result.push(sentence);
    }

    let final = result.join(' ').trim();

    // Break into paragraphs
    const allSentences = final.match(/[^.!?]+[.!?]+/g) || [final];
    let paragraphs = [];
    let current = [];

    allSentences.forEach(s => {
      current.push(s.trim());
      if (current.length >= 4 || (current.length >= 2 && Math.random() < 0.3)) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    });
    if (current.length) paragraphs.push(current.join(' '));

    final = paragraphs.join('\n\n');

    if (Math.random() < 0.25) {
      const endings = [
        'A compelling and natural presentation.',
        'Clear communication that resonates.',
        'Engaging content with authentic flow.',
        'Ready to connect with your audience.'
      ];
      final += ' ' + endings[Math.floor(Math.random() * endings.length)];
    }

    return final;
  }

  function getGradeColor(normalized10) {
    if (normalized10 >= 8.0) return '#10b981'; // green
    if (normalized10 >= 6.0) return '#f97316'; // orange
    return '#ef4444'; // red
  }
  
  

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  // Loading overlay with spinner
  results.innerHTML = `
    <div id="loadingOverlay" class="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
      <div class="w-20 h-20 mb-8 relative">
        <svg viewBox="0 0 100 100" class="animate-spin">
          <circle cx="50" cy="50" r="40" stroke="#f97316" stroke-width="8" fill="none" stroke-dasharray="126" stroke-dashoffset="63" stroke-linecap="round" />
        </svg>
      </div>
      <div id="loadingText" class="bg-white text-gray-800 text-xl font-bold px-12 py-6 rounded-xl shadow-2xl">
        Analyzing page for AI patterns...
      </div>
    </div>
  `;
  results.classList.remove('hidden');

  const loadingText = document.getElementById('loadingText');

  const messages = [
    "Fetching page...",
    "Extracting content...",
    "Analyzing Perplexity...",
    "Analyzing Burstiness...",
    "Analyzing Repetition...",
    "Analyzing Sentence Length...",
    "Analyzing Vocabulary...",
    "Generating report..."
  ];

  let delay = 600;
  messages.forEach(msg => {
    setTimeout(() => {
      if (loadingText) loadingText.innerText = msg;
    }, delay);
    delay += 700;
  });

  const minLoadTime = 5500;
  const startTime = Date.now();

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
    const mainNormalized = 100 - yourScore;
    const mainGradeColor = getGradeColor(mainNormalized / 10);
    const verdict = yourScore >= 70 ? 'Very Likely AI' : yourScore >= 40 ? 'Moderate AI Patterns' : 'Likely Human';
    const forecast = yourScore >= 70 ? 'Page 2+' : yourScore >= 50 ? 'Page 1 Possible' : yourScore >= 30 ? 'Top 10 Possible' : 'Top 3 Potential';

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);

    setTimeout(() => {
      results.innerHTML = `
        <!-- Your full results HTML template here -->
      `;
    }, remaining);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);
    setTimeout(() => {
      results.innerHTML = `<div class="text-center py-20 text-red-600 text-2xl">Error: ${err.message}</div>`;
    }, remaining);
  }
});

      results.innerHTML =`
        <style>
          .animate-stroke { transition: stroke-dasharray 1.5s ease-out; }
        </style>
        <div class="min-h-screen bg-gray-50 py-12 px-4">
          <div class="max-w-4xl mx-auto space-y-16">

            <!-- Big Score Circle -->
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
		    <p class="text-center text-sm text-gray-500 mt-4 italic">Note: Humanized version is an AI-generated example based on detected main content. Always review and edit for accuracy and tone.</p>
            <!-- Small Metrics (0–10 scale with colored number + left border) -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              ${[
                {name: 'Perplexity', raw: ai.perplexity, normalized: Math.max(0, 10 - (ai.perplexity - 4) / 0.8)},
                {name: 'Burstiness', raw: ai.burstiness, normalized: Math.min(10, ai.burstiness)},
                {name: 'Repetition', raw: ai.repetition, normalized: Math.max(0, 10 - ai.repetition / 10)},
                {name: 'Sentence Length', raw: ai.sentenceLength, normalized: Math.max(0, 10 - Math.abs(ai.sentenceLength - 19) * 0.5)},
                {name: 'Vocabulary', raw: ai.vocab, normalized: ai.vocab / 10}
              ].map(m => {
                const gradeColor = getGradeColor(m.normalized);
                const displayScore = m.normalized.toFixed(1);
                return `
                <div class="bg-white rounded-2xl shadow-md p-6 text-center border-l-4" style="border-left-color: ${gradeColor}">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg viewBox="0 0 128 128" class="-rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#f1f5f9" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${gradeColor}" stroke-width="12" fill="none"
                              stroke-dasharray="${m.normalized * 35.2} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <div class="text-3xl font-bold" style="color: ${gradeColor}">${displayScore}</div>
                      <div class="text-sm text-gray-500">/10</div>
                    </div>
                  </div>
                  <p class="mt-4 text-base font-medium text-gray-700">${m.name}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-3 px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300">
                    Show Info
                  </button>
                  <div class="hidden mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p><span class="font-bold text-blue-600">What it is:</span> 
                      ${m.name === 'Perplexity' ? 'How unpredictable your text appears to AI detectors.' : 
                        m.name === 'Burstiness' ? 'How much your sentence lengths vary for natural flow.' : 
                        m.name === 'Repetition' ? 'How often the same phrases or patterns appear.' : 
                        m.name === 'Sentence Length' ? 'Average words per sentence (ideal 15–23).' : 
                        'How diverse your word choice is across the content.'}
                    </p>
                    <p><span class="font-bold text-green-600">How to improve:</span> 
                      ${m.name === 'Perplexity' ? 'Use varied phrasing, personal anecdotes, and unexpected ideas.' : 
                        m.name === 'Burstiness' ? 'Mix short punchy sentences with longer detailed ones.' : 
                        m.name === 'Repetition' ? 'Replace repeated phrases with synonyms and fresh expressions.' : 
                        m.name === 'Sentence Length' ? 'Balance short and medium sentences for better rhythm.' : 
                        'Incorporate synonyms, descriptive words, and less common vocabulary.'}
                    </p>
                    <p><span class="font-bold text-orange-600">Why it matters:</span> 
                      ${m.name === 'Perplexity' ? 'Search engines penalize overly predictable content that feels AI-generated.' : 
                        m.name === 'Burstiness' ? 'Search engines and readers prefer dynamic rhythm that keeps attention.' : 
                        m.name === 'Repetition' ? 'Search engines downgrade repetitive text as low-quality or spammy.' : 
                        m.name === 'Sentence Length' ? 'Search engines favor readable flow that matches human writing habits.' : 
                        'Search engines reward rich vocabulary as a signal of expertise and depth.'}
                    </p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>

            <!-- Humanize Text Section - Final Polish -->
            <div class="mt-16 text-center space-y-8">
              <button id="humanizeBtn" class="px-16 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl hover:opacity-90 transition">
                ⚡ Generate Humanized Example
              </button>
              <div id="humanizedOutput" class="hidden max-w-5xl mx-auto">
                <div class="bg-white rounded-3xl shadow-2xl p-10 md:p-16 border border-gray-200">
                  <p class="text-center text-base text-gray-600 mb-10 italic leading-relaxed">
                    <strong>Note:</strong> This is an AI-generated example rewrite for inspiration only.<br>
                    Always edit to match your brand voice, verify facts, and ensure originality before publishing.
                  </p>
                  <h3 class="text-4xl md:text-5xl font-black text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                    Example Humanized Version
                  </h3>
                  <div id="humanizedText" class="prose prose-lg max-w-none text-gray-800 leading-relaxed text-left"></div>
                  <div class="mt-12 text-center">
                    <button onclick="navigator.clipboard.writeText(document.getElementById('humanizedText').innerText).then(()=>alert('Copied to clipboard!'))"
                            class="px-12 py-5 bg-cyan-600 text-white font-bold text-xl rounded-2xl hover:bg-cyan-500 shadow-lg">
                      📋 Copy Text
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Prioritized AI-Style Fixes - Improved -->
            <div class="mt-20 space-y-8">
              <h2 class="text-4xl md:text-5xl font-black text-center text-gray-900">Prioritized AI-Style Fixes</h2>
              ${yourScore >= 70 ? `
                <div class="bg-red-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-red-500">
                  <h3 class="text-3xl font-bold text-red-600 mb-6">Very Likely AI Detected</h3>
                  <p class="text-lg"><span class="font-bold text-blue-600">What:</span> Highly predictable patterns, low variation, repetitive phrasing</p>
                  <p class="text-lg mt-4"><span class="font-bold text-green-600">How to improve:</span> Add personal stories, vary sentence rhythm, use richer and more diverse vocabulary</p>
                  <p class="text-lg mt-4"><span class="font-bold text-orange-600">Why it matters:</span> Search engines heavily penalize obvious AI content in rankings</p>
                </div>` : yourScore >= 40 ? `
                <div class="bg-orange-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-orange-500">
                  <h3 class="text-3xl font-bold text-orange-600 mb-6">Moderate AI Patterns</h3>
                  <p class="text-lg"><span class="font-bold text-blue-600">What:</span> Some uniformity in structure and repeated phrases</p>
                  <p class="text-lg mt-4"><span class="font-bold text-green-600">How to improve:</span> Mix short and long sentences, add personal voice, reduce repetition</p>
                  <p class="text-lg mt-4"><span class="font-bold text-orange-600">Why it matters:</span> Small changes can move content into human-like territory and improve trust</p>
                </div>` : `
                <div class="bg-green-50 rounded-3xl p-10 md:p-12 shadow-lg border-l-8 border-green-500">
                  <h3 class="text-3xl font-bold text-green-600 mb-6">Excellent — Highly Human-Like!</h3>
                  <p class="text-lg text-center">Your writing reads naturally with good variation and authentic voice.</p>
                  <p class="text-lg mt-4 text-center">Keep up the great work — this style performs best in search rankings.</p>
                </div>`}
            </div>            


                    <!-- Predictive Rank Forecast - Improved -->
            <div class="mt-20 p-10 md:p-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl shadow-2xl text-white text-center space-y-8">
              <h2 class="text-4xl md:text-5xl font-black">Predictive Rank Forecast</h2>
              <p class="text-6xl md:text-8xl font-black" style="color: ${mainGradeColor}">${forecast}</p>
              <p class="text-2xl md:text-3xl font-bold">Potential if humanized</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div class="bg-white/20 backdrop-blur rounded-2xl p-8">
                  <p class="text-xl md:text-2xl font-bold text-blue-200 mb-4">What it is</p>
                  <p class="text-base md:text-lg leading-relaxed">Estimate of ranking potential based on how human-like your content reads</p>
                </div>
                <div class="bg-white/20 backdrop-blur rounded-2xl p-8">
                  <p class="text-xl md:text-2xl font-bold text-green-200 mb-4">How calculated</p>
                  <p class="text-base md:text-lg leading-relaxed">Lower AI patterns = higher human trust = stronger search engine preference</p>
                </div>
                <div class="bg-white/20 backdrop-blur rounded-2xl p-8">
                  <p class="text-xl md:text-2xl font-bold text-orange-200 mb-4">Why it matters</p>
                  <p class="text-base md:text-lg leading-relaxed">Human-like content ranks higher, builds trust, and drives more organic traffic</p>
                </div>
              </div>
            </div>
            

			</div>
          </div>
        `;  // ← Closing backtick + semicolon fixed here

      } catch (err) {
        results.innerHTML = `
          <div class="text-center py-20">
            <p class="text-3xl text-red-500 font-bold">Error: ${err.message || 'Analysis failed'}</p>
            <p class="mt-6 text-xl text-gray-400">Please check the URL and try again.</p>
          </div>
        `;
      }
    }
  });
  


  document.addEventListener('click', e => {
    if (e.target.id === 'humanizeBtn') {
      const output = document.getElementById('humanizedOutput');
      const textDiv = document.getElementById('humanizedText');
      output.classList.add('hidden');
      setTimeout(() => {
      const humanized = makeItHuman(analyzedText);
      textDiv.innerHTML = humanized.replace(/\n\n/g, '</p><p class="mt-8">').replace(/\n/g, '<br>');
      textDiv.innerHTML = '<p>' + textDiv.innerHTML + '</p>';
        output.classList.remove('hidden');
      }, 400);
    }
  });
});