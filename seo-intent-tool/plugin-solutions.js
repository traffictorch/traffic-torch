const pluginData = {
"Schema Markup": {
  WordPress: [
    { name: "Yoast SEO", desc: "The leading SEO plugin with robust built-in schema support for Article, FAQ, HowTo, Product, and Person types. It automatically generates markup and offers easy overrides. Ideal for most sites wanting reliable rich snippets without complexity.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
    { name: "Rank Math", desc: "Feature-rich freemium plugin with an advanced schema generator supporting 20+ types and custom fields. Includes rich snippet testing and automation. Perfect for users needing granular control and AI-powered suggestions.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
    { name: "All in One SEO", desc: "Trusted by millions, it provides guided schema setup for common types with TruSEO scoring. Supports dynamic variables and automatic markup. Great balance of simplicity and power for beginners to pros.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
    { name: "Schema & Structured Data for WP", desc: "Dedicated schema plugin with conditional display and advanced types like Review and Recipe. Full AMP compatibility and migration tools. Best for sites requiring maximum schema flexibility.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", homeLink: "https://wpschema.com/" },
    { name: "SEOPress", desc: "Lightweight yet powerful with built-in schema for multiple types and no ads in free version. Easy JSON-LD management and validation. Excellent for performance-focused sites.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
  ],
  Shopify: [
    { name: "Schema Plus for SEO", desc: "Top-rated app that automatically adds complete JSON-LD schema for products, collections, blogs, and more. Fixes Google errors and enables rich results. Essential for e-commerce stores targeting higher CTR.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
    { name: "Webrex AI SEO Optimizer Schema", desc: "AI-powered app generating accurate schema for products, FAQs, and videos. Integrates with 30+ review apps and removes duplicates. Great for automated, up-to-date markup.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld", homeLink: "https://webrexstudio.com/" },
    { name: "JSON-LD Express for SEO Schema", desc: "Fast and complete schema support with automatic installation. Supports all rich data types and custom markup. Reliable choice for quick rich snippet setup.", link: "https://apps.shopify.com/json-express-for-seo", homeLink: "https://quantumseolabs.com/" },
    { name: "SearchPie SEO", desc: "All-in-one SEO app including strong schema generation and speed tools. Regularly updated for new rich result types. Good for comprehensive optimization.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" }
  ],
  Wix: [
    { name: "Built-in Structured Data", desc: "Wix automatically generates basic schema for pages, products, and blogs. Custom options available via SEO settings and Velo. Sufficient for most Wix sites without extra apps.", link: "https://support.wix.com/en/article/seo-adding-structured-data-to-your-wix-site" }
  ],
  Squarespace: [
    { name: "Built-in Markup", desc: "Squarespace natively creates schema for pages, products, events, and blogs. Automatic and always updated with platform changes. No third-party tools needed for standard rich results.", link: "https://support.squarespace.com/hc/en-us/articles/360002091288-Structured-data-and-rich-results" }
  ],
  Joomla: [
    { name: "Google Structured Data", desc: "Free extension adding breadcrumb, article, and organization schema. Simple configuration with overrides. Reliable for basic rich snippets on Joomla sites.", link: "https://extensions.joomla.org/extension/google-structured-data/", homeLink: "https://stackideas.com/" },
    { name: "EFSEO", desc: "Freemium tool handling structured data alongside meta tags. Frontend editing and multiple types supported. Good centralized solution.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
  ],
  Drupal: [
    { name: "Schema.org Metatag", desc: "Comprehensive module with full Schema.org vocabulary support. Highly configurable for any entity type. Industry standard for advanced Drupal schema.", link: "https://www.drupal.org/project/schema_metatag" },
    { name: "Metatag", desc: "Core-like module providing base for structured data extensions. Required for most schema implementations. Solid foundation.", link: "https://www.drupal.org/project/metatag" }
  ]
},
"Optimized Title Tag": {
  WordPress: [
    { name: "Yoast SEO", desc: "Industry leader with real-time title previews, character counters, and AI-powered rewrite suggestions. Supports dynamic variables and bulk editing. Essential for crafting click-worthy titles that boost CTR.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
    { name: "Rank Math", desc: "Advanced title optimization with focus keyword integration, bulk editing, and SERP preview. Includes AI content generator for titles. Perfect for large sites needing efficiency and precision.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
    { name: "All in One SEO", desc: "TruSEO scoring analyzes title strength with smart recommendations and dynamic patterns. Trusted defaults and unlimited keywords. Great all-rounder for consistent optimization.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
    { name: "SEOPress", desc: "Lightweight title editor with dynamic variables, no branding in free version, and clean SERP preview. Fast and highly customizable. Ideal for performance-focused sites.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
  ],
  Shopify: [
    { name: "SearchPie SEO", desc: "Automatic title optimization with AI templates, bulk editing, and best practice enforcement. Focuses on compelling titles for higher click-through rates. Comprehensive e-commerce solution.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
    { name: "Plug in SEO", desc: "Scans and fixes title issues with specific recommendations and alerts. Monitors changes over time. Long-standing trusted app for title health.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" },
    { name: "Yoast SEO for Shopify", desc: "Official Yoast app bringing real-time title previews and AI suggestions to Shopify. Focus keyword integration and snippet preview. Familiar interface for Yoast users.", link: "https://apps.shopify.com/yoast-seo", homeLink: "https://yoast.com/" }
  ],
  Wix: [
    { name: "Built-in SEO Wiz", desc: "Guided step-by-step wizard for optimal title creation with real-time previews and character limits. Personalized recommendations based on site content. Integrated directly in Wix editor.", link: "https://support.wix.com/en/article/seo-customizing-your-sites-title-and-meta-tags" },
    { name: "SEO with AI", desc: "AI-powered app generating personalized title suggestions with GPT-4 analysis. Automated optimization and content recommendations. Great for faster, smarter title crafting.", link: "https://www.wix.com/app-market/web-solution/seo-with-ai-by-certified-code" }
  ],
  Squarespace: [
    { name: "Built-in Page Settings", desc: "Dedicated SEO title field separate from navigation title with character counter and best practices tips. Native previews and automatic defaults from content. Reliable built-in solution.", link: "https://support.squarespace.com/hc/en-us/articles/360002090288-SEO-settings" },
    { name: "SEOSpace", desc: "Popular Squarespace SEO plugin with title analysis, scoring, and optimization suggestions. Helps craft compelling titles for better CTR. Essential add-on for advanced users.", link: "https://www.seospace.co/", homeLink: "https://www.seospace.co/" }
  ],
  Joomla: [
    { name: "EFSEO - Easy Frontend SEO", desc: "Central control for title tags with frontend editing and automatic generation rules. Bulk operations and overrides available. Efficient for Joomla title management.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
    { name: "Tag Meta", desc: "Advanced rules-based title management with macros and patterns. Site-wide consistency and per-page customization. Powerful for large Joomla sites.", link: "https://extensions.joomla.org/extension/tag-meta/" },
    { name: "OSMeta", desc: "Dashboard for bulk title editing and metadata control. Quick access and reporting features. Trusted for streamlined workflows.", link: "https://extensions.joomla.org/extension/osmeta/" }
  ],
  Drupal: [
    { name: "Metatag", desc: "Comprehensive module for title and meta control with tokens for dynamic content. Per-entity settings and social integration. Foundation for Drupal SEO titles.", link: "https://www.drupal.org/project/metatag" },
    { name: "Page Title", desc: "Dedicated module for overriding page titles with patterns and tokens. Works alongside Metatag for full control. Essential for custom title formatting.", link: "https://www.drupal.org/project/page_title" }
  ]
},
"Compelling Meta Description": {
  WordPress: [
    { name: "Yoast SEO", desc: "Real-time meta description editor with snippet preview, character counter, and AI-powered suggestions. Focuses on compelling, clickable copy. Industry standard for crafting descriptions that boost CTR.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
    { name: "Rank Math", desc: "Dynamic meta descriptions with variables, bulk editing, and accurate SERP preview. Strong focus keyword integration and readability checks. Excellent for creating engaging descriptions at scale.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
    { name: "All in One SEO", desc: "Smart meta generation with TruSEO scoring, readability feedback, and dynamic patterns. Excellent defaults and unlimited keywords. Trusted for consistent, compelling descriptions.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
    { name: "SEOPress", desc: "Clean, lightweight editor with dynamic variables, no upsells in free version. Fast SERP preview and customization. Ideal for performance-focused sites needing strong descriptions.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
  ],
  Shopify: [
    { name: "SearchPie SEO", desc: "Optimizes meta descriptions store-wide with AI templates and bulk editing. Focuses on compelling, keyword-rich copy for higher CTR. Comprehensive e-commerce SEO solution.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
    { name: "Plug in SEO", desc: "Scans and fixes meta description issues with specific recommendations and alerts. Monitors changes over time. Long-standing trusted app for description health.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" },
    { name: "Smart SEO", desc: "AI-generated meta descriptions with image alt text and structured data. Automatic optimization for products and pages. Great for quick, compelling copy.", link: "https://apps.shopify.com/smart-seo", homeLink: "https://sherpas.design/" }
  ],
  Wix: [
    { name: "Built-in AI Meta Tag Creator", desc: "AI-powered tool generating three optimized meta description suggestions based on page content. Choose tone and refine easily. Integrated directly in Wix SEO panel.", link: "https://support.wix.com/en/article/creating-seo-tags-using-ai" },
    { name: "MetaMaster: SEO Optimizer", desc: "Analyzes and generates compelling meta descriptions with scoring. Identifies issues and suggests improvements. Streamlined for quick enhancements.", link: "https://www.wix.com/app-market/web-solution/metamaster-seo-page-optimizer" },
    { name: "One-Click Optimizer", desc: "Automatically applies meta description improvements with AI suggestions. Generates optimized copy matching your brand. Boosts visibility with minimal effort.", link: "https://www.wix.com/app-market/web-solution/seo-optimizer" }
  ],
  Squarespace: [
    { name: "Built-in SEO Tools", desc: "Native editor for custom meta descriptions with character limits and previews. Automatically generates defaults from content. Clean and reliable built-in solution.", link: "https://support.squarespace.com/hc/en-us/articles/360002090288-SEO-settings" },
    { name: "SEOSpace", desc: "Dedicated Squarespace SEO plugin with meta description analysis, scoring, and AI suggestions. Helps craft compelling copy for better CTR. Essential add-on for advanced users.", link: "https://www.seospace.co/", homeLink: "https://www.seospace.co/" }
  ],
  Joomla: [
    { name: "EFSEO - Easy Frontend SEO", desc: "Frontend editing for meta descriptions with automatic generation rules. Bulk operations and overrides. Efficient centralized solution.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
    { name: "Tag Meta", desc: "Rules-based meta description management with macros and patterns. Site-wide consistency and per-page customization. Powerful for large sites.", link: "https://extensions.joomla.org/extension/tag-meta/" },
    { name: "OSMeta", desc: "Dashboard for bulk meta description editing and metadata control. Quick access and reporting. Trusted for streamlined workflows.", link: "https://extensions.joomla.org/extension/osmeta/" }
  ],
  Drupal: [
    { name: "Metatag", desc: "Comprehensive module for meta description control with tokens for dynamic content. Per-entity settings and social integration. Foundation for compelling descriptions.", link: "https://www.drupal.org/project/metatag" }
  ]
},
"Image Optimization & Alt Text": {
  WordPress: [
    { name: "Smush", desc: "Most popular optimizer with lazy loading, WebP/AVIF conversion, bulk processing, and alt text suggestions. Automatic optimization on upload with lossless/lossy options. Trusted by millions for reliable speed gains without quality loss.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
    { name: "EWWW Image Optimizer", desc: "Pixel-perfect compression supporting WebP/AVIF with local or cloud processing. Excellent quality retention and easy bulk optimization. Strong choice for professional sites needing precise control.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
    { name: "Imagify", desc: "Smart compression levels with visual comparison and next-gen formats. Bulk restore and automatic optimization. Premium feel with excellent balance of size and quality.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" },
    { name: "ShortPixel", desc: "Advanced glossy/lossy compression with generous free tier and AVIF support. CDN delivery in premium. Ideal for e-commerce with heavy image needs.", link: "https://wordpress.org/plugins/shortpixel-image-optimiser/", homeLink: "https://shortpixel.com/" }
  ],
  Shopify: [
    { name: "TinyIMG", desc: "Complete optimization with alt text generation, automatic monitoring, and bulk processing. Supports WebP/AVIF and filename SEO. Proven to significantly improve Core Web Vitals.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
    { name: "Crush.pics", desc: "Automatic compression on upload with format conversion and SEO-friendly alt/filenames. Set-and-forget with strong results. Clean interface trusted by many stores.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" },
    { name: "Image Optimizer Pro", desc: "Bulk compression, WebP conversion, and alt text tools. One-click optimization for entire store. Great for large catalogs needing fast results.", link: "https://apps.shopify.com/media-compressor" }
  ],
  Wix: [
    { name: "Built-in Optimizer", desc: "Automatically compresses images on upload with responsive delivery and modern formats. Manual alt text editing in editor. Native solution requiring no extra apps.", link: "https://support.wix.com/en/article/optimizing-images-for-your-wix-site" },
    { name: "Website Speedy", desc: "App focused on lazy loading and further compression. Improves load times beyond built-in tools. Easy setup for additional gains.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
  ],
  Squarespace: [
    { name: "Built-in Tools", desc: "Native automatic compression, responsive delivery, and alt text fields. Consistent optimization across all templates. Reliable with no third-party needed.", link: "https://support.squarespace.com/hc/en-us/articles/360022529371-Reducing-your-page-size-for-faster-loading" },
    { name: "TinyIMG Extension", desc: "Connects for additional bulk compression and lazy loading. Helps improve LCP/CLS on image-heavy sites. Useful add-on for extra performance.", link: "https://tiny-img.com/squarespace/" }
  ],
  Joomla: [
    { name: "ImageRecycle", desc: "Cloud-based compression for images and PDFs with bulk optimization. Preserves quality while reducing size significantly. Integrates with Joomla media manager.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" },
    { name: "JCH Optimize", desc: "Combines compression with lazy loading and critical CSS. Top-rated for overall speed including images. Strong CWV improvements.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
  ],
  Drupal: [
    { name: "ImageAPI Optimize", desc: "Utility for defining optimization pipelines with multiple processors. Supports WebP/AVIF and bulk processing. Flexible foundation for advanced setups.", link: "https://www.drupal.org/project/imageapi_optimize" },
    { name: "ImageAPI Optimize WebP", desc: "Automatic WebP generation for image styles. Works with ImageAPI Optimize framework. Essential for next-gen format delivery.", link: "https://www.drupal.org/project/imageapi_optimize_webp" }
  ]
},
"Core Web Vitals / Page Speed Optimization": {
  WordPress: [
    { name: "Autoptimize", desc: "Free essential plugin for minifying CSS/JS, generating critical CSS, and lazy loading. Lightweight and highly configurable. Strong foundation for improving LCP and overall speed.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
    { name: "WP-Optimize", desc: "All-in-one cleanup tool with caching, minification, database optimization, and image compression. Excellent for ongoing maintenance and CWV gains.", link: "https://wordpress.org/plugins/wp-optimize/", homeLink: "https://teamupdraft.com/wp-optimize/" },
    { name: "LiteSpeed Cache", desc: "Full-page caching with server-level optimizations (best on LiteSpeed hosts). Includes image optimization and lazy loading. Often delivers dramatic CWV improvements.", link: "https://wordpress.org/plugins/litespeed-cache/", homeLink: "https://www.litespeedtech.com/products/cache-plugins/wordpress-cache" },
    { name: "Perfmatters", desc: "Lightweight script manager to disable unused CSS/JS and defer loading. Directly targets INP and CLS issues. Minimal overhead with maximum impact.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
  ],
  Shopify: [
    { name: "Rocket Page Speed Optimizer", desc: "Automatic lazy loading, preloading, and script optimization focused on Core Web Vitals. Proven to deliver major LCP and CLS improvements.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" },
    { name: "Boostify Page Speed Optimizer", desc: "AI-powered lazy loading, minification, and smart preload. Excellent for mobile INP and overall CWV scores.", link: "https://apps.shopify.com/page-speed-optimization", homeLink: "https://boostifyapps.com/" },
    { name: "Hyperspeed EXTREME", desc: "Advanced minification, app optimization, and lazy loading. Regularly updated for latest CWV requirements with strong results on large stores.", link: "https://apps.shopify.com/hyperspeed", homeLink: "https://hyperspeed.app/" },
    { name: "AiSpeed", desc: "AI-driven optimization for images, JS deferral, and lazy loading. Targets LCP, INP, and CLS directly with smart automation.", link: "https://apps.shopify.com/aispeed", homeLink: "https://aispeed.app/" }
  ],
  Wix: [
    { name: "Website Speedy", desc: "Dedicated app with lazy loading, prefetching, and render-blocking removal. Directly targets Core Web Vitals for noticeable improvements.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" },
    { name: "Built-in Optimization", desc: "Wix natively uses CDN, auto image optimization, and modern formats. Focus on minimal apps and light elements for best CWV results.", link: "https://www.wix.com/performance" }
  ],
  Squarespace: [
    { name: "Built-in Tools", desc: "Native CDN, automatic image optimization, and responsive delivery. Limited third-party options – rely on clean design and compressed assets.", link: "https://support.squarespace.com/hc/en-us/articles/360022529371-Reducing-your-page-size-for-faster-loading" }
  ],
  Joomla: [
    { name: "JCH Optimize", desc: "Top-rated extension combining CSS/JS, lazy loading, and critical CSS generation. Strong CWV improvements with comprehensive features.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" },
    { name: "Speed Cache", desc: "Static page caching with browser cache and lazy loading. Reduces server load and improves perceived speed effectively.", link: "https://extensions.joomla.org/extension/speed-cache/" },
    { name: "Page Speed Optimizer", desc: "Powerful optimization engine for minification and render-blocking removal. Boosts PageSpeed and Core Web Vitals metrics.", link: "https://extensions.joomla.org/extension/page-speed-optimizer/" }
  ],
  Drupal: [
    { name: "Internal + Dynamic Page Cache", desc: "Core modules for anonymous and authenticated caching. Essential foundation for fast loading and better CWV scores.", link: "https://www.drupal.org/docs/administering-a-drupal-site/managing-site-performance-and-scalability" },
    { name: "BigPipe", desc: "Core module sending static content first while loading personalized parts. Greatly improves perceived speed and LCP.", link: "https://www.drupal.org/docs/core-modules-and-themes/core-modules/bigpipe-module" },
    { name: "AdvAgg", desc: "Advanced aggregation for CSS/JS with minification and compression. Improves front-end performance and CWV.", link: "https://www.drupal.org/project/advagg" }
  ]
}
}; 

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto';

  const nonExcellentCount = failedMetrics.filter(m => m.grade.text !== 'Excellent').length;

  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for Metrics Needing Improvement
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${nonExcellentCount} metric${nonExcellentCount > 1 ? 's need' : ' needs'} attention. 
      Expand any panel below to see top free/freemium plugins that can help fix it.
    </p>

    <div class="space-y-6">
      ${failedMetrics
        .filter(m => m.grade.text !== 'Excellent')
        .map(m => {
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
  `;

  container.appendChild(section);

  // Event listeners
  failedMetrics
    .filter(m => m.grade.text !== 'Excellent')
    .forEach(m => {
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
  <div class="relative">
    <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${plugin.name}</h4>
    <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${plugin.desc}</p>
    <div class="flex flex-wrap gap-4">
      <a href="${plugin.link || '#'}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300">
        Install from CMS Library
      </a>
      ${plugin.homeLink ? `
        <a href="${plugin.homeLink}" target="_blank" rel="noopener" class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-lg font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300">
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