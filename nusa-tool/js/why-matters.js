// why-matters.js — v4

const ENTRIES = [
  /* ── Readability / UX factors ───────────────────────────── */
  { re: /flesch reading ease/i,      text: "Flesch Reading Ease scores how easy a passage is to read. 60+ is plain English; below 40 is academic. Web copy scores best around 65–75." },
  { re: /flesch[\s-]?kincaid/i,      text: "The Kincaid grade level estimates the US school year needed to understand the text. Grade 8 or lower reaches ~80% of adults." },
  { re: /average sentence length/i,  text: "Sentences over 20 words are where comprehension starts dropping. Break them up — short sentences win on mobile." },
  { re: /paragraph density|paragraph length|average paragraph|avg paragraph/i, text: "Dense paragraphs get skipped. 2–4 sentences per paragraph on desktop, 1–2 on mobile — average above ~40 words feels heavy." },
  { re: /text scannability|scannability/i, text: "Most readers scan, not read. Sub-headings, short paragraphs, and bullets make prose scannable." },
  { re: /link density/i,             text: "Too many links per paragraph dilutes the value passed to each one and makes prose hard to read. 6–8 links per block is a good ceiling." },
  { re: /menu structure|menu clarity/i, text: "A clear top-level menu (5–7 items) is the single strongest predictor of whether a first-time visitor finds what they need." },
  { re: /internal linking/i,         text: "Internal links pass authority to important pages and give visitors a next step. Aim for 3–5 contextual links per long page." },
  { re: /CTA prominence|cta strength|call to action/i, text: "If the primary action isn't visually obvious, users default to scrolling — and eventually bouncing." },

  /* ── Accessibility ──────────────────────────────────────── */
  { re: /alt text coverage/i,        text: "Screen readers announce images by their alt text. Missing alt means visually impaired users hear nothing — and search engines can't index the image." },
  { re: /image.*missing alt text|images? do not have alt/i, text: "Screen readers announce images by their alt text. Without it, visually impaired users hear nothing — and Google's Image Search can't rank the image." },
  { re: /color[\s-]?contrast/i,      text: "Low-contrast text is unreadable in sunlight, at small sizes, and for the ~4% of users with low vision. WCAG AA requires 4.5:1 for normal text." },
  { re: /semantic html structure|semantic strength|div[\s-]?soup|low semantic html usage|high div count|semantic html ratio|semantic structure integrity/i, text: "Pages built mostly from div tags give screen readers, search engines, and AI parsers nothing to anchor on. Semantic elements (header, main, article, nav, section, headings) make content machine-readable." },
  { re: /WCAG compliance/i,          text: "WCAG AA is the legal accessibility floor in most jurisdictions. Missing it exposes you to compliance risk and excludes roughly 15% of users." },
  { re: /accessibility below/i,      text: "WCAG AA is the legal accessibility floor in most jurisdictions. Missing it exposes you to compliance risk." },
  { re: /missing semantic landmarks/i, text: "Landmarks (header, main, footer) let screen readers jump directly to the important regions. Without them, everything is one flat wall of divs." },
  { re: /semantic landmark/i,        text: "Landmarks (header, nav, main, footer) let assistive tech and AI agents jump directly to the important regions." },
  { re: /discernible name|link-name/i, text: "A link with no text or aria-label reads as 'link' to screen readers. Every link needs a visible or assistive label." },
  { re: /button.*accessible name|button-name/i, text: "A button with no text or aria-label is unusable to screen readers and voice control. Add visible text or aria-label." },
  { re: /form (field|element)s? (do not|without).*label|associated labels/i, text: "Unlabelled inputs are invisible to screen readers and most autofill tools. Every input needs a <label for> or aria-label." },
  { re: /scrollable[\s-]?region[\s-]?focusable/i, text: "A scrollable region that can't receive keyboard focus traps keyboard-only users. Add tabindex=\"0\" and a role so they can scroll it." },
  { re: /modal.*overlay|overlay trap|excessive modals/i, text: "Modals that trap focus incorrectly lock out keyboard users. Use them sparingly; on open, focus the first element inside; on close, return focus to the trigger." },
  { re: /skip-to-content|skip to content/i, text: "A skip-to-content link lets keyboard and screen-reader users bypass repeated navigation and jump to the main content." },
  { re: /axe-core|axe core/i,        text: "axe-core is an automated accessibility test. It catches common barriers, but manual testing is still needed for full WCAG coverage." },
  { re: /heading order violation|heading order/i, text: "Headings should descend in order — H1, H2, H3, no skips. Out-of-order headings confuse screen readers and AI parsers alike." },

  /* ── Mobile ─────────────────────────────────────────────── */
  { re: /viewport configuration|no responsive viewport|viewport meta|viewport correct/i, text: "A correct viewport meta tag makes mobile browsers use the device width instead of zooming out a desktop layout. Without it, text becomes unreadable and taps miss their targets." },
  { re: /responsive breakpoints|responsive proxy/i, text: "The page needs to reflow cleanly at 390px, 768px, and 1280px. Fixed-width containers break at the small end and waste space at the large end." },
  { re: /touch[\s-]?target|tap target|touch friendly/i, text: "Interactive elements under 44×44px are hard to hit accurately on a phone. Mis-taps frustrate users and drive them back to search results." },
  { re: /pinch-zoom|zoom not restricted|user-scalable/i, text: "Blocking pinch-zoom harms low-vision users. Never use user-scalable=no or maximum-scale=1." },
  { re: /font sizes? ≥|font size/i,  text: "Body text below ~14px is hard to read on phones. Use at least 16px for body copy where possible." },
  { re: /horizontal scroll|stray horizontal/i, text: "Horizontal scroll on mobile usually means an element is wider than the viewport. It causes mis-taps and feels broken." },
  { re: /safe-area|notched/i,        text: "Safe-area insets keep content clear of notches, rounded corners, and home indicators on modern phones." },

  /* ── PWA ────────────────────────────────────────────────── */
  { re: /PWA readiness|pwa readiness/i, text: "A PWA-capable site can be installed to the home screen, works offline, and feels like an app. Requires a manifest, service worker, and HTTPS." },
  { re: /web app manifest|manifest link/i, text: "A web app manifest lets the site be installed to the home screen and tells the OS what name, icon, and theme to use." },
  { re: /service worker/i,           text: "A service worker enables offline access and instant repeat visits. Without one, every return visit is a cold network round-trip." },
  { re: /theme-color/i,              text: "theme-color tints the browser/OS UI to match your brand and makes installed PWAs feel more native." },
  { re: /apple-mobile-web-app-capable/i, text: "apple-mobile-web-app-capable enables standalone home-screen mode on iOS. Without it, iOS opens the site in Safari chrome." },
  { re: /apple-touch-icon/i,         text: "Apple touch icons are the home-screen icons iOS uses. Missing or wrong sizes make the installed app look unpolished." },
  { re: /mask-icon/i,                text: "mask-icon provides a monochrome Safari pinned-tab icon. Without it, Safari uses a generic icon." },

  /* ── Performance / resource optimisation ────────────────── */
  { re: /asset volume/i,             text: "Total page weight predicts how many users bounce before the page finishes loading. Every 100KB above 1MB costs roughly 1% of mobile visitors." },
  { re: /script bloat/i,             text: "Third-party scripts are the largest hidden cost on modern pages. Each one blocks the main thread and adds latency for every user." },
  { re: /font optimization/i,        text: "Web fonts are often the slowest asset. Use font-display: swap and preload the critical weight, or self-host." },
  { re: /lazy loading media|lazy[\s-]?load/i, text: "Images below the fold should use loading=\"lazy\" so they don't compete with above-the-fold content for bandwidth." },
  { re: /image optimization|image format|WebP\/AVIF|modern format/i, text: "Serving WebP or AVIF cuts image weight 30–60% versus JPEG/PNG with no visible quality loss. Big win on mobile." },
  { re: /script optimization|render[\s-]?blocking/i, text: "Every render-blocking script or stylesheet delays the first pixel the user sees. On mobile, each one adds 100–400ms of blank screen." },
  { re: /no blocking scripts in head|blocking scripts? in head|render-blocking request/i, text: "Scripts or styles in the head can block first paint. Inline critical CSS, defer non-critical JS, and keep the head lean." },
  { re: /stylesheet/i,               text: "Each stylesheet is a network request and may block rendering. Bundle or inline critical CSS; defer the rest." },
  { re: /image elements do not have explicit width and height|all images have width\/height|images have width\/height|explicit width and height/i, text: "Explicit width and height reserve space before the image loads, preventing layout shift." },
  { re: /images?, none over|none over \d+KB|images? .*KB/i, text: "Keeping individual images under ~200KB prevents any single asset from dominating page weight, especially on mobile." },
  { re: /scripts?, .*KB|scripts? total|CSS total|total transfer/i, text: "Total transfer size predicts load time and bounce. Trim JS/CSS, compress text, and serve modern image formats." },
  { re: /distorted image aspect ratio/i, text: "Stretching images to the wrong aspect ratio looks broken and hurts perceived quality. Use correct dimensions or object-fit." },

  /* ── Core Web Vitals ────────────────────────────────────── */
  { re: /LCP.*(slow|poor)|largest contentful paint|LCP/i, text: "Largest Contentful Paint is when the user first sees the main thing on the page. Google's 'good' threshold is 2.5s." },
  { re: /CLS|layout shift/i,         text: "Layout shift is the page jumping around while it loads. It's the single biggest cause of mis-taps and rage-quits on mobile." },
  { re: /INP|interaction to next paint|TBT|total blocking/i, text: "INP measures how long the page takes to respond after a tap. Above 200ms the interface feels broken, even if it works." },
  { re: /FCP|first contentful paint/i, text: "FCP is the moment the first pixel paints. Above 1.8s users wonder if the page is loading at all." },
  { re: /TTFB|time to first byte/i,  text: "TTFB is the server's response time. Above 800ms everything downstream is slow, no matter how good the frontend is." },
  { re: /long task/i,                text: "A long task is any block of JavaScript that runs over 50ms without yielding. They make the page feel frozen." },
  { re: /large inline script/i,      text: "Large inline scripts can't be cached across pages and delay first paint. Move them external with defer." },
  { re: /large inline style/i,       text: "Large inline style blocks bloat the HTML and can't be cached. Keep only critical-path CSS inline." },

  /* ── Third parties ──────────────────────────────────────── */
  { re: /third[\s-]?party domain/i,  text: "Every third-party domain adds DNS, TLS, and JS parse cost. Each one is a small ongoing tax on every page view." },
  { re: /third-party scripts|third party scripts/i, text: "Third-party scripts add network, parse, and execution cost. Audit them often; each one taxes every visitor." },
  { re: /heavyweight/i,              text: "A small number of analytics/tag scripts account for most of the JS cost on typical pages. Defer or remove them." },

  /* ── Best practices / security ──────────────────────────── */
  { re: /HTTPS in use|served over HTTPS|HTTPS/i, text: "HTTPS encrypts traffic, protects user data, and is a baseline security and ranking signal. Browsers mark plain HTTP as 'Not secure'." },
  { re: /HSTS header/i,              text: "HSTS tells browsers to only use HTTPS for this site, preventing downgrade attacks and cookie theft on insecure connections." },
  { re: /X-Content-Type-Options/i,   text: "X-Content-Type-Options: nosniff stops browsers from guessing MIME types, reducing drive-by download and XSS risk." },
  { re: /X-Powered-By/i,             text: "X-Powered-By reveals server/framework details to attackers. Removing it reduces fingerprinting surface." },
  { re: /deprecated api/i,           text: "Deprecated browser APIs may be removed or behave inconsistently. Upgrade to the modern replacement to avoid future breakage." },
  { re: /console (error|page error)|JS errors during render/i, text: "A JavaScript error during load or render usually means part of the page failed silently for users and bots. Check DevTools → Console for the message and stack trace." },
  { re: /failed network request/i,   text: "One or more resources returned an error during the audit. Broken assets waste bandwidth, slow the page, and can break functionality." },

  /* ── SEO ────────────────────────────────────────────────── */
  { re: /missing page title|no page title/i, text: "The <title> is what Google shows as the blue link in search results. Without it, Google invents one — usually badly." },
  { re: /title.*\d+\s*chars|title too long|title length/i, text: "Titles around 50–60 characters display fully in search results. Longer titles get truncated; shorter titles may waste space." },
  { re: /missing meta description/i, text: "Meta descriptions are the grey preview text under each search result. Google often rewrites them, but a good one still improves click-through." },
  { re: /meta description.*chars|meta description short/i, text: "Descriptions under 120 chars leave room on the table. 120–160 hits the sweet spot — full preview, front-loaded value." },
  { re: /no h1 on page/i,            text: "The H1 is the page's single most important heading. Search engines and screen readers use it to understand what the page is about." },
  { re: /h1s? on page|multiple h1|exactly one h1|one h1|h1 present/i, text: "One H1 per page gives search engines and screen readers a clear page topic. Use H2/H3 for structure below it." },
  { re: /E-E-A-T signals thin/i,     text: "Google's E-E-A-T framework rewards pages that show a real human behind them. Missing signals depress rankings." },
  { re: /no structured data|structured data.*missing/i, text: "JSON-LD tells search engines exactly what your page is — an article, product, FAQ. Without it, you rely on Google guessing." },
  { re: /canonical/i,                text: "A canonical URL prevents duplicate-content penalties when the same page is reachable at multiple paths." },
  { re: /noindex|nofollow/i,         text: "Robots directives control what search engines index. An accidental noindex hides your page from Google entirely." },
  { re: /hreflang/i,                 text: "hreflang tells search engines which language/region version to show. Missing or wrong hreflang can cause the wrong locale to rank." },

  /* ── AEO ────────────────────────────────────────────────── */
  { re: /llms\.txt/i,                text: "llms.txt tells AI crawlers which pages matter. Without it, ChatGPT and Perplexity re-crawl your whole site every time someone asks a question." },
  { re: /no visible author byline|missing author/i, text: "AI answer engines prefer citing content with a named author. Anonymous pages get skipped in favour of pages that show who wrote them." },
  { re: /no publish\/update date|missing date/i, text: "A visible date signals freshness. Undated pages are assumed stale by AI summarisers." },
  { re: /no FAQPage schema|faqpage schema/i, text: "FAQPage schema turns your Q&A content into directly citable chunks. Without it, AI engines have to guess which questions you answer." },
  { re: /no noscript|noscript/i,     text: "A <noscript> fallback gives non-JS crawlers and users content when scripts are blocked or fail. Many AI crawlers don't execute JavaScript." },
  { re: /render fidelity/i,          text: "How closely the browser-rendered page matches the raw HTML. Big divergence means AI crawlers that skip JS see a different page than users do." },
  { re: /content extractability|extractability/i, text: "How cleanly AI engines can pull answers out of your page. Div-soup, nested tables, and hidden content all reduce extractability." },
  { re: /text density/i,             text: "Ratio of real prose to markup. Pages heavy on scripts and light on words give AI engines little to cite." },
  { re: /text[\s-]?to[\s-]?code|text.*ratio/i, text: "The share of your HTML that is real, readable text. Below 15% means the page is mostly markup — search engines and AI parsers find little to quote." },
  { re: /schema parse|structured data performance|JSON-LD block|schema types/i, text: "JSON-LD is machine-readable structured data. Slow schema blocks delay AI engines reading what your page is about; more valid types help them understand entities." },
  { re: /crawler accessibility|AI agents not blocked|No AI crawler blocking|robots\.txt/i, text: "Whether search and AI crawlers can reach and read your page. If robots.txt blocks them, agents can't cite your content." },
  { re: /content stability performance/i, text: "How much the visible content changes during load. If a bot snapshots the page mid-render, it may see the wrong thing." },
  { re: /DOM stability|dom stability/i, text: "How much the DOM mutates after first paint. High churn confuses crawlers and hurts Core Web Vitals." },
  { re: /JS-injected|rendered words are JS/i, text: "Words injected by JavaScript may be invisible to crawlers and AI agents that don't execute JS. Server-render or prerender key content." },
  { re: /paragraph tags/i,           text: "Paragraph tags break text into readable, extractable chunks. Few or missing <p> tags hurt scanning and AI answer extraction." },
  { re: /list\(s\)|lists?/i,         text: "Lists make related items scannable and machine-readable. Use <ul>/<ol> instead of divs with bullets." },

  /* ── Agentic browsing ───────────────────────────────────── */
  { re: /form fields? labelled/i,    text: "Labelled form fields let screen readers and AI agents understand and complete forms reliably." },
  { re: /WebMCP/i,                   text: "WebMCP markers expose page capabilities to AI agents, helping them understand actions and data without guessing." },

  /* ── Section-level labels ───────────────────────────────── */
  { re: /^Readability$/i,            text: "Readability measures how easily a visitor can understand your copy. Plain language reduces bounce and improves conversion." },
  { re: /^Navigation$/i,             text: "Navigation quality determines whether visitors find what they need. Clear menus and internal links keep sessions alive." },
  { re: /^Accessibility$/i,          text: "Accessibility is about making the site usable by everyone, including people with disabilities. It also improves SEO and legal compliance." },
  { re: /^Mobile( UX)?$/i,           text: "Mobile is the majority of web traffic. If the mobile experience is poor, most users never see the desktop version." },
  { re: /^Performance( Score)?$/i,   text: "Performance is how quickly the page loads and responds. Faster pages reduce bounce, improve conversion, and help rankings." },
  { re: /^SEO( On-Page)?$/i,         text: "SEO covers how discoverable your pages are in search. It combines content, technical, and authority signals." },
  { re: /^Core Web Vitals$/i,        text: "Core Web Vitals are Google's page-experience metrics: LCP, INP, and CLS. Good scores correlate with lower bounce and better rankings." },
  { re: /^Best Practices$/i,         text: "Best-practice checks catch security, console, and asset issues that don't always show up in user-facing metrics but affect trust and stability." },
  { re: /^Resource Optimisation$/i,  text: "Resource optimisation is about shipping the smallest useful payload: compressed images, lean JS/CSS, and minimal transfer size." },
  { re: /^Third-Party Impact$/i,     text: "Third-party impact measures the cost of external domains and scripts. Each one adds latency and a potential point of failure." },
  { re: /^Agentic Browsing$/i,       text: "Agentic browsing checks whether AI agents can navigate, understand, and act on your site without a human." },
  { re: /^AEO$/i,                    text: "AEO (Answer Engine Optimization) is about making content easy for AI answer engines to extract and cite." },
  { re: /27\/28 checks passed/i,     text: "27 of 28 automated checks passed. The remaining item is a review flag, not necessarily a failure." }
];

export function whyMatters(label) {
  if (!label) return null;
  for (const e of ENTRIES) if (e.re.test(label)) return e.text;
  return null;
}