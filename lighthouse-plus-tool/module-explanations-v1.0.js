// Module explanations for Lighthouse Plus Tool
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