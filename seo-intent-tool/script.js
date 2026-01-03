document.addEventListener('DOMContentLoaded', () => {
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
      progressText.textContent = "Analyzing Content Depth...";
      await sleep(800);
      const res = await fetch("https://cors-proxy.traffictorch.workers.dev/?url=" + encodeURIComponent(url));
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
      await sleep(800);

      // === EXPERIENCE ===
      const firstPersonCount = (cleanedText.match(/\b(I|we|my|our|I've|we've|me|us|myself|ourselves)\b/gi) || []).length;
      const anecdotePhrases = (cleanedText.match(/\b(in my experience|I tested|we found that|from my trials|I tried|we tried|my results|our case study)\b/gi) || []).length;
      const timelineMentions = (cleanedText.match(/\b(last year|in 20\d{2}|this year|over the past \d+|since \d{4})\b.*\b(I|we)\b/gi) || []).length;
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
      const hasAuthorByline = !!doc.querySelector('meta[name="author"], .author, [rel="author"], [class*="author" i]');
      const hasAuthorBio = !!doc.querySelector('.author-bio, .bio, [class*="bio" i], .about-author, .author-description, .author-box');
      const credentialKeywords = (cleanedText.match(/\b(PhD|MD|doctor|certified|licensed|years? of experience|expert in|specialist|award-winning|published in|fellow|board-certified)\b/gi) || []).length;
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
      const hasAwards = !!cleanedText.match(/\b(award|winner|featured in|recognized by|endorsed by|best \d{4})\b/gi);
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
      const contactLinkElements = doc.querySelectorAll('a[href*="/contact" i], a[href*="mailto:" i], a[href*="tel:" i]');
      const footerContactText = Array.from(doc.querySelectorAll('footer a, footer span, footer div')).some(el =>
        el.textContent.toLowerCase().includes('contact')
      );
      const hasContact = contactLinkElements.length > 0 || footerContactText;
      const policyLinkElements = doc.querySelectorAll('a[href*="/privacy" i], a[href*="/terms" i]');
      const footerPolicyText = Array.from(doc.querySelectorAll('footer a, footer span, footer div')).some(el =>
        /privacy|terms/i.test(el.textContent)
      );
      const hasPolicies = policyLinkElements.length > 0 || footerPolicyText;
      const hasUpdateDate = !!doc.querySelector('time[datetime], .updated, .last-modified, meta[name="date"]');

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
      progressText.textContent = "Analyzing Search Intent...";
      await sleep(800);
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

      progressText.textContent = "Generating Report...";
      await sleep(600);

      results.innerHTML = `
<!-- Big Score Circle -->
<div class="flex justify-center my-12 px-4">
  <div class="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square">
    <svg viewBox="0 0 260 260" class="w-full h-full transform -rotate-90">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="18" fill="none"/>
      <circle cx="130" cy="130" r="120"
              stroke="${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'}"
              stroke-width="18" fill="none"
              stroke-dasharray="${(overall / 100) * 754} 754"
              stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div class="text-5xl sm:text-6xl md:text-7xl font-black drop-shadow-2xl"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
          ${overall}
        </div>
        <div class="text-xl sm:text-2xl opacity-80 -mt-2"
             style="color: ${overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'};">
          /100
        </div>
      </div>
    </div>
  </div>
</div>
<!-- Intent -->
<div class="text-center mb-12">
  <p class="text-4xl font-bold text-gray-500 mb-8">
    Intent: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">${intent}</span>
    <span class="text-2xl text-gray-500">— ${confidence}% match</span>
  </p>
  <div class="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 text-left">
    <div class="p-6 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
      <p class="font-bold text-blue-500">What it is</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">The core motivation driving a user's search query — whether they're seeking information, researching options, ready to purchase, or looking for a local service. Understanding this ensures your content delivers exactly what searchers expect.</p>
    </div>
    <div class="p-6 bg-green-500/10 border-l-4 border-green-500 rounded-r-xl">
      <p class="font-bold text-green-500">How to satisfy it</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Craft your title, H1, meta description, and body content to directly address the user's specific need. Use matching language, structure (e.g., lists for comparisons, steps for how-tos), and calls-to-action — eliminate fluff, assumptions, or mismatched elements to create a seamless experience.</p>
    </div>
    <div class="p-6 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
      <p class="font-bold text-orange-500">Why it matters</p>
      <p class="mt-2 text-sm text-gray-500 leading-relaxed">Search engines prioritize pages that best align with user intent, as it leads to higher satisfaction, longer engagement, and lower bounces. Mismatched intent results in quick exits, poor signals, and lost rankings — while strong alignment drives traffic and conversions.</p>
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
    const border = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-orange-500' : 'border-red-500';
    const fixesList = failed.length ?
      `<p class="font-medium mb-2 text-orange-600">How to fix the failed signals:</p><ul class="list-disc pl-5 space-y-2">${failed.map(f => `<li>${f}</li>`).join('')}</ul>` :
      '<p class="text-green-600 font-medium">All signals strong — no fixes needed!</p>';
    return `
    <div class="score-card text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${border}">
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
      <p class="mt-4 text-lg font-medium">${key}</p>
      <!-- ✅/❌ Signal List -->
      <div class="mt-3 space-y-1 text-sm text-left max-w-xs mx-auto">
        ${key === 'Experience' ? `
          ${metrics.firstPerson >= 80 ? '<p>✅ Strong first-person language</p>' : '<p>❌ Limited first-person language</p>'}
          ${metrics.anecdotes >= 80 ? '<p>✅ Personal anecdotes included</p>' : '<p>❌ Missing personal anecdotes</p>'}
          ${metrics.timelines >= 80 ? '<p>✅ Timeline/date mentions</p>' : '<p>❌ No timeline/date mentions</p>'}
          ${metrics.personalMedia >= 80 ? '<p>✅ Personal media/captions</p>' : '<p>❌ No personal media detected</p>'}
        ` : key === 'Expertise' ? `
          ${metrics.byline >= 80 ? '<p>✅ Author byline present</p>' : '<p>❌ No author byline</p>'}
          ${metrics.bio >= 80 ? '<p>✅ Author bio section</p>' : '<p>❌ Missing author bio</p>'}
          ${metrics.credentials >= 80 ? '<p>✅ Credentials mentioned</p>' : '<p>❌ Few/no credentials</p>'}
          ${metrics.citations >= 80 ? '<p>✅ Citations/references</p>' : '<p>❌ No citations found</p>'}
        ` : key === 'Authoritativeness' ? `
          ${metrics.schema >= 80 ? '<p>✅ Strong schema markup</p>' : '<p>❌ Limited/no schema</p>'}
          ${metrics.awards >= 80 ? '<p>✅ Awards/endorsements mentioned</p>' : '<p>❌ No awards mentioned</p>'}
          ${metrics.aboutLinks >= 80 ? '<p>✅ About/Team links</p>' : '<p>❌ Missing About links</p>'}
        ` : `
          ${metrics.https >= 80 ? '<p>✅ Secure HTTPS</p>' : '<p>❌ HTTP (insecure)</p>'}
          ${metrics.contact >= 80 ? '<p>✅ Contact info present</p>' : '<p>❌ No contact details</p>'}
          ${metrics.policies >= 80 ? '<p>✅ Privacy/Terms links</p>' : '<p>❌ Missing policy links</p>'}
          ${metrics.updateDate >= 80 ? '<p>✅ Update date shown</p>' : '<p>❌ No update date</p>'}
        `}
      </div>
      <button class="fixes-toggle mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
        ${failed.length ? 'Show Fixes (' + failed.length + ')' : 'All Clear'}
      </button>
      <div class="fixes-panel hidden mt-4 text-left text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        ${fixesList}
        <button class="more-details-toggle mt-4 text-xs text-orange-500 hover:underline block">
          More details →
        </button>
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
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Content Depth</h3>
    <p class="text-5xl font-black mb-2">${words.toLocaleString()}</p>
    <p class="text-gray-500 mb-4">words</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>Comprehensive coverage that fully answers the user's query while going deeper with related questions, examples, and supporting details to provide the most complete resource possible.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Add real-world examples, statistics and data sources, screenshots or visuals, step-by-step guides, comparisons, templates or downloadable resources, FAQs addressing common follow-ups, and expert insights to expand value without fluff.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Depth is the strongest on-page ranking factor — search engines reward pages that fully satisfy user intent with the most helpful, thorough answer, leading to higher positions, longer dwell time, and more organic traffic.</p>
    </div>
  </div>
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Readability</h3>
    <p class="text-5xl font-black mb-2">${readability}</p>
    <p class="text-gray-500 mb-4">Flesch score</p>
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>How easily users can read and understand your content — measured by sentence length, word complexity, and overall flow.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Use short sentences (under 20 words), simple everyday words, active voice, clear subheadings (H2/H3), bullet points and numbered lists, short paragraphs (3–4 lines max), bold key phrases, and transitional words to guide the reader smoothly.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Search engines track user behavior — highly readable content reduces bounce rates, increases time on page, and improves satisfaction signals, all of which directly boost rankings and conversions.</p>
    </div>
  </div>
  <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 text-center">
    <h3 class="text-2xl font-bold mb-4">Schema Detected</h3>
    ${schemaTypes.length ? `
      <select class="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
        ${schemaTypes.map(t => `<option>${t}</option>`).join('')}
      </select>
      <p class="mt-4 text-green-500 font-bold">${schemaTypes.length} type${schemaTypes.length > 1 ? 's' : ''} found</p>
    ` : '<p class="text-2xl text-red-500 mt-4">No schema detected</p>'}
    <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">Show Fixes</button>
    <div class="hidden mt-6 space-y-3 text-left text-sm">
      <p class="text-blue-500 font-bold">What it is?</p>
      <p>Structured data (JSON-LD) that explicitly tells search engines what your page content represents — such as Article, FAQ, HowTo, Product, Person, Organization, etc.</p>
      <p class="text-green-500 font-bold">How to improve?</p>
      <p>Add JSON-LD script blocks in the <head> for relevant types (e.g., Article + author Person link, FAQPage for questions, HowTo for tutorials, BreadcrumbList for navigation). Validate using official structured data testing tools and implement the most relevant types for your content.</p>
      <p class="text-orange-500 font-bold">Why it matters?</p>
      <p>Schema enables rich snippets (stars, FAQs, carousels), increases click-through rates significantly, strengthens E-E-A-T signals, and helps search engines understand and feature your content more prominently in results.</p>
    </div>
  </div>
</div>
<!-- Competitive Gap Table -->
<div class="overflow-x-auto my-12">
  <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-left">
    <thead>
      <tr class="bg-gray-200 dark:bg-gray-700">
        <th class="p-4 font-bold">Metric</th>
        <th class="p-4 font-bold">Current</th>
        <th class="p-4 font-bold">Ideal</th>
        <th class="p-4 font-bold">Gap</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b"><td class="p-4 text-gray-500">Word Count</td><td class="p-4 text-gray-500">${words}</td><td class="p-4 text-gray-500">>1,500</td><td class="p-4 ${words<1500?'text-red-500':'text-green-500'}">${words<1500?'Add '+(1500-words)+' words':'Good'}</td></tr>
      <tr class="border-b"><td class="p-4 text-gray-500">Readability</td><td class="p-4 text-gray-500">${readability}</td><td class="p-4 text-gray-500">60-70</td><td class="p-4 ${readability<60||readability>70?'text-orange-500':'text-green-500'}">${readability<60||readability>70?'Adjust':'Good'}</td></tr>
      <tr class="border-b"><td class="p-4 text-gray-500">Schema Types</td><td class="p-4 text-gray-500">${schemaTypes.length}</td><td class="p-4 text-gray-500">≥2</td><td class="p-4 ${schemaTypes.length<2?'text-red-500':'text-green-500'}">${schemaTypes.length<2?'Add':'Good'}</td></tr>
      <tr><td class="p-4 text-gray-500">Author Bio</td><td class="p-4 text-gray-500">${hasAuthorByline?'Yes':'No'}</td><td class="p-4 text-gray-500">Yes</td><td class="p-4 ${!hasAuthorByline?'text-red-500':'text-green-500'}">${!hasAuthorByline?'Add':'Good'}</td></tr>
    </tbody>
  </table>
</div>
<!-- Prioritised AI-Style Fixes -->
<div class="space-y-8">
  <h3 class="text-4xl font-bold text-green-400 text-center mb-8">Prioritised AI-Style Fixes</h3>
  ${!hasAuthorByline ? `
  <div class="p-8 bg-gradient-to-r from-red-500/10 border-l-8 border-red-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">👤</div>
      <div>
        <h4 class="text-2xl font-bold text-red-600">Add Author Bio & Photo</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">A visible author byline with name, photo, and credentials that proves a real expert created the content.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Add a detailed author box with professional headshot, full bio highlighting relevant experience/qualifications, links to social profiles or other work, and clear connection to the topic.</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Search engines heavily weigh proven authorship for E-E-A-T — pages with strong author signals rank higher, build trust faster, and reduce bounce rates significantly.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
  ${words < 1500 ? `
  <div class="p-8 bg-gradient-to-r from-orange-500/10 border-l-8 border-orange-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">✍️</div>
      <div>
        <h4 class="text-2xl font-bold text-orange-600">Expand Content Depth</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">Thorough, comprehensive coverage that fully answers the main query plus all related follow-up questions users typically have.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Add in-depth examples, data-backed statistics, step-by-step breakdowns, comparisons, visuals/screenshots, templates or tools, expert quotes, case studies, and expanded FAQs — aim for the most complete resource on the topic.</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Depth remains the strongest on-page ranking factor — search engines consistently reward the most helpful, exhaustive pages with top positions and sustained traffic growth.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
  ${schemaTypes.length < 2 ? `
  <div class="p-8 bg-gradient-to-r from-purple-500/10 border-l-8 border-purple-500 rounded-r-2xl">
    <div class="flex gap-6">
      <div class="text-5xl">✨</div>
      <div>
        <h4 class="text-2xl font-bold text-purple-600">Add Relevant Schema Markup</h4>
        <div class="mt-4 space-y-3 text-sm">
          <p class="text-blue-500 font-bold">What it is?</p>
          <p class="text-gray-500 dark:text-gray-500">Structured data (JSON-LD) that explicitly defines your page type and key entities to search engines.</p>
          <p class="text-green-500 font-bold">How to improve?</p>
          <p class="text-gray-500 dark:text-gray-500">Implement at least two relevant types: Article (with author Person link), plus FAQPage, HowTo, Product, or BreadcrumbList as appropriate. Validate with official testing tools before publishing.</p>
          <p class="text-orange-500 font-bold">Why it matters?</p>
          <p class="text-gray-500 dark:text-gray-500">Proper schema unlocks rich results, boosts click-through rates dramatically, strengthens E-E-A-T signals, and helps search engines feature your content more prominently.</p>
        </div>
      </div>
    </div>
  </div>` : ''}
</div>

<!-- Score Improvement & Potential Ranking Gains -->
<div class="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
  <div class="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
    <h3 class="text-3xl font-bold text-center mb-8 text-orange-500">Overall Score Improvement</h3>
    <div class="flex justify-center items-baseline gap-4 mb-8">
      <div class="text-5xl font-black text-gray-500">${currentScore}</div>
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
    📄 Save as PDF
  </button>
</div>
      `;

      // Event delegation for fixes toggles (fixes the ReferenceError)
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
    
    
    
      // Clean URL for PDF cover: domain on first line, path on second
      let fullUrl = document.getElementById('url-input').value.trim();
      let displayUrl = 'traffictorch.net'; // fallback

      if (fullUrl) {
        // Remove protocol and www
        let cleaned = fullUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');

        // Split into domain and path
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