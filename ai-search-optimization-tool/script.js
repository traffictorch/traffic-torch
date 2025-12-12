// ai-search-optimization-tool/script.js
// Enhanced: DOMContentLoaded wrapper for global script compatibility (theme/mobile untouched)
// Form submit 100% prevents reload – e.preventDefault() + return false for extra safety

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const report = document.getElementById('report');
  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';
  const MIN_LOAD_TIME = 3000;
  const MAX_LOAD_TIME = 8000;

  const modules = [
    "Fetching page via secure proxy",
    "Extracting main content intelligently",
    "Detecting Schema.org structured data",
    "Calculating Flesch-Kincaid readability",
    "Scanning for conversational tone & questions",
    "Counting lists, tables, headings",
    "Checking EEAT signals (author, sources, date)",
    "Computing final AI SERP Optimization Score"
  ];

  function fakeProgress(callback) {
    let i = 0;
    const total = modules.length;
    const duration = Math.random() * (MAX_LOAD_TIME - MIN_LOAD_TIME) + MIN_LOAD_TIME;

    const interval = setInterval(() => {
      i++;
      const percent = Math.min(100, (i / total) * 100);
      progressBar.style.width = percent + '%';
      progressText.textContent = modules[i - 1] || "Finalizing report...";

      if (i >= total) {
        clearInterval(interval);
        setTimeout(() => {
          progressBar.style.width = '100%';
          setTimeout(callback, 500);
        }, 600);
      }
    }, duration / total);
  }

  function getMainContent(doc) {
    const selectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '#content', '.blog-post'];
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) return el;
    }
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, .cookie, .sidebar, .advert').forEach(el => el.remove());
    return clone;
  }

  function analyzeAIO(text, doc) {
    const hasSchema = doc.querySelectorAll('script[type="application/ld+json"]').length > 0;

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, w) => sum + (w.toLowerCase().match(/[aeiouy]+/g) || []).length, 0);
    const avgWordsPerSentence = words.length / (sentences.length || 1);
    const avgSyllablesPerWord = syllables / (words.length || 1);
    const fk = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    const readabilityScore = fk > 80 ? 25 : fk > 70 ? 22 : fk > 60 ? 18 : fk > 50 ? 12 : 6;

    const pronouns = (text.match(/\b(I|you|we|us|my|your|our|me|mine|yours)\b/gi) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const convoScore = (pronouns > 10 || questions > 2) ? 20 : (pronouns > 4 || questions > 0) ? 12 : 5;

    const lists = doc.querySelectorAll('ul, ol').length;
    const tables = doc.querySelectorAll('table').length;
    const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
    const formatScore = (lists + tables + headings > 12) ? 20 : (lists + headings > 6) ? 13 : 6;

    const hasAuthor = !!doc.querySelector('[itemprop="author"], .author, .byline, .posted-by, .entry-author');
    const hasDate = !!doc.querySelector('time, [itemprop="datePublished"], .date, .published');
    const links = doc.querySelectorAll('a[href]').length;
    const eeatScore = (hasAuthor ? 10 : 0) + (hasDate ? 8 : 0) + (links > 15 ? 12 : links > 5 ? 7 : 3);

    const total = readabilityScore + convoScore + formatScore + eeatScore + (hasSchema ? 30 : 0);
    const aioScore = Math.round(Math.min(100, total));

    return {
      aioScore,
      structuredData: hasSchema ? 'Yes' : 'No',
      readability: Math.round(fk),
      conversational: `${pronouns} pronouns • ${questions} questions`,
      answerFormat: `${lists} lists • ${tables} tables • ${headings} headings`,
      eeat: `${hasAuthor ? 'Yes' : 'No'} Author • ${hasDate ? 'Yes' : 'No'} Date • ${links} links`
    };
  }

  function showReport(aio, pageTitle) {
    report.innerHTML = `
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-16 border border-orange-500/30">
        <h2 class="text-6xl md:text-7xl font-black text-center aio-score">${aio.aioScore}<span class="text-4xl">%</span></h2>
        <p class="text-center text-2xl mt-4 text-gray-300">AI SERP Optimization Score</p>
        <p class="text-center text-lg mt-3 text-gray-400 max-w-4xl mx-auto">
          How well this page ranks in AI-powered search engines (Perplexity, Grok, ChatGPT Search, Gemini, etc.)
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          ${[
            { name: "Structured Data", value: aio.structuredData, why: "AI uses Schema.org for rich answers & citations", how: "Add JSON-LD FAQ, HowTo, Article schema" },
            { name: "Readability", value: aio.readability, why: "Easier content = better AI summarization", how: "Short sentences, simple words, active voice" },
            { name: "Conversational Tone", value: aio.conversational, why: "Matches real user queries", how: "Use “you”, “I”, rhetorical questions" },
            { name: "Answer Format", value: aio.answerFormat, why: "AI loves lists & tables for instant extraction", how: "Bullets, numbered steps, comparison tables" },
            { name: "EEAT Signals", value: aio.eeat, why: "Trust = higher chance of citation", how: "Author byline + publish date + source links" }
          ].map(m => `
            <div class="metric-card">
              <h3 class="text-2xl font-bold mb-4">${m.name}</h3>
              <div class="text-3xl font-black mb-6 ${m.value.includes('Yes') || (m.name === 'Conversational Tone' && parseInt(m.value.split(' ')[0]) > 8) ? 'text-green-400' : 'text-orange-400'}">
                ${m.value}
              </div>
              <div class="progress-bar mb-6">
                <div class="progress-fill" style="width: ${m.name === 'Structured Data' && m.value === 'Yes' ? 100 : m.name === 'Readability' ? Math.min(100, (m.value / 80) * 100) : 70}%"></div>
              </div>
              <p class="text-sm opacity-80"><strong>Why:</strong> ${m.why}</p>
              <p class="text-sm opacity-80 mt-2"><strong>Fix:</strong> ${m.how}</p>
            </div>
          `).join('')}
        </div>

        <div class="text-center mt-16">
          <button onclick="window.print()" class="px-12 py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-xl hover:scale-105 transition shadow-2xl">
            📄 Save as PDF
          </button>
        </div>

        <p class="text-center mt-12 text-gray-500"><a href="/" class="text-orange-400 hover:underline">← Back to all tools</a></p>
      </div>
    `;
    report.classList.remove('hidden');
    report.scrollIntoView({ behavior: 'smooth' });
  }

  // Main submit handler – 100% prevents reload
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false; // Extra safety for any weird form behavior

    const url = input.value.trim();
    if (!url) return;

    report.classList.add('hidden');
    report.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '3%';
    progressText.textContent = modules[0];

    fakeProgress(async () => {
      try {
        const res = await fetch(PROXY + url);
        if (!res.ok) throw new Error('Page not reachable');

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const mainEl = getMainContent(doc);
        const clean = mainEl.cloneNode(true);
        clean.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove());
        const text = clean.textContent.replace(/\s+/g, ' ').trim();

        const aio = analyzeAIO(text, doc);
        const pageTitle = doc.querySelector('title')?.textContent.trim() || 'Untitled Page';

        showReport(aio, pageTitle);
      } catch (err) {
        loading.classList.add('hidden');
        alert('Error: ' + err.message + '\n\nPlease try a different URL.');
      }
    });
  });
});