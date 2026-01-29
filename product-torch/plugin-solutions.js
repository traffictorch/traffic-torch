// product-torch/plugin-solutions.js - Updated to match current Traffic Torch metrics

function getPluginGrade(score) {
  if (score >= 90) return { grade: 'Excellent', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 70) return { grade: 'Strong', emoji: '🟢', color: 'text-green-600 dark:text-green-400' };
  if (score >= 50) return { grade: 'Average', emoji: '⚠️', color: 'text-orange-600 dark:text-orange-400' };
  if (score >= 30) return { grade: 'Needs Work', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
  return { grade: 'Poor', emoji: '🔴', color: 'text-red-600 dark:text-red-400' };
}

const pluginData = {
  "Title Tag Optimization": {
    WordPress: [
      { name: "Yoast SEO", desc: "Title templates, length checker, keyword focus.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced title optimization + AI suggestions.", link: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Title audits and bulk edits.", link: "https://apps.shopify.com/plug-in-seo" },
      { name: "SEO Manager", desc: "Title templates for products.", link: "https://apps.shopify.com/seo-manager" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Title editing with previews.", link: "" }],
    Squarespace: [{ name: "Built-in SEO Tools", desc: "Title length recommendations.", link: "" }]
  },
  "Meta Description Relevance": {
    WordPress: [
      { name: "Yoast SEO", desc: "Meta editor with length & CTA checks.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "AI-generated meta descriptions.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "Plug in SEO", desc: "Meta description optimization.", link: "https://apps.shopify.com/plug-in-seo" }],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Meta guidance with CTA suggestions.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Meta editing with length limits.", link: "" }]
  },
  "Heading Structure (H1–H6)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Heading analysis in readability check.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Content AI suggests heading improvements.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "SEO Booster", desc: "Heading structure audit.", link: "https://apps.shopify.com/seo-booster" }],
    Wix: [{ name: "Built-in Editor", desc: "Heading tags in content blocks.", link: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Proper heading implementation.", link: "" }]
  },
  "URL Structure": {
    WordPress: [
      { name: "Yoast SEO", desc: "Slug editor + permalink optimizer.", link: "https://yoast.com/wordpress/plugins/seo/" }
    ],
    Shopify: [{ name: "Smart SEO", desc: "URL cleanup & optimization.", link: "https://apps.shopify.com/smart-seo" }],
    Wix: [{ name: "Built-in SEO Wiz", desc: "URL slug editing.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Clean URL management.", link: "" }]
  },
  "Keyword Optimization": {
    WordPress: [
      { name: "Yoast SEO", desc: "Keyword density & placement analysis.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Keyword optimizer tool.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "SEO Booster", desc: "Keyword suggestions & density.", link: "https://apps.shopify.com/seo-booster" }],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Keyword guidance.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Keyword integration tips.", link: "" }]
  },
  "Mobile-Friendliness": {
    WordPress: [
      { name: "AMP for WP", desc: "Mobile AMP + responsive fixes.", link: "https://ampforwp.com/" },
      { name: "WPtouch", desc: "Mobile theme switcher.", link: "https://wptouch.com/" }
    ],
    Shopify: [{ name: "Ampify", desc: "AMP pages for mobile speed.", link: "https://apps.shopify.com/ampify-me" }],
    Wix: [{ name: "Built-in Mobile Editor", desc: "Responsive design tools.", link: "" }],
    Squarespace: [{ name: "Built-in Responsive", desc: "Automatic mobile optimization.", link: "" }]
  },
  "HTTPS Implementation": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Force HTTPS & fix mixed content.", link: "https://really-simple-ssl.com/" }
    ],
    Shopify: [{ name: "Built-in", desc: "Native HTTPS enforced.", link: "" }],
    Wix: [{ name: "Built-in SSL", desc: "Automatic HTTPS.", link: "" }],
    Squarespace: [{ name: "Built-in SSL", desc: "Free SSL certificates.", link: "" }]
  },
  "Canonical Tags": {
    WordPress: [
      { name: "Yoast SEO", desc: "Automatic canonical tags.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Canonical management.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "Plug in SEO", desc: "Canonical issue detection.", link: "https://apps.shopify.com/plug-in-seo" }],
    Wix: [{ name: "Built-in SEO", desc: "Canonical handling.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Automatic canonicals.", link: "" }]
  },
  "Meta Robots Directives": {
    WordPress: [
      { name: "Yoast SEO", desc: "Noindex/nofollow controls per page.", link: "https://yoast.com/wordpress/plugins/seo/" }
    ],
    Shopify: [{ name: "Plug in SEO", desc: "Robots meta management.", link: "https://apps.shopify.com/plug-in-seo" }],
    Wix: [{ name: "Built-in SEO", desc: "Index controls.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Robots settings.", link: "" }]
  },
  "Sitemap Inclusion Hints": {
    WordPress: [
      { name: "Yoast SEO", desc: "Auto XML sitemap generation.", link: "https://yoast.com/wordpress/plugins/seo/" }
    ],
    Shopify: [{ name: "XML Sitemap", desc: "Automatic product sitemaps.", link: "https://apps.shopify.com/xml-sitemap" }],
    Wix: [{ name: "Built-in Sitemap", desc: "Automatic generation.", link: "" }],
    Squarespace: [{ name: "Built-in Sitemap", desc: "Native XML sitemaps.", link: "" }]
  },
  "Product Description Quality": {
    WordPress: [
      { name: "Yoast SEO", desc: "Readability & content analysis.", link: "https://yoast.com/wordpress/plugins/seo/" }
    ],
    Shopify: [{ name: "SEO Booster", desc: "Description length & keyword tips.", link: "https://apps.shopify.com/seo-booster" }],
    Wix: [{ name: "Built-in Editor", desc: "Rich text for descriptions.", link: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Structured descriptions.", link: "" }]
  },
  "Image Optimization": {
    WordPress: [
      { name: "Smush", desc: "Compress + lazy load + WebP + alt suggestions.", link: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Bulk compress, WebP/AVIF, alt tools.", link: "https://ewww.io/" },
      { name: "Imagify", desc: "Smart compression + next-gen formats.", link: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "AI alt text + compression + WebP.", link: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Auto compress + SEO filenames/alt.", link: "https://crush.pics/" }
    ],
    Wix: [{ name: "Built-in Optimizer", desc: "Auto-compress + manual alt text.", link: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Native compression + alt fields.", link: "" }]
  },
  "Video Embed Quality": {
    WordPress: [
      { name: "EmbedPress", desc: "Optimized embeds with captions.", link: "https://wpdeveloper.com/plugins/embedpress/" }
    ],
    Shopify: [{ name: "Video Embed Optimizer", desc: "Lazy video loading.", link: "https://apps.shopify.com/video-embed-optimizer" }],
    Wix: [{ name: "Built-in Video", desc: "Caption support.", link: "" }],
    Squarespace: [{ name: "Built-in Video Blocks", desc: "Embed with captions.", link: "" }]
  },
  "User-Generated Content (UGC)": {
    WordPress: [
      { name: "Yotpo", desc: "Reviews, photos, videos with schema.", link: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Product reviews with UGC.", link: "https://judge.me/" }
    ],
    Shopify: [
      { name: "Yotpo", desc: "UGC and reviews.", link: "https://apps.shopify.com/yotpo-social-reviews" },
      { name: "Judge.me", desc: "Photo/video reviews.", link: "https://apps.shopify.com/judgeme" }
    ],
    Wix: [{ name: "Wix Reviews", desc: "Built-in UGC.", link: "" }],
    Squarespace: [{ name: "Built-in Comments", desc: "UGC support.", link: "" }]
  },
  "Internal Linking": {
    WordPress: [
      { name: "Yoast SEO", desc: "Internal link suggestions.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Link Whisper", desc: "AI-powered internal linking.", link: "https://linkwhisper.com/" }
    ],
    Shopify: [{ name: "Smart SEO", desc: "Link optimization.", link: "https://apps.shopify.com/smart-seo" }],
    Wix: [{ name: "Built-in Links", desc: "Anchor links.", link: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Internal linking.", link: "" }]
  },
  "Breadcrumb Navigation": {
    WordPress: [
      { name: "Yoast SEO", desc: "Breadcrumb schema.", link: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Breadcrumb NavXT", desc: "Custom breadcrumbs.", link: "https://mtekk.us/code/breadcrumb-navxt/" }
    ],
    Shopify: [{ name: "Breadcrumb App", desc: "Custom breadcrumbs.", link: "https://apps.shopify.com/breadcrumbs" }],
    Wix: [{ name: "Built-in Breadcrumbs", desc: "Native support.", link: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Breadcrumb tools.", link: "" }]
  },
  "Product Schema Markup": {
    WordPress: [
      { name: "Schema Pro", desc: "Full Product schema generator.", link: "https://wpschema.com/" },
      { name: "Rank Math", desc: "Built-in product schema.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "Schema Plus", desc: "Advanced schema.", link: "https://apps.shopify.com/schema-plus-for-seo" }],
    Wix: [{ name: "Built-in Structured Data", desc: "Product markup.", link: "" }],
    Squarespace: [{ name: "Built-in Schema", desc: "Native support.", link: "" }]
  },
  "Price & Availability Markup": {
    WordPress: [
      { name: "Schema Pro", desc: "Offer and price schema.", link: "https://wpschema.com/" }
    ],
    Shopify: [{ name: "Schema Plus", desc: "Price markup.", link: "https://apps.shopify.com/schema-plus-for-seo" }],
    Wix: [{ name: "Built-in", desc: "Price schema.", link: "" }],
    Squarespace: [{ name: "Built-in", desc: "Availability markup.", link: "" }]
  },
  "Review Schema & Aggregation": {
    WordPress: [
      { name: "WP Review Pro", desc: "Review schema.", link: "https://mythemeshop.com/plugins/wp-review-pro/" },
      { name: "Rank Math", desc: "Aggregate rating schema.", link: "https://rankmath.com/" }
    ],
    Shopify: [{ name: "Yotpo", desc: "Review schema.", link: "https://apps.shopify.com/yotpo-social-reviews" }],
    Wix: [{ name: "Built-in Reviews", desc: "Schema support.", link: "" }],
    Squarespace: [{ name: "Built-in", desc: "Review markup.", link: "" }]
  },
  "Variant Handling": {
    WordPress: [
      { name: "WooCommerce", desc: "Built-in variant management.", link: "https://woocommerce.com/" }
    ],
    Shopify: [{ name: "Built-in Variants", desc: "Native handling.", link: "" }],
    Wix: [{ name: "Built-in Store", desc: "Variant tools.", link: "" }],
    Squarespace: [{ name: "Built-in Commerce", desc: "Variants.", link: "" }]
  },
  "Social Sharing Integration": {
    WordPress: [
      { name: "Monarch", desc: "Social sharing with OG tags.", link: "https://www.elegantthemes.com/plugins/monarch/" },
      { name: "AddToAny", desc: "Sharing buttons.", link: "https://www.addtoany.com/" }
    ],
    Shopify: [{ name: "Social Share Buttons", desc: "OG integration.", link: "https://apps.shopify.com/social-share-buttons" }],
    Wix: [{ name: "Built-in Social", desc: "Sharing tools.", link: "" }],
    Squarespace: [{ name: "Built-in Sharing", desc: "Social buttons.", link: "" }]
  }
};

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) {
    console.log('Plugin Solutions: No issues to show');
    return;
  }
  console.log('Rendering Plugin Solutions for metrics:', failedMetrics.map(m => m.name));

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Plugin Solutions container not found: #${containerId}`);
    return;
  }

  const section = document.createElement('section');
  section.className = 'mt-20 max-w-5xl mx-auto px-4';

  // Debug banner
  section.innerHTML = `
    <div style="background:#6b21a8; color:white; padding:16px; border-radius:12px; margin-bottom:24px; text-align:center; font-weight:bold;">
      PLUGIN SOLUTIONS LOADED (${failedMetrics.length} issues) – panels are now OPEN by default for testing
    </div>
  `;

  section.innerHTML += `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for Detected Issues
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${failedMetrics.length} issue${failedMetrics.length > 1 ? 's' : ''} detected.
      Expand panels (they are open by default in debug mode) to see plugin recommendations.
    </p>
    <div class="space-y-6">
      ${failedMetrics.map(m => {
        const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
        const g = m.grade || { color: 'text-gray-600', emoji: '❓' }; // fallback
        return `
          <details class="group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden" open>
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
            <div class="px-2 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-md mx-auto my-8">
                <select id="cms-select-${metricId}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your platform / CMS...</option>
                  ${Object.keys(pluginData[m.name] || {}).map(cms =>
                    `<option value="${cms}">${cms}</option>`
                  ).join('')}
                </select>
              </div>
              <div id="plugins-${metricId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Plugins injected here -->
              </div>
            </div>
          </details>
        `;
      }).join('')}
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-12">
      These plugins can help fix detected issues. Test in staging first.
    </p>
  `;

  container.innerHTML = ''; // clear any old content
  container.appendChild(section);

  console.log('[Plugin Debug] Section appended – panels should be open');

  // Attach select listeners
  setTimeout(() => {
    failedMetrics.forEach(m => {
      const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
      const select = document.getElementById(`cms-select-${metricId}`);
      const pluginsList = document.getElementById(`plugins-${metricId}`);
      if (!select || !pluginsList) {
        console.warn(`Missing select/plugins for ${m.name}`);
        return;
      }
      select.addEventListener('change', (e) => {
        const selected = e.target.value;
        console.log(`[Plugin Debug] CMS selected for ${m.name}: ${selected}`);
        pluginsList.innerHTML = '';
        pluginsList.classList.remove('hidden');
        if (!selected || !pluginData[m.name]?.[selected]) {
          pluginsList.innerHTML = '<p class="text-center text-gray-600 py-4">No plugins for this platform</p>';
          return;
        }
        pluginData[m.name][selected].forEach(plugin => {
          const card = document.createElement('div');
          card.className = 'group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden';
          card.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-pink-600/5 dark:from-orange-500/10 dark:to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">${plugin.name}</h4>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">${plugin.desc}</p>
              <div class="flex flex-wrap gap-4">
                ${plugin.link ? `
                  <a href="${plugin.link}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow hover:shadow-md transition">
                    View Plugin
                  </a>
                ` : ''}
              </div>
            </div>
          `;
          pluginsList.appendChild(card);
        });
      });
      // Auto-select first option for debug (optional)
      if (select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change'));
      }
    });
  }, 0);
}
export { renderPluginSolutions };