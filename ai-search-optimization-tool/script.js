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
        const map = {
          "Answerability": `
            <p>• <strong>Bold key answers in opening:</strong> Place the main answer in bold text within the first paragraph so AI can easily quote it.</p>
            <p>• <strong>Add definition phrasing:</strong> Start with clear phrases like “X means…” or “X is defined as…” to directly satisfy definitional queries.</p>
            <p>• <strong>Use FAQ/HowTo schema:</strong> Add structured data markup that tells search engines this page answers common questions or provides steps.</p>
            <p>• <strong>Question H2s:</strong> Use heading tags formatted as questions (e.g., “How do I fix X?”) to match real user searches.</p>
            <p>• <strong>Step-by-step guides:</strong> Include numbered lists with clear actions — AI engines love extractable instructions.</p>
          `,
          "Structured Data": `
            <p>• <strong>Add JSON-LD block:</strong> Include a script tag with structured data that search engines can read directly.</p>
            <p>• <strong>Include Article type:</strong> Mark the page as an Article or BlogPosting so AI knows it's authoritative content.</p>
            <p>• <strong>Add FAQPage/HowTo:</strong> If the page answers questions or teaches a process, add the matching schema type.</p>
            <p>• <strong>Link Person schema:</strong> Connect the content to an author profile using Person markup for better trust signals.</p>
          `,
          "EEAT Signals": `
            <p>• <strong>Visible author byline:</strong> Show the writer's name, photo, and short bio near the top or bottom of the article.</p>
            <p>• <strong>Publish date:</strong> Clearly display when the article was published and last updated.</p>
            <p>• <strong>Trusted outbound links:</strong> Link to reputable sources (universities, government sites, known authorities) to build credibility.</p>
            <p>• <strong>Use HTTPS:</strong> Ensure your site uses a secure connection — basic but essential for trust.</p>
          `,
          "Scannability": `
            <p>• <strong>More headings:</strong> Break content into logical sections with H2 and H3 tags every 300–400 words.</p>
            <p>• <strong>Bullet lists:</strong> Turn long paragraphs into scannable bullet or numbered lists.</p>
            <p>• <strong>Tables for data:</strong> Present comparisons, specs, or stats in clean tables instead of paragraphs.</p>
            <p>• <strong>Short paragraphs:</strong> Keep most paragraphs under 4 lines for faster reading and easier AI extraction.</p>
            <p>• <strong>High heading density:</strong> Aim for a heading every few hundred words to guide both users and AI.</p>
          `,
          "Conversational Tone": `
            <p>• <strong>Use 'you' frequently:</strong> Address the reader directly (“you can”, “your results”) to create connection.</p>
            <p>• <strong>Share personal 'I/we':</strong> Include phrases like “I tested this” or “we found that” to sound human.</p>
            <p>• <strong>Ask questions:</strong> Pose rhetorical questions that mirror what readers are thinking.</p>
            <p>• <strong>Mention reader struggles:</strong> Acknowledge pain points (“tired of slow results?”, “frustrated with…”) to build empathy.</p>
          `,
          "Readability": `
            <p>• <strong>Aim Flesch >60:</strong> Target a reading ease score above 60 by using shorter sentences and common words.</p>
            <p>• <strong>Vary sentence length:</strong> Mix short punchy sentences with medium ones for natural rhythm.</p>
            <p>• <strong>Reduce passive voice:</strong> Prefer active voice (“We tested X” instead of “X was tested by us”).</p>
            <p>• <strong>Use simpler words:</strong> Replace complex jargon with everyday alternatives where possible.</p>
          `,
          "Unique Insights": `
            <p>• <strong>Add personal markers:</strong> Include phrases like “In my experience”, “I tested”, or “we observed” to show original research.</p>
            <p>• <strong>Mention timely results:</strong> Reference recent tests or current findings to prove freshness.</p>
            <p>• <strong>Include quotes/interviews:</strong> Add direct quotes from experts or survey respondents for exclusive value.</p>
            <p>• <strong>Write in-depth content:</strong> Go beyond surface-level advice with detailed analysis and original data.</p>
          `,
          "Anti-AI Safety": `
            <p>• <strong>High variation in sentences:</strong> Deliberately mix very short and longer sentences for human-like flow.</p>
            <p>• <strong>Avoid repeating words:</strong> Use synonyms and varied phrasing instead of repeating the same terms.</p>
            <p>• <strong>Vary sentence starts:</strong> Don’t begin every sentence with the same structure or subject.</p>
          `
        };
        return map[name] || "<p>Review the checks above and apply relevant best practices to improve this module.</p>";
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
            <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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