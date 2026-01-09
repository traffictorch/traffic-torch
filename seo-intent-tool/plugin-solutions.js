const pluginData = {
  "Schema Markup": {
    WordPress: [
      { name: "Yoast SEO", desc: "Leading SEO plugin with robust built-in schema for Article, FAQ, HowTo, Product, and Person. Automatically generates markup with easy overrides and rich snippet previews. Ideal for reliable rich results without extra complexity.", link: "https://wordpress.org/plugins/wordpress-seo/", homeLink: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced freemium schema generator with 20+ types, custom fields, and AI suggestions. Includes testing tools and automation for rich snippets. Perfect for detailed control and maximum rich result impact.", link: "https://wordpress.org/plugins/seo-by-rank-math/", homeLink: "https://rankmath.com/" },
      { name: "All in One SEO", desc: "Guided schema setup with TruSEO scoring and automatic markup for common types. Supports dynamic variables and strong defaults. Trusted by millions for simple yet powerful schema.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/", homeLink: "https://aioseo.com/" },
      { name: "Schema & Structured Data for WP", desc: "Dedicated schema plugin with advanced types (Review, Recipe, etc.) and conditional display. Full AMP support and migration tools. Best for maximum schema flexibility.", link: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", homeLink: "https://wpschema.com/" }
    ],
    Shopify: [
      { name: "Schema Plus for SEO", desc: "Automatic JSON-LD schema for products, collections, blogs, and more. Fixes Google errors and enables rich results. Essential for e-commerce targeting higher CTR.", link: "https://apps.shopify.com/schema-plus", homeLink: "https://schemaplus.io/" },
      { name: "Webrex AI SEO Optimizer Schema", desc: "AI-powered schema generation for products, FAQs, videos, with duplicate removal. Integrates with 30+ review apps. Great for automated, accurate markup.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld", homeLink: "https://webrexstudio.com/" }
    ],
    Wix: [
      { name: "Built-in Structured Data", desc: "Wix auto-generates basic schema for pages, products, blogs. Custom options via SEO settings and Velo. Solid native solution for most Wix sites.", link: "https://support.wix.com/en/article/seo-adding-structured-data-to-your-wix-site" }
    ],
    Squarespace: [
      { name: "Built-in Markup", desc: "Native schema for pages, products, events, blogs. Automatic and always updated. No extra tools needed for standard rich results.", link: "https://support.squarespace.com/hc/en-us/articles/360002091288-Structured-data-and-rich-results" }
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

  "Author Byline Present": {
    WordPress: [
      { name: "PublishPress Authors", desc: "Best plugin for adding bylines, co-authors, guest authors, and rich author boxes. Customizable display with social links and bio. Directly fixes missing bylines in any theme.", link: "https://wordpress.org/plugins/publishpress-authors/", homeLink: "https://publishpress.com/" },
      { name: "Simple Author Box", desc: "Lightweight, responsive author/guest box with gravatar, bio, social icons. Easy shortcode/widget placement. Perfect for adding visible bylines quickly.", link: "https://wordpress.org/plugins/simple-author-box/", homeLink: "https://webfactoryltd.com/" },
      { name: "WP Post Author", desc: "Adds author boxes, co-authors, guest authors, social links, and byline display. Theme-agnostic with customization. Strong for enhancing author visibility.", link: "https://wordpress.org/plugins/wp-post-author/", homeLink: "https://afthemes.com/" }
    ],
    Shopify: [
      { name: "Staff Accounts", desc: "Built-in Shopify tool for assigning authors and displaying bylines on blog posts. Simple and native. Works well for basic author attribution.", link: "https://help.shopify.com/en/manual/your-account/staff-accounts" }
    ],
    Wix: [
      { name: "Blog Authors", desc: "Built-in Wix feature to assign authors and display bylines on blog posts. Easy management in editor. Native solution for visible author attribution.", link: "https://support.wix.com/en/article/wix-blog-adding-and-managing-authors" }
    ],
    Squarespace: [
      { name: "Built-in Blog Authors", desc: "Native Squarespace setting to add authors and show bylines on posts. Simple profile setup. Reliable for basic author visibility.", link: "https://support.squarespace.com/hc/en-us/articles/206543697-Adding-blog-post-author-profiles" }
    ],
    Joomla: [
      { name: "Author List", desc: "Extension to display author bylines and profiles. Customizable placement. Fixes missing author attribution.", link: "https://extensions.joomla.org/extension/author-list/" }
    ],
    Drupal: [
      { name: "Author", desc: "Module for enhanced author byline display and profiles. Integrates with content types. Good for visibility.", link: "https://www.drupal.org/project/author" }
    ]
  },

  "Author Bio Section": {
    WordPress: [
      { name: "PublishPress Authors", desc: "Adds rich author bios, social links, custom fields for credentials. Multiple authors/guest support. Perfect for displaying detailed bios.", link: "https://wordpress.org/plugins/publishpress-authors/", homeLink: "https://publishpress.com/" },
      { name: "Simple Author Box", desc: "Responsive author box with bio, gravatar, social icons. Customizable design. Easy way to add visible bios.", link: "https://wordpress.org/plugins/simple-author-box/", homeLink: "https://webfactoryltd.com/" },
      { name: "WP Post Author", desc: "Full author box with bio, social, credentials fields. Theme-independent. Strong for rich bio display.", link: "https://wordpress.org/plugins/wp-post-author/", homeLink: "https://afthemes.com/" }
    ],
    Shopify: [
      { name: "Staff Bio App", desc: "Customizable staff/author bio sections with social links. Adds visible bios to posts. Good for guest author display.", link: "https://apps.shopify.com/staff-bio" }
    ],
    Wix: [
      { name: "Team Members", desc: "Built-in app for team/author bios with photos and social links. Easy to add to posts/pages. Native bio solution.", link: "https://www.wix.com/app-market/web-solution/team-members" }
    ],
    Squarespace: [
      { name: "Built-in Author Profiles", desc: "Native blog author profiles with bio and social links. Simple setup. Reliable for visible bios.", link: "https://support.squarespace.com/hc/en-us/articles/206543697-Adding-blog-post-author-profiles" }
    ],
    Joomla: [
      { name: "Community Builder", desc: "User profiles with bio and social fields. Adds rich author bios. Great for detailed display.", link: "https://extensions.joomla.org/extension/community-builder/" }
    ],
    Drupal: [
      { name: "Profile", desc: "Extends user profiles with bio and custom fields. Good for rich author bios.", link: "https://www.drupal.org/project/profile" }
    ]
  },

  "Update Date Shown": {
    WordPress: [
      { name: "Post Updated Date", desc: "Simple plugin to display last updated date on posts. Customizable format and placement. Fixes missing update date visibility.", link: "https://wordpress.org/plugins/post-updated-date/", homeLink: "https://wordpress.org/plugins/post-updated-date/" },
      { name: "Display Last Modified Date", desc: "Shows last modified date in posts/pages. Theme-agnostic with shortcodes. Reliable for update visibility.", link: "https://wordpress.org/plugins/display-last-modified-date/" },
      { name: "Last Modified Timestamp", desc: "Adds updated timestamp with custom styling. Easy integration. Good for clear update signaling.", link: "https://wordpress.org/plugins/last-modified-timestamp/" }
    ],
    Shopify: [
      { name: "Updated Date Display", desc: "App to show last updated date on products/pages. Customizable placement. Helps signal freshness.", link: "https://apps.shopify.com/updated-date-display" }
    ],
    Wix: [
      { name: "Built-in Update Date", desc: "Native blog post date display includes last updated. Manual edit in settings. Reliable built-in.", link: "https://support.wix.com/en/article/wix-blog-managing-blog-post-dates" }
    ],
    Squarespace: [
      { name: "Built-in Date Display", desc: "Native blog post dates show published/updated. Customizable in editor. No extra plugin needed.", link: "https://support.squarespace.com/hc/en-us/articles/206543697-Adding-blog-post-author-profiles" }
    ],
    Joomla: [
      { name: "Last Updated Date", desc: "Extension to display last modified date. Customizable format. Fixes missing update visibility.", link: "https://extensions.joomla.org/extension/last-updated-date/" }
    ],
    Drupal: [
      { name: "Last Updated", desc: "Module to show last modified date. Integrates with content types. Good for freshness signaling.", link: "https://www.drupal.org/project/last_updated" }
    ]
  },

  "Contact Info Present": {
    WordPress: [
      { name: "Contact Form 7", desc: "Most popular form plugin to add contact forms anywhere. Easy shortcode placement. Essential for visible contact.", link: "https://wordpress.org/plugins/contact-form-7/", homeLink: "https://contactform7.com/" },
      { name: "WPForms", desc: "User-friendly form builder with contact templates. Drag-and-drop and spam protection. Great for quick contact addition.", link: "https://wordpress.org/plugins/wpforms-lite/", homeLink: "https://wpforms.com/" },
      { name: "Simple Contact Form", desc: "Lightweight contact form with email notifications. Easy widget/shortcode. Perfect for basic contact visibility.", link: "https://wordpress.org/plugins/simple-contact-form/" }
    ],
    Shopify: [
      { name: "Contact Form by POWR", desc: "Customizable contact form with spam protection. Easy embed on pages. Strong for contact presence.", link: "https://apps.shopify.com/contact-form" }
    ],
    Wix: [
      { name: "Built-in Contact Form", desc: "Native forms for contact pages. Drag-and-drop customization. Built-in solution for visible contact.", link: "https://support.wix.com/en/article/wix-forms-adding-and-setting-up-a-contact-form" }
    ],
    Squarespace: [
      { name: "Built-in Forms", desc: "Native contact forms with customizable fields. Easy to add to pages. Reliable built-in contact solution.", link: "https://support.squarespace.com/hc/en-us/articles/206543997-Adding-a-form-block" }
    ],
    Joomla: [
      { name: "Contact Enhanced", desc: "Advanced contact forms with multiple fields. Easy page integration. Strong for contact visibility.", link: "https://extensions.joomla.org/extension/contact-enhanced/" }
    ],
    Drupal: [
      { name: "Contact", desc: "Core contact form module. Simple and reliable. Good for basic contact presence.", link: "https://www.drupal.org/docs/core-modules-and-themes/core-modules/contact-module" }
    ]
  },

  "Privacy & Terms Links": {
    WordPress: [
      { name: "Complianz – GDPR/CCPA Cookie Consent", desc: "Generates privacy policy pages and adds footer links. Includes terms templates. Essential for legal compliance visibility.", link: "https://wordpress.org/plugins/complianz-gdpr/", homeLink: "https://complianz.io/" },
      { name: "Auto Terms & Privacy Policy", desc: "Automatically creates privacy/terms pages with footer links. Customizable templates. Quick legal link solution.", link: "https://wordpress.org/plugins/auto-terms-privacy-policy/" },
      { name: "GDPR Cookie Consent", desc: "Adds privacy policy link and consent banner. Easy setup for terms visibility. Strong for compliance.", link: "https://wordpress.org/plugins/cookie-law-info/" }
    ],
    Shopify: [
      { name: "Privacy Policy Generator", desc: "Creates privacy/terms pages with automatic footer links. Customizable and compliant. Easy legal link addition.", link: "https://apps.shopify.com/privacy-policy-generator" }
    ],
    Wix: [
      { name: "Built-in Privacy & Terms", desc: "Native pages for privacy policy and terms. Easy to add footer links. Built-in solution for legal visibility.", link: "https://support.wix.com/en/article/adding-a-privacy-policy-page" }
    ],
    Squarespace: [
      { name: "Built-in Legal Pages", desc: "Native privacy/terms pages with footer link options. Simple setup. Reliable built-in compliance.", link: "https://support.squarespace.com/hc/en-us/articles/206543987-Adding-legal-pages" }
    ],
    Joomla: [
      { name: "Privacy Policy Component", desc: "Generates privacy/terms pages with footer links. Customizable templates. Good for legal visibility.", link: "https://extensions.joomla.org/extension/privacy-policy-component/" }
    ],
    Drupal: [
      { name: "Privacy Policy", desc: "Module for creating privacy/terms pages. Easy integration. Solid for legal link presence.", link: "https://www.drupal.org/project/privacy_policy" }
    ]
  },

  "About/Team Links": {
    WordPress: [
      { name: "Team Members", desc: "Creates team/author pages with links in menus/footers. Customizable profiles. Great for visible About/Team sections.", link: "https://wordpress.org/plugins/team-members/" },
      { name: "Simple Staff List", desc: "Lightweight team display with menu integration. Easy About/Team page addition. Clean and simple.", link: "https://wordpress.org/plugins/simple-staff-list/" }
    ],
    Shopify: [
      { name: "Team Showcase", desc: "App for team pages with menu/footer links. Customizable profiles. Strong for About/Team visibility.", link: "https://apps.shopify.com/team-showcase" }
    ],
    Wix: [
      { name: "Team Members", desc: "Built-in app for team pages with menu links. Easy About/Team section. Native solution.", link: "https://www.wix.com/app-market/web-solution/team-members" }
    ],
    Squarespace: [
      { name: "Team Page Plugin", desc: "Adds team sections with navigation links. Customizable display. Good for About/Team presence.", link: "https://sparkplugin.com/plugins/team-page" }
    ],
    Joomla: [
      { name: "Team Manager", desc: "Creates team pages with menu integration. Customizable. Reliable for About/Team links.", link: "https://extensions.joomla.org/extension/team-manager/" }
    ],
    Drupal: [
      { name: "Team", desc: "Module for team pages with menu links. Simple setup. Solid for visibility.", link: "https://www.drupal.org/project/team" }
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