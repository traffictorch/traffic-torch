const moduleExplanations = [
  {
    id: 'meta-title-desc',
    emoji: '📝',
    name: 'Meta Title & Desc',
    what: 'Compares the page title and meta description on both pages against the target keyword and against 2026 length best practice (title 30–60 chars, description 120–160 chars). These are the first elements Google shows in search results, so they directly impact visibility and click-through rate. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-meta-title-desc" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Word-boundary keyword matching on both &lt;title&gt; and &lt;meta name="description"&gt; tags, plus length scoring and a CTR-signal check for action words. Results are shown side-by-side so you see exactly where the competitor wins. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-meta-title-desc" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'A keyword in the title remains a top on-page ranking signal, and a well-written description can lift CTR by 20–40%. If the competitor has both and you are missing one, you start every SERP appearance at a disadvantage. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-meta-title-desc" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'h1-headings',
    emoji: '🔤',
    name: 'H1 & Headings',
    what: 'Compares the single H1 on each page and checks whether at least one H2 contains the target keyword or a close semantic variant. Headings structure content and signal topical hierarchy to search engines and users. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-h1-headings" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Checks H1 count on both pages, keyword presence in the H1, and H2 reinforcement. A page with one keyword-relevant H1 and supporting H2s scores higher than a page with a generic H1 and no supporting structure. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-h1-headings" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'The H1 is still a meaningful topical relevance signal, and H2s that reinforce the topic help search engines and AI understand page depth. If the competitor has clearer heading structure, they are more likely to capture featured snippets and AI Overview citations. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-h1-headings" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'content-density',
    emoji: '📄',
    name: 'Content & Readability',
    what: 'Replaces the outdated keyword-density comparison. Compares content depth (word count), average sentence length, and paragraph count on both pages. Modern search engines use BERT and MUM to evaluate meaning, not repetition, so density is no longer calculated. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-content-density" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Extracts main content from each page (excluding nav, footer, sidebars), counts words, calculates average sentence length, and compares depth vs the competitor. No keyword density is computed. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-content-density" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Depth correlates with rankings because it usually indicates a more complete answer. If the competitor consistently writes 1,200+ word pages and you write 400, you will struggle on competitive queries. But length alone is not the goal — semantic coverage (scored by the AI module) is what actually matters. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-content-density" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'image-alts',
    emoji: '🖼️',
    name: 'Image Alts',
    what: 'Compares how well each page uses image alt text. Checks whether alt attributes are present on images and whether any alt naturally includes the target keyword. Alt text serves accessibility (screen readers) and provides image-search relevance signals. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-image-alts" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Scans all &lt;img&gt; tags on both pages, counts how many have any alt text and how many have keyword-relevant alt text, then compares coverage ratios side-by-side. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-image-alts" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Optimized alt text improves accessibility compliance (WCAG) and enables ranking in Google Images, which can drive 10–30% additional organic traffic in visual niches. If the competitor has descriptive alts and you don’t, they have an extra relevance signal you are missing. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-image-alts" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'anchor-text',
    emoji: '🔗',
    name: 'Anchor Text',
    what: 'Compares internal linking strategy. Checks whether each page uses the target keyword (or a close variant) as visible anchor text in internal links. Anchor text tells search engines what the linked page is about and builds topical clusters across your site. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-anchor-text" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Filters to internal links only (same-hostname href). External links, mailto:, tel:, and javascript: are excluded. Counts total internal links and how many use the keyword as anchor text, then compares both pages. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-anchor-text" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Keyword-rich internal anchors reinforce site structure and topical clusters, help search engines crawl and understand relationships between pages, and improve user navigation. If the competitor uses keyword-rich internal anchors and you don’t, they have a structural advantage that compounds across the whole site. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-anchor-text" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'url-schema',
    emoji: '🌐',
    name: 'URL & Schema',
    what: 'Compares two technical on-page signals: whether the target keyword appears in each page’s URL, and whether each page has a canonical link plus valid JSON-LD structured data. Both reinforce topical relevance and enable SERP enhancements. <a href="/blog/posts/seo-keyword-competition-help-guide/#what-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Extracts the URL of both pages, checks for the keyword with word-boundary matching (with URL-word splitting), validates that the URL is lowercase / hyphen-separated / has no query parameters, detects the canonical tag, parses every &lt;script type="application/ld+json"&gt; block, and extracts @type values. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'A keyword in the URL improves CTR from SERPs and reinforces topical relevance. Schema markup enables rich results (stars, FAQs, carousels) that take up more screen space and increase visibility in zero-click SERPs. If the competitor has both and you have neither, their SERP appearance is significantly richer than yours. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'technical',
    emoji: '⚙️',
    name: 'Technical',
    what: 'Compares four essential technical SEO hygiene signals on both pages: the html lang attribute, the viewport meta tag, the robots meta directive (index/noindex), and Open Graph tags for social sharing. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'Reads the &lt;html lang&gt; value, the &lt;meta name="viewport"&gt; content, the &lt;meta name="robots"&gt; directive, and &lt;meta property="og:title"&gt; / &lt;meta property="og:description"&gt; tags on each page. Each signal is scored pass/fail side-by-side. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Missing html lang affects accessibility and language detection. A missing viewport tag breaks mobile rendering — a primary ranking factor. An accidental noindex blocks indexing entirely. Missing Open Graph tags cause low-CTR previews when the page is shared on social media. If the competitor has any of these and you don’t, they have a technical advantage you should close immediately. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
  },
  {
    id: 'ai-semantic',
    emoji: '🤖',
    name: 'AI Semantic Audit',
    what: 'The module that replaces the old keyword density comparison with what modern search actually rewards. Runs an independent AI semantic audit on each page via Cloudflare Workers AI: predicts search intent, generates the entities and questions a top-ranking page would cover, and scores each page on entity coverage, AEO answerability, semantic depth, and E-E-A-T signals. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    how: 'An excerpt of each page (title, meta description, H1, headings, image alt text, schema types, and first ~3,500 characters of body content) is sent to a Cloudflare Workers AI endpoint running GLM-4.7-Flash. Both pages are audited in parallel and scored independently. Results are cached by content hash, so re-running an unchanged page is instant while any edit produces a fresh analysis. <a href="/blog/posts/seo-keyword-competition-help-guide/#how-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>',
    why: 'Modern search engines and AI Overviews reward pages that fully answer the query, cover the right entities, and demonstrate experience, expertise, authoritativeness, and trust. This module shows you exactly which entities the competitor covers that you don’t, and which questions they answer that you skip. It contributes 30 out of 100 points to each page’s overall score. <a href="/blog/posts/seo-keyword-competition-help-guide/#why-url-schema" class="text-orange-600 dark:text-orange-400 hover:underline font-medium">Learn more →</a>'
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
    fix: 'The AI semantic layer could not be reached for one or both pages. This is usually temporary — re-run the comparison in a moment. If the issue persists, check that your browser or network is not blocking requests to keyword-vs-semantic-audit.traffictorch.workers.dev.' },
  { pattern: /intent:.*page (matches|may not match)/i,
    fix: 'Match the page format to the search intent behind the keyword. Informational queries want guides, how-tos, and answers. Commercial queries want comparisons, reviews, and service pages. Transactional queries want product or pricing pages. If the competitor’s page format matches the SERP intent better than yours, that is a structural advantage you need to close.' },
  { pattern: /entit(y|ies) coverage/i,
    fix: 'Add the missing entities that a top-ranking page would cover. Use the entities your competitor covers as a content roadmap. Each entity should appear naturally in the body, in a subheading, or in supporting content — not stuffed.' },
  { pattern: /aeo answerability/i,
    fix: 'Improve AEO answerability by directly answering the questions a searcher would have. Add a short FAQ section with the questions listed in the audit, or work the answers into the main content as clear, scannable paragraphs. AI search engines and Google AI Overviews reward direct, well-structured answers.' },
  { pattern: /semantic coverage:/i,
    fix: 'Expand the page to cover the topic more completely. Match or exceed the competitor’s coverage of entities and subtopics. Semantic depth beats keyword repetition in modern search.' },

  /* ---- Meta Title & Description ---- */
  { pattern: /missing <title> tag/i,
    fix: 'Add a &lt;title&gt; tag containing your target keyword near the start. Keep it 30–60 characters. The competitor already has one — this is a foundational on-page signal you should not be missing.' },
  { pattern: /keyword missing from meta title/i,
    fix: 'Place the target keyword near the beginning of your &lt;title&gt; tag, ideally within the first 60 characters. If the competitor has the keyword in their title and you don’t, this is often the single biggest reason they outrank you.' },
  { pattern: /keyword in meta title/i,
    fix: 'Good — your keyword is in the title. Compare against the competitor’s title: is theirs more compelling, more front-loaded, or better matched to intent?' },
  { pattern: /title is \d+ chars/i,
    fix: 'Adjust the title to fall between 30 and 60 characters. Too short wastes SERP real estate; too long gets truncated by Google.' },
  { pattern: /missing meta description/i,
    fix: 'Add a &lt;meta name="description"&gt; tag with a 120–160 character summary. Include the target keyword once naturally and add a clear benefit or call-to-action. This is a CTR lever — if the competitor has a compelling description and you don’t, you lose clicks even at the same ranking position.' },
  { pattern: /keyword missing from meta description/i,
    fix: 'Include the target keyword once naturally in your meta description, ideally near the start. Keep it under 160 characters and add a clear call-to-action to improve CTR.' },
  { pattern: /keyword in meta description/i,
    fix: 'Your meta description contains the keyword. Compare it against the competitor’s description — theirs may be more benefit-focused or action-oriented.' },
  { pattern: /meta description is \d+ chars/i,
    fix: 'Adjust the meta description to fall between 120 and 160 characters. Google truncates longer descriptions in SERPs.' },

  /* ---- H1 & Headings ---- */
  { pattern: /no h1 found/i,
    fix: 'Add a single &lt;h1&gt; containing the target keyword. The competitor has one — you need parity on this basic structural signal.' },
  { pattern: /multiple h1 tags/i,
    fix: 'Consolidate to one H1 per page. Demote extra top-level headings to H2. Multiple H1s confuse the page hierarchy.' },
  { pattern: /single h1/i,
    fix: 'Good — your page has exactly one H1.' },
  { pattern: /keyword missing from h1/i,
    fix: 'Rewrite your H1 to naturally include the target keyword. If the competitor’s H1 contains the keyword and yours doesn’t, this is a direct topical relevance disadvantage.' },
  { pattern: /keyword in h1/i,
    fix: 'Your H1 contains the keyword. Compare against the competitor’s H1 to see if theirs is more descriptive or better matched to intent.' },
  { pattern: /no h2 contains the keyword/i,
    fix: 'Include the target keyword or a close semantic variant in at least one H2. This reinforces topical relevance and helps readers scan the page. Check whether the competitor reinforces the keyword across their subheadings.' },

  /* ---- Content & Readability ---- */
  { pattern: /thin content/i,
    fix: 'Your page is thin compared to what the topic requires. Expand to at least 800 words, and aim for the depth the competitor provides. Add sections that cover the entities and questions listed in the AI Semantic Audit module.' },
  { pattern: /moderate depth/i,
    fix: 'Content length is workable but not deep. Compare your word count against the competitor’s — if they significantly out-write you, you likely need to expand with examples, FAQs, or original data.' },
  { pattern: /good depth/i,
    fix: 'Content length is solid and matches or exceeds the competitor. Keep refreshing with new examples and data.' },
  { pattern: /long sentences/i,
    fix: 'Break up long sentences. Aim for an average of 15–20 words per sentence. Short sentences improve readability, mobile experience, and dwell time.' },
  { pattern: /readable sentence length/i,
    fix: 'Sentence length is in a readable range. Keep paragraphs short and use subheadings to break up the page.' },
  { pattern: /few paragraphs/i,
    fix: 'Break content into more, shorter paragraphs. Compare against the competitor — if their page is easier to scan, that is a UX advantage.' },

  /* ---- Image Alts ---- */
  { pattern: /no images on page/i,
    fix: 'No images found on this page. Adding 1–3 relevant images with descriptive alt text can improve engagement, time on page, and image search visibility. Competitors often use images to break up content and boost dwell time.' },
  { pattern: /image\(s\) missing alt|images missing alt/i,
    fix: 'Add descriptive alt attributes to every meaningful image. Decorative images can use alt="". Update via your CMS media library or edit the &lt;img&gt; tags directly.' },
  { pattern: /no image alt text contains the keyword|no key images have keyword in alt/i,
    fix: 'Update the alt text of 1–2 important images to naturally include the target keyword. Aim for 5–10 descriptive words per alt. Only include the keyword where it genuinely describes the image.' },
  { pattern: /keyword in image alt text/i,
    fix: 'The keyword appears in image alt text. Compare against the competitor — do they use keyword-relevant alts on more images than you?' },

  /* ---- Anchor Text ---- */
  { pattern: /no internal links found/i,
    fix: 'Add internal links from this page to related pages on your site using descriptive anchor text. Internal linking builds topical clusters and helps search engines and users navigate your site.' },
  { pattern: /no internal anchors contain the keyword/i,
    fix: 'Add 1–3 internal links with anchor text containing the target keyword (or a close variant) pointing to related pages. Vary the phrasing — exact-match, partial-match, branded — to keep the profile natural.' },
  { pattern: /keyword in internal anchor text/i,
    fix: 'Internal anchors use the keyword. Compare against the competitor — if they use keyword-relevant anchors more consistently, they have a structural site advantage.' },

  /* ---- URL & Schema ---- */
  { pattern: /missing canonical link/i,
    fix: 'Add &lt;link rel="canonical" href="https://yoursite.com/this-page/"&gt; inside the &lt;head&gt;. Canonical tags prevent duplicate content issues that can dilute ranking signals.' },
  { pattern: /canonical link present/i,
    fix: 'Canonical link is set correctly.' },
  { pattern: /keyword not in url/i,
    fix: 'Use a clean, hyphenated URL that includes the target keyword. If you change an existing URL, set up a 301 redirect to preserve ranking signals.' },
  { pattern: /url not clean/i,
    fix: 'Use lowercase, hyphen-separated URLs without query parameters. Avoid underscores, uppercase letters, and long folder depth.' },
  { pattern: /no structured data detected/i,
    fix: 'Add JSON-LD schema (Article, BlogPosting, FAQPage, HowTo, Product, Organization, or BreadcrumbList) inside the &lt;head&gt;. Validate it with Google’s Rich Results Test. If the competitor has schema and you don’t, their SERP appearance is richer than yours.' },
  { pattern: /invalid json-ld/i,
    fix: 'Your JSON-LD schema block has a syntax error. Validate it with Google’s Rich Results Test and fix missing quotes, commas, or required fields.' },
  { pattern: /valid json-ld schema/i,
    fix: 'Valid JSON-LD schema detected. Compare with the competitor — do they use additional high-value schema types you are missing?' },

  /* ---- Technical ---- */
  { pattern: /missing html lang/i,
    fix: 'Add a lang attribute to the &lt;html&gt; tag, e.g. &lt;html lang="en"&gt;. This helps screen readers and search engines detect the page language.' },
  { pattern: /html lang set/i,
    fix: 'The html lang attribute is set correctly.' },
  { pattern: /missing or invalid viewport/i,
    fix: 'Add &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt; inside the &lt;head&gt;. Missing or restricted viewport tags break mobile rendering — a major ranking factor.' },
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
    fix: 'Review this element against the recommended best practice, then apply the fix using your CMS editor or by editing the HTML directly. Compare against the competitor’s implementation for a concrete example.' },
  { pattern: /too (low|short|small)/i,
    fix: 'Increase the value to meet the recommended minimum. Compare against the competitor’s implementation to see a working example.' },
  { pattern: /too (high|long|large)/i,
    fix: 'Reduce the value to fit within the recommended range.' },
  { pattern: /average/i,
    fix: 'Review each checklist item and optimize the weakest sub-metric first for the biggest score gain.' },
  { pattern: /not optimized|needs work/i,
    fix: 'Optimize this element to better align with the target keyword and search intent. Re-run the comparison after changes to confirm improvement.' },
  { pattern: /.*/,
    fix: 'Optimize this element to better align with the target keyword and search intent. Compare against the competitor’s implementation for a concrete example, then re-run the audit.' }
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
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-orange-600 dark:text-orange-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline flex items-center justify-center gap-2 w-full">
          Learn More <span class="text-2xl transition-transform group-open:rotate-180">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-800 dark:text-gray-200 leading-relaxed">
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-orange-600 dark:text-orange-400 text-lg mb-2">How is ${m.name} compared?</p>
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