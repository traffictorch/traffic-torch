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
      // Answerability
      let answerability = 0;
      if (hasBoldInFirst || hasDefinition) answerability += 30;
      if (hasFAQSchema) answerability += 25;
      if (hasQuestionH2) answerability += 15;
      if (hasSteps) answerability += 20;
      if (first300.length > 600) answerability += 10;
      // Structured Data
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
      // EEAT Signals
      const hasAuthor = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const hasDate = !!doc.querySelector('time[datetime], meta[name="date"], .published, .updated, .date');
      const hasTrustedLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
        .some(a => !a.href.includes(new URL(url).hostname) && !a.href.includes('facebook.com') && !a.href.includes('twitter.com'));
      let eeat = 0;
      if (hasAuthor) eeat += 40;
      if (hasDate) eeat += 25;
      if (hasTrustedLinks) eeat += 20;
      if (url.startsWith('https:')) eeat += 15;
      // Scannability
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
      // Conversational Tone
      const youCount = (mainText.match(/\byou\b|\byour\b|\byours\b/gi) || []).length;
      const iWeCount = (mainText.match(/\bI\b|\bwe\b|\bmy\b|\bour\b|\bme\b|\bus\b/gi) || []).length;
      const questions = (mainText.match(/\?/g) || []).length;
      const painPoints = (mainText.match(/\b(struggle|problem|issue|challenge|frustrat|hard|difficult|pain|annoy|confus|overwhelm|fail|mistake|wrong)\b/gi) || []).length;
      let conversational = 0;
      if (youCount > 5) conversational += 30;
      if (iWeCount > 3) conversational += 25;
      if (questions > 2) conversational += 20;
      if (painPoints > 3) conversational += 25;
      // Readability
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
      // Unique Insights
      const hasInsights = /\b(I tested|in my experience|we found|case study|based on my|hands-on|personally observed)\b/i.test(mainText);
      const hasDated = /\b(in last year|in this year|recently tested|results from)\b/i.test(mainText);
      const hasInterviews = /\b(interview|spoke with|talked to|surveyed|asked|quoted|said ".*"|^".*"\s*-)\b/i.test(mainText);
      let uniqueInsights = 0;
      if (words > 1500) uniqueInsights += 30;
      if (hasInsights) uniqueInsights += 35;
      if (hasDated) uniqueInsights += 20;
      if (hasInterviews) uniqueInsights += 15;
      // Anti-AI Safety
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
        if (score >= 80) {
          return { emoji: '✅', color: 'green-500', stroke: '22c55e', textColor: 'text-green-600', button: 'All Clear', bg: 'bg-green-500 hover:bg-green-600' };
        } else if (score >= 60) {
          return { emoji: '🆗', color: 'orange-500', stroke: 'f97316', textColor: 'text-orange-600', button: 'Show Fixes', bg: 'bg-orange-500 hover:bg-orange-600' };
        } else {
          return { emoji: '❌', color: 'red-500', stroke: 'ef4444', textColor: 'text-red-600', button: 'Show Fixes', bg: 'bg-orange-500 hover:bg-orange-600' };
        }
      }
      const lowScoring = modules.filter(m => m.score < 70).sort((a, b) => a.score - b.score);
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
      const topLowScoring = lowScoring.slice(0, 3);
      const prioritisedFixes = [];
      if (topLowScoring.some(m => m.name === "Answerability")) {
        prioritisedFixes.push({ title: "Add Direct Answer in Opening", emoji: "💡", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "A clear, bold, quotable answer AI engines can cite directly",
          how: "Add a bold definition or summary in first 150–250 words. Use H2 questions and numbered steps.",
          why: "Answerability is the #1 factor for AI citation and source selection"
        });
      }
      if (topLowScoring.some(m => m.name === "EEAT Signals")) {
        prioritisedFixes.push({ title: "Add Author Bio & Photo", emoji: "👤", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "Visible byline proving who wrote this",
          how: "Headshot + name + bio + credentials + social links",
          why: "Boosts Expertise & Trust by 30–40 points — Google's #1 E-E-A-T signal"
        });
      }
      if (topLowScoring.some(m => m.name === "Structured Data")) {
        prioritisedFixes.push({ title: "Add Article + Person Schema", emoji: "✨", gradient: "from-purple-500/10 border-purple-500", color: "text-purple-600",
          what: "Structured data that AI engines read directly",
          how: "JSON-LD with @type Article + Person + author link. Add FAQPage if relevant.",
          why: "Triggers rich answers and massive citation boost"
        });
      }
      if (topLowScoring.some(m => m.name === "Scannability")) {
        prioritisedFixes.push({ title: "Boost Scannability with Lists & Tables", emoji: "📋", gradient: "from-orange-500/10 border-orange-500", color: "text-orange-600",
          what: "Easy-to-extract facts via structured formatting",
          how: "Add bullet/numbered lists, data tables, H2/H3 headings, short paragraphs",
          why: "AI prioritizes instantly extractable content"
        });
      }
      if (topLowScoring.some(m => m.name === "Unique Insights")) {
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
          "Answerability": "The degree to which your page provides direct, concise, and quotable answers right at the beginning. AI engines prioritize pages that immediately satisfy user intent with clear summaries they can cite verbatim in search results.",
          "Structured Data": "Machine-readable markup (JSON-LD) that explicitly tells search engines what type of content your page contains. This helps trigger rich results, better understanding, and higher likelihood of being selected as a source.",
          "EEAT Signals": "Visible indicators of Expertise, Experience, Authoritativeness, and Trustworthiness. These include author information, dates, secure connection, and links to reputable sources — critical for AI trust evaluation.",
          "Scannability": "How easily both humans and AI can quickly extract key facts from your page. Well-structured content with headings, lists, tables, and short paragraphs is far more likely to be parsed and cited.",
          "Conversational Tone": "Writing that feels natural and human by directly addressing the reader, using personal pronouns, asking questions, and acknowledging pain points. This matches how real people search and communicate.",
          "Readability": "How simple and clear your writing is to understand and summarize. High readability (good Flesch score, varied sentences, active voice, simple words) makes content easier for AI to process accurately.",
          "Unique Insights": "Original, first-hand information that can't be found elsewhere — personal testing, case studies, interviews, or timely observations. This prevents de-duplication and boosts perceived value.",
          "Anti-AI Safety": "Subtle human writing patterns like natural sentence variation, low repetition, and unpredictable structure. These help avoid being mistakenly flagged as low-quality AI-generated content."
        };
        return map[name] || "An important factor for AI search visibility and citation.";
      }
      function getHow(name) {
        const map = {
          "Answerability": "Place a bold, complete answer in the first 150–300 words. Use definition-style phrasing, question-based H2 headings, FAQ or HowTo structured data, and numbered step-by-step instructions where relevant.",
          "Structured Data": "Add a JSON-LD script tag containing Article/BlogPosting type. Include FAQPage or HowTo schema if applicable, and connect authorship with Person markup for maximum signal strength.",
          "EEAT Signals": "Display a clear author byline with photo and bio. Show publish and update dates prominently. Link out to trusted authority sites and ensure your page uses HTTPS.",
          "Scannability": "Break content with frequent H2/H3 headings. Use bullet points, numbered lists, and data tables liberally. Keep paragraphs short (2–4 lines) and include visual separators when helpful.",
          "Conversational Tone": "Address the reader directly with “you”. Share personal insights using “I” or “we”. Include rhetorical questions and acknowledge common reader frustrations or challenges.",
          "Readability": "Target a Flesch Reading Ease score above 60. Mix short and medium sentences. Prefer active voice and replace complex words with simpler alternatives when meaning allows.",
          "Unique Insights": "Include personal testing results, case studies, or observations. Reference recent experiments or findings. Add direct quotes from interviews or surveys for exclusive value.",
          "Anti-AI Safety": "Deliberately vary sentence length and structure throughout. Use synonyms instead of repeating words. Avoid starting multiple sentences the same way."
        };
        return map[name] || "Follow established best practices for this optimization area.";
      }
      function getWhy(name) {
        const map = {
          "Answerability": "AI-powered search engines heavily favor pages that provide immediate, quotable answers. Direct answers are the #1 factor for being cited in overviews and generative results.",
          "Structured Data": "Proper markup gives explicit signals that improve understanding and trigger rich features. Pages with relevant schema are significantly more likely to be selected as authoritative sources.",
          "EEAT Signals": "Trust is the primary deciding factor for AI citation. Clear authorship, dates, and credible references prove the content comes from a reliable, experienced source.",
          "Scannability": "AI engines prioritize content that can be quickly and accurately extracted. Well-formatted elements like lists and tables are easiest to parse and reuse in answers.",
          "Conversational Tone": "Natural human language closely matches real user queries. Conversational writing feels authentic and builds reader connection — both valued by modern search systems.",
          "Readability": "Clear, simple writing is easier for AI to accurately summarize and cite. High readability reduces misinterpretation and improves overall content quality perception.",
          "Unique Insights": "Original first-hand information stands out from generic content. Unique value prevents de-duplication and positions your page as an authoritative primary source.",
          "Anti-AI Safety": "Human-like variation helps avoid accidental filtering as low-quality generated text. Natural patterns maintain visibility while preserving authentic voice."
        };
        return map[name] || "This factor significantly impacts AI search performance and citation likelihood.";
      }
      
      
      function getPerMetricHow(text) {
  const map = {
    'Bold/strong formatting in opening': 'Place key answers or definitions in <strong> or <b> tags within the first paragraph so AI can easily quote them.',
    'Clear definition pattern in opening': 'Start with clear definitional phrasing like “X is…”, “X means…”, “X refers to…” or “X is defined as…” to directly satisfy definitional queries.',
    'FAQPage schema detected': 'Add a JSON-LD script with @type "FAQPage" containing your questions and answers.',
    'Question-style H2 headings': 'Format headings as real user questions (e.g. “How do I fix slow loading?”, “What is the best…?”).',
    'Step-by-step language in opening': 'Include clear numbered or bulleted steps early in the content using phrases like “follow these steps” or “here’s how”.',
    'Strong opening section (>600 chars)': 'Expand the opening section with valuable, direct content to give AI more high-quality material to summarize and cite.',
    'JSON-LD structured data present': 'Add at least one <script type="application/ld+json"> block with valid markup.',
    'Article/BlogPosting schema type': 'Include @type "Article" or "BlogPosting" in your JSON-LD.',
    'FAQPage/HowTo schema type': 'Use "FAQPage" for Q&A content or "HowTo" for instructional guides.',
    'Person schema for author': 'Add a "Person" entity linked via the "author" property to prove authorship.',
    'Author byline visible': 'Display the author name, photo and short bio prominently (top or bottom of article).',
    'Publish/update date shown': 'Clearly show publish date and last updated date in the content.',
    'Trusted outbound links': 'Link to reputable sources (universities, government sites, well-known authorities).',
    'Secure HTTPS connection': 'Ensure your site uses HTTPS (get an SSL certificate if needed).',
    'Sufficient headings (H1-H4)': 'Use at least 6 headings to break up the content logically.',
    'Bullet/numbered lists used': 'Convert long paragraphs into 3+ bullet or numbered lists.',
    'Data tables present': 'Include at least one data table for comparisons, specs or stats.',
    'Short paragraphs (<35 words)': 'Keep most paragraphs under 4 lines / 35 words.',
    'Excellent heading density': 'Aim for a heading every 300–400 words.',
    'Direct "you" address (>5)': 'Use “you”, “your”, “yours” more than 5 times to speak directly to the reader.',
    'Personal "I/we" sharing': 'Include “I”, “we”, “my”, “our” at least 4 times to sound personal.',
    'Engaging questions asked': 'Add 3+ rhetorical questions that mirror what readers are thinking.',
    'Reader pain points acknowledged': 'Mention common struggles/frustrations the reader might feel.',
    'Good Flesch score (>60)': 'Use shorter sentences and simpler words to improve reading ease.',
    'Natural sentence variation': 'Mix very short and longer sentences for natural rhythm.',
    'Low passive voice': 'Prefer active voice (“We tested X”) over passive (“X was tested by us”).',
    'Low complex words (<15%)': 'Replace complex jargon with simpler alternatives where possible.',
    'First-hand experience markers': 'Add phrases like “I tested”, “in my experience”, “we found that”, “hands-on”.',
    'Dated/timely results mentioned': 'Reference recent tests, current-year observations or timely findings.',
    'Interviews/quotes included': 'Include direct quotes from experts, clients or survey respondents.',
    'Deep content (1500+ words)': 'Expand with more depth, examples and original analysis.',
    'High sentence burstiness': 'Deliberately vary sentence length dramatically for human-like flow.',
    'Low word repetition': 'Use synonyms and varied phrasing instead of repeating the same terms.',
    'No predictable sentence starts': 'Avoid starting multiple sentences with the same word or structure.'
  };
  return map[text] || 'Follow best practices for this signal to improve your score.';
}

