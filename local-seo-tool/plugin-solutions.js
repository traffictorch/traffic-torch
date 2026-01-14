// plugin-solutions.js
// Full plugin recommendations for all 6 Local SEO modules
// Supports WordPress, Shopify, Wix, Squarespace, Joomla, Drupal
// 3–4 plugins per module/platform where available
// Links open in new tab, no referrer

const pluginData = {
  'NAP & Contact': {
    WordPress: [
      { name: "Yoast Local SEO", desc: "Dedicated add-on for consistent NAP, location pages, contact blocks, hours schema, and maps. Perfect for multi-location trust.", link: "https://yoast.com/wordpress/plugins/local-seo/", homeLink: "https://yoast.com/wordpress/plugins/local-seo/" },
      { name: "Rank Math Pro", desc: "Built-in NAP builder with geo, hours, contact schema, and map integration. Ensures clean entity signals.", link: "https://rankmath.com/pricing/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Local SEO tools with NAP schema, contact blocks, hours, and automatic markup for consistency.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "NAP + contact schema, local business settings, and consistency controls. Lightweight and fast.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Auto LocalBusiness schema with NAP, hours, geo, and contact. Fixes errors and boosts map pack.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Store Locator by Storemapper", desc: "NAP-consistent store pages, interactive maps, and contact standardization for multi-location.", link: "https://apps.shopify.com/storemapper-store-locator", homeLink: "https://www.storemapper.com/" },
      { name: "Local Delivery & Pickup", desc: "NAP fields for pickup locations, contact info, maps, and schema support.", link: "https://apps.shopify.com/local-delivery-and-pickup" },
      { name: "Bold Store Locator", desc: "Advanced NAP + map integration with contact consistency for locations.", link: "https://apps.shopify.com/bold-store-locator" }
    ],
    Wix: [
      { name: "Built-in Business Info & Locations", desc: "Native NAP fields, contact forms, hours, maps, and basic schema. Simple integrated solution." }
    ],
    Squarespace: [
      { name: "Built-in Location Pages & Maps", desc: "Native NAP blocks, hours, contact info, Google Maps embeds. Reliable built-in consistency." }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend NAP editing, schema output, and contact consistency controls.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "OSMap + LocalBusiness Schema", desc: "NAP-consistent location pages with schema and contact integration.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://www.osmap.it/" }
    ],
    Drupal: [
      { name: "Geolocation Field + Schema Metatag", desc: "NAP + geo fields with full LocalBusiness schema, hours, and contact output.", link: "https://www.drupal.org/project/schema_metatag", homeLink: "https://www.drupal.org/project/geolocation_field" }
    ]
  },
  'Local Keywords & Titles': {
    WordPress: [
      { name: "Yoast SEO", desc: "Focus keyword field, title/meta templates, readability, and local optimization guidance.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Multi-keyword support, dynamic titles, AI suggestions for local intent.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "TruSEO scoring, dynamic variables, and local keyword title/meta tools.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "Advanced title/meta editor with variables and keyword density for local.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SEO Manager", desc: "Bulk title/meta editing, keyword optimization, and local SERP preview.", link: "https://apps.shopify.com/seo-manager" },
      { name: "Plug in SEO", desc: "Title/meta templates, keyword guidance, and local optimization checklist.", link: "https://apps.shopify.com/plug-in-seo" }
    ],
    Wix: [
      { name: "Built-in SEO Tools", desc: "Native title/meta editor with keyword suggestions and local optimization guidance." }
    ],
    Squarespace: [
      { name: "Built-in SEO Settings", desc: "Native title/meta controls with keyword guidance for local pages." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend title/meta editing with keyword optimization and local templates.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "sh404SEF", desc: "Advanced title/meta management with keyword focus and local SEO.", link: "https://extensions.joomla.org/extension/sh404sef/", homeLink: "https://weeblr.com/" }
    ],
    Drupal: [
      { name: "Metatag", desc: "Title/meta templates with keyword tokens and local SEO patterns.", link: "https://www.drupal.org/project/metatag" },
      { name: "Pathauto", desc: "Keyword-optimized URL paths for local pages with title/meta integration.", link: "https://www.drupal.org/project/pathauto" }
    ]
  },
  'Local Content & Relevance': {
    WordPress: [
      { name: "Yoast SEO", desc: "Content analysis, readability, keyword density, and local relevance checks.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Content AI for relevance, internal linking, and local keyword depth.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "Squirrly SEO", desc: "Live Assistant with keyword research and local content optimization guidance.", link: "https://wordpress.org/plugins/squirrly-seo/", homeLink: "https://squirrly.co/" },
      { name: "All in One SEO", desc: "Content insights, readability tools, and local keyword suggestions.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SEO Manager", desc: "Bulk content optimization, keyword guidance, and relevance checks.", link: "https://apps.shopify.com/seo-manager" },
      { name: "Smart SEO", desc: "Content keyword tools and relevance suggestions for local pages.", link: "https://apps.shopify.com/smart-seo" }
    ],
    Wix: [
      { name: "Built-in SEO Wizard", desc: "Native content optimization tools with keyword guidance for local relevance." }
    ],
    Squarespace: [
      { name: "Built-in SEO Tools", desc: "Native content editing with keyword suggestions for local relevance." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Frontend content optimization with keyword tools and local relevance.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Metatag + Content Optimizer", desc: "Content keyword analysis and relevance tools for local pages.", link: "https://www.drupal.org/project/metatag" }
    ]
  },
  'Maps & Visuals': {
    WordPress: [
      { name: "WP Go Maps", desc: "Easy Google Maps embed with markers, directions, and custom visuals.", link: "https://wordpress.org/plugins/wp-google-maps/", homeLink: "https://www.wpgmaps.com/" },
      { name: "MapPress Maps", desc: "Simple Google/Leaflet maps with pins and styling for location visuals.", link: "https://wordpress.org/plugins/mappress-google-maps-for-wordpress/", homeLink: "https://www.mappress.com/" },
      { name: "GeoDirectory", desc: "Full location maps, listings, and advanced visuals.", link: "https://wordpress.org/plugins/geodirectory/", homeLink: "https://wpgeodirectory.com/" },
      { name: "Maps Widget for Google Maps", desc: "Quick thumbnail maps with markers for visual trust.", link: "https://wordpress.org/plugins/maps-widget-for-google-maps/", homeLink: "https://www.maps-widget.com/" }
    ],
    Shopify: [
      { name: "Storemapper Store Locator", desc: "Interactive maps with markers and location visuals.", link: "https://apps.shopify.com/storemapper-store-locator", homeLink: "https://www.storemapper.com/" },
      { name: "Bold Store Locator", desc: "Advanced maps with custom markers and visuals.", link: "https://apps.shopify.com/bold-store-locator" }
    ],
    Wix: [
      { name: "Built-in Maps & Location Blocks", desc: "Native Google Maps embed and location visuals." }
    ],
    Squarespace: [
      { name: "Built-in Google Maps Blocks", desc: "Native embed and visual location blocks." }
    ],
    Joomla: [
      { name: "OSMap + Maps Integration", desc: "Location maps with markers and visuals.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://www.osmap.it/" }
    ],
    Drupal: [
      { name: "Geolocation Field + Leaflet Map", desc: "Interactive maps with markers and visuals.", link: "https://www.drupal.org/project/geolocation_field" }
    ]
  },
  'Structured Data': {
    WordPress: [
      { name: "Rank Math", desc: "Built-in schema generator with LocalBusiness, rich snippets, and validation.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Schema catalog with LocalBusiness, hours, geo, and preview.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "Schema Pro", desc: "Advanced LocalBusiness schema with full control and validation.", link: "https://wordpress.org/plugins/schema-pro/", homeLink: "https://wpschema.com/" },
      { name: "SEOPress", desc: "JSON-LD schema builder with LocalBusiness and custom fields.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic LocalBusiness schema with rich results.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "JSON-LD for SEO", desc: "Full schema support including LocalBusiness.", link: "https://apps.shopify.com/json-ld-for-seo" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Native basic LocalBusiness and page schema." }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for pages and locations." }
    ],
    Joomla: [
      { name: "EFSEO + Schema", desc: "Schema output with LocalBusiness support.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" }
    ],
    Drupal: [
      { name: "Schema Metatag", desc: "Full Schema.org support including LocalBusiness.", link: "https://www.drupal.org/project/schema_metatag" }
    ]
  },
  'Reviews & Structure': {
    WordPress: [
      { name: "Site Reviews", desc: "Free review collection with AggregateRating schema and canonical support.", link: "https://wordpress.org/plugins/site-reviews/", homeLink: "https://site-reviews.com/" },
      { name: "WP Review Pro", desc: "Advanced review schema, ratings, and rich snippets.", link: "https://wordpress.org/plugins/wp-review/", homeLink: "https://mythemeshop.com/plugins/wp-review-pro/" },
      { name: "Rank Math", desc: "Built-in AggregateRating schema and internal linking.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Review schema support and canonical control.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Judge.me Product Reviews", desc: "Review schema with AggregateRating and rich snippets.", link: "https://apps.shopify.com/judgeme" },
      { name: "Loox Photo Reviews", desc: "Review schema with photos and star ratings.", link: "https://apps.shopify.com/loox" }
    ],
    Wix: [
      { name: "Built-in Reviews", desc: "Native review display with basic schema." }
    ],
    Squarespace: [
      { name: "Built-in Reviews", desc: "Native review blocks with schema." }
    ],
    Joomla: [
      { name: "JReviews", desc: "Advanced review system with schema and structure.", link: "https://extensions.joomla.org/extension/jreviews/" }
    ],
    Drupal: [
      { name: "Reviews & Ratings", desc: "Review schema and AggregateRating support.", link: "https://www.drupal.org/project/reviews" }
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
      Recommended Plugins & Tools
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      Select your platform to see top recommendations that can help fix each issue.
    </p>
    <div class="space-y-16">
      ${failedModules.map(moduleName => {
        const modulePlugins = pluginData[moduleName] || {};
        if (Object.keys(modulePlugins).length === 0) return '';

        return `
          <div class="bg-white dark:bg-gray-950 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 class="text-2xl md:text-3xl font-bold text-center mb-8 text-orange-600">
              Solutions for ${moduleName}
            </h3>
            <div class="max-w-md mx-auto mb-10">
              <select id="cms-select-${moduleName.replace(/\s+/g, '-')}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                <option value="">Select your platform...</option>
                ${Object.keys(modulePlugins).sort().map(cms => `
                  <option value="${cms}">${cms}</option>
                `).join('')}
              </select>
            </div>
            <div id="plugins-${moduleName.replace(/\s+/g, '-')}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
              <!-- Plugins injected here -->
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.appendChild(section);

  // Event listeners
  failedModules.forEach(moduleName => {
    const metricId = moduleName.replace(/\s+/g, '-');
    const select = document.getElementById(`cms-select-${metricId}`);
    const pluginsList = document.getElementById(`plugins-${metricId}`);
    if (!select || !pluginsList) return;

    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      if (!selected || !pluginData[moduleName]?.[selected]) return;

      pluginData[moduleName][selected].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col';

        card.innerHTML = `
          <div class="relative flex-grow">
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${plugin.name}</h4>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">${plugin.desc}</p>
          </div>
          <div class="flex flex-wrap gap-3 mt-auto">
            ${plugin.link ? `
              <a href="${plugin.link}" target="_blank" rel="noopener"
                 class="flex-1 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-center transition">
                Plugin Library
              </a>
            ` : ''}
            ${plugin.homeLink ? `
              <a href="${plugin.homeLink}" target="_blank" rel="noopener"
                 class="flex-1 px-5 py-3 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-medium rounded-xl text-center transition">
                Plugin Website
              </a>
            ` : ''}
          </div>
        `;

        pluginsList.appendChild(card);
      });

      pluginsList.classList.remove('hidden');
    });
  });
}

export { renderPluginSolutions };