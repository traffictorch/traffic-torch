// Module explanations + fix hints for Lighthouse Plus Tool
export const moduleExplanations = {
  "Core Web Vitals": {
    slug: "core-web-vitals",
    what: "The five page-experience metrics Google uses to grade real user experience: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift), FCP (First Contentful Paint), and TTFB (Time to First Byte). Together they measure how fast, stable, and responsive a page feels to a human visitor.",
    how: "Traffic Torch renders your page in a real headless Chrome instance via Cloudflare Browser Run at a mobile viewport (390x844), injects PerformanceObservers before any script runs, then measures LCP, CLS, FCP, and TBT live during a network-idle load plus a 3.5-second settle window. TTFB is captured from the browser's navigation timing API. INP is proxied by Total Blocking Time when no interaction occurs.",
    why: "Core Web Vitals are a direct ranking signal and the clearest measure of real user experience. Pages that fail them lose engagement, conversions, and search visibility. Passing them is the foundation every other performance improvement builds on."
  },
  "Performance Score": {
    slug: "performance-score",
    what: "The Lighthouse performance category, expressed as what blocks the browser from showing content quickly. It covers render-blocking resources, unused JavaScript and CSS, image delivery, main-thread work, and long tasks that freeze the page.",
    how: "Traffic Torch scans the raw HTML head for scripts that lack defer, async or type=module, counts stylesheets, measures large inline scripts and style blocks, checks every <img> for width, height, lazy loading and fetchpriority, and combines that with live TBT and long-task counts captured by Puppeteer.",
    why: "Performance failures slow every interaction and cost conversions. Every fix here compounds: fewer blocking scripts speed up LCP, less main-thread work improves INP, and smaller stylesheets improve FCP. It is the single module where one change most often lifts several others."
  },
  "Accessibility": {
    slug: "accessibility",
    what: "WCAG 2.2 AA compliance: colour contrast, ARIA correctness, keyboard navigation, focus visibility, alt text on images, form labels, heading order, and landmark regions. It measures whether real people with assistive tech can use the page.",
    how: "Traffic Torch loads axe-core inside Browser Run and runs the full WCAG 2.2 A + AA ruleset against the live DOM, capturing violations with impact level and affected node count. Basic HTML checks (missing alt, unlabelled inputs, tabindex traps) act as fallbacks if axe cannot run.",
    why: "Accessibility is a legal requirement, a Google ranking signal, and a UX quality signal. Roughly 15% of users have a disability. Fixing contrast, focus order, and labels improves the experience for everyone and reduces real legal exposure."
  },
  "Best Practices": {
    slug: "best-practices",
    what: "The safe, correct, modern web fundamentals: HTTPS, no console errors, no deprecated APIs, correctly proportioned images, no exposed framework versions, and sensible security headers.",
    how: "Traffic Torch checks the URL scheme, captures every console error and failed network request during render, scans the raw HTML for deprecated APIs (document.write, attachEvent, document.all), measures image aspect ratio distortion, and inspects response headers for HSTS, X-Content-Type-Options and X-Powered-By.",
    why: "Best-practices failures are the fastest way to lose user trust, break functionality, and trigger browser warnings. A single exposed server version or mixed-content request can downgrade the browser's security posture for every visitor."
  },
  "SEO On-Page": {
    slug: "seo-on-page",
    what: "The classic UX-facing SEO checks: a unique title, a compelling meta description, a canonical link, hreflang when multilingual, correct robots directives, exactly one H1, and a mobile viewport. These are the on-page signals users and search engines see first.",
    how: "Traffic Torch parses the rendered HTML and validates title length (target 50-60 chars), meta description length (target 120-160), canonical presence, hreflang tags, robots meta content, H1 count, and viewport correctness. Each check is scored on a sliding scale rather than pass/fail.",
    why: "These are the visible signals in search results. A missing title, noindex directive, or duplicate H1 will cost you rankings regardless of how good the content is. They are cheap to fix and produce immediate visibility gains."
  },
  "PWA Readiness": {
    slug: "pwa-readiness",
    what: "How ready your site is to be installed as a Progressive Web App: a valid web app manifest, a registered service worker, an offline fallback, correct theme colour and icon set, and HTTPS.",
    how: "Traffic Torch scans the HTML for the manifest link, service worker registration, theme-color meta, apple-touch-icon and mask-icon links, and apple-mobile-web-app-capable. It also confirms the site is served over HTTPS, which PWAs require.",
    why: "Installable PWAs launch from the home screen, work offline, and re-engage users without an app store. They are the closest thing to a native app experience on the open web, and they consistently outperform regular tabs on repeat visits and retention."
  },
  "Resource Optimisation": {
    slug: "resource-optimisation",
    what: "How efficiently your page ships images, JavaScript, CSS, and fonts. It measures file sizes, modern format adoption (WebP/AVIF), lazy loading, font-display strategy, and total transfer weight.",
    how: "Traffic Torch reads the browser's resource timing API for every asset the page fetched, groups them by type, flags images over 200KB, checks for modern image formats, sums script and CSS weight, and looks for font-display: swap on any @font-face rules.",
    why: "Resources dominate load time on mobile. A single 2MB hero image can be the difference between a passing LCP and a failing one. Optimising resources is the highest-leverage performance work available to most sites and directly lifts Core Web Vitals."
  },
  "Third-Party Impact": {
    slug: "third-party-impact",
    what: "Which third-party scripts and domains hurt performance, and by how much. Tag managers, analytics, chat widgets, ads, and embeds all add CPU cost, network requests, and blocking time.",
    how: "Traffic Torch groups every network request by origin, counts unique third-party domains, sums their transfer size and script weight, and flags known heavyweights (Google Tag Manager, Facebook Pixel, Hotjar, Clarity, DoubleClick, YouTube embeds, Intercom, HubSpot).",
    why: "Third-party scripts are usually the largest uncontrolled cost in a page's performance budget. Cutting three heavy scripts often recovers more performance than weeks of internal optimisation. It is the fastest way to improve LCP, TBT, and INP at once."
  },
  "Mobile UX": {
    slug: "mobile-ux",
    what: "How usable the page is on a real phone: correct viewport, readable font sizes, tap targets at least 44-48px, no forced horizontal scroll, no blocked pinch-zoom, and safe-area insets for notched devices.",
    how: "Traffic Torch parses the HTML for viewport meta correctness (no user-scalable=no, no maximum-scale=1), scans inline styles for font sizes under 14px and clickable elements under 44px, checks for horizontal scroll containers, and looks for env(safe-area-inset) or viewport-fit=cover handling.",
    why: "Most traffic is mobile. Small tap targets, tiny text, and blocked zoom drive users away instantly and are a documented Google ranking signal. Safe-area handling prevents content from being hidden behind notches and home indicators."
  },
  "Agentic Browsing": {
    slug: "agentic-browsing",
    what: "How ready the page is for AI agents that browse, fill forms, and complete tasks on behalf of a user (browser copilots, task agents, WebMCP clients). It checks WebMCP integration, semantic landmarks, form labels, focus order, no overlay traps, and stable DOM.",
    how: "Traffic Torch scans for WebMCP markers (window.__webmcp, navigator.modelContext), counts semantic landmark elements, verifies form fields have associated labels, checks for a skip-to-content link, measures modal/dialog density for trap risk, and confirms whether an llms.txt file and AI-friendly robots.txt are present. This module is in beta and will evolve.",
    why: "Agentic browsing is the next layer of the web. Agents need clean structure, labelled forms, and no bot walls to complete real tasks. Pages that pass today will be the ones agents can actually use tomorrow. This module is a strategic bet on where the web is heading."
  }
};