function getPerMetricDetection(text) {
  const map = {
    'Bold/strong formatting in opening': 'Scans first ~1200 characters for <strong>, <b> or <em> tags.',
    'Clear definition pattern in opening': 'Searches opening text for phrases like “is”, “means”, “refers to”, “defined as”.',
    'FAQPage schema detected': 'Checks JSON-LD scripts for "FAQPage" type.',
    'Question-style H2 headings': 'Detects H2 tags ending in ? or !.',
    'Step-by-step language in opening': 'Searches opening for keywords like “step”, “guide”, “how to”, “instructions”.',
    'Strong opening section (>600 chars)': 'Measures character count of extracted opening content.',
    'JSON-LD structured data present': 'Counts <script type="application/ld+json"> blocks.',
    'Article/BlogPosting schema type': 'Parses JSON-LD for "Article" or "BlogPosting" @type.',
    'FAQPage/HowTo schema type': 'Checks for "FAQPage" or "HowTo" types.',
    'Person schema for author': 'Looks for "Person" type in structured data.',
    'Author byline visible': 'Scans page for common author selectors.',
    'Publish/update date shown': 'Detects date elements or meta tags.',
    'Trusted outbound links': 'Finds external HTTPS links (excluding social media).',
    'Secure HTTPS connection': 'Checks if URL uses https://.',
    'Sufficient headings (H1-H4)': 'Counts H1–H4 tags (more than 5 = pass).',
    'Bullet/numbered lists used': 'Counts <ul> and <ol> (more than 2 = pass).',
    'Data tables present': 'Detects <table> elements.',
    'Short paragraphs (<35 words)': 'Counts paragraphs with <35 words.',
    'Excellent heading density': 'Checks for more than 8 headings total.',
    'Direct "you" address (>5)': 'Counts occurrences of “you/your/yours”.',
    'Personal "I/we" sharing': 'Counts personal pronouns (“I/we/my/our/me/us”).',
    'Engaging questions asked': 'Counts sentences ending in ?.',
    'Reader pain points acknowledged': 'Scans for pain/frustration keywords.',
    'Good Flesch score (>60)': 'Calculates Flesch Reading Ease formula.',
    'Natural sentence variation': 'Measures variance in sentence length.',
    'Low passive voice': 'Detects passive constructions.',
    'Low complex words (<15%)': 'Counts words with 3+ syllables.',
    'First-hand experience markers': 'Scans for phrases like “I tested”, “in my experience”, “we found”.',
    'Dated/timely results mentioned': 'Looks for recent time references.',
    'Interviews/quotes included': 'Detects quote patterns and interview keywords.',
    'Deep content (1500+ words)': 'Counts words in main content.',
    'High sentence burstiness': 'Same as sentence variation score.',
    'Low word repetition': 'Checks if any word is repeated >10 times.',
    'No predictable sentence starts': 'Ensures no single starting word is used too frequently.'
  };
  return map[text] || 'This metric uses on-page analysis to detect the signal.';
}

