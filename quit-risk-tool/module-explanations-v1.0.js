// quit-risk-tool/module-explanations-v1.0.js

export const moduleExplanations = [
  {
    id: "readability",
    emoji: "📖",
    name: "Readability",
    what: "Readability measures how easily visitors can understand and scan your content. It combines classic formulas like Flesch with modern web factors such as sentence length, paragraph structure, and visual hierarchy. High readability keeps users engaged longer and reduces bounce rates. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#readability-what' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Readability is tested using Flesch Reading Ease and Flesch-Kincaid Grade Level scores, average sentence length, paragraph density, and scannability elements like bolding, lists, and subheadings. Each factor is scored individually and combined into an overall module grade. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#readability-how' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Easy-to-read content reaches a wider audience, improves engagement metrics, and reduces cognitive strain. Search engines reward pages where users stay longer and interact more. Great readability is essential for modern web success. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#readability-why' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "navigation",
    emoji: "🧭",
    name: "Navigation",
    what: "Navigation Clarity evaluates how easily users can move through your site and find what they need. It examines menu structure, link density, internal linking patterns, and call-to-action visibility. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#navigation-what' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Navigation is tested by analyzing link density, menu organization, internal linking balance, and CTA prominence. Each factor is scored based on best practices for user flow and discoverability. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#navigation-how' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Intuitive navigation lowers bounce rates, increases pages per session, and helps users complete goals faster. Clear structure strengthens topical authority and sends positive user signals to search engines. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#navigation-why' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "accessibility",
    emoji: "♿",
    name: "Accessibility",
    what: "Accessibility Health measures how inclusive your page is for users with disabilities. It checks alt text coverage, color contrast, semantic HTML structure, and overall WCAG alignment. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#accessibility-what' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Accessibility is tested through alt text completeness, contrast ratios, proper heading hierarchy, landmarks, and general WCAG compliance signals. Each factor contributes to the overall score. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#accessibility-how' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Accessible sites reach 15-20% more users, build trust, and face lower legal risk. Many accessibility improvements also enhance SEO and overall user experience for everyone. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#accessibility-why' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "mobile",
    emoji: "📱",
    name: "Mobile & PWA",
    what: "Mobile & PWA Readiness checks how well your page works on phones and tablets. It evaluates viewport configuration, responsive design, touch targets, and progressive web app signals. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#mobile-what' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Mobile is tested by checking viewport meta tag, breakpoint behavior, touch target size, and PWA indicators like manifest and service worker presence. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#mobile-how' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Most users browse on mobile devices. Poor mobile experience causes immediate bounces. PWA capabilities increase return visits and engagement significantly. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#mobile-why' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>"
  },
  {
    id: "speed",
    emoji: "⚡",
    name: "Performance",
    what: "Performance Optimization measures loading speed and resource efficiency. It flags heavy assets, script bloat, font issues, lazy loading, and image optimization opportunities. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#performance-what' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    how: "Performance is tested through proxies for asset volume, script size, font delivery, lazy loading implementation, image formats, and render-blocking resources. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#performance-how' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>",
    why: "Fast pages keep users and reduce bounce rates. Speed is a direct ranking factor. Users perceive faster sites as higher quality and more professional. <a href='https://traffictorch.net/blog/posts/user-experience-help-guide/#performance-why' class='text-purple-600 dark:text-purple-400 hover:underline font-medium ml-1'>Learn more →</a>"
  }
];

