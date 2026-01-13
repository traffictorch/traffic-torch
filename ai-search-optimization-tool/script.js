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
      
     let answerability = 0;

      
      // Opening strength – reward good length, don't heavily punish very concise excellent answers
const openingLen = first300.length;
if (openingLen > 900) answerability += 15;
else if (openingLen > 550) answerability += 10;
else if (openingLen > 300) answerability += 5;
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateProgress();
      const hasBoldInFirst = /<strong>|<b>|<em>|<mark>|<u>|class=["']([^"']*?bold|strong)[^"']*["']/i.test(first300);
      const hasDefinition = /\b(is|means|refers to|defined as|stands for|known as|typically refers|commonly understood as|represents|equals|consists of|involves|includes|contains|features|covers|describes|explains|shows|outlines|details|breaks down|summarizes|highlights|focuses on|centers on)\b/i.test(first300.toLowerCase());
      const hasFAQSchema = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .some(s => s.textContent.includes('"FAQPage"') || s.textContent.includes('"HowTo"'));
      const questionWords = /^(what|how|why|when|where|who|which|can|should|do|does|is|are|will|would|could|may|might|shall)\b/i;
const hasQuestionH2 = Array.from(doc.querySelectorAll('h2,h3')).some(h => {
  const txt = h.textContent.trim();
  return txt.length > 15 && txt.length < 120 && questionWords.test(txt) && /[?]/.test(txt);
});
      const hasSteps = /\b(step|guide|how to|instructions|follow these|here's how|process|walkthrough|tutorial|do this|start by|next|then|finally|first|second|third|begin with|let's start|to get started|quick steps|simple steps|easy way|method|approach|technique|tip|trick|secret|pro tip|best way|recommended way|one way|another way|option|alternative|sequence|order|phase|stage)\b/i.test(first300.toLowerCase());
      // Answerability
      if (hasBoldInFirst || hasDefinition) answerability += 30;
      if (hasFAQSchema) answerability += 25;
      if (hasQuestionH2) answerability += 15;
      if (hasSteps) answerability += 20;
      // Structured Data
let hasArticle = false;
let hasFaqHowto = false;
let hasPerson = false;
const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
let structuredData = 0;

// Require at least one valid parse
let hasValidJsonLd = false;

jsonLdScripts.forEach(s => {
  try {
    const data = JSON.parse(s.textContent);
    hasValidJsonLd = true;
    const items = Array.isArray(data) ? data : [data];

    items.forEach(item => {
      if (!item?.['@type']) return;
      const type = item['@type'];

      if (['Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ScholarlyArticle'].includes(type)) {
        hasArticle = true;
      }

      if (['FAQPage', 'HowTo'].includes(type)) {
        hasFaqHowto = true;
      }

      if (type === 'Person') {
        // Prefer when seems connected to article
        if (hasArticle || item.name?.length > 3 || item.givenName || item.familyName) {
          hasPerson = true;
        }
      }
    });
  } catch {}
});

if (hasValidJsonLd) structuredData += 20;
if (hasArticle) structuredData += 35;
if (hasFaqHowto) structuredData += 18;
if (hasPerson) structuredData += 22;
// EEAT Signals
const hasAuthor = !!doc.querySelector(
  'meta[name="author"], meta[property="og:author"], meta[property="article:author"], ' +
  '.author, .byline, .post-author, .entry-author, [rel="author"], ' +
  '[itemprop="author"], [class*="author" i], [class*="byline" i], [class*="posted-by" i], ' +
  '[data-author], a[rel="author"]'
);

const hasDate = !!doc.querySelector(
  'time[datetime], time[pubdate], time[itemprop="datePublished"], time[itemprop="dateModified"], ' +
  'meta[name="date"], meta[property="article:published_time"], meta[property="article:modified_time"], ' +
  'meta[property="og:updated_time"], meta[itemprop="datePublished"], ' +
  '.published, .updated, .post-date, .entry-date, .date, [class*="date" i], [class*="time" i], ' +
  '[itemprop="datePublished"], [itemprop="dateModified"]'
) || Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  .some(s => s.textContent.includes('"datePublished"') || s.textContent.includes('"dateModified"'));

const externalLinks = Array.from(doc.querySelectorAll('a[href^="https"]'))
  .filter(a => !a.href.includes(new URL(url).hostname) && 
                !a.href.includes('facebook.com') && 
                !a.href.includes('twitter.com') && 
                !a.href.includes('instagram.com') && 
                !a.href.includes('youtube.com'));

const hasTrustedLinks = externalLinks.length >= 2;

let eeat = 0;
if (hasAuthor) eeat += 40;
if (hasDate) eeat += 28;           // slight boost for better detection
if (hasTrustedLinks) eeat += 18;   // tightened condition
if (url.startsWith('https:')) eeat += 10;  // softened - HTTPS is now standard
// Scannability
const headings = doc.querySelectorAll('h1,h2,h3,h4').length;
const lists = doc.querySelectorAll('ul,ol').length;

// Better table detection (real <table> + common CSS tables)
const tables = doc.querySelectorAll('table, [role="table"], [style*="display: table"], [class*="table"], .wp-block-table').length;

// Short paragraphs - progressive scoring
const shortParas = Array.from(mainEl.querySelectorAll('p'))
  .filter(p => p.textContent.trim().split(/\s+/).length < 35).length;

let scannability = 0;

// Headings - progressive, capped
if (headings >= 12) scannability += 45;
else if (headings >= 8) scannability += 40;
else if (headings >= 5) scannability += 30;

// Lists - require some substance
if (lists > 3) scannability += 20;
else if (lists > 1) scannability += 12;

// Tables - stronger signal
if (tables > 0) scannability += 18;

// Short paragraphs - scale gently
if (shortParas > 10) scannability += 15;
else if (shortParas > 6) scannability += 10;
else if (shortParas > 3) scannability += 5;
      // Conversational Tone
	  const youCount = (mainText.match(/\b(you|your|yours|yourself|yourselves|ya|y'all|yall)\b/gi) || []).length;
      const iWeCount = (mainText.match(/\b(I|we|our|ours|us|my|mine|myself|ourselves|I'm|we're|we've|I've|our team|the team)\b/gi) || []).length;
      const questions = (mainText.match(/\?/g) || []).length;
      const painPoints = (mainText.match(/\b(struggle|problem|issue|challenge|frustrat|hard|difficult|pain|annoy|confus|overwhelm|fail|mistake|wrong|tired|miss|ignore|skip|outdat|generic|robot|buried|hidden|waste|lose|never ranks|no traffic|invisible|confusing)\b/gi) || []).length;
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
	  const hasInsights = /\b(I tested|we tested|in my experience|we found|case study|based on my|hands-on|personally observed|our research|in practice|real-world|client results|our data shows|from experience|based on testing|experimented|analyzed|surveyed)\b/i.test(mainText);
      const hasDated = /\b(recent|latest|current|new|fresh|up-to-date|just tested|ongoing|as of now|in recent months|today's|modern|present-day)\b/i.test(mainText.toLowerCase());
      const hasInterviews = /\b(interview|spoke with|talked to|surveyed|asked|quoted|said|reports|says|according to|^".*"\s*-|—\s*\w+|-\s*\w+)\b/i.test(mainText);
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
          return { emoji: '⚠️', color: 'orange-500', stroke: 'f97316', textColor: 'text-orange-600', button: 'Show Fixes', bg: 'bg-orange-500 hover:bg-orange-600' };
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
        { emoji: hasValidJsonLd ? '✅' : '❌', text: 'JSON-LD structured data present', passed: hasValidJsonLd },
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
      
      
      
      function getFixes(name) {
        let fixes = '';
        const addFix = (metricText, description) => {
          const test = tests.find(t => t.text === metricText);
          const passed = test ? test.passed : undefined;
          let emoji = '❌';
          let titleColor = 'text-red-600 dark:text-red-400';
          if (passed === true) {
            emoji = '✅';
            titleColor = 'text-green-600 dark:text-green-400';
} else if (metricText.includes('Trusted outbound links') || 
           metricText.includes('shown') || 
           metricText.includes('present') || 
           metricText.includes('mentioned') ||
           metricText.includes('JSON-LD structured data present')) {
  emoji = '⚠️';
  titleColor = 'text-orange-600 dark:text-orange-400';
}
          fixes += `
            <div class="py-3 border-l-4 border-gray-200 dark:border-gray-700 pl-4 -ml-px">
              <div class="flex flex-col items-center gap-1">
                <span class="text-3xl leading-none -mb-1">${emoji}</span>
                <div class="text-center w-full">
                  <p class="font-semibold ${titleColor} text-base leading-tight">${metricText}</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed px-2">${description}</p>
                </div>
              </div>
            </div>
          `;
        };
        if (name === "Answerability") {
          if (!hasBoldInFirst) addFix('Bold/strong formatting in opening', 'Place the main answer in bold text within the first paragraph so AI can easily quote it.');
          if (!hasDefinition) addFix('Clear definition pattern in opening', 'Start with clear phrases like “X means…” or “X is defined as…” to directly satisfy definitional queries.');
          if (!hasFAQSchema) addFix('FAQPage schema detected', 'Add structured data markup that tells search engines this page answers common questions or provides steps.');
          if (!hasQuestionH2) addFix('Question-style H2 headings', 'Use heading tags formatted as questions (e.g., “How do I fix X?”) to match real user searches.');
          if (!hasSteps) addFix('Step-by-step language in opening', 'Include numbered lists with clear actions — AI engines love extractable instructions.');
          if (first300.length <= 600) addFix('Strong opening section (>600 chars)', 'Expand the first section to over 600 characters with valuable content so AI has more to summarize and cite.');
        }
if (name === "Structured Data") {
  if (!hasValidJsonLd) addFix('JSON-LD structured data present', 'Include at least one valid JSON-LD script block with relevant markup.');
  if (!hasArticle) addFix('Article/BlogPosting schema type', 'Mark the page as an Article or BlogPosting to confirm editorial content type.');
  if (!hasFaqHowto) addFix('FAQPage/HowTo schema type', 'Add FAQPage for Q&A content or HowTo for instructional guides.');
  if (!hasPerson) addFix('Person schema for author', 'Connect the content to a Person entity to prove authorship.');
}
        if (name === "EEAT Signals") {
          if (!hasAuthor) addFix('Author byline visible', 'Display the writer’s name, photo, and short bio prominently.');
          if (!hasDate) addFix('Publish/update date shown', 'Clearly show when the article was published and last updated.');
          if (!hasTrustedLinks) addFix('Trusted outbound links', 'Link to reputable sources to build credibility.');
          if (!url.startsWith('https:')) addFix('Secure HTTPS connection', 'Ensure your site uses a secure HTTPS connection.');
        }
        if (name === "Scannability") {
          if (headings <= 5) addFix('Sufficient headings (H1-H4)', 'Break content into logical sections with at least 6 headings.');
          if (lists <= 2) addFix('Bullet/numbered lists used', 'Convert long paragraphs into bullet or numbered lists.');
          if (tables === 0) addFix('Data tables present', 'Include at least one data table for comparisons or stats.');
          if (shortParas <= 5) addFix('Short paragraphs (<35 words)', 'Keep most paragraphs under 4 lines for faster reading.');
          if (headings <= 8) addFix('Excellent heading density', 'Aim for a heading every 300–400 words.');
        }
        if (name === "Conversational Tone") {
          if (youCount <= 5) addFix('Direct "you" address (>5)', 'Address the reader directly with “you” more than 5 times.');
          if (iWeCount <= 3) addFix('Personal "I/we" sharing', 'Include personal insights using “I” or “we” at least 4 times.');
          if (questions <= 2) addFix('Engaging questions asked', 'Add rhetorical questions that mirror what readers are thinking.');
          if (painPoints <= 3) addFix('Reader pain points acknowledged', 'Mention common struggles or frustrations to build empathy.');
        }
        if (name === "Readability") {
          if (flesch <= 60) addFix('Good Flesch score (>60)', 'Use shorter sentences and simpler words to improve reading ease.');
          if (variationScore <= 70) addFix('Natural sentence variation', 'Mix short and longer sentences for natural rhythm.');
          if (passivePatterns.length >= 5) addFix('Low passive voice', 'Prefer active voice over passive constructions.');
          if (complexRatio >= 15) addFix('Low complex words (<15%)', 'Replace complex jargon with simpler alternatives.');
        }
        if (name === "Unique Insights") {
          if (!hasInsights) addFix('First-hand experience markers', 'Include phrases like “I tested” or “in my experience” to show original research.');
          if (!hasDated) addFix('Dated/timely results mentioned', 'Reference recent tests or current findings.');
          if (!hasInterviews) addFix('Interviews/quotes included', 'Add direct quotes from experts or survey respondents.');
          if (words <= 1500) addFix('Deep content (1500+ words)', 'Expand with detailed analysis and original data.');
        }
        if (name === "Anti-AI Safety") {
          if (variationScore <= 70) addFix('High sentence burstiness', 'Deliberately vary sentence length for human-like flow.');
          if (repeatedWords > 2) addFix('Low word repetition', 'Use synonyms instead of repeating the same terms.');
          if (hasPredictable) addFix('No predictable sentence starts', 'Avoid starting multiple sentences the same way.');
        }

        const anchorMap = {
          "Answerability": "answerability",
          "Structured Data": "structured-data",
          "EEAT Signals": "eeat-signals",
          "Scannability": "scannability",
          "Conversational Tone": "conversational-tone",
          "Readability": "readability",
          "Unique Insights": "unique-insights",
          "Anti-AI Safety": "anti-ai-safety"
        };
        const anchorId = anchorMap[name] || "";
        const displayName = name;

        let content = fixes || '<p class="text-green-600 dark:text-green-400 text-center py-6 font-medium">All signals strong — excellent work! ✅</p>';

        return `
          <div class="text-center mb-4">
            <a href="#${anchorId}" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">How ${displayName} is tested? →</a>
          </div>
          ${content}
          <div class="text-center mt-6">
            <a href="#${anchorId}" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">← More details about ${displayName}</a>
          </div>
        `;
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
      
      

      const scores = modules.map(m => m.score);
      
      
      results.innerHTML = `
      
      
<!-- Overall Score Card -->
<div class="flex justify-center my-12 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 max-w-md w-full border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    <p class="text-center text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AI Search Score</p>
    <div class="relative w-56 h-56 mx-auto md:w-64 md:h-64">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourScore / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl md:text-5xl font-black drop-shadow-lg"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            ${yourScore}
          </div>
          <div class="text-base md:text-lg opacity-80 -mt-1"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>
    ${(() => {
      const title = (doc?.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) : title;
      return `<p class="mt-6 md:mt-8 text-base md:text-lg text-gray-600 dark:text-gray-200 text-center px-4 leading-tight">${truncated}</p>`;
    })()}
    ${(() => {
      const gradeText = yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Very Good' : 'Needs Work';
      const gradeEmoji = yourScore >= 80 ? '✅' : yourScore >= 60 ? '⚠️' : '❌';
      const gradeColor = yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
      return `<p class="${gradeColor} text-2xl md:text-3xl font-bold text-center mt-4 md:mt-6">${gradeEmoji} ${gradeText}</p>`;
    })()}
  </div>
</div>

<!-- On-Page Health Radar Chart -->
<div class="max-w-5xl mx-auto my-16 px-4">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
    <h3 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">On-Page Health Radar</h3>
    <div class="hidden md:block w-full">
      <canvas id="health-radar" class="mx-auto w-full max-w-4xl h-[600px]"></canvas>
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 md:hidden">
      Radar chart available on desktop/tablet
    </p>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 hidden md:block">
      Visual overview of your page performance across 7 key SEO Intent factors
    </p>
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
      <div class="score-card bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 border-${grade.color} p-2 flex flex-col">
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
        <p class="text-sm opacity-70 mt-2 text-center text-gray-800 dark:text-gray-200 px-4">${m.desc}</p>
        <div class="mt-6">
          <button class="more-details-toggle w-full h-12 px-6 rounded-full text-white font-medium text-sm bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition">
            More Details
          </button>
        </div>
        <div class="full-details hidden mt-4 overflow-hidden transition-all duration-300 ease-in-out">
          <div class="p-4 space-y-6 bg-blue-50 dark:bg-blue-900/20 rounded-b-2xl">
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
        </div>
        <div class="mt-6 space-y-2 text-left text-sm">
          ${moduleTests.map(t => {
            let textColor = t.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            let emojiOverride = t.emoji;
            if (!t.passed && (t.text.includes('mentioned') || t.text.includes('present') || t.text.includes('shown') || t.text.includes('Trusted outbound links'))) {
              textColor = 'text-orange-600 dark:text-orange-400';
              emojiOverride = '⚠️';
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
        <div class="fixes-panel hidden mt-4 overflow-hidden transition-all duration-300 ease-in-out">
          <div class="p-2 space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            ${allClear ?
              `<p class="text-green-600 dark:text-green-400 text-center py-6 font-medium">All signals strong — excellent work! ✅</p>` :
              `<div class="space-y-4">${getFixes(m.name)}</div>`
            }
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
  ${prioritisedFixes.map(fix => `
    <div class="mx-4 p-8 bg-gradient-to-r ${fix.gradient} border-l-8 rounded-r-2xl">
      <div class="flex gap-6">
        <div class="text-5xl">${fix.emoji}</div>
        <div class="flex-1">
          <h4 class="text-2xl font-bold ${fix.color}">${fix.title}</h4>
          <div class="mt-4"><p class="text-blue-500 font-bold">What:</p><p class="text-gray-800 dark:text-gray-200 mt-1">${fix.what}</p></div>
          <div class="mt-2"><p class="text-green-500 font-bold">How:</p><p class="text-gray-800 dark:text-gray-200 mt-1">${fix.how}</p></div>
          <div class="mt-2"><p class="text-orange-500 font-bold">Why:</p><p class="text-gray-800 dark:text-gray-200 mt-1">${fix.why}</p></div>
        </div>
      </div>
    </div>
  `).join('')}
` : ''}
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

      // === RADAR CHART INITIALIZATION ===
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;

        try {
          const ctx = canvas.getContext('2d');
          const labelColor = '#9ca3af'; // gray-400 — perfect day/night
          const gridColor = 'rgba(156, 163, 175, 0.3)';
          const borderColor = '#fb923c';
          const fillColor = 'rgba(251, 146, 60, 0.15)';

          window.myChart = new Chart(ctx, {
            type: 'radar',
            data: {
              labels: modules.map(m => m.name),
              datasets: [{
                label: 'Health Score',
                data: scores,
                backgroundColor: fillColor,
                borderColor: borderColor,
                borderWidth: 4,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointBackgroundColor: scores.map(s => s >= 80 ? '#22c55e' : s >= 60 ? '#fb923c' : '#ef4444'),
                pointBorderColor: '#fff',
                pointBorderWidth: 3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,
                  ticks: { stepSize: 20, color: labelColor },
                  grid: { color: gridColor },
                  angleLines: { color: gridColor },
                  pointLabels: { color: labelColor, font: { size: 15, weight: '600' } }
                }
              },
              plugins: { legend: { display: false } }
            }
          });
        } catch (e) {
          console.error('Radar chart failed', e);
        }
      }, 150);
      
      
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

      document.addEventListener('click', (e) => {
        const card = e.target.closest('.score-card');
        if (card) {
          const detailsPanel = card.querySelector('.full-details');
          const fixesPanel = card.querySelector('.fixes-panel');
          if (e.target.matches('.more-details-toggle')) {
            document.querySelectorAll('.full-details').forEach(p => {
              if (p !== detailsPanel) p.classList.add('hidden');
            });
            if (fixesPanel) fixesPanel.classList.add('hidden');
            if (detailsPanel) detailsPanel.classList.toggle('hidden');
          }
          if (e.target.matches('.fixes-toggle')) {
            document.querySelectorAll('.fixes-panel').forEach(p => {
              if (p !== fixesPanel) p.classList.add('hidden');
            });
            if (detailsPanel) detailsPanel.classList.add('hidden');
            if (fixesPanel) fixesPanel.classList.toggle('hidden');
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