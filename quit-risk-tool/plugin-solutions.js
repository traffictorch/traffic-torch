const pluginData = {
  "Alt Text Coverage": {
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
    ],
    Joomla: [
      { name: "ImageRecycle", desc: "Cloud compression for images/PDFs with bulk alt text tools. Preserves quality and improves accessibility. Integrates with media manager.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" }
    ],
    Drupal: [
      { name: "ImageAPI Optimize", desc: "Defines optimization pipelines with alt text support and WebP/AVIF. Bulk processing for accessibility. Flexible for advanced sites.", link: "https://www.drupal.org/project/imageapi_optimize" }
    ]
  },

  "Image Optimization": {
    WordPress: [
      { name: "Smush", desc: "Bulk compression with lazy loading, WebP/AVIF, and lossless/lossy options. Automatic on upload. Trusted for speed + accessibility gains.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Pixel-perfect compression with local/cloud processing and next-gen formats. Excellent quality retention. Strong for professional image optimization.", link: "https://wordpress.org/plugins/ewww-image-optimizer/", homeLink: "https://ewww.io/" },
      { name: "Imagify", desc: "Smart compression levels, visual comparison, and bulk restore. Next-gen formats included. Premium balance of size and quality.", link: "https://wordpress.org/plugins/imagify-image-optimizer/", homeLink: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "AI-powered bulk compression, WebP/AVIF, and automatic monitoring. Improves Core Web Vitals significantly. Complete image optimization solution.", link: "https://apps.shopify.com/tinyimg", homeLink: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Automatic compression on upload with format conversion. Set-and-forget with proven results. Clean and reliable for stores.", link: "https://apps.shopify.com/crush-pics", homeLink: "https://crush.pics/" }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Native auto-compression with responsive delivery and modern formats. Focus on light images for best results.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native compression, responsive delivery, and automatic optimization. Consistent across templates.", link: "" }
    ],
    Joomla: [
      { name: "ImageRecycle", desc: "Cloud compression with bulk processing and quality preservation. Strong for site-wide image optimization.", link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/", homeLink: "https://www.imagerecycle.com/" }
    ],
    Drupal: [
      { name: "ImageAPI Optimize", desc: "Optimization pipelines with WebP/AVIF support and bulk processing. Flexible for advanced image performance.", link: "https://www.drupal.org/project/imageapi_optimize" }
    ]
  },

  "Lazy Loading Media": {
    WordPress: [
      { name: "Autoptimize", desc: "Free plugin for lazy loading images/videos/iframes with minification. Lightweight and configurable. Strong foundation for faster loading.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Smush", desc: "Built-in lazy loading with compression and WebP support. Automatic on upload. Trusted for media performance.", link: "https://wordpress.org/plugins/wp-smushit/", homeLink: "https://wpmudev.com/project/wp-smush-pro/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Automatic lazy loading for media and scripts. Targets Core Web Vitals directly. Proven major loading improvements.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" },
      { name: "Boostify Page Speed Optimizer", desc: "AI-powered lazy loading for images/videos. Excellent for mobile performance.", link: "https://apps.shopify.com/page-speed-optimization", homeLink: "https://boostifyapps.com/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Dedicated lazy loading app for media. Improves load times with one-click setup.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Lazy Loading", desc: "Native lazy loading for images in galleries/blocks. Consistent across templates.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Lazy loading for images/media with minification. Top-rated for performance.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "Lazy Load", desc: "Module for lazy loading images/iframes. Simple and effective.", link: "https://www.drupal.org/project/lazyload" }
    ]
  },

  "Script Minification & Deferral": {
    WordPress: [
      { name: "Autoptimize", desc: "Minifies and combines CSS/JS, defers scripts, and generates critical CSS. Lightweight foundation for faster loading.", link: "https://wordpress.org/plugins/autoptimize/", homeLink: "https://autoptimize.com/" },
      { name: "Perfmatters", desc: "Lightweight script manager to defer/delay JS and remove unused code. Directly improves INP and load times.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Automatic script minification and deferral. Targets Core Web Vitals directly.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" },
      { name: "Boostify Page Speed Optimizer", desc: "AI-powered script minify and defer. Excellent for mobile performance.", link: "https://apps.shopify.com/page-speed-optimization", homeLink: "https://boostifyapps.com/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "App for script deferral and render-blocking removal. Improves load times.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Optimization", desc: "Native script handling and minification. Focus on minimal code.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Minifies and defers CSS/JS with critical CSS. Top-rated for performance.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Advanced aggregation and minification for CSS/JS. Improves front-end speed.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Font Optimization": {
    WordPress: [
      { name: "OMGF", desc: "Local Google Fonts hosting with preload and optimization. Removes external requests for faster loading.", link: "https://wordpress.org/plugins/host-webfonts-local/", homeLink: "https://daan.dev/omgf/" },
      { name: "Perfmatters", desc: "Preload, swap, and disable unused fonts. Lightweight with maximum impact.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Rocket Page Speed Optimizer", desc: "Font preload and optimization. Improves LCP and overall speed.", link: "https://apps.shopify.com/core-web-vitals-booster", homeLink: "https://rocketoptimizer.com/" }
    ],
    Wix: [
      { name: "Built-in Font Optimization", desc: "Native font handling with CDN delivery. Focus on minimal font usage.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native font delivery with responsive optimization. Keep font count low.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Font preload and minification. Part of comprehensive performance suite.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Font aggregation and optimization. Improves front-end loading.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "Asset Volume & Script Bloat": {
    WordPress: [
      { name: "Asset CleanUp", desc: "Disable unused CSS/JS per page/post. Reduces bloat and asset volume dramatically.", link: "https://wordpress.org/plugins/wp-asset-clean-up/", homeLink: "https://wp-rocket.me/asset-cleanup/" },
      { name: "Perfmatters", desc: "Script manager to disable bloat and unused assets. Lightweight with huge performance gains.", link: "https://perfmatters.io/", homeLink: "https://perfmatters.io/" }
    ],
    Shopify: [
      { name: "Hyperspeed EXTREME", desc: "Advanced app/script optimization and bloat removal. Regularly updated for clean performance.", link: "https://apps.shopify.com/hyperspeed", homeLink: "https://hyperspeed.app/" }
    ],
    Wix: [
      { name: "Website Speedy", desc: "Removes render-blocking and unused assets. Reduces bloat effectively.", link: "https://www.wix.com/app-market/web-solution/websitespeedy" }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Native asset management. Keep code minimal to avoid bloat.", link: "" }
    ],
    Joomla: [
      { name: "JCH Optimize", desc: "Removes unused assets and minifies. Strong bloat reduction.", link: "https://extensions.joomla.org/extension/jch-optimize/", homeLink: "https://www.jch-optimize.net/" }
    ],
    Drupal: [
      { name: "AdvAgg", desc: "Advanced asset aggregation and bloat reduction. Improves overall performance.", link: "https://www.drupal.org/project/advagg" }
    ]
  },

  "PWA Readiness": {
    WordPress: [
      { name: "Super Progressive Web Apps", desc: "Adds manifest, service worker, and PWA features. Simple setup for installable sites.", link: "https://wordpress.org/plugins/super-progressive-web-apps/", homeLink: "https://superpwa.com/" },
      { name: "PWA for WP", desc: "Complete PWA solution with AMP support and push notifications. Full readiness features.", link: "https://wordpress.org/plugins/pwa-for-wp/", homeLink: "https://pwa-for-wp.com/" }
    ],
    Shopify: [
      { name: "PWA by Shop Sheriff", desc: "Adds manifest and service worker for PWA. Improves installability and offline readiness.", link: "https://apps.shopify.com/pwa-by-shop-sheriff" }
    ],
    Wix: [
      { name: "Built-in PWA Features", desc: "Native PWA support with manifest and service worker. Reliable built-in readiness.", link: "" }
    ],
    Squarespace: [
      { name: "Built-in PWA", desc: "Native manifest and basic PWA support. Focus on clean code for readiness.", link: "" }
    ],
    Joomla: [
      { name: "PWA Joomla", desc: "Adds manifest and service worker for PWA. Good for installable Joomla sites.", link: "https://extensions.joomla.org/extension/pwa-joomla/" }
    ],
    Drupal: [
      { name: "Progressive Web App", desc: "Module for manifest and service worker. Brings PWA readiness to Drupal.", link: "https://www.drupal.org/project/pwa" }
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
      Plugin Solutions for Quit Risk Issues
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
      These popular free/freemium plugins can help optimize these technical areas. Always test compatibility on a staging site and review recent updates.
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