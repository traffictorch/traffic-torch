// plugin-solutions.js
// Slim, space-saving version with vertical buttons and WordPress-first order
// Full longer descriptions, 3–4 plugins per module/platform
// Links open in new tab with rel="noopener"

const pluginData = {
  'NAP & Contact': {
    WordPress: [
      { name: "Yoast Local SEO", desc: "Dedicated add-on that adds full NAP consistency, contact block, opening hours schema, and maps embed. Perfect for strong local trust signals and multi-location accuracy. Automatically generates location pages with standardized NAP to reinforce entity signals across the site.", link: "https://wordpress.org/plugins/yoast-local-seo/", homeLink: "https://yoast.com/wordpress/plugins/local-seo/" },
      { name: "Rank Math Pro", desc: "Advanced NAP builder with hours, geo coordinates, contact schema, and map integration. Ensures clean, consistent local entity signals. Includes review schema and internal linking tools to strengthen overall local structure.", link: "https://rankmath.com/pricing/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Local SEO tools with NAP schema, contact block, and hours. Easy setup with automatic markup for consistent signals. Includes TruSEO scoring to guide NAP optimization and local relevance.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "NAP + contact schema, local business settings, and consistency controls. Lightweight and fast with JSON-LD output. Great for developers wanting full control over NAP and schema without bloat.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatically applies LocalBusiness schema with NAP, hours, geo, and contact info. Fixes common local errors and boosts map pack visibility. Ensures consistent NAP across product and location pages.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Store Locator by Storemapper", desc: "NAP-consistent store pages, interactive maps, and contact standardization for multi-location. Strong for local trust with embedded hours and directions. Improves citation consistency.", link: "https://apps.shopify.com/storemapper-store-locator", homeLink: "https://www.storemapper.com/" },
      { name: "Local Delivery & Pickup", desc: "NAP fields for pickup locations, contact info, maps, and schema support. Helps with local trust signals and consistent entity data.", link: "https://apps.shopify.com/local-delivery-and-pickup" }
    ],
    Wix: [
      { name: "Built-in Business Info & Locations", desc: "Native NAP fields, contact forms, hours, maps, and basic local schema generation. Simple integrated solution that keeps NAP consistent across pages without extra tools." }
    ],
    Squarespace: [
      { name: "Built-in Location Pages & Maps", desc: "Native NAP blocks, hours, contact info, and Google Maps embeds. Reliable built-in consistency for local signals on location pages." }
    ],
    Joomla: [
      { name: "EFSEO - Easy Frontend SEO", desc: "Frontend NAP editing, schema output, and contact consistency controls. Centralized for local pages with easy overrides.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/", homeLink: "https://stackideas.com/" },
      { name: "OSMap + LocalBusiness Schema", desc: "Generates NAP-consistent location pages with schema and contact integration. Good for structured local data.", link: "https://extensions.joomla.org/extension/osmap/", homeLink: "https://www.osmap.it/" }
    ],
    Drupal: [
      { name: "Geolocation Field + Schema Metatag", desc: "NAP + geo fields with full LocalBusiness schema, hours, and contact output. Excellent for accurate local signals and consistency.", link: "https://www.drupal.org/project/schema_metatag", homeLink: "https://www.drupal.org/project/geolocation_field" }
    ]
  },
  'Local Keywords & Titles': {
    WordPress: [
      { name: "Yoast SEO", desc: "Real-time editor with length guidance, keyword integration, and SERP preview. AI suggestions for compelling copy. Encourages active voice and calls-to-action. Shows mobile/desktop preview side-by-side. Helps increase click-through rates significantly.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Dynamic descriptions with variables, bulk tools, and accurate preview. Strong readability checks. AI-powered rewrite suggestions. Bulk edit across posts/pages. Excellent for maintaining consistent tone.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Smart generation with TruSEO scoring and dynamic patterns. Excellent defaults. Pulls from content automatically when missing. Includes character counter and preview. Reliable for large-scale sites.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "SEOPress", desc: "Advanced title/meta editor with variables, keyword density, and local SEO templates. Fast and customizable. Great for precise control over local keyword titles.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SEO Manager", desc: "Bulk title/meta editing, keyword guidance, and local SERP preview. Strong for city-based optimization.", link: "https://apps.shopify.com/seo-manager" },
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
      { name: "Yoast SEO", desc: "Content analysis, readability scores, and keyword density checks. Helps naturally integrate local terms without stuffing. Guides tone, active voice, and calls-to-action.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Content AI for local relevance, internal linking suggestions, and keyword optimization. Great for depth and intent. Bulk edit across pages.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "Squirrly SEO", desc: "Live Assistant with keyword research, content optimization, and local focus suggestions. Guides you to relevant local content. Real-time feedback.", link: "https://wordpress.org/plugins/squirrly-seo/", homeLink: "https://squirrly.co/" },
      { name: "All in One SEO", desc: "Content insights, readability tools, and keyword suggestions. Helps maintain natural local relevance across pages. Dynamic variables.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
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
      { name: "WP Go Maps", desc: "Easy Google Maps embed with markers, directions, and custom visuals. Perfect for strong local visual signals and user trust.", link: "https://wordpress.org/plugins/wp-google-maps/", homeLink: "https://www.wpgmaps.com/" },
      { name: "MapPress Maps", desc: "Simple Google/Leaflet maps with pins, categories, and styling. Lightweight way to add location visuals.", link: "https://wordpress.org/plugins/mappress-google-maps-for-wordpress/" },
      { name: "GeoDirectory", desc: "Full location directory with maps, listings, and advanced visuals. Ideal for comprehensive local map features.", link: "https://wordpress.org/plugins/geodirectory/", homeLink: "https://wpgeodirectory.com/" },
      { name: "Maps Widget for Google Maps", desc: "Quick thumbnail maps with markers for sidebars/footers. Simple way to boost visual local trust.", link: "https://wordpress.org/plugins/maps-widget-for-google-maps/" }
    ],
    Shopify: [
      { name: "Storemapper Store Locator", desc: "Interactive maps with markers and location visuals for strong signals.", link: "https://apps.shopify.com/storemapper-store-locator", homeLink: "https://www.storemapper.com/" },
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
      { name: "Rank Math", desc: "Built-in schema generator with LocalBusiness type, rich snippets, and validation. Free and very powerful for local schema.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Schema catalog with LocalBusiness, hours, geo, and rich results preview. Easy setup for accurate markup.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "Schema Pro", desc: "Advanced LocalBusiness schema with full control and validation tools.", link: "https://wordpress.org/plugins/schema-pro/", homeLink: "https://wpschema.com/" },
      { name: "SEOPress", desc: "JSON-LD schema builder with LocalBusiness support, custom fields, and testing.", link: "https://wordpress.org/plugins/seopress/", homeLink: "https://www.seopress.org/" }
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
      { name: "Site Reviews", desc: "Free review collection with AggregateRating schema, star ratings, and canonical support. Simple and reliable.", link: "https://wordpress.org/plugins/site-reviews/", homeLink: "https://site-reviews.com/" },
      { name: "WP Review Pro", desc: "Advanced review schema, ratings, and rich snippets. Great for structured review display.", link: "https://wordpress.org/plugins/wp-review/", homeLink: "https://mythemeshop.com/plugins/wp-review-pro/" },
      { name: "Rank Math", desc: "Built-in AggregateRating schema, internal linking, and canonical tools.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Review schema support, canonical control, and internal link suggestions.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" }
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
  section.className = 'mt-16 max-w-5xl mx-auto px-4';
  section.innerHTML = `
    <h2 class="text-3xl md:text-4xl font-bold text-center text-orange-600 mb-8">
      Recommended Plugins
    </h2>
    <p class="text-center text-base md:text-lg text-gray-600 dark:text-gray-400 mb-10">
      Select your platform to see top recommendations that can help fix each issue.
    </p>
    <div class="space-y-12">
      ${failedModules.map(moduleName => {
        const modulePlugins = pluginData[moduleName] || {};
        if (Object.keys(modulePlugins).length === 0) return '';

        return `
          <div class="bg-white dark:bg-gray-950 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl md:text-2xl font-bold text-center mb-6 text-orange-600">
              ${moduleName}
            </h3>
            <div class="max-w-sm mx-auto mb-6">
              <select id="cms-select-${moduleName.replace(/\s+/g, '-')}" class="w-full px-4 py-3 text-base rounded-xl border border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition">
                <option value="">Select your platform...</option>
                <option value="WordPress">WordPress</option>
                <option value="Shopify">Shopify</option>
                <option value="Wix">Wix</option>
                <option value="Squarespace">Squarespace</option>
                <option value="Joomla">Joomla</option>
                <option value="Drupal">Drupal</option>
              </select>
            </div>
            <div id="plugins-${moduleName.replace(/\s+/g, '-')}" class="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
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
        card.className = 'bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col border border-gray-200 dark:border-gray-700';

        card.innerHTML = `
          <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">${plugin.name}</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 flex-grow mb-4 leading-relaxed">${plugin.desc}</p>
          <div class="flex flex-col gap-3 mt-auto">
            ${plugin.link ? `
              <a href="${plugin.link}" target="_blank" rel="noopener"
                 class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg text-center transition">
                Plugin Library
              </a>
            ` : ''}
            ${plugin.homeLink ? `
              <a href="${plugin.homeLink}" target="_blank" rel="noopener"
                 class="px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg text-center transition">
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