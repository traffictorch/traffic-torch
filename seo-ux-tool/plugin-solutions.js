// Shared getGrade function (copied from script.js for compatibility)
const getGrade = (score) => {
  if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
  if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
};

const pluginData = {
  "Title optimized (30–65 chars, keyword early)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time title editor with length counter, keyword placement suggestions, and SERP preview. Enforces 50-60 char optimal range. AI title ideas in premium.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced title optimization with dynamic variables, bulk editing, and focus keyword scoring. Accurate preview and length guidance.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "TruSEO scoring for title strength with smart patterns and recommendations. Unlimited keywords and defaults.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Automatic title optimization with AI templates and bulk tools. Focuses on keyword placement and length for CTR.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
      { name: "Plug in SEO", desc: "Scans titles, provides fixes, and monitors length/keyword placement. Reliable for ongoing optimization.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" }
    ],
    Wix: [
      { name: "Built-in SEO Wiz", desc: "Guided title creation with previews, character limits, and keyword suggestions. Native and personalized.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Page Settings", desc: "Dedicated SEO title field with counter and tips. Native previews and defaults from content.", link: "" }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend title editing with length rules and automatic generation. Bulk operations.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "Tag Meta", desc: "Rules-based title management with patterns and length control. Site-wide consistency.", link: "https://extensions.joomla.org/extension/tag-meta/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Comprehensive title control with tokens and length validation. Per-entity settings.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "Meta description present & optimal": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time editor with length guidance, keyword integration, and SERP preview. AI suggestions for compelling copy.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Dynamic descriptions with variables, bulk tools, and accurate preview. Strong readability checks.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Smart generation with TruSEO scoring and dynamic patterns. Excellent defaults.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Optimizes descriptions store-wide with AI templates and bulk editing. Keyword-rich copy for CTR.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
      { name: "Plug in SEO", desc: "Scans and fixes description issues with recommendations and alerts. Monitors changes.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" }
    ],
    Wix: [
      { name: "Built-in AI Meta Tag Creator", desc: "AI generates optimized description suggestions. Choose tone and refine. Native in SEO panel.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in SEO Tools", desc: "Native editor for custom descriptions with limits and previews. Generates defaults from content.", link: "" }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend description editing with generation rules. Bulk operations.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "Tag Meta", desc: "Rules-based description management with patterns. Site-wide consistency.", link: "https://extensions.joomla.org/extension/tag-meta/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Comprehensive description control with tokens and length validation.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "Structured data (schema) detected": {
    WordPress: [
      { name: "Yoast SEO", desc: "Built-in schema for Article, FAQ, HowTo, etc. Auto markup and easy overrides.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced generator with 20+ types and AI suggestions. Testing tools.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Guided setup with TruSEO and auto markup. Dynamic variables.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic JSON-LD for products, collections, blogs. Fixes errors.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Webrex AI SEO Optimizer Schema", desc: "AI-powered schema for products, FAQs, videos. Duplicate removal.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld", homeLink: "https://webrexstudio.com/" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Auto-generates basic schema for pages, products, blogs. Custom via Velo.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for pages, products, events, blogs. Automatic updates.", link: "" }
    ],
    Joomla: [
      { name: "Google Structured Data", desc: "Free extension for breadcrumb, article, organization schema.", link: "https://extensions.joomla.org/extension/google-structured-data/", homeLink: "https://stackideas.com/" },
      { name: "EFSEO", desc: "Freemium tool for structured data and meta tags. Multiple types.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Schema.org Metatag", desc: "Full Schema.org support with high configurability.", link: "https://www.drupal.org/project/schema_metatag" },
      { name: "Metatag", desc: "Base module for structured data extensions.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "Canonical tag present": {
    WordPress: [
      { name: "Yoast SEO", desc: "Automatically adds canonical tags with overrides. Prevents duplicate content issues.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Generates canonical URLs with bulk control. Strong duplicate handling.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Auto canonical with custom options. Trusted for consistency.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Scans and adds canonical tags with recommendations.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" }
    ],
    Wix: [
      { name: "Built-in SEO Settings", desc: "Native canonical support via advanced settings.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native canonical handling for duplicate pages.", link: "" }
    ],
    Joomla: [
      { name: "Tag Meta", desc: "Rules-based canonical management.", link: "https://extensions.joomla.org/extension/tag-meta/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Canonical control with tokens.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "All images have meaningful alt text": {
    WordPress: [
      { name: "Smush", desc: "Bulk alt text suggestions and auto-fill. AI extensions available.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Bulk alt tools with quality focus.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
      { name: "Imagify", desc: "Alt suggestions with compression.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "AI alt text generation and bulk processing.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "SEO-friendly alt/filenames with bulk tools.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Manual alt text editing in editor.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Alt text fields in editor.", link: "" }
    ],
    Joomla: [
      { name: "ImageRecycle", desc: "Bulk alt text tools with compression.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" }
    ],
    Drupal: [
      { name: "ImageAPI Optimize", desc: "Alt text support in optimization pipelines.", link: "https://www.drupal.org/project/imageapi_optimize" }
    ]
  },

  "Web app manifest linked": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Adds manifest.json and links it automatically.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://superpwa.com/" },
      { name: "PWA for WP", desc: "Complete manifest and PWA setup.", link: "https://wordpress.org/plugins/pwa-for-wp/", homeLink: "https://pwa-for-wp.com/" }
    ],
    Shopify: [
      { name: "PWA by Shop Sheriff", desc: "Adds manifest and links it.", link: "https://apps.shopify.com/pwa-by-shop-sheriff" }
    ],
    Wix: [
      { name: "Built-in PWA Features", desc: "Native manifest support.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in PWA", desc: "Native manifest handling.", link: "" }
    ],
    Joomla: [
      { name: "PWA Joomla", desc: "Adds manifest for PWA.", link: "https://extensions.joomla.org/extension/pwa-joomla/" }
    ],
    Drupal: [
      { name: "Progressive Web App", desc: "Module for manifest.", link: "https://www.drupal.org/project/pwa" }
    ]
  },

  "Homescreen icons (192px+) provided": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Generates and includes homescreen icons.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://superpwa.com/" },
      { name: "PWA for WP", desc: "Complete icon support for PWA.", link: "https://wordpress.org/plugins/pwa-for-wp/", homeLink: "https://pwa-for-wp.com/" }
    ],
    Shopify: [
      { name: "PWA by Shop Sheriff", desc: "Provides homescreen icons.", link: "https://apps.shopify.com/pwa-by-shop-sheriff" }
    ],
    Wix: [
      { name: "Built-in PWA Features", desc: "Native icon handling.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in PWA", desc: "Native icon support.", link: "" }
    ],
    Joomla: [
      { name: "PWA Joomla", desc: "Adds homescreen icons.", link: "https://extensions.joomla.org/extension/pwa-joomla/" }
    ],
    Drupal: [
      { name: "Progressive Web App", desc: "Module for icons.", link: "https://www.drupal.org/project/pwa" }
    ]
  },

  "Service worker": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Registers service worker for PWA.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://superpwa.com/" },
      { name: "PWA for WP", desc: "Complete service worker setup.", link: "https://wordpress.org/plugins/pwa-for-wp/", homeLink: "https://pwa-for-wp.com/" }
    ],
    Shopify: [
      { name: "PWA by Shop Sheriff", desc: "Adds service worker.", link: "https://apps.shopify.com/pwa-by-shop-sheriff" }
    ],
    Wix: [
      { name: "Built-in PWA Features", desc: "Native service worker support.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in PWA", desc: "Native service worker.", link: "" }
    ],
    Joomla: [
      { name: "PWA Joomla", desc: "Adds service worker.", link: "https://extensions.joomla.org/extension/pwa-joomla/" }
    ],
    Drupal: [
      { name: "Progressive Web App", desc: "Module for service worker.", link: "https://www.drupal.org/project/pwa" }
    ]
  },

  "Page weight reasonable (<300KB HTML)": {
    WordPress: [
      { name: "Autoptimize", desc: "Minifies HTML/CSS/JS to reduce page weight.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Perfmatters", desc: "Removes bloat and unused code to shrink page size.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Compresses and removes bloat for lighter pages.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Reduces page weight by optimizing assets.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Optimization", desc: "Native compression for reasonable page weight.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Minifies and removes bloat for lighter pages.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Aggregates and minifies to reduce weight.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Number of HTTP requests": {
    WordPress: [
      { name: "Autoptimize", desc: "Combines CSS/JS to reduce requests.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Perfmatters", desc: "Removes unused assets to lower requests.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Combines and removes requests.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Reduces requests by optimization.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native minimization of requests.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Combines files to reduce requests.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Aggregates to lower request count.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Render-blocking resources": {
    WordPress: [
      { name: "Autoptimize", desc: "Defers and asyncs render-blocking scripts.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Perfmatters", desc: "Delays and removes render-blocking code.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Defers render-blocking resources.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Removes render-blocking issues.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Optimization", desc: "Native deferral of render-blocking.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Defers render-blocking CSS/JS.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Defers render-blocking resources.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Web fonts optimized": {
    WordPress: [
      { name: "OMGF", desc: "Local Google Fonts with preload and swap.", link: "https://wordpress.org/plugins/host-webfonts-local/", homeLink: "https://daan.dev/omgf/" },
      { name: "Perfmatters", desc: "Preload and disable unused fonts.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Font preload and optimization.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" }
    ],
    Wix: [
      { name: "Built-in Font Optimization", desc: "Native font handling.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native font optimization.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Font preload and minification.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Font aggregation and optimization.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Form fields properly labeled": {
    WordPress: [
      { name: "WP Accessibility", desc: "Adds labels to form fields and improves accessibility.", link: "https://wordpress.org/plugins/wp-accessibility/", homeLink: "https://equalizedigital.com/" }
    ],
    Shopify: [
      { name: "Accessibility Booster", desc: "Enhances form labels and accessibility.", link: "https://apps.shopify.com/accessibility-booster" }
    ],
    Wix: [
      { name: "Built-in Accessibility Tools", desc: "Native form label support.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native form labeling.", link: "" }
    ],
    Joomla: [
      { name: "Accessibility Plugin", desc: "Improves form labels.", link: "https://extensions.joomla.org/extension/accessibility/" }
    ],
    Drupal: [
      { name: "Accessibility", desc: "Enhances form field labels.", link: "https://www.drupal.org/project/accessibility" }
    ]
  },

  "Clear primary calls-to-action": {
    WordPress: [
      { name: "Elementor", desc: "Drag-and-drop builder for prominent CTAs.", link: "https://wordpress.org/plugins/elementor/", homeLink: "https://elementor.com/" },
      { name: "Thrive Architect", desc: "Focused CTA builder with conversion focus.", link: "https://thrivethemes.com/architect/", homeLink: "https://thrivethemes.com/" }
    ],
    Shopify: [
      { name: "Shogun Page Builder", desc: "Builds clear, prominent CTAs.", link: "https://apps.shopify.com/shogun" }
    ],
    Wix: [
      { name: "Built-in Editor", desc: "Drag-and-drop for clear CTAs.", link: "" }
    ],
    Squarespace: [
      { name: "Fluid Engine", desc: "Native CTA design tools.", link: "" }
    ],
    Joomla: [
      { name: "SP Page Builder", desc: "Builds prominent CTAs.", link: "https://extensions.joomla.org/extension/sp-page-builder/" }
    ],
    Drupal: [
      { name: "Layout Builder", desc: "Creates clear CTAs.", link: "https://www.drupal.org/project/layout_builder" }
    ]
  },

  "Breadcrumb navigation (on deep pages)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Built-in breadcrumb generation.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Breadcrumb NavXT", desc: "Dedicated breadcrumb plugin.", link: "https://wordpress.org/plugins/breadcrumb-navxt/", homeLink: "https://mtekk.us/" }
    ],
    Shopify: [
      { name: "Yoast SEO for Shopify", desc: "Adds breadcrumb navigation.", link: "https://apps.shopify.com/yoast-seo" }
    ],
    Wix: [
      { name: "Built-in Breadcrumbs", desc: "Native breadcrumb support.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Breadcrumbs", desc: "Native breadcrumb tools.", link: "" }
    ],
    Joomla: [
      { name: "Breadcrumb Module", desc: "Adds breadcrumbs.", link: "https://extensions.joomla.org/extension/breadcrumb/" }
    ],
    Drupal: [
      { name: "Breadcrumb", desc: "Generates breadcrumbs.", link: "https://www.drupal.org/project/breadcrumb" }
    ]
  },

  "Served over HTTPS": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Forces HTTPS and fixes mixed content.", link: "https://wordpress.org/plugins/really-simple-ssl/", homeLink: "https://really-simple-ssl.com/" }
    ],
    Shopify: [
      { name: "Built-in HTTPS", desc: "Native HTTPS support.", link: "" }
    ],
    Wix: [
      { name: "Built-in SSL", desc: "Native HTTPS.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in SSL", desc: "Native HTTPS.", link: "" }
    ],
    Joomla: [
      { name: "Force HTTPS", desc: "Forces HTTPS.", link: "https://extensions.joomla.org/extension/force-https/" }
    ],
    Drupal: [
      { name: "Secure Pages", desc: "Forces HTTPS.", link: "https://www.drupal.org/project/secure_pages" }
    ]
  },

  "No mixed content": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Fixes mixed content automatically.", link: "https://wordpress.org/plugins/really-simple-ssl/", homeLink: "https://really-simple-ssl.com/" },
      { name: "SSL Insecure Content Fixer", desc: "Rewrites mixed content to HTTPS.", link: "https://wordpress.org/plugins/ssl-insecure-content-fixer/" }
    ],
    Shopify: [
      { name: "Built-in HTTPS", desc: "Native mixed content handling.", link: "" }
    ],
    Wix: [
      { name: "Built-in SSL", desc: "Native fix.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in SSL", desc: "Native fix.", link: "" }
    ],
    Joomla: [
      { name: "Force HTTPS", desc: "Fixes mixed content.", link: "https://extensions.joomla.org/extension/force-https/" }
    ],
    Drupal: [
      { name: "Secure Pages", desc: "Handles mixed content.", link: "https://www.drupal.org/project/secure_pages" }
    ]
  }
};

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto';

  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for SEO & UX Issues
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${failedMetrics.length} issue${failedMetrics.length > 1 ? 's need' : ' needs'} attention. 
      Expand any panel below to see top free/freemium plugins that can help fix it.
    </p>

    <div class="space-y-6">
      ${failedMetrics.map(m => {
        const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
        const g = m.grade;
        return `
          <details class="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <summary class="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
              <h3 class="text-2xl md:text-3xl font-bold ${g.color}">
                ${g.emoji} ${m.name}
              </h3>
              <div class="transform transition-transform duration-300 group-open:rotate-180">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </summary>

            <div class="px-6 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-md mx-auto my-8">
                <select id="cms-select-${metricId}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your CMS...</option>
                  ${Object.keys(pluginData[m.name] || {}).map(cms => 
                    `<option value="${cms}">${cms}</option>`
                  ).join('')}
                </select>
              </div>

              <div id="plugins-${metricId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
                <!-- Plugins injected here -->
              </div>
            </div>
          </details>
        `;
      }).join('')}
    </div>

    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-12">
      These popular free/freemium plugins can help optimize these SEO and UX areas. Always test compatibility on a staging site and review recent updates.
    </p>
  `;

  container.appendChild(section);

  // Event listeners for dropdowns
  failedMetrics.forEach(m => {
    const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
    const select = document.getElementById(`cms-select-${metricId}`);
    const pluginsList = document.getElementById(`plugins-${metricId}`);

    if (!select || !pluginsList) return;

    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      if (!selected || !pluginData[m.name]?.[selected]) return;

      pluginData[m.name][selected].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';

        card.innerHTML = `
          <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative">
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${plugin.name}</h4>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${plugin.desc}</p>
            <div class="flex flex-wrap gap-4">
              ${plugin.link ? `
                <a href="${plugin.link}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                  Install from CMS Library
                </a>
              ` : ''}
              ${plugin.homeLink ? `
                <a href="${plugin.homeLink}" target="_blank" rel="noopener" class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                  Visit Plugin Website
                </a>
              ` : ''}
            </div>
          </div>
        `;
        pluginsList.appendChild(card);
      });

      pluginsList.classList.remove('hidden');
    });
  });
}

export { renderPluginSolutions };