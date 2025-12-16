document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const yourInput = document.getElementById('your-url');
  const compInput = document.getElementById('competitor-url');
  const phraseInput = document.getElementById('target-phrase');
  const results = document.getElementById('results');
  const PROXY = 'https://cors-proxy.traffictorch.workers.dev/';

  const fetchPage = async (url) => {
    try {
      const res = await fetch(PROXY + '?url=' + encodeURIComponent(url));
      if (!res.ok) return null;
      const html = await res.text();
      return new DOMParser().parseFromString(html, 'text/html');
    } catch {
      return null;
    }
  };

  const countPhrase = (text = '', phrase = '') => {
    if (!text || !phrase) return 0;
    const lower = text.toLowerCase();
    const p = phrase.toLowerCase().trim();
    let matches = (lower.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const cleanP = p.replace(/\b(in|the|a|an|of|at|on|for|and|&|near|best|top|great)\b/gi, '').trim();
    if (cleanP.length > 4) matches += (lower.match(new RegExp(cleanP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    return matches;
  };

  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, script, style, noscript, .menu, .nav, .navbar, .footer, .cookie, .popup').forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;

  const getCircleColor = (score) => score < 60 ? '#ef4444' : score < 80 ? '#fb923c' : '#22c55e';
  const getTextColorClass = (score) => score < 60 ? 'text-red-600 dark:text-red-400' : score < 80 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const yourUrl = yourInput.value.trim();
    const compUrl = compInput.value.trim();
    const phrase = phraseInput.value.trim();
    if (!yourUrl || !compUrl || !phrase) return;

    results.classList.remove('hidden');
    results.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-32 h-32 border-8 border-gray-200 rounded-full"></div>
          <div class="absolute inset-0 w-32 h-32 border-8 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p class="mt-8 text-2xl font-medium text-gray-600 dark:text-gray-300">Analyzing pages for "${phrase}"...</p>
        <div id="progress-modules" class="mt-12 space-y-4 w-full max-w-md"></div>
      </div>
    `;

    const progressModules = document.getElementById('progress-modules');
    const messages = [
      "Fetching your page via secure proxy",
      "Fetching competitor page",
      "Parsing meta title & description",
      "Scanning headings (H1-H6)",
      "Analyzing main content depth & density",
      "Checking image alt texts",
      "Reviewing internal anchor text",
      "Evaluating URL structure & schema markup",
      "Calculating Phrase Power Scores",
      "Generating prioritized gap fixes"
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < messages.length) {
        progressModules.innerHTML += `
          <div class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
            <div class="w-8 h-8 bg-orange-500 rounded-full animate-pulse"></div>
            <p class="text-lg">${messages[idx]}</p>
          </div>
        `;
        idx++;
      } else {
        clearInterval(interval);
      }
    }, Math.random() * 900 + 600);
    results.dataset.interval = interval;

    const [yourDoc, compDoc] = await Promise.all([fetchPage(yourUrl), fetchPage(compUrl)]);
    if (results.dataset.interval) clearInterval(results.dataset.interval);

    if (!yourDoc || !compDoc) {
      results.innerHTML = `<p class="text-red-500 dark:text-red-400 text-center text-2xl py-20">Error: One or both pages could not be loaded.</p>`;
      return;
    }

    let yourScore = 0;
    let compScore = 0;
    const data = {};

    // Meta Title & Description
    data.meta = {
      yourMatches: countPhrase(yourDoc.querySelector('title')?.textContent + yourDoc.querySelector('meta[name="description"]')?.content, phrase),
      compMatches: countPhrase(compDoc.querySelector('title')?.textContent + compDoc.querySelector('meta[name="description"]')?.content, phrase)
    };
    yourScore += data.meta.yourMatches > 0 ? 25 : 0;
    compScore += data.meta.compMatches > 0 ? 25 : 0;

    // H1 & Headings
    data.headings = {
      yourH1Match: countPhrase(yourDoc.querySelector('h1')?.textContent.trim() || '', phrase),
      compH1Match: countPhrase(compDoc.querySelector('h1')?.textContent.trim() || '', phrase)
    };
    yourScore += data.headings.yourH1Match > 0 ? 15 : 0;
    compScore += data.headings.compH1Match > 0 ? 15 : 0;

    // Content Density
    const yourWords = getWordCount(yourDoc);
    const compWords = getWordCount(compDoc);
    const yourContentMatches = countPhrase(getCleanContent(yourDoc), phrase);
    const compContentMatches = countPhrase(getCleanContent(compDoc), phrase);
    const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
    const compDensity = compWords ? (compContentMatches / compWords * 100).toFixed(1) : 0;
    data.content = { yourWords, compWords, yourDensity, compDensity };
    yourScore += yourWords > 800 ? 20 : 0;
    compScore += compWords > 800 ? 20 : 0;

    // Image Alts
    const yourImgs = yourDoc.querySelectorAll('img');
    const compImgs = compDoc.querySelectorAll('img');
    const yourAltPhrase = Array.from(yourImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    const compAltPhrase = Array.from(compImgs).filter(img => countPhrase(img.alt || '', phrase) > 0).length;
    data.alts = { yourPhrase: yourAltPhrase, compPhrase: compAltPhrase };
    yourScore += yourAltPhrase > 0 ? 15 : 0;
    compScore += compAltPhrase > 0 ? 15 : 0;

    // Anchors
    const yourAnchors = Array.from(yourDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    const compAnchors = Array.from(compDoc.querySelectorAll('a')).filter(a => countPhrase(a.textContent || '', phrase) > 0).length;
    data.anchors = { your: yourAnchors, comp: compAnchors };
    yourScore += yourAnchors > 0 ? 10 : 0;
    compScore += compAnchors > 0 ? 10 : 0;

    // URL & Schema
    data.urlSchema = {
      yourUrlMatch: countPhrase(yourUrl, phrase),
      compUrlMatch: countPhrase(compUrl, phrase),
      yourSchema: yourDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0,
      compSchema: compDoc.querySelector('script[type="application/ld+json"]') ? 1 : 0
    };
    yourScore += data.urlSchema.yourUrlMatch > 0 ? 10 : 0;
    compScore += data.urlSchema.compUrlMatch > 0 ? 10 : 0;

    yourScore = Math.min(100, Math.round(yourScore));
    compScore = Math.min(100, Math.round(compScore));

    const forecastTier = yourScore >= 90 ? 'Top 3 Potential' : yourScore >= 80 ? 'Top 10 Likely' : yourScore >= 60 ? 'Page 1 Possible' : 'Page 2+';
    const gap = yourScore > compScore ? '+' + (yourScore - compScore) : yourScore < compScore ? (compScore - yourScore) : '±0';

     const fixes = [];
 if (yourScore < compScore || yourScore === compScore) {  // Show suggestions even if tied for education
   if (data.meta.yourMatches === 0) fixes.push("Add phrase to title and meta description.");
   if (yourWords < 800 || yourWords < compWords) fixes.push(`Expand content depth — aim for at least 800 words (currently ${yourWords}).`);
   if (data.headings.yourH1Match === 0) fixes.push("Include phrase in H1 heading.");
   if (parseFloat(data.content.yourDensity) < 1) fixes.push("Improve content density — naturally use phrase more frequently.");
   if (data.alts.yourPhrase === 0) fixes.push("Include phrase in key image alt text.");
   if (data.anchors.your === 0) fixes.push("Use phrase in internal anchor text.");
   if (data.urlSchema.yourUrlMatch === 0) fixes.push("Include phrase in URL slug if possible.");
   if (data.urlSchema.yourSchema === 0) fixes.push("Add structured data (JSON-LD schema markup).");
 }

    results.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-16 animate-in">
        <!-- Big Score Circles -->
        <div class="grid md:grid-cols-2 gap-12 my-12">
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Your Phrase Power Score</h3>
            <div class="relative mx-auto w-64 h-64">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="${getCircleColor(yourScore)}" stroke-width="20" fill="none"
                        stroke-dasharray="${(yourScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-7xl font-black ${getTextColorClass(yourScore)} drop-shadow-2xl">${yourScore}</span>
                <span class="text-2xl text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">Competitor Phrase Power Score</h3>
            <div class="relative mx-auto w-64 h-64">
              <svg width="260" height="260" viewBox="0 0 260 260" class="transform -rotate-90">
                <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="20" fill="none"/>
                <circle cx="130" cy="130" r="120" stroke="${getCircleColor(compScore)}" stroke-width="20" fill="none"
                        stroke-dasharray="${(compScore / 100) * 754} 754" stroke-linecap="round" class="drop-shadow-lg"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-7xl font-black ${getTextColorClass(compScore)} drop-shadow-2xl">${compScore}</span>
                <span class="text-2xl text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gap Verdict -->
        <div class="text-center mb-12">
          <p class="text-4xl font-black mb-8">
            Competitive Gap: <span class="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
              ${yourScore > compScore ? 'You Lead' : yourScore < compScore ? 'Competitor Leads' : 'Neck & Neck'}
            </span>
          </p>
          <p class="text-xl text-gray-400">Target phrase: "${phrase}"</p>
        </div>

			 <!-- Small Metric Cards – Match Other Tools Design (Show Details Button) -->
        <div class="grid md:grid-cols-3 gap-8 my-16">
          ${[
            {
              name: 'Meta Title & Desc',
              you: data.meta.yourMatches > 0 ? 100 : 0,
              comp: data.meta.compMatches > 0 ? 100 : 0,
              border: data.meta.yourMatches > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Checks if your target phrase appears naturally in the page title and meta description.",
                how: "Add the keyword near the start of the title (keep under 60 chars) and include it once in the meta description (under 155 chars).",
                why: "Google uses title and description for rankings and click-through rates — pages with keyword in both see 20-30% higher CTR."
              }
            },
            {
              name: 'H1 & Headings',
              you: data.headings.yourH1Match > 0 ? 100 : 0,
              comp: data.headings.compH1Match > 0 ? 100 : 0,
              border: data.headings.yourH1Match > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Evaluates whether your main H1 heading contains the target phrase.",
                how: "Rewrite the H1 to include the exact or close-variant phrase while keeping it compelling and reader-focused.",
                why: "H1 is the strongest on-page signal for topic relevance and helps Google understand what the page is about."
              }
            },
            {
              name: 'Content Density',
              you: parseFloat(data.content.yourDensity),
              comp: parseFloat(data.content.compDensity),
              border: parseFloat(data.content.yourDensity) >= 1 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Measures how often the target phrase appears relative to total word count (ideal 1-2%).",
                how: "Add the phrase naturally in subheadings, intro, conclusion, and body — aim for 800+ words of in-depth content.",
                why: "Proper density signals relevance without stuffing; longer, keyword-optimized content dominates rankings."
              }
            },
            {
              name: 'Image Alts',
              you: data.alts.yourPhrase > 0 ? 100 : 0,
              comp: data.alts.compPhrase > 0 ? 100 : 0,
              border: data.alts.yourPhrase > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Checks if any image alt text contains the target phrase.",
                how: "Update alt text of key images (hero, featured) to include the phrase descriptively.",
                why: "Improves accessibility, enables image search traffic, and adds extra relevance signals."
              }
            },
            {
              name: 'Anchor Text',
              you: data.anchors.your > 0 ? 100 : 0,
              comp: data.anchors.comp > 0 ? 100 : 0,
              border: data.anchors.your > 0 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Looks for internal links using the target phrase as anchor text.",
                how: "Add or edit internal links to use the phrase naturally where relevant.",
                why: "Strengthens site-wide relevance and improves internal PageRank flow."
              }
            },
            {
              name: 'URL & Schema',
              you: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)),
              comp: Math.min(100, (data.urlSchema.compUrlMatch > 0 ? 50 : 0) + (data.urlSchema.compSchema ? 50 : 0)),
              border: Math.min(100, (data.urlSchema.yourUrlMatch > 0 ? 50 : 0) + (data.urlSchema.yourSchema ? 50 : 0)) >= 50 ? 'border-green-500' : 'border-red-500',
              educ: {
                what: "Combines URL keyword inclusion and structured data presence.",
                how: "Include phrase in URL slug if possible; add JSON-LD schema (FAQ, Article, etc.).",
                why: "Descriptive URLs aid crawling; schema unlocks rich snippets and better SERP visibility."
              }
            }
          ].map((m, idx) => `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-l-8 ${m.border}">
              <h4 class="text-xl font-bold text-center mb-6">${m.name}</h4>
              <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="14" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.you)}" stroke-width="14" fill="none"
                              stroke-dasharray="${(m.you / 100) * 352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-4xl font-black ${getTextColorClass(m.you)}">${Math.round(m.you)}</span>
                    </div>
                  </div>
                  <p class="mt-4 text-lg font-medium">You</p>
                </div>
                <div class="text-center">
                  <div class="relative w-32 h-32 mx-auto">
                    <svg width="128" height="128" viewBox="0 0 128 128" class="transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="14" fill="none"/>
                      <circle cx="64" cy="64" r="56" stroke="${getCircleColor(m.comp)}" stroke-width="14" fill="none"
                              stroke-dasharray="${(m.comp / 100) * 352} 352" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-4xl font-black ${getTextColorClass(m.comp)}">${Math.round(m.comp)}</span>
                    </div>
                  </div>
                  <p class="mt-4 text-lg font-medium">Comp</p>
                </div>
              </div>
              <button onclick="this.closest('div').querySelector('.educ-details').classList.toggle('hidden')"
                      class="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow">
                Show Details
              </button>
              <div class="educ-details mt-8 space-y-6">
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">What is it?</p>
                  <p class="mt-2">${m.educ.what}</p>
                </div>
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">How to fix?</p>
                  <p class="mt-2">${m.educ.how}</p>
                </div>
                <div>
                  <p class="font-semibold text-orange-600 dark:text-orange-400">Why it matters?</p>
                  <p class="mt-2">${m.educ.why}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

             <!-- Prioritized Gap Fixes – Expanded with More Metrics -->
     <div class="space-y-8">
       <h3 class="text-4xl font-black text-center mb-8">Prioritized Gap Fixes</h3>
       ${fixes.length ? fixes.map(fix => {
                  let educ = {};
         if (fix.includes('title and meta description')) {
           educ = {
             what: `Your page title or meta description does not contain the target phrase "${phrase}" — this is one of the strongest direct relevance signals search engines look for.`,
             how: `• Place the exact phrase naturally near the beginning of the <title> tag
• Keep the full title under 60 characters to avoid truncation in search results
• Include the phrase once in the meta description (keep under 155 characters)
• Make both compelling and click-worthy while staying relevant

Example title: "${phrase.charAt(0).toUpperCase() + phrase.slice(1)} | Your Brand"
Example description: "Discover the best ${phrase} with expert tips, guides, and recommendations."`,
             why: `Search engines use title and meta description to:
• Determine page relevance and ranking position
• Generate the blue link and snippet users see in results
• Influence click-through rates (pages with keyword in both often see 20–30% higher CTR)
Strong meta optimization is one of the highest-ROI on-page changes.`
           };
         } else if (fix.includes('content depth')) {
           educ = {
             what: `Your main content has only ${yourWords} words${compWords > yourWords ? ` — that's ${compWords - yourWords} fewer than your competitor's ${compWords} words` : ''}. Comprehensive coverage is increasingly important for ranking.`,
             how: `Expand with genuinely valuable additions:
• Detailed FAQ section answering real user questions about "${phrase}"
• Step-by-step guides or tutorials
• Real examples, case studies, or customer scenarios
• Relevant statistics, research findings, or data
• Comparison tables, pros/cons, or decision frameworks
• Practical tips, checklists, or actionable advice
• Related subtopics that deepen understanding

Target 800–1500+ words of focused, high-quality content while maintaining readability and natural phrase usage.`,
             why: `In-depth content wins because it:
• Demonstrates expertise and topical authority (key E-E-A-T factor)
• Provides more context for natural keyword and semantic term usage
• Improves user satisfaction and dwell time signals
• Better satisfies complex search intent
• Consistently outranks thin or superficial pages in competitive SERPs`
           };
         } else if (fix.includes('H1 heading')) {
           educ = {
             what: `Your main H1 heading does not include the target phrase "${phrase}" — this is the most prominent heading and a primary relevance indicator.`,
             how: `Rewrite your H1 to:
• Include the exact or close-variant phrase
• Keep it benefit-focused and compelling for readers
• Make it unique (avoid duplicating the title tag)
• Use proper hierarchy (only one H1 per page)

Good example: "Best ${phrase.charAt(0).toUpperCase() + phrase.slice(1)}: Complete Guide & Recommendations"`,
             why: `The H1 is the strongest on-page heading signal because:
• It tells search engines the primary topic at a glance
• Appears prominently in browser tabs and SERP previews
• Helps structure content for both users and crawlers
• Directly influences relevance scoring for the target phrase`
           };
         } else if (fix.includes('content density')) {
           educ = {
             what: `The target phrase appears only ${yourContentMatches} time(s) in your main content (${data.content.yourDensity}% density) — below optimal levels for strong relevance.`,
             how: `Improve natural placement by:
• Using the phrase in introduction and conclusion
• Including it in 2–3 subheadings (H2/H3)
• Weaving it into body paragraphs where contextually relevant
• Adding related semantic variations
• Aim for 1–2% density (3–6 occurrences per 1000 words)

Focus on reader value — never force repetition.`,
             why: `Optimal density matters because it:
• Reinforces topical relevance without triggering over-optimization flags
• Provides multiple internal context signals
• Helps search engines confirm the page's focus
• Supports featured snippet and "People Also Ask" eligibility
Balanced, natural usage outperforms both under- and over-optimized content.`
           };
         } else if (fix.includes('image alt text')) {
           educ = {
             what: `None of your image alt attributes contain the target phrase "${phrase}" — a missed opportunity for relevance and accessibility.`,
             how: `Update key images with descriptive alt text:
• Hero/main images: primary focus
• Featured/product images: high visibility
• Infographics or illustrative photos

Examples:
alt="${phrase.charAt(0).toUpperCase() + phrase.slice(1)} with ocean views"
alt="Luxury accommodation in ${phrase} – swimming pool at sunset"

Keep descriptive, concise, and user-focused.`,
             why: `Optimized alt text:
• Improves accessibility for screen readers
• Enables image search traffic and visibility
• Adds another on-page relevance signal
• Supports rich results and universal search blending
• Helps search engines understand visual content context`
           };
         } else if (fix.includes('anchor text')) {
           educ = {
             what: `No internal links on your page use the target phrase "${phrase}" as anchor text — missing internal relevance distribution.`,
             how: `Add or update internal links:
• Link to related pages using the exact or partial phrase
• Place in contextually relevant paragraphs
• Use natural variations (e.g., "best ${phrase}", "top ${phrase} options")
• Target 2–4 internal links where logical

Example: See our guide to <a href="/related">luxury ${phrase}</a>.`,
             why: `Strategic anchor text:
• Distributes page authority and relevance across your site
• Helps search engines understand site structure and topic clusters
• Improves user navigation and experience
• Strengthens topical authority for the phrase site-wide`
           };
         } else if (fix.includes('URL slug')) {
           educ = {
             what: `Your page URL does not include the target phrase "${phrase}" — descriptive URLs are a direct relevance factor.`,
             how: `If possible, restructure the URL to include the phrase:
• Keep it short, readable, and lowercase
• Use hyphens to separate words
• Avoid stop words and parameters

Ideal format: yoursite.com/${phrase.replace(/\s+/g, '-')}

Redirect old URL properly if changing.`,
             why: `Keyword-rich URLs:
• Provide clear relevance signals at crawl time
• Appear cleaner and more trustworthy in search results
• Often achieve higher click-through rates
• Support breadcrumb navigation and SERP formatting`
           };
         } else if (fix.includes('structured data')) {
           educ = {
             what: `Your page lacks structured data (JSON-LD schema markup) — search engines can't fully understand your content type and details.`,
             how: `Add appropriate schema via a <script type="application/ld+json"> block:
• FAQPage — if you have FAQs
• Article or HowTo — for guides
• LocalBusiness or Hotel — for location-based
• Product or Offer — for commercial pages

Use schema.org validator to test implementation.`,
             why: `Schema markup:
• Enables rich snippets (stars, FAQs, prices in SERPs)
• Improves click-through rates dramatically
• Helps search engines extract entities and relationships
• Supports voice search and featured results
• Future-proofs your content for evolving search features`
           };
         }
         return `
           <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border-l-8 border-red-500">
             <div class="flex gap-6 items-start">
               <div class="text-5xl">🔧</div>
               <div class="flex-1">
                 <p class="text-2xl font-bold mb-4">${fix}</p>
                 <button onclick="this.closest('div').querySelector('.fix-details').classList.toggle('hidden')"
                         class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow">
                   Show Details
                 </button>
                 <div class="fix-details mt-8 space-y-6 hidden">
                   <div>
                     <p class="font-semibold text-orange-600 dark:text-orange-400">What is it?</p>
                     <p class="mt-2">${educ.what || ''}</p>
                   </div>
                   <div>
                     <p class="font-semibold text-orange-600 dark:text-orange-400">How to fix?</p>
                     <p class="mt-2">${educ.how || ''}</p>
                   </div>
                   <div>
                     <p class="font-semibold text-orange-600 dark:text-orange-400">Why it matters?</p>
                     <p class="mt-2">${educ.why || ''}</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         `;
       }).join('') : `
         <div class="text-center p-12 bg-green-50 dark:bg-green-900/20 rounded-2xl border-l-8 border-green-500">
           <p class="text-3xl font-bold text-green-600 dark:text-green-400">
             🎉 Strong position — no major gaps detected!
           </p>
           <p class="mt-4 text-xl text-gray-600 dark:text-gray-300">
             Your page shows excellent on-page optimization for "${phrase}".
           </p>
         </div>
       `}
     </div>

        <!-- Predictive Rank Forecast -->
        <div class="mt-20 p-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-3xl shadow-2xl">
          <h3 class="text-4xl font-black text-center mb-8">Predictive Rank Forecast</h3>
          <p class="text-center text-6xl font-black mb-8">${forecastTier}</p>
          <div class="grid md:grid-cols-3 gap-8 mb-8">
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Your Score</p>
              <p class="text-5xl font-black mt-2">${yourScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Competitor Score</p>
              <p class="text-5xl font-black mt-2">${compScore}/100</p>
            </div>
            <div class="p-6 bg-white/10 rounded-2xl text-center">
              <p class="text-xl opacity-90">Gap</p>
              <p class="text-4xl font-black mt-2">${gap}</p>
            </div>
          </div>
          <p class="text-center text-lg opacity-90 leading-relaxed">
            This on-page phrase power comparison indicates relative relevance strength. Higher scores correlate with better ranking potential for the target phrase, though off-page factors (backlinks, domain authority) also play a major role.
          </p>
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
  });
});