// ─────────────────────────────────────────────────────────────────────
// FIX HINTS
// Ordered regex → fix map. First match wins.
// Grouped by module. Each fix is 1–2 actionable sentences.
// ─────────────────────────────────────────────────────────────────────
export const fixHints = [
  // ── READABILITY ──────────────────────────────────────────────────
  { pattern: /flesch\s*reading\s*ease/i,                    fix: "Simplify vocabulary and shorten sentences to raise Flesch Reading Ease above 60. Target common words, one idea per sentence, and break long clauses into separate statements." },
  { pattern: /flesch[- ]?kincaid|grade\s*level/i,            fix: "Lower the Flesch-Kincaid grade level to 8 or below by shortening sentences and replacing multi-syllable words with everyday alternatives." },
  { pattern: /average\s*sentence\s*length|sentence\s*length/i, fix: "Keep average sentence length under 20 words. Split any sentence over 25 words into two, and vary rhythm between short and medium sentences." },
  { pattern: /paragraph\s*density|paragraph\s*length|wall\s*of\s*text/i, fix: "Limit paragraphs to 3–5 sentences and add whitespace between ideas. Use single-sentence paragraphs for emphasis to break up dense blocks." },
  { pattern: /scannab|text\s*scann/i,                        fix: "Add bold key phrases, bullet lists, and descriptive subheadings every 2–3 paragraphs. Front-load the most important information so scanners catch it immediately." },

  // ── NAVIGATION ───────────────────────────────────────────────────
  { pattern: /link\s*density/i,                              fix: "Reduce the number of links per screen to avoid choice overload. Audit navigation and remove redundant, low-value, or duplicate links so primary actions stand out." },
  { pattern: /menu\s*structure|menu\s*clarity/i,             fix: "Limit top-level menu items to 5–7 with descriptive labels users immediately understand. Group related items under clear categories rather than exposing every page." },
  { pattern: /internal\s*linking|internal\s*link\s*balance/i, fix: "Add contextual internal links from body content to related pages using descriptive anchor text. Aim for 2–5 relevant internal links per 1,000 words." },
  { pattern: /cta\s*prominence|call[- ]to[- ]action|cta\s*visibility/i, fix: "Place primary CTAs above the fold with contrasting colors and action-oriented text. Ensure buttons are large enough to tap and visually distinct from surrounding content." },

  // ── ACCESSIBILITY ────────────────────────────────────────────────
  { pattern: /alt\s*text|image\s*alt|missing\s*alt/i,        fix: "Add concise descriptive alt text to every informative image, and use alt=\"\" only for purely decorative images. Never omit the alt attribute entirely on meaningful images." },
  { pattern: /contrast|color\s*contrast/i,                   fix: "Increase text/background contrast to meet WCAG AA (4.5:1 for normal text, 3:1 for large). Use a contrast checker like WebAIM and adjust colors or font weight until it passes." },
  { pattern: /semantic\s*html|semantic\s*structure|heading\s*hierarchy/i, fix: "Use one H1 per page with a logical H2/H3 hierarchy, and replace generic divs with semantic elements like <main>, <article>, <section>, <nav>, and <aside>." },
  { pattern: /wcag|accessibility\s*compliance/i,              fix: "Run an automated audit with WAVE, axe, or Lighthouse, then manually test keyboard navigation and a screen reader. Fix high-impact issues (alt text, contrast, focus states) first." },

  // ── MOBILE & PWA ─────────────────────────────────────────────────
  { pattern: /viewport/i,                                    fix: "Add the exact meta tag <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> and never restrict zoom with user-scalable=no or maximum-scale=1." },
  { pattern: /responsive|breakpoint/i,                       fix: "Use relative units, flexible grids, and a mobile-first approach. Test at 320px, 375px, 768px, and 1024px widths to catch horizontal scrolling and overflow." },
  { pattern: /touch\s*target|tap\s*target/i,                 fix: "Ensure all interactive elements are at least 44×44 pixels with adequate spacing. Add padding around small links and buttons so taps don't collide." },
  { pattern: /pwa|manifest|service\s*worker/i,               fix: "Add a valid manifest.json with name, icons, and theme colors, register a basic service worker, and serve the site over HTTPS to enable PWA install prompts and offline support." },

  // ── PERFORMANCE ──────────────────────────────────────────────────
  { pattern: /image\s*optim|image\s*format|webp|avif/i,      fix: "Convert images to WebP or AVIF, serve responsive sizes with srcset/sizes, and compress files without visible quality loss. Target under 100 KB per image where possible." },
  { pattern: /lazy\s*load|lazy\s*loading/i,                  fix: "Add native loading=\"lazy\" to every offscreen image and iframe below the fold. Use preload=\"none\" on videos that autoplay late or on user interaction." },
  { pattern: /font\s*optim|font\s*display|webfont/i,         fix: "Limit to 2–3 font families and essential weights, add font-display: swap to avoid invisible text, and preload the critical font files used above the fold." },
  { pattern: /script\s*bloat|unused\s*script|javascript\s*bloat/i, fix: "Audit and remove unused JavaScript, bundle and minify what remains, and defer or async non-critical scripts. Replace heavy third-party libraries with lightweight alternatives where possible." },
  { pattern: /render[- ]?block|blocking\s*resource|script\s*optimization/i, fix: "Inline or preload critical CSS, defer or async non-critical JS, and remove unused code. Aim for no more than 2–3 small blocking resources on the critical path." },
  { pattern: /asset\s*volume|asset\s*size|heavy\s*asset/i,   fix: "Compress all images aggressively, enable GZIP or Brotli on the server, minify CSS/JS, and remove any unused assets or libraries." },

  // ── GENERIC / CROSS-MODULE (fallbacks, kept last so specific patterns win) ──
  { pattern: /h1|heading/i,                                  fix: "Use exactly one H1 per page that describes the main topic, followed by a logical H2/H3 hierarchy without skipping levels." },
  { pattern: /title\s*tag|page\s*title/i,                    fix: "Write a unique, descriptive title under 60 characters that includes the primary keyword and brand, and matches the page's search intent." },
  { pattern: /meta\s*description/i,                          fix: "Write a compelling 140–160 character meta description that summarises the page value and includes the primary keyword naturally." },
  { pattern: /external\s*link|outbound\s*link/i,             fix: "Cite authoritative external sources with rel=\"noopener\" on target=\"_blank\" links, and avoid excessive outbound links that dilute topical focus." },
  { pattern: /readability/i,                                 fix: "Simplify language, shorten sentences, and break content into scannable blocks with subheadings, bold key points, and bullet lists." },
  { pattern: /navigation/i,                                  fix: "Simplify menus to 5–7 clear items, add descriptive internal links in body content, and make the primary CTA visually prominent above the fold." },
  { pattern: /accessibility/i,                               fix: "Add alt text to informative images, ensure 4.5:1 contrast on normal text, use semantic HTML, and test with a screen reader and keyboard." },
  { pattern: /mobile/i,                                      fix: "Use a proper viewport meta tag, responsive layout, and touch targets of at least 44×44 pixels. Test on real devices, not just browser resize." },
  { pattern: /performance|speed|load\s*time/i,               fix: "Compress images, lazy-load offscreen media, minify and defer JavaScript, and reduce render-blocking resources on the critical path." },
  { pattern: /slow|heavy/i,                                  fix: "Measure with Lighthouse or WebPageTest, then optimise the largest assets first. Usually images, fonts, and unused JavaScript deliver the biggest wins." },
  { pattern: /layout\s*shift|cls/i,                          fix: "Set explicit width and height on images and embeds, reserve space for ads and dynamic content, and preload fonts to prevent layout shift." },
  { pattern: /lcp|largest\s*contentful/i,                    fix: "Optimise the largest above-the-fold element — usually a hero image or H1. Preload it, compress it, and serve it from a fast CDN." },
  { pattern: /inp|interaction\s*to\s*next\s*paint|fid/i,     fix: "Reduce main-thread work by splitting long tasks, deferring non-critical JavaScript, and avoiding heavy event handlers on scroll or input." },
  { pattern: /cache|caching/i,                               fix: "Set long cache lifetimes on static assets with content-hashed filenames, and use a CDN to serve them from edge locations." },
  { pattern: /cdn/i,                                         fix: "Serve static assets through a CDN like Cloudflare or Fastly to reduce latency for global visitors." },
  { pattern: /https|ssl|secure/i,                            fix: "Serve the entire site over HTTPS with a valid certificate and redirect all HTTP traffic to HTTPS." },
  { pattern: /redirect/i,                                    fix: "Eliminate unnecessary redirect chains, point every redirect directly to the final URL, and keep redirects under 2 hops." },
  { pattern: /404|broken\s*link/i,                           fix: "Find and fix broken links, redirect old URLs to the closest matching live page, and monitor 404s in Search Console." },
  { pattern: /cookie|consent|banner/i,                       fix: "Make consent banners non-blocking on first paint, persist the user's choice, and avoid loading tracking scripts before consent." },
  { pattern: /popup|interstitial|modal/i,                    fix: "Avoid full-screen interstitials on entry. Delay popups until after meaningful engagement, and never block the main content on mobile." }
];

