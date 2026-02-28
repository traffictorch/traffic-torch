import { renderPluginSolutions } from './plugin-solutions-v1.0.js';
import { canRunTool } from '/main-v1.1.js';
import { initShareReport } from './share-report-v1.js';
import { initSubmitFeedback } from './submit-feedback-v1.js';

const API_BASE = 'https://traffic-torch-api.traffictorch.workers.dev';
const TOKEN_KEY = 'traffic_torch_jwt';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('audit-form');
  const pageUrlInput = document.getElementById('page-url');
  const targetKeywordInput = document.getElementById('target-keyword');
  const results = document.getElementById('results');
  const PROXY = 'https://rendered-proxy-basic.traffictorch.workers.dev/';
  const progressModules = [
    "Fetching page...",
    "Analyzing metadata",
    "Content depth & density",
    "Scanning image alts",
    "Testing internal anchors",
    "Checking URL & schema",
    "Generating report"
  ];
  let currentModuleIndex = 0;
  let moduleInterval;

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
    if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
    return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  };

  const moduleHashes = {
    'Meta Title & Desc': 'meta-title-desc',
    'H1 & Headings': 'h1-headings',
    'Content Density': 'content-density',
    'Image Alts': 'image-alts',
    'Anchor Text': 'anchor-text',
    'URL & Schema': 'url-schema'
  };

  const getModuleDiagnostics = (m, data, phrase, fullUrl) => {
    const diags = [];
    if (m.name === 'Meta Title & Desc') {
      if (data.meta.titleMatch === 0) diags.push({status: '❌', issue: 'Keyword missing from meta title', how: 'Place the keyword near the start of the title (under 60 characters) for maximum relevance.'});
      else diags.push({status: '✅', issue: 'Keyword in meta title'});
      if (data.meta.descMatch === 0) diags.push({status: '❌', issue: 'Keyword missing from meta description', how: 'Include the keyword once naturally in the description (under 155 characters).'});
      else diags.push({status: '✅', issue: 'Keyword in meta description'});
    } else if (m.name === 'H1 & Headings') {
      if (data.h1.match === 0) diags.push({status: '❌', issue: 'Keyword missing from H1', how: 'Rewrite your H1 to include the keyword naturally while keeping it engaging.'});
      else diags.push({status: '✅', issue: 'Keyword in H1'});
    } else if (m.name === 'Content Density') {
      if (data.content.words < 800) diags.push({status: '❌', issue: `Low word count (${data.content.words} words)`, how: 'Expand with examples, FAQs, comparisons, or data to reach 800+ words.'});
      else diags.push({status: '✅', issue: 'Sufficient content depth'});
      const density = parseFloat(data.content.density);
      if (density < 0.5) diags.push({status: '❌', issue: 'Keyword density too low', how: 'Add the keyword naturally in intro, subheads, and body (aim for 1-2%).'});
      else if (density > 3) diags.push({status: '❌', issue: 'Keyword density too high', how: 'Reduce repetitions to appear more natural.'});
      else diags.push({status: '✅', issue: 'Good keyword density'});
    } else if (m.name === 'Image Alts') {
      if (data.alts.phrase === 0 && data.alts.total > 0) diags.push({status: '❌', issue: 'No key images have keyword in alt text', how: 'Update important images with descriptive alt text including the keyword naturally.'});
      else diags.push({status: '✅', issue: 'Keyword in image alt text'});
    } else if (m.name === 'Anchor Text') {
      if (data.anchors.count === 0) diags.push({status: '❌', issue: 'No internal anchors use the keyword', how: 'Use the keyword naturally as clickable text when linking internally.'});
      else diags.push({status: '✅', issue: 'Keyword in internal anchor text'});
    } else if (m.name === 'URL & Schema') {
      if (data.urlSchema.urlMatch === 0) diags.push({status: '❌', issue: 'Keyword missing from URL', how: 'Use a clean, hyphenated URL containing the keyword.'});
      else diags.push({status: '✅', issue: 'Keyword in URL'});
      if (data.urlSchema.schema === 0) diags.push({status: '❌', issue: 'No structured data detected', how: 'Add JSON-LD schema (Article, FAQ, etc.) in the head.'});
      else diags.push({status: '✅', issue: 'Structured data present'});
    }
    return diags;
  };

  function startSpinnerLoader() {
    results.innerHTML = `
      <div id="loader" class="flex flex-col items-center justify-center space-y-4 mt-8">
        <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p id="module-text" class="text-xl text-green-600 dark:text-green-300 font-medium"></p>
      </div>
    `;
    results.classList.remove('hidden');
    document.getElementById('module-text').textContent = progressModules[0];
    currentModuleIndex = 1;
    moduleInterval = setInterval(() => {
      if (currentModuleIndex < progressModules.length) {
        document.getElementById('module-text').textContent = progressModules[currentModuleIndex++];
      }
    }, 600);
  }
  function stopSpinnerLoader() {
    clearInterval(moduleInterval);
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }
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
const countPhrase = (text = '', phrase = '', isUrl = false) => {
  if (!text || !phrase) return 0;
  const lower = text.toLowerCase();
  const p = phrase.toLowerCase().trim();

  // Normal mode: exact phrase + cleaned version
  let matches = (lower.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  const cleanP = p.replace(/\b(in|the|a|an|of|at|on|for|and|&|near|best|top|great)\b/gi, '').trim();
  if (cleanP.length > 4) {
    matches += (lower.match(new RegExp(cleanP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  }

  // URL-friendly mode: treat hyphens as word separators, ignore stop words, match individual terms
  if (isUrl) {
    const urlWords = lower
      .replace(/https?:\/\//gi, '')           // remove protocol
      .replace(/[^a-z0-9- ]/gi, ' ')          // replace non-alphanum except hyphen/space with space
      .replace(/-/g, ' ')                     // turn hyphens into spaces
      .split(/\s+/)
      .filter(w => w.trim().length > 0);

    const phraseWords = p.split(/\s+/).filter(w => w.trim().length > 0);
    const cleanPhraseWords = cleanP.split(/\s+/).filter(w => w.trim().length > 0);

    // Count how many unique words from phrase appear in URL (case-insensitive)
    const matchedWords = new Set();
    phraseWords.forEach(word => {
      if (urlWords.includes(word)) matchedWords.add(word);
    });
    cleanPhraseWords.forEach(word => {
      if (urlWords.includes(word)) matchedWords.add(word);
    });

    // If at least half the words (rounded up) are present → count as 1 strong match
    const required = Math.ceil(phraseWords.length / 2);
    if (matchedWords.size >= required) {
      matches += 1;  // boost for partial but meaningful match
    }
  }

  return matches;
};
  const getCleanContent = (doc) => {
    if (!doc?.body) return '';
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('nav, header, footer, aside, script, style, noscript, .menu, .nav, .navbar, .footer, .cookie, .popup').forEach(el => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };
  const getWordCount = (doc) => getCleanContent(doc).split(/\s+/).filter(w => w.length > 0).length;
  const truncate = (str, len) => str.length > len ? str.slice(0, len - 3) + '...' : str;

const calculateContentScore = (content) => {
  const words = content.words;
  const density = parseFloat(content.density);
  let wordScore = 0;
  if (words > 0) {
    wordScore = Math.min(50, (words / 800) * 50);
  }
  let densityScore = 0;
  if (density >= 1 && density <= 2) {
    densityScore = 50;
  } else if (density >= 0.5 && density < 1) {
    densityScore = 50 * ((density - 0.5) / 0.5);
  } else if (density > 2 && density <= 3) {
    densityScore = 50 * ((3 - density) / 1);
  }
  return Math.round(wordScore + densityScore);
};

    form.addEventListener('submit', async e => {
      e.preventDefault();
      
    //const canProceed = await canRunTool('limit-audit-id');
    //if (!canProceed) return;
  
      const yourUrl = pageUrlInput.value.trim();
      const phrase = targetKeywordInput.value.trim();
      if (!yourUrl || !phrase) return;
      let fullUrl = yourUrl;
      if (!/^https?:\/\//i.test(yourUrl)) {
        fullUrl = 'https://' + yourUrl;
        pageUrlInput.value = fullUrl;
      }
      startSpinnerLoader();
      const yourDoc = await fetchPage(fullUrl);
      if (!yourDoc) {
        stopSpinnerLoader();
        results.innerHTML = `<p class="text-red-500 text-center text-xl p-10">Error: Page not reachable.</p>`;
        return;
      }
      
      let yourScore = 0;
      const data = {};
      const allFixes = [];

      // Meta Title & Desc
      const titleText = yourDoc.querySelector('title')?.textContent.trim() || '';
      const descText = yourDoc.querySelector('meta[name="description"]')?.content.trim() || '';
      const titleMatch = countPhrase(titleText, phrase);
      const descMatch = countPhrase(descText, phrase);
      data.meta = { titleText, descText, titleMatch, descMatch, yourMatches: titleMatch + descMatch };
      yourScore += data.meta.yourMatches > 0 ? 25 : 0;
      if (titleMatch === 0) allFixes.push({module: 'Meta Title & Desc', issue: 'Add keyword to meta title', how: 'Place the keyword near the start of the title (under 60 characters) for maximum relevance.'});
      if (descMatch === 0) allFixes.push({module: 'Meta Title & Desc', issue: 'Add keyword to meta description', how: 'Include the keyword once naturally in the description (under 155 characters) to boost click-through rates.'});

      // H1 & Headings
      const headings = Array.from(yourDoc.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 5);
      const headingsData = headings.map(h => ({ tag: h.tagName, text: h.textContent.trim(), match: countPhrase(h.textContent, phrase) > 0 }));
      const yourH1 = yourDoc.querySelector('h1')?.textContent.trim() || '';
      data.h1 = { match: countPhrase(yourH1, phrase) };
      data.headingsData = headingsData;
      yourScore += data.h1.match > 0 ? 15 : 0;
      if (data.h1.match === 0) allFixes.push({module: 'H1 & Headings', issue: 'Add keyword to H1', how: 'Rewrite your H1 to include the keyword naturally while keeping it engaging and reader-focused.'});

      // Content Density
      const cleanContent = getCleanContent(yourDoc);
      const yourWords = getWordCount(yourDoc);
      const yourContentMatches = countPhrase(cleanContent, phrase);
      const yourDensity = yourWords ? (yourContentMatches / yourWords * 100).toFixed(1) : 0;
      data.content = { words: yourWords, matches: yourContentMatches, density: yourDensity };
      yourScore += yourWords > 800 ? 20 : 0;
      if (yourWords < 800) allFixes.push({module: 'Content Density', issue: `Add depth (${800 - yourWords} words recommended)`, how: 'Expand with examples, FAQs, comparisons, or data to provide comprehensive value.'});
      if (parseFloat(yourDensity) < 0.5) allFixes.push({module: 'Content Density', issue: 'Increase keyword density', how: 'Add the keyword naturally in intro, subheads, and body (aim for 1-2%).'});

      // Image Alts
      const yourImgs = yourDoc.querySelectorAll('img');
      const matchingAlts = Array.from(yourImgs)
        .filter(img => countPhrase(img.alt || '', phrase) > 0)
        .slice(0, 5)
        .map(img => img.alt?.trim() || '(empty alt)');
      data.alts = { total: yourImgs.length, phrase: matchingAlts.length, matchingAlts };
      yourScore += matchingAlts.length > 0 ? 15 : 0;
      if (matchingAlts.length === 0 && yourImgs.length > 0) allFixes.push({module: 'Image Alts', issue: 'Add keyword to key image alts', how: 'Update important images with descriptive alt text that includes the keyword naturally.'});

      // Anchor Text
      const matchingAnchors = Array.from(yourDoc.querySelectorAll('a'))
        .filter(a => countPhrase(a.textContent || '', phrase) > 0)
        .slice(0, 5)
        .map(a => ({ text: (a.textContent || '').trim(), href: a.href }));
      data.anchors = { count: matchingAnchors.length, matchingAnchors };
      yourScore += matchingAnchors.length > 0 ? 10 : 0;
      if (matchingAnchors.length === 0) allFixes.push({module: 'Anchor Text', issue: 'Add keyword to anchor text', how: 'Use the keyword naturally as clickable text when linking to related pages.'});

      // URL & Schema
      const schemaScript = yourDoc.querySelector('script[type="application/ld+json"]');
      const schemaPresent = !!schemaScript;
      data.urlSchema = { urlMatch: countPhrase(fullUrl, phrase, true), schema: schemaPresent ? 1 : 0 };
      yourScore += (data.urlSchema.urlMatch > 0 ? 10 : 0) + (data.urlSchema.schema ? 5 : 0);
      if (data.urlSchema.urlMatch === 0) allFixes.push({module: 'URL & Schema', issue: 'Include keyword in URL', how: 'Use a clean, hyphenated URL containing the keyword and set up redirects if changing.'});
      if (data.urlSchema.schema === 0) allFixes.push({module: 'URL & Schema', issue: 'Add structured data', how: 'Add JSON-LD schema (Article or FAQ) in the head for rich results.'});

      yourScore = Math.min(100, Math.round(yourScore));
      stopSpinnerLoader();

      const moduleOrder = ['Meta Title & Desc', 'H1 & Headings', 'Content Density', 'URL & Schema', 'Image Alts', 'Anchor Text'];
      const topPriorityFixes = [];
      const moduleIssues = {};
      allFixes.forEach(f => {
        if (!moduleIssues[f.module]) moduleIssues[f.module] = [];
        moduleIssues[f.module].push(f);
      });
      moduleOrder.forEach(mod => {
        if (moduleIssues[mod] && moduleIssues[mod].length > 0) {
          topPriorityFixes.push(moduleIssues[mod][0]);
        }
      });
      if (topPriorityFixes.length < 3) {
        const topMod = topPriorityFixes.length > 0 ? topPriorityFixes[0].module : null;
        if (topMod && moduleIssues[topMod] && moduleIssues[topMod].length > 1) {
          topPriorityFixes.push(moduleIssues[topMod][1]);
        }
      }
      topPriorityFixes.length = Math.min(3, topPriorityFixes.length);
      const levels = ['Page 2+', 'Page 1 Possible', 'Top 10', 'Top 3 Potential'];
      const currentLevel = yourScore >= 90 ? 3 : yourScore >= 80 ? 2 : yourScore >= 60 ? 1 : 0;
      const projectedLevel = Math.min(3, currentLevel + (topPriorityFixes.length >= 2 ? 2 : topPriorityFixes.length));
      const hasMetaOrContent = topPriorityFixes.some(f => f.module === 'Meta Title & Desc' || f.module === 'Content Density');
      const bigGrade = getGrade(yourScore);
    
    
      const modules = [
        { name: 'Meta Title & Desc', score: data.meta.yourMatches > 0 ? 100 : 0 },
        { name: 'H1 & Headings', score: data.h1.match > 0 ? 100 : 0 },
        { name: 'Content Density', score: calculateContentScore(data.content) },
        { name: 'Image Alts', score: data.alts.phrase > 0 ? 100 : 0 },
        { name: 'Anchor Text', score: data.anchors.count > 0 ? 100 : 0 },
        { name: 'URL & Schema', score: Math.min(100, (data.urlSchema.urlMatch ? 50 : 0) + (data.urlSchema.schema ? 50 : 0)) }
      ];
      const scores = modules.map(m => m.score);
    
// Scroll to results from top of viewport + generous offset - always consistent
const offset = 280; // (adjust 80–340)

const targetY = results.getBoundingClientRect().top + window.pageYOffset - offset;

window.scrollTo({
  top: targetY,
  behavior: 'smooth'
});
    
    results.innerHTML = `
    
    
<!-- Overall Score Card (Keyword Tool / Your Page) -->
<div class="flex justify-center my-8 sm:my-12 px-4 sm:px-6">
  <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md border-4 ${yourScore >= 80 ? 'border-green-500' : yourScore >= 60 ? 'border-orange-400' : 'border-red-500'}">
    
    <p class="text-center text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-6">Your Page</p>
    
    <!-- Responsive SVG wrapper -->
    <div class="relative aspect-square w-full max-w-[240px] sm:max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" class="w-full h-full transform -rotate-90">
        <circle cx="100" cy="100" r="90" stroke="#e5e7eb" stroke-width="16" fill="none"/>
        <circle cx="100" cy="100" r="90"
                stroke="${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'}"
                stroke-width="16" fill="none"
                stroke-dasharray="${(yourScore / 100) * 565} 565"
                stroke-linecap="round"/>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl sm:text-6xl font-black drop-shadow-lg"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
            ${yourScore}
          </div>
          <div class="text-lg sm:text-xl opacity-80 -mt-1"
               style="color: ${yourScore >= 80 ? '#22c55e' : yourScore >= 60 ? '#fb923c' : '#ef4444'};">
            /100
          </div>
        </div>
      </div>
    </div>

    ${(() => {
      const title = (yourDoc?.title || '').trim();
      if (!title) return '';
      const truncated = title.length > 65 ? title.substring(0, 65) + '...' : title;
      return `<p id="analyzed-page-title" class="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-200 text-center px-3 sm:px-4 leading-tight">${truncated}</p>`;
    })()}

    <div class="mt-6 text-center">
      <p class="text-5xl sm:text-6xl font-bold ${bigGrade.color} drop-shadow-lg">
        ${bigGrade.emoji} ${bigGrade.grade}
      </p>
    </div>
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



<!-- Small Metric Circles -->
<div class="grid md:grid-cols-3 gap-8 my-16">
  ${[
    {name: 'Meta Title & Desc', what: 'Checks if your target keyword appears naturally in the page title and meta description. These are the first elements Google reads and displays in search results. Optimized titles and descriptions directly impact visibility and user clicks.', how: 'Place the keyword near the beginning of the title (keep total under 60 characters). Include it once naturally in the meta description (under 155 characters). Make both compelling and relevant to the user\'s search intent.', why: 'Pages with the exact keyword in title and description often rank higher and achieve 20-30% better click-through rates. These elements signal strong relevance to search engines. They also build trust and expectation before the user even visits your page.'},
    {name: 'H1 & Headings', what: 'Evaluates whether your main H1 heading contains the target keyword. Headings structure content and help search engines understand hierarchy and topic relevance. The H1 carries the strongest weight.', how: 'Rewrite your H1 to include the exact keyword or a close natural variant while keeping it engaging for readers. Avoid stuffing — only use it if it fits naturally. Support with keyword-rich H2/H3 where relevant.', why: 'A keyword-optimized H1 is one of the strongest on-page signals for topical relevance. It helps both search engines and users quickly grasp what the page is about. Well-structured headings also improve readability and dwell time.'},
    {name: 'Content Density', what: 'Measures how often the target keyword appears relative to total word count. Also evaluates overall content length. Ideal density is 1-2% with substantial depth.', how: 'Expand content with valuable sections like examples, FAQs, data, or comparisons to reach 800+ words. Include the keyword naturally in introduction, subheadings, body, and conclusion. Reduce repetitions if density exceeds 3%.', why: 'Longer, well-optimized content consistently outranks shorter pages on the same topic. Proper density signals relevance without stuffing. Comprehensive content satisfies user intent better, leading to higher engagement and rankings.'},
    {name: 'Image Alts', what: 'Scans image alt texts for the presence of your target keyword in relevant images. Alt text describes images for screen readers and search engines. It\'s crucial for accessibility and SEO.', how: 'Write descriptive alt text for important images that naturally includes the keyword where appropriate. Avoid stuffing — only use it if it accurately describes the image. Leave decorative images with empty alt="".', why: 'Optimized alt text improves accessibility compliance and user experience. It enables ranking in Google Images, driving extra traffic. It also provides another contextual relevance signal to search engines.'},
    {name: 'Anchor Text', what: 'Looks for internal links using the target keyword or variations in their visible anchor text. Anchor text helps search engines understand linked page topics. It distributes authority within your site.', how: 'When linking to related content on your site, use the keyword naturally as part or all of the clickable text. Vary with close variants to avoid over-optimization. Link contextually from relevant sections.', why: 'Keyword-rich internal anchors reinforce site structure and topical clusters. They help search engines crawl and understand relationships between pages. Natural internal linking improves user navigation and time on site.'},
    {name: 'URL & Schema', what: 'Checks if the keyword appears in the page URL and if structured data (JSON-LD schema) is present. Both are important direct relevance and enhancement signals.', how: 'Create clean, descriptive URLs with hyphens including the keyword. Add JSON-LD script in the head for relevant schema types (Article, FAQ, Product, etc.). Use Google\'s structured data guidelines.', why: 'Keyword in URL reinforces topic relevance and improves click rates from search results. Schema markup enables rich snippets that stand out and increase visibility. Both contribute to higher perceived authority and CTR.'}
  ].map(m => {
    let score, details, fixEdu;
    if (m.name === 'Meta Title & Desc') {
      score = data.meta.yourMatches > 0 ? 100 : 0;
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.meta.titleMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Title:</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(data.meta.titleText || '(none)', 80)}</span><br>
          ${data.meta.descMatch > 0 ? '✅' : '❌'} <span class="font-bold">Meta Description:</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(data.meta.descText || '(none)', 80)}</span>
        </div>`;
      fixEdu = data.meta.yourMatches === 0 ?
        `The target keyword "${phrase}" is missing from both your title and meta description. This is a critical missed opportunity because search engines heavily weigh these elements when determining relevance. Adding the keyword naturally improves visibility and click-through rates significantly.` :
        data.meta.titleMatch === 0 ?
        `Your meta title is missing the target keyword. The title tag is the strongest on-page ranking factor and appears prominently in search results. Including the keyword early in the title helps Google match user queries better.` :
        data.meta.descMatch === 0 ?
        `Your meta description lacks the keyword. While it doesn't directly affect rankings, it influences click-through rates from search results. A compelling description with the keyword encourages more clicks.` : '';
    } else if (m.name === 'H1 & Headings') {
      score = data.h1.match > 0 ? 100 : 0;
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.headingsData.length > 0 ? data.headingsData.map(h =>
            `${h.match ? '✅' : ''} <span class="font-bold">${h.tag}:</span> <span class="text-gray-800 dark:text-gray-200">${truncate(h.text, 60)}</span>`
          ).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">No headings found</span>'}
        </div>`;
      fixEdu = data.h1.match === 0 ?
        `Your main H1 heading does not contain the target keyword. The H1 is the most important heading and tells search engines the primary topic of the page. Without the keyword here, Google may struggle to understand your page focus clearly.` : '';
    } else if (m.name === 'Content Density') {
  score = calculateContentScore(data.content);
      details = `
        <div class="mt-4 text-center space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Word count:</span> ${data.content.words}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Keyword mentions:</span> ${data.content.matches}</p>
          <p class="text-gray-800 dark:text-gray-200"><span class="font-bold">Density:</span> ${data.content.density}% (ideal 1-2%)</p>
        </div>`;
      fixEdu = (() => {
        let edu = '';
        if (data.content.words < 800) edu += `Your page has only ${data.content.words} words — well below the recommended 800+ for in-depth coverage. Thin content struggles to rank against comprehensive competitors. `;
        if (data.content.density < 0.5) edu += `The keyword appears only ${data.content.matches} times, resulting in very low density. Search engines may not recognize strong topical relevance. `;
        if (data.content.density > 3) edu += `Density is too high at ${data.content.density}%. Over-repetition can appear unnatural and risk penalties. `;
        edu += 'Density is calculated as (keyword mentions ÷ total words) × 100.';
        return edu;
      })();
    } else if (m.name === 'Image Alts') {
      score = data.alts.phrase > 0 ? 100 : 0;
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200 font-bold">Matching alts (${data.alts.phrase}/${data.alts.total} images):</p>
          ${data.alts.matchingAlts.length > 0 ? data.alts.matchingAlts.map(alt => `✅ <span class="text-gray-800 dark:text-gray-200">${truncate(alt, 60)}</span>`).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">None found</span>'}
        </div>`;
      fixEdu = data.alts.phrase === 0 && data.alts.total > 0 ?
        `None of your ${data.alts.total} images have the target keyword in alt text. This misses opportunities for accessibility, image search traffic, and additional relevance signals. Focus on key images like hero or product photos first.` : '';
    } else if (m.name === 'Anchor Text') {
      score = data.anchors.count > 0 ? 100 : 0;
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          <p class="text-gray-800 dark:text-gray-200 font-bold">Matching anchors (${data.anchors.count} found):</p>
          ${data.anchors.matchingAnchors.length > 0 ? data.anchors.matchingAnchors.map(a => `✅ <span class="text-gray-800 dark:text-gray-200">${truncate(a.text, 50)}</span> → ${truncate(a.href, 40)}`).join('<br>') : '<span class="text-gray-800 dark:text-gray-200">None found</span>'}
        </div>`;
      fixEdu = data.anchors.count === 0 ?
        `No internal links use the target keyword in anchor text. This misses a chance to strengthen topical authority flow across your site. Aim for 1-3 natural keyword anchors linking to relevant internal pages.` : '';
    } else if (m.name === 'URL & Schema') {
      score = Math.min(100, (data.urlSchema.urlMatch ? 50 : 0) + (data.urlSchema.schema ? 50 : 0));
      details = `
        <div class="mt-4 text-left space-y-2 text-sm">
          ${data.urlSchema.urlMatch > 0 ? '✅' : '❌'} <span class="font-bold">Keyword in URL</span><br>
          <span class="text-gray-800 dark:text-gray-200">${truncate(fullUrl, 80)}</span><br>
          ${data.urlSchema.schema ? '✅' : '❌'} <span class="font-bold">Structured Data (Schema)</span>
        </div>`;
      fixEdu = (() => {
        let edu = '';
        if (!data.urlSchema.urlMatch) edu += `Your URL does not contain the target keyword. This is a clear missed relevance signal that both users and search engines expect. `;
        if (!data.urlSchema.schema) edu += `No structured data (schema markup) detected. This prevents eligibility for rich results like stars, FAQs, or enhanced snippets in search.`;
        return edu;
      })();
    }
    const borderColor = score >= 80 ? 'border-green-500' : score >= 60 ? 'border-yellow-500' : 'border-red-500';
    const textColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
    const grade = getGrade(Math.round(score));
    const diagnostics = getModuleDiagnostics({name: m.name}, data, phrase, fullUrl);
    const hasIssues = diagnostics.some(d => d.status === '❌');
    const hashId = moduleHashes[m.name] || '';
return `
      <div class="text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-4 ${borderColor}">
        <h4 class="text-xl font-medium mb-4">${m.name}</h4>
        <div class="relative w-28 h-28 mx-auto">
          <svg width="112" height="112" viewBox="0 0 112 112" class="transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#e5e7eb" stroke-width="12" fill="none"/>
            <circle cx="56" cy="56" r="48" stroke="${score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}"
                    stroke-width="12" fill="none" stroke-dasharray="${(score / 100) * 301} 301" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-4xl font-black ${textColor}">${Math.round(score)}</div>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-2xl font-bold ${grade.color}">
            ${grade.emoji} ${grade.grade}
          </div>
        </div>
        ${details}
        <button onclick="this.parentElement.querySelector('.fixes-panel').classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm">
          Show Fixes
        </button>
        <div class="fixes-panel hidden mt-6 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <div class="text-center mb-6">
            <div class="text-3xl">${grade.emoji}</div>
            <div class="text-2xl font-black ${grade.color}">${m.name}</div>
            <div class="text-xl font-bold ${grade.color} mt-2">${grade.grade}</div>
          </div>
          <div class="space-y-4 text-left">
            ${diagnostics.map(d => `
              <div class="flex items-start gap-3">
                <span class="text-xl mt-1">${d.status}</span>
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-200">${d.issue}</p>
                  ${d.how ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${d.how}</p>` : ''}
                </div>
              </div>
            `).join('')}
            ${!hasIssues ? '<p class="text-center text-green-600 dark:text-green-400 font-bold text-lg">🎉 This module is fully optimized!</p>' : ''}
          </div>
          <div class="text-center mt-8 pt-6 border-t border-red-200 dark:border-red-700">
            <a href="/keyword-tool/#${hashId}" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              Learn more about ${m.name}
            </a>
          </div>
        </div>
        <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm">
          More Details
        </button>
        <div class="hidden mt-6 space-y-6 text-left text-sm">
          <div class="text-center mb-4">
            <a href="/keyword-tool/#${hashId}" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              How ${m.name} is tested?
            </a>
          </div>
          ${fixEdu ? `<h5 class="text-lg font-bold text-orange-600 dark:text-orange-400 mb-3">Recommended Fixes</h5><p class="text-gray-800 dark:text-gray-200">${fixEdu}</p>` : ''}
          <p class="text-blue-600 dark:text-blue-400 font-bold">What is it?</p><p class="text-gray-800 dark:text-gray-200">${m.what}</p>
          <p class="text-green-600 dark:text-green-400 font-bold mt-3">How to fix?</p><p class="text-gray-800 dark:text-gray-200">${m.how}</p>
          <p class="text-orange-600 dark:text-orange-400 font-bold mt-3">Why it matters?</p><p class="text-gray-800 dark:text-gray-200">${m.why}</p>
          <div class="text-center mt-8 pt-6 border-t border-gray-300 dark:border-gray-700">
            <a href="/keyword-tool/#${hashId}" class="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              Learn more about ${m.name}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('')}
</div>

<!-- Top Priority Fixes -->
<div class="my-16">
  <h3 class="text-4xl font-bold text-center text-orange-600 mb-8">Top Priority Fixes</h3>
  ${topPriorityFixes.length ? `
    <div class="space-y-8 max-w-4xl mx-auto">
      ${topPriorityFixes.map((fix, i) => {
        const isSecond = i > 0 && fix.module === topPriorityFixes[0].module;
        return `
          <div class="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-l-8 border-orange-500 flex gap-6">
            <div class="text-5xl font-black text-orange-600">${i+1}</div>
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">${fix.module}</span>
                ${isSecond ? '<span class="text-sm text-orange-600 dark:text-orange-400">(multiple issues in this module)</span>' : ''}
              </div>
              <h4 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">${fix.issue}</h4>
              <p class="text-gray-800 dark:text-gray-200">${fix.how}</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '<p class="text-center text-green-500 text-2xl font-bold">Strong optimization — keep it up!</p>'}
</div>
<!-- Score Improvement & Potential Gains -->
<div class="max-w-6xl mx-auto my-20 grid md:grid-cols-2 gap-8">
  <!-- Left: Ranking Potential Improvement -->
  <div class="p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-4 border-orange-500/20">
    <h3 class="text-4xl font-black text-center mb-10 text-orange-600 dark:text-orange-400">Ranking Potential Improvement</h3>
    <div class="flex justify-center items-baseline gap-8 mb-10">
      <div class="text-center">
        <div class="px-4 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-2xl font-bold text-gray-600 dark:text-gray-400">
          ${levels[currentLevel]}
        </div>
        <p class="text-lg mt-3 text-gray-600 dark:text-gray-400">Current</p>
      </div>
      <div class="text-5xl text-orange-500">→</div>
      <div class="text-center">
        <div class="px-4 py-4 bg-green-100 dark:bg-green-900/30 rounded-2xl text-2xl font-bold text-green-700 dark:text-green-300">
          ${levels[projectedLevel]}
        </div>
        <p class="text-lg mt-3 text-gray-600 dark:text-gray-400">Projected</p>
      </div>
    </div>
    ${topPriorityFixes.length ? `
      <div class="space-y-4">
        <p class="text-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">Top priority fixes & impact:</p>
        ${topPriorityFixes.map((fix, i) => `
<div class="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800">
  <div class="flex items-start gap-4">
    <!-- Number -->
    <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 text-xl font-bold text-orange-700 dark:text-orange-300">
      ${i+1}
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
        <span class="font-bold text-orange-700 dark:text-orange-300">${fix.issue}</span>
        <br class="sm:hidden">
        ${fix.how}
      </p>
    </div>
  </div>
</div>
        `).join('')}
      </div>
    ` : `
      <div class="text-center py-10">
        <p class="text-4xl mb-4">🎉 Excellent Optimization!</p>
        <p class="text-xl text-gray-600 dark:text-gray-400">Your on-page SEO is strong. Focus on backlinks and content freshness for further gains.</p>
      </div>
    `}
    <details class="mt-10">
      <summary class="cursor-pointer text-lg font-bold text-orange-600 dark:text-orange-400 hover:underline">How We Calculated This</summary>
      <div class="mt-6 space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
        <p>• Based on proven on-page factors that correlate with higher rankings in large-scale studies.</p>
        <p>• Each critical fix typically improves relevance signals and user satisfaction.</p>
        <p>• Projected level assumes all top fixes are implemented naturally.</p>
        <p class="italic">Conservative estimate — actual improvement can be higher depending on competition.</p>
      </div>
    </details>
  </div>
  <!-- Right: Expected Performance Gains -->
  <div class="p-4 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-3xl shadow-2xl">
    <h3 class="text-4xl font-black text-center mb-10">Expected Performance Gains</h3>
    <div class="space-y-8">
      <div class="flex items-center gap-6">
        <div class="text-5xl">🖱️</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Click-Through Rate (CTR)</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg transition-all duration-700"
                 style="width: ${hasMetaOrContent ? 75 : 50}%; background-color: ${hasMetaOrContent ? '#86efac' : '#fca5a5'};">
              +${hasMetaOrContent ? '25–40' : '15–30'}%
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-5xl">📈</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Impressions</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg transition-all duration-700"
                 style="width: ${topPriorityFixes.length * 20}%; background-color: ${topPriorityFixes.length >= 2 ? '#86efac' : topPriorityFixes.length === 1 ? '#fdba74' : '#fca5a5'};">
              +${topPriorityFixes.length * 15}–${topPriorityFixes.length * 30}%
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-5xl">📊</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Average Position</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg transition-all duration-700"
                 style="width: ${hasMetaOrContent ? 70 : 55}%; background-color: ${hasMetaOrContent ? '#86efac' : '#fca5a5'};">
              ↑ ${hasMetaOrContent ? '4–8' : '2–5'} spots
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-5xl">🚀</div>
        <div class="flex-1">
          <p class="text-xl font-medium">Organic Traffic</p>
          <div class="mt-2 w-full bg-white/30 rounded-full h-10 overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-end pr-6 font-black text-lg transition-all duration-700"
                 style="width: ${topPriorityFixes.length * 25}%; background-color: ${topPriorityFixes.length >= 2 ? '#86efac' : topPriorityFixes.length === 1 ? '#fdba74' : '#fca5a5'};">
              +${topPriorityFixes.length * 20}–${topPriorityFixes.length * 45}%
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-10 space-y-3 text-sm leading-relaxed text-white dark:text-gray-200">
      <p>Conservative estimates based on pages with similar optimization levels.</p>
      <p>Track changes in Google Search Console (Impressions, CTR, Average Position).</p>
      <p>Expect movement within 7–30 days after indexing.</p>
    </div>
  </div>
</div>
<!-- PDF Button -->
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
     Submit Feedback 💬
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
        <input id="share-title" type="text" required placeholder="Traffic Torch Keyword Report" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500">
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
        Feedback for Keyword Tool on <strong>${document.body.getAttribute('data-url') || 'the analyzed page'}</strong>
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
    
// === Plugin Solutions - adapted for Keyword Tool (4 metrics only) ===
const pluginSection = document.createElement('div');
pluginSection.id = 'plugin-solutions-section';
pluginSection.className = 'mt-20';
results.appendChild(pluginSection);
// Collect failed/average metrics that plugins can solve (using existing data object)
const failedMetrics = [];
// 1. Meta Title (missing keyword or empty = fail)
if (data.meta.titleMatch === 0 || !data.meta.titleText || data.meta.titleText.trim() === '') {
  failedMetrics.push({ name: "Meta Title", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}
// 2. Meta Description (missing or empty = fail)
if (data.meta.descMatch === 0 || !data.meta.descText || data.meta.descText.trim() === '') {
  failedMetrics.push({ name: "Meta Description", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}
// 3. Structured Data (Schema) - missing = fail
if (data.urlSchema.schema === 0) {
  failedMetrics.push({ name: "Structured Data (Schema)", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}
// 4. Image Alts (no keyword in alts on pages with images = fail)
if (data.alts.phrase === 0 && data.alts.total > 0) {
  failedMetrics.push({ name: "Image Alts", grade: { text: "Needs Work", color: "text-red-600", emoji: "❌" } });
}
// Render only if we have fixes
if (failedMetrics.length > 0) {
  renderPluginSolutions(failedMetrics);
}
    
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
      
      
  });
});