// seo-ux-tool/plugin-solutions.js
// Complete plugin recommendations database – all metrics covered
const pluginData = {
  "Title optimized (30–65 chars, keyword early)": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Real-time title editor with length counter, keyword placement suggestions, and SERP preview. Enforces 50-60 char optimal range. AI title ideas in premium. Helps improve click-through rates by showing exactly how your title will appear in search results. Includes readability analysis to balance keyword use with natural language.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/wordpress/plugins/seo/"
      },
      {
        name: "Rank Math",
        desc: "Advanced title optimization with dynamic variables, bulk editing, and focus keyword scoring. Accurate preview and length guidance. Supports multiple focus keywords per page. Allows site-wide title patterns for consistent branding. Excellent for large sites needing bulk updates.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      },
      {
        name: "All in One SEO",
        desc: "TruSEO scoring for title strength with smart patterns and recommendations. Unlimited keywords and defaults. Provides instant feedback on title quality. Dynamic variables pull from post data automatically. Great for beginners and advanced users alike.",
        link: "https://wordpress.org/plugins/all-in-one-seo-pack/",
        homeLink: "https://aioseo.com/"
      }
    ],
    Shopify: [
      {
        name: "SearchPie SEO",
        desc: "Automatic title optimization with AI templates and bulk tools. Focuses on keyword placement and length for CTR. Generates multiple title variations for testing. Bulk applies changes across products and collections. Helps boost organic visibility quickly.",
        link: "https://apps.shopify.com/seo-booster",
        homeLink: "https://boosterapps.com/"
      },
      {
        name: "Plug in SEO",
        desc: "Scans titles, provides fixes, and monitors length/keyword placement. Reliable for ongoing optimization. Sends alerts for suboptimal titles after updates. Includes template suggestions for consistency. Perfect for stores with frequent product additions.",
        link: "https://apps.shopify.com/plug-in-seo",
        homeLink: "https://pluginseo.com/"
      }
    ],
    Wix: [
      {
        name: "Built-in SEO Wiz",
        desc: "Guided title creation with previews, character limits, and keyword suggestions. Native and personalized. Step-by-step wizard helps avoid common mistakes. Automatically pulls relevant keywords from content. No extra setup required."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Page Settings",
        desc: "Dedicated SEO title field with counter and tips. Native previews and defaults from content. Shows real-time character count and truncation warning. Simple and reliable for all page types. Keeps branding consistent across the site."
      }
    ],
    Joomla: [
      {
        name: "EFSEO - Easy Frontend SEO",
        desc: "Frontend title editing with length rules and automatic generation. Bulk operations. Inline editing without leaving the page. Supports custom templates and variables. Ideal for content managers who need speed.",
        link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/",
        homeLink: "https://stackideas.com/"
      },
      {
        name: "Tag Meta",
        desc: "Rules-based title management with patterns and length control. Site-wide consistency. Advanced rules for categories, tags, and custom fields. Prevents truncation issues automatically. Great for large multilingual sites.",
        link: "https://extensions.joomla.org/extension/tag-meta/"
      }
    ],
    Drupal: [
      {
        name: "Metatag",
        desc: "Comprehensive title control with tokens and length validation. Per-entity settings. Uses Drupal tokens for dynamic content. Bulk override capabilities. Perfect for complex content architectures.",
        link: "https://www.drupal.org/project/metatag"
      }
    ]
  },
  "Meta description present & optimal": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Real-time editor with length guidance, keyword integration, and SERP preview. AI suggestions for compelling copy. Encourages active voice and calls-to-action. Shows mobile/desktop preview side-by-side. Helps increase click-through rates significantly.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/wordpress/plugins/seo/"
      },
      {
        name: "Rank Math",
        desc: "Dynamic descriptions with variables, bulk tools, and accurate preview. Strong readability checks. AI-powered rewrite suggestions. Bulk edit across posts/pages. Excellent for maintaining consistent tone.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      },
      {
        name: "All in One SEO",
        desc: "Smart generation with TruSEO scoring and dynamic patterns. Excellent defaults. Pulls from content automatically when missing. Includes character counter and preview. Reliable for large-scale sites.",
        link: "https://wordpress.org/plugins/all-in-one-seo-pack/",
        homeLink: "https://aioseo.com/"
      }
    ],
    Shopify: [
      {
        name: "SearchPie SEO",
        desc: "Optimizes descriptions store-wide with AI templates and bulk editing. Keyword-rich copy for CTR. Generates engaging, benefit-focused descriptions. Applies changes to products, collections, and pages. Boosts conversion potential.",
        link: "https://apps.shopify.com/seo-booster",
        homeLink: "https://boosterapps.com/"
      },
      {
        name: "Plug in SEO",
        desc: "Scans and fixes description issues with recommendations and alerts. Monitors changes. Highlights missing or too-short descriptions. Provides rewrite suggestions. Keeps store descriptions fresh and effective.",
        link: "https://apps.shopify.com/plug-in-seo",
        homeLink: "https://pluginseo.com/"
      }
    ],
    Wix: [
      {
        name: "Built-in AI Meta Tag Creator",
        desc: "AI generates optimized description suggestions. Choose tone and refine. Native in SEO panel. Pulls key points from page content automatically. Quick and effective for non-technical users."
      }
    ],
    Squarespace: [
      {
        name: "Built-in SEO Tools",
        desc: "Native editor for custom descriptions with limits and previews. Generates defaults from content. Shows exact appearance in search results. Simple character counter. Keeps descriptions aligned with branding."
      }
    ],
    Joomla: [
      {
        name: "EFSEO - Easy Frontend SEO",
        desc: "Frontend description editing with generation rules. Bulk operations. Inline editing saves time. Supports variables and templates. Ideal for editors managing many pages.",
        link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/",
        homeLink: "https://stackideas.com/"
      },
      {
        name: "Tag Meta",
        desc: "Rules-based description management with patterns. Site-wide consistency. Advanced conditional rules for categories/tags. Prevents empty descriptions automatically. Great for structured sites.",
        link: "https://extensions.joomla.org/extension/tag-meta/"
      }
    ],
    Drupal: [
      {
        name: "Metatag",
        desc: "Comprehensive description control with tokens and length validation. Per-entity settings. Uses Drupal tokens for dynamic insertion. Bulk update support. Perfect for complex content models.",
        link: "https://www.drupal.org/project/metatag"
      }
    ]
  },
  "Structured data (schema) detected": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Built-in schema for Article, FAQ, HowTo, etc. Auto markup and easy overrides. Adds breadcrumb, organization, and website schema automatically. Includes validation tool. Enhances rich results in Google.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/wordpress/plugins/seo/"
      },
      {
        name: "Rank Math",
        desc: "Advanced generator with 20+ types and AI suggestions. Testing tools. Supports custom schema and dynamic fields. Built-in Google Rich Results tester integration. Excellent for advanced SEO.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      },
      {
        name: "All in One SEO",
        desc: "Guided setup with TruSEO and auto markup. Dynamic variables. Covers products, reviews, events, local business. Simple wizard for beginners. Reliable rich snippet support.",
        link: "https://wordpress.org/plugins/all-in-one-seo-pack/",
        homeLink: "https://aioseo.com/"
      }
    ],
    Shopify: [
      {
        name: "Schema Plus for SEO",
        desc: "Automatic JSON-LD for products, collections, blogs. Fixes errors. Adds review stars, pricing, availability. Supports multiple schema types per page. Great for e-commerce visibility.",
        link: "https://apps.shopify.com/schema-plus",
        homeLink: "https://schemaplus.io/"
      },
      {
        name: "Webrex AI SEO Optimizer Schema",
        desc: "AI-powered schema for products, FAQs, videos. Duplicate removal. Automatically detects content type and applies correct markup. Includes validation and error fixing. Boosts rich results fast.",
        link: "https://apps.shopify.com/webrex-seo-schema-jsonld",
        homeLink: "https://webrexstudio.com/"
      }
    ],
    Wix: [
      {
        name: "Built-in Structured Data",
        desc: "Auto-generates basic schema for pages, products, blogs. Custom via Velo. Includes organization and website markup. Simple and reliable for most sites. No extra tools needed."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Markup",
        desc: "Native schema for pages, products, events, blogs. Automatic updates. Covers common types like Article and Product. Works out-of-the-box with templates. Good baseline rich results."
      }
    ],
    Joomla: [
      {
        name: "Google Structured Data",
        desc: "Free extension for breadcrumb, article, organization schema. Easy setup. Supports multiple content types. Includes validation links. Great for basic to intermediate needs.",
        link: "https://extensions.joomla.org/extension/google-structured-data/"
      },
      {
        name: "EFSEO",
        desc: "Freemium tool for structured data and meta tags. Multiple types. Supports JSON-LD output. Bulk application options. Flexible for growing sites.",
        link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/",
        homeLink: "https://stackideas.com/"
      }
    ],
    Drupal: [
      {
        name: "Schema.org Metatag",
        desc: "Full Schema.org support with high configurability. Entity-based markup. Integrates with core fields. Advanced mapping options. Ideal for complex Drupal sites.",
        link: "https://www.drupal.org/project/schema_metatag"
      },
      {
        name: "Metatag",
        desc: "Base module for structured data extensions. Token support. Foundation for custom schema types. Highly extensible. Used by large enterprise sites.",
        link: "https://www.drupal.org/project/metatag"
      }
    ]
  },
  "Canonical tag present": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Automatically adds canonical tags with overrides. Prevents duplicate content issues. Lets you set per-post/page canonicals and manage cross-domain duplicates easily. Great for multi-language sites or parameter-heavy URLs.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/wordpress/plugins/seo/"
      },
      {
        name: "Rank Math",
        desc: "Generates canonical URLs with bulk control. Strong duplicate handling. Includes advanced rules for dynamic canonicals and automatic detection of self-referencing or external duplicates.",
        link: "https://wordpress.org/plugins/seo-by-rank-math/",
        homeLink: "https://rankmath.com/"
      },
      {
        name: "All in One SEO",
        desc: "Auto canonical with custom options. Trusted for consistency. Supports overriding default behavior and bulk editing canonicals across thousands of pages quickly.",
        link: "https://wordpress.org/plugins/all-in-one-seo-pack/",
        homeLink: "https://aioseo.com/"
      }
    ],
    Shopify: [
      {
        name: "Plug in SEO",
        desc: "Scans and adds canonical tags with recommendations. Identifies duplicate content automatically. Provides one-click fixes and alerts for new issues after theme or product changes.",
        link: "https://apps.shopify.com/plug-in-seo",
        homeLink: "https://pluginseo.com/"
      }
    ],
    Wix: [
      {
        name: "Built-in SEO Settings",
        desc: "Native canonical support via advanced settings. Automatically handles duplicates for blog posts, products, and collections. No extra plugin needed — simple toggle in page settings."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Tools",
        desc: "Native canonical handling for duplicate pages. Automatically sets self-canonicals on most content types. Ideal for portfolios or stores with similar-looking pages."
      }
    ],
    Joomla: [
      {
        name: "Tag Meta",
        desc: "Rules-based canonical management. Allows site-wide patterns and per-item overrides. Excellent for multilingual sites using language switches or category aliases.",
        link: "https://extensions.joomla.org/extension/tag-meta/"
      }
    ],
    Drupal: [
      {
        name: "Metatag",
        desc: "Canonical control with tokens. Highly flexible with entity-based settings and views integration. Perfect for complex content types or dynamic pages.",
        link: "https://www.drupal.org/project/metatag"
      }
    ]
  },
  "All images have meaningful alt text": {
    WordPress: [
      {
        name: "Smush",
        desc: "Bulk alt text suggestions and auto-fill. AI extensions available. Compresses images while adding SEO-friendly alt attributes in bulk. Great for sites with hundreds of legacy images.",
        link: "https://wordpress.org/plugins/wp-smushit/",
        homeLink: "https://wpmudev.com/project/wp-smush-pro/"
      },
      {
        name: "EWWW Image Optimizer",
        desc: "Bulk alt tools with quality focus. Optimizes existing images and adds descriptive alts during upload. Works server-side for maximum performance.",
        link: "https://wordpress.org/plugins/ewww-image-optimizer/",
        homeLink: "https://ewww.io/"
      },
      {
        name: "Imagify",
        desc: "Alt suggestions with compression. Smart AI-driven alt text generation for new uploads. Integrates seamlessly with media library workflows.",
        link: "https://wordpress.org/plugins/imagify-image-optimizer/",
        homeLink: "https://imagify.io/"
      }
    ],
    Shopify: [
      {
        name: "TinyIMG",
        desc: "AI alt text generation and bulk processing. Automatically fills missing alts across products and collections. Includes filename optimization for better image SEO.",
        link: "https://apps.shopify.com/tinyimg",
        homeLink: "https://tiny-img.com/"
      },
      {
        name: "Crush.pics",
        desc: "SEO-friendly alt/filenames with bulk tools. Bulk edit alts for existing images. Helps fix accessibility and ranking issues quickly.",
        link: "https://apps.shopify.com/crush-pics",
        homeLink: "https://crush.pics/"
      }
    ],
    Wix: [
      {
        name: "Built-in Optimizer",
        desc: "Manual alt text editing in editor. Simple interface for adding descriptive alts to every image. Built-in reminder prompts during upload."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Tools",
        desc: "Alt text fields in editor. Forces alt entry for new images. Easy retrofitting for older galleries and blocks."
      }
    ],
    Joomla: [
      {
        name: "ImageRecycle",
        desc: "Bulk alt text tools with compression. Scans and suggests alts for existing media. Great for content-heavy sites.",
        link: "https://extensions.joomla.org/extension/imagerecycle-image-optimizer/",
        homeLink: "https://www.imagerecycle.com/"
      }
    ],
    Drupal: [
      {
        name: "ImageAPI Optimize",
        desc: "Alt text support in optimization pipelines. Integrates with image styles and bulk operations. Ensures alts are preserved during processing.",
        link: "https://www.drupal.org/project/imageapi_optimize"
      }
    ]
  },
  "Web app manifest linked": {
    WordPress: [
      {
        name: "Super Progressive Web Apps",
        desc: "Adds manifest.json and links it automatically. Includes theme color and name settings. Turns your site into installable app with splash screen support.",
        link: "https://wordpress.org/plugins/super-progressive-web-apps/",
        homeLink: "https://superpwa.com/"
      },
      {
        name: "PWA for WP",
        desc: "Complete manifest and PWA setup. Advanced caching strategies and offline fallback pages. Includes analytics for add-to-home-screen events.",
        link: "https://wordpress.org/plugins/pwa-for-wp/",
        homeLink: "https://pwa-for-wp.com/"
      }
    ],
    Shopify: [
      {
        name: "PWA by Shop Sheriff",
        desc: "Adds manifest and links it. Customizable icons and splash screens. Boosts mobile engagement with native-like experience.",
        link: "https://apps.shopify.com/pwa-by-shop-sheriff"
      }
    ],
    Wix: [
      {
        name: "Built-in PWA Features",
        desc: "Native manifest support. Automatically generates manifest for mobile users. Enables add-to-home-screen prompt."
      }
    ],
    Squarespace: [
      {
        name: "Built-in PWA",
        desc: "Native manifest handling. Works out-of-the-box for most templates. Supports offline caching for key pages."
      }
    ],
    Joomla: [
      {
        name: "PWA Joomla",
        desc: "Adds manifest for PWA. Simple configuration with custom icons. Compatible with most templates.",
        link: "https://extensions.joomla.org/extension/pwa-joomla/"
      }
    ],
    Drupal: [
      {
        name: "Progressive Web App",
        desc: "Module for manifest. Flexible configuration per site section. Integrates with Drupal caching.",
        link: "https://www.drupal.org/project/pwa"
      }
    ]
  },
  "Homescreen icons (192px+) provided": {
    WordPress: [
      {
        name: "Super Progressive Web Apps",
        desc: "Generates and includes homescreen icons. Auto-creates multiple sizes from one source image. Includes maskable icon support for Android.",
        link: "https://wordpress.org/plugins/super-progressive-web-apps/",
        homeLink: "https://superpwa.com/"
      },
      {
        name: "PWA for WP",
        desc: "Complete icon support for PWA. Generates 192×192, 512×512, and Apple touch icons. Ensures crisp appearance on all devices.",
        link: "https://wordpress.org/plugins/pwa-for-wp/",
        homeLink: "https://pwa-for-wp.com/"
      }
    ],
    Shopify: [
      {
        name: "PWA by Shop Sheriff",
        desc: "Provides homescreen icons. Upload one image — generates required sizes. Works with Shopify's mobile theme.",
        link: "https://apps.shopify.com/pwa-by-shop-sheriff"
      }
    ],
    Wix: [
      {
        name: "Built-in PWA Features",
        desc: "Native icon handling. Automatically uses site favicon in multiple sizes. Simple setup in site settings."
      }
    ],
    Squarespace: [
      {
        name: "Built-in PWA",
        desc: "Native icon support. Uses uploaded favicon at different resolutions. Reliable for modern browsers."
      }
    ],
    Joomla: [
      {
        name: "PWA Joomla",
        desc: "Adds homescreen icons. Supports multiple formats and sizes. Easy upload in extension settings.",
        link: "https://extensions.joomla.org/extension/pwa-joomla/"
      }
    ],
    Drupal: [
      {
        name: "Progressive Web App",
        desc: "Module for icons. Generates required sizes from uploaded image. Integrates with media management.",
        link: "https://www.drupal.org/project/pwa"
      }
    ]
  },
  "Service worker": {
    WordPress: [
      {
        name: "Super Progressive Web Apps",
        desc: "Registers service worker for PWA. Caches pages, images, and assets automatically. Supports offline mode and push notifications.",
        link: "https://wordpress.org/plugins/super-progressive-web-apps/",
        homeLink: "https://superpwa.com/"
      },
      {
        name: "PWA for WP",
        desc: "Complete service worker setup. Advanced caching strategies and background sync. Reliable for high-traffic sites.",
        link: "https://wordpress.org/plugins/pwa-for-wp/",
        homeLink: "https://pwa-for-wp.com/"
      }
    ],
    Shopify: [
      {
        name: "PWA by Shop Sheriff",
        desc: "Adds service worker. Enables offline browsing of key pages. Improves perceived speed on mobile.",
        link: "https://apps.shopify.com/pwa-by-shop-sheriff"
      }
    ],
    Wix: [
      {
        name: "Built-in PWA Features",
        desc: "Native service worker support. Automatically caches static assets. Provides basic offline fallback."
      }
    ],
    Squarespace: [
      {
        name: "Built-in PWA",
        desc: "Native service worker. Handles caching for faster repeat visits. Works seamlessly with templates."
      }
    ],
    Joomla: [
      {
        name: "PWA Joomla",
        desc: "Adds service worker. Configurable cache duration and files. Good for content-heavy sites.",
        link: "https://extensions.joomla.org/extension/pwa-joomla/"
      }
    ],
    Drupal: [
      {
        name: "Progressive Web App",
        desc: "Module for service worker. Integrates with Drupal cache system. Supports offline content viewing.",
        link: "https://www.drupal.org/project/pwa"
      }
    ]
  },
  "Page weight reasonable (<300KB HTML)": {
    WordPress: [
      {
        name: "Autoptimize",
        desc: "Minifies HTML/CSS/JS to reduce page weight. Combines files and defers non-critical resources. Great first step for speed optimization.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      },
      {
        name: "Perfmatters",
        desc: "Removes bloat and unused code to shrink page size. Disables unnecessary scripts and emojis. Highly effective for bloated themes.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      }
    ],
    Shopify: [
      {
        name: "Rocket Page Speed Optimizer",
        desc: "Compresses and removes bloat for lighter pages. Targets theme and app overhead. Often reduces size by 30-50%.",
        link: "https://apps.shopify.com/core-web-vitals-booster",
        homeLink: "https://rocketoptimizer.com/"
      }
    ],
    Wix: [
      {
        name: "Website Speedy",
        desc: "Reduces page weight by optimizing assets. Compresses images and removes unused code. Works within Wix editor limits."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Optimization",
        desc: "Native compression for reasonable page weight. Automatically minifies code. Good baseline for most sites."
      }
    ],
    Joomla: [
      {
        name: "JCH Optimize",
        desc: "Minifies and removes bloat for lighter pages. Advanced options for CSS/JS combination. Trusted by large Joomla sites.",
        link: "https://extensions.joomla.org/extension/jch-optimize/",
        homeLink: "https://www.jch-optimize.net/"
      }
    ],
    Drupal: [
      {
        name: "AdvAgg",
        desc: "Aggregates and minifies to reduce weight. Smart grouping and cache busting. Excellent for performance tuning.",
        link: "https://www.drupal.org/project/advagg"
      }
    ]
  },
  "Number of HTTP requests": {
    WordPress: [
      {
        name: "Autoptimize",
        desc: "Combines CSS/JS to reduce requests. Also inlines critical CSS. Can drop requests by 50%+ on average sites.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      },
      {
        name: "Perfmatters",
        desc: "Removes unused assets to lower requests. Disables emojis, embeds, and query strings. Clean and lightweight approach.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      }
    ],
    Shopify: [
      {
        name: "Rocket Page Speed Optimizer",
        desc: "Combines and removes requests. Targets apps and third-party scripts. Significant improvement for store speed.",
        link: "https://apps.shopify.com/core-web-vitals-booster",
        homeLink: "https://rocketoptimizer.com/"
      }
    ],
    Wix: [
      {
        name: "Website Speedy",
        desc: "Reduces requests by optimization. Removes unnecessary Wix scripts when possible. Good for image-heavy sites."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Tools",
        desc: "Native minimization of requests. Combines assets where possible. Solid for most templates."
      }
    ],
    Joomla: [
      {
        name: "JCH Optimize",
        desc: "Combines files to reduce requests. Advanced grouping rules. Very effective on complex Joomla sites.",
        link: "https://extensions.joomla.org/extension/jch-optimize/",
        homeLink: "https://www.jch-optimize.net/"
      }
    ],
    Drupal: [
      {
        name: "AdvAgg",
        desc: "Aggregates to lower request count. Smart asset bundling. Excellent for high-traffic Drupal installations.",
        link: "https://www.drupal.org/project/advagg"
      }
    ]
  },
  "Render-blocking resources": {
    WordPress: [
      {
        name: "Autoptimize",
        desc: "Defers and asyncs render-blocking scripts. Critical CSS inlining option. Improves Largest Contentful Paint significantly.",
        link: "https://wordpress.org/plugins/autoptimize/",
        homeLink: "https://autoptimize.com/"
      },
      {
        name: "Perfmatters",
        desc: "Delays and removes render-blocking code. Lazy-loads scripts and styles. Great for mobile performance.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      }
    ],
    Shopify: [
      {
        name: "Rocket Page Speed Optimizer",
        desc: "Defers render-blocking resources. Optimizes theme and app loading order. Targets Core Web Vitals.",
        link: "https://apps.shopify.com/core-web-vitals-booster",
        homeLink: "https://rocketoptimizer.com/"
      }
    ],
    Wix: [
      {
        name: "Website Speedy",
        desc: "Removes render-blocking issues. Defers non-essential scripts. Works within Wix limitations."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Optimization",
        desc: "Native deferral of render-blocking. Automatic handling in most cases. Good baseline performance."
      }
    ],
    Joomla: [
      {
        name: "JCH Optimize",
        desc: "Defers render-blocking CSS/JS. Async and defer options. Powerful for complex templates.",
        link: "https://extensions.joomla.org/extension/jch-optimize/",
        homeLink: "https://www.jch-optimize.net/"
      }
    ],
    Drupal: [
      {
        name: "AdvAgg",
        desc: "Defers render-blocking resources. Aggregates and optimizes delivery. Strong for performance-focused sites.",
        link: "https://www.drupal.org/project/advagg"
      }
    ]
  },
  "Web fonts optimized": {
    WordPress: [
      {
        name: "OMGF",
        desc: "Local Google Fonts with preload and swap. Eliminates external requests. Prevents FOUT (flash of unstyled text).",
        link: "https://wordpress.org/plugins/host-webfonts-local/",
        homeLink: "https://daan.dev/omgf/"
      },
      {
        name: "Perfmatters",
        desc: "Preload and disable unused fonts. Removes Google Fonts completely if desired. Lightweight solution.",
        link: "https://perfmatters.io/",
        homeLink: "https://perfmatters.io/"
      }
    ],
    Shopify: [
      {
        name: "Rocket Page Speed Optimizer",
        desc: "Font preload and optimization. Local hosting option available. Improves font loading speed.",
        link: "https://apps.shopify.com/core-web-vitals-booster",
        homeLink: "https://rocketoptimizer.com/"
      }
    ],
    Wix: [
      {
        name: "Built-in Font Optimization",
        desc: "Native font handling. Uses system fonts when possible. Good default performance."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Tools",
        desc: "Native font optimization. Preloads critical fonts. Reliable across templates."
      }
    ],
    Joomla: [
      {
        name: "JCH Optimize",
        desc: "Font preload and minification. Local hosting support. Reduces external calls.",
        link: "https://extensions.joomla.org/extension/jch-optimize/",
        homeLink: "https://www.jch-optimize.net/"
      }
    ],
    Drupal: [
      {
        name: "AdvAgg",
        desc: "Font aggregation and optimization. Preload and local options. Strong for design-heavy sites.",
        link: "https://www.drupal.org/project/advagg"
      }
    ]
  },
  "Form fields properly labeled": {
    WordPress: [
      {
        name: "WP Accessibility",
        desc: "Adds labels to form fields and improves accessibility. Fixes common label issues automatically. Includes contrast checker and landmark support.",
        link: "https://wordpress.org/plugins/wp-accessibility/",
        homeLink: "https://equalizedigital.com/"
      }
    ],
    Shopify: [
      {
        name: "Accessibility Booster",
        desc: "Enhances form labels and accessibility. Bulk fixes for checkout and contact forms. Improves WCAG compliance.",
        link: "https://apps.shopify.com/accessibility-booster"
      }
    ],
    Wix: [
      {
        name: "Built-in Accessibility Tools",
        desc: "Native form label support. Automatic labeling in forms builder. Includes accessibility wizard."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Tools",
        desc: "Native form labeling. Proper for and id attributes by default. Good accessibility baseline."
      }
    ],
    Joomla: [
      {
        name: "Accessibility Plugin",
        desc: "Improves form labels. Adds missing labels and ARIA attributes. Simple enhancement tool.",
        link: "https://extensions.joomla.org/extension/accessibility/"
      }
    ],
    Drupal: [
      {
        name: "Accessibility",
        desc: "Enhances form field labels. Integrates with core forms API. Ensures proper labeling.",
        link: "https://www.drupal.org/project/accessibility"
      }
    ]
  },
  "Clear primary calls-to-action": {
    WordPress: [
      {
        name: "Elementor",
        desc: "Drag-and-drop builder for prominent CTAs. Visual styling with contrast checker. Perfect for creating conversion-focused buttons.",
        link: "https://wordpress.org/plugins/elementor/",
        homeLink: "https://elementor.com/"
      },
      {
        name: "Thrive Architect",
        desc: "Focused CTA builder with conversion focus. A/B testing and attention-grabbing templates. Designed for high-conversion pages.",
        link: "https://thrivethemes.com/architect/",
        homeLink: "https://thrivethemes.com/"
      }
    ],
    Shopify: [
      {
        name: "Shogun Page Builder",
        desc: "Builds clear, prominent CTAs. Mobile-first design with countdown timers. Great for product pages and promotions.",
        link: "https://apps.shopify.com/shogun"
      }
    ],
    Wix: [
      {
        name: "Built-in Editor",
        desc: "Drag-and-drop for clear CTAs. Strip and button elements with hover effects. Easy to make stand-out actions."
      }
    ],
    Squarespace: [
      {
        name: "Fluid Engine",
        desc: "Native CTA design tools. Flexible button styling and placement. Strong visual hierarchy options."
      }
    ],
    Joomla: [
      {
        name: "SP Page Builder",
        desc: "Builds prominent CTAs. Advanced button modules with animations. Good for landing pages.",
        link: "https://extensions.joomla.org/extension/sp-page-builder/"
      }
    ],
    Drupal: [
      {
        name: "Layout Builder",
        desc: "Creates clear CTAs. Block-based placement with styling options. Flexible for complex layouts.",
        link: "https://www.drupal.org/project/layout_builder"
      }
    ]
  },
  "Breadcrumb navigation (on deep pages)": {
    WordPress: [
      {
        name: "Yoast SEO",
        desc: "Built-in breadcrumb generation. Customizable separator and prefix. Automatically appears on posts, pages, categories.",
        link: "https://wordpress.org/plugins/wordpress-seo/",
        homeLink: "https://yoast.com/wordpress/plugins/seo/"
      },
      {
        name: "Breadcrumb NavXT",
        desc: "Dedicated breadcrumb plugin. Highly customizable trails and styling. Works with custom post types.",
        link: "https://wordpress.org/plugins/breadcrumb-navxt/",
        homeLink: "https://mtekk.us/"
      }
    ],
    Shopify: [
      {
        name: "Yoast SEO for Shopify",
        desc: "Adds breadcrumb navigation. Clean, SEO-friendly trails. Integrates with collections and products.",
        link: "https://apps.shopify.com/yoast-seo"
      }
    ],
    Wix: [
      {
        name: "Built-in Breadcrumbs",
        desc: "Native breadcrumb support. Automatically generated for blog and store pages. Simple and clean design."
      }
    ],
    Squarespace: [
      {
        name: "Built-in Breadcrumbs",
        desc: "Native breadcrumb tools. Appears on blog posts and categories. Customizable styling options."
      }
    ],
    Joomla: [
      {
        name: "Breadcrumb Module",
        desc: "Adds breadcrumbs. Flexible module positions and styling. Works with menu structure.",
        link: "https://extensions.joomla.org/extension/breadcrumb/"
      }
    ],
    Drupal: [
      {
        name: "Breadcrumb",
        desc: "Generates breadcrumbs. Integrates with menu and taxonomy. Customizable separators.",
        link: "https://www.drupal.org/project/breadcrumb"
      }
    ]
  },
  "Served over HTTPS / No mixed content": {
    WordPress: [
      {
        name: "Really Simple SSL",
        desc: "Forces HTTPS and fixes mixed content automatically. Scans and updates all URLs. Includes HSTS preload option.",
        link: "https://wordpress.org/plugins/really-simple-ssl/",
        homeLink: "https://really-simple-ssl.com/"
      },
      {
        name: "SSL Insecure Content Fixer",
        desc: "Rewrites mixed content to HTTPS. Handles external resources and iframes. Lightweight and focused.",
        link: "https://wordpress.org/plugins/ssl-insecure-content-fixer/"
      }
    ],
    Shopify: [
      {
        name: "Built-in HTTPS",
        desc: "Native HTTPS & mixed content handling. Automatic SSL certificate. No extra configuration needed."
      }
    ],
    Wix: [
      {
        name: "Built-in SSL",
        desc: "Native HTTPS and mixed content protection. Free SSL certificate included. Automatic updates."
      }
    ],
    Squarespace: [
      {
        name: "Built-in SSL",
        desc: "Native HTTPS and mixed content protection. Automatic SSL provisioning. Reliable for all plans."
      }
    ],
    Joomla: [
      {
        name: "Force HTTPS",
        desc: "Forces HTTPS and helps with mixed content. Simple configuration. Good for older sites.",
        link: "https://extensions.joomla.org/extension/force-https/"
      }
    ],
    Drupal: [
      {
        name: "Secure Pages",
        desc: "Forces HTTPS and handles mixed content. Per-page control. Integrates with core security.",
        link: "https://www.drupal.org/project/secure_pages"
      }
    ]
  }
};


function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous content and show container
  container.innerHTML = '';
  container.classList.remove('hidden');

  // Filter to only metrics that actually exist in pluginData
  const supportedMetrics = failedMetrics.filter(m => 
    pluginData.hasOwnProperty(m.name) && Object.keys(pluginData[m.name]).length > 0
  );

  if (supportedMetrics.length === 0) {
    container.innerHTML = `
      <div class="mt-20 text-center max-w-5xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-6">Excellent!</h2>
        <p class="text-xl text-gray-400">No critical issues requiring plugin recommendations at this time.</p>
        <p class="text-gray-500 mt-4">Keep up the great work — your site is in solid shape.</p>
      </div>
    `;
    return;
  }

  // Use only supported metrics for rendering
  container.innerHTML = `
    <div class="mt-20 max-w-5xl mx-auto px-4">
      <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
        Recommended Plugin Solutions
      </h2>
      <p class="text-center text-lg md:text-xl text-gray-400 dark:text-gray-200 max-w-3xl mx-auto mb-12">
        ${supportedMetrics.length} critical area${supportedMetrics.length > 1 ? 's need' : ' needs'} improvement.<br>
        Check your theme or template for functionality first. Select your platform below to see the best free/freemium tools that fix it instantly.
      </p>
      <div class="space-y-8">
        ${supportedMetrics.map(m => {
          const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
          const g = m.grade;
          const cmsOptions = Object.keys(pluginData[m.name] || {});
          return `
            <details class="group bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <summary class="flex items-center justify-between p-8 cursor-pointer list-none">
                <h3 class="text-2xl md:text-3xl font-bold ${g.color}">
                  ${g.emoji} ${m.name}
                </h3>
                <svg class="w-9 h-9 text-orange-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <div class="px-4 pb-10 border-t border-white/10">
                ${cmsOptions.length > 0 ? `
                  <div class="max-w-md mx-auto my-10">
                    <label for="cms-select-${metricId}" class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Select your platform
                    </label>
                    <select id="cms-select-${metricId}" class="w-full px-6 py-4 text-lg rounded-2xl bg-white/90 dark:bg-gray-800/90 border-2 border-orange-400 dark:border-orange-600 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 outline-none transition">
                      <option value="">Choose your platform...</option>
                      ${cmsOptions.map(cms => `<option value="${cms}">${cms}</option>`).join('')}
                    </select>
                  </div>
                  <div id="plugins-${metricId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden"></div>
                ` : `
                  <div class="text-center py-12 px-6">
                    <p class="text-gray-400 text-lg">This area is usually handled natively by your platform or requires a manual code fix.</p>
                    <p class="text-gray-500 text-sm mt-3">No plugin recommendations available for this specific issue yet.</p>
                  </div>
                `}
              </div>
            </details>
          `;
        }).join('')}
      </div>
      <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-16">
        All recommendations are current, free or freemium, and trusted by millions of sites.
      </p>
    </div>
  `;

  // Attach event listeners after DOM is injected
  supportedMetrics.forEach(m => {
    const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
    const select = document.getElementById(`cms-select-${metricId}`);
    const pluginsList = document.getElementById(`plugins-${metricId}`);
    
    if (!select || !pluginsList) return;

    select.addEventListener('change', () => {
      const cms = select.value;
      pluginsList.innerHTML = '';
      pluginsList.classList.add('hidden');

      if (!cms || !pluginData[m.name]?.[cms]) return;

      pluginData[m.name][cms].forEach(plugin => {
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur rounded-2xl p-4 border border-white/10 hover:border-orange-400/50 transition-all duration-300';
        card.innerHTML = `
          <h4 class="text-xl font-bold text-orange-500 mb-3">${plugin.name}</h4>
          <p class="text-gray-400 dark:text-gray-200 text-sm leading-relaxed mb-6">${plugin.desc}</p>
          <div class="flex flex-wrap gap-3">
            ${plugin.link ? `<a href="${plugin.link}" target="_blank" rel="noopener" class="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition">Plugin Library</a>` : ''}
            ${plugin.homeLink ? `<a href="${plugin.homeLink}" target="_blank" rel="noopener" class="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm font-medium rounded-lg transition">Plugin Website</a>` : ''}
          </div>
        `;
        pluginsList.appendChild(card);
      });

      if (pluginsList.children.length > 0) {
        pluginsList.classList.remove('hidden');
      }
    });
  });
}

export { renderPluginSolutions };