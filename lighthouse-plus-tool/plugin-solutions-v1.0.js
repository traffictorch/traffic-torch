// Lighthouse Plus Tool – plugin & approach solutions
export const pluginData = {
  "Core Web Vitals": {
    WordPress: [
      { name: "WP Rocket", desc: "Premium caching, preload, lazy load, and delay JS. Directly improves LCP, CLS, and INP on WordPress sites.", link: "https://wp-rocket.me/", homeLink: "https://wp-rocket.me/" },
      { name: "Perfmatters", desc: "Script Manager disables unused scripts per page, cutting main-thread work and improving INP.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" },
      { name: "LiteSpeed Cache", desc: "Free server-level page cache, image optimisation, and CSS/JS tuning for LCP and CLS.", link: "https://wordpress.org/plugins/litespeed-cache/", homeLink: "https://www.litespeedtech.com/" }
    ],
    Shopify: [
      { name: "Tiny SEO Speed Image Optimizer (TinyIMG)", desc: "Compresses and converts images to WebP for faster LCP, controls third-party scripts for lower TBT.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" },
      { name: "Native theme speed (Online Store 2.0)", desc: "Use modern OS 2.0 themes with lazy loading and section rendering to reduce CLS and INP.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix image optimisation + lazy load", desc: "Wix auto-compresses images and lazy loads below-fold assets; ensure modern formats are enabled in Media settings.", link: "https://support.wix.com/en/article/wix-editor-optimizing-your-images", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native image optimisation + lazy load", desc: "Squarespace auto-serves WebP and lazy loads images. Reduce section count to cut CLS.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987-Image-optimisation", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native image optimisation", desc: "Webflow auto-serves WebP and srcset. Use native width/height attributes to prevent CLS.", link: "https://university.webflow.com/lesson/image-optimization", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Cloudflare Polish + Tiered Cache", desc: "Auto-converts images to WebP/AVIF and caches HTML at the edge to cut TTFB and LCP.", link: "https://developers.cloudflare.com/speed/optimization/images/", homeLink: "https://developers.cloudflare.com/" },
      { name: "Lighthouse CI", desc: "Run Lighthouse in your CI on every deploy to catch performance regressions before they ship.", link: "https://github.com/GoogleChrome/lighthouse-ci", homeLink: "https://developer.chrome.com/docs/lighthouse/overview" },
      { name: "Squoosh / sharp", desc: "Convert images to WebP/AVIF in your build pipeline. Typical LCP improvement of 30-60% on image-heavy pages.", link: "https://squoosh.app/", homeLink: "https://github.com/lovell/sharp" }
    ]
  },
  "Performance Score": {
    WordPress: [
      { name: "Autoptimize", desc: "Aggregates, minifies and defers JS/CSS. Removes render-blocking resources that hurt FCP.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Perfmatters", desc: "Per-page script manager disables unused plugin scripts, the #1 cause of low Lighthouse performance scores.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" },
      { name: "WP Rocket", desc: "Combines caching, critical CSS, defer JS and lazy load into one dashboard with strong defaults.", link: "https://wp-rocket.me/", homeLink: "https://wp-rocket.me/" }
    ],
    Shopify: [
      { name: "Theme performance best practices", desc: "Defer non-critical scripts in theme.liquid, remove unused app embeds, and use native lazy loading.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix performance settings", desc: "Disable unused apps, animations and effects via Settings > Performance.", link: "https://support.wix.com/en/article/wix-editor-adjusting-your-sites-performance-settings", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Remove unused blocks", desc: "Delete unused Code Injection blocks, unnecessary summary blocks, and third-party widgets.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Custom Code placement", desc: "Move non-critical scripts to Project Settings > Custom Code > Footer; keep head scripts minimal.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Unused JS/CSS removal", desc: "Run PurgeCSS and code splitting in your build. Typical performance score gain: 20-40 points.", link: "https://purgecss.com/", homeLink: "https://purgecss.com/" },
      { name: "Defer / async scripts", desc: "Add defer to non-critical scripts; use type=module for modern ones. Eliminates render blocking.", link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script", homeLink: "https://developer.mozilla.org/" },
      { name: "Critical CSS inlining", desc: "Inline above-the-fold CSS and load the full stylesheet non-blocking. Big FCP win.", link: "https://web.dev/articles/extract-critical-css", homeLink: "https://web.dev/" }
    ]
  },
  "Accessibility": {
    WordPress: [
      { name: "WP Accessibility", desc: "Fixes common theme accessibility issues: skip links, contrast, labels, and landmark regions.", link: "https://wordpress.org/plugins/wp-accessibility/", homeLink: "https://wordpress.org/" },
      { name: "Equalize Digital Accessibility Checker", desc: "Scans every post and page for WCAG 2.2 AA issues directly in the editor.", link: "https://wordpress.org/plugins/accessibility-checker/", homeLink: "https://equalizedigital.com/" }
    ],
    Shopify: [
      { name: "Native contrast + focus styles", desc: "Shopify themes often ship low-contrast text. Adjust in theme CSS. Add visible :focus-visible outlines for keyboard users.", link: "https://shopify.dev/docs/storefronts/themes/accessibility", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix Accessibility Wizard", desc: "Scans your site for WCAG issues and guides fixes for contrast, alt text, and labels.", link: "https://support.wix.com/en/article/wix-accessibility-wizard", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native contrast + alt text", desc: "Set alt text on every image; test body text against backgrounds. Use built-in color palette controls.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native accessibility panel", desc: "Webflow flags missing alt text and offers focus state controls in the Designer.", link: "https://university.webflow.com/lesson/accessibility", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "axe DevTools", desc: "Free browser extension for WCAG 2.2 AA testing with fix suggestions for every rule.", link: "https://www.deque.com/axe/devtools/", homeLink: "https://www.deque.com/axe/" },
      { name: "Pa11y CI", desc: "Automated accessibility testing in your CI pipeline. Catches regressions before deploy.", link: "https://github.com/pa11y/pa11y-ci", homeLink: "https://pa11y.org/" },
      { name: "WCAG 2.2 Quick Reference", desc: "The authoritative list of success criteria. Bookmark it.", link: "https://www.w3.org/WAI/WCAG22/quickref/", homeLink: "https://www.w3.org/WAI/" }
    ]
  },
  "Best Practices": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Forces HTTPS, fixes mixed content, and adds HSTS headers automatically.", link: "https://wordpress.org/plugins/really-simple-ssl/", homeLink: "https://really-simple-ssl.com/" },
      { name: "Query Monitor", desc: "Surfaces PHP notices, deprecated calls, and console errors visible only in dev tools.", link: "https://wordpress.org/plugins/query-monitor/", homeLink: "https://querymonitor.com/" }
    ],
    Shopify: [
      { name: "Native HTTPS + CSP", desc: "Shopify enforces HTTPS. Configure a Content Security Policy for extra protection.", link: "https://shopify.dev/docs/apps/build/security", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Native HTTPS + security headers", desc: "Wix enforces HTTPS. Enable additional security headers via Settings > Security.", link: "https://support.wix.com/en/article/wix-security", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native SSL + HSTS", desc: "Squarespace enforces SSL. Enable HSTS in Settings > Advanced > Security.", link: "https://support.squarespace.com/hc/en-us/articles/205814888", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native SSL + custom headers", desc: "Enable SSL in Project Settings > Hosting; add security headers via custom code where supported.", link: "https://university.webflow.com/lesson/ssl", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "securityheaders.com", desc: "Free audit of HSTS, CSP, X-Frame-Options and other response headers.", link: "https://securityheaders.com/", homeLink: "https://securityheaders.com/" },
      { name: "Cloudflare SSL/TLS + Transform Rules", desc: "Enforce HTTPS, add HSTS, and set security headers at the edge.", link: "https://developers.cloudflare.com/ssl/", homeLink: "https://developers.cloudflare.com/" }
    ]
  },
  "SEO On-Page": {
    WordPress: [
      { name: "Yoast SEO", desc: "Title, meta description, canonical, robots directives, and hreflang controls with scoring in the editor.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/" },
      { name: "Rank Math SEO", desc: "Advanced title/meta templates, schema, redirects, and hreflang management.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Native SEO fields", desc: "Set title and meta description per product, collection, and page under Search engine listing preview.", link: "https://help.shopify.com/en/manual/promoting-marketing/seo", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix SEO settings", desc: "Set title, description, canonical and robots per page in the SEO panel.", link: "https://support.wix.com/en/article/wix-seo-wiz", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native SEO panel", desc: "Per-page SEO settings include title, description, and canonical control.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native SEO settings", desc: "Per-page meta title, description, canonical, and Open Graph tags in the Designer.", link: "https://university.webflow.com/lesson/seo", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Hand-rolled head tags", desc: "Every page needs <title>, meta description, canonical, robots, and viewport. One H1 per page.", link: "https://developers.google.com/search/docs/appearance/title-link", homeLink: "https://developers.google.com/search/docs" }
    ]
  },
  "PWA Readiness": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Generates the manifest, registers the service worker, and configures offline fallback.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://wordpress.org/" }
    ],
    Shopify: [
      { name: "Custom service worker + manifest", desc: "Shopify does not ship a PWA out of the box. Add manifest.json and service worker manually to theme.liquid.", link: "https://shopify.dev/docs/storefronts/themes/architecture", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix PWA settings", desc: "Enable installability and offline mode in Settings > PWA.", link: "https://support.wix.com/en/article/wix-editor-adding-a-pwa-to-your-site", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Custom PWA setup", desc: "Squarespace has no native PWA. Add manifest and service worker via Code Injection.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Custom PWA setup", desc: "Add manifest.json to your site files and register a service worker in custom code.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "manifest.json + sw.js", desc: "Add a valid manifest with name, icons (192 and 512), theme_color, display: standalone, and a service worker.", link: "https://web.dev/articles/add-manifest", homeLink: "https://web.dev/" },
      { name: "Workbox", desc: "Google's library for generating service workers with caching strategies.", link: "https://developer.chrome.com/docs/workbox", homeLink: "https://developer.chrome.com/docs/workbox" }
    ]
  },
  "Resource Optimisation": {
    WordPress: [
      { name: "ShortPixel / Imagify", desc: "Bulk-compresses existing images and converts to WebP. Big LCP win on image-heavy sites.", link: "https://wordpress.org/plugins/shortpixel-image-optimiser/", homeLink: "https://shortpixel.com/" },
      { name: "Perfmatters", desc: "Disables unused CSS/JS per page, reducing total transfer weight.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Tiny SEO Speed Image Optimizer", desc: "Compresses and serves WebP/AVIF. Controls third-party script loading.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" }
    ],
    Wix: [
      { name: "Native image compression", desc: "Wix auto-compresses uploads; keep original uploads under 2MB.", link: "https://support.wix.com/en/article/wix-editor-optimizing-your-images", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native image optimisation", desc: "Uploads are auto-optimised; avoid oversized PNGs.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native image settings", desc: "Webflow serves responsive sizes automatically. Use SVG for icons.", link: "https://university.webflow.com/lesson/image-optimization", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "sharp / Squoosh", desc: "Batch convert to WebP/AVIF in your build. Typical savings: 40-70% per image.", link: "https://squoosh.app/", homeLink: "https://github.com/lovell/sharp" },
      { name: "font-display: swap", desc: "Always set font-display: swap or optional on @font-face. Prevents invisible text during load.", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display", homeLink: "https://developer.mozilla.org/" },
      { name: "PurgeCSS + code splitting", desc: "Ship only the CSS and JS you actually use. Reduces transfer weight significantly.", link: "https://purgecss.com/", homeLink: "https://purgecss.com/" }
    ]
  },
  "Third-Party Impact": {
    WordPress: [
      { name: "Perfmatters Script Manager", desc: "Disable third-party scripts per page — analytics, chat, pixels — that are not needed everywhere.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" },
      { name: "WP Rocket Delay JS", desc: "Delays third-party scripts until user interaction. Big INP and TBT improvement.", link: "https://wp-rocket.me/", homeLink: "https://wp-rocket.me/" },
      { name: "CAOS (host analytics locally)", desc: "Hosts Google Analytics locally to skip the external GTM round-trip.", link: "https://wordpress.org/plugins/host-analyticsjs-local/", homeLink: "https://wordpress.org/" }
    ],
    Shopify: [
      { name: "Remove unused apps", desc: "Every installed app injects scripts into every page. Uninstall anything unused.", link: "https://help.shopify.com/en/manual/apps", homeLink: "https://shopify.dev/" },
      { name: "Native app embed controls", desc: "Disable app blocks per theme section where they are not needed.", link: "https://shopify.dev/docs/storefronts/themes/architecture/sections", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Disable unused apps and widgets", desc: "Each app adds external scripts. Remove anything not actively used.", link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-apps", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Audit Code Injection", desc: "Remove analytics, pixels, and chat widgets you are no longer using.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Audit Custom Code", desc: "Remove unused third-party scripts from Project Settings > Custom Code.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Partytown", desc: "Offloads third-party scripts to a web worker, freeing the main thread.", link: "https://partytown.builder.io/", homeLink: "https://partytown.builder.io/" },
      { name: "Self-host analytics", desc: "Use Plausible, Umami, or Fathom instead of Google Analytics. 10x lighter.", link: "https://plausible.io/", homeLink: "https://plausible.io/" },
      { name: "requestIdleCallback for non-critical", desc: "Load chat widgets, ads, and pixels on idle rather than on page load.", link: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback", homeLink: "https://developer.mozilla.org/" }
    ]
  },
  "Mobile UX": {
    WordPress: [
      { name: "Theme mobile review", desc: "Most WP themes need contrast, tap target, and font size fixes. Audit with mobile Chrome DevTools.", link: "https://developer.chrome.com/docs/devtools/device-mode/", homeLink: "https://developer.chrome.com/" },
      { name: "Blocks with responsive units", desc: "Use rem/em for font sizes rather than px, so mobile scales properly.", link: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units", homeLink: "https://developer.mozilla.org/" }
    ],
    Shopify: [
      { name: "Theme mobile settings", desc: "Verify tap targets, font sizes, and safe-area insets in mobile theme preview.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Wix Mobile Editor", desc: "Edit mobile layout separately for font size, spacing, and tap targets.", link: "https://support.wix.com/en/article/wix-editor-editing-your-mobile-site", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Mobile styles panel", desc: "Override font sizes and spacing per breakpoint in the Designer.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Mobile breakpoints", desc: "Design at 390px and 320px breakpoints; check tap targets with the Device Preview.", link: "https://university.webflow.com/lesson/intro-to-breakpoints", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "viewport-fit=cover + safe-area-inset", desc: "Add viewport-fit=cover to the viewport meta and use env(safe-area-inset-*) padding on sticky elements.", link: "https://webkit.org/blog/7929/designing-websites-for-iphone-x/", homeLink: "https://webkit.org/" },
      { name: "Minimum 44x44 tap targets", desc: "Buttons and links under 44x44 frustrate users and fail WCAG 2.5.5.", link: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html", homeLink: "https://www.w3.org/WAI/" }
    ]
  },
  "Agentic Browsing": {
    WordPress: [
      { name: "Native semantic landmarks", desc: "Most themes already output <header>, <nav>, <main>, <footer>. Verify in DevTools.", link: "https://developer.wordpress.org/themes/classic-themes/theme-basics/theme-structure/", homeLink: "https://developer.wordpress.org/" },
      { name: "Form label audit", desc: "Gravity Forms, Contact Form 7 and WPForms output proper labels by default — verify in rendered HTML.", link: "https://developer.wordpress.org/", homeLink: "https://developer.wordpress.org/" }
    ],
    Shopify: [
      { name: "Native semantic markup", desc: "Online Store 2.0 sections output clean landmarks. Verify main, article, nav in theme code.", link: "https://shopify.dev/docs/storefronts/themes/architecture/sections", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Enable semantic HTML", desc: "Wix outputs semantic markup in modern themes. Verify heading hierarchy and landmarks.", link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-text-elements", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native semantic blocks", desc: "Use native blocks rather than code blocks so landmarks are preserved.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Semantic HTML tags", desc: "Set each container's tag to main, section, article, nav or aside in the Settings panel.", link: "https://university.webflow.com/lesson/semantic-html-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "llms.txt + AI-friendly robots.txt", desc: "Add an llms.txt file at root and allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended in robots.txt.", link: "https://llmstxt.org/", homeLink: "https://llmstxt.org/" },
      { name: "WebMCP integration (beta)", desc: "Expose tasks to AI agents via navigator.modelContext. Follow the emerging WebMCP spec.", link: "https://github.com/webmcp", homeLink: "https://github.com/webmcp" },
      { name: "Skip link + focus order", desc: "Add a skip-to-content link and verify keyboard focus order is logical.", link: "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html", homeLink: "https://www.w3.org/WAI/" }
    ]
  }
};

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
      ${failedMetrics.map((m) => `
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
                ${Object.keys(pluginData[m.name] || {}).map((cms) => `<option value="${cms}">${cms}</option>`).join('')}
              </select>
            </div>
            <div id="plugins-${m.name.replace(/\s+/g, '-').toLowerCase()}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden"></div>
          </div>
        </details>
      `).join('')}
    </div>
  `;
  container.appendChild(section);

  failedMetrics.forEach((m) => {
    const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
    const select = document.getElementById(`cms-select-${metricId}`);
    const pluginsList = document.getElementById(`plugins-${metricId}`);
    if (!select || !pluginsList) return;

    const populatePlugins = (selected) => {
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      let bucket = selected;
      if (!bucket || !pluginData[m.name]?.[bucket]) {
        if (pluginData[m.name]?.['Custom / Unknown']) bucket = 'Custom / Unknown';
        else {
          const empty = document.createElement('p');
          empty.className = 'text-center text-gray-500 dark:text-gray-400 col-span-full py-6';
          empty.textContent = 'No specific plugin recommendations for this metric. Follow the priority fix guidance instead.';
          pluginsList.appendChild(empty);
          pluginsList.classList.remove('hidden');
          return;
        }
      }

      pluginData[m.name][bucket].forEach((plugin) => {
        const card = document.createElement('div');
        card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';
        const hasAuthorSite = plugin.homeLink && plugin.homeLink !== plugin.link;

        card.innerHTML = `
          <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${escapeHtml(plugin.name)}</h4>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${escapeHtml(plugin.desc)}</p>
          <div class="flex flex-wrap gap-3">
            ${plugin.link ? `<a href="${plugin.link}" target="_blank" rel="noopener noreferrer" class="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300">View →</a>` : ''}
            ${hasAuthorSite ? `<a href="${plugin.homeLink}" target="_blank" rel="noopener noreferrer" class="inline-block px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-300">Author Site</a>` : ''}
          </div>
        `;
        pluginsList.appendChild(card);
      });
      pluginsList.classList.remove('hidden');
    };

    select.addEventListener('change', (e) => populatePlugins(e.target.value));
    if (preselect) {
      if (pluginData[m.name]?.[preselect]) select.value = preselect;
      populatePlugins(preselect);
    }
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}