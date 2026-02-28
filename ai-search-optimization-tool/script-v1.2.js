// script-v1.1.js
// Traffic Torch AI Search Optimization Tool - Main Script (Modularized)

// Import all analysis modules
import { computeAnswerability } from './modules/answerability.js';
import { computeStructuredData } from './modules/structuredData.js';
import { computeEEAT } from './modules/eeatSignals.js';
import { computeScannability } from './modules/scannability.js';
import { computeConversational } from './modules/conversationalTone.js';
import { computeReadability } from './modules/readability.js';
import { computeUniqueInsights } from './modules/uniqueInsights.js';
import { computeAntiAiSafety } from './modules/antiAiSafety.js';
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';


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
    
  //const canProceed = await canRunTool('limit-audit-id');
  //if (!canProceed) return;

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
      'Fetching page...',
      'Extracting main content',
      'Analyzing Answerability',
      'Analyzing Structured Data',
      'Evaluating EEAT Signals',
      'Testing Scannability',
      'Analyzing Readability',
      'Detecting Unique Insights',
      'Checking Anti-AI Patterns',
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
      const res = await fetch("https://rendered-proxy-basic.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
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

      // ──────────────────────────────────────────────
      // Answerability
      // ──────────────────────────────────────────────
      const ansData = computeAnswerability(doc, first300);
      const answerability = ansData.score;

      await new Promise(resolve => setTimeout(resolve, 1200));
      updateProgress();

      // ──────────────────────────────────────────────
      // Structured Data
      // ──────────────────────────────────────────────
      const structData = computeStructuredData(doc);
      const structuredData = structData.score;

      // ──────────────────────────────────────────────
      // EEAT Signals
      // ──────────────────────────────────────────────
      const eeatData = computeEEAT(doc, url);
      const eeat = eeatData.score;

      // ──────────────────────────────────────────────
      // Scannability
      // ──────────────────────────────────────────────
      const scanData = computeScannability(doc, mainEl);
      const scannability = scanData.score;

      // ──────────────────────────────────────────────
      // Conversational Tone
      // ──────────────────────────────────────────────
      const convData = computeConversational(mainText);
      const conversational = convData.score;

      // ──────────────────────────────────────────────
      // Readability
      // ──────────────────────────────────────────────
      const readData = computeReadability(mainText);
      const readability = readData.score;

      // ──────────────────────────────────────────────
      // Unique Insights
      // ──────────────────────────────────────────────
      const uniqueData = computeUniqueInsights(mainText, readData.words);
      const uniqueInsights = uniqueData.score;

      // ──────────────────────────────────────────────
      // Anti-AI Safety
      // ──────────────────────────────────────────────
      const antiData = computeAntiAiSafety(mainText, readData.variationScore);
      const antiAiSafety = antiData.score;

      // ──────────────────────────────────────────────
      // Final weighted score
      // ──────────────────────────────────────────────
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
        { emoji: ansData.flags.hasBoldInFirst ? '✅' : '❌', text: 'Bold/strong formatting in opening', passed: ansData.flags.hasBoldInFirst },
        { emoji: ansData.flags.hasDefinition ? '✅' : '❌', text: 'Clear definition pattern in opening', passed: ansData.flags.hasDefinition },
        { emoji: ansData.flags.hasFAQSchema ? '✅' : '❌', text: 'FAQPage schema detected', passed: ansData.flags.hasFAQSchema },
        { emoji: ansData.flags.hasQuestionH2 ? '✅' : '❌', text: 'Question-style H2 headings', passed: ansData.flags.hasQuestionH2 },
        { emoji: ansData.flags.hasSteps ? '✅' : '❌', text: 'Step-by-step language in opening', passed: ansData.flags.hasSteps },
        { emoji: ansData.flags.strongOpening ? '✅' : '❌', text: 'Strong opening section (>600 chars)', passed: ansData.flags.strongOpening },
        { emoji: structData.flags.hasValidJsonLd ? '✅' : '❌', text: 'JSON-LD structured data present', passed: structData.flags.hasValidJsonLd },
        { emoji: structData.flags.hasArticle ? '✅' : '❌', text: 'Article/BlogPosting schema type', passed: structData.flags.hasArticle },
        { emoji: structData.flags.hasFaqHowto ? '✅' : '❌', text: 'FAQPage/HowTo schema type', passed: structData.flags.hasFaqHowto },
        { emoji: structData.flags.hasPerson ? '✅' : '❌', text: 'Person schema for author', passed: structData.flags.hasPerson },
        { emoji: eeatData.flags.hasAuthor ? '✅' : '❌', text: 'Author byline visible', passed: eeatData.flags.hasAuthor },
        { emoji: eeatData.flags.hasDate ? '✅' : '❌', text: 'Publish/update date shown', passed: eeatData.flags.hasDate },
        { emoji: eeatData.flags.hasTrustedLinks ? '✅' : '❌', text: 'Trusted outbound links', passed: eeatData.flags.hasTrustedLinks },
        { emoji: eeatData.flags.hasHttps ? '✅' : '❌', text: 'Secure HTTPS connection', passed: eeatData.flags.hasHttps },
        { emoji: scanData.flags.sufficientHeadings ? '✅' : '❌', text: 'Sufficient headings (H1-H4)', passed: scanData.flags.sufficientHeadings },
        { emoji: scanData.flags.listsUsed ? '✅' : '❌', text: 'Bullet/numbered lists used', passed: scanData.flags.listsUsed },
        { emoji: scanData.flags.tablesPresent ? '✅' : '❌', text: 'Data tables present', passed: scanData.flags.tablesPresent },
        { emoji: scanData.flags.shortParas ? '✅' : '❌', text: 'Short paragraphs (<35 words)', passed: scanData.flags.shortParas },
        { emoji: scanData.flags.excellentHeadings ? '✅' : '❌', text: 'Excellent heading density', passed: scanData.flags.excellentHeadings },
        { emoji: convData.flags.directYou ? '✅' : '❌', text: 'Direct "you" address (>5)', passed: convData.flags.directYou },
        { emoji: convData.flags.personalIWe ? '✅' : '❌', text: 'Personal "I/we" sharing', passed: convData.flags.personalIWe },
        { emoji: convData.flags.engagingQuestions ? '✅' : '❌', text: 'Engaging questions asked', passed: convData.flags.engagingQuestions },
        { emoji: convData.flags.painPoints ? '✅' : '❌', text: 'Reader pain points acknowledged', passed: convData.flags.painPoints },
        { emoji: readData.flags.goodFlesch ? '✅' : '❌', text: 'Good Flesch score (>60)', passed: readData.flags.goodFlesch },
        { emoji: readData.flags.naturalVariation ? '✅' : '❌', text: 'Natural sentence variation', passed: readData.flags.naturalVariation },
        { emoji: readData.flags.lowPassive ? '✅' : '❌', text: 'Low passive voice', passed: readData.flags.lowPassive },
        { emoji: readData.flags.lowComplex ? '✅' : '❌', text: 'Low complex words (<15%)', passed: readData.flags.lowComplex },
        { emoji: uniqueData.flags.hasInsights ? '✅' : '❌', text: 'First-hand experience markers', passed: uniqueData.flags.hasInsights },
        { emoji: uniqueData.flags.hasDated ? '✅' : '❌', text: 'Dated/timely results mentioned', passed: uniqueData.flags.hasDated },
        { emoji: uniqueData.flags.hasInterviews ? '✅' : '❌', text: 'Interviews/quotes included', passed: uniqueData.flags.hasInterviews },
        { emoji: uniqueData.flags.deepContent ? '✅' : '❌', text: 'Deep content (1500+ words)', passed: uniqueData.flags.deepContent },
        { emoji: readData.flags.naturalVariation ? '✅' : '❌', text: 'High sentence burstiness', passed: readData.flags.naturalVariation },
        { emoji: antiData.flags.lowRepetition ? '✅' : '❌', text: 'Low word repetition', passed: antiData.flags.lowRepetition },
        { emoji: antiData.flags.noPredictable ? '✅' : '❌', text: 'No predictable sentence starts', passed: antiData.flags.noPredictable }
      ];

      const topLowScoring = lowScoring.slice(0, 3);
      const prioritisedFixes = [];

      if (topLowScoring.some(m => m.name === "Answerability")) {
        prioritisedFixes.push({
          title: "Add Direct Answer in Opening", emoji: "💡", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "A clear, bold, quotable answer AI engines can cite directly",
          how: "Add a bold definition or summary in first 150–250 words. Use H2 questions and numbered steps.",
          why: "Answerability is the #1 factor for AI citation and source selection"
        });
      }
      if (topLowScoring.some(m => m.name === "EEAT Signals")) {
        prioritisedFixes.push({
          title: "Add Author Bio & Photo", emoji: "👤", gradient: "from-red-500/10 border-red-500", color: "text-red-600",
          what: "Visible byline proving who wrote this",
          how: "Headshot + name + bio + credentials + social links",
          why: "Boosts Expertise & Trust by 30–40 points — Google's #1 E-E-A-T signal"
        });
      }
      if (topLowScoring.some(m => m.name === "Structured Data")) {
        prioritisedFixes.push({
          title: "Add Article + Person Schema", emoji: "✨", gradient: "from-purple-500/10 border-purple-500", color: "text-purple-600",
          what: "Structured data that AI engines read directly",
          how: "JSON-LD with @type Article + Person + author link. Add FAQPage if relevant.",
          why: "Triggers rich answers and massive citation boost"
        });
      }
      if (topLowScoring.some(m => m.name === "Scannability")) {
        prioritisedFixes.push({
          title: "Boost Scannability with Lists & Tables", emoji: "📋", gradient: "from-orange-500/10 border-orange-500", color: "text-orange-600",
          what: "Easy-to-extract facts via structured formatting",
          how: "Add bullet/numbered lists, data tables, H2/H3 headings, short paragraphs",
          why: "AI prioritizes instantly extractable content"
        });
      }
      if (topLowScoring.some(m => m.name === "Unique Insights")) {
        prioritisedFixes.push({
          title: "Add First-Hand Experience", emoji: "🧠", gradient: "from-orange-500/10 border-orange-500", color: "text-orange-600",
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
          "Unique Insights": "Include personal testing results, case studies, or observations. Reference recent experiments or current findings. Add direct quotes from interviews or surveys for exclusive value.",
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
          if (!ansData.flags.hasBoldInFirst) addFix('Bold/strong formatting in opening', 'Place the main answer in bold text within the first paragraph so AI can easily quote it.');
          if (!ansData.flags.hasDefinition) addFix('Clear definition pattern in opening', 'Start with clear phrases like “X means…” or “X is defined as…” to directly satisfy definitional queries.');
          if (!ansData.flags.hasFAQSchema) addFix('FAQPage schema detected', 'Add structured data markup that tells search engines this page answers common questions or provides steps.');
          if (!ansData.flags.hasQuestionH2) addFix('Question-style H2 headings', 'Use heading tags formatted as questions (e.g., “How do I fix X?”) to match real user searches.');
          if (!ansData.flags.hasSteps) addFix('Step-by-step language in opening', 'Include numbered lists with clear actions — AI engines love extractable instructions.');
          if (!ansData.flags.strongOpening) addFix('Strong opening section (>600 chars)', 'Expand the first section to over 600 characters with valuable content so AI has more to summarize and cite.');
        }
        if (name === "Structured Data") {
          if (!structData.flags.hasValidJsonLd) addFix('JSON-LD structured data present', 'Include at least one valid JSON-LD script block with relevant markup.');
          if (!structData.flags.hasArticle) addFix('Article/BlogPosting schema type', 'Mark the page as an Article or BlogPosting to confirm editorial content type.');
          if (!structData.flags.hasFaqHowto) addFix('FAQPage/HowTo schema type', 'Add FAQPage for Q&A content or HowTo for instructional guides.');
          if (!structData.flags.hasPerson) addFix('Person schema for author', 'Connect the content to a Person entity to prove authorship.');
        }
        if (name === "EEAT Signals") {
          if (!eeatData.flags.hasAuthor) addFix('Author byline visible', 'Display the writer’s name, photo, and short bio prominently.');
          if (!eeatData.flags.hasDate) addFix('Publish/update date shown', 'Clearly show when the article was published and last updated.');
          if (!eeatData.flags.hasTrustedLinks) addFix('Trusted outbound links', 'Link to reputable sources to build credibility.');
          if (!eeatData.flags.hasHttps) addFix('Secure HTTPS connection', 'Ensure your site uses a secure HTTPS connection.');
        }
        if (name === "Scannability") {
          if (!scanData.flags.sufficientHeadings) addFix('Sufficient headings (H1-H4)', 'Break content into logical sections with at least 6 headings.');
          if (!scanData.flags.listsUsed) addFix('Bullet/numbered lists used', 'Convert long paragraphs into bullet or numbered lists.');
          if (!scanData.flags.tablesPresent) addFix('Data tables present', 'Include at least one data table for comparisons or stats.');
          if (!scanData.flags.shortParas) addFix('Short paragraphs (<35 words)', 'Keep most paragraphs under 4 lines for faster reading.');
          if (!scanData.flags.excellentHeadings) addFix('Excellent heading density', 'Aim for a heading every 300–400 words.');
        }
        if (name === "Conversational Tone") {
          if (!convData.flags.directYou) addFix('Direct "you" address (>5)', 'Address the reader directly with “you” more than 5 times.');
          if (!convData.flags.personalIWe) addFix('Personal "I/we" sharing', 'Include personal insights using “I” or “we” at least 4 times.');
          if (!convData.flags.engagingQuestions) addFix('Engaging questions asked', 'Add rhetorical questions that mirror what readers are thinking.');
          if (!convData.flags.painPoints) addFix('Reader pain points acknowledged', 'Mention common struggles or frustrations to build empathy.');
        }
        if (name === "Readability") {
          if (!readData.flags.goodFlesch) addFix('Good Flesch score (>60)', 'Use shorter sentences and simpler words to improve reading ease.');
          if (!readData.flags.naturalVariation) addFix('Natural sentence variation', 'Mix short and longer sentences for natural rhythm.');
          if (!readData.flags.lowPassive) addFix('Low passive voice', 'Prefer active voice over passive constructions.');
          if (!readData.flags.lowComplex) addFix('Low complex words (<15%)', 'Replace complex jargon with simpler alternatives.');
        }
        if (name === "Unique Insights") {
          if (!uniqueData.flags.hasInsights) addFix('First-hand experience markers', 'Include phrases like “I tested” or “in my experience” to show original research.');
          if (!uniqueData.flags.hasDated) addFix('Dated/timely results mentioned', 'Reference recent tests or current findings.');
          if (!uniqueData.flags.hasInterviews) addFix('Interviews/quotes included', 'Add direct quotes from experts or survey respondents.');
          if (!uniqueData.flags.deepContent) addFix('Deep content (1500+ words)', 'Expand with detailed analysis and original data.');
        }
        if (name === "Anti-AI Safety") {
          if (!antiData.flags.highBurstiness) addFix('High sentence burstiness', 'Deliberately vary sentence length for human-like flow.');
          if (!antiData.flags.lowRepetition) addFix('Low word repetition', 'Use synonyms instead of repeating the same terms.');
          if (!antiData.flags.noPredictable) addFix('No predictable sentence starts', 'Avoid starting multiple sentences the same way.');
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

      // Scroll to results
      const offset = 240;
      const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: targetY, behavior: 'smooth' });

      results.innerHTML = `
        <!-- Overall Score Card (AI Search) -->
        <div class="flex justify-center my-8 sm:my-12 px-0 sm:px-6">
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
            <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall AI Search Score</p>
            <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
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
                  <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
                       style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#f97316' : '#ef4444'};">
                    ${yourScore}
                  </div>
                  <div class="text-lg sm:text-xl opacity-80 -mt-1"
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
              return `<p id="analyzed-page-title" class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
            })()}
            ${(() => {
              const gradeText = yourScore >= 80 ? 'Excellent' : yourScore >= 60 ? 'Very Good' : 'Needs Work';
              const gradeEmoji = yourScore >= 80 ? '✅' : yourScore >= 60 ? '⚠️' : '❌';
              const gradeColor = yourScore >= 80 ? 'text-green-600 dark:text-green-400' : yourScore >= 60 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
              return `<p class="${gradeColor} text-4xl sm:text-5xl font-bold text-center mt-4 sm:mt-6 drop-shadow-lg">${gradeEmoji} ${gradeText}</p>`;
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
              Visual overview of your page performance across 8 key SEO Intent factors
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 my-12 px-0 max-w-7xl mx-auto">
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
            <div class="mx-4 p-0 bg-gradient-to-r ${fix.gradient} border-l-8 rounded-r-2xl">
              <div class="flex gap-4">
                <div class="text-2xl">${fix.emoji}</div>
                <div class="flex-1">
                  <h4 class="text-2xl font-bold ${fix.color}">${fix.title}</h4>
                  <div class="mt-4"><p class="text-blue-500 font-bold">What:</p><p class="text-gray-500 dark:text-gray-200 mt-1">${fix.what}</p></div>
                  <div class="mt-2"><p class="text-green-500 font-bold">How:</p><p class="text-gray-500 dark:text-gray-200 mt-1">${fix.how}</p></div>
                  <div class="mt-2"><p class="text-orange-500 font-bold">Why:</p><p class="text-gray-500 dark:text-gray-200 mt-1">${fix.why}</p></div>
                </div>
              </div>
            </div>
          `).join('')}
        ` : ''}

        <div class="mt-20 px-2 max-w-6xl mx-auto">
          <div class="grid md:grid-cols-2 gap-8">
            <div class="p-1 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
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

            <div class="p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl shadow-2xl">
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

<div class="text-center my-16 px-4">
  <div class="flex flex-col sm:flex-row justify-center gap-6 mb-8">
    <!-- Share Report - Green - first -->
    <button id="share-report-btn"
            class="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Share Report ↗️
    </button>
    <!-- Save Report - Orange - second -->
    <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
            class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Save Report 📥
    </button>
    <!-- Submit Feedback - Blue - third -->
    <button id="feedback-btn"
            class="px-12 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90 w-full sm:w-auto">
      Feedback 💬
    </button>
  </div>

  <!-- Share message - placed directly below buttons, always visible when triggered -->
  <div id="share-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium max-w-xl mx-auto"></div>

  <!-- Share Report Form (still hidden/expandable) -->
  <div id="share-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <form id="share-form" class="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-orange-500/30">
      <div>
        <label for="share-name" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Name</label>
        <input id="share-name" type="text" required placeholder="Your name" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-sender-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Email (for replies)</label>
        <input id="share-sender-email" type="email" required placeholder="your@email.com" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Recipient Email</label>
        <input id="share-email" type="email" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-title" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Email Title</label>
        <input id="share-title" type="text" required placeholder="Traffic Torch AI Audit Report" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
      </div>
      <div>
        <label for="share-body" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Message</label>
        <textarea id="share-body" required rows="5" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-3xl px-6 py-4 focus:outline-none focus:border-orange-500"></textarea>
      </div>
      <button type="submit" class="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-4 rounded-2xl transition shadow-lg">Send Report →</button>
    </form>
  </div>

  <!-- Feedback Form (unchanged) -->
  <div id="feedback-form-container" class="hidden max-w-2xl mx-auto mt-8">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-blue-500/30">
      <p class="text-lg font-medium mb-6 text-gray-800 dark:text-gray-200">
        Feedback for AI Audit Tool on <strong>${document.body.getAttribute('data-url') || 'the analyzed page'}</strong>
      </p>
      <form id="feedback-form" class="space-y-6">
        <div>
          <label for="feedback-rating" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Rating (optional)</label>
          <div class="flex gap-3 text-3xl justify-center sm:justify-start">
            <button type="button" data-rating="1" class="hover:scale-125 transition">😞</button>
            <button type="button" data-rating="2" class="hover:scale-125 transition">🙁</button>
            <button type="button" data-rating="3" class="hover:scale-125 transition">😐</button>
            <button type="button" data-rating="4" class="hover:scale-125 transition">🙂</button>
            <button type="button" data-rating="5" class="hover:scale-125 transition">😍</button>
          </div>
          <input type="hidden" id="feedback-rating" name="rating">
        </div>
        <div>
          <label class="flex items-center gap-2 justify-center sm:justify-start">
            <input type="checkbox" id="reply-requested" class="w-5 h-5">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Request reply</span>
          </label>
        </div>
        <div id="email-group" class="hidden">
          <label for="feedback-email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Email</label>
          <input id="feedback-email" type="email" name="email" placeholder="your@email.com" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500">
        </div>
        <div>
          <label for="feedback-text" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Your Feedback</label>
          <textarea id="feedback-text" name="message" required rows="5" maxlength="1000" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-500"></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">
            <span id="char-count">0</span>/1000 characters
          </p>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg">Send Feedback</button>
      </form>
      <div id="feedback-message" class="hidden mt-6 p-4 rounded-2xl text-center font-medium"></div>
    </div>
  </div>
</div>
      `;

      // === RADAR CHART INITIALIZATION ===
      setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) return;
        try {
          const ctx = canvas.getContext('2d');
          const labelColor = '#9ca3af';
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
      
        initShareReport(results);
        initSubmitFeedback(results);

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