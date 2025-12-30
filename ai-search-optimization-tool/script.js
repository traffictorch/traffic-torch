// Wait for required elements to exist before attaching listeners
const waitForElements = () => {
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  const progressContainer = document.getElementById('analysis-progress');
  if (form && results && progressContainer) {
    initTool(form, results, progressContainer);
  } else {
    requestAnimationFrame(waitForElements);
  }
};

const initTool = (form, results, progressContainer) => {
  const progressText = document.getElementById('progress-text');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let inputUrl = document.getElementById('url-input').value.trim();
    if (!inputUrl) {
      alert('Please enter a URL to analyze.');
      return;
    }
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = 'https://' + inputUrl;
      document.getElementById('url-input').value = inputUrl;
    }
    try {
      new URL(inputUrl);
    } catch (_) {
      alert('Please enter a valid URL (e.g., example.com or https://example.com)');
      return;
    }
    const url = inputUrl;

    progressContainer.classList.remove('hidden');
    results.classList.add('hidden');
    const progressMessages = [
      'Fetching and parsing page...',
      'Extracting main content...',
      'Checking answers & definitions...',
      'Scanning FAQ & structured data...',
      'Evaluating trust & EEAT signals...',
      'Test scannability & formatting...',
      'Analyzing tone & readability...',
      'Detecting unique human patterns...',
      'Calculating final AI Search Score...'
    ];
    let step = 0;
    progressText.textContent = progressMessages[step++];
    const updateProgress = () => {
      if (step < progressMessages.length) {
        progressText.textContent = progressMessages[step++];
      }
    };
    const interval = setInterval(updateProgress, 1500);

    try {
      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable – check URL or try HTTPS');
      const html = await res.text();
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      let mainText = '';
      const candidates = [doc.querySelector('article'), doc.querySelector('main'), doc.querySelector('[role="main"]'), doc.body];
      const mainEl = candidates.find(el => el && el.textContent.trim().length > 1000) || doc.body;
      mainEl.querySelectorAll('nav, footer, aside, script, style, header, .ads, .cookie, .sidebar').forEach(el => el.remove());
      mainText = mainEl.textContent.replace(/\s+/g, ' ').trim();
      const first300 = mainText.slice(0, 1200);
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateProgress();

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
      let hasArticle = false;
      let hasFaqHowto = false;
      let hasPerson = false;
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      const hasJsonLd = jsonLdScripts.length > 0;
      if (hasJsonLd) schemaScore += 30;
      jsonLdScripts.forEach(s => {
        try {
          const data = JSON.parse(s.textContent);
          const types = Array.isArray(data) ? data.map(i => i['@type']) : [data['@type']];
          if (types.some(t => ['Article', 'BlogPosting'].includes(t))) {
            schemaScore += 30;
            hasArticle = true;
          }
          if (types.some(t => ['FAQPage', 'HowTo'].includes(t))) {
            schemaScore += 25;
            hasFaqHowto = true;
          }
          if (types.includes('Person')) {
            schemaScore += 15;
            hasPerson = true;
          }
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
      const painPoints = (mainText.match(/\b(struggle|problem|issue|challenge|frustrat|hard|difficult|pain|annoy|confus|overwhelm|fail|mistake|wrong)\b/gi) || []).length;

      const words = mainText.split(/\s+/).filter(Boolean).length || 1;
      const sentences = (mainText.match(/[.!?]+/g) || []).length || 1;
      const syllables = mainText.split(/\s+/).reduce((a, w) => a + (w.match(/[aeiouy]+/gi) || []).length, 0);
      const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

      const sentencesArr = mainText.split(/[.!?]+/).filter(Boolean);
      const lengths = sentencesArr.map(s => s.split(/\s+/).length);
      let variationScore = 50;
      if (lengths.length >= 5) {
        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
        variationScore = variance > 40 ? 95 : variance > 20 ? 80 : variance > 10 ? 60 : 40;
      }
      const passivePatterns = mainText.match(/\b(is|are|was|were|been|be|being)\b.*\b(by|using|with|through)\b/gi) || [];
      const complexWords = mainText.split(/\s+/).filter(w => (w.match(/[aeiouy]+/gi) || []).length >= 3).length;
      const complexRatio = words > 0 ? (complexWords / words) * 100 : 0;

      const hasInsights = /\b(I tested|in my experience|we found|case study|based on my|hands-on|personally observed)\b/i.test(mainText);
      const hasDated = /\b(in \d{4}|last year|this year|recently tested|results from)\b/i.test(mainText);
      const hasInterviews = /\b(interview|spoke with|talked to|surveyed|asked|quoted|said ".*"|^".*"\s*-)\b/i.test(mainText);

      const wordFreq = {};
      mainText.toLowerCase().split(/\s+/).forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
      const repeatedWords = Object.values(wordFreq).filter(c => c > 10).length;

      const sentenceStarts = sentencesArr.map(s => s.trim().split(/\s+/)[0]?.toLowerCase() || '');
      const startFreq = {};
      sentenceStarts.forEach(s => startFreq[s] = (startFreq[s] || 0) + 1);
      const hasPredictable = Object.values(startFreq).some(c => c > 3);

      const conversational = Math.min(100, (youCount * 4) + (iWeCount * 3) + (questions * 6) + (painPoints * 5));

      const readability = Math.round((flesch > 80 ? 95 : flesch > 60 ? 90 : flesch > 40 ? 70 : 40) * 0.4 +
        variationScore * 0.3 +
        (passivePatterns.length < 5 ? 95 : passivePatterns.length < 10 ? 70 : 50) * 0.15 +
        (complexRatio < 15 ? 95 : complexRatio < 20 ? 80 : 60) * 0.15);

      let uniqueInsights = words > 2000 ? 70 : words > 1000 ? 50 : 30;
      if (hasInsights) uniqueInsights = Math.max(uniqueInsights, 80);
      if (hasDated) uniqueInsights += 10;
      if (hasInterviews) uniqueInsights += 10;
      uniqueInsights = Math.min(100, uniqueInsights + (hasInsights ? 15 : 0));

      const antiAiSafety = Math.round(variationScore * 0.5 + (repeatedWords <= 2 ? 95 : repeatedWords <= 5 ? 70 : 50) * 0.3 + (hasPredictable ? 50 : 95) * 0.2);

      const overall = Math.round(
        answerability * 0.25 +
        structuredData * 0.15 +
        eeat * 0.15 +
        scannability * 0.10 +
        conversational * 0.12 +
        readability * 0.10 +
        uniqueInsights * 0.08 +
        antiAiSafety * 0.05
      );
      const yourScore = overall;

      const modules = [
        { name: "Answerability", score: answerability, desc: "Direct answers in first 300 words, FAQ schema, step-by-step structure" },
        { name: "Structured Data", score: structuredData, desc: "JSON-LD presence and relevant types" },
        { name: "EEAT Signals", score: eeat, desc: "Author, dates, trusted links, HTTPS" },
        { name: "Scannability", score: scannability, desc: "Headings, lists, tables, short paragraphs" },
        { name: "Conversational Tone", score: conversational, desc: "You/I/we, questions, pain point acknowledgment" },
        { name: "Readability", score: readability, desc: "Flesch ease, variation, low passive/complex words" },
        { name: "Unique Insights", score: uniqueInsights, desc: "First-hand markers, dated results, interviews" },
        { name: "Anti-AI Safety", score: antiAiSafety, desc: "Variation, low repetition, no predictable patterns" }
      ];

      const tests = [
        { emoji: hasBoldInFirst ? '✅' : '❌', text: 'Bold/strong formatting in opening', passed: hasBoldInFirst },
        { emoji: hasDefinition ? '✅' : '❌', text: 'Clear definition pattern in opening', passed: hasDefinition },
        { emoji: hasFAQSchema ? '✅' : '❌', text: 'FAQPage schema detected', passed: hasFAQSchema },
        { emoji: hasQuestionH2 ? '✅' : '❌', text: 'Question-style H2 headings', passed: hasQuestionH2 },
        { emoji: hasSteps ? '✅' : '❌', text: 'Step-by-step language in opening', passed: hasSteps },
        { emoji: first300.length > 600 ? '✅' : '❌', text: 'Strong opening section (>600 chars)', passed: first300.length > 600 },
        { emoji: hasJsonLd ? '✅' : '❌', text: 'JSON-LD structured data present', passed: hasJsonLd },
        { emoji: hasArticle ? '✅' : '❌', text: 'Article/BlogPosting schema type', passed: hasArticle },
        { emoji: hasFaqHowto ? '✅' : '❌', text: 'FAQPage/HowTo schema type', passed: hasFaqHowto },
        { emoji: hasPerson ? '✅' : '❌', text: 'Person schema for author', passed: hasPerson },
        { emoji: hasAuthor ? '✅' : '❌', text: 'Author byline visible', passed: hasAuthor },
        { emoji: hasDate ? '✅' : '❌', text: 'Publish/update date shown', passed: hasDate },
        { emoji: hasTrustedLinks ? '✅' : '❌', text: 'Trusted outbound links', passed: hasTrustedLinks },
        { emoji: url.startsWith('https:') ? '✅' : '❌', text: 'Secure HTTPS connection', passed: url.startsWith('https:') },
        { emoji: headings > 5 ? '✅' : '❌', text: 'Sufficient headings (H1-H4)', passed: headings > 5 },
        { emoji: lists > 2 ? '✅' : '❌', text: 'Bullet/numbered lists used', passed: lists > 2 },
        { emoji: tables > 0 ? '✅' : '❌', text: 'Data tables present', passed: tables > 0 },
        { emoji: shortParas > 5 ? '✅' : '❌', text: 'Short paragraphs (<35 words)', passed: shortParas > 5 },
        { emoji: headings > 8 ? '✅' : '❌', text: 'Excellent heading density', passed: headings > 8 },
        { emoji: youCount > 5 ? '✅' : '❌', text: 'Direct "you" address (>5)', passed: youCount > 5 },
        { emoji: iWeCount > 3 ? '✅' : '❌', text: 'Personal "I/we" sharing', passed: iWeCount > 3 },
        { emoji: questions > 2 ? '✅' : '❌', text: 'Engaging questions asked', passed: questions > 2 },
        { emoji: painPoints > 3 ? '✅' : '❌', text: 'Reader pain points acknowledged', passed: painPoints > 3 },
        { emoji: flesch > 60 ? '✅' : '❌', text: 'Good Flesch score (>60)', passed: flesch > 60 },
        { emoji: variationScore > 70 ? '✅' : '❌', text: 'Natural sentence variation', passed: variationScore > 70 },
        { emoji: passivePatterns.length < 5 ? '✅' : '❌', text: 'Low passive voice', passed: passivePatterns.length < 5 },
        { emoji: complexRatio < 15 ? '✅' : '❌', text: 'Low complex words (<15%)', passed: complexRatio < 15 },
        { emoji: hasInsights ? '✅' : '❌', text: 'First-hand experience markers', passed: hasInsights },
        { emoji: hasDated ? '✅' : '❌', text: 'Dated/timely results mentioned', passed: hasDated },
        { emoji: hasInterviews ? '✅' : '❌', text: 'Interviews/quotes included', passed: hasInterviews },
        { emoji: words > 1500 ? '✅' : '❌', text: 'Deep content (1500+ words)', passed: words > 1500 },
        { emoji: variationScore > 70 ? '✅' : '❌', text: 'High sentence burstiness', passed: variationScore > 70 },
        { emoji: repeatedWords <= 2 ? '✅' : '❌', text: 'Low word repetition', passed: repeatedWords <= 2 },
        { emoji: !hasPredictable ? '✅' : '❌', text: 'No predictable sentence starts', passed: !hasPredictable }
      ];

      const lowScoring = modules.filter(m => m.score < 70).sort((a, b) => a.score - b.score);
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

      await new Promise(resolve => setTimeout(resolve, 1500));
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

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
      function getFixes(name) {
        const map = {
          "Answerability": "<p>• Bold key answers in opening</p><p>• Add definition phrasing</p><p>• Use FAQ/HowTo schema</p><p>• Question H2s</p><p>• Step-by-step guides</p>",
          "Structured Data": "<p>• Add JSON-LD block</p><p>• Include Article type</p><p>• Add FAQPage/HowTo</p><p>• Link Person schema</p>",
          "EEAT Signals": "<p>• Visible author byline</p><p>• Publish date</p><p>• Trusted outbound links</p><p>• Use HTTPS</p>",
          "Scannability": "<p>• More headings</p><p>• Bullet lists</p><p>• Tables for data</p><p>• Short paragraphs</p><p>• High heading density</p>",
          "Conversational Tone": "<p>• Use 'you' frequently</p><p>• Share personal 'I/we'</p><p>• Ask questions</p><p>• Mention reader struggles</p>",
          "Readability": "<p>• Aim Flesch >60</p><p>• Vary sentence length</p><p>• Reduce passive voice</p><p>• Use simpler words</p>",
          "Unique Insights": "<p>• Add personal markers</p><p>• Mention timely results</p><p>• Include quotes/interviews</p><p>• Write in-depth content</p>",
          "Anti-AI Safety": "<p>• High variation in sentences</p><p>• Avoid repeating words</p><p>• Vary sentence starts</p>"
        };
        return map[name] || "<p>Optimize based on failed checks above.</p>";
      }

      const moduleKeywords = {
        "Answerability": ["Bold/strong", "Clear definition", "FAQPage schema", "Question-style H2", "Step-by-step", "Strong opening"],
        "Structured Data": ["JSON-LD", "Article/BlogPosting", "FAQPage/HowTo", "Person schema"],
        "EEAT Signals": ["Author byline", "Publish/update date", "Trusted outbound", "Secure HTTPS"],
        "Scannability": ["headings", "lists", "tables", "Short paragraphs", "heading density"],
        "Conversational Tone": ["\"you\"", "\"I/we\"", "questions", "pain points"],
        "Readability": ["Flesch", "variation", "passive", "complex words"],
        "Unique Insights": ["First-hand", "Dated/timely", "Interviews/quotes", "Deep content"],
        "Anti-AI Safety": ["burstiness", "repetition", "predictable"]
      };

      results.innerHTML = `
<div class="flex justify-center my-12 px-4">
  <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
    <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
      <circle cx="130" cy="130" r="120"
              stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'}"
              stroke-width="18" fill="none"
              stroke-dasharray="${(yourScore / 100) * 754} 754"
              stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div class="text-5xl sm:text-6xl md:text-7xl font-black drop-shadow-2xl ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
          ${yourScore}
        </div>
        <div class="text-xl sm:text-2xl text-gray-500 dark:text-gray-400">/100</div>
      </div>
    </div>
  </div>
</div>

<div class="grid md:grid-cols-4 gap-6 my-16 px-4">
  ${modules.map(m => {
    const borderColor = m.score >= 80 ? 'border-green-500' : m.score >= 60 ? 'border-orange-500' : 'border-red-500';
    const moduleTests = tests.filter(t => moduleKeywords[m.name].some(kw => t.text.includes(kw)));
    return `
      <div class="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border ${borderColor}">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="64" cy="64" r="56"
                    stroke="${m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#f97316' : '#ef4444'}"
                    stroke-width="12" fill="none"
                    stroke-dasharray="${(m.score/100)*352} 352"
                    stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-4xl font-black ${m.score >= 80 ? 'text-green-600' : m.score >= 60 ? 'text-orange-600' : 'text-red-600'}">
            ${m.score}
          </div>
        </div>
        <p class="mt-4 text-lg font-medium text-center">${m.name}</p>
        <p class="text-sm opacity-70 mt-2 text-center">${m.desc}</p>

        <div class="mt-6 space-y-2 text-left text-sm">
          ${moduleTests.map(t => `
            <div class="flex items-center gap-2 ${t.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
              <span class="text-lg">${t.emoji}</span>
              <span>${t.text}</span>
            </div>
          `).join('')}
        </div>

        <button onclick="this.parentNode.querySelector('.collapsible').classList.toggle('hidden'); this.textContent = this.textContent.includes('Show') ? 'Hide Fixes & Details' : 'Show Fixes & Details';"
                class="mt-6 w-full px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
          Show Fixes & Details
        </button>
        <div class="collapsible hidden mt-6 text-left text-sm space-y-6">
          <div>
            <p class="text-red-600 dark:text-red-400 font-bold mb-3">Recommended Fixes</p>
            <div class="space-y-2 text-gray-700 dark:text-gray-300">${getFixes(m.name)}</div>
          </div>
          <div>
            <p class="text-blue-600 dark:text-blue-400 font-bold mb-3">More Details</p>
            <p><span class="font-bold text-blue-500">What:</span> ${getWhat(m.name)}</p>
            <p class="mt-2"><span class="font-bold text-green-500">How:</span> ${getHow(m.name)}</p>
            <p class="mt-2"><span class="font-bold text-orange-500">Why:</span> ${getWhy(m.name)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('')}
</div>

${prioritisedFixes.map(fix => `
  <div class="mx-4 p-8 bg-gradient-to-r ${fix.gradient} border-l-8 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">${fix.emoji}</div>
      <div class="flex-1">
        <h4 class="text-2xl font-bold ${fix.color}">${fix.title}</h4>
        <div class="mt-4">
          <p class="text-blue-500 font-bold">What:</p>
          <p class="text-gray-500 mt-1">${fix.what}</p>
        </div>
        <div class="mt-2">
          <p class="text-green-500 font-bold">How:</p>
          <p class="text-gray-500 mt-1">${fix.how}</p>
        </div>
        <div class="mt-2">
          <p class="text-orange-500 font-bold">Why:</p>
          <p class="text-gray-500 mt-1">${fix.why}</p>
        </div>
      </div>
    </div>
  </div>
`).join('')}

<div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl space-y-8 mx-4">
  <h3 class="text-4xl font-black text-center">Predictive AI SERP Forecast</h3>
  <p class="text-center text-5xl font-black">${yourScore >= 90 ? 'Top 3' : yourScore >= 80 ? 'Top 5' : yourScore >= 70 ? 'Top 10' : yourScore >= 50 ? 'Page 1 Possible' : 'Page 2+'}</p>
  <p class="text-center text-4xl font-bold">+${Math.round((100 - yourScore) * 1.8)}% potential traffic gain if fixed</p>
  <p class="text-center text-lg italic opacity-80">Based on trust, direct answers, structure, and human signals — here's the breakdown:</p>
  <div class="grid md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-white/10 rounded-2xl"><p class="font-bold text-blue-300 text-xl mb-2">What it is</p><p class="text-sm leading-relaxed">Estimate of your page’s potential position in AI-powered search results (Perplexity, Grok, Gemini, ChatGPT Search, etc.).</p></div>
    <div class="p-6 bg-white/10 rounded-2xl"><p class="font-bold text-green-300 text-xl mb-2">How it's calculated</p><p class="text-sm leading-relaxed">Weighted: 25% Answerability, 15% Structured Data, 15% EEAT, 10% each Scannability/Tone/Readability, 8% Unique Insights, 5% Anti-AI Safety.</p></div>
    <div class="p-6 bg-white/10 rounded-2xl"><p class="font-bold text-orange-300 text-xl mb-2">Why it matters</p><p class="text-sm leading-relaxed">Top AI citations drive massive direct traffic. Fixing gaps can multiply visibility in days.</p></div>
  </div>
  <p class="text-center text-sm italic mt-6">Forecast is heuristic; actual performance varies by query and competition.</p>
</div>

<div class="text-center my-16">
  <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
          class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
    📄 Save as PDF
  </button>
</div>
      `;

    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
};

document.addEventListener('DOMContentLoaded', waitForElements);