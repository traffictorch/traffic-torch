document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;

    results.innerHTML = `
      <div id="progress-bar" class="fixed bottom-0 left-0 w-full h-4 z-50 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600"></div>
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
      if (!res.ok) throw new Error('Page not reachable – check URL or try HTTPS');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Intelligent main content extraction
      let mainText = '';
      const candidates = [doc.querySelector('article'), doc.querySelector('main'), doc.querySelector('[role="main"]'), doc.body];
      const mainEl = candidates.find(el => el && el.textContent.trim().length > 1000) || doc.body;
      mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie, .sidebar').forEach(el => el.remove());
      mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();
      const first300 = mainText.slice(0, 1200);

      // === All 8 module scoring logic (unchanged and complete) ===
      const hasBoldInFirst = /<strong>|<b>|<em>/i.test(first300);
      const hasDefinition = /\b(is|means|refers to|defined as)\b/i.test(first300.toLowerCase());
      const hasFAQSchema = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .some(s => s.textContent.includes('"FAQPage"'));
      const hasQuestionH2 = Array.from(doc.querySelectorAll('h2')).some(h => /[?!]/.test(h.textContent));
      const hasSteps = /\b(step|guide|how to|instructions|follow these)\b/i.test(first300.toLowerCase());
      const answerability = Math.min(100,
        (hasBoldInFirst || hasDefinition ? 30 : 0) +
        (hasFAQSchema ? 25 : 0) +
        (hasQuestionH2 ? 15 : 0) +
        (hasSteps ? 20 : 0) +
        (first300.length > 600 ? 10 : 0)
      );

      let schemaScore = 0;
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      if (jsonLdScripts.length > 0) schemaScore += 30;
      jsonLdScripts.forEach(s => {
        try {
          const data = JSON.parse(s.textContent);
          const types = Array.isArray(data) ? data.map(i => i['@type']) : [data['@type']];
          if (types.some(t => ['Article', 'BlogPosting'].includes(t))) schemaScore += 30;
          if (types.some(t => ['FAQPage', 'HowTo'].includes(t))) schemaScore += 25;
          if (types.includes('Person')) schemaScore += 15;
        } catch {}
      });
      const structuredData = Math.min(100, schemaScore);

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const hasDate = !!doc.querySelector('time[datetime], meta[name="date"], .published, .updated, .date');
      const hasTrustedLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
        .some(a => !a.href.includes(new URL(url).hostname) && !a.href.includes('facebook.com') && !a.href.includes('twitter.com'));
      const eeat = (hasAuthor ? 40 : 0) + (hasDate ? 25 : 0) + (hasTrustedLinks ? 20 : 0) + (url.startsWith('https:') ? 15 : 0);

      const headings = doc.querySelectorAll('h1,h2,h3,h4').length;
      const lists = doc.querySelectorAll('ul,ol').length;
      const tables = doc.querySelectorAll('table').length;
      const shortParas = Array.from(mainEl.querySelectorAll('p'))
        .filter(p => p.textContent.trim().split(/\s+/).length < 35).length;
      const scannability = Math.min(100, headings * 6 + lists * 8 + tables * 15 + shortParas * 0.4);

      const youCount = (mainText.match(/\byou\b|\byour\b|\byours\b/gi) || []).length;
      const iWeCount = (mainText.match(/\bI\b|\bwe\b|\bmy\b|\bour\b|\bme\b|\bus\b/gi) || []).length;
      const questions = (mainText.match(/\?/g) || []).length;
      const conversational = Math.min(100, (youCount * 4) + (iWeCount * 3) + (questions * 6));

      const words = mainText.split(/\s+/).filter(Boolean).length || 1;
      const sentences = (mainText.match(/[.!?]+/g) || []).length || 1;
      const syllables = mainText.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
      const readability = flesch > 80 ? 95 : flesch > 60 ? 90 : flesch > 40 ? 70 : 40;

      const hasInsights = /\b(I tested|in my experience|we found|case study|based on my|hands-on|personally observed)\b/i.test(mainText);
      const uniqueInsights = hasInsights ? 95 : words > 2000 ? 70 : words > 1000 ? 50 : 30;

      const sentencesArr = mainText.split(/[.!?]+/).filter(Boolean);
      const lengths = sentencesArr.map(s => s.split(/\s+/).length);
      let burstiness = 50;
      if (lengths.length >= 5) {
        const avg = lengths.reduce((a,b) => a+b, 0) / lengths.length;
        const variance = lengths.reduce((a,b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
        burstiness = variance > 40 ? 95 : variance > 20 ? 80 : variance > 10 ? 60 : 40;
      }

      const overall = Math.round(
        answerability * 0.25 +
        structuredData * 0.15 +
        eeat * 0.15 +
        scannability * 0.10 +
        conversational * 0.10 +
        readability * 0.10 +
        uniqueInsights * 0.08 +
        burstiness * 0.07
      );

      const modules = [
        { name: "Answerability", score: answerability, desc: "Direct answers in first 300 words, FAQ schema, step-by-step structure" },
        { name: "Structured Data", score: structuredData, desc: "JSON-LD presence and relevant types" },
        { name: "EEAT Signals", score: eeat, desc: "Author, dates, trusted links, HTTPS" },
        { name: "Scannability", score: scannability, desc: "Headings, lists, tables, short paragraphs" },
        { name: "Conversational Tone", score: conversational, desc: "Use of you/I/we, questions" },
        { name: "Readability", score: readability, desc: "Flesch score in ideal range" },
        { name: "Unique Insights", score: uniqueInsights, desc: "First-hand experience markers" },
        { name: "Anti-AI Safety", score: burstiness, desc: "Sentence length variation (burstiness)" }
      ];

      // === Prioritised Fixes (dynamic based on low scores) ===
      const lowScoring = modules.filter(m => m.score < 70).sort((a,b) => a.score - b.score);
      const prioritisedFixes = [];

      if (lowScoring.some(m => m.name === "Answerability")) {
        prioritisedFixes.push({ title: "Add Direct Answer in Opening", emoji: "💡", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "A clear, bold, quotable answer AI engines can cite directly",
          how: "Add a bold definition or summary in first 150–250 words. Use H2 questions and numbered steps.",
          why: "Answerability is the #1 factor for AI citation and source selection"
        });
      }
      if (lowScoring.some(m => m.name === "EEAT Signals")) {
        prioritisedFixes.push({ title: "Add Author Bio & Photo", emoji: "👤", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "Visible byline proving who wrote this",
          how: "Headshot + name + bio + credentials + social links",
          why: "Boosts Expertise & Trust by 30–40 points — Google's #1 E-E-A-T signal"
        });
      }
      if (lowScoring.some(m => m.name === "Structured Data")) {
        prioritisedFixes.push({ title: "Add Article + Person Schema", emoji: "✨", gradient: "from-purple-500/10 border-purple-500", color: "text-purple-600",
          what: "Structured data that AI engines read directly",
          how: "JSON-LD with @type Article + Person + author link. Add FAQPage if relevant.",
          why: "Triggers rich answers and massive citation boost"
        });
      }
      if (lowScoring.some(m => m.name === "Scannability")) {
        prioritisedFixes.push({ title: "Boost Scannability with Lists & Tables", emoji: "📋", gradient: "from-orange-500/10 border-orange-500", color: "text-orange-600",
          what: "Easy-to-extract facts via structured formatting",
          how: "Add bullet/numbered lists, data tables, H2/H3 headings, short paragraphs",
          why: "AI prioritizes instantly extractable content"
        });
      }
      if (lowScoring.some(m => m.name === "Unique Insights")) {
        prioritisedFixes.push({ title: "Add First-Hand Experience", emoji: "🧠", gradient: "from-orange-500/10 border-orange-500", color: "text-orange-600",
          what: "Original insights that stand out from generic content",
          how: "Include “I tested”, case studies, personal results, dated experiences",
          why: "Prevents de-duplication and boosts originality"
        });
      }

      clearInterval(interval);
      document.querySelector('#progress-bar')?.remove();
      document.querySelector('.fixed.bottom-6')?.remove();

      results.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-16 animate-in">
          <!-- Big Overall Score -->
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

          <!-- 8 Module Cards -->
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

          <!-- Prioritised AI-Style Fixes -->
          ${prioritisedFixes.length > 0 ? `
            <div class="space-y-8">
              <h3 class="text-4xl font-black text-center mb-8">Prioritised AI-Style Fixes</h3>
              ${prioritisedFixes.map(fix => `
                <div class="p-8 bg-gradient-to-r ${fix.gradient} border-l-8 rounded-r-2xl">
                  <div class="flex gap-6">
                    <div class="text-5xl">${fix.emoji}</div>
                    <div>
                      <h4 class="text-2xl font-bold ${fix.color}">${fix.title}</h4>
                      <p class="mt-4 text-blue-500 font-bold">What:</p><p>${fix.what}</p>
                      <p class="mt-2 text-green-500 font-bold">How:</p><p>${fix.how}</p>
                      <p class="mt-2 text-orange-500 font-bold">Why:</p><p>${fix.why}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Predictive Rank Forecast (now below fixes) -->
          <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8">
            <h3 class="text-4xl font-black text-center">Predictive AI SERP Forecast</h3>
            <p class="text-center text-7xl font-black">${overall >= 90 ? 'Top 3' : overall >= 80 ? 'Top 5' : overall >= 70 ? 'Top 10' : overall >= 50 ? 'Page 1 Possible' : 'Page 2+'}</p>
            <p class="text-center text-4xl font-bold">+${Math.round((100 - overall) * 1.8)}% potential traffic gain if fixed</p>
            <p class="text-center text-lg italic opacity-80">Based on trust, direct answers, structure, and human signals — here's the breakdown:</p>
            <div class="grid md:grid-cols-3 gap-6 text-left">
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-blue-300 text-xl mb-2">What it is</p>
                <p class="text-sm leading-relaxed">Estimate of your page’s potential position in AI-powered search results (Perplexity, Grok, Gemini, ChatGPT Search, etc.).</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-green-300 text-xl mb-2">How it's calculated</p>
                <p class="text-sm leading-relaxed">Weighted: 25% Answerability, 15% Structured Data, 15% EEAT, 10% each Scannability/Tone/Readability, 8% Unique Insights, 7% Burstiness.</p>
              </div>
              <div class="p-6 bg-white/10 rounded-2xl">
                <p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p>
                <p class="text-sm leading-relaxed">Top AI citations drive massive direct traffic. Fixing gaps can multiply visibility in days.</p>
              </div>
            </div>
            <p class="text-center text-sm italic mt-6">Forecast is heuristic; actual performance varies by query and competition.</p>
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
        return map[name] || "Optimization factor for AI search visibility.";
      }
      function getHow(name) {
        const map = {
          "Answerability": "Bold definitions in first 300 words, FAQ schema, step-by-step lists.",
          "Structured Data": "Add JSON-LD Article, FAQPage, HowTo, Person schema.",
          "EEAT Signals": "Author byline with photo, publish/update dates, trusted outbound links.",
          "Scannability": "Use H2/H3 headings, bullets, tables, short paragraphs.",
          "Conversational Tone": "Address reader with “you”, share “I/we” experiences, ask questions.",
          "Readability": "Short sentences, active voice, common words (Flesch 60–70).",
          "Unique Insights": "Add personal testing, case studies, “In my experience…” statements.",
          "Anti-AI Safety": "Vary sentence length dramatically, avoid repetitive patterns."
        };
        return map[name] || "Implement best practices for this factor.";
      }
      function getWhy(name) {
        const map = {
          "Answerability": "AI engines quote direct answers — highest citation factor.",
          "Structured Data": "Triggers rich results and improves citation likelihood.",
          "EEAT Signals": "Trust is the #1 decider for AI citations.",
          "Scannability": "AI loves instant extraction from structured elements.",
          "Conversational Tone": "Matches natural language queries.",
          "Readability": "Easier to summarize = higher ranking in AI results.",
          "Unique Insights": "Prevents de-duplication against generic content.",
          "Anti-AI Safety": "Avoids being filtered as low-quality AI-generated text."
        };
        return map[name] || "Improves visibility and citation in AI-powered search.";
      }

    } catch (err) {
      clearInterval(interval);
      document.querySelector('#progress-bar')?.remove();
      document.querySelector('.fixed.bottom-6')?.remove();
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
});