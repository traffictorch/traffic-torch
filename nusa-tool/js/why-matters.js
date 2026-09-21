// why-matters.js — plain-English reason each finding matters.
// Lookup by regex against the finding label. Every UX factor name has an entry.

const ENTRIES = [
  /* ── Readability ──────────────────────────────────────── */
  { re: /flesch reading ease/i,
    text: "Flesch Reading Ease scores how easy a passage is to read. 60+ is plain English; below 40 is academic. Web copy scores best around 65–75." },
  { re: /flesch[\s-]?kincaid grade/i,
    text: "The Kincaid grade level estimates the US school year needed to understand the text. Grade 8 or lower reaches ~80% of adults." },
  { re: /average sentence length/i,
    text: "Sentences over 20 words are where comprehension starts dropping. Break them up — short sentences win on mobile." },
  { re: /paragraph density|paragraph length/i,
    text: "Dense paragraphs get skipped. 2–4 sentences per paragraph on desktop, 1–2 on mobile." },
  { re: /text scannability|scannability/i,
    text: "Most readers scan, not read. Sub-headings, short paragraphs, and bullets make prose scannable." },

  /* ── Navigation ───────────────────────────────────────── */
  { re: /link density/i,
    text: "Too many links per paragraph dilutes the value passed to each one and makes prose hard to read. 6–8 links per block is a good ceiling." },
  { re: /menu structure|menu clarity/i,
    text: "A clear top-level menu (5–7 items) is the single strongest predictor of whether a first-time visitor finds what they need." },
  { re: /internal linking/i,
    text: "Internal links pass authority to important pages and give visitors a next step. Aim for 3–5 contextual links per long page." },
  { re: /CTA prominence|cta strength|call to action/i,
    text: "If the primary action isn't visually obvious, users default to scrolling — and eventually bouncing." },

  /* ── Accessibility ────────────────────────────────────── */
  { re: /alt text coverage/i,
    text: "Screen readers announce images by their alt text. Missing alt means visually impaired users hear nothing — and search engines can't index the image." },
  { re: /image.*missing alt text|images? do not have alt/i,
    text: "Screen readers announce images by their alt text. Without it, visually impaired users hear nothing — and Google's Image Search can't rank the image." },
  { re: /color[\s-]?contrast/i,
    text: "Low-contrast text is unreadable in sunlight, at small sizes, and for the ~4% of users with low vision. WCAG AA requires 4.5:1 for normal text." },
  { re: /semantic html structure|semantic strength|div[\s-]?soup|low semantic html usage/i,
    text: "Pages built entirely from div tags give screen readers and AI parsers nothing to anchor on. Sections, articles, and headings make content machine-readable." },
  { re: /WCAG compliance/i,
    text: "WCAG AA is the legal accessibility floor in most jurisdictions. Missing it exposes you to compliance risk and excludes roughly 15% of users." },
  { re: /accessibility below/i,
    text: "WCAG AA is the legal accessibility floor in most jurisdictions. Missing it exposes you to compliance risk." },
  { re: /missing semantic landmarks/i,
    text: "Landmarks (header, main, footer) let screen readers jump directly to the important regions. Without them, everything is one flat wall of divs." },

  /* ── Mobile ───────────────────────────────────────────── */
  { re: /viewport configuration|no responsive viewport|viewport meta/i,
    text: "Without a viewport meta tag, mobile browsers render at desktop width and zoom out. Text becomes unreadable and taps miss their targets." },
  { re: /responsive breakpoints|responsive proxy/i,
    text: "The page needs to reflow cleanly at 390px, 768px, and 1280px. Fixed-width containers break at the small end and waste space at the large end." },
  { re: /touch[\s-]?target|tap target|touch friendly/i,
    text: "Interactive elements under 44×44px are hard to hit accurately on a phone. Mis-taps frustrate users and drive them back to search results." },
  { re: /PWA readiness|pwa readiness/i,
    text: "A PWA-capable site can be installed to the home screen, works offline, and feels like an app. Requires a manifest, service worker, and HTTPS." },

  /* ── Performance ──────────────────────────────────────── */
  { re: /asset volume/i,
    text: "Total page weight predicts how many users bounce before the page finishes loading. Every 100KB above 1MB costs you roughly 1% of mobile visitors." },
  { re: /script bloat/i,
    text: "Third-party scripts are the largest hidden cost on modern pages. Each one blocks the main thread and adds latency for every user." },
  { re: /font optimization|font optimization/i,
    text: "Web fonts are often the slowest asset. Use font-display: swap and preload the critical weight, or self-host." },
  { re: /lazy loading media|lazy loading|lazy[\s-]?load/i,
    text: "Images below the fold should use loading=\"lazy\" so they don't compete with above-the-fold content for bandwidth." },
  { re: /image optimization|image format/i,
    text: "Serving WebP or AVIF cuts image weight 30–60% versus JPEG/PNG with no visible quality loss." },
  { re: /script optimization|render[\s-]?blocking/i,
    text: "Every render-blocking script or stylesheet delays the first pixel the user sees. On mobile, each one adds 100–400ms of blank screen." },

  /* ── Core Web Vitals ──────────────────────────────────── */
  { re: /LCP.*(slow|poor)|largest contentful paint/i,
    text: "Largest Contentful Paint is when the user first sees the main thing on the page. Google's 'good' threshold is 2.5s." },
  { re: /CLS|layout shift/i,
    text: "Layout shift is the page jumping around while it loads. It's the single biggest cause of mis-taps and rage-quits on mobile." },
  { re: /INP|interaction to next paint|TBT/i,
    text: "INP measures how long the page takes to respond after a tap. Above 200ms the interface feels broken, even if it works." },
  { re: /FCP|first contentful paint/i,
    text: "FCP is the moment the first pixel paints. Above 1.8s users wonder if the page is loading at all." },
  { re: /TTFB|time to first byte/i,
    text: "TTFB is the server's response time. Above 800ms everything downstream is slow, no matter how good the frontend is." },

  /* ── SEO ──────────────────────────────────────────────── */
  { re: /missing page title|no page title/i,
    text: "The <title> is what Google shows as the blue link in search results. Without it, Google invents one — usually badly." },
  { re: /title.*\d+\s*chars|title too long/i,
    text: "Titles over 60 characters get truncated in search results. The tail of your title — often the most descriptive part — becomes '…'." },
  { re: /missing meta description/i,
    text: "Meta descriptions are the grey preview text under each search result. Google often rewrites them, but a good one still improves click-through." },
  { re: /meta description.*chars/i,
    text: "Descriptions over 160 characters get cut off. Front-load the value in the first 155." },
  { re: /no h1 on page/i,
    text: "The H1 is the page's single most important heading. Search engines and screen readers use it to understand what the page is about." },
  { re: /h1s? on page|multiple h1/i,
    text: "Multiple H1s confuse the heading hierarchy. One H1, then H2s for sections, H3s for subsections." },
  { re: /E-E-A-T signals thin/i,
    text: "Google's E-E-A-T framework rewards pages that show a real human behind them. Missing signals depress rankings." },
  { re: /no structured data|structured data.*missing/i,
    text: "JSON-LD tells search engines exactly what your page is — an article, product, FAQ. Without it, you rely on Google guessing." },
  { re: /canonical/i,
    text: "A canonical URL prevents duplicate-content penalties when the same page is reachable at multiple paths." },
  { re: /noindex|nofollow/i,
    text: "Robots directives control what search engines index. An accidental noindex hides your page from Google entirely." },
  { re: /failed network request/i,
    text: "One or more resources returned an error during the audit. Broken assets waste bandwidth, slow the page, and can break functionality." },

  /* ── AEO ──────────────────────────────────────────────── */
  { re: /llms\.txt/i,
    text: "llms.txt tells AI crawlers which pages matter. Without it, ChatGPT and Perplexity re-crawl your whole site every time someone asks a question." },
  { re: /no visible author byline|missing author/i,
    text: "AI answer engines prefer citing content with a named author. Anonymous pages get skipped in favour of pages that show who wrote them." },
  { re: /no publish\/update date|missing date/i,
    text: "A visible date signals freshness. Undated pages are assumed stale by AI summarisers." },
  { re: /no FAQPage schema|faqpage schema/i,
    text: "FAQPage schema turns your Q&A content into directly citable chunks. Without it, AI engines have to guess which questions you answer." },
  { re: /no noscript/i,
    text: "A noscript fallback ensures content is readable even when JavaScript hasn't run. Some AI crawlers don't execute JS." },
  { re: /render fidelity/i,
    text: "How closely the browser-rendered page matches the raw HTML. Big divergence means AI crawlers that skip JS see a different page than users do." },
  { re: /content extractability|extractability/i,
    text: "How cleanly AI engines can pull answers out of your page. Div-soup, nested tables, and hidden content all reduce extractability." },
  { re: /text density/i,
    text: "Ratio of real prose to markup. Pages heavy on scripts and light on words give AI engines little to cite." },
  { re: /text[\s-]?to[\s-]?code|text.*ratio/i,
    text: "The share of your HTML that is real, readable text. Below 15% means the page is mostly markup — search engines and AI parsers find little to quote." },
  { re: /schema parse|structured data performance/i,
    text: "How fast the page exposes its JSON-LD. Slow schema blocks delay AI engines reading what your page is about." },
  { re: /crawler accessibility/i,
    text: "Whether AI and search crawlers can reach and read your page without executing client-side JS. Many bots don't." },
  { re: /content stability performance/i,
    text: "How much the visible content changes during load. If a bot snapshots the page mid-render, it may see the wrong thing." },
  { re: /DOM stability|dom stability/i,
    text: "How much the DOM mutates after first paint. High churn confuses crawlers and hurts Core Web Vitals." }
];

export function whyMatters(label) {
  if (!label) return null;
  for (const e of ENTRIES) if (e.re.test(label)) return e.text;
  return null;
}
