// Module explanations for AEO Performance Tool
export const moduleExplanations = {
  "Render Fidelity": {
    slug: "render-fidelity",
    what: "How accurately your page renders in headless browsers used by AI crawlers. It measures the gap between raw server HTML and what a headless browser produces after JavaScript executes — the wider the gap, the more content AI crawlers miss.",
    how: "Traffic Torch renders your page in a real headless Chrome instance via Cloudflare Browser Run, then compares the rendered output against the raw HTML at word level. It captures console errors, hydration markers, H1 presence, and JS errors during the render window.",
    why: "AI crawlers use headless browsers and capture the DOM once. If content is injected by JavaScript or fails to render, extraction fails silently. Render Fidelity is the gatekeeping module — if it fails, every other module is compromised because the crawler is working with incomplete input."
  },
  "DOM Stability": {
    slug: "dom-stability",
    what: "How much the Document Object Model mutates during page load. A stable DOM means content appears once and stays put; an unstable DOM means nodes are added, removed, or replaced repeatedly after the initial snapshot.",
    how: "Traffic Torch injects a MutationObserver into the page before any script runs, counts every DOM mutation during load, and combines that with static analysis for document.write, shadow DOM, and SPA framework markers.",
    why: "AI scrapers capture the DOM once. If a crawler snapshots at 3 seconds and your main content loads at 5 seconds, the crawler sees an incomplete page — and it will not retry. Heavy mutation during load is the leading cause of invisible content in AI indexes."
  },
  "Content Extractability": {
    slug: "content-extractability",
    what: "How easy it is for AI to pull clean, structured text from your HTML. It measures whether your markup uses semantic elements that communicate content roles or whether it is built from generic divs that give extractors no signal.",
    how: "Traffic Torch analyses raw HTML (not the rendered DOM), counts semantic elements versus divs and paragraphs, and calculates a semantic ratio. It applies targeted penalties for high div counts, missing H1, too few paragraphs, and large inline scripts that hide content.",
    why: "AI extraction engines do not see visual layout — they read the DOM. When everything is a div, the extractor has to guess what is a heading, what is body text, and what is chrome. Semantic HTML makes content roles explicit, which is the difference between being quoted cleanly and being ignored."
  },
  "Schema Parse Performance": {
    slug: "schema-parse",
    what: "How reliably your JSON-LD structured data can be parsed by AI crawlers and answer engines. Schema tells AI systems what entities exist on your page and how they relate to each other.",
    how: "Traffic Torch extracts every application/ld+json block, attempts to parse each with JSON.parse, and analyses the resulting objects for type coverage and nesting depth. Failures count as parse errors, missing @context fields count as warnings.",
    why: "AI engines use schema as a primary signal for entity understanding. When schema parses cleanly, models know exactly who wrote the content, what it is about, and when it was published. When schema breaks, the signal flips from positive to negative — the model may downgrade the page rather than ignore it."
  },
  "Crawler Accessibility": {
    slug: "crawler-accessibility",
    what: "How easily AI crawlers can reach and read your content without hitting barriers. It covers robots.txt rules, meta robots directives, cookie walls, infinite scroll traps, and JS-gated content.",
    how: "Traffic Torch fetches your robots.txt and checks for disallow rules targeting AI crawlers. It scans for meta robots noindex/nofollow, consent manager markers, infinite scroll without pagination, hash routing, and very low text in raw HTML without a noscript fallback.",
    why: "AI crawlers are more fragile than Googlebot. When they hit a barrier — a cookie wall, a blocked user agent, a route that only resolves client-side — they stop. Your content never enters the index, and no amount of on-page optimization can bring it back."
  },
  "Text Density Performance": {
    slug: "text-density",
    what: "How much of your HTML is actual extractable text versus code, scripts, styles, and noise. It is the ratio of readable content to total markup.",
    how: "Traffic Torch strips scripts, styles, and tags from raw HTML, compares the remaining text length to total HTML size, and counts ad/sponsor/promo markers. It applies tiered scoring across the 5%, 10%, 15%, 22%, and 30% density thresholds.",
    why: "AI engines weigh signal-to-noise ratio heavily. A page that returns 20KB of readable content from a 100KB fetch is more valuable than one returning 2KB. Crawlers are budget-constrained, so low-density pages get deprioritized — even when the underlying content is excellent."
  },
  "Semantic Structure Integrity": {
    slug: "semantic-structure",
    what: "How predictably your content maps to the patterns AI answer engines expect. It focuses on heading hierarchy, paragraph segmentation, list clarity, and table readability.",
    how: "Traffic Torch parses every heading, paragraph, list, and table in the rendered HTML. It checks for a single H1, heading order violations (skipped levels), paragraph length averages, presence of lists, and tables with proper th headers.",
    why: "Answer engines build responses by extracting specific pieces of content: a heading followed by a definition, a list of steps, a Q&A pair. When your structure matches those patterns, the engine can quote you directly. When it does not, the engine paraphrases — and often does not cite you cleanly."
  },
  "Render Blocking Performance": {
    slug: "render-blocking",
    what: "What delays your DOM from becoming available to AI extractors. Unlike PageSpeed's render-blocking concept, this focuses on extraction speed rather than user-perceived speed.",
    how: "Traffic Torch scans head scripts, stylesheets, font loading, and third-party script domains in the HTML, then combines that with live Puppeteer measurements for FCP, TTFB, and render-blocking resource count.",
    why: "AI crawlers do not wait indefinitely. Most give a page 5–15 seconds to produce content. Synchronous head scripts, too many stylesheets, fonts without font-display: swap, and slow TTFB all delay when content becomes extractable — and when the crawler's window closes, extraction fails."
  },
  "Content Stability Performance": {
    slug: "content-stability",
    what: "Whether your content stays consistent after the initial load or keeps changing. It covers late content injection, dynamic content replacement, hydration flicker, and SPA route changes.",
    how: "Traffic Torch combines live Puppeteer metrics (CLS, LCP, long tasks) with static HTML analysis of routing APIs, async fetch patterns, innerHTML assignments, and service worker registration.",
    why: "AI crawlers capture content once. If your content is unstable at capture time — being replaced by hydration, waiting on an API response, or shifting due to layout changes — the crawler gets a coin flip instead of a reliable snapshot. Inconsistent visibility is worse than no visibility."
  }
};

