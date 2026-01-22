import { renderPluginSolutions } from './plugin-solutions.js';

document.addEventListener('DOMContentLoaded', () => {
  // === STEP 1: CENTRAL CONFIG OBJECT + PARSING VARIABLES ===
  const defaultConfig = {
    parsing: {
      authorBylineSelectors: [
        'meta[name="author" i]',
        'meta[property="article:author"]',
        '[rel="author"]',
        '.author',
        '.byline',
        '.written-by',
        '[class*="author" i]',
        '[itemprop="author"]',
        '[class*="byline" i]',
        '.post-author',
        '.entry-author',
        '.writer-name',
        '.blog-author',
        '.h-card .p-name',
        '.author-name'
      ],
      authorBioSelectors: [
        '.author-bio',
        '.bio',
        '[class*="bio" i]',
        '.about-author',
        '.author-description',
        '.author-box',
        '.author-info',
        '.author-details',
        '.writer-bio',
        '.contributor-bio',
        '.author-profile',
        '.about-the-author'
      ],
      contactLinkSelectors: [
        'a[href*="/contact" i]',
        'a[href*="mailto:" i]',
        'a[href*="tel:" i]'
      ],
      policyLinkSelectors: [
        'a[href*="/privacy" i]',
        'a[href*="/terms" i]',
        'a[href*="/legal" i]'
      ],
      updateDateSelectors: [
        'time[datetime]',
        '.updated',
        '.last-modified',
        '.date-updated',
        '.published',
        '.post-date',
        '.entry-date',
        'meta[name="date" i]',
        'meta[name="last-modified" i]',
        'meta[property="article:modified_time"]',
        'meta[property="og:updated_time"]',
        'meta[name="revised"]',
        '[class*="update" i]',
        '[class*="date" i]',
        '.modified-date',
        '.publish-date'
      ]
    }
  };
  let config = { ...defaultConfig };
  const urlParams = new URLSearchParams(window.location.search);
  const configParam = urlParams.get('config');
  if (configParam) {
    try {
      const override = JSON.parse(decodeURIComponent(configParam));
      config = deepMerge(config, override);
    } catch (e) {
      console.warn('Invalid config URL parameter');
    }
  }
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  document.querySelectorAll('.number').forEach(n => n.style.opacity = '0');
  const form = document.getElementById('audit-form');
  const results = document.getElementById('results');
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  function cleanUrl(u) {
    const trimmed = u.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const parts = trimmed.split('/', 1);
    const host = parts[0];
    const path = trimmed.slice(host.length);
    return 'https://' + host + path;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputValue = document.getElementById('url-input').value;
    const url = cleanUrl(inputValue);
    console.log('Input:', inputValue);
    console.log('Cleaned URL sent to proxy:', url);
    if (!url) return;

    results.innerHTML = `
      <div id="analysis-progress" class="flex flex-col items-center justify-center py-2 mt-2">
        <div class="relative w-20 h-20">
          <svg class="animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8" stroke-opacity="0.3"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fb923c" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="100" class="origin-center -rotate-90"/>
          </svg>
        </div>
        <p id="progress-text" class="mt-4 text-xl font-medium text-orange-500"></p>
      </div>
    `;
    results.classList.remove('hidden');
    const progressText = document.getElementById('progress-text');        

    try {
      progressText.textContent = "Fetching page...";
      const res = await fetch("https://rendered-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error('Page not reachable – check URL');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      function getVisibleText(root) {
        let text = '';
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'head', 'iframe', 'object', 'embed'].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (parent.hasAttribute('hidden') || parent.getAttribute('aria-hidden') === 'true') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        while (walker.nextNode()) {
          text += walker.currentNode.textContent + ' ';
        }
        return text.trim();
      }

      const text = getVisibleText(doc.body) || '';
      const cleanedText = text.replace(/\s+/g, ' ').trim();
      const words = cleanedText ? cleanedText.split(' ').filter(w => w.length > 0).length : 0;
      const sentences = cleanedText ? (cleanedText.match(/[.!?]+/g) || []).length || 1 : 1;
      const syllables = cleanedText ? cleanedText.split(' ').reduce((acc, word) => {
        const vowelGroups = (word.toLowerCase().match(/[aeiouy]+/g) || []).length;
        return acc + Math.max(vowelGroups, 1);
      }, 0) : 0;
      const readability = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));

      progressText.textContent = "Analyzing E-E-A-T Signals...";
      await sleep(2000);

      // === EXPERIENCE ===
      const firstPersonCount = (cleanedText.match(/\b(I|we|my|our|I've|we've|me|us|myself|ourselves)\b/gi) || []).length;
      const anecdotePhrases = (cleanedText.match(/\b(in my experience|I tested|we found that|from my trials|I tried|we tried|my results|our case study|in practice|hands-on|real-world|based on my|after testing|client case|personal review)\b/gi) || []).length;
      const timelineMentions = (cleanedText.match(/\b(last year|in 20\d{2}|this year|over the past \d+|since \d{4}|in \d{4}|during \d{4}|recently|within the last|for \d+ years?|after \d+ months?|as of \d{4}|updated (on|in) \d{4}|published (on|in) \d{4}|20\d{2}|202\d)\b.*\b(I|we|my|our)\b/gi) || []).length;
      const personalMedia = !!doc.querySelector('img[alt*="my" i], img[alt*="our" i], video caption, figure figcaption');
      const experienceMetrics = {
        firstPerson: firstPersonCount > 15 ? 100 : firstPersonCount > 5 ? 60 : 20,
        anecdotes: anecdotePhrases > 2 ? 100 : anecdotePhrases > 0 ? 60 : 20,
        timelines: timelineMentions > 1 ? 100 : timelineMentions > 0 ? 70 : 20,
        personalMedia: personalMedia ? 100 : 20
      };
      const experienceScore = Math.round(Object.values(experienceMetrics).reduce((a, b) => a + b) / 4);
      const failedExperience = [];
      if (experienceMetrics.firstPerson < 80) failedExperience.push("Add more first-person language (“I/we/my/our”) throughout the content");
      if (experienceMetrics.anecdotes < 80) failedExperience.push("Include personal anecdotes or real-world examples");
      if (experienceMetrics.timelines < 80) failedExperience.push("Mention specific timelines or dates from your experience");
      if (experienceMetrics.personalMedia < 80) failedExperience.push("Add original photos/videos with personal captions");

      // === EXPERTISE ===
      const hasAuthorByline = !!doc.querySelector(config.parsing.authorBylineSelectors.join(', '));
      const hasAuthorBio = !!doc.querySelector(config.parsing.authorBioSelectors.join(', '));
	  const credentialKeywords = (cleanedText.match(/\b(PhD|MD|doctor|Dr\.?|certified|licensed|years? of experience|expert in|specialist|award-winning|published in|fellow|board-certified|certificate|diploma|qualification|accredited|professional membership|industry leader|renowned|distinguished|master'?s degree|bachelor'?s degree|MBA|CPA|CFA|PMP|JD|LLB|engineer|architect|scientist|professor|consultant|coach|trainer|instructor|15\+ years?|10\+ years?|veteran|authority|thought leader)\b/gi) || []).length;
      const hasCitations = !!doc.querySelector('cite, .references, .sources, a[href*="doi.org"], a[href*="pubmed"], a[href*="researchgate"], footer a[href*="/references"]');
      const expertiseMetrics = {
        byline: hasAuthorByline ? 100 : 20,
        bio: hasAuthorBio ? 100 : 20,
        credentials: credentialKeywords > 2 ? 100 : credentialKeywords > 0 ? 60 : 20,
        citations: hasCitations ? 100 : 20
      };
      const expertiseScore = Math.round(Object.values(expertiseMetrics).reduce((a, b) => a + b) / 4);
      const failedExpertise = [];
      if (!hasAuthorByline) failedExpertise.push("Add a visible author byline/name");
      if (!hasAuthorBio) failedExpertise.push("Create an author bio section with photo and background");
      if (credentialKeywords <= 2) failedExpertise.push("Mention relevant qualifications, certifications, or years of experience");
      if (!hasCitations) failedExpertise.push("Include citations or links to supporting sources");

      // === AUTHORITATIVENESS ===
      const schemaTypes = [];
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          const types = Array.isArray(json) ? json.map(i => i['@type']) : [json['@type']];
          schemaTypes.push(...types.filter(Boolean));
        } catch {}
      });
      const hasAwards = !!cleanedText.match(/\b(award|winner|awarded|featured in|as seen on|recognized by|endorsed by|endorsement|best|top|honored|accolade|prize|nominee|finalist|ranked|trusted by|partnered with|collaborated with|official|certified by|accredited by|recommended by|highly rated|testimonials?|client success|case study success|media mention|press coverage)\b/gi);
      const aboutLinkElements = doc.querySelectorAll('a[href*="/about" i], a[href*="/team" i]');
      const hasAboutLinks = aboutLinkElements.length > 0 ||
        Array.from(doc.querySelectorAll('nav a')).some(a => a.textContent.toLowerCase().includes('about'));
      const authoritativenessMetrics = {
        schema: schemaTypes.length > 1 ? 100 : schemaTypes.length > 0 ? 70 : 20,
        awards: hasAwards ? 100 : 20,
        aboutLinks: hasAboutLinks ? 100 : 20
      };
      const authoritativenessScore = Math.round(Object.values(authoritativenessMetrics).reduce((a, b) => a + b) / 3);
      const failedAuthoritativeness = [];
      if (schemaTypes.length < 2) failedAuthoritativeness.push("Implement relevant JSON-LD schema (Article, Person, Organization)");
      if (!hasAwards) failedAuthoritativeness.push("Mention any awards, endorsements, or media features");
      if (!hasAboutLinks) failedAuthoritativeness.push("Add links to an About or Team page");

      // === TRUSTWORTHINESS ===
      const isHttps = url.startsWith('https');
      const contactLinkElements = doc.querySelectorAll(config.parsing.contactLinkSelectors.join(', ') + ', a[href*="contact"], a[href*="/contact"], [class*="contact" i], [id*="contact" i]');
	  const footerContactText = Array.from(doc.querySelectorAll('footer a, footer span, footer div, footer p, .contact-info, .get-in-touch')).some(el =>
 	  el.textContent.toLowerCase().includes('contact') ||
 	  el.textContent.toLowerCase().includes('get in touch') ||
 	  /\b(email|phone|tel|call|message|reach us|say hello)\b/i.test(el.textContent)
		);
	  const hasContact = contactLinkElements.length > 0 || footerContactText;
	  const policyLinkElements = doc.querySelectorAll(config.parsing.policyLinkSelectors.join(', ') + ', a[href*="/policy" i], a[href*="/cookie" i], a[href*="/gdpr" i], a[href*="/legal" i]');
	  const footerPolicyText = Array.from(doc.querySelectorAll('footer a, footer span, footer div, footer p')).some(el =>
	   /privacy|terms|cookie|gdpr|legal|disclaimer|imprint/i.test(el.textContent.toLowerCase())
		);
	  const hasPolicies = policyLinkElements.length > 0 || footerPolicyText;
      const updateDateElement = doc.querySelector(config.parsing.updateDateSelectors.join(', '));
      const hasUpdateDate = !!updateDateElement ||
        cleanedText.match(/\b(Updated|Last updated|Published|Modified on)[\s:]*\w+/gi);

      const trustworthinessMetrics = {
        https: isHttps ? 100 : 20,
        contact: hasContact ? 100 : 20,
        policies: hasPolicies ? 100 : 20,
        updateDate: hasUpdateDate ? 100 : 20
      };
      const trustworthinessScore = Math.round(Object.values(trustworthinessMetrics).reduce((a, b) => a + b) / 4);
      const failedTrustworthiness = [];
      if (!isHttps) failedTrustworthiness.push("Switch to HTTPS");
      if (!hasContact) failedTrustworthiness.push("Add a visible Contact page or contact details");
      if (!hasPolicies) failedTrustworthiness.push("Include links to Privacy Policy and/or Terms");
      if (!hasUpdateDate) failedTrustworthiness.push("Display a last updated date");

      // Intent Analysis
      progressText.textContent = "Analyzing Search Intent";
      await sleep(2000);
      const titleLower = (doc.title || '').toLowerCase();
      let intent = 'Informational';
      let confidence = 60;
      if (/buy|best|review|price|deal|shop|discount|vs|comparison/i.test(titleLower)) { intent = 'Commercial'; confidence = 90; }
      else if (/how|what|why|guide|tutorial|step|learn|explain|best way/i.test(titleLower)) { intent = 'Informational'; confidence = 94; }
      else if (/near me|location|store|city|local|hours|map|address/i.test(titleLower)) { intent = 'Local'; confidence = 87; }
      else if (/sign up|login|purchase|buy now|order|checkout|book/i.test(titleLower)) { intent = 'Transactional'; confidence = 91; }

      const eeatAvg = Math.round((experienceScore + expertiseScore + authoritativenessScore + trustworthinessScore) / 4);
      const depthScore = words > 2000 ? 95 : words > 1200 ? 82 : words > 700 ? 65 : 35;
      const readScore = readability > 70 ? 90 : readability > 50 ? 75 : 45;
      const overall = Math.round((depthScore + readScore + eeatAvg + confidence + schemaTypes.length * 8) / 5);

      // === Score Improvement & Potential Gains Calculation ===
      const currentScore = overall;
      let projectedScore = currentScore;
      const totalFailed = failedExperience.length + failedExpertise.length + failedAuthoritativeness.length + failedTrustworthiness.length;
      const hasDepthGap = words < 1500;
      const hasSchemaGap = schemaTypes.length < 2;
      const hasAuthorGap = !hasAuthorByline;
      if (totalFailed > 0 || hasDepthGap || hasSchemaGap || hasAuthorGap) {
        projectedScore = Math.min(100, currentScore +
          (totalFailed * 5) +
          (hasDepthGap ? 12 : 0) +
          (hasSchemaGap ? 10 : 0) +
          (hasAuthorGap ? 15 : 0)
        );
      }
      const scoreDelta = Math.round(projectedScore - currentScore);
      const isOptimal = scoreDelta <= 5;
      const priorityFixes = [];
      if (!hasAuthorByline) priorityFixes.push({text: "Add visible author byline & bio", impact: "+15–25 points"});
      if (words < 1500) priorityFixes.push({text: "Expand content depth (>1,500 words)", impact: "+12–20 points"});
      if (schemaTypes.length < 2) priorityFixes.push({text: "Add relevant schema markup", impact: "+10–18 points"});
      if (totalFailed > 0) {
        if (failedExperience.length > 0) priorityFixes.push({text: "Strengthen first-person experience signals", impact: "+8–15 points"});
        else if (failedExpertise.length > 0) priorityFixes.push({text: "Add credentials & citations", impact: "+10–18 points"});
      }
      const topFixes = priorityFixes.slice(0, 3);
      const trafficUplift = isOptimal ? 0 : Math.round(scoreDelta * 1.8);
      const ctrBoost = isOptimal ? 0 : Math.min(30, Math.round(scoreDelta * 0.8));
      const rankingLift = isOptimal ? "Already strong" : currentScore < 60 ? "Page 2+ → Page 1 potential" : "Top 20 → Top 10 possible";

      progressText.textContent = "Generating Report";
      await sleep(600);

      // === GRADE FUNCTION ===
      function getGrade(score, type = 'eeat') {
        let text, emoji, color;
        if (type === 'depth') {
          if (score >= 1500) { text = 'Excellent'; emoji = '✅'; color = 'text-green-600'; }
          else if (score >= 800) { text = 'Good'; emoji = '⚠️'; color = 'text-orange-400'; }
          else { text = 'Needs Work'; emoji = '❌'; color = 'text-red-600'; }
        } else if (type === 'readability') {
          if (score >= 60 && score <= 70) { text = 'Excellent'; emoji = '✅'; color = 'text-green-600'; }
          else if (score >= 50 && score <= 80) { text = 'Good'; emoji = '⚠️'; color = 'text-orange-400'; }
          else { text = 'Needs Work'; emoji = '❌'; color = 'text-red-600'; }
        } else if (type === 'schema') {
          if (score >= 2) { text = 'Excellent'; emoji = '✅'; color = 'text-green-600'; }
          else if (score === 1) { text = 'Good'; emoji = '⚠️'; color = 'text-orange-400'; }
          else { text = 'Needs Work'; emoji = '❌'; color = 'text-red-600'; }
        } else {
          if (score >= 80) { text = 'Excellent'; emoji = '✅'; color = 'text-green-600'; }
          else if (score >= 60) { text = 'Good'; emoji = '⚠️'; color = 'text-orange-400'; }
          else { text = 'Needs Work'; emoji = '❌'; color = 'text-red-600'; }
        }
        return { text, emoji, color };
      }
      
