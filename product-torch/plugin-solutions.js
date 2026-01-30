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
      { name: "Yoast SEO", desc: "Title templates, length checker, preview, focus keyword.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Advanced title optimization, AI suggestions, rich snippets.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Lightweight, fast title & meta control, dynamic variables.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Title audits, bulk edits, missing meta detection.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "SEO Manager", desc: "Title & meta templates for products, variants, collections.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Title editing with previews and guidance.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in SEO Tools", desc: "Title length recommendations & editing.", linkLibrary: "", linkWebsite: "" }]
  },
  "Meta Description Relevance": {
    WordPress: [
      { name: "Yoast SEO", desc: "Meta editor with length counter, CTA suggestions, preview.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "AI-generated meta descriptions, snippet preview.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Meta description control with dynamic variables.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Meta description optimization, bulk edits.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "Smart SEO", desc: "Meta templates for products & collections.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Meta guidance with CTA suggestions.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Meta editing with length limits.", linkLibrary: "", linkWebsite: "" }]
  },
  "Heading Structure (H1–H6)": {
    WordPress: [
      { name: "Yoast SEO", desc: "Heading analysis in readability & SEO checks.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Content AI suggests heading improvements & structure.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Heading outline & hierarchy validation.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "Heading structure audit & suggestions.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Plug in SEO", desc: "Content & heading issue detection.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" }
    ],
    Wix: [{ name: "Built-in Editor", desc: "Heading tags in content blocks.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Proper heading implementation.", linkLibrary: "", linkWebsite: "" }]
  },
  "URL Structure": {
    WordPress: [
      { name: "Yoast SEO", desc: "Slug editor + permalink optimizer.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Canonical & slug control.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "Permalink Manager Lite", desc: "Advanced URL editing & redirects.", linkLibrary: "https://wordpress.org/plugins/permalink-manager/", linkWebsite: "https://permalinkmanager.pro/" }
    ],
    Shopify: [
      { name: "Smart SEO", desc: "URL cleanup & optimization.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" },
      { name: "SEO Manager", desc: "URL templates & editing.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "URL slug editing.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Clean URL management.", linkLibrary: "", linkWebsite: "" }]
  },
  "Keyword Optimization": {
    WordPress: [
      { name: "Yoast SEO", desc: "Keyword density & placement analysis.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Keyword optimizer tool & suggestions.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "Focus keyword tracking & optimization.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "Keyword suggestions & density.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Plug in SEO", desc: "Keyword issue detection.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" }
    ],
    Wix: [{ name: "Built-in SEO Wiz", desc: "Keyword guidance.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Keyword integration tips.", linkLibrary: "", linkWebsite: "" }]
  },
  "Mobile-Friendliness": {
    WordPress: [
      { name: "AMP for WP", desc: "Mobile AMP pages + responsive fixes.", linkLibrary: "https://wordpress.org/plugins/accelerated-mobile-pages/", linkWebsite: "https://ampforwp.com/" },
      { name: "WPtouch Mobile Plugin", desc: "Mobile theme switcher.", linkLibrary: "https://wordpress.org/plugins/wptouch/", linkWebsite: "https://wptouch.com/" },
      { name: "Jetpack", desc: "Mobile theme & speed features.", linkLibrary: "https://wordpress.org/plugins/jetpack/", linkWebsite: "https://jetpack.com/" }
    ],
    Shopify: [
      { name: "Ampify", desc: "AMP pages for mobile speed.", linkLibrary: "https://apps.shopify.com/ampify-me", linkWebsite: "https://ampify.io/" },
      { name: "AMP by Shop Sheriff", desc: "AMP conversion & speed.", linkLibrary: "https://apps.shopify.com/amp-by-shop-sheriff", linkWebsite: "https://shopsheriff.com/" }
    ],
    Wix: [{ name: "Built-in Mobile Editor", desc: "Responsive design tools.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Responsive", desc: "Automatic mobile optimization.", linkLibrary: "", linkWebsite: "" }]
  },
  "HTTPS Implementation": {
    WordPress: [
      { name: "Really Simple SSL", desc: "Force HTTPS & fix mixed content.", linkLibrary: "https://wordpress.org/plugins/really-simple-ssl/", linkWebsite: "https://really-simple-ssl.com/" },
      { name: "WP Encryption", desc: "Free SSL + HTTPS redirect.", linkLibrary: "https://wordpress.org/plugins/wp-letsencrypt-ssl/", linkWebsite: "https://wpencryption.com/" },
      { name: "SSL Zen", desc: "Free Let's Encrypt SSL setup.", linkLibrary: "https://wordpress.org/plugins/ssl-zen/", linkWebsite: "https://sslzen.com/" }
    ],
    Shopify: [{ name: "Built-in", desc: "Native HTTPS enforced.", linkLibrary: "", linkWebsite: "" }],
    Wix: [{ name: "Built-in SSL", desc: "Automatic HTTPS.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in SSL", desc: "Free SSL certificates.", linkLibrary: "", linkWebsite: "" }]
  },
  "Canonical Tags": {
    WordPress: [
      { name: "Yoast SEO", desc: "Automatic canonical tags.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Canonical management.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Canonical control per page.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Canonical issue detection.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "Smart SEO", desc: "Canonical & duplicate handling.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO", desc: "Canonical handling.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Automatic canonicals.", linkLibrary: "", linkWebsite: "" }]
  },
  "Meta Robots Directives": {
    WordPress: [
      { name: "Yoast SEO", desc: "Noindex/nofollow controls per page.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Robots meta management.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "SEOPress", desc: "Advanced robots.txt & meta controls.", linkLibrary: "https://wordpress.org/plugins/seopress/", linkWebsite: "https://www.seopress.org/" }
    ],
    Shopify: [
      { name: "Plug in SEO", desc: "Robots meta management.", linkLibrary: "https://apps.shopify.com/plug-in-seo", linkWebsite: "https://www.plugseo.app/" },
      { name: "SEO Manager", desc: "Robots & indexing controls.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in SEO", desc: "Index controls.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Robots settings.", linkLibrary: "", linkWebsite: "" }]
  },
  "Sitemap Inclusion Hints": {
    WordPress: [
      { name: "Yoast SEO", desc: "Auto XML sitemap generation.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Dynamic sitemap with inclusion control.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "XML Sitemap & Google News", desc: "Advanced sitemap customization.", linkLibrary: "https://wordpress.org/plugins/xml-sitemap-google-news/", linkWebsite: "https://www.xml-sitemaps.com/" }
    ],
    Shopify: [
      { name: "XML Sitemap", desc: "Automatic product sitemaps.", linkLibrary: "https://apps.shopify.com/xml-sitemap", linkWebsite: "" },
      { name: "Smart SEO", desc: "Sitemap & inclusion hints.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Sitemap", desc: "Automatic generation.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Sitemap", desc: "Native XML sitemaps.", linkLibrary: "", linkWebsite: "" }]
  },
  "Product Description Quality": {
    WordPress: [
      { name: "Yoast SEO", desc: "Readability & content analysis.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Rank Math", desc: "Content AI & description suggestions.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "Content scoring & optimization.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "SEO Booster", desc: "Description length & keyword tips.", linkLibrary: "https://apps.shopify.com/seo-booster", linkWebsite: "https://seobooster.app/" },
      { name: "Smart SEO", desc: "Description optimization.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Editor", desc: "Rich text for descriptions.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Blocks", desc: "Structured descriptions.", linkLibrary: "", linkWebsite: "" }]
  },
  "Image Optimization": {
    WordPress: [
      { name: "Smush", desc: "Compress + lazy load + WebP + alt suggestions.", linkLibrary: "https://wordpress.org/plugins/wp-smushit/", linkWebsite: "https://wpmudev.com/project/wp-smush-pro/" },
      { name: "EWWW Image Optimizer", desc: "Bulk compress, WebP/AVIF, alt tools.", linkLibrary: "https://wordpress.org/plugins/ewww-image-optimizer/", linkWebsite: "https://ewww.io/" },
      { name: "Imagify", desc: "Smart compression + next-gen formats.", linkLibrary: "https://wordpress.org/plugins/imagify-webp-bulk-optimizer/", linkWebsite: "https://imagify.io/" }
    ],
    Shopify: [
      { name: "TinyIMG", desc: "AI alt text + compression + WebP.", linkLibrary: "https://apps.shopify.com/tinyimg", linkWebsite: "https://tiny-img.com/" },
      { name: "Crush.pics", desc: "Auto compress + SEO filenames/alt.", linkLibrary: "https://apps.shopify.com/crush-pics-image-optimizer", linkWebsite: "https://crush.pics/" }
    ],
    Wix: [{ name: "Built-in Optimizer", desc: "Auto-compress + manual alt text.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Tools", desc: "Native compression + alt fields.", linkLibrary: "", linkWebsite: "" }]
  },
  "Video Embed Quality": {
    WordPress: [
      { name: "EmbedPress", desc: "Optimized embeds with captions.", linkLibrary: "https://wordpress.org/plugins/embedpress/", linkWebsite: "https://wpdeveloper.com/plugins/embedpress/" },
      { name: "Video Embed & Thumbnail Generator", desc: "Lazy video + thumbnails + captions.", linkLibrary: "https://wordpress.org/plugins/video-embed-thumbnail-generator/", linkWebsite: "https://www.farhatullah.com/" },
      { name: "Lazy Load – Optimize Images", desc: "Lazy video loading support.", linkLibrary: "https://wordpress.org/plugins/rocket-lazy-load/", linkWebsite: "https://wp-rocket.me/" }
    ],
    Shopify: [
      { name: "Video Embed Optimizer", desc: "Lazy video loading.", linkLibrary: "https://apps.shopify.com/video-embed-optimizer", linkWebsite: "" },
      { name: "Vitals", desc: "Video performance & lazy loading.", linkLibrary: "https://apps.shopify.com/vitals", linkWebsite: "https://vitals.co/" }
    ],
    Wix: [{ name: "Built-in Video", desc: "Caption support.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Video Blocks", desc: "Embed with captions.", linkLibrary: "", linkWebsite: "" }]
  },
  "User-Generated Content (UGC)": {
    WordPress: [
      { name: "Yotpo", desc: "Reviews, photos, videos with schema.", linkLibrary: "https://wordpress.org/plugins/yotpo-social-reviews/", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Product reviews with UGC & schema.", linkLibrary: "https://wordpress.org/plugins/judge-me-product-reviews-woocommerce/", linkWebsite: "https://judge.me/" },
      { name: "WP Review", desc: "Review schema & aggregation.", linkLibrary: "https://wordpress.org/plugins/wp-review/", linkWebsite: "https://mythemeshop.com/plugins/wp-review-pro/" }
    ],
    Shopify: [
      { name: "Yotpo", desc: "UGC and reviews with schema.", linkLibrary: "https://apps.shopify.com/yotpo-social-reviews", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Photo/video reviews & schema.", linkLibrary: "https://apps.shopify.com/judgeme", linkWebsite: "https://judge.me/" }
    ],
    Wix: [{ name: "Wix Reviews", desc: "Built-in UGC.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Comments", desc: "UGC support.", linkLibrary: "", linkWebsite: "" }]
  },
  "Internal Linking": {
    WordPress: [
      { name: "Yoast SEO", desc: "Internal link suggestions.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Link Whisper", desc: "AI-powered internal linking.", linkLibrary: "https://wordpress.org/plugins/link-whisper/", linkWebsite: "https://linkwhisper.com/" },
      { name: "Internal Link Juicer", desc: "Automated internal linking.", linkLibrary: "https://wordpress.org/plugins/internal-link-juicer/", linkWebsite: "https://internallinkjuicer.com/" }
    ],
    Shopify: [
      { name: "Smart SEO", desc: "Link optimization.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" },
      { name: "SEO Manager", desc: "Internal link suggestions.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Links", desc: "Anchor links.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Internal linking.", linkLibrary: "", linkWebsite: "" }]
  },
  "Breadcrumb Navigation": {
    WordPress: [
      { name: "Yoast SEO", desc: "Breadcrumb schema.", linkLibrary: "https://wordpress.org/plugins/wordpress-seo/", linkWebsite: "https://yoast.com/wordpress/plugins/seo/" },
      { name: "Breadcrumb NavXT", desc: "Custom breadcrumbs.", linkLibrary: "https://wordpress.org/plugins/breadcrumb-navxt/", linkWebsite: "https://mtekk.us/code/breadcrumb-navxt/" },
      { name: "Rank Math", desc: "Breadcrumb support.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" }
    ],
    Shopify: [
      { name: "Breadcrumb App", desc: "Custom breadcrumbs.", linkLibrary: "https://apps.shopify.com/breadcrumbs", linkWebsite: "" },
      { name: "Smart SEO", desc: "Breadcrumb markup.", linkLibrary: "https://apps.shopify.com/smart-seo", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Breadcrumbs", desc: "Native support.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Navigation", desc: "Breadcrumb tools.", linkLibrary: "", linkWebsite: "" }]
  },
  "Product Schema Markup": {
    WordPress: [
      { name: "Schema & Structured Data for WP", desc: "Best free option – full Product schema, rich snippets.", linkLibrary: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", linkWebsite: "https://wpschema.com/" },
      { name: "Rank Math", desc: "Built-in product schema, offers, reviews.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "Schema generator for products.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus", desc: "Advanced product schema.", linkLibrary: "https://apps.shopify.com/schema-plus-for-seo", linkWebsite: "" },
      { name: "SEO Manager", desc: "Product schema & rich results.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in Structured Data", desc: "Product markup.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Schema", desc: "Native support.", linkLibrary: "", linkWebsite: "" }]
  },
  "Price & Availability Markup": {
    WordPress: [
      { name: "Schema & Structured Data for WP", desc: "Offer & price schema support.", linkLibrary: "https://wordpress.org/plugins/schema-and-structured-data-for-wp/", linkWebsite: "https://wpschema.com/" },
      { name: "Rank Math", desc: "Price & availability in schema.", linkLibrary: "https://wordpress.org/plugins/seo-by-rank-math/", linkWebsite: "https://rankmath.com/" },
      { name: "AIOSEO", desc: "Offer markup for products.", linkLibrary: "https://wordpress.org/plugins/aioseo/", linkWebsite: "https://aioseo.com/" }
    ],
    Shopify: [
      { name: "Schema Plus", desc: "Price markup.", linkLibrary: "https://apps.shopify.com/schema-plus-for-seo", linkWebsite: "" },
      { name: "SEO Manager", desc: "Price & stock schema.", linkLibrary: "https://apps.shopify.com/seo-manager", linkWebsite: "https://bloggle.app/" }
    ],
    Wix: [{ name: "Built-in", desc: "Price schema.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in", desc: "Availability markup.", linkLibrary: "", linkWebsite: "" }]
  },
  "Review Schema & Aggregation": {
    WordPress: [
      { name: "Yotpo", desc: "Review schema & UGC.", linkLibrary: "https://wordpress.org/plugins/yotpo-social-reviews/", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Aggregate rating schema.", linkLibrary: "https://wordpress.org/plugins/judge-me-product-reviews-woocommerce/", linkWebsite: "https://judge.me/" },
      { name: "WP Review", desc: "Review schema & aggregation.", linkLibrary: "https://wordpress.org/plugins/wp-review/", linkWebsite: "https://mythemeshop.com/plugins/wp-review-pro/" }
    ],
    Shopify: [
      { name: "Yotpo", desc: "Review schema.", linkLibrary: "https://apps.shopify.com/yotpo-social-reviews", linkWebsite: "https://www.yotpo.com/" },
      { name: "Judge.me", desc: "Photo/video reviews & schema.", linkLibrary: "https://apps.shopify.com/judgeme", linkWebsite: "https://judge.me/" }
    ],
    Wix: [{ name: "Built-in Reviews", desc: "Schema support.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in", desc: "Review markup.", linkLibrary: "", linkWebsite: "" }]
  },
  "Variant Handling": {
    WordPress: [
      { name: "WooCommerce", desc: "Built-in variant management.", linkLibrary: "https://wordpress.org/plugins/woocommerce/", linkWebsite: "https://woocommerce.com/" },
      { name: "YITH WooCommerce Product Add-ons", desc: "Advanced variant & option handling.", linkLibrary: "https://wordpress.org/plugins/yith-woocommerce-product-add-ons/", linkWebsite: "https://yithemes.com/" },
      { name: "Variation Swatches for WooCommerce", desc: "Visual variant swatches.", linkLibrary: "https://wordpress.org/plugins/variation-swatches-for-woocommerce/", linkWebsite: "https://getwooplugins.com/" }
    ],
    Shopify: [
      { name: "Built-in Variants", desc: "Native handling.", linkLibrary: "", linkWebsite: "https://help.shopify.com/" },
      { name: "Infinite Options", desc: "Advanced variant options.", linkLibrary: "https://apps.shopify.com/custom-options", linkWebsite: "https://infiniteoptions.com/" }
    ],
    Wix: [{ name: "Built-in Store", desc: "Variant tools.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Commerce", desc: "Variants.", linkLibrary: "", linkWebsite: "" }]
  },
  "Social Sharing Integration": {
    WordPress: [
      { name: "Monarch", desc: "Social sharing with OG tags.", linkLibrary: "https://www.elegantthemes.com/plugins/monarch/", linkWebsite: "https://www.elegantthemes.com/plugins/monarch/" },
      { name: "AddToAny Share Buttons", desc: "Sharing with Open Graph.", linkLibrary: "https://wordpress.org/plugins/add-to-any/", linkWebsite: "https://www.addtoany.com/" },
      { name: "Social Warfare", desc: "Beautiful sharing & OG control.", linkLibrary: "https://wordpress.org/plugins/social-warfare/", linkWebsite: "https://warfareplugins.com/" }
    ],
    Shopify: [
      { name: "Social Share Buttons", desc: "OG integration.", linkLibrary: "https://apps.shopify.com/social-share-buttons", linkWebsite: "" },
      { name: "AddToAny Share", desc: "Universal sharing with meta tags.", linkLibrary: "https://apps.shopify.com/addtoany-share-buttons", linkWebsite: "https://www.addtoany.com/" }
    ],
    Wix: [{ name: "Built-in Social", desc: "Sharing tools.", linkLibrary: "", linkWebsite: "" }],
    Squarespace: [{ name: "Built-in Sharing", desc: "Social buttons.", linkLibrary: "", linkWebsite: "" }]
  }
};

function renderPluginSolutions(failedMetrics, containerId = 'plugin-solutions-section') {
  if (failedMetrics.length === 0) {
    console.log('Plugin Solutions: No low/average metrics to show');
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
  section.innerHTML = `
    <h2 class="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-8">
      Plugin Solutions for Product SEO
    </h2>
    <p class="text-center text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
      ${failedMetrics.length} issue${failedMetrics.length > 1 ? 's need' : ' needs'} attention.
      Check your theme or template first — many modern themes already include some of these optimizations.
      Expand any panel below to see top free/freemium plugins/apps that can help fix it.
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
            <div class="px-2 md:px-8 pb-8 md:pb-10 border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-md mx-auto my-8">
                <select id="cms-select-${metricId}" class="w-full px-6 py-4 text-lg rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-4 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition">
                  <option value="">Select your platform / CMS...</option>
                  ${Object.keys(pluginData[m.name] || {}).map(cms =>
                    `<option value="${cms}">${cms}</option>`
                  ).join('')}
                </select>
              </div>
              <div id="plugins-${metricId}" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
                <!-- Plugins will be injected here -->
              </div>
            </div>
          </details>
        `;
      }).join('')}
    </div>
    <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-12">
      These popular free/freemium plugins and apps can significantly improve these areas.
      Always test on a staging environment first and check for recent reviews/updates.
    </p>
  `;
  container.appendChild(section);

  // Attach event listeners after DOM insertion
  setTimeout(() => {
    failedMetrics.forEach(m => {
      const metricId = m.name.replace(/\s+/g, '-').toLowerCase();
      const select = document.getElementById(`cms-select-${metricId}`);
      const pluginsList = document.getElementById(`plugins-${metricId}`);
      if (!select || !pluginsList) {
        console.warn(`Could not find select/plugins for metric: ${m.name} (id: ${metricId})`);
        return;
      }
      select.addEventListener('change', (e) => {
        const selected = e.target.value;
        pluginsList.innerHTML = '';
        pluginsList.classList.add('hidden');
        if (!selected || !pluginData[m.name]?.[selected]) {
          console.log(`No plugins found for ${m.name} → ${selected}`);
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
      ${plugin.linkLibrary ? `
        <a href="${plugin.linkLibrary}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow hover:shadow-md transition">
          Plugin Library
        </a>
      ` : ''}
      ${plugin.linkWebsite ? `
        <a href="${plugin.linkWebsite}" target="_blank" rel="noopener" class="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-medium rounded-lg shadow hover:shadow-md transition">
          Plugin Website
        </a>
      ` : ''}
    </div>
  </div>
`;
          pluginsList.appendChild(card);
        });
        if (pluginsList.children.length > 0) {
          pluginsList.classList.remove('hidden');
        }
      });
    });
  }, 0);
}

export { renderPluginSolutions };