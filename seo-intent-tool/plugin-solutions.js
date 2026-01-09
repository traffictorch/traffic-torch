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
  section.className = 'mt-12 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg';
  section.innerHTML = `<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Plugin Solutions for Failed Metrics</h2>
    <p class="text-gray-700 dark:text-gray-300 mb-6">Select your CMS to see top free/freemium plugins that can help fix these issues. Always test compatibility.</p>`;

  failedMetrics.forEach(metric => {
    if (!pluginData[metric]) return;

    const metricDiv = document.createElement('div');
    metricDiv.className = 'mb-8';
    metricDiv.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">${metric}</h3>`;

    const select = document.createElement('select');
    select.className = 'mb-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    select.innerHTML = '<option value="">Select your CMS...</option>';

    Object.keys(pluginData[metric]).forEach(cms => {
      const option = document.createElement('option');
      option.value = cms;
      option.textContent = cms;
      select.appendChild(option);
    });

    const pluginsList = document.createElement('div');
    pluginsList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 hidden';

    select.addEventListener('change', (e) => {
      pluginsList.classList.add('hidden');
      pluginsList.innerHTML = '';
      const selected = e.target.value;
      if (!selected) return;

      pluginData[metric][selected].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md';
        card.innerHTML = `
          <h4 class="font-medium text-gray-800 dark:text-gray-200"><a href="${plugin.link || '#'}" target="_blank" rel="noopener" class="hover:underline">${plugin.name}</a></h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${plugin.desc}</p>
        `;
        pluginsList.appendChild(card);
      });
      pluginsList.classList.remove('hidden');
    });

    metricDiv.appendChild(select);
    metricDiv.appendChild(pluginsList);
    section.appendChild(metricDiv);
  });

  container.appendChild(section);
}

export { renderPluginSolutions };