// Per-failed-item fix hints — matched against failed item text, first match wins.
export const fixHints = [
  // ─── Core Web Vitals ───
  { pattern: /^LCP .*poor/i, fix: 'Optimise the Largest Contentful Paint element — usually the hero image or main heading. Compress to WebP/AVIF, add fetchpriority="high" and a preload link, and cut server response time.' },
  { pattern: /^LCP .*needs improvement/i, fix: 'Shave a few hundred milliseconds off LCP by preloading the hero image, deferring non-critical scripts, and serving assets through a CDN.' },
  { pattern: /^LCP not captured/i, fix: 'LCP could not be measured. Ensure the page loads without blocking errors and the hero element renders in the initial viewport.' },
  { pattern: /INP .*poor/i, fix: 'Reduce INP by breaking up long JavaScript tasks, deferring non-critical scripts, and moving heavy computation to a web worker.' },
  { pattern: /INP .*needs improvement/i, fix: 'Trim INP by yielding to the browser between tasks with scheduler.yield() or requestIdleCallback, and lazy-loading third-party scripts.' },
  { pattern: /^CLS .*poor/i, fix: 'Fix layout shift by adding explicit width and height to every image, reserving space for ads and embeds, and loading fonts with font-display: optional.' },
  { pattern: /^CLS .*needs improvement/i, fix: 'Reduce CLS by setting aspect-ratio on media, avoiding late-inserted banners, and reserving space for anything that appears after first paint.' },
  { pattern: /^FCP .*poor/i, fix: 'Improve FCP by eliminating render-blocking CSS and JS, inlining critical CSS, and reducing server response time.' },
  { pattern: /^FCP .*needs improvement/i, fix: 'Speed up FCP by preloading fonts, deferring non-critical scripts, and trimming the critical CSS path.' },
  { pattern: /^TTFB .*poor/i, fix: 'Reduce TTFB by enabling CDN caching, optimising database queries, and checking for cold starts or slow origin responses.' },
  { pattern: /^TTFB .*needs improvement/i, fix: 'Improve TTFB with edge caching, HTTP/2 or HTTP/3, and cutting backend processing before the first byte is sent.' },

  // ─── Performance Score ───
  { pattern: /render-blocking script/i, fix: 'Add defer or async to <head> scripts, or move them to the end of <body>. This stops them from blocking HTML parsing.' },
  { pattern: /stylesheets — reduce|stylesheets —/i, fix: 'Combine stylesheets into fewer files, load only what each page needs, and defer non-critical CSS with media queries or preload.' },
  { pattern: /large inline scripts/i, fix: 'Move large inline scripts into external .js files loaded with defer so they download without blocking the parser.' },
  { pattern: /large inline style/i, fix: 'Inline only the critical above-the-fold CSS. Move the rest into an external stylesheet and load it asynchronously.' },
  { pattern: /image\(s\) missing width\/height/i, fix: 'Add explicit width and height attributes to every <img> so the browser reserves space and prevents layout shift.' },
  { pattern: /without lazy loading/i, fix: 'Add loading="lazy" to below-fold images and fetchpriority="high" to the hero image so it loads first.' },
  { pattern: /Total Blocking Time/i, fix: 'Reduce TBT by splitting long JavaScript tasks, deferring non-critical scripts, and moving heavy work off the main thread.' },
  { pattern: /long tasks/i, fix: 'Break up JavaScript tasks longer than 50ms using setTimeout, requestIdleCallback, or a web worker.' },

  // ─── Accessibility (axe-core) ───
  { pattern: /color-contrast/i, fix: 'Increase text-to-background contrast to at least 4.5:1 for body text and 3:1 for large text. Test with the WebAIM contrast checker.' },
  { pattern: /image-alt/i, fix: 'Add descriptive alt text to every meaningful image. Use alt="" (empty) for purely decorative images.' },
  { pattern: /link-name/i, fix: 'Give every link descriptive text. Avoid "click here" or bare URLs. Use aria-label if the visible text cannot describe the destination.' },
  { pattern: /button-name/i, fix: 'Give every button an accessible name via visible text or aria-label. Icon-only buttons need an aria-label.' },
  { pattern: /label/i, fix: 'Give every form field a visible <label for="..."> or an aria-label attribute. Screen readers depend on these.' },
  { pattern: /landmark/i, fix: 'Wrap page regions in semantic elements: <main>, <nav>, <header>, <footer>. One main per page.' },
  { pattern: /heading-order/i, fix: 'Use headings in sequential order (H1 → H2 → H3) and never skip levels.' },
  { pattern: /image\(s\) without alt/i, fix: 'Add alt text to every <img>. Descriptive for content images, empty for decorative ones.' },
  { pattern: /form field\(s\) may lack labels/i, fix: 'Associate every input with a <label for="id"> or add an aria-label attribute.' },

  // ─── Best Practices ───
  { pattern: /HTTP — not HTTPS/i, fix: 'Serve the site over HTTPS. Enable a free certificate through Let\'s Encrypt, Cloudflare, or your host\'s SSL settings.' },
  { pattern: /console error\(s\)/i, fix: 'Open DevTools → Console, reproduce each error, and fix the failing scripts. Common causes: missing files, wrong MIME types, CORS blocks.' },
  { pattern: /failed network request/i, fix: 'Check the Network tab to identify which requests fail and why. Fix broken URLs, CORS headers, or missing assets.' },
  { pattern: /deprecated API/i, fix: 'Replace document.write, attachEvent, ActiveXObject and document.all with modern equivalents like insertAdjacentHTML and addEventListener.' },
  { pattern: /distorted aspect ratio/i, fix: 'Match the width/height attributes on <img> to the image\'s natural aspect ratio, or use CSS aspect-ratio to preserve it.' },

  // ─── SEO On-Page ───
  { pattern: /Missing <title>/i, fix: 'Add a unique 50-60 character <title> that includes the primary keyword near the front.' },
  { pattern: /Title too short/i, fix: 'Lengthen the title to 50-60 characters. Add a modifier or brand name if needed.' },
  { pattern: /Title too long/i, fix: 'Shorten the title to 50-60 characters so it does not truncate in search results.' },
  { pattern: /Missing meta description/i, fix: 'Write a 120-160 character meta description that summarises the page and includes a call to action.' },
  { pattern: /Meta description short/i, fix: 'Expand the meta description to 120-160 characters — enough to sell the click from the SERP.' },
  { pattern: /Meta description long/i, fix: 'Trim the meta description to 160 characters or fewer so it does not get cut off in SERPs.' },
  { pattern: /Missing canonical/i, fix: 'Add <link rel="canonical" href="https://..."> to tell search engines which URL is the canonical version.' },
  { pattern: /noindex/i, fix: 'Remove noindex from the robots meta tag or X-Robots-Tag header. This is usually leftover from a staging site.' },
  { pattern: /nofollow/i, fix: 'Remove nofollow from the robots meta tag unless you have a specific reason to block link equity.' },
  { pattern: /No H1/i, fix: 'Add exactly one <h1> to the page. It should describe the primary topic using the main keyword.' },
  { pattern: /H1 tags/i, fix: 'Keep a single <h1> per page. Demote the others to <h2> or <h3> depending on structure.' },
  { pattern: /Missing viewport meta/i, fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.' },

  // ─── PWA Readiness ───
  { pattern: /No web app manifest/i, fix: 'Create manifest.json with name, short_name, icons (192 and 512px), theme_color, background_color, start_url, and display: standalone. Link it with <link rel="manifest">.' },
  { pattern: /No service worker/i, fix: 'Create a service worker and register it with navigator.serviceWorker.register(\'/sw.js\') after load. Workbox handles the caching strategies for you.' },
  { pattern: /Missing theme-color/i, fix: 'Add <meta name="theme-color" content="#ffffff"> to match your brand colour.' },
  { pattern: /No apple-touch-icon/i, fix: 'Add <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png"> for iOS home-screen installs.' },
  { pattern: /PWA requires HTTPS/i, fix: 'PWAs require HTTPS. Enable an SSL certificate on your host — Cloudflare, Let\'s Encrypt, and most hosts provide them free.' },

  // ─── Resource Optimisation ───
  { pattern: /image\(s\) over 200KB/i, fix: 'Compress images and serve WebP or AVIF. Aim for under 200KB per image on mobile.' },
  { pattern: /No WebP\/AVIF/i, fix: 'Convert JPG and PNG to WebP or AVIF in your build pipeline. Typical savings are 40-70% per image.' },
  { pattern: /Script total/i, fix: 'Split and lazy-load JavaScript. Ship only what each page uses — audit bundles for unused libraries.' },
  { pattern: /CSS total/i, fix: 'Purge unused CSS with PurgeCSS, Tailwind\'s JIT, or similar. Aim for under 100KB per page.' },
  { pattern: /font-display/i, fix: 'Add font-display: swap to every @font-face so text renders immediately with a fallback while fonts load.' },
  { pattern: /Total transfer/i, fix: 'Reduce total transfer by compressing images, deferring scripts, subsetting fonts, and removing unused assets.' },

  // ─── Third-Party Impact ───
  { pattern: /third-party domain/i, fix: 'Audit every third-party domain. Remove unused analytics, chat widgets, and tag manager tags. Load what remains on idle or interaction.' },
  { pattern: /Third-party scripts/i, fix: 'Defer third-party scripts to load after content. Use Partytown to move the heaviest ones to a web worker.' },

  // ─── Mobile UX ───
  { pattern: /user-scalable=no/i, fix: 'Remove user-scalable=no from the viewport meta — it blocks pinch-zoom and fails WCAG.' },
  { pattern: /maximum-scale=1/i, fix: 'Remove maximum-scale=1 from the viewport meta — it blocks user zoom and fails WCAG.' },
  { pattern: /font sizes under 14px/i, fix: 'Raise base font size to 16px minimum. Body text below 14px is hard to read on phones.' },
  { pattern: /clickable element\(s\) under 44px/i, fix: 'Make every clickable element at least 44x44 CSS pixels. Add padding rather than increasing font size.' },
  { pattern: /Viewport missing width=device-width/i, fix: 'Change the viewport meta to width=device-width so the page scales correctly on phones.' },
  { pattern: /safe-area/i, fix: 'Add viewport-fit=cover to the viewport meta and use env(safe-area-inset-*) padding on sticky headers and footers.' },

  // ─── Agentic Browsing ───
  { pattern: /robots.txt blocks AI agents/i, fix: 'Remove Disallow rules for AI user agents (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) from robots.txt.' },
  { pattern: /semantic landmarks/i, fix: 'Wrap page sections in semantic elements: <main>, <nav>, <header>, <footer>, <article>, <aside>.' },
  { pattern: /form field\(s\) without labels/i, fix: 'Give every form field a <label for="id"> or aria-label. Agents and screen readers rely on these to fill forms.' }
];

export function fixFor(text) {
  if (!text) return '';
  for (const hint of fixHints) {
    if (hint.pattern.test(text)) return hint.fix;
  }
  return 'See the full module guide for detailed fix guidance.';
}