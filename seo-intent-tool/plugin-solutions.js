const pluginData = {
  "Schema Markup": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium – comprehensive schema support including Article, FAQ, and Person.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Freemium – advanced schema generator with many types and rich snippets.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "All in One SEO", desc: "Freemium – guided schema setup for common types.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/" },
      { name: "Schema & Structured Data for WP", desc: "Freemium – dedicated schema plugin with rich snippet support.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Freemium – automatic JSON-LD schema and rich snippets.", link: "https://apps.shopify.com/schema-plus" },
      { name: "Webrex SEO Schema & JSON-LD", desc: "Freemium – AI-powered schema for products and pages.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld" },
      { name: "SearchPie SEO", desc: "Freemium – includes schema markup with speed optimization.", link: "https://apps.shopify.com/seo-booster" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Free – Wix automatically adds basic schema; custom via SEO settings." }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Free – automatic schema for pages and products." }
    ],
    Joomla: [
      { name: "Google Structured Data", desc: "Free – adds rich snippets and schema.", link: "https://extensions.joomla.org/extension/google-structured-data/" },
      { name: "EFSEO", desc: "Freemium – handles structured data and meta." }
    ],
    Drupal: [
      { name: "Schema.org Metatag", desc: "Free – full schema type support.", link: "https://www.drupal.org/project/schema_metatag" },
      { name: "Metatag", desc: "Free – base module for structured data." }
    ]
  },
  "Optimized Title Tag": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium – real-time title previews and optimization.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Freemium – bulk editing and dynamic variables.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "All in One SEO", desc: "Freemium – TruSEO score and title editor.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/" },
      { name: "SEOPress", desc: "Freemium – custom titles and meta robots." }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Freemium – auto title optimization." },
      { name: "Plug in SEO", desc: "Freemium – checks and fixes titles." }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Free – guides page title optimization." }],
    Squarespace: [{ name: "Built-in Page Settings", desc: "Free – custom SEO titles." }]
  },
  "Compelling Meta Description": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium – meta description previews and suggestions." },
      { name: "Rank Math", desc: "Freemium – dynamic meta descriptions." },
      { name: "All in One SEO", desc: "Freemium – meta editor with scoring." },
      { name: "SEOPress", desc: "Freemium – custom meta descriptions." }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Freemium – meta description optimization." }
    ]
  },
  "Image Optimization & Alt Text": {
    WordPress: [
      { name: "Smush", desc: "Freemium – compression, WebP, lazy load, alt suggestions.", link: "https://wordpress.org/plugins/wp-smushit/" },
      { name: "EWWW Image Optimizer", desc: "Free core – pixel-perfect optimization and WebP.", link: "https://wordpress.org/plugins/ewww-image-optimizer/" },
      { name: "reSmush.it", desc: "Free – image compressor and optimizer.", link: "https://wordpress.org/plugins/resmushit-image-optimizer/" },
      { name: "Imagify", desc: "Freemium – bulk optimization and next-gen formats.", link: "https://wordpress.org/plugins/imagify-image-optimizer/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Freemium – compression and alt text optimization." },
      { name: "Crush.pics", desc: "Freemium – auto image compression." }
    ],
    Wix: [{ name: "Built-in Optimizer", desc: "Free – auto compression and manual alt text." }],
    Squarespace: [{ name: "Built-in Tools", desc: "Free – automatic optimization." }]
  },
  "Core Web Vitals / Page Speed Optimization": {
    WordPress: [
      { name: "Autoptimize", desc: "Free – minify/combine CSS/JS, critical CSS.", link: "https://wordpress.org/plugins/autoptimize/" },
      { name: "WP-Optimize", desc: "Free – caching, minify, database cleanup.", link: "https://wordpress.org/plugins/wp-optimize/" },
      { name: "LiteSpeed Cache", desc: "Free – full-page caching and optimization (best with LiteSpeed server)." }
    ],
    Shopify: [
      { name: "SearchPie SEO", desc: "Freemium – speed and CWV tools." }
    ]
  }
};

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const section = document.createElement('section');
  section.className = 'mt-20';

  section.innerHTML = `
    <div class="max-w-5xl mx-auto">
      <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
        Plugin Solutions for Failed Metrics
      </h2>
      <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
        Select your CMS below to instantly discover the top free/freemium plugins that fix these issues. 
        All recommendations are from official repositories — always test compatibility on a staging site first.
      </p>

      <div class="grid gap-12 md:gap-16">
        ${failedMetrics.map(metric => {
          if (!pluginData[metric]) return '';
          return `
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700">
              <h3 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8 text-center">
                ${metric}
              </h3>

              <div class="max-w-md mx-auto mb-8">
                <select class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your CMS...</option>
                  ${Object.keys(pluginData[metric]).map(cms => 
                    `<option value="${cms}">${cms}</option>`
                  ).join('')}
                </select>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden" id="plugins-${metric.replace(/\\s+/g, '-').toLowerCase()}">
                <!-- Plugins will be injected here -->
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.appendChild(section);

  // Attach event listeners after insertion
  failedMetrics.forEach(metric => {
    if (!pluginData[metric]) return;
    const select = section.querySelector(`select`);
    if (!select) return;

    const pluginsList = section.querySelector(`#plugins-${metric.replace(/\s+/g, '-').toLowerCase()}`);
    if (!pluginsList) return;

    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      if (!selected || !pluginData[metric][selected]) return;

      pluginData[metric][selected].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';

        card.innerHTML = `
          <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative">
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              <a href="${plugin.link || '#'}" target="_blank" rel="noopener" class="hover:text-orange-600 dark:hover:text-orange-400 transition">
                ${plugin.name}
              </a>
            </h4>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">${plugin.desc}</p>
          </div>
        `;
        pluginsList.appendChild(card);
      });

      pluginsList.classList.remove('hidden');
    });
  });
}