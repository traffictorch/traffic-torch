// Lighthouse Plus Tool – plugin & approach solutions (free / freemium only)
export const pluginData = {
  "Core Web Vitals": {
    WordPress: [
      { name: "LiteSpeed Cache", desc: "Free, all-in-one. Page cache, image optimisation, CSS/JS tuning, and critical CSS with automatic Vitals improvements.", link: "https://wordpress.org/plugins/litespeed-cache/", homeLink: "https://www.litespeedtech.com/" },
      { name: "Autoptimize", desc: "Free. Aggregates, minifies and defers JS/CSS to speed up LCP and reduce CLS.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "W3 Total Cache", desc: "Free. Page, object, and browser caching with CDN support. Good for LCP and TTFB.", link: "https://wordpress.org/plugins/w3-total-cache/", homeLink: "https://www.boldgrid.com/w3-total-cache/" },
      { name: "Cache Enabler", desc: "Free. Minimalist page cache by KeyCDN. Pairs well with Async JavaScript and Autoptimize.", link: "https://wordpress.org/plugins/cache-enabler/", homeLink: "https://www.keycdn.com/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Freemium. Compresses and converts images to WebP for faster LCP, defers third-party scripts for lower TBT.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" },
      { name: "Native theme speed (Online Store 2.0)", desc: "Free. Use modern OS 2.0 themes with lazy loading and section rendering to reduce CLS and INP.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" },
      { name: "SEOAnt Speed Up", desc: "Freemium. One-click image compression, JS deferral, and CSS minification for Shopify stores.", link: "https://apps.shopify.com/seo-ant-speed-up-image-optimize", homeLink: "https://www.seoant.com/" }
    ],
    Wix: [
      { name: "Wix image optimisation + lazy load", desc: "Free (native). Wix auto-compresses images and lazy loads below-fold assets.", link: "https://support.wix.com/en/article/wix-editor-optimizing-your-images", homeLink: "https://www.wix.com/" },
      { name: "Wix Turbo (native)", desc: "Free (native). Wix Turbo speeds up sites automatically on qualifying plans.", link: "https://support.wix.com/en/article/wix-turbo-an-overview", homeLink: "https://www.wix.com/" },
      { name: "Wix Performance Settings", desc: "Free (native). Disable unused animations, effects, and heavy widgets to cut main-thread work.", link: "https://support.wix.com/en/article/wix-editor-adjusting-your-sites-performance-settings", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native image optimisation + lazy load", desc: "Free (native). Squarespace auto-serves WebP and lazy loads images.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987-Image-optimisation", homeLink: "https://www.squarespace.com/" },
      { name: "Reduce homepage section count", desc: "Free (native). Each section adds render work. Aim for under 8 sections on the homepage.", link: "https://support.squarespace.com/hc/en-us/articles/360002090327", homeLink: "https://www.squarespace.com/" },
      { name: "Defer custom code", desc: "Free (native). Wrap any Code Injection JS in defer or load on user interaction.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native image optimisation", desc: "Free (native). Webflow auto-serves WebP and srcset. Add width/height attributes to prevent CLS.", link: "https://university.webflow.com/lesson/image-optimization", homeLink: "https://university.webflow.com/" },
      { name: "Lazy-load below-fold media", desc: "Free (native). Enable the native lazy loading checkbox on every image and video below the fold.", link: "https://university.webflow.com/lesson/image-optimization", homeLink: "https://university.webflow.com/" },
      { name: "Custom Code placement", desc: "Free (native). Move non-critical scripts to Project Settings → Custom Code → Footer.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Cloudflare Polish + Tiered Cache", desc: "Freemium (Cloudflare free tier includes Polish on some plans). Auto-converts images to WebP/AVIF and caches HTML at the edge.", link: "https://developers.cloudflare.com/speed/optimization/images/", homeLink: "https://developers.cloudflare.com/" },
      { name: "Lighthouse CI", desc: "Free, open source. Run Lighthouse in your CI on every deploy to catch performance regressions.", link: "https://github.com/GoogleChrome/lighthouse-ci", homeLink: "https://developer.chrome.com/docs/lighthouse/overview" },
      { name: "Squoosh / sharp", desc: "Free, open source. Convert images to WebP/AVIF in your build pipeline. Typical LCP improvement of 30-60%.", link: "https://squoosh.app/", homeLink: "https://github.com/lovell/sharp" },
      { name: "web-vitals JS library", desc: "Free, open source. Google's official library to log real-user LCP, INP, and CLS to analytics.", link: "https://github.com/GoogleChrome/web-vitals", homeLink: "https://web.dev/articles/vitals" }
    ]
  },
  "Performance Score": {
    WordPress: [
      { name: "Autoptimize", desc: "Free. Aggregates, minifies and defers JS/CSS. Removes render-blocking resources that hurt FCP.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Asset CleanUp", desc: "Free tier. Disables unused CSS/JS on a per-page basis. The #1 cause of low Lighthouse scores is plugin bloat — this kills it.", link: "https://wordpress.org/plugins/wp-asset-clean-up/", homeLink: "https://www.gabelivan.com/" },
      { name: "Async JavaScript", desc: "Free. Adds async/defer to specific scripts. Great companion to Autoptimize. By the same author.", link: "https://wordpress.org/plugins/async-javascript/", homeLink: "https://autoptimize.com/" },
      { name: "LiteSpeed Cache", desc: "Free. Full-featured if your host runs LiteSpeed. Critical CSS, lazy load, JS/CSS optimisation in one dashboard.", link: "https://wordpress.org/plugins/litespeed-cache/", homeLink: "https://www.litespeedtech.com/" }
    ],
    Shopify: [
      { name: "Theme performance best practices", desc: "Free. Defer non-critical scripts in theme.liquid, remove unused app embeds, use native lazy loading.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" },
      { name: "SEOAnt Speed Up", desc: "Freemium. One-click image compression, JS deferral, and CSS minification for Shopify stores.", link: "https://apps.shopify.com/seo-ant-speed-up-image-optimize", homeLink: "https://www.seoant.com/" },
      { name: "TinyIMG", desc: "Freemium. Beyond images, it can minify and defer scripts on the storefront.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" }
    ],
    Wix: [
      { name: "Wix performance settings", desc: "Free (native). Disable unused apps, animations and effects via Settings > Performance.", link: "https://support.wix.com/en/article/wix-editor-adjusting-your-sites-performance-settings", homeLink: "https://www.wix.com/" },
      { name: "Disable unused Wix apps", desc: "Free (native). Every installed Wix app injects external scripts. Uninstall anything unused.", link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-apps", homeLink: "https://www.wix.com/" },
      { name: "Simplify homepage layout", desc: "Free (native). Wix renders every element server-side. Fewer elements = smaller HTML and faster FCP.", link: "https://support.wix.com/en/article/wix-editor-adjusting-your-sites-performance-settings", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Remove unused blocks", desc: "Free (native). Delete unused Code Injection blocks, unnecessary summary blocks, and third-party widgets.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "Trim Code Injection", desc: "Free (native). Audit header and footer code injection. Move non-critical code to load on interaction.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "Reduce image weight", desc: "Free (native). Upload images under 500KB. Squarespace will not aggressively recompress large source files.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Custom Code placement", desc: "Free (native). Move non-critical scripts to Project Settings > Custom Code > Footer.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" },
      { name: "Minify CSS/JS on publish", desc: "Free (native). Enable minification in Project Settings > Hosting. Reduces transfer size by 20-30%.", link: "https://university.webflow.com/lesson/publish-settings", homeLink: "https://university.webflow.com/" },
      { name: "Defer non-critical scripts", desc: "Free (native). Add defer to every custom <script> tag in Head Code unless it must run before render.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "PurgeCSS", desc: "Free, open source. Removes unused CSS at build time. Typical performance score gain: 20-40 points.", link: "https://purgecss.com/", homeLink: "https://purgecss.com/" },
      { name: "Async / defer attributes", desc: "Free, native web standard. Add defer to non-critical scripts; use type=module for modern ones.", link: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script", homeLink: "https://developer.mozilla.org/" },
      { name: "Critical CSS extraction", desc: "Free, open source tooling. Inline above-the-fold CSS and load the full stylesheet non-blocking.", link: "https://web.dev/articles/extract-critical-css", homeLink: "https://web.dev/" },
      { name: "rollup-plugin-visualizer", desc: "Free, open source. Find oversized JS chunks in your Vite or Rollup build. Split at ~200KB.", link: "https://www.npmjs.com/package/rollup-plugin-visualizer", homeLink: "https://vitejs.dev/" }
    ]
  },
  "Accessibility": {
    WordPress: [
      { name: "WP Accessibility", desc: "Free. Fixes common theme accessibility issues: skip links, contrast, labels, and landmark regions.", link: "https://wordpress.org/plugins/wp-accessibility/", homeLink: "https://wordpress.org/" },
      { name: "Equalize Digital Accessibility Checker", desc: "Free tier. Scans every post and page for WCAG 2.2 AA issues directly in the editor.", link: "https://wordpress.org/plugins/accessibility-checker/", homeLink: "https://equalizedigital.com/" },
      { name: "One Click Accessibility", desc: "Free. Adds contrast toggle, font resize, and skip-to-content link without coding.", link: "https://wordpress.org/plugins/one-click-accessibility/", homeLink: "https://wordpress.org/" }
    ],
    Shopify: [
      { name: "Native contrast + focus styles", desc: "Free. Adjust theme CSS for contrast, add visible :focus-visible outlines for keyboard users.", link: "https://shopify.dev/docs/storefronts/themes/accessibility", homeLink: "https://shopify.dev/" },
      { name: "Manual alt text audit", desc: "Free (native). Every product image needs descriptive alt text. Shopify does not auto-generate this reliably.", link: "https://help.shopify.com/en/manual/online-store/images/accessibility", homeLink: "https://help.shopify.com/" },
      { name: "WAVE browser extension", desc: "Free. Visual accessibility checker for any rendered page. Good for verification.", link: "https://wave.webaim.org/extension/", homeLink: "https://wave.webaim.org/" }
    ],
    Wix: [
      { name: "Wix Accessibility Wizard", desc: "Free (native). Scans your site for WCAG issues and guides fixes for contrast, alt text, and labels.", link: "https://support.wix.com/en/article/wix-accessibility-wizard", homeLink: "https://www.wix.com/" },
      { name: "Wix alt text editor", desc: "Free (native). Wix requires manual alt text on every image. Audit each image under Media > Image Settings.", link: "https://support.wix.com/en/article/wix-editor-adding-alt-text-to-an-image", homeLink: "https://www.wix.com/" },
      { name: "Wix colour contrast checker", desc: "Free (native). Wix flags low-contrast text in the editor. Fix any yellow or red warnings.", link: "https://support.wix.com/en/article/wix-editor-checking-your-sites-colour-contrast", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native contrast + alt text", desc: "Free (native). Set alt text on every image; use built-in colour palette controls.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987", homeLink: "https://www.squarespace.com/" },
      { name: "Site-wide focus styles", desc: "Free (native). Add :focus-visible outlines via Custom CSS if your theme suppresses them.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "WAVE browser extension", desc: "Free. Visual accessibility checker for any rendered page.", link: "https://wave.webaim.org/extension/", homeLink: "https://wave.webaim.org/" }
    ],
    Webflow: [
      { name: "Native accessibility panel", desc: "Free (native). Webflow flags missing alt text and offers focus state controls in the Designer.", link: "https://university.webflow.com/lesson/accessibility", homeLink: "https://university.webflow.com/" },
      { name: "WAVE browser extension", desc: "Free. Visual accessibility checker for any rendered page.", link: "https://wave.webaim.org/extension/", homeLink: "https://wave.webaim.org/" },
      { name: "Custom focus styles", desc: "Free (native). Add :focus-visible outlines in your global styles.", link: "https://university.webflow.com/lesson/accessibility", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "axe DevTools", desc: "Free browser extension. WCAG 2.2 AA testing with fix suggestions for every rule.", link: "https://www.deque.com/axe/devtools/", homeLink: "https://www.deque.com/axe/" },
      { name: "Pa11y CI", desc: "Free, open source. Automated accessibility testing in your CI pipeline.", link: "https://github.com/pa11y/pa11y-ci", homeLink: "https://pa11y.org/" },
      { name: "WCAG 2.2 Quick Reference", desc: "Free. The authoritative list of success criteria.", link: "https://www.w3.org/WAI/WCAG22/quickref/", homeLink: "https://www.w3.org/WAI/" },
      { name: "WebAIM Contrast Checker", desc: "Free. Verify text-to-background contrast meets 4.5:1 (body) or 3:1 (large).", link: "https://webaim.org/resources/contrastchecker/", homeLink: "https://webaim.org/" }
    ]
  },
  "Best Practices": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Freemium. Forces HTTPS, fixes mixed content, and adds HSTS headers automatically.", link: "https://wordpress.org/plugins/really-simple-ssl/", homeLink: "https://really-simple-ssl.com/" },
      { name: "Query Monitor", desc: "Free. Surfaces PHP notices, deprecated calls, and console errors visible only in dev tools.", link: "https://wordpress.org/plugins/query-monitor/", homeLink: "https://querymonitor.com/" },
      { name: "Wordfence Security", desc: "Free tier. Adds security headers, blocks common attacks, and audits file integrity.", link: "https://wordpress.org/plugins/wordfence/", homeLink: "https://www.wordfence.com/" }
    ],
    Shopify: [
      { name: "Native HTTPS + CSP", desc: "Free (native). Shopify enforces HTTPS. Configure a Content Security Policy for extra protection.", link: "https://shopify.dev/docs/apps/build/security", homeLink: "https://shopify.dev/" },
      { name: "Console error sweep", desc: "Free (DevTools). Open DevTools on every template. Shopify themes and apps often log deprecation warnings.", link: "https://developer.chrome.com/docs/devtools/console/", homeLink: "https://developer.chrome.com/docs/devtools/" },
      { name: "securityheaders.com", desc: "Free. Audit your live URL to find missing HSTS, CSP, or X-Frame-Options.", link: "https://securityheaders.com/", homeLink: "https://securityheaders.com/" }
    ],
    Wix: [
      { name: "Native HTTPS + security headers", desc: "Free (native). Wix enforces HTTPS. Enable additional security headers via Settings > Security.", link: "https://support.wix.com/en/article/wix-security", homeLink: "https://www.wix.com/" },
      { name: "Wix Security settings", desc: "Free (native). Turn on two-factor auth for admin accounts and enable SSL strict mode.", link: "https://support.wix.com/en/article/about-account-security", homeLink: "https://www.wix.com/" },
      { name: "Console error audit", desc: "Free (DevTools). Open DevTools on every key page. Wix and its apps sometimes ship console errors.", link: "https://developer.chrome.com/docs/devtools/console/", homeLink: "https://developer.chrome.com/docs/devtools/" }
    ],
    Squarespace: [
      { name: "Native SSL + HSTS", desc: "Free (native). Squarespace enforces SSL. Enable HSTS in Settings > Advanced > Security.", link: "https://support.squarespace.com/hc/en-us/articles/205814888", homeLink: "https://www.squarespace.com/" },
      { name: "Remove deprecated custom code", desc: "Free (native). Audit Code Injection for document.write or old jQuery patterns.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "securityheaders.com", desc: "Free. Check for missing HSTS, CSP, or X-Frame-Options.", link: "https://securityheaders.com/", homeLink: "https://securityheaders.com/" }
    ],
    Webflow: [
      { name: "Native SSL + custom headers", desc: "Free (native). Enable SSL in Project Settings > Hosting.", link: "https://university.webflow.com/lesson/ssl", homeLink: "https://university.webflow.com/" },
      { name: "Cloudflare free tier", desc: "Free. Put Webflow behind Cloudflare for HSTS, CSP, and other security headers.", link: "https://developers.cloudflare.com/ssl/", homeLink: "https://developers.cloudflare.com/" },
      { name: "Console error audit", desc: "Free (DevTools). Check DevTools on every template. Custom embeds often log errors silently.", link: "https://developer.chrome.com/docs/devtools/console/", homeLink: "https://developer.chrome.com/docs/devtools/" }
    ],
    "Custom / Unknown": [
      { name: "securityheaders.com", desc: "Free. Audit of HSTS, CSP, X-Frame-Options and other response headers.", link: "https://securityheaders.com/", homeLink: "https://securityheaders.com/" },
      { name: "Cloudflare free tier + Transform Rules", desc: "Free. Enforce HTTPS, add HSTS, and set security headers at the edge.", link: "https://developers.cloudflare.com/ssl/", homeLink: "https://developers.cloudflare.com/" },
      { name: "Mozilla Observatory", desc: "Free. Grades your site A-F for security headers and TLS configuration.", link: "https://observatory.mozilla.org/", homeLink: "https://observatory.mozilla.org/" }
    ]
  },
  "SEO On-Page": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium. Title, meta description, canonical, robots directives, and hreflang controls with scoring in the editor.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/" },
      { name: "Rank Math SEO", desc: "Freemium. Advanced title/meta templates, schema, redirects, and hreflang management.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Freemium. Lightweight alternative to Yoast with no ads and comparable feature set.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" },
      { name: "The SEO Framework", desc: "Free. No-nonsense SEO plugin with strong defaults and no ads.", link: "https://wordpress.org/plugins/autodescription/", homeLink: "https://theseoframework.com/" }
    ],
    Shopify: [
      { name: "Native SEO fields", desc: "Free (native). Set title and meta description per product, collection, and page under Search engine listing preview.", link: "https://help.shopify.com/en/manual/promoting-marketing/seo", homeLink: "https://shopify.dev/" },
      { name: "Booster SEO + Speed Optimizer", desc: "Freemium. Bulk edits meta tags across products, adds JSON-LD schema, manages canonical URLs.", link: "https://apps.shopify.com/booster-seo", homeLink: "https://www.seoant.com/" },
      { name: "TinyIMG SEO", desc: "Freemium. Handles SEO meta and structured data in addition to image optimisation.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" }
    ],
    Wix: [
      { name: "Wix SEO settings", desc: "Free (native). Set title, description, canonical and robots per page in the SEO panel.", link: "https://support.wix.com/en/article/wix-seo-wiz", homeLink: "https://www.wix.com/" },
      { name: "Wix SEO Wiz", desc: "Free (native). Guided setup that walks you through title, description, and keyword placement per page.", link: "https://support.wix.com/en/article/wix-seo-wiz", homeLink: "https://www.wix.com/" },
      { name: "Wix sitemap verification", desc: "Free (native). Verify in Search Console that all pages are indexed.", link: "https://support.wix.com/en/article/submitting-your-sitemap-to-google", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native SEO panel", desc: "Free (native). Per-page SEO settings include title, description, and canonical control.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" },
      { name: "Squarespace SEO checklist", desc: "Free (native). Official guide covering title, description, alt text, and heading structure.", link: "https://support.squarespace.com/hc/en-us/articles/205812218", homeLink: "https://www.squarespace.com/" },
      { name: "Google Search Console", desc: "Free. Verify the site to catch noindex, canonical, and coverage issues.", link: "https://search.google.com/search-console/about", homeLink: "https://search.google.com/search-console/about" }
    ],
    Webflow: [
      { name: "Native SEO settings", desc: "Free (native). Per-page meta title, description, canonical, and Open Graph tags in the Designer.", link: "https://university.webflow.com/lesson/seo", homeLink: "https://university.webflow.com/" },
      { name: "Auto-generate sitemap", desc: "Free (native). Webflow auto-generates sitemap.xml. Submit it in Search Console.", link: "https://university.webflow.com/lesson/sitemap", homeLink: "https://university.webflow.com/" },
      { name: "Finsweet Attributes", desc: "Free. JS library that fixes Webflow limitations around meta tags and structured data.", link: "https://finsweet.com/attributes", homeLink: "https://finsweet.com/" }
    ],
    "Custom / Unknown": [
      { name: "Hand-rolled head tags", desc: "Free. Every page needs <title>, meta description, canonical, robots, and viewport. One H1 per page.", link: "https://developers.google.com/search/docs/appearance/title-link", homeLink: "https://developers.google.com/search/docs" },
      { name: "Screaming Frog SEO Spider", desc: "Free tier up to 500 URLs. Desktop crawler that audits titles, metas, headings, and canonicals.", link: "https://www.screamingfrog.co.uk/seo-spider/", homeLink: "https://www.screamingfrog.co.uk/" },
      { name: "Google Search Console", desc: "Free. Verify the site to see which pages Google indexes, which are excluded, and why.", link: "https://search.google.com/search-console/about", homeLink: "https://search.google.com/search-console/about" }
    ]
  },
  "PWA Readiness": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Free. Generates the manifest, registers the service worker, and configures offline fallback.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://wordpress.org/" },
      { name: "PWA for WP", desc: "Freemium. Adds manifest, service worker, and app icon set with a visual dashboard.", link: "https://wordpress.org/plugins/pwa-for-wp/", homeLink: "https://magazine3.company/" },
      { name: "Progressive WordPress", desc: "Free. Lightweight PWA plugin focused on install prompts and offline caching.", link: "https://wordpress.org/plugins/progressive-wordpress/", homeLink: "https://wordpress.org/" }
    ],
    Shopify: [
      { name: "Custom service worker + manifest", desc: "Free (DIY). Shopify does not ship a PWA out of the box. Add manifest.json and service worker manually to theme.liquid.", link: "https://shopify.dev/docs/storefronts/themes/architecture", homeLink: "https://shopify.dev/" },
      { name: "PWA app from Shopify App Store", desc: "Freemium. Apps like PWA Mobile App add manifest and service worker without code.", link: "https://apps.shopify.com/search?q=pwa", homeLink: "https://apps.shopify.com/" },
      { name: "Workbox via custom code", desc: "Free, open source. Use Workbox in a theme app extension to generate a service worker.", link: "https://developer.chrome.com/docs/workbox", homeLink: "https://developer.chrome.com/docs/workbox" }
    ],
    Wix: [
      { name: "Wix PWA settings", desc: "Free (native). Enable installability and offline mode in Settings > PWA.", link: "https://support.wix.com/en/article/wix-editor-adding-a-pwa-to-your-site", homeLink: "https://www.wix.com/" },
      { name: "Wix PWA icon set", desc: "Free (native). Upload a 512x512 icon and set theme colour in the same panel.", link: "https://support.wix.com/en/article/wix-editor-adding-a-pwa-to-your-site", homeLink: "https://www.wix.com/" },
      { name: "Velo service worker (advanced)", desc: "Free (native). For custom caching, add a service worker via Velo custom code.", link: "https://support.wix.com/en/article/velo-working-with-service-workers", homeLink: "https://www.wix.com/velo" }
    ],
    Squarespace: [
      { name: "Custom PWA setup", desc: "Free (DIY). Squarespace has no native PWA. Add manifest and service worker via Code Injection.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "Manifest via Code Injection", desc: "Free (DIY). Add a <link rel=\"manifest\"> tag and host manifest.json in your site files.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "Service worker via Code Injection", desc: "Free (DIY). Register a service worker in the footer Code Injection block.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Custom PWA setup", desc: "Free (DIY). Add manifest.json to your site files and register a service worker in custom code.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" },
      { name: "Manifest hosting", desc: "Free (native). Upload manifest.json to Webflow Assets and reference it in the Head Code.", link: "https://university.webflow.com/lesson/assets-panel", homeLink: "https://university.webflow.com/" },
      { name: "Service worker registration", desc: "Free (native). Add a small inline script in Footer Code that registers /sw.js.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "manifest.json + sw.js", desc: "Free (DIY). Add a valid manifest with name, icons, theme_color, display: standalone, and a service worker.", link: "https://web.dev/articles/add-manifest", homeLink: "https://web.dev/" },
      { name: "Workbox", desc: "Free, open source. Google's library for generating service workers with caching strategies.", link: "https://developer.chrome.com/docs/workbox", homeLink: "https://developer.chrome.com/docs/workbox" },
      { name: "PWA Builder", desc: "Free. Microsoft's tool that generates manifest and service worker from any URL.", link: "https://www.pwabuilder.com/", homeLink: "https://www.pwabuilder.com/" }
    ]
  },
  "Resource Optimisation": {
    WordPress: [
      { name: "ShortPixel", desc: "Freemium (100 images/month free). Bulk-compresses existing images and converts to WebP.", link: "https://wordpress.org/plugins/shortpixel-image-optimiser/", homeLink: "https://shortpixel.com/" },
      { name: "Imagify", desc: "Freemium (20MB/month free). Image compression and WebP conversion by WP Media.", link: "https://wordpress.org/plugins/imagify/", homeLink: "https://imagify.io/" },
      { name: "Smush", desc: "Freemium. Free image compression with lazy load. Good starting point for sites without budget.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Free, open source. Aggressive image optimisation and WebP conversion.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Freemium. Compresses and serves WebP/AVIF. Also controls third-party script loading.", link: "https://apps.shopify.com/smart-image-optimizer", homeLink: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Freemium. Bulk image compression for Shopify. Serves WebP to compatible browsers automatically.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" },
      { name: "Shopify native image sizes", desc: "Free (native). Upload at the largest display size and use the CDN _width= parameter for variants.", link: "https://shopify.dev/docs/api/liquid/filters/image_url", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Native image compression", desc: "Free (native). Wix auto-compresses uploads; keep original uploads under 2MB.", link: "https://support.wix.com/en/article/wix-editor-optimizing-your-images", homeLink: "https://www.wix.com/" },
      { name: "Pre-upload optimisation", desc: "Free, open source. Compress images locally with Squoosh before upload.", link: "https://squoosh.app/", homeLink: "https://squoosh.app/" },
      { name: "Remove unused media", desc: "Free (native). Audit the Media Manager and delete unused images and videos.", link: "https://support.wix.com/en/article/wix-media-manager-overview", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native image optimisation", desc: "Free (native). Uploads are auto-optimised; avoid oversized PNGs.", link: "https://support.squarespace.com/hc/en-us/articles/115011447987", homeLink: "https://www.squarespace.com/" },
      { name: "Pre-compress hero images", desc: "Free, open source. Serve hero images under 300KB using Squoosh.", link: "https://squoosh.app/", homeLink: "https://squoosh.app/" },
      { name: "Trim font weights", desc: "Free (native). Only load the font weights you actually use.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Native image settings", desc: "Free (native). Webflow serves responsive sizes automatically. Use SVG for icons.", link: "https://university.webflow.com/lesson/image-optimization", homeLink: "https://university.webflow.com/" },
      { name: "Pre-upload compression", desc: "Free, open source. Compress hero and gallery images with Squoosh before upload.", link: "https://squoosh.app/", homeLink: "https://squoosh.app/" },
      { name: "SVG for icons and logos", desc: "Free (native). Replace PNG icons with SVG. Zero rasterisation, tiny file size.", link: "https://university.webflow.com/lesson/svg-assets", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "sharp / Squoosh", desc: "Free, open source. Batch convert to WebP/AVIF in your build. Typical savings: 40-70% per image.", link: "https://squoosh.app/", homeLink: "https://github.com/lovell/sharp" },
      { name: "font-display: swap", desc: "Free, native CSS. Always set on @font-face. Prevents invisible text during load.", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display", homeLink: "https://developer.mozilla.org/" },
      { name: "PurgeCSS + code splitting", desc: "Free, open source. Ship only the CSS and JS you actually use.", link: "https://purgecss.com/", homeLink: "https://purgecss.com/" },
      { name: "SVGO", desc: "Free, open source. Removes metadata, comments, and unused attributes from SVGs. Typical 30-50% reduction.", link: "https://github.com/svg/svgo", homeLink: "https://github.com/svg/svgo" }
    ]
  },
  "Third-Party Impact": {
    WordPress: [
      { name: "Asset CleanUp", desc: "Free tier. Disable third-party scripts per page — analytics, chat, pixels — that are not needed everywhere.", link: "https://wordpress.org/plugins/wp-asset-clean-up/", homeLink: "https://www.gabelivan.com/" },
      { name: "Async JavaScript", desc: "Free. Adds async/defer to specific third-party scripts, dropping TBT and improving INP.", link: "https://wordpress.org/plugins/async-javascript/", homeLink: "https://autoptimize.com/" },
      { name: "CAOS (host analytics locally)", desc: "Free. Hosts Google Analytics locally to skip the external GTM round-trip.", link: "https://wordpress.org/plugins/host-analyticsjs-local/", homeLink: "https://wordpress.org/" },
      { name: "Flying Scripts", desc: "Free. Loads any script only on user interaction. Ideal for chat widgets and pixels.", link: "https://wordpress.org/plugins/flying-scripts/", homeLink: "https://wordpress.org/" }
    ],
    Shopify: [
      { name: "Remove unused apps", desc: "Free (native). Every installed app injects scripts into every page. Uninstall anything unused.", link: "https://help.shopify.com/en/manual/apps", homeLink: "https://shopify.dev/" },
      { name: "Native app embed controls", desc: "Free (native). Disable app blocks per theme section where they are not needed.", link: "https://shopify.dev/docs/storefronts/themes/architecture/sections", homeLink: "https://shopify.dev/" },
      { name: "Shopify Web Pixels API", desc: "Free (native). Migrate old script-tag pixels to Web Pixels API for sandboxed, deferrable code.", link: "https://shopify.dev/docs/apps/build/marketing-analytics/pixels", homeLink: "https://shopify.dev/" }
    ],
    Wix: [
      { name: "Disable unused apps and widgets", desc: "Free (native). Each app adds external scripts. Remove anything not actively used.", link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-apps", homeLink: "https://www.wix.com/" },
      { name: "Velo code audit", desc: "Free (native). Review custom Velo code for external fetches or third-party SDK loads.", link: "https://support.wix.com/en/article/velo-about-velo-by-wix", homeLink: "https://www.wix.com/velo" },
      { name: "Defer custom embeds", desc: "Free (native). Wrap any HTML embed containing third-party code in a click-to-load wrapper.", link: "https://support.wix.com/en/article/wix-editor-adding-html-code-to-your-site", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Audit Code Injection", desc: "Free (native). Remove analytics, pixels, and chat widgets you are no longer using.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" },
      { name: "Reduce embedded media", desc: "Free (native). Each YouTube or Vimeo embed loads its own player bundle. Use a thumbnail link instead.", link: "https://support.squarespace.com/hc/en-us/articles/360002090327", homeLink: "https://www.squarespace.com/" },
      { name: "Consolidate analytics", desc: "Free (native). Do not run GTM plus GA4 plus a second analytics tool. Pick one source of truth.", link: "https://support.squarespace.com/hc/en-us/articles/205815528", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Audit Custom Code", desc: "Free (native). Remove unused third-party scripts from Project Settings > Custom Code.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" },
      { name: "Lazy YouTube/Vimeo", desc: "Free, open source. Use lite-youtube-embed instead of the full embed. Saves 500KB-1MB per embed.", link: "https://github.com/paulirish/lite-youtube-embed", homeLink: "https://github.com/paulirish/lite-youtube-embed" },
      { name: "Consolidate tag managers", desc: "Free (native). Do not run GTM plus GA4 plus a second analytics tool.", link: "https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags", homeLink: "https://university.webflow.com/" }
    ],
    "Custom / Unknown": [
      { name: "Partytown", desc: "Free, open source. Offloads third-party scripts to a web worker, freeing the main thread.", link: "https://partytown.builder.io/", homeLink: "https://partytown.builder.io/" },
      { name: "Plausible / Umami / Fathom", desc: "Free (self-hosted) or low-cost. Privacy-first analytics, 10x lighter than Google Analytics.", link: "https://plausible.io/", homeLink: "https://plausible.io/" },
      { name: "requestIdleCallback", desc: "Free, native web API. Load chat widgets, ads, and pixels on idle rather than on page load.", link: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback", homeLink: "https://developer.mozilla.org/" },
      { name: "Cloudflare Zaraz", desc: "Free tier. Runs third-party tools server-side at Cloudflare's edge instead of in the visitor's browser.", link: "https://developers.cloudflare.com/zaraz/", homeLink: "https://developers.cloudflare.com/zaraz/" }
    ]
  },
  "Mobile UX": {
    WordPress: [
      { name: "Theme mobile review", desc: "Free. Most WP themes need contrast, tap target, and font size fixes. Audit with mobile Chrome DevTools.", link: "https://developer.chrome.com/docs/devtools/device-mode/", homeLink: "https://developer.chrome.com/" },
      { name: "Responsive units (rem/em)", desc: "Free, native CSS. Use rem/em for font sizes rather than px so mobile scales properly.", link: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units", homeLink: "https://developer.mozilla.org/" },
      { name: "GeneratePress", desc: "Freemium. Lightweight, mobile-first theme with accessible defaults.", link: "https://wordpress.org/themes/generatepress/", homeLink: "https://generatepress.com/" },
      { name: "Kadence", desc: "Freemium. Mobile-first theme with accessible defaults and typography controls.", link: "https://wordpress.org/themes/kadence/", homeLink: "https://www.kadencewp.com/" }
    ],
    Shopify: [
      { name: "Theme mobile settings", desc: "Free (native). Verify tap targets, font sizes, and safe-area insets in mobile theme preview.", link: "https://shopify.dev/docs/storefronts/themes/best-practices/performance", homeLink: "https://shopify.dev/" },
      { name: "Dawn theme", desc: "Free (native). Shopify's reference theme is mobile-first and accessible.", link: "https://github.com/Shopify/dawn", homeLink: "https://shopify.dev/docs/storefronts/themes/tools/dawn" },
      { name: "Mobile preview every section", desc: "Free (native). Review every section at 390px before publishing.", link: "https://help.shopify.com/en/manual/online-store/themes/customizing-themes", homeLink: "https://help.shopify.com/" }
    ],
    Wix: [
      { name: "Wix Mobile Editor", desc: "Free (native). Edit mobile layout separately for font size, spacing, and tap targets.", link: "https://support.wix.com/en/article/wix-editor-editing-your-mobile-site", homeLink: "https://www.wix.com/" },
      { name: "Wix tap target checker", desc: "Free (native). Wix flags tap targets under 44x44 in the mobile editor.", link: "https://support.wix.com/en/article/wix-editor-editing-your-mobile-site", homeLink: "https://www.wix.com/" },
      { name: "Wix mobile font sizes", desc: "Free (native). Wix mobile layout is separate. Bump every body text element to 16px minimum.", link: "https://support.wix.com/en/article/wix-editor-editing-your-mobile-site", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Mobile styles panel", desc: "Free (native). Override font sizes and spacing per breakpoint in the Designer.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" },
      { name: "Mobile preview", desc: "Free (native). Squarespace shows mobile preview in the editor. Check every section at 375px.", link: "https://support.squarespace.com/hc/en-us/articles/360002090327", homeLink: "https://www.squarespace.com/" },
      { name: "Bump body text to 16px", desc: "Free (native). Squarespace's default body size is 15px on some themes. Raise to 16px in Site Styles.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" }
    ],
    Webflow: [
      { name: "Mobile breakpoints", desc: "Free (native). Design at 390px and 320px breakpoints; check tap targets with the Device Preview.", link: "https://university.webflow.com/lesson/intro-to-breakpoints", homeLink: "https://university.webflow.com/" },
      { name: "Device preview", desc: "Free (native). Webflow's device preview shows the site at common mobile sizes.", link: "https://university.webflow.com/lesson/device-preview", homeLink: "https://university.webflow.com/" },
      { name: "clamp() for fluid type", desc: "Free, native CSS. Use CSS clamp(min, preferred, max) so font sizes scale fluidly.", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/clamp", homeLink: "https://developer.mozilla.org/" }
    ],
    "Custom / Unknown": [
      { name: "viewport-fit=cover + safe-area-inset", desc: "Free, native. Add viewport-fit=cover to the viewport meta and use env(safe-area-inset-*) padding on sticky elements.", link: "https://webkit.org/blog/7929/designing-websites-for-iphone-x/", homeLink: "https://webkit.org/" },
      { name: "Minimum 44x44 tap targets", desc: "Free, native. Buttons and links under 44x44 frustrate users and fail WCAG 2.5.5.", link: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html", homeLink: "https://www.w3.org/WAI/" },
      { name: "clamp() for fluid type", desc: "Free, native CSS. Use CSS clamp(min, preferred, max) so font sizes scale between mobile and desktop.", link: "https://developer.mozilla.org/en-US/docs/Web/CSS/clamp", homeLink: "https://developer.mozilla.org/" }
    ]
  },
  "Agentic Browsing": {
    WordPress: [
      { name: "Native semantic landmarks", desc: "Free (native). Most themes already output <header>, <nav>, <main>, <footer>. Verify in DevTools.", link: "https://developer.wordpress.org/themes/classic-themes/theme-basics/theme-structure/", homeLink: "https://developer.wordpress.org/" },
      { name: "Form label audit", desc: "Free (native). Gravity Forms, Contact Form 7 and WPForms output proper labels by default.", link: "https://developer.wordpress.org/", homeLink: "https://developer.wordpress.org/" },
      { name: "Yoast / Rank Math schema", desc: "Freemium. Both output Organization, WebSite, and Article JSON-LD automatically.", link: "https://search.google.com/test/rich-results", homeLink: "https://yoast.com/" }
    ],
    Shopify: [
      { name: "Native semantic markup", desc: "Free (native). Online Store 2.0 sections output clean landmarks.", link: "https://shopify.dev/docs/storefronts/themes/architecture/sections", homeLink: "https://shopify.dev/" },
      { name: "Product schema JSON-LD", desc: "Free (native). Shopify outputs Product schema natively.", link: "https://search.google.com/test/rich-results", homeLink: "https://shopify.dev/" },
      { name: "Form label audit", desc: "Free (native). Checkout and contact forms need proper labels.", link: "https://help.shopify.com/en/manual/online-store/themes", homeLink: "https://help.shopify.com/" }
    ],
    Wix: [
      { name: "Enable semantic HTML", desc: "Free (native). Wix outputs semantic markup in modern themes.", link: "https://support.wix.com/en/article/wix-editor-adding-and-setting-up-text-elements", homeLink: "https://www.wix.com/" },
      { name: "Schema markup editor", desc: "Free (native). Add JSON-LD schema per page under Settings > SEO > Advanced > Structured Data.", link: "https://support.wix.com/en/article/adding-structured-data-markup-to-your-site", homeLink: "https://www.wix.com/" },
      { name: "Form label check", desc: "Free (native). Wix forms support labels natively. Verify each field has one.", link: "https://support.wix.com/en/article/wix-forms-adding-and-setting-up-a-form", homeLink: "https://www.wix.com/" }
    ],
    Squarespace: [
      { name: "Native semantic blocks", desc: "Free (native). Use native blocks rather than code blocks so landmarks are preserved.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" },
      { name: "Heading hierarchy audit", desc: "Free (native). Verify one H1 per page and sequential H2/H3.", link: "https://support.squarespace.com/hc/en-us/articles/205815028", homeLink: "https://www.squarespace.com/" },
      { name: "Add llms.txt via Code Injection", desc: "Free, open source. Host llms.txt at the site root to help AI agents navigate.", link: "https://llmstxt.org/", homeLink: "https://llmstxt.org/" }
    ],
    Webflow: [
      { name: "Semantic HTML tags", desc: "Free (native). Set each container's tag to main, section, article, nav or aside.", link: "https://university.webflow.com/lesson/semantic-html-tags", homeLink: "https://university.webflow.com/" },
      { name: "Per-element tag settings", desc: "Free (native). Webflow lets you set the semantic tag for any element.", link: "https://university.webflow.com/lesson/semantic-html-tags", homeLink: "https://university.webflow.com/" },
      { name: "llms.txt hosting", desc: "Free, open source. Upload llms.txt to Webflow Assets. AI agents look for it at /llms.txt.", link: "https://llmstxt.org/", homeLink: "https://llmstxt.org/" }
    ],
    "Custom / Unknown": [
      { name: "llms.txt + AI-friendly robots.txt", desc: "Free, open source. Add llms.txt at root and allow GPTBot, ClaudeBot, PerplexityBot in robots.txt.", link: "https://llmstxt.org/", homeLink: "https://llmstxt.org/" },
      { name: "WebMCP integration (beta)", desc: "Free, open source spec. Expose tasks to AI agents via navigator.modelContext.", link: "https://github.com/webmcp", homeLink: "https://github.com/webmcp" },
      { name: "Skip link + focus order", desc: "Free, native. Add a skip-to-content link and verify keyboard focus order is logical.", link: "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html", homeLink: "https://www.w3.org/WAI/" },
      { name: "Schema.org JSON-LD", desc: "Free, open source. Add structured data for Organization, WebSite, and key page types.", link: "https://schema.org/", homeLink: "https://schema.org/" }
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