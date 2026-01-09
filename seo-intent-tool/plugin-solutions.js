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
      { name: "Yoast SEO", desc: "Industry leader with real-time title previews, length indicators, and AI suggestions. Dynamic variables and bulk editing available. Essential for professional title optimization.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Advanced bulk editing, dynamic variables, and focus keyword integration. Excellent search preview and scoring. Perfect for large sites.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "All in One SEO", desc: "TruSEO analysis with smart title recommendations and patterns. Trusted by millions with strong defaults. Great all-rounder.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/" },
      { name: "SEOPress", desc: "Lightweight with clean interface, dynamic titles, and no branding in free version. Fast and customizable. Ideal for performance-conscious users.", link: "https://wordpress.org/plugins/wp-seopress/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Automatic title optimization with templates and bulk tools. Focuses on best practices for higher CTR. Comprehensive e-commerce solution.", link: "https://apps.shopify.com/seo-booster" },
      { name: "Plug in SEO", desc: "Scans titles, provides fixes, and monitors changes. Long-standing reliable app for title health.", link: "https://apps.shopify.com/plug-in-seo" }
    ],
    Wix: [
      { name: "Built-in SEO Wiz", desc: "Guided wizard for optimal title creation with previews and character limits. Integrated directly in editor. Easy for all users.", link: "https://support.wix.com/en/article/seo-customizing-your-sites-title-and-meta-tags" }
    ],
    Squarespace: [
      { name: "Built-in Page Settings", desc: "Dedicated SEO title field with character counter and best practice tips. Separate from navigation title. Native and reliable.", link: "https://support.squarespace.com/hc/en-us/articles/360002090288-SEO-settings" }
    ]
  },
  "Compelling Meta Description": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time editor with snippet preview and length guidance. AI suggestions in premium. Helps craft compelling copy for better CTR.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Dynamic descriptions with variables and bulk tools. Accurate search preview. Strong focus keyword integration.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "All in One SEO", desc: "Smart generation with TruSEO scoring and readability feedback. Excellent defaults for new content.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/" },
      { name: "SEOPress", desc: "Clean editor with dynamic variables and no upsells in free version. Lightweight and fast.", link: "https://wordpress.org/plugins/wp-seopress/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Optimizes meta descriptions store-wide with templates and bulk editing. Focuses on compelling copy for higher click-through rates.", link: "https://apps.shopify.com/seo-booster" }
    ]
  },
  "Image Optimization & Alt Text": {
    WordPress: [
      { name: "Smush", desc: "Most popular optimizer with lazy loading, WebP conversion, and bulk processing. Includes alt text suggestions. Trusted by millions for reliable performance gains.", link: "https://wordpress.org/plugins/wp-smushit/" },
      { name: "EWWW Image Optimizer", desc: "Pixel-perfect compression with WebP/AVIF support and cloud options. Excellent quality retention. Strong for professional sites.", link: "https://wordpress.org/plugins/ewww-image-optimizer/" },
      { name: "Imagify", desc: "Next-gen formats and smart compression levels with visual comparison. Bulk restore available. Premium feel throughout.", link: "https://wordpress.org/plugins/imagify-image-optimizer/" },
      { name: "ShortPixel", desc: "Advanced compression with glossy options and generous free tier. WebP/AVIF delivery. Great for e-commerce.", link: "https://wordpress.org/plugins/shortpixel-image-optimiser/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Complete optimization with alt text suggestions and automatic monitoring. Proven to improve Core Web Vitals significantly.", link: "https://apps.shopify.com/tinyimg" },
      { name: "Crush.pics", desc: "Automatic compression on upload with format conversion. SEO-friendly filenames and alt tools. Clean and reliable.", link: "https://apps.shopify.com/crush-pics" }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Automatically compresses images on upload while preserving quality. Manual alt text editing in editor. Native solution with no extra cost.", link: "https://support.wix.com/en/article/optimizing-images-for-your-wix-site" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native optimization with responsive delivery and automatic compression. Alt text fields in editor. Consistent across templates.", link: "https://support.squarespace.com/hc/en-us/articles/360022529371-Reducing-your-page-size-for-faster-loading" }
    ]
  },
  "Core Web Vitals / Page Speed Optimization": {
    WordPress: [
      { name: "Autoptimize", desc: "Free essential plugin for minifying CSS/JS and generating critical CSS. Lightweight and highly configurable. Foundation for any speed setup.", link: "https://wordpress.org/plugins/autoptimize/" },
      { name: "WP-Optimize", desc: "All-in-one cleanup with caching, minification, and database optimization. Image compression included. Great for ongoing maintenance.", link: "https://wordpress.org/plugins/wp-optimize/" },
      { name: "LiteSpeed Cache", desc: "Full-page caching with server-level optimizations (best on LiteSpeed hosts). Advanced image optimization included. Dramatic improvements possible.", link: "https://wordpress.org/plugins/litespeed-cache/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Automatic lazy loading, preloading, and script optimization. Targets LCP and CWV directly. Proven major score boosts.", link: "https://apps.shopify.com/core-web-vitals-booster" },
      { name: "Boostify Page Speed Optimizer", desc: "AI-powered lazy loading and minification. Improves LCP, INP, and CLS. Excellent for mobile.", link: "https://apps.shopify.com/page-speed-optimization" },
      { name: "Hyperspeed EXTREME", desc: "Advanced minification and app optimization. Regularly updated for latest CWV requirements. Strong results on large stores.", link: "https://apps.shopify.com/hyperspeed" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Dedicated app with lazy loading, prefetching, and render-blocking removal. Directly improves Core Web Vitals. One-click setup.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" },
      { name: "Built-in Optimization", desc: "Wix uses CDN, auto image optimization, and modern formats natively. Focus on minimal apps for best results.", link: "https://www.wix.com/performance" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native CDN, automatic image optimization, and responsive delivery. Limited third-party options – focus on clean design.", link: "https://support.squarespace.com/hc/en-us/articles/360022529371-Reducing-your-page-size-for-faster-loading" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Combines CSS/JS, lazy loads images, and generates critical CSS. Top-rated for Joomla CWV improvement.", link: "https://extensions.joomla.org/extension/jch-optimize/" },
      { name: "Speed Cache", desc: "Static page caching with browser cache and lazy loading. Reduces server load effectively.", link: "https://extensions.joomla.org/extension/speed-cache/" }
    ],
    Drupal: [
      { name: "Internal + Dynamic Page Cache", desc: "Core modules for anonymous and authenticated caching. Essential foundation for fast loading.", link: "https://www.drupal.org/docs/administering-a-drupal-site/managing-site-performance-and-scalability" },
      { name: "BigPipe", desc: "Core module sending static content first while loading personalized parts. Greatly improves perceived speed and LCP.", link: "https://www.drupal.org/docs/core-modules-and-themes/core-modules/bigpipe-module" }
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