function getPerMetricWhy(text) {
  const map = {
    'Bold/strong formatting in opening': 'Bold text is highly quotable — AI engines love pulling it directly into answers.',
    'Clear definition pattern in opening': 'Direct definitions satisfy definitional queries and increase chances of being cited.',
    'FAQPage schema detected': 'Triggers rich FAQ results and improves AI understanding.',
    'Question-style H2 headings': 'Matches real user queries, boosting relevance signals.',
    'Step-by-step language in opening': 'Instructions are easy for AI to extract and reuse.',
    'Strong opening section (>600 chars)': 'Gives AI more high-quality content to summarize in overviews.',
    'JSON-LD structured data present': 'Explicit markup helps search engines understand and trust your content.',
    'Article/BlogPosting schema type': 'Confirms content type for better topical authority.',
    'FAQPage/HowTo schema type': 'Enables rich results and direct answer extraction.',
    'Person schema for author': 'Proves real authorship — critical for E-E-A-T.',
    'Author byline visible': 'Visible expertise builds trust with both users and AI.',
    'Publish/update date shown': 'Shows freshness and maintenance — key trust signal.',
    'Trusted outbound links': 'Linking to authorities proves research and credibility.',
    'Secure HTTPS connection': 'Basic trust requirement for modern search.',
    'Sufficient headings (H1-H4)': 'Improves scannability for users and parsing for AI.',
    'Bullet/numbered lists used': 'Lists are the easiest format for AI to extract facts.',
    'Data tables present': 'Tables provide structured data AI can reuse accurately.',
    'Short paragraphs (<35 words)': 'Short paragraphs improve readability and extraction.',
    'Excellent heading density': 'Optimal structure guides both readers and crawlers.',
    'Direct "you" address (>5)': 'Conversational tone matches natural search queries.',
    'Personal "I/we" sharing': 'Personal voice builds authenticity and connection.',
    'Engaging questions asked': 'Questions increase engagement and mirror user intent.',
    'Reader pain points acknowledged': 'Empathy builds trust and keeps readers on page.',
    'Good Flesch score (>60)': 'Simple writing is easier for AI to process and summarize.',
    'Natural sentence variation': 'Human-like rhythm avoids AI detection flags.',
    'Low passive voice': 'Active voice is clearer and more authoritative.',
    'Low complex words (<15%)': 'Simple words improve comprehension and accessibility.',
    'First-hand experience markers': 'Proves real experience — core E-E-A-T requirement.',
    'Dated/timely results mentioned': 'Shows freshness and real-world testing.',
    'Interviews/quotes included': 'Adds exclusive value and authority.',
    'Deep content (1500+ words)': 'Depth signals comprehensiveness and expertise.',
    'High sentence burstiness': 'Natural human writing pattern.',
    'Low word repetition': 'Avoids repetitive, robotic feel.',
    'No predictable sentence starts': 'Breaks predictable patterns common in generated text.'
  };
  return map[text] || 'This signal significantly impacts AI search performance and content quality perception.';
}
      
      
      
      function getFixes(name) {
        let fixes = '';
        if (name === "Answerability") {
          if (!hasBoldInFirst) fixes += '<p>• <strong>Bold key answers in opening:</strong> Place the main answer in bold text within the first paragraph so AI can easily quote it.</p>';
          if (!hasDefinition) fixes += '<p>• <strong>Add definition phrasing:</strong> Start with clear phrases like “X means…” or “X is defined as…” to directly satisfy definitional queries.</p>';
          if (!hasFAQSchema) fixes += '<p>• <strong>Use FAQ/HowTo schema:</strong> Add structured data markup that tells search engines this page answers common questions or provides steps.</p>';
          if (!hasQuestionH2) fixes += '<p>• <strong>Question H2s:</strong> Use heading tags formatted as questions (e.g., “How do I fix X?”) to match real user searches.</p>';
          if (!hasSteps) fixes += '<p>• <strong>Step-by-step guides:</strong> Include numbered lists with clear actions — AI engines love extractable instructions.</p>';
          if (first300.length <= 600) fixes += '<p>• <strong>Strengthen opening section:</strong> Expand the first section to over 600 characters with valuable content so AI has more to summarize and cite.</p>';
        }
        if (name === "Structured Data") {
          if (!hasJsonLd) fixes += '<p>• <strong>Add JSON-LD block:</strong> Include a script tag with structured data that search engines can read directly.</p>';
          if (!hasArticle) fixes += '<p>• <strong>Include Article type:</strong> Mark the page as an Article or BlogPosting so AI knows it\'s authoritative content.</p>';
          if (!hasFaqHowto) fixes += '<p>• <strong>Add FAQPage/HowTo:</strong> If the page answers questions or teaches a process, add the matching schema type.</p>';
          if (!hasPerson) fixes += '<p>• <strong>Link Person schema:</strong> Connect the content to an author profile using Person markup for better trust signals.</p>';
        }
        if (name === "EEAT Signals") {
          if (!hasAuthor) fixes += '<p>• <strong>Visible author byline:</strong> Show the writer\'s name, photo, and short bio near the top or bottom of the article.</p>';
          if (!hasDate) fixes += '<p>• <strong>Publish date:</strong> Clearly display when the article was published and last updated.</p>';
          if (!hasTrustedLinks) fixes += '<p>• <strong>Trusted outbound links:</strong> Link to reputable sources (universities, government sites, known authorities) to build credibility.</p>';
          if (!url.startsWith('https:')) fixes += '<p>• <strong>Use HTTPS:</strong> Ensure your site uses a secure connection — basic but essential for trust.</p>';
        }
        if (name === "Scannability") {
          if (headings <= 5) fixes += '<p>• <strong>More headings:</strong> Break content into logical sections with H2 and H3 tags every 300–400 words.</p>';
          if (lists <= 2) fixes += '<p>• <strong>Bullet lists:</strong> Turn long paragraphs into scannable bullet or numbered lists.</p>';
          if (tables === 0) fixes += '<p>• <strong>Tables for data:</strong> Present comparisons, specs, or stats in clean tables instead of paragraphs.</p>';
          if (shortParas <= 5) fixes += '<p>• <strong>Short paragraphs:</strong> Keep most paragraphs under 4 lines for faster reading and easier AI extraction.</p>';
          if (headings <= 8) fixes += '<p>• <strong>High heading density:</strong> Aim for a heading every few hundred words to guide both users and AI.</p>';
        }
        if (name === "Conversational Tone") {
          if (youCount <= 5) fixes += '<p>• <strong>Use \'you\' frequently:</strong> Address the reader directly (“you can”, “your results”) to create connection.</p>';
          if (iWeCount <= 3) fixes += '<p>• <strong>Share personal \'I/we\':</strong> Include phrases like “I tested this” or “we found that” to sound human.</p>';
          if (questions <= 2) fixes += '<p>• <strong>Ask questions:</strong> Pose rhetorical questions that mirror what readers are thinking.</p>';
          if (painPoints <= 3) fixes += '<p>• <strong>Mention reader struggles:</strong> Acknowledge pain points (“tired of slow results?”, “frustrated with…”) to build empathy.</p>';
        }
        if (name === "Readability") {
          if (flesch <= 60) fixes += '<p>• <strong>Aim Flesch >60:</strong> Target a reading ease score above 60 by using shorter sentences and common words.</p>';
          if (variationScore <= 70) fixes += '<p>• <strong>Vary sentence length:</strong> Mix short punchy sentences with medium ones for natural rhythm.</p>';
          if (passivePatterns.length >= 5) fixes += '<p>• <strong>Reduce passive voice:</strong> Prefer active voice (“We tested X” instead of “X was tested by us”).</p>';
          if (complexRatio >= 15) fixes += '<p>• <strong>Use simpler words:</strong> Replace complex jargon with everyday alternatives where possible.</p>';
        }
        if (name === "Unique Insights") {
          if (!hasInsights) fixes += '<p>• <strong>Add personal markers:</strong> Include phrases like “In my experience”, “I tested”, or “we observed” to show original research.</p>';
          if (!hasDated) fixes += '<p>• <strong>Mention timely results:</strong> Reference recent tests or current findings to prove freshness.</p>';
          if (!hasInterviews) fixes += '<p>• <strong>Include quotes/interviews:</strong> Add direct quotes from experts or survey respondents for exclusive value.</p>';
          if (words <= 1500) fixes += '<p>• <strong>Write in-depth content:</strong> Go beyond surface-level advice with detailed analysis and original data.</p>';
        }
        if (name === "Anti-AI Safety") {
          if (variationScore <= 70) fixes += '<p>• <strong>High variation in sentences:</strong> Deliberately mix very short and longer sentences for human-like flow.</p>';
          if (repeatedWords > 2) fixes += '<p>• <strong>Avoid repeating words:</strong> Use synonyms and varied phrasing instead of repeating the same terms.</p>';
          if (hasPredictable) fixes += '<p>• <strong>Vary sentence starts:</strong> Don’t begin every sentence with the same structure or subject.</p>';
        }
        return fixes || '<p class="text-green-600 dark:text-green-400">All signals strong — excellent work!</p>';
      }
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
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
      <div class="text-8xl sm:text-9xl md:text-[10rem] font-black drop-shadow-2xl leading-none ${yourScore >= 80 ? 'text-green-500 dark:text-green-400' : yourScore >= 60 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}">
        ${yourScore}
      </div>
      <div class="text-2xl sm:text-3xl font-medium ${yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">
        /100
      </div>
    </div>
  </div>
