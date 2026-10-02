const moduleExplanations = [
  {
    id: 'meta-title-desc',
    emoji: '📝',
    name: 'Meta Title & Desc',
    what: 'Checks if your target keyword appears naturally in the page title and meta description, and whether their lengths match 2026 best practice. These are the first elements Google reads and displays in search results, so they directly impact visibility and click-through rate. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool reads the &lt;title&gt; tag and &lt;meta name="description"&gt; content, checks for the keyword using word-boundary matching, and verifies title length (30–60 chars) and description length (120–160 chars) against recommended ranges. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'A keyword in the title still helps relevance and clicks, and pages with a clear, well-written description see measurably better CTR. But the meta description is not a ranking factor in itself — it is a CTR lever, so it should match the intent behind the keyword and give the searcher a reason to click. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#meta-title-desc-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'h1-headings',
    emoji: '🔤',
    name: 'H1 & Headings',
    what: 'Evaluates whether your single H1 contains the target keyword, and whether at least one H2 reinforces it with the keyword or a close variant. Headings structure content and help search engines and readers quickly understand hierarchy and topic relevance. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool checks that exactly one &lt;h1&gt; exists, that it contains the target keyword, and that at least one &lt;h2&gt; supports the topic with the keyword or a semantic variant. It also lists H1–H3 in order for a visual hierarchy check. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'The H1 is no longer the "strongest ranking signal" it was a decade ago, but it is still a meaningful relevance and UX signal. A single, keyword-relevant H1 helps users and AI engines confirm what the page is about. Subheadings that reinforce the topic support semantic coverage, which is where modern search rewards depth. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#h1-headings-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'content-density',
    emoji: '📄',
    name: 'Content & Readability',
    what: 'Replaces the outdated keyword-density check. Evaluates content depth (word count), average sentence length, and paragraph count. Modern search engines use BERT and MUM to evaluate meaning, not repetition, so we no longer look at keyword density at all. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool extracts main content (excluding nav, footer, sidebars), counts words, calculates average sentence length, and counts paragraphs. No keyword density calculation is performed. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Depth correlates with rankings because it usually indicates a more complete answer — but word count alone is not a ranking factor, and neither is keyword density. What matters is whether the content fully covers the entities, subtopics and questions that top-ranking results cover. That is scored separately in the AI Semantic Audit module. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#content-density-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'image-alts',
    emoji: '🖼️',
    name: 'Image Alts',
    what: 'Scans image alt texts for the presence of your target keyword in relevant images, and verifies every image has an alt attribute (even if empty for decorative images). Alt text describes images for screen readers and search engines. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'All &lt;img&gt; tags are scanned. The tool counts how many have any alt attribute, and how many have alt text containing the target keyword (with word-boundary matching). <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Alt text is essential for accessibility compliance (WCAG) and enables ranking in Google Images, driving extra traffic. It also provides contextual relevance signals. Write natural, descriptive alt text — use the keyword only when it genuinely describes the image, and use empty alt="" for purely decorative images. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#image-alts-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'anchor-text',
    emoji: '🔗',
    name: 'Anchor Text',
    what: 'Looks for internal links using the target keyword or variations in their visible anchor text. Anchor text helps search engines understand linked page topics and builds topical clusters across your site. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Internal &lt;a&gt; tags (same-host links) are analysed for visible text containing the keyword. External links are ignored — only internal anchors count toward this module. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword-rich internal anchors reinforce site structure and topical clusters, help search engines crawl and understand relationships between pages, and improve user navigation. Use natural, varied anchor text — mix exact-match, partial-match, and descriptive phrases to avoid over-optimization. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#anchor-text-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'url-schema',
    emoji: '🌐',
    name: 'URL & Schema',
    what: 'Checks whether the keyword appears in the page URL, whether the URL is clean, whether a canonical link is set, and whether valid JSON-LD structured data is present on the page. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The URL is checked for the keyword with word-boundary matching and validated for lowercase, hyphens, and absence of query parameters. The &lt;head&gt; is scanned for &lt;link rel="canonical"&gt; and &lt;script type="application/ld+json"&gt; blocks, which are parsed and validated. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword in URL reinforces topic relevance and improves click-through from search results. Schema markup enables rich snippets that stand out in SERPs and improves visibility in AI search engines. A canonical tag prevents duplicate content issues that can dilute ranking signals. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'technical',
    emoji: '⚙️',
    name: 'Technical',
    what: 'Checks four essential technical SEO hygiene signals: the html lang attribute, the viewport meta tag, the robots meta tag (index/noindex), and Open Graph tags for social sharing. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'The tool reads the &lt;html lang="…"&gt; attribute, the &lt;meta name="viewport"&gt; content, the &lt;meta name="robots"&gt; directive, and &lt;meta property="og:title"&gt; / &lt;meta property="og:description"&gt; tags. Each is scored pass/fail. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Missing html lang affects accessibility and language detection. A missing viewport tag breaks mobile rendering, which is a major ranking factor. A noindex directive (accidental) blocks indexing entirely. Missing Open Graph tags reduce click-through when your page is shared on social media or in messaging apps. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'ai-semantic',
    emoji: '🤖',
    name: 'AI Semantic Audit',
    what: 'Runs a Cloudflare Workers AI semantic audit against the target keyword. Predicts search intent, generates the entities and questions a top-ranking page would cover, and scores your page on entity coverage, AEO answerability, semantic depth, and E-E-A-T signals. This is the module that replaces the old keyword density check with something modern search engines actually value. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-what" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'An excerpt of your page (title, meta description, H1, headings, image alt text, schema types, and first ~3,500 characters of body content) is sent to a Cloudflare Workers AI endpoint running GLM-4.7-Flash. The model classifies intent, predicts expected entities and questions, and returns a weighted score. Results are cached against a content hash — any page edit produces a fresh analysis. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-how" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Modern search rewards pages that fully answer the query, cover the right entities, and demonstrate experience, expertise, authoritativeness and trust. Exact-match keyword density was replaced years ago by semantic understanding. This module scores what actually matters in 2026: intent alignment, entity coverage, answerability, and E-E-A-T. It is weighted 30 out of 100 in the overall score. <a href="https://traffictorch.net/blog/posts/seo-keyword-help-guide/#url-schema-why" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  }
];

/* ============================================================
   FIX HINTS — pattern-matched fix explanations
   Used by the score-card panel when a diagnostic has no `how`.
   First matching pattern wins.
   ============================================================ */
export const fixHints = [
  /* ---- AI Semantic Audit ---- */
  { pattern: /ai semantic audit unavailable/i,
    fix: 'The AI semantic layer could not be reached. This is temporary — re-run the audit in a moment. If the issue persists, check that your browser or network is not blocking the request to keyword-semantic-audit.traffictorch.workers.dev.' },
  { pattern: /intent:.*page (matches|may not match)/i,
    fix: 'Align the page format with the search intent behind the keyword. Informational queries want guides, how-tos, and answers. Commercial queries want comparisons, reviews, and service pages. Transactional queries want product or pricing pages. If the page type does not match the dominant SERP format for your keyword, restructure or re-target.' },
  { pattern: /entity coverage:/i,
    fix: 'Add missing entities and subtopics that a top-ranking page would cover. Use the list of missing entities above as a content outline. Each entity should appear naturally in the body, in a subheading, or in supporting content — not stuffed.' },
  { pattern: /aeo answerability:/i,
    fix: 'Improve answerability by directly answering the questions a searcher would have. Add a short FAQ section with the questions listed above, or work the answers into the main content as clear, scannable paragraphs. AI search engines reward direct, well-structured answers.' },
  { pattern: /semantic coverage:/i,
    fix: 'Expand the page to cover the topic more completely. Add sections for the missing entities and questions, and reinforce the topic with internal links from related pages. Semantic depth beats keyword repetition in modern search.' },
  { pattern: /author \d+ · citation \d+/i,
    fix: 'Strengthen E-E-A-T. Author signals: add a named author with a bio and photo. Citation signals: link to authoritative sources. Experience: include first-hand examples, case studies, or original data. Trust: display NAP details, About page link, and contact information.' },

  /* ---- Meta Title & Description ---- */
  { pattern: /missing <title> tag|missing title tag/i,
    fix: 'Add a &lt;title&gt; tag containing your target keyword near the start. Keep it 30–60 characters. In WordPress use the post title or your SEO plugin; in custom HTML edit the &lt;head&gt; directly.' },
  { pattern: /keyword missing from meta title/i,
    fix: 'Place the target keyword near the beginning of your &lt;title&gt; tag, ideally within the first 60 characters. Use your CMS SEO plugin (Yoast, Rank Math, AIOSEO) or edit the &lt;head&gt; directly.' },
  { pattern: /keyword in meta title/i,
    fix: 'Good — your keyword is in the title. Ensure it appears near the start for maximum weight and stays under 60 characters.' },
  { pattern: /title too short/i,
    fix: 'Expand the title to at least 30 characters. Add a benefit, brand name, or specific detail that makes it more compelling in search results.' },
  { pattern: /title too long/i,
    fix: 'Shorten the title to 60 characters or fewer. Front-load the keyword and remove filler words. Google truncates longer titles in SERPs.' },
  { pattern: /title length ok/i,
    fix: 'Title length is in the ideal 30–60 character range.' },
  { pattern: /missing meta description/i,
    fix: 'Add a &lt;meta name="description"&gt; tag with a 120–160 character summary. Include the target keyword once naturally and add a clear benefit or call-to-action. In WordPress use your SEO plugin; in custom HTML add it inside &lt;head&gt;.' },
  { pattern: /keyword missing from meta description/i,
    fix: 'Include the target keyword once naturally in your meta description, ideally near the start. Keep it under 160 characters and add a clear call-to-action to improve CTR.' },
  { pattern: /keyword in meta description/i,
    fix: 'Nice — your meta description contains the keyword. Keep it natural and under 160 characters.' },
  { pattern: /meta description too short/i,
    fix: 'Expand the meta description to at least 120 characters. Add a benefit, a specific detail, or a soft call-to-action — but keep it under 160 characters.' },
  { pattern: /meta description too long/i,
    fix: 'Trim the meta description to under 160 characters while preserving the keyword and the primary benefit. Google truncates longer descriptions in SERPs.' },
  { pattern: /meta description length ok/i,
    fix: 'Meta description length is in the ideal 120–160 character range.' },

  /* ---- H1 & Headings ---- */
  { pattern: /no h1 found/i,
    fix: 'Add a single &lt;h1&gt; containing the target keyword. In WordPress, the post title is usually the H1. In custom HTML, wrap the main page heading in &lt;h1&gt;. Only one H1 per page.' },
  { pattern: /multiple h1 tags/i,
    fix: 'Consolidate to one H1 per page. Demote extra top-level headings to H2 — this improves both accessibility and how search engines interpret page structure.' },
  { pattern: /single h1 present/i,
    fix: 'Good — your page has exactly one H1.' },
  { pattern: /keyword missing from h1/i,
    fix: 'Rewrite your H1 to naturally include the target keyword while keeping it reader-friendly. The H1 should describe the page topic and match the intent behind the keyword.' },
  { pattern: /keyword in h1/i,
    fix: 'Great — your H1 contains the keyword. Ensure supporting H2s reinforce the topic semantically.' },
  { pattern: /no h2 contains the keyword or variant/i,
    fix: 'Include the target keyword or a close semantic variant in at least one H2. This reinforces topical relevance and helps readers scan the page.' },

  /* ---- Content & Readability ---- */
  { pattern: /thin content/i,
    fix: 'Expand the page to at least 300 words, and aim for 800+ for competitive queries. Add sections that cover the entities, subtopics and questions listed in the AI Semantic Audit module.' },
  { pattern: /moderate depth/i,
    fix: 'Content length is workable but not deep. If the topic calls for it, expand toward 800+ words with examples, FAQs, comparisons or original data. Check the AI Semantic Audit module for specific gaps to fill.' },
  { pattern: /good depth/i,
    fix: 'Content length is solid. Keep refreshing with new examples, updated data, and internal links from related pages.' },
  { pattern: /long sentences/i,
    fix: 'Break up long sentences. Aim for an average of 15–20 words per sentence. Short sentences improve readability, scannability, and dwell time.' },
  { pattern: /readable sentence length/i,
    fix: 'Sentence length is in a readable range. Keep paragraphs short and use subheadings to break up the page.' },
  { pattern: /few paragraphs/i,
    fix: 'Break content into more, shorter paragraphs. Aim for 5+ paragraphs on longer pages. Shorter paragraphs improve mobile readability and time on page.' },

  /* ---- Image Alts ---- */
  { pattern: /no images on page/i,
    fix: 'No images found on this page. Adding 1–3 relevant images — with descriptive alt text — can improve engagement, time on page, and image search visibility.' },
  { pattern: /image\(s\) missing alt|images missing alt|image\(s\) have alt text/i,
    fix: 'Every meaningful image needs a descriptive alt attribute. Decorative images can use alt="". Update via your CMS media library or edit the &lt;img&gt; tags directly. Prioritise hero, product, and instructional images first.' },
  { pattern: /no image alt text contains the keyword|no key images have keyword in alt/i,
    fix: 'Update the alt text of 1–2 important images to naturally include the target keyword. Aim for 5–10 descriptive words per alt. Only include the keyword where it genuinely describes the image.' },
  { pattern: /keyword in image alt text/i,
    fix: 'Good — the keyword appears in image alt text. Ensure it stays relevant to the image content and is not over-stuffed.' },

  /* ---- Anchor Text ---- */
  { pattern: /no internal links found/i,
    fix: 'Add internal links from this page to related pages on your site using descriptive anchor text. Internal linking builds topical clusters and helps search engines and users navigate your site.' },
  { pattern: /no internal anchors contain the keyword/i,
    fix: 'Add 1–3 internal links with anchor text containing the target keyword (or a close variant) pointing to related pages. Vary the phrasing — exact-match, partial-match, branded — to keep the profile natural.' },
  { pattern: /keyword in internal anchor text/i,
    fix: 'Internal anchors use the keyword. Vary the phrasing (exact, partial, branded) to avoid over-optimization.' },
  { pattern: /internal links$/i,
    fix: 'The page has internal links. Ensure they use descriptive, keyword-relevant anchor text where natural.' },

  /* ---- URL & Schema ---- */
  { pattern: /missing canonical link/i,
    fix: 'Add &lt;link rel="canonical" href="https://yoursite.com/this-page/"&gt; inside the &lt;head&gt;. Canonical tags prevent duplicate content issues that can dilute ranking signals.' },
  { pattern: /canonical link present/i,
    fix: 'Canonical link is set correctly.' },
  { pattern: /no structured data detected/i,
    fix: 'Add JSON-LD schema (Article, BlogPosting, FAQPage, HowTo, Product, Organization or BreadcrumbList) inside the &lt;head&gt;. Validate it with Google\'s Rich Results Test.' },
  { pattern: /invalid json-ld/i,
    fix: 'Your JSON-LD schema block has a syntax error. Validate it with Google\'s Rich Results Test and fix missing quotes, commas, or required fields.' },
  { pattern: /valid json-ld schema/i,
    fix: 'Valid JSON-LD schema detected. Confirm it triggers rich snippets in Google\'s Rich Results Test.' },
  { pattern: /keyword not in url/i,
    fix: 'Use a clean, hyphenated URL that includes the target keyword. If you change an existing URL, set up a 301 redirect to preserve ranking signals.' },
  { pattern: /url not clean/i,
    fix: 'Use lowercase, hyphen-separated URLs without query parameters. Avoid underscores, uppercase letters, and long folder depth.' },

  /* ---- Technical ---- */
  { pattern: /missing html lang/i,
    fix: 'Add a lang attribute to the &lt;html&gt; tag, e.g. &lt;html lang="en"&gt;. This helps screen readers and search engines detect the page language.' },
  { pattern: /html lang set/i,
    fix: 'The html lang attribute is set correctly.' },
  { pattern: /missing or invalid viewport/i,
    fix: 'Add &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt; inside the &lt;head&gt;. Missing or restricted viewport tags break mobile rendering, which is a major ranking factor.' },
  { pattern: /viewport set/i,
    fix: 'Viewport is set correctly for mobile.' },
  { pattern: /noindex directive present/i,
    fix: 'This page has a noindex directive and will not appear in search results. Remove noindex from the &lt;meta name="robots"&gt; tag if the page should rank.' },
  { pattern: /^indexable$/i,
    fix: 'Page is indexable. Search engines are allowed to crawl and index it.' },
  { pattern: /missing open graph/i,
    fix: 'Add &lt;meta property="og:title"&gt; and &lt;meta property="og:description"&gt; tags inside the &lt;head&gt;. They control how your page appears when shared on social media and in messaging apps.' },
  { pattern: /open graph tags present/i,
    fix: 'Open Graph tags are present and will improve social sharing previews.' },

  /* ---- General fallbacks (checked last) ---- */
  { pattern: /failed/i,
    fix: 'Review this element against the recommended best practice, then apply the fix using your CMS editor or by editing the HTML directly.' },
  { pattern: /too (low|short|small)/i,
    fix: 'Increase the value to meet the recommended minimum for this metric.' },
  { pattern: /too (high|long|large)/i,
    fix: 'Reduce the value to fit within the recommended range for this metric.' },
  { pattern: /average/i,
    fix: 'Review each checklist item and optimize the weakest sub-metric first for the biggest score gain.' },
  { pattern: /not optimized|needs work/i,
    fix: 'Optimize this element to better align with the target keyword and search intent. Re-run the audit after changes.' },
  { pattern: /.*/,
    fix: 'Optimize this element to better align with the target keyword and search intent. Re-run the audit to confirm improvement.' }
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