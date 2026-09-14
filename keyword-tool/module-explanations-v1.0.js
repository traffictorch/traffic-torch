const moduleExplanations = [
  {
    id: 'meta-title-desc',
    emoji: '📝',
    name: 'Meta Title & Desc',
    what: 'Checks if your target keyword appears naturally in the page title and meta description. These are the first elements Google reads and displays in search results. Optimized titles and descriptions directly impact visibility and user clicks. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool scans the &lt;title&gt; tag and meta description for the exact or close-match keyword phrase. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Pages with the exact keyword in title and description often rank higher and achieve 20-30% better click-through rates. These elements signal strong relevance to search engines. They also build trust and expectation before the user even visits your page. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'h1-headings',
    emoji: '🔤',
    name: 'H1 & Headings',
    what: 'Evaluates whether your main H1 heading contains the target keyword. Headings structure content and help search engines understand hierarchy and topic relevance. The H1 carries the strongest weight. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool checks the first &lt;h1&gt; tag and scans other headings (H2–H6) for keyword presence. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'A keyword-optimized H1 is one of the strongest on-page signals for topical relevance. It helps both search engines and users quickly grasp what the page is about. Well-structured headings also improve readability and dwell time. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'content-density',
    emoji: '📄',
    name: 'Content Density',
    what: 'Measures how often the target keyword appears relative to total word count. Also evaluates overall content length. Ideal density is 1-2% with substantial depth (800+ words recommended). <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Word count is calculated from main content (excluding navigation, footers, etc.). Keyword mentions are counted, then density is computed as (mentions ÷ words) × 100. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Longer, well-optimized content consistently outranks shorter pages on the same topic. Proper density signals relevance without stuffing. Comprehensive content satisfies user intent better, leading to higher engagement and rankings. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'image-alts',
    emoji: '🖼️',
    name: 'Image Alts',
    what: 'Scans image alt texts for the presence of your target keyword in relevant images. Alt text describes images for screen readers and search engines. It’s crucial for accessibility and SEO. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'All &lt;img&gt; tags are scanned and alt attributes checked for keyword matches. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Optimized alt text improves accessibility compliance and user experience. It enables ranking in Google Images, driving extra traffic. It also provides another contextual relevance signal to search engines. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'anchor-text',
    emoji: '🔗',
    name: 'Anchor Text',
    what: 'Looks for internal links using the target keyword or variations in their visible anchor text. Anchor text helps search engines understand linked page topics and builds topical clusters. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Internal &lt;a&gt; tags are analyzed for visible text containing the keyword. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword-rich internal anchors reinforce site structure and topical clusters. They help search engines crawl and understand relationships between pages. Natural internal linking improves user navigation and time on site. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'url-schema',
    emoji: '🌐',
    name: 'URL & Schema',
    what: 'Checks if the keyword appears in the page URL and if structured data (JSON-LD schema) is present. Both are important direct relevance and enhancement signals. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The URL string is checked for the keyword (with hyphen-aware matching). The page is scanned for &lt;script type="application/ld+json"&gt; tags. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword in URL reinforces topic relevance and improves click rates from search results. Schema markup enables rich snippets that stand out and increase visibility. Both contribute to higher perceived authority and CTR. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  }
];

/* ============================================================
   FIX HINTS — pattern-matched fix explanations
   Used by the score-card panel when a diagnostic has no `how`.
   First matching pattern wins.
   ============================================================ */
export const fixHints = [
  // ---- Meta Title & Description ----
  { pattern: /keyword missing from meta title/i,        fix: 'Add the target keyword near the beginning of your <title> tag, ideally within the first 60 characters. Use your CMS SEO plugin (Yoast, Rank Math, AIOSEO) or edit the <head> directly.' },
  { pattern: /keyword missing from meta description/i,  fix: 'Include the target keyword once naturally in your meta description, keep it under 155 characters, and add a clear call-to-action to improve CTR.' },
  { pattern: /keyword in meta title/i,                  fix: 'Good — your keyword is in the title. Ensure it appears near the start for maximum weight and stays under 60 characters.' },
  { pattern: /keyword in meta description/i,            fix: 'Nice — your meta description contains the keyword. Keep it natural and under 155 characters.' },
  { pattern: /meta title.*(too long|over 60|longer than 60)/i,       fix: 'Shorten the title tag to 50–60 characters. Front-load the keyword and remove filler words.' },
  { pattern: /meta description.*(too long|over 155|longer than 155)/i, fix: 'Trim the meta description to under 155 characters while preserving the keyword and primary benefit.' },

  // ---- H1 & Headings ----
  { pattern: /keyword missing from h1/i,                fix: 'Rewrite your H1 to naturally include the target keyword while keeping it reader-friendly. Ensure only one H1 per page.' },
  { pattern: /keyword in h1/i,                          fix: 'Great — your H1 contains the keyword. Ensure supporting H2s reinforce the topic semantically.' },
  { pattern: /no h1|missing h1 tag/i,                   fix: 'Add a single H1 containing the target keyword. In WordPress use the post title; in custom HTML wrap the main heading in <h1>.' },
  { pattern: /multiple h1/i,                            fix: 'Consolidate to one H1 per page. Demote extra top-level headings to H2.' },
  { pattern: /heading hierarchy|skipped heading/i,      fix: 'Fix heading nesting: H1 → H2 → H3 with no skipped levels. This helps screen readers and search engines parse your structure.' },

  // ---- Content Density ----
  { pattern: /low word count|content.*(thin|short)/i,   fix: 'Expand the page to 800+ words with examples, FAQs, comparisons, or original data. Fully answer the user\'s search intent.' },
  { pattern: /sufficient content depth/i,               fix: 'Content length is solid. Keep refreshing with new examples and data to maintain authority.' },
  { pattern: /keyword density too low/i,                fix: 'Add the target keyword naturally in the intro, one H2, and the conclusion. Target 1–2% density (roughly 8–16 mentions per 800 words).' },
  { pattern: /keyword density too high|stuffing/i,      fix: 'Reduce keyword repetitions and introduce semantic variations (LSI terms, synonyms, related entities) to sound natural.' },
  { pattern: /good keyword density/i,                   fix: 'Density is healthy. Re-check after each content edit to avoid accidental stuffing.' },
  { pattern: /content.*no keyword/i,                    fix: 'Ensure the target keyword appears in the body text, not just the title and headings.' },

  // ---- Image Alts ----
  { pattern: /no key images have keyword in alt|no.*keyword.*alt|images.*keyword/i, fix: 'Add descriptive alt text to important images that naturally includes the target keyword. Aim for 5–10 words per image.' },
  { pattern: /keyword in image alt text/i,              fix: 'Good — keyword appears in image alt text. Ensure it stays relevant to the image content.' },
  { pattern: /missing alt|images without alt/i,         fix: 'Every meaningful image needs descriptive alt text. Decorative images can use alt="". Update via your CMS media library or HTML.' },
  { pattern: /all images missing alt/i,                 fix: 'Add alt attributes to every <img> tag. Prioritize hero, product, and instructional images first.' },
  { pattern: /generic alt|alt.*image\d/i,               fix: 'Replace generic alt text (e.g., "image1.jpg") with a short, descriptive phrase that includes the keyword where relevant.' },
  { pattern: /alt text too long/i,                      fix: 'Keep alt text under 125 characters — screen readers truncate longer text.' },

  // ---- Anchor Text ----
  { pattern: /no internal anchors use the keyword|no internal anchors/i, fix: 'Add 1–3 internal links with anchor text containing the target keyword (or a close variant) pointing to related pages.' },
  { pattern: /keyword in internal anchor text/i,        fix: 'Internal anchors use the keyword. Vary the phrasing (exact, partial, branded) to avoid over-optimization.' },
  { pattern: /generic anchor|click here|read more/i,    fix: 'Replace generic anchors ("click here", "read more") with descriptive, keyword-rich phrases that describe the linked page.' },
  { pattern: /anchor.*over.?optim/i,                    fix: 'Vary anchor text — mix exact-match, partial-match, and branded anchors to keep the profile natural.' },
  { pattern: /no internal links/i,                      fix: 'Add internal links from relevant pages on your site to this page using descriptive anchor text.' },

  // ---- URL & Schema ----
  { pattern: /keyword missing from url|url.*keyword/i,  fix: 'Use a clean, hyphenated URL that includes the target keyword. Set up a 301 redirect if you change an existing URL.' },
  { pattern: /keyword in url/i,                         fix: 'Good — the keyword is in your URL. Keep URLs short, lowercase, and hyphen-separated.' },
  { pattern: /no structured data|schema.*missing|no schema/i, fix: 'Add JSON-LD schema (Article, FAQ, HowTo, Product) inside the <head>. Validate it with Google\'s Rich Results Test.' },
  { pattern: /structured data present/i,                fix: 'Schema is present. Validate it with Google\'s Rich Results Test to confirm it triggers rich snippets.' },
  { pattern: /schema.*invalid|schema.*error/i,          fix: 'Validate your JSON-LD in Google\'s Rich Results Test and fix syntax or required-field errors.' },
  { pattern: /schema.*deprecated/i,                     fix: 'Update deprecated schema types to the latest schema.org vocabulary and Google-supported types.' },
  { pattern: /url too long/i,                           fix: 'Shorten the URL to 3–5 words. Remove dates, IDs, and unnecessary folder depth.' },
  { pattern: /url.*uppercase|url.*underscore/i,         fix: 'Use lowercase, hyphen-separated words in URLs. Avoid underscores and capital letters.' },

  // ---- General fallbacks ----
  { pattern: /failed/i,                                 fix: 'Review this element against the recommended best practice, then apply the fix using your CMS editor or by editing the HTML directly.' },
  { pattern: /too (low|short|small)/i,                  fix: 'Increase the value to meet the recommended minimum for this metric.' },
  { pattern: /too (high|long|large)/i,                  fix: 'Reduce the value to fit within the recommended range for this metric.' },
  { pattern: /average/i,                                fix: 'Review each checklist item and optimize the weakest sub-metric first for the biggest score gain.' },
  { pattern: /not optimized|needs work/i,               fix: 'Optimize this element to better align with the target keyword and search intent. Re-run the audit after changes.' },
  { pattern: /.*/,                                      fix: 'Optimize this element to better align with the target keyword and search intent. Re-run the audit to confirm improvement.' }
];

/* Return the first matching fix for a diagnostic text, or a safe fallback. */
export function fixFor(text) {
  if (!text) return 'Optimize this element to better align with the target keyword and search intent.';
  for (const hint of fixHints) {
    if (hint.pattern.test(text)) return hint.fix;
  }
  return 'Optimize this element to better align with the target keyword and search intent.';
}

function openDetailsFromHash() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const target = document.getElementById(hash);
    if (target) {
      const details = target.querySelector('details');
      if (details) {
        details.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('module-cards-container');
  if (!container) return;

  container.innerHTML = moduleExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center gap-2 whitespace-nowrap mx-auto">
          Learn More <span class="text-2xl transition-transform group-open:rotate-180">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-800 dark:text-gray-200 leading-relaxed">
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
        </div>
      </details>
    </div>
  `).join('');

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);

window.moduleExplanations = moduleExplanations;