const FIX_FALLBACK = "Review this check against current best practices and apply the relevant fix to improve the module score.";

export function fixFor(text) {
  if (!text) return FIX_FALLBACK;
  const needle = String(text);
  for (const hint of fixHints) {
    if (hint.pattern.test(needle)) return hint.fix;
  }
  return FIX_FALLBACK;
}

// ─────────────────────────────────────────────────────────────────────
// Deep-dive cards (unchanged behaviour)
// ─────────────────────────────────────────────────────────────────────
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

  const moduleCards = moduleExplanations.map(m => `
    <div id="${m.id}" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-purple-500 text-center">
      <div class="text-6xl mb-6">${m.emoji}</div>
      <div class="text-3xl font-black text-purple-600 dark:text-purple-400 mb-8">${m.name}</div>
      <details class="group">
        <summary class="cursor-pointer text-orange-700 dark:text-orange-300 font-bold hover:underline inline-flex items-center justify-center gap-2 whitespace-nowrap">
          Learn More <span class="text-2xl group-open:rotate-180 transition-transform">↓</span>
        </summary>
        <div class="mt-6 space-y-6 text-left max-w-lg mx-auto text-gray-700 dark:text-gray-300 leading-relaxed">
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">What is ${m.name}?</p>
            <p>${m.what}</p>
          </div>
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">How is ${m.name} tested?</p>
            <p>${m.how}</p>
          </div>
          <div>
            <p class="font-bold text-purple-600 dark:text-purple-400 text-lg mb-2">Why does ${m.name} matter?</p>
            <p>${m.why}</p>
          </div>
        </div>
      </details>
    </div>
  `).join('');

  const allToolsCard = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 hover:shadow-xl transition-shadow border-l-4 border-indigo-500 text-center lg:col-span-1">
      <div class="text-6xl mb-6">🛠️</div>
      <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-8">SEO UX AI Tools</div>
      <a href="https://traffictorch.net/ai-seo-ux-tools/" class="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition">
        Explore All Tools
      </a>
    </div>`;

  container.innerHTML = moduleCards + allToolsCard;

  openDetailsFromHash();
});

window.addEventListener('hashchange', openDetailsFromHash);