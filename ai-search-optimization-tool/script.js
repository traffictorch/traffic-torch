document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    results.innerHTML = `
      <div id="progress-bar" class="fixed bottom-0 left-0 w-full h-4 z-50"></div>
      <div class="fixed bottom-6 left-0 right-0 text-center text-white font-bold text-lg z-50">
        <span id="progress-text">Analyzing for AI search engines...</span>
      </div>
    `;
    results.classList.remove('hidden');

    const progressTexts = [
      "Fetching page...", "Extracting content...", "Checking direct answers...", 
      "Scanning structured data...", "Evaluating trust signals...", "Measuring scannability...",
      "Analyzing tone & readability...", "Detecting uniqueness & burstiness..."
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < progressTexts.length) {
        document.getElementById('progress-text').textContent = progressTexts[step++];
      }
    }, 1000);

    try {
      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Main content extraction (same as before)
      let mainText = '';
      const candidates = [doc.querySelector('article'), doc.querySelector('main'), doc.querySelector('[role="main"]'), doc.body];
      const mainEl = candidates.find(el => el && el.textContent.length > 1000) || doc.body;
      mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie').forEach(el => el.remove());
      mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();
      const first300 = mainText.slice(0, 1000);

      // === Module calculations (same logic as previous version) ===
      // ... [keep all the scoring logic exactly as in previous script.js] ...

      // (For brevity, assuming you copy the scoring section from previous response)
      // It produces: overall, modules array with name, score, desc

      // Example placeholder modules if not copying full logic yet
      const modules = [ /* your 8 modules with .name, .score */ ];

      clearInterval(interval);
      document.querySelector('#progress-bar').remove();
      document.querySelector('.fixed.bottom-6').remove();

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 animate-in">
          <!-- Big Score Circle -->
          <div class="flex justify-center my-12">
            <div class="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#bigGradient)" stroke-width="18" fill="none"
                        stroke-dasharray="${(overall / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="bigGradient">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-7xl font-black text-white drop-shadow-2xl">${overall}</div>
                  <div class="text-2xl text-white/90">/100</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Predictive Rank Forecast -->
          <div class="p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl text-center">
            <h3 class="text-4xl font-black mb-6">Predictive AI SERP Forecast</h3>
            <p class="text-7xl font-black">${overall >= 90 ? 'Top 3' : overall >= 80 ? 'Top 5' : overall >= 70 ? 'Top 10' : overall >= 50 ? 'Page 1 Possible' : 'Page 2+'}</p>
          </div>

          <!-- 8 Modules - Exact style match -->
          <div class="grid md:grid-cols-4 gap-6 my-16">
            ${modules.map(m => {
              const borderColor = m.score >= 80 ? 'border-green-500' : m.score >= 60 ? 'border-yellow-500' : 'border-red-500';
              const ringColor = m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#eab308' : '#ef4444';
              return `
                <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border ${borderColor}">
                  <div class="relative mx-auto w-32 h-32">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${ringColor}"
                              stroke-width="12" fill="none" stroke-dasharray="${(m.score/100)*352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-4xl font-black">${m.score}</div>
                  </div>
                  <p class="mt-4 text-lg font-medium">${m.name}</p>
                  <p class="text-sm opacity-70 mt-2">${m.desc}</p>
                  <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
                    Show Fixes
                  </button>
                  <div class="hidden mt-6 space-y-3 text-left text-sm">
                    <p class="text-blue-500 font-bold">What:</p><p>${getWhat(m.name)}</p>
                    <p class="text-green-500 font-bold">How:</p><p>${getHow(m.name)}</p>
                    <p class="text-orange-500 font-bold">Why:</p><p>${getWhy(m.name)}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden')); window.print();"
                    class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
              📄 Save as PDF (with all details)
            </button>
          </div>
        </div>
      `;

      // Educational What/How/Why content
      function getWhat(name) {
        const map = {
          "Answerability": "Direct, quotable answers AI engines can cite verbatim.",
          "Structured Data": "Machine-readable signals that trigger rich answers.",
          "EEAT Signals": "Proof of expertise, experience, authority, and trust.",
          "Scannability": "Easy extraction of key facts via lists, tables, headings.",
          "Conversational Tone": "Natural human language that matches user queries.",
          "Readability": "Simple, easy-to-summarize writing.",
          "Unique Insights": "Original first-hand experience that prevents de-duplication.",
          "Anti-AI Safety": "Human-like writing patterns that avoid AI-content filters."
        };
        return map[name] || "";
      }
      function getHow(name) {
        const map = {
          "Answerability": "Bold definitions in first 300 words, FAQ schema, step-by-step lists.",
          "Structured Data": "Add JSON-LD Article, FAQPage, HowTo, Person schema.",
          "EEAT Signals": "Author byline, dates, credentials, trusted outbound links.",
          "Scannability": "H2/H3 headings, bullets, tables, short paragraphs.",
          "Conversational Tone": "Use “you”, “I”, questions, personal anecdotes.",
          "Readability": "Short sentences, active voice, common words.",
          "Unique Insights": "Add “I tested”, case studies, personal results.",
          "Anti-AI Safety": "Vary sentence length, avoid repetitive patterns."
        };
        return map[name] || "";
      }
      function getWhy(name) {
        const map = {
          "Answerability": "AI engines quote direct answers — highest citation factor.",
          "Structured Data": "Triggers rich results and improves citation likelihood.",
          "EEAT Signals": "Trust is the #1 decider for AI citations.",
          "Scannability": "AI loves instant extraction from structured elements.",
          "Conversational Tone": "Matches natural language queries.",
          "Readability": "Easier to summarize = higher ranking in AI results.",
          "Unique Insights": "Prevents de-duplication against generic AI content.",
          "Anti-AI Safety": "Avoids being filtered as low-quality AI slop."
        };
        return map[name] || "";
      }

    } catch (err) {
      clearInterval(interval);
      document.querySelector('#progress-bar')?.remove();
      document.querySelector('.fixed.bottom-6')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});