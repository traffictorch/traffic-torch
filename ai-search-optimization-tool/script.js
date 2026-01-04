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
      'Fetching and rendering page...',
      'Extracting main content...',
      'Analyzing Answerability...',
      'Analyzing Structured Data...',
      'Evaluating E-E-A-T Signals...',
      'Testing Scannability...',
      'Analyzing Tone & Readability...',
      'Detecting Unique Insights...',
      'Checking Anti-AI Patterns...',
      'Generating Report...'
    ];

    let step = 0;
    progressText.textContent = progressMessages[step++];
    const updateProgress = () => {
      if (step < progressMessages.length) {
        progressText.textContent = progressMessages[step++];
      }
    };
    const interval = setInterval(updateProgress, 2000);

    try {
      const res = await fetch("https://rendered-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
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

      let answerability = 0;
      if (hasBoldInFirst || hasDefinition) answerability += 30;
      if (hasFAQSchema) answerability += 25;
      if (hasQuestionH2) answerability += 15;
      if (hasSteps) answerability += 20;
      if (first300.length > 600) answerability += 10;

      let hasArticle = false;
      let hasFaqHowto = false;
      let hasPerson = false;
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      const hasJsonLd = jsonLdScripts.length > 0;
      let structuredData = 0;
      if (hasJsonLd) structuredData += 30;
      jsonLdScripts.forEach(s => {
        try {
          const data = JSON.parse(s.textContent);
          const types = Array.isArray(data) ? data.map(i => i['@type']) : [data['@type']];
          if (types.some(t => ['Article', 'BlogPosting'].includes(t))) {
            structuredData += 30;
            hasArticle = true;
          }
          if (types.some(t => ['FAQPage', 'HowTo'].includes(t))) {
            structuredData += 20;
            hasFaqHowto = true;
          }
          if (types.includes('Person')) {
            structuredData += 20;
            hasPerson = true;
          }
        } catch {}
      });

      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const hasDate = !!doc.querySelector('time[datetime], meta[name="date"], .published, .updated, .date');
      const hasTrustedLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
        .some(a => !a.href.includes(new URL(url).hostname) && !a.href.includes('facebook.com') && !a.href.includes('twitter.com'));
      let eeat = 0;
      if (hasAuthor) eeat += 40;
      if (hasDate) eeat += 25;
      if (hasTrustedLinks) eeat += 20;
      if (url.startsWith('https:')) eeat += 15;

      const headings = doc.querySelectorAll('h1,h2,h3,h4').length;
      const lists = doc.querySelectorAll('ul,ol').length;
      const tables = doc.querySelectorAll('table').length;
      const shortParas = Array.from(mainEl.querySelectorAll('p'))
        .filter(p => p.textContent.trim().split(/\s+/).length < 35).length;
      let scannability = 0;
      if (headings > 5) scannability += 30;
      if (headings > 8) scannability += 20;
      if (lists > 2) scannability += 20;
      if (tables > 0) scannability += 15;
      if (shortParas > 5) scannability += 15;

      const youCount = (mainText.match(/\byou\b|\byour\b|\byours\b/gi) || []).length;
      const iWeCount = (mainText.match(/\bI\b|\bwe\b|\bmy\b|\bour\b|\bme\b|\bus\b/gi) || []).length;
      const questions = (mainText.match(/\?/g) || []).length;
      const painPoints = (mainText.match(/\b(struggle|problem|issue|challenge|frustrat|hard|difficult|pain|annoy|confus|overwhelm|fail|mistake|wrong)\b/gi) || []).length;
      let conversational = 0;
      if (youCount > 5) conversational += 30;
      if (iWeCount > 3) conversational += 25;
      if (questions > 2) conversational += 20;
      if (painPoints > 3) conversational += 25;

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
        variationScore = variance > 50 ? 100 : variance > 40 ? 95 : variance > 20 ? 80 : variance > 10 ? 60 : 40;
      }
      const passivePatterns = mainText.match(/\b(is|are|was|were|been|be|being)\b.*\b(by|using|with|through)\b/gi) || [];
      const complexWords = mainText.split(/\s+/).filter(w => (w.match(/[aeiouy]+/gi) || []).length >= 3).length;
      const complexRatio = words > 0 ? (complexWords / words) * 100 : 0;
      let readability = 0;
      if (flesch > 60) readability += 40;
      if (variationScore > 70) readability += 25;
      if (passivePatterns.length < 5) readability += 20;
      if (complexRatio < 15) readability += 15;

      const hasInsights = /\b(I tested|in my experience|we found|case study|based on my|hands-on|personally observed)\b/i.test(mainText);
      const hasDated = /\b(in last year|in this year|recently tested|results from)\b/i.test(mainText);
      const hasInterviews = /\b(interview|spoke with|talked to|surveyed|asked|quoted|said ".*"|^".*"\s*-)\b/i.test(mainText);
      let uniqueInsights = 0;
      if (words > 1500) uniqueInsights += 30;
      if (hasInsights) uniqueInsights += 35;
      if (hasDated) uniqueInsights += 20;
      if (hasInterviews) uniqueInsights += 15;

      const wordFreq = {};
      mainText.toLowerCase().split(/\s+/).forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
      const repeatedWords = Object.values(wordFreq).filter(c => c > 10).length;
      const sentenceStarts = sentencesArr.map(s => s.trim().split(/\s+/)[0]?.toLowerCase() || '');
      const startFreq = {};
      sentenceStarts.forEach(s => startFreq[s] = (startFreq[s] || 0) + 1);
      const hasPredictable = Object.values(startFreq).some(c => c > 3);
      let antiAiSafety = 0;
      if (variationScore > 70) antiAiSafety += 50;
      if (repeatedWords <= 2) antiAiSafety += 30;
      if (!hasPredictable) antiAiSafety += 20;

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

      function getGradeInfo(score) {
        if (score >= 80) return { emoji: '✅', color: 'green-500', stroke: '22c55e', textColor: 'text-green-600', button: 'All Clear', bg: 'bg-green-500 hover:bg-green-600' };
        if (score >= 60) return { emoji: '🆗', color: 'orange-500', stroke: 'f97316', textColor: 'text-orange-600', button: 'Show Fixes', bg: 'bg-orange-500 hover:bg-orange-600' };
        return { emoji: '❌', color: 'red-500', stroke: 'ef4444', textColor: 'text-red-600', button: 'Show Fixes', bg: 'bg-orange-500 hover:bg-orange-600' };
      }

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

      const moduleKeywords = {
        "Answerability": ["Bold/strong formatting in opening", "Clear definition pattern in opening", "FAQPage schema detected", "Question-style H2 headings", "Step-by-step language in opening", "Strong opening section (>600 chars)"],
        "Structured Data": ["JSON-LD structured data present", "Article/BlogPosting schema type", "FAQPage/HowTo schema type", "Person schema for author"],
        "EEAT Signals": ["Author byline visible", "Publish/update date shown", "Trusted outbound links", "Secure HTTPS connection"],
        "Scannability": ["Sufficient headings (H1-H4)", "Bullet/numbered lists used", "Data tables present", "Short paragraphs (<35 words)", "Excellent heading density"],
        "Conversational Tone": ["Direct \"you\" address (>5)", "Personal \"I/we\" sharing", "Engaging questions asked", "Reader pain points acknowledged"],
        "Readability": ["Good Flesch score (>60)", "Natural sentence variation", "Low passive voice", "Low complex words (<15%)"],
        "Unique Insights": ["First-hand experience markers", "Dated/timely results mentioned", "Interviews/quotes included", "Deep content (1500+ words)"],
        "Anti-AI Safety": ["High sentence burstiness", "Low word repetition", "No predictable sentence starts"]
      };

      function getWhat(name) { /* keep your original getWhat function */ }
      function getHow(name) { /* keep your original getHow function */ }
      function getWhy(name) { /* keep your original getWhy function */ }
      function getFixes(name) { /* keep your original full getFixes function with all cases */ return ''; } // placeholder - use original

      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');

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
        <div class="text-5xl font-black ${yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">
          ${yourScore >= 80 ? '✅' : yourScore >= 60 ? '🆗' : '❌'}
        </div>
        <div class="text-6xl sm:text-7xl md:text-8xl font-black drop-shadow-2xl ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
          ${yourScore}
        </div>
        <div class="text-xl sm:text-2xl font-medium mt-2 ${yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">
          ${yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Needs Improvement' : 'Needs Work'}
        </div>
        <div class="text-lg text-gray-500 dark:text-gray-400 mt-1">/100</div>
      </div>
    </div>
  </div>
</div>
<div class="grid md:grid-cols-4 gap-6 my-16 px-4">
  ${modules.map(m => {
    const grade = getGradeInfo(m.score);
    const moduleTests = tests.filter(t => moduleKeywords[m.name].some(kw => t.text.includes(kw)));
    const failedOrAverage = moduleTests.filter(t => !t.passed);
    const allClear = failedOrAverage.length === 0;
    return `
      <div class="p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 border-${grade.color}">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="16" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="#${grade.stroke}" stroke-width="16" fill="none" stroke-dasharray="${(m.score/100)*352} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center text-center">
            <div class="text-4xl font-black ${grade.textColor}">${grade.emoji}</div>
            <div class="text-2xl font-bold ${grade.textColor} -mt-8">${m.score}</div>
          </div>
        </div>
        <p class="mt-4 text-lg font-medium text-center text-gray-800 dark:text-gray-200">${m.name}</p>
        <p class="text-sm opacity-70 mt-2 text-center text-gray-800 dark:text-gray-200">${m.desc}</p>
        <div class="mt-4 space-y-2 text-left text-sm">
          ${moduleTests.map(t => `<div class="flex items-center gap-2 text-gray-700 dark:text-gray-300"><span class="text-lg">${t.emoji}</span><span>${t.text}</span></div>`).join('')}
        </div>
        <button type="button" class="mt-4 w-full px-6 py-3 rounded-full text-white font-medium text-sm ${grade.bg}" onclick="const panel = this.nextElementSibling; panel.classList.toggle('hidden'); this.textContent = panel.classList.contains('hidden') ? '${grade.button}' : 'Hide Details';">
          ${grade.button}
        </button>
        <div class="hidden mt-6 text-left text-sm space-y-8 text-gray-800 dark:text-gray-200">
          <p class="font-bold text-lg ${grade.textColor}">${grade.emoji} ${m.name}</p>
          ${allClear ? '<p class="text-green-600 dark:text-green-400 text-lg">All signals strong — excellent work!</p>' : ''}
          ${failedOrAverage.map(t => `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p class="font-bold text-red-600 dark:text-red-400 mb-2">${t.emoji} ${t.text}</p>
              <p class="font-semibold text-red-700 dark:text-red-300">How to fix?</p>
              <p>${getFixes(m.name)}</p> <!-- Use specific per-check if expanded later -->
              <p class="font-semibold text-red-700 dark:text-red-300 mt-3">How the metric works:</p>
              <p>Detection logic and thresholds for this check.</p>
              <p class="font-semibold text-red-700 dark:text-red-300 mt-3">Why it matters:</p>
              <p>Impact on AI citation and visibility.</p>
            </div>
          `).join('')}
          ${!allClear ? `
            <details class="mt-6">
              <summary class="cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:underline">More details →</summary>
              <div class="mt-4 space-y-3 pl-4 border-l-4 border-blue-400 text-gray-800 dark:text-gray-200">
                <p class="font-bold text-blue-600 dark:text-blue-400">What:</p>
                <p>${getWhat(m.name)}</p>
                <p class="font-bold text-green-600 dark:text-green-400">How:</p>
                <p>${getHow(m.name)}</p>
                <p class="font-bold text-orange-600 dark:text-orange-400">Why:</p>
                <p>${getWhy(m.name)}</p>
              </div>
            </details>
          ` : ''}
        </div>
      </div>
    `;
  }).join('')}
</div>




${prioritisedFixes.length > 0 ? `
  <div class="mt-16 px-4">
    <h3 class="text-3xl font-black text-center mb-8 text-blue-800 dark:text-blue-200">Top Priority Fixes (Highest Impact First)</h3>
  </div>
` : ''}
${prioritisedFixes.map(fix => `
  <div class="mx-4 p-8 bg-gradient-to-r ${fix.gradient} border-l-8 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">${fix.emoji}</div>
      <div class="flex-1">
        <h4 class="text-2xl font-bold ${fix.color}">${fix.title}</h4>
        <div class="mt-4">
          <p class="text-blue-500 font-bold">What:</p>
          <p class="text-gray-800 dark:text-gray-200 mt-1">${fix.what}</p>
        </div>
        <div class="mt-2">
          <p class="text-green-500 font-bold">How:</p>
          <p class="text-gray-800 dark:text-gray-200 mt-1">${fix.how}</p>
        </div>
        <div class="mt-2">
          <p class="text-orange-500 font-bold">Why:</p>
          <p class="text-gray-800 dark:text-gray-200 mt-1">${fix.why}</p>
        </div>
      </div>
    </div>
  </div>
`).join('')}
<!-- Score Improvement & Gains Section remains unchanged -->
<div class="mt-20 px-4 max-w-6xl mx-auto">
  <div class="grid md:grid-cols-2 gap-8">
    <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
      <h3 class="text-3xl font-black text-center mb-8 text-gray-800 dark:text-gray-200">AI Search Score Improvement</h3>
      <div class="flex justify-center gap-8 mb-12">
        <div class="text-center">
          <div class="text-5xl font-black text-gray-500 dark:text-gray-400">${yourScore}</div>
          <p class="text-sm opacity-70 mt-2">Current Score</p>
        </div>
        <div class="flex items-center">
          <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
        <div class="text-center">
          <div class="text-5xl font-black text-green-500 dark:text-green-400">${Math.min(100, yourScore + Math.round((100 - yourScore) * 0.6))}</div>
          <p class="text-sm opacity-70 mt-2">Projected Score</p>
        </div>
      </div>
      ${prioritisedFixes.length > 0 ? `
        <div class="space-y-4">
          ${prioritisedFixes.map((fix, i) => `
            <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
              <p class="font-bold text-green-700 dark:text-green-400">${fix.title}</p>
              <p class="text-sm mt-1 text-green-600 dark:text-green-300">Estimated impact: +${i === 0 ? '20–30' : i === 1 ? '15–25' : '10–20'} points</p>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12">
          <p class="text-6xl mb-4">🎉</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">Optimal AI Search Score Achieved!</p>
          <p class="text-gray-600 dark:text-gray-400 mt-4">Your page is already highly optimized for AI citation. Next step: build authority with quality backlinks and fresh content.</p>
        </div>
      `}
      <details class="mt-8">
        <summary class="cursor-pointer text-blue-600 dark:text-blue-400 font-bold mb-4">How We Calculated This</summary>
        <div class="text-sm space-y-3 text-gray-600 dark:text-gray-400">
          <p>• Weighted scoring across 8 key modules</p>
          <p>• Projected score assumes full implementation of top priority fixes</p>
          <p>• Top-cited pages in AI results typically score 80+</p>
          <p>• Conservative estimate based on on-page optimization benchmarks</p>
        </div>
      </details>
    </div>
    <div class="p-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl shadow-2xl">
      <h3 class="text-3xl font-black text-center mb-8">Potential Visibility & Traffic Gains</h3>
      ${prioritisedFixes.length > 0 ? `
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="text-4xl">📈</div>
            <div>
              <p class="font-bold">AI Citation Likelihood</p>
              <p class="text-2xl">${Math.round(yourScore * 0.8)}% → ${Math.round(Math.min(100, yourScore + Math.round((100 - yourScore) * 0.6)) * 0.9)}%</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-4xl">🚀</div>
            <div>
              <p class="font-bold">Direct Traffic Increase</p>
              <p class="text-2xl">+${Math.round((100 - yourScore) * 1.5)}–${Math.round((100 - yourScore) * 2.5)}%</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-4xl">👆</div>
            <div>
              <p class="font-bold">Rich Answer Potential</p>
              <p class="text-2xl">High → Very High</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-4xl">🏆</div>
            <div>
              <p class="font-bold">Competitive Edge</p>
              <p class="text-2xl">Move ahead of ${Math.round((100 - yourScore) * 0.7)}% of competitors</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="text-center py-12">
          <p class="text-6xl mb-4">🌟</p>
          <p class="text-2xl font-bold">Maintaining Top-Tier Performance</p>
          <p class="mt-4 opacity-90">Your page is already competitive in AI results.</p>
          <p class="mt-6">Next: Focus on authority building and content freshness to maintain edge.</p>
        </div>
      `}
      <div class="mt-8 text-sm opacity-90 space-y-2">
        <p>• Conservative estimates based on on-page optimization benchmarks</p>
        <p>• Improvements often visible in AI results within 1–4 weeks</p>
        <p>• Actual results depend on competition, domain authority, and off-page factors</p>
      </div>
    </div>
  </div>
</div>
<div class="text-center my-16">
  <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
          class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
    📄 Save as PDF
  </button>
</div>
      `;

      let fullUrl = document.getElementById('url-input').value.trim();
      let displayUrl = 'traffictorch.net';
      if (fullUrl) {
        let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
        const firstSlash = cleaned.indexOf('/');
        if (firstSlash !== -1) {
          const domain = cleaned.slice(0, firstSlash);
          const path = cleaned.slice(firstSlash);
          displayUrl = domain + '\n' + path;
        } else {
          displayUrl = cleaned;
        }
      }
      document.body.setAttribute('data-url', displayUrl);
    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
};

document.addEventListener('DOMContentLoaded', waitForElements);