export const fixHints = [
  // ─── Render Fidelity ───
  { pattern: /% of rendered words are JS-injected/i, fix: "Move primary content into the server-rendered HTML. Avoid injecting H1, body copy, or product details via JavaScript — AI crawlers capture the DOM once and miss anything that appears later." },
  { pattern: /% of raw words removed after render/i, fix: "Check for hydration mismatches where the client replaces server markup. Use framework SSR correctly so the rendered state matches the raw HTML." },
  { pattern: /JavaScript error\(s\) during render/i, fix: "Fix the JavaScript errors flagged in Live Browser Metrics. Even non-blocking errors can interrupt hydration and leave content unrendered for AI crawlers." },
  { pattern: /H1 injected by JS/i, fix: "Move the H1 into the server-rendered HTML so AI crawlers see the primary topic without waiting for JavaScript." },
  { pattern: /No <noscript> fallback and significant JS-injected content/i, fix: "Add a <noscript> block that contains a summary of the primary content. Crawlers that do not execute JavaScript will still see something useful." },
  { pattern: /hydration marker/i, fix: "Reduce reliance on client-side hydration. Server-render the critical content so it exists before hydration runs." },

  // ─── DOM Stability ───
  { pattern: /live DOM mutations during load/i, fix: "Reduce script-driven DOM mutation. Defer non-critical scripts, avoid document.write, and mount primary content before running heavy client-side logic." },
  { pattern: /nodes added\/removed during load/i, fix: "Consolidate DOM operations. Batch appends and use a framework that renders complete trees rather than mutating piecewise." },
  { pattern: /shadow DOM root/i, fix: "Content inside shadow DOM is invisible to many extractors. Render primary text in the light DOM, or provide a light-DOM mirror for critical content." },
  { pattern: /document\.write\(\)/i, fix: "Replace document.write with DOM APIs (appendChild, insertBefore). document.write blocks the parser and confuses crawlers that snapshot early." },
  { pattern: /SPA: /i, fix: "For SPA frameworks, ensure primary content is server-rendered (SSR or SSG) so the initial HTML contains the DOM crawlers need." },

  // ─── Content Extractability ───
  { pattern: /Low semantic HTML usage/i, fix: "Replace layout divs with semantic tags: <header>, <main>, <article>, <section>, <nav>, <aside>, <footer>. Aim for a 15%+ semantic element ratio." },
  { pattern: /div count/i, fix: "Reduce wrapper divs. Most framework layouts add extra divs you can consolidate or replace with semantic tags." },
  { pattern: /Multiple H1 tags/i, fix: "Keep exactly one H1 per page. Convert extra H1s to H2 or H3 based on hierarchy." },
  { pattern: /No H1 found/i, fix: "Add a single H1 that states the primary topic of the page. Place it inside <main> or the first <article>." },
  { pattern: /Only \d+ <p> tags/i, fix: "Wrap body copy in <p> tags. Extractor engines look for paragraph elements to segment content." },
  { pattern: /large inline scripts may hide content/i, fix: "Move large inline scripts into external .js files loaded with defer. This reduces HTML size and lets extractors see content sooner." },

  // ─── Schema Parse Performance ───
  { pattern: /No JSON-LD structured data found/i, fix: "Add JSON-LD to <head> with @context, @type, and relevant properties. Start with WebPage, Article, or SoftwareApplication based on page type." },
  { pattern: /schema block\(s\) failed to parse/i, fix: "Validate your JSON-LD with the Schema.org validator. Common issues: trailing commas, unescaped quotes, or missing braces." },
  { pattern: /missing @context/i, fix: "Every JSON-LD block must include \"@context\": \"https://schema.org\". Without it, parsers cannot resolve @type values." },
  { pattern: /No @type extracted/i, fix: "Add a top-level \"@type\" property to every schema object so parsers know what entity you are describing." },
  { pattern: /Only 1 schema type/i, fix: "Add complementary schema types. A blog post often benefits from Article + Person + BreadcrumbList + FAQPage." },
  { pattern: /Deeply nested schema/i, fix: "Flatten deeply nested schema by using @id references instead of inline objects. Simplifies parsing and improves reliability." },

  // ─── Crawler Accessibility ───
  { pattern: /robots\.txt blocks AI crawlers/i, fix: "Remove Disallow rules targeting GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended, and Bytespider. These crawlers power AI answer engines." },
  { pattern: /robots\.txt blocks all crawlers at root/i, fix: "The wildcard Disallow rule blocks every bot including AI. Remove it or scope it to specific paths." },
  { pattern: /No robots\.txt found/i, fix: "Serve a robots.txt at the root. Without one, crawlers have no guidance and may skip parts of your site." },
  { pattern: /Meta robots has "noindex"/i, fix: "Remove the noindex directive from your meta robots tag. This page will not appear in any index while noindex is active." },
  { pattern: /Meta robots has "nofollow"/i, fix: "Remove nofollow if you want link equity to flow. Keep it only for pages where outbound links should be blocked." },
  { pattern: /Possible infinite scroll/i, fix: "Add pagination or a load more fallback so AI crawlers can reach content that infinite scroll hides from static fetches." },
  { pattern: /Hash-based routing detected/i, fix: "Switch from hash routing (#/page) to path-based routing (/page) so crawlers can address each page separately." },
  { pattern: /Very little text and no <noscript> fallback/i, fix: "Add server-rendered text and a <noscript> fallback so the page is useful even when JavaScript does not run." },
  { pattern: /Cookie consent UI detected/i, fix: "Ensure your cookie wall does not block AI crawlers. Most consent managers let you allow-list known bot user agents." },

  // ─── Text Density Performance ───
  { pattern: /Very low text-to-code ratio/i, fix: "Reduce HTML bloat. Unload unused CSS/JS per page, minify markup, and remove wrapper divs that add no content." },
  { pattern: /Text-to-code ratio is .* below the 15% minimum/i, fix: "Aim for 15%+ text-to-code. Remove unused scripts, inline critical CSS only, and trim boilerplate." },
  { pattern: /Text-to-code ratio is .* acceptable but below the 22%/i, fix: "You are close. Reducing unused third-party scripts and consolidating markup will push you into the Excellent band." },
  { pattern: /Scripts \(.+\) far exceed text/i, fix: "Move heavy scripts off the initial page. Load analytics, ads, and trackers after content renders." },
  { pattern: /ad\/sponsor\/promo markers/i, fix: "Consolidate ad slots. Each ad wrapper adds markup without content, dragging the density ratio down." },
  { pattern: /Very little extractable text/i, fix: "Add more visible text content. Pages with under 800 characters of readable text struggle in AI extraction." },

  // ─── Semantic Structure Integrity ───
  { pattern: /heading order violation/i, fix: "Fix heading order: do not skip levels. H1 → H2 → H3 is valid. H1 → H3 is a violation that AI engines flag." },
  { pattern: /Average paragraph .* words — too long/i, fix: "Break long paragraphs into 40–120 word blocks. Short paragraphs are easier for AI engines to quote cleanly." },
  { pattern: /Average paragraph .* words — too short/i, fix: "Combine very short fragments into coherent paragraphs. Single-sentence paragraphs rarely survive AI extraction." },
  { pattern: /Tables without <th> headers/i, fix: "Add <th> header cells to every table. AI engines rely on headers to understand table structure." },
  { pattern: /No lists found/i, fix: "Add bulleted or numbered lists where you enumerate items. Lists are high-signal for AI extraction." },
  { pattern: /ALL-CAPS headings/i, fix: "Use sentence case or title case for headings. ALL-CAPS text is harder for parsers to normalise." },

  // ─── Render Blocking Performance ───
  { pattern: /render-blocking script\(s\) in <head>/i, fix: "Add defer or async to <head> scripts, or move them to the end of <body>. This stops them from blocking HTML parsing." },
  { pattern: /large inline scripts in <head>/i, fix: "Extract large inline scripts into external files loaded with defer. Keeps the initial HTML small and parsing fast." },
  { pattern: /^\d+ stylesheets$/i, fix: "Consolidate stylesheets. Inline critical CSS and defer the rest so text renders before full CSS loads." },
  { pattern: /CSS @import/i, fix: "Replace @import with <link rel=\"stylesheet\"> tags. @import adds blocking round-trips." },
  { pattern: /Web fonts without font-display: swap/i, fix: "Add font-display: swap to every @font-face rule so text renders immediately with a fallback font." },
  { pattern: /TTFB .* — server response is slow/i, fix: "Move to edge caching (Cloudflare, Fastly) or a faster origin. TTFB over 1.8s delays every downstream metric." },
  { pattern: /TTFB .* — above the 800ms/i, fix: "Enable CDN caching and check origin response time. Target TTFB under 800ms." },
  { pattern: /TTFB .* — slightly above/i, fix: "Small TTFB improvement needed. Check server response headers and database query time." },
  { pattern: /FCP: /i, fix: "Improve First Contentful Paint by deferring non-critical CSS, preloading key fonts, and reducing HTML size." },
  { pattern: /FCP slow/i, fix: "FCP is over 1.8s. Inline critical CSS, defer non-critical JS, and consider SSR for the hero content." },
  { pattern: /third-party script domains/i, fix: "Consolidate or remove third-party scripts. Each domain adds DNS lookup, connection, and execution time." },
  { pattern: /render-blocking requests observed live/i, fix: "Audit the render-blocking resources in Live Browser Metrics. Defer or async-load anything not required for first paint." },

  // ─── Content Stability Performance ───
  { pattern: /CLS: .* — poor/i, fix: "Set explicit width/height on images, reserve space for ads and embeds, and avoid injecting content above existing elements." },
  { pattern: /CLS: .* — needs improvement/i, fix: "Reduce layout shifts by reserving space for late-loading elements and using font-display: optional or swap." },
  { pattern: /CLS: .* — borderline/i, fix: "Small layout shifts. Check for images without dimensions and banners that load after initial paint." },
  { pattern: /LCP: /i, fix: "Improve Largest Contentful Paint by preloading the hero image, using fetchpriority=\"high\", and serving correctly-sized images." },
  { pattern: /long task\(s\)/i, fix: "Break up JavaScript tasks over 50ms using setTimeout, requestIdleCallback, or a web worker." },
  { pattern: /client-side routing calls/i, fix: "Ensure client-side routes render complete content on first paint. SPA route changes can leave crawlers seeing the previous page." },
  { pattern: /async fetch calls/i, fix: "Pre-render content that depends on fetch() calls. AI crawlers do not wait for client-side data to arrive." },
  { pattern: /innerHTML assignments/i, fix: "Replace innerHTML writes with server-rendered content where possible. innerHTML often replaces content after initial capture." },
  { pattern: /Service worker registered/i, fix: "Verify your service worker does not serve stale or different content to crawlers. Add a bypass for non-browser user agents." },

  // ─── Fallback ───
  { pattern: /.*/, fix: "Review the module explanation and apply the recommended fix. Re-run the audit after each change to confirm improvement." }
];

export function fixFor(text) {
  const t = String(text || '');
  for (const h of fixHints) {
    if (h.pattern.test(t)) return h.fix;
  }
  return fixHints[fixHints.length - 1].fix;
}