// === RADAR CHART DATA ===
      const normalizeDepth = words >= 1500 ? 100 : words >= 800 ? 75 : words >= 400 ? 50 : 20;
      const normalizeReadability = readability >= 60 && readability <= 70 ? 100 : (readability >= 50 && readability <= 80) ? 75 : 40;
      const normalizeSchema = schemaTypes.length >= 3 ? 100 : schemaTypes.length >= 2 ? 95 : schemaTypes.length === 1 ? 65 : 20;

      const modules = [
        { name: 'Experience', score: experienceScore },
        { name: 'Expertise', score: expertiseScore },
        { name: 'Authoritativeness', score: authoritativenessScore },
        { name: 'Trustworthiness', score: trustworthinessScore },
        { name: 'Content Depth', score: normalizeDepth },
        { name: 'Readability', score: normalizeReadability },
        { name: 'Schema', score: normalizeSchema }
      ];

      const scores = modules.map(m => m.score);
      
// Scroll to results from top of viewport + generous offset - always consistent
const offset = 240; // (adjust 80–340)

const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;

window.scrollTo({
  top: targetY,
  behavior: 'smooth'
});
      
      results.innerHTML = `
<!-- Overall Score Card (SEO Intent) -->
<div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${overall >= 80 ? 'border-green-500' : overall >= 60 ? 'border-orange-400' : 'border-red-500'}">
    
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Overall SEO Intent Score</p>
    
    <!-- Responsive SVG wrapper -->
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(overall / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
               style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
            ${overall}
          </div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1"
               style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>

    ${(() => {
      const title = (doc.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) : title;
      return `<p class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
    })()}

    ${(() => {
      const g = getGrade(overall);
      return `<p class="${g.color} text-4xl sm:text-5xl font-bold text-center mt-4 sm:mt-6 drop-shadow-lg">${g.emoji} ${g.text}</p>`;
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
<!-- Intent -->
<div class="text-center mb-12">
  <p class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">
    Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
    <span class="text-2xl text-gray-800 dark:text-gray-200">— ${confidence}% match</span>
  </p>
  <div class="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
      <p class="font-bold text-blue-500">What it is</p>
      <p class="mt-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">The core motivation driving a user's search query — whether they're seeking information, researching options, ready to purchase, or looking for a local service. Understanding this ensures your content delivers exactly what searchers expect.</p>
    </div>
    <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl">
      <p class="font-bold text-green-500">How to satisfy it</p>
      <p class="mt-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">Craft your title, H1, meta description, and body content to directly address the user's specific need. Use matching language, structure (e.g., lists for comparisons, steps for how-tos), and calls-to-action — eliminate fluff, assumptions, or mismatched elements to create a seamless experience.</p>
    </div>
    <div class="p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
      <p class="font-bold text-orange-500">Why it matters</p>
      <p class="mt-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">Search engines prioritize pages that best align with user intent, as it leads to higher satisfaction, longer engagement, and lower bounces. Mismatched intent results in quick exits, poor signals, and lost rankings — while strong alignment drives traffic and conversions.</p>
    </div>
  </div>
</div>
<!-- E-E-A-T Breakdown with ✅/❌ signals -->
<div class="grid md:grid-cols-4 gap-6 my-16">
  ${[
    { key: 'Experience', score: experienceScore, metrics: experienceMetrics, failed: failedExperience },
    { key: 'Expertise', score: expertiseScore, metrics: expertiseMetrics, failed: failedExpertise },
    { key: 'Authoritativeness', score: authoritativenessScore, metrics: authoritativenessMetrics, failed: failedAuthoritativeness },
    { key: 'Trustworthiness', score: trustworthinessScore, metrics: trustworthinessMetrics, failed: failedTrustworthiness }
  ].map(({key, score, metrics, failed}) => {
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444';
    const border = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-orange-400' : 'border-red-500';
    const signals = key === 'Experience' ? [
      { name: 'Strong first-person language', value: metrics.firstPerson,
        fix: 'Add more first-person language (“I/we/my/our”) throughout the content. Use it naturally in intros, examples, and conclusions to show personal involvement.',
        how: 'The tool counts occurrences of first-person pronouns (I, we, my, our, me, us) and related forms. Strong = 15+ mentions across the page.',
        why: 'First-person writing signals genuine hands-on experience to Google and readers. It increases trust, engagement, and dwell time — all positive ranking factors. Pages with strong personal voice often outperform third-person corporate content.' },
      { name: 'Personal anecdotes included', value: metrics.anecdotes,
        fix: 'Include personal anecdotes or real-world examples. Share specific stories like “I tested this method on 5 client sites and saw…” or “In my experience working with…” to make advice relatable.',
        how: 'Scans for phrases like “I tested”, “in my experience”, “we found that”, “hands-on”, “real-world”. Strong = 3+ detections.',
        why: 'Anecdotes prove you’ve actually done what you’re teaching. They build emotional connection with readers and reduce bounce rates. Google favors content that demonstrates real application over theoretical advice.' },
      { name: 'Timeline/date mentions', value: metrics.timelines,
        fix: 'Mention specific timelines or dates from your experience, e.g., “Last year I tried…”, “Since 2020 we’ve used this approach…”, “Over the past 18 months our team has…”',
        how: 'Looks for date/year references tied to first-person context. Strong = 2+ personal timeline mentions.',
        why: 'Timelines show recency and depth of experience. They help Google assess content freshness and real-world testing. Dated personal experience outperforms generic evergreen claims.' },
      { name: 'Personal media/captions', value: metrics.personalMedia,
        fix: 'Add original photos, screenshots, or videos with personal captions like “My setup for testing…”, “Our results after 3 months”, or “Client dashboard I managed”.',
        how: 'Checks image alt text, captions, and figures for personal context (“my”, “our”, “I took this”). Strong = at least one detected.',
        why: 'Original media with personal context proves you actually did the work. It boosts credibility, reduces perceived AI content risk, and increases user trust and time on page.' }
    ] : key === 'Expertise' ? [
      { name: 'Author byline present', value: metrics.byline,
        fix: 'Add a clear, visible author name linked to the content. Place it above or below the article with proper markup.',
        how: 'Searches common byline selectors and meta tags across platforms. Strong = author name clearly detected.',
        why: 'Google increasingly ties content quality to identifiable authors. Bylines help establish who is responsible for the advice. Pages with named authors often rank higher in E-E-A-T sensitive topics.' },
      { name: 'Author bio section', value: metrics.bio,
        fix: 'Create a dedicated author box with professional photo, background, qualifications, and links to social/other work.',
        how: 'Looks for bio containers and structured sections. Strong = dedicated bio area found.',
        why: 'Bios provide proof of expertise and background. They help Google and readers assess whether the author is qualified. Strong author profiles correlate with higher rankings.' },
      { name: 'Credentials mentioned', value: metrics.credentials,
        fix: 'Mention relevant qualifications, certifications, years of experience, publications, or awards directly in content or bio.',
        how: 'Counts credential keywords (PhD, certified, licensed, years of experience, published in, etc.). Strong = 3+ mentions.',
        why: 'Explicit credentials demonstrate specialized knowledge. They reduce perceived risk of inaccurate advice. Google rewards content from demonstrably qualified sources.' },
      { name: 'Citations/references', value: metrics.citations,
        fix: 'Include links to supporting studies, sources, tools, or references. Add a references section if appropriate.',
        how: 'Detects citation links and reference sections. Strong = references or source links found.',
        why: 'Citations show research depth and respect for original sources. They increase perceived reliability. Well-cited content performs better in competitive SERPs.' }
    ] : key === 'Authoritativeness' ? [
      { name: 'Strong schema markup', value: metrics.schema,
        fix: 'Implement relevant JSON-LD schema (Article, Person, Organization, FAQPage, HowTo) in the page head.',
        how: 'Counts valid schema types in script tags. Strong = 2+ relevant types detected.',
        why: 'Schema helps Google understand entities and content type. It enables rich results and strengthens entity authority. Proper markup is a clear authority signal.' },
      { name: 'Awards/endorsements mentioned', value: metrics.awards,
        fix: 'Mention any awards, media features, client testimonials, or industry recognition earned by you or your site.',
        how: 'Scans text for award-related keywords and phrases. Strong = mentions detected.',
        why: 'External recognition signals leadership in the niche. It builds trust with both users and search engines. Award mentions correlate with higher topical authority.' },
      { name: 'About/Team links', value: metrics.aboutLinks,
        fix: 'Add clear links to About, Team, or Company pages in navigation or footer.',
        how: 'Checks navigation and footer for About/Team links. Strong = link found.',
        why: 'Established entities with About pages are seen as more authoritative. They show transparency and longevity. Google favors known entities over anonymous sites.' }
    ] : [
      { name: 'Secure HTTPS', value: metrics.https,
        fix: 'Switch your site to HTTPS with a valid SSL certificate.',
        how: 'Checks page URL protocol. Strong = loads via https://.',
        why: 'HTTPS is a direct ranking factor and basic security requirement. It protects user data and builds trust. All modern sites must use HTTPS to avoid warnings and penalties.' },
      { name: 'Contact info present', value: metrics.contact,
        fix: 'Add a dedicated Contact page with email, phone, or form. Include contact details in footer.',
        how: 'Scans for contact links and footer text. Strong = contact method detected.',
        why: 'Contactability shows legitimacy and accountability. It reduces perceived scam risk. Google favors sites users can actually reach.' },
      { name: 'Privacy/Terms links', value: metrics.policies,
        fix: 'Add links to Privacy Policy and Terms of Service pages, especially in footer.',
        how: 'Looks for policy links across common locations. Strong = at least one found.',
        why: 'Policy pages demonstrate legal compliance and transparency. They are expected on professional sites. Missing policies can trigger trust issues.' },
      { name: 'Update date shown', value: metrics.updateDate,
        fix: 'Display a visible “Last updated” or “Published” date on the page.',
        how: 'Searches common date selectors and visible text. Strong = date detected.',
        why: 'Update dates signal content freshness and maintenance. Google prioritizes current information. Dated content builds confidence in accuracy.' }
    ];
    const needsFixSignals = signals.filter(s => getGrade(s.value).text !== 'Excellent');
    return `
    <div class="score-card text-center p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${border}">
      <div class="relative mx-auto w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
          <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="12" fill="none"/>
          <circle cx="64" cy="64" r="56"
                  stroke="${color}"
                  stroke-width="12" fill="none"
                  stroke-dasharray="${(score/100)*352} 352"
                  stroke-linecap="round"/>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-4xl font-black" style="color: ${color};">
          ${score}
        </div>
      </div>
      ${(() => {
        const g = getGrade(score);
        return `<p class="${g.color} text-xl font-bold mt-4">${g.emoji} ${g.text}</p>`;
      })()}
      <p class="mt-3 text-lg font-medium text-gray-800 dark:text-gray-200">${key}</p>
      <div class="mt-3 space-y-2 text-sm text-left max-w-xs mx-auto">
        ${signals.map(s => {
          const g = getGrade(s.value);
          return `<p class="${g.color} font-medium">${g.emoji} ${s.name}</p>`;
        }).join('')}
      </div>
      <button class="fixes-toggle mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
        ${needsFixSignals.length ? 'Show Fixes (' + needsFixSignals.length + ')' : 'All Clear'}
      </button>
      <div class="fixes-panel hidden mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-6">
        ${needsFixSignals.length ? `
          <div class="text-center mb-6">
            <a href="/seo-intent-tool/#${key.toLowerCase()}" class="text-orange-500 font-bold hover:underline">
              How ${key} is tested?
            </a>
          </div>
        ` + needsFixSignals.map(s => {
          const g = getGrade(s.value);
          const titleColor = g.text === 'Good' ? 'text-orange-400' : 'text-red-600';
          return `
          <div>
            <p class="font-bold ${titleColor} text-base">${g.emoji} ${s.name}</p>
            <p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">How to fix?</p>
            <p class="mt-1 text-gray-800 dark:text-gray-200">${s.fix}</p>
            <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">How the metric works:</p>
            <p class="mt-1 text-gray-700 dark:text-gray-300">${s.how}</p>
            <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">Why it matters:</p>
            <p class="mt-1 text-gray-700 dark:text-gray-300">${s.why}</p>
          </div>`;
        }).join('') + `
          <div class="mt-8 space-y-4 text-center">
            <a href="/seo-intent-tool/#${key.toLowerCase()}" class="block text-orange-500 font-bold hover:underline">
              Learn more about ${key}
            </a>
            <button class="more-details-toggle px-6 py-2 border border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 text-sm">
              More Details →
            </button>
          </div>
        ` : '<p class="text-green-600 font-medium text-base mb-4">All signals strong — excellent work!</p>' + signals.map(s => `
          <div>
            <p class="font-bold text-green-600 text-base">✅ ${s.name}</p>
            <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">How the metric works:</p>
            <p class="mt-1 text-gray-700 dark:text-gray-300">${s.how}</p>
            <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">Why it matters:</p>
            <p class="mt-1 text-gray-700 dark:text-gray-300">${s.why}</p>
          </div>
        `).join('')}
      </div>
      <div class="full-details hidden mt-6 space-y-3 text-left text-sm">
        <p class="text-blue-500 font-bold">What it is?</p>
        <p>${key === 'Experience' ? 'Proof that the content creator has first-hand involvement in the topic, such as personal anecdotes, real-world applications, or direct participation, making the advice more relatable and credible.'
          : key === 'Expertise' ? 'Demonstrated deep knowledge and skill in the subject area, backed by qualifications, achievements, or specialized training, showing the author is a reliable source.'
          : key === 'Authoritativeness' ? 'Recognition of the site or author as a leading voice in the niche, often through citations, references from reputable sources, or industry accolades.'
          : 'Indicators that the site and content are reliable, secure, and transparent, fostering user confidence through clear policies and ethical practices.'}</p>
        <p class="text-green-500 font-bold">How to improve?</p>
        <p>${key === 'Experience' ? 'Incorporate first-person language like “I” or “we,” add personal photos or videos, include detailed case studies with outcomes, mention specific dates or timelines, and share lessons learned from your own trials and errors to make it authentic.'
          : key === 'Expertise' ? 'Add an author bio box with a professional photo, detailed biography highlighting relevant education or experience, list certifications, degrees, or publications, and link to other works or speaking engagements to build proof.'
          : key === 'Authoritativeness' ? 'Earn high-quality backlinks from trusted sites, get featured in press or media mentions, implement relevant schema markup like Organization or Person, display awards or endorsements, and contribute to industry forums or publications.'
          : 'Switch to HTTPS if not already, create a dedicated contact page with real details, add a privacy policy and terms of service, include content update dates, and ensure no misleading claims or ads to maintain transparency.'}</p>
        <p class="text-orange-500 font-bold">Why it matters?</p>
        <p>${key === 'Experience' ? 'Search engines favor content with genuine experience because it reduces misinformation, improves user satisfaction, and leads to longer dwell times, all of which boost rankings and traffic.'
          : key === 'Expertise' ? 'Proven expertise helps search engines identify high-quality content, reducing the risk of penalties and increasing visibility, as users trust and engage more with authoritative sources.'
          : key === 'Authoritativeness' ? 'It establishes your site as a go-to resource, enhancing link-building opportunities and search engine trust, which directly impacts long-term visibility and competitive edge.'
          : 'High trustworthiness signals prevent user bounces, build loyalty, and align with search engine guidelines, avoiding downgrades and ensuring steady organic traffic growth.'}</p>
      </div>
    </div>`;
  }).join('')}
</div>
<!-- Content Depth + Readability + Schema Detected -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  <!-- Content Depth Card -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 text-center ${words >= 1500 ? 'border-green-500' : words >= 800 ? 'border-orange-400' : 'border-red-500'}">
    <h3 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Content Depth</h3>
    <p class="text-5xl font-black mb-2 text-gray-800 dark:text-gray-200">${words.toLocaleString()}</p>
    <p class="text-gray-800 dark:text-gray-200 mb-4">words</p>
    ${(() => {
      const g = getGrade(words, 'depth');
      return `<p class="${g.color} text-3xl font-bold mb-4">${g.emoji} ${g.text}</p>`;
    })()}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
      ${words >= 1500 ? 'All Clear' : 'Show Fixes'}
    </button>
    <div class="hidden mt-6 text-left text-xs space-y-6">
      ${(() => {
        const g = getGrade(words, 'depth');
        const titleColor = g.text === 'Good' ? 'text-orange-400' : g.text === 'Excellent' ? 'text-green-600' : 'text-red-600';
        return `
        <div>
          <p class="font-bold ${titleColor} text-base">${g.emoji} Content Depth</p>
          ${g.text !== 'Excellent' ? `
          <p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">How to fix?</p>
          <p class="mt-1 text-gray-800 dark:text-gray-200">Expand with real-world examples, statistics, screenshots, step-by-step breakdowns, comparisons, templates, expert quotes, case studies, and deeper FAQs. Aim for the most comprehensive resource on the topic without fluff.</p>` : ''}
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">How the metric works:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Counts visible words in the rendered page body. Excellent = 1,500+ words, Good = 800–1,499 words, Needs Work = <800 words.</p>
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">Why it matters:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Depth is the strongest on-page ranking factor. Search engines reward the most thorough, helpful answer with top positions. Comprehensive content satisfies user intent fully, reduces bounces, and drives longer dwell time and higher traffic.</p>
          ${g.text === 'Excellent' ? '<p class="text-green-600 font-medium text-base mt-6">All signals strong — excellent work!</p>' : ''}
          <div class="mt-8 text-center">
            <a href="/seo-intent-tool/#depth" class="text-blue-500 font-bold hover:underline">
              How Content Depth is tested?
            </a>
          </div>
        </div>`;
      })()}
    </div>
  </div>
  <!-- Readability Card -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 text-center ${readability >= 60 && readability <= 70 ? 'border-green-500' : (readability >= 50 && readability <= 80) ? 'border-orange-400' : 'border-red-500'}">
    <h3 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Readability</h3>
    <p class="text-5xl font-black mb-2 text-gray-800 dark:text-gray-200">${readability}</p>
    <p class="text-gray-800 dark:text-gray-200 mb-4">Flesch score</p>
    ${(() => {
      const g = getGrade(readability, 'readability');
      return `<p class="${g.color} text-3xl font-bold mb-4">${g.emoji} ${g.text}</p>`;
    })()}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
      ${readability >= 60 && readability <= 70 ? 'All Clear' : 'Show Fixes'}
    </button>
    <div class="hidden mt-6 text-left text-xs space-y-6">
      ${(() => {
        const g = getGrade(readability, 'readability');
        const titleColor = g.text === 'Good' ? 'text-orange-400' : g.text === 'Excellent' ? 'text-green-600' : 'text-red-600';
        return `
        <div>
          <p class="font-bold ${titleColor} text-base">${g.emoji} Readability</p>
          ${g.text !== 'Excellent' ? `
          <p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">How to fix?</p>
          <p class="mt-1 text-gray-800 dark:text-gray-200">Use short sentences (under 20 words), simple words, active voice, clear subheadings, bullet points, short paragraphs (3–4 lines), and transitional phrases. Avoid jargon and complex structures.</p>` : ''}
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">How the metric works:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Flesch Reading Ease score (higher = easier). Excellent = 60–70 (plain English). Good = 50–80. Needs Work = outside this range.</p>
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">Why it matters:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Readable content reduces bounce rates and increases time on page. Search engines track user satisfaction signals. Easy-to-read pages engage more visitors, improve conversions, and rank higher.</p>
          ${g.text === 'Excellent' ? '<p class="text-green-600 font-medium text-base mt-6">All signals strong — excellent work!</p>' : ''}
          <div class="mt-8 text-center">
            <a href="/seo-intent-tool/#readability" class="text-blue-500 font-bold hover:underline">
              How Readability is tested?
            </a>
          </div>
        </div>`;
      })()}
    </div>
  </div>
  <!-- Schema Detected Card -->
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 text-center ${schemaTypes.length >= 2 ? 'border-green-500' : schemaTypes.length === 1 ? 'border-orange-400' : 'border-red-500'}">
    <h3 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Schema Detected</h3>
    ${schemaTypes.length ? `
      <select class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white mb-4">
        ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
      </select>
      <p class="text-gray-800 dark:text-gray-200 mb-4">${schemaTypes.length} type${schemaTypes.length > 1 ? 's' : ''} found</p>
    ` : '<p class="text-2xl text-red-600 mb-4">No schema detected</p>'}
    ${(() => {
      const g = getGrade(schemaTypes.length, 'schema');
      return `<p class="${g.color} text-3xl font-bold mb-4">${g.emoji} ${g.text}</p>`;
    })()}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
      ${schemaTypes.length >= 2 ? 'All Clear' : 'Show Fixes'}
    </button>
    <div class="hidden mt-6 text-left text-xs space-y-6">
      ${(() => {
        const g = getGrade(schemaTypes.length, 'schema');
        const titleColor = g.text === 'Good' ? 'text-orange-400' : g.text === 'Excellent' ? 'text-green-600' : 'text-red-600';
        return `
        <div>
          <p class="font-bold ${titleColor} text-base">${g.emoji} Schema Markup</p>
          ${g.text !== 'Excellent' ? `
          <p class="mt-2 font-semibold text-gray-800 dark:text-gray-200">How to fix?</p>
          <p class="mt-1 text-gray-800 dark:text-gray-200">Add JSON-LD script blocks for relevant types (Article + Person author, FAQPage, HowTo, Product, BreadcrumbList). Use at least two matching your content type. Validate with Google's testing tool.</p>` : ''}
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">How the metric works:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Detects valid schema types in script[type="application/ld+json"]. Excellent = 2+ relevant types, Good = 1 type, Needs Work = none found.</p>
          <p class="mt-3 font-semibold text-gray-800 dark:text-gray-200">Why it matters:</p>
          <p class="mt-1 text-gray-700 dark:text-gray-300">Schema unlocks rich snippets (stars, FAQs, carousels), dramatically increases click-through rates, strengthens E-E-A-T signals, and helps search engines feature your content prominently in results.</p>
          ${g.text === 'Excellent' ? '<p class="text-green-600 font-medium text-base mt-6">All signals strong — excellent work!</p>' : ''}
          <div class="mt-8 text-center">
            <a href="/seo-intent-tool/#schema" class="text-blue-500 font-bold hover:underline">
              How Schema Markup is tested?
            </a>
          </div>
        </div>`;
      })()}
    </div>
  </div>
</div>



<!-- Priority Fixes -->
   <div class="mt-20 space-y-8">
     <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Top 3 Priority Fixes</h2>
     ${(() => {
       const priority = [
         !hasAuthorByline ? { name: 'Add Author Byline & Bio', impact: '+15–25 points', desc: 'Visible author name and detailed bio with photo establish credibility and E-E-A-T signals.' } : null,
         words < 1500 ? { name: 'Expand Content Depth', impact: '+12–20 points', desc: 'Aim for >1,500 words with examples, stats, case studies, and deeper coverage to fully satisfy search intent.' } : null,
         schemaTypes.length < 2 ? { name: 'Add Relevant Schema Markup', impact: '+10–18 points', desc: 'Implement JSON-LD for Article, Person, FAQPage, etc. to unlock rich results and boost authority.' } : null
       ].filter(Boolean);

       const remaining = topFixes.filter(f => 
         !priority.some(p => p && f.text.includes(p.name.split(' ')[1] ?? p.name))
       ).slice(0, 3 - priority.length);

       const finalPriority = [...priority, ...remaining.map(f => ({ name: f.text, impact: f.impact, desc: 'Strong on-page improvement with high ranking impact.' }))].slice(0, 3);

       if (finalPriority.length === 0) {
         return `
           <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-10 md:p-14 shadow-2xl border-l-8 border-green-500">
             <h3 class="text-4xl font-black text-green-600 dark:text-green-400 mb-6 text-center">🎉 No Major Fixes Needed!</h3>
             <p class="text-xl text-center text-gray-800 dark:text-gray-200 leading-relaxed">Your page is exceptionally optimized. All key on-page signals are strong.<br>Focus next on building high-authority backlinks and fresh content.</p>
           </div>`;
       }

       return finalPriority.map((fix, i) => `
         <div class="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden">
           <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           <div class="relative flex items-start gap-6">
             <div class="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
               ${i + 1}
             </div>
             <div class="flex-1">
               <h3 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 mb-3">${fix.name}</h3>
               <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">${fix.desc}</p>
               <div class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-full shadow-lg">
                 ${fix.impact}
               </div>
             </div>
           </div>
         </div>
       `).join('');
     })()}
   </div>


<!-- Score Improvement & Potential Ranking Gains -->
<div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
    <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Overall Score Improvement</h3>
    <div class="flex justify-center items-baseline gap-4 mb-8">
      <div class="text-5xl font-black text-gray-800 dark:text-gray-200">${currentScore}</div>
      <div class="text-4xl text-gray-400">→</div>
      <div class="text-6xl font-black text-green-500">${Math.round(projectedScore)}</div>
      <div class="text-2xl text-green-600 font-medium">(${scoreDelta > 0 ? '+' + scoreDelta : 'Optimal'})</div>
    </div>
    ${isOptimal ? `
      <div class="text-center py-8">
        <p class="text-4xl mb-4">🎉 Near-Optimal Score Achieved!</p>
        <p class="text-lg text-gray-600 dark:text-gray-400">Your on-page signals are excellent. Focus on earning high-authority backlinks for the final push.</p>
      </div>
    ` : `
      <div class="space-y-4">
        <p class="font-medium text-gray-700 dark:text-gray-300 text-center mb-4">Top priority fixes & estimated impact:</p>
        ${topFixes.map(fix => `
          <div class="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <span class="text-sm md:text-base">${fix.text}</span>
            <span class="font-bold text-orange-600">${fix.impact}</span>
          </div>
        `).join('')}
      </div>
    `}
    <details class="mt-8 text-sm text-gray-600 dark:text-gray-400">
      <summary class="cursor-pointer font-medium text-orange-500 hover:underline">How We Calculated This</summary>
      <div class="mt-4 space-y-2">
        <p>• E-E-A-T signals: ~40% weight</p>
        <p>• Content depth & readability: ~35% weight</p>
        <p>• Intent match & schema: ~25% weight</p>
        <p>• Top-ranking pages typically score 85+ on these on-page factors</p>
        <p class="italic">Conservative estimates — actual gains may be higher</p>
      </div>
    </details>
  </div>
  <div class="p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-3xl font-bold text-center mb-8">Potential Ranking & Traffic Gains</h3>
    ${isOptimal ? `
      <div class="text-center py-12">
        <p class="text-4xl mb-4">🌟 Elite On-Page Performance</p>
        <p class="text-xl">Your page is highly optimized. Next step: build topical authority with quality backlinks and fresh content.</p>
      </div>
    ` : `
      <div class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="text-4xl">📈</div>
          <div class="flex-1">
            <p class="font-medium">Ranking Position Lift</p>
            <p class="text-2xl font-bold">${rankingLift}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🚀</div>
          <div class="flex-1">
            <p class="font-medium">Organic Traffic Increase</p>
            <p class="text-2xl font-bold">+${trafficUplift}% potential</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">👆</div>
          <div class="flex-1">
            <p class="font-medium">Click-Through Rate Boost</p>
            <p class="text-2xl font-bold">+${ctrBoost}% from rich results & intent match</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-4xl">🗝️</div>
          <div class="flex-1">
            <p class="font-medium">Intent Satisfaction</p>
            <p class="text-2xl font-bold">${confidence}% → ${Math.min(100, confidence + Math.round(scoreDelta * 0.6))}%</p>
          </div>
        </div>
      </div>
    `}
    <div class="mt-10 text-sm space-y-2 opacity-90">
      <p>Conservative estimates based on on-page SEO & intent alignment benchmarks.</p>
      <p>Improvements typically visible in Search Console within 1–4 weeks after indexing.</p>
      <p>Actual results depend on competition, domain authority, and off-page factors.</p>
    </div>
  </div>
</div>


<!-- PDF Button -->
<div class="text-center my-16">
  <button onclick="const hiddenEls = [...document.querySelectorAll('.hidden')]; hiddenEls.forEach(el => el.classList.remove('hidden')); window.print(); setTimeout(() => hiddenEls.forEach(el => el.classList.add('hidden')), 800);"
       class="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-2xl font-bold rounded-2xl shadow-lg hover:opacity-90">
    Save Report 📄
  </button>
</div>
      `;
      
      
// Create placeholder for Plugin Solutions
const pluginSection = document.createElement('div');
pluginSection.id = 'plugin-solutions-section';
pluginSection.className = 'mt-20';
results.appendChild(pluginSection);

// Collect only real failed/display metrics that plugins can fix
const failedMetrics = [];

// Schema Markup (already detected)
const schemaGrade = getGrade(schemaTypes.length, 'schema');
if (schemaGrade.text !== 'Excellent') {
  failedMetrics.push({ name: "Schema Markup", grade: schemaGrade });
}

// Author byline present (use original variable)
if (!hasAuthorByline) {
  failedMetrics.push({ name: "Author Byline Present", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// Author bio section (use original variable)
if (!hasAuthorBio) {
  failedMetrics.push({ name: "Author Bio Section", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// Update date shown (use original variable)
if (!hasUpdateDate) {
  failedMetrics.push({ name: "Update Date Shown", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// Contact info present (use original variable)
if (!hasContact) {
  failedMetrics.push({ name: "Contact Info Present", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// Privacy/Terms links (use original variable)
if (!hasPolicies) {
  failedMetrics.push({ name: "Privacy & Terms Links", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// About/Team links (use original variable)
if (!hasAboutLinks) {
  failedMetrics.push({ name: "About/Team Links", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}

// Render only if we have real fixes
if (failedMetrics.length > 0) {
  renderPluginSolutions(failedMetrics);
}
      
      
      // === RADAR CHART INITIALIZATION ===
            setTimeout(() => {
        const canvas = document.getElementById('health-radar');
        if (!canvas) {
          console.warn('Canvas #health-radar not found');
          return;
        }
        try {
          const ctx = canvas.getContext('2d');
          const labelColor = '#9ca3af'; // gray-400 — works perfectly day/night
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
          console.error('Chart init failed', e);
        }
      }, 150);
      

      // Event delegation for fixes toggles
      results.addEventListener('click', (e) => {
        if (e.target.matches('.fixes-toggle')) {
          const card = e.target.closest('.score-card');
          const fixesPanel = card.querySelector('.fixes-panel');
          const fullDetails = card.querySelector('.full-details');
          fixesPanel.classList.toggle('hidden');
          if (fixesPanel.classList.contains('hidden')) {
            fullDetails.classList.add('hidden');
          }
        }
        if (e.target.matches('.more-details-toggle')) {
          e.target.closest('.score-card').querySelector('.full-details').classList.toggle('hidden');
        }
      });
    } catch (err) {
      results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: ${err.message}</p>`;
    }
    
    // Clean URL for PDF cover
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
  });
});


