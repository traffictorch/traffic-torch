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