// AEO Performance Tool – plugin & approach solutions
export const pluginData = {
  "Render Fidelity": {
    WordPress: [
      {
        name: "LiteSpeed Cache",
        desc: "Server-level page caching (when on LiteSpeed/QUIC.cloud) plus full-page cache and ESI. Serves fully-rendered HTML to headless crawlers so content is present before JS timeouts.",
        link: "https://wordpress.org/plugins/litespeed-cache/",
        homeLink: "https://www.litespeedtech.com/"
      },
      {
        name: "WP Rocket",
        desc: "Premium caching + preload that generates and serves static HTML. Headless browsers receive complete markup without waiting for client-side rendering or hydration.",
        link: "https://wp-rocket.me/",
        homeLink: "https://wp-rocket.me/"
      },
      {
        name: "FlyingPress",
        desc: "Premium all-in-one optimizer with page caching, critical CSS and JS delay. Improves render consistency for headless extraction by reducing hydration mismatches.",
        link: "https://flyingpress.com/",
        homeLink: "https://flyingpress.com/"
      }
    ],
    Shopify: [
      {
        name: "Tiny SEO Speed Image Optimizer (TinyIMG / TinySEO)",
        desc: "Minifies JS/CSS, controls third-party scripts and optimizes assets so headless crawlers reach content faster with less payload.",
        link: "https://apps.shopify.com/smart-image-optimizer",
        homeLink: "https://tiny-img.com/"
      },
      {
        name: "Native theme + Liquid SSR",
        desc: "Prefer server-rendered Liquid sections over pure client-side JS blocks so primary content exists in the initial HTML response.",
        link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Wix Velo SSR",
        desc: "Use Velo server-side rendering for critical content so it appears in the raw HTML that AI crawlers receive.",
        link: "https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/wix-editor-elements/about-wix-editor-elements",
        homeLink: "https://www.wix.com/velo"
      }
    ],
    Squarespace: [
      {
        name: "Built-in CDN + caching",
        desc: "Squarespace serves pre-rendered HTML from its CDN. Keep primary content in native blocks rather than JS-gated code injection.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Static export / native HTML",
        desc: "Webflow publishes static HTML by default. Keep interactive content inside the initial DOM rather than client-only mounts.",
        link: "https://university.webflow.com/lesson/publish-your-site",
        homeLink: "https://webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Prerender.io",
        desc: "Serves pre-rendered HTML snapshots to crawlers without changing the frontend stack.",
        link: "https://prerender.io/",
        homeLink: "https://prerender.io/"
      },
      {
        name: "Cloudflare Browser Rendering / Pages",
        desc: "Use Cloudflare’s rendering or static generation so AI crawlers receive complete HTML.",
        link: "https://developers.cloudflare.com/browser-rendering/",
        homeLink: "https://developers.cloudflare.com/"
      },
      {
        name: "Framework SSR/SSG",
        desc: "Next.js, Nuxt, SvelteKit or Astro in SSR/SSG mode so the initial response already contains the rendered content.",
        link: "https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering",
        homeLink: "https://nextjs.org/"
      }
    ]
  },
  "DOM Stability": {
    WordPress: [
      {
        name: "Perfmatters",
        desc: "Script Manager disables unused scripts per page/post, preventing late DOM mutations from third-party JS.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      },
      {
        name: "WP Rocket",
        desc: "Delay JavaScript execution until user interaction so the DOM stabilises before crawlers snapshot it.",
        link: "https://wp-rocket.me/",
        homeLink: "https://wp-rocket.me/"
      },
      {
        name: "Autoptimize",
        desc: "Defers and aggregates scripts, reducing the number of late-running scripts that rewrite the DOM.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      }
    ],
    Shopify: [
      {
        name: "Theme script audit + defer",
        desc: "Remove unused apps and add defer to non-critical scripts in theme.liquid so DOM mutations after load are minimised.",
        link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Native performance settings",
        desc: "Disable unused animations and third-party embeds that mutate the DOM after load.",
        link: "https://support.wix.com/en/article/wix-editor-adjusting-your-sites-performance-settings",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Code Injection audit",
        desc: "Remove or defer late-loading scripts injected via Code Injection that insert nodes after the load event.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Interactions & Animations audit",
        desc: "Disable unused IX2 interactions that inject or rewrite nodes after load.",
        link: "https://university.webflow.com/lesson/interactions-and-animations",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Avoid document.write & late mounts",
        desc: "Replace document.write with standard DOM APIs and mount primary content before hydration.",
        link: "https://developer.mozilla.org/en-US/docs/Web/API/Document/write",
        homeLink: "https://developer.mozilla.org/"
      },
      {
        name: "Framework SSR mode",
        desc: "Enable full SSR so the initial HTML already contains the stable DOM tree.",
        link: "https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering",
        homeLink: "https://nextjs.org/"
      }
    ]
  },
  "Content Extractability": {
    WordPress: [
      {
        name: "Gutenberg (Block Editor)",
        desc: "Native blocks output semantic article, section, heading and paragraph markup instead of pure div soup.",
        link: "https://wordpress.org/documentation/article/block-editor/",
        homeLink: "https://wordpress.org/"
      },
      {
        name: "Yoast SEO",
        desc: "Content analysis encourages proper heading hierarchy and readable structure that AI extractors prefer.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/"
      }
    ],
    Shopify: [
      {
        name: "Native sections & blocks",
        desc: "Use Shopify Online Store 2.0 sections and blocks; they render semantic HTML by default.",
        link: "https://shopify.dev/docs/storefronts/themes/architecture/sections",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Native text & heading elements",
        desc: "Use Heading and Paragraph elements rather than rich-text boxes nested inside generic containers.",
        link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-text-elements",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Native blocks",
        desc: "Text, Heading and List blocks output clean semantic paragraphs and lists.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815028-Blocks",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Semantic HTML tags",
        desc: "Map elements to article, section, main, aside, header, footer instead of default div wrappers.",
        link: "https://university.webflow.com/lesson/semantic-html-tags",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Semantic HTML5",
        desc: "Use article, section, header, main, nav, aside, footer. Aim for meaningful element ratios instead of div-only markup.",
        link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
        homeLink: "https://developer.mozilla.org/"
      }
    ]
  },
  "Schema Parse Performance": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Generates valid JSON-LD for Article, FAQ, HowTo, Product, Person and more with automatic output.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/"
      },
      {
        name: "Rank Math SEO",
        desc: "20+ schema types plus a visual builder and validation helpers for clean JSON-LD.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      },
      {
        name: "All in One SEO (AIOSEO)",
        desc: "Guided schema setup for common types with strong defaults and rich-result support.",
        link: "https://wordpress.org/plugins/all-in-one-seo-pack/",
        homeLink: "https://aioseo.com/"
      }
    ],
    Shopify: [
      {
        name: "Schema Plus for SEO & JSON-LD",
        desc: "Automatic, Google-compliant JSON-LD for products, reviews, FAQ, collections, blog posts and more.",
        link: "https://apps.shopify.com/schema-plus",
        homeLink: "https://schemaplus.io/"
      },
      {
        name: "Native Shopify JSON-LD + theme extension",
        desc: "Shopify outputs basic Product schema; extend via theme.liquid or apps for additional types.",
        link: "https://shopify.dev/docs/storefronts/themes",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Built-in structured data + Custom Code",
        desc: "Wix auto-generates basic schema; add extra JSON-LD via Settings → Custom Code.",
        link: "https://support.wix.com/en/article/adding-structured-data-markup-to-your-site",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Native schema + Code Injection",
        desc: "Squarespace outputs basic schema; inject additional Article/FAQ JSON-LD via Code Injection.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Custom Code embed",
        desc: "Add JSON-LD <script type=\"application/ld+json\"> blocks in Project Settings → Custom Code (head).",
        link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "JSON-LD in <head>",
        desc: "Emit one or more <script type=\"application/ld+json\"> blocks with correct @context and @type.",
        link: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
        homeLink: "https://developers.google.com/"
      },
      {
        name: "Schema.org Validator",
        desc: "Validate markup before shipping to catch parse errors and nesting issues.",
        link: "https://validator.schema.org/",
        homeLink: "https://schema.org/"
      }
    ]
  },
  "Crawler Accessibility": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Robots.txt editor in the admin UI; confirm AI crawlers (GPTBot, ClaudeBot, etc.) are not disallowed.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/"
      },
      {
        name: "Rank Math SEO",
        desc: "Robots.txt editor with validation; supports explicit AI crawler rules.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      }
    ],
    Shopify: [
      {
        name: "robots.txt.liquid",
        desc: "Edit Online Store → Themes → Edit code → robots.txt.liquid and ensure AI bots are allowed.",
        link: "https://shopify.dev/docs/storefronts/themes/architecture/templates/robots-txt-liquid",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Robots.txt editor",
        desc: "Settings → SEO → Crawlers & Indexing → Edit robots.txt. Do not block GPTBot, ClaudeBot, PerplexityBot, etc.",
        link: "https://support.wix.com/en/article/editing-your-robots-txt-file",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Crawlers settings",
        desc: "Settings → Advanced → Crawlers; verify AI crawlers are permitted.",
        link: "https://support.squarespace.com/hc/en-us/articles/360000438987-Managing-crawlers",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "robots.txt override",
        desc: "Project Settings → SEO → Robots.txt; ensure AI crawlers are not blocked.",
        link: "https://university.webflow.com/lesson/robots-txt",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "robots.txt review",
        desc: "Serve a clear robots.txt at root that explicitly allows GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, CCBot, Google-Extended.",
        link: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
        homeLink: "https://developers.google.com/"
      },
      {
        name: "Remove JS gating",
        desc: "Ensure primary content is available without JavaScript; use <noscript> fallbacks where needed.",
        link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript",
        homeLink: "https://developer.mozilla.org/"
      }
    ]
  },
  "Text Density Performance": {
    WordPress: [
      {
        name: "Perfmatters",
        desc: "Script Manager disables unused CSS/JS per page, genuinely reducing code volume and improving text-to-code ratio.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      },
      {
        name: "Autoptimize",
        desc: "HTML minification removes whitespace and comments; script/style aggregation and defer reduce overall markup noise.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      },
      {
        name: "LiteSpeed Cache",
        desc: "HTML minification and unused CSS/JS controls (when enabled carefully) improve text density without relying solely on caching.",
        link: "https://wordpress.org/plugins/litespeed-cache/",
        homeLink: "https://www.litespeedtech.com/"
      }
    ],
    Shopify: [
      {
        name: "Tiny SEO Speed Image Optimizer",
        desc: "Minifies JS/CSS and provides script control so unused third-party code is not loaded on content pages.",
        link: "https://apps.shopify.com/smart-image-optimizer",
        homeLink: "https://tiny-img.com/"
      }
    ],
    Wix: [
      {
        name: "Reduce embeds & widgets",
        desc: "Remove unused embeds and custom HTML that add markup without contributing visible text.",
        link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-embeds",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Remove unused code blocks",
        desc: "Delete Code Injection and widgets that inject markup without content.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Purge unused interactions",
        desc: "Disable unused IX2 animations and interactions on content pages to reduce JS bloat.",
        link: "https://university.webflow.com/lesson/interactions-and-animations",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Defer / load-on-interaction third-party scripts",
        desc: "Load analytics, ads and trackers after content or on interaction so they do not inflate the initial HTML.",
        link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script",
        homeLink: "https://developer.mozilla.org/"
      },
      {
        name: "HTML minification & comment stripping",
        desc: "Strip comments, unnecessary whitespace and XHTML-style closing tags in the build or server pipeline.",
        link: "https://web.dev/articles/reduce-network-payloads-using-text-compression",
        homeLink: "https://web.dev/"
      }
    ]
  },
  "Semantic Structure Integrity": {
    WordPress: [
      {
        name: "Gutenberg (Block Editor)",
        desc: "Use Heading, List, Table and Paragraph blocks correctly; avoid freeform HTML for structural content.",
        link: "https://wordpress.org/documentation/article/block-editor/",
        homeLink: "https://wordpress.org/"
      },
      {
        name: "Yoast SEO",
        desc: "Flags heading-order issues and readability problems in the content analysis panel.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/"
      }
    ],
    Shopify: [
      {
        name: "Native Rich text & Multi-column sections",
        desc: "Prefer native sections over custom HTML blocks so headings, paragraphs and lists remain semantic.",
        link: "https://shopify.dev/docs/storefronts/themes/architecture/sections",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Native text elements",
        desc: "Use Heading and Paragraph elements rather than styled text boxes that ignore semantic tags.",
        link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-text-elements",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Native blocks",
        desc: "Text and Heading blocks output proper semantic HTML; avoid raw HTML for primary structure.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815028-Blocks",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Heading tag mapping",
        desc: "Set each text element’s tag (H1–H6, P, UL, etc.) explicitly in the Settings panel.",
        link: "https://university.webflow.com/lesson/semantic-html-tags",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Heading & list hierarchy",
        desc: "Exactly one H1, sequential H2–H6, proper lists and tables with <th> headers.",
        link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements",
        homeLink: "https://developer.mozilla.org/"
      }
    ]
  },
  "Render Blocking Performance": {
    WordPress: [
      {
        name: "WP Rocket",
        desc: "Defer JavaScript, optimise CSS delivery and remove unused CSS so critical content is not blocked.",
        link: "https://wp-rocket.me/",
        homeLink: "https://wp-rocket.me/"
      },
      {
        name: "Autoptimize",
        desc: "Free aggregation, minification and defer of JS; can inline critical CSS.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      },
      {
        name: "Perfmatters",
        desc: "Per-page Script Manager disables unused scripts; also supports defer and delay options.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      }
    ],
    Shopify: [
      {
        name: "Theme performance best practices",
        desc: "Add defer to non-critical scripts and move heavy scripts below the fold in theme.liquid.",
        link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Custom Code placement",
        desc: "Load scripts in Settings → Custom Code with defer or at body end.",
        link: "https://support.wix.com/en/article/adding-custom-code-to-your-site",
        homeLink: "https://www.wix.com/"
      }
    ],
    Squarespace: [
      {
        name: "Defer injected scripts",
        desc: "Add the defer attribute to script tags in Code Injection; load analytics after content.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "Custom Code in Footer",
        desc: "Move non-critical scripts to Project Settings → Custom Code → Footer; keep head scripts minimal.",
        link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "defer / async attributes",
        desc: "Add defer to non-critical scripts; use type=\"module\" for modern scripts.",
        link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script",
        homeLink: "https://developer.mozilla.org/"
      },
      {
        name: "Critical CSS",
        desc: "Inline above-the-fold CSS and load the full stylesheet non-blocking.",
        link: "https://web.dev/articles/extract-critical-css",
        homeLink: "https://web.dev/"
      }
    ]
  },
  "Content Stability Performance": {
    WordPress: [
      {
        name: "WP Rocket",
        desc: "Page caching + preload ensures the HTML is already stable when crawlers arrive.",
        link: "https://wp-rocket.me/",
        homeLink: "https://wp-rocket.me/"
      },
      {
        name: "LiteSpeed Cache",
        desc: "Server-level or full-page cache keeps the rendered HTML consistent across requests.",
        link: "https://wordpress.org/plugins/litespeed-cache/",
        homeLink: "https://www.litespeedtech.com/"
      },
      {
        name: "Query Monitor",
        desc: "Detects late AJAX calls and scripts that inject or replace content after the initial load.",
        link: "https://wordpress.org/plugins/query-monitor/",
        homeLink: "https://querymonitor.com/"
      }
    ],
    Shopify: [
      {
        name: "Server-rendered sections",
        desc: "Prefer Liquid sections over client-side recommendation or dynamic blocks for primary content.",
        link: "https://shopify.dev/docs/storefronts/themes/architecture/sections",
        homeLink: "https://shopify.dev/"
      }
    ],
    Wix: [
      {
        name: "Static content first + Velo SSR",
        desc: "Keep primary content server-rendered; avoid injecting it via Velo after load.",
        link: "https://www.wix.com/velo",
        homeLink: "https://www.wix.com/velo"
      }
    ],
    Squarespace: [
      {
        name: "Reduce late code injection",
        desc: "Remove scripts that replace or inject content after the page has loaded.",
        link: "https://support.squarespace.com/hc/en-us/articles/205815528-Using-code-injection",
        homeLink: "https://www.squarespace.com/"
      }
    ],
    Webflow: [
      {
        name: "CMS collections (server-rendered)",
        desc: "CMS items are rendered server-side; avoid client-only fetches for the main content.",
        link: "https://university.webflow.com/lesson/cms-collections",
        homeLink: "https://university.webflow.com/"
      }
    ],
    "Custom / Unknown": [
      {
        name: "Static Site Generation / SSR",
        desc: "Generate or server-render primary content so it is present and stable in the initial HTML.",
        link: "https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation",
        homeLink: "https://nextjs.org/"
      },
      {
        name: "Avoid post-hydration content replacement",
        desc: "Do not replace primary content via innerHTML or client-side routing after the first paint.",
        link: "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML",
        homeLink: "https://developer.mozilla.org/"
      }
    ]
  }
};

// Expose to window so the client can look up known CMS keys
if (typeof window !== 'undefined') {
  window.pluginDataRef = pluginData;
}

export function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section', preselect = '') {
  if (!failedMetrics.length) return;
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto';
  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">Plugin & Approach Solutions</h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">${failedMetrics.length} metric${failedMetrics.length > 1 ? 's need' : ' needs'} attention. Expand any panel below to see recommended tools and approaches.</p>
    <div class="space-y-6">
      ${failedMetrics.map(m => `
        <details class="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <summary class="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
            <h3 class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">${m.name}</h3>
            <div class="transform transition-transform duration-300 group-open:rotate-180">
              <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </summary>
          <div class="px-6 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
            <div class="max-w-md mx-auto my-8">
              <select id="cms-select-${m.name.replace(/\s+/g, '-').toLowerCase()}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                <option value="">Select your CMS...</option>
                ${Object.keys(pluginData[m.name] || {}).map(cms => `<option value="${cms}">${cms}</option>`).join('')}
              </select>
            </div>
            <div id="plugins-${m.name.replace(/\s+/g, '-').toLowerCase()}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden"></div>
          </div>
        </details>
      `).join('')}
    </div>
  `;
  container.appendChild(section);

  failedMetrics.forEach(m => {
    const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
    const select = document.getElementById(`cms-select-${metricId}`);
    const pluginsList = document.getElementById(`plugins-${metricId}`);
    if (!select || !pluginsList) return;

    const populatePlugins = (selected) => {
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      // Resolve which CMS bucket to use. If the selected/preselected CMS has no
      // data for this metric, fall back to "Custom / Unknown" so the panel
      // never renders empty.
      let bucket = selected;
      if (!bucket || !pluginData[m.name]?.[bucket]) {
        if (pluginData[m.name]?.['Custom / Unknown']) {
          bucket = 'Custom / Unknown';
        } else {
          // Nothing to show for this metric at all
          const empty = document.createElement('p');
          empty.className = 'text-center text-gray-500 dark:text-gray-400 col-span-full py-6';
          empty.textContent = 'No specific plugin recommendations for this metric. Follow the priority fix guidance instead.';
          pluginsList.appendChild(empty);
          pluginsList.classList.remove('hidden');
          return;
        }
      }

      const selectedBucket = bucket;
      pluginData[m.name][selectedBucket].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';
const hasAuthorSite = plugin.homeLink && plugin.homeLink !== plugin.link;

card.innerHTML = `
  <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${escapeHtml(plugin.name)}</h4>
  <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${escapeHtml(plugin.desc)}</p>
  <div class="flex flex-wrap gap-3">
    ${plugin.link ? `<a href="${plugin.link}" target="_blank" rel="noopener noreferrer" class="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300">View Plugin →</a>` : ''}
    ${hasAuthorSite ? `<a href="${plugin.homeLink}" target="_blank" rel="noopener noreferrer" class="inline-block px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-300">Author Site</a>` : ''}
  </div>
`;
        pluginsList.appendChild(card);
      });
      pluginsList.classList.remove('hidden');
    };

    select.addEventListener('change', (e) => populatePlugins(e.target.value));

    // Preselect the detected CMS. If it doesn't exist for this metric,
    // the fallback inside populatePlugins will render "Custom / Unknown".
    if (preselect) {
      if (pluginData[m.name]?.[preselect]) {
        select.value = preselect;
      }
      populatePlugins(preselect);
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}