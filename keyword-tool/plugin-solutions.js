const pluginData = {
  "Meta Title": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time title editor with length indicator, keyword focus, and SERP preview. AI suggestions in premium. Essential for keyword-optimized, click-worthy titles.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced title optimization with bulk editing, dynamic variables, and focus keyword integration. Excellent preview and scoring. Perfect for large sites.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "TruSEO scoring for title strength with smart recommendations and patterns. Trusted defaults and unlimited keywords. Great all-rounder.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "Lightweight title editor with dynamic variables, no branding in free. Fast preview and customization. Ideal for performance sites.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Automatic title optimization with AI templates and bulk tools. Focuses on keyword placement for higher CTR. Comprehensive e-commerce solution.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
      { name: "Plug in SEO", desc: "Scans titles, provides fixes, and monitors changes. Long-standing reliable app for title health.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" },
      { name: "Yoast SEO for Shopify", desc: "Official Yoast app bringing real-time title previews and AI suggestions to Shopify. Focus keyword integration and snippet preview. Familiar interface.", link: "https://apps.shopify.com/yoast-seo", homeLink: "https://yoast.com/" }
    ],
    Wix: [
      { name: "Built-in SEO Wiz", desc: "Guided wizard for optimal title creation with previews and character limits. Personalized recommendations based on site content. Native and easy to use.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Page Settings", desc: "Dedicated SEO title field with character counter and best practice tips. Native previews and automatic defaults from content. Reliable built-in solution.", link: "" }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Central control for title tags with frontend editing and automatic generation rules. Bulk operations and overrides. Efficient for Joomla title management.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "Tag Meta", desc: "Advanced rules-based title management with macros and patterns. Site-wide consistency and per-page customization. Powerful for large Joomla sites.", link: "https://extensions.joomla.org/extension/tag-meta/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Comprehensive module for title and meta control with tokens for dynamic content. Per-entity settings and social integration. Foundation for Drupal SEO titles.", link: "https://www.drupal.org/project/metatag" },
      { name: "Page Title", desc: "Dedicated module for overriding page titles with patterns and tokens. Works alongside Metatag for full control. Essential for custom title formatting.", link: "https://www.drupal.org/project/page_title" }
    ]
  },

  "Meta Description": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time editor with snippet preview, length guidance, and AI suggestions. Focuses on compelling, clickable copy. Industry standard for descriptions that boost CTR.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Dynamic descriptions with variables, bulk editing, and accurate SERP preview. Strong keyword integration and readability checks. Excellent for engaging descriptions.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Smart generation with TruSEO scoring, readability feedback, and dynamic patterns. Excellent defaults and unlimited keywords. Trusted for compelling descriptions.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "Clean, lightweight editor with dynamic variables and no upsells in free. Fast SERP preview and customization. Ideal for performance-focused sites.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Optimizes descriptions store-wide with AI templates and bulk editing. Focuses on keyword-rich copy for higher CTR. Comprehensive e-commerce solution.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
      { name: "Plug in SEO", desc: "Scans and fixes description issues with specific recommendations and alerts. Monitors changes over time. Trusted for description health.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" }
    ],
    Wix: [
      { name: "Built-in AI Meta Tag Creator", desc: "AI generates three optimized description suggestions based on page content. Choose tone and refine easily. Native in Wix SEO panel.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in SEO Tools", desc: "Native editor for custom descriptions with limits and previews. Generates defaults from content. Clean and reliable built-in solution.", link: "" }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend editing for meta descriptions with automatic generation rules. Bulk operations and overrides. Efficient centralized solution.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "Tag Meta", desc: "Rules-based meta description management with macros and patterns. Site-wide consistency and per-page customization. Powerful for large sites.", link: "https://extensions.joomla.org/extension/tag-meta/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Comprehensive module for meta description control with tokens for dynamic content. Per-entity settings and social integration. Foundation for compelling descriptions.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "Structured Data (Schema)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Built-in schema for Article, FAQ, HowTo, etc. Auto markup and easy overrides. Reliable rich results.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced generator with 20+ types and AI suggestions. Testing tools and automation. Maximum rich snippet impact.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Guided setup with TruSEO and auto markup. Dynamic variables and defaults. Trusted for powerful schema.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "Schema & Structured Data for WP", desc: "Dedicated plugin with advanced types and conditional display. Full AMP support. Best for maximum flexibility.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", homeLink: "https://wpschema.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic JSON-LD schema for products, collections, blogs, and more. Fixes Google errors and enables rich results. Essential for higher CTR.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Webrex AI SEO Optimizer Schema", desc: "AI-powered schema for products, FAQs, videos, with duplicate removal. Integrates with 30+ review apps. Great for automated markup.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld", homeLink: "https://webrexstudio.com/" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Wix auto-generates basic schema for pages, products, blogs. Custom options via SEO settings and Velo. Solid native solution.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for pages, products, events, blogs. Automatic and always updated. No extra tools needed.", link: "" }
    ],
    Joomla: [
      { name: "Google Structured Data", desc: "Free extension for breadcrumb, article, organization schema. Simple config with overrides. Reliable for basic rich snippets.", link: "https://extensions.joomla.org/extension/google-structured-data/", homeLink: "https://stackideas.com/" },
      { name: "EFSEO", desc: "Freemium tool for structured data and meta tags. Frontend editing and multiple types. Centralized SEO solution.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Schema.org Metatag", desc: "Full Schema.org support with high configurability for any entity. Industry standard for advanced schema.", link: "https://www.drupal.org/project/schema_metatag" },
      { name: "Metatag", desc: "Base module for structured data extensions. Required foundation for most schema setups.", link: "https://www.drupal.org/project/metatag" }
    ]
  },

  "Image Alts": {
    WordPress: [
      { name: "Smush", desc: "Bulk compression with lazy loading, WebP/AVIF, and alt text suggestions. Auto-fills or uses AI extensions. Trusted for accessibility and performance.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Pixel-perfect compression with WebP/AVIF and bulk alt tools. Excellent quality retention and accessibility.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
      { name: "Imagify", desc: "Smart compression with next-gen formats and alt suggestions. Bulk restore and optimization. Premium accessibility focus.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "AI alt text generation, bulk processing, WebP/AVIF. Automatic monitoring. Proven accessibility and speed fix.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Auto compression with SEO-friendly alt/filenames and bulk tools. Set-and-forget accessibility.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Auto-compresses images with manual alt text editing. Native accessibility solution.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native compression with alt text fields in editor. Consistent accessibility.", link: "" }
    ],
    Joomla: [
      { name: "ImageRecycle", desc: "Cloud compression with bulk alt text tools. Preserves quality and improves accessibility.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" }
    ],
    Drupal: [
      { name: "ImageAPI Optimize", desc: "Optimization pipelines with alt text support and WebP/AVIF. Bulk processing for accessibility.", link: "https://www.drupal.org/project/imageapi_optimize" }
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
      Plugin Solutions for Keyword Issues
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
      These popular free/freemium plugins can help optimize these keyword-related areas. Always test compatibility on a staging site and review recent updates.
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