document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    // Show animated progress bar
    results.innerHTML = `
      <div id="progress-bar" class="fixed bottom-0 left-0 w-full h-4 z-50"></div>
      <div class="fixed bottom-6 left-0 right-0 text-center text-white font-bold text-lg z-50">
        <span id="progress-text">Fetching page...</span>
      </div>
    `;
    results.classList.remove('hidden');

    const progressTexts = [
      "Fetching page...",
      "Extracting main content...",
      "Analyzing Answerability...",
      "Checking Structured Data...",
      "Evaluating EEAT signals...",
      "Scanning scannability...",
      "Measuring tone & readability...",
      "Detecting uniqueness..."
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

      // === Intelligent main content extraction ===
      let mainText = '';
      const candidates = [
        doc.querySelector('article'),
        doc.querySelector('main'),
        doc.querySelector('[role="main"]'),
        doc.body
      ];
      const mainEl = candidates.find(el => el && el.textContent.length > 1000) || doc.body;
      // Remove junk
      mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie').forEach(el => el.remove());
      mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();

      const first300 = mainText.slice(0, 1000); // ~300 words buffer

      // === 1. Answerability / Direct Answer (most important) ===
      const hasBoldDef = /<strong>|<b>|<h[1-3]>.*?(definition|is|means|refers to)/i.test(first300);
      const hasFAQSchema = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .some(s => s.textContent.includes('"FAQPage"'));
      const hasQuestionH2 = Array.from(doc.querySelectorAll('h2')).some(h => /[?!]/.test(h.textContent));
      const hasSteps = /step|how to|guide|instructions|follow these/i.test(first300.toLowerCase());
      const answerability = [
        hasBoldDef ? 25 : 0,
        hasFAQSchema ? 20 : 0,
        hasQuestionH2 ? 15 : 0,
        hasSteps ? 20 : 0,
        first300.length > 500 ? 20 : 10
      ].reduce((a, b) => a + b, 0);

      // === 2. Structured Data ===
      let schemaScore = 0;
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      if (jsonLdScripts.length > 0) schemaScore += 40;
      jsonLdScripts.forEach(s => {
        try {
          const data = JSON.parse(s.textContent);
          const types = Array.isArray(data) ? data.map(i => i['@type']) : [data['@type']];
          if (types.includes('Article') || types.includes('BlogPosting')) schemaScore += 30;
          if (types.includes('FAQPage') || types.includes('HowTo')) schemaScore += 20;
          if (types.includes('Person')) schemaScore += 10;
        } catch {}
      });
      const structuredData = Math.min(100, schemaScore);

      // === 3. EEAT Signals ===
      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const hasDate = !!doc.querySelector('meta[name="date"], time[datetime], .published, .updated');
      const hasOutbound = Array.from(doc.querySelectorAll('a[href^="https"]')).some(a => !a.href.includes(new URL(url).hostname));
      const eeat = (hasAuthor ? 35 : 0) + (hasDate ? 25 : 0) + (hasOutbound ? 20 : 0) + (url.startsWith('https') ? 20 : 0);

      // === 4. Scannability & Extraction Friendliness ===
      const headings = doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
      const lists = doc.querySelectorAll('ul,ol').length;
      const tables = doc.querySelectorAll('table').length;
      const shortParas = Array.from(mainEl.querySelectorAll('p'))
        .filter(p => p.textContent.split(/\s+/).length < 40).length;
      const scannability = Math.min(100, headings * 5 + lists * 8 + tables * 15 + shortParas * 0.5);

      // === 5. Conversational / Human Tone ===
      const youCount = (mainText.match(/\byou\b|\byour\b/gi) || []).length;
      const iWeCount = (mainText.match(/\bI\b|\bwe\b|\bmy\b|\bour\b/gi) || []).length;
      const questions = (mainText.match(/\?/) || []).length;
      const conversational = Math.min(100, (youCount + iWeCount) * 3 + questions * 5);

      // === 6. Readability ===
      const words = mainText.split(/\s+/).filter(Boolean).length;
      const sentences = (mainText.match(/[.!?]+/g) || []).length || 1;
      const syllables = mainText.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
      const readability = flesch > 80 ? 95 : flesch > 60 ? 85 : flesch > 40 ? 60 : 30;

      // === 7. Unique Human Insights ===
      const insightMarkers = /I tested|in my experience|we found|case study|based on my|real-world|hands-on|personally/i.test(mainText);
      const uniqueScore = insightMarkers ? 90 : words > 1500 ? 60 : 30;

      // === 8. Anti-AI Detection Safety (simple burstiness proxy) ===
      const sentencesArr = mainText.split(/[.!?]+/).filter(Boolean);
      const lengths = sentencesArr.map(s => s.split(/\s+/).length);
      const variance = lengths.reduce((a, b) => a + Math.pow(b - lengths.reduce((x,y)=>x+y,0)/lengths.length, 2), 0) / lengths.length;
      const burstiness = variance > 30 ? 90 : variance > 15 ? 70 : 40;

      // === Overall Score (weighted) ===
      const overall = Math.round(
        answerability * 0.25 +
        structuredData * 0.15 +
        eeat * 0.15 +
        scannability * 0.10 +
        conversational * 0.10 +
        readability * 0.10 +
        uniqueScore * 0.08 +
        burstiness * 0.07
      );

      const modules = [
        { name: "Answerability", score: answerability, desc: "Direct answers in first 300 words, FAQ schema, step-by-step structure" },
        { name: "Structured Data", score: structuredData, desc: "JSON-LD presence and relevant types" },
        { name: "EEAT Signals", score: eeat, desc: "Author, dates, trusted links, HTTPS" },
        { name: "Scannability", score: scannability, desc: "Headings, lists, tables, short paragraphs" },
        { name: "Conversational Tone", score: conversational, desc: "Use of you/I/we, questions" },
        { name: "Readability", score: readability, desc: "Flesch score in 50–70 range" },
        { name: "Unique Insights", score: uniqueScore, desc: "First-hand experience markers" },
        { name: "Anti-AI Safety", score: burstiness, desc: "Sentence length variation (burstiness)" }
      ];

      clearInterval(interval);
      document.querySelector('#progress-bar').remove();
      document.querySelector('.fixed.bottom-6').remove();

      // === Render Results ===
      results.innerHTML = `
        <div class="space-y-16 animate-in">
          <!-- Big Overall Score Ring -->
          <div class="flex justify-center my-12">
            <div class="relative score-ring-big">
              <svg viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#374151" stroke-width="20" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="url(#gradBig)" stroke-width="20" fill="none"
                        stroke-dasharray="${(overall / 100) * 754} 754" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradBig">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="50%" stop-color="#f97316"/>
                    <stop offset="100%" stop-color="#22c55e"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-7xl font-black">${overall}</div>
                  <div class="text-2xl opacity-80">/100</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Predictive Rank Forecast -->
          <div class="p-10 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl text-center">
            <h3 class="text-3xl font-black mb-4">Predictive AI SERP Forecast</h3>
            <p class="text-6xl font-black">
              ${overall >= 90 ? 'Top 3' : overall >= 80 ? 'Top 5' : overall >= 70 ? 'Top 10' : overall >= 50 ? 'Page 1 Possible' : 'Page 2+'}
            </p>
          </div>

          <!-- 8 Module Small Rings -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            ${modules.map(m => `
              <div class="text-center">
                <div class="relative score-ring-small mx-auto">
                  <svg viewBox="0 0 140 140" class="transform -rotate-90">
                    <circle cx="70" cy="70" r="60" stroke="#374151" stroke-width="12" fill="none"/>
                    <circle cx="70" cy="70" r="60" stroke="${m.score >= 80 ? '#22c55e' : m.score >= 50 ? '#f97316' : '#ef4444'}"
                            stroke-width="12" fill="none" stroke-dasharray="${(m.score / 100) * 377} 377" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-3xl font-black">${m.score}</div>
                </div>
                <p class="mt-4 font-bold text-lg">${m.name}</p>
                <p class="text-sm opacity-70">${m.desc}</p>
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-3 text-sm text-orange-500 underline">
                  Show Fixes →
                </button>
                <ul class="hidden mt-4 text-sm text-left module-steps space-y-2">
                  ${generateFixes(m, doc, mainText, first300, url)} 
                </ul>
              </div>
            `).join('')}
          </div>

          <!-- PDF Button -->
          <div class="text-center my-16">
            <button onclick="document.querySelectorAll('.hidden').forEach(el=>el.classList.remove('hidden')); window.print();"
                    class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl">
              📄 Save as PDF (opens all fixes)
            </button>
          </div>
        </div>
      `;

      // Simple fix generator (expand later)
      function generateFixes(module, doc, text, first300, url) {
        const fixes = {
          "Answerability": [
            "Add a bold definition or direct answer in the first paragraph",
            "Include an H2 that matches common user questions",
            "Add numbered steps if it's a how-to topic",
            "Implement FAQPage schema"
          ],
          "Structured Data": [
            "Add JSON-LD Article or BlogPosting schema",
            "Include Person schema for author",
            "Add FAQPage or HowTo schema if applicable"
          ],
          "EEAT Signals": [
            "Add visible author byline with photo",
            "Include publish/update dates",
            "Link to authoritative external sources"
          ],
          "Scannability": [
            "Use more H2/H3 subheadings",
            "Add bullet or numbered lists",
            "Include at least one data table",
            "Keep paragraphs under 4 lines"
          ],
          "Conversational Tone": [
            "Address reader directly with 'you' and 'your'",
            "Share personal experience with 'I' or 'we'",
            "Ask rhetorical questions"
          ],
          "Readability": [
            "Shorten sentences (aim <20 words avg)",
            "Use simple words and active voice",
            "Target Flesch score 60–70"
          ],
          "Unique Insights": [
            "Add personal testing results or case studies",
            "Include 'In my experience...' or 'We found...' statements"
          ],
          "Anti-AI Safety": [
            "Vary sentence length dramatically",
            "Mix short punchy sentences with longer ones",
            "Avoid repetitive phrasing patterns"
          ]
        };
        return (fixes[module.name] || ["No specific fixes available yet"])
          .map(f => `<li>${f}</li>`).join('');
      }

    } catch (err) {
      clearInterval(interval);
      document.querySelector('#progress-bar')?.remove();
      document.querySelector('.fixed.bottom-6')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-2xl py-20">Error: ${err.message}</p>`;
    }
  });
});