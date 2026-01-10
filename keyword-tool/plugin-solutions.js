const pluginData = {
  "Meta Description": {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time meta description editor with live snippet preview, length guidance, and AI suggestions in premium. Focuses on compelling, clickable copy that boosts CTR. Industry standard for crafting high-performing descriptions.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Dynamic meta descriptions with variables, bulk editing, and accurate SERP preview. Strong focus keyword integration and readability checks. Excellent for creating engaging descriptions at scale.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Smart meta generation with TruSEO scoring, readability feedback, and dynamic patterns. Excellent defaults and unlimited keywords. Trusted for consistent, compelling descriptions.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "Clean, lightweight editor with dynamic variables and no upsells in free version. Fast SERP preview and customization. Ideal for performance-focused sites needing strong descriptions.", link: "https://wordpress.org/plugins/wp-seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Optimizes meta descriptions store-wide with AI templates and bulk editing. Focuses on compelling, keyword-rich copy for higher CTR. Comprehensive e-commerce SEO solution.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" },
      { name: "Plug in SEO", desc: "Scans and fixes meta description issues with specific recommendations and alerts. Monitors changes over time. Long-standing trusted app for description health.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" }
    ],
    Wix: [
      { name: "Built-in AI Meta Tag Creator", desc: "AI-powered tool generating three optimized meta description suggestions based on page content. Choose tone and refine easily. Integrated directly in Wix SEO panel.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in SEO Tools", desc: "Native editor for custom meta descriptions with character limits and previews. Automatically generates defaults from content. Clean and reliable built-in solution.", link: "" }
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
      { name: "Yoast SEO", desc: "Leading SEO plugin with robust built-in schema for Article, FAQ, HowTo, Product, and Person types. Automatically generates markup with easy overrides and rich snippet previews. Ideal for reliable rich results without extra complexity.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced freemium schema generator with 20+ types, custom fields, and AI suggestions. Includes testing tools and automation for rich snippets. Perfect for detailed control and maximum rich result impact.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Guided schema setup with TruSEO scoring and automatic markup for common types. Supports dynamic variables and strong defaults. Trusted by millions for simple yet powerful schema.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic JSON-LD schema for products, collections, blogs, and more. Fixes Google errors and enables rich results. Essential for e-commerce targeting higher CTR.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Webrex AI SEO Optimizer Schema", desc: "AI-powered schema generation for products, FAQs, videos, with duplicate removal. Integrates with 30+ review apps. Great for automated, accurate markup.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld", homeLink: "https://webrexstudio.com/" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Wix auto-generates basic schema for pages, products, blogs. Custom options via SEO settings and Velo. Solid native solution for most Wix sites.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for pages, products, events, blogs. Automatic and always updated. No extra tools needed for standard rich results.", link: "" }
    ]
  },

  "Image Alts": {
    WordPress: [
      { name: "Smush", desc: "Most popular optimizer with lazy loading, WebP/AVIF conversion, bulk processing, and alt text suggestions. Auto-fills alt from filename/title or uses AI extensions. Trusted by millions for reliable accessibility and performance.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Pixel-perfect compression with WebP/AVIF support and bulk alt text tools. Local or cloud processing for quality retention. Excellent for professional sites needing accessibility fixes.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
      { name: "Imagify", desc: "Smart compression with visual comparison, next-gen formats, and alt text suggestions. Bulk restore and automatic optimization. Premium feel with strong accessibility focus.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Complete optimization with AI alt text generation, bulk processing, and WebP/AVIF support. Monitors new uploads automatically. Proven to fix alt coverage and improve accessibility.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Automatic compression on upload with SEO-friendly alt/filenames and bulk tools. Set-and-forget with strong results. Clean way to improve alt text coverage.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Auto-compresses images on upload with manual alt text editing in editor. Native accessibility solution. Focus on adding alt text manually for full coverage.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native compression and responsive delivery with alt text fields in editor. Consistent across templates. Add alt text manually for complete coverage.", link: "" }
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