</div>

<div class="flex justify-center mb-12 px-4">
  <div class="flex items-center gap-6">
    <div class="text-5xl sm:text-5xl md:text-5xl font-black ${yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">
      ${yourScore >= 80 ? '✅' : yourScore >= 60 ? '🆗' : '❌'}
    </div>
    <div class="text-4xl sm:text-5xl md:text-6xl font-bold ${yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}">
      ${yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Very Good' : 'Needs Work'}
    </div>
  </div>
</div>


<div class="grid grid-cols-1 md:grid-cols-4 gap-8 my-12 px-4 max-w-7xl mx-auto">
  ${modules.map(m => {
    const grade = getGradeInfo(m.score);
    const moduleTests = tests.filter(t => moduleKeywords[m.name].some(kw => t.text.includes(kw)));
    const hasIssues = moduleTests.some(t => !t.passed);
    const allClear = !hasIssues;
    const needsFixSignals = moduleTests.filter(t => !t.passed);
    return `
      <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 border-${grade.color} p-6 flex flex-col">
        <div class="relative mx-auto w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="16" fill="none"/>
            <circle cx="64" cy="64" r="56" stroke="#${grade.stroke}" stroke-width="16" fill="none" stroke-dasharray="${(m.score/100)*352} 352" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-5xl font-black ${grade.textColor}">${m.score}</div>
          </div>
        </div>
        <p class="mt-6 text-xl font-bold text-center text-gray-800 dark:text-gray-200">${m.name}</p>
        <div class="flex justify-center items-center gap-2 mt-2">
          <span class="text-2xl">${grade.emoji}</span>
          <span class="text-base font-medium ${grade.textColor}">
            ${m.score >= 80 ? 'Excellent' : m.score >= 60 ? 'Needs Improvement' : 'Needs Work'}
          </span>
        </div>
        <p class="text-sm opacity-70 mt-2 text-center text-gray-800 dark:text-gray-200">${m.desc}</p>
        <div class="mt-6 space-y-2 text-left text-sm">
          ${moduleTests.map(t => {
            let textColor = t.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            let emojiOverride = t.emoji;
            if (!t.passed && (t.text.includes('mentioned') || t.text.includes('present') || t.text.includes('shown') || t.text.includes('Trusted outbound links'))) {
              textColor = 'text-orange-600 dark:text-orange-400';
              emojiOverride = '🆗';
            }
            return `
            <div class="flex items-center gap-3">
              <span class="text-2xl">${emojiOverride}</span>
              <span class="text-base font-medium ${textColor}">${t.text}</span>
            </div>
            `;
          }).join('')}
        </div>
        <div class="mt-8">
          <button class="fixes-toggle w-full h-12 px-6 rounded-full text-white font-medium text-sm ${grade.bg} flex items-center justify-center hover:opacity-90 transition">
            ${needsFixSignals.length ? 'Show Fixes (' + needsFixSignals.length + ')' : 'All Clear'}
          </button>
        </div>

        <div class="fixes-panel hidden overflow-hidden transition-all duration-300 ease-in-out">
          <div class="p-6 space-y-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            ${allClear ?
              `<p class="text-green-600 dark:text-green-400 text-lg font-bold text-center py-8">All signals strong — excellent work! ✅</p>` :
              `
              <div class="space-y-6">
                ${getFixes(m.name)}
              </div>
              `}
          ${!allClear ? `
            <div class="mt-6 text-center">
              <button class="more-details-toggle text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
                More Details
              </button>
            </div>
            <div class="full-details hidden mt-6 space-y-6 text-base">
              <div>
                <p class="font-bold text-blue-600 dark:text-blue-400">What:</p>
                <p>${getWhat(m.name)}</p>
              </div>
              <div>
                <p class="font-bold text-green-600 dark:text-green-400">How:</p>
                <p>${getHow(m.name)}</p>
              </div>
              <div>
                <p class="font-bold text-orange-600 dark:text-orange-400">Why:</p>
                <p>${getWhy(m.name)}</p>
              </div>
            </div>
          ` : ''}
        </div>
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
          <p>• Weighted scoring across 8 key modules (Answerability 25%, Structured Data & EEAT 15% each, etc.)</p>
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
          displayUrl = domain + '\\n' + path;
        } else {
          displayUrl = cleaned;
        }
      }
      document.body.setAttribute('data-url', displayUrl);

      // Event delegation for fixes toggles - works after innerHTML replacement
document.addEventListener('click', (e) => {
  if (e.target.matches('.fixes-toggle')) {
    const clickedCard = e.target.closest('.score-card');
    if (!clickedCard) return;

    const clickedPanel = clickedCard.querySelector('.fixes-panel');

    // Close all other fixes-panels
    document.querySelectorAll('.fixes-panel').forEach(panel => {
      if (panel !== clickedPanel) {
        panel.classList.add('hidden');
      }
    });

    // Toggle the clicked one
    if (clickedPanel) {
      clickedPanel.classList.toggle('hidden');
    }
  }

  if (e.target.matches('.more-details-toggle')) {
    const card = e.target.closest('.score-card');
    if (card) {
      const details = card.querySelector('.full-details');
      if (details) details.classList.toggle('hidden');
    }
  }
});
      
      
    } catch (err) {
      clearInterval(interval);
      progressContainer.classList.add('hidden');
      results.classList.remove('hidden');
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
  });
};

document.addEventListener('DOMContentLoaded', waitForElements);