const pluginData = {
  "NAP & Contact": {
    WordPress: [
      { name: "Yoast Local SEO", desc: "Manages NAP across pages, generates location pages, embeds Google Maps, and outputs consistent schema. Ideal for multi-location accuracy.", link: "https://yoast.com/wordpress/plugins/local-seo/", homeLink: "https://yoast.com/wordpress/plugins/local-seo/" },
      { name: "Rank Math Pro", desc: "Advanced NAP builder with hours, geo coordinates, contact schema, and map integration. Ensures clean, consistent local entity signals.", link: "https://rankmath.com/pricing/", homeLink: "https://rankmath.com/" },
      { name: "Schema & Structured Data for WP", desc: "Dedicated NAP + contact schema generator with validation and Google Maps support.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", homeLink: "https://wpschema.com/" },
      { name: "Business Directory Plugin", desc: "Creates standardized NAP location pages with maps, hours, and schema. Great for citation consistency.", link: "https://wordpress.org/plugins/business-directory-plugin/", homeLink: "https://businessdirectoryplugin.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatically applies LocalBusiness schema with NAP, hours, geo, and contact info. Fixes common local errors and boosts map pack.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Store Locator by Storemapper", desc: "NAP-consistent store pages, interactive maps, and contact standardization. Strong for multi-location.", link: "https://apps.shopify.com/storemapper-store-locator" }
    ],
    Wix: [
      { name: "Built-in Business Info & Locations", desc: "Native NAP fields, contact forms, hours, maps, and basic local schema generation. Simple, integrated solution." }
    ],
    Squarespace: [
      { name: "Built-in Location Pages & Maps", desc: "Native NAP blocks, hours, contact info, and Google Maps embeds. Reliable built-in consistency for local signals." }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend NAP editing, schema output, and contact consistency controls. Centralized for local pages.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "OSMap + LocalBusiness Schema", desc: "Generates NAP-consistent location pages with schema and contact integration.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://www.osmap.it/" }
    ],
    Drupal: [
      { name: "Geolocation Field + Schema Metatag", desc: "NAP + geo fields with full LocalBusiness schema, hours, and contact output. Excellent for accurate local signals.", link: "https://www.drupal.org/project/schema_metatag", homeLink: "https://www.drupal.org/project/geolocation_field" }
    ]
  },
  "Local Keywords & Titles": {
    WordPress: [
      { name: "Yoast SEO", desc: "Focus keyword + local intent suggestions for titles, meta, and headings. Real-time preview and geo-relevance scoring.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Local keyword optimization with geo-intent scoring, title/meta patterns, and bulk city-page editing.", link: "https://rankmath.com/", homeLink: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Scans and suggests local keywords for titles/meta. Monitors geo-specific page performance.", link: "https://apps.shopify.com/plug-in-seo", homeLink: "https://pluginseo.com/" },
      { name: "SearchPie SEO", desc: "AI-powered local keyword suggestions for titles/meta and bulk city-page optimization.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" }
    ],
    Wix: [
      { name: "Built-in SEO Wiz", desc: "Guides local keyword placement in titles/meta with previews and geo-relevance tips. Native and easy." }
    ],
    Squarespace: [
      { name: "Built-in SEO Settings", desc: "Custom title/meta fields with local keyword best practices and geo-focused defaults. Reliable native solution." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend title/meta editing with local keyword support and geo-patterns.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Token-based title/meta control with local keyword tokens and geo-patterns.", link: "https://www.drupal.org/project/metatag" }
    ]
  },
  "Local Content & Relevance": {
    WordPress: [
      { name: "Rank Math Content AI", desc: "Generates local-relevant content outlines with city/service keywords and geo-intent suggestions.", link: "https://rankmath.com/", homeLink: "https://rankmath.com/" },
      { name: "Yoast Internal Linking", desc: "Suggests geo-relevant internal links and improves local content structure.", link: "https://yoast.com/wordpress/plugins/internal-linking/", homeLink: "https://yoast.com/" }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "AI content suggestions with local keywords, geo-relevance scoring, and city-specific outlines.", link: "https://apps.shopify.com/seo-booster", homeLink: "https://boosterapps.com/" }
    ],
    Wix: [
      { name: "Built-in Content Editor", desc: "Native editor with SEO tips for local keywords and geo-relevant content structure." }
    ],
    Squarespace: [
      { name: "Built-in Content Blocks", desc: "Native editor with local keyword best practices and geo-focused content layout." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend content editing with local keyword support and geo-relevance tips.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Metatag + Content Moderation", desc: "Token-based content with local keyword tokens and geo-relevance guidelines.", link: "https://www.drupal.org/project/metatag" }
    ]
  },
  "Maps & Visuals": {
    WordPress: [
      { name: "WP Google Maps", desc: "Easy Google Maps embed with markers, directions, and local schema support.", link: "https://wordpress.org/plugins/wp-google-maps/", homeLink: "https://www.wpgmaps.com/" },
      { name: "Yoast Local SEO", desc: "Built-in map embeds and location-specific image optimization.", link: "https://yoast.com/wordpress/plugins/local-seo/", homeLink: "https://yoast.com/" }
    ],
    Shopify: [
      { name: "Store Locator by Storemapper", desc: "Interactive maps with pins, directions, and local visual/contact integration.", link: "https://apps.shopify.com/storemapper-store-locator" }
    ],
    Wix: [
      { name: "Built-in Maps & Gallery", desc: "Native Google Maps embeds and alt text editing for location visuals." }
    ],
    Squarespace: [
      { name: "Built-in Map Blocks", desc: "Native Google Maps embeds and alt text fields for location-specific visuals." }
    ],
    Joomla: [
      { name: "OSMap", desc: "Interactive Google Maps with pins, directions, and local visual integration.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://www.osmap.it/" }
    ],
    Drupal: [
      { name: "Geolocation Field", desc: "Advanced maps with markers, directions, and local image support.", link: "https://www.drupal.org/project/geolocation_field" }
    ]
  },
  "Structured Data": {
    WordPress: [
      { name: "Schema & Structured Data for WP", desc: "Advanced LocalBusiness schema with geo, hours, reviews, and validation.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", homeLink: "https://wpschema.com/" },
      { name: "Rank Math Pro", desc: "Full LocalBusiness schema with geo coordinates, hours, and error checking.", link: "https://rankmath.com/", homeLink: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic LocalBusiness schema with NAP, geo, hours, and error fixing.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Native local schema generation for business info, hours, and geo." }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for locations, hours, and business info." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend schema generation with LocalBusiness support for geo and hours.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Schema Metatag", desc: "Full LocalBusiness schema with geo, hours, and validation.", link: "https://www.drupal.org/project/schema_metatag" }
    ]
  },
  "Reviews & Structure": {
    WordPress: [
      { name: "WP Review", desc: "AggregateRating schema for star ratings in local SERPs and map pack.", link: "https://wordpress.org/plugins/wp-review/", homeLink: "https://mythemeshop.com/plugins/wp-review/" },
      { name: "Rank Math", desc: "Built-in review schema, canonical control, and geo-linking.", link: "https://rankmath.com/", homeLink: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Stamped.io Reviews", desc: "Review collection with AggregateRating schema and local star display.", link: "https://apps.shopify.com/stamped-io-reviews", homeLink: "https://stamped.io/" }
    ],
    Wix: [
      { name: "Built-in Reviews & Canonical", desc: "Native review display and canonical settings for local structure." }
    ],
    Squarespace: [
      { name: "Built-in Reviews & Canonical", desc: "Native review blocks and canonical controls for local pages." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend canonical and review schema support for local structure.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Schema Metatag", desc: "AggregateRating schema and canonical control for local pages.", link: "https://www.drupal.org/project/schema_metatag" }
    ]
  }
};

function renderPluginSolutions(failedModules, containerId = 'plugin-solutions-section') {
  if (failedModules.length === 0) return;
  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto px-4';
  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for Local SEO Issues
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${failedModules.length} module${failedModules.length > 1 ? 's have' : ' has'} issues that these popular free/freemium tools can help fix.
      Select your platform below to see the best options for each problem.
    </p>
    <div class="space-y-6">
      ${failedModules.map(mod => {
        const modId = mod.replace(/\s+/g, '-').toLowerCase();
        const cmsOptions = Object.keys(pluginData[mod] || {});
        return `
          <details class="group bg-white dark:bg-gray-950 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <summary class="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
              <h3 class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                ${mod}
              </h3>
              <div class="transform transition-transform duration-300 group-open:rotate-180">
                <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </summary>
            <div class="px-6 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-md mx-auto my-8">
                <select id="cms-select-${modId}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your platform...</option>
                  ${cmsOptions.map(cms => `<option value="${cms}">${cms}</option>`).join('')}
                </select>
              </div>
              <div id="plugins-${modId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
                <!-- Plugins injected here -->
              </div>
            </div>
          </details>
        `;
      }).join('')}
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-12">
      These tools are highly regarded for local SEO improvements. Always test compatibility on a staging site and keep plugins/apps updated.
    </p>
  `;

  container.appendChild(section);

  // Event listeners for CMS dropdowns
  failedModules.forEach(mod => {
    const modId = mod.replace(/\s+/g, '-').toLowerCase();
    const select = document.getElementById(`cms-select-${modId}`);
    const pluginsList = document.getElementById(`plugins-${modId}`);
    if (!select || !pluginsList) return;

    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      if (!selected || !pluginData[mod]?.[selected]) return;

      pluginData[mod][selected].forEach(plugin => {
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
                  View Plugin/App
                </a>
              ` : ''}
              ${plugin.homeLink ? `
                <a href="${plugin.homeLink}" target="_blank" rel="noopener" class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                  Visit Website
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