const pluginData = {
  "Schema Markup": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium with schema support, real-time previews, focus keyword optimization.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Freemium advanced schema types, easy generator, rich snippets.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "AIOSEO", desc: "Freemium guided schema generator, supports FAQ/Product/Article.", link: "https://wordpress.org/plugins/all-in-one-seo-pack/" }
    ],
    Shopify: [
      { name: "Webrex SEO Schema & JSON-LD", desc: "Free schema markup, rich snippets, fixes Google errors.", link: "https://apps.shopify.com/webrex-seo-schema-jsonld" },
      { name: "Schema Plus for SEO", desc: "Freemium auto JSON-LD schema, product markup.", link: "https://apps.shopify.com/schema-plus" },
      { name: "JSON-LD for SEO", desc: "Freemium automatic schema for rich results.", link: "https://apps.shopify.com/json-ld-for-seo" }
    ],
    Wix: [
      { name: "JSON LD Schema for AI LLM SEO", desc: "Freemium schema templates for Organization, Product, etc.", link: "https://www.wix.com/app-market/web-solution/json-ld-schema" },
      { name: "Built-in Structured Data", desc: "Free Wix auto-adds basic schema." }
    ],
    Squarespace: [
      { name: "TinyIMG", desc: "Freemium schema generation with AI, but mainly for images/SEO." },
      { name: "Built-in Markup", desc: "Free auto schema for pages/products." }
    ],
    Joomla: [
      { name: "Google Structured Data", desc: "Free schema markup, rich snippets.", link: "https://extensions.joomla.org/extension/google-structured-data/" },
      { name: "EFSEO", desc: "Freemium handles meta and structured data.", link: "https://extensions.joomla.org/extension/efseo-easy-frontend-seo/" }
    ],
    Drupal: [
      { name: "Schema.org Metatag", desc: "Free comprehensive schema type support.", link: "https://www.drupal.org/project/schema_metatag" },
      { name: "Metatag", desc: "Free base for structured data extensions." }
    ]
  },
  "Optimized Title Tag": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium AI-generated titles, previews, focus keyphrase.", link: "https://wordpress.org/plugins/wordpress-seo/" },
      { name: "Rank Math", desc: "Freemium bulk editing, dynamic variables.", link: "https://wordpress.org/plugins/seo-by-rank-math/" },
      { name: "AIOSEO", desc: "Freemium TruSEO score, title/meta editor." }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Freemium checks/fixes titles across store." },
      { name: "AVADA SEO Suite", desc: "Freemium auto-optimizes titles/meta." }
    ],
    Wix: [
      { name: "SEO Wiz", desc: "Free guides title optimization." }
    ],
    Squarespace: [
      { name: "Built-in Page Settings", desc: "Free custom SEO title fields." }
    ],
    Joomla: [
      { name: "EFSEO", desc: "Freemium handles title tags." },
      { name: "sh404SEF", desc: "Freemium SEO controls including titles." }
    ],
    Drupal: [
      { name: "Metatag", desc: "Free meta tag management including titles." }
    ]
  },
  "Compelling Meta Description": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium previews and suggestions." },
      { name: "Rank Math", desc: "Freemium dynamic meta descriptions." },
      { name: "AIOSEO", desc: "Freemium meta description editor." }
    ],
    // Similar for other CMS, reuse where applicable
  },
  "Proper Heading Hierarchy": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium analyzes heading structure." },
      { name: "Rank Math", desc: "Freemium content editor checks." }
    ],
    Shopify: [
      { name: "AVADA SEO Suite", desc: "Freemium on-page analysis." }
    ]
    // Limited for others; many built-in or manual
  },
  "Image Optimization & Alt Text": {
    WordPress: [
      { name: "Smush", desc: "Freemium compress, WebP, lazy load, bulk alt suggestions.", link: "https://wordpress.org/plugins/wp-smushit/" },
      { name: "Imagify", desc: "Freemium bulk optimization, next-gen formats.", link: "https://wordpress.org/plugins/imagify-image-optimizer/" },
      { name: "ShortPixel", desc: "Freemium compression, AVIF/WebP, auto alt." }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "Freemium auto compression, alt text optimization." },
      { name: "Crush.pics", desc: "Freemium auto image compression." }
    ],
    Wix: [
      { name: "Built-in Optimizer", desc: "Free auto compression; manual alt." }
    ],
    Squarespace: [
      { name: "Built-in Tools", desc: "Free auto optimization." }
    ],
    Joomla: [
      { name: "ImageRecycle", desc: "Freemium image compression." }
    ],
    Drupal: [
      { name: "Image Optimize", desc: "Free alt text and optimization." }
    ]
  },
  "Strategic Internal & External Linking": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium internal linking suggestions." },
      { name: "Rank Math", desc: "Freemium link analysis." }
    ],
    Shopify: [
      { name: "Selleasy", desc: "Freemium internal linking automation." }
    ],
    Wix: [
      { name: "Built-in Links", desc: "Free linking tools." }
    ]
  },
  "Mobile-Friendly & Responsive Design": {
    WordPress: [
      { name: "AMP", desc: "Freemium mobile-optimized pages." }
    ],
    Shopify: [
      { name: "Booster SEO", desc: "Freemium mobile speed apps." }
    ],
    Wix: [
      { name: "Built-in Responsive", desc: "Free responsive design." }
    ]
  },
  "Core Web Vitals / Page Speed Optimization": {
    WordPress: [
      { name: "Autoptimize", desc: "Free minify, combine CSS/JS, critical CSS.", link: "https://wordpress.org/plugins/autoptimize/" },
      { name: "WP Super Cache", desc: "Free caching for speed." },
      { name: "Perfmatters", desc: "Freemium lightweight optimizer." }
    ],
    Shopify: [
      { name: "Booster SEO", desc: "Freemium speed + CWV optimization." }
    ]
  },
  "HTTPS Enforcement": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Freemium HTTPS redirect, mixed content fix." }
    ],
    Shopify: [
      { name: "Built-in HTTPS", desc: "Free Shopify enforces HTTPS." }
    ]
  },
  "Avoid Keyword Stuffing": {
    WordPress: [
      { name: "Yoast SEO", desc: "Freemium keyword density checks." },
      { name: "Rank Math", desc: "Freemium optimization without stuffing." }
    ],
    Shopify: [
      { name: "SearchPie", desc: "Freemium keyword optimization." }
    ]
  }
};